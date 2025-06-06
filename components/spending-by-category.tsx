"use client"

interface SpendingData {
  category: string
  amount: number
  color: string
}

interface SpendingByCategoryProps {
  data: SpendingData[]
}

export function SpendingByCategory({ data }: SpendingByCategoryProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <div className="text-center">
          <p>No spending data available</p>
          <p className="text-sm mt-1">Add some transactions to see your spending breakdown</p>
        </div>
      </div>
    )
  }

  const maxAmount = Math.max(...data.map((d) => d.amount))
  const totalSpending = data.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="h-[300px] p-4">
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-sm text-right text-muted-foreground truncate">{item.category}</div>
            <div className="flex-1 relative">
              <div className="h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(item.amount / maxAmount) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
            <div className="w-16 text-sm font-medium text-right">${item.amount.toLocaleString()}</div>
            <div className="w-12 text-xs text-muted-foreground text-right">
              {((item.amount / totalSpending) * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Spending</span>
            <span className="font-medium">${totalSpending.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
