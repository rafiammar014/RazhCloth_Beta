"use client";

import React from "react";
import { Edit3, Trash2, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductItem, PaginationInfo } from "@/hooks/use-products";
import { StockBadge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";

interface ProductTableProps {
  products: ProductItem[];
  meta: PaginationInfo;
  onPageChange: (page: number) => void;
  onEdit: (product: ProductItem) => void;
  onDelete: (id: string, name: string) => void;
  sortBy: string;
  order: string;
  onSort: (field: "name" | "sellPrice" | "stock" | "createdAt") => void;
}

export function ProductTable({
  products,
  meta,
  onPageChange,
  onEdit,
  onDelete,
  sortBy,
  order,
  onSort,
}: ProductTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Desktop & Tablet Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse" aria-label="Tabel Katalog Produk Toko">
          <caption className="sr-only">
            Daftar Produk Pakaian RAZH CLOTH (Halaman {meta.page} dari {meta.totalPages})
          </caption>
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th scope="col" className="py-3.5 px-4 w-28">
                SKU
              </th>
              <th scope="col" className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => onSort("name")}
                  className="flex items-center gap-1.5 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500 rounded p-1"
                >
                  <span>Artikel & Kategori</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-center w-24">
                Ukuran
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => onSort("sellPrice")}
                  className="flex items-center gap-1.5 ml-auto hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500 rounded p-1"
                >
                  <span>Harga Jual</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-center w-32">
                <button
                  type="button"
                  onClick={() => onSort("stock")}
                  className="flex items-center gap-1.5 mx-auto hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500 rounded p-1"
                >
                  <span>Stok</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-center w-28">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-amber-50/20 focus-within:bg-amber-50/20 transition-colors"
              >
                <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600">
                  {item.sku}
                </td>
                <th scope="row" className="py-3.5 px-4 font-semibold text-slate-900">
                  <div>
                    <span className="block font-bold">{item.name}</span>
                    <span className="text-xs font-medium text-slate-500">
                      {item.category?.name || "Tanpa Kategori"}
                    </span>
                  </div>
                </th>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-xs text-slate-800">
                    {item.size || "ALL"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                  {formatRupiah(item.sellPrice)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <StockBadge stock={item.stock} />
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      aria-label={`Ubah data produk ${item.name}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-amber-500"
                      title="Ubah Produk"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id, item.name)}
                      aria-label={`Nonaktifkan produk ${item.name}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Nonaktifkan Produk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Clean Responsive Fallback for phone screens) */}
      <div className="sm:hidden divide-y divide-slate-100">
        {products.map((item) => (
          <div key={item.id} className="p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-semibold text-slate-500 block">
                  {item.sku}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {item.name}
                </h4>
                <span className="text-xs text-slate-500">
                  {item.category?.name} &bull; Ukuran: <strong>{item.size || "ALL"}</strong>
                </span>
              </div>
              <StockBadge stock={item.stock} />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-base font-black text-slate-900 tabular-nums">
                {formatRupiah(item.sellPrice)}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  aria-label={`Ubah ${item.name}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id, item.name)}
                  aria-label={`Hapus ${item.name}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-semibold">
        <div>
          Menampilkan {products.length > 0 ? (meta.page - 1) * meta.perPage + 1 : 0} -{" "}
          {Math.min(meta.page * meta.perPage, meta.total)} dari total{" "}
          <strong className="text-slate-900 font-bold">{meta.total}</strong> produk
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
            aria-label="Halaman sebelumnya"
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <span className="px-3 py-2 bg-slate-200/80 rounded-xl text-slate-800 font-bold">
            {meta.page} / {meta.totalPages}
          </span>

          <button
            type="button"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPageChange(meta.page + 1)}
            aria-label="Halaman selanjutnya"
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

