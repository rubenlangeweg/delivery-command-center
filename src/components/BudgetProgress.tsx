interface BudgetProgressProps {
  percentage: number
  className?: string
}

export function BudgetProgress({ percentage, className = '' }: BudgetProgressProps) {
  const getColor = (pct: number) => {
    if (pct >= 95) return 'bg-red-500'
    if (pct >= 85) return 'bg-yellow-500'
    if (pct >= 75) return 'bg-yellow-400'
    return 'bg-green-500'
  }

  const color = getColor(percentage)
  const width = Math.min(percentage, 100)

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}
