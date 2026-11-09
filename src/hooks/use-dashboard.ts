"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecentTransactionItem {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  user: { name: string };
  customer?: { name: string } | null;
  _count: { items: number };
}

export interface LowStockProductItem {
  id: string;
  sku: string;
  name: string;
  size?: string | null;
  stock: number;
  sellPrice: number;
}

export interface DashboardSummary {
  todaySales: number;
  todayTransactionsCount: number;
  lowStockCount: number;
  totalProductsCount: number;
  categoriesCount: number;
  lowStockProducts: LowStockProductItem[];
  recentTransactions: RecentTransactionItem[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/reports/summary");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal memuat ringkasan dashboard");
      }

      setData(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    data,
    loading,
    error,
    refetch: fetchSummary,
  };
}

