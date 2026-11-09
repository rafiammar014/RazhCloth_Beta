"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  size?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
}

export interface PaginationInfo {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ProductFilters {
  q: string;
  categoryId: string;
  size: string;
  page: number;
  limit: number;
  sortBy: "name" | "sellPrice" | "stock" | "createdAt";
  order: "asc" | "desc";
}

export function useProducts(initialFilters?: Partial<ProductFilters>) {
  const [filters, setFilters] = useState<ProductFilters>({
    q: initialFilters?.q || "",
    categoryId: initialFilters?.categoryId || "",
    size: initialFilters?.size || "",
    page: initialFilters?.page || 1,
    limit: initialFilters?.limit || 10,
    sortBy: initialFilters?.sortBy || "createdAt",
    order: initialFilters?.order || "desc",
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [meta, setMeta] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce query search string
  const [debouncedQuery, setDebouncedQuery] = useState(filters.q);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (searchTerm: string) => {
    setFilters((prev) => ({ ...prev, q: searchTerm, page: 1 }));
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchTerm);
    }, 400);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.size) params.set("size", filters.size);
      params.set("page", String(filters.page));
      params.set("limit", String(filters.limit));
      params.set("sortBy", filters.sortBy);
      params.set("order", filters.order);

      const res = await fetch(`/api/v1/products?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal memuat daftar produk");
      }

      setProducts(json.data || []);
      if (json.meta) setMeta(json.meta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat produk";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters.categoryId, filters.size, filters.page, filters.limit, filters.sortBy, filters.order]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setCategoryFilter = (catId: string) => {
    setFilters((prev) => ({ ...prev, categoryId: catId, page: 1 }));
  };

  const setPage = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const toggleSort = (field: "name" | "sellPrice" | "stock" | "createdAt") => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      order: prev.sortBy === field && prev.order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  const softDeleteProduct = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/products/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal menonaktifkan produk");
      }
      // Re-fetch to keep list strictly synchronized
      await fetchProducts();
      return true;
    } catch (err) {
      console.error("Delete product error:", err);
      return false;
    }
  };

  return {
    products,
    meta,
    loading,
    error,
    filters,
    handleSearchChange,
    setCategoryFilter,
    setPage,
    toggleSort,
    refetch: fetchProducts,
    softDeleteProduct,
  };
}

