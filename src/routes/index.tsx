import { createFileRoute } from '@tanstack/react-router'
import { getProjects } from '../server/projects'
import { ProjectTable } from '../components/ProjectTable'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 minutes
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{(error as Error).message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const stats = projects ? {
    total: projects.length,
    healthy: projects.filter(p => p.health === 'green').length,
    warning: projects.filter(p => p.health === 'yellow').length,
    critical: projects.filter(p => p.health === 'red').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget.allocated, 0),
    totalSpent: projects.reduce((sum, p) => sum + p.budget.spent, 0),
  } : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Delivery Command Center
          </h1>
          <p className="text-gray-600">
            Real-time project health monitoring combining Productive financial data and Linear operational metrics
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Projects</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Health Status</h3>
              <div className="flex gap-3 text-sm">
                <span className="text-green-600 font-semibold">{stats.healthy} OK</span>
                <span className="text-yellow-600 font-semibold">{stats.warning} Warning</span>
                <span className="text-red-600 font-semibold">{stats.critical} Critical</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Budget</h3>
              <p className="text-3xl font-bold text-gray-900">
                EUR {(stats.totalBudget / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Spent</h3>
              <p className="text-3xl font-bold text-gray-900">
                EUR {(stats.totalSpent / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        )}

        {/* Refresh Info */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Auto-refreshes every 5 minutes
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Refresh Now
          </button>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {projects && <ProjectTable projects={projects} />}
        </div>

        {/* Last Updated */}
        {projects && projects.length > 0 && (
          <p className="mt-4 text-sm text-gray-500 text-center">
            Last updated: {new Date(projects[0].lastUpdated).toLocaleString('nl-NL')}
          </p>
        )}
      </div>
    </div>
  )
}
