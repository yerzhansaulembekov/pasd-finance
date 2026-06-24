export interface Payment {
  date: string
  counterparty: string
  category: string
  amount: number
  currency: string
  amountKZT: number
  description: string
}

export interface Transaction {
  date: string
  type: "income" | "expense" | "transfer"
  account: string
  counterparty: string
  category: string
  amount: number
  currency: string
  amountKZT: number
  balance: number
  description: string
}

export interface SummaryStats {
  totalIncome: number
  totalExpense: number
  netCashFlow: number
  transactionCount: number
}

export interface CategoryStat {
  category: string
  amount: number
  count: number
}

export interface MonthlyStat {
  month: string
  income: number
  expense: number
}

export type SheetType = "payments" | "transactions"
