// app/actions/accounts.ts

// This file will contain actions related to user accounts.
// For example, creating accounts, managing profiles, etc.

// Placeholder for future implementation.
// You can add your account-related actions here.

"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"

export async function createAccountAction(formData: FormData) {
  const supabase = createClient(cookies())

  const email = String(formData.get("email"))
  const password = String(formData.get("password"))
  const firstName = String(formData.get("firstName"))
  const lastName = String(formData.get("lastName"))

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error(error)
    return redirect("/auth/error?error_description=" + error.message)
  }

  revalidatePath("/")
  return redirect("/auth/check-email")
}

export async function signInAction(formData: FormData) {
  const supabase = createClient(cookies())

  const email = String(formData.get("email"))
  const password = String(formData.get("password"))

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error(error)
    return redirect("/auth/error?error_description=" + error.message)
  }

  revalidatePath("/")
  return redirect("/")
}

export async function signOutAction() {
  const supabase = createClient(cookies())

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error(error)
    return redirect("/auth/error?error_description=" + error.message)
  }

  revalidatePath("/")
  return redirect("/auth/sign-in")
}
