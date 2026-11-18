"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function TombolKeluar() {
  const router = useRouter();

  async function handleKeluar() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/masuk");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleKeluar}
      className="text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
    >
      Keluar
    </button>
  );
}
