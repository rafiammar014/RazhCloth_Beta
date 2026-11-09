"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, ShieldCheck, UserCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onMenuToggle?: () => void;
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
}

export function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("razh_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/v1/auth/logout", { method: "POST" });
      localStorage.removeItem("razh_token");
      localStorage.removeItem("razh_user");
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 h-18 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between"
    >
      {/* Left: Mobile hamburger button & Breadcrumb/Page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Buka menu navigasi utama"
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            RAZH CLOTH — Toko Pakaian
          </span>
          <span className="text-sm font-bold text-slate-900 block">
            Sistem Kasir & Inventaris
          </span>
        </div>
      </div>

      {/* Right: Quick POS button, Active cashier/user info, and Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick shortcut to POS screen */}
        <Link
          href="/pos"
          className="min-h-[44px] px-3.5 sm:px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition shadow-sm shadow-amber-500/20 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden xs:inline">Buka Kasir</span>
        </Link>

        {/* User / Cashier badge */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
            {currentUser?.role === "ADMIN" ? (
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            ) : (
              <UserCheck className="w-5 h-5 text-slate-700" />
            )}
          </div>
          <div className="hidden md:block text-left">
            <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">
              {currentUser?.name || "Petugas Toko"}
            </span>
            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block">
              {currentUser?.role === "ADMIN" ? "Owner / Admin" : "Kasir Aktif"}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Keluar dari akun sistem kasir"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition focus-visible:ring-2 focus-visible:ring-rose-500"
          title="Keluar (Logout)"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

