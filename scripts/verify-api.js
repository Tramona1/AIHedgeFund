#!/usr/bin/env node

// This script verifies the API setup by checking if all the necessary files and dependencies are in place

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'apps', 'api');
const dbPackageDir = path.join(rootDir, 'packages', 'db');
const dbDistDir = path.join(dbPackageDir, 'dist');
const apiNodeModulesDir = path.join(apiDir, 'node_modules', '@repo');

console.log('=== API Setup Verification ===');

// Check bunfig.toml
const bunfigPath = path.join(apiDir, 'bunfig.toml');
if (fs.existsSync(bunfigPath)) {
  console.log('✅ bunfig.toml exists');
  const bunfigContent = fs.readFileSync(bunfigPath, 'utf8');
  console.log('bunfig.toml content:', bunfigContent);
} else {
  console.log('❌ bunfig.toml is missing');
}

// Check DB package dist
if (fs.existsSync(dbDistDir)) {
  console.log('✅ @repo/db dist directory exists');
  console.log('Files in @repo/db/dist:');
  const dbDistFiles = fs.readdirSync(dbDistDir);
  console.log(dbDistFiles);
} else {
  console.log('❌ @repo/db dist directory is missing');
}

// Check workspace symlinks in node_modules
if (fs.existsSync(apiNodeModulesDir)) {
  console.log('✅ @repo directory in node_modules exists');
  console.log('Workspace links in node_modules/@repo:');
  const repoLinks = fs.readdirSync(apiNodeModulesDir);
  
  repoLinks.forEach(link => {
    const linkPath = path.join(apiNodeModulesDir, link);
    const stats = fs.lstatSync(linkPath);
    if (stats.isSymbolicLink()) {
      const target = fs.readlinkSync(linkPath);
      console.log(`- ${link} -> ${target}`);
    } else {
      console.log(`- ${link} (not a symlink)`);
    }
  });
} else {
  console.log('❌ @repo directory in node_modules is missing');
}

// Check API package.json build script
const apiPackageJsonPath = path.join(apiDir, 'package.json');
if (fs.existsSync(apiPackageJsonPath)) {
  console.log('✅ API package.json exists');
  const apiPackageJson = require(apiPackageJsonPath);
  console.log('API build script:', apiPackageJson.scripts?.build);
} else {
  console.log('❌ API package.json is missing');
}

console.log('\n=== Verification Complete ==='); 