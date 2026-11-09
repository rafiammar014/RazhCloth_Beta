"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Tags,
  Receipt,
  Users,
  Store,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Kasir (POS)", icon: ShoppingBag, highlight: true },
  { href: "/products", label: "Master Produk", icon: Shirt },
  { href: "/categories", label: "Kategori Pakaian", icon: Tags },
  { href: "/transactions", label: "Riwayat Transaksi", icon: Receipt },
  { href: "/customers", label: "Data Pelanggan", icon: Users },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar aside container */}
      <aside
        id="main-sidebar"
        aria-label="Navigasi Utama Toko"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-18 px-5 border-b border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block">
                RAZH CLOTH
              </span>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                Point of Sale
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu navigasi"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5" role="navigation">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
            Menu Operasional
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80",
                  item.highlight && !isActive && "border border-amber-500/30 text-amber-300 bg-amber-500/5 hover:bg-amber-500/10"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-slate-950" : item.highlight ? "text-amber-400" : "text-slate-400"
                  )}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[10px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-md">
                    Kasir
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-300">Sistem POS Online</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Toko Pakaian RAZH CLOTH v1.0
          </p>
        </div>
      </aside>
    </>
  );
}

