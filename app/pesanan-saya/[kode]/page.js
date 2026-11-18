import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import PreviewKue from "@/components/PreviewKue";
import { BadgeStatusPesanan, BadgeStatusBayar } from "@/components/BadgeStatus";
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

  return (
    <div className="min-h-screen bg-amber-50 py-8 px-4">
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
                Preview Kue Dipesan
              </h3>
              <div className="bg-amber-50/50 rounded-2xl p-4 flex items-center justify-center">
                <PreviewKue
                  pilihan={pesanan.pesanan_pilihan || []}
                  tulisan={pesanan.tulisan_kue || ""}
                  className="w-full"
                />
              </div>

              {pesanan.tulisan_kue && (
                <div className="p-3 rounded-xl bg-stone-50 text-xs text-stone-700">
                  <span className="font-semibold block text-stone-500">Tulisan di Kue:</span>
                  <span className="font-bold text-rose-600 text-sm mt-0.5 block">
                    &ldquo;{pesanan.tulisan_kue}&rdquo;
                  </span>
                </div>
              )}

              {pesanan.catatan && (
                <div className="p-3 rounded-xl bg-stone-50 text-xs text-stone-700">
                  <span className="font-semibold block text-stone-500">Catatan Khusus:</span>
                  <span>{pesanan.catatan}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Rincian Komponen
              </h3>
              <div className="divide-y divide-stone-100 text-xs">
                {(pesanan.pesanan_pilihan || []).map((pilihan) => (
                  <div key={pilihan.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase">
                        {pilihan.nama_grup}
                      </span>
                      <span className="font-semibold text-stone-800">
                        {pilihan.nama_item}
                      </span>
                    </div>
                    <span className="font-medium text-stone-700">
                      {formatRupiah(pilihan.harga)}
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
                    <span className="font-medium text-stone-700">
                      {formatRupiah(pesanan.ongkir)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Total Kue:</span>
                  <span>{formatRupiah(pesanan.total_kue)}</span>
                </div>
                {pesanan.ongkir > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Ongkos Kirim:</span>
                    <span>{formatRupiah(pesanan.ongkir)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-100">
                  <span>Total Bayar:</span>
                  <span className="text-rose-600">{formatRupiah(pesanan.total_bayar)}</span>
                </div>
                {pesanan.persen_dp_saat_pesan && (
                  <div className="flex justify-between text-stone-600 pt-1">
                    <span>Jumlah DP ({pesanan.persen_dp_saat_pesan}%):</span>
                    <span>{formatRupiah(pesanan.jumlah_dp)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Sudah Dibayar:</span>
                  <span className="font-semibold text-emerald-700">
                    {formatRupiah(pesanan.jumlah_terbayar || 0)}
                  </span>
                </div>
                {sisaBayar > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold pt-1">
                    <span>Sisa Pelunasan:</span>
                    <span>{formatRupiah(sisaBayar)}</span>
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
                Informasi Pembayaran
              </h3>
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-100 text-xs text-stone-700 space-y-2">
                <p>
                  Silakan transfer sesuai tagihan ke rekening resmi toko:
                </p>
                <div className="font-semibold text-stone-900">
                  <span className="block">{pengaturan?.nama_bank || "BCA"}</span>
                  <span className="text-sm font-extrabold text-rose-700">
                    {pengaturan?.no_rekening || "1234567890"}
                  </span>
                  <span className="block text-[11px] text-stone-500">
                    a.n. {pengaturan?.atas_nama || "Dapur Manis"}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Setelah transfer, bukti pembayaran dapat dikonfirmasi oleh admin toko.
                </p>
              </div>
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
