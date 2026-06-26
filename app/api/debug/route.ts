import { NextRequest, NextResponse } from "next/server"

// Debug: returns raw CSV rows around "итого" keyword
// GET /api/debug?sheetId=XXX&gid=YYY
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sheetId = searchParams.get("sheetId") ?? "1ax1ad1rgGPV8CSGa9t0-mSkoci_BNmdJUgvTd1bdTbM"
  const gid = searchParams.get("gid") ?? "1040983495"

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
  const res = await fetch(url)
  if (!res.ok) return NextResponse.json({ error: res.status }, { status: 502 })

  const csv = await res.text()
  const lines = csv.split("\n")

  const keyword = new URL(req.url).searchParams.get("keyword") ?? "итого"
  const rowNum = new URL(req.url).searchParams.get("row")

  let hits
  if (rowNum) {
    const idx = parseInt(rowNum) - 1
    const line = lines[idx] ?? ""
    hits = [{ row: parseInt(rowNum), cols: line.split(",").map(c => c.replace(/^"|"$/g, "").trim()) }]
  } else {
    hits = lines
      .map((line, i) => ({ row: i + 1, line }))
      .filter(({ line }) => line.toLowerCase().includes(keyword.toLowerCase()))
      .map(({ row, line }) => ({ row, cols: line.split(",").map(c => c.replace(/^"|"$/g, "").trim()) }))
  }

  return NextResponse.json({ total_rows: lines.length, итого_rows: hits })
}
