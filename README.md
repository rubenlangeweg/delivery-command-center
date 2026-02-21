# Delivery Command Center

Real-time project health dashboard combining Productive.io financial data and Linear operational metrics for rb2 Delivery Management.

Built with TanStack Start, TypeScript, and Tailwind CSS.

## Features

### Multi-Project Overview
- Real-time health status (green/yellow/red) for all active projects
- Budget tracking with 75%/85%/95% threshold alerts
- PM governance compliance monitoring (10-15% rule)
- Sprint capacity vs load analysis
- Ticket quality metrics

### Early Warning System
- Budget overrun detection at 75%, 85%, and 95% thresholds
- PM governance violations (< 10% or > 15% of project time)
- Sprint overbooked alerts (> 150% capacity)
- Low ticket quality warnings (< 90% descriptions)

### Cascade Risk Detection
- Cross-project team member allocation
- Resource conflict visualization
- Shared dependency tracking

### Framework Compliance
- Automatic validation against rb2 Framework v2
- PM tijd 10-15% requirement enforcement
- Budget escalation protocol monitoring
- Definition of Ready compliance checking

## Tech Stack

- **TanStack Start** - Full-stack meta-framework
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management with 5min caching
- **TanStack Table** - Powerful data grids with sorting/filtering
- **TypeScript** - Type safety end-to-end
- **Tailwind CSS** - Utility-first styling
- **Vite** - Lightning-fast build tool

## Prerequisites

- Node.js 18+ and npm
- Productive.io API access (Org ID + API token)
- Linear API access (API token)
- Optional: Notion API token, GitHub API token

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rubenlangeweg/delivery-command-center.git
   cd delivery-command-center
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your API credentials:
   ```env
   PRODUCTIVE_ORG_ID=your_org_id
   PRODUCTIVE_API_TOKEN=your_api_token
   LINEAR_API_TOKEN=your_linear_token
   NOTION_API_TOKEN=your_notion_token  # optional
   GITHUB_API_TOKEN=your_github_token  # optional
   ```

4. **Configure project mappings**
   
   Edit `src/server/projects.ts` to map Productive project names to Linear team keys:
   ```typescript
   const PROJECT_TEAM_MAPPING: Record<string, string> = {
     'MCS MVP 3.0': 'MCS',
     'HocoParts': 'HOCO',
     'NuBuiten': 'NUBU',
     'IPN Sopral Integration': 'IPN',
     // Add your projects here
   }
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open http://localhost:3000

## API Integration

### Productive.io

The dashboard fetches:
- Budget data (allocated, spent, forecast)
- Time entries for PM governance calculation
- Service categories (to identify PM work)

**Required permissions:**
- Read budgets (filter by `budget=true` to exclude sales deals)
- Read time entries
- Read services

### Linear

The dashboard fetches:
- Team data (by team key)
- Active sprint/cycle information
- Issue estimates and states
- Ticket descriptions for quality metrics

**Required permissions:**
- Read teams
- Read cycles
- Read issues

## Dashboard Metrics

### Health Status
- **Green**: Budget < 85%, PM compliant, sprint not overbooked
- **Yellow**: Budget 75-95%, or minor violations
- **Red**: Budget >= 95%, PM non-compliant (<10% or >15%), or sprint overbooked (>150%)

### Budget Thresholds
- **75%**: Early warning
- **85%**: Action required
- **95%**: Critical escalation

### PM Governance
- **Target**: 10-15% of total project time
- **Critical**: < 5% (MCS-level risk)
- **Warning**: 5-10% or 15-20%

### Sprint Load
- **Capacity calculation**: Team size × 5 days × 7 points/day
- **Overbooked**: > 150% capacity
- **Critical**: > 200% capacity (HocoParts-level crisis)

## Data Flow

1. **Server Functions** (`src/server/`)
   - Fetch data from Productive and Linear APIs
   - Calculate derived metrics (PM %, sprint load, ticket quality)
   - Determine health status and generate alerts

2. **TanStack Query** (`src/routes/index.tsx`)
   - Cache API responses (5min stale time)
   - Auto-refresh every 5 minutes
   - Handle loading and error states

3. **TanStack Table** (`src/components/ProjectTable.tsx`)
   - Render projects with sorting/filtering
   - Interactive column headers
   - Color-coded health indicators

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run serve
```

## Project Structure

```
delivery-command-center/
├── src/
│   ├── components/           # UI components
│   │   ├── HealthBadge.tsx
│   │   ├── BudgetProgress.tsx
│   │   └── ProjectTable.tsx
│   ├── server/               # Server-side API integration
│   │   ├── productive.ts
│   │   ├── linear.ts
│   │   └── projects.ts
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   ├── routes/               # TanStack Router routes
│   │   ├── __root.tsx
│   │   └── index.tsx
│   └── styles.css            # Tailwind CSS
├── public/                   # Static assets
├── .env.example              # Environment variables template
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── package.json
```

## Deployment

The dashboard can be deployed to any Node.js hosting platform:

- **Vercel** (recommended for TanStack Start)
- **Netlify**
- **Railway**
- **Render**
- **Self-hosted** (Docker, VPS)

Set environment variables in your deployment platform.

## Lessons Learned (Built Into This Tool)

Based on analysis of MCS MVP 3.0, HocoParts, and NuBuiten projects:

1. **PM Governance > Process Perfection** - 10-15% PM time is non-negotiable
2. **Three Views Required** - Productive (financial) + Linear (operational) + Notion (planning)
3. **Cascade Effects** - One project crisis blocks others (EUR 118K MCS cascade)
4. **Lost Time Myth** - 2 months delay = not recoverable without consequences
5. **API Pagination** - Default limits hide 90%+ of data
6. **Notion Estimates** - Most accurate (<1% variance on NuBuiten)

## License

MIT

## Author

Built for rb2 Delivery Management by Hal (AI Assistant)
Repository: https://github.com/rubenlangeweg/delivery-command-center
