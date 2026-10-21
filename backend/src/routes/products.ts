import { Router, Request, Response } from "express";
import { getDb } from "../database/connection";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// GET /api/products — list all product types
router.get("/", (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT pt.*, 
             COUNT(DISTINCT b.id) as batch_count
      FROM product_types pt
      LEFT JOIN batches b ON b.product_type_id = pt.id
      GROUP BY pt.id
      ORDER BY pt.created_at DESC
    `).all();
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id — single product type
router.get("/:id", (req: Request, res: Response) => {
  try {
    const db = getDb();
    const product = db.prepare("SELECT * FROM product_types WHERE id = ?").get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    const batches = db.prepare(
      "SELECT * FROM batches WHERE product_type_id = ? ORDER BY created_at DESC"
    ).all(req.params.id);
    res.json({ success: true, data: { ...product as object, batches } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products — register product type (stores off-chain metadata)
router.post("/", (req: Request, res: Response) => {
  try {
    const {
      on_chain_id,
      sku_code, name, brand, category,
      description = "", image_url = "",
      manufacturer_address, manufacturer_name = "",
      registered_at, tx_hash = "", block_number = 0,
    } = req.body;

    if (!sku_code || !name || !brand || !category || !manufacturer_address) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: sku_code, name, brand, category, manufacturer_address",
      });
    }

    const id = uuidv4();
    const db = getDb();

    // Check duplicate SKU
    const existing = db.prepare("SELECT id FROM product_types WHERE sku_code = ?").get(sku_code);
    if (existing) {
      return res.status(409).json({ success: false, error: "SKU code already exists" });
    }

    db.prepare(`
      INSERT INTO product_types
        (id, on_chain_id, sku_code, name, brand, category, description, image_url,
         manufacturer_address, manufacturer_name, registered_at, tx_hash, block_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, on_chain_id || "", sku_code, name, brand, category,
      description, image_url, manufacturer_address, manufacturer_name,
      registered_at || Math.floor(Date.now() / 1000), tx_hash, block_number
    );

    // Add to audit log
    db.prepare(`
      INSERT INTO audit_log (id, event_type, item_id, item_type, actor_address, description, tx_hash, tx_status, timestamp)
      VALUES (?, 'PRODUCT_REGISTERED', ?, 'product', ?, ?, ?, 'CONFIRMED', ?)
    `).run(uuidv4(), id, manufacturer_address, `Product registered: ${name} (${sku_code})`, tx_hash, Math.floor(Date.now() / 1000));

    const created = db.prepare("SELECT * FROM product_types WHERE id = ?").get(id);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
