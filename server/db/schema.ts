import { query } from "./connection.js";

export async function initializeDatabase() {
  try {
    // ===== STEP 1: Check if tables already exist =====
    console.log("[DB Init] STEP 1: Checking existing tables...");
    const tablesCheck = await query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('users', 'tags', 'knowledge_entries', 'entry_tags', 'google_drive_backups');`
    );
    console.log(`[DB Init] Found ${tablesCheck.rows.length} existing tables`);
    if (tablesCheck.rows.length > 0) {
      console.log("[DB Init] Existing tables:", tablesCheck.rows.map((r: any) => r.table_name).join(", "));
    }

    // ===== STEP 2: Drop existing tables in correct order =====
    console.log("[DB Init] STEP 2: Dropping existing tables...");
    try {
      await query("DROP TABLE IF EXISTS entry_tags CASCADE;");
      console.log("[DB Init] Dropped entry_tags table");
    } catch (e) {
      console.log("[DB Init] entry_tags table does not exist or error:", (e as any).message);
    }

    try {
      await query("DROP TABLE IF EXISTS knowledge_entries CASCADE;");
      console.log("[DB Init] Dropped knowledge_entries table");
    } catch (e) {
      console.log("[DB Init] knowledge_entries table does not exist or error:", (e as any).message);
    }

    try {
      await query("DROP TABLE IF EXISTS google_drive_backups CASCADE;");
      console.log("[DB Init] Dropped google_drive_backups table");
    } catch (e) {
      console.log("[DB Init] google_drive_backups table does not exist or error:", (e as any).message);
    }

    // DO NOT DROP tags and users tables - they should persist across deployments
    // try {
    //   await query("DROP TABLE IF EXISTS tags CASCADE;");
    //   console.log("[DB Init] Dropped tags table");
    // } catch (e) {
    //   console.log("[DB Init] tags table does not exist or error:", (e as any).message);
    // }

    // try {
    //   await query("DROP TABLE IF EXISTS users CASCADE;");
    //   console.log("[DB Init] Dropped users table");
    // } catch (e) {
    //   console.log("[DB Init] users table does not exist or error:", (e as any).message);
    // }

    console.log("[DB Init] All tables dropped successfully");

    // ===== STEP 3: Create users table =====
    console.log("[DB Init] STEP 3: Creating users table...");
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
    console.log("[DB Init] users table created ✓");

    // ===== STEP 4: Create tags table =====
    console.log("[DB Init] STEP 4: Creating tags table...");
    await query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        category VARCHAR(50) NOT NULL,
        color VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DB Init] tags table created ✓");

    // ===== STEP 5: Create knowledge_entries table =====
    console.log("[DB Init] STEP 5: Creating knowledge_entries table...");
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
        additional_1 TEXT DEFAULT '',
        additional_2 TEXT DEFAULT '',
        additional_3 TEXT DEFAULT '',
        additional_4 TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DB Init] knowledge_entries table created ✓");

    // ===== STEP 6: Create entry_tags junction table =====
    console.log("[DB Init] STEP 6: Creating entry_tags junction table...");
    await query(`
      CREATE TABLE IF NOT EXISTS entry_tags (
        id SERIAL PRIMARY KEY,
        entry_id INTEGER NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(entry_id, tag_id)
      );
    `);
    console.log("[DB Init] entry_tags table created ✓");

    // ===== STEP 7: Create google_drive_backups table =====
    console.log("[DB Init] STEP 7: Creating google_drive_backups table...");
    await query(`
      CREATE TABLE IF NOT EXISTS google_drive_backups (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expiry_date BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DB Init] google_drive_backups table created ✓");

    // ===== STEP 8: Insert default tags =====
    console.log("[DB Init] STEP 8: Inserting default tags...");
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

    let insertedCount = 0;
    let skippedCount = 0;
    for (const tag of tags) {
      try {
        // Check if tag already exists
        const existingTag = await query(
          "SELECT id FROM tags WHERE name = $1;",
          [tag.name]
        );
        
        if (existingTag.rows.length > 0) {
          console.log(`[DB Init] Tag already exists: "${tag.name}" (id=${existingTag.rows[0].id}), skipping...`);
          skippedCount++;
        } else {
          const result = await query(
            "INSERT INTO tags (name, category, color) VALUES ($1, $2, $3) RETURNING id;",
            [tag.name, tag.category, tag.color]
          );
          console.log(`[DB Init] Tag inserted: "${tag.name}" (id=${result.rows[0].id}, category=${tag.category})`);
          insertedCount++;
        }
      } catch (tagError) {
        console.error(`[DB Init] ERROR inserting tag "${tag.name}":`, (tagError as any).message);
        throw tagError;
      }
    }
    console.log(`[DB Init] Inserted ${insertedCount} new tags, skipped ${skippedCount} existing tags`);
    console.log(`[DB Init] Successfully inserted ${insertedCount}/${tags.length} tags ✓`);

    // ===== STEP 8.5: Create initial admin user if users table is empty =====
    console.log("[DB Init] STEP 8.5: Checking for initial admin user...");
    const userCount = await query("SELECT COUNT(*) as count FROM users;");
    const count = parseInt(userCount.rows[0].count, 10);
    console.log(`[DB Init] User count: ${count}`);
    if (count === 0) {
      console.log("[DB Init] No users found, creating initial admin user...");
      // @ts-ignore
      const authModule: any = await import("../utils/auth.js");
      const adminPassword: string = await authModule.default.hashPassword("admin123");
      const adminResult = await query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role;",
        ["admin@knowledge-asset.local", adminPassword, "admin"]
      );
      console.log(`[DB Init] Initial admin user created: ${adminResult.rows[0].email} (id=${adminResult.rows[0].id})`);
    } else {
      console.log(`[DB Init] Users already exist (count=${userCount.rows[0].count}), skipping admin user creation`);
    }

    // ===== STEP 9: Verify tags were inserted =====
    console.log("[DB Init] STEP 9: Verifying tags...");
    const tagsVerify = await query("SELECT id, name, category FROM tags ORDER BY category, name;");
    console.log(`[DB Init] Total tags in database: ${tagsVerify.rows.length}`);
    
    // Group by category
    const byCategory: { [key: string]: any[] } = {};
    tagsVerify.rows.forEach((tag: any) => {
      if (!byCategory[tag.category]) {
        byCategory[tag.category] = [];
      }
      byCategory[tag.category].push(tag);
    });

    Object.entries(byCategory).forEach(([category, categoryTags]) => {
      console.log(`[DB Init]   ${category}: ${(categoryTags as any[]).map((t: any) => `${t.name}(id=${t.id})`).join(", ")}`);
    });

    console.log("[DB Init] ✅ Database schema initialized successfully with Japanese tags");
  } catch (error) {
    console.error("[DB Init] ❌ CRITICAL ERROR initializing database schema:", error);
    console.error("[DB Init] Error details:", (error as any).message);
    console.error("[DB Init] Error stack:", (error as any).stack);
    throw error;
  }
}
