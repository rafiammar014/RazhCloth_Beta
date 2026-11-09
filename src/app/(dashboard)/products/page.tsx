"use client";

import React, { useState } from "react";
import { Plus, Shirt, CheckCircle } from "lucide-react";
import { useProducts, ProductItem } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductTable } from "@/components/products/product-table";
import { ProductFormModal } from "@/components/products/product-form-modal";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";

export default function ProductsPage() {
  const {
    products,
    meta,
    loading,
    error,
    filters,
    handleSearchChange,
    setCategoryFilter,
    setPage,
    toggleSort,
    refetch,
    softDeleteProduct,
  } = useProducts();

  const { categories } = useCategories();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menonaktifkan produk "${name}" dari sistem kasir?\n(Data historis penjualan tetap tersimpan aman).`
    );
    if (!confirmed) return;

    const ok = await softDeleteProduct(id);
    if (ok) {
      showToast(`Produk "${name}" berhasil dinonaktifkan.`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification (WCAG ARIA Live Region) */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Master Data Produk Pakaian
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Kelola katalog artikel, variasi ukuran, harga jual kasir, dan stok toko
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreateModal}
          variant="primary"
          size="md"
          className="self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Produk Baru
        </Button>
      </div>

      {/* Filter Controls (Category pills, Search bar, Sort) */}
      <ProductFilters
        categories={categories}
        selectedCategoryId={filters.categoryId}
        onSelectCategory={setCategoryFilter}
        searchQuery={filters.q}
        onSearchChange={handleSearchChange}
        sortBy={filters.sortBy}
        order={filters.order}
        onSortChange={toggleSort}
      />

      {/* State Handling Section */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorBanner title="Gagal memuat produk" message={error} onRetry={refetch} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Shirt className="w-8 h-8" />}
          title="Tidak Ada Produk Ditemukan"
          description={
            filters.q || filters.categoryId
              ? "Tidak ada artikel yang cocok dengan filter atau kata kunci Anda."
              : "Belum ada produk pakaian di katalog toko. Tambahkan produk pertama Anda sekarang."
          }
          actionText={filters.q || filters.categoryId ? undefined : "+ Tambah Produk Pertama"}
          onAction={handleOpenCreateModal}
        />
      ) : (
        <ProductTable
          products={products}
          meta={meta}
          onPageChange={setPage}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteProduct}
          sortBy={filters.sortBy}
          order={filters.order}
          onSort={toggleSort}
        />
      )}

      {/* Product Form Modal (Create / Edit) */}
      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingProduct={editingProduct}
        categories={categories}
        onSuccess={() => {
          refetch();
          showToast(
            editingProduct
              ? "Perubahan produk berhasil disimpan."
              : "Produk baru berhasil ditambahkan ke katalog."
          );
        }}
      />
    </div>
  );
}

