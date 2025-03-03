// @ts-check
import express from 'express';
import cors from 'cors';
import { createComponentLogger } from './module-resolver.js';
const logger = createComponentLogger('server');
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
/**
 * Creates an Express router for a Hono app
 * @param {any} honoApp - Hono app instance
 * @returns {express.Router} Express router
 */
function createRouterFromHonoApp(honoApp) {
    const router = express.Router();
    router.all('*', async (req, res, next) => {
        try {
            // Convert Express request to Fetch Request
            const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            // Convert Express headers to Headers object
            const headers = new Headers();
            Object.entries(req.headers).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (Array.isArray(value)) {
                        value.forEach(v => headers.append(key, v));
                    }
                    else {
                        headers.append(key, value);
                    }
                }
            });
            const request = new Request(url, {
                method: req.method,
                headers: headers,
                body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
            });
            // Process with Hono
            const honoResponse = await honoApp.fetch(request);
            // Convert Hono response to Express response
            res.status(honoResponse.status);
            // Set headers
            honoResponse.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            // Get response body
            const body = await honoResponse.text();
            if (body) {
                res.send(body);
            }
            else {
                res.end();
            }
        }
        catch (error) {
            logger.error(`Hono adapter error: ${error.message}`, { stack: error.stack });
            next(error);
        }
    });
    return router;
}
/**
 * Create a fallback users router for when dynamic import fails
 * @returns {express.Router} Express router with basic user endpoints
 */
function createFallbackUsersRouter() {
    const router = express.Router();
    // In-memory store for user preferences
    const userPreferencesStore = new Map();
    // GET /api/users - Get all users
    router.get('/', (req, res) => {
        logger.info('Fallback: Fetching all users');
        try {
            const users = Array.from(userPreferencesStore.values());
            res.json({ users });
        }
        catch (error) {
            logger.error(`Error fetching all users: ${error.message}`, { stack: error.stack });
            res.status(500).json({
                status: 'error',
                message: error.message || 'Unknown error',
                code: 500
            });
        }
    });
    // POST /api/users/preferences - Create or update user preferences
    router.post('/preferences', (req, res) => {
        logger.info('Fallback: Saving user preferences', { userId: req.body.userId });
        try {
            const data = req.body;
            // Validate minimum required fields
            if (!data.userId || !data.email) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed: userId and email are required',
                    code: 400
                });
            }
            const now = new Date();
            // Store in memory
            userPreferencesStore.set(data.userId, {
                id: `user_${Date.now()}`,
                ...data,
                createdAt: now,
                updatedAt: now
            });
            res.json({
                status: 'success',
                message: 'User preferences saved successfully'
            });
        }
        catch (error) {
            logger.error(`Error saving user preferences: ${error.message}`, { stack: error.stack });
            res.status(500).json({
                status: 'error',
                message: error.message || 'Unknown error',
                code: 500
            });
        }
    });
    // GET /api/users/:userId/preferences - Get user preferences
    router.get('/:userId/preferences', (req, res) => {
        const userId = req.params.userId;
        logger.info('Fallback: Fetching user preferences', { userId });
        try {
            const preferences = userPreferencesStore.get(userId);
            if (!preferences) {
                // Return an empty preferences object rather than an error
                logger.info('No preferences found for user, returning empty preferences', { userId });
                return res.json({
                    status: 'success',
                    userPreferences: null
                });
            }
            res.json({
                status: 'success',
                userPreferences: preferences
            });
        }
        catch (error) {
            logger.error(`Error fetching user preferences: ${error.message}`, { stack: error.stack });
            res.status(500).json({
                status: 'error',
                message: error.message || 'Unknown error',
                code: 500
            });
        }
    });
    return router;
}
/**
 * Create a fallback market data router for when dynamic import fails
 * @returns {express.Router} Express router with basic market data endpoints
 */
function createFallbackMarketDataRouter() {
    const router = express.Router();
    // Store mock stock data
    const mockStocks = {
        'AAPL': { symbol: 'AAPL', price: 185.85, change: 1.25, percentChange: 0.68, volume: 48500000, marketCap: 2.94e12 },
        'MSFT': { symbol: 'MSFT', price: 111.40, change: 2.40, percentChange: 2.20, volume: 24000000, marketCap: 2.38e12 },
        'GOOGL': { symbol: 'GOOGL', price: 143.12, change: -0.50, percentChange: -0.35, volume: 15600000, marketCap: 1.82e12 },
        'AMZN': { symbol: 'AMZN', price: 176.35, change: 0.80, percentChange: 0.46, volume: 35200000, marketCap: 1.81e12 },
        'META': { symbol: 'META', price: 492.50, change: 4.25, percentChange: 0.87, volume: 19800000, marketCap: 1.26e12 },
        'TSLA': { symbol: 'TSLA', price: 176.75, change: -2.30, percentChange: -1.28, volume: 51300000, marketCap: 5.63e11 },
        'NVDA': { symbol: 'NVDA', price: 792.35, change: 15.20, percentChange: 1.96, volume: 40500000, marketCap: 1.95e12 },
        'JPM': { symbol: 'JPM', price: 59.90, change: 0.06, percentChange: 0.10, volume: 8900000, marketCap: 5.50e11 },
        'V': { symbol: 'V', price: 275.42, change: 1.15, percentChange: 0.42, volume: 7200000, marketCap: 5.52e11 },
        'JNJ': { symbol: 'JNJ', price: 152.18, change: -0.42, percentChange: -0.28, volume: 6500000, marketCap: 3.95e11 }
    };
    // GET /api/market-data/stocks - Get stock data for requested symbols
    router.get('/stocks', (req, res) => {
        try {
            // Fix the type checking for symbols query parameter
            let symbols = [];
            if (req.query.symbols) {
                if (typeof req.query.symbols === 'string') {
                    symbols = req.query.symbols.split(',');
                }
                else if (Array.isArray(req.query.symbols)) {
                    symbols = req.query.symbols;
                }
            }
            if (symbols.length === 0) {
                return res.json({
                    stocks: Object.values(mockStocks),
                    timestamp: new Date().toISOString()
                });
            }
            const stocks = symbols.map(symbol => {
                const upperSymbol = symbol.toUpperCase();
                // Return the mock data if available, otherwise generate random data
                if (mockStocks[upperSymbol]) {
                    return {
                        ...mockStocks[upperSymbol],
                        timestamp: new Date().toISOString()
                    };
                }
                // Generate random data for unknown symbols
                return {
                    symbol: upperSymbol,
                    price: Math.floor(Math.random() * 100) + 50,
                    change: (Math.random() * 4 - 2).toFixed(2),
                    percentChange: (Math.random() * 4 - 2).toFixed(2),
                    volume: Math.floor(Math.random() * 1000000),
                    marketCap: Math.floor(Math.random() * 1000000000000),
                    timestamp: new Date().toISOString()
                };
            });
            res.json({
                stocks,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger.error(`Error in /api/market-data/stocks:`, error);
            res.status(500).json({ error: 'Failed to fetch stock data' });
        }
    });
    // GET /api/market-data/overview - Get market overview
    router.get('/overview', (req, res) => {
        logger.info('Fallback: Fetching market overview');
        try {
            // Return mock market overview data
            res.json({
                status: 'success',
                data: {
                    market: {
                        status: 'open',
                        tradingDay: new Date().toISOString().split('T')[0],
                        overallSentiment: 'bullish',
                        majorIndices: [
                            { symbol: 'SPY', name: 'S&P 500', price: 500.23, change: 2.5, changePercent: 0.5 },
                            { symbol: 'QQQ', name: 'Nasdaq', price: 400.78, change: 3.2, changePercent: 0.8 },
                            { symbol: 'DIA', name: 'Dow Jones', price: 380.45, change: 1.8, changePercent: 0.47 }
                        ]
                    }
                }
            });
        }
        catch (error) {
            logger.error(`Error fetching market overview: ${error.message}`, { stack: error.stack });
            res.status(500).json({
                status: 'error',
                message: error.message || 'Unknown error',
                code: 500
            });
        }
    });
    // GET /api/market-data/stock/:symbol - Get data for a specific stock
    router.get('/stock/:symbol', (req, res) => {
        const symbol = req.params.symbol;
        logger.info('Fallback: Fetching stock data', { symbol });
        try {
            // Return mock stock data
            res.json({
                status: 'success',
                data: {
                    symbol: symbol,
                    name: `${symbol} Inc.`,
                    price: 150.75,
                    change: 2.25,
                    changePercent: 1.5,
                    volume: 1200000,
                    marketCap: 980000000,
                    pe: 22.4,
                    dividend: 1.2,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger.error(`Error fetching stock data: ${error.message}`, { stack: error.stack });
            res.status(500).json({
                status: 'error',
                message: error.message || 'Unknown error',
                code: 500
            });
        }
    });
    // GET /api/market-data/news - Get market news
    router.get('/news', (req, res) => {
        logger.info('Fallback: Fetching market news');
        try {
            // Return mock news data
            res.json({
                status: 'success',
                data: {
                    news: [
                        {
                            id: 'news1',
                            title: 'Market rallies on Fed decision',
                            source: 'Financial Times',
                            url: 'https://example.com/news1',
                            publishedAt: new Date().toISOString()
                        },
                        {
                            id: 'news2',
                            title: 'Tech stocks lead market surge',
                            source: 'Wall Street Journal',
                            url: 'https://example.com/news2',
                            publishedAt: new Date().toISOString()
                        }
                    ]
                }
            });
        }
        catch (error) {
            logger.error(`Error fetching market news: ${error.message}`, { stack: error.stack });
            res.status(500).json({
                status: 'error',
                message: error.message || 'Unknown error',
                code: 500
            });
        }
    });
    return router;
}
// New function to create a fallback router for stock updates
function createFallbackUpdatesRouter() {
    const router = express.Router();
    // Store mock updates data
    const mockUpdates = [
        {
            id: 'update_001',
            ticker: 'AAPL',
            eventType: 'hedge_fund_buy',
            title: 'Significant Hedge Fund Buy',
            content: 'Major hedge fund increases position in AAPL by 15%',
            source: 'SEC Filing',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'update_002',
            ticker: 'MSFT',
            eventType: 'insider_sell',
            title: 'Insider Selling Activity',
            content: 'CFO sells 10,000 shares worth $2.5M',
            source: 'Form 4',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'update_003',
            ticker: 'TSLA',
            eventType: 'option_flow',
            title: 'Unusual Options Activity',
            content: 'Significant call buying at $200 strike for June expiry',
            source: 'Market Data',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'update_004',
            ticker: 'NVDA',
            eventType: 'technical_signal',
            title: 'Golden Cross Pattern',
            content: '50-day moving average crosses above 200-day moving average',
            source: 'Technical Analysis',
            createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'update_005',
            ticker: 'AMZN',
            eventType: 'hedge_fund_sell',
            title: 'Hedge Fund Reduces Position',
            content: 'Prominent hedge fund reduces AMZN holdings by 8%',
            source: 'SEC Filing',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    // GET /api/updates - Get all stock updates
    router.get('/', (req, res) => {
        try {
            res.json({
                updates: mockUpdates,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger.error(`Error in /api/updates:`, error);
            res.status(500).json({ error: 'Failed to fetch stock updates' });
        }
    });
    // GET /api/updates/ticker/:ticker - Get updates for a specific ticker
    router.get('/ticker/:ticker', (req, res) => {
        try {
            const ticker = req.params.ticker.toUpperCase();
            const updates = mockUpdates.filter(update => update.ticker === ticker);
            res.json({
                updates,
                ticker,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger.error(`Error in /api/updates/ticker/:ticker:`, error);
            res.status(500).json({ error: 'Failed to fetch ticker updates' });
        }
    });
    return router;
}
/**
 * Sets up the Express server with the imported modules
 * @param {Object} options - Setup options
 * @param {Object} options.db - The database module
 * @param {Object} options.logger - The logger module
 */
export function setupServer({ db, logger }) {
    // Create the Express app
    const app = express();
    // Setup middleware
    app.use(express.json());
    app.use(cors({
        origin: ["http://localhost:3000", "http://localhost:3001", "*"],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }));
    // Log all requests
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.url}`);
        next();
    });
    // Basic routes
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', time: new Date().toISOString() });
    });
    // Public health check that doesn't require authentication
    app.get('/api/public-health', (req, res) => {
        res.json({ status: 'ok', message: 'API is running' });
    });
    // API info route
    app.get('/api/info', (req, res) => {
        res.json({
            name: 'AI Hedge Fund API',
            version: '0.1.0',
            modules: {
                db: db ? 'loaded' : 'not loaded',
                logger: logger ? 'loaded' : 'not loaded',
            }
        });
    });
    // Debug route to check module imports
    app.get('/api/debug/modules', (req, res) => {
        const dbInfo = {
            loaded: !!db,
            hasUserPreferences: !!(db && db.userPreferences),
            hasStockEvents: !!(db && db.stockEvents),
        };
        res.json({
            db: dbInfo,
            logger: {
                loaded: !!logger,
            },
            environment: {
                NODE_PATH: process.env.NODE_PATH || '(not set)',
                NODE_ENV: process.env.NODE_ENV || 'development',
            }
        });
    });
    // Root
    app.get('/', (req, res) => {
        res.json({
            name: "AI Hedge Fund API",
            version: "0.1.0",
            message: "Welcome to the AI Hedge Fund API"
        });
    });
    // Load API routes
    const initializeRoutes = async () => {
        try {
            logger.info('Loading API route modules...');
            // Determine the base path for module imports based on environment
            const isProduction = process.env.NODE_ENV === 'production';
            // Updated path resolution strategy - try multiple paths if needed
            const moduleBasePaths = isProduction
                ? ['./modules/', '../modules/', './', '../']
                : ['./modules/', './'];
            // Modified approach: Try multiple import paths before falling back
            const loadRouteModule = async (modulePath) => {
                // Try each possible base path
                for (const basePath of moduleBasePaths) {
                    try {
                        const fullPath = `${basePath}${modulePath}`;
                        logger.info(`Attempting to import from: ${fullPath}`);
                        return await import(fullPath);
                    }
                    catch (err) {
                        logger.warn(`Failed to import from ${basePath}${modulePath}:`, err.message);
                        // Continue trying other paths
                    }
                }
                // If we've tried all paths and none worked, throw an error
                throw new Error(`Could not import module: ${modulePath} from any available path`);
            };
            // Load route modules using the enhanced dynamic import strategy
            try {
                // User routes
                logger.info('Loading user routes...');
                const { userRoutes } = await loadRouteModule('users/users.routes.js');
                app.use('/api/users', createRouterFromHonoApp(userRoutes));
                logger.info('User routes loaded successfully');
                // Updates routes
                logger.info('Loading updates routes...');
                const { updatesRoutes } = await loadRouteModule('updates/updates.routes.js');
                app.use('/api/updates', createRouterFromHonoApp(updatesRoutes));
                logger.info('Updates routes loaded successfully');
                // AI Triggers routes
                logger.info('Loading AI triggers routes...');
                const { aiTriggersRoutes } = await loadRouteModule('ai-triggers/ai-triggers.routes.js');
                app.use('/api/triggers', createRouterFromHonoApp(aiTriggersRoutes));
                logger.info('AI triggers routes loaded successfully');
                // Notifications routes
                logger.info('Loading notifications routes...');
                const { notificationsRoutes } = await loadRouteModule('notifications/notifications.routes.js');
                app.use('/api/notifications', createRouterFromHonoApp(notificationsRoutes));
                logger.info('Notifications routes loaded successfully');
                // Economic reports routes
                logger.info('Loading economic reports routes...');
                const { economicReportsRoutes } = await loadRouteModule('economic-reports/economic-reports.routes.js');
                app.use('/api/economic-reports', createRouterFromHonoApp(economicReportsRoutes));
                logger.info('Economic reports routes loaded successfully');
                // Interviews routes
                logger.info('Loading interviews routes...');
                const { interviewsRoutes } = await loadRouteModule('interviews/interviews.routes.js');
                app.use('/api/interviews', createRouterFromHonoApp(interviewsRoutes));
                logger.info('Interviews routes loaded successfully');
                // Market data routes
                logger.info('Loading market data routes...');
                const { marketDataRoutes } = await loadRouteModule('market-data/market-data.routes.js');
                app.use('/api/market-data', createRouterFromHonoApp(marketDataRoutes));
                logger.info('Market data routes loaded successfully');
                // Price alerts routes
                logger.info('Loading price alerts routes...');
                const { priceAlertsRoutes } = await loadRouteModule('market-data/price-alerts.routes.js');
                app.use('/api/price-alerts', createRouterFromHonoApp(priceAlertsRoutes));
                logger.info('Price alerts routes loaded successfully');
                // Scheduled tasks routes
                logger.info('Loading scheduled tasks routes...');
                const { scheduledTasksRoutes } = await loadRouteModule('market-data/scheduled-tasks.routes.js');
                app.use('/api/tasks', createRouterFromHonoApp(scheduledTasksRoutes));
                logger.info('Scheduled tasks routes loaded successfully');
                // AI query routes
                logger.info('Loading AI query routes...');
                const { aiQueryRoutes } = await loadRouteModule('ai-query/ai-query.routes.js');
                app.use('/api/ai-query', createRouterFromHonoApp(aiQueryRoutes));
                logger.info('AI query routes loaded successfully');
                // Unusual whales routes
                logger.info('Loading unusual whales routes...');
                const { unusualWhalesRoutes } = await loadRouteModule('unusual-whales/unusual-whales.routes.js');
                app.use('/unusual-whales', createRouterFromHonoApp(unusualWhalesRoutes));
                logger.info('Unusual whales routes loaded successfully');
                // Unusual whales scheduled tasks routes
                logger.info('Loading unusual whales scheduled tasks routes...');
                const { unusualWhalesScheduledTasksRoutes } = await loadRouteModule('unusual-whales/scheduled-tasks.routes.js');
                app.use('/unusual-whales/tasks', createRouterFromHonoApp(unusualWhalesScheduledTasksRoutes));
                logger.info('Unusual whales scheduled tasks routes loaded successfully');
                logger.info('All API routes loaded successfully');
            }
            catch (error) {
                logger.error(`Failed to load route modules: ${error.message}`, { stack: error.stack });
                // If critical routes could not be loaded, create error endpoints instead of mockups
                logger.warn('Setting up error endpoints for failed route modules');
                // Function to create an error router instead of a mock router
                const createErrorRouter = (routeName) => {
                    const router = express.Router();
                    router.all('*', (req, res) => {
                        logger.error(`Request to uninitialized ${routeName} route: ${req.method} ${req.path}`);
                        return res.status(500).json({
                            status: 'error',
                            message: `API error: ${routeName} module could not be loaded`,
                            details: 'There was an error loading the required API module. Please check the server logs.'
                        });
                    });
                    return router;
                };
                // Set up error routes instead of mock routes
                app.use('/api/users', createErrorRouter('users'));
                logger.info('Error users routes applied');
                app.use('/api/market-data', createErrorRouter('market-data'));
                logger.info('Error market data routes applied');
                app.use('/api/updates', createErrorRouter('updates'));
                logger.info('Error updates routes applied');
            }
            // Initialize schedulers
            try {
                logger.info('Initializing schedulers...');
                // Initialize collection scheduler
                const { collectionScheduler } = await import(`${moduleBasePaths[0]}market-data/collection-scheduler.js`);
                // Initialize alert scheduler
                const { alertScheduler } = await import(`${moduleBasePaths[0]}market-data/alert-scheduler.js`);
                // Initialize schedulers if enabled
                if (process.env.ENABLE_DATA_COLLECTION === "true") {
                    logger.info('Starting data collection scheduler...');
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
                    logger.info('Data collection scheduler started');
                }
                // Initialize and start the price alert scheduler
                if (process.env.ENABLE_PRICE_ALERTS === "true") {
                    logger.info('Starting price alert scheduler...');
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
                    logger.info('Price alert scheduler started');
                }
                logger.info('Schedulers initialized successfully');
            }
            catch (error) {
                logger.error(`Failed to initialize schedulers: ${error.message}`, { stack: error.stack });
            }
        }
        catch (routeError) {
            logger.error(`Error initializing routes: ${routeError.message}`, {
                stack: routeError.stack
            });
        }
    };
    // Initialize routes
    initializeRoutes().catch(err => {
        logger.error(`Failed to initialize routes: ${err.message}`, { stack: err.stack });
    });
    // Error handling
    app.use((err, req, res, next) => {
        logger.error("Error in request", { error: err.message, stack: err.stack, url: req.url });
        res.status(500).json({ status: "error", message: err.message, code: 500 });
    });
    // Start the server
    app.listen(PORT, HOST, () => {
        logger.info(`Server running at http://${HOST}:${PORT}`);
    });
    return app;
}
//# sourceMappingURL=server.js.map