"use client";

import React, { useRef } from "react";
import { Printer, Check, ShoppingBag, ArrowLeft } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CompletedTransaction {
  id: string;
  invoiceNo: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  cashPaid?: number | null;
  changeAmount?: number | null;
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

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: CompletedTransaction | null;
}

export function ReceiptModal({
  isOpen,
  onClose,
  transaction,
}: ReceiptModalProps) {
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6">
        {/* Actions Bar (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <span id="receipt-title" className="text-sm font-bold">
              Transaksi Berhasil!
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup struk belanja"
            className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg"
          >
            Tutup
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div
          ref={receiptPrintRef}
          className="p-6 font-mono text-xs text-slate-900 space-y-4 bg-white"
        >
          {/* Receipt Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <h1 className="text-lg font-black tracking-tight text-slate-950">
              RAZH CLOTH
            </h1>
            <p className="text-[10px] text-slate-600">
              Toko Pakaian & Distro Apparel
            </p>
            <p className="text-[10px] text-slate-500">
              Jl. Raya RAZH CLOTH Store
            </p>
          </div>

          {/* Meta Info */}
          <div className="space-y-1 text-[11px] text-slate-700 pb-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span>No. Invoice:</span>
              <span className="font-bold">{transaction.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{formatDate(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{transaction.user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span>{transaction.customer?.name || "Pelanggan Umum"}</span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="space-y-2.5 py-1 border-b border-dashed border-slate-300">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-bold text-slate-950 flex justify-between">
                  <span>{item.productName}</span>
                  <span className="tabular-nums">
                    {formatRupiah(item.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>
                    {item.quantity}x @{formatRupiah(item.unitPrice)}{" "}
                    {item.size ? `[${item.size}]` : ""}
                  </span>
                  {item.discountAmount > 0 && (
                    <span className="text-emerald-700">
                      Diskon -{formatRupiah(item.discountAmount)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Payment & Totals */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="tabular-nums">
                {formatRupiah(transaction.subtotal)}
              </span>
            </div>
            {transaction.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Diskon Transaksi:</span>
                <span className="tabular-nums">
                  -{formatRupiah(transaction.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-300">
              <span>TOTAL:</span>
              <span className="tabular-nums">
                {formatRupiah(transaction.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Metode Bayar:</span>
              <span className="font-bold">{transaction.paymentMethod}</span>
            </div>
            {transaction.cashPaid !== null && transaction.cashPaid !== undefined && (
              <>
                <div className="flex justify-between">
                  <span>Tunai Diterima:</span>
                  <span className="tabular-nums">
                    {formatRupiah(transaction.cashPaid)}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembalian:</span>
                  <span className="tabular-nums">
                    {formatRupiah(transaction.changeAmount || 0)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Receipt Footer */}
          <div className="text-center text-[10px] text-slate-500 pt-3 border-t border-dashed border-slate-300 space-y-1">
            <p className="font-semibold text-slate-700">
              Terima Kasih Telah Berbelanja!
            </p>
            <p>Barang yang sudah dibeli dapat ditukar jika cacat produksi.</p>
          </div>
        </div>

        {/* Modal Actions (Hidden on print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 print:hidden">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Transaksi Baru
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            variant="primary"
            size="sm"
            className="flex-1"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Struk
          </Button>
        </div>
      </div>
    </div>
  );
}

