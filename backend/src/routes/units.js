const { Router } = require("express");
const { getDb } = require("../database/connection");
const { v4: uuidv4 } = require("uuid");
const router = Router();

router.get("/", (req, res) => {
  try {
    const db = getDb();
    const { batch_id } = req.query;
    let q = `SELECT u.*, b.batch_number, b.is_recalled, b.recall_reason,
             pt.name as product_name, pt.brand FROM units u
             LEFT JOIN batches b ON b.id = u.batch_id
             LEFT JOIN product_types pt ON pt.id = b.product_type_id WHERE 1=1`;
    const p = [];
    if (batch_id) { q += " AND u.batch_id = ?"; p.push(batch_id); }
    q += " ORDER BY u.created_at DESC";
    res.json({ success: true, data: db.prepare(q).all(...p) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:id", (req, res) => {
  try {
    const db = getDb();
    const unit = db.prepare(`
      SELECT u.*, b.batch_number, b.is_recalled, b.recall_reason,
             b.manufacturing_date, b.expiry_date,
             pt.name as product_name, pt.brand, pt.sku_code
      FROM units u LEFT JOIN batches b ON b.id = u.batch_id
      LEFT JOIN product_types pt ON pt.id = b.product_type_id WHERE u.id = ?
    `).get(req.params.id);
    if (!unit) return res.status(404).json({ success: false, error: "Unit not found" });
    const transfers = db.prepare("SELECT * FROM transfers WHERE item_id = ? ORDER BY timestamp").all(req.params.id);
    res.json({ success: true, data: { ...unit, transfers } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", (req, res) => {
  try {
    const { on_chain_id = "", batch_id, unit_serial, manufacturer_address, tx_hash = "", block_number = 0 } = req.body;
    if (!batch_id || !unit_serial || !manufacturer_address)
      return res.status(400).json({ success: false, error: "Missing: batch_id, unit_serial, manufacturer_address" });
    const db = getDb();
    const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(batch_id);
    if (!batch) return res.status(404).json({ success: false, error: "Batch not found" });
    if (batch.is_recalled) return res.status(400).json({ success: false, error: "Cannot add units to recalled batch" });
    if (db.prepare("SELECT id FROM units WHERE batch_id = ? AND unit_serial = ?").get(batch_id, unit_serial))
      return res.status(409).json({ success: false, error: "Unit serial already exists in this batch" });
    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`INSERT INTO units (id,on_chain_id,batch_id,unit_serial,current_owner,status,registered_at,tx_hash,block_number)
      VALUES (?,?,?,?,?,'REGISTERED',?,?,?)`)
      .run(id,on_chain_id,batch_id,unit_serial,manufacturer_address,now,tx_hash,block_number);
    db.prepare(`INSERT INTO audit_log (id,event_type,item_id,item_type,actor_address,description,tx_hash,tx_status,timestamp)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(uuidv4(),"UNIT_REGISTERED",id,"unit",manufacturer_address,`Unit: ${unit_serial}`,tx_hash,"CONFIRMED",now);
    res.status(201).json({ success: true, data: db.prepare("SELECT * FROM units WHERE id = ?").get(id) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
