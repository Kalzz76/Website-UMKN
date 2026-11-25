import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import PreviewKue from "@/components/PreviewKue";
import GambarProduk from "@/components/GambarProduk";
import { BadgeStatusPesanan, BadgeStatusBayar } from "@/components/BadgeStatus";
import TombolBayarMidtrans from "@/components/TombolBayarMidtrans";
import { formatRupiah, formatTanggalIndonesia, formatTanggalWaktu } from "@/lib/format";

export const metadata = {
  title: "Tiket Digital Pesanan - Cravely Bakery",
};

function formatRentangTanggal(awal, akhir) {
  if (!awal) return "";
  if (!akhir || awal === akhir) return formatTanggalIndonesia(awal);
  const [y1, m1, d1] = awal.split("-").map(Number);
  const [y2, m2, d2] = akhir.split("-").map(Number);
  const dt2 = new Date(Date.UTC(y2, m2 - 1, d2));
  const bulanTahun = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(dt2);
  if (y1 === y2 && m1 === m2) {
    return `${d1} sampai ${d2} ${bulanTahun}`;
  }
  return `${formatTanggalIndonesia(awal)} sampai ${formatTanggalIndonesia(akhir)}`;
}

function getStepIndex(status, metodePengiriman) {
  const stepSiapLabel = metodePengiriman === "Kirim" ? "Dikirim" : "Siap";
  const order = ["Menunggu Pembayaran", "Diterima", "Sedang Dibuat", stepSiapLabel, "Selesai"];
  if (status === "Siap" && metodePengiriman === "Kirim") return 3;
  if (status === "Dikirim") return 3;
  const idx = order.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export default async function DetailTiketPage(props) {
  const params = await props.params;
  const kode = params.kode;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/masuk?ke=/pesanan-saya/${kode}`);
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: pesanan } = await supabaseAdmin
    .from("pesanan")
    .select(`
      *,
      zona_ongkir (nama, tarif),
      pesanan_pilihan (*),
      riwayat_pesanan (*),
      pembayaran (*)
    `)
    .eq("kode_pesanan", kode)
    .single();

  if (!pesanan) {
    notFound();
  }

  const { data: profil } = await supabaseAdmin
    .from("profil")
    .select("role")
    .eq("id", user.id)
    .single();

  const isPemilik = pesanan.id_pelanggan === user.id;
  const isStafAtauAdmin = profil?.role === "admin" || profil?.role === "staf";

  if (!isPemilik && !isStafAtauAdmin) {
    redirect("/user");
  }

  const { data: pengaturan } = await supabaseAdmin
    .from("pengaturan_toko")
    .select("*")
    .eq("id", 1)
    .single();

  const qrDataUrl = await QRCode.toDataURL(pesanan.kode_pesanan, {
    width: 240,
    margin: 2,
    color: {
      dark: "#2D1E1B",
      light: "#FFFFFF",
    },
  });

  const riwayatUrut = (pesanan.riwayat_pesanan || []).sort(
    (a, b) => new Date(b.dibuat_pada) - new Date(a.dibuat_pada)
  );

  const sisaBayar = Math.max(0, pesanan.total_bayar - (pesanan.jumlah_terbayar || 0));

  const { data: rawItems } = await supabaseAdmin
    .from("pesanan_item")
    .select("*, produk(*)")
    .eq("id_pesanan", pesanan.id)
    .order("urutan", { ascending: true })
    .order("id", { ascending: true });

  const { data: storagePublik } = supabaseAdmin.storage.from("publik").getPublicUrl("");
  const basePublikUrl = storagePublik?.publicUrl ? storagePublik.publicUrl.replace(/\/+$/, "") : "";

  let itemList = rawItems || [];
  if (itemList.length === 0) {
    itemList = [
      {
        id: 0,
        jenis: "Custom",
        nama_item: "Kue Custom",
        harga_satuan: pesanan.total_kue,
        jumlah: 1,
        subtotal: pesanan.total_kue,
        tulisan_kue: pesanan.tulisan_kue,
        catatan: pesanan.catatan,
        desain_json: pesanan.desain_json,
        foto_preview: pesanan.foto_preview,
        foto_bentuk_kustom: pesanan.foto_bentuk_kustom,
        foto_gambar_kustom: pesanan.foto_gambar_kustom,
      },
    ];
  }

  const itemsWithUrls = [];
  for (let i = 0; i < itemList.length; i++) {
    const it = itemList[i];
    let prevUrl = null;
    let bentukUrl = null;
    let gambarUrl = null;
    let prodUrl = null;

    if (it.foto_preview) {
      const { data: signed } = await supabaseAdmin.storage
        .from("referensi-kue")
        .createSignedUrl(it.foto_preview, 3600);
      if (signed) prevUrl = signed.signedUrl;
    }
    if (it.foto_bentuk_kustom) {
      const { data: signed } = await supabaseAdmin.storage
        .from("referensi-kue")
        .createSignedUrl(it.foto_bentuk_kustom, 3600);
      if (signed) bentukUrl = signed.signedUrl;
    }
    if (it.foto_gambar_kustom) {
      const { data: signed } = await supabaseAdmin.storage
        .from("referensi-kue")
        .createSignedUrl(it.foto_gambar_kustom, 3600);
      if (signed) gambarUrl = signed.signedUrl;
    }
    if (it.produk?.foto) {
      const f = it.produk.foto;
      if (f.startsWith("http://") || f.startsWith("https://")) {
        prodUrl = f;
      } else {
        prodUrl = `${basePublikUrl}/${f.replace(/^\/+/, "")}`;
      }
    }

    const pilihanItem = (pesanan.pesanan_pilihan || []).filter(
      (p) => !p.id_pesanan_item || Number(p.id_pesanan_item) === Number(it.id)
    );

    itemsWithUrls.push({
      ...it,
      prevUrl,
      bentukUrl,
      gambarUrl,
      prodUrl,
      pilihan: pilihanItem,
    });
  }

  const batasJam = Number(pengaturan?.batas_bayar_jam ?? 24);
  const dibuatMs = new Date(pesanan.dibuat_pada).getTime();
  const batasBayarIso = new Date(dibuatMs + batasJam * 3600000).toISOString();

  let teksJadwalKirim = "";
  if (pesanan.metode_pengiriman === "Kirim" && pesanan.tanggal_ambil) {
    const [y, m, d] = pesanan.tanggal_ambil.split("-").map(Number);
    const dtAkhir = new Date(Date.UTC(y, m - 1, d + 1));
    const tglAkhir = dtAkhir.toISOString().slice(0, 10);
    teksJadwalKirim = `Estimasi tiba ${formatRentangTanggal(pesanan.tanggal_ambil, tglAkhir)}`;
  }

  const waTokoRaw = (pengaturan?.no_wa || "").replace(/\D/g, "");
  const waTokoClean = waTokoRaw.startsWith("0") ? "62" + waTokoRaw.slice(1) : waTokoRaw;
  const linkWaBantuan = waTokoClean
    ? `https://wa.me/${waTokoClean}?text=${encodeURIComponent(
        `Halo ${pengaturan?.nama_toko || "Cravely"},\nSaya ingin menanyakan pesanan #${pesanan.kode_pesanan} atas nama ${pesanan.nama_penerima}.`
      )}`
    : null;

  const isDibatalkan = pesanan.status_pesanan === "Dibatalkan";
  const stepAktif = getStepIndex(pesanan.status_pesanan, pesanan.metode_pengiriman);
  const steps = [
    { label: "Pesanan Dibuat", icon: "fa-file-invoice" },
    { label: "Diterima Toko", icon: "fa-clipboard-check" },
    { label: "Sedang Dibuat", icon: "fa-kitchen-set" },
    {
      label: pesanan.metode_pengiriman === "Kirim" ? "Dalam Pengiriman" : "Siap Diambil",
      icon: pesanan.metode_pengiriman === "Kirim" ? "fa-truck-fast" : "fa-bag-shopping",
    },
    { label: "Selesai", icon: "fa-circle-check" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4ED] text-[#3D2B28] selection:bg-[#F3C5CD] selection:text-[#7D2330]">
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={isStafAtauAdmin ? "/dashboard/pesanan" : "/user?tab=pesanan"}
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full border border-[#DFCBB0] text-[#3D2B28] bg-[#FFFDF9] hover:bg-[#F5ECE2] shadow-xs transition"
            >
              <i className="fa-solid fa-arrow-left text-[#9E3B42]" />
              <span>{isStafAtauAdmin ? "Kembali ke Panel Pesanan" : "Kembali ke Dashboard"}</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-[#8C6D62]">
              <span>/</span>
              <span className="font-mono font-bold text-[#3D2B28]">{pesanan.kode_pesanan}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {linkWaBantuan && (
              <a
                href={linkWaBantuan}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full bg-[#EBF5EE] text-[#1D603B] border border-[#B9E1C8] hover:bg-[#DDF0E3] transition shadow-xs"
              >
                <i className="fa-brands fa-whatsapp text-sm" />
                <span>Hubungi Toko</span>
              </a>
            )}
            <span className="text-[11px] font-extrabold text-[#7A5B47] tracking-wider uppercase bg-[#F2E6D8] px-3.5 py-2 rounded-full border border-[#E2D2BE]">
              Tiket Digital
            </span>
          </div>
        </div>

        {/* Refund Alert */}
        {pesanan.perlu_refund && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs flex items-start gap-3">
            <i className="fa-solid fa-circle-exclamation text-amber-600 text-lg mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Pemberitahuan Pengembalian Dana</h4>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                Pembayaran diterima setelah pesanan dibatalkan; tim toko akan segera menghubungi Anda untuk proses pengembalian dana.
              </p>
            </div>
          </div>
        )}

        {/* Order Header & Progress Card */}
        <section className="bg-[#FFFDF9] rounded-3xl border border-[#EADCC8] shadow-[0_12px_36px_rgba(61,43,40,0.05)] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#9E3B42] via-[#C59B62] to-[#3D2B28]" />
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#9E3B42] tracking-widest uppercase">
                <i className="fa-solid fa-store text-xs" />
                <span>{pengaturan?.nama_toko || "CRAVELY BAKERY"} · RINCIAN PESANAN</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#2D1E1B] tracking-tight">
                  {pesanan.kode_pesanan}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeStatusPesanan status={pesanan.status_pesanan} />
                  <BadgeStatusBayar status={pesanan.status_bayar} />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#7A6158]">
                Dipesan pada <span className="font-semibold text-[#3D2B28]">{formatTanggalWaktu(pesanan.dibuat_pada)}</span>
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-[#FAF4ED] border border-[#EADCC8] rounded-2xl px-5 py-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#9E3B42]/10 border border-[#9E3B42]/20 flex items-center justify-center text-[#9E3B42] shrink-0">
                <i className="fa-solid fa-user text-sm" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D62] block">
                  Pemesan
                </span>
                <span className="font-bold text-sm text-[#2D1E1B] block truncate">
                  {pesanan.nama_penerima}
                </span>
                <span className="text-xs text-[#6B5249] block font-medium">
                  {pesanan.no_wa || pesanan.no_wa_penerima || "-"}
                </span>
              </div>
              <div className="hidden sm:block h-8 w-px bg-[#DFCBB0] mx-1" />
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D62] block">
                  Metode
                </span>
                <span className="font-bold text-sm text-[#2D1E1B] block">
                  {pesanan.metode_pengiriman === "Kirim" ? "Kurir Toko" : "Ambil di Toko"}
                </span>
                <span className="text-xs text-[#6B5249] block">
                  {itemsWithUrls.length} item pesanan
                </span>
              </div>
            </div>
          </div>

          {/* Status Stepper or Contextual Banner */}
          {isDibatalkan ? (
            <div className="mx-6 sm:mx-8 mb-6 sm:mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-900">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-ban" />
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-bold">Pesanan Ini Telah Dibatalkan</p>
                <p className="text-rose-700 text-xs mt-0.5">
                  {pesanan.alasan_batal
                    ? `Alasan: ${pesanan.alasan_batal}`
                    : "Pesanan tidak lagi diproses oleh dapur. Hubungi toko jika Anda membutuhkan bantuan."}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-[#F2E6D8]">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
                {steps.map((st, idx) => {
                  const selesai = idx < stepAktif;
                  const aktif = idx === stepAktif;
                  return (
                    <div
                      key={st.label}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition ${
                        aktif
                          ? "bg-[#9E3B42]/8 border-[#9E3B42]/30 text-[#9E3B42]"
                          : selesai
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                          : "bg-[#FAF7F2] border-[#EADCC8]/70 text-[#A89286]"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                          aktif
                            ? "bg-[#9E3B42] text-white"
                            : selesai
                            ? "bg-emerald-600 text-white"
                            : "bg-[#EADCC8]/60 text-[#8C6D62]"
                        }`}
                      >
                        <i className={`fa-solid ${selesai ? "fa-check" : st.icon}`} />
                      </div>
                      <span className="text-[11px] font-bold leading-tight">{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {pesanan.status_pesanan === "Menunggu Pembayaran" && (
            <div className="bg-[#FFF8E7] border-t border-[#F4E1B3] px-6 sm:px-8 py-3.5 flex items-center gap-3 text-xs text-[#7A4B06]">
              <i className="fa-solid fa-clock text-amber-600 text-sm shrink-0" />
              <p className="font-semibold">
                Pesanan sedang menunggu pembayaran. Selesaikan sebelum batas waktu agar dapur kami segera memproses pesanan Anda.
              </p>
            </div>
          )}

          {pesanan.status_pesanan === "Siap" && (
            <div className="bg-[#ECFDF5] border-t border-[#A7F3D0] px-6 sm:px-8 py-3.5 flex items-center gap-3 text-xs text-[#065F46]">
              <i className="fa-solid fa-circle-check text-emerald-600 text-sm shrink-0" />
              <p className="font-semibold">
                Kue Anda sudah selesai dibuat dan siap diambil di toko! Tunjukkan kode QR di sebelah kanan kepada staf kasir.
              </p>
            </div>
          )}
        </section>

        {/* Main 12-Col Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Items, Schedule, Timeline */}
          <div className="lg:col-span-8 space-y-6">
            {/* Items Section */}
            <section className="bg-[#FFFDF9] rounded-3xl border border-[#EADCC8] shadow-[0_8px_28px_rgba(61,43,40,0.04)] p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[#F2E6D8] pb-4">
                <h2 className="font-serif font-bold text-xl text-[#2D1E1B] flex items-center gap-2.5">
                  <i className="fa-solid fa-cake-candles text-[#C59B62]" />
                  <span>Rincian Kue &amp; Isi Pesanan</span>
                </h2>
                <span className="text-xs font-bold text-[#8C6D62] bg-[#FAF4ED] px-3 py-1 rounded-full border border-[#EADCC8]">
                  {itemsWithUrls.length} Item
                </span>
              </div>

              <div className="space-y-4">
                {itemsWithUrls.map((it, idx) => {
                  const isCustom = it.jenis === "Custom";

                  if (!isCustom) {
                    return (
                      <div
                        key={it.id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#EADCC8]"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white overflow-hidden flex items-center justify-center shrink-0 border border-[#EADCC8] shadow-xs">
                            <GambarProduk
                              src={it.prodUrl}
                              nama={it.nama_item}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 space-y-1.5">
                            <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#E6F0FA] text-[#1D4E89] border border-[#C5DCF2]">
                              Kue Katalog
                            </span>
                            <h3 className="font-serif font-bold text-lg text-[#2D1E1B] truncate">
                              {it.nama_item}
                            </h3>
                            <p className="text-xs text-[#7A6158] font-medium lining-nums tabular-nums">
                              {formatRupiah(it.harga_satuan)} &times; {it.jumlah}
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EADCC8] flex sm:block items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D62] sm:block">
                            Subtotal
                          </span>
                          <span className="text-base sm:text-lg font-black text-[#2D1E1B] lining-nums tabular-nums">
                            {formatRupiah(it.subtotal)}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={it.id || idx}
                      className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#EADCC8] space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EADCC8]/70">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#F3E7D3] text-[#6B4B1C] border border-[#DFCBB0]">
                            Kue Custom
                          </span>
                          <h3 className="font-serif font-bold text-lg text-[#2D1E1B]">
                            {it.nama_item} {it.jumlah > 1 ? `(${it.jumlah}x)` : ""}
                          </h3>
                        </div>
                        <span className="text-base sm:text-lg font-black text-[#2D1E1B] lining-nums tabular-nums">
                          {formatRupiah(it.subtotal)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        <div className="md:col-span-5 space-y-3">
                          <div className="flex justify-center bg-white rounded-2xl p-4 border border-[#EADCC8] shadow-inner">
                            {it.prevUrl ? (
                              <img
                                src={it.prevUrl}
                                alt="Snapshot Desain 3D"
                                className="w-full max-w-[220px] h-auto object-contain rounded-xl drop-shadow-md"
                              />
                            ) : (
                              <PreviewKue
                                pilihan={it.pilihan || []}
                                tulisan={it.tulisan_kue || ""}
                                className="w-full max-w-[190px]"
                              />
                            )}
                          </div>

                          {(it.bentukUrl || it.gambarUrl) && (
                            <div className="grid grid-cols-2 gap-2">
                              {it.bentukUrl && (
                                <div className="bg-white border border-[#EADCC8] rounded-xl p-2 text-center">
                                  <span className="text-[10px] font-bold text-[#8C6D62] block mb-1">
                                    Bentuk Kustom
                                  </span>
                                  <img
                                    src={it.bentukUrl}
                                    alt="Bentuk Kustom"
                                    className="w-full h-16 object-contain rounded-lg"
                                  />
                                </div>
                              )}
                              {it.gambarUrl && (
                                <div className="bg-white border border-[#EADCC8] rounded-xl p-2 text-center">
                                  <span className="text-[10px] font-bold text-[#8C6D62] block mb-1">
                                    Gambar Kustom
                                  </span>
                                  <img
                                    src={it.gambarUrl}
                                    alt="Gambar Kustom"
                                    className="w-full h-16 object-contain rounded-lg"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-7 space-y-3">
                          {it.tulisan_kue && (
                            <div className="p-3.5 rounded-xl bg-white border border-[#EADCC8] text-xs">
                              <span className="font-bold block text-[#8C6D62] text-[10px] uppercase tracking-wider">
                                Pesan / Tulisan di Kue
                              </span>
                              <span className="font-serif font-bold text-[#2D1E1B] text-base italic mt-1 block">
                                &ldquo;{it.tulisan_kue}&rdquo;
                              </span>
                            </div>
                          )}

                          {it.catatan && (
                            <div className="p-3.5 rounded-xl bg-white border border-[#EADCC8] text-xs">
                              <span className="font-bold block text-[#8C6D62] text-[10px] uppercase tracking-wider">
                                Catatan Tambahan
                              </span>
                              <p className="font-medium text-[#4A2E2B] italic mt-1">
                                &ldquo;{it.catatan}&rdquo;
                              </p>
                            </div>
                          )}

                          {it.pilihan?.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-white border border-[#EADCC8] space-y-2">
                              <span className="font-bold text-[#8C6D62] block text-[10px] uppercase tracking-wider">
                                Komposisi &amp; Pilihan Desain
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {it.pilihan.map((p, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28]"
                                  >
                                    <span className="text-[#8C6D62] text-[10px]">{p.nama_grup}:</span>
                                    <strong>{p.nama_item}</strong>
                                    {p.jumlah > 1 && (
                                      <span className="text-[10px] text-[#C59B62]">({p.jumlah}x)</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Schedule & Delivery / Pickup Section */}
            <section className="bg-[#FFFDF9] rounded-3xl border border-[#EADCC8] shadow-[0_8px_28px_rgba(61,43,40,0.04)] p-6 sm:p-7 space-y-5">
              <div className="border-b border-[#F2E6D8] pb-4">
                <h2 className="font-serif font-bold text-xl text-[#2D1E1B] flex items-center gap-2.5">
                  <i className="fa-solid fa-location-dot text-[#C59B62]" />
                  <span>Jadwal &amp; Lokasi {pesanan.metode_pengiriman === "Kirim" ? "Pengiriman" : "Pengambilan"}</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pesanan.metode_pengiriman === "Kirim" ? (
                  <>
                    <div className="bg-[#FAF7F2] border border-[#EADCC8] rounded-2xl p-4 space-y-3 text-xs text-[#4A2E2B]">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#9E3B42]/10 text-[#9E3B42] flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-truck" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D62] block">
                            Metode Pengiriman
                          </span>
                          <span className="font-bold text-sm text-[#2D1E1B] block mt-0.5">
                            Pengiriman Kurir Toko
                          </span>
                          {pesanan.jarak_km && (
                            <span className="text-[#8C6D62] block mt-0.5">
                              Jarak Pengiriman: {pesanan.jarak_km} km
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3 pt-3 border-t border-[#EADCC8]">
                        <div className="w-8 h-8 rounded-xl bg-[#C59B62]/15 text-[#8C6936] flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-calendar-check" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D62] block">
                            Estimasi Tiba
                          </span>
                          <span className="font-bold text-sm text-[#2D1E1B] block mt-0.5">
                            {teksJadwalKirim || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FAF7F2] border border-[#EADCC8] rounded-2xl p-4 text-xs text-[#4A2E2B] flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#9E3B42]/10 text-[#9E3B42] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-house" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D62] block">
                          Alamat Tujuan
                        </span>
                        <p className="font-semibold text-[#2D1E1B] mt-1 leading-relaxed">
                          {pesanan.alamat || "-"}
                        </p>
                        {pesanan.patokan && (
                          <p className="text-[#8C6D62] text-[11px] mt-1">
                            Patokan: {pesanan.patokan}
                          </p>
                        )}
                        {pesanan.lat_tujuan && pesanan.lng_tujuan && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${pesanan.lat_tujuan},${pesanan.lng_tujuan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-bold text-[#9E3B42] hover:underline"
                          >
                            <i className="fa-solid fa-map-location-dot" />
                            <span>Buka di Google Maps</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-[#FAF7F2] border border-[#EADCC8] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#4A2E2B]">
                      <div className="w-8 h-8 rounded-xl bg-[#9E3B42]/10 text-[#9E3B42] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-calendar" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D62] block">
                          Jadwal Pengambilan
                        </span>
                        <span className="font-bold text-[#2D1E1B] text-sm block mt-1">
                          {formatTanggalIndonesia(pesanan.tanggal_ambil)}
                        </span>
                        <span className="text-[#6B5249] font-semibold block mt-0.5">
                          Pukul {pesanan.jam_ambil?.slice(0, 5)} WIB
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#FAF7F2] border border-[#EADCC8] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#4A2E2B]">
                      <div className="w-8 h-8 rounded-xl bg-[#C59B62]/15 text-[#8C6936] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-store" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D62] block">
                          Lokasi Toko
                        </span>
                        <span className="font-bold text-[#2D1E1B] text-sm block mt-1">
                          {pengaturan?.nama_toko || "Cravely Bakery"}
                        </span>
                        {pengaturan?.alamat && (
                          <p className="text-[#4A2E2B] mt-1 leading-relaxed">{pengaturan.alamat}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Order Timeline Section */}
            <section className="bg-[#FFFDF9] rounded-3xl border border-[#EADCC8] shadow-[0_8px_28px_rgba(61,43,40,0.04)] p-6 sm:p-7 space-y-5">
              <div className="border-b border-[#F2E6D8] pb-4">
                <h2 className="font-serif font-bold text-xl text-[#2D1E1B] flex items-center gap-2.5">
                  <i className="fa-solid fa-clock-rotate-left text-[#C59B62]" />
                  <span>Riwayat Perjalanan Pesanan</span>
                </h2>
              </div>

              {riwayatUrut.length === 0 ? (
                <p className="text-xs text-[#8C6D62]">Belum ada catatan riwayat status.</p>
              ) : (
                <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EADCC8]">
                  {riwayatUrut.map((r, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={r.id || idx} className="relative">
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isLatest
                              ? "bg-[#9E3B42] border-[#FFFDF9] ring-2 ring-[#9E3B42]/25"
                              : "bg-[#FFFDF9] border-[#C59B62]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLatest ? "bg-white" : "bg-[#C59B62]"
                            }`}
                          />
                        </div>
                        <div className="bg-[#FAF7F2] border border-[#EADCC8] rounded-2xl px-4 py-3">
                          <span className="font-bold text-xs sm:text-sm text-[#2D1E1B] block">
                            {r.keterangan}
                          </span>
                          <span className="text-[11px] text-[#8C6D62] mt-1 block">
                            {formatTanggalWaktu(r.dibuat_pada)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Sticky Sidebar: Payment Summary & QR Ticket */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Payment Summary & Action */}
            <section className="bg-[#FFFDF9] rounded-3xl border border-[#EADCC8] shadow-[0_12px_32px_rgba(61,43,40,0.06)] p-6 space-y-5">
              <div className="border-b border-[#F2E6D8] pb-3.5">
                <h2 className="font-serif font-bold text-xl text-[#2D1E1B] flex items-center gap-2.5">
                  <i className="fa-solid fa-receipt text-[#C59B62]" />
                  <span>Rincian Tagihan</span>
                </h2>
              </div>

              <div className="space-y-2.5 text-xs divide-y divide-[#F2E6D8]">
                <div className="flex justify-between items-center pb-2.5 text-[#4A2E2B]">
                  <span>Total Kue</span>
                  <span className="font-bold text-[#2D1E1B] lining-nums tabular-nums">
                    {formatRupiah(pesanan.total_kue)}
                  </span>
                </div>

                {pesanan.ongkir > 0 && (
                  <div className="flex justify-between items-center py-2.5 text-[#4A2E2B]">
                    <span>Ongkos Kirim</span>
                    <span className="font-bold text-[#2D1E1B] lining-nums tabular-nums">
                      {formatRupiah(pesanan.ongkir)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 font-bold text-sm text-[#2D1E1B]">
                  <span>Total Bayar</span>
                  <span className="text-[#9E3B42] text-lg font-black lining-nums tabular-nums">
                    {formatRupiah(pesanan.total_bayar)}
                  </span>
                </div>

                {pesanan.persen_dp_saat_pesan && (
                  <div className="flex justify-between items-center py-2.5 text-[#6B5249]">
                    <span>Uang Muka (DP {pesanan.persen_dp_saat_pesan}%)</span>
                    <span className="font-bold lining-nums tabular-nums">
                      {formatRupiah(pesanan.jumlah_dp)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2.5 text-[#6B5249]">
                  <span>Sudah Dibayar</span>
                  <span className="font-bold text-emerald-700 lining-nums tabular-nums">
                    {formatRupiah(pesanan.jumlah_terbayar || 0)}
                  </span>
                </div>

                {!isDibatalkan && (
                  <div className="pt-3">
                    {sisaBayar > 0 ? (
                      <div className="flex justify-between items-center text-[#9A3412] font-bold text-sm bg-amber-50 px-3.5 py-2.5 rounded-xl border border-amber-200">
                        <span>Sisa Pelunasan</span>
                        <span className="lining-nums tabular-nums">{formatRupiah(sisaBayar)}</span>
                      </div>
                    ) : (
                      <div className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-2.5 rounded-xl border border-emerald-200">
                        <i className="fa-solid fa-circle-check mr-1.5" />
                        Pembayaran Sudah Lunas
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#F2E6D8]">
                <TombolBayarMidtrans
                  pesanan={pesanan}
                  batasBayarIso={batasBayarIso}
                  transferManualAktif={Boolean(pengaturan?.transfer_manual_aktif)}
                  pengaturan={pengaturan}
                />
              </div>
            </section>

            {/* QR Pickup Pass */}
            <section className="bg-[#FFFDF9] rounded-3xl border border-[#EADCC8] shadow-[0_8px_28px_rgba(61,43,40,0.04)] p-6 text-center space-y-4">
              <div className="flex items-center justify-between text-left border-b border-[#F2E6D8] pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D62] block">
                    Pas Pengambilan
                  </span>
                  <h3 className="font-serif font-bold text-base text-[#2D1E1B]">
                    Kode QR Pesanan
                  </h3>
                </div>
                <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#FAF4ED] border border-[#EADCC8] text-[#5A3B33]">
                  {pesanan.kode_pesanan}
                </span>
              </div>

              <div
                className={`inline-flex p-3 bg-white rounded-2xl border border-[#EADCC8] shadow-xs ${
                  isDibatalkan ? "opacity-35 grayscale" : ""
                }`}
              >
                <img
                  src={qrDataUrl}
                  alt={`QR ${pesanan.kode_pesanan}`}
                  className="w-36 h-36 rounded-lg"
                />
              </div>

              <p className="text-xs text-[#6B5249] leading-relaxed">
                {isDibatalkan
                  ? "Pesanan telah dibatalkan sehingga kode QR ini tidak lagi berlaku."
                  : "Tunjukkan QR ini kepada staf kasir saat mengambil kue di toko."}
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
