import type { Payment, Transaction, SummaryStats, CategoryStat, MonthlyStat } from "@/types"

function parseNum(val: string): number {
  if (!val) return 0
  return parseFloat(val.replace(/\s/g, "").replace(",", ".")) || 0
}

function parseDate(val: string): string {
  if (!val) return ""
  // Handle DD.MM.YYYY format
  const match = val.match(/(\d{2})\.(\d{2})\.(\d{4})/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return val
}

export function parsePaymentsCSV(csv: string): Payment[] {
  const lines = csv.trim().split("\n")
  if (lines.length < 2) return []
  // Skip header row
  return lines.slice(1).map((line) => {
    const cols = splitCSVLine(line)
    return {
      date: parseDate(cols[0] ?? ""),
      counterparty: cols[1] ?? "",
      category: cols[2] ?? "",
      amount: parseNum(cols[3] ?? ""),
      currency: cols[4] ?? "KZT",
      amountKZT: parseNum(cols[5] ?? cols[3] ?? ""),
      description: cols[6] ?? "",
    }
  })
}

export function parseTransactionsCSV(csv: string): Transaction[] {
  const lines = csv.trim().split("\n")
  if (lines.length < 2) return []
  return lines.slice(1).map((line) => {
    const cols = splitCSVLine(line)
    const typeRaw = (cols[1] ?? "").toLowerCase()
    const type: Transaction["type"] =
      typeRaw.includes("доход") || typeRaw.includes("приход")
        ? "income"
        : typeRaw.includes("перевод")
        ? "transfer"
        : "expense"
    return {
      date: parseDate(cols[0] ?? ""),
      type,
      account: cols[2] ?? "",
      counterparty: cols[3] ?? "",
      category: cols[4] ?? "",
      amount: parseNum(cols[5] ?? ""),
      currency: cols[6] ?? "KZT",
      amountKZT: parseNum(cols[7] ?? cols[5] ?? ""),
      balance: parseNum(cols[8] ?? ""),
      description: cols[9] ?? "",
    }
  })
}

// Handles quoted CSV fields
function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function computeStats(transactions: Transaction[]): SummaryStats {
  let totalIncome = 0
  let totalExpense = 0
  for (const t of transactions) {
    if (t.type === "income") totalIncome += t.amountKZT
    else if (t.type === "expense") totalExpense += t.amountKZT
  }
  return {
    totalIncome,
    totalExpense,
    netCashFlow: totalIncome - totalExpense,
    transactionCount: transactions.length,
  }
}

export function computePaymentStats(payments: Payment[]): SummaryStats {
  const total = payments.reduce((s, p) => s + p.amountKZT, 0)
  return {
    totalIncome: 0,
    totalExpense: total,
    netCashFlow: -total,
    transactionCount: payments.length,
  }
}

export function groupByCategory(items: (Payment | Transaction)[]): CategoryStat[] {
  const map = new Map<string, CategoryStat>()
  for (const item of items) {
    const cat = item.category || "Без категории"
    const existing = map.get(cat) ?? { category: cat, amount: 0, count: 0 }
    existing.amount += item.amountKZT
    existing.count += 1
    map.set(cat, existing)
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
}

export function groupByMonth(transactions: Transaction[]): MonthlyStat[] {
  const map = new Map<string, MonthlyStat>()
  for (const t of transactions) {
    const month = t.date.slice(0, 7) // YYYY-MM
    const existing = map.get(month) ?? { month, income: 0, expense: 0 }
    if (t.type === "income") existing.income += t.amountKZT
    else if (t.type === "expense") existing.expense += t.amountKZT
    map.set(month, existing)
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
}
