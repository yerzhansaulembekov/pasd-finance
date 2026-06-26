import { NextRequest, NextResponse } from "next/server"
import { parsePaymentsSheet } from "@/lib/parser"

const SHEET_ID = "1ax1ad1rgGPV8CSGa9t0-mSkoci_BNmdJUgvTd1bdTbM"
const GID = "1040983495"

function splitCSV(line: string): string[] {
  const result: string[] = []
  let cur = ""
  let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === "," && !inQ) { result.push(cur.trim()); cur = "" }
    else { cur += ch }
  }
  result.push(cur.trim())
  return result
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sheetId = searchParams.get("sheetId") ?? SHEET_ID
  const gid = searchParams.get("gid") ?? GID

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&_=${Date.now()}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return NextResponse.json({ error: res.status }, { status: 502 })

  const csv = await res.text()
  const lines = csv.split("\n")

  const keyword = searchParams.get("keyword")
  const rowNum = searchParams.get("row")
  const mode = searchParams.get("mode") // "parse" to run full parser

  if (mode === "parse") {
    const parsed = parsePaymentsSheet(csv)
    return NextResponse.json({
      ipCommissionBI: parsed.ipCommissionBI,
      fotBI: parsed.fotBI,
    })
  }

  let hits
  if (rowNum) {
    const idx = parseInt(rowNum) - 1
    const line = lines[idx] ?? ""
    hits = [{ row: parseInt(rowNum), naive: line.split(",").map(c => c.replace(/^"|"$/g, "").trim()), splitcsv: splitCSV(line) }]
  } else {
    hits = lines
      .map((line, i) => ({ row: i + 1, line }))
      .filter(({ line }) => keyword ? line.toLowerCase().includes(keyword.toLowerCase()) : true)
      .slice(0, 20)
      .map(({ row, line }) => ({ row, naive: line.split(",").map(c => c.replace(/^"|"$/g, "").trim()), splitcsv: splitCSV(line) }))
  }

  return NextResponse.json({ total_rows: lines.length, hits })
}
