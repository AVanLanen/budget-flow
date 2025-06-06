"use server"

import { createServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function saveScenario(formData: FormData) {
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
  const type = formData.get("type") as "investment" | "loan"
  const parameters = JSON.parse(formData.get("parameters") as string)
  const results = JSON.parse(formData.get("results") as string)

  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      user_id: user.id,
      name,
      type,
      parameters,
      results,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/scenarios")
  return { data }
}

export async function getScenarios() {
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
    .from("scenarios")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function deleteScenario(scenarioId: string) {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase.from("scenarios").delete().eq("id", scenarioId).eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/scenarios")
  return { success: true }
}
