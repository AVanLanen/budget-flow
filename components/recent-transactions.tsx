import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
}

interface RecentTransactionsProps {
  data: Transaction[]
}

export function RecentTransactions({ data }: RecentTransactionsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p>No transactions found</p>
      </div>
    )
  }

  const getCategoryColor = (category: string, amount: number) => {
    if (amount > 0) {
      return "bg-green-500/10 text-green-600 border-green-500/20"
    }

    switch (category.toLowerCase()) {
      case "housing":
      case "rent":
      case "mortgage":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "food":
      case "groceries":
      case "dining":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      case "transportation":
      case "gas":
      case "fuel":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "entertainment":
      case "streaming":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      case "utilities":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
              <TableCell className="max-w-[200px] truncate">{transaction.description}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getCategoryColor(transaction.category, transaction.amount)}>
                  {transaction.category}
                </Badge>
              </TableCell>
              <TableCell
                className={`text-right font-medium ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
