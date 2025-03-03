/**
 * Module resolver for @repo/* packages
 * This file is used to resolve imports from @repo/* packages
 * with direct paths to the source files
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Direct references to each package
export const DB_PATH = '../../packages/db';
export const ID_PATH = '../../packages/id';
export const LOGGER_PATH = '../../packages/logger';

// Database mock implementation
export const db = {
  _: {
    schema: {
      users: {},
      userPreferences: {},
      stockUpdates: {},
      aiTriggers: {},
      economicReports: {},
      interviews: {},
      newsletterPreferences: {},
      optionsFlow: {},
      darkPoolData: {},
      marketData: {},
      stockData: {},
      priceAlerts: {},
      userWatchlist: {}
    }
  },
  select: () => ({ from: () => ({ where: () => [] }) }),
  insert: () => ({ values: () => ({ returning: () => [] }) }),
  update: () => ({ set: () => ({ where: () => [] }) }),
  delete: () => ({ where: () => [] })
};

// Logger implementation
export const logger = {
  info: (msg, ...args) => console.info(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args),
  child: () => logger
};

// Component logger factory function
export const createComponentLogger = (component) => ({
  info: (msg, ...args) => console.info(`[${component}] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[${component}] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[${component}] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[${component}] ${msg}`, ...args),
  child: () => createComponentLogger(component)
});

// ID generator
export const generateId = (prefix, length = 10) => `${prefix}${Math.random().toString(36).substring(2, 2 + length)}`;

// ID prefixes
export const IDPrefix = {
  USER: 'user_',
  STOCK_UPDATE: 'update_',
  AI_TRIGGER: 'trigger_',
  REPORT: 'report_',
  INTERVIEW: 'interview_'
};

// ID validator
export const validateId = (id, prefix) => id && typeof id === 'string' && id.startsWith(prefix);

// SQL helper functions (for use with db-helpers.ts)
export const SQL = {
  eq: (field, value) => ({ type: 'equal', field, value }),
  and: (...conditions) => ({ type: 'and', conditions }),
  or: (...conditions) => ({ type: 'or', conditions }),
};

// This module handles direct imports from packages when standard module resolution fails

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(__dirname, '../../../packages');

export function resolvePackage(packageName: string): string {
  // Remove @repo/ prefix if present
  const pkgName = packageName.replace(/^@repo\//, '');
  
  // Check if package exists in packages directory
  const packagePath = path.join(packagesDir, pkgName);
  
  if (fs.existsSync(packagePath)) {
    // Find main entry point from package.json
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const mainFile = packageJson.main || './dist/index.js';
        return path.join(packagePath, mainFile);
      } catch (error) {
        console.error(`Error parsing package.json for ${pkgName}:`, error);
      }
    }
    
    // Fallback to common entry points
    const possibleEntries = [
      path.join(packagePath, 'dist/index.js'),
      path.join(packagePath, 'dist/index.cjs'),
      path.join(packagePath, 'src/index.ts'),
      path.join(packagePath, 'index.js')
    ];
    
    for (const entry of possibleEntries) {
      if (fs.existsSync(entry)) {
        return entry;
      }
    }
  }
  
  throw new Error(`Could not resolve package: ${packageName}`);
}

export function tryImport(packageName: string) {
  try {
    // First try normal import
    return import(packageName);
  } catch (error) {
    // If that fails, try direct resolution
    console.log(`Standard import failed for ${packageName}, trying direct resolution`);
    const resolvedPath = resolvePackage(packageName);
    return import(resolvedPath);
  }
} 