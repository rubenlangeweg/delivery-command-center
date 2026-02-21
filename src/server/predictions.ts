import { createServerFn } from '@tanstack/start'
import { fetchProductiveTimeEntries } from './productive'

interface WeeklyBurn {
  weekStart: string
  hours: number
  cost: number
}

interface BudgetForecast {
  projectId: string
  projectName: string
  currentBurnRate: number // EUR/week (last 4 weeks avg)
  weeksToThreshold: {
    75: number | null
    85: number | null
    95: number | null
  }
  projectedCompletionDate: string | null
  projectedFinalBudget: number
  projectedOverrun: number
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

function groupByWeek(timeEntries: any[], services: any[]): WeeklyBurn[] {
  const weeks = new Map<string, { hours: number; cost: number }>()
  const hourlyRate = 80 // EUR per hour (average)

  for (const entry of timeEntries) {
    const entryDate = new Date(entry.attributes.date || Date.now())
    const weekStart = getWeekStart(entryDate)
    const hours = entry.attributes.time / 60 // minutes to hours
    const cost = hours * hourlyRate

    const existing = weeks.get(weekStart) || { hours: 0, cost: 0 }
    weeks.set(weekStart, {
      hours: existing.hours + hours,
      cost: existing.cost + cost,
    })
  }

  return Array.from(weeks.entries())
    .map(([weekStart, data]) => ({
      weekStart,
      hours: Math.round(data.hours * 10) / 10,
      cost: Math.round(data.cost),
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

function calculateBurnRate(weeklyBurns: WeeklyBurn[], lookbackWeeks: number = 4): number {
  if (weeklyBurns.length === 0) return 0

  const recent = weeklyBurns.slice(-lookbackWeeks)
  const totalCost = recent.reduce((sum, w) => sum + w.cost, 0)
  return Math.round(totalCost / recent.length)
}

function forecastThreshold(
  currentSpent: number,
  budgetAllocated: number,
  burnRate: number,
  thresholdPercent: number
): number | null {
  const thresholdAmount = budgetAllocated * (thresholdPercent / 100)
  const remaining = thresholdAmount - currentSpent

  if (remaining <= 0) return null // already past threshold
  if (burnRate === 0) return null // no activity

  return Math.round((remaining / burnRate) * 10) / 10 // weeks
}

export const predictBudget = createServerFn(
  'GET',
  async ({ budgetId, budgetName, budgetData }: {
    budgetId: string
    budgetName: string
    budgetData: { allocated: number; spent: number; forecast: number }
  }): Promise<BudgetForecast> => {
    try {
      const { timeEntries, services } = await fetchProductiveTimeEntries({ budgetId })

      const weeklyBurns = groupByWeek(timeEntries, services)
      const burnRate = calculateBurnRate(weeklyBurns, 4)

      const weeksTo75 = forecastThreshold(budgetData.spent, budgetData.allocated, burnRate, 75)
      const weeksTo85 = forecastThreshold(budgetData.spent, budgetData.allocated, burnRate, 85)
      const weeksTo95 = forecastThreshold(budgetData.spent, budgetData.allocated, burnRate, 95)

      // Project final budget
      const remainingBudget = budgetData.allocated - budgetData.spent
      const remainingWeeks = remainingBudget / burnRate
      const projectedFinalBudget = budgetData.spent + (burnRate * remainingWeeks)
      const projectedOverrun = projectedFinalBudget - budgetData.allocated

      // Confidence based on data points
      const confidence: 'high' | 'medium' | 'low' =
        weeklyBurns.length >= 8 ? 'high' :
        weeklyBurns.length >= 4 ? 'medium' : 'low'

      // Generate warnings
      const warnings: string[] = []
      if (weeksTo75 && weeksTo75 < 2) {
        warnings.push(`75% threshold in ${weeksTo75.toFixed(1)} weeks`)
      }
      if (weeksTo85 && weeksTo85 < 4) {
        warnings.push(`85% threshold in ${weeksTo85.toFixed(1)} weeks`)
      }
      if (weeksTo95 && weeksTo95 < 6) {
        warnings.push(`95% threshold in ${weeksTo95.toFixed(1)} weeks`)
      }
      if (projectedOverrun > 0) {
        warnings.push(`Projected overrun: EUR ${Math.round(projectedOverrun / 1000)}K`)
      }

      // Burn rate trend
      if (weeklyBurns.length >= 8) {
        const recentBurn = calculateBurnRate(weeklyBurns, 4)
        const olderBurn = calculateBurnRate(weeklyBurns.slice(-8, -4), 4)
        if (recentBurn > olderBurn * 1.2) {
          warnings.push('Burn rate accelerating (up 20% vs 4 weeks ago)')
        }
      }

      const projectedCompletionDate = remainingWeeks > 0
        ? new Date(Date.now() + remainingWeeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null

      return {
        projectId: budgetId,
        projectName: budgetName,
        currentBurnRate: burnRate,
        weeksToThreshold: {
          75: weeksTo75,
          85: weeksTo85,
          95: weeksTo95,
        },
        projectedCompletionDate,
        projectedFinalBudget: Math.round(projectedFinalBudget),
        projectedOverrun: Math.round(projectedOverrun),
        confidence,
        warnings,
      }
    } catch (error) {
      console.error('Failed to predict budget:', error)
      throw error
    }
  }
)
