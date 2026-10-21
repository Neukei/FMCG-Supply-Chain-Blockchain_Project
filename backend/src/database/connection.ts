// Uses the built-in node:sqlite module available in Node.js v22.5.0+
// No external dependencies or native compilation required.
import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, "../../../supply_chain.db");

let db: DatabaseSync;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    // Enable WAL mode for better concurrent read performance
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
  }
  return db;
}

export function initializeDatabase(): void {
  const database = getDb();

  // Product Types (SKU definitions)
  database.exec(`
    CREATE TABLE IF NOT EXISTS product_types (
      id TEXT PRIMARY KEY,
      on_chain_id TEXT DEFAULT '',
      sku_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      manufacturer_address TEXT NOT NULL,
      manufacturer_name TEXT DEFAULT '',
      registered_at INTEGER NOT NULL,
      tx_hash TEXT DEFAULT '',
      block_number INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Batches
  database.exec(`
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      on_chain_id TEXT DEFAULT '',
      product_type_id TEXT NOT NULL,
      batch_number TEXT UNIQUE NOT NULL,
      manufacturer_address TEXT NOT NULL,
      manufacturing_date INTEGER NOT NULL,
      expiry_date INTEGER DEFAULT 0,
      quantity INTEGER NOT NULL,
      packaging_type TEXT DEFAULT '',
      current_owner TEXT NOT NULL,
      status TEXT DEFAULT 'REGISTERED',
      is_recalled INTEGER DEFAULT 0,
      recall_reason TEXT DEFAULT '',
      registered_at INTEGER NOT NULL,
      tx_hash TEXT DEFAULT '',
      block_number INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (product_type_id) REFERENCES product_types(id)
    )
  `);

  // Individual Units
  database.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      on_chain_id TEXT DEFAULT '',
      batch_id TEXT NOT NULL,
      unit_serial TEXT NOT NULL,
      current_owner TEXT NOT NULL,
      status TEXT DEFAULT 'REGISTERED',
      registered_at INTEGER NOT NULL,
      tx_hash TEXT DEFAULT '',
      block_number INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (batch_id) REFERENCES batches(id),
      UNIQUE(batch_id, unit_serial)
    )
  `);

  // Participants
  database.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      wallet_address TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      company TEXT DEFAULT '',
      email TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Transfers
  database.exec(`
    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      shipment_ref TEXT DEFAULT '',
      status_after TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      tx_hash TEXT DEFAULT '',
      block_number INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Lifecycle Events
  database.exec(`
    CREATE TABLE IF NOT EXISTS lifecycle_events (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      tx_hash TEXT DEFAULT '',
      block_number INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Audit Log
  database.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      item_id TEXT DEFAULT '',
      item_type TEXT DEFAULT '',
      actor_address TEXT NOT NULL,
      description TEXT NOT NULL,
      tx_hash TEXT DEFAULT '',
      block_number INTEGER DEFAULT 0,
      tx_status TEXT DEFAULT 'CONFIRMED',
      timestamp INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  console.log("✅ Database initialized at:", DB_PATH);
}
