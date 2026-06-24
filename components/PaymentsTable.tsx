"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Payment } from "@/types"

export function PaymentsTable({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) return <p className="text-sm text-muted-foreground">Нет данных</p>

  return (
    <div className="overflow-auto rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Контрагент</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
            <TableHead>Валюта</TableHead>
            <TableHead className="text-right">KZT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p, i) => (
            <TableRow key={i}>
              <TableCell className="whitespace-nowrap">{p.date}</TableCell>
              <TableCell>{p.counterparty}</TableCell>
              <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
              <TableCell className="text-right">{p.amount.toLocaleString("ru-KZ")}</TableCell>
              <TableCell>{p.currency}</TableCell>
              <TableCell className="text-right font-medium">{p.amountKZT.toLocaleString("ru-KZ")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
