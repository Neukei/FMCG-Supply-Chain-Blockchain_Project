const { Router } = require("express");
const { getDb } = require("../database/connection");
const { v4: uuidv4 } = require("uuid");
const router = Router();

router.get("/", (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT pt.*, COUNT(DISTINCT b.id) as batch_count
      FROM product_types pt
      LEFT JOIN batches b ON b.product_type_id = pt.id
      GROUP BY pt.id ORDER BY pt.created_at DESC
    `).all();
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:id", (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare("SELECT * FROM product_types WHERE id = ?").get(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    const batches = db.prepare("SELECT * FROM batches WHERE product_type_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json({ success: true, data: { ...product, batches } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", (req, res) => {
  try {
    const { on_chain_id = "", sku_code, name, brand, category, description = "",
      image_url = "", manufacturer_address, manufacturer_name = "",
      registered_at, tx_hash = "", block_number = 0 } = req.body;

    if (!sku_code || !name || !brand || !category || !manufacturer_address)
      return res.status(400).json({ success: false, error: "Missing required fields" });

    const db = getDb();
    if (db.prepare("SELECT id FROM product_types WHERE sku_code = ?").get(sku_code))
      return res.status(409).json({ success: false, error: "SKU already exists" });

    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`INSERT INTO product_types
      (id,on_chain_id,sku_code,name,brand,category,description,image_url,
       manufacturer_address,manufacturer_name,registered_at,tx_hash,block_number)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, on_chain_id, sku_code, name, brand, category, description, image_url,
           manufacturer_address, manufacturer_name, registered_at || now, tx_hash, block_number);

    db.prepare(`INSERT INTO audit_log (id,event_type,item_id,item_type,actor_address,description,tx_hash,tx_status,timestamp)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(uuidv4(),"PRODUCT_REGISTERED",id,"product",manufacturer_address,
           `Product: ${name} (${sku_code})`,tx_hash,"CONFIRMED",now);

    res.status(201).json({ success: true, data: db.prepare("SELECT * FROM product_types WHERE id = ?").get(id) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
