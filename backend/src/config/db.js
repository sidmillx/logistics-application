// import { drizzle } from "drizzle-orm/neon-http";
// import { neon } from "@neondatabase/serverless";
// import { ENV } from "./env.js";
// import * as schema from "../db/schema.js";


// const sql = neon(ENV.DATABASE_URL);
// export const db = drizzle(sql, {schema});



// db.js
import pkg from "pg";
import { drizzle } from "drizzle-orm/postgres-js"; // Use Postgres driver
import postgres from "postgres";
import * as schema from "../db/schema.js";
import { ENV } from "./env.js";

// If using postgres-js (recommended for Drizzle + local DB)
const sql = postgres(ENV.DATABASE_URL);

export const db = drizzle(sql, { schema });
