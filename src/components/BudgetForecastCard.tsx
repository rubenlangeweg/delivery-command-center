interface BudgetForecast {
  projectId: string
  projectName: string
  currentBurnRate: number
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

interface BudgetForecastCardProps {
  forecast: BudgetForecast
}

export function BudgetForecastCard({ forecast }: BudgetForecastCardProps) {
  const hasWarnings = forecast.warnings.length > 0
  const isOverrunProjected = forecast.projectedOverrun > 0

  const confidenceColors = {
    high: 'text-green-600',
    medium: 'text-yellow-600',
    low: 'text-gray-400',
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${hasWarnings ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Budget Forecast</h3>
        <span className={`text-xs font-medium ${confidenceColors[forecast.confidence]}`}>
          {forecast.confidence} confidence
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Burn rate (4-week avg)</span>
          <span className="font-medium">EUR {(forecast.currentBurnRate / 1000).toFixed(1)}K/week</span>
        </div>

        {isOverrunProjected && (
          <div className="flex justify-between text-red-600 font-medium">
            <span>Projected overrun</span>
            <span>+EUR {(forecast.projectedOverrun / 1000).toFixed(0)}K</span>
          </div>
        )}

        {forecast.projectedCompletionDate && (
          <div className="flex justify-between">
            <span className="text-gray-600">Est. completion</span>
            <span className="font-medium">{new Date(forecast.projectedCompletionDate).toLocaleDateString('nl-NL')}</span>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Weeks to threshold:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-500">75%</div>
              <div className={`font-medium ${forecast.weeksToThreshold[75] && forecast.weeksToThreshold[75] < 4 ? 'text-yellow-600' : 'text-gray-900'}`}>
                {forecast.weeksToThreshold[75]?.toFixed(1) || '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">85%</div>
              <div className={`font-medium ${forecast.weeksToThreshold[85] && forecast.weeksToThreshold[85] < 4 ? 'text-orange-600' : 'text-gray-900'}`}>
                {forecast.weeksToThreshold[85]?.toFixed(1) || '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">95%</div>
              <div className={`font-medium ${forecast.weeksToThreshold[95] && forecast.weeksToThreshold[95] < 6 ? 'text-red-600' : 'text-gray-900'}`}>
                {forecast.weeksToThreshold[95]?.toFixed(1) || '-'}
              </div>
            </div>
          </div>
        </div>

        {hasWarnings && (
          <div className="pt-2 border-t border-red-200">
            <p className="text-xs font-medium text-red-900 mb-1">Warnings:</p>
            <ul className="space-y-1">
              {forecast.warnings.map((warning, idx) => (
                <li key={idx} className="text-xs text-red-700 flex items-start">
                  <span className="mr-1">⚠</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
