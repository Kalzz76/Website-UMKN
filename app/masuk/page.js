"use client";

import dynamic from "next/dynamic";

const OvenAuth = dynamic(() => import("@/components/OvenAuth"), {
  ssr: false,
  loading: () => (
    <div
      className="fixed inset-0 bg-[#fffdf9] flex items-center justify-center"
      role="status"
      aria-label="Memuat"
    >
      <div className="w-10 h-10 rounded-full border-[3px] border-[#EADCC8] border-t-[#9E3B42] animate-spin" />
    </div>
  ),
});

export default function MasukPage() {
  return <OvenAuth defaultMode="welcome" initialTarget="login" />;
}
