"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { DDSTable } from "@/components/DDSTable"
import { parsePaymentsSheet, parseExpensesSheet, buildDDS, type ParsedSheet } from "@/lib/parser"
import type { ExpenseRow, DDSSummary } from "@/types"

const SHEET_ID = "1ax1ad1rgGPV8CSGa9t0-mSkoci_BNmdJUgvTd1bdTbM"
const GID_PAYMENTS = "1040983495"
const GID_EXPENSES = "807195731"

function fmt(n: number) {
  return n.toLocaleString("ru-KZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₸"
}

async function fetchCSV(gid: string): Promise<string> {
  const res = await fetch(`/api/sheets?sheetId=${SHEET_ID}&gid=${gid}`)
  if (!res.ok) throw new Error(await res.text())
  return res.text()
}

type Section = "dds" | "analytics" | "payments" | "expenses" | "users"
type DDSView = "all" | "bi" | "sensata"

const NAV_ITEMS: { id: Section; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    id: "analytics", label: "Аналитика", sublabel: "BI и SENSATA",
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/></svg>,
  },
  {
    id: "dds", label: "ДДС", sublabel: "Движение денежных средств",
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>,
  },
  {
    id: "payments", label: "Акты", sublabel: "Фактические оплаты",
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>,
  },
  {
    id: "expenses", label: "Накладные расходы", sublabel: "Транзакции",
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>,
  },
  {
    id: "users", label: "Пользователи", sublabel: "История входов",
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>,
  },
]

// ── Analytics metric card ──────────────────────────────────────────
function MetricCard({
  label, value, sub, color = "text-slate-800", icon, negative = false,
}: {
  label: string; value: string; sub?: string; color?: string; icon: React.ReactNode; negative?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4">
      <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        negative ? "bg-rose-50 text-rose-500" :
        color.includes("emerald") ? "bg-emerald-50 text-emerald-500" :
        color.includes("indigo") ? "bg-indigo-50 text-indigo-500" :
        color.includes("amber") ? "bg-amber-50 text-amber-500" :
        color.includes("violet") ? "bg-violet-50 text-violet-500" :
        "bg-slate-100 text-slate-500"
      }`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-base font-bold tabular-nums whitespace-nowrap ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function GroupBlock({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={`flex items-center gap-2 mb-3`}>
        <div className={`w-1 h-5 rounded-full ${color}`} />
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{children}</div>
    </div>
  )
}

// Icons
const IcoWallet   = <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M1 4a2 2 0 012-2h14a2 2 0 012 2v1H1V4zm0 3h18v9a2 2 0 01-2 2H3a2 2 0 01-2-2V7zm11 3a1 1 0 100 2h2a1 1 0 100-2h-2z"/></svg>
const IcoArrowUp  = <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
const IcoPeople   = <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
const IcoTax      = <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd"/></svg>
const IcoOverhead = <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/></svg>
const IcoNet      = <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/></svg>
const IcoClock    = <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>

const IcoProfit = <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 2a8 8 0 100 16A8 8 0 0010 2zm1 11a1 1 0 11-2 0V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 9.414V13z" clipRule="evenodd"/></svg>

function AnalyticsSection({ dds }: { dds: DDSSummary }) {
  const netBI = dds.openingBalanceBI + dds.totalIncomeBI - dds.totalFotBI - dds.totalFotCore - dds.totalIpCommissionBI - dds.totalTaxBI - dds.totalOverhead
  const netSENSATA = dds.openingBalanceSENSATA + dds.totalIncomeSENSATA - dds.totalFotSENSATA - dds.totalTaxSENSATA
  const profitBI = dds.totalIncomeBI + dds.totalPendingBI - dds.totalFotBI - dds.totalFotCore - dds.totalTaxBI - dds.totalIpCommissionBI - dds.totalOverhead
  const profitSENSATA = dds.totalIncomeSENSATA + dds.totalPendingSENSATA - dds.totalFotSENSATA - dds.totalTaxSENSATA

  return (
    <div className="space-y-8">
      {/* BI */}
      <GroupBlock title="BI Group" color="bg-indigo-500">
        <MetricCard label="Остаток BI на начало 2026 года" value={fmt(dds.openingBalanceBI)} icon={IcoWallet} color="text-slate-800" />
        <MetricCard label="Приход BI" value={fmt(dds.totalIncomeBI)} icon={IcoArrowUp} color="text-emerald-600" sub={dds.totalPendingBI > 0 ? `+ ${fmt(dds.totalPendingBI)} ожидание` : undefined} />
        <MetricCard label="ФОТ BI (сотрудники)" value={fmt(dds.totalFotBI)} icon={IcoPeople} negative />
        <MetricCard label="ФОТ Core команда" value={fmt(dds.totalFotCore)} icon={IcoPeople} negative />
        <MetricCard label="Налоги BI" value={fmt(dds.totalTaxBI)} icon={IcoTax} negative />
        <MetricCard label="Накладные расходы BI" value={fmt(dds.totalOverhead)} icon={IcoOverhead} negative />
        <MetricCard label="Сумма на счетах ИП" value={fmt(dds.totalIpOstatokBI)} icon={IcoWallet} color="text-slate-800" />
        <MetricCard label="ЧДП BI" value={fmt(netBI)} icon={IcoNet} color={netBI >= 0 ? "text-indigo-600" : "text-rose-700"} />
        <MetricCard
          label="Чистая прибыль BI"
          value={fmt(profitBI)}
          icon={IcoProfit}
          color={profitBI >= 0 ? "text-emerald-700" : "text-rose-700"}
          sub="все акты − расходы"
        />
      </GroupBlock>

      <div className="border-t border-slate-200" />

      {/* SENSATA */}
      <GroupBlock title="SENSATA Group" color="bg-violet-500">
        <MetricCard label="Остаток SENSATA на начало 2026 года" value={fmt(dds.openingBalanceSENSATA)} icon={IcoWallet} color="text-slate-800" />
        <MetricCard label="Приход SENSATA" value={fmt(dds.totalIncomeSENSATA)} icon={IcoArrowUp} color="text-emerald-600" sub={dds.totalPendingSENSATA > 0 ? `+ ${fmt(dds.totalPendingSENSATA)} ожидание` : undefined} />
        <MetricCard label="ФОТ SENSATA" value={fmt(dds.totalFotSENSATA)} icon={IcoPeople} negative />
        <MetricCard label="Налоги SENSATA" value={fmt(dds.totalTaxSENSATA)} icon={IcoTax} negative />
        <MetricCard label="ЧДП SENSATA" value={fmt(netSENSATA)} icon={IcoNet} color={netSENSATA >= 0 ? "text-indigo-600" : "text-rose-700"} />
        <MetricCard
          label="Чистая прибыль SENSATA"
          value={fmt(profitSENSATA)}
          icon={IcoProfit}
          color={profitSENSATA >= 0 ? "text-emerald-700" : "text-rose-700"}
          sub="все акты − расходы"
        />
      </GroupBlock>
    </div>
  )
}

export default function Home() {
  const { data: session } = useSession()
  const [section, setSection] = useState<Section>("analytics")
  const [ddsView, setDdsView] = useState<DDSView>("all")
  const [parsed, setParsed] = useState<ParsedSheet | null>(null)
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [dds, setDDS] = useState<DDSSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [payCSV, expCSV] = await Promise.all([fetchCSV(GID_PAYMENTS), fetchCSV(GID_EXPENSES)])
      const p = parsePaymentsSheet(payCSV)
      const exp = parseExpensesSheet(expCSV)
      setParsed(p)
      setExpenses(exp)
      setDDS(buildDDS(p, exp))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, type: "payments" | "expenses") {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const csv = ev.target?.result as string
      if (type === "payments") {
        const p = parsePaymentsSheet(csv)
        setParsed(p)
        setDDS(buildDDS(p, expenses))
      } else {
        const exp = parseExpensesSheet(csv)
        setExpenses(exp)
        if (parsed) setDDS(buildDDS(parsed, exp))
      }
    }
    reader.readAsText(file, "utf-8")
  }

  const counts: Record<Section, number | null> = {
    dds: null, analytics: null,
    payments: parsed?.payments.length ?? null,
    expenses: expenses.length || null,
    users: null,
  }

  const activeNav = NAV_ITEMS.find(i => i.id === section)!

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-[#0f172a] flex flex-col fixed top-0 left-0 h-full z-10">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="10" fill="url(#logoGrad)"/>
              <rect x="7" y="22" width="4" height="7" rx="1.5" fill="white" fillOpacity="0.5"/>
              <rect x="13" y="16" width="4" height="13" rx="1.5" fill="white" fillOpacity="0.75"/>
              <rect x="19" y="11" width="4" height="18" rx="1.5" fill="white"/>
              <path d="M7 20 L15 14 L21 9 L28 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6"/>
              <path d="M25 5 L29 6 L28 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6"/>
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#4338ca"/>
                </linearGradient>
              </defs>
            </svg>
            <div>
              <p className="text-white font-bold text-sm leading-tight">PASD Finance</p>
              <p className="text-slate-400 text-xs">2026</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-3 mb-3">Разделы</p>
          {NAV_ITEMS.map(item => {
            const active = section === item.id
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full text-left rounded-xl px-3 py-2.5 transition-all group flex items-center gap-3 ${
                  active ? "bg-indigo-600 shadow-lg shadow-indigo-900/30" : "hover:bg-white/5"
                }`}
              >
                <span className={`shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}>
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium leading-tight flex items-center gap-1.5 ${active ? "text-white" : "text-slate-300"}`}>
                    <span className="truncate">{item.label}</span>
                    {counts[item.id] != null && (
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${active ? "bg-white/20 text-white" : "bg-white/10 text-slate-400"}`}>
                        {counts[item.id]}
                      </span>
                    )}
                  </p>
                  <p className={`text-[11px] mt-0.5 truncate ${active ? "text-indigo-200" : "text-slate-500"}`}>
                    {item.sublabel}
                  </p>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 space-y-2 border-t border-white/10 pt-4">
          <button
            onClick={load}
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 px-3 transition-colors flex items-center justify-center gap-2"
          >
            <span className={loading ? "animate-spin inline-block" : "inline-block"}>↻</span>
            {loading ? "Загрузка…" : "Обновить данные"}
          </button>
          <div className="flex gap-1.5">
            <label className="flex-1 cursor-pointer">
              <span className="block rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 text-[11px] text-center py-1.5 transition-colors">
                CSV оплаты
              </span>
              <input type="file" accept=".csv" className="hidden" onChange={e => handleFile(e, "payments")} />
            </label>
            <label className="flex-1 cursor-pointer">
              <span className="block rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 text-[11px] text-center py-1.5 transition-colors">
                CSV расходы
              </span>
              <input type="file" accept=".csv" className="hidden" onChange={e => handleFile(e, "expenses")} />
            </label>
          </div>

          {/* User info + sign out */}
          {session?.user && (
            <div className="flex items-center gap-2 pt-1">
              {session.user.image && (
                <img src={session.user.image} className="w-7 h-7 rounded-full shrink-0" alt="" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-white text-[11px] font-medium truncate">{session.user.name}</p>
                <p className="text-slate-500 text-[10px] truncate">{session.user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                title="Выйти"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h6a1 1 0 100-2H4V5h5a1 1 0 100-2H3zm10.293 3.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L14.586 11H8a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="ml-60 flex-1 min-h-screen bg-[#f4f6f9]">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">{activeNav.icon}</span>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">{activeNav.label}</h1>
              <p className="text-xs text-slate-400">{activeNav.sublabel}</p>
            </div>
          </div>
          {dds && (
            <p className="text-xs text-slate-400">
              Обновлено: <span className="font-medium text-slate-600">{new Date().toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </p>
          )}
        </div>

        <div className="px-8 py-6 space-y-6">
          {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</p>}

          {/* ── ДДС ──────────────────────────────────────────── */}
          {section === "dds" && (
            dds ? (
              <div>
                <div className="flex gap-1 mb-4">
                  {([["all","ДДС общий"],["bi","ДДС BI Group"],["sensata","ДДС Sensata Group"]] as [DDSView,string][]).map(([v,label]) => (
                    <button key={v} onClick={() => setDdsView(v)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${ddsView === v ? "bg-indigo-600 text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <DDSTable dds={dds} view={ddsView} />
              </div>
            ) : <EmptyState />
          )}

          {/* ── Аналитика ────────────────────────────────────── */}
          {section === "analytics" && (
            dds ? <AnalyticsSection dds={dds} /> : <EmptyState />
          )}

          {/* ── Акты ─────────────────────────────────────────── */}
          {section === "payments" && (
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">№</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Акт</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Раздел</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Сумма</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ожидание</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(parsed?.payments ?? []).map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{p.num}</td>
                      <td className="px-4 py-3 max-w-sm truncate text-slate-700">{p.act}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${p.section === "BI" ? "bg-indigo-50 text-indigo-700" : "bg-violet-50 text-violet-700"}`}>
                          {p.section}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700 tabular-nums whitespace-nowrap">{p.amount.toLocaleString("ru-KZ")}</td>
                      <td className="px-4 py-3 text-right text-amber-600 tabular-nums whitespace-nowrap">{p.pending > 0 ? p.pending.toLocaleString("ru-KZ") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!parsed && <div className="py-16 text-center text-slate-400">Загрузите данные</div>}
            </div>
          )}

          {/* ── Пользователи ─────────────────────────────────── */}
          {section === "users" && <UsersSection />}

          {/* ── Накладные расходы ────────────────────────────── */}
          {section === "expenses" && (
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Сумма</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Цель</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Статья</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((e, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">{e.date}</td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-600 tabular-nums whitespace-nowrap">{e.amount.toLocaleString("ru-KZ")}</td>
                      <td className="px-4 py-3 text-slate-700">{e.description}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{e.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expenses.length === 0 && <div className="py-16 text-center text-slate-400">Загрузите данные</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

type AuthLog = { email: string; name: string; image: string; time: string }

function UsersSection() {
  const [logs, setLogs] = useState<AuthLog[]>([])
  const [loading, setLoading] = useState(true)

  useState(() => {
    fetch("/api/auth-logs").then(r => r.json()).then(d => { setLogs(d); setLoading(false) }).catch(() => setLoading(false))
  })

  if (loading) return <div className="text-slate-400 text-sm py-10 text-center">Загрузка…</div>

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Пользователь</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата входа</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((log, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 flex items-center gap-3">
                {log.image
                  ? <img src={log.image} className="w-7 h-7 rounded-full" alt="" />
                  : <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">{log.name?.[0]}</div>
                }
                <span className="text-slate-700 font-medium">{log.name}</span>
              </td>
              <td className="px-4 py-3 text-slate-500">{log.email}</td>
              <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                {new Date(log.time).toLocaleString("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && <div className="py-16 text-center text-slate-400">Нет данных о входах</div>}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-24 text-center">
      <p className="text-3xl mb-3">📊</p>
      <p className="text-slate-600 font-medium">Нажмите «Обновить данные»</p>
      <p className="text-slate-400 text-sm mt-1">или загрузите CSV через боковое меню</p>
    </div>
  )
}
