"use client";

import { useEffect, useState } from "react";

export function usePatisserieCart() {
  const [cart, setCart] = useState([]);
  const [totalQty, setTotalQty] = useState(0);

  async function fetchKeranjang() {
    try {
      const res = await fetch("/api/keranjang", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const items = json.items || [];
        const formatCart = items.map((it) => ({
          id: it.id,
          nama: it.nama_item,
          harga: it.harga_satuan,
          qty: it.jumlah,
          jenis: it.jenis,
          fotoUrl: it.fotoProdukUrl || it.fotoPreviewUrl,
        }));
        setCart(formatCart);
        setTotalQty(Number(json.ringkasan?.total_item || 0));
      } else {
        setCart([]);
        setTotalQty(0);
      }
    } catch {
      setCart([]);
      setTotalQty(0);
    }
  }

  async function updateItemQty(id, delta) {
    const item = cart.find((it) => it.id === id);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      await fetch(`/api/keranjang?id=${id}`, { method: "DELETE" });
    } else {
      await fetch("/api/keranjang", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, jumlah: newQty }),
      });
    }
    fetchKeranjang();
  }

  useEffect(() => {
    fetchKeranjang();

    const handleUpdate = () => {
      fetchKeranjang();
    };

    window.addEventListener("cravely_cart_updated", handleUpdate);
    return () => {
      window.removeEventListener("cravely_cart_updated", handleUpdate);
    };
  }, []);

  return {
    cart,
    totalQty,
    refreshCart: fetchKeranjang,
    updateItemQty,
  };
}

export function triggerCartUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cravely_cart_updated"));
  }
}
