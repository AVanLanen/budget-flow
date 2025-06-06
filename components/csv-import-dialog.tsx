"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText, Loader2 } from "lucide-react"
import { categorizeTransaction } from "@/lib/transaction-utils"

type Account = {
  id: string
  name: string
  institution: string
  type: string
}

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (transactions: any[]) => Promise<boolean>
  accounts: Account[]
}

export function CSVImportDialog({ open, onOpenChange, onImport, accounts }: CSVImportDialogProps) {
  const [selectedAccount, setSelectedAccount] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [mappings, setMappings] = useState({
    date: "",
    description: "",
    amount: "",
    category: "",
  })
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseCSV(selectedFile)
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n")
      const parsedData = lines
        .map((line) => {
          // Handle both comma and semicolon delimiters
          const delimiter = line.includes(";") ? ";" : ","
          return line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""))
        })
        .filter((row) => row.length > 1 && row.some((cell) => cell.trim() !== ""))

      setPreview(parsedData)

      // Auto-detect column mappings
      if (parsedData.length > 0) {
        const headers = parsedData[0].map((h) => h.toLowerCase())
        const newMappings = { ...mappings }

        // Try to find date column
        const dateIndex = headers.findIndex((h) => h.includes("date") || h.includes("time") || h.includes("when"))
        if (dateIndex !== -1) newMappings.date = dateIndex.toString()

        // Try to find description column
        const descIndex = headers.findIndex(
          (h) =>
            h.includes("desc") ||
            h.includes("narration") ||
            h.includes("memo") ||
            h.includes("note") ||
            h.includes("payee") ||
            h.includes("merchant"),
        )
        if (descIndex !== -1) newMappings.description = descIndex.toString()

        // Try to find amount column
        const amountIndex = headers.findIndex(
          (h) =>
            h.includes("amount") ||
            h.includes("sum") ||
            h.includes("value") ||
            h.includes("debit") ||
            h.includes("credit"),
        )
        if (amountIndex !== -1) newMappings.amount = amountIndex.toString()

        // Try to find category column
        const categoryIndex = headers.findIndex(
          (h) => h.includes("category") || h.includes("type") || h.includes("tag"),
        )
        if (categoryIndex !== -1) newMappings.category = categoryIndex.toString()

        setMappings(newMappings)
      }
    }
    reader.readAsText(file)
  }

  const handleNext = () => {
    if (step === 1 && (!file || !selectedAccount)) {
      toast({
        title: "Missing information",
        description: "Please select an account and upload a CSV file.",
        variant: "destructive",
      })
      return
    }

    if (step === 2 && (!mappings.date || !mappings.description || !mappings.amount)) {
      toast({
        title: "Missing mappings",
        description: "Please map the required columns: Date, Description, and Amount.",
        variant: "destructive",
      })
      return
    }

    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const processAndImportTransactions = async () => {
    if (!file || !selectedAccount || preview.length < 2) return

    setIsProcessing(true)
    setProgress(0)

    try {
      // Skip header row
      const dataRows = preview.slice(1)
      const transactions = []

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        if (row.length <= 1) continue // Skip empty rows

        const dateIndex = Number.parseInt(mappings.date)
        const descIndex = Number.parseInt(mappings.description)
        const amountIndex = Number.parseInt(mappings.amount)
        const categoryIndex = mappings.category ? Number.parseInt(mappings.category) : -1

        if (isNaN(dateIndex) || isNaN(descIndex) || isNaN(amountIndex)) continue

        // Parse date
        const dateValue = row[dateIndex]
        let parsedDate: Date

        // Try different date formats
        if (dateValue.match(/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/)) {
          // DD/MM/YYYY or MM/DD/YYYY
          const parts = dateValue.split(/[/\-.]/)
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            parsedDate = new Date(Number.parseInt(parts[0]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[2]))
          } else if (parts[2].length === 4) {
            // DD/MM/YYYY or MM/DD/YYYY
            parsedDate = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[0]))
          } else {
            // Assume MM/DD/YY
            parsedDate = new Date(
              2000 + Number.parseInt(parts[2]),
              Number.parseInt(parts[0]) - 1,
              Number.parseInt(parts[1]),
            )
          }
        } else {
          // Try standard date parsing
          parsedDate = new Date(dateValue)
        }

        // If date parsing failed, use current date
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date()
        }

        // Format date as YYYY-MM-DD
        const formattedDate = parsedDate.toISOString().split("T")[0]

        // Parse amount
        const amountValue = row[amountIndex].replace(/[^\d.-]/g, "")
        const amount = Number.parseFloat(amountValue)

        // If amount parsing failed, skip this row
        if (isNaN(amount)) continue

        // Get category
        let category
        if (categoryIndex >= 0 && row[categoryIndex]) {
          category = row[categoryIndex]
        } else {
          // Auto-categorize based on description
          category = categorizeTransaction(row[descIndex], amount)
        }

        transactions.push({
          account_id: selectedAccount,
          date: formattedDate,
          description: row[descIndex],
          amount: amount,
          category: category,
        })

        setProgress(Math.round(((i + 1) / dataRows.length) * 100))
      }

      if (transactions.length === 0) {
        toast({
          title: "No valid transactions",
          description: "Could not find any valid transactions in the CSV file.",
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      const success = await onImport(transactions)

      if (success) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${transactions.length} transactions.`,
        })
        resetForm()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error processing CSV:", error)
      toast({
        title: "Import failed",
        description: "An error occurred while importing transactions.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview([])
    setMappings({
      date: "",
      description: "",
      amount: "",
      category: "",
    })
    setStep(1)
    setSelectedAccount("")
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm()
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
          <DialogDescription>Upload a CSV file to import multiple transactions at once.</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="account">Select Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger id="account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.institution})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            {preview.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Preview (first 3 rows):</h3>
                <div className="border rounded-md overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        {preview[0].map((header, i) => (
                          <th key={i} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {preview.slice(1, 4).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-xs">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 py-4">
            <h3 className="text-sm font-medium">Map CSV Columns to Transaction Fields</h3>
            <p className="text-sm text-muted-foreground">
              Select which columns from your CSV file correspond to each transaction field.
            </p>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date-column">
                  Date Column <span className="text-destructive">*</span>
                </Label>
                <Select value={mappings.date} onValueChange={(value) => setMappings({ ...mappings, date: value })}>
                  <SelectTrigger id="date-column">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {preview[0]?.map((header, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {header} (Column {i + 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description-column">
                  Description Column <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={mappings.description}
                  onValueChange={(value) => setMappings({ ...mappings, description: value })}
                >
                  <SelectTrigger id="description-column">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {preview[0]?.map((header, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {header} (Column {i + 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount-column">
                  Amount Column <span className="text-destructive">*</span>
                </Label>
                <Select value={mappings.amount} onValueChange={(value) => setMappings({ ...mappings, amount: value })}>
                  <SelectTrigger id="amount-column">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {preview[0]?.map((header, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {header} (Column {i + 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category-column">Category Column (Optional)</Label>
                <Select
                  value={mappings.category}
                  onValueChange={(value) => setMappings({ ...mappings, category: value })}
                >
                  <SelectTrigger id="category-column">
                    <SelectValue placeholder="Select column or leave empty for auto-categorization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-categorize</SelectItem>
                    {preview[0]?.map((header, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {header} (Column {i + 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  If not selected, categories will be automatically assigned based on transaction descriptions.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 py-4">
            <h3 className="text-sm font-medium">Review and Import</h3>
            <p className="text-sm text-muted-foreground">
              Review your settings and click Import to process the transactions.
            </p>

            <div className="bg-muted rounded-md p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account:</span>
                <span className="text-sm">{accounts.find((a) => a.id === selectedAccount)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">File:</span>
                <span className="text-sm">{file?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Rows to process:</span>
                <span className="text-sm">{preview.length > 0 ? preview.length - 1 : 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Date column:</span>
                <span className="text-sm">{preview[0]?.[Number.parseInt(mappings.date)] || "Not selected"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Description column:</span>
                <span className="text-sm">{preview[0]?.[Number.parseInt(mappings.description)] || "Not selected"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Amount column:</span>
                <span className="text-sm">{preview[0]?.[Number.parseInt(mappings.amount)] || "Not selected"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Category column:</span>
                <span className="text-sm">
                  {mappings.category ? preview[0]?.[Number.parseInt(mappings.category)] : "Auto-categorize"}
                </span>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Processing transactions...</span>
                  <span className="text-sm">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handleBack} disabled={isProcessing}>
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={processAndImportTransactions} disabled={isProcessing} className="gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Transactions
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
