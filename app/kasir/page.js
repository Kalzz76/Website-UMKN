"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { KasirView } from "@/components/patisserie/KasirView";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import {
  BotanicalTopLeft,
  BotanicalTopRight,
  BotanicalBottomRight,
} from "@/components/patisserie/BotanicalBranchDecor";
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
      {/* ==================== ELEGANT BOTANICAL CORNER FLOURISHES ==================== */}
      {/* Top-Left Botanical Leaf Branch */}
      <div className="absolute top-0 left-0 pointer-events-none select-none z-0">
        <BotanicalTopLeft
          className="w-40 sm:w-56 lg:w-64 h-auto"
          color="#8A675C"
          opacity={0.55}
        />
      </div>

      {/* Top-Right Botanical Leaf Branch */}
      <div className="absolute top-0 right-0 pointer-events-none select-none z-0">
        <BotanicalTopRight
          className="w-40 sm:w-56 lg:w-64 h-auto"
          color="#8A675C"
          opacity={0.55}
        />
      </div>

      {/* Floating Dynamic Island Navbar */}
      <DynamicIslandNavbar showEntered={true} />

      {/* Main Kasir View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-6 w-full flex-1 relative z-10">
        <KasirView
          cart={Array.isArray(cart) ? cart : []}
          customerName={customerName}
          pickupDate={pickupDate}
          onCustomerNameChange={setCustomerName}
          onPickupDateChange={setPickupDate}
          onUpdateQty={updateItemQty}
          onNavigate={handleNavigate}
          onNotify={showToast}
        />
      </main>

      {/* Bottom Screen Edge Waves & Cake Sketch Decor */}
      <footer className="w-full relative h-36 sm:h-48 lg:h-52 pointer-events-none select-none overflow-hidden mt-1 z-0">
        {/* Left Screen-Edge Waves & Elevated Cake Slice Sketch */}
        <div className="absolute left-0 bottom-0 h-full w-[48%] max-w-[540px]">
          <svg viewBox="0 0 480 180" preserveAspectRatio="none" className="w-full h-full">
            {/* Peach / Blush Soft Wave */}
            <path
              d="M 0,20 C 110,20 210,120 330,160 C 390,172 440,178 480,180 L 0,180 Z"
              fill="#F2DBD0"
            />
            {/* Deep Burgundy Corner Wave */}
            <path
              d="M 0,85 C 65,85 135,130 210,160 C 260,172 310,178 350,180 L 0,180 Z"
              fill="#7D2330"
            />
            {/* Elevated Cake Slice Line-Art Sketch on Plate */}
            <g stroke="#6E4238" strokeWidth="1.25" fill="none">
              <ellipse cx="120" cy="138" rx="72" ry="10" stroke="#6E4238" opacity="0.65" />
              <path d="M50,140 Q120,150 190,140" opacity="0.4" />
              <path d="M58,128 L152,98 L152,65 L58,95 Z" fill="#FFFDF9" fillOpacity="0.85" />
              <path d="M58,95 L108,54 L152,65 Z" fill="#FAF4EE" fillOpacity="0.9" />
              <path d="M58,128 L58,95" />
              <path d="M152,98 L152,65" />
              <path d="M58,112 L152,82" strokeDasharray="2,1.5" />
              <path d="M58,106 L152,76" strokeDasharray="3,2" />
              <circle cx="94" cy="54" r="6" stroke="#6E4238" fill="#FFFDF9" />
              <circle cx="104" cy="51" r="4.5" stroke="#6E4238" fill="#FFFDF9" />
              <path d="M94,48 Q96,41 101,42" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Right Screen-Edge Botanical Leaf Flourish (Realistic lanceolate branch) */}
        <div className="absolute right-0 bottom-0 pointer-events-none select-none">
          <BotanicalBottomRight
            className="w-36 sm:w-48 lg:w-56 h-auto"
            color="#8A675C"
            opacity={0.45}
          />
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
            className="fixed top-24 right-5 z-[90] bg-[#4A2E2B] text-[#FFFDF9] border border-[#ECDCCE] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-xl"
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
