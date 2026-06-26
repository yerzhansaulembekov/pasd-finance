"use client"

import type { DDSSummary, DDSMonth } from "@/types"

function fmt(n: number) {
  if (n === 0) return "—"
  return n.toLocaleString("ru-KZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtColored(n: number, positive = true): { text: string; cls: string } {
  if (n === 0) return { text: "—", cls: "text-slate-300" }
  const isGood = positive ? n > 0 : n < 0
  return {
    text: n.toLocaleString("ru-KZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    cls: isGood ? "text-emerald-700" : "text-rose-600",
  }
}

type Variant = "section" | "sub" | "income" | "expense" | "net" | "balance" | string

function SectionHeader({ label, cols }: { label: string; cols: number }) {
  return (
    <tr>
      <td colSpan={cols + 2} className="py-2.5 pl-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 bg-slate-50 border-t border-b border-slate-200">
        {label}
      </td>
    </tr>
  )
}

function Row({
  label, values, total, variant = "sub", positiveIsGood = true,
}: {
  label: string; values: number[]; total: number; variant?: Variant; positiveIsGood?: boolean
}) {
  const isSection = variant === "section"
  const isNet = variant === "net"
  const isSummary = variant === "income" || variant === "expense" || variant === "net" || variant === "balance"

  const rowCls =
    variant === "income"  ? "bg-emerald-50/60 hover:bg-emerald-50" :
    variant === "expense" ? "bg-rose-50/60 hover:bg-rose-50" :
    variant === "net"     ? "bg-indigo-50/60 hover:bg-indigo-50" :
    variant === "balance" ? "bg-slate-100 hover:bg-slate-100" :
    "hover:bg-slate-50/80"

  const labelCls =
    variant === "income"  ? "text-emerald-800 font-semibold" :
    variant === "expense" ? "text-rose-800 font-semibold" :
    variant === "net"     ? "text-indigo-800 font-semibold" :
    variant === "balance" ? "text-slate-700 font-semibold" :
    "text-slate-600 font-normal"

  const indent = isSummary ? "pl-4" : "pl-8"
  const stickyLabelCls = "sticky left-0 z-[1]"

  const { text: totalText, cls: totalCls } = fmtColored(total, positiveIsGood)

  return (
    <tr className={`border-b border-slate-100 transition-colors ${rowCls}`}>
      <td className={`py-2.5 pr-4 text-sm whitespace-nowrap ${indent} ${labelCls} ${stickyLabelCls} ${rowCls}`}>{label}</td>
      {values.map((v, i) => {
        const { text, cls } = fmtColored(v, positiveIsGood)
        return (
          <td key={i} className={`py-2.5 px-3 text-right text-sm tabular-nums ${isSummary ? "font-semibold" : "font-normal"} ${cls}`}>
            {text}
          </td>
        )
      })}
      <td className={`py-2.5 px-3 text-right text-sm tabular-nums font-bold ${isSummary || variant === "balance" ? totalCls : "text-slate-500"}`}>
        {totalText}
      </td>
    </tr>
  )
}

export function DDSTable({ dds, view = "all" }: { dds: DDSSummary; view?: "all" | "bi" | "sensata" }) {
  const { months } = dds
  const mv = (fn: (m: DDSMonth) => number) => months.map(fn)
  const tot = (fn: (m: DDSMonth) => number) => months.reduce((s, m) => s + fn(m), 0)
  const cols = months.length

  const totalIncomeByMonth = mv(m => m.incomeBI + m.incomeSENSATA)
  const totalIncomeWithPending = mv(m => m.incomeBI + m.incomeSENSATA + m.pendingBI + m.pendingSENSATA)
  const totalExpenseByMonth = mv(m => m.fotBI + m.fotCore + m.fotSENSATA + m.taxBI + m.taxSENSATA + m.ipCommissionBI + m.overhead)
  const netByMonth = totalIncomeByMonth.map((v, i) => v - totalExpenseByMonth[i])
  const netWithPending = totalIncomeWithPending.map((v, i) => v - totalExpenseByMonth[i])

  // ЧДП по BI и SENSATA (по месяцам — без остатка, остаток только в ИТОГО)
  const expenseBIByMonth   = mv(m => m.fotBI + m.fotCore + m.taxBI + m.ipCommissionBI + m.overhead)
  const expenseSENSATAByMonth = mv(m => m.fotSENSATA + m.taxSENSATA)
  const netBIByMonth       = expenseBIByMonth.map((v, i) => (months[i]?.incomeBI ?? 0) - v)
  const netSENSATAByMonth  = expenseSENSATAByMonth.map((v, i) => (months[i]?.incomeSENSATA ?? 0) - v)
  const netBIWithPending   = expenseBIByMonth.map((v, i) => (months[i]?.incomeBI ?? 0) + (months[i]?.pendingBI ?? 0) - v)
  const netSENSATAWithPending = expenseSENSATAByMonth.map((v, i) => (months[i]?.incomeSENSATA ?? 0) + (months[i]?.pendingSENSATA ?? 0) - v)

  const totalNetBI       = dds.openingBalanceBI + dds.totalIncomeBI - dds.totalFotBI - dds.totalFotCore - dds.totalTaxBI - dds.totalIpCommissionBI - dds.totalOverhead
  const totalNetSENSATA  = dds.openingBalanceSENSATA + dds.totalIncomeSENSATA - dds.totalFotSENSATA - dds.totalTaxSENSATA
  const totalNetBIWithP  = totalNetBI + dds.totalPendingBI
  const totalNetSATAWithP = totalNetSENSATA + dds.totalPendingSENSATA

  const totalIncome = dds.totalIncomeBI + dds.totalIncomeSENSATA
  const totalExpense = dds.totalFotBI + dds.totalFotCore + dds.totalFotSENSATA + dds.totalTaxBI + dds.totalTaxSENSATA + dds.totalIpCommissionBI + dds.totalOverhead
  const totalOpening = dds.openingBalanceBI + dds.openingBalanceSENSATA
  const net = totalOpening + totalIncome - totalExpense
  const closingBalance = net

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-x-auto w-full">
      <table className="border-collapse text-sm" style={{ minWidth: "700px" }}>
        <thead>
          <tr className="bg-[#0f172a] text-white">
            <th className="py-3.5 pl-4 pr-4 text-left font-semibold text-sm w-[220px] sticky left-0 z-10 bg-[#0f172a]">Статья</th>
            {months.map(m => (
              <th key={m.month} className="py-3.5 px-3 text-right font-semibold text-sm whitespace-nowrap min-w-[110px]">
                {m.label}
              </th>
            ))}
            <th className="py-3.5 px-3 text-right font-semibold text-sm min-w-[120px] bg-[#1e293b]">ИТОГО</th>
          </tr>
        </thead>
        <tbody>
          {/* ОСТАТКИ */}
          <SectionHeader label="◉  Остатки на начало года" cols={cols} />
          {view !== "sensata" && <Row label="Остаток BI"     values={months.map(() => 0)} total={dds.openingBalanceBI}     variant="sub" />}
          {view !== "bi"      && <Row label="Остаток SENSATA" values={months.map(() => 0)} total={dds.openingBalanceSENSATA} variant="sub" />}
          <Row label="ИТОГО остаток" values={months.map(() => 0)}
            total={view === "bi" ? dds.openingBalanceBI : view === "sensata" ? dds.openingBalanceSENSATA : totalOpening}
            variant="balance" />

          {/* ПРИХОД */}
          <SectionHeader label="▲  Приход" cols={cols} />
          {view !== "sensata" && <Row label="Приход BI (фактические)" values={mv(m => m.incomeBI)} total={dds.totalIncomeBI} variant="sub" />}
          {view !== "sensata" && <Row label="Ожидание BI"             values={mv(m => m.pendingBI)} total={dds.totalPendingBI} variant="sub" />}
          {view !== "bi"      && <Row label="Приход SENSATA Group (фактические)" values={mv(m => m.incomeSENSATA)} total={dds.totalIncomeSENSATA} variant="sub" />}
          {view !== "bi"      && <Row label="Ожидание SENSATA" values={mv(m => m.pendingSENSATA)} total={dds.totalPendingSENSATA} variant="sub" />}
          {view === "bi"      && <Row label="ИТОГО ПРИХОД (факт)"        values={mv(m => m.incomeBI)}                         total={dds.totalIncomeBI}                              variant="income" />}
          {view === "bi"      && <Row label="ИТОГО ПРИХОД (с ожиданием)" values={mv(m => m.incomeBI + m.pendingBI)}           total={dds.totalIncomeBI + dds.totalPendingBI}         variant="income" />}
          {view === "sensata" && <Row label="ИТОГО ПРИХОД (факт)"        values={mv(m => m.incomeSENSATA)}                   total={dds.totalIncomeSENSATA}                         variant="income" />}
          {view === "sensata" && <Row label="ИТОГО ПРИХОД (с ожиданием)" values={mv(m => m.incomeSENSATA + m.pendingSENSATA)} total={dds.totalIncomeSENSATA + dds.totalPendingSENSATA} variant="income" />}
          {view === "all"     && <Row label="ИТОГО ПРИХОД (факт)"        values={totalIncomeByMonth}      total={totalIncome}                                                      variant="income" />}
          {view === "all"     && <Row label="ИТОГО ПРИХОД (с ожиданием)" values={totalIncomeWithPending}  total={totalIncome + dds.totalPendingBI + dds.totalPendingSENSATA}      variant="income" />}

          {/* РАСХОД */}
          <SectionHeader label="▼  Расход" cols={cols} />
          {view !== "sensata" && <Row label="ФОТ BI (сотрудники)"       values={mv(m => m.fotBI)}          total={dds.totalFotBI}          variant="sub" positiveIsGood={false} />}
          {view !== "sensata" && <Row label="ФОТ Core команда"          values={mv(m => m.fotCore)}         total={dds.totalFotCore}        variant="sub" positiveIsGood={false} />}
          {view !== "sensata" && <Row label="Комиссия ИП 6%"             values={mv(m => m.ipCommissionBI)} total={dds.totalIpCommissionBI} variant="sub" positiveIsGood={false} />}
          {view !== "bi"      && <Row label="ФОТ SENSATA Group"          values={mv(m => m.fotSENSATA)}     total={dds.totalFotSENSATA}     variant="sub" positiveIsGood={false} />}
          {view !== "sensata" && <Row label="Налоги BI"                  values={mv(m => m.taxBI)}          total={dds.totalTaxBI}          variant="sub" positiveIsGood={false} />}
          {view !== "bi"      && <Row label="Налоги SENSATA"             values={mv(m => m.taxSENSATA)}     total={dds.totalTaxSENSATA}     variant="sub" positiveIsGood={false} />}
          {view !== "sensata" && <Row label="Накладные расходы (BI)"     values={mv(m => m.overhead)}       total={dds.totalOverhead}       variant="sub" positiveIsGood={false} />}
          {view === "bi"      && <Row label="ИТОГО РАСХОД" values={mv(m => m.fotBI + m.fotCore + m.taxBI + m.ipCommissionBI + m.overhead)} total={dds.totalFotBI + dds.totalFotCore + dds.totalTaxBI + dds.totalIpCommissionBI + dds.totalOverhead} variant="expense" positiveIsGood={false} />}
          {view === "sensata" && <Row label="ИТОГО РАСХОД" values={mv(m => m.fotSENSATA + m.taxSENSATA)}                       total={dds.totalFotSENSATA + dds.totalTaxSENSATA}                                      variant="expense" positiveIsGood={false} />}
          {view === "all"     && <Row label="ИТОГО РАСХОД" values={totalExpenseByMonth} total={totalExpense} variant="expense" positiveIsGood={false} />}

          {/* ЧДП */}
          <SectionHeader label="◆  Чистый денежный поток" cols={cols} />
          {view === "all" && <>
            <Row label="ЧДП (факт)"              values={netByMonth}        total={net}                                                variant="net" />
            <Row label="  ЧДП BI (факт)"         values={netBIByMonth}      total={totalNetBI}                                         variant="sub" />
            <Row label="  ЧДП SENSATA (факт)"    values={netSENSATAByMonth} total={totalNetSENSATA}                                    variant="sub" />
            <Row label="ЧДП (с ожиданием)"       values={netWithPending}    total={net + dds.totalPendingBI + dds.totalPendingSENSATA} variant="net" />
            <Row label="  ЧДП BI (с ожиданием)"      values={netBIWithPending}      total={totalNetBIWithP}   variant="sub" />
            <Row label="  ЧДП SENSATA (с ожиданием)" values={netSENSATAWithPending} total={totalNetSATAWithP} variant="sub" />
          </>}
          {view === "bi" && <>
            <Row label="ЧДП BI (факт)"         values={netBIByMonth}      total={totalNetBI}      variant="net" />
            <Row label="ЧДП BI (с ожиданием)"  values={netBIWithPending}  total={totalNetBIWithP} variant="net" />
          </>}
          {view === "sensata" && <>
            <Row label="ЧДП SENSATA (факт)"        values={netSENSATAByMonth}      total={totalNetSENSATA}   variant="net" />
            <Row label="ЧДП SENSATA (с ожиданием)" values={netSENSATAWithPending}  total={totalNetSATAWithP} variant="net" />
          </>}
          <Row label="Остаток на конец периода" values={months.map(() => 0)}
            total={view === "bi" ? totalNetBIWithP : view === "sensata" ? totalNetSATAWithP : closingBalance}
            variant="balance" />

          {/* ЧИСТАЯ ПРИБЫЛЬ */}
          <SectionHeader label="★  Чистая прибыль (начисление)" cols={cols} />
          {view !== "sensata" && (() => {
            const profitBIByMonth = mv(m => m.incomeBI + m.pendingBI - m.fotBI - m.fotCore - m.taxBI - m.ipCommissionBI - m.overhead)
            const totalProfitBI = dds.totalIncomeBI + dds.totalPendingBI - dds.totalFotBI - dds.totalFotCore - dds.totalTaxBI - dds.totalIpCommissionBI - dds.totalOverhead
            const profitBINoCore = mv(m => m.incomeBI + m.pendingBI - m.fotBI - m.taxBI - m.ipCommissionBI - m.overhead)
            const totalProfitBINoCore = dds.totalIncomeBI + dds.totalPendingBI - dds.totalFotBI - dds.totalTaxBI - dds.totalIpCommissionBI - dds.totalOverhead
            return <>
              <Row label="Чистая прибыль BI" values={profitBIByMonth} total={totalProfitBI} variant="net" />
              <Row label="  Чистая прибыль BI (без Core)" values={profitBINoCore} total={totalProfitBINoCore} variant="sub" />
            </>
          })()}
          {view !== "bi" && (() => {
            const profitSENSATAByMonth = mv(m => m.incomeSENSATA + m.pendingSENSATA - m.fotSENSATA - m.taxSENSATA)
            const totalProfitSENSATA = dds.totalIncomeSENSATA + dds.totalPendingSENSATA - dds.totalFotSENSATA - dds.totalTaxSENSATA
            return <Row label="Чистая прибыль SENSATA" values={profitSENSATAByMonth} total={totalProfitSENSATA} variant="net" />
          })()}
          {view === "all" && (() => {
            const profitAllByMonth = mv(m =>
              m.incomeBI + m.pendingBI + m.incomeSENSATA + m.pendingSENSATA
              - m.fotBI - m.fotCore - m.fotSENSATA - m.taxBI - m.taxSENSATA - m.ipCommissionBI - m.overhead
            )
            const totalProfitAll =
              dds.totalIncomeBI + dds.totalPendingBI + dds.totalIncomeSENSATA + dds.totalPendingSENSATA
              - dds.totalFotBI - dds.totalFotCore - dds.totalFotSENSATA - dds.totalTaxBI - dds.totalTaxSENSATA - dds.totalIpCommissionBI - dds.totalOverhead
            return <Row label="ИТОГО Чистая прибыль" values={profitAllByMonth} total={totalProfitAll} variant="net" />
          })()}
        </tbody>
      </table>
    </div>
  )
}
