"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountCard } from "@/components/account-card"
import { AddAccountDialog } from "@/components/add-account-dialog"
import { EditAccountDialog } from "@/components/edit-account-dialog"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { Plus } from "lucide-react"

type Account = {
  id: string
  name: string
  institution: string
  type: "checking" | "savings" | "credit" | "investment" | "loan"
  balance: number
  currency: string
  created_at: string
  updated_at: string
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch accounts from database
  const fetchAccounts = async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch accounts",
        variant: "destructive",
      })
      console.error("Error fetching accounts:", error)
    } else {
      setAccounts(data || [])
    }
    setLoading(false)
  }

  // Create new account
  const handleCreateAccount = async (accountData: Omit<Account, "id" | "created_at" | "updated_at">) => {
    if (!user) return

    const { data, error } = await supabase
      .from("accounts")
      .insert({
        ...accountData,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      })
      console.error("Error creating account:", error)
    } else {
      setAccounts([data, ...accounts])
      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Account created successfully",
      })
    }
  }

  // Update account
  const handleUpdateAccount = async (accountId: string, updates: Partial<Account>) => {
    if (!user) return

    const { data, error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", accountId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive",
      })
      console.error("Error updating account:", error)
    } else {
      setAccounts(accounts.map((acc) => (acc.id === accountId ? data : acc)))
      setEditingAccount(null)
      toast({
        title: "Success",
        description: "Account updated successfully",
      })
    }
  }

  // Delete account
  const handleDeleteAccount = async (accountId: string) => {
    if (!user) return

    const { error } = await supabase.from("accounts").delete().eq("id", accountId).eq("user_id", user.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      })
      console.error("Error deleting account:", error)
    } else {
      setAccounts(accounts.filter((acc) => acc.id !== accountId))
      toast({
        title: "Success",
        description: "Account deleted successfully",
      })
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [user])

  // Filter accounts by type
  const filteredAccounts = accounts.filter((account) => {
    if (selectedType === "all") return true
    if (selectedType === "bank") return ["checking", "savings"].includes(account.type)
    return account.type === selectedType
  })

  // Calculate totals
  const totalAssets = accounts
    .filter((acc) => ["checking", "savings", "investment"].includes(acc.type))
    .reduce((sum, acc) => sum + acc.balance, 0)

  const totalLiabilities = accounts
    .filter((acc) => ["credit", "loan"].includes(acc.type))
    .reduce((sum, acc) => sum + Math.abs(acc.balance), 0)

  const netWorth = totalAssets - totalLiabilities

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Total Assets</div>
          <div className="text-2xl font-bold text-green-600">
            ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Total Liabilities</div>
          <div className="text-2xl font-bold text-red-600">
            ${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Net Worth</div>
          <div className={`text-2xl font-bold ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4 mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="credit">Credit</TabsTrigger>
          <TabsTrigger value="investment">Investment</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="space-y-4">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-10 w-10 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold">No accounts found</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                  {selectedType === "all"
                    ? "You haven't added any accounts yet. Get started by adding your first account."
                    : `You don't have any ${selectedType} accounts yet.`}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => setEditingAccount(account)}
                  onDelete={() => handleDeleteAccount(account.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Account Dialog */}
      <AddAccountDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSubmit={handleCreateAccount} />

      {/* Edit Account Dialog */}
      {editingAccount && (
        <EditAccountDialog
          account={editingAccount}
          open={!!editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(null)}
          onSubmit={(updates) => handleUpdateAccount(editingAccount.id, updates)}
        />
      )}
    </div>
  )
}
