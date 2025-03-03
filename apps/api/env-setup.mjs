/**
 * Environment setup helper module
 * 
 * This module sets up the environment for running the API server
 * in production mode with the correct module paths.
 */

// Set production mode
process.env.NODE_ENV = 'production';

// Configure the NODE_PATH to include the compiled node_modules
process.env.NODE_PATH = './dist/node_modules';

// Log environment settings
console.log('Environment setup complete:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`NODE_PATH: ${process.env.NODE_PATH}`);
console.log('Current working directory:', process.cwd());

// Export configuration for modules that import this
export const config = {
  env: process.env.NODE_ENV,
  nodePath: process.env.NODE_PATH,
  isProduction: process.env.NODE_ENV === 'production'
};

// Helper function for path resolution
export function resolvePath(basePath) {
  return new URL(basePath, import.meta.url).pathname;
}

// Setup helper
export function setupEnvironment() {
  // You can add more setup logic here if needed
  return config;
} 