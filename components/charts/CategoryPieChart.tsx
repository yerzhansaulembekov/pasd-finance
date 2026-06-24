"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { CategoryStat } from "@/types"

const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#14b8a6","#f97316"]

export function CategoryPieChart({ data }: { data: CategoryStat[] }) {
  const top = data.slice(0, 8)
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie data={top} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name ?? ""} ${(((percent as number | undefined) ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
          {top.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => (Number(v)).toLocaleString("ru-KZ") + " ₸"} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
