"use client";

import React from "react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  User,
  Tag,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { CartItem } from "@/hooks/use-cart";
import { formatRupiah, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CustomerOption {
  id: string;
  name: string;
  phone?: string | null;
}

interface PosCartProps {
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  totalItemsCount: number;
  customers: CustomerOption[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
}

export function PosCart({
  items,
  subtotal,
  totalDiscount,
  grandTotal,
  totalItemsCount,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onIncrease,
  onDecrease,
  onRemove,
  onClearCart,
  onOpenCheckout,
}: PosCartProps) {
  const isCartEmpty = items.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Cart Header & Customer Selector */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Keranjang Kasir
            </h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
            {totalItemsCount} pcs
          </span>
        </div>

        {/* Customer Dropdown */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedCustomerId}
            onChange={(e) => onSelectCustomer(e.target.value)}
            aria-label="Pilih Pelanggan"
            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[40px]"
          >
            <option value="">Pelanggan Umum (Walk-in)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
        {isCartEmpty ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-400 p-4">
            <ShoppingBag className="w-12 h-12 text-slate-200 mb-2 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-600">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-400 max-w-[200px] mt-1 leading-relaxed">
              Klik pakaian pada katalog di sebelah kiri untuk memasukkannya ke transaksi
            </p>
          </div>
        ) : (
          items.map((item) => {
            const itemTotal =
              item.product.sellPrice * item.quantity - item.discountAmount;

            return (
              <div
                key={item.product.id}
                className="py-3 px-2 flex flex-col gap-2 hover:bg-slate-50/70 rounded-xl transition"
              >
                {/* Item title & remove button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {item.product.name}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Ukuran:{" "}
                      <strong className="text-slate-700">
                        {item.product.size || "ALL"}
                      </strong>{" "}
                      &bull; @{formatRupiah(item.product.sellPrice)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(item.product.id)}
                    aria-label={`Hapus ${item.product.name} dari keranjang`}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Quantity Stepper & Line Price */}
                <div className="flex items-center justify-between pt-1">
                  {/* Stepper with touch targets */}
                  <div
                    role="group"
                    aria-label={`Ubah kuantiti untuk ${item.product.name}`}
                    className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl"
                  >
                    <button
                      type="button"
                      onClick={() => onDecrease(item.product.id)}
                      aria-label="Kurangi 1 pcs"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="min-w-[32px] text-center font-bold text-xs tabular-nums text-slate-900">
                      {item.quantity}
                    </div>
                    <button
                      type="button"
                      onClick={() => onIncrease(item.product.id)}
                      disabled={item.quantity >= item.product.stock}
                      aria-label="Tambah 1 pcs"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 tabular-nums block">
                      {formatRupiah(itemTotal)}
                    </span>
                    {item.discountAmount > 0 && (
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        Hemat {formatRupiah(item.discountAmount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
        {/* Subtotal and Discount Breakdown */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal ({totalItemsCount} item):</span>
            <span className="font-bold tabular-nums text-slate-800">
              {formatRupiah(subtotal)}
            </span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Potongan Diskon:</span>
              <span className="font-bold tabular-nums">
                -{formatRupiah(totalDiscount)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-900">TOTAL BAYAR:</span>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              {formatRupiah(grandTotal)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isCartEmpty}
            onClick={onClearCart}
            aria-label="Kosongkan seluruh keranjang belanja"
            className="min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-bold"
          >
            Reset
          </button>

          <Button
            type="button"
            disabled={isCartEmpty}
            onClick={onOpenCheckout}
            variant="primary"
            className="flex-1 min-h-[48px] text-sm font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            <span>Bayar Sekarang (F4)</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

