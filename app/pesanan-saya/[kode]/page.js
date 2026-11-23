import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import PreviewKue from "@/components/PreviewKue";
import { BadgeStatusPesanan, BadgeStatusBayar } from "@/components/BadgeStatus";
import TombolBayarMidtrans from "@/components/TombolBayarMidtrans";
import { formatRupiah, formatTanggalIndonesia, formatTanggalWaktu } from "@/lib/format";

export const metadata = {
  title: "Tiket Pesanan - Toko Kue Custom",
};

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
    redirect("/pesanan-saya");
  }

  const { data: pengaturan } = await supabaseAdmin
    .from("pengaturan_toko")
    .select("*")
    .eq("id", 1)
    .single();

  const qrDataUrl = await QRCode.toDataURL(pesanan.kode_pesanan, {
    width: 220,
    margin: 2,
    color: {
      dark: "#1c1917",
      light: "#ffffff",
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

  return (
    <div className="min-h-screen bg-[#faf6ef] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/pesanan-saya"
            className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 transition"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Kembali ke Daftar Pesanan</span>
          </Link>

          <span className="text-xs text-stone-500 font-medium">
            Tiket Digital Pelanggan
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between pb-6 border-b border-stone-100 gap-6">
            <div className="text-center md:text-left">
              <span className="text-xs uppercase tracking-wider font-bold text-stone-400">
                Kode Pesanan
              </span>
              <h1 className="text-3xl font-black text-stone-900 mt-1">
                {pesanan.kode_pesanan}
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Dipesan pada {formatTanggalWaktu(pesanan.dibuat_pada)}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                <BadgeStatusPesanan status={pesanan.status_pesanan} />
                <BadgeStatusBayar status={pesanan.status_bayar} />
              </div>
            </div>

            <div className="flex flex-col items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <img
                src={qrDataUrl}
                alt={`QR ${pesanan.kode_pesanan}`}
                className="w-36 h-36 rounded-xl"
              />
              <span className="text-[11px] font-bold text-stone-600 mt-1">
                Tunjukkan QR saat Pengambilan
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-stone-100 items-start">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Isi Pesanan ({itemsWithUrls.length})
              </h3>

              <div className="space-y-4">
                {itemsWithUrls.map((it, idx) => {
                  const isCustom = it.jenis === "Custom";
                  const itTeks = (it.desain_json?.items || []).filter((x) => x.type === "text" || (x.t === "text" && x.text));
                  const itStiker = (it.desain_json?.items || []).filter((x) => x.type === "sticker" || x.t === "emoji");

                  return (
                    <div
                      key={it.id || idx}
                      className="bg-amber-50/40 rounded-2xl p-4 border border-amber-100/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCustom ? "bg-amber-100 text-amber-900" : "bg-sky-100 text-sky-900"
                        }`}>
                          {isCustom ? "Kue Custom" : "Kue Katalog"}
                        </span>
                        <span className="text-xs font-bold text-stone-900 lining-nums tabular-nums">
                          {formatRupiah(it.subtotal)}
                        </span>
                      </div>

                      <div className="font-bold text-sm text-stone-900">
                        {it.nama_item} {it.jumlah > 1 ? `(${it.jumlah}x)` : ""}
                      </div>

                      {isCustom ? (
                        <div className="space-y-3">
                          <div className="flex justify-center bg-white rounded-xl p-3 border border-stone-100">
                            {it.prevUrl ? (
                              <img
                                src={it.prevUrl}
                                alt="Snapshot Desain 3D"
                                className="w-full max-w-[220px] h-auto object-contain rounded-lg drop-shadow-sm"
                              />
                            ) : (
                              <PreviewKue
                                pilihan={it.pilihan || []}
                                tulisan={it.tulisan_kue || ""}
                                className="w-full max-w-[180px]"
                              />
                            )}
                          </div>

                          {(it.bentukUrl || it.gambarUrl) && (
                            <div className="flex gap-2">
                              {it.bentukUrl && (
                                <div className="flex-1 bg-white border border-stone-100 rounded-xl p-2 text-center">
                                  <span className="text-[10px] font-bold text-stone-400 block mb-1">
                                    Bentuk Kustom
                                  </span>
                                  <img
                                    src={it.bentukUrl}
                                    alt="Bentuk Kustom"
                                    className="w-full h-16 object-contain rounded"
                                  />
                                </div>
                              )}
                              {it.gambarUrl && (
                                <div className="flex-1 bg-white border border-stone-100 rounded-xl p-2 text-center">
                                  <span className="text-[10px] font-bold text-stone-400 block mb-1">
                                    Gambar Kustom
                                  </span>
                                  <img
                                    src={it.gambarUrl}
                                    alt="Gambar Kustom"
                                    className="w-full h-16 object-contain rounded"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {it.tulisan_kue && (
                            <div className="p-2.5 rounded-xl bg-white border border-stone-100 text-xs">
                              <span className="font-semibold block text-stone-400 text-[10px]">Tulisan di Kue:</span>
                              <span className="font-bold text-[#17382d] text-xs italic mt-0.5 block">
                                &ldquo;{it.tulisan_kue}&rdquo;
                              </span>
                            </div>
                          )}

                          {it.catatan && (
                            <div className="p-2.5 rounded-xl bg-white border border-stone-100 text-xs">
                              <span className="font-semibold block text-stone-400 text-[10px]">Catatan:</span>
                              <p className="font-medium text-stone-700 italic mt-0.5">&ldquo;{it.catatan}&rdquo;</p>
                            </div>
                          )}

                          {it.pilihan?.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-white border border-stone-100 text-[11px] space-y-1">
                              <span className="font-bold text-stone-400 block text-[10px] uppercase">Pilihan Opsi:</span>
                              {it.pilihan.map((p, i) => (
                                <div key={i} className="flex justify-between text-stone-700">
                                  <span>{p.nama_grup}: <strong>{p.nama_item}</strong></span>
                                  {p.jumlah > 1 && <span>x{p.jumlah}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-100">
                          <div className="w-16 h-16 rounded-lg bg-stone-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {it.prodUrl ? (
                              <img src={it.prodUrl} alt={it.nama_item} className="w-full h-full object-cover" />
                            ) : (
                              <i className="fa-solid fa-cake-candles text-stone-300 text-xl" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-stone-900">{it.nama_item}</p>
                            <p className="text-[11px] text-stone-500 mt-0.5 lining-nums tabular-nums">
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

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Rincian Tagihan
              </h3>
              <div className="divide-y divide-stone-100 text-xs">
                {itemsWithUrls.map((it, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase">
                        {it.jenis === "Custom" ? "Kue Custom" : "Kue Katalog"}
                      </span>
                      <span className="font-semibold text-stone-800">
                        {it.nama_item} {it.jumlah > 1 ? `x ${it.jumlah}` : ""}
                      </span>
                    </div>
                    <span className="font-medium text-stone-700 lining-nums tabular-nums">
                      {formatRupiah(it.subtotal)}
                    </span>
                  </div>
                ))}

                {pesanan.metode_pengiriman === "Kirim" && (
                  <div className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase">
                        Pengiriman
                      </span>
                      <span className="font-semibold text-stone-800">
                        {pesanan.zona_ongkir?.nama || "Ongkos Kirim"}
                      </span>
                    </div>
                    <span className="font-medium text-stone-700 lining-nums tabular-nums">
                      {formatRupiah(pesanan.ongkir)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Total Kue:</span>
                  <span className="font-bold text-stone-900 lining-nums tabular-nums">{formatRupiah(pesanan.total_kue)}</span>
                </div>
                {pesanan.ongkir > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Ongkos Kirim:</span>
                    <span className="font-bold text-stone-900 lining-nums tabular-nums">{formatRupiah(pesanan.ongkir)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-100">
                  <span>Total Bayar:</span>
                  <span className="text-rose-600 lining-nums tabular-nums">{formatRupiah(pesanan.total_bayar)}</span>
                </div>
                {pesanan.persen_dp_saat_pesan && (
                  <div className="flex justify-between text-stone-600 pt-1">
                    <span>Jumlah DP ({pesanan.persen_dp_saat_pesan}%):</span>
                    <span className="font-bold text-stone-800 lining-nums tabular-nums">{formatRupiah(pesanan.jumlah_dp)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Sudah Dibayar:</span>
                  <span className="font-semibold text-emerald-700 lining-nums tabular-nums">
                    {formatRupiah(pesanan.jumlah_terbayar || 0)}
                  </span>
                </div>
                {sisaBayar > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold pt-1">
                    <span>Sisa Tagihan:</span>
                    <span className="lining-nums tabular-nums">{formatRupiah(sisaBayar)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">
                Jadwal & Lokasi
              </h3>
              <div className="space-y-2 text-xs text-stone-700">
                <div className="flex items-start space-x-2">
                  <i className="fa-solid fa-calendar text-rose-500 mt-0.5"></i>
                  <span>
                    Tanggal: <strong>{formatTanggalIndonesia(pesanan.tanggal_ambil)}</strong>
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <i className="fa-solid fa-clock text-rose-500 mt-0.5"></i>
                  <span>
                    Jam: <strong>Pukul {pesanan.jam_ambil?.slice(0, 5)} WIB</strong>
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <i className="fa-solid fa-location-dot text-rose-500 mt-0.5"></i>
                  <div>
                    <span>Pengambilan: </span>
                    <strong>
                      {pesanan.metode_pengiriman === "Ambil" ? "Ambil di Toko" : "Kirim ke Alamat"}
                    </strong>
                    {pesanan.alamat && (
                      <p className="text-stone-500 mt-1">{pesanan.alamat}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">
                Pembayaran
              </h3>
              <TombolBayarMidtrans pesanan={pesanan} />
            </div>
          </div>

          <div className="pt-6">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">
              Riwayat Status Pesanan
            </h3>
            {riwayatUrut.length === 0 ? (
              <p className="text-xs text-stone-400">Belum ada catatan riwayat status.</p>
            ) : (
              <div className="space-y-3">
                {riwayatUrut.map((r, idx) => (
                  <div key={r.id || idx} className="flex items-start space-x-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                      <span className="font-semibold text-stone-800">{r.keterangan}</span>
                      <span className="text-stone-400 ml-2">
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
  );
}
