"use client";

import { useState, useCallback, useMemo } from "react";
import { ProductItem } from "./use-products";
import { formatRupiah } from "@/lib/utils";

export interface CartItem {
  product: ProductItem;
  quantity: number;
  discountAmount: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [announcement, setAnnouncement] = useState<string>("");

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
    setTimeout(() => setAnnouncement(""), 3000);
  }, []);

  const addToCart = useCallback(
    (product: ProductItem) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.product.id === product.id);

        if (existingIndex > -1) {
          const currentItem = prev[existingIndex];
          if (currentItem.quantity >= product.stock) {
            announce(`Stok "${product.name}" hanya tersedia ${product.stock} pcs`);
            return prev;
          }

          const updated = [...prev];
          updated[existingIndex] = {
            ...currentItem,
            quantity: currentItem.quantity + 1,
          };
          announce(`1 ${product.name} ditambahkan. Total: ${updated[existingIndex].quantity}`);
          return updated;
        }

        if (product.stock <= 0) {
          announce(`Stok "${product.name}" sudah habis`);
          return prev;
        }

        announce(`${product.name} ukuran ${product.size || "ALL"} dimasukkan ke keranjang`);
        return [...prev, { product, quantity: 1, discountAmount: 0 }];
      });
    },
    [announce]
  );

  const decreaseQuantity = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.product.id === productId);
        if (existingIndex === -1) return prev;

        const currentItem = prev[existingIndex];
        if (currentItem.quantity <= 1) {
          announce(`${currentItem.product.name} dihapus dari keranjang`);
          return prev.filter((i) => i.product.id !== productId);
        }

        const updated = [...prev];
        updated[existingIndex] = {
          ...currentItem,
          quantity: currentItem.quantity - 1,
        };
        announce(`Kuantitas ${currentItem.product.name} dikurangi menjadi ${updated[existingIndex].quantity}`);
        return updated;
      });
    },
    [announce]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.product.id !== productId));
        return;
      }

      setItems((prev) => {
        return prev.map((item) => {
          if (item.product.id === productId) {
            const safeQty = Math.min(quantity, item.product.stock);
            return { ...item, quantity: safeQty };
          }
          return item;
        });
      });
    },
    []
  );

  const updateItemDiscount = useCallback(
    (productId: string, discount: number) => {
      setItems((prev) => {
        return prev.map((item) => {
          if (item.product.id === productId) {
            const maxDiscount = item.product.sellPrice * item.quantity;
            return {
              ...item,
              discountAmount: Math.max(0, Math.min(discount, maxDiscount)),
            };
          }
          return item;
        });
      });
    },
    []
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.product.id === productId);
        if (item) announce(`${item.product.name} dikeluarkan dari keranjang`);
        return prev.filter((i) => i.product.id !== productId);
      });
    },
    [announce]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    announce("Keranjang belanja dikosongkan");
  }, [announce]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemPrice = item.product.sellPrice * item.quantity;
      return sum + Math.max(0, itemPrice - item.discountAmount);
    }, 0);
  }, [items]);

  const totalDiscount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.discountAmount, 0);
  }, [items]);

  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return {
    items,
    announcement,
    subtotal,
    totalDiscount,
    grandTotal: subtotal,
    totalItemsCount,
    addToCart,
    decreaseQuantity,
    updateQuantity,
    updateItemDiscount,
    removeFromCart,
    clearCart,
  };
}

