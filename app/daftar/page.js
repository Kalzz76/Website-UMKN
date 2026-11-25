"use client";

import dynamic from "next/dynamic";
import RootLoading from "@/app/loading";

const OvenAuth = dynamic(() => import("@/components/OvenAuth"), {
  ssr: false,
  loading: () => <RootLoading />,
});

export default function DaftarPage() {
  return <OvenAuth defaultMode="welcome" initialTarget="reg" />;
}
