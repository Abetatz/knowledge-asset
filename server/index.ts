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

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const result = await query("SELECT id, email, password_hash, role FROM users WHERE email = $1;", [email]);
    if (result.rows.length === 0) {
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

    res.json(result.rows);
  } catch (error) {
    console.error("Get entries error:", error);
    res.status(500).json({ error: "Internal server error" });
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
    } = req.body as KnowledgeEntryRequest;

    // Validate required fields
    if (!title || !phenomenon || !background || !judgment || !judgment_reason || !alternative_options || !future_verification) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert entry
    const result = await query(
      `INSERT INTO knowledge_entries 
       (user_id, title, phenomenon, background, judgment, judgment_reason, alternative_options, future_verification, additional_1, additional_2, additional_3, additional_4)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *;`,
      [
        userId,
        title,
        phenomenon,
        background,
        judgment,
        judgment_reason,
        alternative_options,
        future_verification,
        additional_1 || "",
        additional_2 || "",
        additional_3 || "",
        additional_4 || "",
      ]
    );

    const entry = result.rows[0];

    // Add tags
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await query("INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2);", [entry.id, tagId]);
      }
    }

    // Fetch entry with tags
    const fullResult = await query(
      `SELECT ke.*, 
              json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category, 'color', t.color)) as tags
       FROM knowledge_entries ke
       LEFT JOIN entry_tags et ON ke.id = et.entry_id
       LEFT JOIN tags t ON et.tag_id = t.id
       WHERE ke.id = $1
       GROUP BY ke.id;`,
      [entry.id]
    );

    res.status(201).json(fullResult.rows[0]);
  } catch (error) {
    console.error("Create entry error:", error);
    res.status(500).json({ error: "Internal server error" });
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
    } = req.body as KnowledgeEntryRequest;

    // Check ownership
    const ownerCheck = await query("SELECT user_id FROM knowledge_entries WHERE id = $1;", [entryId]);
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Update entry
    const result = await query(
      `UPDATE knowledge_entries 
       SET title = $1, phenomenon = $2, background = $3, judgment = $4, judgment_reason = $5, 
           alternative_options = $6, future_verification = $7, additional_1 = $8, additional_2 = $9, 
           additional_3 = $10, additional_4 = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *;`,
      [
        title,
        phenomenon,
        background,
        judgment,
        judgment_reason,
        alternative_options,
        future_verification,
        additional_1 || "",
        additional_2 || "",
        additional_3 || "",
        additional_4 || "",
        entryId,
      ]
    );

    // Update tags
    await query("DELETE FROM entry_tags WHERE entry_id = $1;", [entryId]);
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await query("INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2);", [entryId, tagId]);
      }
    }

    // Fetch updated entry with tags
    const fullResult = await query(
      `SELECT ke.*, 
              json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category, 'color', t.color)) as tags
       FROM knowledge_entries ke
       LEFT JOIN entry_tags et ON ke.id = et.entry_id
       LEFT JOIN tags t ON et.tag_id = t.id
       WHERE ke.id = $1
       GROUP BY ke.id;`,
      [entryId]
    );

    res.json(fullResult.rows[0]);
  } catch (error) {
    console.error("Update entry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/entries/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entryId = req.params.id;

    // Check ownership
    const ownerCheck = await query("SELECT user_id FROM knowledge_entries WHERE id = $1;", [entryId]);
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await query("DELETE FROM knowledge_entries WHERE id = $1;", [entryId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Tags endpoint
app.get("/api/tags", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query("SELECT * FROM tags ORDER BY category, name;");
    res.json(result.rows);
  } catch (error) {
    console.error("Get tags error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin routes
app.use("/api/admin", authMiddleware, adminMiddleware, adminRouter);

// Google Drive routes
app.use("/api/google-drive", authMiddleware, googleDriveRouter);

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Serve static files from dist/client
const staticPath = path.join(__dirname, "../client");
console.log("[Server] Static path:", staticPath);
app.use(express.static(staticPath));

// SPA fallback - serve index.html for all non-API routes
app.get("*", (req: Request, res: Response) => {
  const indexPath = path.join(staticPath, "index.html");
  console.log("[Server] Serving index.html from:", indexPath);
  res.sendFile(indexPath);
});

// Initialize database and start server
async function startServer() {
  try {
    console.log("[Server] Initializing database...");
    await initializeDatabase();
    console.log("[Server] Database initialized successfully");
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Server] Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Server] Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
