import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseServer } from "@/lib/supabaseServer";
import SidebarDashboard from "@/components/SidebarDashboard";

export const metadata = {
  title: "Dashboard - Toko Kue Custom",
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
  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("nama_toko")
    .eq("id", 1)
    .single();

  const namaToko = pengaturan?.nama_toko || "Toko Kue";

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col md:flex-row">
      <SidebarDashboard profil={profil} namaToko={namaToko} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
