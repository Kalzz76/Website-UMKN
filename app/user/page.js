import { Suspense } from "react";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { cekRole } from "@/lib/cekRole";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { ambilTokoPublik } from "@/lib/tokoPublik";
import { hitungPesanan } from "@/lib/hitungHarga";
import DashboardPelangganView from "@/components/DashboardPelangganView";
import "./user-dashboard.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Dashboard Pelanggan - Cravely Patisserie",
};

export default async function UserDashboardPage() {
  const { user, profil, diizinkan } = await cekRole(["pelanggan"]);

  if (!diizinkan || !user) {
    if (profil && (profil.role === "admin" || profil.role === "staf")) {
      redirect("/dashboard");
    }
    redirect("/masuk?ke=/user");
  }

  const supabaseAdmin = getSupabaseAdmin();

  const [
    { data: pesananRaw },
    { data: pengaturanToko },
    { data: tarifJarakList },
    { data: produkUnggulanRaw },
    { data: keranjangRaw },
    { data: semuaOpsiItem },
    { data: semuaProdukKatalog },
    tokoPublik,
  ] = await Promise.all([
    supabaseAdmin
      .from("pesanan")
      .select(`
        *,
        zona_ongkir (id, nama, tarif),
        pesanan_pilihan (*),
        pesanan_item (*, produk (id, nama, harga, foto, aktif)),
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
      .from("tarif_jarak")
      .select("id, jarak_maks_km, tarif, aktif")
      .eq("aktif", true)
      .order("jarak_maks_km", { ascending: true }),
    supabaseAdmin
      .from("produk")
      .select("id, nama, deskripsi, harga, foto, aktif, unggulan, kategori_produk (id, nama)")
      .eq("aktif", true)
      .order("unggulan", { ascending: false })
      .order("dibuat_pada", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("keranjang_item")
      .select("*")
      .eq("id_pelanggan", user.id)
      .order("dibuat_pada", { ascending: true }),
    supabaseAdmin
      .from("opsi_item")
      .select("*"),
    supabaseAdmin
      .from("produk")
      .select("*, kategori_produk(nama)"),
    ambilTokoPublik(),
  ]);

  const { data: storagePublik } = supabaseAdmin.storage.from("publik").getPublicUrl("");
  const basePublikUrl = storagePublik?.publicUrl ? storagePublik.publicUrl.replace(/\/+$/, "") : "";

  function buatUrlPublik(pathFoto) {
    if (!pathFoto) return null;
    if (pathFoto.startsWith("http://") || pathFoto.startsWith("https://")) {
      return pathFoto;
    }
    return `${basePublikUrl}/${pathFoto.replace(/^\/+/, "")}`;
  }

  const daftarPesanan = pesananRaw || [];

  const pesananDenganPreview = await Promise.all(
    daftarPesanan.map(async (p) => {
      let fotoPreviewUrl = null;
      const pathFoto = p.foto_preview || p.foto_referensi;
      if (pathFoto) {
        const { data: signed } = await supabaseAdmin.storage
          .from("referensi-kue")
          .createSignedUrl(pathFoto, 3600);
        if (signed && signed.signedUrl) {
          fotoPreviewUrl = signed.signedUrl;
        }
      }

      const itemsLengkap = await Promise.all(
        (p.pesanan_item || []).map(async (it) => {
          let fotoItemUrl = null;
          if (it.jenis === "Custom" && it.foto_preview) {
            const { data: signedIt } = await supabaseAdmin.storage
              .from("referensi-kue")
              .createSignedUrl(it.foto_preview, 3600);
            if (signedIt && signedIt.signedUrl) {
              fotoItemUrl = signedIt.signedUrl;
            }
          } else if (it.produk && it.produk.foto) {
            fotoItemUrl = buatUrlPublik(it.produk.foto);
          }
          return {
            ...it,
            fotoItemUrl,
          };
        })
      );

      if (!fotoPreviewUrl && itemsLengkap.length > 0) {
        for (let idx = 0; idx < itemsLengkap.length; idx++) {
          if (itemsLengkap[idx].fotoItemUrl) {
            fotoPreviewUrl = itemsLengkap[idx].fotoItemUrl;
            break;
          }
        }
      }

      let qrDataUrl = null;
      if (p.kode_pesanan) {
        try {
          qrDataUrl = await QRCode.toDataURL(p.kode_pesanan, {
            width: 220,
            margin: 2,
            color: {
              dark: "#3D2B28",
              light: "#FFFDF9",
            },
          });
        } catch {}
      }

      const riwayatUrut = (p.riwayat_pesanan || []).sort(
        (a, b) => new Date(b.dibuat_pada).getTime() - new Date(a.dibuat_pada).getTime()
      );

      let ringkasanItem = "";
      if (itemsLengkap.length > 0) {
        const bagian = [];
        for (let k = 0; k < itemsLengkap.length; k++) {
          const it = itemsLengkap[k];
          const qty = it.jumlah || 1;
          const nama = (it.produk && it.produk.nama) || it.nama_item || (it.jenis === "Custom" ? "Kue Custom" : "Kue");
          bagian.push(`${qty}x ${nama}`);
        }
        ringkasanItem = bagian.join(", ");
      } else if (p.tulisan_kue || p.desain_json) {
        ringkasanItem = "1x Kue Custom";
      } else {
        ringkasanItem = "Pesanan Kue";
      }

      return {
        ...p,
        pesanan_item: itemsLengkap,
        fotoPreviewUrl,
        qrDataUrl,
        riwayat_pesanan: riwayatUrut,
        isi_singkat: ringkasanItem,
      };
    })
  );

  const hasilKeranjang = hitungPesanan(
    keranjangRaw || [],
    semuaOpsiItem || [],
    semuaProdukKatalog || [],
    0,
    pengaturanToko
  );

  for (let i = 0; i < hasilKeranjang.rincian.length; i++) {
    const item = hasilKeranjang.rincian[i];
    if (item.jenis === "Custom" && item.foto_preview) {
      const { data: signed } = await supabaseAdmin.storage
        .from("referensi-kue")
        .createSignedUrl(item.foto_preview, 3600);
      if (signed && signed.signedUrl) {
        item.foto_preview_url = signed.signedUrl;
      }
    } else if (item.foto) {
      item.foto_url = buatUrlPublik(item.foto);
    }
  }

  const katalogRekomendasi = (produkUnggulanRaw || []).map((pr) => ({
    id: pr.id,
    nama: pr.nama,
    deskripsi: pr.deskripsi || "",
    harga: Number(pr.harga || 0),
    kategori: (pr.kategori_produk && pr.kategori_produk.nama) || "Patisserie",
    unggulan: Boolean(pr.unggulan),
    foto_url: buatUrlPublik(pr.foto),
  }));

  const profilLengkap = {
    ...profil,
    email: user.email || "",
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDF5E7] flex items-center justify-center text-xs font-bold text-[#3D2B28]">
          Memuat Dashboard Pelanggan...
        </div>
      }
    >
      <DashboardPelangganView
        profilAwal={profilLengkap}
        pesananList={pesananDenganPreview}
        pengaturanToko={pengaturanToko}
        tokoPublik={tokoPublik}
        tarifJarakList={tarifJarakList || []}
        katalogRekomendasi={katalogRekomendasi}
        keranjangAwal={{
          items: hasilKeranjang.rincian || [],
          ringkasan: {
            subtotal_custom: hasilKeranjang.subtotal_custom,
            subtotal_katalog: hasilKeranjang.subtotal_katalog,
            total_kue: hasilKeranjang.total_kue,
            jumlah_dp: hasilKeranjang.jumlah_dp,
            sisa: hasilKeranjang.sisa,
            mode_pembayaran: hasilKeranjang.mode_pembayaran,
            persen_dp: hasilKeranjang.persen_dp,
          },
        }}
      />
    </Suspense>
  );
}
