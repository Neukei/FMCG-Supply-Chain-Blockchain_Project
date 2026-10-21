import { Router, Request, Response } from "express";
import { getDb } from "../database/connection";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// GET /api/transfers
router.get("/", (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { item_id, item_type } = req.query;
    let query = "SELECT * FROM transfers WHERE 1=1";
    const params: any[] = [];
    if (item_id)   { query += " AND item_id = ?";   params.push(item_id); }
    if (item_type) { query += " AND item_type = ?";  params.push(item_type); }
    query += " ORDER BY timestamp DESC";
    const rows = db.prepare(query).all(...params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/transfers — record an ownership transfer
router.post("/", (req: Request, res: Response) => {
  try {
    const {
      item_id, item_type, // 'batch' or 'unit'
      from_address, to_address,
      shipment_ref = "", status_after,
      tx_hash = "", block_number = 0,
      timestamp,
    } = req.body;

    if (!item_id || !item_type || !from_address || !to_address || !status_after) {
      return res.status(400).json({
        success: false,
        error: "Missing: item_id, item_type, from_address, to_address, status_after",
      });
    }

    const db = getDb();
    const id = uuidv4();
    const ts = timestamp || Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO transfers
        (id, item_id, item_type, from_address, to_address, shipment_ref, status_after, timestamp, tx_hash, block_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, item_id, item_type, from_address, to_address, shipment_ref, status_after, ts, tx_hash, block_number);

    // Update current owner in the relevant table
    if (item_type === "batch") {
      db.prepare("UPDATE batches SET current_owner = ?, status = ? WHERE id = ?")
        .run(to_address, status_after, item_id);
    } else if (item_type === "unit") {
      db.prepare("UPDATE units SET current_owner = ?, status = ? WHERE id = ?")
        .run(to_address, status_after, item_id);
    }

    db.prepare(`
      INSERT INTO audit_log (id, event_type, item_id, item_type, actor_address, description, tx_hash, tx_status, timestamp)
      VALUES (?, 'OWNERSHIP_TRANSFERRED', ?, ?, ?, ?, ?, 'CONFIRMED', ?)
    `).run(
      uuidv4(), item_id, item_type, from_address,
      `Transfer: ${from_address.substring(0,10)}... → ${to_address.substring(0,10)}... (${shipment_ref || 'no ref'})`,
      tx_hash, ts
    );

    const created = db.prepare("SELECT * FROM transfers WHERE id = ?").get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
