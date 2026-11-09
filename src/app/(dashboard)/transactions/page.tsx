"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Receipt, Search, Eye, RefreshCw, Printer, Calendar, User, CreditCard } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ReceiptModal, CompletedTransaction } from "@/components/pos/receipt-modal";

interface TransactionRow {
  id: string;
  invoiceNo: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  cashPaid?: number | null;
  changeAmount?: number | null;
  status: string;
  createdAt: string;
  user: { name: string };
  customer?: { name: string; phone?: string | null } | null;
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    size?: string | null;
    unitPrice: number;
    quantity: number;
    discountAmount: number;
    totalPrice: number;
  }>;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<CompletedTransaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/v1/transactions?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Gagal memuat riwayat transaksi");
      setTransactions(json.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat transaksi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Transaksi Penjualan
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Daftar seluruh nota penjualan, cetak ulang struk, dan status pembayaran
          </p>
        </div>

        {/* Search by Invoice */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. invoice..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[44px]"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={7} />
      ) : error ? (
        <ErrorBanner title="Gagal memuat transaksi" message={error} onRetry={fetchTransactions} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title="Belum Ada Transaksi"
          description="Belum ada transaksi penjualan yang tercatat dalam sistem."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Tabel Riwayat Transaksi">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3.5 px-4">No. Invoice</th>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Kasir</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4 text-center">Metode</th>
                  <th className="py-3.5 px-4 text-right">Total Belanja</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900">
                      {tx.invoiceNo}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">{tx.user?.name}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {tx.customer?.name || "Pelanggan Umum"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 tabular-nums">
                      {formatRupiah(tx.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        aria-label={`Lihat struk invoice ${tx.invoiceNo}`}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-amber-500"
                        title="Lihat / Cetak Ulang Struk"
                      >
                        <Printer className="w-4 h-4 text-amber-600 mr-1.5" />
                        <span className="text-xs font-bold">Struk</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal for Reprinting */}
      <ReceiptModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />
    </div>
  );
}

