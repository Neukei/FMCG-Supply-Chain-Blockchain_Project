import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { initializeDatabase } from "./database/connection";

// Routes
import productsRouter from "./routes/products";
import batchesRouter from "./routes/batches";
import unitsRouter from "./routes/units";
import transfersRouter from "./routes/transfers";
import participantsRouter from "./routes/participants";
import auditRouter from "./routes/audit";
import verifyRouter from "./routes/verify";
import dashboardRouter from "./routes/dashboard";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "FMCG Supply Chain API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Routes
app.use("/api/products",      productsRouter);
app.use("/api/batches",       batchesRouter);
app.use("/api/units",         unitsRouter);
app.use("/api/transfers",     transfersRouter);
app.use("/api/participants",  participantsRouter);
app.use("/api/audit",         auditRouter);
app.use("/api/verify",        verifyRouter);
app.use("/api/dashboard",     dashboardRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "An error occurred",
  });
});

// Start
function start() {
  initializeDatabase();
  app.listen(PORT, () => {
    console.log("=================================================");
    console.log("  FMCG Supply Chain - Backend API");
    console.log("=================================================");
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📋 Health: http://localhost:${PORT}/health`);
  });
}

start();

export default app;
