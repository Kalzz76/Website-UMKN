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
      <footer className="w-full relative h-40 sm:h-52 lg:h-56 pointer-events-none select-none overflow-hidden mt-2">
        {/* Left Screen-Edge Waves & Elevated Cake Slice Sketch */}
        <div className="absolute left-0 bottom-0 h-full w-[46%] max-w-[520px]">
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
            <g stroke="#6E4238" strokeWidth="1.2" fill="none">
              <ellipse cx="120" cy="138" rx="72" ry="10" stroke="#6E4238" opacity="0.65" />
              <path d="M50,140 Q120,150 190,140" opacity="0.4" />
              <path d="M58,128 L152,98 L152,65 L58,95 Z" fill="#FFFDF9" fillOpacity="0.82" />
              <path d="M58,95 L108,54 L152,65 Z" fill="#FAF4EE" fillOpacity="0.88" />
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

        {/* Right Screen-Edge Waves & Botanical Leaf Flourish */}
        <div className="absolute right-0 bottom-0 h-full w-[46%] max-w-[520px]">
          <svg viewBox="0 0 480 180" preserveAspectRatio="none" className="w-full h-full">
            {/* Peach / Blush Soft Wave */}
            <path
              d="M 480,20 C 370,20 270,120 150,160 C 90,172 40,178 0,180 L 480,180 Z"
              fill="#F2DBD0"
            />
            {/* Deep Burgundy Corner Wave */}
            <path
              d="M 480,85 C 415,85 345,130 270,160 C 220,172 170,178 130,180 L 480,180 Z"
              fill="#7D2330"
            />
            {/* Botanical Leaf Branch on Far Right */}
            <g stroke="#7D5A50" strokeWidth="1.2" fill="none" opacity="0.45">
              <path d="M340,160 Q410,90 460,20" strokeLinecap="round" />
              <path d="M380,125 C368,110 390,102 400,114 C406,124 392,132 380,125 Z" fill="#7D5A50" fillOpacity="0.08" />
              <path d="M418,95 C432,83 444,97 432,107 C422,115 412,103 418,95 Z" fill="#7D5A50" fillOpacity="0.08" />
              <path d="M440,60 C430,46 452,40 460,50 C466,60 450,68 440,60 Z" fill="#7D5A50" fillOpacity="0.08" />
              <path d="M455,28 C446,14 466,8 472,16 C478,24 464,32 455,28 Z" fill="#7D5A50" fillOpacity="0.08" />
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
