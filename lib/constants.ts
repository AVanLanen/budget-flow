/**
 * Application constants
 */

export const TRANSACTION_CATEGORIES = [
  "Income",
  "Housing",
  "Food",
  "Dining",
  "Transportation",
  "Utilities",
  "Health",
  "Shopping",
  "Entertainment",
  "Education",
  "Travel",
  "Personal",
  "Investment",
  "Gift",
  "Refund",
  "Miscellaneous",
] as const

export const ACCOUNT_TYPES = ["checking", "savings", "credit", "investment", "loan"] as const

// Define which account types are liabilities (everything else is an asset)
export const LIABILITY_ACCOUNT_TYPES = ["credit", "loan"] as const

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
] as const

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number]
export type AccountType = (typeof ACCOUNT_TYPES)[number]
export type Currency = (typeof CURRENCIES)[number]
