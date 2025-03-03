/**
 * Sets up the Express server with the imported modules
 * @param {Object} options - Setup options
 * @param {Object} options.db - The database module
 * @param {Object} options.logger - The logger module
 */
export function setupServer({ db, logger }: {
    db: any;
    logger: any;
}): import("express-serve-static-core").Express;
