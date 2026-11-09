"use client";

import React, { useRef, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { CategoryItem } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  order: string;
  onSortChange: (field: "name" | "sellPrice" | "stock" | "createdAt") => void;
}

export function ProductFilters({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  order,
  onSortChange,
}: ProductFiltersProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Hotkey F2 or "/" to focus search
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
    <div className="space-y-4 mb-6">
      {/* Category Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Filter Kategori Pakaian">
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategoryId === ""}
          onClick={() => onSelectCategory("")}
          className={cn(
            "min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition select-none flex-shrink-0",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
            selectedCategoryId === ""
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          )}
        >
          Semua Kategori
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
                "min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition select-none flex-shrink-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                isSelected
                  ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {cat.name}
              {cat._count?.products !== undefined && (
                <span className="ml-1.5 text-[11px] opacity-75">
                  ({cat._count.products})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Bar & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari berdasarkan nama pakaian atau SKU... (Tekan F2)"
            aria-label="Pencarian nama produk pakaian atau SKU"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-amber-500 min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Hapus kata kunci pencarian"
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label htmlFor="product-sort-select" className="text-xs font-bold text-slate-500 whitespace-nowrap">
            <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
            Urutkan:
          </label>
          <select
            id="product-sort-select"
            value={`${sortBy}-${order}`}
            onChange={(e) => {
              const [f] = e.target.value.split("-") as ["name" | "sellPrice" | "stock" | "createdAt"];
              onSortChange(f);
            }}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[44px]"
          >
            <option value="createdAt-desc">Terbaru Ditambahkan</option>
            <option value="name-asc">Nama (A - Z)</option>
            <option value="sellPrice-asc">Harga Terendah</option>
            <option value="sellPrice-desc">Harga Tertinggi</option>
            <option value="stock-asc">Stok Paling Sedikit</option>
            <option value="stock-desc">Stok Terbanyak</option>
          </select>
        </div>
      </div>
    </div>
  );
}

