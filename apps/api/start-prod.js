#!/usr/bin/env node

/**
 * Production server startup script
 * 
 * This script starts the API server in production mode using
 * the compiled JavaScript files from the dist directory.
 */

// Import the environment setup
import './env-setup.mjs';

console.log('Starting API server in production mode...');

// Dynamically import the server module
import('./dist/index.js')
  .then(() => {
    console.log('API server started successfully in production mode');
  })
  .catch((error) => {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }); 