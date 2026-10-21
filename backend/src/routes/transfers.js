const { Router } = require("express");
const { getDb } = require("../database/connection");
const { v4: uuidv4 } = require("uuid");
const router = Router();

router.get("/", (req, res) => {
  try {
    const db = getDb();
    const { item_id, item_type } = req.query;
    let q = "SELECT * FROM transfers WHERE 1=1";
    const p = [];
    if (item_id)   { q += " AND item_id = ?";   p.push(item_id); }
    if (item_type) { q += " AND item_type = ?";  p.push(item_type); }
    q += " ORDER BY timestamp DESC";
    res.json({ success: true, data: db.prepare(q).all(...p) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", (req, res) => {
  try {
    const { item_id, item_type, from_address, to_address, shipment_ref = "",
      status_after, tx_hash = "", block_number = 0, timestamp } = req.body;
    if (!item_id || !item_type || !from_address || !to_address || !status_after)
      return res.status(400).json({ success: false, error: "Missing required fields" });
    const db = getDb();
    const id = uuidv4();
    const ts = timestamp || Math.floor(Date.now() / 1000);
    db.prepare(`INSERT INTO transfers (id,item_id,item_type,from_address,to_address,shipment_ref,status_after,timestamp,tx_hash,block_number)
      VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(id,item_id,item_type,from_address,to_address,shipment_ref,status_after,ts,tx_hash,block_number);
    if (item_type === "batch")
      db.prepare("UPDATE batches SET current_owner=?,status=? WHERE id=?").run(to_address,status_after,item_id);
    else if (item_type === "unit")
      db.prepare("UPDATE units SET current_owner=?,status=? WHERE id=?").run(to_address,status_after,item_id);
    db.prepare(`INSERT INTO audit_log (id,event_type,item_id,item_type,actor_address,description,tx_hash,tx_status,timestamp)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(uuidv4(),"OWNERSHIP_TRANSFERRED",item_id,item_type,from_address,
           `${from_address.substring(0,10)}→${to_address.substring(0,10)} (${shipment_ref||'no ref'})`,tx_hash,"CONFIRMED",ts);
    res.status(201).json({ success: true, data: db.prepare("SELECT * FROM transfers WHERE id = ?").get(id) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
