"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { parsePaymentsCSV, parseTransactionsCSV } from "@/lib/parser"
import type { Payment, Transaction } from "@/types"

interface Props {
  onPayments: (data: Payment[]) => void
  onTransactions: (data: Transaction[]) => void
}

export function DataLoader({ onPayments, onTransactions }: Props) {
  const [sheetId, setSheetId] = useState("")
  const [paymentsGid, setPaymentsGid] = useState("0")
  const [transactionsGid, setTransactionsGid] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function fetchSheet(gid: string): Promise<string> {
    const res = await fetch(`/api/sheets?sheetId=${encodeURIComponent(sheetId)}&gid=${gid}`)
    if (!res.ok) throw new Error(await res.text())
    return res.text()
  }

  async function handleFetch() {
    if (!sheetId) return
    setLoading(true)
    setError("")
    try {
      const [payCSV, txCSV] = await Promise.all([
        fetchSheet(paymentsGid),
        transactionsGid ? fetchSheet(transactionsGid) : Promise.resolve(""),
      ])
      onPayments(parsePaymentsCSV(payCSV))
      if (txCSV) onTransactions(parseTransactionsCSV(txCSV))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, type: "payments" | "transactions") {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const csv = ev.target?.result as string
      if (type === "payments") onPayments(parsePaymentsCSV(csv))
      else onTransactions(parseTransactionsCSV(csv))
    }
    reader.readAsText(file, "utf-8")
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">Источник данных</h2>

      {/* Google Sheets section */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Google Sheets (публичная таблица)</p>
        <input
          className="w-full rounded border px-3 py-1.5 text-sm"
          placeholder="Sheet ID (из URL таблицы)"
          value={sheetId}
          onChange={(e) => setSheetId(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="w-32 rounded border px-3 py-1.5 text-sm"
            placeholder="GID листа оплат"
            value={paymentsGid}
            onChange={(e) => setPaymentsGid(e.target.value)}
          />
          <input
            className="w-32 rounded border px-3 py-1.5 text-sm"
            placeholder="GID листа транзакций"
            value={transactionsGid}
            onChange={(e) => setTransactionsGid(e.target.value)}
          />
          <Button onClick={handleFetch} disabled={!sheetId || loading} size="sm">
            {loading ? "Загрузка…" : "Загрузить"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* CSV upload section */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Или загрузить CSV вручную</p>
        <div className="flex flex-wrap gap-4">
          <label className="cursor-pointer text-sm underline">
            Оплаты CSV
            <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e, "payments")} />
          </label>
          <label className="cursor-pointer text-sm underline">
            Транзакции CSV
            <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e, "transactions")} />
          </label>
        </div>
      </div>
    </div>
  )
}
