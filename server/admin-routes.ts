import { Router, Request, Response } from "express";
import { query } from "./db/connection.js";
import { hashPassword } from "./utils/auth.js";
import { JWTPayload } from "./types.js";

interface AuthRequest extends Request {
  user?: JWTPayload;
}

const router = Router();

// Get all users
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    const result = await query("SELECT id, email, role, created_at FROM users ORDER BY created_at DESC;");
    res.json(result.rows);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create user
router.post("/users", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role } = req.body;

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
    const userRole = role === "admin" ? "admin" : "user";
    const result = await query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at;",
      [email, passwordHash, userRole]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete user
router.delete("/users/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const adminId = req.user!.id;

    // Prevent deleting self
    if (userId === adminId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Check if user exists
    const userCheck = await query("SELECT id FROM users WHERE id = $1;", [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await query("DELETE FROM users WHERE id = $1;", [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user password
router.put("/users/:id/password", async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Check if user exists
    const userCheck = await query("SELECT id FROM users WHERE id = $1;", [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash password and update
    const passwordHash = await hashPassword(password);
    await query("UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;", [passwordHash, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
