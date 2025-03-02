import { Hono } from "hono";
import { logger } from "@repo/logger";
import { cors } from "hono/cors";
import { timing } from "hono/timing";
import { prettyJSON } from "hono/pretty-json";

// Import routes
import { updatesRoutes } from "./modules/updates/updates.routes.js";
import { aiTriggersRoutes } from "./modules/ai-triggers/ai-triggers.routes.js";
import { userRoutes } from "./modules/users/users.routes.js";
import { notificationsRoutes } from "./modules/notifications/notifications.routes.js";
import { economicReportsRoutes } from "./modules/economic-reports/economic-reports.routes.js";
import { interviewsRoutes } from "./modules/interviews/interviews.routes.js";

// Create main Hono app
const app = new Hono();

// Middleware
app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "*"],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use("*", timing());
app.use("*", prettyJSON());

// Log all requests
app.use("*", async (c, next) => {
  logger.info(`${c.req.method} ${c.req.url}`);
  await next();
});

// API routes
app.route("/api/users", userRoutes);
app.route("/api/updates", updatesRoutes);
app.route("/api/triggers", aiTriggersRoutes);
app.route("/api/notifications", notificationsRoutes);
app.route("/api/economic-reports", economicReportsRoutes);
app.route("/api/interviews", interviewsRoutes);

// Health check
app.get("/healthz", (c) => c.json({ status: "ok", message: "API is running" }));

// Root
app.get("/", (c) => c.json({ 
  name: "AI Hedge Fund API",
  version: "0.1.0", 
  message: "Welcome to the AI Hedge Fund API" 
}));

// Error handling
app.onError((err, c) => {
  logger.error("Error in request", { error: err.message, stack: err.stack, url: c.req.url });
  return c.json({ status: "error", message: err.message, code: 500 }, 500);
});

// Start server
const port = parseInt(process.env.PORT || "3002");
const host = process.env.HOST || "0.0.0.0";

logger.info(`Starting server on ${host}:${port}`);

export default {
  port,
  fetch: app.fetch,
}; 