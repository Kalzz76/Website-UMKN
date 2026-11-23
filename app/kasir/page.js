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
    <div className="min-h-screen bg-[#FAF4EE] text-ink selection:bg-blush selection:text-cherry pt-14 sm:pt-16 flex flex-col justify-between relative overflow-x-clip">
      {/* Floating Dynamic Island Navbar */}
      <DynamicIslandNavbar showEntered={true} />

      {/* Main Kasir View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 w-full flex-1">
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

      {/* Bottom Full-Bleed Screen Edge Waves & Cake Sketch */}
      <footer className="w-full relative h-28 sm:h-36 pointer-events-none select-none overflow-hidden mt-2">
        {/* Left Screen-Edge Waves & Cake Slice Sketch */}
        <div className="absolute left-0 bottom-0 h-full w-[44%] max-w-[480px]">
          <svg viewBox="0 0 460 140" preserveAspectRatio="none" className="w-full h-full">
            {/* Peach / Blush Soft Wave */}
            <path
              d="M 0,20 C 90,20 180,95 300,125 C 360,135 410,139 460,140 L 0,140 Z"
              fill="#F2DBD0"
            />
            {/* Deep Burgundy Corner Wave */}
            <path
              d="M 0,75 C 50,75 110,110 180,128 C 230,136 270,140 300,140 L 0,140 Z"
              fill="#7D2330"
            />
            {/* Cake Slice Line-Art Sketch on Plate */}
            <g stroke="#6E4238" strokeWidth="1.2" fill="none">
              <ellipse cx="105" cy="118" rx="65" ry="8" stroke="#6E4238" opacity="0.65" />
              <path d="M48,120 Q105,128 162,120" opacity="0.4" />
              <path d="M55,110 L142,84 L142,55 L55,82 Z" fill="#FFFDF9" fillOpacity="0.8" />
              <path d="M55,82 L102,46 L142,55 Z" fill="#FAF4EE" fillOpacity="0.85" />
              <path d="M55,110 L55,82" />
              <path d="M142,84 L142,55" />
              <path d="M55,96 L142,70" strokeDasharray="2,1.5" />
              <path d="M55,91 L142,65" strokeDasharray="3,2" />
              <circle cx="86" cy="46" r="5.5" stroke="#6E4238" fill="#FFFDF9" />
              <circle cx="95" cy="44" r="4" stroke="#6E4238" fill="#FFFDF9" />
              <path d="M86,40 Q88,35 92,36" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Right Screen-Edge Waves & Botanical Leaf Flourish */}
        <div className="absolute right-0 bottom-0 h-full w-[44%] max-w-[480px]">
          <svg viewBox="0 0 460 140" preserveAspectRatio="none" className="w-full h-full">
            {/* Peach / Blush Soft Wave */}
            <path
              d="M 460,20 C 370,20 280,95 160,125 C 100,135 50,139 0,140 L 460,140 Z"
              fill="#F2DBD0"
            />
            {/* Deep Burgundy Corner Wave */}
            <path
              d="M 460,75 C 410,75 350,110 280,128 C 230,136 190,140 160,140 L 460,140 Z"
              fill="#7D2330"
            />
            {/* Botanical Leaf Branch on Far Right */}
            <g stroke="#7D5A50" strokeWidth="1.2" fill="none" opacity="0.45">
              <path d="M330,120 Q395,65 440,12" strokeLinecap="round" />
              <path d="M365,92 C355,80 375,74 383,84 C388,92 375,98 365,92 Z" fill="#7D5A50" fillOpacity="0.08" />
              <path d="M398,70 C410,60 420,72 410,80 C402,86 394,76 398,70 Z" fill="#7D5A50" fillOpacity="0.08" />
              <path d="M418,44 C410,32 428,28 434,36 C440,44 426,50 418,44 Z" fill="#7D5A50" fillOpacity="0.08" />
            </g>
          </svg>
        </div>
      </footer>

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
