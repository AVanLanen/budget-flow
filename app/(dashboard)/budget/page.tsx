import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetFlowChart } from "@/components/budget-flow-chart"
import { BudgetCategoryList } from "@/components/budget-category-list"

export default function BudgetPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Budget Flow</h1>

      <Tabs defaultValue="flow" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="flow">Flow Visualization</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Flow</CardTitle>
              <CardDescription>Visualize where your money comes from and where it goes</CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <BudgetFlowChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
              <CardDescription>Manage your budget categories and allocations</CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetCategoryList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
