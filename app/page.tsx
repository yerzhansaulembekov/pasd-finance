"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataLoader } from "@/components/DataLoader"
import { StatsCards } from "@/components/StatsCards"
import { PaymentsTable } from "@/components/PaymentsTable"
import { TransactionsTable } from "@/components/TransactionsTable"
import { CategoryPieChart } from "@/components/charts/CategoryPieChart"
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart"
import { computeStats, computePaymentStats, groupByCategory, groupByMonth } from "@/lib/parser"
import { exportPaymentsToExcel, exportTransactionsToExcel, exportToPDF } from "@/lib/export"
import type { Payment, Transaction } from "@/types"

export default function Home() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const txStats = computeStats(transactions)
  const payStats = computePaymentStats(payments)
  const txCategories = groupByCategory(transactions)
  const payCategories = groupByCategory(payments)
  const monthly = groupByMonth(transactions)

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Финансовый отчёт 2026</h1>
          <p className="text-sm text-muted-foreground">PASD Finance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportPaymentsToExcel(payments)} disabled={!payments.length}>
            Excel: оплаты
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportTransactionsToExcel(transactions)} disabled={!transactions.length}>
            Excel: транзакции
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF("Транзакции 2026", transactions as unknown as Record<string, unknown>[])} disabled={!transactions.length}>
            PDF
          </Button>
        </div>
      </div>

      <DataLoader onPayments={setPayments} onTransactions={setTransactions} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="payments">Оплаты ({payments.length})</TabsTrigger>
          <TabsTrigger value="transactions">Транзакции ({transactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          {transactions.length > 0 && (
            <>
              <h2 className="font-semibold">Транзакции</h2>
              <StatsCards stats={txStats} />
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">По месяцам</CardTitle></CardHeader>
                  <CardContent><MonthlyBarChart data={monthly} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">По категориям</CardTitle></CardHeader>
                  <CardContent><CategoryPieChart data={txCategories} /></CardContent>
                </Card>
              </div>
            </>
          )}
          {payments.length > 0 && (
            <>
              <h2 className="font-semibold">Фактические оплаты</h2>
              <StatsCards stats={payStats} />
              <Card>
                <CardHeader><CardTitle className="text-base">Оплаты по категориям</CardTitle></CardHeader>
                <CardContent><CategoryPieChart data={payCategories} /></CardContent>
              </Card>
            </>
          )}
          {!transactions.length && !payments.length && (
            <p className="py-12 text-center text-muted-foreground">Загрузите данные выше, чтобы увидеть отчёт</p>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 pt-4">
          <StatsCards stats={payStats} />
          <PaymentsTable payments={payments} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 pt-4">
          <StatsCards stats={txStats} />
          <TransactionsTable transactions={transactions} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
