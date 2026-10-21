import { Router, Request, Response } from "express";
import { getDb } from "../database/connection";

const router = Router();

// GET /api/audit — audit log with pagination
router.get("/", (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { event_type, actor, item_type, page = "1", limit = "50" } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = "SELECT * FROM audit_log WHERE 1=1";
    const params: any[] = [];

    if (event_type) { query += " AND event_type = ?";  params.push(event_type); }
    if (actor)      { query += " AND actor_address = ?"; params.push(actor); }
    if (item_type)  { query += " AND item_type = ?";    params.push(item_type); }

    const totalRow = db.prepare(query.replace("SELECT *", "SELECT COUNT(*) as count")).get(...params) as any;
    const total = totalRow?.count || 0;

    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit as string), offset);

    const rows = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/audit/recent
router.get("/recent", (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 20"
    ).all();
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
