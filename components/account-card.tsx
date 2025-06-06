"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, CreditCard } from "lucide-react"

type Account = {
  id: string
  name: string
  institution: string
  type: "checking" | "savings" | "credit" | "investment" | "loan"
  balance: number
  currency: string
  created_at: string
  updated_at: string
}

interface AccountCardProps {
  account: Account
  onEdit: () => void
  onDelete: () => void
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "checking":
      case "savings":
        return "bg-primary/10 text-primary border-primary/20"
      case "credit":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "investment":
        return "bg-success/10 text-success border-success/20"
      case "loan":
        return "bg-warning/10 text-warning border-warning/20"
      default:
        return "bg-secondary/10 text-secondary border-secondary/20"
    }
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case "checking":
      case "savings":
        return (
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
            className="h-4 w-4"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        )
      case "credit":
        return <CreditCard className="h-4 w-4" />
      case "investment":
        return (
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
            className="h-4 w-4"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        )
      case "loan":
        return (
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
            className="h-4 w-4"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        )
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const formatBalance = (balance: number, type: string) => {
    const absBalance = Math.abs(balance)
    const isNegative = balance < 0 || ["credit", "loan"].includes(type)

    return {
      amount: absBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      isNegative,
    }
  }

  const { amount, isNegative } = formatBalance(account.balance, account.type)
  const lastUpdated = new Date(account.updated_at).toLocaleDateString()

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {getAccountTypeIcon(account.type)}
              <div>
                <CardTitle className="text-base">{account.name}</CardTitle>
                <CardDescription>{account.institution}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getAccountTypeColor(account.type)}>
                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isNegative ? "text-destructive" : "text-foreground"}`}>
            {isNegative ? "-" : ""}${amount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Last updated: {lastUpdated}</p>
        </CardContent>
        <CardFooter className="bg-muted/50 pt-2 pb-2">
          <div className="flex justify-between w-full text-xs text-muted-foreground">
            <span>Account ID: {account.id.slice(0, 8)}...</span>
            <span>{account.currency}</span>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account "{account.name}" and all associated transactions. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete()
                setShowDeleteDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
