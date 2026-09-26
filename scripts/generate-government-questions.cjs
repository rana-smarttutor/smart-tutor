"use strict";

/*
 * SmartIQ Government Exam AI question-bank generator.
 * Run locally from the smart-tutor project root; this is NOT a public API.
 *
 * Example:
 * node scripts/generate-government-questions.cjs --exam=ssc-cgl --subject="Quantitative Aptitude" --topic=percentage --level=1 --target=10 --publish
 *
 * --publish makes AI-checked questions available to students. They are NOT
 * human-verified; run a sample quality audit before wider release.
 * Without --publish, generated questions stay pending.
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const ts = require("typescript");
const { loadEnvConfig } = require("@next/env");
const { MongoClient } = require("mongodb");

loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const arg = (key) => args.find((value) => value.startsWith(`--${key}=`))?.slice(key.length + 3);
const exam = arg("exam");
const subject = arg("subject");
const topicId = arg("topic");
const level = Number(arg("level"));
const target = Number(arg("target") || "10");
const publish = args.includes("--publish");
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_QUESTION_MODEL || "gemini-3.1-flash-lite";
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const dbName =
  arg("db") ||
  process.env.MONGODB_DB_NAME ||
  process.env.MONGODB_DB ||
  process.env.MONGODB_DATABASE ||
  (mongoUri ? decodeURIComponent(new URL(mongoUri).pathname.replace(/^\//, "")) : "");

function requireValue(ok, message) {
  if (!ok) throw new Error(message);
}
function fingerprint(text) {
  return crypto.createHash("sha256")
    .update(text.trim().toLowerCase().replace(/\s+/g, " "))
    .digest("hex");
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

// Read the EXISTING local TypeScript syllabus catalog so the script cannot
// silently create a different exam/subject/topic name than the website uses.
function readCatalog() {
  const sourceFile = path.join(process.cwd(), "lib", "government-exam-topics.ts");
  requireValue(fs.existsSync(sourceFile), `Missing ${sourceFile}`);
  const source = fs.readFileSync(sourceFile, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const local = { exports: {} };
  new Function("exports", "module", "require", js)(local.exports, local, require);
  return local.exports;
}

function validateQuestion(q, knownHashes) {
  if (!q || typeof q !== "object") return "Question is not an object";
  if (typeof q.question !== "string" || q.question.trim().length < 12) return "Missing/short question";
  if (!Array.isArray(q.options) || q.options.length !== 4 ||
      !q.options.every((x) => typeof x === "string" && x.trim())) return "Expected four options";
  if (new Set(q.options.map((x) => x.trim().toLowerCase())).size !== 4) return "Repeated option";
  if (typeof q.correctAnswer !== "string" ||
      !q.options.includes(q.correctAnswer)) return "Correct answer is not an exact option";
  if (typeof q.explanation !== "string" || q.explanation.trim().length < 15) return "Missing/short explanation";
  if (knownHashes.has(fingerprint(q.question))) return "Duplicate question";
  return null;
}

async function askGemini(prompt, temperature) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        },
      }),
      signal: AbortSignal.timeout(90000),
    });
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      console.log(`Gemini HTTP ${response.status}; retrying...`);
      await sleep(2000 * attempt);
      continue;
    }
    if (!response.ok) {
      const description = (await response.text()).slice(0, 550);
      throw new Error(`Gemini HTTP ${response.status}: ${description}`);
    }
    const payload = await response.json();
    const text = (payload.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || "").join("").trim();
    requireValue(text, "Gemini returned no answer text. Check API quota/model.");
    try { return JSON.parse(text); }
    catch { throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 220)}`); }
  }
}

const difficulty = [
  "", "Basic one-step recognition; easy calculations and definitions.",
  "Core understanding and straightforward applications.",
  "Applied basics and familiar exam-style contexts.",
  "Intermediate multi-step questions.",
  "Combined concepts and closer distractors.",
  "Demanding applications with careful reasoning.",
  "Exam-standard timed-practice reasoning.",
  "Advanced multi-step and tricky but fair choices.",
  "Expert problems requiring deeper analysis.",
  "Most challenging appropriate exam-style problems.",
];

async function main() {
  requireValue(exam && subject && topicId,
    'Provide --exam=ssc-cgl --subject="Quantitative Aptitude" --topic=percentage');
  requireValue(Number.isInteger(level) && level >= 1 && level <= 10,
    "--level must be an integer from 1 to 10");
  requireValue(Number.isInteger(target) && target >= 1 && target <= 50,
    "--target must be an integer from 1 to 50");
  requireValue(apiKey, "GEMINI_API_KEY is missing from your .env");
  requireValue(mongoUri && dbName, "MongoDB URI/database missing. Supply --db=smart_tutor if needed.");

  const catalog = readCatalog();
  const syllabus = catalog.getGovernmentExamSyllabus(exam);
  requireValue(syllabus, `Exam ${exam} has no Government Mock Test syllabus catalog yet.`);
  const section = syllabus.subjects.find((entry) => entry.subject === subject);
  requireValue(section, `Subject '${subject}' is not in the ${exam} catalog.`);
  const topic = section.topics.find((entry) => entry.id === topicId);
  requireValue(topic, `Topic '${topicId}' is not in ${exam} / ${subject}.`);
  requireValue(Number.isInteger(syllabus.syllabusYear), "Catalog needs a syllabusYear.");

  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  try {
    const coll = client.db(dbName).collection("government_question_bank");
    await coll.createIndex({ id: 1 }, { unique: true, name: "government_question_unique_id" });
    await coll.createIndex(
      { exam: 1, subject: 1, topicId: 1, fingerprint: 1 },
      { unique: true, name: "government_question_unique_topic" },
    );
    await coll.createIndex(
      { exam: 1, subject: 1, topicId: 1, progressionLevel: 1, status: 1 },
      { name: "government_question_selection" },
    );

    const scope = { exam, subject, topicId, progressionLevel: level };
    const status = publish ? "approved" : "pending";
    let existingCount = await coll.countDocuments({ ...scope, status });
    console.log(`${dbName} | ${exam} / ${subject} / ${topic.title} | Level ${level}`);
    console.log(`Starting ${status}: ${existingCount}; target: ${target}`);
    if (existingCount >= target) {
      console.log("Target already met; no API call or database change.");
      return;
    }

    let created = 0, rejected = 0, attempts = 0;
    const maxAttempts = Math.ceil((target - existingCount) / 10) * 5 + 5;
    while (existingCount < target && attempts < maxAttempts) {
      attempts++;
      const allTopicQuestions = await coll.find(
        { exam, subject, topicId },
        { projection: { question: 1, fingerprint: 1, _id: 0 } },
      ).toArray();
      const known = new Set(allTopicQuestions.map((q) => q.fingerprint || fingerprint(q.question)));
      const n = Math.min(10, target - existingCount);
      console.log(`Generating ${n} questions (batch ${attempts}/${maxAttempts})...`);

      const genPrompt = `You are generating ORIGINAL practice MCQs for SmartIQ Institute.
Exam: ${syllabus.title} (ID ${exam}). Subject: ${subject}. Topic: ${topic.title} (ID ${topicId}).
Difficulty: Level ${level}/10. Guidance: ${difficulty[level]}
Generate EXACTLY ${n} distinct, accurate questions with FOUR plausible unique answer options each.
Every question MUST belong to this topic, be appropriate for this level, and have exactly ONE correct answer.
Include a self-contained explanation showing the reasoning, calculations or factual basis.
For quantitative questions carefully solve before writing the choices; no ambiguous word problems.
This is practice content, not claimed past-paper or official exam content.
Avoid exact repeats or paraphrases of these EXISTING bank items:\n${allTopicQuestions.slice(-35).map((q) => q.question).join("\n")}
Respond JSON ONLY: {"questions":[{"question":"...","options":["...","...","...","..."],"correctAnswer":"exact option text","explanation":"..."}]}.`;

      let generated;
      try {
        const response = await askGemini(genPrompt, 0.85);
        generated = response.questions;
        requireValue(Array.isArray(generated) && generated.length === n,
          `Expected ${n} generated questions; received ${generated?.length ?? "none"}`);
      } catch (error) {
        console.error(`Generation batch skipped: ${error.message}`);
        rejected += n;
        continue;
      }

      const valid = [];
      for (const q of generated) {
        const problem = validateQuestion(q, known);
        if (problem) { rejected++; console.log(`Rejected: ${problem}`); continue; }
        known.add(fingerprint(q.question));
        valid.push(q);
      }
      if (!valid.length) continue;

      // Independent SECOND Gemini pass: ask it to solve, not merely trust the key.
      const reviewPrompt = `Independently verify these ${valid.length} practice MCQs for ${syllabus.title},
subject ${subject}, topic ${topic.title}, difficulty level ${level}/10.
For EACH question solve from scratch, then compare the provided answer and explanation.
Pass only if mathematically/factually sound, unambiguous, exactly one correct option,
within the chosen topic and appropriate difficulty. Fail uncertain claims.
Input indexed from 0:\n${JSON.stringify(valid.map((q, index) => ({ index, ...q })))}
Return JSON ONLY: {"checks":[{"index":0,"pass":true,"reason":"short justification"}]}.
Return exactly one check for every input index; do NOT approve uncertain questions.`;

      let checks;
      try {
        const reviewed = await askGemini(reviewPrompt, 0.1);
        checks = reviewed.checks;
        requireValue(Array.isArray(checks) && checks.length === valid.length,
          "Verifier did not return one check per question");
      } catch (error) {
        console.error(`Verification batch skipped: ${error.message}`);
        rejected += valid.length;
        continue;
      }
      const byIndex = new Map(checks.map((c) => [c.index, c]));
      if (byIndex.size !== valid.length) {
        rejected += valid.length;
        console.log("Verification contained missing/duplicate indexes; discarding batch.");
        continue;
      }

      for (let index = 0; index < valid.length && existingCount < target; index++) {
        const q = valid[index];
        const check = byIndex.get(index);
        if (!check || check.pass !== true ||
            typeof check.reason !== "string" || check.reason.trim().length < 6) {
          rejected++;
          console.log(`Verifier rejected: ${q.question.slice(0, 70)} — ${check?.reason || "no justification"}`);
          continue;
        }
        const now = new Date().toISOString();
        try {
          const result = await coll.updateOne(
            { exam, subject, topicId, fingerprint: fingerprint(q.question) },
            { $setOnInsert: {
              id: `government-question-${crypto.randomUUID()}`,
              exam, subject, topicId, topicName: topic.title,
              progressionLevel: level,
              question: q.question.trim(),
              options: q.options.map((x) => x.trim()),
              correctAnswer: q.correctAnswer,
              explanation: q.explanation.trim(),
              fingerprint: fingerprint(q.question),
              status, source: "gemini", syllabusYear: syllabus.syllabusYear,
              createdAt: now, updatedAt: now,
              ...(publish ? {
                reviewedAt: now,
                reviewedBy: "automated-gemini-check-NOT-human-verified",
              } : {}),
            } },
            { upsert: true },
          );
          if (result.upsertedCount) { created++; existingCount++; }
          else { rejected++; console.log("Skipped an existing question."); }
        } catch (error) {
          if (error.code === 11000) {
            rejected++;
            console.log("Skipped a database duplicate.");
          } else throw error;
        }
      }
      console.log(`Progress: ${existingCount}/${target} ${status}; rejected/skipped: ${rejected}`);
    }
    console.log(`DONE: ${created} new ${status} questions; total ${existingCount}/${target}; rejected/skipped ${rejected}.`);
    if (publish) console.log("WARNING: Published after automated AI checks, NOT human academic verification.");
    if (existingCount < target) process.exitCode = 1;
  } finally {
    await client.close();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
