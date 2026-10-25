const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const app = require("../src/index.js");
const { initializeDatabase } = require("../src/database/connection.js");

initializeDatabase();

function request(method, url, body = null) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = {
      "content-type": "application/json",
      host: "localhost",
    };
    req.connection = { remoteAddress: "127.0.0.1" };
    req.socket = req.connection;
    req.body = body || {};

    let resBody = "";
    let statusCode = 200;
    const resHeaders = {};

    const res = new EventEmitter();
    res.setHeader = (k, v) => {
      resHeaders[k.toLowerCase()] = v;
      return res;
    };
    res.getHeader = (k) => resHeaders[k.toLowerCase()];
    res.status = (code) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    };
    res.statusCode = 200;
    res.send = (data) => {
      resBody = data;
      finish();
    };
    res.json = (data) => {
      resHeaders["content-type"] = "application/json";
      resBody = data;
      finish();
    };
    res.end = (data) => {
      if (data !== undefined) resBody = data;
      finish();
    };

    function finish() {
      resolve({
        status: statusCode,
        headers: resHeaders,
        body: resBody,
      });
    }

    try {
      app.handle(req, res);
    } catch (e) {
      reject(e);
    }
  });
}

test("API In-Memory Test Suite", async (t) => {
  await t.test("1. GET /health returns ok", async () => {
    const res = await request("GET", "/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });

  await t.test("2. GET /api/dashboard/stats returns operational metrics", async () => {
    const res = await request("GET", "/api/dashboard/stats");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.totals.products > 0);
    assert.ok(res.body.data.totals.batches > 0);
  });

  await t.test("3. GET /api/products returns products list", async () => {
    const res = await request("GET", "/api/products");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 4);
  });

  let createdProductId = "";
  await t.test("4. POST /api/products creates a new product", async () => {
    const sku = `TEST-SKU-${Date.now()}`;
    const res = await request("POST", "/api/products", {
      sku_code: sku,
      name: "Organic Oat Milk 1L",
      brand: "OatFresh",
      category: "Dairy",
      manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      manufacturer_name: "OatFresh Beverages",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.sku_code, sku);
    createdProductId = res.body.data.id;
  });

  let createdBatchId = "";
  await t.test("5. POST /api/batches creates a new batch", async () => {
    const batchNumber = `BATCH-${Date.now()}`;
    const now = Math.floor(Date.now() / 1000);
    const res = await request("POST", "/api/batches", {
      product_type_id: createdProductId,
      batch_number: batchNumber,
      manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      manufacturing_date: now - 3600,
      expiry_date: now + 90 * 86400,
      quantity: 5000,
      packaging_type: "Carton of 12",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, "REGISTERED");
    createdBatchId = res.body.data.id;
  });

  let createdUnitId = "";
  await t.test("6. POST /api/units creates a serialized unit", async () => {
    const serial = `SN-${Date.now()}-001`;
    const res = await request("POST", "/api/units", {
      batch_id: createdBatchId,
      unit_serial: serial,
      manufacturer_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.unit_serial, serial);
    createdUnitId = res.body.data.id;
  });

  await t.test("7. POST /api/transfers executes custody transfer", async () => {
    const res = await request("POST", "/api/transfers", {
      item_id: createdBatchId,
      item_type: "batch",
      from_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      to_address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      shipment_ref: "WAYBILL-9901",
      status_after: "IN_TRANSIT",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);

    const batchRes = await request("GET", `/api/batches/${createdBatchId}`);
    assert.equal(batchRes.body.data.status, "IN_TRANSIT");
    assert.equal(batchRes.body.data.current_owner, "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc");
  });

  await t.test("8. GET /api/verify/:id verifies item for consumer", async () => {
    const res = await request("GET", `/api/verify/${createdBatchId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.type, "batch");
    assert.ok(res.body.data.qr_code);
    assert.ok(res.body.limitation_notice);
  });

  await t.test("9. PATCH /api/batches/:id/recall recalls batch", async () => {
    const res = await request("PATCH", `/api/batches/${createdBatchId}/recall`, {
      reason: "Foreign particulate detected during lab test",
      actor_address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const batchRes = await request("GET", `/api/batches/${createdBatchId}`);
    assert.equal(batchRes.body.data.status, "RECALLED");
    assert.equal(batchRes.body.data.is_recalled, 1);
  });

  await t.test("10. GET /api/audit returns audit records with pagination", async () => {
    const res = await request("GET", "/api/audit?page=1&limit=10");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.pagination.total > 0);
  });
});
