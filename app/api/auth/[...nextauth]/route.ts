import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import fs from "fs"
import path from "path"

const LOGS_FILE = path.join(process.cwd(), "logs", "auth.json")

function appendLog(entry: { email: string; name: string; image: string; time: string }) {
  try {
    fs.mkdirSync(path.dirname(LOGS_FILE), { recursive: true })
    const existing = fs.existsSync(LOGS_FILE)
      ? JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"))
      : []
    existing.unshift(entry) // newest first
    fs.writeFileSync(LOGS_FILE, JSON.stringify(existing.slice(0, 500), null, 2))
  } catch {}
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      appendLog({
        email: user.email ?? "",
        name: user.name ?? "",
        image: user.image ?? "",
        time: new Date().toISOString(),
      })
      return true
    },
  },
})

export { handler as GET, handler as POST }
