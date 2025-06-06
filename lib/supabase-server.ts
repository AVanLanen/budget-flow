import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "./supabase"

export function createServerClient() {
  const cookieStore = cookies()

  return createClient<Database>(
    "https://vumlbhvbotswzbkxkjmv.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        getSession: async () => {
          const authToken = cookieStore.get("sb-access-token")?.value
          const refreshToken = cookieStore.get("sb-refresh-token")?.value

          if (!authToken || !refreshToken) {
            return { data: { session: null }, error: null }
          }

          return {
            data: {
              session: {
                access_token: authToken,
                refresh_token: refreshToken,
                user: null,
                token_type: "bearer",
                expires_in: 3600,
                expires_at: Date.now() + 3600 * 1000,
              },
            },
            error: null,
          }
        },
        setSession: async (session) => {
          if (session) {
            cookieStore.set("sb-access-token", session.access_token, {
              httpOnly: true,
              secure: true,
              sameSite: "lax",
              maxAge: session.expires_in,
            })
            cookieStore.set("sb-refresh-token", session.refresh_token, {
              httpOnly: true,
              secure: true,
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30, // 30 days
            })
          } else {
            cookieStore.delete("sb-access-token")
            cookieStore.delete("sb-refresh-token")
          }
        },
      },
    },
  )
}
