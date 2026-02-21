import type { HealthStatus } from '../types'

interface HealthBadgeProps {
  status: HealthStatus
  className?: string
}

export function HealthBadge({ status, className = '' }: HealthBadgeProps) {
  const colors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  }

  const labels = {
    green: 'Healthy',
    yellow: 'Warning',
    red: 'Critical',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status]} ${className}`}
    >
      {labels[status]}
    </span>
  )
}
