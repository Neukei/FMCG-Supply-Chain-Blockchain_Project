const { Router } = require("express");
const { getDb } = require("../database/connection");
const { v4: uuidv4 } = require("uuid");
const router = Router();

router.get("/", (req, res) => {
  try {
    const db = getDb();
    const { product_type_id, status, recalled } = req.query;
    let q = `SELECT b.*, pt.name as product_name, pt.brand, pt.sku_code,
             COUNT(DISTINCT u.id) as unit_count
             FROM batches b
             LEFT JOIN product_types pt ON pt.id = b.product_type_id
             LEFT JOIN units u ON u.batch_id = b.id WHERE 1=1`;
    const p = [];
    if (product_type_id) { q += " AND b.product_type_id = ?"; p.push(product_type_id); }
    if (status)          { q += " AND b.status = ?"; p.push(status); }
    if (recalled !== undefined) { q += " AND b.is_recalled = ?"; p.push(recalled === "true" ? 1 : 0); }
    q += " GROUP BY b.id ORDER BY b.created_at DESC";
    res.json({ success: true, data: db.prepare(q).all(...p) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/expiry-alerts", (_req, res) => {
  try {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const d30 = now + 30 * 86400;
    const rows = db.prepare(`
      SELECT b.*, pt.name as product_name, pt.brand, pt.sku_code FROM batches b
      LEFT JOIN product_types pt ON pt.id = b.product_type_id
      WHERE b.expiry_date > 0 AND b.expiry_date <= ? AND b.is_recalled = 0
      AND b.status NOT IN ('SOLD','DELIVERED','RECALLED','EXPIRED') ORDER BY b.expiry_date ASC
    `).all(d30);
    res.json({ success: true, data: rows.map(b => ({
      ...b, is_expired: b.expiry_date < now,
      days_until_expiry: Math.ceil((b.expiry_date - now) / 86400)
    }))});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:id", (req, res) => {
  try {
    const db = getDb();
    const batch = db.prepare(`
      SELECT b.*, pt.name as product_name, pt.brand, pt.sku_code, pt.category
      FROM batches b LEFT JOIN product_types pt ON pt.id = b.product_type_id WHERE b.id = ?
    `).get(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: "Batch not found" });
    const units = db.prepare("SELECT * FROM units WHERE batch_id = ? ORDER BY created_at").all(req.params.id);
    const transfers = db.prepare("SELECT * FROM transfers WHERE item_id = ? ORDER BY timestamp").all(req.params.id);
    const events = db.prepare("SELECT * FROM lifecycle_events WHERE item_id = ? ORDER BY timestamp").all(req.params.id);
    res.json({ success: true, data: { ...batch, units, transfers, lifecycle_events: events } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", (req, res) => {
  try {
    const { on_chain_id = "", product_type_id, batch_number, manufacturer_address,
      manufacturing_date, expiry_date = 0, quantity, packaging_type = "",
      tx_hash = "", block_number = 0 } = req.body;
    if (!product_type_id || !batch_number || !manufacturer_address || !manufacturing_date || !quantity)
      return res.status(400).json({ success: false, error: "Missing required fields" });
    const db = getDb();
    if (!db.prepare("SELECT id FROM product_types WHERE id = ?").get(product_type_id))
      return res.status(404).json({ success: false, error: "Product type not found" });
    if (db.prepare("SELECT id FROM batches WHERE batch_number = ?").get(batch_number))
      return res.status(409).json({ success: false, error: "Batch number already exists" });
    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`INSERT INTO batches (id,on_chain_id,product_type_id,batch_number,manufacturer_address,
      manufacturing_date,expiry_date,quantity,packaging_type,current_owner,status,registered_at,tx_hash,block_number)
      VALUES (?,?,?,?,?,?,?,?,?,?,'REGISTERED',?,?,?)`)
      .run(id,on_chain_id,product_type_id,batch_number,manufacturer_address,
           manufacturing_date,expiry_date,quantity,packaging_type,manufacturer_address,now,tx_hash,block_number);
    db.prepare(`INSERT INTO audit_log (id,event_type,item_id,item_type,actor_address,description,tx_hash,tx_status,timestamp)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(uuidv4(),"BATCH_REGISTERED",id,"batch",manufacturer_address,`Batch: ${batch_number}`,tx_hash,"CONFIRMED",now);
    res.status(201).json({ success: true, data: db.prepare("SELECT * FROM batches WHERE id = ?").get(id) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/:id/recall", (req, res) => {
  try {
    const { reason, actor_address, tx_hash = "" } = req.body;
    if (!reason) return res.status(400).json({ success: false, error: "reason required" });
    const db = getDb();
    if (!db.prepare("SELECT id FROM batches WHERE id = ?").get(req.params.id))
      return res.status(404).json({ success: false, error: "Batch not found" });
    const now = Math.floor(Date.now() / 1000);
    db.prepare("UPDATE batches SET is_recalled=1,recall_reason=?,status='RECALLED',tx_hash=? WHERE id=?")
      .run(reason, tx_hash, req.params.id);
    db.prepare(`INSERT INTO audit_log (id,event_type,item_id,item_type,actor_address,description,tx_hash,tx_status,timestamp)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(uuidv4(),"BATCH_RECALLED",req.params.id,"batch",actor_address||"unknown",`Recalled: ${reason}`,tx_hash,"CONFIRMED",now);
    res.json({ success: true, message: "Batch recalled" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/:id/status", (req, res) => {
  try {
    const { status, actor_address, tx_hash = "", block_number = 0 } = req.body;
    if (!status) return res.status(400).json({ success: false, error: "status required" });
    const db = getDb();
    const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: "Batch not found" });
    const now = Math.floor(Date.now() / 1000);
    db.prepare("UPDATE batches SET status = ? WHERE id = ?").run(status, req.params.id);
    db.prepare(`INSERT INTO lifecycle_events (id,item_id,item_type,old_status,new_status,updated_by,timestamp,tx_hash,block_number)
      VALUES (?,?,'batch',?,?,?,?,?,?)`)
      .run(uuidv4(),req.params.id,batch.status,status,actor_address||"unknown",now,tx_hash,block_number);
    res.json({ success: true, message: "Status updated" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
