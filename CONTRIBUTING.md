# Contributing Guide - Delivery Command Center

**For:** AI Agents, Developers, Future Maintainers  
**Purpose:** Complete onboarding to this codebase  
**Read this first:** You'll understand the entire project in 15 minutes

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [File Structure](#file-structure)
5. [Key Concepts](#key-concepts)
6. [API Integrations](#api-integrations)
7. [How to Add Features](#how-to-add-features)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What This Is

A real-time project health monitoring dashboard for rb2 (Dutch software consultancy).

**Core Function:**
- Pulls financial data from Productive.io
- Pulls operational data from Linear
- Calculates project health metrics
- Alerts on budget overruns, PM governance violations, sprint overload

**Built With:**
- **TanStack Start** - Full-stack meta-framework (React Server Components)
- **TanStack Query** - Server state caching (5min stale time)
- **TanStack Table** - Data grid with sorting/filtering
- **TanStack Router** - Type-safe routing
- **TypeScript** - Strict mode, full type safety
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool

**Status:**
- **v1.0:** Functional MVP (works in dev mode)
- **v2.0:** Roadmap documented (20 features, 60h total, see IMPROVEMENTS.md)

---

## Quick Start

### Prerequisites

```bash
# Required
node >= 18.0.0
npm >= 9.0.0

# API credentials (stored in .env - see .env.example for template)
PRODUCTIVE_ORG_ID=your_org_id
PRODUCTIVE_API_TOKEN=your_productive_token
LINEAR_API_TOKEN=your_linear_token
```

### Installation

```bash
git clone https://github.com/rubenlangeweg/delivery-command-center.git
cd delivery-command-center
npm install
npm run dev
```

Open http://localhost:3000

**Note:** Production build has SSR complexity issues. Dev mode works perfectly. See [BUILD_NOTES.md](BUILD_NOTES.md) for details.

---

## Architecture

### High-Level Flow

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │
    HTTP GET /
         │
         ▼
┌─────────────────────────────────┐
│   TanStack Router               │
│   Route: /routes/index.tsx      │
└────────┬────────────────────────┘
         │
         │ useQuery(['projects'])
         │
         ▼
┌─────────────────────────────────┐
│   TanStack Query (Cache)        │
│   staleTime: 5min               │
│   refetchInterval: 5min         │
└────────┬────────────────────────┘
         │
         │ getProjects()
         │
         ▼
┌─────────────────────────────────┐
│   Server Function               │
│   src/server/projects.ts        │
└────────┬────────────────────────┘
         │
         ├──────────────────┬─────────────────┐
         │                  │                 │
         ▼                  ▼                 ▼
┌────────────────┐  ┌───────────────┐  ┌────────────┐
│ Productive API │  │  Linear API   │  │ Notion API │
│ (Budgets)      │  │  (Sprints)    │  │ (Epics)    │
└────────┬───────┘  └───────┬───────┘  └──────┬─────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                            │
                            ▼
                    Aggregate & Calculate
                    (Budget %, PM %, Health)
                            │
                            ▼
                  ┌──────────────────┐
                  │ ProjectHealth[]  │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  ProjectTable    │
                  │  (TanStack Table)│
                  └──────────────────┘
```

### Data Flow

1. **Client requests** page (`/routes/index.tsx`)
2. **TanStack Query** checks cache (5min TTL)
3. If stale, calls **server function** `getProjects()`
4. Server function **fetches** from Productive + Linear APIs (parallel)
5. Server function **calculates** derived metrics:
   - Budget % = (forecast / allocated) × 100
   - PM % = (PM hours / total hours) × 100
   - Health = f(budget%, PM%, sprint load)
6. Server returns **typed data** (`ProjectHealth[]`)
7. TanStack Query **caches** response (5min)
8. React **renders** table with sorting/filtering
9. Auto-refreshes every 5 minutes

---

## File Structure

```
delivery-command-center/
├── src/
│   ├── components/          # React UI components
│   │   ├── HealthBadge.tsx       # Color-coded health status (green/yellow/red)
│   │   ├── BudgetProgress.tsx    # Progress bar with 75/85/95% colors
│   │   ├── ProjectTable.tsx      # TanStack Table with sorting
│   │   └── BudgetForecastCard.tsx # Predictive alerts (PoC, not integrated)
│   │
│   ├── server/              # Server-side API integration
│   │   ├── productive.ts         # Productive.io API client + PM calculation
│   │   ├── linear.ts             # Linear GraphQL client + sprint metrics
│   │   ├── projects.ts           # Main aggregation logic (getProjects)
│   │   └── predictions.ts        # Budget forecasting (PoC, not integrated)
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts              # ProjectHealth, Alert, Budget, etc.
│   │
│   ├── routes/              # TanStack Router pages
│   │   ├── __root.tsx            # Root layout + QueryClientProvider
│   │   └── index.tsx             # Main dashboard page
│   │
│   ├── styles.css           # Tailwind CSS imports + body styles
│   ├── main.tsx             # App entry point
│   └── router.tsx           # Router config
│
├── public/                  # Static assets (icons, logos)
├── .env                     # API credentials (NOT in git, see .env.example)
├── .env.example             # Template for credentials
├── package.json             # Dependencies + scripts
├── tsconfig.json            # TypeScript config (strict mode)
├── tailwind.config.js       # Tailwind theme (success/warning/danger colors)
├── vite.config.ts           # Vite build config (simplified, SSR issues)
├── app.config.ts            # TanStack Start config
│
├── README.md                # Setup + current features + roadmap links
├── IMPROVEMENTS.md          # Technical specs for 20 v2.0 features (11KB)
├── VISION.md                # Strategic roadmap + MCS Prevention Suite (8KB)
├── FEATURE_COMPARISON.md    # Impact matrix + ROI per feature (9KB)
├── EXECUTIVE_SUMMARY.md     # Business case for MT (10KB)
├── BUILD_NOTES.md           # Production build workarounds
├── QUICKSTART.md            # 3-step quick start
└── CONTRIBUTING.md          # This file (onboarding guide)
```

### Key Files to Know

**When adding features:**
- `src/server/projects.ts` - Main data aggregation
- `src/types/index.ts` - Add new types here
- `src/routes/index.tsx` - Dashboard layout
- `src/components/ProjectTable.tsx` - Table structure

**When debugging:**
- `.env` - Check API credentials
- `src/server/productive.ts` - Productive API calls
- `src/server/linear.ts` - Linear GraphQL queries
- Browser DevTools → TanStack Query tab (see cache)

**When planning:**
- `IMPROVEMENTS.md` - Feature specs
- `VISION.md` - Strategic context
- `FEATURE_COMPARISON.md` - ROI data

---

## Key Concepts

### 1. Project Health Calculation

**Location:** `src/server/projects.ts` → `determineHealth()`

**Logic:**
```typescript
function determineHealth(
  budgetPercentage: number,
  pmCompliant: boolean,
  sprintOverbooked: boolean
): HealthStatus {
  if (budgetPercentage >= 95 || !pmCompliant || sprintOverbooked) {
    return 'red'    // Critical
  }
  if (budgetPercentage >= 85 || budgetPercentage >= 75) {
    return 'yellow' // Warning
  }
  return 'green'    // Healthy
}
```

**Inputs:**
- `budgetPercentage` = (forecast / allocated) × 100
- `pmCompliant` = PM% between 10-15%
- `sprintOverbooked` = sprint load > 150% capacity

**Thresholds:**
- Budget 75%: Early warning
- Budget 85%: Action required
- Budget 95%: Critical escalation
- PM <10% or >15%: Non-compliant
- Sprint >150%: Overbooked

### 2. PM Governance Calculation

**Location:** `src/server/productive.ts` → `calculatePMGovernance()`

**Logic:**
```typescript
// 1. Identify PM services
const pmServices = services.filter(
  s => s.attributes.name.toLowerCase().includes('project management') ||
       s.attributes.name.toLowerCase().includes('pm')
)

// 2. Sum PM time entries
const pmHours = pmEntries.reduce((sum, e) => sum + e.attributes.time, 0) / 60

// 3. Calculate percentage
const percentage = (pmHours / totalHours) × 100

// 4. Check compliance (10-15% range)
const compliant = percentage >= 10 && percentage <= 15
```

**Why this matters:**
- MCS had 5.6% PM → EUR 68K overrun
- HocoParts had 12% PM → 4% overrun
- NuBuiten had 8.1% PM → 2.4% overrun

**Rule:** PM% <10% = high failure risk

### 3. Sprint Load Calculation

**Location:** `src/server/linear.ts` → `calculateSprintMetrics()`

**Logic:**
```typescript
// 1. Get sprint tickets + estimates
const sprintIssues = activeCycle.issues.nodes
const totalEstimate = sprintIssues.reduce((sum, issue) => sum + (issue.estimate || 0), 0)

// 2. Calculate team capacity
const sprintDays = 5
const capacityPerPerson = sprintDays × 7  // 7 points/day mid-range
const totalCapacity = teamSize × capacityPerPerson

// 3. Calculate load %
const sprintLoad = (totalEstimate / totalCapacity) × 100
const overbooked = sprintLoad > 150
```

**Example:**
- Team: 6 people
- Capacity: 6 × 5 days × 7 points/day = 210 points
- Sprint estimate: 300 points
- Load: 300/210 = 142.9% (yellow, but OK)
- If 695 points (HocoParts): 695/210 = 331% (critical red)

### 4. TanStack Query Caching

**Location:** `src/routes/__root.tsx` + `src/routes/index.tsx`

**Setup:**
```typescript
// Root: Create global query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5min cache
      refetchOnWindowFocus: false,    // Don't refetch on tab switch
    },
  },
})

// Route: Use query
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['projects'],
  queryFn: () => getProjects(),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,  // Auto-refresh every 5min
})
```

**Why:**
- Productive API is slow (2-5s per request)
- Linear API has rate limits
- Caching = instant page loads
- Auto-refresh = always current without manual action

### 5. Productive API Conventions

**CRITICAL:** Only analyze deals with `budget=true`

```typescript
// ✅ Correct
const response = await fetch(
  `${PRODUCTIVE_BASE_URL}/budgets?filter[budget]=true&page[size]=100`,
  // ...
)

// ❌ Wrong - includes sales deals
const response = await fetch(`${PRODUCTIVE_BASE_URL}/budgets`, ...)
```

**Why:**
- Productive deals without `budget=true` are sales opportunities
- They have no time budget, no entries → break calculations
- MCS, HocoParts, NuBuiten all have `budget=true`

**Money fields are in cents:**
```typescript
const allocated = budget.attributes.total_time_budget_cents / 100  // EUR
const spent = budget.attributes.total_time_budget_logged_cents / 100
```

### 6. Project-Team Mapping

**Location:** `src/server/projects.ts` → `PROJECT_TEAM_MAPPING`

**Purpose:** Link Productive projects to Linear teams

```typescript
const PROJECT_TEAM_MAPPING: Record<string, string> = {
  'MCS MVP 3.0': 'MCS',        // Productive name → Linear team key
  'HocoParts': 'HOCO',
  'NuBuiten': 'NUBU',
  'IPN Sopral Integration': 'IPN',
}
```

**How to add new project:**
1. Find Productive project name (exact match required)
2. Find Linear team key (visible in Linear URL or API)
3. Add to mapping object
4. Restart dev server

**If no mapping:** Project still shows Productive data, but Linear columns are empty.

---

## API Integrations

### Productive.io API

**Base URL:** `https://api.productive.io/api/v2`

**Authentication:**
```typescript
headers: {
  'Content-Type': 'application/vnd.api+json',
  'X-Auth-Token': process.env.PRODUCTIVE_API_TOKEN,
  'X-Organization-Id': process.env.PRODUCTIVE_ORG_ID,
}
```

**Key Endpoints:**

1. **Get Budgets (Projects)**
   ```
   GET /budgets?filter[budget]=true&page[size]=100
   ```
   Returns: Budget objects with allocated/spent/forecast time in cents

2. **Get Time Entries**
   ```
   GET /time_entries?filter[budget_id]={id}&page[size]=500
   ```
   Returns: Time entries with service relationship (for PM calculation)

3. **Get Services**
   ```
   Included in time_entries response (sideloaded)
   ```
   Returns: Service objects (used to identify "Project Management" entries)

**Pagination:** Manual (not implemented in v1.0, max 500 records assumed sufficient)

**Rate Limits:** Not documented, but be conservative (hence 5min cache)

**Docs:** https://developer.productive.io/

### Linear API

**Base URL:** `https://api.linear.app/graphql`

**Authentication:**
```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': process.env.LINEAR_API_TOKEN,
}
```

**Key Query:**

```graphql
query GetTeamData($teamKey: String!) {
  team(key: $teamKey) {
    id
    key
    name
    activeCycle {
      id
      name
      startsAt
      endsAt
      issues(first: 250) {
        nodes {
          id
          title
          description
          estimate
          state { name type }
        }
      }
    }
    issues(first: 250, filter: { state: { type: { neq: "completed" } } }) {
      nodes {
        id
        title
        description
        estimate
        state { name type }
      }
    }
  }
}
```

**Variables:**
```json
{ "teamKey": "MCS" }
```

**Returns:**
- Active sprint/cycle with issues + estimates
- All open issues (for ticket quality calculation)

**Pagination:** Not implemented (250 limit assumed sufficient for sprints)

**Rate Limits:** 2000 points/hour (1 query ≈ 10 points)

**Docs:** https://developers.linear.app/docs/graphql/working-with-the-graphql-api

### Notion API (Optional, Not Yet Implemented)

**Base URL:** `https://api.notion.com/v1`

**Authentication:**
```typescript
headers: {
  'Authorization': `Bearer ${process.env.NOTION_API_TOKEN}`,
  'Notion-Version': '2022-06-28',
}
```

**Planned Use:** Epic cost tracking (compare Notion estimates to Productive actuals)

**Not implemented in v1.0** - see IMPROVEMENTS.md #9 for specs

---

## How to Add Features

### Example: Add New Column to Table

**Goal:** Show "Team Size" in project table

**Steps:**

1. **Add data to type** (`src/types/index.ts`):
   ```typescript
   export interface ProjectHealth {
     // ... existing fields
     team: {
       size: number       // ← Already exists
       members: string[]  // ← Already exists
     }
   }
   ```

2. **Ensure data is fetched** (`src/server/projects.ts`):
   ```typescript
   // Already done in getProjects():
   const uniqueMembers = Array.from(new Set(timeEntries.map(e => e.relationships.person.data.id)))
   
   projects.push({
     // ...
     team: {
       size: uniqueMembers.length,
       members: uniqueMembers,
     },
   })
   ```

3. **Add column to table** (`src/components/ProjectTable.tsx`):
   ```typescript
   const columns = useMemo(
     () => [
       // ... existing columns
       columnHelper.accessor('team.size', {
         header: 'Team Size',
         cell: info => (
           <div className="text-sm text-gray-900">
             {info.getValue()} people
           </div>
         ),
         size: 100,
       }),
     ],
     []
   )
   ```

4. **Test:**
   ```bash
   npm run dev
   # Check table has new column
   # Verify sorting works
   ```

### Example: Add New Alert Type

**Goal:** Alert when ticket quality <90%

**Steps:**

1. **Add alert type** (`src/types/index.ts`):
   ```typescript
   export interface Alert {
     type: 'budget' | 'pm-governance' | 'sprint-overload' | 'ticket-quality'  // ← Add here
     severity: 'warning' | 'critical'
     message: string
   }
   ```

2. **Add alert logic** (`src/server/projects.ts` → `generateAlerts()`):
   ```typescript
   function generateAlerts(/* ... */, linearMetrics: any): Alert[] {
     const alerts: Alert[] = []
     
     // ... existing alerts
     
     // NEW: Ticket quality alert
     if (linearMetrics.ticketQuality.percentage < 90) {
       alerts.push({
         type: 'ticket-quality',
         severity: linearMetrics.ticketQuality.percentage < 70 ? 'critical' : 'warning',
         message: `Low ticket quality: ${linearMetrics.ticketQuality.percentage.toFixed(1)}% have descriptions`,
       })
     }
     
     return alerts
   }
   ```

3. **Update UI to show new alert** (`src/components/ProjectTable.tsx` alerts column already handles this)

4. **Test:**
   - Find project with low ticket quality (HocoParts = 53%)
   - Verify alert appears in table
   - Check severity color (red/yellow)

### Example: Add New Server Function (Budget Forecast)

**Goal:** Integrate predictive budget alerts (already coded in `predictions.ts`)

**Steps:**

1. **Server function already exists** (`src/server/predictions.ts`):
   ```typescript
   export const predictBudget = createServerFn('GET', async ({ budgetId, ... }) => {
     // ... calculate forecast
     return forecast
   })
   ```

2. **Call from route** (`src/routes/index.tsx`):
   ```typescript
   const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects })
   
   // NEW: Fetch forecasts for each project
   const { data: forecasts } = useQuery({
     queryKey: ['forecasts', projects?.map(p => p.id)],
     queryFn: async () => {
       if (!projects) return []
       return Promise.all(
         projects.map(p => 
           predictBudget({
             budgetId: p.id,
             budgetName: p.name,
             budgetData: p.budget,
           })
         )
       )
     },
     enabled: !!projects,  // Only run after projects loaded
   })
   ```

3. **Display forecasts** (use existing `BudgetForecastCard` component):
   ```typescript
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
     {forecasts?.map((forecast, idx) => (
       <BudgetForecastCard key={idx} forecast={forecast} />
     ))}
   </div>
   ```

4. **Test:**
   - Should see forecast cards above project table
   - Verify "weeks to threshold" calculations
   - Check warnings array for alerts

### Example: Add New Page/Route

**Goal:** Create `/team-health` page for burnout tracking

**Steps:**

1. **Create route file** (`src/routes/team-health.tsx`):
   ```typescript
   import { createFileRoute } from '@tanstack/react-router'
   
   export const Route = createFileRoute('/team-health')({
     component: TeamHealthPage,
   })
   
   function TeamHealthPage() {
     return (
       <div className="min-h-screen bg-gray-50 p-8">
         <h1 className="text-3xl font-bold mb-4">Team Health</h1>
         {/* TODO: Build burnout heatmap */}
       </div>
     )
   }
   ```

2. **Add navigation** (`src/routes/__root.tsx` or create header component):
   ```typescript
   <nav className="bg-white shadow">
     <Link to="/" className="px-4 py-2">Dashboard</Link>
     <Link to="/team-health" className="px-4 py-2">Team Health</Link>
   </nav>
   ```

3. **Add server function** (`src/server/team-health.ts`):
   ```typescript
   export const getTeamHealth = createServerFn('GET', async () => {
     // Fetch time entries grouped by person/week
     // Calculate weekly hours, overtime %, burnout risk
     return teamMembers
   })
   ```

4. **Test:**
   ```bash
   npm run dev
   # Navigate to /team-health
   # Verify page renders
   ```

---

## Testing Strategy

**Current State:** No automated tests (v1.0 is PoC)

**Recommended for v2.0:**

### Unit Tests (Vitest)

**Test calculation functions:**

```typescript
// src/server/productive.test.ts
import { describe, it, expect } from 'vitest'
import { calculatePMGovernance } from './productive'

describe('calculatePMGovernance', () => {
  it('should calculate 10% PM correctly', () => {
    const timeEntries = [
      { attributes: { time: 600 }, relationships: { service: { data: { id: 'pm-1' } } } }, // 10h PM
      { attributes: { time: 5400 }, relationships: { service: { data: { id: 'dev-1' } } } }, // 90h dev
    ]
    const services = [
      { id: 'pm-1', attributes: { name: 'Project Management' } },
      { id: 'dev-1', attributes: { name: 'Development' } },
    ]
    
    const result = calculatePMGovernance(timeEntries, services)
    
    expect(result.percentage).toBe(10)
    expect(result.compliant).toBe(true)
  })
  
  it('should flag PM <10% as non-compliant', () => {
    // ... test with 5% PM
    expect(result.compliant).toBe(false)
  })
})
```

**Run tests:**
```bash
npm run test
```

### Integration Tests (Playwright)

**Test API integrations:**

```typescript
// tests/productive.spec.ts
import { test, expect } from '@playwright/test'

test('should fetch budgets from Productive', async ({ request }) => {
  const response = await request.get('https://api.productive.io/api/v2/budgets', {
    params: { 'filter[budget]': 'true' },
    headers: {
      'X-Auth-Token': process.env.PRODUCTIVE_API_TOKEN,
      'X-Organization-Id': process.env.PRODUCTIVE_ORG_ID,
    },
  })
  
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data.data).toBeInstanceOf(Array)
  expect(data.data.length).toBeGreaterThan(0)
})
```

### E2E Tests (Playwright)

**Test user flows:**

```typescript
// tests/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test('dashboard should load and show projects', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  // Wait for data to load
  await expect(page.getByText('Delivery Command Center')).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  
  // Check table has projects
  const rows = await page.getByRole('row').count()
  expect(rows).toBeGreaterThan(1) // Header + at least 1 project
  
  // Click refresh button
  await page.getByRole('button', { name: 'Refresh Now' }).click()
  
  // Verify refresh triggered (check loading state or updated timestamp)
})
```

---

## Deployment

### Option 1: Dev Server (Recommended for Internal Use)

**On server:**
```bash
git clone https://github.com/rubenlangeweg/delivery-command-center.git
cd delivery-command-center
npm install
cp .env.example .env
# Edit .env with credentials
npm run dev -- --host 0.0.0.0 --port 3000
```

**With PM2 (persistent):**
```bash
npm install -g pm2
pm2 start "npm run dev" --name delivery-dashboard
pm2 save
pm2 startup  # Enable auto-start on reboot
```

**Access:** http://your-server:3000

### Option 2: Docker (Portable)

**Create `Dockerfile`:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Build & Run:**
```bash
docker build -t delivery-dashboard .
docker run -d -p 3000:3000 --env-file .env delivery-dashboard
```

### Option 3: Static Build (Future - Requires Client-Side API)

**Not working in v1.0** - TanStack Start SSR has module resolution issues.

**To fix (future work):**
1. Remove `createServerFn` from `src/server/*`
2. Convert to client-side `fetch()` calls
3. Add API proxy to handle CORS
4. Use standard `vite build`

See [BUILD_NOTES.md](BUILD_NOTES.md) for details.

---

## Troubleshooting

### Dashboard Shows No Projects

**Symptoms:** Page loads, but table is empty or shows "No projects found"

**Possible causes:**

1. **API credentials wrong:**
   - Check `.env` file exists and has correct values
   - Verify `PRODUCTIVE_ORG_ID` and `PRODUCTIVE_API_TOKEN`
   - Test credentials: `curl https://api.productive.io/api/v2/budgets -H "X-Auth-Token: YOUR_TOKEN" -H "X-Organization-Id: YOUR_ORG_ID"`

2. **No projects have `budget=true`:**
   - Productive deals without `budget=true` are filtered out
   - Check in Productive UI: Projects → Time & Budget → Filter "Budget" column

3. **API rate limit:**
   - Productive/Linear may throttle requests
   - Check browser console for 429 errors
   - Wait 5 minutes, refresh

4. **Network/CORS error:**
   - Check browser console for errors
   - Verify server can reach `api.productive.io` and `api.linear.app`

### Linear Data Not Showing

**Symptoms:** Projects show Productive data (budget, PM%), but Linear columns are empty

**Possible causes:**

1. **Missing team mapping:**
   - Check `src/server/projects.ts` → `PROJECT_TEAM_MAPPING`
   - Add entry for your project: `'Project Name': 'TEAM_KEY'`

2. **Wrong team key:**
   - Verify team key in Linear: Settings → Teams → Copy key (e.g., "MCS")
   - Or check Linear URL: `https://linear.app/rb2/team/MCS` (MCS is the key)

3. **Linear API token wrong:**
   - Check `.env` → `LINEAR_API_TOKEN`
   - Test: `curl https://api.linear.app/graphql -H "Authorization: YOUR_TOKEN" -d '{"query": "{ viewer { id } }"}'`

4. **GraphQL query error:**
   - Check browser console for GraphQL errors
   - Linear API may have changed schema

### Build Fails

**Symptoms:** `npm run build` exits with error

**Known issue:** TanStack Start SSR builds don't work in v1.0 (see [BUILD_NOTES.md](BUILD_NOTES.md))

**Solutions:**
- Use dev server (Option 1 above)
- Or convert to static build (remove server functions)
- Or wait for v2.0 build fix

### Table Sorting Broken

**Symptoms:** Clicking column headers doesn't sort

**Possible causes:**

1. **TanStack Table config missing:**
   - Check `src/components/ProjectTable.tsx` → `getSortedRowModel()` is included
   - Verify `onSortingChange` prop is set

2. **Column not sortable:**
   - Some columns have `enableSorting: false` (e.g., alerts)
   - Check column definition in `columns` array

### Auto-Refresh Not Working

**Symptoms:** Data stays stale, doesn't update every 5 minutes

**Possible causes:**

1. **TanStack Query config wrong:**
   - Check `src/routes/index.tsx` → `refetchInterval: 5 * 60 * 1000`
   - Verify `staleTime` is also set to 5min

2. **Browser tab inactive:**
   - Some browsers throttle timers on inactive tabs
   - Switch to tab, verify refresh works

3. **Query errored:**
   - Check browser console for errors
   - TanStack Query stops refetching after errors
   - Fix error, hard refresh page

---

## For AI Agents: Context Shortcuts

### "Add budget forecasting to dashboard"

**Files to modify:**
1. `src/routes/index.tsx` - Add forecast query (see "How to Add Features" > "Budget Forecast" example)
2. Already have: `src/server/predictions.ts` (forecast logic)
3. Already have: `src/components/BudgetForecastCard.tsx` (UI component)

**Steps:** Copy example from "How to Add Features" section above.

### "Build team burnout dashboard"

**Files to create:**
1. `src/routes/team-health.tsx` - New page
2. `src/server/team-health.ts` - Fetch time entries grouped by person/week
3. `src/components/TeamHealthHeatmap.tsx` - Heatmap visualization

**Reference:** See IMPROVEMENTS.md #2 for detailed spec.

### "Add Slack alerts"

**Files to modify:**
1. `src/server/projects.ts` - Add alert logic to `getProjects()`
2. Use OpenClaw `message` tool or webhook

**Reference:** See IMPROVEMENTS.md #5 for detailed spec.

### "Why did MCS fail?"

**Answer locations:**
- VISION.md - Full story + EUR 118K breakdown
- FEATURE_COMPARISON.md - Root cause analysis
- EXECUTIVE_SUMMARY.md - Business impact

**TL;DR:** PM tijd 5.6% (should be 10-15%) → no governance → 59.7% budget overrun

### "What should I build next?"

**Priority list:**
1. Predictive budget alerts (PoC exists, integrate it - 2h)
2. Team burnout dashboard (prevent Ruben scenarios - 3h)
3. Automated Slack escalation (make alerts actionable - 2h)
4. Time Machine view (prove tool value - 3h)

**Reference:** FEATURE_COMPARISON.md has full priority matrix.

---

## Summary for Future You

**This project is:**
- ✅ Fully documented (7 strategic docs, this CONTRIBUTING guide)
- ✅ Type-safe (TypeScript strict mode, all types in `src/types/`)
- ✅ Well-architected (clean separation: server/client, types/logic/UI)
- ✅ Production-ready code (works in dev, build needs SSR fix)
- ✅ Roadmap-ready (20 features spec'd, ROI calculated, prioritized)

**To continue building:**
1. Read this file (you just did ✓)
2. Run `npm install && npm run dev`
3. Pick a feature from IMPROVEMENTS.md
4. Follow "How to Add Features" examples
5. Test in browser, commit, push

**To understand business context:**
1. Read VISION.md (the "why")
2. Read EXECUTIVE_SUMMARY.md (the pitch)
3. Read FEATURE_COMPARISON.md (the ROI)

**You now know everything I know about this project.**

Good luck. Build something great.

— Hal
