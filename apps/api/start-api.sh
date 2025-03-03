#!/bin/bash

# Enhanced API starter script with environment checks and port verification

# Directory setup
ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
API_DIR="$ROOT_DIR/apps/api"
cd "$API_DIR" || { echo "Failed to change to API directory"; exit 1; }

echo "Starting API from: $API_DIR"
echo "Root directory: $ROOT_DIR"

# Load environment variables in order of precedence
echo "Loading environment variables..."
# First load root .env if it exists
if [ -f "$ROOT_DIR/.env" ]; then
  echo "Loading root .env file"
  set -o allexport
  source "$ROOT_DIR/.env"
  set +o allexport
  echo "Environment loaded from root .env"
else
  echo "No root .env file found"
fi

# Then load local .env.local which takes precedence
if [ -f "$API_DIR/.env.local" ]; then
  echo "Loading API-specific .env.local file"
  set -o allexport
  source "$API_DIR/.env.local"
  set +o allexport
  echo "Environment loaded from API .env.local"
else
  echo "No API .env.local file found"
fi

# Display key environment variables for verification
echo "─────────────────────────────────────"
echo "Environment Configuration:"
echo "─────────────────────────────────────"
echo "PORT: $PORT"
echo "HOST: $HOST"
echo "NODE_PATH: $NODE_PATH"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "─────────────────────────────────────"

# Check if port is already in use
PORT=${PORT:-3001}
if lsof -i:"$PORT" > /dev/null; then
  echo "Error: Port $PORT is already in use. Please free the port or choose a different one."
  lsof -i:"$PORT" | grep LISTEN
  exit 1
fi

# Setup package links
echo "Setting up package links..."
npm run setup-dev-links

# Start the API with the correct configuration using the module resolver version
echo "Starting API server with module resolver on port $PORT..."
NODE_PATH="$NODE_PATH:../../packages:../.." node src/index-with-resolver.js 