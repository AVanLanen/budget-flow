"use server"

import { createServerClient } from "@/lib/supabase-server"
import { TRANSACTION_CATEGORIES } from "@/lib/constants"

export async function getBudgetFlowData() {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  // Get transactions from the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false })

  if (error) {
    console.error("Error fetching transactions:", error)
    return { error: error.message }
  }

  console.log("Fetched transactions:", transactions?.length || 0)

  if (!transactions || transactions.length === 0) {
    return {
      data: {
        income: {},
        expenses: {},
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        transactions: 0,
      },
    }
  }

  // Calculate income and expenses by category
  const income: Record<string, number> = {}
  const expenses: Record<string, number> = {}

  transactions.forEach((transaction) => {
    const amount = Number.parseFloat(transaction.amount.toString())
    const category = transaction.category || "Other"

    if (amount > 0) {
      // Positive amounts are income
      income[category] = (income[category] || 0) + amount
    } else {
      // Negative amounts are expenses
      expenses[category] = (expenses[category] || 0) + Math.abs(amount)
    }
  })

  // Calculate totals
  const totalIncome = Object.values(income).reduce((sum, amount) => sum + amount, 0)
  const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0)
  const netSavings = totalIncome - totalExpenses

  console.log("Budget flow data:", {
    totalIncome,
    totalExpenses,
    netSavings,
    incomeCategories: Object.keys(income).length,
    expenseCategories: Object.keys(expenses).length,
  })

  return {
    data: {
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netSavings,
      transactions: transactions.length,
    },
  }
}

export async function getBudgetCategories() {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  // Get transactions from current month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", firstDayOfMonth.toISOString().split("T")[0])
    .lte("date", lastDayOfMonth.toISOString().split("T")[0])

  if (error) {
    console.error("Error fetching transactions for budget:", error)
    return { error: error.message }
  }

  console.log("Budget transactions:", transactions?.length || 0)

  // Calculate spending by category (only negative amounts)
  const categorySpending: Record<string, number> = {}

  if (transactions && transactions.length > 0) {
    transactions.forEach((transaction) => {
      const amount = Number.parseFloat(transaction.amount.toString())
      if (amount < 0) {
        // Only count expenses (negative amounts)
        const category = transaction.category || "Other"
        categorySpending[category] = (categorySpending[category] || 0) + Math.abs(amount)
      }
    })
  }

  console.log("Category spending:", categorySpending)

  // Default budget amounts (these could be stored in a separate budget table)
  const defaultBudgets: Record<string, number> = {
    Housing: 2000,
    "Food & Dining": 800,
    Transportation: 400,
    Entertainment: 300,
    Utilities: 350,
    Healthcare: 250,
    Shopping: 500,
    Travel: 200,
    Education: 150,
    "Personal Care": 100,
    "Gifts & Donations": 100,
    Business: 300,
    Other: 200,
  }

  // Create budget categories - include all categories that have either spending or a default budget
  const allCategories = new Set([...TRANSACTION_CATEGORIES, ...Object.keys(categorySpending)])

  const budgetCategories = Array.from(allCategories)
    .map((category) => {
      const spent = categorySpending[category] || 0
      const budgeted = defaultBudgets[category] || 200
      const remaining = budgeted - spent

      return {
        id: category.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and"),
        name: category,
        budgeted,
        spent,
        remaining,
      }
    })
    .filter((cat) => cat.budgeted > 0 || cat.spent > 0)

  console.log("Budget categories:", budgetCategories.length)

  return { data: budgetCategories }
}
