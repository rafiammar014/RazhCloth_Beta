"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  Shirt,
  ShoppingBag,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner title="Gagal memuat dashboard" message={error} onRetry={refetch} />;
  }

  const summary = data || {
    todaySales: 0,
    todayTransactionsCount: 0,
    lowStockCount: 0,
    totalProductsCount: 0,
    categoriesCount: 0,
    lowStockProducts: [],
    recentTransactions: [],
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Penjualan RAZH CLOTH
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Ringkasan performa toko, status kasir, dan peringatan inventaris pakaian
          </p>
        </div>

        <Link
          href="/pos"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition min-h-[44px]"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Buka Kasir (POS)</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today Sales */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Omset Hari Ini
            </span>
            <span className="text-2xl font-black text-slate-900 tabular-nums block mt-1.5">
              {formatRupiah(summary.todaySales)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Shift aktif saat ini</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Today Transactions */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Total Transaksi
            </span>
            <span className="text-2xl font-black text-slate-900 tabular-nums block mt-1.5">
              {summary.todayTransactionsCount} Transaksi
            </span>
            <span className="text-xs font-semibold text-slate-500 block mt-2">
              Penjualan kasir tercatat
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Low Stock Warning */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Stok Menipis
            </span>
            <span className="text-2xl font-black text-rose-600 tabular-nums block mt-1.5">
              {summary.lowStockCount} Artikel
            </span>
            <span className="text-xs font-semibold text-rose-500 block mt-2">
              Stok tersisa &le; 5 pcs
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Products */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Total Produk Aktif
            </span>
            <span className="text-2xl font-black text-slate-900 tabular-nums block mt-1.5">
              {summary.totalProductsCount} SKU
            </span>
            <span className="text-xs font-semibold text-slate-500 block mt-2">
              Dalam {summary.categoriesCount} kategori
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Shirt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Low Stock Attention List */}
      {summary.lowStockProducts.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Perlu Restock: Produk dengan Stok Kritis (&le; 5 pcs)</span>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-amber-700 hover:text-amber-900 underline"
            >
              Lihat di Master Produk &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {summary.lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[180px]">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {p.sku} &bull; Size: {p.size || "ALL"}
                  </span>
                </div>
                <Badge variant={p.stock === 0 ? "danger" : "warning"}>
                  {p.stock === 0 ? "Habis (0)" : `Sisa ${p.stock}`}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">
              Transaksi Kasir Terbaru
            </h2>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-bold text-amber-600 hover:text-amber-700"
          >
            Lihat Semua Transaksi &rarr;
          </Link>
        </div>

        {summary.recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Belum ada transaksi yang tercatat hari ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Tabel Transaksi Terbaru">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">No. Invoice</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4 text-center">Item</th>
                  <th className="py-3 px-4 text-right">Total Bayar</th>
                  <th className="py-3 px-4">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {summary.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                      {tx.invoiceNo}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{tx.user?.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {tx.customer?.name || "Pelanggan Umum"}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">
                      {tx._count?.items || 1} pcs
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                      {formatRupiah(tx.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

