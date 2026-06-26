import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PASD Finance — Финансовый отчёт 2026",
  description: "Финансовый отчёт PASD Finance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
