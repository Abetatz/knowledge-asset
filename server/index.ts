import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Log all environment variables for debugging
console.log("[Server] Starting server...");
console.log("[Server] NODE_ENV:", process.env.NODE_ENV);
console.log("[Server] PORT:", process.env.PORT);
console.log("[Server] DATABASE_URL exists:", !!process.env.DATABASE_URL);

import { initializeDatabase } from "./db/schema.js";
import { query } from "./db/connection.js";
import { hashPassword, comparePassword, generateToken, verifyToken, extractTokenFromHeader } from "./utils/auth.js";
import { User, JWTPayload, KnowledgeEntry, KnowledgeEntryRequest } from "./types.js";
import googleDriveRouter from "./routes/googleDrive.js";
import adminRouter from "./admin-routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Auth middleware
interface AuthRequest extends Request {
  user?: JWTPayload;
}

async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = payload;
  next();
}

// Admin middleware
async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// Routes

// Auth endpoints
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1;", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    // Check if this is the first user - if so, make them admin
    const userCount = await query("SELECT COUNT(*) as count FROM users;");
    const isFirstUser = userCount.rows[0].count === 0;
    const role = isFirstUser ? 'admin' : 'user';
    
    const result = await query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role;",
      [email, passwordHash, role]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Setup endpoint - create initial admin user
app.post("/api/setup/create-admin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if any admin user already exists
    const adminCheck = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1;");
    if (adminCheck.rows.length > 0) {
      return res.status(403).json({ error: "Admin user already exists" });
    }

    // Hash password and create admin user
    const hashedPassword = await hashPassword(password);
    const result = await query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role;",
      [email, hashedPassword, "admin"]
    );

    if (result.rows.length > 0) {
      const admin = result.rows[0];
      console.log(`[Setup] Admin user created: ${admin.email}`);
      res.json({ success: true, user: admin, message: "Admin user created successfully" });
    } else {
      res.status(500).json({ error: "Failed to create admin user" });
    }
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    let result = await query("SELECT id, email, password_hash, role FROM users WHERE email = $1;", [email]);
    
    if (result.rows.length === 0) {
      // User does not exist - reject login
      console.log(`[Auth] User "${email}" does not exist.`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.email, user.role);
    res.json({ user: { id: user.id, email: user.email, role: user.role }, token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Knowledge entries endpoints
app.get("/api/entries", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    console.log(`[API] GET /api/entries for user ${userId}`);
    
    const result = await query(
      `SELECT ke.*, 
              json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category, 'color', t.color)) as tags
       FROM knowledge_entries ke
       LEFT JOIN entry_tags et ON ke.id = et.entry_id
       LEFT JOIN tags t ON et.tag_id = t.id
       WHERE ke.user_id = $1
       GROUP BY ke.id
       ORDER BY ke.created_at DESC;`,
      [userId]
    );

    console.log(`[API] GET /api/entries returned ${result.rows.length} entries`);
    res.json(result.rows);
  } catch (error) {
    console.error("Get entries error:", error);
    res.status(500).json({ error: "Internal server error", details: (error as any).message });
  }
});

app.post("/api/entries", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      phenomenon,
      background,
      judgment,
      judgment_reason,
      alternative_options,
      future_verification,
      additional_1,
      additional_2,
      additional_3,
      additional_4,
      tags,
    } = req.body;
    
    console.log('[API] POST /api/entries - Request received');
    console.log('[API] User ID:', userId);
    console.log('[API] Title:', title);
    console.log('[API] Tags:', tags);
    console.log('[API] Tags type:', typeof tags);
    console.log('[API] Tags is array:', Array.isArray(tags));
    console.log('[API] Tags length:', tags?.length);

    // ===== VALIDATION STEP 0: Check if user exists in database =====
    console.log('[API] VALIDATION: Checking if user exists in database...');
    let userCheck = await query('SELECT id, email FROM users WHERE id = $1;', [userId]);
    if (userCheck.rows.length === 0) {
      console.log(`[API] WARNING: User with ID ${userId} does not exist. Creating default user...`);
      try {
        const hashedPassword = await hashPassword('default-password');
        const createResult = await query(
          'INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email;',
          [userId, `user-${userId}@knowledge-asset.local`, hashedPassword, 'user']
        );
        console.log(`[API] Default user created: id=${createResult.rows[0].id}`);
        userCheck = createResult;
      } catch (createError) {
        console.error('[API] ERROR: Failed to create default user:', (createError as any).message);
        return res.status(500).json({ error: 'Failed to create user', details: (createError as any).message });
      }
    }
    console.log(`[API] VALIDATION: User exists in database (email: ${userCheck.rows[0].email}) ✓`);

    // ===== VALIDATION STEP 1: Check required fields =====
    console.log('[API] VALIDATION: Checking required fields...');
    if (!title || typeof title !== 'string' || title.trim() === '') {
      console.log('[API] VALIDATION FAILED: title is missing or invalid');
      return res.status(400).json({ error: "Title is required and must be a non-empty string" });
    }
    if (!phenomenon || typeof phenomenon !== 'string' || phenomenon.trim() === '') {
      console.log('[API] VALIDATION FAILED: phenomenon is missing or invalid');
      return res.status(400).json({ error: "Phenomenon is required and must be a non-empty string" });
    }
    if (!background || typeof background !== 'string' || background.trim() === '') {
      console.log('[API] VALIDATION FAILED: background is missing or invalid');
      return res.status(400).json({ error: "Background is required and must be a non-empty string" });
    }
    if (!judgment || typeof judgment !== 'string' || judgment.trim() === '') {
      console.log('[API] VALIDATION FAILED: judgment is missing or invalid');
      return res.status(400).json({ error: "Judgment is required and must be a non-empty string" });
    }
    if (!judgment_reason || typeof judgment_reason !== 'string' || judgment_reason.trim() === '') {
      console.log('[API] VALIDATION FAILED: judgment_reason is missing or invalid');
      return res.status(400).json({ error: "Judgment reason is required and must be a non-empty string" });
    }
    if (!alternative_options || typeof alternative_options !== 'string' || alternative_options.trim() === '') {
      console.log('[API] VALIDATION FAILED: alternative_options is missing or invalid');
      return res.status(400).json({ error: "Alternative options is required and must be a non-empty string" });
    }
    if (!future_verification || typeof future_verification !== 'string' || future_verification.trim() === '') {
      console.log('[API] VALIDATION FAILED: future_verification is missing or invalid');
      return res.status(400).json({ error: "Future verification is required and must be a non-empty string" });
    }
    console.log('[API] VALIDATION: All required fields are valid ✓');

    // ===== VALIDATION STEP 2: Check tags =====
    console.log('[API] VALIDATION: Checking tags...');
    if (!Array.isArray(tags)) {
      console.log('[API] VALIDATION FAILED: tags is not an array');
      return res.status(400).json({ error: "Tags must be an array of tag IDs" });
    }
    console.log('[API] VALIDATION: Tags is an array with', tags.length, 'items');
    
    // Validate each tag ID
    for (let i = 0; i < tags.length; i++) {
      const tagId = tags[i];
      if (typeof tagId !== 'number' || !Number.isInteger(tagId) || tagId <= 0) {
        console.log(`[API] VALIDATION FAILED: tag at index ${i} is not a valid positive integer (${tagId})`);
        return res.status(400).json({ error: `Tag ID at index ${i} must be a positive integer` });
      }
    }
    console.log('[API] VALIDATION: All tag IDs are valid ✓');

    // ===== DATABASE STEP 1: Insert entry =====
    console.log('[API] DATABASE: Inserting entry...');
    const entryResult = await query(
      `INSERT INTO knowledge_entries 
       (user_id, title, phenomenon, background, judgment, judgment_reason, alternative_options, future_verification, additional_1, additional_2, additional_3, additional_4)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, user_id, title, created_at;`,
      [
        userId,
        title.trim(),
        phenomenon.trim(),
        background.trim(),
        judgment.trim(),
        judgment_reason.trim(),
        alternative_options.trim(),
        future_verification.trim(),
        additional_1 ? additional_1.trim() : "",
        additional_2 ? additional_2.trim() : "",
        additional_3 ? additional_3.trim() : "",
        additional_4 ? additional_4.trim() : "",
      ]
    );

    if (!entryResult.rows || entryResult.rows.length === 0) {
      console.log('[API] DATABASE FAILED: Entry insertion returned no rows');
      return res.status(500).json({ error: "Failed to create entry" });
    }

    const entry = entryResult.rows[0];
    console.log(`[API] DATABASE: Entry created successfully with ID ${entry.id} ✓`);

    // ===== DATABASE STEP 2: Insert tags =====
    console.log(`[API] DATABASE: Inserting ${tags.length} tags...`);
    if (tags.length > 0) {
      for (let i = 0; i < tags.length; i++) {
        const tagId = tags[i];
        console.log(`[API] DATABASE: Inserting tag ${i + 1}/${tags.length} (tag_id=${tagId})...`);
        
        try {
          const tagInsertResult = await query(
            "INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2) RETURNING id;",
            [entry.id, tagId]
          );
          console.log(`[API] DATABASE: Tag ${i + 1} inserted successfully (entry_tag_id=${tagInsertResult.rows[0].id})`);
        } catch (tagError) {
          console.error(`[API] DATABASE ERROR: Failed to insert tag ${i + 1}:`, tagError);
          // Delete the entry since tag insertion failed
          await query("DELETE FROM knowledge_entries WHERE id = $1;", [entry.id]);
          console.log(`[API] DATABASE: Entry ${entry.id} rolled back due to tag insertion failure`);
          return res.status(400).json({ 
            error: `Failed to insert tag at index ${i}. Tag ID ${tagId} may not exist.`,
            details: (tagError as any).message
          });
        }
      }
      console.log(`[API] DATABASE: All ${tags.length} tags inserted successfully ✓`);
    } else {
      console.log('[API] DATABASE: No tags to insert');
    }

    // ===== DATABASE STEP 3: Fetch complete entry with tags =====
    console.log(`[API] DATABASE: Fetching complete entry with tags...`);
    const fullResult = await query(
      `SELECT ke.*, 
              COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category, 'color', t.color)) 
                FILTER (WHERE t.id IS NOT NULL), '[]'::json) as tags
       FROM knowledge_entries ke
       LEFT JOIN entry_tags et ON ke.id = et.entry_id
       LEFT JOIN tags t ON et.tag_id = t.id
       WHERE ke.id = $1
       GROUP BY ke.id;`,
      [entry.id]
    );

    if (!fullResult.rows || fullResult.rows.length === 0) {
      console.log('[API] DATABASE FAILED: Failed to fetch created entry');
      return res.status(500).json({ error: "Failed to fetch created entry" });
    }

    const completeEntry = fullResult.rows[0];
    console.log(`[API] DATABASE: Entry fetched successfully with ${completeEntry.tags.length} tags ✓`);
    console.log('[API] RESPONSE: Sending entry to client...');

    res.status(201).json(completeEntry);

    // ===== AUTO-BACKUP (non-blocking) =====
    try {
      const { backupToDrive } = await import("./utils/googleDrive.js");
      const allEntriesResult = await query(
        `SELECT ke.*, 
                COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category, 'color', t.color)) 
                  FILTER (WHERE t.id IS NOT NULL), '[]'::json) as tags
         FROM knowledge_entries ke
         LEFT JOIN entry_tags et ON ke.id = et.entry_id
         LEFT JOIN tags t ON et.tag_id = t.id
         WHERE ke.user_id = $1
         GROUP BY ke.id
         ORDER BY ke.created_at DESC;`,
        [userId]
      );
      await backupToDrive(userId, {
        timestamp: new Date().toISOString(),
        entries: allEntriesResult.rows,
      });
      console.log("[Auto-Backup] Successfully backed up to Google Drive");
    } catch (backupError) {
      console.log("[Auto-Backup] Google Drive backup not available:", (backupError as any).message);
    }
  } catch (error) {
    console.error("[API] CRITICAL ERROR in POST /api/entries:", error);
    console.error("[API] Error stack:", (error as any).stack);
    res.status(500).json({ 
      error: "Internal server error", 
      details: (error as any).message,
      stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
    });
  }
});

app.put("/api/entries/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entryId = req.params.id;
    const {
      title,
      phenomenon,
      background,
      judgment,
      judgment_reason,
      alternative_options,
      future_verification,
      additional_1,
      additional_2,
      additional_3,
      additional_4,
      tags,
    } = req.body;

    console.log(`[API] PUT /api/entries/${entryId} - Request received`);
    console.log('[API] User ID:', userId);
    console.log('[API] Tags:', tags);

    // ===== VALIDATION STEP 1: Check ownership =====
    console.log('[API] VALIDATION: Checking ownership...');
    const ownerCheck = await query("SELECT user_id FROM knowledge_entries WHERE id = $1;", [entryId]);
    if (ownerCheck.rows.length === 0) {
      console.log(`[API] VALIDATION FAILED: Entry ${entryId} not found`);
      return res.status(404).json({ error: "Entry not found" });
    }
    if (ownerCheck.rows[0].user_id !== userId) {
      console.log(`[API] VALIDATION FAILED: User ${userId} does not own entry ${entryId}`);
      return res.status(403).json({ error: "Forbidden" });
    }
    console.log('[API] VALIDATION: Ownership verified ✓');

    // ===== VALIDATION STEP 2: Check required fields =====
    console.log('[API] VALIDATION: Checking required fields...');
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      console.log('[API] VALIDATION FAILED: title is invalid');
      return res.status(400).json({ error: "Title must be a non-empty string" });
    }
    if (phenomenon !== undefined && (typeof phenomenon !== 'string' || phenomenon.trim() === '')) {
      console.log('[API] VALIDATION FAILED: phenomenon is invalid');
      return res.status(400).json({ error: "Phenomenon must be a non-empty string" });
    }
    if (background !== undefined && (typeof background !== 'string' || background.trim() === '')) {
      console.log('[API] VALIDATION FAILED: background is invalid');
      return res.status(400).json({ error: "Background must be a non-empty string" });
    }
    if (judgment !== undefined && (typeof judgment !== 'string' || judgment.trim() === '')) {
      console.log('[API] VALIDATION FAILED: judgment is invalid');
      return res.status(400).json({ error: "Judgment must be a non-empty string" });
    }
    if (judgment_reason !== undefined && (typeof judgment_reason !== 'string' || judgment_reason.trim() === '')) {
      console.log('[API] VALIDATION FAILED: judgment_reason is invalid');
      return res.status(400).json({ error: "Judgment reason must be a non-empty string" });
    }
    if (alternative_options !== undefined && (typeof alternative_options !== 'string' || alternative_options.trim() === '')) {
      console.log('[API] VALIDATION FAILED: alternative_options is invalid');
      return res.status(400).json({ error: "Alternative options must be a non-empty string" });
    }
    if (future_verification !== undefined && (typeof future_verification !== 'string' || future_verification.trim() === '')) {
      console.log('[API] VALIDATION FAILED: future_verification is invalid');
      return res.status(400).json({ error: "Future verification must be a non-empty string" });
    }
    console.log('[API] VALIDATION: All provided fields are valid ✓');

    // ===== VALIDATION STEP 3: Check tags =====
    console.log('[API] VALIDATION: Checking tags...');
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        console.log('[API] VALIDATION FAILED: tags is not an array');
        return res.status(400).json({ error: "Tags must be an array of tag IDs" });
      }
      for (let i = 0; i < tags.length; i++) {
        const tagId = tags[i];
        if (typeof tagId !== 'number' || !Number.isInteger(tagId) || tagId <= 0) {
          console.log(`[API] VALIDATION FAILED: tag at index ${i} is not a valid positive integer`);
          return res.status(400).json({ error: `Tag ID at index ${i} must be a positive integer` });
        }
      }
    }
    console.log('[API] VALIDATION: Tags are valid ✓');

    // ===== DATABASE STEP 1: Update entry =====
    console.log('[API] DATABASE: Updating entry...');
    const updateResult = await query(
      `UPDATE knowledge_entries 
       SET title = COALESCE($1, title),
           phenomenon = COALESCE($2, phenomenon),
           background = COALESCE($3, background),
           judgment = COALESCE($4, judgment),
           judgment_reason = COALESCE($5, judgment_reason),
           alternative_options = COALESCE($6, alternative_options),
           future_verification = COALESCE($7, future_verification),
           additional_1 = COALESCE($8, additional_1),
           additional_2 = COALESCE($9, additional_2),
           additional_3 = COALESCE($10, additional_3),
           additional_4 = COALESCE($11, additional_4),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING id;`,
      [
        title ? title.trim() : null,
        phenomenon ? phenomenon.trim() : null,
        background ? background.trim() : null,
        judgment ? judgment.trim() : null,
        judgment_reason ? judgment_reason.trim() : null,
        alternative_options ? alternative_options.trim() : null,
        future_verification ? future_verification.trim() : null,
        additional_1 ? additional_1.trim() : null,
        additional_2 ? additional_2.trim() : null,
        additional_3 ? additional_3.trim() : null,
        additional_4 ? additional_4.trim() : null,
        entryId,
      ]
    );

    if (!updateResult.rows || updateResult.rows.length === 0) {
      console.log(`[API] DATABASE FAILED: Entry ${entryId} update returned no rows`);
      return res.status(500).json({ error: "Failed to update entry" });
    }
    console.log(`[API] DATABASE: Entry ${entryId} updated successfully ✓`);

    // ===== DATABASE STEP 2: Update tags =====
    if (tags !== undefined) {
      console.log(`[API] DATABASE: Updating tags...`);
      await query("DELETE FROM entry_tags WHERE entry_id = $1;", [entryId]);
      console.log(`[API] DATABASE: Old tags deleted ✓`);
      
      if (tags.length > 0) {
        for (let i = 0; i < tags.length; i++) {
          const tagId = tags[i];
          try {
            await query("INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2);", [entryId, tagId]);
            console.log(`[API] DATABASE: Tag ${i + 1}/${tags.length} inserted`);
          } catch (tagError) {
            console.error(`[API] DATABASE ERROR: Failed to insert tag ${i + 1}:`, tagError);
            return res.status(400).json({ 
              error: `Failed to insert tag at index ${i}. Tag ID ${tagId} may not exist.`,
              details: (tagError as any).message
            });
          }
        }
        console.log(`[API] DATABASE: All ${tags.length} tags inserted successfully ✓`);
      }
    }

    // ===== DATABASE STEP 3: Fetch complete entry with tags =====
    console.log(`[API] DATABASE: Fetching updated entry with tags...`);
    const fullResult = await query(
      `SELECT ke.*, 
              COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category, 'color', t.color)) 
                FILTER (WHERE t.id IS NOT NULL), '[]'::json) as tags
       FROM knowledge_entries ke
       LEFT JOIN entry_tags et ON ke.id = et.entry_id
       LEFT JOIN tags t ON et.tag_id = t.id
       WHERE ke.id = $1
       GROUP BY ke.id;`,
      [entryId]
    );

    if (!fullResult.rows || fullResult.rows.length === 0) {
      console.log(`[API] DATABASE FAILED: Failed to fetch updated entry`);
      return res.status(500).json({ error: "Failed to fetch updated entry" });
    }

    const completeEntry = fullResult.rows[0];
    console.log(`[API] DATABASE: Entry fetched successfully with ${completeEntry.tags.length} tags ✓`);

    res.json(completeEntry);

    // ===== AUTO-BACKUP (non-blocking) =====
    try {
      const { backupToDrive } = await import("./utils/googleDrive.js");
      const allEntriesResult = await query(
        `SELECT ke.*, 
                COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category, 'color', t.color)) 
                  FILTER (WHERE t.id IS NOT NULL), '[]'::json) as tags
         FROM knowledge_entries ke
         LEFT JOIN entry_tags et ON ke.id = et.entry_id
         LEFT JOIN tags t ON et.tag_id = t.id
         WHERE ke.user_id = $1
         GROUP BY ke.id
         ORDER BY ke.created_at DESC;`,
        [userId]
      );
      await backupToDrive(userId, {
        timestamp: new Date().toISOString(),
        entries: allEntriesResult.rows,
      });
      console.log("[Auto-Backup] Successfully backed up to Google Drive");
    } catch (backupError) {
      console.log("[Auto-Backup] Google Drive backup not available:", (backupError as any).message);
    }
  } catch (error) {
    console.error("[API] CRITICAL ERROR in PUT /api/entries/:id:", error);
    console.error("[API] Error stack:", (error as any).stack);
    res.status(500).json({ 
      error: "Internal server error", 
      details: (error as any).message,
      stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
    });
  }
});

app.delete("/api/entries/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entryId = req.params.id;

    console.log(`[API] DELETE /api/entries/${entryId} - Request received`);

    // Check ownership
    const ownerCheck = await query("SELECT user_id FROM knowledge_entries WHERE id = $1;", [entryId]);
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await query("DELETE FROM knowledge_entries WHERE id = $1;", [entryId]);
    res.json({ success: true });

    // Auto-backup to Google Drive (non-blocking)
    try {
      const { backupToDrive } = await import("./utils/googleDrive.js");
      const allEntriesResult = await query(
        `SELECT ke.*, 
                COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category, 'color', t.color)) 
                  FILTER (WHERE t.id IS NOT NULL), '[]'::json) as tags
         FROM knowledge_entries ke
         LEFT JOIN entry_tags et ON ke.id = et.entry_id
         LEFT JOIN tags t ON et.tag_id = t.id
         WHERE ke.user_id = $1
         GROUP BY ke.id
         ORDER BY ke.created_at DESC;`,
        [userId]
      );
      await backupToDrive(userId, {
        timestamp: new Date().toISOString(),
        entries: allEntriesResult.rows,
      });
      console.log("[Auto-Backup] Successfully backed up to Google Drive");
    } catch (backupError) {
      console.log("[Auto-Backup] Google Drive backup not available:", (backupError as any).message);
    }
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Tags endpoint
app.get("/api/tags", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[API] GET /api/tags - Request received');
    const result = await query("SELECT * FROM tags ORDER BY category, name;");
    console.log(`[API] GET /api/tags returned ${result.rows.length} tags`);
    res.json(result.rows);
  } catch (error) {
    console.error("Get tags error:", error);
    res.status(500).json({ error: "Internal server error", details: (error as any).message });
  }
});

// CSV Export endpoint
app.get("/api/entries/export/csv", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    console.log(`[API] GET /api/entries/export/csv - Request received for user ${userId}`);
    
    // Get all entries with tags
    const result = await query(
      `SELECT ke.*, 
              COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category, 'color', t.color)) 
                FILTER (WHERE t.id IS NOT NULL), '[]'::json) as tags
       FROM knowledge_entries ke
       LEFT JOIN entry_tags et ON ke.id = et.entry_id
       LEFT JOIN tags t ON et.tag_id = t.id
       WHERE ke.user_id = $1
       GROUP BY ke.id
       ORDER BY ke.created_at DESC;`,
      [userId]
    );

    console.log(`[API] Found ${result.rows.length} entries for export`);

    // Convert to CSV
    const entries = result.rows;
    const headers = [
      'ID', 'Title', 'Phenomenon', 'Background', 'Judgment', 'Judgment Reason',
      'Alternative Options', 'Future Verification', 'Additional 1', 'Additional 2',
      'Additional 3', 'Additional 4', 'Tags', 'Created At', 'Updated At'
    ];

    const rows = entries.map((entry: any) => [
      entry.id,
      `"${entry.title.replace(/"/g, '""')}"`,
      `"${entry.phenomenon.replace(/"/g, '""')}"`,
      `"${entry.background.replace(/"/g, '""')}"`,
      `"${entry.judgment.replace(/"/g, '""')}"`,
      `"${entry.judgment_reason.replace(/"/g, '""')}"`,
      `"${entry.alternative_options.replace(/"/g, '""')}"`,
      `"${entry.future_verification.replace(/"/g, '""')}"`,
      `"${entry.additional_1.replace(/"/g, '""')}"`,
      `"${entry.additional_2.replace(/"/g, '""')}"`,
      `"${entry.additional_3.replace(/"/g, '""')}"`,
      `"${entry.additional_4.replace(/"/g, '""')}"`,
      `"${entry.tags.map((t: any) => t.name).join(', ')}"`,
      entry.created_at,
      entry.updated_at
    ]);

    const csv = [headers, ...rows].map((row: any) => row.join(',')).join('\n');

    console.log(`[API] CSV generated: ${csv.split('\n').length} lines`);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="knowledge-asset.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Export CSV error:", error);
    res.status(500).json({ error: "Internal server error", details: (error as any).message });
  }
});

// Admin routes
app.use("/api/admin", authMiddleware, adminMiddleware, adminRouter);

// Google Drive routes
app.use("/api/google-drive", authMiddleware, googleDriveRouter);

// Serve static files from dist/client
// In production, __dirname points to dist/server, so we go up one level to dist, then into client
const clientPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../client')
  : path.join(__dirname, '../dist/client');
console.log('[Server] Serving static files from:', clientPath);
app.use(express.static(clientPath));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(clientPath, 'index.html');
  console.log('[Server] SPA fallback: serving', indexPath, 'for route:', req.path);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('[Server] Error sending index.html:', err);
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log("[Server] Initializing database...");
    await initializeDatabase();
    console.log("[Server] Database initialized successfully");

    app.listen(PORT, () => {
      console.log(`[Server] Server is running on port ${PORT}`);
      console.log(`[Server] API URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[Server] Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
