import fs from "node:fs";
import path from "node:path";

/**
 * Smart Tutors Production Bootstrap Script
 * This script initializes the MongoDB database with all roles, 
 * current student data, and system configurations.
 */

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    content.split("\n").forEach(line => {
      const [key, ...value] = line.split("=");
      if (key && value) process.env[key.trim()] = value.join("=").trim();
    });
  }
}

loadEnv();

const API_KEY = process.env.MONGODB_BOOTSTRAP_KEY;
const BASE_URL = process.env.BOOTSTRAP_BASE_URL || "http://localhost:3000";

if (!API_KEY) {
  console.error("❌ ERROR: MONGODB_BOOTSTRAP_KEY not found in .env.local");
  process.exit(1);
}

async function runBootstrap() {
  console.log("🚀 Starting Smart Tutors Role-Based Bootstrap...");
  console.log(`Target: ${BASE_URL}`);

  try {
    const response = await fetch(`${BASE_URL}/api/admin/bootstrap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bootstrap-key": API_KEY,
      },
      body: JSON.stringify({ replaceExisting: true }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Bootstrap Successful!");
      console.log("-----------------------------------------");
      console.log(`Users Created:    ${result.collections.users}`);
      console.log(`Courses Setup:    ${result.collections.courses}`);
      console.log(`Core Content:     ${result.collections.content}`);
      console.log(`Messages Synced:  ${result.collections.messages}`);
      console.log("-----------------------------------------");
      console.log("Default Credentials:");
      console.log("- Admin: admin@smarttutors.co.in / Admin@123");
      console.log("- Educator: amit@smarttutors.co.in / Educator@123");
      console.log("- Student: riya@smarttutors.co.in / Student@123");
      console.log("-----------------------------------------");
    } else {
      console.error("❌ Bootstrap Failed:", result.error || "Unknown Error");
    }
  } catch (err) {
    console.error("❌ Network Error:", err.message);
    console.log("Ensure 'npm run dev' is active before running this script.");
  }
}

runBootstrap();
