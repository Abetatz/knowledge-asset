import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/knowledge_asset",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

console.log("Database connection string:", process.env.DATABASE_URL ? "Set from environment" : "Using default");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);

pool.on("connect", () => {
  console.log("Database connected successfully");
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
