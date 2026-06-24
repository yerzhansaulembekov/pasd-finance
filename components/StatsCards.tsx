import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SummaryStats } from "@/types"

function fmt(n: number) {
  return n.toLocaleString("ru-KZ") + " ₸"
}

export function StatsCards({ stats }: { stats: SummaryStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Доходы</CardTitle></CardHeader>
        <CardContent><p className="text-xl font-bold text-green-600">{fmt(stats.totalIncome)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Расходы</CardTitle></CardHeader>
        <CardContent><p className="text-xl font-bold text-red-600">{fmt(stats.totalExpense)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Чистый поток</CardTitle></CardHeader>
        <CardContent>
          <p className={`text-xl font-bold ${stats.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
            {fmt(stats.netCashFlow)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Транзакций</CardTitle></CardHeader>
        <CardContent><p className="text-xl font-bold">{stats.transactionCount}</p></CardContent>
      </Card>
    </div>
  )
}
