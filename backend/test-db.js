import { Client } from "pg";

const client = new Client({
  connectionString: "postgresql://postgres:120987@localhost:5432/logistics",
});

async function test() {
  try {
    await client.connect();
    console.log("✅ Connected to database!");
    const res = await client.query("SELECT current_database(), NOW()");
    console.log("Database:", res.rows[0]);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  } finally {
    await client.end();
  }
}

test();
