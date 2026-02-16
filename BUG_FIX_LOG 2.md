# Bug Fix Log

## 1. Vite Alias Resolution Error
- **Issue**: Rollup failed to resolve `@/*` imports (e.g., `@/App.jsx`).
- **Cause**: The Base44 Vite plugin previously handled the alias resolution, but it was removed.
- **Fix**: Added `resolve.alias` configuration to `vite.config.js` to point `@` to the `src` directory.

## 2. Missing Base44 Client Dependencies
- **Issue**: Multiple components were importing `base44` and calling `api.entities.filter` or `api.functions.invoke`.
- **Cause**: The SDK was removed, leaving these calls broken.
- **Fix**: Created a comprehensive mock `apiClient.js` that provides a similar interface (via a Proxy for entities) and returns realistic data for edge calculations.

## 3. Potential "Invalid time value" crashes
- **Issue**: Proactive concern about date parsing in `statsEngine.jsx`.
- **Cause**: Handling of missing or malformed date strings from external sources.
- **Fix**: Implemented a `safeDate` helper in `apiClient.js` and applied it to all critical date parsing locations in `statsEngine.jsx`.

## 4. Unremoved Base44 References
- **Issue**: Trace amounts of "base44" and "lovable" were still present in the codebase.
- **Cause**: Global string matches.
- **Fix**: Performed a global search-and-replace to rename `base44` to `api` and updated all relevant file names and imports.
