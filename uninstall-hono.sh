#!/bin/bash
# Script to uninstall Hono and related packages after migration to Express

echo "Uninstalling Hono packages..."

# Navigate to the API directory
cd apps/api

# Uninstall Hono packages
npm uninstall hono @hono/zod-validator

# Install Express packages
npm install express express-validator helmet morgan
npm install --save-dev @types/express @types/cors @types/morgan

echo "Hono packages have been uninstalled."
echo "Express packages have been installed or updated."

# Build the project with the new dependencies
echo "Rebuilding the project..."
npm run build

echo "Migration complete. Run 'npm run start:prod' to start the Express server." 