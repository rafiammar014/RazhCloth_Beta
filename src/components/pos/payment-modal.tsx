"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { formatRupiah, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  onConfirmPayment: (data: {
    paymentMethod: "CASH" | "TRANSFER" | "DEBIT" | "QRIS";
    cashPaid?: number;
    notes?: string;
  }) => Promise<boolean>;
}

export function PaymentModal({
  isOpen,
  onClose,
  grandTotal,
  onConfirmPayment,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "TRANSFER" | "DEBIT" | "QRIS"
  >("CASH");
  const [cashPaidInput, setCashPaidInput] = useState<number>(grandTotal);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputCashRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod("CASH");
      setCashPaidInput(grandTotal);
      setNotes("");
      setErrorMsg(null);
      setTimeout(() => inputCashRef.current?.focus(), 50);
    }
  }, [isOpen, grandTotal]);

  // Handle Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const changeAmount = Math.max(0, cashPaidInput - grandTotal);
  const isCashInsufficient =
    paymentMethod === "CASH" && cashPaidInput < grandTotal;

  const quickCashOptions = [
    { label: "Uang Pas", value: grandTotal },
    { label: "50 Ribu", value: 50000 },
    { label: "100 Ribu", value: 100000 },
    { label: "150 Ribu", value: 150000 },
    { label: "200 Ribu", value: 200000 },
    { label: "500 Ribu", value: 500000 },
  ].filter((opt) => opt.value >= grandTotal || opt.label === "Uang Pas");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCashInsufficient) {
      setErrorMsg("Nominal uang yang diterima kurang dari total belanja");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const ok = await onConfirmPayment({
        paymentMethod,
        cashPaid: paymentMethod === "CASH" ? cashPaidInput : grandTotal,
        notes: notes.trim() || undefined,
      });

      if (ok) {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses transaksi";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 id="payment-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
              Penyelesaian Pembayaran
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih metode transaksi dan hitung uang kembalian kasir
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Batalkan pembayaran"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Grand Total Display */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Tagihan Kasir:
            </span>
            <span className="text-2xl font-black tabular-nums text-amber-400">
              {formatRupiah(grandTotal)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "CASH", label: "Tunai", icon: Banknote },
                { id: "QRIS", label: "QRIS", icon: QrCode },
                { id: "TRANSFER", label: "Transfer", icon: Building },
                { id: "DEBIT", label: "Debit Card", icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    aria-pressed={isSelected}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition min-h-[64px]",
                      "focus-visible:ring-2 focus-visible:ring-amber-500",
                      isSelected
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CASH: Quick options & Cash received input */}
          {paymentMethod === "CASH" ? (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Pilihan Cepat Uang Diterima
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickCashOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCashPaidInput(opt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-bold transition min-h-[40px]",
                        cashPaidInput === opt.value
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      )}
                    >
                      {opt.label === "Uang Pas" ? "Uang Pas" : formatRupiah(opt.value)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="cash-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Uang Diterima (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={inputCashRef}
                  id="cash-input"
                  type="number"
                  min={grandTotal}
                  step={1000}
                  value={cashPaidInput || ""}
                  onChange={(e) => setCashPaidInput(Number(e.target.value))}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 text-lg font-black tabular-nums text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
              </div>

              {/* Real-time Change Amount Card */}
              <div
                className={cn(
                  "p-4 rounded-xl border flex items-center justify-between",
                  isCashInsufficient
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                )}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    Kembalian Kasir:
                  </span>
                  <span className="text-2xl font-black tabular-nums block mt-0.5">
                    {formatRupiah(changeAmount)}
                  </span>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600 stroke-[2.5]" />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center py-6 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Pembayaran Non-Tunai ({paymentMethod})
              </span>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Pastikan pembayaran sebesar{" "}
                <strong className="text-slate-900 font-bold">
                  {formatRupiah(grandTotal)}
                </strong>{" "}
                telah diverifikasi pada mesin EDC / notifikasi rekening toko.
              </p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Batal (Esc)
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={isCashInsufficient}
              className="min-h-[48px] px-6 text-sm font-black"
            >
              <span>Konfirmasi & Cetak Struk</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

