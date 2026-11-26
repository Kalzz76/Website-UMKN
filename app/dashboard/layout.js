import { redirect } from "next/navigation";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { hitungKebutuhanBahan } from "@/lib/resepKalkulator";
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
      redirect("/user");
    }
    redirect("/masuk");
  }

  const supabase = await getSupabaseServer();

  const { data: toko } = await supabase
    .from("pengaturan_toko")
    .select("nama_toko")
    .eq("id", 1)
    .maybeSingle();

  let notifBayarManual = 0;
  let notifPerluRefund = 0;
  if (profil.role === "admin") {
    const [{ count: cBayar }, { count: cRefund }] = await Promise.all([
      supabase
        .from("pembayaran")
        .select("*", { count: "exact", head: true })
        .eq("status", "Menunggu Konfirmasi"),
      supabase
        .from("pesanan")
        .select("*", { count: "exact", head: true })
        .eq("perlu_refund", true),
    ]);
    notifBayarManual = cBayar || 0;
    notifPerluRefund = cRefund || 0;
  }

  const { count: cDiterima } = await supabase
    .from("pesanan")
    .select("*", { count: "exact", head: true })
    .eq("status_pesanan", "Diterima");
  const notifPesananDiterima = cDiterima || 0;

  const { data: listBahan } = await supabase
    .from("bahan")
    .select("id, jumlah, batas_minimum");

  const { data: pesananAktif } = await supabase
    .from("pesanan")
    .select("id")
    .in("status_pesanan", ["Diterima", "Sedang Dibuat", "Siap"])
    .is("stok_dipotong_pada", null);

  let kebutuhanMap = {};
  if (pesananAktif && pesananAktif.length > 0) {
    const idList = pesananAktif.map((p) => p.id);
    const [{ data: itemsList }, { data: pilihanList }] = await Promise.all([
      supabase
        .from("pesanan_item")
        .select("id, id_pesanan, jenis, jumlah")
        .in("id_pesanan", idList),
      supabase
        .from("pesanan_pilihan")
        .select(
          "id_pesanan, id_pesanan_item, id_item, nama_grup, nama_item, kode_visual, peran_visual, jumlah"
        )
        .in("id_pesanan", idList)
        .not("id_item", "is", null),
    ]);

    const validPilihan = pilihanList || [];
    const itemIds = Array.from(new Set(validPilihan.map((p) => p.id_item)));
    if (itemIds.length > 0) {
      const { data: resepList } = await supabase
        .from("resep_item")
        .select("id_item, id_bahan, jumlah")
        .in("id_item", itemIds);

      const resepPerItem = new Map();
      for (let i = 0; i < (resepList || []).length; i++) {
        const r = resepList[i];
        if (!resepPerItem.has(Number(r.id_item))) resepPerItem.set(Number(r.id_item), []);
        resepPerItem.get(Number(r.id_item)).push(r);
      }

      const pesananItemMap = new Map(
        (itemsList || []).map((it) => [Number(it.id), it])
      );
      const { kebutuhanPerBahan } = hitungKebutuhanBahan({
        pilihanList: validPilihan,
        pesananItemMap,
        resepPerItemMap: resepPerItem,
      });
      kebutuhanMap = kebutuhanPerBahan;
    }
  }

  const notifStokCount = (listBahan || []).filter(
    (b) =>
      Number(b.jumlah) <= Number(b.batas_minimum) ||
      Number(b.jumlah) < (kebutuhanMap[b.id] || 0)
  ).length;

  return (
    <DashboardShell
      profil={profil}
      namaToko={toko?.nama_toko || "Cravely Bakery"}
      notifData={{
        bayarManual: notifBayarManual,
        perluRefund: notifPerluRefund,
        stokBahan: notifStokCount,
        pesananDiterima: notifPesananDiterima,
      }}
    >
      {children}
    </DashboardShell>
  );
}
