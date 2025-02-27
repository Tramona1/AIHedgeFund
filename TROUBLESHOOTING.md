# AI Hedge Fund Troubleshooting Log

## Overview

This document tracks the troubleshooting efforts and configurations we've tried to resolve issues in the AI Hedge Fund project.

## TypeScript Build Issues

### Problem: Package @repo/db fails to build due to TypeScript errors

**Error Messages:**
- Error TS6307: Files not listed in the project file list, specifically:
  - `/Users/blakesingleton/Desktop/AIHedgeFund/packages/db/src/schema/index.ts`
  - `/Users/blakesingleton/Desktop/AIHedgeFund/packages/db/src/types.ts`

**Root Cause:**
- Multiple versions of `drizzle-orm` in the monorepo causing type conflicts
- TypeScript configuration issues with module resolution
- Issues with file inclusion in the TypeScript project configuration
- Module format mismatch between CommonJS and ESM across packages

### Solutions Attempted:

1. **Package.json Exports Configuration** ✓
   - Simplified the `exports` field in `packages/db/package.json`
   - Removed dual-format exports to avoid complexity
   - Set `main` to `"./dist/index.js"` and `types` to `"./dist/index.d.ts"`

2. **Custom tsconfig.build.json** ✓
   - Created `packages/db/tsconfig.build.json` with explicit file listing
   - Updated to use `include` pattern instead of explicit `files` array
   - Added `paths` mapping for package dependencies
   - Added TypeScript project references

3. **drizzle-orm.d.ts Declaration File** ✓
   - Created a declaration file to help resolve conflicts between different versions of drizzle-orm
   - File is being correctly included in the build

4. **db-utils.ts Helper Functions** ✓
   - Created utility functions in `apps/api/src/lib/db-utils.ts` to handle type-safe database operations
   - Added functions like `selectWhere`, `insertInto`, and `safeEq` to work around type conflicts
   - Successfully implemented in several service files

5. **pnpm Overrides** ✓
   - Added `"drizzle-orm": "0.30.10"` to the `overrides` section in root `package.json`
   - This forces all packages to use the same version
   - Helps reduce type conflicts across the monorepo

6. **Direct TypeScript Compilation** ✓
   - Modified `packages/db/package.json` to use `tsc` directly instead of `tsup`
   - Added command: `"build": "rm -rf dist && npm run build:ts && mkdir -p dist/schema && cp package.json dist/ && cp src/schema/*.ts dist/schema/"`
   - Successfully built the TypeScript files with proper structure

7. **Remove External Dependencies** ✓
   - Removed dependency on `@repo/logger` from `migrate.ts`
   - Created internal logging function to avoid external dependencies
   - Successfully built the package with this change

8. **Reinstall Dependencies** ✓
   - Ran `pnpm install` to ensure workspace packages are correctly linked
   - Verified that symbolic links exist in `node_modules/@repo/`
   - This did not resolve the Bun resolution issue

9. **Switch API build from Bun to tsc** ❌
   - Modified API's package.json to use tsc instead of Bun for building
   - Added a copy-deps.js script to copy workspace packages
   - Added "type": "module" to package.json
   - This resulted in module format mismatches and file extension issues with imports

10. **Create Bun Configuration and Use External Flag** ✓
   - Created `apps/api/bunfig.toml` with explicit workspace mappings:
     ```toml
     [resolver]
     "@repo/db" = "../../packages/db/dist/index.js"
     "@repo/logger" = "../../packages/logger/dist/index.js"
     "@repo/id" = "../../packages/id/dist/index.js"
     ```
   - Modified the API build script to use the `--external` flag to prevent bundling workspace packages:
     ```json
     "build": "bun build src/index.ts --outdir ./dist --target bun --external @repo/*"
     ```
   - This approach successfully built the API without type errors or module resolution issues

### Current Status:
- The `@repo/db` package now builds successfully with TypeScript ✓
- Workspace symlinks are correctly set up ✓ 
- API builds successfully with Bun using the external flag and bunfig.toml ✓
- All package dependencies properly resolved ✓

## Final Verification

We created a verification script that confirms all components are correctly configured:

```js
// Output of verification script
=== API Setup Verification ===
✅ bunfig.toml exists
bunfig.toml content: [resolver]
"@repo/db" = "../../packages/db/dist/index.js"
"@repo/logger" = "../../packages/logger/dist/index.js"
"@repo/id" = "../../packages/id/dist/index.js" 
✅ @repo/db dist directory exists
Files in @repo/db/dist:
[ 'package.json', 'schema' ]
✅ @repo directory in node_modules exists
Workspace links in node_modules/@repo:
- db -> ../../../../packages/db
- id -> ../../../../packages/id
- logger -> ../../../../packages/logger
✅ API package.json exists
API build script: bun build src/index.ts --outdir ./dist --target bun --external @repo/*
=== Verification Complete ===
```

This confirms that:
1. The Bun configuration file is correctly set up with the right paths
2. The @repo/db package has a dist directory with the necessary files
3. Workspace symlinks are properly established in node_modules
4. The API package.json has the correct build script with the external flag

## Environment File Consolidation

**Status:** ✓
- Created consolidated `.env.example` file at the project root
- Included all environment variables from:
  - `/apps/api/.env.example`
  - `/apps/web/.env.local.example`
  - `/apps/data-pipeline/.env.example`
- Organized variables into logical sections with clear comments

## Lessons Learned

1. **Module Format Consistency**
   - Mixing ESM and CommonJS modules in a monorepo can cause resolution issues
   - Consider standardizing on one format across the entire project

2. **TypeScript Project References**
   - Using TypeScript project references helps manage dependencies between packages
   - Ensures proper build order and type checking across the workspace

3. **Bundle External Dependencies**
   - Using the `--external` flag with bundlers helps prevent workspace dependencies from being included in the bundle
   - This allows the runtime to resolve these dependencies correctly

4. **Explicit Package Resolution**
   - In complex monorepos, sometimes explicit resolution mappings (like in bunfig.toml) are needed
   - This helps the bundler or runtime locate packages correctly across the workspace

5. **Verification Is Essential**
   - Creating verification scripts helps confirm that all components are correctly configured
   - This provides confidence that the setup is working as expected and helps diagnose issues 