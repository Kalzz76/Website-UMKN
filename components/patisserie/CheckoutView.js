"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  MapPin,
  Truck,
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  Building2,
  QrCode,
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  Upload,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import {
  BotanicalTopLeft,
  BotanicalTopRight,
  BotanicalBottomRight,
} from "./BotanicalBranchDecor";
import { DynamicIslandNavbar } from "./DynamicIslandNavbar";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export function CheckoutView() {
  const router = useRouter();

  const [activeStep, setActiveStep] = useState(1);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [keranjang, setKeranjang] = useState([]);
  const [ringkasan, setRingkasan] = useState({
    subtotal_custom: 0,
    subtotal_katalog: 0,
    total_kue: 0,
    jumlah_dp: 0,
    sisa: 0,
    mode_pembayaran: "DP",
    persen_dp: 50,
  });

  const [namaPenerima, setNamaPenerima] = useState("");
  const [noWa, setNoWa] = useState("");
  const [metodePengiriman, setMetodePengiriman] = useState("Ambil");
  const [alamat, setAlamat] = useState("");
  const [idZona, setIdZona] = useState("");
  const [tanggalAmbil, setTanggalAmbil] = useState("");
  const [jamAmbil, setJamAmbil] = useState("09:00");
  const [catatan, setCatatan] = useState("");

  const [metodeBayar, setMetodeBayar] = useState("Transfer Bank");

  const [daftarZona, setDaftarZona] = useState([]);
  const [ketersediaan, setKetersediaan] = useState({
    tanggal_minimal: "",
    tanggal_tutup: [],
    tanggal_penuh: [],
    jam_buka: "08:00",
    jam_tutup: "20:00",
  });
  const [pengaturan, setPengaturan] = useState(null);

  const [pesananSelesai, setPesananSelesai] = useState(null);
  const [qrTiketUrl, setQrTiketUrl] = useState("");
  const [berkasBukti, setBerkasBukti] = useState(null);
  const [sedangUnggahBukti, setSedangUnggahBukti] = useState(false);
  const [buktiBerhasil, setBuktiBerhasil] = useState(false);

  const [sedangProses, setSedangProses] = useState(false);
  const [pesanError, setPesanError] = useState("");

  async function muatDataKeranjang() {
    try {
      const res = await fetch("/api/keranjang", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/masuk?redirect=/checkout");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setKeranjang(data.keranjang || []);
        if (data.ringkasan) {
          setRingkasan(data.ringkasan);
        }
      }
    } catch {
      setPesanError("Gagal memuat keranjang belanja.");
    }
  }

  async function muatDataAwal() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/masuk?redirect=/checkout");
      return;
    }

    const { data: prof } = await supabase
      .from("profil")
      .select("nama, no_wa")
      .eq("id", user.id)
      .single();

    if (prof) {
      if (prof.nama) setNamaPenerima(prof.nama);
      if (prof.no_wa) setNoWa(prof.no_wa);
    }

    const { data: zonaList } = await supabase
      .from("zona_ongkir")
      .select("*")
      .eq("aktif", true)
      .order("tarif", { ascending: true });

    if (zonaList && zonaList.length > 0) {
      setDaftarZona(zonaList);
      setIdZona(String(zonaList[0].id));
    }

    const { data: toko } = await supabase
      .from("pengaturan_toko")
      .select("*")
      .eq("id", 1)
      .single();

    if (toko) {
      setPengaturan(toko);
    }

    try {
      const resK = await fetch("/api/ketersediaan", { cache: "no-store" });
      if (resK.ok) {
        const dataK = await resK.json();
        setKetersediaan(dataK);
        if (dataK.tanggal_minimal) {
          setTanggalAmbil(dataK.tanggal_minimal);
        }
      }
    } catch {}

    await muatDataKeranjang();
    setSedangMemuat(false);
  }

  useEffect(() => {
    muatDataAwal();
  }, []);

  async function ubahJumlahItem(id, jumlahBaru) {
    if (jumlahBaru < 1 || jumlahBaru > 20) return;
    try {
      const res = await fetch("/api/keranjang", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, jumlah: jumlahBaru }),
      });
      if (res.ok) {
        await muatDataKeranjang();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cravely_cart_updated"));
        }
      }
    } catch {}
  }

  async function hapusItem(id) {
    try {
      const res = await fetch(`/api/keranjang?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await muatDataKeranjang();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cravely_cart_updated"));
        }
      }
    } catch {}
  }

  const zonaTerpilih = daftarZona.find((z) => String(z.id) === String(idZona));
  const ongkir = metodePengiriman === "Kirim" && zonaTerpilih ? Number(zonaTerpilih.tarif || 0) : 0;
  const totalKue = Number(ringkasan.total_kue || 0);
  const totalBayar = totalKue + ongkir;

  let jumlahDp = totalBayar;
  let sisaBayar = 0;
  const mode = pengaturan?.mode_pembayaran || ringkasan.mode_pembayaran || "DP";
  if (mode === "DP") {
    const persen = Number(pengaturan?.persen_dp ?? ringkasan.persen_dp ?? 50);
    jumlahDp = Math.round((totalBayar * persen) / 100);
    sisaBayar = Math.max(0, totalBayar - jumlahDp);
  }

  function buatOpsiJam() {
    const list = [];
    const buka = parseInt((ketersediaan.jam_buka || "08:00").slice(0, 2), 10);
    const tutup = parseInt((ketersediaan.jam_tutup || "20:00").slice(0, 2), 10);
    for (let h = buka; h <= tutup; h++) {
      const jamStr = String(h).padStart(2, "0") + ":00";
      list.push(jamStr);
    }
    return list;
  }

  const listJam = buatOpsiJam();

  function handleLanjutKePembayaran(e) {
    e.preventDefault();
    setPesanError("");

    if (!namaPenerima.trim()) {
      setPesanError("Nama pemesan wajib diisi.");
      return;
    }
    if (!noWa.trim()) {
      setPesanError("Nomor WhatsApp wajib diisi.");
      return;
    }
    if (metodePengiriman === "Kirim") {
      if (!alamat.trim()) {
        setPesanError("Alamat lengkap wajib diisi untuk pengiriman.");
        return;
      }
      if (!idZona) {
        setPesanError("Silakan pilih zona pengiriman.");
        return;
      }
    }
    if (!tanggalAmbil) {
      setPesanError("Silakan pilih tanggal pengambilan kue.");
      return;
    }
    if (ketersediaan.tanggal_minimal && tanggalAmbil < ketersediaan.tanggal_minimal) {
      setPesanError(`Tanggal pengambilan minimal adalah ${ketersediaan.tanggal_minimal}.`);
      return;
    }

    const tutup = (ketersediaan.tanggal_tutup || []).find((t) => t.tanggal === tanggalAmbil);
    if (tutup) {
      setPesanError(`Toko tutup pada tanggal tersebut: ${tutup.alasan || "Libur"}.`);
      return;
    }

    if ((ketersediaan.tanggal_penuh || []).includes(tanggalAmbil)) {
      setPesanError("Kuota dapur untuk kue custom pada tanggal ini sudah penuh.");
      return;
    }

    setActiveStep(2);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleBuatPesanan() {
    setPesanError("");
    setSedangProses(true);

    try {
      const payload = {
        nama_penerima: namaPenerima.trim(),
        no_wa: noWa.trim(),
        metode_pengiriman: metodePengiriman,
        alamat: metodePengiriman === "Kirim" ? alamat.trim() : "",
        id_zona: metodePengiriman === "Kirim" ? Number(idZona) : null,
        tanggal_ambil: tanggalAmbil,
        jam_ambil: jamAmbil,
        catatan: catatan.trim(),
        metode_bayar: metodeBayar,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setPesanError(data.pesan || "Gagal membuat pesanan.");
        setSedangProses(false);
        return;
      }

      setPesananSelesai(data);

      try {
        const urlQr = await QRCode.toDataURL(data.kode_pesanan, {
          width: 200,
          margin: 2,
          color: { dark: "#1c1917", light: "#ffffff" },
        });
        setQrTiketUrl(urlQr);
      } catch {}

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cravely_cart_updated"));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      setActiveStep(3);
    } catch {
      setPesanError("Terjadi kesalahan jaringan saat membuat pesanan.");
    } finally {
      setSedangProses(false);
    }
  }

  async function handleUploadBukti(e) {
    e.preventDefault();
    if (!berkasBukti || !pesananSelesai?.kode_pesanan) return;
    setSedangUnggahBukti(true);

    try {
      const formData = new FormData();
      formData.append("kode_pesanan", pesananSelesai.kode_pesanan);
      formData.append("jenis", mode === "DP" ? "DP" : "Lunas");
      formData.append("jumlah", String(pesananSelesai.jumlah_dp || totalBayar));
      formData.append("metode", metodeBayar);
      formData.append("bukti", berkasBukti);

      const res = await fetch("/api/pembayaran", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (res.ok) {
        setBuktiBerhasil(true);
      } else {
        alert(resData.pesan || "Gagal mengunggah bukti bayar.");
      }
    } catch {
      alert("Gagal mengunggah bukti bayar.");
    } finally {
      setSedangUnggahBukti(false);
    }
  }

  function handleBukaWhatsApp() {
    if (!pesananSelesai) return;
    const nomorWaToko = pengaturan?.no_wa || "6281234567890";
    const waBersih = nomorWaToko.replace(/[^0-9]/g, "");

    const teks = [
      "Halo Dapur Cakely,",
      `Saya ingin konfirmasi pesanan dengan kode *${pesananSelesai.kode_pesanan}*.`,
      `Nama: ${namaPenerima}`,
      `Total: ${formatRupiah(pesananSelesai.total_bayar)}`,
      `Tanggal: ${tanggalAmbil} jam ${jamAmbil}`,
      `Metode: ${metodePengiriman === "Kirim" ? "Kirim ke Alamat" : "Ambil di Toko"}`,
      "Mohon dicek ya, terima kasih!",
    ].join("\n");

    const url = `https://wa.me/${waBersih}?text=${encodeURIComponent(teks)}`;
    window.open(url, "_blank");
  }

  const kueCustomList = keranjang.filter((it) => it.jenis === "Custom");
  const kueKatalogList = keranjang.filter((it) => it.jenis === "Siap");

  if (sedangMemuat) {
    return (
      <div className="min-h-screen bg-[#FAF4EE] flex items-center justify-center pt-20">
        <p className="text-sm font-serif text-[#4A2E2B] animate-pulse">
          Memuat data pemesanan...
        </p>
      </div>
    );
  }

  if (activeStep !== 3 && keranjang.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF4EE] text-[#4A2E2B] pt-20 flex flex-col justify-between">
        <DynamicIslandNavbar showEntered={true} />
        <main className="max-w-xl mx-auto px-4 py-16 text-center my-auto">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#7D2330] mb-5">
            <ShoppingBag className="w-9 h-9 stroke-[1.6]" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A2E2B] mb-2">
            Keranjang Belanja Masih Kosong
          </h1>
          <p className="text-xs sm:text-sm text-[#7D5A50] mb-6 leading-relaxed">
            Belum ada kue di keranjangmu. Silakan jelajahi etalase menu atau rancang kue impianmu di Cake Studio!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/menu"
              className="px-6 py-2.5 rounded-full bg-[#7D2330] hover:bg-[#681C27] text-white text-xs sm:text-sm font-bold shadow-md transition"
            >
              Lihat Menu Kue
            </Link>
            <Link
              href="/pesan"
              className="px-6 py-2.5 rounded-full bg-white border border-[#ECDCCE] text-[#4A2E2B] text-xs sm:text-sm font-bold hover:bg-[#F3E5D8] transition"
            >
              Buka Cake Studio
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF4EE] text-[#4A2E2B] selection:bg-blush selection:text-cherry pt-14 sm:pt-16 flex flex-col justify-between relative overflow-x-clip font-sans">
      <DynamicIslandNavbar showEntered={true} />

      <div className="absolute top-0 left-0 pointer-events-none select-none z-0">
        <BotanicalTopLeft className="w-40 sm:w-56 lg:w-64 h-auto" color="#8A675C" opacity={0.5} />
      </div>
      <div className="absolute top-0 right-0 pointer-events-none select-none z-0">
        <BotanicalTopRight className="w-40 sm:w-56 lg:w-64 h-auto" color="#8A675C" opacity={0.5} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-12 w-full flex-1 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-7 pb-4 border-b border-[#EEDBCE]">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 text-[#7D2330] shrink-0 pt-1">
              <svg viewBox="0 0 60 46" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6,38 L48,38 L56,20 L14,20 Z" strokeLinejoin="round" />
                <path d="M6,38 L6,28 L14,10 L56,10 L56,20" strokeLinejoin="round" />
                <path d="M6,28 L48,28 L56,10" strokeLinejoin="round" />
                <circle cx="36" cy="6.5" r="3.5" stroke="currentColor" fill="#FAF4EE" />
                <path d="M36,3 Q38,0.5 41,1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1
                className="text-4xl sm:text-5xl text-[#4A2E2B] font-normal leading-none"
                style={{ fontFamily: "'Alex Brush', 'Great Vibes', 'Dancing Script', cursive" }}
              >
                Checkout
              </h1>
              <p className="text-xs sm:text-sm text-[#7D5A50] mt-1.5">
                Lengkapi data pesananmu dan lakukan pembayaran dengan mudah ♡
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  activeStep >= 1 ? "bg-[#4A2E2B] text-white" : "border border-[#CDBFAA] text-[#7D5A50]"
                }`}
              >
                1
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#4A2E2B] mt-1">
                Data Pengiriman
              </span>
            </div>

            <div
              className={`w-10 sm:w-14 h-[2px] -mt-4 transition-colors ${
                activeStep >= 2 ? "bg-[#4A2E2B]" : "bg-[#CDBFAA]"
              }`}
            />

            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  activeStep >= 2 ? "bg-[#4A2E2B] text-white" : "border border-[#CDBFAA] text-[#7D5A50]"
                }`}
              >
                2
              </div>
              <span
                className={`text-[11px] sm:text-xs mt-1 ${
                  activeStep >= 2 ? "font-bold text-[#4A2E2B]" : "text-[#7D5A50]"
                }`}
              >
                Pembayaran
              </span>
            </div>

            <div
              className={`w-10 sm:w-14 h-[2px] -mt-4 transition-colors ${
                activeStep === 3 ? "bg-[#4A2E2B]" : "bg-[#CDBFAA]"
              }`}
            />

            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  activeStep === 3 ? "bg-[#4A2E2B] text-white" : "border border-[#CDBFAA] text-[#7D5A50]"
                }`}
              >
                3
              </div>
              <span
                className={`text-[11px] sm:text-xs mt-1 ${
                  activeStep === 3 ? "font-bold text-[#4A2E2B]" : "text-[#7D5A50]"
                }`}
              >
                Selesai
              </span>
            </div>
          </div>
        </div>

        {pesanError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center justify-between">
            <span>{pesanError}</span>
            <button
              type="button"
              onClick={() => setPesanError("")}
              className="text-red-800 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-9 items-start">
          <div className="lg:col-span-8 w-full space-y-6">
            {activeStep === 1 && (
              <form onSubmit={handleLanjutKePembayaran} className="space-y-6">
                <div className="bg-[#FAF4ED] rounded-[24px] border border-[#ECDCCE] p-5 sm:p-7 shadow-[0_2px_12px_rgba(90,56,47,0.03)] space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#4A2E2B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </div>
                    <Truck className="w-5 h-5 text-[#4A2E2B] stroke-[1.8]" />
                    <div>
                      <h2 className="font-serif font-bold text-base sm:text-lg text-[#4A2E2B] leading-tight">
                        Informasi Pengiriman & Pengambilan
                      </h2>
                      <p className="text-xs text-[#7D5A50]">
                        Pastikan kontak dan waktu pengambilan sudah sesuai
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#4A2E2B] mb-1">
                          Nama Pemesan *
                        </label>
                        <input
                          type="text"
                          required
                          value={namaPenerima}
                          onChange={(e) => setNamaPenerima(e.target.value)}
                          placeholder="Masukkan nama pemesan"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D4C6] bg-white/70 text-xs sm:text-sm text-[#4A2E2B] placeholder-[#9E8278] focus:outline-none focus:border-[#7D2330] focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4A2E2B] mb-1">
                          Nomor WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          value={noWa}
                          onChange={(e) => setNoWa(e.target.value)}
                          placeholder="Contoh: 081234567890"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D4C6] bg-white/70 text-xs sm:text-sm text-[#4A2E2B] placeholder-[#9E8278] focus:outline-none focus:border-[#7D2330] focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4A2E2B] mb-1.5">
                        Metode Pengambilan *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setMetodePengiriman("Ambil")}
                          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                            metodePengiriman === "Ambil"
                              ? "border-[#7D2330] bg-[#FFF5F2] ring-1 ring-[#7D2330]"
                              : "border-[#E6D4C6] bg-white/70 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="metode"
                              checked={metodePengiriman === "Ambil"}
                              onChange={() => setMetodePengiriman("Ambil")}
                              className="accent-[#7D2330]"
                            />
                            <span className="font-bold text-xs sm:text-sm text-[#4A2E2B]">
                              Ambil di Toko
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7D5A50] mt-1 pl-5">
                            Gratis (Rp 0) di outlet Cakely
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMetodePengiriman("Kirim")}
                          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                            metodePengiriman === "Kirim"
                              ? "border-[#7D2330] bg-[#FFF5F2] ring-1 ring-[#7D2330]"
                              : "border-[#E6D4C6] bg-white/70 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="metode"
                              checked={metodePengiriman === "Kirim"}
                              onChange={() => setMetodePengiriman("Kirim")}
                              className="accent-[#7D2330]"
                            />
                            <span className="font-bold text-xs sm:text-sm text-[#4A2E2B]">
                              Kirim ke Alamat
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7D5A50] mt-1 pl-5">
                            Kurir khusus kue berpendingin
                          </p>
                        </button>
                      </div>
                    </div>

                    {metodePengiriman === "Kirim" && (
                      <div className="space-y-3.5 p-4 rounded-2xl bg-white/60 border border-[#EEDBCE]">
                        <div>
                          <label className="block text-xs font-semibold text-[#4A2E2B] mb-1">
                            Zona Pengiriman *
                          </label>
                          <select
                            value={idZona}
                            onChange={(e) => setIdZona(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#E6D4C6] bg-white text-xs sm:text-sm text-[#4A2E2B] focus:outline-none focus:border-[#7D2330] cursor-pointer"
                          >
                            {daftarZona.map((z) => (
                              <option key={z.id} value={z.id}>
                                {z.nama} — {formatRupiah(z.tarif)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#4A2E2B] mb-1">
                            Alamat Lengkap *
                          </label>
                          <div className="relative">
                            <MapPin className="w-4 h-4 text-[#8C6D62] absolute left-3.5 top-3" />
                            <textarea
                              rows={2}
                              required
                              value={alamat}
                              onChange={(e) => setAlamat(e.target.value)}
                              placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan..."
                              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E6D4C6] bg-white text-xs sm:text-sm text-[#4A2E2B] placeholder-[#9E8278] focus:outline-none focus:border-[#7D2330] transition"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#4A2E2B] mb-1">
                          Tanggal Pengambilan *
                        </label>
                        <input
                          type="date"
                          required
                          min={ketersediaan.tanggal_minimal}
                          value={tanggalAmbil}
                          onChange={(e) => setTanggalAmbil(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D4C6] bg-white/70 text-xs sm:text-sm text-[#4A2E2B] focus:outline-none focus:border-[#7D2330] focus:bg-white transition"
                        />
                        {ketersediaan.tanggal_minimal && (
                          <p className="text-[11px] text-[#7D5A50] mt-1">
                            Minimal tanggal: {ketersediaan.tanggal_minimal}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#4A2E2B] mb-1">
                          Jam Pengambilan *
                        </label>
                        <select
                          value={jamAmbil}
                          onChange={(e) => setJamAmbil(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#E6D4C6] bg-white/70 text-xs sm:text-sm text-[#4A2E2B] focus:outline-none focus:border-[#7D2330] focus:bg-white transition cursor-pointer"
                        >
                          {listJam.map((j) => (
                            <option key={j} value={j}>
                              {j} WIB
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4A2E2B] mb-1">
                        Catatan Pesanan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        placeholder="Contoh: lilin angka 24, jangan terlalu manis, dll."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D4C6] bg-white/70 text-xs sm:text-sm text-[#4A2E2B] placeholder-[#9E8278] focus:outline-none focus:border-[#7D2330] focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#7D2330] hover:bg-[#681C27] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <span>Lanjut ke Pembayaran →</span>
                  </button>
                </div>
              </form>
            )}

            {activeStep === 2 && (
              <div className="bg-[#FAF4ED] rounded-[24px] border border-[#ECDCCE] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#EEDBCE] pb-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#4A2E2B]">
                      Pilih Metode Pembayaran
                    </h2>
                    <p className="text-xs text-[#7D5A50] mt-0.5">
                      Jumlah bayar sekarang:{" "}
                      <strong className="text-[#7D2330] font-mono lining-nums">
                        {formatRupiah(jumlahDp)}
                      </strong>{" "}
                      ({mode === "DP" ? `DP ${pengaturan?.persen_dp ?? 50}%` : "Lunas"})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs font-semibold text-[#7D5A50] hover:text-[#7D2330] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Ubah Data
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setMetodeBayar("Transfer Bank")}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                      metodeBayar === "Transfer Bank"
                        ? "border-[#7D2330] bg-[#FFF5F2] ring-1 ring-[#7D2330]"
                        : "border-[#E6D4C6] bg-white/70 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#7D2330] flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-[#4A2E2B]">
                        Transfer Bank
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7D5A50]">
                      Transfer manual ke rekening resmi toko Cakely
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodeBayar("QRIS")}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                      metodeBayar === "QRIS"
                        ? "border-[#7D2330] bg-[#FFF5F2] ring-1 ring-[#7D2330]"
                        : "border-[#E6D4C6] bg-white/70 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#7D2330] flex items-center justify-center">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-[#4A2E2B]">
                        QRIS Instan
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7D5A50]">
                      Scan QRIS dari aplikasi bank atau dompet digital
                    </p>
                  </button>
                </div>

                {metodeBayar === "Transfer Bank" && (
                  <div className="bg-white rounded-2xl p-5 border border-[#E6D4C6] space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#7D5A50]">Bank Tujuan:</span>
                      <span className="font-bold text-[#4A2E2B]">
                        {pengaturan?.nama_bank || "BCA"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-[#F0E3D7] pt-2">
                      <span className="text-[#7D5A50]">Nomor Rekening:</span>
                      <span className="font-mono font-bold text-base text-[#4A2E2B]">
                        {pengaturan?.no_rekening || "88012345678"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-[#F0E3D7] pt-2">
                      <span className="text-[#7D5A50]">Atas Nama:</span>
                      <span className="font-bold text-[#4A2E2B]">
                        {pengaturan?.atas_nama || "Cakely Patisserie"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-[#F0E3D7] pt-2">
                      <span className="text-[#7D5A50]">Total Ditransfer:</span>
                      <span className="font-serif font-bold text-lg text-[#7D2330] lining-nums">
                        {formatRupiah(jumlahDp)}
                      </span>
                    </div>
                  </div>
                )}

                {metodeBayar === "QRIS" && (
                  <div className="text-center py-6 bg-white rounded-2xl border border-[#E6D4C6] space-y-3">
                    <p className="text-xs text-[#7D5A50]">
                      Pindai QRIS berikut menggunakan aplikasi m-Banking atau E-Wallet:
                    </p>
                    <div className="w-44 h-44 mx-auto bg-[#FAF0E6] rounded-xl border border-[#8C6D62] flex items-center justify-center p-3 overflow-hidden">
                      {pengaturan?.gambar_qris ? (
                        <img
                          src={pengaturan.gambar_qris}
                          alt="QRIS Toko"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <QrCode className="w-20 h-20 text-[#4A2E2B] mx-auto opacity-70" />
                          <span className="text-[10px] text-[#7D5A50] mt-1 block">
                            QRIS Toko
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="font-serif font-bold text-lg text-[#4A2E2B] lining-nums">
                      {formatRupiah(jumlahDp)}
                    </p>
                  </div>
                )}

                <div className="text-xs text-[#7D5A50] bg-[#FAF0E6] p-3.5 rounded-xl border border-[#E8DACB]">
                  Batas waktu pembayaran adalah{" "}
                  <strong>{pengaturan?.batas_bayar_jam ?? 24} jam</strong> setelah pesanan dibuat. Bukti transfer dapat diunggah langsung di langkah berikutnya.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-6 py-3 rounded-2xl border border-[#ECDCCE] text-[#4A2E2B] text-xs sm:text-sm font-semibold hover:bg-white transition cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={sedangProses}
                    onClick={handleBuatPesanan}
                    className="px-8 py-3 rounded-2xl bg-[#7D2330] hover:bg-[#681C27] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {sedangProses ? "Membuat Pesanan..." : "Buat Pesanan Sekarang →"}
                  </button>
                </div>
              </div>
            )}

            {activeStep === 3 && pesananSelesai && (
              <div className="bg-[#FAF4ED] rounded-[24px] border border-[#ECDCCE] p-6 sm:p-8 space-y-6 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A2E2B]">
                    Pesanan Berhasil Dibuat!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7D5A50] mt-1">
                    Kode Pesanan Anda:{" "}
                    <strong className="font-mono text-base text-[#7D2330]">
                      {pesananSelesai.kode_pesanan}
                    </strong>
                  </p>
                </div>

                {qrTiketUrl && (
                  <div className="w-48 mx-auto bg-white p-3 rounded-2xl border border-[#E6D4C6] shadow-xs">
                    <img src={qrTiketUrl} alt="QR Tiket" className="w-full h-auto mx-auto" />
                    <span className="text-[10px] text-[#7D5A50] font-mono mt-1 block">
                      {pesananSelesai.kode_pesanan}
                    </span>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-5 border border-[#ECDCCE] max-w-md mx-auto text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#7D5A50]">Total Tagihan:</span>
                    <span className="font-bold text-[#4A2E2B] lining-nums">
                      {formatRupiah(pesananSelesai.total_bayar)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7D5A50]">Jumlah Harus Dibayar:</span>
                    <span className="font-bold text-[#7D2330] lining-nums">
                      {formatRupiah(pesananSelesai.jumlah_dp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7D5A50]">Tanggal Pengambilan:</span>
                    <span className="font-bold text-[#4A2E2B]">{tanggalAmbil} ({jamAmbil} WIB)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7D5A50]">Metode:</span>
                    <span className="font-bold text-[#4A2E2B]">
                      {metodePengiriman === "Kirim" ? "Kirim ke Alamat" : "Ambil di Toko"}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#ECDCCE] max-w-md mx-auto text-left">
                  <h3 className="font-bold text-xs sm:text-sm text-[#4A2E2B] mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#7D2330]" />
                    <span>Unggah Bukti Pembayaran</span>
                  </h3>

                  {buktiBerhasil ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center">
                      Bukti pembayaran telah berhasil dikirim! Tim kami akan segera memverifikasinya.
                    </div>
                  ) : (
                    <form onSubmit={handleUploadBukti} className="space-y-3">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => setBerkasBukti(e.target.files[0])}
                        className="w-full text-xs text-[#7D5A50] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FAF0E6] file:text-[#4A2E2B] hover:file:bg-[#F3E5D8]"
                      />
                      <button
                        type="submit"
                        disabled={!berkasBukti || sedangUnggahBukti}
                        className="w-full py-2.5 rounded-xl bg-[#7D2330] hover:bg-[#681C27] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        {sedangUnggahBukti ? "Mengunggah..." : "Kirim Bukti Pembayaran"}
                      </button>
                    </form>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBukaWhatsApp}
                    className="px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
                  >
                    Konfirmasi WhatsApp Toko
                  </button>
                  <Link
                    href={`/pesanan-saya/${pesananSelesai.kode_pesanan}`}
                    className="px-6 py-3 rounded-full bg-[#7D2330] hover:bg-[#681C27] text-white text-xs sm:text-sm font-bold shadow-md transition"
                  >
                    Lihat Tiket Pesanan
                  </Link>
                  <Link
                    href="/pesanan-saya"
                    className="px-6 py-3 rounded-full bg-white border border-[#ECDCCE] text-[#4A2E2B] text-xs sm:text-sm font-bold hover:bg-[#F3E5D8] transition"
                  >
                    Daftar Pesanan Saya
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 w-full">
            <div className="rounded-[26px] border border-[#ECDCCE] bg-[#FAF4ED] shadow-sm overflow-hidden">
              <div className="bg-[#7D2330] text-white px-6 py-5">
                <h2
                  className="text-2xl sm:text-[26px] font-normal text-white tracking-wide leading-tight"
                  style={{ fontFamily: "'Alex Brush', 'Great Vibes', 'Dancing Script', cursive" }}
                >
                  Ringkasan Pesanan
                </h2>
                <p className="text-xs text-[#FAF4EE]/85 mt-1 leading-relaxed">
                  Cek kembali pesanan kamu sebelum melanjutkan pembayaran
                </p>
              </div>

              <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
                {kueCustomList.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-[#7D2330] tracking-wider uppercase block">
                      Kue Custom ({kueCustomList.length})
                    </span>
                    <div className="divide-y divide-[#EEDBCE]">
                      {kueCustomList.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#F5ECE3] border border-[#E6D4C6] flex items-center justify-center">
                              {item.foto_preview_url ? (
                                <img
                                  src={item.foto_preview_url}
                                  alt="Custom Cake"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ShoppingBag className="w-5 h-5 text-[#8C6D62]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-serif font-bold text-xs sm:text-sm text-[#4A2E2B] truncate">
                                {item.nama || "Kue Custom"}
                              </h3>
                              <p className="text-[10px] text-[#7D5A50] line-clamp-2 mt-0.5">
                                {(item.rincian_opsi || [])
                                  .map((o) => `${o.nama}${o.jumlah > 1 ? ` x${o.jumlah}` : ""}`)
                                  .join(", ") || "Desain kustom studio"}
                              </p>
                              {item.tulisan_kue && (
                                <p className="text-[10px] text-[#7D2330] italic mt-0.5">
                                  &ldquo;{item.tulisan_kue}&rdquo;
                                </p>
                              )}
                              <p className="font-serif font-bold text-xs text-[#4A2E2B] mt-1 lining-nums">
                                {formatRupiah(item.harga_satuan)}
                              </p>
                            </div>
                          </div>
                          {activeStep === 1 && (
                            <button
                              type="button"
                              onClick={() => hapusItem(item.id)}
                              className="text-[#8C6D62] hover:text-[#7D2330] p-1 transition cursor-pointer shrink-0"
                              title="Hapus kue custom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {kueKatalogList.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-bold text-[#7D2330] tracking-wider uppercase block">
                      Kue Katalog ({kueKatalogList.length})
                    </span>
                    <div className="divide-y divide-[#EEDBCE]">
                      {kueKatalogList.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#F5ECE3] border border-[#E6D4C6] flex items-center justify-center">
                              {item.foto_url ? (
                                <img
                                  src={item.foto_url}
                                  alt={item.nama}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ShoppingBag className="w-5 h-5 text-[#8C6D62]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-serif font-bold text-xs sm:text-sm text-[#4A2E2B] truncate">
                                {item.nama}
                              </h3>
                              <p className="font-serif text-xs text-[#7D5A50] mt-0.5 lining-nums">
                                {formatRupiah(item.harga_satuan)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {activeStep === 1 ? (
                              <div className="flex items-center border border-[#ECD9CC] rounded-full px-2 py-0.5 bg-white">
                                <button
                                  type="button"
                                  onClick={() => ubahJumlahItem(item.id, item.jumlah - 1)}
                                  disabled={item.jumlah <= 1}
                                  className="text-[#6E4238] hover:text-[#7D2330] p-0.5 disabled:opacity-30 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-serif font-bold text-xs px-2 text-[#4A2E2B] lining-nums">
                                  {item.jumlah}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => ubahJumlahItem(item.id, item.jumlah + 1)}
                                  disabled={item.jumlah >= 20}
                                  className="text-[#6E4238] hover:text-[#7D2330] p-0.5 disabled:opacity-30 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-serif font-bold text-xs text-[#4A2E2B] lining-nums">
                                × {item.jumlah}
                              </span>
                            )}

                            {activeStep === 1 && (
                              <button
                                type="button"
                                onClick={() => hapusItem(item.id)}
                                className="text-[#8C6D62] hover:text-[#7D2330] p-1 transition cursor-pointer"
                                title="Hapus produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[#EEDBCE] space-y-2 text-[#5C3D32]">
                  {ringkasan.subtotal_custom > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Subtotal Kue Custom</span>
                      <span className="font-serif font-bold text-[#4A2E2B] lining-nums">
                        {formatRupiah(ringkasan.subtotal_custom)}
                      </span>
                    </div>
                  )}

                  {ringkasan.subtotal_katalog > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Subtotal Kue Katalog</span>
                      <span className="font-serif font-bold text-[#4A2E2B] lining-nums">
                        {formatRupiah(ringkasan.subtotal_katalog)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>Ongkos Kirim</span>
                    <span className="font-serif font-bold text-[#4A2E2B] lining-nums">
                      {formatRupiah(ongkir)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EEDBCE] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-serif font-bold text-sm sm:text-base text-[#4A2E2B]">
                      Total Pesanan
                    </span>
                    <span className="font-serif font-bold text-lg sm:text-xl text-[#4A2E2B] lining-nums">
                      {formatRupiah(totalBayar)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#7D5A50]">
                      Bayar Sekarang ({mode === "DP" ? `DP ${pengaturan?.persen_dp ?? 50}%` : "Lunas"}):
                    </span>
                    <span className="font-serif font-bold text-[#7D2330] text-sm lining-nums">
                      {formatRupiah(jumlahDp)}
                    </span>
                  </div>

                  {sisaBayar > 0 && (
                    <div className="flex justify-between items-center text-xs text-[#7D5A50]">
                      <span>Sisa Pembayaran (Saat Ambil):</span>
                      <span className="font-serif font-bold text-[#4A2E2B] lining-nums">
                        {formatRupiah(sisaBayar)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col items-center sm:items-end pr-2 sm:pr-4">
              <p
                className="text-xl sm:text-2xl text-[#7D5A50] leading-snug select-none text-center sm:text-right"
                style={{ fontFamily: "'Alex Brush', 'Great Vibes', 'Dancing Script', cursive" }}
              >
                Terima kasih<br />
                <span className="relative inline-block mt-0.5">
                  sudah memilih Cakely ♡
                  <svg
                    className="w-full h-2.5 text-[#7D5A50]/70 -mt-0.5"
                    viewBox="0 0 160 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <path d="M4,3 Q80,11 156,2" strokeLinecap="round" />
                  </svg>
                </span>
              </p>

              <div className="w-36 h-24 mt-2 opacity-85 text-[#6E4238]">
                <svg viewBox="0 0 200 130" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <ellipse cx="100" cy="105" rx="75" ry="12" stroke="currentColor" opacity="0.65" />
                  <path d="M30,105 Q100,118 170,105" opacity="0.35" />
                  <path d="M38,95 L145,68 L145,35 L38,65 Z" fill="#FFFDF9" fillOpacity="0.85" />
                  <path d="M38,65 L95,24 L145,35 Z" fill="#FAF4EE" fillOpacity="0.9" />
                  <path d="M38,95 L38,65" />
                  <path d="M145,68 L145,35" />
                  <path d="M38,80 L145,52" strokeDasharray="2,1.5" />
                  <circle cx="80" cy="24" r="7" stroke="currentColor" fill="#FFFDF9" />
                  <circle cx="92" cy="21" r="5" stroke="currentColor" fill="#FFFDF9" />
                  <path d="M80,17 Q82,10 88,11" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full relative h-24 pointer-events-none select-none overflow-hidden z-0">
        <div className="absolute right-0 bottom-0 pointer-events-none select-none">
          <BotanicalBottomRight
            className="w-36 sm:w-48 lg:w-56 h-auto"
            color="#8A675C"
            opacity={0.4}
          />
        </div>
      </footer>
    </div>
  );
}
