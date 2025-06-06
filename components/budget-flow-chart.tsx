"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { getBudgetFlowData } from "@/app/actions/budget"
import { Sankey, sankeyLeft } from "@visx/sankey"
import { Group } from "@visx/group"
import { LinkHorizontal } from "@visx/shape"
import { LinearGradient } from "@visx/gradient"
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

  // Chart dimensions
  const width = 800
  const height = 400
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

  // Enhanced expense color configurations for gradients - lighter to darker shades
  const getExpenseGradientConfig = (index: number) => {
    const configs = [
      { from: "#fca5a5", to: "#ef4444" }, // Light red to red (Travel)
      { from: "#fdba74", to: "#f97316" }, // Light orange to orange
      { from: "#fde047", to: "#eab308" }, // Light yellow to yellow
      { from: "#bef264", to: "#84cc16" }, // Light lime to lime
      { from: "#67e8f9", to: "#06b6d4" }, // Light cyan to cyan
      { from: "#c4b5fd", to: "#8b5cf6" }, // Light violet to violet
      { from: "#f9a8d4", to: "#ec4899" }, // Light pink to pink
      { from: "#fcd34d", to: "#f59e0b" }, // Light amber to amber
    ]
    return configs[index % configs.length]
  }

  // Get source node color (lighter version)
  const getSourceColor = (sourceIndex: number, nodes: SankeyNode[]): string => {
    const sourceNode = nodes[sourceIndex]
    if (sourceNode?.type === "income") return "#93c5fd" // Light blue
    return "#d1d5db" // Light gray
  }

  // Get target node color (darker version)
  const getTargetColor = (targetIndex: number, nodes: SankeyNode[]): string => {
    const targetNode = nodes[targetIndex]
    if (targetNode?.type === "expense") {
      const expenseIndex = targetIndex - nodes.filter((n) => n.type === "income").length
      const config = getExpenseGradientConfig(expenseIndex)
      return config.to // Use the darker color
    }
    if (targetNode?.type === "saving") return "#10b981" // Green
    return "#6b7280" // Gray
  }

  // Get node gradient ID based on type and index
  const getNodeGradientId = (node: any, index: number): string => {
    if (node.type === "income") return "incomeGradient"
    if (node.type === "expense") return `expenseGradient${index}`
    if (node.type === "saving") return "savingsGradient"
    return "defaultGradient"
  }

  // Get text gradient ID based on node type and index
  const getTextGradientId = (node: any, index: number): string => {
    if (node.type === "income") return "incomeTextGradient"
    if (node.type === "expense") return `expenseTextGradient${index}`
    if (node.type === "saving") return "savingsTextGradient"
    return "defaultTextGradient"
  }

  // Get link gradient ID
  const getLinkGradientId = (linkIndex: number): string => {
    return `linkGradient${linkIndex}`
  }

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl shadow-lg border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading budget flow data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl shadow-lg border">
        <div className="text-center">
          <p className="text-lg font-medium mb-2 text-red-600">Error loading data</p>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!budgetData || budgetData.transactions === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl shadow-lg border">
        <div className="text-center">
          <p className="text-lg font-medium mb-2 text-slate-900 dark:text-slate-100">No transaction data available</p>
          <p className="text-slate-600 dark:text-slate-400">
            Add some transactions to see your budget flow visualization
          </p>
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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Money Flow</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {budgetData.transactions} transactions • Last 30 days
            </p>
          </div>

          {/* Legend */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="text-sm font-medium mb-2 text-slate-900 dark:text-slate-100">Legend</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 rounded-full bg-gradient-to-r from-blue-300 to-blue-600"></div>
                <span className="text-xs text-slate-700 dark:text-slate-300">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 rounded-full bg-gradient-to-r from-red-300 to-red-500"></div>
                <span className="text-xs text-slate-700 dark:text-slate-300">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-600"></div>
                <span className="text-xs text-slate-700 dark:text-slate-300">Savings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Income</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${budgetData.totalIncome.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {Object.keys(budgetData.income).length} source{Object.keys(budgetData.income).length !== 1 ? "s" : ""}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Expenses</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ${budgetData.totalExpenses.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {Object.keys(budgetData.expenses).length} categor
                {Object.keys(budgetData.expenses).length !== 1 ? "ies" : "y"}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">Net Savings</div>
              <div
                className={`text-2xl font-bold ${
                  budgetData.netSavings >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {budgetData.netSavings >= 0 ? "+" : ""}${budgetData.netSavings.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {budgetData.netSavings >= 0 ? "Surplus" : "Deficit"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sankey Diagram */}
      <div className="w-full h-[400px] bg-white dark:bg-slate-900 rounded-xl shadow-lg relative overflow-hidden border border-slate-200 dark:border-slate-700">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0">
          {/* Define gradients using @visx/gradient */}
          <defs>
            {/* Income gradients - light blue to blue */}
            <LinearGradient id="incomeGradient" from="#93c5fd" to="#3b82f6" vertical />
            <LinearGradient id="incomeTextGradient" from="#60a5fa" to="#2563eb" />

            {/* Dynamic expense gradients - lighter to darker shades */}
            {sankeyData.nodes
              .filter((node) => node.type === "expense")
              .map((_, index) => {
                const config = getExpenseGradientConfig(index)
                return (
                  <g key={`expense-gradients-${index}`}>
                    <LinearGradient id={`expenseGradient${index}`} from={config.from} to={config.to} vertical />
                    <LinearGradient id={`expenseTextGradient${index}`} from={config.from} to={config.to} />
                  </g>
                )
              })}

            {/* Savings gradients - light green to green */}
            <LinearGradient id="savingsGradient" from="#6ee7b7" to="#10b981" vertical />
            <LinearGradient id="savingsTextGradient" from="#34d399" to="#059669" />

            {/* Default gradient */}
            <LinearGradient id="defaultTextGradient" from="#9ca3af" to="#4b5563" />

            {/* Dynamic link gradients - from source to target colors */}
            {sankeyData.links.map((link, index) => {
              const sourceColor = getSourceColor(link.source, sankeyData.nodes)
              const targetColor = getTargetColor(link.target, sankeyData.nodes)
              return (
                <LinearGradient
                  key={`link-gradient-${index}`}
                  id={getLinkGradientId(index)}
                  from={sourceColor}
                  to={targetColor}
                  fromOpacity={0.8}
                  toOpacity={0.8}
                />
              )
            })}

            {/* Text shadow filter */}
            <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
            </filter>

            {/* Node glow filter */}
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Link glow filter */}
            <filter id="linkGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

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
                  {/* Render links with gradient strokes */}
                  <Group>
                    {graph.links.map((link, i) => (
                      <LinkHorizontal
                        key={`link-${i}`}
                        data={link}
                        path={createPath}
                        fill="none"
                        stroke={`url(#${getLinkGradientId(i)})`}
                        strokeWidth={Math.max(2, link.width || 2)}
                        strokeOpacity={0.7}
                        className="transition-all duration-300 hover:stroke-opacity-90"
                        style={{
                          filter: "url(#linkGlow)",
                        }}
                      />
                    ))}
                  </Group>

                  {/* Render nodes */}
                  <Group>
                    {graph.nodes.map((node, i) => {
                      const nodeData = sankeyData.nodes[i]
                      const expenseIndex =
                        nodeData?.type === "expense"
                          ? i - sankeyData.nodes.filter((n) => n.type === "income").length
                          : 0

                      return (
                        <g key={`node-${i}`}>
                          <rect
                            x={node.x0}
                            y={node.y0}
                            width={node.x1 - node.x0}
                            height={node.y1 - node.y0}
                            fill={`url(#${getNodeGradientId(nodeData, expenseIndex)})`}
                            rx={4}
                            className="transition-all duration-300 hover:opacity-90"
                            style={{
                              filter: "url(#nodeGlow)",
                            }}
                          />
                          {/* Node labels with gradient text */}
                          <text
                            x={nodeData?.type === "income" ? (node.x0 || 0) - 6 : (node.x1 || 0) + 6}
                            y={(node.y0 || 0) + ((node.y1 || 0) - (node.y0 || 0)) / 2}
                            dy="0.35em"
                            textAnchor={nodeData?.type === "income" ? "end" : "start"}
                            fontSize={12}
                            fontWeight={600}
                            fill={`url(#${getTextGradientId(nodeData, expenseIndex)})`}
                            style={{ filter: "url(#textShadow)" }}
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
