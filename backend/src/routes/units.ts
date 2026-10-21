import { Router, Request, Response } from "express";
import { getDb } from "../database/connection";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// GET /api/units
router.get("/", (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { batch_id } = req.query;
    let query = `
      SELECT u.*, b.batch_number, b.is_recalled, b.recall_reason,
             pt.name as product_name, pt.brand
      FROM units u
      LEFT JOIN batches b ON b.id = u.batch_id
      LEFT JOIN product_types pt ON pt.id = b.product_type_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (batch_id) { query += " AND u.batch_id = ?"; params.push(batch_id); }
    query += " ORDER BY u.created_at DESC";
    const rows = db.prepare(query).all(...params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/units/:id
router.get("/:id", (req: Request, res: Response) => {
  try {
    const db = getDb();
    const unit = db.prepare(`
      SELECT u.*, b.batch_number, b.is_recalled, b.recall_reason,
             b.manufacturing_date, b.expiry_date,
             pt.name as product_name, pt.brand, pt.sku_code
      FROM units u
      LEFT JOIN batches b ON b.id = u.batch_id
      LEFT JOIN product_types pt ON pt.id = b.product_type_id
      WHERE u.id = ?
    `).get(req.params.id);
    if (!unit) return res.status(404).json({ success: false, error: "Unit not found" });

    const transfers = db.prepare(
      "SELECT * FROM transfers WHERE item_id = ? ORDER BY timestamp ASC"
    ).all(req.params.id);

    res.json({ success: true, data: { ...unit as object, transfers } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/units
router.post("/", (req: Request, res: Response) => {
  try {
    const {
      on_chain_id, batch_id, unit_serial,
      manufacturer_address, tx_hash = "", block_number = 0,
    } = req.body;

    if (!batch_id || !unit_serial || !manufacturer_address) {
      return res.status(400).json({
        success: false, error: "Missing: batch_id, unit_serial, manufacturer_address",
      });
    }

    const db = getDb();
    const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(batch_id) as any;
    if (!batch) return res.status(404).json({ success: false, error: "Batch not found" });
    if (batch.is_recalled) return res.status(400).json({ success: false, error: "Cannot add units to recalled batch" });

    const existing = db.prepare(
      "SELECT id FROM units WHERE batch_id = ? AND unit_serial = ?"
    ).get(batch_id, unit_serial);
    if (existing) return res.status(409).json({ success: false, error: "Unit serial already exists in this batch" });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO units
        (id, on_chain_id, batch_id, unit_serial, current_owner, status, registered_at, tx_hash, block_number)
      VALUES (?, ?, ?, ?, ?, 'REGISTERED', ?, ?, ?)
    `).run(id, on_chain_id || "", batch_id, unit_serial, manufacturer_address, Math.floor(Date.now() / 1000), tx_hash, block_number);

    db.prepare(`
      INSERT INTO audit_log (id, event_type, item_id, item_type, actor_address, description, tx_hash, tx_status, timestamp)
      VALUES (?, 'UNIT_REGISTERED', ?, 'unit', ?, ?, ?, 'CONFIRMED', ?)
    `).run(uuidv4(), id, manufacturer_address, `Unit registered: ${unit_serial}`, tx_hash, Math.floor(Date.now() / 1000));

    const created = db.prepare("SELECT * FROM units WHERE id = ?").get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
