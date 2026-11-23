"use client";

import { useEffect, useState } from "react";

const CART_STORAGE_KEY = "cravely_patisserie_cart";

const DEFAULT_CART = [
  {
    id: "initial-raspberry",
    nama: "Raspberry Lemonade Cake",
    harga: 185000,
    qty: 1,
    tipe: "cake-raspberry",
  },
];

export function getStoredCart() {
  if (typeof window === "undefined") return DEFAULT_CART;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return DEFAULT_CART;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CART;
  } catch {
    return DEFAULT_CART;
  }
}

export function saveStoredCart(cart) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cravely_cart_updated"));
  } catch (err) {
    console.error("Gagal menyimpan keranjang:", err);
  }
}

export function usePatisserieCart() {
  const [cart, setCart] = useState(DEFAULT_CART);

  useEffect(() => {
    setCart(getStoredCart());

    const handleUpdate = () => {
      setCart(getStoredCart());
    };

    window.addEventListener("cravely_cart_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("cravely_cart_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const totalQty = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.harga || 0) * (item.qty || 1),
    0
  );

  const addItem = (item) => {
    const current = getStoredCart();
    const existingIndex = current.findIndex((c) => c.nama === item.nama);
    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: updated[existingIndex].qty + 1,
      };
    } else {
      updated = [
        ...current,
        {
          id: `${Date.now()}-${Math.random()}`,
          nama: item.nama,
          harga: item.harga,
          qty: 1,
          tipe: item.tipe || "cake-raspberry",
        },
      ];
    }
    saveStoredCart(updated);
    setCart(updated);
  };

  const updateItemQty = (index, delta) => {
    const current = getStoredCart();
    const updated = [...current];
    const newQty = (updated[index]?.qty || 1) + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index] = { ...updated[index], qty: newQty };
    }
    saveStoredCart(updated);
    setCart(updated);
  };

  const clearCart = () => {
    saveStoredCart([]);
    setCart([]);
  };

  return {
    cart,
    totalQty,
    totalPrice,
    addItem,
    updateItemQty,
    clearCart,
  };
}
