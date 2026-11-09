"use client";

import { useState } from "react";
import { ProductItem } from "./use-products";

export interface ProductFormData {
  sku: string;
  name: string;
  categoryId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  size: string;
  imageUrl: string;
}

const initialData: ProductFormData = {
  sku: "",
  name: "",
  categoryId: "",
  buyPrice: 0,
  sellPrice: 0,
  stock: 0,
  size: "L",
  imageUrl: "",
};

export function useProductForm(
  editingProduct?: ProductItem | null,
  onSuccess?: () => void
) {
  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (editingProduct) {
      return {
        sku: editingProduct.sku,
        name: editingProduct.name,
        categoryId: editingProduct.categoryId,
        buyPrice: editingProduct.buyPrice,
        sellPrice: editingProduct.sellPrice,
        stock: editingProduct.stock,
        size: editingProduct.size || "ALL SIZE",
        imageUrl: editingProduct.imageUrl || "",
      };
    }
    return initialData;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Real-time calculation of profit margin
  const profitAmount = formData.sellPrice - formData.buyPrice;
  const profitPercentage =
    formData.sellPrice > 0
      ? Math.round((profitAmount / formData.sellPrice) * 100)
      : 0;

  const handleChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setServerError(null);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.sku.trim()) {
      errs.sku = "SKU / Barcode wajib diisi";
    } else if (formData.sku.trim().length < 2) {
      errs.sku = "SKU minimal 2 karakter";
    }

    if (!formData.name.trim()) {
      errs.name = "Nama artikel pakaian wajib diisi";
    }

    if (!formData.categoryId) {
      errs.categoryId = "Kategori pakaian wajib dipilih";
    }

    if (formData.buyPrice < 0) {
      errs.buyPrice = "Harga beli HPP tidak boleh negatif";
    }

    if (formData.sellPrice <= 0) {
      errs.sellPrice = "Harga jual harus lebih dari Rp 0";
    }

    if (formData.stock < 0) {
      errs.stock = "Jumlah stok tidak boleh negatif";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setServerError(null);

      const endpoint = editingProduct
        ? `/api/v1/products/${editingProduct.id}`
        : "/api/v1/products";

      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error?.details && Array.isArray(json.error.details)) {
          const fieldErrs: Record<string, string> = {};
          json.error.details.forEach(
            (d: { field: string; message: string }) => {
              fieldErrs[d.field] = d.message;
            }
          );
          setErrors(fieldErrs);
        }
        throw new Error(json.error?.message || "Gagal menyimpan data produk");
      }

      onSuccess?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialData);
    setErrors({});
    setServerError(null);
  };

  return {
    formData,
    errors,
    submitting,
    serverError,
    profitAmount,
    profitPercentage,
    handleChange,
    handleSubmit,
    resetForm,
  };
}

