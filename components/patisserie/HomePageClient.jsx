"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CafeScene } from "@/components/patisserie/CafeScene";
import { CafeStoryShowcase } from "@/components/patisserie/CafeStoryShowcase";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";

export default function HomePageClient({ popularCakes = [] }) {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const handleNavigate = (view) => {
    if (view === "custom") {
      router.push("/pesan");
    } else if (view === "katalog" || view === "menu") {
      router.push("/menu");
    } else if (view === "etalase" || view === "toko") {
      router.push("/toko");
    } else if (view === "kasir" || view === "checkout") {
      router.push("/keranjang");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGoToMenuWithCake = (menuId) => {
    router.push(`/menu?id=${menuId}`);
  };

  return (
    <div className="min-h-screen bg-ivory text-ink selection:bg-blush selection:text-cherry">
      <DynamicIslandNavbar showEntered={entered} />

      <CafeScene
        startInside={false}
        onEnteredChange={setEntered}
        onNavigate={handleNavigate}
        onOpenInfo={() => {}}
      />

      <CafeStoryShowcase
        onNavigate={handleNavigate}
        onGoToMenuWithCake={handleGoToMenuWithCake}
        onNotify={showToast}
        popularCakes={popularCakes}
      />

      <PatisserieFooter
        onNavigate={handleNavigate}
        onOpenHampers={() => {}}
        onExitShop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-24 right-5 z-[90] bg-[#3D2B28] text-[#FFFDF9] border border-[#C59B62] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <PipingBagCursor />
    </div>
  );
}
