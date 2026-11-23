"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CafeScene } from "@/components/patisserie/CafeScene";
import { CafeStoryShowcase } from "@/components/patisserie/CafeStoryShowcase";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { PromoWelcomeModal } from "@/components/patisserie/PromoWelcomeModal";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { usePatisserieCart } from "@/lib/patisserieCart";

export default function HomePage() {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const { totalQty } = usePatisserieCart();
  const promoShownOnceRef = useRef(false);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const handleCopyText = useCallback(
    (text, label) => {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => showToast(`${label} disalin: ${text}`))
          .catch(() => showToast(`${label}: ${text}`));
      } else {
        showToast(`${label}: ${text}`);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (entered && !promoShownOnceRef.current) {
      promoShownOnceRef.current = true;
      setPromoOpen(true);
    }
  }, [entered]);

  // Handle navigasi: URL berubah ke rute terpisah!
  const handleNavigate = (view) => {
    if (view === "custom") {
      router.push("/pesan");
    } else if (view === "katalog" || view === "menu") {
      router.push("/menu");
    } else if (view === "etalase" || view === "toko") {
      router.push("/toko");
    } else if (view === "kasir") {
      router.push("/kasir");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGoToMenuWithCake = (menuId) => {
    router.push(`/menu?id=${menuId}`);
  };

  return (
    <div className="min-h-screen bg-ivory text-ink selection:bg-blush selection:text-cherry">
      {/* ==================== DYNAMIC ISLAND NAVBAR ==================== */}
      <DynamicIslandNavbar showEntered={entered} />

      {/* ==================== 3D CAFE SCENE ==================== */}
      <CafeScene
        startInside={false}
        onEnteredChange={setEntered}
        onNavigate={handleNavigate}
        onOpenInfo={() => setInfoOpen(true)}
      />

      {/* ==================== STORY SHOWCASE ==================== */}
      <CafeStoryShowcase
        onNavigate={handleNavigate}
        onGoToMenuWithCake={handleGoToMenuWithCake}
        onNotify={showToast}
      />

      {/* ==================== FOOTER ==================== */}
      <PatisserieFooter
        onNavigate={handleNavigate}
        onOpenHampers={() => {}}
        onExitShop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      {/* ==================== PROMO POPUP ==================== */}
      <PromoWelcomeModal
        open={promoOpen}
        onClose={() => setPromoOpen(false)}
        onCopyCode={handleCopyText}
      />

      {/* ==================== TOAST NOTIFICATION ==================== */}
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

      {/* ==================== CUSTOM PIPING BAG CURSOR ==================== */}
      <PipingBagCursor />
    </div>
  );
}
