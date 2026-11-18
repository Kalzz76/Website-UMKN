"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/format";
import PreviewKue from "@/components/PreviewKue";
import ModalPesan from "@/components/ModalPesan";

export default function DetailPesananDashboardPage({ params }) {
  const unwrappedParams = use(params);
  const kodePesanan = unwrappedParams.kode;

  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [profil, setProfil] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [pilihan, setPilihan] = useState([]);
  const [daftarBayar, setDaftarBayar] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [fotoReferensiUrl, setFotoReferensiUrl] = useState(null);

  const [modalBatalBuka, setModalBatalBuka] = useState(false);
  const [alasanBatal, setAlasanBatal] = useState("");
  const [sedangProses, setSedangProses] = useState(false);

  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  async function muatData() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSedangMemuat(false);
      return;
    }

    const { data: prof } = await supabase
      .from("profil")
      .select("role, nama")
      .eq("id", user.id)
      .single();

    if (prof) setProfil(prof);

    const { data: pData } = await supabase
      .from("pesanan")
      .select("*, zona_ongkir(nama)")
      .eq("kode_pesanan", kodePesanan)
      .single();

    if (!pData) {
      setSedangMemuat(false);
      return;
    }

    setPesanan(pData);

    const { data: pilData } = await supabase
      .from("pesanan_pilihan")
      .select("*")
      .eq("id_pesanan", pData.id);
    if (pilData) setPilihan(pilData);

    if (pData.foto_referensi) {
      const { data: signedRef } = await supabase.storage
        .from("referensi-kue")
        .createSignedUrl(pData.foto_referensi, 3600);
      if (signedRef) setFotoReferensiUrl(signedRef.signedUrl);
    }

    if (prof?.role === "admin") {
      const { data: bayarList } = await supabase
        .from("pembayaran")
        .select("*")
        .eq("id_pesanan", pData.id)
        .order("dibuat_pada", { ascending: false });

      if (bayarList) {
        const bayarWithUrl = [];
        for (let i = 0; i < bayarList.length; i++) {
          const item = bayarList[i];
          let url = null;
          if (item.bukti) {
            const { data: signed } = await supabase.storage
              .from("bukti-bayar")
              .createSignedUrl(item.bukti, 3600);
            if (signed) url = signed.signedUrl;
          }
          bayarWithUrl.push({ ...item, signedUrl: url });
        }
        setDaftarBayar(bayarWithUrl);
      }
    }

    const { data: rList } = await supabase
      .from("riwayat_pesanan")
      .select("*, profil(nama, role)")
      .eq("id_pesanan", pData.id)
      .order("dibuat_pada", { ascending: true });
    if (rList) setRiwayat(rList);

    setSedangMemuat(false);
  }

  useEffect(() => {
    muatData();
  }, [kodePesanan]);

  async function ubahStatusPesanan(statusBaru, alasan = "") {
    setSedangProses(true);
    const res = await fetch(`/api/pesanan/${pesanan.kode_pesanan}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status_baru: statusBaru,
        alasan_batal: alasan,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal mengubah status pesanan.",
        tipe: "error",
      });
      return;
    }

    setModalBatalBuka(false);
    setAlasanBatal("");
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function handleAksiPembayaran(idBayar, aksi) {
    const konfirm = window.confirm(
      `Apakah Anda yakin ingin ${aksi === "konfirmasi" ? "mengonfirmasi" : "menolak"} pembayaran ini?`
    );
    if (!konfirm) return;

    setSedangProses(true);
    const res = await fetch(`/api/pembayaran/${idBayar}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal memproses pembayaran.",
        tipe: "error",
      });
      return;
    }

    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  function getBadgeStatusPesanan(status) {
    if (status === "Menunggu Pembayaran") return "bg-stone-100 text-stone-700";
    if (status === "Diterima") return "bg-sky-100 text-sky-800";
    if (status === "Sedang Dibuat") return "bg-amber-100 text-amber-800";
    if (status === "Siap") return "bg-emerald-100 text-emerald-800";
    if (status === "Dikirim") return "bg-indigo-100 text-indigo-800";
    if (status === "Selesai") return "bg-green-100 text-green-800";
    return "bg-rose-100 text-rose-800";
  }

  function getBadgeStatusBayar(status) {
    if (status === "Lunas") return "bg-emerald-100 text-emerald-800";
    if (status === "DP Dibayar") return "bg-amber-100 text-amber-800";
    return "bg-rose-100 text-rose-800";
  }

  if (sedangMemuat) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-stone-100">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500"></i>
        <p className="text-sm font-medium">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!pesanan) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-stone-100">
        <p className="text-sm font-medium text-stone-700">Pesanan tidak ditemukan.</p>
        <Link
          href="/dashboard/pesanan"
          className="mt-4 inline-block text-xs font-semibold text-rose-600 hover:underline"
        >
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  const isAdmin = profil?.role === "admin";
  const status = pesanan.status_pesanan;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/pesanan"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 mb-2"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Kembali ke Daftar Pesanan</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              {pesanan.kode_pesanan}
            </h1>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getBadgeStatusPesanan(
                pesanan.status_pesanan
              )}`}
            >
              {pesanan.status_pesanan}
            </span>
            {isAdmin && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getBadgeStatusBayar(
                  pesanan.status_bayar
                )}`}
              >
                {pesanan.status_bayar}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status === "Diterima" && (
            <button
              type="button"
              disabled={sedangProses}
              onClick={() => ubahStatusPesanan("Sedang Dibuat")}
              className="px-4 py-2 rounded-full font-semibold bg-amber-500 hover:bg-amber-600 text-white text-xs transition cursor-pointer"
            >
              <i className="fa-solid fa-fire-burner mr-1.5"></i>
              <span>Mulai Produksi (Sedang Dibuat)</span>
            </button>
          )}

          {status === "Sedang Dibuat" && (
            <button
              type="button"
              disabled={sedangProses}
              onClick={() => ubahStatusPesanan("Siap")}
              className="px-4 py-2 rounded-full font-semibold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition cursor-pointer"
            >
              <i className="fa-solid fa-check mr-1.5"></i>
              <span>Tandai Siap</span>
            </button>
          )}

          {isAdmin && status === "Siap" && pesanan.metode_pengiriman === "Kirim" && (
            <button
              type="button"
              disabled={sedangProses}
              onClick={() => ubahStatusPesanan("Dikirim")}
              className="px-4 py-2 rounded-full font-semibold bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition cursor-pointer"
            >
              <i className="fa-solid fa-truck mr-1.5"></i>
              <span>Kirimkan Kue</span>
            </button>
          )}

          {isAdmin && status === "Siap" && pesanan.metode_pengiriman === "Ambil" && (
            <button
              type="button"
              disabled={sedangProses}
              onClick={() => ubahStatusPesanan("Selesai")}
              className="px-4 py-2 rounded-full font-semibold bg-green-600 hover:bg-green-500 text-white text-xs transition cursor-pointer"
            >
              <i className="fa-solid fa-circle-check mr-1.5"></i>
              <span>Selesaikan (Kue Diambil)</span>
            </button>
          )}

          {isAdmin && status === "Dikirim" && (
            <button
              type="button"
              disabled={sedangProses}
              onClick={() => ubahStatusPesanan("Selesai")}
              className="px-4 py-2 rounded-full font-semibold bg-green-600 hover:bg-green-500 text-white text-xs transition cursor-pointer"
            >
              <i className="fa-solid fa-circle-check mr-1.5"></i>
              <span>Selesaikan (Pesanan Tiba)</span>
            </button>
          )}

          {isAdmin && ["Menunggu Pembayaran", "Diterima"].includes(status) && (
            <button
              type="button"
              onClick={() => setModalBatalBuka(true)}
              className="px-4 py-2 rounded-full font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs transition cursor-pointer"
            >
              <i className="fa-solid fa-ban mr-1.5"></i>
              <span>Batalkan Pesanan</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 pb-3 border-b border-stone-100">
              Visual Preview Kue
            </h3>
            <div className="bg-stone-50/60 rounded-2xl p-4 flex items-center justify-center min-h-[220px]">
              <PreviewKue
                pilihan={pilihan}
                tulisan_kue={pesanan.tulisan_kue}
                className="w-full max-w-[240px] h-auto drop-shadow-sm"
              />
            </div>
            {pesanan.tulisan_kue && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs">
                <span className="text-amber-800 font-bold block mb-0.5">Tulisan di Kue:</span>
                <span className="text-stone-800 italic">&quot;{pesanan.tulisan_kue}&quot;</span>
              </div>
            )}
            {pesanan.catatan && (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                <span className="text-stone-600 font-bold block mb-0.5">Catatan Dapur:</span>
                <span className="text-stone-700">{pesanan.catatan}</span>
              </div>
            )}
            {fotoReferensiUrl && (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                <span className="text-stone-600 font-bold block mb-1.5">Foto Referensi Pelanggan:</span>
                <a
                  href={fotoReferensiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <img
                    src={fotoReferensiUrl}
                    alt="Foto Referensi"
                    className="w-24 h-24 object-cover rounded-xl border border-stone-200 hover:opacity-90"
                  />
                </a>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-3">
            <h3 className="text-sm font-bold text-stone-900 pb-3 border-b border-stone-100">
              Riwayat Perubahan Status
            </h3>
            <div className="space-y-3 text-xs">
              {riwayat.map((r, idx) => (
                <div key={idx} className="flex items-start space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-stone-800">{r.keterangan}</p>
                    <span className="text-[10px] text-stone-400">
                      {formatTanggalIndonesia(r.dibuat_pada)} {r.profil?.nama ? `• oleh ${r.profil.nama}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 pb-3 border-b border-stone-100">
              Informasi Pemesan & Pengambilan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-400 block mb-0.5">Nama Pemesan</span>
                <span className="font-bold text-stone-900 text-sm">{pesanan.nama_penerima}</span>
              </div>
              <div>
                <span className="text-stone-400 block mb-0.5">Nomor WhatsApp</span>
                <a
                  href={`https://wa.me/${pesanan.no_wa.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-rose-600 hover:underline"
                >
                  <i className="fa-brands fa-whatsapp mr-1 text-emerald-600"></i>
                  {pesanan.no_wa}
                </a>
              </div>
              <div>
                <span className="text-stone-400 block mb-0.5">Jadwal Pengambilan</span>
                <span className="font-semibold text-stone-800">
                  {formatTanggalIndonesia(pesanan.tanggal_ambil)} pukul {pesanan.jam_ambil?.slice(0, 5)} WIB
                </span>
              </div>
              <div>
                <span className="text-stone-400 block mb-0.5">Metode Pengiriman</span>
                <span className="font-semibold text-stone-800">
                  {pesanan.metode_pengiriman === "Ambil" ? "Ambil di Toko" : `Kirim (${pesanan.zona_ongkir?.nama || "Zona"})`}
                </span>
              </div>
              {pesanan.metode_pengiriman === "Kirim" && (
                <div className="sm:col-span-2 pt-2 border-t border-stone-100">
                  <span className="text-stone-400 block mb-0.5">Alamat Lengkap Pengiriman:</span>
                  <span className="text-stone-800">{pesanan.alamat}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 pb-3 border-b border-stone-100">
              Komponen Kustomisasi
            </h3>
            <div className="divide-y divide-stone-100 text-xs">
              {pilihan.map((p, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="text-stone-400 mr-2">{p.nama_grup}:</span>
                    <strong className="text-stone-900">{p.nama_item}</strong>
                  </div>
                  {isAdmin && (
                    <span className="font-semibold text-stone-800">
                      {formatRupiah(p.harga)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Total Kue</span>
                  <span className="font-semibold text-stone-800">{formatRupiah(pesanan.total_kue)}</span>
                </div>
                {pesanan.ongkir > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Ongkos Kirim</span>
                    <span className="font-semibold text-stone-800">{formatRupiah(pesanan.ongkir)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-100">
                  <span>Total Tagihan</span>
                  <span>{formatRupiah(pesanan.total_bayar)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Terbayar</span>
                  <span>{formatRupiah(pesanan.jumlah_terbayar)}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-700 pt-1 border-t border-dashed border-stone-100">
                  <span>Sisa Tagihan</span>
                  <span>{formatRupiah(pesanan.total_bayar - pesanan.jumlah_terbayar)}</span>
                </div>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
              <h3 className="text-sm font-bold text-stone-900 pb-3 border-b border-stone-100">
                Pemeriksaan Pembayaran Pelanggan
              </h3>

              {daftarBayar.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center">
                  Belum ada pembayaran yang diunggah pelanggan.
                </p>
              ) : (
                <div className="space-y-3">
                  {daftarBayar.map((bayar) => (
                    <div
                      key={bayar.id}
                      className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-stone-900">{bayar.jenis}</span>
                          <span className="text-stone-400">•</span>
                          <span className="text-stone-600">{bayar.metode}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              bayar.status === "Dikonfirmasi"
                                ? "bg-emerald-100 text-emerald-800"
                                : bayar.status === "Ditolak"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {bayar.status}
                          </span>
                        </div>
                        <span className="text-base font-black text-stone-900 block">
                          {formatRupiah(bayar.jumlah)}
                        </span>
                        {bayar.signedUrl && (
                          <a
                            href={bayar.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-rose-600 font-semibold hover:underline mt-1"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                            <span>Buka Bukti Transfer</span>
                          </a>
                        )}
                      </div>

                      {bayar.status === "Menunggu Konfirmasi" && (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            disabled={sedangProses}
                            onClick={() => handleAksiPembayaran(bayar.id, "konfirmasi")}
                            className="px-3.5 py-1.5 rounded-full font-semibold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition cursor-pointer"
                          >
                            Konfirmasi
                          </button>
                          <button
                            type="button"
                            disabled={sedangProses}
                            onClick={() => handleAksiPembayaran(bayar.id, "tolak")}
                            className="px-3.5 py-1.5 rounded-full font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs transition cursor-pointer"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modalBatalBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <h3 className="text-lg font-bold text-stone-900">
                Batalkan Pesanan {pesanan.kode_pesanan}
              </h3>
              <button
                type="button"
                onClick={() => setModalBatalBuka(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-stone-500">
                Pembatalan pesanan akan mengembalikan kuota harian. Masukkan alasan pembatalan untuk dicatat pada riwayat pesanan.
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Alasan Pembatalan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Contoh: Permintaan pelanggan via WA / Batas bayar habis"
                  value={alasanBatal}
                  onChange={(e) => setAlasanBatal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalBatalBuka(false)}
                  className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={sedangProses || !alasanBatal.trim()}
                  onClick={() => ubahStatusPesanan("Dibatalkan", alasanBatal)}
                  className="px-5 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {sedangProses ? "Membatalkan..." : "Konfirmasi Batal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalPesan
        terbuka={notifikasi.terbuka}
        judul={notifikasi.judul}
        pesan={notifikasi.pesan}
        tipe={notifikasi.tipe}
        onTutup={() => setNotifikasi({ ...notifikasi, terbuka: false })}
      />
    </div>
  );
}