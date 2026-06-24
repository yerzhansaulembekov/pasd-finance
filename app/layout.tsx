import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PASD Finance — Финансовый отчёт 2026",
  description: "Финансовый отчёт PASD Finance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
