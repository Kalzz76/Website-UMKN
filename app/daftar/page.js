"use client";

import dynamic from "next/dynamic";

const OvenAuth = dynamic(() => import("@/components/OvenAuth"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#2a1a12] flex items-center justify-center text-[#fff1dc] font-mono">
      Memuat Dapur Cravely...
    </div>
  ),
});

export default function DaftarPage() {
  return <OvenAuth defaultMode="welcome" initialTarget="reg" />;
}
