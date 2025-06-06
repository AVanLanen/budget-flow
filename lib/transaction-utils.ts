/**
 * Utility functions for transaction processing
 */

/**
 * Automatically categorize a transaction based on its description and amount
 *
 * @param description The transaction description
 * @param amount The transaction amount
 * @returns The best matching category
 */
export function categorizeTransaction(description: string, amount: number): string {
  const desc = description.toLowerCase()

  // Income categories
  if (amount > 0) {
    if (
      desc.includes("salary") ||
      desc.includes("payroll") ||
      desc.includes("direct deposit") ||
      desc.includes("paycheck") ||
      desc.includes("wages")
    ) {
      return "Income"
    }
    if (desc.includes("dividend") || desc.includes("interest") || desc.includes("yield")) {
      return "Investment"
    }
    if (desc.includes("refund") || desc.includes("rebate") || desc.includes("cashback")) {
      return "Refund"
    }
    if (desc.includes("gift") || desc.includes("present")) {
      return "Gift"
    }
    return "Income"
  }

  // Expense categories
  if (
    desc.includes("rent") ||
    desc.includes("mortgage") ||
    desc.includes("hoa") ||
    desc.includes("lease") ||
    desc.includes("housing")
  ) {
    return "Housing"
  }

  if (
    desc.includes("grocery") ||
    desc.includes("supermarket") ||
    desc.includes("food") ||
    desc.includes("market") ||
    desc.includes("walmart") ||
    desc.includes("target") ||
    desc.includes("costco") ||
    desc.includes("safeway") ||
    desc.includes("kroger") ||
    desc.includes("trader") ||
    desc.includes("whole foods")
  ) {
    return "Food"
  }

  if (
    desc.includes("restaurant") ||
    desc.includes("cafe") ||
    desc.includes("coffee") ||
    desc.includes("doordash") ||
    desc.includes("uber eats") ||
    desc.includes("grubhub") ||
    desc.includes("mcdonalds") ||
    desc.includes("starbucks") ||
    desc.includes("dining")
  ) {
    return "Dining"
  }

  if (
    desc.includes("gas") ||
    desc.includes("fuel") ||
    desc.includes("shell") ||
    desc.includes("chevron") ||
    desc.includes("exxon") ||
    desc.includes("mobil") ||
    desc.includes("uber") ||
    desc.includes("lyft") ||
    desc.includes("taxi") ||
    desc.includes("transit") ||
    desc.includes("parking") ||
    desc.includes("train") ||
    desc.includes("subway") ||
    desc.includes("bus") ||
    desc.includes("airline") ||
    desc.includes("flight") ||
    desc.includes("travel")
  ) {
    return "Transportation"
  }

  if (
    desc.includes("electric") ||
    desc.includes("water") ||
    desc.includes("gas bill") ||
    desc.includes("utility") ||
    desc.includes("internet") ||
    desc.includes("phone") ||
    desc.includes("mobile") ||
    desc.includes("cable") ||
    desc.includes("netflix") ||
    desc.includes("spotify") ||
    desc.includes("hulu") ||
    desc.includes("disney") ||
    desc.includes("subscription")
  ) {
    return "Utilities"
  }

  if (
    desc.includes("doctor") ||
    desc.includes("medical") ||
    desc.includes("health") ||
    desc.includes("dental") ||
    desc.includes("pharmacy") ||
    desc.includes("hospital") ||
    desc.includes("clinic") ||
    desc.includes("insurance")
  ) {
    return "Health"
  }

  if (
    desc.includes("amazon") ||
    desc.includes("ebay") ||
    desc.includes("etsy") ||
    desc.includes("walmart") ||
    desc.includes("target") ||
    desc.includes("best buy") ||
    desc.includes("apple") ||
    desc.includes("clothing") ||
    desc.includes("shoes") ||
    desc.includes("apparel") ||
    desc.includes("store")
  ) {
    return "Shopping"
  }

  if (
    desc.includes("movie") ||
    desc.includes("theater") ||
    desc.includes("cinema") ||
    desc.includes("concert") ||
    desc.includes("ticket") ||
    desc.includes("entertainment") ||
    desc.includes("game") ||
    desc.includes("sport") ||
    desc.includes("event")
  ) {
    return "Entertainment"
  }

  if (
    desc.includes("school") ||
    desc.includes("tuition") ||
    desc.includes("education") ||
    desc.includes("book") ||
    desc.includes("course") ||
    desc.includes("class") ||
    desc.includes("training") ||
    desc.includes("workshop")
  ) {
    return "Education"
  }

  if (
    desc.includes("hotel") ||
    desc.includes("airbnb") ||
    desc.includes("vacation") ||
    desc.includes("resort") ||
    desc.includes("travel") ||
    desc.includes("airline") ||
    desc.includes("flight") ||
    desc.includes("trip")
  ) {
    return "Travel"
  }

  if (
    desc.includes("gym") ||
    desc.includes("fitness") ||
    desc.includes("workout") ||
    desc.includes("spa") ||
    desc.includes("salon") ||
    desc.includes("haircut") ||
    desc.includes("beauty") ||
    desc.includes("personal")
  ) {
    return "Personal"
  }

  // Default category for expenses
  return "Miscellaneous"
}

/**
 * Parse a CSV file and extract transactions
 *
 * @param csvText The CSV file content as text
 * @param mappings Column mappings for transaction fields
 * @param accountId The account ID to associate with transactions
 * @returns Array of parsed transactions
 */
export function parseCSVTransactions(
  csvText: string,
  mappings: { date: number; description: number; amount: number; category?: number },
  accountId: string,
): any[] {
  const lines = csvText.split("\n")
  const transactions = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle both comma and semicolon delimiters
    const delimiter = line.includes(";") ? ";" : ","
    const row = line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""))

    if (row.length <= 1) continue // Skip empty rows

    // Parse date
    const dateValue = row[mappings.date]
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
    const amountValue = row[mappings.amount].replace(/[^\d.-]/g, "")
    const amount = Number.parseFloat(amountValue)

    // If amount parsing failed, skip this row
    if (isNaN(amount)) continue

    // Get category
    let category
    if (mappings.category !== undefined && row[mappings.category]) {
      category = row[mappings.category]
    } else {
      // Auto-categorize based on description
      category = categorizeTransaction(row[mappings.description], amount)
    }

    transactions.push({
      account_id: accountId,
      date: formattedDate,
      description: row[mappings.description],
      amount: amount,
      category: category,
    })
  }

  return transactions
}
