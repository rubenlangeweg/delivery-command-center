import { createServerFn } from '@tanstack/start'

const LINEAR_API_URL = 'https://api.linear.app/graphql'

interface LinearIssue {
  id: string
  title: string
  description: string | null
  estimate: number | null
  state: {
    name: string
    type: string
  }
}

interface LinearCycle {
  id: string
  name: string
  startsAt: string
  endsAt: string
  issues: {
    nodes: LinearIssue[]
  }
}

export const fetchLinearTeamData = createServerFn(
  'GET',
  async ({ teamKey }: { teamKey: string }) => {
    const token = process.env.LINEAR_API_TOKEN

    if (!token) {
      throw new Error('Linear API token not configured')
    }

    const query = `
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
                state {
                  name
                  type
                }
              }
            }
          }
          issues(first: 250, filter: { state: { type: { neq: "completed" } } }) {
            nodes {
              id
              title
              description
              estimate
              state {
                name
                type
              }
            }
          }
        }
      }
    `

    const response = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        query,
        variables: { teamKey },
      }),
    })

    if (!response.ok) {
      throw new Error(`Linear API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(`Linear GraphQL error: ${JSON.stringify(data.errors)}`)
    }

    return data.data.team
  }
)

export const calculateSprintMetrics = (
  activeCycle: LinearCycle | null,
  teamSize: number
) => {
  if (!activeCycle) {
    return {
      sprintLoad: 0,
      capacity: 0,
      overbooked: false,
    }
  }

  const sprintIssues = activeCycle.issues.nodes
  const totalEstimate = sprintIssues.reduce((sum, issue) => sum + (issue.estimate || 0), 0)

  // Assume 5-day sprint, 6-8 points per person per day
  const sprintDays = 5
  const capacityPerPerson = sprintDays * 7 // mid-range of 6-8
  const totalCapacity = teamSize * capacityPerPerson

  const sprintLoad = totalCapacity > 0 ? (totalEstimate / totalCapacity) * 100 : 0
  const overbooked = sprintLoad > 150

  return {
    sprintLoad: Math.round(sprintLoad),
    capacity: totalCapacity,
    overbooked,
  }
}

export const calculateTicketQuality = (issues: LinearIssue[]) => {
  const total = issues.length
  const withDescription = issues.filter(i => i.description && i.description.trim().length > 0).length
  const percentage = total > 0 ? (withDescription / total) * 100 : 0

  return {
    total,
    withDescription,
    percentage: Math.round(percentage * 10) / 10,
  }
}
