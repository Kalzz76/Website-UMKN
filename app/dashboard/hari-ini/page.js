"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import {
  formatRupiah,
  formatTanggalIndonesia,
  formatTanggalSingkat,
  formatTanggalWaktu,
} from "@/lib/format";
import ModalPesan from "@/components/ModalPesan";

export default function HariIniDashboardPage() {
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [daftarPesanan, setDaftarPesanan] = useState([]);
  const [bahanRendah, setBahanRendah] = useState([]);
  const [profil, setProfil] = useState(null);
  const [kataKunci, setKataKunci] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [sedangProses, setSedangProses] = useState(false);

  const [modalTunaiBuka, setModalTunaiBuka] = useState(false);
  const [pesananDipilih, setPesananDipilih] = useState(null);

  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  const hariIni = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

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
      .select("id, role, nama")
      .eq("id", user.id)
      .single();

    if (prof) setProfil(prof);

    const { data: pesananList } = await supabase
      .from("pesanan")
      .select("*")
      .or(`tanggal_ambil.eq.${hariIni},status_bayar.eq.DP Dibayar`)
      .neq("status_pesanan", "Dibatalkan")
      .order("tanggal_ambil", { ascending: true })
      .order("jam_ambil", { ascending: true, nullsFirst: false });

    if (pesananList) setDaftarPesanan(pesananList);

    const { data: listBahan } = await supabase
      .from("bahan")
      .select("id, nama, satuan, jumlah, batas_minimum")
      .order("nama", { ascending: true });

    if (listBahan) {
      const menipis = listBahan.filter(
        (b) => Number(b.jumlah) <= Number(b.batas_minimum)
      );
      setBahanRendah(menipis);
    }

    setSedangMemuat(false);
  }

  useEffect(() => {
    muatData();
  }, []);

  const pesananTersaring = daftarPesanan.filter((p) => {
    const cocokHariIni = p.tanggal_ambil === hariIni;
    const cocokPelunasan = p.status_bayar === "DP Dibayar";

    if (filterKategori === "hari_ini" && !cocokHariIni) return false;
    if (filterKategori === "pelunasan" && !cocokPelunasan) return false;
    if (filterKategori === "siap" && p.status_pesanan !== "Siap") return false;

    if (kataKunci.trim()) {
      const q = kataKunci.trim().toLowerCase();
      const kode = (p.kode_pesanan || "").toLowerCase();
      const wa = (p.no_wa || "").toLowerCase();
      const nama = (p.nama_penerima || "").toLowerCase();
      if (!kode.includes(q) && !wa.includes(q) && !nama.includes(q)) {
        return false;
      }
    }

    return true;
  });

  async function perbaruiStatusPesanan(pesanan, statusBaru) {
    const yakin = window.confirm(
      `Ubah status pesanan #${pesanan.kode_pesanan} menjadi "${statusBaru}"?`
    );
    if (!yakin) return;

    setSedangProses(true);
    const supabase = getSupabaseBrowser();

    const { error: errUpdate } = await supabase
      .from("pesanan")
      .update({ status_pesanan: statusBaru })
      .eq("id", pesanan.id);

    if (errUpdate) {
      setSedangProses(false);
      setNotifikasi({
        terbuka: true,
        judul: "Gagal",
        pesan: "Gagal memperbarui status: " + errUpdate.message,
        tipe: "error",
      });
      return;
    }

    await supabase.from("riwayat_pesanan").insert({
      id_pesanan: pesanan.id,
      keterangan: `Status pesanan diubah menjadi ${statusBaru} oleh staf di operasional harian`,
      id_user: profil?.id || null,
    });

    setSedangProses(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: `Status pesanan #${pesanan.kode_pesanan} berhasil diubah menjadi "${statusBaru}".`,
      tipe: "sukses",
    });
    muatData();
  }

  function bukaModalPelunasanTunai(pesanan) {
    setPesananDipilih(pesanan);
    setModalTunaiBuka(true);
  }

  async function konfirmasiPelunasanTunai() {
    if (!pesananDipilih) return;
    const total = Number(pesananDipilih.total_bayar || pesananDipilih.total_harga || 0);
    const terbayar = Number(pesananDipilih.jumlah_terbayar || 0);
    const sisa = Math.max(0, total - terbayar);

    setSedangProses(true);
    const supabase = getSupabaseBrowser();

    const { error: errBayar } = await supabase.from("pembayaran").insert({
      id_pesanan: pesananDipilih.id,
      metode: "Tunai",
      jumlah: sisa,
      status: "Dikonfirmasi",
      dikonfirmasi_pada: new Date().toISOString(),
      catatan_admin: "Pelunasan tunai di toko",
    });

    if (errBayar) {
      setSedangProses(false);
      setNotifikasi({
        terbuka: true,
        judul: "Gagal",
        pesan: "Gagal mencatat pembayaran: " + errBayar.message,
        tipe: "error",
      });
      return;
    }

    const { error: errPesanan } = await supabase
      .from("pesanan")
      .update({
        jumlah_terbayar: total,
        status_bayar: "Lunas",
      })
      .eq("id", pesananDipilih.id);

    if (errPesanan) {
      setSedangProses(false);
      setNotifikasi({
        terbuka: true,
        judul: "Gagal",
        pesan: "Gagal memperbarui status pesanan: " + errPesanan.message,
        tipe: "error",
      });
      return;
    }

    await supabase.from("riwayat_pesanan").insert({
      id_pesanan: pesananDipilih.id,
      keterangan: `Pelunasan tunai sebesar ${formatRupiah(sisa)} dicatat di toko`,
      id_user: profil?.id || null,
    });

    setSedangProses(false);
    setModalTunaiBuka(false);
    setPesananDipilih(null);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: `Pelunasan tunai untuk pesanan #${pesananDipilih.kode_pesanan} berhasil dicatat. Status pesanan kini Lunas.`,
      tipe: "sukses",
    });
    muatData();
  }

  if (sedangMemuat) {
    return (
      <div className="content-card p-12 text-center text-stone-400">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-[#ba2b2b]"></i>
        <p className="text-xs font-bold text-[#1d3b2e]">
          Memuat jadwal operasional hari ini...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="content-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1d3b2e]">
              Operasional Hari Ini
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#ede2cd] text-[#1d3b2e] border border-[#dfd4bd]">
              {formatTanggalIndonesia(hariIni)}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Jadwal penyerahan pesanan ambil di toko, antrean kirim, dan pelunasan pembayaran pelanggan hari ini.
          </p>
        </div>

        <button
          type="button"
          onClick={muatData}
          className="h-[40px] px-4 rounded-xl border border-[#dcd3c1] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] font-bold text-xs inline-flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-center"
        >
          <i className="fa-solid fa-arrows-rotate text-xs"></i>
          <span>Segarkan Data</span>
        </button>
      </div>

      {bahanRendah.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
            <i className="fa-solid fa-triangle-exclamation text-amber-600 text-sm"></i>
            <span>Peringatan Stok Rendah ({bahanRendah.length} bahan baku)</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {bahanRendah.map((b) => (
              <span
                key={b.id}
                className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-semibold text-amber-900 shadow-2xs"
              >
                <b>{b.nama}</b>: sisa {b.jumlah} {b.satuan} (min: {b.batas_minimum} {b.satuan})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="content-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-stone-400 text-xs"></i>
            <input
              type="text"
              placeholder="Cari kode pesanan, nama, atau no. WA..."
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              className="w-full h-[40px] pl-9 pr-4 rounded-xl border border-[#dcd3c1] bg-white outline-none focus:border-[#ba2b2b] text-xs font-semibold text-[#1d3b2e]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterKategori("semua")}
              className={`h-[36px] px-3.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                filterKategori === "semua"
                  ? "bg-[#ba2b2b] text-white"
                  : "bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] hover:bg-[#e2d4bc]"
              }`}
            >
              Semua ({daftarPesanan.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori("hari_ini")}
              className={`h-[36px] px-3.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                filterKategori === "hari_ini"
                  ? "bg-[#ba2b2b] text-white"
                  : "bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] hover:bg-[#e2d4bc]"
              }`}
            >
              Jadwal Hari Ini ({daftarPesanan.filter((p) => p.tanggal_ambil === hariIni).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori("siap")}
              className={`h-[36px] px-3.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                filterKategori === "siap"
                  ? "bg-[#ba2b2b] text-white"
                  : "bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] hover:bg-[#e2d4bc]"
              }`}
            >
              Siap Diserahkan ({daftarPesanan.filter((p) => p.status_pesanan === "Siap").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori("pelunasan")}
              className={`h-[36px] px-3.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                filterKategori === "pelunasan"
                  ? "bg-[#ba2b2b] text-white"
                  : "bg-[#ede2cd] border border-[#dfd4bd] text-[#1d3b2e] hover:bg-[#e2d4bc]"
              }`}
            >
              Menunggu Pelunasan ({daftarPesanan.filter((p) => p.status_bayar === "DP Dibayar").length})
            </button>
          </div>
        </div>

        {pesananTersaring.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <i className="fa-solid fa-clipboard-check text-4xl mb-3 text-stone-300"></i>
            <p className="text-sm font-bold text-[#1d3b2e]">
              Tidak ada antrean pesanan yang cocok.
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Seluruh pesanan hari ini telah tertangani atau tidak ditemukan kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {pesananTersaring.map((pesanan) => {
              const total = Number(
                pesanan.total_bayar || pesanan.total_harga || 0
              );
              const terbayar = Number(pesanan.jumlah_terbayar || 0);
              const sisa = Math.max(0, total - terbayar);
              const isKirim = pesanan.metode_pengiriman === "Kirim";
              const mapsUrl = isKirim
                ? pesanan.lat_tujuan && pesanan.lng_tujuan
                  ? `https://www.google.com/maps/search/?api=1&query=${pesanan.lat_tujuan},${pesanan.lng_tujuan}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      pesanan.alamat || ""
                    )}`
                : null;

              return (
                <div
                  key={pesanan.id}
                  className="rounded-2xl border border-[#dfd4bd] bg-white p-5 space-y-4 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-[#1d3b2e]">
                            #{pesanan.kode_pesanan}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              pesanan.status_pesanan === "Selesai"
                                ? "bg-emerald-100 text-emerald-800"
                                : pesanan.status_pesanan === "Siap"
                                ? "bg-indigo-100 text-indigo-800"
                                : pesanan.status_pesanan === "Dikirim"
                                ? "bg-cyan-100 text-cyan-800"
                                : pesanan.status_pesanan === "Sedang Dibuat"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-stone-100 text-stone-800"
                            }`}
                          >
                            {pesanan.status_pesanan}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1d3b2e] mt-1">
                          {pesanan.nama_penerima}
                        </h4>
                        <a
                          href={`https://wa.me/${pesanan.no_wa?.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-stone-500 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 mt-0.5"
                        >
                          <i className="fa-brands fa-whatsapp text-emerald-600"></i>
                          <span>{pesanan.no_wa}</span>
                        </a>
                      </div>

                      <div className="text-right">
                        {isKirim ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                            <i className="fa-solid fa-truck-fast text-xs"></i>
                            <span>Kirim ke Alamat</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                            <i className="fa-solid fa-store text-xs"></i>
                            <span>Ambil di Toko</span>
                          </span>
                        )}
                        <p className="text-[11px] font-bold text-stone-600 mt-1">
                          {isKirim
                            ? formatTanggalIndonesia(pesanan.tanggal_ambil)
                            : `${formatTanggalIndonesia(pesanan.tanggal_ambil)} ${pesanan.jam_ambil ? `(${pesanan.jam_ambil.slice(0, 5)})` : ""}`}
                        </p>
                      </div>
                    </div>

                    {pesanan.perlu_refund && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                        <i className="fa-solid fa-triangle-exclamation text-rose-600"></i>
                        <span>
                          Perlu Refund: Pembayaran masuk setelah pesanan dibatalkan.
                        </span>
                      </div>
                    )}

                    {isKirim && (
                      <div className="p-3 rounded-xl bg-[#ede2cd]/40 border border-[#dfd4bd] text-xs space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-stone-700 font-medium line-clamp-2">
                            <i className="fa-solid fa-location-dot text-rose-600 mr-1.5"></i>
                            {pesanan.alamat || "Alamat tidak tersedia"}
                          </p>
                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#dcd3c1] hover:bg-[#ede2cd] text-[#1d3b2e] text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer transition shadow-2xs"
                            >
                              <i className="fa-solid fa-diamond-turn-right text-blue-600"></i>
                              <span>Peta</span>
                            </a>
                          )}
                        </div>
                        {pesanan.patokan && (
                          <p className="text-[11px] text-stone-500">
                            Patokan: {pesanan.patokan}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-stone-600 pt-1 border-t border-[#e2d5bc]">
                          {pesanan.jarak_km && (
                            <span>Jarak: <b>{pesanan.jarak_km} km</b></span>
                          )}
                          <span>Ongkir: <b>{formatRupiah(pesanan.ongkir || 0)}</b></span>
                        </div>
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-stone-600">
                        <span>Total Tagihan:</span>
                        <span className="font-bold text-[#1d3b2e]">{formatRupiah(total)}</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600">
                        <span>Terbayar:</span>
                        <span className="font-bold text-emerald-700">{formatRupiah(terbayar)}</span>
                      </div>
                      {sisa > 0 ? (
                        <div className="flex items-center justify-between pt-1 border-t border-stone-200 font-bold text-rose-700">
                          <span>Sisa Pelunasan:</span>
                          <span>{formatRupiah(sisa)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1 border-t border-stone-200 font-bold text-emerald-800 text-[11px]">
                          <span>Status Bayar:</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Lunas (Midtrans / Tunai)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#ede2cd] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {sisa > 0 && (
                        <button
                          type="button"
                          onClick={() => bukaModalPelunasanTunai(pesanan)}
                          className="h-[36px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-money-bill-wave text-xs"></i>
                          <span>Pelunasan Tunai</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {pesanan.status_pesanan === "Diterima" && (
                        <button
                          type="button"
                          onClick={() => perbaruiStatusPesanan(pesanan, "Sedang Dibuat")}
                          disabled={sedangProses}
                          className="h-[36px] px-3.5 rounded-xl bg-[#ba2b2b] hover:bg-[#a62525] text-white font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <i className="fa-solid fa-kitchen-set text-xs"></i>
                          <span>Mulai Buat</span>
                        </button>
                      )}

                      {pesanan.status_pesanan === "Sedang Dibuat" && (
                        <button
                          type="button"
                          onClick={() => perbaruiStatusPesanan(pesanan, "Siap")}
                          disabled={sedangProses}
                          className="h-[36px] px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <i className="fa-solid fa-box text-xs"></i>
                          <span>Tandai Siap</span>
                        </button>
                      )}

                      {pesanan.status_pesanan === "Siap" && isKirim && (
                        <button
                          type="button"
                          onClick={() => perbaruiStatusPesanan(pesanan, "Dikirim")}
                          disabled={sedangProses}
                          className="h-[36px] px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <i className="fa-solid fa-truck-fast text-xs"></i>
                          <span>Kirim Pesanan</span>
                        </button>
                      )}

                      {pesanan.status_pesanan === "Siap" && !isKirim && (
                        <button
                          type="button"
                          onClick={() => perbaruiStatusPesanan(pesanan, "Selesai")}
                          disabled={sedangProses}
                          className="h-[36px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <i className="fa-solid fa-circle-check text-xs"></i>
                          <span>Serahkan ke Pelanggan</span>
                        </button>
                      )}

                      {pesanan.status_pesanan === "Dikirim" && isKirim && (
                        <button
                          type="button"
                          onClick={() => perbaruiStatusPesanan(pesanan, "Selesai")}
                          disabled={sedangProses}
                          className="h-[36px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <i className="fa-solid fa-circle-check text-xs"></i>
                          <span>Selesaikan Pengiriman</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalTunaiBuka && pesananDipilih && (
        <div className="portal-modal-backdrop flex items-center justify-center p-4">
          <div className="bg-[#fbf6e9] border border-[#e8dfc8] rounded-[24px] max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8dfc8]">
              <h3 className="text-base font-bold text-[#1d3b2e]">
                Pelunasan Tunai di Toko
              </h3>
              <button
                type="button"
                onClick={() => setModalTunaiBuka(false)}
                className="w-7 h-7 rounded-lg border border-[#dcd3c1] bg-[#ede2cd] hover:bg-[#e2d4bc] text-[#1d3b2e] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-stone-600">
                Pesanan: <b>#{pesananDipilih.kode_pesanan}</b> ({pesananDipilih.nama_penerima})
              </p>
              <div className="p-3 rounded-xl bg-white border border-[#dfd4bd] space-y-1">
                <div className="flex justify-between">
                  <span>Total Pesanan:</span>
                  <b>{formatRupiah(pesananDipilih.total_bayar || pesananDipilih.total_harga || 0)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Sudah Terbayar:</span>
                  <b>{formatRupiah(pesananDipilih.jumlah_terbayar || 0)}</b>
                </div>
                <div className="flex justify-between text-rose-700 font-bold pt-1 border-t border-stone-200">
                  <span>Jumlah Tunai Diterima:</span>
                  <span>
                    {formatRupiah(
                      Math.max(
                        0,
                        (pesananDipilih.total_bayar || pesananDipilih.total_harga || 0) -
                          (pesananDipilih.jumlah_terbayar || 0)
                      )
                    )}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-stone-500">
                Setelah konfirmasi, pembayaran tunai akan langsung tercatat dan status pembayaran pesanan berubah menjadi Lunas.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setModalTunaiBuka(false)}
                className="h-[38px] px-4 rounded-xl border border-[#dcd3c1] bg-white hover:bg-stone-50 text-[#1d3b2e] font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={konfirmasiPelunasanTunai}
                disabled={sedangProses}
                className="h-[38px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
              >
                {sedangProses ? "Menyimpan..." : "Konfirmasi Pembayaran"}
              </button>
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
