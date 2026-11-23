"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { CafeScene } from "@/components/patisserie/CafeScene";
import { EtalaseShowcaseView } from "@/components/patisserie/EtalaseShowcaseView";
import { CafeStoryShowcase } from "@/components/patisserie/CafeStoryShowcase";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";

export default function TokoPage() {
  const router = useRouter();
  const [showCloseUpEtalase, setShowCloseUpEtalase] = useState(false);

  const handleNavigate = (view) => {
    if (view === "custom") {
      router.push("/pesan");
    } else if (view === "katalog" || view === "menu") {
      router.push("/menu");
    } else if (view === "kasir") {
      router.push("/kasir");
    } else if (view === "etalase") {
      setShowCloseUpEtalase(true);
    } else {
      router.push("/");
    }
  };

  const handleGoToMenuWithCake = (menuId) => {
    router.push(`/menu?id=${menuId}`);
  };

  return (
    <div className="min-h-screen bg-ivory text-ink selection:bg-blush selection:text-cherry">
      {/* Floating Dynamic Island Navbar */}
      <DynamicIslandNavbar showEntered={true} />

      {/* Jika mengintip etalase dekat: tampilkan full-screen edge-to-edge tanpa margin kosong */}
      {showCloseUpEtalase ? (
        <div className="relative w-full min-h-screen bg-[#FDF5E7] overflow-x-hidden pt-16">
          <button
            type="button"
            onClick={() => setShowCloseUpEtalase(false)}
            className="fixed top-18 left-4 sm:left-8 z-50 px-4 py-2 rounded-full bg-[#FFFDF9]/95 border-2 border-[#C59B62]/80 text-[#3D2B28] hover:text-[#9E3B42] hover:bg-[#F5ECE2] text-xs font-bold shadow-lg flex items-center gap-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#9E3B42]" />
            <span>← Kembali ke Ruang Toko</span>
          </button>
          <div className="w-full">
            <EtalaseShowcaseView
              onNavigate={handleNavigate}
              onGoToMenuWithCake={handleGoToMenuWithCake}
            />
          </div>
        </div>
      ) : (
        <>
          {/* FOTO 5: Ruang Toko Kafe Interaktif (Always Inside, full screen, ada Teteh Kasir, Papan Menu, Etalase, Karakter & Pintu Dapur) */}
          <CafeScene
            startInside={true}
            alwaysInside={true}
            onEnteredChange={() => {}}
            onNavigate={handleNavigate}
            onOpenInfo={() => {}}
          />

          {/* Cerita & Showcase Toko */}
          <CafeStoryShowcase
            onNavigate={handleNavigate}
            onGoToMenuWithCake={handleGoToMenuWithCake}
          />
        </>
      )}

      {/* Redesigned Luxury Patisserie Footer */}
      <PatisserieFooter />

      {/* Custom Piping Bag Cursor */}
      <PipingBagCursor />
    </div>
  );
}
