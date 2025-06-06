"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase"

export default function ConfigCheckPage() {
  const [config, setConfig] = useState<any>(null)
  const [authTest, setAuthTest] = useState<any>(null)
  const [dbTest, setDbTest] = useState<any>(null)

  useEffect(() => {
    const checkConfig = async () => {
      // Check environment variables
      const configInfo = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...",
        environment: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      }
      setConfig(configInfo)

      // Test Supabase connection
      try {
        const supabase = createClient()

        // Test auth
        const { data: authData, error: authError } = await supabase.auth.getSession()
        setAuthTest({ data: !!authData.session, error: authError?.message })

        // Test database connection
        const { data: dbData, error: dbError } = await supabase.from("users").select("count").limit(1)

        setDbTest({
          success: !dbError,
          error: dbError?.message,
          details: dbError?.details,
          hint: dbError?.hint,
          code: dbError?.code,
        })
      } catch (error: any) {
        setAuthTest({ error: error.message })
        setDbTest({ error: error.message })
      }
    }

    checkConfig()
  }, [])

  return (
    <div className="content-container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Configuration Check</h1>
        <Badge variant={config?.supabaseUrl?.includes("localhost") ? "destructive" : "default"}>
          {config?.environment || "Unknown"} Environment
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Supabase URL:</strong>
              <p className="text-sm text-muted-foreground font-mono break-all">{config?.supabaseUrl || "Not set"}</p>
            </div>
            <div>
              <strong>Anon Key:</strong>
              <p className="text-sm text-muted-foreground font-mono">
                {config?.hasAnonKey ? config.anonKeyPrefix : "Not set"}
              </p>
            </div>
            <div>
              <strong>Environment:</strong>
              <p className="text-sm text-muted-foreground">
                {config?.environment} {config?.vercelEnv && `(Vercel: ${config.vercelEnv})`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Auth Connection:</strong>
              <Badge variant={authTest?.error ? "destructive" : "default"} className="ml-2">
                {authTest?.error ? "Failed" : "Success"}
              </Badge>
              {authTest?.error && <p className="text-sm text-destructive mt-1">{authTest.error}</p>}
            </div>
            <div>
              <strong>Database Connection:</strong>
              <Badge variant={dbTest?.success ? "default" : "destructive"} className="ml-2">
                {dbTest?.success ? "Success" : "Failed"}
              </Badge>
              {dbTest?.error && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-destructive">{dbTest.error}</p>
                  {dbTest.details && <p className="text-xs text-muted-foreground">{dbTest.details}</p>}
                  {dbTest.hint && <p className="text-xs text-blue-600">{dbTest.hint}</p>}
                  {dbTest.code && <p className="text-xs font-mono">Code: {dbTest.code}</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">For Production Deployment:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm mt-2">
              <li>
                Create a production Supabase project at{" "}
                <a href="https://supabase.com" className="text-blue-600 underline">
                  supabase.com
                </a>
              </li>
              <li>Copy your production project URL and anon key</li>
              <li>Set environment variables in your deployment platform:</li>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>
                  <code className="bg-muted px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> (optional)
                </li>
              </ul>
              <li>Run the database setup scripts in your production Supabase project</li>
              <li>Enable Row Level Security (RLS) policies</li>
              <li>Configure authentication providers if needed</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
