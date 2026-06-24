"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { MonthlyStat } from "@/types"

export function MonthlyBarChart({ data }: { data: MonthlyStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(v) => (v / 1_000_000).toFixed(1) + "M"} />
        <Tooltip formatter={(v) => (Number(v)).toLocaleString("ru-KZ") + " ₸"} />
        <Legend />
        <Bar dataKey="income" name="Доходы" fill="#10b981" />
        <Bar dataKey="expense" name="Расходы" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  )
}
