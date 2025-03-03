#!/usr/bin/env node
// @ts-check

// This script helps debug module resolution issues
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to check
const paths = [
  './node_modules/@repo/db',
  './node_modules/@repo/logger',
  './node_modules/@repo/id',
  '../../packages/db',
  '../../packages/logger',
  '../../packages/id'
];

console.log('API Startup Debugging Tool');
console.log('--------------------------');

// Check NODE_PATH
console.log(`NODE_PATH: ${process.env.NODE_PATH || '(not set)'}`);

// Check if paths exist
console.log('\nChecking paths:');
paths.forEach(p => {
  const exists = fs.existsSync(path.resolve(__dirname, p));
  console.log(`- ${p}: ${exists ? 'Exists ✓' : 'Missing ✗'}`);
  
  if (exists) {
    // List contents
    try {
      const contents = fs.readdirSync(path.resolve(__dirname, p));
      console.log(`  Contents: ${contents.slice(0, 5).join(', ')}${contents.length > 5 ? '...' : ''}`);
      
      // Check package.json
      const packageJsonPath = path.resolve(__dirname, p, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log(`  Package: ${packageJson.name}@${packageJson.version}`);
        console.log(`  Main: ${packageJson.main}`);
        console.log(`  Type: ${packageJson.type || 'commonjs'}`);
      }
      
      // Check for dist directory
      const distPath = path.resolve(__dirname, p, 'dist');
      if (fs.existsSync(distPath)) {
        const distContents = fs.readdirSync(distPath);
        console.log(`  Dist: ${distContents.slice(0, 5).join(', ')}${distContents.length > 5 ? '...' : ''}`);
      }
    } catch (error) {
      console.log(`  Error reading directory: ${error.message}`);
    }
  }
});

// Check if we can create a temporary package with the correct structure
console.log('\nAttempting to create temporary package structure...');

try {
  // Create temp directory if it doesn't exist
  const tempDir = path.resolve(__dirname, 'temp_modules/@repo');
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Create db directory
  const dbDir = path.join(tempDir, 'db');
  fs.mkdirSync(dbDir, { recursive: true });
  
  // Create minimal package.json
  const packageJson = {
    name: "@repo/db",
    version: "0.1.0",
    main: "./index.js",
    type: "module"
  };
  
  fs.writeFileSync(path.join(dbDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  // Create minimal index.js
  const indexContent = `
// Temporary mock module
export const db = {
  _: { schema: {} },
  userPreferences: {},
  stockEvents: {}
};
`;
  
  fs.writeFileSync(path.join(dbDir, 'index.js'), indexContent);
  
  console.log('Temporary package created successfully ✓');
} catch (error) {
  console.log(`Failed to create temporary package: ${error.message}`);
}

// Try to run the API with the temporary module
console.log('\nAttempting to run the API with debug configuration...');
try {
  execSync('NODE_PATH=./temp_modules:./node_modules node --experimental-specifier-resolution=node --input-type=module -e "import { db } from \'@repo/db\'; console.log(\'Successfully loaded @repo/db\', db)"', { 
    stdio: 'inherit',
    timeout: 5000
  });
} catch (error) {
  console.log('Failed to load @repo/db in test script');
} 