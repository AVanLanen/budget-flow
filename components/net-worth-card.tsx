"use client"

interface NetWorthData {
  date: string
  value: number
}

interface NetWorthCardProps {
  data: NetWorthData[]
}

export function NetWorthCard({ data }: NetWorthCardProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <div className="text-center">
          <p>No net worth data available</p>
          <p className="text-sm mt-1">Add accounts to track your net worth over time</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const range = maxValue - minValue || 1 // Avoid division by zero

  const currentValue = data[data.length - 1]?.value || 0
  const previousValue = data[data.length - 2]?.value || currentValue
  const change = currentValue - previousValue
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0

  return (
    <div className="h-[300px] p-4">
      {/* Summary */}
      <div className="mb-4 text-center">
        <div className="text-2xl font-bold">${currentValue.toLocaleString()}</div>
        <div className={`text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change >= 0 ? "+" : ""}${change.toLocaleString()} ({changePercent >= 0 ? "+" : ""}
          {changePercent.toFixed(1)}%)
        </div>
      </div>

      {/* Chart */}
      <svg width="100%" height="200" viewBox="0 0 400 200" className="overflow-visible">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="40" y1={30 + i * 35} x2="360" y2={30 + i * 35} stroke="#f3f4f6" strokeWidth="1" />
        ))}

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map((i) => {
          const value = maxValue - (i * range) / 4
          return (
            <text key={i} x="35" y={35 + i * 35} textAnchor="end" className="fill-gray-500 text-xs" fontSize="10">
              ${(value / 1000).toFixed(0)}k
            </text>
          )
        })}

        {/* Area gradient */}
        <defs>
          <linearGradient id="netWorthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area path */}
        {data.length > 1 && (
          <path
            d={`M 40 ${170 - ((data[0].value - minValue) / range) * 140} ${data
              .map((d, i) => `L ${40 + (i * 320) / (data.length - 1)} ${170 - ((d.value - minValue) / range) * 140}`)
              .join(" ")} L ${40 + 320} 170 L 40 170 Z`}
            fill="url(#netWorthGradient)"
            stroke="#2563EB"
            strokeWidth="2"
          />
        )}

        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={40 + (i * 320) / Math.max(data.length - 1, 1)}
            cy={170 - ((d.value - minValue) / range) * 140}
            r="3"
            fill="#2563EB"
            className="hover:r-4 transition-all cursor-pointer"
          >
            <title>
              {d.date}: ${d.value.toLocaleString()}
            </title>
          </circle>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          // Only show every few labels to avoid crowding
          const showLabel = data.length <= 7 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1
          if (!showLabel) return null

          return (
            <text
              key={i}
              x={40 + (i * 320) / Math.max(data.length - 1, 1)}
              y="190"
              textAnchor="middle"
              className="fill-gray-500 text-xs"
              fontSize="10"
            >
              {d.date}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
