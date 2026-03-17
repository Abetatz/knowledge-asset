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

    // ===== STEP 6: Create entry_tags table =====
    console.log("[DB Init] STEP 6: Creating entry_tags table...");
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
        file_id VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[DB Init] google_drive_backups table created ✓");

    // ===== STEP 8: Insert default tags =====
    console.log("[DB Init] STEP 8: Inserting default tags...");
    const tags = [
      // 分野 (Domain)
      { name: "コーチ", category: "分野", color: "#FF6B6B" },
      { name: "プレシーズン", category: "分野", color: "#4ECDC4" },
      { name: "戦術", category: "分野", color: "#45B7D1" },
      // フェーズ (Phase)
      { name: "計画", category: "フェーズ", color: "#96CEB4" },
      { name: "実行", category: "フェーズ", color: "#FFEAA7" },
      { name: "評価", category: "フェーズ", color: "#DDA15E" },
      // リスク (Risk)
      { name: "高", category: "リスク", color: "#FF6B6B" },
      { name: "中", category: "リスク", color: "#FFD93D" },
      { name: "低", category: "リスク", color: "#6BCB77" },
    ];

    let insertedCount = 0;
    let skippedCount = 0;

    for (const tag of tags) {
      try {
        const result = await query(
          "INSERT INTO tags (name, category, color) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING RETURNING id;",
          [tag.name, tag.category, tag.color]
        );
        if (result.rows.length > 0) {
          insertedCount++;
        } else {
          skippedCount++;
        }
      } catch (e) {
        console.log(`[DB Init] Error inserting tag ${tag.name}:`, (e as any).message);
        skippedCount++;
      }
    }
    console.log(`[DB Init] Inserted ${insertedCount} new tags, skipped ${skippedCount} existing tags`);
    console.log(`[DB Init] Successfully inserted ${insertedCount}/${tags.length} tags ✓`);

    // ===== STEP 8.5: Create initial admin user if users table is empty =====
    console.log("[DB Init] STEP 8.5: Checking for initial admin user...");
    try {
      const userCount = await query("SELECT COUNT(*) as count FROM users;");
      const count = parseInt(userCount.rows[0].count, 10);
      console.log(`[DB Init] Current user count: ${count}`);

      if (count === 0) {
        console.log("[DB Init] No users found, creating initial admin user...");
        try {
          // Import auth module dynamically
          // @ts-ignore
          const authModule = await import("../utils/auth.js");
          console.log("[DB Init] Auth module imported");

          // Hash password
          const adminPassword = await (authModule as any).default.hashPassword("admin123");
          console.log("[DB Init] Password hashed");

          // Insert admin user
          const adminResult = await query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role;",
            ["admin@knowledge-asset.local", adminPassword, "admin"]
          );

          if (adminResult.rows.length > 0) {
            const admin = adminResult.rows[0];
            console.log(`[DB Init] ✓ ADMIN USER CREATED: email=${admin.email}, id=${admin.id}, role=${admin.role}`);
          } else {
            console.error("[DB Init] ✗ Admin user creation returned no rows");
          }
        } catch (adminError) {
          console.error("[DB Init] ✗ Error creating admin user:", (adminError as any).message);
          console.error("[DB Init] Stack:", (adminError as any).stack);
          throw adminError;
        }
      } else {
        console.log(`[DB Init] Users already exist (count=${count}), skipping admin user creation`);
        // Verify admin user exists
        const adminCheck = await query("SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1;");
        if (adminCheck.rows.length > 0) {
          console.log(`[DB Init] Admin user exists: ${adminCheck.rows[0].email}`);
        } else {
          console.warn("[DB Init] ⚠ No admin user found in database");
        }
      }
    } catch (userCheckError) {
      console.error("[DB Init] ✗ Error in admin user creation step:", (userCheckError as any).message);
      throw userCheckError;
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

    console.log("[DB Init] ✓✓✓ DATABASE INITIALIZATION COMPLETED SUCCESSFULLY ✓✓✓");
  } catch (error) {
    console.error("[DB Init] ✗✗✗ DATABASE INITIALIZATION FAILED ✗✗✗");
    console.error("[DB Init] Error:", error);
    throw error;
  }
}
