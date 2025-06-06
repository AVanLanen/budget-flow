"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { getBudgetCategories } from "@/app/actions/budget"
import { PencilIcon } from "lucide-react"

type BudgetCategory = {
  id: string
  name: string
  budgeted: number
  spent: number
  remaining: number
}

export function BudgetCategoryList() {
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true)
      setError(null)
      try {
        const result = await getBudgetCategories()
        if (result.error) {
          setError(result.error)
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
        } else if (result.data) {
          setCategories(result.data)
        }
      } catch (error) {
        const errorMessage = "Failed to load budget categories"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading budget categories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium mb-2 text-red-600">Error loading categories</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium mb-2">No budget data available</p>
        <p className="text-muted-foreground">Add some transactions to see your budget categories</p>
      </div>
    )
  }

  const getProgressColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100
    if (percentage >= 100) return "bg-red-500"
    if (percentage >= 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStatusBadge = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100
    if (percentage >= 100) return <Badge variant="destructive">Over Budget</Badge>
    if (percentage >= 80) return <Badge variant="secondary">Near Limit</Badge>
    return <Badge variant="default">On Track</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Budget Categories</h3>
          <p className="text-sm text-muted-foreground">Current month spending vs. budget</p>
        </div>
        <Button variant="outline" size="sm">
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit Budgets
        </Button>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => {
          const percentage = Math.min((category.spent / category.budgeted) * 100, 100)

          return (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  {getStatusBadge(category.spent, category.budgeted)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Spent: ${category.spent.toLocaleString()}</span>
                    <span>Budget: ${category.budgeted.toLocaleString()}</span>
                  </div>

                  <Progress value={percentage} className="h-2" />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}% used</span>
                    <span>
                      {category.remaining >= 0
                        ? `$${category.remaining.toLocaleString()} remaining`
                        : `$${Math.abs(category.remaining).toLocaleString()} over budget`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                ${categories.reduce((sum, cat) => sum + cat.budgeted, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Budget</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                ${categories.reduce((sum, cat) => sum + cat.spent, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
            </div>
            <div>
              <div
                className={`text-2xl font-bold ${
                  categories.reduce((sum, cat) => sum + cat.remaining, 0) >= 0 ? "text-teal-600" : "text-red-600"
                }`}
              >
                ${categories.reduce((sum, cat) => sum + cat.remaining, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
