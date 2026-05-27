import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

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

async function testAdminAuth() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "smart_tutor";
  
  if (!uri) {
    console.error("MONGODB_URI not found");
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");

    console.log("--- Auth Diagnostic ---");
    console.log("Target Email: admin@smarttutors.co.in");

    // 1. Check if user exists
    const user = await users.findOne({ 
      $or: [
        { email: "admin@smarttutors.co.in" },
        { emailKey: "admin@smarttutors.co.in" }
      ]
    });

    if (!user) {
      console.log("❌ User NOT found in database.");
      const allUsers = await users.find({}).project({ email: 1, role: 1 }).toArray();
      console.log("Existing users in DB:", allUsers);
    } else {
      console.log("✅ User found!");
      console.log("Role:", user.role);
      console.log("Password in DB:", user.password);
      console.log("Password Matches 'Admin@123':", user.password === "Admin@123");
      
      // 2. Test the exact query used in the app
      const query = {
        password: "Admin@123",
        $or: [
          { email: "admin@smarttutors.co.in" },
          { emailKey: "admin@smarttutors.co.in" }
        ]
      };
      
      const authResult = await users.findOne(query);
      console.log("App Query Result:", authResult ? "SUCCESS" : "FAILED");
    }

  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    await client.close();
  }
}

testAdminAuth();
