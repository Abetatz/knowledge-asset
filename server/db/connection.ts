import { Pool } from "pg";

// Log environment variables for debugging
const databaseUrl = process.env.DATABASE_URL;
console.log("[DB Connection] DATABASE_URL:", databaseUrl ? "Set" : "Not set");
console.log("[DB Connection] NODE_ENV:", process.env.NODE_ENV);

if (!databaseUrl) {
  console.error("[DB Connection] ERROR: DATABASE_URL is not set!");
}

const pool = new Pool({
  connectionString: databaseUrl || "postgresql://localhost:5432/knowledge_asset",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
  console.log("[DB Connection] Database connected successfully");
});

pool.on("error", (err: Error) => {
  console.error("[DB Connection] Unexpected error on idle client:", err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("Database query error", { text, error });
    throw error;
  }
}

export async function getClient() {
  return pool.connect();
}

export async function closePool() {
  await pool.end();
}

export default pool;
