import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseServer } from "@/lib/supabaseServer";
import DashboardShell from "@/components/DashboardShell";
import "./dashboard.css";

export const metadata = {
  title: "Dashboard - Cravely Bakery",
};

export default async function DashboardLayout({ children }) {
  const { user, profil, diizinkan, status } = await cekRole(["admin", "staf"]);

  if (!diizinkan) {
    if (status === 401 || !user) {
      redirect("/masuk?ke=/dashboard");
    }
    if (profil && profil.role === "pelanggan") {
      redirect("/pesanan-saya");
    }
    redirect("/masuk");
  }

  const supabase = await getSupabaseServer();

  const { data: toko } = await supabase
    .from("pengaturan_toko")
    .select("nama_toko")
    .eq("id", 1)
    .maybeSingle();

  let notifPesananCount = 0;
  if (profil.role === "admin") {
    const { count } = await supabase
      .from("pembayaran")
      .select("*", { count: "exact", head: true })
      .eq("status", "Menunggu Konfirmasi");
    notifPesananCount = count || 0;
  }

  const { data: listBahan } = await supabase
    .from("bahan")
    .select("id, jumlah, batas_minimum");

  const notifStokCount = (listBahan || []).filter(
    (b) => Number(b.jumlah) <= Number(b.batas_minimum)
  ).length;

  return (
    <DashboardShell
      profil={profil}
      namaToko={toko?.nama_toko || "Cravely Bakery"}
      notifPesananCount={notifPesananCount}
      notifStokCount={notifStokCount}
    >
      {children}
    </DashboardShell>
  );
}
