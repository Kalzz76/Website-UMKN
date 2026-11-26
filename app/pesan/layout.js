import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Custom Cake Studio 3D",
  description: "Kreasikan kue custom 3D impian Anda di Cravely Cake Studio.",
};

export default async function PesanLayout({ children }) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/masuk?ke=/pesan");
  }

  return children;
}
