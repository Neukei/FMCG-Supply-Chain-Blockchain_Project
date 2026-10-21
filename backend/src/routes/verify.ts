import { Router, Request, Response } from "express";
import { getDb } from "../database/connection";
import QRCode from "qrcode";

const router = Router();

/**
 * GET /api/verify/:id
 * Public endpoint — no authentication required.
 * Allows anyone (including customers without a wallet) to verify a product.
 *
 * :id can be a batch database ID or a unit database ID.
 *
 * IMPORTANT LIMITATION NOTICE:
 * This endpoint verifies that a RECORD exists in the system.
 * It does NOT prove the physical product is genuine.
 * A copied QR code could be placed on a counterfeit product.
 * Blockchain records are only as accurate as the data entered by participants.
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    // Try batch first
    let batch = db.prepare(`
      SELECT b.*, pt.name as product_name, pt.brand, pt.sku_code, pt.category,
             pt.manufacturer_name, pt.description
      FROM batches b
      LEFT JOIN product_types pt ON pt.id = b.product_type_id
      WHERE b.id = ?
    `).get(id) as any;

    if (batch) {
      const transfers = db.prepare(
        "SELECT * FROM transfers WHERE item_id = ? ORDER BY timestamp ASC"
      ).all(id);
      const events = db.prepare(
        "SELECT * FROM lifecycle_events WHERE item_id = ? ORDER BY timestamp ASC"
      ).all(id);

      // Generate QR code as data URL
      const verifyUrl = `${process.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/verify/${id}`;
      const qrCode = await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: "H" });

      return res.json({
        success: true,
        type: "batch",
        data: {
          ...batch,
          transfers,
          lifecycle_events: events,
          qr_code: qrCode,
          verify_url: verifyUrl,
        },
        limitation_notice:
          "This record is verified on the blockchain. However, blockchain records cannot prove " +
          "that the physical product is genuine. A copied identifier could be placed on a counterfeit product. " +
          "Expiry and manufacturing dates reflect what was reported by the registered manufacturer.",
      });
    }

    // Try unit
    let unit = db.prepare(`
      SELECT u.*, b.batch_number, b.is_recalled, b.recall_reason,
             b.manufacturing_date, b.expiry_date, b.status as batch_status,
             pt.name as product_name, pt.brand, pt.sku_code, pt.category,
             pt.manufacturer_name
      FROM units u
      LEFT JOIN batches b ON b.id = u.batch_id
      LEFT JOIN product_types pt ON pt.id = b.product_type_id
      WHERE u.id = ?
    `).get(id) as any;

    if (unit) {
      const transfers = db.prepare(
        "SELECT * FROM transfers WHERE item_id = ? ORDER BY timestamp ASC"
      ).all(id);

      const verifyUrl = `${process.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/verify/${id}`;
      const qrCode = await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: "H" });

      // Effective status: if batch is recalled, unit inherits RECALLED
      const effectiveStatus = unit.is_recalled ? "RECALLED" : unit.status;

      return res.json({
        success: true,
        type: "unit",
        data: {
          ...unit,
          effective_status: effectiveStatus,
          transfers,
          qr_code: qrCode,
          verify_url: verifyUrl,
        },
        limitation_notice:
          "This record is verified on the blockchain. However, blockchain records cannot prove " +
          "that the physical product is genuine. A copied identifier could be placed on a counterfeit product.",
      });
    }

    return res.status(404).json({
      success: false,
      error: "No batch or unit found with this identifier. The product may not be registered in this system.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/verify/qr/:id — generate QR code image for a product
router.get("/qr/:id", async (req: Request, res: Response) => {
  try {
    const verifyUrl = `${process.env.VITE_BACKEND_URL || "http://localhost:3001"}/api/verify/${req.params.id}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      type: "png",
      errorCorrectionLevel: "H",
      width: 300,
    });
    res.setHeader("Content-Type", "image/png");
    res.send(qrBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
