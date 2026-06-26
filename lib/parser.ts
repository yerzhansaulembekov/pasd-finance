import type { PaymentRow, ExpenseRow, DDSSummary, DDSMonth } from "@/types"

export const MONTH_LABELS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"]

function parseNum(val: string | undefined): number {
  if (!val) return 0
  return parseFloat(val.replace(/[\s ]/g, "").replace(",", ".")) || 0
}

function extractMonth(act: string): number {
  const m = act.match(/от\s+\d{2}\.(\d{2})\.\d{4}/)
  return m ? parseInt(m[1], 10) : 0
}

function splitCSV(line: string): string[] {
  const result: string[] = []
  let cur = ""
  let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === "," && !inQ) { result.push(cur.trim()); cur = "" }
    else { cur += ch }
  }
  result.push(cur.trim())
  return result
}

function rowText(cols: string[]): string {
  return cols.join(" ").toUpperCase()
}

export interface ParsedSheet {
  payments: PaymentRow[]
  fotBI: number[]           // [Jan..Dec] — ФОТ BI (сотрудники + CORE, без ИП остатка)
  fotSENSATA: number[]      // [Jan..Dec] — ФОТ SENSATA
  taxBI: number[]           // [Jan..Dec] — Налоги BI
  taxSENSATA: number[]      // [Jan..Dec] — Налоги SENSATA
  ipCommissionBI: number[]  // [Jan..Dec] — Комиссия ИП 6%
  ipOstatokBI: number[]     // [Jan..Dec] — Остаток на счетах ИП
  overheadByMonth: number[] // [Jan..Dec] — Косвенные из Транзакции
  openingBalanceBI: number
  openingBalanceSENSATA: number
}

export function parsePaymentsSheet(csv: string): ParsedSheet {
  const lines = csv.trim().split("\n")

  const payments: PaymentRow[] = []
  const fotBI = new Array(12).fill(0)
  const fotSENSATA = new Array(12).fill(0)
  const taxBI = new Array(12).fill(0)
  const taxSENSATA = new Array(12).fill(0)
  const ipCommissionBI = new Array(12).fill(0)
  const ipOstatokBI = new Array(12).fill(0)

  let incomeSection: "BI" | "SENSATA" = "BI"
  let fotSection: "BI" | "SENSATA" | null = null
  let taxSection: "BI" | "SENSATA" | null = null
  let inTax = false
  let inIpCommission = false
  let inIpOstatok = false
  let openingBalanceBI = 0
  let openingBalanceSENSATA = 0
  let openingSection: "BI" | "SENSATA" | null = null

  for (const line of lines) {
    const cols = splitCSV(line)
    const txt = rowText(cols)
    const colB = cols[1] ?? ""
    const colE = cols[4] ?? ""  // ФИО / section header in FOT area

    // ── Opening balance FIRST — before any continue ────────────────
    if (txt.includes("ОСТАТОК НА НАЧАЛО")) {
      const entity = txt.includes("SENSATA") ? "SENSATA" : "BI"
      let val = 0
      for (const c of cols) { const n = parseNum(c); if (n > 1_000_000) { val = n; break } }
      if (val > 0) {
        if (entity === "BI") openingBalanceBI = val
        else openingBalanceSENSATA = val
      } else {
        openingSection = entity
      }
    } else if (openingSection) {
      let val = 0
      for (const c of cols) { const n = parseNum(c); if (n > 1_000_000) { val = n; break } }
      if (val > 0) {
        if (openingSection === "BI") openingBalanceBI = val
        else openingBalanceSENSATA = val
        openingSection = null
      }
    }

    // ── Section detection ──────────────────────────────────────────
    if (txt.includes("ПРИХОД SENSATA") || (txt.includes("SENSATA") && txt.includes("ПРИХОД"))) {
      incomeSection = "SENSATA"
    }
    if (txt.includes("ФОТ ФАКТИЧЕСКИЙ") || colE.toUpperCase().includes("ФОТ ФАКТИЧЕСКИЙ")) {
      fotSection = "BI"
      inTax = false
      continue
    }
    if (txt.includes("РАСХОДЫ ПО SENSATA") || (txt.includes("SENSATA") && (txt.includes("ФОТ") || txt.includes("РАСХОД")))) {
      fotSection = "SENSATA"
      inTax = false
      continue
    }
    if (txt.includes("НАЛОГОВЫЕ РАСХОДЫ")) {
      inTax = true
      taxSection = txt.includes("SENSATA") ? "SENSATA" : (taxSection === "BI" ? "SENSATA" : "BI")
      if (!txt.includes("SENSATA") && taxSection !== "SENSATA") taxSection = "BI"
      fotSection = null
      continue
    }
    if (txt.includes("КОСВЕННЫЕ РАСХОДЫ")) {
      inTax = false
      fotSection = null
      continue
    }
    // IP sections: with splitCSV, amounts are single quoted fields so col4=name, col8+i=months
    const col4 = (cols[4] ?? "").toUpperCase().trim()
    if (col4.includes("ПЕРЕЧЕНЬ ИП КОМИССИЯ")) {
      inIpCommission = true; inIpOstatok = false; continue
    }
    if (col4.includes("ПЕРЕЧЕНЬ ИП ОСТАТОК")) {
      inIpOstatok = true; inIpCommission = false; continue
    }
    if ((inIpCommission || inIpOstatok) && (cols[4] ?? "").startsWith("ИП")) {
      const target = inIpCommission ? ipCommissionBI : ipOstatokBI
      for (let i = 0; i < 12; i++) target[i] += parseNum(cols[8 + i])
      // no continue — left side of same row may still have an act income
    }

    // ── Income rows (left side cols A-D) ──────────────────────────
    if (colB.startsWith("Акт") || colB.startsWith("акт")) {
      const month = extractMonth(colB)
      if (month > 0) {
        payments.push({
          num: parseInt(cols[0] ?? "0", 10) || 0,
          act: colB,
          date: `2026-${String(month).padStart(2, "0")}`,
          month,
          amount: parseNum(cols[2]),
          pending: parseNum(cols[3]),
          section: incomeSection,
          employee: colE,
          paymentMethod: cols[5] ?? "",
          status: cols[6] ?? "",
          project: cols[7] ?? "",
          salaryByMonth: [],
        })
      }
    }

    // ── FOT: use ИТОГО row as authoritative total ───────────────────
    if (fotSection) {
      const u0 = (cols[0] ?? "").toUpperCase().trim()
      const u4 = colE.toUpperCase().trim()
      const isItogo = u0 === "ИТОГО" || u0 === "ИТОГО:" || u4 === "ИТОГО" || u4 === "ИТОГО:"
      if (isItogo) {
        const target = fotSection === "BI" ? fotBI : fotSENSATA
        // BI FOT months start at col 8, SENSATA FOT months start at col 5
        const offset = fotSection === "BI" ? 8 : 5
        const vals = Array.from({ length: 12 }, (_, mi) => parseNum(cols[offset + mi]))
        // Only write if row has non-zero values (skip intermediate zero ИТОГО rows)
        if (vals.some(v => v > 0)) {
          for (let mi = 0; mi < 12; mi++) target[mi] = vals[mi]
        }
      }
    }

    // ── Tax rows: fixed positions from debug (cols 5,11,15,20) ───────
    // Values are unquoted "879 845","38" pairs — integer part only is sufficient
    if (inTax) {
      const name = (cols[4] ?? "").trim()
      const isDataRow = name.length > 2
        && !name.toUpperCase().includes("ИТОГО")
        && !name.toUpperCase().includes("НАИМЕН")
        && !name.toUpperCase().includes("НАЛОГИ 2026")
      if (isDataRow) {
        const q1 = parseNum(cols[5])
        const q2 = parseNum(cols[10])
        const q3 = parseNum(cols[13])
        const q4 = parseNum(cols[17])
        if (q1 + q2 + q3 + q4 > 0) {
          const target = taxSection === "SENSATA" ? taxSENSATA : taxBI
          if (q1 > 0) target[2]  += q1  // март      — конец Q1
          if (q2 > 0) target[5]  += q2  // июнь      — конец Q2
          if (q3 > 0) target[8]  += q3  // сентябрь  — конец Q3
          if (q4 > 0) target[11] += q4  // декабрь   — конец Q4
        }
      }
    }
  }

  // Exclude ИП остаток и ИП комиссия from fotBI (keep only сотрудники + CORE)
  for (let i = 0; i < 12; i++) fotBI[i] = Math.max(0, fotBI[i] - ipOstatokBI[i] - ipCommissionBI[i])

  return { payments, fotBI, fotSENSATA, taxBI, taxSENSATA, ipCommissionBI, ipOstatokBI, overheadByMonth: new Array(12).fill(0), openingBalanceBI, openingBalanceSENSATA }
}

export function parseExpensesSheet(csv: string): ExpenseRow[] {
  const lines = csv.trim().split("\n")
  const rows: ExpenseRow[] = []

  for (const line of lines.slice(1)) {
    const cols = splitCSV(line)
    if (!cols[0] || !cols[1]) continue
    const dateParts = cols[0].match(/(\d{2})\.(\d{2})\.(\d{4})/)
    if (!dateParts) continue
    const month = parseInt(dateParts[2], 10)
    rows.push({
      date: `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}`,
      month,
      amount: parseNum(cols[1]),
      description: cols[2] ?? "",
      category: cols[3] ?? "",
      budget: cols[4] ?? "",
    })
  }

  return rows
}

export function buildDDS(parsed: ParsedSheet, expenses: ExpenseRow[]): DDSSummary {
  // Overhead by month from Транзакции sheet
  const overheadByMonth = new Array(12).fill(0)
  for (const e of expenses) {
    if (e.month >= 1 && e.month <= 12) {
      overheadByMonth[e.month - 1] += e.amount
    }
  }

  const months: DDSMonth[] = []

  // Collect all active months (from payments or any non-zero column)
  const activeMonths = new Set<number>()
  for (const p of parsed.payments) activeMonths.add(p.month)
  for (let i = 0; i < 12; i++) {
    if (parsed.fotBI[i] || parsed.fotSENSATA[i] || parsed.taxBI[i] || parsed.taxSENSATA[i] || overheadByMonth[i]) {
      activeMonths.add(i + 1)
    }
  }

  for (const mo of Array.from(activeMonths).sort((a, b) => a - b)) {
    const mi = mo - 1
    const incomeBI = parsed.payments.filter(p => p.section === "BI" && p.month === mo).reduce((s, p) => s + p.amount, 0)
    const pendingBI = parsed.payments.filter(p => p.section === "BI" && p.month === mo).reduce((s, p) => s + p.pending, 0)
    const incomeSENSATA = parsed.payments.filter(p => p.section === "SENSATA" && p.month === mo).reduce((s, p) => s + p.amount, 0)
    const pendingSENSATA = parsed.payments.filter(p => p.section === "SENSATA" && p.month === mo).reduce((s, p) => s + p.pending, 0)

    months.push({
      month: mo,
      label: MONTH_LABELS[mi],
      incomeBI,
      incomeSENSATA,
      pendingBI,
      pendingSENSATA,
      fotBI: parsed.fotBI[mi],
      fotSENSATA: parsed.fotSENSATA[mi],
      taxBI: parsed.taxBI[mi],
      taxSENSATA: parsed.taxSENSATA[mi],
      ipCommissionBI: parsed.ipCommissionBI[mi],
      overhead: overheadByMonth[mi],
    })
  }

  const sum = (fn: (m: DDSMonth) => number) => months.reduce((s, m) => s + fn(m), 0)

  return {
    openingBalanceBI: parsed.openingBalanceBI,
    openingBalanceSENSATA: parsed.openingBalanceSENSATA,
    totalIncomeBI: sum(m => m.incomeBI),
    totalIncomeSENSATA: sum(m => m.incomeSENSATA),
    totalPendingBI: sum(m => m.pendingBI),
    totalPendingSENSATA: sum(m => m.pendingSENSATA),
    totalFotBI: sum(m => m.fotBI),
    totalFotSENSATA: sum(m => m.fotSENSATA),
    totalTaxBI: sum(m => m.taxBI),
    totalTaxSENSATA: sum(m => m.taxSENSATA),
    totalIpCommissionBI: sum(m => m.ipCommissionBI),
    totalIpOstatokBI: parsed.ipOstatokBI.reduce((s, v) => s + v, 0),
    totalOverhead: sum(m => m.overhead),
    months,
  }
}
