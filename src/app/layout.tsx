import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAZH CLOTH — Sistem Kasir & POS",
  description: "Sistem Kasir dan Manajemen Inventaris Toko Pakaian RAZH CLOTH",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
