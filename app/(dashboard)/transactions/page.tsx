"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import { EditTransactionDialog } from "@/components/edit-transaction-dialog"
import { CSVImportDialog } from "@/components/csv-import-dialog"
import { Plus, FileUp, Loader2, Filter, Search, Edit, Trash } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Add these imports at the top with the other imports
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

type Transaction = {
  id: string
  user_id: string
  account_id: string
  date: string
  description: string
  amount: number
  category: string
  created_at: string
  updated_at: string
}

type Account = {
  id: string
  name: string
  institution: string
  type: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [accountFilter, setAccountFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Add these state variables inside the TransactionsPage component, near the other useState declarations
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Add this variable to track if we're processing the bulk delete
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch transactions and accounts from database
  const fetchData = async () => {
    if (!user) return

    setLoading(true)

    // Fetch accounts first
    const { data: accountsData, error: accountsError } = await supabase
      .from("accounts")
      .select("id, name, institution, type")
      .eq("user_id", user.id)

    if (accountsError) {
      toast({
        title: "Error",
        description: "Failed to fetch accounts",
        variant: "destructive",
      })
      console.error("Error fetching accounts:", accountsError)
      setLoading(false)
      return
    }

    setAccounts(accountsData || [])

    // Then fetch transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    if (transactionsError) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      })
      console.error("Error fetching transactions:", transactionsError)
    } else {
      setTransactions(transactionsData || [])
    }

    setLoading(false)
  }

  // Create new transaction
  const handleCreateTransaction = async (
    transactionData: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">,
  ) => {
    if (!user) return

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        ...transactionData,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      })
      console.error("Error creating transaction:", error)
      return null
    } else {
      setTransactions([data, ...transactions])
      toast({
        title: "Success",
        description: "Transaction created successfully",
      })
      return data
    }
  }

  // Update transaction
  const handleUpdateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
    if (!user) return

    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", transactionId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      })
      console.error("Error updating transaction:", error)
    } else {
      setTransactions(transactions.map((tx) => (tx.id === transactionId ? data : tx)))
      setEditingTransaction(null)
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      })
    }
  }

  // Delete transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    if (!user) return

    const { error } = await supabase.from("transactions").delete().eq("id", transactionId).eq("user_id", user.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      })
      console.error("Error deleting transaction:", error)
    } else {
      setTransactions(transactions.filter((tx) => tx.id !== transactionId))
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      })
    }
  }

  // Import transactions from CSV
  const handleImportTransactions = async (
    parsedTransactions: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">[],
  ) => {
    if (!user || parsedTransactions.length === 0) return

    const transactionsWithUserId = parsedTransactions.map((tx) => ({
      ...tx,
      user_id: user.id,
    }))

    const { data, error } = await supabase.from("transactions").insert(transactionsWithUserId).select()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to import transactions",
        variant: "destructive",
      })
      console.error("Error importing transactions:", error)
      return false
    } else {
      setTransactions([...data, ...transactions])
      toast({
        title: "Success",
        description: `Successfully imported ${data.length} transactions`,
      })
      return true
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  // Get unique categories for filter
  const categories = Array.from(new Set(transactions.map((t) => t.category)))

  // Apply filters
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter
    const matchesAccount = accountFilter === "all" || transaction.account_id === accountFilter

    // Time filter
    let matchesTime = true
    const txDate = new Date(transaction.date)
    const now = new Date()

    if (timeFilter === "thisMonth") {
      matchesTime = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
    } else if (timeFilter === "lastMonth") {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      matchesTime = txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear
    } else if (timeFilter === "last3Months") {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(now.getMonth() - 3)
      matchesTime = txDate >= threeMonthsAgo
    } else if (timeFilter === "thisYear") {
      matchesTime = txDate.getFullYear() === now.getFullYear()
    }

    return matchesSearch && matchesCategory && matchesAccount && matchesTime
  })

  // Add this function inside the TransactionsPage component
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(filteredTransactions.map((tx) => tx.id))
    } else {
      setSelectedTransactions([])
    }
  }

  // Add this function inside the TransactionsPage component
  const toggleSelectTransaction = (txId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions([...selectedTransactions, txId])
    } else {
      setSelectedTransactions(selectedTransactions.filter((id) => id !== txId))
    }
  }

  // Add this function inside the TransactionsPage component, near the other handler functions
  // Bulk delete transactions
  const handleBulkDelete = async () => {
    if (!user || selectedTransactions.length === 0) return

    setIsProcessing(true)

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", selectedTransactions)
        .eq("user_id", user.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete transactions",
          variant: "destructive",
        })
        console.error("Error deleting transactions:", error)
      } else {
        setTransactions(transactions.filter((tx) => !selectedTransactions.includes(tx.id)))
        toast({
          title: "Success",
          description: `Successfully deleted ${selectedTransactions.length} transactions`,
        })
        setSelectedTransactions([])
      }
    } catch (error) {
      console.error("Error in bulk delete:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setShowDeleteDialog(false)
    }
  }

  // Add this variable inside the TransactionsPage component, after the filteredTransactions is defined
  const allSelected = filteredTransactions.length > 0 && selectedTransactions.length === filteredTransactions.length

  // Get account name by ID
  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    return account ? account.name : "Unknown Account"
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "income":
        return "bg-success/10 text-success border-success/20"
      case "housing":
        return "bg-warning/10 text-warning border-warning/20"
      case "food":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "transportation":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "utilities":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "entertainment":
        return "bg-pink-500/10 text-pink-500 border-pink-500/20"
      case "shopping":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
      case "health":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "education":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      case "personal":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "travel":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default:
        return "bg-secondary/10 text-secondary border-secondary/20"
    }
  }

  // Calculate summary statistics
  const calculateSummary = () => {
    const income = filteredTransactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0)

    const expenses = filteredTransactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

    const net = income - expenses

    return { income, expenses, net }
  }

  const summary = calculateSummary()

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading transactions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage and track your financial transactions</p>
        </div>
        {/* Modify the div that contains the action buttons (near the top of the component) */}
        <div className="flex gap-2">
          {selectedTransactions.length > 0 ? (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isProcessing}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedTransactions.length} {selectedTransactions.length === 1 ? "Transaction" : "Transactions"}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <FileUp className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Income</div>
            <div className="text-2xl font-bold text-success">
              ${summary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Expenses</div>
            <div className="text-2xl font-bold text-destructive">
              ${summary.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Net</div>
            <div className={`text-2xl font-bold ${summary.net >= 0 ? "text-success" : "text-destructive"}`}>
              ${summary.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div>
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search transactions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="category-filter" className="sr-only">
            Filter by Category
          </Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="account-filter" className="sr-only">
            Filter by Account
          </Label>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger id="account-filter">
              <SelectValue placeholder="Filter by Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="time-filter" className="sr-only">
            Filter by Time
          </Label>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger id="time-filter">
              <SelectValue placeholder="Filter by Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Time Period Tabs */}
      <Tabs defaultValue="all" className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setTimeFilter("all")}>
            All Time
          </TabsTrigger>
          <TabsTrigger value="thisMonth" onClick={() => setTimeFilter("thisMonth")}>
            This Month
          </TabsTrigger>
          <TabsTrigger value="lastMonth" onClick={() => setTimeFilter("lastMonth")}>
            Last Month
          </TabsTrigger>
          <TabsTrigger value="last3Months" onClick={() => setTimeFilter("last3Months")}>
            Last 3 Months
          </TabsTrigger>
          <TabsTrigger value="thisYear" onClick={() => setTimeFilter("thisYear")}>
            This Year
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Filter className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No transactions found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {transactions.length === 0
                ? "You haven't added any transactions yet. Get started by adding your first transaction or importing from CSV."
                : "No transactions match your current filters. Try adjusting your search or filters."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <FileUp className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          {/* Modify the TableHeader section to add a checkbox column */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all transactions"
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Modify the TableRow for each transaction to add a checkbox */}
              {filteredTransactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className={selectedTransactions.includes(transaction.id) ? "bg-muted/50" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactions.includes(transaction.id)}
                      onCheckedChange={(checked) => toggleSelectTransaction(transaction.id, !!checked)}
                      aria-label={`Select transaction ${transaction.description}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getCategoryColor(transaction.category)}>
                      {transaction.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{getAccountName(transaction.account_id)}</TableCell>
                  <TableCell className={`text-right ${transaction.amount > 0 ? "text-success" : ""}`}>
                    {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTransaction(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleCreateTransaction}
        accounts={accounts}
      />

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          onSubmit={(updates) => handleUpdateTransaction(editingTransaction.id, updates)}
          accounts={accounts}
        />
      )}

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImportTransactions}
        accounts={accounts}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedTransactions.length}{" "}
              {selectedTransactions.length === 1 ? "transaction" : "transactions"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
