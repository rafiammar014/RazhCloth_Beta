"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCart } from "@/hooks/use-cart";
import { useCategories } from "@/hooks/use-categories";
import { ProductItem } from "@/hooks/use-products";
import { PosCatalog } from "@/components/pos/pos-catalog";
import { PosCart, CustomerOption } from "@/components/pos/pos-cart";
import { PaymentModal } from "@/components/pos/payment-modal";
import { ReceiptModal, CompletedTransaction } from "@/components/pos/receipt-modal";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";

export default function PosPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Customers
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<CompletedTransaction | null>(null);

  const { categories } = useCategories();
  const cart = useCart();

  // Fetch active products for POS
  const fetchPosProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/products?limit=100&isActive=true");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Gagal memuat katalog kasir");
      setProducts(json.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat katalog kasir";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/v1/customers");
      const json = await res.json();
      if (res.ok && json.data) {
        setCustomers(json.data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchPosProducts();
    fetchCustomers();
  }, []);

  // Filter products by selected category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        !selectedCategoryId || p.categoryId === selectedCategoryId;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.size && p.size.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategoryId, searchQuery]);

  const cartProductIds = useMemo(() => {
    return new Set(cart.items.map((i) => i.product.id));
  }, [cart.items]);

  // Global POS Keyboard Shortcut F4 (Checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F4" && cart.items.length > 0 && !paymentModalOpen && !receiptModalOpen) {
        e.preventDefault();
        setPaymentModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.items.length, paymentModalOpen, receiptModalOpen]);

  // Handle Checkout submission
  const handleConfirmPayment = async (data: {
    paymentMethod: "CASH" | "TRANSFER" | "DEBIT" | "QRIS";
    cashPaid?: number;
    notes?: string;
  }): Promise<boolean> => {
    const payload = {
      customerId: selectedCustomerId || undefined,
      paymentMethod: data.paymentMethod,
      cashPaid: data.cashPaid,
      notes: data.notes,
      discountAmount: cart.totalDiscount,
      items: cart.items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        discountAmount: i.discountAmount,
      })),
    };

    const res = await fetch("/api/v1/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || "Gagal memproses transaksi kasir");
    }

    // Set last transaction for receipt
    setLastTransaction(json.data);
    setReceiptModalOpen(true);

    // Clear cart and reload stock
    cart.clearCart();
    fetchPosProducts();

    return true;
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col">
      {/* ARIA Live Region for Cart Updates */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {cart.announcement}
      </div>

      {loading ? (
        <div className="p-6">
          <TableSkeleton rows={8} />
        </div>
      ) : error ? (
        <div className="p-6">
          <ErrorBanner title="Gagal Membuka Kasir" message={error} onRetry={fetchPosProducts} />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
          {/* Left Column: Visual Apparel Catalog & Barcode Search */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full overflow-hidden">
            <PosCatalog
              products={filteredProducts}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAddToCart={cart.addToCart}
              cartProductIds={cartProductIds}
            />
          </div>

          {/* Right Column: Interactive Cart & Checkout Panel */}
          <div className="lg:col-span-5 xl:col-span-4 h-full overflow-hidden">
            <PosCart
              items={cart.items}
              subtotal={cart.subtotal}
              totalDiscount={cart.totalDiscount}
              grandTotal={cart.grandTotal}
              totalItemsCount={cart.totalItemsCount}
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={setSelectedCustomerId}
              onIncrease={cart.addToCart as any}
              onDecrease={cart.decreaseQuantity}
              onRemove={cart.removeFromCart}
              onClearCart={cart.clearCart}
              onOpenCheckout={() => setPaymentModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Payment Settlement Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        grandTotal={cart.grandTotal}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Digital Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setLastTransaction(null);
        }}
        transaction={lastTransaction}
      />
    </div>
  );
}

