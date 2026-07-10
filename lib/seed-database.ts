import { getTemplateSeedData } from "@/lib/mock-data";
import { getMongoDatabase } from "@/lib/mongodb";

const COLLECTIONS = {
  content: "content",
  users: "users",
  courses: "courses",
  tests: "tests",
  messages: "messages",
  submissions: "test_submissions",
  quizzes: "quiz_questions",
  deletedAccounts: "deleted_accounts",
} as const;

export async function seedMongoTemplateCollections(options?: { replaceExisting?: boolean }) {
  const db = await getMongoDatabase();
  const template = getTemplateSeedData();
  const replaceExisting = options?.replaceExisting ?? false;

  if (replaceExisting) {
    await Promise.all([
      db.collection(COLLECTIONS.content).deleteMany({}),
      db.collection(COLLECTIONS.users).deleteMany({}),
      db.collection(COLLECTIONS.courses).deleteMany({}),
      db.collection(COLLECTIONS.tests).deleteMany({}),
      db.collection(COLLECTIONS.messages).deleteMany({}),
      db.collection(COLLECTIONS.submissions).deleteMany({}),
      db.collection(COLLECTIONS.quizzes).deleteMany({}),
      db.collection(COLLECTIONS.deletedAccounts).deleteMany({}),
    ]);
  }

  await Promise.all(
    template.content.map((document) =>
      db.collection(COLLECTIONS.content).replaceOne({ _id: document._id } as any, document, { upsert: true }),
    ),
  );

  // Ensure required content documents exist for runtime reads.
  const requiredContentIds = ["public-site", "dashboard-config"];
  const contentDocs = await db
    .collection(COLLECTIONS.content)
    .find({ _id: { $in: requiredContentIds } } as any)
    .project({ _id: 1 })
    .toArray();
  const presentContentIds = new Set(contentDocs.map((item: any) => String(item._id)));
  const missingContentIds = requiredContentIds.filter((id) => !presentContentIds.has(id));

  if (missingContentIds.length) {
    throw new Error(
      `Bootstrap incomplete: missing content documents: ${missingContentIds.join(", ")}.`,
    );
  }

  await Promise.all(
    template.users.map((document) =>
      db.collection(COLLECTIONS.users).replaceOne(
        { id: document.id } as any,
        { ...document, emailKey: document.email.toLowerCase() },
        { upsert: true },
      ),
    ),
  );

  await Promise.all([
    db.collection(COLLECTIONS.users).createIndex({ id: 1 }, { unique: true, name: "users_unique_id" }),
    db.collection(COLLECTIONS.users).createIndex(
      { emailKey: 1 },
      { unique: true, name: "users_unique_emailKey" },
    ),
    db.collection(COLLECTIONS.deletedAccounts).createIndex(
      { deletedAt: -1 },
      { name: "deleted_accounts_chronological" },
    ),
  ]);

  await Promise.all(
    template.courses.map((document) =>
      db.collection(COLLECTIONS.courses).replaceOne({ id: document.id } as any, document, { upsert: true }),
    ),
  );

  await Promise.all(
    template.tests.map((document) =>
      db.collection(COLLECTIONS.tests).replaceOne({ id: document.id } as any, document, { upsert: true }),
    ),
  );

  await Promise.all(
    template.messages.map((document) =>
      db.collection(COLLECTIONS.messages).replaceOne({ id: document.id } as any, document, { upsert: true }),
    ),
  );

  await Promise.all(
    template.submissions.map((document) =>
      db.collection(COLLECTIONS.submissions).replaceOne({ id: document.id } as any, document, { upsert: true }),
    ),
  );

  await Promise.all(
    template.quizQuestions.map((document) =>
      db.collection(COLLECTIONS.quizzes).replaceOne({ id: document.id } as any, document, { upsert: true }),
    ),
  );

  return {
    ok: true,
    replaceExisting,
    collections: {
      content: template.content.length,
      users: template.users.length,
      courses: template.courses.length,
      tests: template.tests.length,
      messages: template.messages.length,
      submissions: template.submissions.length,
      quizzes: template.quizQuestions.length,
      deletedAccounts: 0,
    },
  };
}
