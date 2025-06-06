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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="w-48 h-10 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted animate-pulse rounded w-20" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded w-24 mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Error loading dashboard: {error}</p>
              <button onClick={() => window.location.reload()} className="mt-2 text-primary hover:underline">
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
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>No data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const netSavings = data.totalIncome - data.totalExpenses

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Time Frame Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeFrame} onValueChange={(value: TimeFrame) => setTimeFrame(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(timeFrameLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${data.netWorth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Assets: ${data.totalAssets.toLocaleString()} - Liabilities: ${data.totalLiabilities.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${data.totalAssets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Checking, savings, investments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${data.totalLiabilities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Credit cards, loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netSavings >= 0 ? "text-green-600" : "text-red-600"}`}>
              {netSavings >= 0 ? "+" : ""}${netSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.savingsRate.toFixed(1)}% savings rate ({timeFrameLabels[timeFrame].toLowerCase()})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Budget Flow</CardTitle>
            <CardDescription>
              Visualize where your money comes from and where it goes ({timeFrameLabels[timeFrame].toLowerCase()})
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <BudgetFlowChart timeFrame={timeFrame} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Your top spending categories ({timeFrameLabels[timeFrame].toLowerCase()})</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingByCategory data={data.spendingByCategory} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activity ({data.recentTransactions.length} transactions)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions data={data.recentTransactions} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Net Worth Trend</CardTitle>
            <CardDescription>Track your financial growth ({timeFrameLabels[timeFrame].toLowerCase()})</CardDescription>
          </CardHeader>
          <CardContent>
            <NetWorthCard data={data.netWorthTrend} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
