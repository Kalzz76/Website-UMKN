"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { KasirView } from "@/components/patisserie/KasirView";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { usePatisserieCart } from "@/lib/patisserieCart";
import { AnimatePresence, motion } from "motion/react";

export default function KasirPage() {
  const router = useRouter();
  const { cart, updateItemQty } = usePatisserieCart();
  const [customerName, setCustomerName] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleNavigate = (view) => {
    if (view === "custom") {
      router.push("/pesan");
    } else if (view === "katalog" || view === "menu") {
      router.push("/menu");
    } else if (view === "toko" || view === "etalase") {
      router.push("/toko");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4EE] text-ink selection:bg-blush selection:text-cherry pt-14 sm:pt-16 pb-16">
      {/* Floating Dynamic Island Navbar */}
      <DynamicIslandNavbar showEntered={true} />

      {/* Main Kasir View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
        <KasirView
          cart={cart}
          customerName={customerName}
          pickupDate={pickupDate}
          onCustomerNameChange={setCustomerName}
          onPickupDateChange={setPickupDate}
          onUpdateQty={updateItemQty}
          onNavigate={handleNavigate}
          onNotify={showToast}
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
