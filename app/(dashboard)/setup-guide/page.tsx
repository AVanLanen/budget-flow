"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function SetupGuidePage() {
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    })
  }

  const envVars = [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      description: "Your Supabase project URL",
      example: "https://your-project.supabase.co",
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      description: "Your Supabase anon/public key",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      description: "Your Supabase service role key (optional)",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  ]

  const sqlScripts = [
    "scripts/step1-basic-tables.sql",
    "scripts/step2-add-constraints.sql",
    "scripts/step3-enable-rls.sql",
    "scripts/step4-indexes-triggers.sql",
  ]

  return (
    <div className="content-container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Production Setup Guide</h1>
        <Badge variant="outline">Configuration</Badge>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Create Production Supabase Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Go to{" "}
                <a
                  href="https://supabase.com"
                  className="text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  supabase.com
                </a>
              </li>
              <li>Create a new project for production</li>
              <li>Wait for the project to be fully provisioned</li>
              <li>Go to Settings → API to find your keys</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Set Environment Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set these environment variables in your deployment platform (Vercel, Netlify, etc.):
            </p>
            {envVars.map((envVar) => (
              <div key={envVar.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{envVar.name}</code>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(envVar.name)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{envVar.description}</p>
                <p className="text-xs font-mono bg-muted p-2 rounded">{envVar.example}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Run Database Scripts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Run these SQL scripts in your production Supabase project (SQL Editor):
            </p>
            <div className="space-y-2">
              {sqlScripts.map((script, index) => (
                <div key={script} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <code className="font-mono text-sm">{script}</code>
                    <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                  </div>
                  <Badge variant="outline">Required</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Configure Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to Authentication → Settings in your Supabase dashboard</li>
              <li>Add your production domain to "Site URL"</li>
              <li>Add your production domain to "Redirect URLs"</li>
              <li>Configure any additional auth providers if needed</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 5: Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              After deployment, visit these pages to verify everything is working:
            </p>
            <div className="space-y-2">
              <Button variant="outline" asChild className="w-full justify-start">
                <a href="/config-check">/config-check - Verify environment variables</a>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <a href="/debug">/debug - Test authentication and database</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
