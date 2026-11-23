"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { EtalaseShowcaseView } from "@/components/patisserie/EtalaseShowcaseView";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";

export default function TokoPage() {
  const router = useRouter();

  const handleNavigate = (view) => {
    if (view === "custom") {
      router.push("/pesan");
    } else if (view === "katalog" || view === "menu") {
      router.push("/menu");
    } else if (view === "kasir") {
      router.push("/kasir");
    } else {
      router.push("/");
    }
  };

  const handleGoToMenuWithCake = (menuId) => {
    router.push(`/menu?id=${menuId}`);
  };

  return (
    <div className="min-h-screen bg-ivory text-ink selection:bg-blush selection:text-cherry pt-20">
      {/* Floating Dynamic Island Navbar */}
      <DynamicIslandNavbar showEntered={true} />

      {/* Main 3D Etalase Showcase View */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <EtalaseShowcaseView
          onNavigate={handleNavigate}
          onGoToMenuWithCake={handleGoToMenuWithCake}
        />
      </main>

      {/* Footer */}
      <PatisserieFooter
        onNavigate={handleNavigate}
        onOpenHampers={() => {}}
        onExitShop={() => router.push("/")}
      />

      {/* Custom Piping Bag Cursor */}
      <PipingBagCursor />
    </div>
  );
}
