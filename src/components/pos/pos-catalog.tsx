"use client";

import React, { useRef, useEffect } from "react";
import { Search, X, Shirt, Check } from "lucide-react";
import { ProductItem } from "@/hooks/use-products";
import { CategoryItem } from "@/hooks/use-categories";
import { formatRupiah, cn } from "@/lib/utils";
import { StockBadge } from "@/components/ui/badge";

interface PosCatalogProps {
  products: ProductItem[];
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddToCart: (product: ProductItem) => void;
  cartProductIds: Set<string>;
}

export function PosCatalog({
  products,
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddToCart,
  cartProductIds,
}: PosCatalogProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "F2" || e.key === "/") &&
        document.activeElement !== searchInputRef.current &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Category Pills Bar - styled like custom boutique tabs */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        role="tablist"
        aria-label="Kategori Produk Kasir"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategoryId === ""}
          onClick={() => onSelectCategory("")}
          className={cn(
            "h-10 px-4 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition select-none flex-shrink-0",
            selectedCategoryId === ""
              ? "bg-zinc-900 text-zinc-100 shadow-sm"
              : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
          )}
        >
          Semua Koleksi
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                "h-10 px-4 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition select-none flex-shrink-0",
                isSelected
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Barcode / Name Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari artikel pakaian atau scan barcode... (Tekan F2)"
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition h-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {products.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 bg-white rounded-xl border border-dashed border-zinc-200">
            <Shirt className="w-8 h-8 mx-auto text-zinc-300 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-zinc-700">Koleksi tidak ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product) => {
              const inCart = cartProductIds.has(product.id);
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product)}
                  className={cn(
                    "p-3 rounded-xl text-left transition flex flex-col justify-between select-none relative group border",
                    isOutOfStock
                      ? "bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed"
                      : inCart
                      ? "bg-amber-50/40 border-amber-500/50 shadow-sm"
                      : "bg-white border-zinc-200/80 hover:border-zinc-400 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <span className="font-mono text-[10px] text-zinc-400 tracking-wider truncate">
                      {product.sku}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold text-[10px]">
                      {product.size || "ALL"}
                    </span>
                  </div>

                  <div className="my-2.5">
                    <h3 className="text-xs font-medium text-zinc-900 leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between w-full pt-2 border-t border-zinc-100">
                    <span className="text-xs font-bold text-zinc-900 tabular-nums">
                      {formatRupiah(product.sellPrice)}
                    </span>
                    <StockBadge stock={product.stock} />
                  </div>

                  {inCart && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
