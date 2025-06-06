"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { LIABILITY_ACCOUNT_TYPES } from "@/lib/constants"

export async function getDashboardData(timeFrame = "30d") {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user with better error handling
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("Auth check:", { user: user?.id, authError })

    if (authError) {
      console.error("Auth error:", authError)
      return { error: `Authentication error: ${authError.message}` }
    }

    if (!user) {
      console.error("No user found")
      return { error: "No authenticated user found" }
    }

    // Calculate date range based on timeFrame
    const now = new Date()
    const startDate = new Date()

    switch (timeFrame) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "3m":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "6m":
        startDate.setMonth(now.getMonth() - 6)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    console.log("Fetching accounts for user:", user.id)

    // Get accounts for net worth calculation
    const { data: accounts, error: accountsError } = await supabase.from("accounts").select("*").eq("user_id", user.id)

    if (accountsError) {
      console.error("Error fetching accounts:", accountsError)
      return { error: `Database error: ${accountsError.message}` }
    }

    console.log("Accounts found:", accounts?.length || 0)

    // Get transactions for the selected time period
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: false })

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError)
      return { error: `Database error: ${transactionsError.message}` }
    }

    console.log("Transactions found:", transactions?.length || 0)

    // Calculate net worth properly: Assets - Liabilities
    let totalAssets = 0
    let totalLiabilities = 0

    console.log("Calculating net worth from accounts:", accounts)

    if (accounts && accounts.length > 0) {
      accounts.forEach((account) => {
        const balance = Number.parseFloat(account.balance.toString())
        const accountType = account.type

        console.log(`Account: ${account.name}, Type: ${accountType}, Balance: ${balance}`)

        // Check if this account type is a liability
        const isLiability = LIABILITY_ACCOUNT_TYPES.includes(accountType as any)

        if (isLiability) {
          // For liabilities (credit cards, loans), the balance reduces net worth
          totalLiabilities += Math.abs(balance)
          console.log(`Added to liabilities: ${Math.abs(balance)}`)
        } else {
          // Assets (checking, savings, investment) add to net worth
          totalAssets += balance
          console.log(`Added to assets: ${balance}`)
        }
      })
    }

    const netWorth = totalAssets - totalLiabilities

    console.log(
      `Final calculation: Assets (${totalAssets}) - Liabilities (${totalLiabilities}) = Net Worth (${netWorth})`,
    )

    // Calculate income and expenses from transactions
    let totalIncome = 0
    let totalExpenses = 0
    const categorySpending: Record<string, number> = {}

    if (transactions && transactions.length > 0) {
      transactions.forEach((transaction) => {
        const amount = Number.parseFloat(transaction.amount.toString())
        const category = transaction.category || "Other"

        if (amount > 0) {
          totalIncome += amount
        } else {
          totalExpenses += Math.abs(amount)
          categorySpending[category] = (categorySpending[category] || 0) + Math.abs(amount)
        }
      })
    }

    // Calculate savings rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    // Get spending by category (top 6)
    const spendingByCategory = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([category, amount], index) => ({
        category,
        amount,
        color:
          [
            "#F97316", // orange
            "#EF4444", // red
            "#8B5CF6", // purple
            "#06B6D4", // cyan
            "#84CC16", // lime
            "#F59E0B", // amber
          ][index] || "#6B7280",
      }))

    // Generate net worth trend (mock data for now - would need historical account balances)
    const netWorthTrend = generateNetWorthTrend(netWorth, timeFrame)

    // Get recent transactions (last 10)
    const recentTransactions = transactions?.slice(0, 10) || []

    return {
      data: {
        netWorth,
        totalAssets,
        totalLiabilities,
        totalIncome,
        totalExpenses,
        savingsRate,
        spendingByCategory,
        netWorthTrend,
        recentTransactions,
        accountsCount: accounts?.length || 0,
        transactionsCount: transactions?.length || 0,
      },
    }
  } catch (error) {
    console.error("Unexpected error in getDashboardData:", error)
    return { error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

function generateNetWorthTrend(currentNetWorth: number, timeFrame: string) {
  // This is a simplified trend generator
  // In a real app, you'd store historical net worth data
  const periods =
    timeFrame === "7d" ? 7 : timeFrame === "30d" ? 30 : timeFrame === "3m" ? 12 : timeFrame === "6m" ? 24 : 52
  const trend = []

  for (let i = periods - 1; i >= 0; i--) {
    // Generate a slight upward trend with some variation
    const variation = (Math.random() - 0.5) * 0.02 // ±1% variation
    const growthFactor = 1 + 0.08 / periods + variation // ~8% annual growth
    const value = currentNetWorth / Math.pow(growthFactor, i)

    let label = ""
    if (timeFrame === "7d") {
      const date = new Date()
      date.setDate(date.getDate() - i)
      label = date.toLocaleDateString("en-US", { weekday: "short" })
    } else if (timeFrame === "30d") {
      label = `Day ${periods - i}`
    } else if (timeFrame === "3m" || timeFrame === "6m") {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      label = date.toLocaleDateString("en-US", { month: "short" })
    } else {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    }

    trend.push({ date: label, value: Math.round(value) })
  }

  return trend
}
