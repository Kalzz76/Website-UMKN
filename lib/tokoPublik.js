import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

function formatJamWib(buka, tutup) {
  if (!buka || !tutup) return "";
  const b = String(buka).slice(0, 5).replace(":", ".");
  const t = String(tutup).slice(0, 5).replace(":", ".");
  return `${b} – ${t} WIB`;
}

function normalisasiWa(nomor) {
  if (!nomor) return { bersih: "", wa_link: "" };
  let bersih = String(nomor).replace(/[^0-9]/g, "");
  if (bersih.startsWith("0")) {
    bersih = "62" + bersih.slice(1);
  } else if (bersih.startsWith("8")) {
    bersih = "62" + bersih;
  }
  if (!bersih) return { bersih: "", wa_link: "" };
  return {
    bersih,
    wa_link: `https://wa.me/${bersih}`,
  };
}

function normalisasiInstagram(ig) {
  if (!ig || typeof ig !== "string") return { handle: "", url: "" };
  let str = ig.trim();
  if (!str) return { handle: "", url: "" };

  let handle = str;
  if (handle.startsWith("http://") || handle.startsWith("https://")) {
    try {
      const u = new URL(handle);
      const segmen = u.pathname.split("/").filter(Boolean);
      if (segmen.length > 0) {
        handle = segmen[0];
      }
    } catch {
      handle = str.replace(/^https?:\/\/(www\.)?instagram\.com\/?/, "").replace(/\/.*$/, "");
    }
  }

  handle = handle.replace(/^@+/, "").replace(/\/+$/, "").trim();
  if (!handle) return { handle: "", url: "" };

  return {
    handle: `@${handle}`,
    url: `https://instagram.com/${handle}`,
  };
}

async function fetchTokoPublik() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("pengaturan_toko")
      .select("nama_toko, alamat, no_wa, email, instagram, tautan_peta, deskripsi_footer, jam_buka_senin_jumat, jam_tutup_senin_jumat, jam_buka_sabtu_minggu, jam_tutup_sabtu_minggu, jam_buka, jam_tutup, minimal_hari_pesan, minimal_hari_katalog, maks_jarak_kirim_km, lat_toko, lng_toko")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return {
        nama_toko: "",
        alamat: "",
        no_wa: "",
        wa_link: "",
        email: "",
        instagram_handle: "",
        instagram_url: "",
        tautan_peta: "",
        deskripsi_footer: "",
        jam: {
          senin_jumat: "",
          sabtu_minggu: "",
          ringkas: "",
        },
        minimal_hari_pesan: null,
        minimal_hari_katalog: null,
        maks_jarak_kirim_km: null,
        pengiriman_aktif: false,
      };
    }

    const { bersih: noWaBersih, wa_link } = normalisasiWa(data.no_wa);
    const { handle: igHandle, url: igUrl } = normalisasiInstagram(data.instagram);

    const jamSeninJumat = formatJamWib(
      data.jam_buka_senin_jumat || data.jam_buka,
      data.jam_tutup_senin_jumat || data.jam_tutup
    );

    const jamSabtuMinggu = formatJamWib(
      data.jam_buka_sabtu_minggu || data.jam_buka,
      data.jam_tutup_sabtu_minggu || data.jam_tutup
    );

    const jamRingkas = jamSeninJumat || jamSabtuMinggu || "";

    let tautanPeta = (data.tautan_peta || "").trim();
    if (tautanPeta && !tautanPeta.startsWith("http://") && !tautanPeta.startsWith("https://")) {
      tautanPeta = `https://${tautanPeta}`;
    }

    let pengirimanAktif = false;
    if (data.lat_toko !== null && data.lng_toko !== null && !isNaN(Number(data.lat_toko)) && !isNaN(Number(data.lng_toko))) {
      const { count } = await supabase
        .from("tarif_jarak")
        .select("*", { count: "exact", head: true })
        .eq("aktif", true);
      pengirimanAktif = Boolean(count && count > 0);
    }

    const minCustom =
      data.minimal_hari_pesan !== null &&
      data.minimal_hari_pesan !== undefined &&
      data.minimal_hari_pesan !== ""
        ? Number(data.minimal_hari_pesan)
        : null;

    const minKatalog =
      data.minimal_hari_katalog !== null &&
      data.minimal_hari_katalog !== undefined &&
      data.minimal_hari_katalog !== ""
        ? Number(data.minimal_hari_katalog)
        : data.minimal_hari_siap !== null &&
          data.minimal_hari_siap !== undefined &&
          data.minimal_hari_siap !== ""
        ? Number(data.minimal_hari_siap)
        : null;

    const maksJarak =
      data.maks_jarak_kirim_km !== null &&
      data.maks_jarak_kirim_km !== undefined &&
      data.maks_jarak_kirim_km !== "" &&
      !isNaN(Number(data.maks_jarak_kirim_km))
        ? Number(data.maks_jarak_kirim_km)
        : null;

    return {
      nama_toko: (data.nama_toko || "").trim(),
      alamat: (data.alamat || "").trim(),
      no_wa: noWaBersih,
      wa_link,
      email: (data.email || "").trim(),
      instagram_handle: igHandle,
      instagram_url: igUrl,
      tautan_peta: tautanPeta,
      deskripsi_footer: (data.deskripsi_footer || "").trim(),
      jam: {
        senin_jumat: jamSeninJumat,
        sabtu_minggu: jamSabtuMinggu,
        ringkas: jamRingkas,
      },
      minimal_hari_pesan: minCustom,
      minimal_hari_katalog: minKatalog,
      maks_jarak_kirim_km: maksJarak,
      pengiriman_aktif: pengirimanAktif,
    };
  } catch {
    return {
      nama_toko: "",
      alamat: "",
      no_wa: "",
      wa_link: "",
      email: "",
      instagram_handle: "",
      instagram_url: "",
      tautan_peta: "",
      deskripsi_footer: "",
      jam: {
        senin_jumat: "",
        sabtu_minggu: "",
        ringkas: "",
      },
      minimal_hari_pesan: null,
      minimal_hari_katalog: null,
      maks_jarak_kirim_km: null,
      pengiriman_aktif: false,
    };
  }
}

export const ambilTokoPublik = unstable_cache(
  fetchTokoPublik,
  ["ambil-toko-publik-v2"],
  { revalidate: 60, tags: ["pengaturan_toko"] }
);
