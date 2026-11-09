"use client";

import React, { useEffect, useRef } from "react";
import { X, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { ProductItem } from "@/hooks/use-products";
import { CategoryItem } from "@/hooks/use-categories";
import { useProductForm } from "@/hooks/use-product-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: ProductItem | null;
  categories: CategoryItem[];
  onSuccess: () => void;
}

const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL", "ALL SIZE"];

export function ProductFormModal({
  isOpen,
  onClose,
  editingProduct,
  categories,
  onSuccess,
}: ProductFormModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const {
    formData,
    errors,
    submitting,
    serverError,
    profitAmount,
    profitPercentage,
    handleChange,
    handleSubmit,
    resetForm,
  } = useProductForm(editingProduct, () => {
    resetForm();
    onSuccess();
    onClose();
  });

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 id="product-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
              {editingProduct ? "Ubah Data Produk Pakaian" : "Tambah Produk Baru"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lengkapi informasi artikel pakaian untuk inventaris dan kasir
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {serverError && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* SKU & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Input
                ref={firstInputRef}
                label="SKU / Barcode"
                required
                placeholder="TS-BLK-L"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                error={errors.sku}
                helperText="Cth: TS-01-L"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Nama Artikel Pakaian"
                required
                placeholder="T-Shirt Oversized Signature Black"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={errors.name}
                helperText="Nama lengkap model dan warna pakaian"
              />
            </div>
          </div>

          {/* Category & Apparel Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-category" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kategori Pakaian <span className="text-rose-500">*</span>
              </label>
              <select
                id="product-category"
                value={formData.categoryId}
                onChange={(e) => handleChange("categoryId", e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p role="alert" className="text-xs font-semibold text-rose-600 mt-1">
                  {errors.categoryId}
                </p>
              )}
            </div>

            <div>
              <fieldset>
                <legend className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ukuran (Size)
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {APPAREL_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleChange("size", size)}
                      aria-pressed={formData.size === size}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        formData.size === size
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Buy Price, Sell Price, Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Harga Beli (HPP)"
              required
              type="number"
              min={0}
              step={1000}
              value={formData.buyPrice || ""}
              onChange={(e) => handleChange("buyPrice", Number(e.target.value))}
              error={errors.buyPrice}
              helperText="Modal pokok vendor"
            />

            <Input
              label="Harga Jual Kasir"
              required
              type="number"
              min={0}
              step={1000}
              value={formData.sellPrice || ""}
              onChange={(e) => handleChange("sellPrice", Number(e.target.value))}
              error={errors.sellPrice}
              helperText="Harga eceran toko"
            />

            <Input
              label="Jumlah Stok"
              required
              type="number"
              min={0}
              step={1}
              value={formData.stock || ""}
              onChange={(e) => handleChange("stock", Number(e.target.value))}
              error={errors.stock}
              helperText="Pcs tersedia"
            />
          </div>

          {/* Real-time Profit Margin Indicator */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-950 font-medium">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Estimasi Margin Laba:</span>
            </div>
            <div className="font-bold tabular-nums text-sm">
              <span className="text-emerald-700">{formatRupiah(profitAmount)}</span>
              <span className="text-amber-800 ml-1.5 font-semibold text-xs">
                ({profitPercentage}%)
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Batal (Esc)
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingProduct ? "Simpan Perubahan" : "Tambahkan ke Katalog"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

