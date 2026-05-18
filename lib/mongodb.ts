"use server"
import { MongoClient } from "mongodb";

declare global {
  var __smartTutorMongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

function buildMongoConfigHelp(uri?: string) {
  const base = "MongoDB connection failed.";
  const lines: string[] = [base];

  if (!uri) {
    lines.push("Missing MONGODB_URI in the environment.");
    return lines.join(" ");
  }

  if (uri.includes("@cluster.mongodb.net")) {
    lines.push(
      "Your MONGODB_URI still uses the placeholder host `cluster.mongodb.net`.",
      "Replace it with your real Atlas hostname (for example `cluster0.xxxxx.mongodb.net`).",
    );
  }

  lines.push(
    "Also confirm your network/DNS can resolve Atlas SRV records and your IP is whitelisted in Atlas Network Access.",
  );

  return lines.join(" ");
}

export function getMongoClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to your local environment.");
  }

  if (!global.__smartTutorMongoClientPromise) {
    if (uri.includes("@cluster.mongodb.net")) {
      throw new Error(buildMongoConfigHelp(uri));
    }

    const client = new MongoClient(uri);
    global.__smartTutorMongoClientPromise = client.connect().catch((error) => {
      // Allow a later retry after a transient DNS / network issue.
      global.__smartTutorMongoClientPromise = undefined;

      const details =
        error && typeof error === "object"
          ? ` code=${(error as any).code ?? "unknown"} syscall=${(error as any).syscall ?? "unknown"} hostname=${(error as any).hostname ?? "unknown"}`
          : "";

      throw new Error(`${buildMongoConfigHelp(uri)}${details}`, { cause: error as any });
    });
  }

  return global.__smartTutorMongoClientPromise;
}

function getMongoDatabaseName() {
  const configuredName = process.env.MONGODB_DB;

  if (configuredName) {
    return configuredName;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to your local environment.");
  }

  const databaseName = uri.split("/").pop()?.split("?")[0]?.trim();

  if (!databaseName) {
    throw new Error("Unable to infer MongoDB database name. Set MONGODB_DB explicitly.");
  }

  return databaseName;
}

export async function getMongoDatabase() {
  const client = await getMongoClient();
  return client.db(getMongoDatabaseName());
}
