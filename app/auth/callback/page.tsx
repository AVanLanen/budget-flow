"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the auth code from the URL
      const hash = window.location.hash

      // Exchange code for session
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error during auth callback:", error)
        router.push("/login?error=auth_callback_error")
        return
      }

      if (data.session) {
        // Check if user has completed onboarding
        const { data: userProfile } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", data.session.user.id)
          .single()

        if (userProfile?.onboarding_completed) {
          router.push("/")
        } else {
          router.push("/onboarding")
        }
      } else {
        router.push("/login")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}
