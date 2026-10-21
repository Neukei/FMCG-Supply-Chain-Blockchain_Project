const { Router } = require("express");
const { getDb } = require("../database/connection");
const router = Router();

router.get("/", (req, res) => {
  try {
    const db = getDb();
    const { event_type, item_type, page = "1", limit = "50" } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let q = "SELECT * FROM audit_log WHERE 1=1";
    const p = [];
    if (event_type) { q += " AND event_type = ?"; p.push(event_type); }
    if (item_type)  { q += " AND item_type = ?";  p.push(item_type); }
    const total = db.prepare(q.replace("SELECT *","SELECT COUNT(*) as c")).get(...p).c;
    q += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    p.push(parseInt(limit), offset);
    res.json({ success: true, data: db.prepare(q).all(...p),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total/parseInt(limit)) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/recent", (_req, res) => {
  try {
    res.json({ success: true, data: getDb().prepare("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 20").all() });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
