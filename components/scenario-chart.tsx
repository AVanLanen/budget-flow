"use client"

import { useEffect, useState } from "react"

type ChartData = {
  year: number
  value: number
}

interface ScenarioChartProps {
  data: ChartData[]
  color?: string
}

export function ScenarioChart({ data, color = "#2563EB" }: ScenarioChartProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="h-full flex items-center justify-center">Loading chart...</div>
  }

  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center">No data available</div>
  }

  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const range = maxValue - minValue || 1

  return (
    <div className="h-full p-4">
      <svg width="100%" height="100%" viewBox="0 0 400 250" className="overflow-visible">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="40" y1={40 + i * 40} x2="360" y2={40 + i * 40} stroke="#f3f4f6" strokeWidth="1" />
        ))}

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map((i) => {
          const value = maxValue - (i * range) / 4
          return (
            <text key={i} x="35" y={45 + i * 40} textAnchor="end" className="fill-gray-500 text-xs" fontSize="10">
              ${(value / 1000).toFixed(0)}k
            </text>
          )
        })}

        {/* Area path */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {data.length > 1 && (
          <path
            d={`M 40 ${200 - ((data[0].value - minValue) / range) * 160} ${data
              .map((d, i) => `L ${40 + i * (320 / (data.length - 1))} ${200 - ((d.value - minValue) / range) * 160}`)
              .join(" ")} L ${40 + (data.length - 1) * (320 / (data.length - 1))} 200 L 40 200 Z`}
            fill="url(#chartGradient)"
            stroke={color}
            strokeWidth="2"
          />
        )}

        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={40 + i * (320 / Math.max(1, data.length - 1))}
            cy={200 - ((d.value - minValue) / range) * 160}
            r="3"
            fill={color}
            className="hover:r-4 transition-all cursor-pointer"
          >
            <title>
              Year {d.year}: ${d.value.toLocaleString()}
            </title>
          </circle>
        ))}

        {/* X-axis labels */}
        {data
          .filter((_, i) => i % Math.ceil(data.length / 8) === 0)
          .map((d, i) => (
            <text
              key={i}
              x={40 + d.year * (320 / Math.max(1, data.length - 1))}
              y="220"
              textAnchor="middle"
              className="fill-gray-500 text-xs"
              fontSize="10"
            >
              {d.year}
            </text>
          ))}
      </svg>
    </div>
  )
}
