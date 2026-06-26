"use client"

import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        {/* Logo */}
        <svg width="48" height="48" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="10" fill="url(#lg)"/>
          <rect x="7" y="22" width="4" height="7" rx="1.5" fill="white" fillOpacity="0.5"/>
          <rect x="13" y="16" width="4" height="13" rx="1.5" fill="white" fillOpacity="0.75"/>
          <rect x="19" y="11" width="4" height="18" rx="1.5" fill="white"/>
          <path d="M7 20 L15 14 L21 9 L28 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6"/>
          <path d="M25 5 L29 6 L28 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6"/>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#4338ca"/>
            </linearGradient>
          </defs>
        </svg>

        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">PASD Finance</h1>
          <p className="text-sm text-slate-500 mt-1">Финансовый отчёт 2026</p>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Войти через Google
        </button>

        <p className="text-xs text-slate-400 text-center">
          Доступ только для авторизованных пользователей
        </p>
      </div>
    </div>
  )
}
