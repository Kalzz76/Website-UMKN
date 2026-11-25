"use client";

import dynamic from "next/dynamic";

const OvenAuth = dynamic(() => import("@/components/OvenAuth"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#fffdf9] flex items-center justify-center text-[#3a2315] text-sm font-semibold">
      Memuat Halaman Masuk...
    </div>
  ),
});

export default function MasukPage() {
  return <OvenAuth defaultMode="welcome" initialTarget="login" />;
}
