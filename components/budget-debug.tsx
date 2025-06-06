"use client"

import { useEffect, useState } from "react"
import { getBudgetFlowData, getBudgetCategories } from "@/app/actions/budget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function BudgetDebug() {
  const [flowData, setFlowData] = useState<any>(null)
  const [categoryData, setCategoryData] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      const flow = await getBudgetFlowData()
      const categories = await getBudgetCategories()
      setFlowData(flow)
      setCategoryData(categories)
    }
    fetchData()
  }, [])

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Flow Data Debug</CardTitle>
        </CardHeader>
        <CardContent className="text-xs">
          <pre className="whitespace-pre-wrap overflow-auto max-h-40">{JSON.stringify(flowData, null, 2)}</pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Category Data Debug</CardTitle>
        </CardHeader>
        <CardContent className="text-xs">
          <pre className="whitespace-pre-wrap overflow-auto max-h-40">{JSON.stringify(categoryData, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
