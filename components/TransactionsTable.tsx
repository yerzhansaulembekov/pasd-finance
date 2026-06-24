"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Transaction } from "@/types"

const typeLabel: Record<Transaction["type"], string> = {
  income: "Доход",
  expense: "Расход",
  transfer: "Перевод",
}

const typeVariant: Record<Transaction["type"], "default" | "destructive" | "outline"> = {
  income: "default",
  expense: "destructive",
  transfer: "outline",
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) return <p className="text-sm text-muted-foreground">Нет данных</p>

  return (
    <div className="overflow-auto rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Счёт</TableHead>
            <TableHead>Контрагент</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead className="text-right">KZT</TableHead>
            <TableHead className="text-right">Баланс</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t, i) => (
            <TableRow key={i}>
              <TableCell className="whitespace-nowrap">{t.date}</TableCell>
              <TableCell><Badge variant={typeVariant[t.type]}>{typeLabel[t.type]}</Badge></TableCell>
              <TableCell>{t.account}</TableCell>
              <TableCell>{t.counterparty}</TableCell>
              <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
              <TableCell className={`text-right font-medium ${t.type === "income" ? "text-green-600" : t.type === "expense" ? "text-red-600" : ""}`}>
                {t.type === "expense" ? "-" : ""}{t.amountKZT.toLocaleString("ru-KZ")}
              </TableCell>
              <TableCell className="text-right">{t.balance.toLocaleString("ru-KZ")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
