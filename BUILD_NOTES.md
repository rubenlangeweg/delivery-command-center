# Build Notes

## Current Status

The dashboard is **fully functional in development mode**.

## Known Issue

TanStack Start SSR builds require complex Vinxi/Nitro configuration. The production build encounters module resolution issues with:
- `@tanstack/start` server functions
- Node.js async_hooks in browser context  
- Router generator compatibility

## Workaround: Use Development Mode

```bash
npm run dev
```

This runs the full dashboard with:
- Real-time Productive + Linear data
- 5-minute auto-refresh
- All features working

## Production Deployment Options

### Option 1: Deploy Dev Server
Deploy the dev server directly (works fine for internal tools):
```bash
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

### Option 2: Convert to Static Build
Remove server functions and use client-side API calls:
1. Move API logic from `src/server/` to client-side hooks
2. Use regular `fetch()` instead of `createServerFn`
3. Handle CORS for Productive/Linear APIs
4. Build with standard `vite build`

### Option 3: Use Node.js Server  
Deploy with Node.js process manager:
```bash
pm2 start "npm run dev" --name delivery-dashboard
```

## Recommendation

For internal rb2 use: **Option 1** (dev server on internal network)  
For external access: **Option 2** (static build with API proxy)

The dashboard code is production-ready - only the build tooling needs adjustment.
