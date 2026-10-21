const { Router } = require("express");
const { getDb } = require("../database/connection");
const { v4: uuidv4 } = require("uuid");
const router = Router();

router.get("/", (_req, res) => {
  try {
    res.json({ success: true, data: getDb().prepare("SELECT * FROM participants ORDER BY created_at DESC").all() });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:address", (req, res) => {
  try {
    const p = getDb().prepare("SELECT * FROM participants WHERE LOWER(wallet_address) = LOWER(?)").get(req.params.address);
    if (!p) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: p });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", (req, res) => {
  try {
    const { wallet_address, name, role, company = "", email = "" } = req.body;
    if (!wallet_address || !name || !role)
      return res.status(400).json({ success: false, error: "Missing: wallet_address, name, role" });
    const validRoles = ["ADMIN","MANUFACTURER","DISTRIBUTOR","WAREHOUSE","RETAILER","CUSTOMER"];
    if (!validRoles.includes(role.toUpperCase()))
      return res.status(400).json({ success: false, error: `Invalid role. Must be: ${validRoles.join(", ")}` });
    const db = getDb();
    if (db.prepare("SELECT id FROM participants WHERE LOWER(wallet_address) = LOWER(?)").get(wallet_address))
      return res.status(409).json({ success: false, error: "Wallet already registered" });
    const id = uuidv4();
    db.prepare("INSERT INTO participants (id,wallet_address,name,role,company,email) VALUES (?,?,?,?,?,?)")
      .run(id,wallet_address.toLowerCase(),name,role.toUpperCase(),company,email);
    res.status(201).json({ success: true, data: db.prepare("SELECT * FROM participants WHERE id = ?").get(id) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/:id", (req, res) => {
  try {
    const { name, company, email, is_active } = req.body;
    const db = getDb();
    if (!db.prepare("SELECT id FROM participants WHERE id = ?").get(req.params.id))
      return res.status(404).json({ success: false, error: "Not found" });
    db.prepare(`UPDATE participants SET
      name=COALESCE(?,name), company=COALESCE(?,company),
      email=COALESCE(?,email), is_active=COALESCE(?,is_active) WHERE id=?`)
      .run(name,company,email,is_active,req.params.id);
    res.json({ success: true, data: db.prepare("SELECT * FROM participants WHERE id = ?").get(req.params.id) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
