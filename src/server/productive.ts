import { createServerFn } from '@tanstack/start'

const PRODUCTIVE_BASE_URL = 'https://api.productive.io/api/v2'

interface ProductiveBudget {
  id: string
  type: string
  attributes: {
    name: string
    total_time_budget_cents: number
    total_time_budget_logged_cents: number
    total_time_budget_scheduled_cents: number
  }
}

interface ProductiveTimeEntry {
  id: string
  attributes: {
    time: number
    note: string
  }
  relationships: {
    service: { data: { id: string } }
    person: { data: { id: string } }
  }
}

interface ProductiveService {
  id: string
  attributes: {
    name: string
  }
}

export const fetchProductiveBudgets = createServerFn('GET', async () => {
  const orgId = process.env.PRODUCTIVE_ORG_ID
  const token = process.env.PRODUCTIVE_API_TOKEN

  if (!orgId || !token) {
    throw new Error('Productive credentials not configured')
  }

  const response = await fetch(
    `${PRODUCTIVE_BASE_URL}/budgets?filter[budget]=true&page[size]=100`,
    {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'X-Auth-Token': token,
        'X-Organization-Id': orgId,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Productive API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data as ProductiveBudget[]
})

export const fetchProductiveTimeEntries = createServerFn(
  'GET',
  async ({ budgetId }: { budgetId: string }) => {
    const orgId = process.env.PRODUCTIVE_ORG_ID
    const token = process.env.PRODUCTIVE_API_TOKEN

    if (!orgId || !token) {
      throw new Error('Productive credentials not configured')
    }

    const response = await fetch(
      `${PRODUCTIVE_BASE_URL}/time_entries?filter[budget_id]=${budgetId}&page[size]=500`,
      {
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'X-Auth-Token': token,
          'X-Organization-Id': orgId,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Productive API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      timeEntries: data.data as ProductiveTimeEntry[],
      services: data.included?.filter((i: any) => i.type === 'services') as ProductiveService[] || [],
    }
  }
)

export const calculatePMGovernance = (
  timeEntries: ProductiveTimeEntry[],
  services: ProductiveService[]
) => {
  const pmServices = services.filter(
    s => s.attributes.name.toLowerCase().includes('project management') ||
         s.attributes.name.toLowerCase().includes('pm')
  )
  const pmServiceIds = new Set(pmServices.map(s => s.id))

  const pmEntries = timeEntries.filter(
    e => pmServiceIds.has(e.relationships.service.data.id)
  )

  const pmHours = pmEntries.reduce((sum, e) => sum + e.attributes.time, 0) / 60
  const totalHours = timeEntries.reduce((sum, e) => sum + e.attributes.time, 0) / 60

  const percentage = totalHours > 0 ? (pmHours / totalHours) * 100 : 0
  const compliant = percentage >= 10 && percentage <= 15

  return {
    hours: Math.round(pmHours * 10) / 10,
    percentage: Math.round(percentage * 10) / 10,
    compliant,
    threshold: { min: 10, max: 15 },
  }
}
