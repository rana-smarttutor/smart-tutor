"use strict";

/*
 * SmartIQ Government Exam bulk question generator.
 *
 * Uses the existing Gemini generator for:
 * - AI question generation
 * - Independent AI answer checks
 * - Duplicate detection
 * - MongoDB insertion
 *
 * Only processes exams, subjects and topics already present
 * in lib/government-exam-topics.ts.
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const ts = require("typescript");
const { loadEnvConfig } = require("@next/env");
const { MongoClient } = require("mongodb");

loadEnvConfig(process.cwd());

const args = process.argv.slice(2);

const get = (key) =>
  args
    .find((a) => a.startsWith(`--${key}=`))
    ?.slice(key.length + 3);

const has = (key) => args.includes(`--${key}`);

const assert = (ok, message) => {
  if (!ok) throw new Error(message);
};

function readCatalog() {
  const filename = path.resolve(
    "lib/government-exam-topics.ts"
  );

  assert(
    fs.existsSync(filename),
    `Missing ${filename}`
  );

  const js = ts.transpileModule(
    fs.readFileSync(filename, "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }
  ).outputText;

  const module = { exports: {} };

  new Function(
    "exports",
    "module",
    "require",
    js
  )(module.exports, module, require);

  return module.exports.governmentExamSyllabuses;
}

async function main() {
  const examFilter = get("exam");
  const subjectFilter = get("subject");
  const topicFilter = get("topic");

  const rawLevels = get("levels") ?? "1-10";
  const rawLimit = get("limit") ?? "1";

  const target = Number(get("target") ?? "50");

  const run = has("run");
  const publish = has("publish");

  assert(
    examFilter,
    "Use --exam=ssc-cgl or --exam=all."
  );

  assert(
    Number.isInteger(target) &&
      target >= 1 &&
      target <= 50,
    "--target must be between 1 and 50."
  );

  assert(
    !publish || run,
    "--publish requires --run."
  );

  assert(
    rawLimit === "all" ||
      (
        /^[1-9]\d*$/.test(rawLimit) &&
        Number.isSafeInteger(Number(rawLimit))
      ),
    "--limit must be a positive integer or all."
  );

  const limit =
    rawLimit === "all"
      ? Infinity
      : Number(rawLimit);

  const levels =
    rawLevels === "1-10"
      ? Array.from(
          { length: 10 },
          (_, i) => i + 1
        )
      : rawLevels.split(",").map(Number);

  assert(
    levels.length > 0 &&
      levels.every(
        (v) =>
          Number.isInteger(v) &&
          v >= 1 &&
          v <= 10
      ),
    "Use --levels=1-10 or --levels=1,2,3."
  );

  assert(
    new Set(levels).size === levels.length,
    "Repeated level in --levels."
  );

  const catalog = readCatalog();

  const selected =
    examFilter === "all"
      ? Object.values(catalog).filter(Boolean)
      : [catalog[examFilter]].filter(Boolean);

  assert(
    selected.length > 0,
    `No topic catalog found for '${examFilter}'.`
  );

  const jobs = [];

  for (const syllabus of selected) {
    assert(
      Number.isInteger(syllabus.syllabusYear),
      `Missing syllabus year: ${syllabus.exam}`
    );

    for (const section of syllabus.subjects) {
      if (
        subjectFilter &&
        section.subject !== subjectFilter
      ) {
        continue;
      }

      for (const topic of section.topics) {
        if (
          topicFilter &&
          topic.id !== topicFilter
        ) {
          continue;
        }

        for (const level of levels) {
          jobs.push({
            exam: syllabus.exam,
            subject: section.subject,
            topic: topic.id,
            title: topic.title,
            level,
          });
        }
      }
    }
  }

  assert(
    jobs.length > 0,
    "No matching exam/subject/topic/levels found."
  );

  const chosen = jobs.slice(0, limit);

  console.log(
    `Matched ${jobs.length} topic-level jobs.`
  );

  console.log(
    `Selected ${chosen.length} jobs.`
  );

  console.log(
    `Target: ${target} questions per topic per level.`
  );

  for (const [i, job] of chosen.entries()) {
    if (i >= 12) {
      console.log(
        `... and ${chosen.length - 12} more jobs.`
      );
      break;
    }

    console.log(
      `${i + 1}. ${job.exam} / ` +
      `${job.subject} / ` +
      `${job.title} / Level ${job.level}`
    );
  }

  if (!run) {
    console.log(
      "DRY RUN: Nothing generated."
    );

    console.log(
      "Add --run to execute."
    );

    console.log(
      "Add --publish to make AI-checked " +
      "questions available to students."
    );

    return;
  }

  const generator = path.resolve(
    "scripts/generate-government-questions.cjs"
  );

  assert(
    fs.existsSync(generator),
    `Missing ${generator}`
  );

  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL;

  const dbName =
    get("db") ||
    process.env.MONGODB_DB_NAME ||
    process.env.MONGODB_DB ||
    process.env.MONGODB_DATABASE ||
    (
      mongoUri
        ? decodeURIComponent(
            new URL(mongoUri)
              .pathname
              .replace(/^\//, "")
          )
        : ""
    );

  assert(
    mongoUri && dbName,
    "Missing MongoDB URI or database name."
  );

  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  let completed = 0;
  let skipped = 0;

  await client.connect();

  try {
    const bank = client
      .db(dbName)
      .collection("government_question_bank");

    for (const [i, job] of chosen.entries()) {
      const status = publish
        ? "approved"
        : "pending";

      const current = await bank.countDocuments({
        exam: job.exam,
        subject: job.subject,
        topicId: job.topic,
        progressionLevel: job.level,
        status,
      });

      if (current >= target) {
        skipped++;

        console.log(
          `[${i + 1}/${chosen.length}] ` +
          `Already ${current}/${target}: ` +
          `${job.title} Level ${job.level}. Skipped.`
        );

        continue;
      }

      console.log(
        `[${i + 1}/${chosen.length}] ` +
        `Generating ${job.exam} / ` +
        `${job.subject} / ${job.title} / ` +
        `Level ${job.level}`
      );

      const childArgs = [
        generator,
        `--exam=${job.exam}`,
        `--subject=${job.subject}`,
        `--topic=${job.topic}`,
        `--level=${job.level}`,
        `--target=${target}`,
        `--db=${dbName}`,
        ...(publish ? ["--publish"] : []),
      ];

      const result = spawnSync(
        process.execPath,
        childArgs,
        {
          stdio: "inherit",
        }
      );

      if (
        result.error ||
        result.status !== 0
      ) {
        throw new Error(
          `Stopped at ${job.exam}/` +
          `${job.subject}/` +
          `${job.topic}/Level ${job.level}. ` +
          "Rerun the same command to resume. " +
          (
            result.error?.message ??
            `Exit ${result.status}`
          )
        );
      }

      completed++;
    }
  } finally {
    await client.close();
  }

  console.log(
    `DONE. Completed jobs: ${completed}. ` +
    `Already full: ${skipped}.`
  );

  if (publish) {
    console.log(
      "Published after automated AI checks; " +
      "not independently human-verified."
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});