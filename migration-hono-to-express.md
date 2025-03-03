# Migration from Hono to Express

## Overview
This document outlines the migration plan for converting the API from Hono to Express. The current codebase is in a mixed state with some routes implemented in Hono and some in Express, with an adapter layer bridging the two frameworks. This migration will consolidate all routes to use Express exclusively.

## Current Architecture
- The API uses a mix of Express and Hono
- `server.js` is the main Express server
- Many route modules use Hono's framework
- An adapter function `createRouterFromHonoApp` converts Hono routes to Express routes
- Some fallback routes are already implemented directly in Express

## Migration Steps

### 1. Create Express Route Patterns
For each Hono route module, we will:
- Remove Hono imports
- Replace Hono app with Express Router
- Convert route handlers to Express style:
  - Change `app.get('/', async (c) => {...})` to `router.get('/', async (req, res, next) => {...})`
  - Replace Hono context (`c`) with Express request/response objects
  - Update response handling (`c.json()` to `res.json()`)
  - Convert parameter/query handling

### 2. Convert Middleware and Validators
- Migrate Hono validators to Express validators (express-validator)
- Replace Hono middleware with Express middleware alternatives

### 3. Update Server.js
- Remove the Hono adapter function
- Update route imports and mounting
- Simplify error handling

### 4. Update Dependencies
- Remove Hono dependencies from package.json
- Add any missing Express-related dependencies

### 5. Update Types
- Remove Hono type definitions 
- Create or update Express type definitions

## Migration Example

### Before (Hono):
```typescript
import { Hono } from "hono";
import { logger } from "@repo/logger";

const app = new Hono();

app.get('/', async (c) => {
  try {
    const data = await fetchData();
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export const myRoutes = app;
```

### After (Express):
```typescript
import express from "express";
import { logger } from "@repo/logger";

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const data = await fetchData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export const myRoutes = router;
```

## Testing Strategy
- Implement changes module by module
- Test each converted module individually
- Run integration tests after all modules are converted
- Verify API responses match the expected behavior

## Timeline
1. Setup and planning: 1 day
2. Convert route modules: 2-3 days
3. Update main server file: 1 day
4. Update dependencies and types: 1 day
5. Testing and bugfixes: 2 days

Total estimated time: 7-8 days 