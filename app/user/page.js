import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import DashboardPelangganView from "@/components/DashboardPelangganView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Dashboard Pelanggan - Cravely Bakery",
};

export default async function UserDashboardPage() {
  const { user, profil, diizinkan } = await cekRole(["pelanggan", "admin", "staf"]);

  if (!diizinkan || !user) {
    redirect("/masuk?ke=/user");
  }

  const supabaseAdmin = getSupabaseAdmin();

  const [
    { data: pesananRaw },
    { data: pengaturanToko },
    { data: zonaOngkirList },
  ] = await Promise.all([
    supabaseAdmin
      .from("pesanan")
      .select(`
        *,
        zona_ongkir (id, nama, tarif),
        pesanan_pilihan (*),
        pembayaran (*),
        riwayat_pesanan (*)
      `)
      .eq("id_pelanggan", user.id)
      .order("dibuat_pada", { ascending: false }),
    supabaseAdmin
      .from("pengaturan_toko")
      .select("*")
      .eq("id", 1)
      .maybeSingle(),
    supabaseAdmin
      .from("zona_ongkir")
      .select("id, nama, tarif, aktif")
      .eq("aktif", true)
      .order("tarif", { ascending: true }),
  ]);

  const daftarPesanan = pesananRaw || [];

  const pesananDenganPreview = await Promise.all(
    daftarPesanan.map(async (p) => {
      let fotoPreviewUrl = null;
      const pathFoto = p.foto_preview || p.foto_referensi;
      if (pathFoto) {
        const { data: signed } = await supabaseAdmin.storage
          .from("referensi-kue")
          .createSignedUrl(pathFoto, 3600);
        if (signed?.signedUrl) {
          fotoPreviewUrl = signed.signedUrl;
        }
      }

      const riwayatUrut = (p.riwayat_pesanan || []).sort(
        (a, b) => new Date(b.dibuat_pada).getTime() - new Date(a.dibuat_pada).getTime()
      );

      return {
        ...p,
        fotoPreviewUrl,
        riwayat_pesanan: riwayatUrut,
      };
    })
  );

  const profilLengkap = {
    ...profil,
    email: user.email || "",
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#eff4ee] flex items-center justify-center text-xs font-bold text-[#17382d]">
          Memuat Dashboard Pelanggan...
        </div>
      }
    >
      <DashboardPelangganView
        profilAwal={profilLengkap}
        pesananList={pesananDenganPreview}
        pengaturanToko={pengaturanToko}
        zonaOngkirList={zonaOngkirList || []}
      />
    </Suspense>
  );
}
