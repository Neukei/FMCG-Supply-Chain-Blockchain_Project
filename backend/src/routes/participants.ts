import { Router, Request, Response } from "express";
import { getDb } from "../database/connection";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// GET /api/participants
router.get("/", (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM participants ORDER BY created_at DESC").all();
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/participants/:address
router.get("/:address", (req: Request, res: Response) => {
  try {
    const db = getDb();
    const p = db.prepare("SELECT * FROM participants WHERE wallet_address = ?").get(req.params.address.toLowerCase());
    if (!p) return res.status(404).json({ success: false, error: "Participant not found" });
    res.json({ success: true, data: p });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/participants
router.post("/", (req: Request, res: Response) => {
  try {
    const { wallet_address, name, role, company = "", email = "" } = req.body;
    if (!wallet_address || !name || !role) {
      return res.status(400).json({ success: false, error: "Missing: wallet_address, name, role" });
    }

    const validRoles = ["ADMIN", "MANUFACTURER", "DISTRIBUTOR", "WAREHOUSE", "RETAILER", "CUSTOMER"];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM participants WHERE wallet_address = ?").get(wallet_address.toLowerCase());
    if (existing) return res.status(409).json({ success: false, error: "Participant with this wallet already exists" });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO participants (id, wallet_address, name, role, company, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, wallet_address.toLowerCase(), name, role.toUpperCase(), company, email);

    const created = db.prepare("SELECT * FROM participants WHERE id = ?").get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/participants/:id
router.patch("/:id", (req: Request, res: Response) => {
  try {
    const { name, company, email, is_active } = req.body;
    const db = getDb();
    const p = db.prepare("SELECT * FROM participants WHERE id = ?").get(req.params.id);
    if (!p) return res.status(404).json({ success: false, error: "Participant not found" });

    db.prepare(`
      UPDATE participants SET name = COALESCE(?, name), company = COALESCE(?, company),
        email = COALESCE(?, email), is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name, company, email, is_active, req.params.id);

    const updated = db.prepare("SELECT * FROM participants WHERE id = ?").get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
