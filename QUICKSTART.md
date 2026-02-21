# Quick Start Guide

## Get Running in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Already Configured
`.env` file already contains your rb2 credentials (Productive, Linear, Notion, GitHub).

### 3. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

## What You'll See

**Dashboard displays:**
- All active Productive budgets (projects)
- Health status (green/yellow/red) per project
- Budget % with visual progress bars
- PM governance % (10-15% compliance)
- Sprint load from Linear (if team mapping configured)
- Real-time alerts (budget, PM, sprint overload, ticket quality)

**Auto-refreshes every 5 minutes**

## Customization

### Add More Projects

Edit `src/server/projects.ts`:
```typescript
const PROJECT_TEAM_MAPPING: Record<string, string> = {
  'Your Productive Project Name': 'LINEAR_TEAM_KEY',
  // Add more mappings
}
```

### Change Refresh Interval

Edit `src/routes/index.tsx`:
```typescript
staleTime: 5 * 60 * 1000,        // Change 5 to desired minutes
refetchInterval: 5 * 60 * 1000,  // Change 5 to desired minutes
```

### Modify Health Thresholds

Edit `src/server/projects.ts` in `determineHealth()` function.

## Troubleshooting

**"Productive credentials not configured"**
- Check `.env` file exists and has `PRODUCTIVE_ORG_ID` and `PRODUCTIVE_API_TOKEN`

**"Linear API error"**
- Check `.env` has `LINEAR_API_TOKEN`
- Verify team keys in PROJECT_TEAM_MAPPING exist in Linear

**No Linear data showing**
- Projects without Linear mapping still show Productive data
- Add mapping in `src/server/projects.ts`

## Production Build

```bash
npm run build
npm run serve
```

## Next Steps

1. Review dashboard metrics
2. Add missing project mappings
3. Adjust thresholds to match rb2 standards
4. Deploy to production (Vercel recommended)

## Support

Repository: https://github.com/rubenlangeweg/delivery-command-center
Built with TanStack Start + TypeScript + Tailwind CSS
