"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

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
        variant: "destructive",\
