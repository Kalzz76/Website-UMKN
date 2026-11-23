"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { DessertsMenuView } from "@/components/patisserie/DessertsMenuView";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { usePatisserieCart } from "@/lib/patisserieCart";
import { AnimatePresence, motion } from "motion/react";

export default function MenuPage() {
  const router = useRouter();
  const { totalQty, totalPrice, addItem } = usePatisserieCart();
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleAddToCart = (item) => {
    addItem(item);
    showToast(`Masuk keranjang: ${item.nama}`);
  };

  const handleNavigate = (view) => {
    if (view === "custom") {
      router.push("/pesan");
    } else if (view === "toko" || view === "etalase") {
      router.push("/toko");
    } else if (view === "kasir") {
      router.push("/kasir");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4EE] text-ink selection:bg-blush selection:text-cherry pt-28 sm:pt-32 pb-16">
      {/* Floating Dynamic Island Navbar */}
      <DynamicIslandNavbar showEntered={true} />

      {/* Main Desserts Menu View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <DessertsMenuView
          totalQty={totalQty}
          totalPrice={totalPrice}
          onAddToCart={handleAddToCart}
          onNavigate={handleNavigate}
        />
      </main>

      {/* Footer */}
      <PatisserieFooter
        onNavigate={handleNavigate}
        onOpenHampers={() => {}}
        onExitShop={() => router.push("/")}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-24 right-5 z-[90] bg-kayu text-ivory border border-kuningan px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Piping Bag Cursor */}
      <PipingBagCursor />
    </div>
  );
}
