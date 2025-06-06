"use server"

import { createServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function createAccount(formData: FormData) {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const institution = formData.get("institution") as string
  const type = formData.get("type") as "checking" | "savings" | "credit" | "investment" | "loan"
  const balance = Number.parseFloat(formData.get("balance") as string)
  const currency = (formData.get("currency") as string) || "USD"

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      name,
      institution,
      type,
      balance,
      currency,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/accounts")
  return { data }
}

export async function getAccounts() {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function updateAccount(accountId: string, formData: FormData) {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const institution = formData.get("institution") as string
  const balance = Number.parseFloat(formData.get("balance") as string)

  const { data, error } = await supabase
    .from("accounts")
    .update({
      name,
      institution,
      balance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/accounts")
  return { data }
}

export async function deleteAccount(accountId: string) {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase.from("accounts").delete().eq("id", accountId).eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/accounts")
  return { success: true }
}
