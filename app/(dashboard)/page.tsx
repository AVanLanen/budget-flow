"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BudgetFlowChart } from "@/components/budget-flow-chart"
import { NetWorthCard } from "@/components/net-worth-card"
import { SpendingByCategory } from "@/components/spending-by-category"
import { RecentTransactions } from "@/components/recent-transactions"
import { getDashboardData } from "@/app/actions/dashboard"
import { Calendar, DollarSign, PiggyBank, Building, CreditCard } from "lucide-react"

type TimeFrame = "7d" | "30d" | "3m" | "6m" | "1y"

interface DashboardData {
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  totalIncome: number
  totalExpenses: number
  savingsRate: number
  spendingByCategory: Array<{ category: string; amount: number; color: string }>
  netWorthTrend: Array<{ date: string; value: number }>
  recentTransactions: Array<{
    id: string
    date: string
    description: string
    amount: number
    category: string
  }>
  accountsCount: number
  transactionsCount: number
}

export default function DashboardPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("30d")
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const result = await getDashboardData(timeFrame)

        if (result.error) {
          setError(result.error)
        } else if (result.data) {
          setData(result.data)
        }
      } catch (err) {
        setError("Failed to load dashboard data")
        console.error("Dashboard error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeFrame])

  const timeFrameLabels = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "3m": "Last 3 months",
    "6m": "Last 6 months",
    "1y": "Last year",
  }

  if (loading) {
    return (
      <div className="content-container p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-shadow-lg bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <div className="w-48 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 animate-pulse rounded-lg shadow-inner" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-elevated">
              <CardHeader className="space-y-0 pb-3">
                <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 animate-pulse rounded w-20" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 animate-pulse rounded w-24 mb-2" />
                <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 animate-pulse rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content-container p-6 space-y-6">
        <h1 className="text-4xl font-bold text-shadow-lg bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <Card className="card-floating">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium text-red-600 mb-2">Error loading dashboard: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="content-container p-6 space-y-6">
        <h1 className="text-4xl font-bold text-shadow-lg bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <Card className="card-floating">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">No data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const netSavings = data.totalIncome - data.totalExpenses

  return (
    <div className="content-container p-6 space-y-8">
      {/* Header with Time Frame Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-shadow-lg bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <div className="flex items-center gap-3 glass-panel px-4 py-3 rounded-xl">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={timeFrame} onValueChange={(value: TimeFrame) => setTimeFrame(value)}>
            <SelectTrigger className="w-48 border-0 bg-transparent shadow-none focus:ring-2 focus:ring-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="card-elevated">
              {Object.entries(timeFrameLabels).map(([value, label]) => (
                <SelectItem key={value} value={value} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-floating group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Worth</CardTitle>
            <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg group-hover:from-blue-500/20 group-hover:to-blue-600/20 transition-all duration-300">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold mb-1 ${data.netWorth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              ${data.netWorth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Assets: ${data.totalAssets.toLocaleString()} - Liabilities: ${data.totalLiabilities.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="card-floating group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
            <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg group-hover:from-green-500/20 group-hover:to-green-600/20 transition-all duration-300">
              <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              ${data.totalAssets.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Checking, savings, investments</p>
          </CardContent>
        </Card>

        <Card className="card-floating group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Liabilities</CardTitle>
            <div className="p-2 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg group-hover:from-red-500/20 group-hover:to-red-600/20 transition-all duration-300">
              <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
              ${data.totalLiabilities.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Credit cards, loans</p>
          </CardContent>
        </Card>

        <Card className="card-floating group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
            <div className="p-2 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg group-hover:from-purple-500/20 group-hover:to-purple-600/20 transition-all duration-300">
              <PiggyBank className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold mb-1 ${netSavings >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {netSavings >= 0 ? "+" : ""}${netSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.savingsRate.toFixed(1)}% savings rate ({timeFrameLabels[timeFrame].toLowerCase()})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 card-floating">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-shadow">Budget Flow</CardTitle>
            <CardDescription className="text-muted-foreground">
              Visualize where your money comes from and where it goes ({timeFrameLabels[timeFrame].toLowerCase()})
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <BudgetFlowChart timeFrame={timeFrame} />
          </CardContent>
        </Card>

        <Card className="col-span-3 card-floating">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-shadow">Spending by Category</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your top spending categories ({timeFrameLabels[timeFrame].toLowerCase()})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingByCategory data={data.spendingByCategory} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 card-floating">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-shadow">Recent Transactions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your latest financial activity ({data.recentTransactions.length} transactions)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions data={data.recentTransactions} />
          </CardContent>
        </Card>

        <Card className="col-span-3 card-floating">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-shadow">Net Worth Trend</CardTitle>
            <CardDescription className="text-muted-foreground">
              Track your financial growth ({timeFrameLabels[timeFrame].toLowerCase()})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NetWorthCard data={data.netWorthTrend} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
