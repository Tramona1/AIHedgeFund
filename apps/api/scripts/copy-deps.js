import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the root directory of the project
const rootDir = path.resolve(__dirname, '../../..');
// Define the workspace packages that the API depends on
const workspacePackages = ['db', 'id', 'logger'];
// Target directory where compiled files will be placed
const apiDistDir = path.resolve(__dirname, '../dist');

console.log('Starting dependency copying process...');

// Create @repo directory in the dist folder
const repoDistDir = path.join(apiDistDir, '@repo');
if (!fs.existsSync(repoDistDir)) {
  fs.mkdirSync(repoDistDir, { recursive: true });
  console.log(`Created directory: ${repoDistDir}`);
}

// Process each workspace package
workspacePackages.forEach(packageName => {
  const packageSrcDir = path.join(rootDir, 'packages', packageName, 'dist');
  const packageDestDir = path.join(repoDistDir, packageName);
  
  console.log(`Processing package: @repo/${packageName}`);
  
  // Check if the package has been built
  if (!fs.existsSync(packageSrcDir)) {
    console.error(`Error: Package @repo/${packageName} dist directory not found at ${packageSrcDir}`);
    console.log(`Attempting to build @repo/${packageName}...`);
    
    try {
      execSync(`cd ${rootDir} && pnpm build --filter @repo/${packageName}`, { stdio: 'inherit' });
      console.log(`Successfully built @repo/${packageName}`);
    } catch (error) {
      console.error(`Failed to build @repo/${packageName}: ${error.message}`);
      process.exit(1);
    }
  }
  
  // Check again after potential build
  if (!fs.existsSync(packageSrcDir)) {
    console.error(`Error: Package @repo/${packageName} dist directory still not found after build attempt`);
    process.exit(1);
  }
  
  // Create target directory
  if (!fs.existsSync(packageDestDir)) {
    fs.mkdirSync(packageDestDir, { recursive: true });
    console.log(`Created directory: ${packageDestDir}`);
  }
  
  // Copy files
  try {
    copyDirRecursive(packageSrcDir, packageDestDir);
    console.log(`Successfully copied @repo/${packageName} files to ${packageDestDir}`);
  } catch (error) {
    console.error(`Error copying @repo/${packageName} files: ${error.message}`);
    process.exit(1);
  }
});

console.log('Dependency copying process completed successfully');

// Helper function to recursively copy directories
function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
} 