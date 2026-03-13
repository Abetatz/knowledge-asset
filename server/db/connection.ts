import { Pool } from "pg";

// Debug: Log all environment variables
console.log("[DB Init] All env keys:", Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PG')).join(', '));
console.log("[DB Init] process.env.DATABASE_URL:", process.env.DATABASE_URL);
console.log("[DB Init] typeof process.env.DATABASE_URL:", typeof process.env.DATABASE_URL);

// Try to get DATABASE_URL from various sources
let connectionString = process.env.DATABASE_URL;

console.log("[DB Init] Final connectionString:", connectionString ? "Set" : "Not set");

if (!connectionString) {
  console.error("[DB Init] CRITICAL: DATABASE_URL is not set!");
  console.error("[DB Init] Available environment variables with DATABASE:");
  Object.entries(process.env).forEach(([key, value]) => {
    if (key.includes('DATABASE') || key.includes('PG')) {
      console.error(`[DB Init]   ${key}=${value ? "***" : "undefined"}`);
    }
  });
}

const pool = new Pool({
  connectionString: connectionString || "postgresql://localhost:5432/knowledge_asset",
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
