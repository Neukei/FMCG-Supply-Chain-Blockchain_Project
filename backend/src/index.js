const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const { initializeDatabase } = require("./database/connection");
const productsRouter    = require("./routes/products");
const batchesRouter     = require("./routes/batches");
const unitsRouter       = require("./routes/units");
const transfersRouter   = require("./routes/transfers");
const participantsRouter = require("./routes/participants");
const auditRouter       = require("./routes/audit");
const verifyRouter      = require("./routes/verify");
const dashboardRouter   = require("./routes/dashboard");

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "FMCG Supply Chain API", timestamp: new Date().toISOString() });
});

app.use("/api/products",     productsRouter);
app.use("/api/batches",      batchesRouter);
app.use("/api/units",        unitsRouter);
app.use("/api/transfers",    transfersRouter);
app.use("/api/participants", participantsRouter);
app.use("/api/audit",        auditRouter);
app.use("/api/verify",       verifyRouter);
app.use("/api/dashboard",    dashboardRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

function start() {
  initializeDatabase();
  app.listen(PORT, () => {
    console.log("=================================================");
    console.log("  FMCG Supply Chain Backend API");
    console.log(`  Running at http://localhost:${PORT}`);
    console.log("=================================================");
  });
}

start();
module.exports = app;
