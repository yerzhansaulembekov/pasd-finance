import { NextRequest, NextResponse } from "next/server"

// Fetches a Google Sheet tab as CSV via the public export URL.
// Sheet must be published (File → Share → Publish to web → CSV).
//
// Usage: GET /api/sheets?sheetId=XXX&gid=0
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sheetId = searchParams.get("sheetId")
  const gid = searchParams.get("gid") ?? "0"

  if (!sheetId) {
    return NextResponse.json({ error: "sheetId required" }, { status: 400 })
  }

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`

  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error(`Google returned ${res.status}`)
    const csv = await res.text()
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    })
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 502 }
    )
  }
}
