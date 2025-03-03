// @ts-check
import path from 'path';
import { fileURLToPath } from 'url';
import { tryImport, createComponentLogger } from './module-resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a logger for the main application
const logger = createComponentLogger('api-main');

// Load environment variables if needed
const NODE_ENV = process.env.NODE_ENV || 'development';
logger.info(`Starting API in ${NODE_ENV} mode`);
logger.info(`NODE_PATH: ${process.env.NODE_PATH || '(not set)'}`);

// Import modules using the resolver
async function startAPI() {
  try {
    // Import the database
    logger.info('Importing @repo/db...');
    const dbModule = await tryImport('@repo/db');
    logger.info('Successfully imported @repo/db');
    
    // Import other repositories
    logger.info('Importing @repo/logger...');
    const loggerModule = await tryImport('@repo/logger');
    logger.info('Successfully imported @repo/logger');
    
    // Make the imported modules globally available
    global.dbImport = dbModule;
    global.loggerImport = loggerModule;
    
    // Import the actual server code
    logger.info('Importing server modules...');
    const { setupServer } = await import('./server.js');
    
    // Start the server with the imported modules
    setupServer({
      db: dbModule,
      logger: loggerModule.logger
    });
    
    logger.info('API startup complete');
  } catch (error) {
    logger.error(`API startup failed: ${error.message}`, {
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Start the API
startAPI(); 