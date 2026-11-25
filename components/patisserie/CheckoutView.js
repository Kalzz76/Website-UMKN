"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import dynamic from "next/dynamic";
import {
  MapPin,
  Truck,
  ShoppingBag,
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  Search,
  AlertCircle,
  Calendar,
  Clock,
  Store,
} from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { getFotoProdukFallback } from "@/lib/fotoProdukFallback";
import RootLoading from "@/app/loading";
import {
  BotanicalTopLeft,
  BotanicalTopRight,
  BotanicalBottomRight,
} from "./BotanicalBranchDecor";
import { DynamicIslandNavbar } from "./DynamicIslandNavbar";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

const PetaLokasi = dynamic(() => import("@/components/PetaLokasi"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-2xl bg-[#F5ECE3] flex items-center justify-center text-xs text-[#7D5A50] animate-pulse">
      Memuat peta lokasi...
    </div>
  ),
});

function validasiWa(noWaRaw) {
  const bersih = (noWaRaw || "").trim().replace(/[\s\-]/g, "");
  return /^(\+628|628|08)(\d{8,13})$/.test(bersih);
}

function formatRentangTanggal(awal, akhir) {
  if (!awal) return "";
  if (!akhir || awal === akhir) return formatTanggal(awal);
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
  return `${formatTanggal(awal)} sampai ${formatTanggal(akhir)}`;
}

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
  const [patokan, setPatokan] = useState("");
  const [posisiTujuan, setPosisiTujuan] = useState(null);
  const [posisiToko, setPosisiToko] = useState(null);
  const [tokoBelumDiatur, setTokoBelumDiatur] = useState(false);

  const [jarakKm, setJarakKm] = useState(null);
  const [ongkirServer, setOngkirServer] = useState(0);
  const [sedangHitungOngkir, setSedangHitungOngkir] = useState(false);
  const [errorOngkir, setErrorOngkir] = useState("");

  const [queryCari, setQueryCari] = useState("");
  const [hasilCari, setHasilCari] = useState([]);
  const [sedangCariAlamat, setSedangCariAlamat] = useState(false);

  const [tanggalAmbil, setTanggalAmbil] = useState("");
  const [jamAmbil, setJamAmbil] = useState("09:00");
  const [tanggalPastiKirim, setTanggalPastiKirim] = useState("");
  const [bukaPilihTanggalKirim, setBukaPilihTanggalKirim] = useState(false);

  const [catatan, setCatatan] = useState("");

  const [ketersediaan, setKetersediaan] = useState({
    tanggal_minimal: "",
    tanggal_tutup: [],
    tanggal_penuh: [],
    jam_buka: "08:00",
    jam_tutup: "20:00",
    estimasi: null,
  });
  const [pengaturan, setPengaturan] = useState(null);

  const [sedangProses, setSedangProses] = useState(false);
  const [pesanError, setPesanError] = useState("");

  const debounceTimerRef = useRef(null);

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const isProduction =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ||
    (!clientKey.startsWith("SB-") && clientKey.length > 0);
  const snapScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const namaToko = pengaturan?.nama_toko || "Cravely";

  async function muatDataKeranjang() {
    try {
      const res = await fetch("/api/keranjang", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/masuk?ke=/checkout");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const items = data.keranjang || [];
        if (items.length === 0) {
          router.push("/keranjang");
          return;
        }
        setKeranjang(items);
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
      router.push("/masuk?ke=/checkout");
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

    const { data: toko } = await supabase
      .from("pengaturan_toko")
      .select("*")
      .eq("id", 1)
      .single();

    if (toko) {
      setPengaturan(toko);
      if (toko.lat_toko !== null && toko.lng_toko !== null) {
        setPosisiToko({ lat: Number(toko.lat_toko), lng: Number(toko.lng_toko) });
      } else {
        setTokoBelumDiatur(true);
      }
    }

    try {
      const resK = await fetch("/api/ketersediaan?metode=Kirim", { cache: "no-store" });
      if (resK.ok) {
        const dataK = await resK.json();
        setKetersediaan(dataK);
        if (dataK.tanggal_minimal) {
          setTanggalAmbil(dataK.tanggal_minimal);
        }
      }
    } catch {}

    let lokasiTerisi = false;
    try {
      const resProf = await fetch("/api/profil", { cache: "no-store" });
      if (resProf.ok) {
        const jsonProf = await resProf.json();
        const p = jsonProf?.profil;
        if (p?.alamat) {
          setAlamat(p.alamat);
          lokasiTerisi = true;
        }
        if (p?.patokan) setPatokan(p.patokan);
        if (p?.lat_alamat && p?.lng_alamat) {
          const pos = {
            lat: Number(p.lat_alamat),
            lng: Number(p.lng_alamat),
          };
          setPosisiTujuan(pos);
          hitungOngkirLokasi(pos.lat, pos.lng);
          lokasiTerisi = true;
        }
      }
    } catch {}

    if (!lokasiTerisi) {
      try {
        const resLast = await fetch("/api/pesanan/terakhir-kirim", { cache: "no-store" });
        if (resLast.ok) {
          const jsonLast = await resLast.json();
          if (jsonLast?.data) {
            if (jsonLast.data.alamat) setAlamat(jsonLast.data.alamat);
            if (jsonLast.data.patokan) setPatokan(jsonLast.data.patokan);
            if (jsonLast.data.lat_tujuan && jsonLast.data.lng_tujuan) {
              const pos = {
                lat: Number(jsonLast.data.lat_tujuan),
                lng: Number(jsonLast.data.lng_tujuan),
              };
              setPosisiTujuan(pos);
              hitungOngkirLokasi(pos.lat, pos.lng);
            }
          }
        }
      } catch {}
    }

    await muatDataKeranjang();
    setSedangMemuat(false);
  }

  useEffect(() => {
    muatDataAwal();
  }, []);

  async function hitungOngkirLokasi(lat, lng) {
    if (!lat || !lng) return;
    setSedangHitungOngkir(true);
    setErrorOngkir("");

    try {
      const res = await fetch("/api/ongkir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat_tujuan: lat, lng_tujuan: lng }),
      });

      const data = await res.json();
      if (data.status === "ok") {
        setJarakKm(data.jarak_km);
        setOngkirServer(Number(data.ongkir || 0));
        setErrorOngkir("");
      } else if (data.status === "diluarJangkauan") {
        setJarakKm(data.jarak_km || null);
        setOngkirServer(0);
        setErrorOngkir(data.pesan || "Lokasi di luar jangkauan pengiriman toko.");
      } else if (data.status === "tokoBelumDiatur") {
        setTokoBelumDiatur(true);
        setErrorOngkir("Pengiriman belum tersedia.");
      } else {
        setOngkirServer(0);
        setErrorOngkir(data.pesan || "Gagal menghitung ongkir.");
      }
    } catch {
      setErrorOngkir("Terjadi gangguan koneksi saat menghitung tarif pengiriman.");
    } finally {
      setSedangHitungOngkir(false);
    }
  }

  function handleUbahPin(lat, lng) {
    setPosisiTujuan({ lat, lng });
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      hitungOngkirLokasi(lat, lng);
    }, 400);
  }

  async function handleCariAlamat(e) {
    if (e) e.preventDefault();
    if (!queryCari.trim() || queryCari.trim().length < 3) return;

    setSedangCariAlamat(true);
    setHasilCari([]);
    try {
      const res = await fetch(`/api/cari-alamat?q=${encodeURIComponent(queryCari.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setHasilCari(data.hasil || []);
      }
    } catch {
    } finally {
      setSedangCariAlamat(false);
    }
  }

  function handlePilihAlamat(item) {
    setAlamat(item.display_name);
    setQueryCari("");
    setHasilCari([]);
    handleUbahPin(item.lat, item.lon);
  }

  function hitungRingkasanCheckout(list, prevRingkasan) {
    let subtotal_custom = 0;
    let subtotal_katalog = 0;
    for (const it of list) {
      const sub = Number(it.subtotal ?? (Number(it.harga_satuan || 0) * Number(it.jumlah || 1)));
      if (it.jenis === "Custom") {
        subtotal_custom += sub;
      } else {
        subtotal_katalog += sub;
      }
    }
    return {
      ...prevRingkasan,
      subtotal_custom,
      subtotal_katalog,
      total_kue: subtotal_custom + subtotal_katalog,
    };
  }

  async function ubahJumlahItem(id, jumlahBaru) {
    if (jumlahBaru < 1 || jumlahBaru > 20) return;

    const snapshotKeranjang = keranjang;
    const snapshotRingkasan = ringkasan;
    const keranjangBaru = keranjang.map((it) => {
      if (it.id !== id) return it;
      const hargaSatuan = Number(it.harga_satuan ?? (Number(it.subtotal || 0) / Math.max(1, Number(it.jumlah || 1))));
      return {
        ...it,
        jumlah: jumlahBaru,
        subtotal: hargaSatuan * jumlahBaru,
      };
    });

    setKeranjang(keranjangBaru);
    setRingkasan((prev) => hitungRingkasanCheckout(keranjangBaru, prev));

    try {
      const res = await fetch("/api/keranjang", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, jumlah: jumlahBaru }),
      });
      if (res.ok) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cravely_cart_updated"));
        }
      } else {
        setKeranjang(snapshotKeranjang);
        setRingkasan(snapshotRingkasan);
      }
    } catch {
      setKeranjang(snapshotKeranjang);
      setRingkasan(snapshotRingkasan);
    }
  }

  async function hapusItem(id) {
    const snapshotKeranjang = keranjang;
    const snapshotRingkasan = ringkasan;
    const keranjangBaru = keranjang.filter((it) => it.id !== id);

    setKeranjang(keranjangBaru);
    setRingkasan((prev) => hitungRingkasanCheckout(keranjangBaru, prev));

    try {
      const res = await fetch(`/api/keranjang?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cravely_cart_updated"));
        }
      } else {
        setKeranjang(snapshotKeranjang);
        setRingkasan(snapshotRingkasan);
      }
    } catch {
      setKeranjang(snapshotKeranjang);
      setRingkasan(snapshotRingkasan);
    }
  }

  const adaItemTidakTersedia = keranjang.some((it) => it.tersedia === false);
  const ongkirFinal = metodePengiriman === "Kirim" ? ongkirServer : 0;
  const subtotalCustom = Number(ringkasan.subtotal_custom || 0);
  const subtotalKatalog = Number(ringkasan.subtotal_katalog || 0);
  const totalKue = subtotalCustom + subtotalKatalog;
  const totalBayar = totalKue + ongkirFinal;

  const mode = pengaturan?.mode_pembayaran || ringkasan.mode_pembayaran || "DP";
  let bayarSekarang = totalBayar;
  let sisaBayar = 0;
  if (mode === "DP") {
    const persen = Number(pengaturan?.persen_dp ?? ringkasan.persen_dp ?? 50);
    const dpCustom = Math.round((subtotalCustom * persen) / 100);
    bayarSekarang = dpCustom + subtotalKatalog + ongkirFinal;
    sisaBayar = Math.max(0, totalBayar - bayarSekarang);
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

  function formulirValid() {
    if (!namaPenerima.trim()) return false;
    if (!validasiWa(noWa)) return false;
    if (adaItemTidakTersedia) return false;

    if (metodePengiriman === "Kirim") {
      if (tokoBelumDiatur) return false;
      if (!alamat.trim()) return false;
      if (!posisiTujuan?.lat || !posisiTujuan?.lng) return false;
      if (errorOngkir || sedangHitungOngkir) return false;
      if (ongkirFinal <= 0 && jarakKm === null) return false;
      if (tanggalPastiKirim && tanggalPastiKirim < (ketersediaan.estimasi?.tanggalAwal || ketersediaan.tanggal_minimal)) {
        return false;
      }
    } else {
      if (!tanggalAmbil) return false;
      if (!jamAmbil) return false;
      if (tanggalAmbil < ketersediaan.tanggal_minimal) return false;
      const tutup = (ketersediaan.tanggal_tutup || []).find((t) => t.tanggal === tanggalAmbil);
      if (tutup) return false;
      if ((ketersediaan.tanggal_penuh || []).includes(tanggalAmbil)) return false;
    }

    return true;
  }

  function handleLanjutKeLangkah2(e) {
    e.preventDefault();
    setPesanError("");

    if (!namaPenerima.trim()) {
      setPesanError("Nama pemesan wajib diisi.");
      return;
    }

    if (!validasiWa(noWa)) {
      setPesanError("Nomor WhatsApp tidak valid. Format: 08xx / 628xx (9-13 digit).");
      return;
    }

    if (metodePengiriman === "Kirim") {
      if (tokoBelumDiatur) {
        setPesanError("Pengiriman belum tersedia untuk saat ini.");
        return;
      }
      if (!alamat.trim()) {
        setPesanError("Alamat pengiriman wajib diisi.");
        return;
      }
      if (!posisiTujuan) {
        setPesanError("Silakan tentukan titik pin lokasi pengiriman pada peta.");
        return;
      }
      if (errorOngkir) {
        setPesanError(errorOngkir);
        return;
      }
    } else {
      if (!tanggalAmbil) {
        setPesanError("Silakan pilih tanggal pengambilan kue.");
        return;
      }
      if (tanggalAmbil < ketersediaan.tanggal_minimal) {
        setPesanError(`Tanggal pengambilan minimal adalah ${formatTanggal(ketersediaan.tanggal_minimal)}.`);
        return;
      }
      const tutup = (ketersediaan.tanggal_tutup || []).find((t) => t.tanggal === tanggalAmbil);
      if (tutup) {
        setPesanError(`Toko tutup pada tanggal tersebut: ${tutup.alasan || "Libur"}.`);
        return;
      }
      if ((ketersediaan.tanggal_penuh || []).includes(tanggalAmbil)) {
        setPesanError("Kapasitas dapur kue custom pada tanggal ini sudah penuh.");
        return;
      }
    }

    setActiveStep(2);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleBayarSekarang() {
    setPesanError("");
    setSedangProses(true);

    let kodePesananHasil = "";

    try {
      const payload = {
        nama_penerima: namaPenerima.trim(),
        no_wa: noWa.trim(),
        metode_pengiriman: metodePengiriman,
        catatan: catatan.trim(),
      };

      if (metodePengiriman === "Kirim") {
        payload.alamat = alamat.trim();
        payload.patokan = patokan.trim();
        payload.lat_tujuan = posisiTujuan.lat;
        payload.lng_tujuan = posisiTujuan.lng;
        payload.tanggal_diminta = tanggalPastiKirim || "";
      } else {
        payload.tanggal_ambil = tanggalAmbil;
        payload.jam_ambil = jamAmbil;
      }

      const resCheckout = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dataCheckout = await resCheckout.json();

      if (resCheckout.status === 409 && dataCheckout.kode_pesanan) {
        kodePesananHasil = dataCheckout.kode_pesanan;
      } else if (!resCheckout.ok || !dataCheckout.kode_pesanan) {
        setPesanError(dataCheckout.pesan || "Gagal membuat pesanan. Silakan periksa formulir.");
        setSedangProses(false);
        return;
      } else {
        kodePesananHasil = dataCheckout.kode_pesanan;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cravely_cart_updated"));
      }

      const resToken = await fetch("/api/midtrans/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode_pesanan: kodePesananHasil,
          jenis: mode === "DP" ? "DP" : "Lunas",
        }),
      });

      const dataToken = await resToken.json();

      if (!resToken.ok || !dataToken.token) {
        const batasStr = pengaturan?.batas_bayar_jam ? `${pengaturan.batas_bayar_jam} jam` : "24 jam";
        router.push(
          `/pesanan-saya/${kodePesananHasil}?pesan=${encodeURIComponent(
            `Pesanan dibuat, selesaikan pembayaran sebelum ${batasStr}.`
          )}`
        );
        return;
      }

      if (typeof window !== "undefined" && window.snap) {
        window.snap.pay(dataToken.token, {
          onSuccess: function () {
            router.push(`/pesanan-saya/${kodePesananHasil}?bayar=1`);
          },
          onPending: function () {
            router.push(`/pesanan-saya/${kodePesananHasil}?bayar=1`);
          },
          onError: function () {
            router.push(`/pesanan-saya/${kodePesananHasil}?bayar=1`);
          },
          onClose: function () {
            router.push(`/pesanan-saya/${kodePesananHasil}?bayar=1`);
          },
        });
      } else {
        router.push(`/pesanan-saya/${kodePesananHasil}?bayar=1`);
      }
    } catch {
      if (kodePesananHasil) {
        router.push(`/pesanan-saya/${kodePesananHasil}`);
      } else {
        setPesanError("Terjadi gangguan koneksi server saat checkout.");
        setSedangProses(false);
      }
    }
  }

  const kueCustomList = keranjang.filter((it) => it.jenis === "Custom");
  const kueKatalogList = keranjang.filter((it) => it.jenis === "Katalog" || it.jenis === "Siap");

  if (sedangMemuat) {
    return <RootLoading />;
  }

  if (keranjang.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF4EE] text-[#4A2E2B] pt-20 flex flex-col">
        <DynamicIslandNavbar showEntered={true} />
        <main className="max-w-xl mx-auto px-4 py-16 text-center my-auto">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#7D2330] mb-5">
            <ShoppingBag className="w-9 h-9 stroke-[1.6]" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A2E2B] mb-2">
            Keranjang Belanja Masih Kosong
          </h1>
          <p className="text-xs sm:text-sm text-[#7D5A50] mb-6 leading-relaxed">
            Belum ada kue di keranjangmu. Silakan jelajahi etalase menu kami!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/menu"
              className="px-6 py-2.5 rounded-full bg-[#7D2330] hover:bg-[#681C27] text-white text-xs sm:text-sm font-bold shadow-md transition"
            >
              Lihat Menu Kue
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const tanggalAwalEst = ketersediaan.estimasi?.tanggalAwal || ketersediaan.tanggal_minimal;
  const tanggalAkhirEst = ketersediaan.estimasi?.tanggalAkhir || "";

  return (
    <>
      <Script
        src={snapScriptUrl}
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-[#FAF4EE] text-[#4A2E2B] selection:bg-blush selection:text-cherry pt-14 sm:pt-16 flex flex-col relative overflow-x-clip font-sans">
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
                  Pengiriman
                </span>
              </div>

              <div
                className={`w-12 sm:w-16 h-[2px] -mt-4 transition-colors ${
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
                  Ringkasan & Bayar
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
                <form onSubmit={handleLanjutKeLangkah2} className="space-y-6">
                  <div className="bg-[#FAF4ED] rounded-[24px] border border-[#ECDCCE] p-5 sm:p-7 shadow-[0_2px_12px_rgba(90,56,47,0.03)] space-y-5">
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
                        {noWa && !validasiWa(noWa) && (
                          <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Nomor WhatsApp Anda belum berformat Indonesia yang valid (contoh: 081234567890). Silakan perbaiki agar toko dapat menghubungi Anda.</span>
                          </div>
                        )}
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
                            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white/70 text-xs sm:text-sm text-[#4A2E2B] placeholder-[#9E8278] focus:outline-none focus:bg-white transition ${
                              noWa && !validasiWa(noWa)
                                ? "border-red-400 focus:border-red-500"
                                : "border-[#E6D4C6] focus:border-[#7D2330]"
                            }`}
                          />
                          {noWa && !validasiWa(noWa) && (
                            <p className="text-[11px] text-red-600 mt-1">
                              Format tidak valid. Awali 08, 628, atau +628 (9-13 digit).
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#4A2E2B] mb-1.5">
                          Metode Pengambilan *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                              Gratis, ambil di {namaToko}
                            </p>
                          </button>

                          {tokoBelumDiatur ? (
                            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-100/70 text-stone-400 cursor-not-allowed">
                              <span className="font-bold text-xs sm:text-sm block">
                                Kirim ke Alamat
                              </span>
                              <p className="text-[11px] mt-1">
                                Pengiriman belum tersedia
                              </p>
                            </div>
                          ) : (
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
                                Dikirim dengan kurir aman toko
                              </p>
                            </button>
                          )}
                        </div>
                      </div>

                      {metodePengiriman === "Ambil" && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-white/70 border border-[#EEDBCE] space-y-3.5">
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
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D4C6] bg-white text-xs sm:text-sm text-[#4A2E2B] focus:outline-none focus:border-[#7D2330] transition"
                              />
                              {tanggalAmbil && (
                                <p className="text-xs text-[#7D2330] font-semibold mt-1 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{formatTanggal(tanggalAmbil)}</span>
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
                                className="w-full px-3 py-2.5 rounded-xl border border-[#E6D4C6] bg-white text-xs sm:text-sm text-[#4A2E2B] focus:outline-none focus:border-[#7D2330] transition cursor-pointer"
                              >
                                {listJam.map((j) => (
                                  <option key={j} value={j}>
                                    {j} WIB
                                  </option>
                                ))}
                              </select>
                              <p className="text-[11px] text-[#7D5A50] mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Jam operasional hari itu: {ketersediaan.jam_buka} - {ketersediaan.jam_tutup} WIB</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {metodePengiriman === "Kirim" && (
                        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white/70 border border-[#EEDBCE]">
                          <div className="flex items-center justify-between pb-2 border-b border-[#F0E4D8]">
                            <h3 className="font-bold text-xs sm:text-sm text-[#4A2E2B] flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#7D2330]" />
                              <span>Titik Pengiriman & Alamat</span>
                            </h3>
                            <span className="text-[11px] text-[#7D5A50]">
                              Geser pin merah ke lokasi tujuan
                            </span>
                          </div>

                          <PetaLokasi
                            posisiToko={posisiToko}
                            posisiTujuan={posisiTujuan}
                            onUbahTujuan={handleUbahPin}
                            tinggi="260px"
                            bisaDipilih={true}
                          />

                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-[#4A2E2B]">
                              Cari Alamat (Bantuan Nominatim OpenStreetMap)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={queryCari}
                                onChange={(e) => setQueryCari(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleCariAlamat();
                                  }
                                }}
                                placeholder="Ketik nama jalan, gedung, atau kawasan..."
                                className="flex-1 px-3.5 py-2 rounded-xl border border-[#E6D4C6] bg-white text-xs text-[#4A2E2B] focus:outline-none focus:border-[#7D2330]"
                              />
                              <button
                                type="button"
                                disabled={sedangCariAlamat}
                                onClick={handleCariAlamat}
                                className="px-4 py-2 rounded-xl bg-[#4A2E2B] hover:bg-[#382321] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>{sedangCariAlamat ? "Mencari..." : "Cari Alamat"}</span>
                              </button>
                            </div>

                            {hasilCari.length > 0 && (
                              <div className="mt-2 p-2 bg-white rounded-xl border border-[#E6D4C6] shadow-md max-h-48 overflow-y-auto divide-y divide-[#F5ECE3]">
                                {hasilCari.map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handlePilihAlamat(item)}
                                    className="w-full text-left p-2 hover:bg-[#FAF4ED] text-xs text-[#4A2E2B] transition cursor-pointer flex items-start gap-2"
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-[#7D2330] shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{item.display_name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-xs font-semibold text-[#4A2E2B] mb-1">
                                Alamat Lengkap *
                              </label>
                              <textarea
                                rows={2}
                                required
                                value={alamat}
                                onChange={(e) => setAlamat(e.target.value)}
                                placeholder="Jalan, nomor rumah, RT/RW, kelurahan..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D4C6] bg-white text-xs sm:text-sm text-[#4A2E2B] placeholder-[#9E8278] focus:outline-none focus:border-[#7D2330] transition"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[#4A2E2B] mb-1">
                                Patokan (Opsional)
                              </label>
                              <textarea
                                rows={2}
                                value={patokan}
                                onChange={(e) => setPatokan(e.target.value)}
                                placeholder="Contoh: depan pos satpam, pagar hitam, samping masjid..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D4C6] bg-white text-xs sm:text-sm text-[#4A2E2B] placeholder-[#9E8278] focus:outline-none focus:border-[#7D2330] transition"
                              />
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[#FAF4ED] border border-[#ECDCCE] space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-[#7D5A50]">Status Pengiriman:</span>
                              {sedangHitungOngkir ? (
                                <span className="text-[#7D2330] font-bold animate-pulse">
                                  Menghitung jarak & tarif ongkir...
                                </span>
                              ) : errorOngkir ? (
                                <span className="text-red-600 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {errorOngkir}
                                </span>
                              ) : jarakKm !== null ? (
                                <span className="text-emerald-800 font-bold lining-nums">
                                  Jarak sekitar {jarakKm} km, ongkir {formatRupiah(ongkirServer)}
                                </span>
                              ) : (
                                <span className="text-stone-500 italic">
                                  Silakan geser pin pada peta untuk menghitung ongkir
                                </span>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[#EEDBCE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div>
                                <span className="text-[#7D5A50] block font-medium">Estimasi Waktu Sampai:</span>
                                {tanggalPastiKirim ? (
                                  <strong className="text-[#7D2330] font-serif text-sm">
                                    Tiba pada {formatTanggal(tanggalPastiKirim)}
                                  </strong>
                                ) : (
                                  <strong className="text-[#4A2E2B] font-serif text-sm">
                                    Estimasi tiba {formatRentangTanggal(tanggalAwalEst, tanggalAkhirEst)}
                                  </strong>
                                )}
                              </div>

                              <div>
                                {!bukaPilihTanggalKirim ? (
                                  <button
                                    type="button"
                                    onClick={() => setBukaPilihTanggalKirim(true)}
                                    className="text-[11px] font-bold text-[#7D2330] hover:underline cursor-pointer"
                                  >
                                    Butuh tiba di tanggal tertentu?
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="date"
                                      min={tanggalAwalEst}
                                      value={tanggalPastiKirim}
                                      onChange={(e) => setTanggalPastiKirim(e.target.value)}
                                      className="px-2.5 py-1 rounded-lg border border-[#E6D4C6] bg-white text-xs text-[#4A2E2B] focus:outline-none focus:border-[#7D2330]"
                                    />
                                    {tanggalPastiKirim && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTanggalPastiKirim("");
                                          setBukaPilihTanggalKirim(false);
                                        }}
                                        className="text-[11px] text-stone-500 hover:text-stone-700 underline cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-[#4A2E2B] mb-1">
                          Catatan Pesanan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          placeholder="Contoh: jangan terlalu manis, lilin angka 24, dll."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D4C6] bg-white/70 text-xs sm:text-sm text-[#4A2E2B] placeholder-[#9E8278] focus:outline-none focus:border-[#7D2330] focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!formulirValid()}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#7D2330] hover:bg-[#681C27] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                        Konfirmasi & Pembayaran
                      </h2>
                      <p className="text-xs text-[#7D5A50] mt-0.5">
                        Pembayaran aman dan otomatis menggunakan Midtrans
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="text-xs font-semibold text-[#7D5A50] hover:text-[#7D2330] flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Ubah Data Pengiriman
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-[#ECDCCE] space-y-3 text-xs">
                    <div className="flex justify-between items-center text-[#7D5A50]">
                      <span>Penerima:</span>
                      <span className="font-bold text-[#4A2E2B]">{namaPenerima} ({noWa})</span>
                    </div>

                    <div className="flex justify-between items-center text-[#7D5A50]">
                      <span>Metode:</span>
                      <span className="font-bold text-[#4A2E2B]">
                        {metodePengiriman === "Kirim" ? "Kirim ke Alamat" : `Ambil di Toko (${namaToko})`}
                      </span>
                    </div>

                    {metodePengiriman === "Kirim" ? (
                      <>
                        <div className="flex justify-between items-start text-[#7D5A50]">
                          <span>Alamat:</span>
                          <span className="font-bold text-[#4A2E2B] text-right max-w-xs">{alamat}</span>
                        </div>
                        {patokan && (
                          <div className="flex justify-between items-start text-[#7D5A50]">
                            <span>Patokan:</span>
                            <span className="font-medium text-[#4A2E2B] text-right max-w-xs">{patokan}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[#7D5A50]">
                          <span>Estimasi Tiba:</span>
                          <span className="font-bold text-[#7D2330]">
                            {tanggalPastiKirim
                              ? `Tiba pada ${formatTanggal(tanggalPastiKirim)}`
                              : `Estimasi ${formatRentangTanggal(tanggalAwalEst, tanggalAkhirEst)}`}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center text-[#7D5A50]">
                        <span>Jadwal Pengambilan:</span>
                        <span className="font-bold text-[#7D2330]">
                          {formatTanggal(tanggalAmbil)} pukul {jamAmbil} WIB
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[#EEDBCE]">
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-[#ECDCCE] bg-white text-[#4A2E2B] text-xs sm:text-sm font-semibold hover:bg-[#FAF4EE] transition cursor-pointer whitespace-nowrap"
                      >
                        Kembali
                      </button>

                      <button
                        type="button"
                        disabled={sedangProses || !formulirValid()}
                        onClick={handleBayarSekarang}
                        className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-[#7D2330] hover:bg-[#681C27] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {sedangProses ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Menghubungkan Midtrans...</span>
                          </>
                        ) : (
                          <span>Bayar Sekarang {formatRupiah(bayarSekarang)}</span>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-[#7D5A50] text-center sm:text-right leading-relaxed">
                      Dengan membayar, Anda menyetujui{" "}
                      <Link href="/syarat-ketentuan" target="_blank" className="underline font-bold text-[#7D2330]">
                        Syarat &amp; Ketentuan
                      </Link>
                      {", "}
                      <Link href="/kebijakan-privasi" target="_blank" className="underline font-bold text-[#7D2330]">
                        Kebijakan Privasi
                      </Link>
                      {", dan "}
                      <Link href="/kebijakan-pembatalan" target="_blank" className="underline font-bold text-[#7D2330]">
                        Kebijakan Pembatalan
                      </Link>
                      {"."}
                    </p>
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
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = "/assets/placeholder-cake.png";
                                    }}
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
                                {item.foto_url || getFotoProdukFallback(item.nama) ? (
                                  <img
                                    src={item.foto_url || getFotoProdukFallback(item.nama)}
                                    alt={item.nama}
                                    onError={(e) => {
                                      const fb = getFotoProdukFallback(item.nama);
                                      if (fb && !e.currentTarget.src.endsWith(fb)) {
                                        e.currentTarget.src = fb;
                                      } else {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.style.display = "none";
                                      }
                                    }}
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
                    {subtotalCustom > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Subtotal Kue Custom</span>
                        <span className="font-serif font-bold text-[#4A2E2B] lining-nums">
                          {formatRupiah(subtotalCustom)}
                        </span>
                      </div>
                    )}

                    {subtotalKatalog > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Subtotal Kue Katalog</span>
                        <span className="font-serif font-bold text-[#4A2E2B] lining-nums">
                          {formatRupiah(subtotalKatalog)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span>Ongkos Kirim</span>
                      <span className="font-serif font-bold text-[#4A2E2B] lining-nums">
                        {metodePengiriman === "Kirim"
                          ? sedangHitungOngkir
                            ? "Menghitung..."
                            : formatRupiah(ongkirFinal)
                          : "Gratis"}
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
                        {formatRupiah(bayarSekarang)}
                      </span>
                    </div>

                    {sisaBayar > 0 && (
                      <div className="flex justify-between items-center text-xs text-[#7D5A50]">
                        <span>
                          Sisa Pelunasan (
                          {metodePengiriman === "Ambil"
                            ? "dibayar saat ambil atau sebelumnya"
                            : "dibayar sebelum kue dikirim"}
                          ):
                        </span>
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
                    sudah memilih {namaToko} ♡
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
    </>
  );
}
