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
import { marketDataRoutes } from "./modules/market-data/market-data.routes.js";
import { collectionScheduler } from "./modules/market-data/collection-scheduler.js";
import { priceAlertsRoutes } from "./modules/market-data/price-alerts.routes.js";
import { alertScheduler } from "./modules/market-data/alert-scheduler.js";
import { scheduledTasksRoutes } from "./modules/market-data/scheduled-tasks.routes.js";
import { portfolioRoutes } from "./modules/portfolio/portfolio.routes.js";
import { aiQueryRoutes } from "./modules/ai-query/ai-query.routes.js";
import { unusualWhalesRoutes } from './modules/unusual-whales/unusual-whales.routes.js';
import { unusualWhalesScheduledTasksRoutes } from './modules/unusual-whales/scheduled-tasks.routes.js';

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
app.route("/api/market-data", marketDataRoutes);
app.route("/api/price-alerts", priceAlertsRoutes);
app.route("/api/tasks", scheduledTasksRoutes);
app.route("/api/portfolio", portfolioRoutes);
app.route("/api/ai-query", aiQueryRoutes);

// Unusual Whales routes
app.route('/unusual-whales', unusualWhalesRoutes);
app.route('/unusual-whales/tasks', unusualWhalesScheduledTasksRoutes);

// Health check
app.get("/healthz", (c) => c.json({ status: "ok", message: "API is running" }));

// Scheduler status endpoint
app.get("/api/scheduler/status", (c) => {
  try {
    const schedulerStatus = collectionScheduler.startScheduler();
    return c.json({ 
      status: "ok", 
      message: "Market data collection scheduler status", 
      schedulerActive: true,
      details: schedulerStatus
    });
  } catch (error) {
    logger.error("Error starting scheduler", { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return c.json({ 
      status: "error", 
      message: "Failed to start market data collection scheduler",
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

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

// Initialize and start the collection scheduler
if (process.env.ENABLE_DATA_COLLECTION === "true") {
  collectionScheduler.startScheduler();
  
  // Register shutdown handler
  process.on("SIGINT", () => {
    logger.info("Shutting down collection scheduler due to SIGINT");
    collectionScheduler.stopScheduler();
    process.exit(0);
  });
  
  process.on("SIGTERM", () => {
    logger.info("Shutting down collection scheduler due to SIGTERM");
    collectionScheduler.stopScheduler();
    process.exit(0);
  });
}

// Initialize and start the price alert scheduler
if (process.env.ENABLE_PRICE_ALERTS === "true") {
  alertScheduler.start();
  
  // Update existing shutdown handlers to also stop the alert scheduler
  process.on("SIGINT", () => {
    logger.info("Shutting down schedulers due to SIGINT");
    collectionScheduler.stopScheduler();
    alertScheduler.stop();
    process.exit(0);
  });
  
  process.on("SIGTERM", () => {
    logger.info("Shutting down schedulers due to SIGTERM");
    collectionScheduler.stopScheduler();
    alertScheduler.stop();
    process.exit(0);
  });
}

// Start server
const port = parseInt(process.env.PORT || "3002");
const host = process.env.HOST || "0.0.0.0";

logger.info(`Starting server on ${host}:${port}`);

export default {
  port,
  fetch: app.fetch,
}; 