export interface PaymentRow {
  num: number
  act: string
  date: string
  month: number
  amount: number
  pending: number
  section: "BI" | "SENSATA"
  employee: string
  paymentMethod: string
  status: string
  project: string
  salaryByMonth: number[]
}

export interface ExpenseRow {
  date: string
  month: number
  amount: number
  description: string
  category: string
  budget: string
}

export interface DDSMonth {
  month: number
  label: string
  incomeBI: number
  incomeSENSATA: number
  pendingBI: number
  pendingSENSATA: number
  fotBI: number
  fotCore: number
  fotSENSATA: number
  taxBI: number
  taxSENSATA: number
  ipCommissionBI: number
  overhead: number
}

export interface DDSSummary {
  openingBalanceBI: number
  openingBalanceSENSATA: number
  totalIncomeBI: number
  totalIncomeSENSATA: number
  totalPendingBI: number
  totalPendingSENSATA: number
  totalFotBI: number
  totalFotCore: number
  totalFotSENSATA: number
  totalTaxBI: number
  totalTaxSENSATA: number
  totalIpCommissionBI: number
  totalIpOstatokBI: number
  totalOverhead: number
  months: DDSMonth[]
}
