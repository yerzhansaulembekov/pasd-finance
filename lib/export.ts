import * as XLSX from "xlsx"
import type { Payment, Transaction } from "@/types"

export function exportPaymentsToExcel(payments: Payment[]) {
  const rows = payments.map((p) => ({
    Дата: p.date,
    Контрагент: p.counterparty,
    Категория: p.category,
    Сумма: p.amount,
    Валюта: p.currency,
    "Сумма KZT": p.amountKZT,
    Описание: p.description,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Фактические оплаты 2026")
  XLSX.writeFile(wb, "payments-2026.xlsx")
}

export function exportTransactionsToExcel(transactions: Transaction[]) {
  const rows = transactions.map((t) => ({
    Дата: t.date,
    Тип: t.type,
    Счёт: t.account,
    Контрагент: t.counterparty,
    Категория: t.category,
    Сумма: t.amount,
    Валюта: t.currency,
    "Сумма KZT": t.amountKZT,
    Баланс: t.balance,
    Описание: t.description,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Транзакции 2026")
  XLSX.writeFile(wb, "transactions-2026.xlsx")
}

export async function exportToPDF(title: string, data: Record<string, unknown>[]) {
  // Dynamic import so jsPDF stays out of the SSR bundle
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ orientation: "landscape" })
  doc.setFontSize(14)
  doc.text(title, 14, 16)

  if (data.length === 0) {
    doc.text("Нет данных", 14, 30)
    doc.save(`${title}.pdf`)
    return
  }

  const headers = Object.keys(data[0])
  const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")))

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 22,
    styles: { fontSize: 7 },
  })

  doc.save(`${title}.pdf`)
}
