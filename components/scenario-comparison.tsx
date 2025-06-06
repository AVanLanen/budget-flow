"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Define scenario data structure
interface ScenarioData {
  id: string
  name: string
  type: "investment" | "loan"
  params: {
    [key: string]: number
  }
  results: {
    [key: string]: any
  }
}

interface ScenarioComparisonProps {
  scenarios: ScenarioData[]
}

export function ScenarioComparison({ scenarios }: ScenarioComparisonProps) {
  const [comparisonView, setComparisonView] = useState<"chart" | "table">("chart")

  // Get unique scenario types
  const scenarioTypes = Array.from(new Set(scenarios.map((s) => s.type)))

  // Check if we have mixed scenario types
  const hasMixedTypes = scenarioTypes.length > 1

  // Get colors for scenarios
  const getScenarioColor = (index: number) => {
    const colors = [
      "#2563EB", // Primary blue
      "#F97316", // Orange
      "#14B8A6", // Teal
      "#8B5CF6", // Purple
      "#EC4899", // Pink
      "#F59E0B", // Amber
    ]
    return colors[index % colors.length]
  }

  // Prepare chart data
  const prepareChartData = () => {
    // Find the maximum number of years across all scenarios
    const maxYears = Math.max(
      ...scenarios.map((s) => {
        if (s.type === "investment") {
          return s.params.years
        } else {
          return Math.ceil(s.results.months / 12)
        }
      }),
    )

    // Create year labels
    const years = Array.from({ length: maxYears + 1 }, (_, i) => i)

    return {
      years,
      datasets: scenarios.map((scenario, index) => {
        const chartData = scenario.results.chartData || []
        return {
          id: scenario.id,
          name: scenario.name,
          color: getScenarioColor(index),
          data: chartData,
          type: scenario.type,
        }
      }),
    }
  }

  const chartData = prepareChartData()

  // Find the maximum value for scaling
  const maxValue = Math.max(...chartData.datasets.flatMap((dataset) => dataset.data.map((d) => d.value)))

  return (
    <div className="space-y-6">
      <Tabs value={comparisonView} onValueChange={(v) => setComparisonView(v as "chart" | "table")}>
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="chart">Chart View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison Chart</CardTitle>
              <CardDescription>
                {hasMixedTypes
                  ? "Comparing different scenario types (investment vs. loan)"
                  : `Comparing ${scenarioTypes[0]} scenarios`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] relative">
                <svg width="100%" height="100%" viewBox="0 0 800 400" className="overflow-visible">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line key={i} x1="60" y1={40 + i * 80} x2="760" y2={40 + i * 80} stroke="#f3f4f6" strokeWidth="1" />
                  ))}

                  {/* Y-axis labels */}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const value = maxValue - (i * maxValue) / 4
                    return (
                      <text
                        key={i}
                        x="55"
                        y={45 + i * 80}
                        textAnchor="end"
                        className="fill-gray-500 text-xs"
                        fontSize="10"
                      >
                        ${(value / 1000).toFixed(0)}k
                      </text>
                    )
                  })}

                  {/* X-axis labels */}
                  {chartData.years
                    .filter((_, i) => i % Math.max(1, Math.floor(chartData.years.length / 10)) === 0)
                    .map((year) => (
                      <text
                        key={year}
                        x={60 + (year * 700) / Math.max(1, chartData.years.length - 1)}
                        y="380"
                        textAnchor="middle"
                        className="fill-gray-500 text-xs"
                        fontSize="10"
                      >
                        Year {year}
                      </text>
                    ))}

                  {/* Chart lines */}
                  {chartData.datasets.map((dataset, datasetIndex) => (
                    <g key={dataset.id}>
                      <path
                        d={`M ${60} ${400 - (dataset.data[0]?.value / maxValue) * 320} ${dataset.data
                          .map(
                            (d, i) =>
                              `L ${60 + (i * 700) / Math.max(1, chartData.years.length - 1)} ${400 - (d.value / maxValue) * 320}`,
                          )
                          .join(" ")}`}
                        fill="none"
                        stroke={dataset.color}
                        strokeWidth="2"
                      />

                      {/* Data points */}
                      {dataset.data
                        .filter(
                          (_, i) =>
                            i % Math.max(1, Math.floor(dataset.data.length / 20)) === 0 ||
                            i === dataset.data.length - 1,
                        )
                        .map((d, i) => (
                          <circle
                            key={i}
                            cx={60 + (d.year * 700) / Math.max(1, chartData.years.length - 1)}
                            cy={400 - (d.value / maxValue) * 320}
                            r="4"
                            fill={dataset.color}
                          >
                            <title>
                              {dataset.name}: ${d.value.toLocaleString()} (Year {d.year})
                            </title>
                          </circle>
                        ))}
                    </g>
                  ))}
                </svg>

                {/* Legend */}
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 p-2 rounded-md shadow-sm border">
                  <div className="text-xs font-medium mb-1">Legend</div>
                  {chartData.datasets.map((dataset, i) => (
                    <div key={dataset.id} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dataset.color }}></div>
                      <span>{dataset.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison Table</CardTitle>
              <CardDescription>Side-by-side comparison of key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Scenario</th>
                      <th className="text-left py-2 px-4">Type</th>
                      <th className="text-right py-2 px-4">Initial Amount</th>
                      <th className="text-right py-2 px-4">Rate</th>
                      <th className="text-right py-2 px-4">Time Period</th>
                      <th className="text-right py-2 px-4">Final Amount</th>
                      <th className="text-right py-2 px-4">Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((scenario) => (
                      <tr key={scenario.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{scenario.name}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={
                              scenario.type === "investment"
                                ? "bg-primary/10 text-primary"
                                : "bg-orange-500/10 text-orange-500"
                            }
                          >
                            {scenario.type === "investment" ? "Investment" : "Loan"}
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-4">
                          {scenario.type === "investment"
                            ? `$${scenario.params.monthlyAmount}/mo`
                            : `$${scenario.params.balance.toLocaleString()}`}
                        </td>
                        <td className="text-right py-3 px-4">{scenario.params.rate}%</td>
                        <td className="text-right py-3 px-4">
                          {scenario.type === "investment"
                            ? `${scenario.params.years} years`
                            : `${Math.floor(scenario.results.months / 12)} years ${Math.round(scenario.results.months % 12)} months`}
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {scenario.type === "investment"
                            ? `$${scenario.results.futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                            : `$${scenario.results.totalPayments.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        </td>
                        <td className="text-right py-3 px-4">
                          {scenario.type === "investment"
                            ? `$${scenario.results.interestEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                            : `$${scenario.results.interestPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {scenarios.length > 1 && (
                <div className="mt-6 p-4 bg-muted/30 rounded-md">
                  <h4 className="font-medium mb-2">Key Insights</h4>
                  <ul className="space-y-2 text-sm">
                    {hasMixedTypes ? (
                      <li>
                        You're comparing different types of scenarios (investments vs. loans), which have different
                        financial implications.
                      </li>
                    ) : scenarios[0].type === "investment" ? (
                      <>
                        <li>
                          The highest return scenario is{" "}
                          <span className="font-medium">
                            {scenarios.sort((a, b) => b.results.futureValue - a.results.futureValue)[0].name}
                          </span>{" "}
                          with a final value of{" "}
                          <span className="font-medium">
                            $
                            {scenarios
                              .sort((a, b) => b.results.futureValue - a.results.futureValue)[0]
                              .results.futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </li>
                        <li>
                          The most efficient scenario (highest interest earned per dollar invested) is{" "}
                          <span className="font-medium">
                            {
                              scenarios.sort(
                                (a, b) =>
                                  b.results.interestEarned / (b.params.monthlyAmount * b.params.years * 12) -
                                  a.results.interestEarned / (a.params.monthlyAmount * a.params.years * 12),
                              )[0].name
                            }
                          </span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          The fastest payoff scenario is{" "}
                          <span className="font-medium">
                            {scenarios.sort((a, b) => a.results.months - b.results.months)[0].name}
                          </span>{" "}
                          at{" "}
                          <span className="font-medium">
                            {Math.floor(
                              scenarios.sort((a, b) => a.results.months - b.results.months)[0].results.months / 12,
                            )}{" "}
                            years{" "}
                            {Math.round(
                              scenarios.sort((a, b) => a.results.months - b.results.months)[0].results.months % 12,
                            )}{" "}
                            months
                          </span>
                        </li>
                        <li>
                          The lowest interest paid scenario is{" "}
                          <span className="font-medium">
                            {scenarios.sort((a, b) => a.results.interestPaid - b.results.interestPaid)[0].name}
                          </span>{" "}
                          at{" "}
                          <span className="font-medium">
                            $
                            {scenarios
                              .sort((a, b) => a.results.interestPaid - b.results.interestPaid)[0]
                              .results.interestPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </li>
                      </>
                    )}
                    <li>Consider your financial goals and risk tolerance when choosing between these scenarios.</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
