import { Router, Request, Response } from "express";
import { getAuthUrl, handleAuthCallback, backupToDrive, exportToCSV, getOAuth2ClientForUser } from "../utils/googleDrive.js";
import { query } from "../db/connection.js";
import { JWTPayload } from "../types.js";

const router = Router();

interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Get Google Drive auth URL
router.get("/auth-url", (req: Request, res: Response) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error("Error getting auth URL:", error);
    res.status(500).json({ error: "Failed to get auth URL" });
  }
});

// Handle Google Drive callback
router.post("/callback", async (req: AuthRequest, res: Response) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: "Missing code or userId" });
    }

    await handleAuthCallback(code, userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error handling callback:", error);
    res.status(500).json({ error: "Failed to handle callback" });
  }
});

// Check if Google Drive is connected
router.get("/status", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await query(
      "SELECT id FROM google_drive_tokens WHERE user_id = $1;",
      [userId]
    );

    res.json({ connected: result.rows.length > 0 });
  } catch (error) {
    console.error("Error checking status:", error);
    res.status(500).json({ error: "Failed to check status" });
  }
});

// Backup entries to Google Drive
router.post("/backup", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get all entries for user
    const entriesResult = await query(
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

    const entries = entriesResult.rows;

    // Backup to Google Drive
    await backupToDrive(userId, {
      timestamp: new Date().toISOString(),
      entries,
    });

    res.json({ success: true, entriesCount: entries.length });
  } catch (error) {
    console.error("Error backing up:", error);
    res.status(500).json({ error: "Failed to backup" });
  }
});

// Export entries as CSV
router.get("/export-csv", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get all entries for user
    const entriesResult = await query(
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

    const entries = entriesResult.rows;
    const csv = await exportToCSV(entries);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="knowledge-asset-export-${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

export default router;
