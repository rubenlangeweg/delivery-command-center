export type HealthStatus = 'green' | 'yellow' | 'red'

export interface Alert {
  type: 'budget' | 'pm-governance' | 'sprint-overload' | 'ticket-quality'
  severity: 'warning' | 'critical'
  message: string
}

export interface Budget {
  allocated: number
  spent: number
  forecast: number
  percentage: number
}

export interface PMGovernance {
  hours: number
  percentage: number
  compliant: boolean
  threshold: { min: number; max: number }
}

export interface LinearMetrics {
  sprintLoad: number
  capacity: number
  overbooked: boolean
  ticketQuality: {
    total: number
    withDescription: number
    percentage: number
  }
}

export interface ProjectHealth {
  id: string
  name: string
  budget: Budget
  pmGovernance: PMGovernance
  linear: LinearMetrics
  health: HealthStatus
  alerts: Alert[]
  team: {
    size: number
    members: string[]
  }
  lastUpdated: string
}

export interface TeamMember {
  id: string
  name: string
  projects: Array<{ id: string; name: string; allocation: number }>
  totalAllocation: number
  overloaded: boolean
}

export interface DashboardStats {
  totalProjects: number
  healthyProjects: number
  warningProjects: number
  criticalProjects: number
  totalBudget: number
  totalSpent: number
  avgBurnRate: number
}
