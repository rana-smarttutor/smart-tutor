import fs from "node:fs/promises";

function loadEnvFile(filePath) {
  return fs
    .readFile(filePath, "utf8")
    .then((text) => {
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
          continue;
        }

        const separatorIndex = trimmed.indexOf("=");

        if (separatorIndex === -1) {
          continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        let value = trimmed.slice(separatorIndex + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    })
    .catch(() => undefined);
}

function requireEnv(name) {
  const value = String(process.env[name] || "").trim();

  if (!value) {
    throw new Error(`${name} is missing.`);
  }

  return value;
}

async function main() {
  await loadEnvFile(".env.local");

  const email = requireEnv("MEGA_EMAIL");
  const password = requireEnv("MEGA_PASSWORD");

  // Removed restriction: Email and password can be the same if that's the user's configuration.
  console.log("Mega config looks present. If login still fails, recheck the password and account access.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
