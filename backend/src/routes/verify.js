const { Router } = require("express");
const { getDb } = require("../database/connection");
const QRCode = require("qrcode");
const router = Router();

const LIMITATION = "This record is verified on the blockchain. However, blockchain records cannot prove the physical product is genuine. A copied identifier could be placed on a counterfeit product. Dates reflect what was reported by the registered manufacturer.";

router.get("/qr/:id", async (req, res) => {
  try {
    const url = `${process.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/verify/${req.params.id}`;
    const buf = await QRCode.toBuffer(url, { type: "png", errorCorrectionLevel: "H", width: 300 });
    res.setHeader("Content-Type", "image/png");
    res.send(buf);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const url = `${process.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/verify/${id}`;
    const qrCode = await QRCode.toDataURL(url, { errorCorrectionLevel: "H" });

    // Try batch
    const batch = db.prepare(`
      SELECT b.*, pt.name as product_name, pt.brand, pt.sku_code, pt.category, pt.manufacturer_name, pt.description
      FROM batches b LEFT JOIN product_types pt ON pt.id = b.product_type_id WHERE b.id = ?
    `).get(id);
    if (batch) {
      const transfers = db.prepare("SELECT * FROM transfers WHERE item_id = ? ORDER BY timestamp").all(id);
      const events = db.prepare("SELECT * FROM lifecycle_events WHERE item_id = ? ORDER BY timestamp").all(id);
      return res.json({ success: true, type: "batch",
        data: { ...batch, transfers, lifecycle_events: events, qr_code: qrCode, verify_url: url },
        limitation_notice: LIMITATION });
    }

    // Try unit
    const unit = db.prepare(`
      SELECT u.*, b.batch_number, b.is_recalled, b.recall_reason,
             b.manufacturing_date, b.expiry_date, b.status as batch_status,
             pt.name as product_name, pt.brand, pt.sku_code, pt.category, pt.manufacturer_name
      FROM units u LEFT JOIN batches b ON b.id = u.batch_id
      LEFT JOIN product_types pt ON pt.id = b.product_type_id WHERE u.id = ?
    `).get(id);
    if (unit) {
      const transfers = db.prepare("SELECT * FROM transfers WHERE item_id = ? ORDER BY timestamp").all(id);
      const effective_status = unit.is_recalled ? "RECALLED" : unit.status;
      return res.json({ success: true, type: "unit",
        data: { ...unit, effective_status, transfers, qr_code: qrCode, verify_url: url },
        limitation_notice: LIMITATION });
    }

    res.status(404).json({ success: false, error: "No product or unit found with this identifier" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
