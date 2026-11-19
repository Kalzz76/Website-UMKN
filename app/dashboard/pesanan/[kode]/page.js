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
    if (status === "Dikirim") return "bg-sky-100 text-sky-800";
    if (status === "Selesai") return "bg-emerald-100 text-emerald-800";
    return "bg-rose-100 text-rose-800";
  }

  function getBadgeStatusBayar(status) {
    if (status === "Lunas") return "bg-emerald-100 text-emerald-800";
    if (status === "DP Dibayar") return "bg-amber-100 text-amber-800";
    return "bg-rose-100 text-rose-800";
  }

  if (sedangMemuat) {
    return (
      <div className="content-card p-12 text-center text-stone-400">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500"></i>
        <p className="text-sm font-medium">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!pesanan) {
    return (
      <div className="content-card p-12 text-center text-stone-400">
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
      <div className="content-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/dashboard/pesanan"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-600 hover:text-rose-600 transition"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Kembali ke Daftar Pesanan</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                {pesanan.kode_pesanan}
              </h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${getBadgeStatusPesanan(
                  pesanan.status_pesanan
                )}`}
              >
                {pesanan.status_pesanan}
              </span>
              {isAdmin && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${getBadgeStatusBayar(
                    pesanan.status_bayar
                  )}`}
                >
                  {pesanan.status_bayar}
                </span>
              )}
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 whitespace-nowrap">
                {pesanan.metode_pengiriman === "Ambil" ? "Ambil di Tempat" : "Kirim"}
              </span>
            </div>

            <p className="text-xs font-medium text-stone-500">
              Dipesan pada {formatTanggalIndonesia(pesanan.dibuat_pada)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {status === "Diterima" && (
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => ubahStatusPesanan("Sedang Dibuat")}
                className="h-[42px] px-5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
              >
                <i className="fa-solid fa-fire-burner"></i>
                <span>Mulai Produksi (Sedang Dibuat)</span>
              </button>
            )}

            {status === "Sedang Dibuat" && (
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => ubahStatusPesanan("Siap")}
                className="h-[42px] px-5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
              >
                <i className="fa-solid fa-check"></i>
                <span>Tandai Siap</span>
              </button>
            )}

            {isAdmin && status === "Siap" && pesanan.metode_pengiriman === "Kirim" && (
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => ubahStatusPesanan("Dikirim")}
                className="h-[42px] px-5 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
              >
                <i className="fa-solid fa-truck"></i>
                <span>Kirimkan Kue</span>
              </button>
            )}

            {isAdmin && status === "Siap" && pesanan.metode_pengiriman === "Ambil" && (
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => ubahStatusPesanan("Selesai")}
                className="h-[42px] px-5 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>Selesaikan (Kue Diambil)</span>
              </button>
            )}

            {isAdmin && status === "Dikirim" && (
              <button
                type="button"
                disabled={sedangProses}
                onClick={() => ubahStatusPesanan("Selesai")}
                className="h-[42px] px-5 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white text-xs transition cursor-pointer inline-flex items-center space-x-2 shadow-sm"
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>Selesaikan (Pesanan Tiba)</span>
              </button>
            )}

            {isAdmin && ["Menunggu Pembayaran", "Diterima"].includes(status) && (
              <button
                type="button"
                onClick={() => setModalBatalBuka(true)}
                className="h-[42px] px-4 rounded-xl font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs transition cursor-pointer inline-flex items-center space-x-2"
              >
                <i className="fa-solid fa-ban"></i>
                <span>Batalkan Pesanan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="content-card p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-stone-200">
              <i className="fa-solid fa-cake-candles text-amber-600 text-sm"></i>
              <h3 className="text-sm font-bold text-stone-900">Visual Preview Kue</h3>
            </div>

            <div className="py-4 flex items-center justify-center">
              <PreviewKue
                pilihan={pilihan}
                tulisan_kue={pesanan.tulisan_kue}
                className="w-full max-w-[240px] h-auto drop-shadow-md"
              />
            </div>

            {pesanan.tulisan_kue && (
              <div className="pt-3 border-t border-dashed border-stone-200 space-y-1">
                <span className="text-xs font-bold text-stone-600 block">
                  Tulisan di Atas Kue:
                </span>
                <p className="text-sm font-semibold text-stone-900 bg-[#fffdf6] border border-[#e0d5b8] p-3 rounded-xl italic">
                  &quot;{pesanan.tulisan_kue}&quot;
                </p>
              </div>
            )}

            {pesanan.catatan && (
              <div className="pt-3 border-t border-dashed border-stone-200 space-y-1">
                <span className="text-xs font-bold text-stone-600 block">
                  Catatan Dapur:
                </span>
                <p className="text-xs font-medium text-stone-800 bg-[#fffdf6] border border-[#e0d5b8] p-3 rounded-xl">
                  {pesanan.catatan}
                </p>
              </div>
            )}

            {fotoReferensiUrl && (
              <div className="pt-3 border-t border-dashed border-stone-200 space-y-2">
                <span className="text-xs font-bold text-stone-600 block">
                  Foto Referensi Pelanggan:
                </span>
                <a
                  href={fotoReferensiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <img
                    src={fotoReferensiUrl}
                    alt="Foto Referensi"
                    className="w-28 h-28 object-cover rounded-xl border-2 border-[#e0d5b8] hover:opacity-90 shadow-sm"
                  />
                </a>
              </div>
            )}
          </div>

          <div className="content-card p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-stone-200">
              <i className="fa-solid fa-clock-rotate-left text-stone-600 text-sm"></i>
              <h3 className="text-sm font-bold text-stone-900">Riwayat Status Pesanan</h3>
            </div>
            <div className="space-y-3 text-xs">
              {riwayat.length === 0 ? (
                <p className="text-stone-400 py-2">Belum ada catatan riwayat status.</p>
              ) : (
                riwayat.map((r, idx) => (
                  <div key={idx} className="flex items-start space-x-3 pb-3 border-b border-dashed border-stone-200 last:border-b-0 last:pb-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-600 mt-1 flex-shrink-0"></div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-stone-900">{r.keterangan}</p>
                      <p className="text-[11px] font-medium text-stone-500">
                        {formatTanggalIndonesia(r.dibuat_pada)} {r.profil?.nama ? `• oleh ${r.profil.nama}` : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="content-card p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-stone-200">
              <i className="fa-solid fa-user-check text-stone-600 text-sm"></i>
              <h3 className="text-sm font-bold text-stone-900">Informasi Pemesan & Pengambilan</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-stone-500 block">Nama Pemesan</span>
                <span className="font-bold text-stone-900 text-sm block">{pesanan.nama_penerima}</span>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-stone-500 block">Nomor WhatsApp</span>
                <a
                  href={"https:" + "/" + `/wa.me/${pesanan.no_wa.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:text-emerald-800 text-sm inline-flex items-center space-x-1.5"
                >
                  <i className="fa-brands fa-whatsapp text-emerald-600 text-base"></i>
                  <span>{pesanan.no_wa}</span>
                </a>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-stone-500 block">Jadwal Pengambilan</span>
                <span className="font-bold text-stone-900 block">
                  {formatTanggalIndonesia(pesanan.tanggal_ambil)} pukul {pesanan.jam_ambil?.slice(0, 5)} WIB
                </span>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-stone-500 block">Metode Pengiriman</span>
                <span className="font-bold text-stone-900 block">
                  {pesanan.metode_pengiriman === "Ambil" ? "Ambil Sendiri di Toko" : `Kirim ke Alamat (${pesanan.zona_ongkir?.nama || "Kurir"})`}
                </span>
              </div>

              {pesanan.metode_pengiriman === "Kirim" && (
                <div className="sm:col-span-2 pt-3 border-t border-dashed border-stone-200 space-y-1">
                  <span className="font-semibold text-stone-500 block">Alamat Lengkap Pengiriman:</span>
                  <p className="font-medium text-stone-800 leading-relaxed bg-[#fffdf6] border border-[#e0d5b8] p-3 rounded-xl">
                    {pesanan.alamat}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="content-card p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-stone-200">
              <i className="fa-solid fa-receipt text-stone-600 text-sm"></i>
              <h3 className="text-sm font-bold text-stone-900">Komponen Kustomisasi & Tagihan</h3>
            </div>

            <div className="divide-y divide-stone-200 text-xs">
              {pilihan.map((p, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-stone-500 mr-2">{p.nama_grup}:</span>
                    <strong className="text-stone-900 font-bold">{p.nama_item}</strong>
                  </div>
                  {isAdmin && (
                    <span className="font-bold text-stone-900">
                      {formatRupiah(p.harga)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="pt-3 border-t-2 border-dashed border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span className="font-medium">Subtotal Kue</span>
                  <span className="font-bold text-stone-900">{formatRupiah(pesanan.total_kue)}</span>
                </div>
                {pesanan.ongkir > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span className="font-medium">Ongkos Kirim</span>
                    <span className="font-bold text-stone-900">{formatRupiah(pesanan.ongkir)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-stone-200">
                  <span className="font-bold text-sm text-stone-900">Total Tagihan</span>
                  <span className="font-black text-base text-stone-900">{formatRupiah(pesanan.total_bayar)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Sudah Terbayar</span>
                  <span>{formatRupiah(pesanan.jumlah_terbayar)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-stone-200">
                  <span className="font-bold text-xs text-rose-800">Sisa Tagihan</span>
                  <span className="font-black text-sm text-rose-800">
                    {formatRupiah(pesanan.total_bayar - pesanan.jumlah_terbayar)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="content-card p-6 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-stone-200">
                <i className="fa-solid fa-credit-card text-stone-600 text-sm"></i>
                <h3 className="text-sm font-bold text-stone-900">Pemeriksaan Bukti Pembayaran</h3>
              </div>

              {daftarBayar.length === 0 ? (
                <p className="text-xs text-stone-400 py-4 text-center font-medium">
                  Belum ada bukti pembayaran yang diunggah pelanggan.
                </p>
              ) : (
                <div className="space-y-3">
                  {daftarBayar.map((bayar) => (
                    <div
                      key={bayar.id}
                      className="p-4 rounded-2xl bg-[#fffdf6] border-2 border-[#e0d5b8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-stone-900">{bayar.jenis}</span>
                          <span className="text-stone-300">•</span>
                          <span className="font-medium text-stone-600">{bayar.metode}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                            className="inline-flex items-center space-x-1.5 text-rose-600 font-bold hover:underline mt-1"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
                            <span>Buka Bukti Transfer</span>
                          </a>
                        )}
                      </div>

                      {bayar.status === "Menunggu Konfirmasi" && (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            type="button"
                            disabled={sedangProses}
                            onClick={() => handleAksiPembayaran(bayar.id, "konfirmasi")}
                            className="h-[36px] px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition cursor-pointer shadow-sm"
                          >
                            Konfirmasi
                          </button>
                          <button
                            type="button"
                            disabled={sedangProses}
                            onClick={() => handleAksiPembayaran(bayar.id, "tolak")}
                            className="h-[36px] px-4 rounded-xl font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs transition cursor-pointer"
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
          <div className="bg-[#fbf6e9] border-2 border-[#e8dfc8] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-dashed border-[#e0d5b8]">
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
              <p className="text-xs font-medium text-stone-600">
                Pembatalan pesanan akan mengembalikan kuota harian. Masukkan alasan pembatalan untuk dicatat pada riwayat pesanan.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
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

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-dashed border-[#e0d5b8]">
                <button
                  type="button"
                  onClick={() => setModalBatalBuka(false)}
                  className="h-[42px] px-5 rounded-xl border-2 border-[#e0d5b8] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] font-bold text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={sedangProses || !alasanBatal.trim()}
                  onClick={() => ubahStatusPesanan("Dibatalkan", alasanBatal)}
                  className="h-[42px] px-5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
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