const { Router } = require("express");
const { getDb } = require("../database/connection");
const router = Router();

router.get("/stats", (_req, res) => {
  try {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const d30 = now + 30 * 86400;
    const g = (q, ...p) => db.prepare(q).get(...p);
    res.json({ success: true, data: {
      totals: {
        products: g("SELECT COUNT(*) as c FROM product_types").c,
        batches: g("SELECT COUNT(*) as c FROM batches").c,
        units: g("SELECT COUNT(*) as c FROM units").c,
        transfers: g("SELECT COUNT(*) as c FROM transfers").c,
        participants: g("SELECT COUNT(*) as c FROM participants").c,
      },
      alerts: {
        recalled: g("SELECT COUNT(*) as c FROM batches WHERE is_recalled=1").c,
        near_expiry: g("SELECT COUNT(*) as c FROM batches WHERE expiry_date>0 AND expiry_date<=? AND expiry_date>? AND is_recalled=0 AND status NOT IN ('SOLD','DELIVERED','RECALLED','EXPIRED')", d30, now).c,
        expired: g("SELECT COUNT(*) as c FROM batches WHERE expiry_date>0 AND expiry_date<? AND is_recalled=0", now).c,
        in_transit: g("SELECT COUNT(*) as c FROM batches WHERE status='IN_TRANSIT'").c,
      },
      recent_activity: db.prepare("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10").all(),
      batch_status_breakdown: db.prepare("SELECT status, COUNT(*) as count FROM batches GROUP BY status").all(),
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
