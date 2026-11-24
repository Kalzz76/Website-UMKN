import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import PreviewKue from "@/components/PreviewKue";
import { BadgeStatusPesanan, BadgeStatusBayar } from "@/components/BadgeStatus";
import TombolBayarMidtrans from "@/components/TombolBayarMidtrans";
import { formatRupiah, formatTanggal, formatTanggalIndonesia, formatTanggalWaktu } from "@/lib/format";

export const metadata = {
  title: "Tiket Digital Pesanan - Cravely Bakery",
};

function formatRentangTanggal(awal, akhir) {
  if (!awal) return "";
  if (!akhir || awal === akhir) return formatTanggalIndonesia(awal);
  const [y1, m1, d1] = awal.split("-").map(Number);
  const [y2, m2, d2] = akhir.split("-").map(Number);
  const dt1 = new Date(Date.UTC(y1, m1 - 1, d1));
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
    width: 260,
    margin: 2,
    color: {
      dark: "#2D1E1B",
      light: "#FFFFFF",
    },
  });

  const riwayatUrut = (pesanan.riwayat_pesanan || []).sort(
    (a, b) => new Date(a.dibuat_pada) - new Date(b.dibuat_pada)
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

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 sm:py-12 px-3 sm:px-6 font-sans text-[#2D1E1B]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/user?tab=pesanan"
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border border-[#D9C5B2] text-[#3D2B28] bg-white hover:bg-[#F5ECE2] shadow-xs transition"
          >
            <i className="fa-solid fa-arrow-left text-[#C59B62]" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            {linkWaBantuan && (
              <a
                href={linkWaBantuan}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full bg-[#EBF5EE] text-[#1D603B] border border-[#B9E1C8] hover:bg-[#DDF0E3] transition shadow-xs"
              >
                <i className="fa-brands fa-whatsapp text-sm" />
                <span>Bantuan Toko</span>
              </a>
            )}
            <span className="text-xs font-extrabold text-[#8C6D62] tracking-wider uppercase bg-[#F0E4D7] px-3 py-1.5 rounded-full border border-[#E2D2BE]">
              Tiket Digital Pelanggan
            </span>
          </div>
        </div>

        {pesanan.perlu_refund && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm flex items-start gap-3">
            <i className="fa-solid fa-circle-exclamation text-amber-600 text-lg mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Pemberitahuan Pengembalian Dana</h4>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                Pembayaran diterima setelah pesanan dibatalkan; toko akan menghubungi Anda.
              </p>
            </div>
          </div>
        )}

        <div className="bg-[#FFFDF9] rounded-3xl border-2 border-[#EADCC8] shadow-[0_20px_50px_rgba(45,20,15,0.08)] overflow-hidden">
          <div className="bg-gradient-to-r from-[#2D1E1B] via-[#3E2A27] to-[#2D1E1B] text-[#FFFDF9] p-6 sm:p-8 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#E5BF88] tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#E5BF88] animate-pulse" />
                  <span>{pengaturan?.nama_toko || "CRAVELY BAKERY"} · TIKET PESANAN</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#FFFDF9] tracking-tight mt-1.5">
                  {pesanan.kode_pesanan}
                </h1>
                <p className="text-xs text-[#D9C5B2] mt-1">
                  Dipesan pada {formatTanggalWaktu(pesanan.dibuat_pada)}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <BadgeStatusPesanan status={pesanan.status_pesanan} />
                  <BadgeStatusBayar status={pesanan.status_bayar} />
                </div>
              </div>

              <div className="bg-[#FFFDF9]/10 backdrop-blur-md border border-[#FFFDF9]/20 p-4 rounded-2xl flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-[#D9C5B2] uppercase font-bold block">Pemesan</span>
                  <span className="font-bold text-[#FFFDF9] text-sm block">{pesanan.nama_penerima}</span>
                  <span className="text-[#E5BF88] block text-[11px]">{pesanan.no_wa_penerima}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#C59B62]/20 border border-[#C59B62]/40 flex items-center justify-center text-[#F6E3BA] text-lg">
                  <i className="fa-solid fa-receipt" />
                </div>
              </div>
            </div>
          </div>

          {pesanan.status_pesanan === "Menunggu Pembayaran" && (
            <div className="bg-[#FFF8E7] border-b border-[#F4E1B3] px-6 py-3.5 flex items-center gap-3 text-xs text-[#7A4B06]">
              <i className="fa-solid fa-clock text-amber-600 text-sm shrink-0" />
              <p className="font-semibold">
                Pesanan sedang menunggu pembayaran. Selesaikan sebelum batas waktu agar dapur kami segera memproses pesanan Anda.
              </p>
            </div>
          )}

          {pesanan.status_pesanan === "Siap" && (
            <div className="bg-[#ECFDF5] border-b border-[#A7F3D0] px-6 py-3.5 flex items-center gap-3 text-xs text-[#065F46]">
              <i className="fa-solid fa-circle-check text-emerald-600 text-sm shrink-0" />
              <p className="font-semibold">
                Kue Anda sudah selesai dibuat dan siap diambil di toko! Tunjukkan kode QR di samping kepada staf kasir.
              </p>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#2D1E1B] flex items-center gap-2 mb-4">
                    <i className="fa-solid fa-cake-candles text-[#C59B62]" />
                    <span>Rincian Kue & Isi Pesanan ({itemsWithUrls.length})</span>
                  </h3>

                  <div className="space-y-4">
                    {itemsWithUrls.map((it, idx) => {
                      const isCustom = it.jenis === "Custom";

                      return (
                        <div
                          key={it.id || idx}
                          className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#EADCC8] space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                                isCustom
                                  ? "bg-[#F3E7D3] text-[#6B4B1C] border border-[#DFCBB0]"
                                  : "bg-[#E6F0FA] text-[#1D4E89] border border-[#C5DCF2]"
                              }`}
                            >
                              {isCustom ? "Kue Custom" : "Kue Katalog"}
                            </span>
                            <span className="text-sm font-black text-[#2D1E1B] lining-nums tabular-nums">
                              {formatRupiah(it.subtotal)}
                            </span>
                          </div>

                          <div className="font-serif font-bold text-base text-[#2D1E1B]">
                            {it.nama_item} {it.jumlah > 1 ? `(${it.jumlah}x)` : ""}
                          </div>

                          {isCustom ? (
                            <div className="space-y-3">
                              <div className="flex justify-center bg-white rounded-2xl p-4 border border-[#EADCC8] shadow-inner">
                                {it.prevUrl ? (
                                  <img
                                    src={it.prevUrl}
                                    alt="Snapshot Desain 3D"
                                    className="w-full max-w-[240px] h-auto object-contain rounded-xl drop-shadow-md"
                                  />
                                ) : (
                                  <PreviewKue
                                    pilihan={it.pilihan || []}
                                    tulisan={it.tulisan_kue || ""}
                                    className="w-full max-w-[200px]"
                                  />
                                )}
                              </div>

                              {(it.bentukUrl || it.gambarUrl) && (
                                <div className="grid grid-cols-2 gap-2">
                                  {it.bentukUrl && (
                                    <div className="bg-white border border-[#EADCC8] rounded-xl p-2.5 text-center">
                                      <span className="text-[10px] font-bold text-[#8C6D62] block mb-1">
                                        Bentuk Kustom
                                      </span>
                                      <img
                                        src={it.bentukUrl}
                                        alt="Bentuk Kustom"
                                        className="w-full h-20 object-contain rounded-lg"
                                      />
                                    </div>
                                  )}
                                  {it.gambarUrl && (
                                    <div className="bg-white border border-[#EADCC8] rounded-xl p-2.5 text-center">
                                      <span className="text-[10px] font-bold text-[#8C6D62] block mb-1">
                                        Gambar Kustom
                                      </span>
                                      <img
                                        src={it.gambarUrl}
                                        alt="Gambar Kustom"
                                        className="w-full h-20 object-contain rounded-lg"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {it.tulisan_kue && (
                                <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#EADCC8] text-xs">
                                  <span className="font-bold block text-[#8C6D62] text-[10px] uppercase tracking-wider">
                                    Pesan / Tulisan di Kue:
                                  </span>
                                  <span className="font-serif font-bold text-[#2D1E1B] text-sm italic mt-1 block">
                                    &ldquo;{it.tulisan_kue}&rdquo;
                                  </span>
                                </div>
                              )}

                              {it.catatan && (
                                <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#EADCC8] text-xs">
                                  <span className="font-bold block text-[#8C6D62] text-[10px] uppercase tracking-wider">
                                    Catatan Tambahan:
                                  </span>
                                  <p className="font-medium text-[#4A2E2B] italic mt-0.5">
                                    &ldquo;{it.catatan}&rdquo;
                                  </p>
                                </div>
                              )}

                              {it.pilihan?.length > 0 && (
                                <div className="p-3 rounded-xl bg-white border border-[#EADCC8] space-y-2">
                                  <span className="font-bold text-[#8C6D62] block text-[10px] uppercase tracking-wider">
                                    Komposisi & Pilihan Desain:
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
                          ) : (
                            <div className="flex items-center gap-3.5 bg-white p-3.5 rounded-xl border border-[#EADCC8]">
                              <div className="w-16 h-16 rounded-xl bg-[#FAF7F2] overflow-hidden flex items-center justify-center shrink-0 border border-[#EADCC8]">
                                {it.prodUrl ? (
                                  <img
                                    src={it.prodUrl}
                                    alt={it.nama_item}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <i className="fa-solid fa-cake-candles text-[#D9C5B2] text-xl" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#2D1E1B]">{it.nama_item}</p>
                                <p className="text-xs text-[#8C6D62] mt-0.5 lining-nums tabular-nums">
                                  {formatRupiah(it.harga_satuan)} x {it.jumlah}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#FAF7F2] border-2 border-dashed border-[#D9C5B2] rounded-3xl p-6 text-center flex flex-col items-center justify-center space-y-3.5">
                  <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-[#EADCC8]">
                    <img
                      src={qrDataUrl}
                      alt={`QR ${pesanan.kode_pesanan}`}
                      className="w-44 h-44 rounded-xl"
                    />
                  </div>
                  <div>
                    <span className="font-serif font-extrabold text-sm text-[#2D1E1B] block">
                      QR Pas Pengambilan
                    </span>
                    <span className="text-xs text-[#6B5249] block mt-0.5">
                      Tunjukkan QR ini ke staf kasir toko saat mengambil kue Anda.
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#EADCC8] w-full text-center">
                    <span className="text-[11px] font-mono font-bold text-[#8C6D62] tracking-wider">
                      ID: {pesanan.kode_pesanan}
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF7F2] border border-[#EADCC8] rounded-3xl p-5 sm:p-6 space-y-4">
                  <h3 className="font-serif font-bold text-base text-[#2D1E1B] flex items-center gap-2">
                    <i className="fa-solid fa-receipt text-[#C59B62]" />
                    <span>Rincian Tagihan</span>
                  </h3>

                  <div className="space-y-2 text-xs divide-y divide-[#EADCC8]/60">
                    <div className="flex justify-between items-center pb-2 text-[#4A2E2B]">
                      <span>Total Kue:</span>
                      <span className="font-bold text-[#2D1E1B] lining-nums tabular-nums">
                        {formatRupiah(pesanan.total_kue)}
                      </span>
                    </div>

                    {pesanan.ongkir > 0 && (
                      <div className="flex justify-between items-center py-2 text-[#4A2E2B]">
                        <span>Ongkos Kirim:</span>
                        <span className="font-bold text-[#2D1E1B] lining-nums tabular-nums">
                          {formatRupiah(pesanan.ongkir)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 font-bold text-sm text-[#2D1E1B]">
                      <span>Total Bayar:</span>
                      <span className="text-[#9E3B42] text-base font-black lining-nums tabular-nums">
                        {formatRupiah(pesanan.total_bayar)}
                      </span>
                    </div>

                    {pesanan.persen_dp_saat_pesan && (
                      <div className="flex justify-between items-center py-2 text-[#6B5249]">
                        <span>Uang Muka (DP {pesanan.persen_dp_saat_pesan}%):</span>
                        <span className="font-bold lining-nums tabular-nums">
                          {formatRupiah(pesanan.jumlah_dp)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2 text-[#6B5249]">
                      <span>Sudah Dibayar:</span>
                      <span className="font-bold text-emerald-700 lining-nums tabular-nums">
                        {formatRupiah(pesanan.jumlah_terbayar || 0)}
                      </span>
                    </div>

                    {sisaBayar > 0 ? (
                      <div className="flex justify-between items-center pt-2 text-[#B45309] font-bold text-sm bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        <span>Sisa Pelunasan:</span>
                        <span className="lining-nums tabular-nums">{formatRupiah(sisaBayar)}</span>
                      </div>
                    ) : (
                      <div className="pt-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
                        <i className="fa-solid fa-circle-check mr-1.5" />
                        Pembayaran Sudah Lunas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#EADCC8]">
              <div className="bg-[#FAF7F2] border border-[#EADCC8] rounded-3xl p-5 sm:p-6 space-y-3.5">
                <h3 className="font-serif font-bold text-base text-[#2D1E1B] flex items-center gap-2">
                  <i className="fa-solid fa-location-dot text-[#C59B62]" />
                  <span>Jadwal & Pengambilan</span>
                </h3>

                <div className="space-y-3 text-xs text-[#4A2E2B]">
                  {pesanan.metode_pengiriman === "Kirim" ? (
                    <>
                      <div className="flex items-start gap-2.5">
                        <i className="fa-solid fa-truck text-[#9E3B42] mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-[#2D1E1B] block">Pengiriman Kurir Toko</span>
                          {pesanan.jarak_km && (
                            <span className="text-[#8C6D62] block mt-0.5">Jarak Pengiriman: {pesanan.jarak_km} km</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <i className="fa-solid fa-calendar-check text-[#9E3B42] mt-0.5 shrink-0" />
                        <span className="font-bold text-[#2D1E1B]">{teksJadwalKirim}</span>
                      </div>
                      {pesanan.alamat && (
                        <div className="flex items-start gap-2.5 pt-2 border-t border-[#EADCC8]">
                          <i className="fa-solid fa-house text-[#9E3B42] mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold text-[#2D1E1B] block">Alamat Tujuan:</span>
                            <p className="text-[#4A2E2B] mt-0.5 leading-relaxed">{pesanan.alamat}</p>
                            {pesanan.patokan && (
                              <p className="text-[#8C6D62] text-[11px] mt-0.5">Patokan: {pesanan.patokan}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5">
                        <i className="fa-solid fa-calendar text-[#9E3B42] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[#8C6D62] block">Jadwal Pengambilan:</span>
                          <span className="font-bold text-[#2D1E1B] text-sm block mt-0.5">
                            {formatTanggalIndonesia(pesanan.tanggal_ambil)}
                          </span>
                          <span className="text-[#8C6D62] block mt-0.5">
                            Pukul {pesanan.jam_ambil?.slice(0, 5)} WIB
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 pt-2 border-t border-[#EADCC8]">
                        <i className="fa-solid fa-store text-[#9E3B42] mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-[#2D1E1B] block">
                            Lokasi Toko ({pengaturan?.nama_toko || "Cravely"})
                          </span>
                          {pengaturan?.alamat && (
                            <p className="text-[#4A2E2B] mt-0.5 leading-relaxed">{pengaturan.alamat}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-[#FAF7F2] border border-[#EADCC8] rounded-3xl p-5 sm:p-6 space-y-3.5 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#2D1E1B] flex items-center gap-2 mb-3">
                    <i className="fa-solid fa-credit-card text-[#C59B62]" />
                    <span>Status & Pembayaran</span>
                  </h3>
                  <p className="text-xs text-[#6B5249] leading-relaxed mb-4">
                    Pembayaran diproses aman melalui payment gateway Midtrans (QRIS, GoPay, ShopeePay, Virtual Account).
                  </p>
                </div>

                <TombolBayarMidtrans
                  pesanan={pesanan}
                  batasBayarIso={batasBayarIso}
                  transferManualAktif={Boolean(pengaturan?.transfer_manual_aktif)}
                  pengaturan={pengaturan}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-[#EADCC8] space-y-4">
              <h3 className="font-serif font-bold text-base text-[#2D1E1B] flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-[#C59B62]" />
                <span>Riwayat Perjalanan Pesanan</span>
              </h3>

              {riwayatUrut.length === 0 ? (
                <p className="text-xs text-[#8C6D62]">Belum ada catatan riwayat status.</p>
              ) : (
                <div className="space-y-3">
                  {riwayatUrut.map((r, idx) => (
                    <div
                      key={r.id || idx}
                      className="flex items-start gap-3 text-xs bg-[#FAF7F2] p-3 rounded-2xl border border-[#EADCC8]"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-[#C59B62] mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-[#2D1E1B] block">{r.keterangan}</span>
                        <span className="text-[11px] text-[#8C6D62] mt-0.5 block">
                          {formatTanggalWaktu(r.dibuat_pada)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
