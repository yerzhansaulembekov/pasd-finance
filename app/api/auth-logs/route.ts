import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import fs from "fs"
import path from "path"

const LOGS_FILE = path.join(process.cwd(), "logs", "auth.json")

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const data = fs.existsSync(LOGS_FILE)
      ? JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"))
      : []
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
