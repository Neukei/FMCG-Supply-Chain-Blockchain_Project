import { Router, Request, Response } from "express";
import { getDb } from "../database/connection";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const thirtyDays = now + 30 * 24 * 3600;

    const productCount = (db.prepare("SELECT COUNT(*) as c FROM product_types").get() as any).c;
    const batchCount   = (db.prepare("SELECT COUNT(*) as c FROM batches").get() as any).c;
    const unitCount    = (db.prepare("SELECT COUNT(*) as c FROM units").get() as any).c;
    const transferCount = (db.prepare("SELECT COUNT(*) as c FROM transfers").get() as any).c;
    const participantCount = (db.prepare("SELECT COUNT(*) as c FROM participants").get() as any).c;

    const recalledCount = (db.prepare(
      "SELECT COUNT(*) as c FROM batches WHERE is_recalled = 1"
    ).get() as any).c;

    const nearExpiryCount = (db.prepare(`
      SELECT COUNT(*) as c FROM batches
      WHERE expiry_date > 0 AND expiry_date <= ? AND expiry_date > ? AND is_recalled = 0
        AND status NOT IN ('SOLD', 'DELIVERED', 'RECALLED', 'EXPIRED')
    `).get(thirtyDays, now) as any).c;

    const expiredCount = (db.prepare(`
      SELECT COUNT(*) as c FROM batches
      WHERE expiry_date > 0 AND expiry_date < ? AND is_recalled = 0
    `).get(now) as any).c;

    const inTransitCount = (db.prepare(
      "SELECT COUNT(*) as c FROM batches WHERE status = 'IN_TRANSIT'"
    ).get() as any).c;

    const recentActivity = db.prepare(
      "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10"
    ).all();

    const statusBreakdown = db.prepare(`
      SELECT status, COUNT(*) as count FROM batches GROUP BY status
    `).all();

    res.json({
      success: true,
      data: {
        totals: {
          products: productCount,
          batches: batchCount,
          units: unitCount,
          transfers: transferCount,
          participants: participantCount,
        },
        alerts: {
          recalled: recalledCount,
          near_expiry: nearExpiryCount,
          expired: expiredCount,
          in_transit: inTransitCount,
        },
        recent_activity: recentActivity,
        batch_status_breakdown: statusBreakdown,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
