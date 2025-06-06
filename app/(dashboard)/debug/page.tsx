"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

export default function DebugPage() {
  const { user, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [dbTest, setDbTest] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        setSessionInfo({ session: session?.user, error })

        if (session?.user) {
          // Test database access
          const { data, error: dbError } = await supabase
            .from("accounts")
            .select("count")
            .eq("user_id", session.user.id)

          setDbTest({ data, error: dbError })
        }
      } catch (error) {
        setSessionInfo({ error: error })
      }
    }

    if (!loading) {
      checkSession()
    }
  }, [loading])

  return (
    <div className="content-container p-6 space-y-6">
      <h1 className="text-4xl font-bold">Debug Information</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Auth Provider State</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(
                {
                  user: user ? { id: user.id, email: user.email } : null,
                  loading,
                },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">{JSON.stringify(sessionInfo, null, 2)}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Test</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">{JSON.stringify(dbTest, null, 2)}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(
                {
                  supabaseUrl: typeof window !== "undefined" ? "Client-side" : "Server-side",
                  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                  hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
