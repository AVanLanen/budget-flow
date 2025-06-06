"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [progress, setProgress] = useState(25)
  const router = useRouter()

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
      setProgress((step + 1) * 25)
    } else {
      router.push("/")
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setProgress((step - 1) * 25)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Budget Flow</CardTitle>
          <CardDescription>Let's set up your financial dashboard in a few simple steps</CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tell us about yourself</h2>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Preferred Currency</Label>
                  <select
                    id="currency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Add your income sources</h2>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="income-name">Income Source</Label>
                    <Input id="income-name" placeholder="Salary" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="income-amount">Monthly Amount</Label>
                    <Input id="income-amount" type="number" placeholder="5000" />
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  + Add Another Income Source
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Set up your budget categories</h2>
              <Tabs defaultValue="expenses" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="savings">Savings</TabsTrigger>
                  <TabsTrigger value="investments">Investments</TabsTrigger>
                </TabsList>
                <TabsContent value="expenses" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="housing">Housing</Label>
                      <Input id="housing" type="number" placeholder="2000" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="food">Food</Label>
                      <Input id="food" type="number" placeholder="800" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="transportation">Transportation</Label>
                      <Input id="transportation" type="number" placeholder="400" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="utilities">Utilities</Label>
                      <Input id="utilities" type="number" placeholder="350" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    + Add Custom Category
                  </Button>
                </TabsContent>
                <TabsContent value="savings" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="emergency">Emergency Fund</Label>
                      <Input id="emergency" type="number" placeholder="500" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vacation">Vacation</Label>
                      <Input id="vacation" type="number" placeholder="200" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    + Add Custom Savings Goal
                  </Button>
                </TabsContent>
                <TabsContent value="investments" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="retirement">Retirement</Label>
                      <Input id="retirement" type="number" placeholder="800" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stocks">Stocks</Label>
                      <Input id="stocks" type="number" placeholder="200" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    + Add Custom Investment
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Import your transactions (Optional)</h2>
              <div className="grid gap-4">
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-10 w-10 text-muted-foreground"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <Button variant="outline" className="mt-4">
                      Upload CSV
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Supported formats: CSV files from most major banks</p>
                  <p>You can also skip this step and add transactions manually later</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          <Button onClick={handleNext}>{step < 4 ? "Next" : "Complete Setup"}</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
