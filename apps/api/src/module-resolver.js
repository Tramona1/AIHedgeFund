// @ts-check
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a component-specific logger with consistent formatting
 * @param {string} component - The name of the component
 * @returns {Object} - Logger with component context
 */
export const createComponentLogger = (component) => ({
  info: (message, meta = {}) => console.log(`[${component}] INFO: ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[${component}] WARN: ${message}`, meta),
  error: (message, meta = {}) => console.error(`[${component}] ERROR: ${message}`, meta),
  debug: (message, meta = {}) => console.debug(`[${component}] DEBUG: ${message}`, meta),
});

/**
 * Generates a random ID with a specific prefix
 * @param {string} prefix - The prefix for the ID
 * @param {number} length - The length of the random part
 * @returns {string} - The generated ID
 */
export const generateId = (prefix, length = 10) => `${prefix}${Math.random().toString(36).substring(2, 2 + length)}`;

/**
 * Validates an ID format
 * @param {string|null|undefined} id - The ID to validate
 * @param {string} prefix - The expected prefix
 * @returns {boolean} - Whether the ID is valid
 */
export const validateId = (id, prefix) => Boolean(id && typeof id === 'string' && id.startsWith(prefix));

// Create a logger for module resolution
const moduleLogger = createComponentLogger('module-resolver');

/**
 * Resolves the absolute path to a package
 * @param {string} packageName - The name of the package to resolve
 * @returns {string} - The resolved path
 */
export function resolvePackage(packageName) {
  // Try different possible locations
  const possiblePaths = [
    // Node modules in current directory
    path.resolve(process.cwd(), 'node_modules', packageName),
    
    // Node modules in parent directory (workspace root)
    path.resolve(process.cwd(), '..', '..', 'node_modules', packageName),
    
    // Direct package path for workspace packages
    path.resolve(process.cwd(), '..', '..', 'packages', packageName.replace('@repo/', '')),
    
    // Temp modules for debugging
    path.resolve(process.cwd(), 'temp_modules', packageName),
  ];
  
  // Find the first path that exists
  for (const checkPath of possiblePaths) {
    if (fs.existsSync(checkPath)) {
      moduleLogger.info(`Resolved ${packageName} to ${checkPath}`);
      return checkPath;
    }
  }
  
  moduleLogger.error(`Failed to resolve package: ${packageName}`);
  throw new Error(`Could not resolve package: ${packageName}`);
}

/**
 * Attempts to import a package by trying different approaches
 * @param {string} packageName - The name of the package to import
 * @returns {Promise<any>} - The imported module
 */
export async function tryImport(packageName) {
  moduleLogger.info(`Trying to import ${packageName}`);
  
  try {
    // First try direct import
    return await import(packageName);
  } catch (error) {
    moduleLogger.warn(`Direct import of ${packageName} failed, trying resolution strategies...`);
    
    const resolvedPath = resolvePackage(packageName);
    
    // If it's @repo/db specifically, handle the CommonJS/ESM mismatch
    if (packageName === '@repo/db') {
      const cjsPath = path.join(resolvedPath, 'dist', 'index.cjs');
      
      if (fs.existsSync(cjsPath)) {
        moduleLogger.info(`Loading ${packageName} from CommonJS file: ${cjsPath}`);
        // For CommonJS files, we need to use a dynamic import with the file:// protocol
        return import(`file://${cjsPath}`).then(module => module.default || module);
      }
    }
    
    // Try import from the resolved path
    try {
      const pkgJsonPath = path.join(resolvedPath, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        const mainFile = pkgJson.main || './index.js';
        const mainPath = path.join(resolvedPath, mainFile);
        
        moduleLogger.info(`Importing ${packageName} from: ${mainPath}`);
        return import(`file://${mainPath}`).then(module => module.default || module);
      }
    } catch (innerError) {
      moduleLogger.error(`Failed to import from resolved path: ${innerError.message}`);
    }
    
    // If nothing worked, rethrow original error
    throw error;
  }
}

// Initialize module resolution
moduleLogger.info('Module resolver initialized'); 