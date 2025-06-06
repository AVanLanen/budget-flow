import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function getDashboardData() {
  const supabase = await createServerSupabaseClient()

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").single()

  if (profileError) {
    console.error("Error fetching profile:", profileError)
    return { profile: null, error: profileError }
  }

  return { profile, error: null }
}
