"use client";

import { useState, useEffect, useCallback } from "react";

export interface CategoryItem {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    products: number;
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/categories");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal memuat daftar kategori");
      }

      setCategories(json.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat kategori";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

