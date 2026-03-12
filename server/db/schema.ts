import { query } from "./connection.js";

export async function initializeDatabase() {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Knowledge entries table
    await query(`
      CREATE TABLE IF NOT EXISTS knowledge_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        phenomenon TEXT NOT NULL,
        background TEXT NOT NULL,
        judgment TEXT NOT NULL,
        judgment_reason TEXT NOT NULL,
        alternative_options TEXT NOT NULL,
        future_verification TEXT NOT NULL,
        additional_1 TEXT,
        additional_2 TEXT,
        additional_3 TEXT,
        additional_4 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tags table
    await query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        color VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Entry tags junction table
    await query(`
      CREATE TABLE IF NOT EXISTS entry_tags (
        entry_id INTEGER NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (entry_id, tag_id)
      );
    `);

    // Google Drive tokens table
    await query(`
      CREATE TABLE IF NOT EXISTS google_drive_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expiry_date BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default tags
    const existingTags = await query("SELECT COUNT(*) FROM tags;");
    if (existingTags.rows[0].count === "0") {
      const tags = [
        // Field (分野)
        { name: "Offense", category: "field", color: "#EF4444" },
        { name: "Defense", category: "field", color: "#3B82F6" },
        { name: "Transition", category: "field", color: "#8B5CF6" },
        { name: "Set Play", category: "field", color: "#F59E0B" },
        { name: "Fitness", category: "field", color: "#10B981" },
        { name: "Mental", category: "field", color: "#EC4899" },

        // Phase (フェーズ)
        { name: "Pre-Season", category: "phase", color: "#6366F1" },
        { name: "Regular Season", category: "phase", color: "#0891B2" },
        { name: "Playoff", category: "phase", color: "#DC2626" },
        { name: "Off-Season", category: "phase", color: "#7C3AED" },
        { name: "Tournament", category: "phase", color: "#EA580C" },

        // Risk (リスク)
        { name: "High Risk", category: "risk", color: "#DC2626" },
        { name: "Medium Risk", category: "risk", color: "#F59E0B" },
        { name: "Low Risk", category: "risk", color: "#10B981" },
        { name: "Opportunity", category: "risk", color: "#0891B2" },
        { name: "Innovation", category: "risk", color: "#8B5CF6" },
      ];

      for (const tag of tags) {
        await query(
          "INSERT INTO tags (name, category, color) VALUES ($1, $2, $3);",
          [tag.name, tag.category, tag.color]
        );
      }
    }

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing database schema:", error);
    throw error;
  }
}
