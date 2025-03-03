import { Hono } from "hono";
// Determine the module base path based on environment
const isProduction = process.env.NODE_ENV === 'production';
const moduleBasePath = isProduction ? './modules/' : './modules/';
// Enhanced module resolution - import all modules with proper fallbacks
let logger;
let db;
try {
    const loggerModule = await import("@repo/logger");
    logger = loggerModule.logger;
    console.log("Successfully imported logger module");
}
catch (e) {
    console.warn("Standard logger import failed:", e.message);
    try {
        // Try direct import with .js extension for ESM
        const directImport = await import("./module-resolver.js");
        logger = directImport.logger;
        console.log("Successfully imported logger via module-resolver");
    }
    catch (directError) {
        console.error("Direct logger import also failed:", directError.message);
        // Create a minimal logger to prevent crashes
        logger = {
            info: (...args) => console.info("[INFO]", ...args),
            warn: (...args) => console.warn("[WARN]", ...args),
            error: (...args) => console.error("[ERROR]", ...args),
            debug: (...args) => console.debug("[DEBUG]", ...args),
            child: () => logger
        };
        console.log("Using fallback logger implementation");
    }
}
try {
    const dbModule = await import("@repo/db");
    db = dbModule.db;
    console.log("Successfully imported db module");
}
catch (e) {
    console.warn("Standard db import failed:", e.message);
    try {
        // Try direct import with .js extension for ESM
        const directImport = await import("./module-resolver.js");
        db = directImport.db;
        console.log("Successfully imported db via module-resolver");
    }
    catch (directError) {
        console.error("Direct db import also failed:", directError.message);
        // Create a minimal db mock to prevent crashes
        db = { _: { schema: {} } };
        console.log("Using fallback db implementation");
    }
}
import { cors } from "hono/cors";
import { timing } from "hono/timing";
import { prettyJSON } from "hono/pretty-json";
// Dynamic route imports based on environment
const importRoutes = async () => {
    try {
        // Import routes - using dynamic imports for better error handling
        const updatesModule = await import(`${moduleBasePath}updates/updates.routes.js`);
        const aiTriggersModule = await import(`${moduleBasePath}ai-triggers/ai-triggers.routes.js`);
        const userModule = await import(`${moduleBasePath}users/users.routes.js`);
        const notificationsModule = await import(`${moduleBasePath}notifications/notifications.routes.js`);
        const economicReportsModule = await import(`${moduleBasePath}economic-reports/economic-reports.routes.js`);
        const interviewsModule = await import(`${moduleBasePath}interviews/interviews.routes.js`);
        const marketDataModule = await import(`${moduleBasePath}market-data/market-data.routes.js`);
        const collectionSchedulerModule = await import(`${moduleBasePath}market-data/collection-scheduler.js`);
        const priceAlertsModule = await import(`${moduleBasePath}market-data/price-alerts.routes.js`);
        const alertSchedulerModule = await import(`${moduleBasePath}market-data/alert-scheduler.js`);
        const scheduledTasksModule = await import(`${moduleBasePath}market-data/scheduled-tasks.routes.js`);
        const aiQueryModule = await import(`${moduleBasePath}ai-query/ai-query.routes.js`);
        const unusualWhalesModule = await import(`${moduleBasePath}unusual-whales/unusual-whales.routes.js`);
        const unusualWhalesTasksModule = await import(`${moduleBasePath}unusual-whales/scheduled-tasks.routes.js`);
        return {
            updatesRoutes: updatesModule.updatesRoutes,
            aiTriggersRoutes: aiTriggersModule.aiTriggersRoutes,
            userRoutes: userModule.userRoutes,
            notificationsRoutes: notificationsModule.notificationsRoutes,
            economicReportsRoutes: economicReportsModule.economicReportsRoutes,
            interviewsRoutes: interviewsModule.interviewsRoutes,
            marketDataRoutes: marketDataModule.marketDataRoutes,
            collectionScheduler: collectionSchedulerModule.collectionScheduler,
            priceAlertsRoutes: priceAlertsModule.priceAlertsRoutes,
            alertScheduler: alertSchedulerModule.alertScheduler,
            scheduledTasksRoutes: scheduledTasksModule.scheduledTasksRoutes,
            aiQueryRoutes: aiQueryModule.aiQueryRoutes,
            unusualWhalesRoutes: unusualWhalesModule.unusualWhalesRoutes,
            unusualWhalesScheduledTasksRoutes: unusualWhalesTasksModule.unusualWhalesScheduledTasksRoutes
        };
    }
    catch (error) {
        logger.error("Failed to import routes", { error: error.message, stack: error.stack });
        // Return empty routes as fallback
        return {
            updatesRoutes: new Hono(),
            aiTriggersRoutes: new Hono(),
            userRoutes: new Hono(),
            notificationsRoutes: new Hono(),
            economicReportsRoutes: new Hono(),
            interviewsRoutes: new Hono(),
            marketDataRoutes: new Hono(),
            collectionScheduler: { startScheduler: () => ({}), stopScheduler: () => { } },
            priceAlertsRoutes: new Hono(),
            alertScheduler: { start: () => { }, stop: () => { } },
            scheduledTasksRoutes: new Hono(),
            aiQueryRoutes: new Hono(),
            unusualWhalesRoutes: new Hono(),
            unusualWhalesScheduledTasksRoutes: new Hono()
        };
    }
};
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
// Initialize the application asynchronously
const initApp = async () => {
    // Import all routes
    const routes = await importRoutes();
    // API routes
    app.route("/api/users", routes.userRoutes);
    app.route("/api/updates", routes.updatesRoutes);
    app.route("/api/triggers", routes.aiTriggersRoutes);
    app.route("/api/notifications", routes.notificationsRoutes);
    app.route("/api/economic-reports", routes.economicReportsRoutes);
    app.route("/api/interviews", routes.interviewsRoutes);
    app.route("/api/market-data", routes.marketDataRoutes);
    app.route("/api/price-alerts", routes.priceAlertsRoutes);
    app.route("/api/tasks", routes.scheduledTasksRoutes);
    app.route("/api/ai-query", routes.aiQueryRoutes);
    // Unusual Whales routes
    app.route('/unusual-whales', routes.unusualWhalesRoutes);
    app.route('/unusual-whales/tasks', routes.unusualWhalesScheduledTasksRoutes);
    // Public health check that doesn't require authentication
    app.get('/api/public-health', (c) => {
        return c.json({ status: 'ok', message: 'API is running' });
    });
    // Health check
    app.get("/healthz", (c) => c.json({ status: "ok", message: "API is running" }));
    // Scheduler status endpoint
    app.get("/api/scheduler/status", (c) => {
        try {
            const schedulerStatus = routes.collectionScheduler.startScheduler();
            return c.json({
                status: "ok",
                message: "Market data collection scheduler status",
                schedulerActive: true,
                details: schedulerStatus
            });
        }
        catch (error) {
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
        routes.collectionScheduler.startScheduler();
        // Register shutdown handler
        process.on("SIGINT", () => {
            logger.info("Shutting down collection scheduler due to SIGINT");
            routes.collectionScheduler.stopScheduler();
            process.exit(0);
        });
        process.on("SIGTERM", () => {
            logger.info("Shutting down collection scheduler due to SIGTERM");
            routes.collectionScheduler.stopScheduler();
            process.exit(0);
        });
    }
    // Initialize and start the price alert scheduler
    if (process.env.ENABLE_PRICE_ALERTS === "true") {
        routes.alertScheduler.start();
        // Update existing shutdown handlers to also stop the alert scheduler
        process.on("SIGINT", () => {
            logger.info("Shutting down schedulers due to SIGINT");
            routes.collectionScheduler.stopScheduler();
            routes.alertScheduler.stop();
            process.exit(0);
        });
        process.on("SIGTERM", () => {
            logger.info("Shutting down schedulers due to SIGTERM");
            routes.collectionScheduler.stopScheduler();
            routes.alertScheduler.stop();
            process.exit(0);
        });
    }
};
// Start the application
initApp().catch(error => {
    logger.error("Failed to initialize application", { error: error.message, stack: error.stack });
});
// Start server
const port = parseInt(process.env.PORT || "3001");
const host = process.env.HOST || "0.0.0.0";
logger.info(`Starting server on ${host}:${port}`);
export default {
    port,
    fetch: app.fetch,
};
//# sourceMappingURL=index.js.map