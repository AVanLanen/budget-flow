"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { getBudgetFlowData } from "@/app/actions/budget"
import { Sankey, sankeyLeft } from "@visx/sankey"
import { Group } from "@visx/group"
import { LinkHorizontal } from "@visx/shape"
import { Card, CardContent } from "@/components/ui/card"

type BudgetData = {
  income: Record<string, number>
  expenses: Record<string, number>
  totalIncome: number
  totalExpenses: number
  netSavings: number
  transactions: number
}

type SankeyNode = {
  name: string
  category?: string
  type?: "income" | "expense" | "saving"
}

type SankeyLink = {
  source: number
  target: number
  value: number
}

type SankeyData = {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

export function BudgetFlowChart() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Chart dimensions - adjusted for better spacing
  const width = 800
  const height = 400 // Reduced height to make room for cards above
  const margin = { top: 20, right: 40, bottom: 20, left: 40 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // Fetch budget data
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const result = await getBudgetFlowData()
        if (result.error) {
          setError(result.error)
        } else if (result.data) {
          setBudgetData(result.data)
        }
      } catch (error) {
        setError("Failed to load budget data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Convert budget data to Sankey format
  const generateSankeyData = (data: BudgetData): SankeyData => {
    const nodes: SankeyNode[] = []
    const links: SankeyLink[] = []

    // Add income nodes
    const incomeEntries = Object.entries(data.income).filter(([_, amount]) => amount > 0)
    incomeEntries.forEach(([category, amount]) => {
      nodes.push({
        name: `${category} ($${amount.toLocaleString()})`,
        category,
        type: "income",
      })
    })

    // Add expense nodes
    const expenseEntries = Object.entries(data.expenses).filter(([_, amount]) => amount > 0)
    expenseEntries.forEach(([category, amount]) => {
      nodes.push({
        name: `${category} ($${amount.toLocaleString()})`,
        category,
        type: "expense",
      })
    })

    // Add savings node if positive
    if (data.netSavings > 0) {
      nodes.push({
        name: `Savings ($${data.netSavings.toLocaleString()})`,
        category: "Savings",
        type: "saving",
      })
    }

    // Create links from income to expenses
    const incomeNodeCount = incomeEntries.length
    const expenseNodeCount = expenseEntries.length
    const savingsNodeExists = data.netSavings > 0

    incomeEntries.forEach((incomeEntry, incomeIndex) => {
      const [incomeCategory, incomeAmount] = incomeEntry
      const incomeRatio = incomeAmount / data.totalIncome

      // Link to each expense proportionally
      expenseEntries.forEach((expenseEntry, expenseIndex) => {
        const [expenseCategory, expenseAmount] = expenseEntry
        const linkValue = expenseAmount * incomeRatio

        if (linkValue > 10) {
          // Only show significant flows
          links.push({
            source: incomeIndex,
            target: incomeNodeCount + expenseIndex,
            value: Math.round(linkValue),
          })
        }
      })

      // Link to savings if exists
      if (savingsNodeExists && data.netSavings > 0) {
        const savingsLink = data.netSavings * incomeRatio
        if (savingsLink > 10) {
          links.push({
            source: incomeIndex,
            target: incomeNodeCount + expenseNodeCount,
            value: Math.round(savingsLink),
          })
        }
      }
    })

    return { nodes, links }
  }

  // Get node color based on type
  const getNodeColor = (node: any): string => {
    if (node.type === "income") return "#2563EB"
    if (node.type === "expense") return "#F97316"
    if (node.type === "saving") return "#14B8A6"
    return "#6B7280"
  }

  // Get link color based on target type
  const getLinkColor = (link: any, nodes: SankeyNode[]): string => {
    const targetNode = nodes[link.target]
    if (targetNode?.type === "expense") return "#F97316"
    if (targetNode?.type === "saving") return "#14B8A6"
    return "#6B7280"
  }

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading budget flow data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-medium mb-2 text-red-600">Error loading data</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!budgetData || budgetData.transactions === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No transaction data available</p>
          <p className="text-muted-foreground">Add some transactions to see your budget flow visualization</p>
        </div>
      </div>
    )
  }

  const sankeyData = generateSankeyData(budgetData)

  return (
    <div className="w-full space-y-6">
      {/* Header and Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Money Flow</h3>
            <p className="text-sm text-gray-600">{budgetData.transactions} transactions • Last 30 days</p>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg p-3 shadow-sm border">
            <div className="text-sm font-medium mb-2">Legend</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-xs">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-xs">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded"></div>
                <span className="text-xs">Savings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Income</div>
              <div className="text-2xl font-bold text-blue-600">${budgetData.totalIncome.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {Object.keys(budgetData.income).length} source{Object.keys(budgetData.income).length !== 1 ? "s" : ""}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Expenses</div>
              <div className="text-2xl font-bold text-orange-600">${budgetData.totalExpenses.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {Object.keys(budgetData.expenses).length} categor
                {Object.keys(budgetData.expenses).length !== 1 ? "ies" : "y"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Net Savings</div>
              <div className={`text-2xl font-bold ${budgetData.netSavings >= 0 ? "text-teal-600" : "text-red-600"}`}>
                {budgetData.netSavings >= 0 ? "+" : ""}${budgetData.netSavings.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {budgetData.netSavings >= 0 ? "Surplus" : "Deficit"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sankey Diagram */}
      <div className="w-full h-[400px] bg-muted/20 rounded-lg relative overflow-hidden">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0">
          <Group left={margin.left} top={margin.top}>
            <Sankey
              root={sankeyData}
              size={[innerWidth, innerHeight]}
              nodeAlign={sankeyLeft}
              nodePadding={10}
              nodeWidth={15}
            >
              {({ graph, createPath }) => (
                <>
                  {/* Render links */}
                  <Group>
                    {graph.links.map((link, i) => (
                      <LinkHorizontal
                        key={`link-${i}`}
                        data={link}
                        path={createPath}
                        fill="none"
                        stroke={getLinkColor(link, sankeyData.nodes)}
                        strokeWidth={Math.max(1, link.width || 1)}
                        strokeOpacity={0.6}
                        className="transition-opacity hover:stroke-opacity-80"
                      />
                    ))}
                  </Group>

                  {/* Render nodes */}
                  <Group>
                    {graph.nodes.map((node, i) => {
                      const nodeData = sankeyData.nodes[i]
                      return (
                        <g key={`node-${i}`}>
                          <rect
                            x={node.x0}
                            y={node.y0}
                            width={node.x1 - node.x0}
                            height={node.y1 - node.y0}
                            fill={getNodeColor(nodeData)}
                            rx={3}
                            className="transition-opacity hover:opacity-80"
                          />
                          {/* Node labels */}
                          <text
                            x={nodeData?.type === "income" ? (node.x0 || 0) - 5 : (node.x1 || 0) + 5}
                            y={(node.y0 || 0) + ((node.y1 || 0) - (node.y0 || 0)) / 2}
                            dy="0.35em"
                            textAnchor={nodeData?.type === "income" ? "end" : "start"}
                            fontSize={12}
                            fill="#374151"
                            className="font-medium"
                          >
                            {nodeData?.name || `Node ${i}`}
                          </text>
                        </g>
                      )
                    })}
                  </Group>
                </>
              )}
            </Sankey>
          </Group>
        </svg>
      </div>
    </div>
  )
}
