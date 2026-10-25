const { getDb, initializeDatabase } = require("./connection");
const { v4: uuidv4 } = require("uuid");

initializeDatabase();
const db = getDb();

console.log("🌱 Seeding database with FMCG Supply Chain data...");

// Clear existing tables
db.exec(`
  DELETE FROM audit_log;
  DELETE FROM lifecycle_events;
  DELETE FROM transfers;
  DELETE FROM units;
  DELETE FROM batches;
  DELETE FROM product_types;
  DELETE FROM participants;
`);

const now = Math.floor(Date.now() / 1000);
const day = 86400;

// 1. PARTICIPANTS
const actors = [
  {
    id: uuidv4(),
    wallet_address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    name: "System Administrator",
    role: "ADMIN",
    company: "Global FMCG Standards Authority",
    email: "admin@fmcg-chain.io",
  },
  {
    id: uuidv4(),
    wallet_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    name: "Elena Rostova",
    role: "MANUFACTURER",
    company: "Apex Beverages & Foods Ltd.",
    email: "manufacturing@apexbf.com",
  },
  {
    id: uuidv4(),
    wallet_address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
    name: "Marcus Vance",
    role: "DISTRIBUTOR",
    company: "TransGlobal Freight & Logistics",
    email: "logistics@transglobal.com",
  },
  {
    id: uuidv4(),
    wallet_address: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    name: "Sarah Chen",
    role: "WAREHOUSE",
    company: "North Central Logistics Hub #4",
    email: "hub4@centralwarehouse.com",
  },
  {
    id: uuidv4(),
    wallet_address: "0x15d34aaf5477673822059258474f761d40026b4f",
    name: "Rajesh Kumar",
    role: "RETAILER",
    company: "Metro Supermarkets Central",
    email: "inventory@metrosupermarkets.com",
  },
  {
    id: uuidv4(),
    wallet_address: "0x9965507d1a55bcc2695c58ba16fb37d819b0a4df",
    name: "Alice Johnson",
    role: "CUSTOMER",
    company: "End Consumer",
    email: "alice@gmail.com",
  },
];

const insertParticipant = db.prepare(`
  INSERT INTO participants (id, wallet_address, name, role, company, email, is_active, created_at)
  VALUES (?, ?, ?, ?, ?, ?, 1, ?)
`);

for (const a of actors) {
  insertParticipant.run(a.id, a.wallet_address, a.name, a.role, a.company, a.email, now - 30 * day);
}

// 2. PRODUCTS
const products = [
  {
    id: uuidv4(),
    on_chain_id: "0x" + "11".repeat(32),
    sku_code: "CC-500ML-001",
    name: "Coca-Cola Classic 500ml",
    brand: "The Coca-Cola Company",
    category: "Beverage",
    description: "Sparkling cola soft drink, 500ml PET bottle with tamper-evident seal.",
    image_url: "",
    manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    manufacturer_name: "Apex Beverages & Foods Ltd.",
    registered_at: now - 25 * day,
    tx_hash: "0x" + "a1".repeat(32),
    block_number: 5412900,
  },
  {
    id: uuidv4(),
    on_chain_id: "0x" + "22".repeat(32),
    sku_code: "KK-4F-002",
    name: "KitKat 4-Finger Crisp Milk Chocolate",
    brand: "Nestle",
    category: "Confectionery",
    description: "Crispy wafer fingers covered in smooth milk chocolate (41.5g).",
    image_url: "",
    manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    manufacturer_name: "Apex Beverages & Foods Ltd.",
    registered_at: now - 20 * day,
    tx_hash: "0x" + "a2".repeat(32),
    block_number: 5413120,
  },
  {
    id: uuidv4(),
    on_chain_id: "0x" + "33".repeat(32),
    sku_code: "COL-TOT-150",
    name: "Colgate Total Clean Mint Toothpaste 150g",
    brand: "Colgate-Palmolive",
    category: "Personal Care",
    description: "Antibacterial multi-protection fluoride toothpaste, 150g recyclable tube.",
    image_url: "",
    manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    manufacturer_name: "Apex Beverages & Foods Ltd.",
    registered_at: now - 18 * day,
    tx_hash: "0x" + "a3".repeat(32),
    block_number: 5413550,
  },
  {
    id: uuidv4(),
    on_chain_id: "0x" + "44".repeat(32),
    sku_code: "KEL-CF-500",
    name: "Kellogg's Corn Flakes Original 500g",
    brand: "Kellogg's",
    category: "Snack",
    description: "Toasted flakes of golden corn fortified with vitamins and iron.",
    image_url: "",
    manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    manufacturer_name: "Apex Beverages & Foods Ltd.",
    registered_at: now - 15 * day,
    tx_hash: "0x" + "a4".repeat(32),
    block_number: 5414000,
  },
];

const insertProduct = db.prepare(`
  INSERT INTO product_types (id, on_chain_id, sku_code, name, brand, category, description, image_url,
    manufacturer_address, manufacturer_name, registered_at, tx_hash, block_number, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const p of products) {
  insertProduct.run(
    p.id, p.on_chain_id, p.sku_code, p.name, p.brand, p.category, p.description, p.image_url,
    p.manufacturer_address, p.manufacturer_name, p.registered_at, p.tx_hash, p.block_number, p.registered_at
  );
  db.prepare(`
    INSERT INTO audit_log (id, event_type, item_id, item_type, actor_address, description, tx_hash, block_number, tx_status, timestamp)
    VALUES (?, 'PRODUCT_REGISTERED', ?, 'product', ?, ?, ?, ?, 'CONFIRMED', ?)
  `).run(uuidv4(), p.id, p.manufacturer_address, `Product registered: ${p.name} (${p.sku_code})`, p.tx_hash, p.block_number, p.registered_at);
}

// 3. BATCHES (covering diverse states: REGISTERED, IN_TRANSIT, IN_STOCK, SOLD, RECALLED, EXPIRED)
const batches = [
  {
    id: uuidv4(),
    product_type_id: products[0].id,
    batch_number: "CC-2026-B01",
    manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    manufacturing_date: now - 14 * day,
    expiry_date: now + 180 * day,
    quantity: 12000,
    packaging_type: "Tray of 24 PET Bottles",
    current_owner: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    status: "REGISTERED",
    is_recalled: 0,
    recall_reason: "",
    registered_at: now - 14 * day,
    tx_hash: "0x" + "b1".repeat(32),
  },
  {
    id: uuidv4(),
    product_type_id: products[0].id,
    batch_number: "CC-2026-B02",
    manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    manufacturing_date: now - 10 * day,
    expiry_date: now + 170 * day,
    quantity: 15000,
    packaging_type: "Tray of 24 PET Bottles",
    current_owner: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
    status: "IN_TRANSIT",
    is_recalled: 0,
    recall_reason: "",
    registered_at: now - 10 * day,
    tx_hash: "0x" + "b2".repeat(32),
  },
  {
    id: uuidv4(),
    product_type_id: products[1].id,
    batch_number: "KK-2026-B01",
    manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    manufacturing_date: now - 12 * day,
    expiry_date: now + 15 * day, // Near expiry (<30 days alert)
    quantity: 8000,
    packaging_type: "Display Box of 24 Bars",
    current_owner: "0x15d34aaf5477673822059258474f761d40026b4f",
    status: "IN_STOCK",
    is_recalled: 0,
    recall_reason: "",
    registered_at: now - 12 * day,
    tx_hash: "0x" + "b3".repeat(32),
  },
  {
    id: uuidv4(),
    product_type_id: products[2].id,
    batch_number: "COL-2026-B01",
    manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    manufacturing_date: now - 20 * day,
    expiry_date: now + 365 * day,
    quantity: 5000,
    packaging_type: "Carton of 48 Units",
    current_owner: "0x15d34aaf5477673822059258474f761d40026b4f",
    status: "SOLD",
    is_recalled: 0,
    recall_reason: "",
    registered_at: now - 20 * day,
    tx_hash: "0x" + "b4".repeat(32),
  },
  {
    id: uuidv4(),
    product_type_id: products[3].id,
    batch_number: "KEL-2026-REC",
    manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    manufacturing_date: now - 8 * day,
    expiry_date: now + 240 * day,
    quantity: 6000,
    packaging_type: "Master Case of 12 Boxes",
    current_owner: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    status: "RECALLED",
    is_recalled: 1,
    recall_reason: "Precautionary recall: Packaging seal integrity defect on line 3B.",
    registered_at: now - 8 * day,
    tx_hash: "0x" + "b5".repeat(32),
  },
  {
    id: uuidv4(),
    product_type_id: products[1].id,
    batch_number: "KK-2025-EXP",
    manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    manufacturing_date: now - 180 * day,
    expiry_date: now - 5 * day, // Past expiry
    quantity: 4000,
    packaging_type: "Display Box of 24 Bars",
    current_owner: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    status: "EXPIRED",
    is_recalled: 0,
    recall_reason: "",
    registered_at: now - 180 * day,
    tx_hash: "0x" + "b6".repeat(32),
  },
];

const insertBatch = db.prepare(`
  INSERT INTO batches (id, on_chain_id, product_type_id, batch_number, manufacturer_address,
    manufacturing_date, expiry_date, quantity, packaging_type, current_owner, status,
    is_recalled, recall_reason, registered_at, tx_hash, block_number, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5414500, ?)
`);

for (const b of batches) {
  insertBatch.run(
    b.id, "0x" + "bc".repeat(32), b.product_type_id, b.batch_number, b.manufacturer_address,
    b.manufacturing_date, b.expiry_date, b.quantity, b.packaging_type, b.current_owner,
    b.status, b.is_recalled, b.recall_reason, b.registered_at, b.tx_hash, b.registered_at
  );
  db.prepare(`
    INSERT INTO audit_log (id, event_type, item_id, item_type, actor_address, description, tx_hash, block_number, tx_status, timestamp)
    VALUES (?, 'BATCH_REGISTERED', ?, 'batch', ?, ?, ?, 5414500, 'CONFIRMED', ?)
  `).run(uuidv4(), b.id, b.manufacturer_address, `Batch created: ${b.batch_number} (Qty: ${b.quantity})`, b.tx_hash, b.registered_at);
}

// 4. TRANSFERS & LIFECYCLE EVENTS
// Transfers for Batch 2 (CC-2026-B02): Mfr -> Distributor
const t1Id = uuidv4();
db.prepare(`
  INSERT INTO transfers (id, item_id, item_type, from_address, to_address, shipment_ref, status_after, timestamp, tx_hash, block_number)
  VALUES (?, ?, 'batch', ?, ?, 'BOL-APEX-0921', 'IN_TRANSIT', ?, ?, 5414600)
`).run(t1Id, batches[1].id, "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", now - 6 * day, "0x" + "c1".repeat(32));

db.prepare(`
  INSERT INTO lifecycle_events (id, item_id, item_type, old_status, new_status, updated_by, timestamp, tx_hash, block_number)
  VALUES (?, ?, 'batch', 'REGISTERED', 'IN_TRANSIT', '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', ?, ?, 5414600)
`).run(uuidv4(), batches[1].id, now - 6 * day, "0x" + "c1".repeat(32));

db.prepare(`
  INSERT INTO audit_log (id, event_type, item_id, item_type, actor_address, description, tx_hash, block_number, tx_status, timestamp)
  VALUES (?, 'OWNERSHIP_TRANSFERRED', ?, 'batch', '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 'Dispatched to TransGlobal Logistics (Ref: BOL-APEX-0921)', ?, 5414600, 'CONFIRMED', ?)
`).run(uuidv4(), batches[1].id, "0x" + "c1".repeat(32), now - 6 * day);

// Transfers for Batch 3 (KK-2026-B01): Full journey Mfr -> Dist -> Wh -> Retailer
const tHistory = [
  { from: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", to: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", ref: "BOL-KK-101", st: "IN_TRANSIT", ts: now - 9 * day },
  { from: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", to: "0x90f79bf6eb2c4f870365e785982e1f101e93b906", ref: "TR-HUB-402", st: "RECEIVED", ts: now - 7 * day },
  { from: "0x90f79bf6eb2c4f870365e785982e1f101e93b906", to: "0x15d34aaf5477673822059258474f761d40026b4f", ref: "DEL-METRO-88", st: "IN_STOCK", ts: now - 4 * day },
];

for (const t of tHistory) {
  const tid = uuidv4();
  const txH = "0x" + "d1".repeat(32);
  db.prepare(`
    INSERT INTO transfers (id, item_id, item_type, from_address, to_address, shipment_ref, status_after, timestamp, tx_hash, block_number)
    VALUES (?, ?, 'batch', ?, ?, ?, ?, ?, ?, 5414800)
  `).run(tid, batches[2].id, t.from, t.to, t.ref, t.st, t.ts, txH);

  db.prepare(`
    INSERT INTO audit_log (id, event_type, item_id, item_type, actor_address, description, tx_hash, block_number, tx_status, timestamp)
    VALUES (?, 'OWNERSHIP_TRANSFERRED', ?, 'batch', ?, ?, ?, 5414800, 'CONFIRMED', ?)
  `).run(uuidv4(), batches[2].id, t.from, `Batch transferred: ${t.from.slice(0, 8)}... -> ${t.to.slice(0, 8)}... (${t.ref})`, txH, t.ts);
}

// 5. UNITS UNDER BATCHES
const units = [
  { batch_id: batches[0].id, serial: "CC-B01-UNIT-00001", owner: batches[0].current_owner, status: "REGISTERED" },
  { batch_id: batches[0].id, serial: "CC-B01-UNIT-00002", owner: batches[0].current_owner, status: "REGISTERED" },
  { batch_id: batches[1].id, serial: "CC-B02-UNIT-00089", owner: batches[1].current_owner, status: "IN_TRANSIT" },
  { batch_id: batches[2].id, serial: "KK-B01-UNIT-00104", owner: batches[2].current_owner, status: "IN_STOCK" },
  { batch_id: batches[2].id, serial: "KK-B01-UNIT-00105", owner: batches[2].current_owner, status: "IN_STOCK" },
  { batch_id: batches[3].id, serial: "COL-B01-UNIT-00772", owner: batches[3].current_owner, status: "SOLD" },
  { batch_id: batches[4].id, serial: "KEL-REC-UNIT-00012", owner: batches[4].current_owner, status: "RECALLED" },
];

const insertUnit = db.prepare(`
  INSERT INTO units (id, on_chain_id, batch_id, unit_serial, current_owner, status, registered_at, tx_hash, block_number, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 5415000, ?)
`);

for (const u of units) {
  const uid = uuidv4();
  const tx = "0x" + "e1".repeat(32);
  insertUnit.run(uid, "0x" + "ef".repeat(32), u.batch_id, u.serial, u.owner, u.status, now - 10 * day, tx, now - 10 * day);
  db.prepare(`
    INSERT INTO audit_log (id, event_type, item_id, item_type, actor_address, description, tx_hash, block_number, tx_status, timestamp)
    VALUES (?, 'UNIT_REGISTERED', ?, 'unit', ?, ?, ?, 5415000, 'CONFIRMED', ?)
  `).run(uuidv4(), uid, u.owner, `Unit registered with serial: ${u.serial}`, tx, now - 10 * day);
}

console.log("✅ Seed completed successfully!");
console.log(`   - ${actors.length} participants`);
console.log(`   - ${products.length} product types`);
console.log(`   - ${batches.length} batches`);
console.log(`   - ${units.length} serialized units`);
console.log(`   - Audit log & transfers populated`);
