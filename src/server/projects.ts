import { createServerFn } from '@tanstack/start'
import type { ProjectHealth, HealthStatus, Alert } from '../types'
import {
  fetchProductiveBudgets,
  fetchProductiveTimeEntries,
  calculatePMGovernance,
} from './productive'
import {
  fetchLinearTeamData,
  calculateSprintMetrics,
  calculateTicketQuality,
} from './linear'

// Mapping between Productive project names and Linear team keys
const PROJECT_TEAM_MAPPING: Record<string, string> = {
  'MCS MVP 3.0': 'MCS',
  'HocoParts': 'HOCO',
  'NuBuiten': 'NUBU',
  'IPN Sopral Integration': 'IPN',
  // Add more mappings as needed
}

function determineHealth(
  budgetPercentage: number,
  pmCompliant: boolean,
  sprintOverbooked: boolean
): HealthStatus {
  if (budgetPercentage >= 95 || !pmCompliant || sprintOverbooked) {
    return 'red'
  }
  if (budgetPercentage >= 85 || budgetPercentage >= 75) {
    return 'yellow'
  }
  return 'green'
}

function generateAlerts(
  budgetPercentage: number,
  pmGovernance: any,
  linearMetrics: any
): Alert[] {
  const alerts: Alert[] = []

  // Budget alerts
  if (budgetPercentage >= 95) {
    alerts.push({
      type: 'budget',
      severity: 'critical',
      message: `Budget critical: ${budgetPercentage.toFixed(1)}% used`,
    })
  } else if (budgetPercentage >= 85) {
    alerts.push({
      type: 'budget',
      severity: 'warning',
      message: `Budget warning: ${budgetPercentage.toFixed(1)}% used`,
    })
  } else if (budgetPercentage >= 75) {
    alerts.push({
      type: 'budget',
      severity: 'warning',
      message: `Budget approaching 75%: ${budgetPercentage.toFixed(1)}% used`,
    })
  }

  // PM governance alerts
  if (!pmGovernance.compliant) {
    alerts.push({
      type: 'pm-governance',
      severity: pmGovernance.percentage < 5 ? 'critical' : 'warning',
      message: `PM governance outside range: ${pmGovernance.percentage.toFixed(1)}% (need 10-15%)`,
    })
  }

  // Sprint overload alerts
  if (linearMetrics.overbooked) {
    alerts.push({
      type: 'sprint-overload',
      severity: linearMetrics.sprintLoad > 200 ? 'critical' : 'warning',
      message: `Sprint overbooked: ${linearMetrics.sprintLoad}% capacity`,
    })
  }

  // Ticket quality alerts
  if (linearMetrics.ticketQuality.percentage < 90) {
    alerts.push({
      type: 'ticket-quality',
      severity: linearMetrics.ticketQuality.percentage < 70 ? 'critical' : 'warning',
      message: `Low ticket quality: ${linearMetrics.ticketQuality.percentage.toFixed(1)}% have descriptions`,
    })
  }

  return alerts
}

export const getProjects = createServerFn('GET', async (): Promise<ProjectHealth[]> => {
  try {
    const budgets = await fetchProductiveBudgets()
    const projects: ProjectHealth[] = []

    for (const budget of budgets) {
      const budgetId = budget.id
      const projectName = budget.attributes.name

      // Fetch Productive data
      const { timeEntries, services } = await fetchProductiveTimeEntries({ budgetId })
      const pmGovernance = calculatePMGovernance(timeEntries, services)

      // Calculate budget metrics (Productive uses cents)
      const allocated = budget.attributes.total_time_budget_cents / 100
      const spent = budget.attributes.total_time_budget_logged_cents / 100
      const forecast = budget.attributes.total_time_budget_scheduled_cents / 100
      const percentage = allocated > 0 ? (forecast / allocated) * 100 : 0

      // Fetch Linear data if mapping exists
      const teamKey = PROJECT_TEAM_MAPPING[projectName]
      let linearMetrics = {
        sprintLoad: 0,
        capacity: 0,
        overbooked: false,
        ticketQuality: { total: 0, withDescription: 0, percentage: 0 },
      }

      if (teamKey) {
        try {
          const teamData = await fetchLinearTeamData({ teamKey })
          const teamMembers = Array.from(
            new Set(timeEntries.map(e => e.relationships.person.data.id))
          )
          const teamSize = teamMembers.length || 5 // fallback

          const sprintMetrics = calculateSprintMetrics(teamData.activeCycle, teamSize)
          const ticketQuality = calculateTicketQuality(teamData.issues.nodes)

          linearMetrics = {
            ...sprintMetrics,
            ticketQuality,
          }
        } catch (err) {
          console.error(`Failed to fetch Linear data for ${teamKey}:`, err)
        }
      }

      const health = determineHealth(percentage, pmGovernance.compliant, linearMetrics.overbooked)
      const alerts = generateAlerts(percentage, pmGovernance, linearMetrics)

      // Extract team info
      const uniqueMembers = Array.from(new Set(timeEntries.map(e => e.relationships.person.data.id)))

      projects.push({
        id: budgetId,
        name: projectName,
        budget: {
          allocated,
          spent,
          forecast,
          percentage: Math.round(percentage * 10) / 10,
        },
        pmGovernance,
        linear: linearMetrics,
        health,
        alerts,
        team: {
          size: uniqueMembers.length,
          members: uniqueMembers,
        },
        lastUpdated: new Date().toISOString(),
      })
    }

    return projects.sort((a, b) => {
      // Sort by health (red > yellow > green), then by budget %
      const healthOrder = { red: 0, yellow: 1, green: 2 }
      const healthDiff = healthOrder[a.health] - healthOrder[b.health]
      if (healthDiff !== 0) return healthDiff
      return b.budget.percentage - a.budget.percentage
    })
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    throw error
  }
})
