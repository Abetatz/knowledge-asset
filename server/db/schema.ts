import { query } from "./connection.js";

export async function initializeDatabase() {
  try {
    // Drop existing tables in correct order (respecting foreign keys)
    console.log("Dropping existing tables...");
    await query("DROP TABLE IF EXISTS entry_tags CASCADE;");
    await query("DROP TABLE IF EXISTS knowledge_entries CASCADE;");
    await query("DROP TABLE IF EXISTS google_drive_backups CASCADE;");
    await query("DROP TABLE IF EXISTS tags CASCADE;");
    await query("DROP TABLE IF EXISTS users CASCADE;");
    console.log("Tables dropped successfully");

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create tags table
    await query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        color VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create knowledge_entries table
    await query(`
      CREATE TABLE IF NOT EXISTS knowledge_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        phenomenon TEXT NOT NULL,
        background TEXT NOT NULL,
        judgment TEXT NOT NULL,
        judgment_reason TEXT NOT NULL,
        alternative_options TEXT,
        future_verification TEXT,
        additional_1 TEXT,
        additional_2 TEXT,
        additional_3 TEXT,
        additional_4 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create entry_tags junction table
    await query(`
      CREATE TABLE IF NOT EXISTS entry_tags (
        id SERIAL PRIMARY KEY,
        entry_id INTEGER NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create google_drive_backups table
    await query(`
      CREATE TABLE IF NOT EXISTS google_drive_backups (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expiry_date BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default tags
    const tags = [
      // Field (分野)
      { name: "攻撃", category: "field", color: "#EF4444" },
      { name: "守備", category: "field", color: "#3B82F6" },
      { name: "トランジション", category: "field", color: "#8B5CF6" },
      { name: "セットプレー", category: "field", color: "#F59E0B" },
      { name: "フィジカル", category: "field", color: "#10B981" },
      { name: "メンタル", category: "field", color: "#EC4899" },
      { name: "コーチ", category: "field", color: "#06B6D4" },
      { name: "S&C", category: "field", color: "#8B5CF6" },
      { name: "メディカル", category: "field", color: "#EC4899" },
      { name: "マネジメント", category: "field", color: "#F59E0B" },
      { name: "アナリスト", category: "field", color: "#3B82F6" },
      { name: "選手", category: "field", color: "#10B981" },

      // Phase (フェーズ)
      { name: "プレシーズン", category: "phase", color: "#6366F1" },
      { name: "インシーズン", category: "phase", color: "#0891B2" },
      { name: "ケガからの復帰", category: "phase", color: "#DC2626" },
      { name: "移籍", category: "phase", color: "#7C3AED" },
      { name: "試合週", category: "phase", color: "#EA580C" },

      // Risk (リスク)
      { name: "戦術", category: "risk", color: "#DC2626" },
      { name: "再発", category: "risk", color: "#F59E0B" },
      { name: "契約", category: "risk", color: "#10B981" },
      { name: "心理", category: "risk", color: "#0891B2" },
      { name: "成長", category: "risk", color: "#8B5CF6" },
    ];

    for (const tag of tags) {
      await query(
        "INSERT INTO tags (name, category, color) VALUES ($1, $2, $3);",
        [tag.name, tag.category, tag.color]
      );
    }

    console.log("Database schema initialized successfully with Japanese tags");
  } catch (error) {
    console.error("Error initializing database schema:", error);
    throw error;
  }
}
