"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { ScenarioChart } from "@/components/scenario-chart"
import { ScenarioComparison } from "@/components/scenario-comparison"
import { useToast } from "@/hooks/use-toast"
import {
  calculateAnnuityFutureValue,
  calculateLoanPayoffPeriods,
  calculateInvestmentWithOneTimePayments,
  calculateLoanWithOneTimePayments,
} from "@/utils/financial"
import { saveScenario, getScenarios, deleteScenario } from "@/app/actions/scenarios"

// Define scenario types
type ScenarioType = "investment" | "loan" | "one-time" | "comparison"

// Define one-time payment structure
interface OneTimePayment {
  id: string
  amount: number
  timing: number // year for investments, month for loans
  description: string
}

// Define scenario data structure
interface ScenarioData {
  id: string
  name: string
  type: "investment" | "loan" | "one-time"
  parameters: {
    [key: string]: any
  }
  results: {
    [key: string]: any
  }
  created_at?: string
}

export default function ScenariosPage() {
  const { toast } = useToast()

  // Active scenario type
  const [activeScenarioType, setActiveScenarioType] = useState<ScenarioType>("investment")

  // Investment scenario state
  const [investmentAmount, setInvestmentAmount] = useState(500)
  const [investmentRate, setInvestmentRate] = useState(7)
  const [investmentYears, setInvestmentYears] = useState(20)
  const [investmentOneTimePayments, setInvestmentOneTimePayments] = useState<OneTimePayment[]>([])

  // Loan payoff scenario state
  const [loanBalance, setLoanBalance] = useState(20000)
  const [loanRate, setLoanRate] = useState(5)
  const [loanPayment, setLoanPayment] = useState(500)
  const [loanOneTimePayments, setLoanOneTimePayments] = useState<OneTimePayment[]>([])

  // Comparison scenarios state
  const [savedScenarios, setSavedScenarios] = useState<ScenarioData[]>([])
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load saved scenarios on mount
  useEffect(() => {
    loadScenarios()
  }, [])

  const loadScenarios = async () => {
    setIsLoading(true)
    const result = await getScenarios()
    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to load scenarios",
        variant: "destructive",
      })
    } else {
      setSavedScenarios(result.data || [])
    }
    setIsLoading(false)
  }

  // Calculate investment results with one-time payments
  const investmentResult = calculateInvestmentWithOneTimePayments(
    investmentAmount,
    investmentRate / 100,
    investmentYears,
    investmentOneTimePayments.map((p) => ({ amount: p.amount, year: p.timing })),
  )

  const regularContributions = investmentAmount * 12 * investmentYears
  const oneTimeContributions = investmentOneTimePayments.reduce((sum, p) => sum + p.amount, 0)
  const totalContributions = regularContributions + oneTimeContributions
  const interestEarned = investmentResult.futureValue - totalContributions

  // Calculate loan results with one-time payments
  const loanResult = calculateLoanWithOneTimePayments(
    loanBalance,
    loanRate / 100,
    loanPayment,
    loanOneTimePayments.map((p) => ({ amount: p.amount, month: p.timing })),
  )

  const loanYears = Math.floor(loanResult.totalMonths / 12)
  const remainingMonths = Math.round(loanResult.totalMonths % 12)

  // Generate chart data for investment scenario
  const investmentChartData = investmentResult.breakdown.map((item) => ({
    year: item.year,
    value: item.totalValue,
  }))

  // Generate chart data for loan scenario
  const loanChartData = Array.from({ length: Math.ceil(loanResult.totalMonths / 12) + 1 }, (_, i) => {
    const monthIndex = Math.min(i * 12, loanResult.breakdown.length - 1)
    return {
      year: i,
      value: loanResult.breakdown[monthIndex]?.remainingBalance || 0,
    }
  })

  // Add one-time payment
  const addOneTimePayment = (type: "investment" | "loan") => {
    const newPayment: OneTimePayment = {
      id: `${type}-${Date.now()}`,
      amount: type === "investment" ? 5000 : 1000,
      timing: type === "investment" ? 5 : 12,
      description: type === "investment" ? "Bonus contribution" : "Extra payment",
    }

    if (type === "investment") {
      setInvestmentOneTimePayments([...investmentOneTimePayments, newPayment])
    } else {
      setLoanOneTimePayments([...loanOneTimePayments, newPayment])
    }
  }

  // Remove one-time payment
  const removeOneTimePayment = (id: string, type: "investment" | "loan") => {
    if (type === "investment") {
      setInvestmentOneTimePayments(investmentOneTimePayments.filter((p) => p.id !== id))
    } else {
      setLoanOneTimePayments(loanOneTimePayments.filter((p) => p.id !== id))
    }
  }

  // Update one-time payment
  const updateOneTimePayment = (id: string, field: keyof OneTimePayment, value: any, type: "investment" | "loan") => {
    const updatePayments = (payments: OneTimePayment[]) =>
      payments.map((p) => (p.id === id ? { ...p, [field]: value } : p))

    if (type === "investment") {
      setInvestmentOneTimePayments(updatePayments(investmentOneTimePayments))
    } else {
      setLoanOneTimePayments(updatePayments(loanOneTimePayments))
    }
  }

  // Save current scenario
  const saveCurrentScenario = async () => {
    const formData = new FormData()

    let scenarioData: any

    if (activeScenarioType === "investment") {
      scenarioData = {
        name: `Investment $${investmentAmount}/mo at ${investmentRate}%${investmentOneTimePayments.length > 0 ? " + extras" : ""}`,
        type: "investment",
        parameters: {
          monthlyAmount: investmentAmount,
          rate: investmentRate,
          years: investmentYears,
          oneTimePayments: investmentOneTimePayments,
        },
        results: {
          futureValue: investmentResult.futureValue,
          totalContributions,
          regularContributions,
          oneTimeContributions,
          interestEarned,
          chartData: investmentChartData,
          breakdown: investmentResult.breakdown,
        },
      }
    } else {
      scenarioData = {
        name: `Loan $${loanBalance} at ${loanRate}%${loanOneTimePayments.length > 0 ? " + extras" : ""}`,
        type: "loan",
        parameters: {
          balance: loanBalance,
          rate: loanRate,
          payment: loanPayment,
          oneTimePayments: loanOneTimePayments,
        },
        results: {
          totalMonths: loanResult.totalMonths,
          totalPayments: loanResult.totalPayments,
          totalInterest: loanResult.totalInterest,
          chartData: loanChartData,
          breakdown: loanResult.breakdown,
        },
      }
    }

    formData.append("name", scenarioData.name)
    formData.append("type", scenarioData.type)
    formData.append("parameters", JSON.stringify(scenarioData.parameters))
    formData.append("results", JSON.stringify(scenarioData.results))

    const result = await saveScenario(formData)

    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to save scenario",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Scenario saved successfully",
      })
      loadScenarios()
    }
  }

  // Delete scenario
  const handleDeleteScenario = async (scenarioId: string) => {
    const result = await deleteScenario(scenarioId)

    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to delete scenario",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      })
      setSelectedScenarios(selectedScenarios.filter((id) => id !== scenarioId))
      loadScenarios()
    }
  }

  // Toggle scenario selection for comparison
  const toggleScenarioSelection = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter((sid) => sid !== id))
    } else {
      setSelectedScenarios([...selectedScenarios, id])
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Financial Scenarios</h1>
      <p className="text-muted-foreground mb-8">
        Explore different financial scenarios including one-time payments to help plan your future
      </p>

      <Tabs
        defaultValue="investment"
        value={activeScenarioType}
        onValueChange={(value) => setActiveScenarioType(value as ScenarioType)}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-lg grid-cols-4 mb-8">
          <TabsTrigger value="investment">Investment</TabsTrigger>
          <TabsTrigger value="loan">Loan Payoff</TabsTrigger>
          <TabsTrigger value="one-time">One-Time Impact</TabsTrigger>
          <TabsTrigger value="comparison">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="investment" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Investment Parameters</CardTitle>
                <CardDescription>Adjust the values to see how your investment could grow over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="monthly-investment">Monthly Investment</Label>
                    <span className="text-muted-foreground">
                      {investmentAmount === 0 ? "$0 (One-time only)" : `$${investmentAmount}`}
                    </span>
                  </div>
                  <Slider
                    id="monthly-investment"
                    min={0}
                    max={2000}
                    step={50}
                    value={[investmentAmount]}
                    onValueChange={(value) => setInvestmentAmount(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="interest-rate">Annual Return Rate (%)</Label>
                    <span className="text-muted-foreground">{investmentRate}%</span>
                  </div>
                  <Slider
                    id="interest-rate"
                    min={1}
                    max={12}
                    step={0.5}
                    value={[investmentRate]}
                    onValueChange={(value) => setInvestmentRate(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="investment-years">Investment Period (Years)</Label>
                    <span className="text-muted-foreground">{investmentYears} years</span>
                  </div>
                  <Slider
                    id="investment-years"
                    min={1}
                    max={40}
                    step={1}
                    value={[investmentYears]}
                    onValueChange={(value) => setInvestmentYears(value[0])}
                  />
                </div>

                {/* One-time payments section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>One-Time Contributions</Label>
                    <Button variant="outline" size="sm" onClick={() => addOneTimePayment("investment")}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {investmentOneTimePayments.map((payment) => (
                    <div key={payment.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <Input
                          placeholder="Description"
                          value={payment.description}
                          onChange={(e) =>
                            updateOneTimePayment(payment.id, "description", e.target.value, "investment")
                          }
                          className="flex-1 mr-2"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOneTimePayment(payment.id, "investment")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Amount ($)</Label>
                          <Input
                            type="number"
                            value={payment.amount}
                            onChange={(e) =>
                              updateOneTimePayment(payment.id, "amount", Number(e.target.value), "investment")
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Year</Label>
                          <Input
                            type="number"
                            min={1}
                            max={investmentYears}
                            value={payment.timing}
                            onChange={(e) =>
                              updateOneTimePayment(payment.id, "timing", Number(e.target.value), "investment")
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2">
                <div className="text-2xl font-bold">
                  ${investmentResult.futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-sm text-muted-foreground">Total value after {investmentYears} years</p>
                <div className="grid grid-cols-2 gap-4 w-full text-sm text-muted-foreground">
                  <div>
                    <p>Regular contributions: ${regularContributions.toLocaleString()}</p>
                    <p>One-time contributions: ${oneTimeContributions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p>Total contributions: ${totalContributions.toLocaleString()}</p>
                    <p>Interest earned: ${interestEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
                <Button className="mt-4" variant="outline" onClick={saveCurrentScenario}>
                  Save This Scenario
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investment Growth</CardTitle>
                <CardDescription>Projected growth including one-time contributions</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ScenarioChart data={investmentChartData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="loan" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Loan Payoff Calculator</CardTitle>
                <CardDescription>See how extra payments can accelerate your loan payoff</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="loan-balance">Current Loan Balance</Label>
                    <span className="text-muted-foreground">${loanBalance}</span>
                  </div>
                  <Slider
                    id="loan-balance"
                    min={1000}
                    max={100000}
                    step={1000}
                    value={[loanBalance]}
                    onValueChange={(value) => setLoanBalance(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="loan-rate">Interest Rate (%)</Label>
                    <span className="text-muted-foreground">{loanRate}%</span>
                  </div>
                  <Slider
                    id="loan-rate"
                    min={1}
                    max={15}
                    step={0.25}
                    value={[loanRate]}
                    onValueChange={(value) => setLoanRate(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="loan-payment">Monthly Payment</Label>
                    <span className="text-muted-foreground">${loanPayment}</span>
                  </div>
                  <Slider
                    id="loan-payment"
                    min={100}
                    max={2000}
                    step={50}
                    value={[loanPayment]}
                    onValueChange={(value) => setLoanPayment(value[0])}
                  />
                </div>

                {/* One-time payments section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Extra Payments</Label>
                    <Button variant="outline" size="sm" onClick={() => addOneTimePayment("loan")}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {loanOneTimePayments.map((payment) => (
                    <div key={payment.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <Input
                          placeholder="Description"
                          value={payment.description}
                          onChange={(e) => updateOneTimePayment(payment.id, "description", e.target.value, "loan")}
                          className="flex-1 mr-2"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeOneTimePayment(payment.id, "loan")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Amount ($)</Label>
                          <Input
                            type="number"
                            value={payment.amount}
                            onChange={(e) => updateOneTimePayment(payment.id, "amount", Number(e.target.value), "loan")}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Month</Label>
                          <Input
                            type="number"
                            min={1}
                            max={360}
                            value={payment.timing}
                            onChange={(e) => updateOneTimePayment(payment.id, "timing", Number(e.target.value), "loan")}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2">
                <div className="text-2xl font-bold">
                  {loanYears} years {remainingMonths} months
                </div>
                <p className="text-sm text-muted-foreground">Time to pay off your loan</p>
                <div className="grid grid-cols-2 gap-4 w-full text-sm text-muted-foreground">
                  <div>
                    <p>
                      Total payments: $
                      {loanResult.totalPayments.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p>
                      Interest saved: $
                      {(
                        calculateLoanPayoffPeriods(loanBalance, loanRate / 100, loanPayment) * loanPayment -
                        loanResult.totalPayments
                      ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p>
                      Interest paid: ${loanResult.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p>Extra payments: ${loanOneTimePayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
                  </div>
                </div>
                <Button className="mt-4" variant="outline" onClick={saveCurrentScenario}>
                  Save This Scenario
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loan Balance Over Time</CardTitle>
                <CardDescription>See how extra payments accelerate payoff</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ScenarioChart data={loanChartData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="one-time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>One-Time Payment Impact Analysis</CardTitle>
              <CardDescription>Compare scenarios with and without one-time payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Investment Impact</h3>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      $
                      {(
                        investmentResult.futureValue -
                        calculateAnnuityFutureValue(investmentAmount, investmentRate / 100, investmentYears, 12)
                      ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-sm text-muted-foreground">Additional value from one-time contributions</p>
                    <div className="mt-2 space-y-1 text-xs">
                      {investmentOneTimePayments.map((payment) => (
                        <div key={payment.id} className="flex justify-between">
                          <span>
                            {payment.description} (Year {payment.timing})
                          </span>
                          <span>${payment.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Loan Impact</h3>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      $
                      {(
                        calculateLoanPayoffPeriods(loanBalance, loanRate / 100, loanPayment) * loanPayment -
                        loanResult.totalPayments
                      ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-sm text-muted-foreground">Interest saved from extra payments</p>
                    <div className="mt-2 space-y-1 text-xs">
                      {loanOneTimePayments.map((payment) => (
                        <div key={payment.id} className="flex justify-between">
                          <span>
                            {payment.description} (Month {payment.timing})
                          </span>
                          <span>${payment.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compare Scenarios</CardTitle>
              <CardDescription>Select scenarios to compare their outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading scenarios...</p>
                </div>
              ) : savedScenarios.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No saved scenarios yet. Create and save scenarios from the other tabs.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {savedScenarios.map((scenario) => (
                      <Card
                        key={scenario.id}
                        className={`cursor-pointer transition-all ${
                          selectedScenarios.includes(scenario.id) ? "ring-2 ring-primary" : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleScenarioSelection(scenario.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-base">{scenario.name}</CardTitle>
                              <CardDescription>
                                {scenario.type === "investment"
                                  ? `${scenario.parameters.years} years @ ${scenario.parameters.rate}%`
                                  : `${Math.floor(scenario.results.totalMonths / 12)} years ${Math.round(scenario.results.totalMonths % 12)} months`}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteScenario(scenario.id)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">
                            {scenario.type === "investment"
                              ? `$${scenario.results.futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                              : `$${scenario.results.totalPayments.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={
                                scenario.type === "investment"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-orange-500/10 text-orange-500"
                              }
                            >
                              {scenario.type === "investment" ? "Investment" : "Loan"}
                            </Badge>
                            {((scenario.type === "investment" && scenario.parameters.oneTimePayments?.length > 0) ||
                              (scenario.type === "loan" && scenario.parameters.oneTimePayments?.length > 0)) && (
                              <Badge variant="outline" className="bg-teal-500/10 text-teal-500">
                                One-time payments
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {scenario.type === "investment"
                              ? `Interest: $${scenario.results.interestEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                              : `Interest: $${scenario.results.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedScenarios.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Comparison Results</h3>
                      <ScenarioComparison scenarios={savedScenarios.filter((s) => selectedScenarios.includes(s.id))} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
