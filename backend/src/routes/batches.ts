import { Router, Request, Response } from "express";
import { getDb } from "../database/connection";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// GET /api/batches
router.get("/", (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { product_type_id, status, recalled } = req.query;

    let query = `
      SELECT b.*, pt.name as product_name, pt.brand, pt.sku_code,
             COUNT(DISTINCT u.id) as unit_count
      FROM batches b
      LEFT JOIN product_types pt ON pt.id = b.product_type_id
      LEFT JOIN units u ON u.batch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (product_type_id) { query += " AND b.product_type_id = ?"; params.push(product_type_id); }
    if (status)          { query += " AND b.status = ?"; params.push(status); }
    if (recalled !== undefined) { query += " AND b.is_recalled = ?"; params.push(recalled === "true" ? 1 : 0); }

    query += " GROUP BY b.id ORDER BY b.created_at DESC";

    const rows = db.prepare(query).all(...params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/batches/expiry-alerts
router.get("/expiry-alerts", (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const thirtyDays = now + 30 * 24 * 3600;

    const rows = db.prepare(`
      SELECT b.*, pt.name as product_name, pt.brand, pt.sku_code
      FROM batches b
      LEFT JOIN product_types pt ON pt.id = b.product_type_id
      WHERE b.expiry_date > 0
        AND b.expiry_date <= ?
        AND b.is_recalled = 0
        AND b.status NOT IN ('SOLD', 'DELIVERED', 'RECALLED', 'EXPIRED')
      ORDER BY b.expiry_date ASC
    `).all(thirtyDays);

    const enriched = rows.map((b: any) => ({
      ...b,
      is_expired: b.expiry_date < now,
      days_until_expiry: Math.ceil((b.expiry_date - now) / 86400),
    }));

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/batches/:id
router.get("/:id", (req: Request, res: Response) => {
  try {
    const db = getDb();
    const batch = db.prepare(`
      SELECT b.*, pt.name as product_name, pt.brand, pt.sku_code, pt.category
      FROM batches b
      LEFT JOIN product_types pt ON pt.id = b.product_type_id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!batch) return res.status(404).json({ success: false, error: "Batch not found" });

    const units = db.prepare(
      "SELECT * FROM units WHERE batch_id = ? ORDER BY created_at ASC"
    ).all(req.params.id);

    const transfers = db.prepare(
      "SELECT * FROM transfers WHERE item_id = ? ORDER BY timestamp ASC"
    ).all(req.params.id);

    const events = db.prepare(
      "SELECT * FROM lifecycle_events WHERE item_id = ? ORDER BY timestamp ASC"
    ).all(req.params.id);

    res.json({ success: true, data: { ...batch as object, units, transfers, lifecycle_events: events } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/batches
router.post("/", (req: Request, res: Response) => {
  try {
    const {
      on_chain_id, product_type_id, batch_number,
      manufacturer_address, manufacturing_date, expiry_date = 0,
      quantity, packaging_type = "",
      tx_hash = "", block_number = 0,
    } = req.body;

    if (!product_type_id || !batch_number || !manufacturer_address || !manufacturing_date || !quantity) {
      return res.status(400).json({
        success: false,
        error: "Missing required: product_type_id, batch_number, manufacturer_address, manufacturing_date, quantity",
      });
    }

    const db = getDb();
    const product = db.prepare("SELECT id FROM product_types WHERE id = ?").get(product_type_id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product type not found" });
    }

    const existing = db.prepare("SELECT id FROM batches WHERE batch_number = ?").get(batch_number);
    if (existing) {
      return res.status(409).json({ success: false, error: "Batch number already exists" });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO batches
        (id, on_chain_id, product_type_id, batch_number, manufacturer_address,
         manufacturing_date, expiry_date, quantity, packaging_type,
         current_owner, status, registered_at, tx_hash, block_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REGISTERED', ?, ?, ?)
    `).run(
      id, on_chain_id || "", product_type_id, batch_number, manufacturer_address,
      manufacturing_date, expiry_date, quantity, packaging_type,
      manufacturer_address, Math.floor(Date.now() / 1000), tx_hash, block_number
    );

    db.prepare(`
      INSERT INTO audit_log (id, event_type, item_id, item_type, actor_address, description, tx_hash, tx_status, timestamp)
      VALUES (?, 'BATCH_REGISTERED', ?, 'batch', ?, ?, ?, 'CONFIRMED', ?)
    `).run(uuidv4(), id, manufacturer_address, `Batch registered: ${batch_number}`, tx_hash, Math.floor(Date.now() / 1000));

    const created = db.prepare("SELECT * FROM batches WHERE id = ?").get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/batches/:id/recall
router.patch("/:id/recall", (req: Request, res: Response) => {
  try {
    const { reason, actor_address, tx_hash = "" } = req.body;
    if (!reason) return res.status(400).json({ success: false, error: "reason is required" });

    const db = getDb();
    const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(req.params.id) as any;
    if (!batch) return res.status(404).json({ success: false, error: "Batch not found" });

    db.prepare(`
      UPDATE batches SET is_recalled = 1, recall_reason = ?, status = 'RECALLED', tx_hash = ?
      WHERE id = ?
    `).run(reason, tx_hash, req.params.id);

    db.prepare(`
      INSERT INTO audit_log (id, event_type, item_id, item_type, actor_address, description, tx_hash, tx_status, timestamp)
      VALUES (?, 'BATCH_RECALLED', ?, 'batch', ?, ?, ?, 'CONFIRMED', ?)
    `).run(uuidv4(), req.params.id, actor_address || "unknown", `Batch recalled: ${reason}`, tx_hash, Math.floor(Date.now() / 1000));

    res.json({ success: true, message: "Batch recalled" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/batches/:id/status
router.patch("/:id/status", (req: Request, res: Response) => {
  try {
    const { status, actor_address, tx_hash = "", block_number = 0 } = req.body;
    if (!status) return res.status(400).json({ success: false, error: "status is required" });

    const db = getDb();
    const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(req.params.id) as any;
    if (!batch) return res.status(404).json({ success: false, error: "Batch not found" });

    const oldStatus = batch.status;
    db.prepare("UPDATE batches SET status = ? WHERE id = ?").run(status, req.params.id);

    db.prepare(`
      INSERT INTO lifecycle_events
        (id, item_id, item_type, old_status, new_status, updated_by, timestamp, tx_hash, block_number)
      VALUES (?, ?, 'batch', ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.params.id, oldStatus, status, actor_address || "unknown", Math.floor(Date.now() / 1000), tx_hash, block_number);

    res.json({ success: true, message: "Status updated" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
