"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Script from "next/script";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { cariTarif } from "@/lib/ongkir";
import { getFotoProdukFallback } from "@/lib/fotoProdukFallback";
import PreviewKue from "@/components/PreviewKue";
import GambarProduk from "@/components/GambarProduk";
import PortalLedge from "@/components/PortalLedge";
import ModalPesan from "@/components/ModalPesan";
import {
  BotanicalTopRight,
  BotanicalBottomRight,
} from "@/components/patisserie/BotanicalBranchDecor";
import {
  formatRupiah,
  formatTanggal,
  formatTanggalIndonesia,
  formatTanggalSingkat,
  formatTanggalWaktu,
  getTanggalHariIniJakarta,
} from "@/lib/format";

const PetaLokasi = dynamic(() => import("@/components/PetaLokasi"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] flex items-center justify-center text-xs font-semibold text-[#7A6158] animate-pulse">
      Memuat peta lokasi pengantaran...
    </div>
  ),
});

function formatRentangTanggal(awal, akhir) {
  if (!awal) return "";
  if (!akhir || awal === akhir) return formatTanggalIndonesia(awal);
  const bagianAwal = awal.split("-").map(Number);
  const bagianAkhir = akhir.split("-").map(Number);
  const dtAkhir = new Date(Date.UTC(bagianAkhir[0], bagianAkhir[1] - 1, bagianAkhir[2]));
  const bulanTahun = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(dtAkhir);
  if (bagianAwal[0] === bagianAkhir[0] && bagianAwal[1] === bagianAkhir[1]) {
    return `${bagianAwal[2]} sampai ${bagianAkhir[2]} ${bulanTahun}`;
  }
  return `${formatTanggalIndonesia(awal)} sampai ${formatTanggalIndonesia(akhir)}`;
}

function formatTeksJadwal(p) {
  if (p.metode_pengiriman === "Kirim") {
    const tglPasti = p.tanggal_pasti_kirim;
    const estAwal = p.estimasi_kirim_awal || p.tanggal_ambil;
    const estAkhir = p.estimasi_kirim_akhir;
    if (tglPasti) {
      return { teks: `Estimasi tiba ${formatTanggalIndonesia(tglPasti)}`, sub: "Pengiriman Kurir Toko" };
    }
    if (estAwal && estAkhir && estAwal !== estAkhir) {
      return { teks: `Estimasi tiba ${formatRentangTanggal(estAwal, estAkhir)}`, sub: "Pengiriman Kurir Toko" };
    }
    if (estAwal) {
      return { teks: `Estimasi tiba ${formatTanggalIndonesia(estAwal)}`, sub: "Pengiriman Kurir Toko" };
    }
    return { teks: "Pengiriman Kurir Toko", sub: "" };
  }
  return {
    teks: formatTanggalIndonesia(p.tanggal_ambil),
    sub: p.jam_ambil ? `Pukul ${p.jam_ambil.slice(0, 5)} WIB` : "Jam operasional toko",
  };
}

function AngkaAnimasi({ nilai = 0, formatUang = false }) {
  const [tampil, setTampil] = useState(0);

  useEffect(() => {
    const target = Number(nilai) || 0;
    const mulai = performance.now();
    const durasi = 650;
    let rafId = 0;

    function jalankan(sekarang) {
      const progres = Math.min(1, (sekarang - mulai) / durasi);
      const halus = 1 - Math.pow(1 - progres, 3);
      setTampil(Math.round(target * halus));
      if (progres < 1) {
        rafId = window.requestAnimationFrame(jalankan);
      }
    }

    rafId = window.requestAnimationFrame(jalankan);
    return () => window.cancelAnimationFrame(rafId);
  }, [nilai]);

  if (formatUang) {
    return <span>{formatRupiah(tampil)}</span>;
  }
  return <span>{tampil.toLocaleString("id-ID")}</span>;
}

function AvatarPelangganSvg({ className = "w-8 h-8 rounded-full" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" fill="#f8e4d9" />
      <path
        d="M20 50 C15 30 30 10 50 10 C70 10 85 30 80 50 C85 65 75 75 75 75 C75 75 65 60 65 55 C35 55 25 75 25 75 C25 75 15 65 20 50 Z"
        fill="#2d2226"
      />
      <path
        d="M28 42 C28 65 38 78 50 78 C62 78 72 65 72 42 C72 25 28 25 28 42 Z"
        fill="#ffdfd2"
      />
      <ellipse cx="36" cy="56" rx="5" ry="3" fill="#ffb4a2" opacity="0.8" />
      <ellipse cx="64" cy="56" rx="5" ry="3" fill="#ffb4a2" opacity="0.8" />
      <ellipse cx="40" cy="48" rx="3.5" ry="5.5" fill="#2d2226" />
      <circle cx="41" cy="46" r="1.5" fill="#ffffff" />
      <ellipse cx="60" cy="48" rx="3.5" ry="5.5" fill="#2d2226" />
      <circle cx="61" cy="46" r="1.5" fill="#ffffff" />
      <path
        d="M47 62 Q50 65 53 62"
        stroke="#b25d5d"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M25 35 C32 20 45 15 50 15 C55 15 68 20 75 35 C70 30 65 30 60 38 C55 28 48 26 42 36 C38 28 32 30 25 35 Z"
        fill="#3a2e33"
      />
      <path d="M38 25 L43 42 L47 28 L53 40 L56 26" fill="#3a2e33" />
      <path
        d="M25 88 C30 76 42 76 50 76 C58 76 70 76 75 88 L85 100 L15 100 Z"
        fill="#FFFDF9"
      />
      <path d="M46 76 L50 85 L54 76 Z" fill="#9E3B42" />
    </svg>
  );
}

export default function DashboardPelangganView({
  profilAwal,
  pesananList = [],
  pengaturanToko,
  tokoPublik = null,
  tarifJarakList = [],
  katalogRekomendasi = [],
  keranjangAwal = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");

  const daftarTabValid = ["beranda", "pesanan", "keranjang", "riwayat", "profil", "bantuan"];
  const tabAwal = tabQuery && daftarTabValid.includes(tabQuery) ? tabQuery : "beranda";

  const [isMounted, setIsMounted] = useState(false);
  const [tabAktif, setTabAktif] = useState(tabAwal);
  const [sidebarBuka, setSidebarBuka] = useState(false);
  const [sidebarMobileBuka, setSidebarMobileBuka] = useState(false);
  const [notifDropdownBuka, setNotifDropdownBuka] = useState(false);
  const [notifDibaca, setNotifDibaca] = useState(false);
  const [profilDropdownBuka, setProfilDropdownBuka] = useState(false);
  const [modalKeluarBuka, setModalKeluarBuka] = useState(false);
  const [sedangKeluar, setSedangKeluar] = useState(false);
  const [sedangSegarkan, setSedangSegarkan] = useState(false);

  const [profil, setProfil] = useState(profilAwal || {});
  const [daftarPesananState, setDaftarPesananState] = useState(pesananList || []);
  const [periodeMetrik, setPeriodeMetrik] = useState("semua");

  const [idPesananDilacak, setIdPesananDilacak] = useState(null);
  const [tahapStepperDipilih, setTahapStepperDipilih] = useState(null);
  const [detikSekarang, setDetikSekarang] = useState(0);

  const [sedangBayarKode, setSedangBayarKode] = useState("");
  const [sedangCekBayarKode, setSedangCekBayarKode] = useState("");

  const [keranjangItems, setKeranjangItems] = useState(
    (keranjangAwal && keranjangAwal.items) || []
  );
  const [ringkasanKeranjang, setRingkasanKeranjang] = useState(
    (keranjangAwal && keranjangAwal.ringkasan) || {
      subtotal_custom: 0,
      subtotal_katalog: 0,
      total_kue: 0,
      jumlah_dp: 0,
      sisa: 0,
      mode_pembayaran: "DP",
      persen_dp: 50,
    }
  );
  const [sedangUbahKeranjangId, setSedangUbahKeranjangId] = useState(null);
  const [sedangTambahProdukId, setSedangTambahProdukId] = useState(null);
  const [berhasilTambahMap, setBerhasilTambahMap] = useState({});
  const [gambarGagalMap, setGambarGagalMap] = useState({});
  const [filterKategoriKatalog, setFilterKategoriKatalog] = useState("Semua");

  const [filterStatusPesanan, setFilterStatusPesanan] = useState("Semua");
  const [kataCariPesanan, setKataCariPesanan] = useState("");
  const [pesananDetailTerbuka, setPesananDetailTerbuka] = useState(null);

  const [filterRiwayat, setFilterRiwayat] = useState("Semua");
  const [pesananInvoice, setPesananInvoice] = useState(null);
  const [pesananTiketQr, setPesananTiketQr] = useState(null);
  const [pesananBatalTarget, setPesananBatalTarget] = useState(null);
  const [alasanBatalInput, setAlasanBatalInput] = useState("");
  const [sedangBatal, setSedangBatal] = useState(false);
  const [pesanBatalError, setPesanBatalError] = useState("");

  const [subTabProfil, setSubTabProfil] = useState("datadiri");
  const [formProfil, setFormProfil] = useState({
    nama: (profilAwal && profilAwal.nama) || "",
    no_wa: (profilAwal && profilAwal.no_wa) || "",
  });
  const [alamatTersimpan, setAlamatTersimpan] = useState({
    alamat_lengkap: (profilAwal && profilAwal.alamat) || "",
    patokan: (profilAwal && profilAwal.patokan) || "",
    lat_alamat: (profilAwal && profilAwal.lat_alamat) || null,
    lng_alamat: (profilAwal && profilAwal.lng_alamat) || null,
  });
  const [infoOngkirProfil, setInfoOngkirProfil] = useState({
    memuat: false,
    status: "",
    jarak_km: null,
    ongkir: 0,
    pesan: "",
  });
  const [sedangSimpanProfil, setSedangSimpanProfil] = useState(false);
  const [pesanSuksesProfil, setPesanSuksesProfil] = useState("");
  const [pesanErrorProfil, setPesanErrorProfil] = useState("");

  const [formSandi, setFormSandi] = useState({
    kataSandiLama: "",
    kataSandiBaru: "",
    konfirmasiSandi: "",
  });
  const [lihatSandiLama, setLihatSandiLama] = useState(false);
  const [lihatSandiBaru, setLihatSandiBaru] = useState(false);
  const [lihatKonfirmasiSandi, setLihatKonfirmasiSandi] = useState(false);
  const [sedangSimpanSandi, setSedangSimpanSandi] = useState(false);
  const [pesanSuksesSandi, setPesanSuksesSandi] = useState("");
  const [pesanErrorSandi, setPesanErrorSandi] = useState("");

  const [tanggalCekKuota, setTanggalCekKuota] = useState("");
  const [dataKetersediaan, setDataKetersediaan] = useState(null);
  const [sedangMuatKetersediaan, setSedangMuatKetersediaan] = useState(false);
  const [jarakSimulasiKm, setJarakSimulasiKm] = useState(5);
  const [faqTerbukaIdx, setFaqTerbukaIdx] = useState(0);

  const [formTiket, setFormTiket] = useState({
    kode_pesanan: (pesananList[0] && pesananList[0].kode_pesanan) || "Umum (Belum Pesan)",
    kategori: "Status pembuatan kue",
    subjek: "",
    pesan: "",
  });
  const [daftarTiketBantuan, setDaftarTiketBantuan] = useState([]);
  const [pesanSuksesTiket, setPesanSuksesTiket] = useState("");

  const [modalInfo, setModalInfo] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  const notifRef = useRef(null);
  const profilRef = useRef(null);
  const debounceOngkirRef = useRef(null);

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const isProduction =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ||
    (!clientKey.startsWith("SB-") && clientKey.length > 0);
  const snapScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  useEffect(() => {
    setIsMounted(true);
    setDetikSekarang(Date.now());
    const timerDetik = setInterval(() => {
      setDetikSekarang(Date.now());
    }, 1000);

    try {
      const simpanSidebar = localStorage.getItem("cravely_user_sidebar_open");
      if (simpanSidebar === "1") {
        setSidebarBuka(true);
      }
    } catch {}

    return () => clearInterval(timerDetik);
  }, []);

  useEffect(() => {
    setDaftarPesananState(pesananList || []);
  }, [pesananList]);

  useEffect(() => {
    if (tabQuery && daftarTabValid.includes(tabQuery)) {
      setTabAktif(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    function handleKlikLuar(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownBuka(false);
      }
      if (profilRef.current && !profilRef.current.contains(e.target)) {
        setProfilDropdownBuka(false);
      }
    }
    document.addEventListener("mousedown", handleKlikLuar);
    return () => document.removeEventListener("mousedown", handleKlikLuar);
  }, []);

  useEffect(() => {
    const userId = (profilAwal && profilAwal.id) || "guest";
    try {
      if ((profilAwal && profilAwal.alamat) || (profilAwal && profilAwal.lat_alamat)) {
        setAlamatTersimpan({
          alamat_lengkap: profilAwal.alamat || "",
          patokan: profilAwal.patokan || "",
          lat_alamat: profilAwal.lat_alamat || null,
          lng_alamat: profilAwal.lng_alamat || null,
        });
      } else {
        const rawAlamat = localStorage.getItem(`cravely_alamat_user_${userId}`);
        if (rawAlamat) {
          const parsed = JSON.parse(rawAlamat);
          setAlamatTersimpan({
            alamat_lengkap: parsed.alamat_lengkap || "",
            patokan: parsed.patokan || "",
            lat_alamat: parsed.lat_alamat || null,
            lng_alamat: parsed.lng_alamat || null,
          });
        } else {
          let pesananKirimTerakhir = null;
          for (let i = 0; i < pesananList.length; i++) {
            if (pesananList[i].metode_pengiriman === "Kirim" && pesananList[i].alamat) {
              pesananKirimTerakhir = pesananList[i];
              break;
            }
          }
          if (pesananKirimTerakhir) {
            setAlamatTersimpan({
              alamat_lengkap: pesananKirimTerakhir.alamat || "",
              patokan: pesananKirimTerakhir.patokan || "",
              lat_alamat: pesananKirimTerakhir.lat_tujuan ? Number(pesananKirimTerakhir.lat_tujuan) : null,
              lng_alamat: pesananKirimTerakhir.lng_tujuan ? Number(pesananKirimTerakhir.lng_tujuan) : null,
            });
          }
        }
      }

      const rawTiket = localStorage.getItem(`cravely_tiket_bantuan_${userId}`);
      if (rawTiket) {
        setDaftarTiketBantuan(JSON.parse(rawTiket));
      }
    } catch {}
  }, [profilAwal, pesananList]);

  useEffect(() => {
    let aktif = true;
    setSedangMuatKetersediaan(true);
    fetch("/api/ketersediaan", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!aktif) return;
        setDataKetersediaan(json);
        if (json && json.tanggal_minimal && !tanggalCekKuota) {
          setTanggalCekKuota(json.tanggal_minimal);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (aktif) setSedangMuatKetersediaan(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => {
    if (!alamatTersimpan.lat_alamat || !alamatTersimpan.lng_alamat) {
      setInfoOngkirProfil({
        memuat: false,
        status: "",
        jarak_km: null,
        ongkir: 0,
        pesan: "",
      });
      return;
    }

    if (debounceOngkirRef.current) {
      clearTimeout(debounceOngkirRef.current);
    }

    debounceOngkirRef.current = setTimeout(async () => {
      setInfoOngkirProfil((prev) => ({ ...prev, memuat: true }));
      try {
        const res = await fetch("/api/ongkir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: Number(alamatTersimpan.lat_alamat),
            lng: Number(alamatTersimpan.lng_alamat),
          }),
        });
        const data = await res.json();
        setInfoOngkirProfil({
          memuat: false,
          status: data.status || (res.ok ? "ok" : "error"),
          jarak_km: data.jarak_km ?? null,
          ongkir: Number(data.ongkir || 0),
          pesan: data.pesan || "",
        });
      } catch {
        setInfoOngkirProfil({
          memuat: false,
          status: "error",
          jarak_km: null,
          ongkir: 0,
          pesan: "Gagal menghitung perkiraan ongkir.",
        });
      }
    }, 420);

    return () => {
      if (debounceOngkirRef.current) clearTimeout(debounceOngkirRef.current);
    };
  }, [alamatTersimpan.lat_alamat, alamatTersimpan.lng_alamat]);

  function handleToggleSidebar() {
    const statusBaru = !sidebarBuka;
    setSidebarBuka(statusBaru);
    try {
      localStorage.setItem("cravely_user_sidebar_open", statusBaru ? "1" : "0");
    } catch {}
  }

  function gantiTab(kodeTab) {
    setTabAktif(kodeTab);
    setSidebarMobileBuka(false);
    setNotifDropdownBuka(false);
    setProfilDropdownBuka(false);
    try {
      window.history.replaceState(null, "", `/user?tab=${kodeTab}`);
    } catch {}
  }

  async function muatUlangKeranjang() {
    try {
      const res = await fetch("/api/keranjang", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setKeranjangItems(data.keranjang || []);
        if (data.ringkasan) {
          setRingkasanKeranjang(data.ringkasan);
        }
      }
    } catch {}
  }

  async function handleSegarkanData() {
    setSedangSegarkan(true);
    await muatUlangKeranjang();
    router.refresh();
    setTimeout(() => {
      setSedangSegarkan(false);
    }, 650);
  }

  async function handleKeluar() {
    setSedangKeluar(true);
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/masuk");
    router.refresh();
  }

  async function handleTambahKeKeranjang(idProduk, namaProduk) {
    if (!idProduk) return;
    setSedangTambahProdukId(idProduk);
    try {
      const res = await fetch("/api/keranjang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis: "Katalog",
          id_produk: Number(idProduk),
          jumlah: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalInfo({
          terbuka: true,
          judul: "Gagal Menambahkan",
          pesan: data.pesan || "Tidak dapat menambahkan kue ke keranjang.",
          tipe: "error",
        });
      } else {
        setBerhasilTambahMap((prev) => ({ ...prev, [idProduk]: true }));
        setTimeout(() => {
          setBerhasilTambahMap((prev) => ({ ...prev, [idProduk]: false }));
        }, 1600);
        window.dispatchEvent(new Event("cravely_cart_updated"));
        await muatUlangKeranjang();
      }
    } catch {
      setModalInfo({
        terbuka: true,
        judul: "Gangguan Koneksi",
        pesan: `Gagal menambahkan ${namaProduk || "kue"} ke keranjang.`,
        tipe: "error",
      });
    } finally {
      setSedangTambahProdukId(null);
    }
  }

  async function handleUbahQtyKeranjang(item, jumlahBaru) {
    if (jumlahBaru < 1 || jumlahBaru > 20) return;
    setSedangUbahKeranjangId(item.id);
    try {
      const res = await fetch("/api/keranjang", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, jumlah: jumlahBaru }),
      });
      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(new Event("cravely_cart_updated"));
        await muatUlangKeranjang();
      } else {
        setModalInfo({
          terbuka: true,
          judul: "Informasi Keranjang",
          pesan: data.pesan || "Gagal memperbarui jumlah item.",
          tipe: "error",
        });
      }
    } catch {
      setModalInfo({
        terbuka: true,
        judul: "Gangguan Koneksi",
        pesan: "Gagal memperbarui keranjang belanja.",
        tipe: "error",
      });
    } finally {
      setSedangUbahKeranjangId(null);
    }
  }

  async function handleHapusItemKeranjang(idItem) {
    if (!window.confirm("Hapus kue ini dari keranjang belanja Anda?")) return;
    setSedangUbahKeranjangId(idItem);
    try {
      const res = await fetch(`/api/keranjang?id=${idItem}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.dispatchEvent(new Event("cravely_cart_updated"));
        await muatUlangKeranjang();
      }
    } catch {}
    setSedangUbahKeranjangId(null);
  }

  async function handleBayarMidtransLangsung(pesanan) {
    const total = Number(pesanan.total_bayar || 0);
    const sudah = Number(pesanan.jumlah_terbayar || 0);
    const sisa = Math.max(0, total - sudah);
    const isPelunasan = pesanan.status_bayar === "DP Dibayar" && sisa > 0;
    const jenisTarget = isPelunasan ? "Pelunasan" : pesanan.jumlah_dp ? "DP" : "Lunas";

    if (typeof window === "undefined" || !window.snap) {
      router.push(`/pesanan-saya/${pesanan.kode_pesanan}`);
      return;
    }

    setSedangBayarKode(pesanan.kode_pesanan);
    try {
      const res = await fetch("/api/midtrans/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode_pesanan: pesanan.kode_pesanan,
          jenis: jenisTarget,
        }),
      });
      const hasil = await res.json();
      if (!res.ok || !hasil.token) {
        setSedangBayarKode("");
        setModalInfo({
          terbuka: true,
          judul: "Informasi Pembayaran",
          pesan: hasil.pesan || "Silakan lanjutkan pembayaran melalui halaman tiket pesanan.",
          tipe: "error",
        });
        return;
      }

      window.snap.pay(hasil.token, {
        onSuccess: async function () {
          setSedangBayarKode("");
          await handleCekStatusMidtrans(pesanan.kode_pesanan, true);
        },
        onPending: async function () {
          setSedangBayarKode("");
          await handleCekStatusMidtrans(pesanan.kode_pesanan, true);
        },
        onError: function () {
          setSedangBayarKode("");
        },
        onClose: function () {
          setSedangBayarKode("");
        },
      });
    } catch {
      setSedangBayarKode("");
      router.push(`/pesanan-saya/${pesanan.kode_pesanan}`);
    }
  }

  async function handleCekStatusMidtrans(kodePesanan, tanpaModalJikaTetap = false) {
    setSedangCekBayarKode(kodePesanan);
    try {
      const res = await fetch("/api/midtrans/cek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: kodePesanan }),
      });
      const data = await res.json();
      if (res.ok && data.pesanan) {
        setDaftarPesananState((prev) =>
          prev.map((p) =>
            p.kode_pesanan === kodePesanan
              ? {
                  ...p,
                  status_pesanan: data.pesanan.status_pesanan,
                  status_bayar: data.pesanan.status_bayar,
                  jumlah_terbayar: data.pesanan.jumlah_terbayar,
                }
              : p
          )
        );
        router.refresh();
        setModalInfo({
          terbuka: true,
          judul: "Status Pembayaran Diperbarui",
          pesan: `Pesanan ${kodePesanan}\nStatus Pesanan: ${data.pesanan.status_pesanan}\nStatus Bayar: ${data.pesanan.status_bayar}\nTerbayar: ${formatRupiah(data.pesanan.jumlah_terbayar || 0)}`,
          tipe: data.pesanan.status_bayar === "Lunas" || data.pesanan.status_bayar === "DP Dibayar" ? "sukses" : "info",
        });
      } else if (!tanpaModalJikaTetap) {
        setModalInfo({
          terbuka: true,
          judul: "Informasi Pembayaran",
          pesan: data.pesan || "Belum ada perubahan status pembayaran dari Midtrans.",
          tipe: "info",
        });
      }
    } catch {
      if (!tanpaModalJikaTetap) {
        setModalInfo({
          terbuka: true,
          judul: "Gangguan Jaringan",
          pesan: "Tidak dapat memeriksa status pembayaran saat ini.",
          tipe: "error",
        });
      }
    } finally {
      setSedangCekBayarKode("");
    }
  }

  async function handleKonfirmasiBatal() {
    if (!pesananBatalTarget) return;
    setSedangBatal(true);
    setPesanBatalError("");
    try {
      const res = await fetch(`/api/pesanan/${pesananBatalTarget.kode_pesanan}/batal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alasan: alasanBatalInput.trim() }),
      });
      const data = await res.json();
      setSedangBatal(false);
      if (!res.ok) {
        setPesanBatalError(data.pesan || "Gagal membatalkan pesanan.");
        return;
      }
      const kodeBatal = pesananBatalTarget.kode_pesanan;
      setPesananBatalTarget(null);
      setDaftarPesananState((prev) =>
        prev.map((p) =>
          p.kode_pesanan === kodeBatal
            ? {
                ...p,
                status_pesanan: "Dibatalkan",
                alasan_batal: alasanBatalInput.trim() || "Dibatalkan oleh pelanggan",
              }
            : p
        )
      );
      router.refresh();
      setModalInfo({
        terbuka: true,
        judul: "Pesanan Dibatalkan",
        pesan: `Pesanan ${kodeBatal} telah berhasil dibatalkan dan kuota jadwal telah dilepas kembali.`,
        tipe: "sukses",
      });
    } catch {
      setSedangBatal(false);
      setPesanBatalError("Terjadi kesalahan jaringan.");
    }
  }

  const hariIniIso = getTanggalHariIniJakarta();
  const sekarangWib = new Date(hariIniIso + "T00:00:00");

  function masukPeriode(tglIso) {
    if (periodeMetrik === "semua" || !tglIso) return true;
    const tglData = new Date(tglIso);
    const isoData = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
    }).format(tglData);

    if (periodeMetrik === "hari_ini") {
      return isoData === hariIniIso;
    }
    const selisihHari = Math.floor(
      (sekarangWib.getTime() - new Date(isoData + "T00:00:00").getTime()) / 86400000
    );
    if (periodeMetrik === "minggu_ini") {
      return selisihHari >= 0 && selisihHari <= 7;
    }
    if (periodeMetrik === "bulan_ini") {
      return isoData.slice(0, 7) === hariIniIso.slice(0, 7);
    }
    return true;
  }

  const pesananAktifList = [];
  const pesananMenungguBayarList = [];
  const pesananSiapAtauKirimList = [];
  const pesananPerluPelunasanList = [];
  const pesananRefundList = [];
  let metrikAktif = 0;
  let metrikMenungguBayar = 0;
  let metrikTotalBelanja = 0;
  let metrikSelesai = 0;
  let totalSisaTagihan = 0;
  let jumlahBuktiMenungguAdmin = 0;
  const semuaPembayaranList = [];

  for (let i = 0; i < daftarPesananState.length; i++) {
    const p = daftarPesananState[i];
    const dalamPeriode = masukPeriode(p.dibuat_pada);
    const sisa = Math.max(0, (Number(p.total_bayar) || 0) - (Number(p.jumlah_terbayar) || 0));

    if (["Diterima", "Sedang Dibuat", "Siap", "Dikirim"].includes(p.status_pesanan)) {
      pesananAktifList.push(p);
      if (dalamPeriode) metrikAktif++;
    }
    if (p.status_pesanan === "Menunggu Pembayaran") {
      pesananMenungguBayarList.push(p);
      if (dalamPeriode) metrikMenungguBayar++;
    }
    if (["Siap", "Dikirim"].includes(p.status_pesanan)) {
      pesananSiapAtauKirimList.push(p);
    }
    if (p.status_bayar === "DP Dibayar" && sisa > 0 && p.status_pesanan !== "Dibatalkan") {
      pesananPerluPelunasanList.push(p);
    }
    if (p.perlu_refund) {
      pesananRefundList.push(p);
    }
    if (p.status_pesanan === "Selesai" && dalamPeriode) {
      metrikSelesai++;
    }
    if (p.status_pesanan !== "Dibatalkan") {
      totalSisaTagihan += sisa;
    }

    const bayarArr = p.pembayaran || [];
    for (let j = 0; j < bayarArr.length; j++) {
      const b = bayarArr[j];
      const bayarSukses =
        b.status === "Dikonfirmasi" || b.status === "settlement" || b.status === "capture";
      if (bayarSukses && masukPeriode(b.dibuat_pada)) {
        metrikTotalBelanja += Number(b.jumlah) || 0;
      }
      if (b.status === "Menunggu Konfirmasi") {
        jumlahBuktiMenungguAdmin++;
      }
      semuaPembayaranList.push({
        ...b,
        kode_pesanan: p.kode_pesanan,
        tanggal_ambil: p.tanggal_ambil,
        status_pesanan: p.status_pesanan,
        total_bayar_pesanan: p.total_bayar,
      });
    }
  }

  semuaPembayaranList.sort(
    (a, b) => new Date(b.dibuat_pada).getTime() - new Date(a.dibuat_pada).getTime()
  );

  let jumlahKuantitasKeranjang = 0;
  for (let i = 0; i < keranjangItems.length; i++) {
    jumlahKuantitasKeranjang += Number(keranjangItems[i].jumlah || 1);
  }

  const daftarNotifPelanggan = [];
  for (let i = 0; i < pesananSiapAtauKirimList.length; i++) {
    const p = pesananSiapAtauKirimList[i];
    daftarNotifPelanggan.push({
      id: `siap-${p.id}`,
      judul: p.status_pesanan === "Siap" ? "Kue Siap Diambil / Diantar!" : "Kurir Dalam Perjalanan",
      deskripsi:
        p.status_pesanan === "Siap"
          ? `Pesanan ${p.kode_pesanan} telah diselesaikan Petugas Dapur. Siapkan Tiket QR Anda.`
          : `Pesanan ${p.kode_pesanan} sedang diantar kurir menuju lokasi Anda.`,
      ikon: p.status_pesanan === "Siap" ? "fa-solid fa-box-open" : "fa-solid fa-truck-fast",
      warna: "bg-emerald-50 text-emerald-700 border-emerald-200",
      aksiLabel: "Buka Tiket QR",
      onClick: () => {
        setPesananTiketQr(p);
        setNotifDropdownBuka(false);
      },
    });
  }
  for (let i = 0; i < pesananMenungguBayarList.length; i++) {
    const p = pesananMenungguBayarList[i];
    daftarNotifPelanggan.push({
      id: `bayar-${p.id}`,
      judul: `Menunggu Pembayaran (${p.kode_pesanan})`,
      deskripsi: "Selesaikan pembayaran sebelum batas waktu agar diteruskan ke Admin & Dapur.",
      ikon: "fa-solid fa-wallet",
      warna: "bg-amber-50 text-amber-800 border-amber-200",
      aksiLabel: "Bayar Sekarang",
      onClick: () => {
        setIdPesananDilacak(p.id);
        gantiTab("beranda");
      },
    });
  }
  for (let i = 0; i < pesananPerluPelunasanList.length; i++) {
    const p = pesananPerluPelunasanList[i];
    const sisa = Math.max(0, Number(p.total_bayar || 0) - Number(p.jumlah_terbayar || 0));
    daftarNotifPelanggan.push({
      id: `lunas-${p.id}`,
      judul: `Sisa Pelunasan DP (${p.kode_pesanan})`,
      deskripsi: `Tagihan sisa ${formatRupiah(sisa)} wajib lunas sebelum kue diserahkan Petugas.`,
      ikon: "fa-solid fa-hand-holding-dollar",
      warna: "bg-[#FAF0E8] text-[#9E3B42] border-[#E5C9BE]",
      aksiLabel: "Lunasi Tagihan",
      onClick: () => {
        setIdPesananDilacak(p.id);
        gantiTab("pesanan");
      },
    });
  }
  for (let i = 0; i < pesananRefundList.length; i++) {
    const p = pesananRefundList[i];
    daftarNotifPelanggan.push({
      id: `refund-${p.id}`,
      judul: `Info Pengembalian Dana (${p.kode_pesanan})`,
      deskripsi: "Admin toko telah menandai tindak lanjut pengembalian dana untuk pesanan ini.",
      ikon: "fa-solid fa-rotate-left",
      warna: "bg-rose-50 text-rose-700 border-rose-200",
      aksiLabel: "Lihat Pesanan",
      onClick: () => {
        gantiTab("pesanan");
      },
    });
  }
  if (jumlahKuantitasKeranjang > 0) {
    daftarNotifPelanggan.push({
      id: "keranjang-aktif",
      judul: `${jumlahKuantitasKeranjang} Kue Menunggu di Keranjang`,
      deskripsi: `Subtotal ${formatRupiah(ringkasanKeranjang.total_kue || 0)} siap dilanjutkan ke Checkout.`,
      ikon: "fa-solid fa-bag-shopping",
      warna: "bg-[#FDF5E7] text-[#5A3B33] border-[#EADCC8]",
      aksiLabel: "Buka Keranjang",
      onClick: () => {
        gantiTab("keranjang");
      },
    });
  }

  const totalNotifCount = daftarNotifPelanggan.length;

  useEffect(() => {
    try {
      const dibaca = sessionStorage.getItem(`cravely_user_notif_${totalNotifCount}`);
      setNotifDibaca(dibaca === "1");
    } catch {}
  }, [totalNotifCount]);

  function handleBukaNotif() {
    const statusBerikut = !notifDropdownBuka;
    setNotifDropdownBuka(statusBerikut);
    setProfilDropdownBuka(false);
    if (statusBerikut && totalNotifCount > 0) {
      setNotifDibaca(true);
      try {
        sessionStorage.setItem(`cravely_user_notif_${totalNotifCount}`, "1");
      } catch {}
    }
  }

  const kandidatDilacak = [];
  for (let i = 0; i < daftarPesananState.length; i++) {
    if (daftarPesananState[i].status_pesanan !== "Dibatalkan") {
      kandidatDilacak.push(daftarPesananState[i]);
    }
  }
  if (kandidatDilacak.length === 0 && daftarPesananState.length > 0) {
    kandidatDilacak.push(daftarPesananState[0]);
  }

  let pesananUtamaDilacak =
    pesananAktifList[0] ||
    pesananMenungguBayarList[0] ||
    daftarPesananState[0] ||
    null;

  if (idPesananDilacak) {
    for (let i = 0; i < daftarPesananState.length; i++) {
      if (daftarPesananState[i].id === idPesananDilacak) {
        pesananUtamaDilacak = daftarPesananState[i];
        break;
      }
    }
  }

  function hitungSisaDetikBayar(pesanan) {
    if (!isMounted || !pesanan || pesanan.status_pesanan !== "Menunggu Pembayaran") {
      return null;
    }
    const batasJam = Number((pengaturanToko && pengaturanToko.batas_bayar_jam) || 24);
    const targetMs = new Date(pesanan.dibuat_pada).getTime() + batasJam * 3600000;
    const sisaDetik = Math.max(0, Math.floor((targetMs - detikSekarang) / 1000));
    return sisaDetik;
  }

  function formatHitungMundur(sisaDetik) {
    if (sisaDetik === null) return "";
    if (sisaDetik <= 0) return "Batas waktu berakhir";
    const jam = Math.floor(sisaDetik / 3600);
    const menit = Math.floor((sisaDetik % 3600) / 60);
    const detik = sisaDetik % 60;
    const jStr = String(jam).padStart(2, "0");
    const mStr = String(menit).padStart(2, "0");
    const dStr = String(detik).padStart(2, "0");
    return `${jStr}:${mStr}:${dStr}`;
  }

  function infoPenanggungJawab(pesanan) {
    let adaMenunggu = false;
    const bayarList = pesanan.pembayaran || [];
    for (let i = 0; i < bayarList.length; i++) {
      if (bayarList[i].status === "Menunggu Konfirmasi") {
        adaMenunggu = true;
        break;
      }
    }
    const batasJam = Number((pengaturanToko && pengaturanToko.batas_bayar_jam) || 24);
    const batasBayarDate = new Date(new Date(pesanan.dibuat_pada).getTime() + batasJam * 3600000);
    const batasBayarTeks = formatTanggalWaktu(batasBayarDate);

    const sisa = Math.max(0, (Number(pesanan.total_bayar) || 0) - (Number(pesanan.jumlah_terbayar) || 0));
    let bayarSekarang = sisa;
    if ((Number(pesanan.jumlah_terbayar) || 0) === 0) {
      if (pesanan.persen_dp_saat_pesan && pesanan.jumlah_dp) {
        bayarSekarang = Number(pesanan.jumlah_dp) || 0;
      } else {
        bayarSekarang = Number(pesanan.total_bayar) || 0;
      }
    }

    if (pesanan.status_pesanan === "Dibatalkan") {
      return {
        label: "Pesanan Dibatalkan",
        aktorRole: pesanan.dibatalkan_oleh || "Toko",
        ikon: "fa-solid fa-ban",
        warna: "bg-rose-50 text-rose-800 border-rose-200",
        deskripsi: pesanan.alasan_batal || "Pesanan ini telah dibatalkan.",
      };
    }
    if (pesanan.status_pesanan === "Menunggu Pembayaran") {
      if (adaMenunggu) {
        return {
          label: "Admin Toko: Memverifikasi Bukti Transfer Anda",
          aktorRole: "Giliran: Admin Toko",
          ikon: "fa-solid fa-user-shield",
          warna: "bg-amber-50 text-amber-900 border-amber-200",
          deskripsi: "Bukti pembayaran manual Anda sedang diperiksa oleh Admin di panel pesanan.",
        };
      }
      return {
        label: "Pelanggan (Anda): Selesaikan Pembayaran",
        aktorRole: "Giliran: Anda",
        ikon: "fa-solid fa-wallet",
        warna: "bg-[#FFF8EB] text-[#7A4B06] border-[#F0D9A8]",
        deskripsi: `Bayar ${formatRupiah(bayarSekarang)} sebelum ${batasBayarTeks} agar masuk antrean Admin & Petugas Dapur.`,
      };
    }
    if (pesanan.status_pesanan === "Diterima") {
      return {
        label: "Admin & Petugas Dapur: Pesanan Masuk Antrean Produksi",
        aktorRole: "Giliran: Petugas Dapur",
        ikon: "fa-solid fa-clipboard-check",
        warna: "bg-[#F4F8EE] text-[#2F5938] border-[#C9DEC0]",
        deskripsi: "Pembayaran terverifikasi. Pesanan Anda telah tampil di daftar Tugas Hari Ini milik Petugas Dapur.",
      };
    }
    if (pesanan.status_pesanan === "Sedang Dibuat") {
      return {
        label: "Petugas Produksi: Sedang Memanggang & Mendekorasi Kue",
        aktorRole: "Giliran: Petugas Dapur",
        ikon: "fa-solid fa-fire-burner",
        warna: "bg-[#FAF0E8] text-[#7D2330] border-[#E8C7BE]",
        deskripsi: "Patissier kami sedang memproses bahan dan merangkai dekorasi kue sesuai pesanan Anda.",
      };
    }
    if (pesanan.status_pesanan === "Siap") {
      return {
        label:
          pesanan.metode_pengiriman === "Ambil"
            ? "Siap Diambil di Gerai — Tunjukkan Tiket QR ke Petugas"
            : "Kue Selesai Disiapkan — Menunggu Pengiriman Kurir",
        aktorRole:
          pesanan.metode_pengiriman === "Ambil"
            ? sisa > 0
              ? "Giliran: Anda (Pelunasan & Ambil)"
              : "Giliran: Anda (Ambil di Toko)"
            : sisa > 0
              ? "Giliran: Anda (Lunasi Sisa DP)"
              : "Giliran: Petugas & Kurir",
        ikon: "fa-solid fa-box-open",
        warna: "bg-emerald-50 text-emerald-900 border-emerald-200",
        deskripsi:
          sisa > 0
            ? `Sisa tagihan ${formatRupiah(sisa)} perlu dilunasi (${pesanan.metode_pengiriman === "Ambil" ? "bisa online atau Tunai di Tempat ke Petugas" : "wajib lunas sebelum dikirim kurir"}).`
            : pesanan.metode_pengiriman === "Ambil"
              ? "Tunjukkan QR Code tiket pesanan Anda kepada Petugas saat mengambil kue di toko."
              : "Kue sudah dikemas rapi dan siap diberangkatkan oleh kurir toko.",
      };
    }
    if (pesanan.status_pesanan === "Dikirim") {
      return {
        label: "Kurir Toko: Sedang Mengantar Pesanan ke Lokasi Anda",
        aktorRole: "Giliran: Kurir & Petugas",
        ikon: "fa-solid fa-truck-fast",
        warna: "bg-sky-50 text-sky-900 border-sky-200",
        deskripsi: "Pesanan sedang dalam perjalanan menuju titik pengantaran Anda.",
      };
    }
    return {
      label: "Pesanan Selesai — Terima Kasih Telah Memesan!",
      aktorRole: "Tuntas",
      ikon: "fa-solid fa-circle-check",
      warna: "bg-emerald-50 text-emerald-900 border-emerald-200",
      deskripsi: "Seluruh proses dari Pelanggan, Admin, hingga Petugas Dapur telah selesai dengan baik.",
    };
  }

  function badgeStatusWarna(status) {
    if (status === "Menunggu Pembayaran") {
      return "bg-[#FFF3D6] text-[#875C1A] border border-[#EED39B]";
    }
    if (status === "Diterima") {
      return "bg-[#E8F4EC] text-[#215934] border border-[#BFE0C9]";
    }
    if (status === "Sedang Dibuat") {
      return "bg-[#FCE8EC] text-[#9E3B42] border border-[#EBC0C8]";
    }
    if (status === "Siap" || status === "Dikirim") {
      return "bg-[#E6F0FA] text-[#1D4E89] border border-[#C5DCF2]";
    }
    if (status === "Selesai") {
      return "bg-[#DCF5E4] text-[#1C6E3D] border border-[#B5E5C6]";
    }
    if (status === "Dibatalkan") {
      return "bg-rose-100 text-rose-800 border border-rose-200";
    }
    return "bg-[#F5ECE2] text-[#5A3B33] border border-[#EADCC8]";
  }

  function badgeBayarWarna(status) {
    if (status === "Lunas") {
      return "bg-[#DCF5E4] text-[#1C6E3D] border border-[#B5E5C6]";
    }
    if (status === "DP Dibayar") {
      return "bg-[#FFF3D6] text-[#875C1A] border border-[#EED39B]";
    }
    return "bg-rose-100 text-rose-800 border border-rose-200";
  }

  function indeksTahapStepper(status) {
    if (status === "Menunggu Pembayaran") return 0;
    if (status === "Diterima") return 1;
    if (status === "Sedang Dibuat") return 2;
    if (status === "Siap" || status === "Dikirim") return 3;
    if (status === "Selesai") return 4;
    return -1;
  }

  function dapatkanTahapStepper(pesanan) {
    const items = (pesanan && pesanan.pesanan_item) || [];
    const pilihan = (pesanan && pesanan.pesanan_pilihan) || [];
    const isKatalogMurni =
      items.length > 0 &&
      !items.some((it) => it.jenis === "Custom") &&
      !pesanan.tulisan_kue &&
      pilihan.length === 0;

    return [
      {
        judul: "Pembayaran",
        aktor: "Pelanggan / Admin",
        ikon: "fa-solid fa-credit-card",
        detailPeran:
          "Pelanggan menyelesaikan pembayaran DP/Lunas via Midtrans (otomatis) atau mengunggah bukti transfer untuk diverifikasi Admin Toko.",
      },
      {
        judul: "Diterima Toko",
        aktor: "Sistem & Admin",
        ikon: "fa-solid fa-clipboard-check",
        detailPeran:
          "Pembayaran terkonfirmasi! Pesanan otomatis masuk ke jadwal kuota harian Admin dan antrean Tugas Hari Ini milik Petugas Dapur.",
      },
      {
        judul: isKatalogMurni ? "Disiapkan Dapur" : "Dibuat Patissier",
        aktor: "Petugas Produksi",
        ikon: "fa-solid fa-fire-burner",
        detailPeran: isKatalogMurni
          ? "Petugas Dapur menyiapkan dan mengemas produk kue katalog pesanan Anda."
          : "Petugas Produksi memotong bahan resep di stok dapur, memanggang kue, dan mendekorasi sesuai desain 3D Anda.",
      },
      {
        judul: pesanan && pesanan.metode_pengiriman === "Kirim" ? "Siap & Dikirim" : "Siap Diambil",
        aktor: "Petugas & Pelanggan",
        ikon: pesanan && pesanan.metode_pengiriman === "Kirim" ? "fa-solid fa-truck-fast" : "fa-solid fa-box-open",
        detailPeran:
          pesanan && pesanan.metode_pengiriman === "Kirim"
            ? "Setelah tagihan Lunas, Petugas memberangkatkan kurir ke titik peta alamat Anda."
            : "Pelanggan datang ke toko menunjukkan Tiket QR ke Petugas (serta melunasi sisa tagihan jika memilih DP).",
      },
      {
        judul: "Selesai",
        aktor: "Tuntas 3 Role",
        ikon: "fa-solid fa-circle-check",
        detailPeran:
          "Kue telah diterima pelanggan, struk resmi tercatat di laporan Admin, dan Anda dapat memesan ulang kapan saja.",
      },
    ];
  }

  const pesananTersaring = [];
  for (let i = 0; i < daftarPesananState.length; i++) {
    const p = daftarPesananState[i];
    let lolosStatus = true;
    if (filterStatusPesanan === "Aktif") {
      lolosStatus = ["Diterima", "Sedang Dibuat", "Siap", "Dikirim"].includes(p.status_pesanan);
    } else if (filterStatusPesanan === "Pending") {
      lolosStatus = p.status_pesanan === "Menunggu Pembayaran" || (p.status_bayar === "DP Dibayar" && p.status_pesanan !== "Dibatalkan");
    } else if (filterStatusPesanan === "Diproses Petugas") {
      lolosStatus = ["Diterima", "Sedang Dibuat"].includes(p.status_pesanan);
    } else if (filterStatusPesanan === "Siap & Dikirim") {
      lolosStatus = ["Siap", "Dikirim"].includes(p.status_pesanan);
    } else if (filterStatusPesanan === "Selesai") {
      lolosStatus = p.status_pesanan === "Selesai";
    } else if (filterStatusPesanan === "Dibatalkan") {
      lolosStatus = p.status_pesanan === "Dibatalkan";
    }
    if (!lolosStatus) continue;

    if (kataCariPesanan.trim()) {
      const q = kataCariPesanan.trim().toLowerCase();
      const cocokKode = (p.kode_pesanan || "").toLowerCase().includes(q);
      const cocokNama = (p.nama_penerima || "").toLowerCase().includes(q);
      const cocokTulisan = (p.tulisan_kue || "").toLowerCase().includes(q);
      const cocokIsi = (p.isi_singkat || "").toLowerCase().includes(q);
      if (!cocokKode && !cocokNama && !cocokTulisan && !cocokIsi) continue;
    }
    pesananTersaring.push(p);
  }

  const riwayatPesananTersaring = [];
  for (let i = 0; i < daftarPesananState.length; i++) {
    const p = daftarPesananState[i];
    if (filterRiwayat === "Selesai" && p.status_pesanan !== "Selesai") continue;
    if (filterRiwayat === "Lunas" && p.status_bayar !== "Lunas") continue;
    if (filterRiwayat === "DP" && p.status_bayar !== "DP Dibayar") continue;
    if (filterRiwayat === "Belum Bayar" && p.status_bayar !== "Belum Bayar") continue;
    riwayatPesananTersaring.push(p);
  }

  const daftarKategoriUnik = ["Semua"];
  for (let i = 0; i < katalogRekomendasi.length; i++) {
    const kat = katalogRekomendasi[i].kategori || "Patisserie";
    if (!daftarKategoriUnik.includes(kat)) {
      daftarKategoriUnik.push(kat);
    }
  }

  const katalogTersaring = [];
  for (let i = 0; i < katalogRekomendasi.length; i++) {
    const item = katalogRekomendasi[i];
    if (filterKategoriKatalog === "Semua" || item.kategori === filterKategoriKatalog) {
      katalogTersaring.push(item);
    }
  }

  function evaluasiTanggalKuota(tgl) {
    if (!tgl || !dataKetersediaan) return null;
    if (dataKetersediaan.tanggal_minimal && tgl < dataKetersediaan.tanggal_minimal) {
      return {
        status: "terlalu_dekat",
        judul: "Belum Memenuhi Minimal Hari Pesan",
        pesan: `Pemesanan kue paling cepat dimulai pada ${formatTanggalIndonesia(dataKetersediaan.tanggal_minimal)}.`,
        warna: "bg-amber-50 border-amber-200 text-amber-900",
        ikon: "fa-solid fa-hourglass-half text-amber-600",
      };
    }
    const listTutup = dataKetersediaan.tanggal_tutup || [];
    for (let i = 0; i < listTutup.length; i++) {
      const itemTutup = listTutup[i];
      const tglLibur = typeof itemTutup === "string" ? itemTutup : itemTutup.tanggal;
      if (tglLibur === tgl) {
        const alasan = typeof itemTutup === "object" && itemTutup.alasan ? ` (${itemTutup.alasan})` : "";
        return {
          status: "tutup",
          judul: "Toko Sedang Libur / Tutup",
          pesan: `Pada tanggal tersebut dapur produksi tidak menerima pesanan${alasan}.`,
          warna: "bg-rose-50 border-rose-200 text-rose-800",
          ikon: "fa-solid fa-calendar-xmark text-rose-600",
        };
      }
    }
    const listPenuh = dataKetersediaan.tanggal_penuh || [];
    if (listPenuh.includes(tgl)) {
      return {
        status: "penuh",
        judul: "Kuota Produksi Harian Penuh",
        pesan: "Antrean dapur untuk tanggal ini sudah penuh. Silakan pilih tanggal lainnya.",
        warna: "bg-rose-50 border-rose-200 text-rose-800",
        ikon: "fa-solid fa-ban text-rose-600",
      };
    }
    return {
      status: "tersedia",
      judul: "Jadwal Produksi Tersedia!",
      pesan: `Dapur buka pukul ${dataKetersediaan.jam_buka || "08:00"} – ${dataKetersediaan.jam_tutup || "20:00"} WIB dan siap menerima pesanan Anda.`,
      warna: "bg-emerald-50 border-emerald-200 text-emerald-900",
      ikon: "fa-solid fa-circle-check text-emerald-600",
    };
  }

  const hasilCekTanggal = evaluasiTanggalKuota(tanggalCekKuota);
  const maksKmToko =
    pengaturanToko && pengaturanToko.maks_jarak_kirim_km !== null && pengaturanToko.maks_jarak_kirim_km !== undefined
      ? Number(pengaturanToko.maks_jarak_kirim_km)
      : null;
  const hasilSimulasiOngkir = cariTarif(Number(jarakSimulasiKm) || 0, tarifJarakList, maksKmToko);

  async function handleSimpanProfilDanAlamat(e) {
    e.preventDefault();
    setPesanSuksesProfil("");
    setPesanErrorProfil("");

    const namaBersih = formProfil.nama.trim();
    if (!namaBersih) {
      setPesanErrorProfil("Nama lengkap wajib diisi.");
      return;
    }

    const waBersih = formProfil.no_wa.trim().replace(/[^0-9]/g, "");
    const isWaIndo = /^(0|62|\+62)8[1-9][0-9]{6,11}$/.test(formProfil.no_wa.trim());
    if (!isWaIndo || waBersih.length < 10) {
      setPesanErrorProfil(
        "Nomor WhatsApp harus berupa nomor Indonesia yang valid (contoh: 081234567890)."
      );
      return;
    }

    setSedangSimpanProfil(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: namaBersih,
          no_wa: formProfil.no_wa.trim(),
          alamat: (alamatTersimpan.alamat_lengkap || "").trim(),
          patokan: (alamatTersimpan.patokan || "").trim(),
          lat_alamat: alamatTersimpan.lat_alamat,
          lng_alamat: alamatTersimpan.lng_alamat,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPesanErrorProfil(data.pesan || "Gagal memperbarui profil.");
      } else {
        if (data.profil) {
          setProfil(data.profil);
        }
        const userId = (profilAwal && profilAwal.id) || "guest";
        try {
          localStorage.setItem(
            `cravely_alamat_user_${userId}`,
            JSON.stringify(alamatTersimpan)
          );
        } catch {}
        setPesanSuksesProfil(
          data.lokasiTersimpan === false
            ? data.pesan || "Profil diperbarui (lokasi tersimpan di perangkat ini)."
            : "Profil dan pin lokasi pengiriman utama berhasil disimpan untuk Checkout otomatis."
        );
      }
    } catch {
      setPesanErrorProfil("Terjadi kesalahan jaringan saat menyimpan profil.");
    } finally {
      setSedangSimpanProfil(false);
    }
  }

  async function handleGantiKataSandi(e) {
    e.preventDefault();
    setPesanSuksesSandi("");
    setPesanErrorSandi("");

    if (!formSandi.kataSandiLama) {
      setPesanErrorSandi("Kata sandi saat ini wajib diisi.");
      return;
    }
    if (!formSandi.kataSandiBaru || formSandi.kataSandiBaru.length < 8) {
      setPesanErrorSandi("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (formSandi.kataSandiBaru !== formSandi.konfirmasiSandi) {
      setPesanErrorSandi("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setSedangSimpanSandi(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kataSandiLama: formSandi.kataSandiLama,
          kataSandiBaru: formSandi.kataSandiBaru,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPesanErrorSandi(data.pesan || "Gagal memperbarui kata sandi.");
      } else {
        setPesanSuksesSandi("Kata sandi akun berhasil diperbarui.");
        setFormSandi({
          kataSandiLama: "",
          kataSandiBaru: "",
          konfirmasiSandi: "",
        });
      }
    } catch {
      setPesanErrorSandi("Terjadi kesalahan jaringan.");
    } finally {
      setSedangSimpanSandi(false);
    }
  }

  function buatLinkWaTiket(tiket) {
    const nomorMentah = (pengaturanToko && pengaturanToko.no_wa) || (tokoPublik && tokoPublik.no_wa) || "";
    let nomor = nomorMentah.replace(/[^0-9]/g, "");
    if (nomor.startsWith("0")) {
      nomor = "62" + nomor.slice(1);
    }
    if (!nomor) return null;
    const namaTokoWa = (pengaturanToko && pengaturanToko.nama_toko) || "Cravely Patisserie";
    const teks = `Halo ${namaTokoWa},\n\nSaya *${profil.nama || "Pelanggan"}* ingin menanyakan bantuan:\n- Kode Pesanan: *${tiket.kode_pesanan}*\n- Kategori: *${tiket.kategori}*\n- Subjek: *${tiket.subjek}*\n\nPesan:\n${tiket.pesan}`;
    return `https://wa.me/${nomor}?text=${encodeURIComponent(teks)}`;
  }

  function handleBuatTiketBantuan(e) {
    e.preventDefault();
    setPesanSuksesTiket("");
    if (!formTiket.subjek.trim() || !formTiket.pesan.trim()) return;

    const nomorTiket = `TKT-${String(Date.now()).slice(-4)}`;
    const tiketBaru = {
      id: nomorTiket,
      kode_pesanan: formTiket.kode_pesanan || "-",
      kategori: formTiket.kategori || "Status pembuatan kue",
      subjek: formTiket.subjek.trim(),
      pesan: formTiket.pesan.trim(),
      status: "Terhubung ke Admin WhatsApp",
      dibuat_pada: new Date().toISOString(),
    };

    const daftarBaru = [tiketBaru, ...daftarTiketBantuan];
    setDaftarTiketBantuan(daftarBaru);

    const userId = (profilAwal && profilAwal.id) || "guest";
    try {
      localStorage.setItem(`cravely_tiket_bantuan_${userId}`, JSON.stringify(daftarBaru));
    } catch {}

    const linkWa = buatLinkWaTiket(tiketBaru);
    if (linkWa) {
      window.open(linkWa, "_blank");
    }

    setFormTiket({
      ...formTiket,
      subjek: "",
      pesan: "",
    });
    setPesanSuksesTiket(
      "Tiket pertanyaan tercatat dan WhatsApp resmi toko telah dibuka untuk percakapan langsung dengan Admin."
    );
  }

  const badgePesananSidebar =
    pesananAktifList.length + pesananMenungguBayarList.length > 0
      ? String(pesananAktifList.length + pesananMenungguBayarList.length)
      : null;

  const menuSidebar = [
    {
      id: "beranda",
      label: "Dashboard",
      ikon: "fa-solid fa-table-cells-large",
      badge: null,
    },
    {
      id: "pesanan",
      label: "Pesanan Saya",
      ikon: "fa-solid fa-cake-candles",
      badge: badgePesananSidebar,
    },
    {
      id: "keranjang",
      label: "Keranjang & Menu",
      ikon: "fa-solid fa-bag-shopping",
      badge: jumlahKuantitasKeranjang > 0 ? String(jumlahKuantitasKeranjang) : null,
    },
    {
      id: "riwayat",
      label: "Riwayat & Struk",
      ikon: "fa-solid fa-file-invoice-dollar",
      badge: jumlahBuktiMenungguAdmin > 0 ? String(jumlahBuktiMenungguAdmin) : null,
    },
    {
      id: "profil",
      label: "Profil & Alamat",
      ikon: "fa-solid fa-user-gear",
      badge: null,
    },
    {
      id: "bantuan",
      label: "Jadwal & Bantuan",
      ikon: "fa-solid fa-headset",
      badge: null,
    },
  ];

  const daftarFaq = [
    {
      tanya: "Bagaimana pembagian peran antara Saya (Pelanggan), Admin, dan Petugas Dapur?",
      jawab:
        "Pelanggan memilih kue katalog atau merancang kue custom 3D, menentukan jadwal/lokasi peta, dan melakukan pembayaran. Admin mengelola katalog, kuota toko, memverifikasi bukti transfer manual, serta memantau laporan. Petugas Dapur memproses pesanan berstatus Diterima, memanggang & mendekorasi kue, mencatat pelunasan tunai di toko, hingga menyerahkan kue kepada Anda.",
    },
    {
      tanya: "Bagaimana pembayaran saya dikonfirmasi menjadi status Diterima?",
      jawab:
        "Pembayaran online melalui Midtrans (QRIS, GoPay, ShopeePay, Virtual Account) terverifikasi otomatis dalam hitungan detik. Anda juga bisa menekan tombol Cek Status Bayar langsung di dashboard ini. Untuk transfer manual (jika diaktifkan Admin), bukti bayar akan dikonfirmasi oleh Admin Toko.",
    },
    {
      tanya: "Kapan saya harus melunasi sisa tagihan jika memilih pembayaran DP?",
      jawab:
        "Sesuai aturan sistem Admin dan Petugas, pesanan harus berstatus Lunas sebelum kue dikirim kurir atau diserahkan di toko. Anda dapat melunasi sisa tagihan secara online lewat tombol Bayar Pelunasan, atau membayar Tunai di Tempat kepada Petugas saat mengambil kue di toko.",
    },
    {
      tanya: "Bagaimana ongkos kirim dihitung pada saat Checkout?",
      jawab:
        "Ongkos kirim dihitung otomatis berdasarkan jarak jalan dari koordinat toko ke pin peta alamat pengiriman Anda menggunakan tarif berundak yang diatur Admin. Anda dapat menyimpan pin lokasi rumah di menu Profil & Alamat agar terisi otomatis saat Checkout.",
    },
    {
      tanya: "Kapan pesanan masih dapat dibatalkan sendiri oleh Pelanggan?",
      jawab:
        "Anda dapat membatalkan pesanan langsung dari dashboard selama statusnya masih Menunggu Pembayaran dan belum ada pembayaran terkonfirmasi. Setelah masuk tahap produksi dapur, silakan hubungi Admin melalui Pusat Bantuan.",
    },
  ];

  const namaToko = (pengaturanToko && pengaturanToko.nama_toko) || "Cravely Patisserie";
  const sloganToko =
    (pengaturanToko && pengaturanToko.slogan) ||
    "Kue panggangan segar setiap hari dengan sentuhan pita & cinta ♡";

  let infoHeader = {
    judul: "Dashboard Pelanggan",
    subjudul: `Selamat datang kembali, ${profil.nama || "Pelanggan"} • Pantau pesanan kue yang terhubung langsung dengan Admin & Dapur Produksi.`,
  };
  if (tabAktif === "pesanan") {
    infoHeader = {
      judul: "Pelacakan Pesanan Saya",
      subjudul: "Lacak tahapan pengerjaan kue oleh Admin & Petugas Dapur, bayar tagihan, dan buka Tiket QR.",
    };
  } else if (tabAktif === "keranjang") {
    infoHeader = {
      judul: "Keranjang & Belanja Cepat",
      subjudul: "Kelola kue di keranjang belanja Anda atau tambahkan menu favorit toko sebelum Checkout.",
    };
  } else if (tabAktif === "riwayat") {
    infoHeader = {
      judul: "Riwayat Transaksi & Struk",
      subjudul: "Arsip pembayaran yang terverifikasi beserta cetak struk/invoice resmi toko.",
    };
  } else if (tabAktif === "profil") {
    infoHeader = {
      judul: "Profil & Lokasi Pengiriman",
      subjudul: "Atur kontak WhatsApp, pin peta rumah dengan cek ongkir otomatis, dan kata sandi akun.",
    };
  } else if (tabAktif === "bantuan") {
    infoHeader = {
      judul: "Cek Jadwal, Ongkir & Bantuan",
      subjudul: "Simulasikan ketersediaan tanggal dapur & tarif jarak, atau hubungi Admin toko lewat WhatsApp.",
    };
  }

  const notifBelumDibaca = totalNotifCount > 0 && !notifDibaca;

  return (
    <div className="ud-root font-sans selection:bg-[#F1DBD0] selection:text-[#9E3B42]">
      <Script
        src={snapScriptUrl}
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      <div className="pointer-events-none fixed top-0 right-0 z-0 opacity-45 hidden lg:block">
        <BotanicalTopRight color="#A36361" opacity={0.35} />
      </div>
      <div className="pointer-events-none fixed bottom-24 right-0 z-0 opacity-35 hidden xl:block">
        <BotanicalBottomRight color="#8A675C" opacity={0.3} />
      </div>

      {sidebarMobileBuka && (
        <div
          className="ud-mobile-overlay"
          onClick={() => setSidebarMobileBuka(false)}
        />
      )}

      <aside
        className={`ud-sidebar ${sidebarBuka ? "open" : ""} ${
          sidebarMobileBuka ? "mobile-open" : ""
        }`}
      >
        <div className="ud-side-bg">
          <div className="r t">
            <i className="fill"></i>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0H12C66 0 97 28 97 100H0Z" />
            </svg>
          </div>
          <div className="r m">
            <i className="fill"></i>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0H97Q101 50 97 100H0Z" />
            </svg>
          </div>
          <div className="r b">
            <i className="fill"></i>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0H12C66 0 97 28 97 100H0Z" />
            </svg>
          </div>
        </div>

        <div className="ud-side-body">
          <button
            type="button"
            className="ud-toggle-btn"
            aria-label="Buka atau tutup sidebar"
            onClick={handleToggleSidebar}
          >
            <svg viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex items-center justify-between">
            <Link href="/" className="ud-brand flex-1 min-w-0">
              <div className="ud-brand-logo">
                <img
                  src="/assets/images/Icon.png"
                  alt={namaToko}
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div className="ud-brand-text">
                <strong className="block font-serif text-lg font-bold text-[#FFFDF9] tracking-wide truncate max-w-[145px]">
                  {namaToko}
                </strong>
                <small className="block text-[10px] font-bold uppercase tracking-widest text-[#E5BF88]">
                  Ruang Pelanggan
                </small>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarMobileBuka(false)}
              className="lg:hidden mb-3 w-8 h-8 rounded-xl bg-white/10 text-[#FFFDF9] flex items-center justify-center cursor-pointer"
              aria-label="Tutup menu"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <nav className="ud-nav">
            {menuSidebar.map((item) => {
              const aktif = tabAktif === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => gantiTab(item.id)}
                  className={`ud-nav-item ${aktif ? "active" : ""}`}
                  data-tip={item.label}
                >
                  <i className={`${item.ikon} ud-nav-icon`}></i>
                  <span className="ud-nav-label">{item.label}</span>
                  {item.badge && <span className="ud-nav-badge">{item.badge}</span>}
                </button>
              );
            })}

            <div className="my-1.5 border-t border-[#EADCC8]/15" />

            <Link
              href="/pesan"
              className="ud-nav-item"
              data-tip="Cake Studio 3D"
            >
              <i className="fa-solid fa-wand-magic-sparkles ud-nav-icon text-[#E5BF88]"></i>
              <span className="ud-nav-label">Cake Studio 3D</span>
            </Link>

            <Link
              href="/menu"
              className="ud-nav-item"
              data-tip="Menu Katalog"
            >
              <i className="fa-solid fa-book-open ud-nav-icon text-[#F1DBD0]"></i>
              <span className="ud-nav-label">Menu Katalog</span>
            </Link>

            <Link
              href="/"
              className="ud-nav-item"
              data-tip="Ke Website"
            >
              <i className="fa-solid fa-globe ud-nav-icon"></i>
              <span className="ud-nav-label">Ke Website</span>
            </Link>
          </nav>
        </div>
      </aside>

      <main className="ud-main">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#EADCC8]/80">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarMobileBuka(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-[#FFFDF9] border border-[#D9B37C]/70 text-[#3D2B28] flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
              aria-label="Buka navigasi"
            >
              <i className="fa-solid fa-bars text-sm"></i>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#3D2B28] tracking-tight leading-tight truncate">
                <span className="ud-title-highlight">{infoHeader.judul}</span>
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#7A6158] mt-0.5 hidden sm:block truncate">
                {infoHeader.subjudul}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto bg-[#FFFDF9]/95 border border-[#D9B37C]/65 rounded-full p-1 shadow-xs">
            <button
              type="button"
              onClick={handleSegarkanData}
              disabled={sedangSegarkan}
              title="Segarkan status pesanan & keranjang"
              className="w-9 h-9 rounded-full hover:bg-[#F5ECE2] text-[#5A3B33] flex items-center justify-center transition cursor-pointer disabled:opacity-60"
            >
              <i className={`fa-solid fa-arrows-rotate text-xs ${sedangSegarkan ? "animate-spin text-[#9E3B42]" : ""}`}></i>
            </button>

            <Link
              href="/keranjang"
              prefetch={false}
              title="Keranjang Belanja Saya"
              className="h-9 px-3 rounded-full bg-[#FAF2E8] hover:bg-[#F1E4D5] text-[#3D2B28] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <i className="fa-solid fa-bag-shopping text-[#9E3B42]"></i>
              <span className="hidden md:inline">Keranjang</span>
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#9E3B42] text-white text-[11px] font-extrabold inline-flex items-center justify-center leading-none">
                {jumlahKuantitasKeranjang}
              </span>
            </Link>

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={handleBukaNotif}
                title="Notifikasi Pesanan"
                className="w-9 h-9 rounded-full hover:bg-[#F5ECE2] text-[#3D2B28] flex items-center justify-center relative transition cursor-pointer"
              >
                <i className="fa-regular fa-bell text-sm"></i>
                {notifBelumDibaca && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#9E3B42] text-white text-[10px] font-extrabold flex items-center justify-center border border-[#FFFDF9]">
                    {totalNotifCount}
                  </span>
                )}
              </button>

              {notifDropdownBuka && (
                <div className="absolute right-0 top-full mt-2.5 w-80 max-w-[90vw] rounded-3xl bg-[#FFFDF9] border-2 border-[#EADCC8] shadow-[0_18px_42px_rgba(45,20,15,0.2)] z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-[#FAF4ED] border-b border-[#EADCC8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#3D2B28]">
                        Notifikasi Saya
                      </span>
                      {totalNotifCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#9E3B42] text-white text-[10px] font-bold">
                          {totalNotifCount} info
                        </span>
                      )}
                    </div>
                    {totalNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNotifDibaca(true);
                          try {
                            sessionStorage.setItem(`cravely_user_notif_${totalNotifCount}`, "1");
                          } catch {}
                        }}
                        className="text-[11px] font-bold text-[#9E3B42] hover:underline cursor-pointer"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>

                  <div className="p-2.5 max-h-80 overflow-y-auto space-y-2">
                    {daftarNotifPelanggan.length === 0 ? (
                      <div className="py-8 px-4 text-center text-xs text-[#7A6158]">
                        <i className="fa-regular fa-bell-slash text-2xl text-[#D3A29D] mb-2 block"></i>
                        <p className="font-bold text-[#3D2B28]">Semua Terkendali!</p>
                        <p className="mt-0.5 text-[11px]">Belum ada tagihan atau pengingat pesanan baru.</p>
                      </div>
                    ) : (
                      daftarNotifPelanggan.map((ntf) => (
                        <button
                          key={ntf.id}
                          type="button"
                          onClick={ntf.onClick}
                          className="w-full text-left p-3 rounded-2xl bg-white hover:bg-[#FAF4ED] border border-[#EADCC8] transition flex items-start gap-3 cursor-pointer"
                        >
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 text-xs ${ntf.warna}`}>
                            <i className={ntf.ikon}></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-[#3D2B28] leading-snug">
                              {ntf.judul}
                            </p>
                            <p className="text-[11px] text-[#7A6158] mt-0.5 leading-relaxed">
                              {ntf.deskripsi}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#9E3B42] mt-1.5">
                              <span>{ntf.aksiLabel}</span>
                              <i className="fa-solid fa-chevron-right text-[8px]"></i>
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-[#EADCC8] mx-0.5" />

            <div className="relative" ref={profilRef}>
              <button
                type="button"
                onClick={() => {
                  setProfilDropdownBuka(!profilDropdownBuka);
                  setNotifDropdownBuka(false);
                }}
                className="h-9 pl-1 pr-3 rounded-full hover:bg-[#F5ECE2] flex items-center gap-2 transition cursor-pointer"
              >
                <AvatarPelangganSvg className="w-7 h-7 rounded-full border border-[#C59B62] shrink-0" />
                <div className="hidden sm:flex flex-col text-left leading-none">
                  <span className="text-xs font-extrabold text-[#3D2B28] max-w-[115px] truncate">
                    {profil.nama || "Pelanggan"}
                  </span>
                  <span className="text-[10px] font-bold text-[#9E3B42] mt-0.5">
                    Pelanggan
                  </span>
                </div>
                <i className="fa-solid fa-chevron-down text-[10px] text-[#B8925A]"></i>
              </button>

              {profilDropdownBuka && (
                <div className="absolute right-0 top-full mt-2.5 w-48 rounded-2xl bg-[#FFFDF9] border-2 border-[#EADCC8] shadow-[0_16px_36px_rgba(45,20,15,0.2)] p-1.5 z-50 text-xs font-bold text-[#3D2B28]">
                  <button
                    type="button"
                    onClick={() => gantiTab("profil")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FAF4ED] transition cursor-pointer text-left"
                  >
                    <i className="fa-regular fa-id-badge text-[#9E3B42] w-4 text-center"></i>
                    <span>Profil & Alamat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => gantiTab("pesanan")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FAF4ED] transition cursor-pointer text-left"
                  >
                    <i className="fa-solid fa-cake-candles text-[#9E3B42] w-4 text-center"></i>
                    <span>Pesanan Saya</span>
                  </button>
                  <Link
                    href="/checkout"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FAF4ED] transition text-left"
                  >
                    <i className="fa-solid fa-cash-register text-[#B8925A] w-4 text-center"></i>
                    <span>Halaman Checkout</span>
                  </Link>
                  <div className="my-1 border-t border-[#EADCC8]" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfilDropdownBuka(false);
                      setModalKeluarBuka(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-700 transition cursor-pointer text-left"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i>
                    <span>Keluar Akun</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {tabAktif === "beranda" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
              <div className="xl:col-span-6 relative rounded-2xl overflow-hidden border border-[#C59B62]/60 shadow-[0_10px_28px_rgba(45,20,15,0.14)] min-h-[195px] flex items-center p-5 sm:p-7 bg-[#3E2721] text-[#FFFDF9]">
                <img
                  src="/images/patisserie/umkm_bakery_counter_1795398163126.jpg"
                  alt={namaToko}
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-[1.03]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(115deg, rgba(45,30,27,0.92) 0%, rgba(62,39,33,0.78) 55%, rgba(158,59,66,0.52) 100%)",
                  }}
                />
                <span className="pointer-events-none absolute top-4 right-6 text-[#F3D59B] text-base animate-twinkle">
                  ✦
                </span>
                <span className="pointer-events-none absolute bottom-5 right-14 text-[#F1DBD0] text-xs animate-float-soft">
                  ✿
                </span>

                <div className="relative z-10 max-w-xl space-y-3">
                  <div>
                    <p className="font-script text-2xl sm:text-3xl text-[#F1DBD0] leading-none">
                      Selamat Datang,
                    </p>
                    <h2 className="font-serif text-2xl sm:text-4xl font-black text-[#FFFDF9] tracking-tight mt-0.5">
                      {profil.nama || "Sahabat Cravely"}!
                    </h2>
                    <p className="text-xs sm:text-sm text-[#EADCC8] mt-1 leading-relaxed max-w-lg">
                      {sloganToko}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Link
                      href="/pesan"
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-[#9E3B42] to-[#B23A48] hover:brightness-110 text-white text-xs sm:text-sm font-extrabold shadow-[0_6px_16px_rgba(158,59,66,0.35)] border border-[#F1DBD0]/35 inline-flex items-center gap-2 transition"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-[#F1DBD0]"></i>
                      <span>Rancang Kue 3D</span>
                    </Link>
                    <Link
                      href="/menu"
                      className="px-4 py-2 rounded-full bg-[#FFFDF9]/95 hover:bg-white text-[#3D2B28] text-xs sm:text-sm font-extrabold border border-[#C59B62] inline-flex items-center gap-2 transition shadow-xs"
                    >
                      <i className="fa-solid fa-cake-candles text-[#9E3B42]"></i>
                      <span>Pilih Menu Katalog</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-6 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#3D2B28]">
                    <i className="fa-solid fa-chart-pie text-[#9E3B42]"></i>
                    <span>Ringkasan Aktivitas Saya</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFDF9] border border-[#D9B37C]/75 text-xs shadow-xs">
                    <i className="fa-regular fa-calendar text-[#B8925A] text-[11px]"></i>
                    <span className="font-semibold text-[#7A6158] hidden sm:inline">Periode:</span>
                    <select
                      value={periodeMetrik}
                      onChange={(e) => setPeriodeMetrik(e.target.value)}
                      aria-label="Pilih periode ringkasan"
                      className="bg-transparent text-xs font-extrabold text-[#3D2B28] outline-none cursor-pointer"
                    >
                      <option value="semua">Semua Waktu</option>
                      <option value="bulan_ini">Bulan Ini</option>
                      <option value="minggu_ini">7 Hari Terakhir</option>
                      <option value="hari_ini">Hari Ini</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatusPesanan("Aktif");
                      gantiTab("pesanan");
                    }}
                    className="ud-card ud-card-hover p-4 text-left flex items-center gap-3.5 relative overflow-hidden cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#FCE8EC] text-[#9E3B42] border border-[#EBC0C8] flex items-center justify-center text-base shrink-0">
                      <i className="fa-solid fa-fire-burner"></i>
                    </div>
                    <div className="min-w-0 z-10">
                      <span className="text-xs font-bold text-[#7A6158] block">
                        Pesanan Aktif
                      </span>
                      <div className="font-serif text-2xl sm:text-3xl font-black text-[#3D2B28] leading-tight">
                        <AngkaAnimasi nilai={metrikAktif} />
                      </div>
                      <span className="text-[11px] font-bold text-[#9E3B42] block truncate">
                        Diproses Admin &amp; Petugas
                      </span>
                    </div>
                    <svg className="absolute right-0 bottom-0 w-16 h-9 opacity-40 pointer-events-none" viewBox="0 0 80 40" fill="none">
                      <path d="M0 32 Q25 14 50 26 T80 12 L80 40 L0 40 Z" fill="#F1DBD0" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatusPesanan("Pending");
                      gantiTab("pesanan");
                    }}
                    className="ud-card ud-card-hover p-4 text-left flex items-center gap-3.5 relative overflow-hidden cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#FFF3D6] text-[#875C1A] border border-[#EED39B] flex items-center justify-center text-base shrink-0">
                      <i className="fa-solid fa-clock"></i>
                    </div>
                    <div className="min-w-0 z-10">
                      <span className="text-xs font-bold text-[#7A6158] block">
                        Menunggu Bayar
                      </span>
                      <div className="font-serif text-2xl sm:text-3xl font-black text-[#875C1A] leading-tight">
                        <AngkaAnimasi nilai={metrikMenungguBayar} />
                      </div>
                      <span className="text-[11px] font-bold text-[#7A6158] block truncate">
                        {jumlahBuktiMenungguAdmin > 0
                          ? `${jumlahBuktiMenungguAdmin} bukti dicek Admin`
                          : `Tagihan aktif: ${formatRupiah(totalSisaTagihan)}`}
                      </span>
                    </div>
                    <svg className="absolute right-0 bottom-0 w-16 h-9 opacity-40 pointer-events-none" viewBox="0 0 80 40" fill="none">
                      <path d="M0 32 Q25 14 50 26 T80 12 L80 40 L0 40 Z" fill="#F6E3BA" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => gantiTab("riwayat")}
                    className="ud-card ud-card-hover p-4 text-left flex items-center gap-3.5 relative overflow-hidden cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#E8F4EC] text-[#215934] border border-[#BFE0C9] flex items-center justify-center text-base shrink-0">
                      <i className="fa-solid fa-sack-dollar"></i>
                    </div>
                    <div className="min-w-0 z-10">
                      <span className="text-xs font-bold text-[#7A6158] block">
                        Total Belanja
                      </span>
                      <div className="font-serif text-xl sm:text-2xl font-black text-[#3D2B28] leading-tight truncate">
                        <AngkaAnimasi nilai={metrikTotalBelanja} formatUang={true} />
                      </div>
                      <span className="text-[11px] font-bold text-[#215934] block truncate">
                        Pembayaran terkonfirmasi
                      </span>
                    </div>
                    <svg className="absolute right-0 bottom-0 w-16 h-9 opacity-40 pointer-events-none" viewBox="0 0 80 40" fill="none">
                      <path d="M0 32 Q25 14 50 26 T80 12 L80 40 L0 40 Z" fill="#D4EBDD" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatusPesanan("Selesai");
                      gantiTab("pesanan");
                    }}
                    className="ud-card ud-card-hover p-4 text-left flex items-center gap-3.5 relative overflow-hidden cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#FAF0E4] text-[#8C582C] border border-[#E5CFAF] flex items-center justify-center text-base shrink-0">
                      <i className="fa-solid fa-award"></i>
                    </div>
                    <div className="min-w-0 z-10">
                      <span className="text-xs font-bold text-[#7A6158] block">
                        Pesanan Selesai
                      </span>
                      <div className="font-serif text-2xl sm:text-3xl font-black text-[#3D2B28] leading-tight">
                        <AngkaAnimasi nilai={metrikSelesai} />
                      </div>
                      <span className="text-[11px] font-bold text-[#8C582C] block truncate">
                        Siap dipesan ulang
                      </span>
                    </div>
                    <svg className="absolute right-0 bottom-0 w-16 h-9 opacity-40 pointer-events-none" viewBox="0 0 80 40" fill="none">
                      <path d="M0 32 Q25 14 50 26 T80 12 L80 40 L0 40 Z" fill="#EADCC8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {pesananUtamaDilacak && (
              <div className="ud-card p-4 sm:p-5 space-y-4">
                {kandidatDilacak.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-[#EADCC8]/70">
                    <span className="text-[11px] font-extrabold text-[#7A6158] shrink-0">
                      Pilih Pesanan Dilacak:
                    </span>
                    {kandidatDilacak.slice(0, 6).map((ord) => {
                      const dipilih = ord.id === pesananUtamaDilacak.id;
                      return (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => {
                            setIdPesananDilacak(ord.id);
                            setTahapStepperDipilih(null);
                          }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold shrink-0 transition cursor-pointer ${
                            dipilih
                              ? "bg-[#9E3B42] text-white shadow-xs"
                              : "bg-[#FAF4ED] text-[#5A3B33] hover:bg-[#F1DBD0]/60 border border-[#EADCC8]"
                          }`}
                        >
                          {ord.kode_pesanan} • {ord.status_pesanan}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-xl bg-[#FAF4ED] border border-[#EADCC8] p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                      {pesananUtamaDilacak.fotoPreviewUrl ? (
                        <img
                          src={pesananUtamaDilacak.fotoPreviewUrl}
                          alt={pesananUtamaDilacak.kode_pesanan}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <PreviewKue
                          pilihan={pesananUtamaDilacak.pesanan_pilihan || []}
                          tulisan={pesananUtamaDilacak.tulisan_kue || ""}
                          className="w-full h-full"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9E3B42] bg-[#FCE8EC] px-2.5 py-0.5 rounded-full border border-[#EBC0C8]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9E3B42] animate-ping" />
                          Pelacakan Lintas Role
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeStatusWarna(pesananUtamaDilacak.status_pesanan)}`}>
                          {pesananUtamaDilacak.status_pesanan}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeBayarWarna(pesananUtamaDilacak.status_bayar)}`}>
                          {pesananUtamaDilacak.status_bayar}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-black text-[#3D2B28] mt-1 truncate">
                        {pesananUtamaDilacak.kode_pesanan} — {pesananUtamaDilacak.isi_singkat}
                      </h3>
                      <p className="text-xs text-[#7A6158] font-semibold mt-0.5 truncate">
                        Penerima: <strong className="text-[#3D2B28]">{pesananUtamaDilacak.nama_penerima}</strong> •{" "}
                        {formatTeksJadwal(pesananUtamaDilacak).teks} ({formatTeksJadwal(pesananUtamaDilacak).sub})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0">
                    {pesananUtamaDilacak.status_pesanan === "Menunggu Pembayaran" && (
                      <div className="px-3 py-1.5 rounded-xl bg-[#FFF8EB] border border-[#F0D9A8] text-xs whitespace-nowrap">
                        <span className="text-[10px] font-bold uppercase text-[#875C1A] block">
                          Hitung Mundur Bayar
                        </span>
                        <strong className="font-mono text-xs font-black text-[#9E3B42]">
                          {formatHitungMundur(hitungSisaDetikBayar(pesananUtamaDilacak))}
                        </strong>
                      </div>
                    )}

                    {pesananUtamaDilacak.status_pesanan !== "Dibatalkan" &&
                      Math.max(
                        0,
                        Number(pesananUtamaDilacak.total_bayar || 0) -
                          Number(pesananUtamaDilacak.jumlah_terbayar || 0)
                      ) > 0 && (
                        <>
                          <button
                            type="button"
                            disabled={sedangBayarKode === pesananUtamaDilacak.kode_pesanan}
                            onClick={() => handleBayarMidtransLangsung(pesananUtamaDilacak)}
                            className="px-3.5 py-2 rounded-xl bg-[#9E3B42] hover:bg-[#7D2330] text-white text-xs font-extrabold shadow-xs transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <i className={`fa-solid ${sedangBayarKode === pesananUtamaDilacak.kode_pesanan ? "fa-circle-notch fa-spin" : "fa-credit-card"}`}></i>
                            <span>
                              {pesananUtamaDilacak.status_bayar === "DP Dibayar"
                                ? "Bayar Pelunasan"
                                : "Bayar Sekarang"}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={sedangCekBayarKode === pesananUtamaDilacak.kode_pesanan}
                            onClick={() => handleCekStatusMidtrans(pesananUtamaDilacak.kode_pesanan)}
                            className="px-3 py-2 rounded-xl bg-[#FAF4ED] hover:bg-[#F1DBD0]/50 border border-[#D9B37C]/80 text-[#3D2B28] text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <i className={`fa-solid fa-arrows-rotate ${sedangCekBayarKode === pesananUtamaDilacak.kode_pesanan ? "animate-spin text-[#9E3B42]" : ""}`}></i>
                            <span>Cek Status</span>
                          </button>
                        </>
                      )}

                    {pesananUtamaDilacak.qrDataUrl && (
                      <button
                        type="button"
                        onClick={() => setPesananTiketQr(pesananUtamaDilacak)}
                        className="px-3.5 py-2 rounded-xl bg-[#3E2721] hover:bg-[#2D1E1B] text-[#FFFDF9] text-xs font-extrabold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <i className="fa-solid fa-qrcode text-[#E5BF88]"></i>
                        <span>Tiket QR Cepat</span>
                      </button>
                    )}

                    <Link
                      href={`/pesanan-saya/${pesananUtamaDilacak.kode_pesanan}`}
                      className="px-3.5 py-2 rounded-xl border border-[#EADCC8] bg-white hover:bg-[#FAF4ED] text-[#3D2B28] text-xs font-bold transition inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Detail Tiket</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-[#9E3B42]"></i>
                    </Link>
                  </div>
                </div>

                {pesananUtamaDilacak.status_pesanan === "Dibatalkan" ? (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <i className="fa-solid fa-circle-xmark text-base text-rose-600 shrink-0"></i>
                      <div className="min-w-0">
                        <p className="font-extrabold">
                          Pesanan Dibatalkan ({pesananUtamaDilacak.dibatalkan_oleh || "Toko"})
                        </p>
                        <p className="mt-0.5 text-rose-700">
                          Alasan: {pesananUtamaDilacak.alasan_batal || "Tidak disebutkan"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {dapatkanTahapStepper(pesananUtamaDilacak).map((thp, idx) => {
                        const idxSekarang = indeksTahapStepper(pesananUtamaDilacak.status_pesanan);
                        const selesai = idxSekarang > idx;
                        const aktif = idxSekarang === idx;
                        const dipilih = tahapStepperDipilih === idx;

                        return (
                          <button
                            key={thp.judul}
                            type="button"
                            onClick={() =>
                              setTahapStepperDipilih(dipilih ? null : idx)
                            }
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                              aktif
                                ? "bg-[#FCE8EC]/75 border-[#9E3B42] shadow-[0_6px_16px_rgba(158,59,66,0.14)] -translate-y-0.5"
                                : selesai
                                  ? "bg-[#F4FAF6] border-[#B5E5C6] hover:border-[#215934]"
                                  : "bg-[#FAF6F0] border-[#EADCC8] opacity-75 hover:opacity-100"
                            } ${dipilih ? "ring-2 ring-[#C59B62]" : ""}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                                  selesai
                                    ? "bg-[#215934] text-white"
                                    : aktif
                                      ? "bg-[#9E3B42] text-white animate-pulse"
                                      : "bg-[#EADCC8] text-[#7A6158]"
                                }`}
                              >
                                <i className={selesai ? "fa-solid fa-check" : thp.ikon}></i>
                              </span>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A6158]">
                                {thp.aktor}
                              </span>
                            </div>
                            <p className="text-xs font-extrabold text-[#3D2B28]">
                              {thp.judul}
                            </p>
                            <span className="text-[10px] font-semibold text-[#9E3B42] mt-0.5 block">
                              Klik info peran &rarr;
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {tahapStepperDipilih !== null &&
                      dapatkanTahapStepper(pesananUtamaDilacak)[tahapStepperDipilih] && (
                        <div className="p-3.5 rounded-2xl bg-[#FAF4ED] border border-[#D9B37C] text-xs text-[#3D2B28] flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <i className="fa-solid fa-circle-info text-[#9E3B42] mt-0.5"></i>
                            <div>
                              <p className="font-extrabold">
                                Peran Sistem pada Tahap &ldquo;
                                {dapatkanTahapStepper(pesananUtamaDilacak)[tahapStepperDipilih].judul}
                                &rdquo; ({dapatkanTahapStepper(pesananUtamaDilacak)[tahapStepperDipilih].aktor})
                              </p>
                              <p className="text-[#5A3B33] mt-0.5 leading-relaxed">
                                {dapatkanTahapStepper(pesananUtamaDilacak)[tahapStepperDipilih].detailPeran}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTahapStepperDipilih(null)}
                            className="text-[#7A6158] hover:text-[#3D2B28] cursor-pointer"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      )}
                  </div>
                )}

                {pesananUtamaDilacak.status_pesanan !== "Dibatalkan" && (() => {
                  const info = infoPenanggungJawab(pesananUtamaDilacak);
                  const logTerakhir =
                    pesananUtamaDilacak.riwayat_pesanan &&
                    pesananUtamaDilacak.riwayat_pesanan.length > 0
                      ? pesananUtamaDilacak.riwayat_pesanan[0]
                      : null;
                  return (
                    <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${info.warna}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/85 flex items-center justify-center text-sm shrink-0 shadow-xs">
                          <i className={info.ikon}></i>
                        </div>
                        <div className="text-xs">
                          <p className="font-extrabold">{info.label}</p>
                          <p className="mt-0.5 opacity-90">{info.deskripsi}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {logTerakhir && (
                          <div className="text-[11px] bg-white/80 px-3 py-1.5 rounded-xl border border-black/5">
                            <span className="font-extrabold block">Log Admin/Petugas:</span>
                            <span>{logTerakhir.keterangan}</span>
                          </div>
                        )}
                        <span className="px-3 py-1.5 rounded-xl bg-white/90 text-[10px] font-extrabold uppercase tracking-wider border border-black/5">
                          {info.aktorRole}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7 ud-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9E3B42]">
                      Etalase Patisserie
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-black text-[#3D2B28]">
                      Belanja Cepat Kue Pilihan Toko
                    </h2>
                  </div>
                  <Link
                    href="/menu"
                    className="text-xs sm:text-sm font-extrabold text-[#9E3B42] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Buka Katalog Lengkap</span>
                    <i className="fa-solid fa-arrow-right text-[11px]"></i>
                  </Link>
                </div>

                {daftarKategoriUnik.length > 2 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {daftarKategoriUnik.map((kat) => (
                      <button
                        key={kat}
                        type="button"
                        onClick={() => setFilterKategoriKatalog(kat)}
                        className={`px-3.5 py-1 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                          filterKategoriKatalog === kat
                            ? "bg-[#3E2721] text-[#FFFDF9]"
                            : "bg-[#FAF4ED] text-[#5A3B33] hover:bg-[#F1DBD0]/55 border border-[#EADCC8]"
                        }`}
                      >
                        {kat}
                      </button>
                    ))}
                  </div>
                )}

                {katalogTersaring.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#FAF4ED] border border-dashed border-[#D9B37C] text-center text-xs sm:text-sm text-[#7A6158]">
                    Belum ada produk katalog aktif saat ini. Anda tetap dapat merancang kue di{" "}
                    <Link href="/pesan" className="font-extrabold text-[#9E3B42] underline">
                      Cake Studio 3D
                    </Link>
                    .
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {katalogTersaring.slice(0, 4).map((item) => {
                      const sedangTambah = sedangTambahProdukId === item.id;
                      const baruDitambah = Boolean(berhasilTambahMap[item.id]);
                      return (
                        <div
                          key={item.id}
                          className="group bg-[#FFFDF9] rounded-2xl border border-[#EADCC8] hover:border-[#C59B62] hover:shadow-md transition p-3.5 flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-xl bg-[#FAF4ED] border border-[#EADCC8] overflow-hidden shrink-0 flex items-center justify-center">
                              {(gambarGagalMap[item.id] ? getFotoProdukFallback(item.nama) : item.foto_url) ? (
                                <img
                                  src={gambarGagalMap[item.id] ? getFotoProdukFallback(item.nama) : item.foto_url}
                                  alt={item.nama}
                                  onError={() => {
                                    if (!gambarGagalMap[item.id]) {
                                      setGambarGagalMap((prev) => ({
                                        ...prev,
                                        [item.id]: true,
                                      }));
                                    }
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <i className="fa-solid fa-cake-candles text-xl text-[#D3A29D]"></i>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B8925A] block">
                                {item.kategori}
                              </span>
                              <h3 className="font-serif text-base sm:text-lg font-bold text-[#3D2B28] leading-snug truncate">
                                {item.nama}
                              </h3>
                              <p className="text-xs sm:text-sm font-black text-[#9E3B42] mt-0.5">
                                {formatRupiah(item.harga)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#F3E8DA]">
                            <Link
                              href={`/menu?id=${item.id}`}
                              className="text-xs font-bold text-[#7A6158] hover:text-[#3D2B28] whitespace-nowrap"
                            >
                              Lihat Detail
                            </Link>
                            <button
                              type="button"
                              disabled={sedangTambah}
                              onClick={() => handleTambahKeKeranjang(item.id, item.nama)}
                              className={`px-3 py-1.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 whitespace-nowrap ${
                                baruDitambah
                                  ? "bg-[#215934] text-white"
                                  : "bg-[#9E3B42] hover:bg-[#7D2330] text-white"
                              }`}
                            >
                              <i
                                className={`fa-solid ${
                                  baruDitambah
                                    ? "fa-check"
                                    : sedangTambah
                                      ? "fa-circle-notch fa-spin"
                                      : "fa-plus"
                                } text-[10px]`}
                              ></i>
                              <span>{baruDitambah ? "Masuk Keranjang" : "Keranjang"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 space-y-5">
                <div className="ud-card p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B8925A]">
                        Meja Kasir Saya
                      </span>
                      <h2 className="font-serif text-xl sm:text-2xl font-black text-[#3D2B28]">
                        Keranjang Aktif ({jumlahKuantitasKeranjang})
                      </h2>
                    </div>
                    {keranjangItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => gantiTab("keranjang")}
                        className="text-xs sm:text-sm font-extrabold text-[#9E3B42] hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Kelola &rarr;
                      </button>
                    )}
                  </div>

                  {keranjangItems.length === 0 ? (
                    <div className="p-5 rounded-xl bg-[#FAF4ED] border border-dashed border-[#EADCC8] text-center space-y-1.5">
                      <i className="fa-solid fa-bag-shopping text-2xl text-[#D3A29D]"></i>
                      <p className="text-xs sm:text-sm font-bold text-[#3D2B28]">
                        Keranjang Belanja Masih Kosong
                      </p>
                      <p className="text-xs text-[#7A6158]">
                        Tambahkan kue dari panel Etalase di samping atau rancang kue di Studio 3D.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                        {keranjangItems.map((it) => (
                          <div
                            key={it.id}
                            className="p-3 rounded-xl bg-[#FAF4ED] border border-[#EADCC8] flex items-center justify-between gap-2.5 text-xs sm:text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-[#3D2B28] truncate text-xs sm:text-sm">
                                {it.nama || (it.jenis === "Custom" ? "Kue Custom 3D" : "Kue Katalog")}
                              </p>
                              <p className="text-xs text-[#9E3B42] font-bold">
                                {formatRupiah(it.subtotal || 0)}
                              </p>
                            </div>
                            {it.jenis !== "Custom" ? (
                              <div className="inline-flex items-center gap-1.5 bg-white rounded-full px-2 py-0.5 border border-[#EADCC8]">
                                <button
                                  type="button"
                                  disabled={sedangUbahKeranjangId === it.id || it.jumlah <= 1}
                                  onClick={() => handleUbahQtyKeranjang(it, Number(it.jumlah) - 1)}
                                  className="w-5 h-5 rounded-full hover:bg-[#FAF4ED] text-[#3D2B28] font-black cursor-pointer disabled:opacity-40 text-xs"
                                >
                                  -
                                </button>
                                <span className="text-xs font-extrabold px-1">
                                  {it.jumlah}
                                </span>
                                <button
                                  type="button"
                                  disabled={sedangUbahKeranjangId === it.id}
                                  onClick={() => handleUbahQtyKeranjang(it, Number(it.jumlah) + 1)}
                                  className="w-5 h-5 rounded-full hover:bg-[#FAF4ED] text-[#3D2B28] font-black cursor-pointer disabled:opacity-40 text-xs"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-[#F3E7D3] text-[#6B4B1C] text-[11px] font-bold">
                                Custom 3D
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-[#EADCC8] flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#7A6158] block">
                            Subtotal Kue
                          </span>
                          <strong className="font-serif text-xl font-black text-[#3D2B28]">
                            {formatRupiah(ringkasanKeranjang.total_kue || 0)}
                          </strong>
                        </div>
                        <Link
                          href="/checkout"
                          className="px-4 py-2 rounded-full bg-[#9E3B42] hover:bg-[#7D2330] text-white text-xs sm:text-sm font-extrabold shadow-xs inline-flex items-center gap-1.5 transition whitespace-nowrap"
                        >
                          <span>Checkout Sekarang</span>
                          <i className="fa-solid fa-arrow-right text-[11px]"></i>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ud-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg sm:text-xl font-black text-[#3D2B28] flex items-center gap-2">
                      <i className="fa-regular fa-calendar-check text-[#9E3B42] text-sm"></i>
                      <span>Cek Cepat Kuota Tanggal Dapur</span>
                    </h3>
                    {sedangMuatKetersediaan && (
                      <i className="fa-solid fa-circle-notch fa-spin text-xs text-[#9E3B42]"></i>
                    )}
                  </div>
                  <input
                    type="date"
                    value={tanggalCekKuota}
                    min={hariIniIso}
                    onChange={(e) => setTanggalCekKuota(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-bold text-[#3D2B28] outline-none focus:border-[#9E3B42]"
                  />
                  {hasilCekTanggal && (
                    <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${hasilCekTanggal.warna}`}>
                      <i className={`${hasilCekTanggal.ikon} mt-0.5 text-sm`}></i>
                      <div>
                        <p className="font-extrabold">{hasilCekTanggal.judul}</p>
                        <p className="text-[11px] mt-0.5 opacity-90">{hasilCekTanggal.pesan}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ud-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-black text-[#3D2B28]">
                    5 Pesanan Terbaru Saya
                  </h2>
                  <p className="text-xs text-[#7A6158] mt-0.5">
                    Sinkron otomatis dengan daftar pesanan Admin &amp; Petugas Dapur
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => gantiTab("pesanan")}
                  className="text-xs sm:text-sm font-extrabold text-[#9E3B42] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Lihat Semua &rarr;
                </button>
              </div>

              {daftarPesananState.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-[#FAF4ED] border border-dashed border-[#EADCC8]">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#FCE8EC] text-[#9E3B42] flex items-center justify-center text-xl">
                    <i className="fa-solid fa-cake-candles"></i>
                  </div>
                  <p className="font-serif text-lg font-bold text-[#3D2B28]">
                    Belum Ada Pesanan
                  </p>
                  <p className="text-xs text-[#7A6158] mt-1 max-w-sm mx-auto">
                    Pesanan kue katalog maupun custom 3D Anda akan tercatat di sini dan langsung terhubung ke dapur produksi.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAF4ED] text-[#5A3B33] uppercase text-[11px] font-extrabold">
                        <th className="py-3 px-4 rounded-l-xl">Kode & Isi</th>
                        <th className="py-3 px-4">Jadwal Ambil/Kirim</th>
                        <th className="py-3 px-4">Metode</th>
                        <th className="py-3 px-4">Total Tagihan</th>
                        <th className="py-3 px-4">Status Bayar</th>
                        <th className="py-3 px-4">Status Dapur</th>
                        <th className="py-3 px-4 rounded-r-xl text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3E8DA]">
                      {daftarPesananState.slice(0, 5).map((p) => {
                        const jadwal = formatTeksJadwal(p);
                        return (
                          <tr key={p.id} className="hover:bg-[#FAF6F0] transition">
                            <td className="py-3.5 px-4">
                              <span className="font-extrabold text-[#3D2B28] block">
                                {p.kode_pesanan}
                              </span>
                              <span className="text-[11px] text-[#7A6158] truncate block max-w-[190px]">
                                {p.isi_singkat}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#5A3B33]">
                              <span className="font-bold block">{jadwal.teks}</span>
                              <span className="text-[11px] text-[#7A6158]">{jadwal.sub}</span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#5A3B33]">
                              {p.metode_pengiriman === "Ambil" ? "Ambil di Toko" : "Kirim Kurir"}
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-[#3D2B28]">
                              {formatRupiah(p.total_bayar)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeBayarWarna(p.status_bayar)}`}>
                                {p.status_bayar}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeStatusWarna(p.status_pesanan)}`}>
                                {p.status_pesanan}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {isMounted && p.status_pesanan === "Menunggu Pembayaran" && (
                                <button
                                  type="button"
                                  onClick={() => handleBayarMidtransLangsung(p)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#9E3B42] hover:bg-[#7D2330] text-white font-bold text-[11px] cursor-pointer"
                                >
                                  <i className="fa-solid fa-credit-card text-[10px]"></i>
                                  <span>Bayar</span>
                                </button>
                              )}
                              {p.qrDataUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPesananTiketQr(p)}
                                  className="px-2.5 py-1.5 rounded-full border border-[#EADCC8] bg-white hover:bg-[#FAF4ED] text-[#3D2B28] font-bold text-[11px] cursor-pointer"
                                  title="Buka QR Pengambilan"
                                >
                                  <i className="fa-solid fa-qrcode"></i>
                                </button>
                              )}
                              <Link
                                href={`/pesanan-saya/${p.kode_pesanan}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#3E2721] hover:bg-[#2D1E1B] text-[#FFFDF9] font-bold text-[11px]"
                              >
                                <span>Tiket</span>
                                <i className="fa-solid fa-arrow-right text-[9px]"></i>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tabAktif === "pesanan" && (
          <div className="space-y-4">
            <div className="ud-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "Semua", label: "Semua" },
                  { id: "Aktif", label: "Sedang Aktif" },
                  { id: "Pending", label: "Perlu Bayar / DP" },
                  { id: "Diproses Petugas", label: "Diproses Petugas" },
                  { id: "Siap & Dikirim", label: "Siap / Dikirim" },
                  { id: "Selesai", label: "Selesai" },
                  { id: "Dibatalkan", label: "Dibatalkan" },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setFilterStatusPesanan(flt.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold transition cursor-pointer whitespace-nowrap ${
                      filterStatusPesanan === flt.id
                        ? "bg-[#9E3B42] text-white shadow-xs"
                        : "bg-[#FAF4ED] text-[#5A3B33] hover:bg-[#F1DBD0]/55 border border-[#EADCC8]"
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-64 shrink-0">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D62] text-xs"></i>
                <input
                  type="text"
                  value={kataCariPesanan}
                  onChange={(e) => setKataCariPesanan(e.target.value)}
                  placeholder="Cari kode, kue, atau penerima..."
                  className="w-full pl-9 pr-4 py-2 rounded-full bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42]"
                />
              </div>
            </div>

            {pesananTersaring.length === 0 ? (
              <div className="ud-card p-12 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#FCE8EC] text-[#9E3B42] flex items-center justify-center text-2xl">
                  <i className="fa-solid fa-box-open"></i>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#3D2B28]">
                  Tidak Ada Pesanan pada Filter Ini
                </h3>
                <p className="text-xs text-[#7A6158] mt-1">
                  Silakan ubah kategori filter di atas atau buat pesanan kue baru.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pesananTersaring.map((p) => {
                  const info = infoPenanggungJawab(p);
                  const sisa = Math.max(
                    0,
                    (Number(p.total_bayar) || 0) - (Number(p.jumlah_terbayar) || 0)
                  );
                  const terbuka = pesananDetailTerbuka === p.id;
                  const itemKatalogPertama = (p.pesanan_item || []).find(
                    (it) => it.id_produk && (!it.produk || it.produk.aktif !== false)
                  );

                  return (
                    <div key={p.id} className="ud-card p-4 sm:p-5 space-y-3.5">
                      {p.perlu_refund && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2.5">
                          <i className="fa-solid fa-triangle-exclamation text-amber-600 text-base shrink-0"></i>
                          <p className="font-semibold">
                            Pembayaran diterima setelah pesanan dibatalkan; Admin toko akan menindaklanjuti pengembalian dana Anda.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.fotoPreviewUrl || itemKatalogPertama ? (
                              <GambarProduk
                                src={p.fotoPreviewUrl}
                                nama={itemKatalogPertama?.nama_item}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <PreviewKue
                                pilihan={p.pesanan_pilihan || []}
                                tulisan={p.tulisan_kue || ""}
                                className="w-full h-full"
                              />
                            )}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-serif text-xl font-black text-[#3D2B28]">
                                {p.kode_pesanan}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeStatusWarna(p.status_pesanan)}`}>
                                {p.status_pesanan}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeBayarWarna(p.status_bayar)}`}>
                                {p.status_bayar}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-[#5A3B33]">
                              Penerima: {p.nama_penerima} •{" "}
                              {p.metode_pengiriman === "Ambil"
                                ? "Ambil di Toko"
                                : `Kirim Kurir${p.jarak_km ? ` (${p.jarak_km} km)` : p.zona_ongkir && p.zona_ongkir.nama ? ` (${p.zona_ongkir.nama})` : ""}`}
                            </p>

                            <p className="text-xs text-[#7A6158]">
                              <i className="fa-regular fa-calendar mr-1.5 text-[#B8925A]"></i>
                              {formatTeksJadwal(p).teks} • {formatTeksJadwal(p).sub}
                            </p>

                            {p.isi_singkat && (
                              <p className="text-xs text-[#3D2B28] font-semibold">
                                <i className="fa-solid fa-cake-candles mr-1.5 text-[#9E3B42]"></i>
                                Isi Pesanan: <strong>{p.isi_singkat}</strong>
                              </p>
                            )}

                            {p.tulisan_kue && (
                              <p className="text-xs text-[#9E3B42] font-bold italic">
                                <i className="fa-solid fa-pen-nib mr-1.5"></i>
                                Ucapan: &ldquo;{p.tulisan_kue}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#F3E8DA]">
                          <div className="lg:text-right">
                            <span className="text-[11px] text-[#7A6158] font-bold block">
                              Total Bayar
                            </span>
                            <span className="font-serif text-xl font-black text-[#3D2B28]">
                              {formatRupiah(p.total_bayar)}
                            </span>
                            {sisa > 0 && p.status_pesanan !== "Dibatalkan" && (
                              <span className="block text-[11px] font-bold text-[#9E3B42]">
                                Sisa Tagihan: {formatRupiah(sisa)}
                              </span>
                            )}
                            {isMounted && p.status_pesanan === "Menunggu Pembayaran" && (
                              <span className="block text-[10px] font-mono font-extrabold text-[#875C1A] mt-0.5">
                                Sisa Waktu: {formatHitungMundur(hitungSisaDetikBayar(p))}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center lg:justify-end gap-1.5">
                            {sisa > 0 && p.status_pesanan !== "Dibatalkan" && (
                              <>
                                <button
                                  type="button"
                                  disabled={sedangBayarKode === p.kode_pesanan}
                                  onClick={() => handleBayarMidtransLangsung(p)}
                                  className="px-3.5 py-1.5 rounded-full bg-[#9E3B42] hover:bg-[#7D2330] text-white text-[11px] font-extrabold transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                >
                                  <i className="fa-solid fa-credit-card"></i>
                                  <span>{p.status_bayar === "DP Dibayar" ? "Bayar Pelunasan" : "Bayar Sekarang"}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={sedangCekBayarKode === p.kode_pesanan}
                                  onClick={() => handleCekStatusMidtrans(p.kode_pesanan)}
                                  className="px-2.5 py-1.5 rounded-full border border-[#D9B37C] bg-[#FAF4ED] hover:bg-[#F1DBD0]/50 text-[#3D2B28] text-[11px] font-bold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                  title="Periksa status pembayaran Midtrans"
                                >
                                  <i className={`fa-solid fa-arrows-rotate ${sedangCekBayarKode === p.kode_pesanan ? "animate-spin text-[#9E3B42]" : ""}`}></i>
                                </button>
                              </>
                            )}

                            {isMounted && p.status_pesanan === "Menunggu Pembayaran" && (Number(p.jumlah_terbayar) || 0) === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPesananBatalTarget(p);
                                  setPesanBatalError("");
                                  setAlasanBatalInput("");
                                }}
                                className="px-3 py-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <i className="fa-solid fa-ban"></i>
                                <span>Batal</span>
                              </button>
                            )}

                            {itemKatalogPertama && p.status_pesanan === "Selesai" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleTambahKeKeranjang(
                                    itemKatalogPertama.id_produk,
                                    itemKatalogPertama.nama_item
                                  )
                                }
                                className="px-3 py-1.5 rounded-full bg-[#FAF0E8] hover:bg-[#F1DBD0] border border-[#D9B37C] text-[#3D2B28] text-[11px] font-extrabold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <i className="fa-solid fa-rotate-right text-[#9E3B42]"></i>
                                <span>Pesan Lagi</span>
                              </button>
                            )}

                            {p.qrDataUrl && (
                              <button
                                type="button"
                                onClick={() => setPesananTiketQr(p)}
                                className="px-3 py-1.5 rounded-full bg-[#3E2721] hover:bg-[#2D1E1B] text-[#FFFDF9] text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <i className="fa-solid fa-qrcode text-[#E5BF88]"></i>
                                <span>QR</span>
                              </button>
                            )}

                            <Link
                              href={`/pesanan-saya/${p.kode_pesanan}`}
                              className="px-3 py-1.5 rounded-full border border-[#EADCC8] bg-white hover:bg-[#FAF4ED] text-[#3D2B28] text-[11px] font-bold transition inline-flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <span>Tiket Penuh</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                setPesananDetailTerbuka(terbuka ? null : p.id)
                              }
                              className="px-3 py-1.5 rounded-full border border-[#EADCC8] bg-[#FAF4ED] hover:bg-[#F1DBD0]/45 text-[11px] font-bold text-[#3D2B28] transition cursor-pointer whitespace-nowrap"
                            >
                              <i
                                className={`fa-solid ${
                                  terbuka ? "fa-chevron-up" : "fa-clock-rotate-left"
                                } mr-1.5 text-[#9E3B42]`}
                              ></i>
                              {terbuka ? "Tutup Detail" : "Rincian & Log"}
                            </button>

                            {((p.pembayaran || []).some((b) => b.status === "Dikonfirmasi" || b.status === "settlement" || b.status === "capture") ||
                              (Number(p.jumlah_terbayar) || 0) > 0) && (
                              <button
                                type="button"
                                onClick={() => setPesananInvoice(p)}
                                className="px-3.5 py-2 rounded-full border border-[#D9B37C] bg-white hover:bg-[#FAF4ED] text-xs font-bold text-[#5A3B33] transition cursor-pointer"
                              >
                                <i className="fa-solid fa-receipt mr-1.5 text-[#B8925A]"></i>
                                Struk
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`px-4 py-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${info.warna}`}>
                        <div className="flex items-center gap-2.5">
                          <i className={info.ikon}></i>
                          <span>
                            <strong>{info.label}</strong> — {info.deskripsi}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider shrink-0 bg-white/75 px-2.5 py-1 rounded-full">
                          {info.aktorRole}
                        </span>
                      </div>

                      {terbuka && (
                        <div className="pt-3 border-t border-[#F3E8DA] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="bg-[#FAF4ED] rounded-2xl p-4 border border-[#EADCC8] space-y-2.5">
                            <p className="font-extrabold text-[#3D2B28] uppercase text-[11px] tracking-wider">
                              Rincian Kue & Komposisi Pesanan
                            </p>

                            {(p.pesanan_item || []).length > 0 && (
                              <div className="divide-y divide-[#EADCC8]">
                                {(p.pesanan_item || []).map((it, idxIt) => (
                                  <div key={it.id || idxIt} className="py-2 flex items-center justify-between gap-2">
                                    <div>
                                      <span className="font-bold text-[#3D2B28] block">
                                        {it.nama_item || (it.produk && it.produk.nama) || "Kue"} ×{it.jumlah || 1}
                                      </span>
                                      <span className="text-[10px] text-[#7A6158] uppercase font-bold">
                                        {it.jenis === "Custom" ? "Kue Custom 3D" : "Kue Katalog"}
                                      </span>
                                    </div>
                                    <span className="font-extrabold text-[#9E3B42]">
                                      {formatRupiah(it.subtotal || (Number(it.harga_satuan || 0) * Number(it.jumlah || 1)))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {(p.pesanan_pilihan || []).length > 0 && (
                              <div className="pt-2 border-t border-[#EADCC8] divide-y divide-[#EADCC8]/70">
                                {(p.pesanan_pilihan || []).map((pil) => (
                                  <div
                                    key={pil.id}
                                    className="py-1.5 flex items-center justify-between"
                                  >
                                    <span className="text-[#5A3B33]">
                                      <strong className="text-[#3D2B28]">{pil.nama_grup}:</strong>{" "}
                                      {pil.nama_item}
                                      {pil.jumlah > 1 ? ` ×${pil.jumlah}` : ""}
                                    </span>
                                    <span className="font-bold text-[#3D2B28]">
                                      {pil.harga === 0
                                        ? "Termasuk"
                                        : formatRupiah((pil.harga || 0) * (pil.jumlah || 1))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {p.metode_pengiriman === "Kirim" && p.alamat && (
                              <div className="pt-2 border-t border-[#EADCC8] text-[11px] text-[#5A3B33]">
                                <strong className="text-[#3D2B28] block">Lokasi Pengantaran:</strong>
                                <span>{p.alamat}</span>
                                {p.lat_tujuan && p.lng_tujuan && (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${p.lat_tujuan},${p.lng_tujuan}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block mt-1 font-extrabold text-[#9E3B42] hover:underline"
                                  >
                                    Lihat Titik di Google Maps &rarr;
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="bg-[#FAF4ED] rounded-2xl p-4 border border-[#EADCC8] space-y-2">
                            <p className="font-extrabold text-[#3D2B28] uppercase text-[11px] tracking-wider">
                              Log Riwayat dari Sistem, Admin & Petugas
                            </p>
                            {(p.riwayat_pesanan || []).length === 0 ? (
                              <p className="text-[#7A6158]">Belum ada catatan perubahan status.</p>
                            ) : (
                              <div className="space-y-2">
                                {(p.riwayat_pesanan || []).map((r) => (
                                  <div
                                    key={r.id}
                                    className="flex items-start gap-2.5 border-l-2 border-[#9E3B42] pl-3 py-0.5"
                                  >
                                    <div>
                                      <p className="font-bold text-[#3D2B28]">
                                        {r.keterangan}
                                      </p>
                                      <p className="text-[11px] text-[#7A6158]">
                                        {formatTanggalWaktu(r.dibuat_pada)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tabAktif === "keranjang" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 ud-card p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EADCC8]">
                  <div>
                    <h2 className="font-serif text-xl font-black text-[#3D2B28]">
                      Daftar Kue di Keranjang Saya ({jumlahKuantitasKeranjang})
                    </h2>
                    <p className="text-xs text-[#7A6158]">
                      Terhubung langsung dengan Meja Kasir (`/keranjang`) dan halaman Checkout (`/checkout`)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/pesan"
                      className="px-3.5 py-2 rounded-full bg-[#FAF4ED] hover:bg-[#F1DBD0]/60 border border-[#D9B37C] text-[#3D2B28] text-xs font-extrabold transition"
                    >
                      + Kue Custom 3D
                    </Link>
                    <Link
                      href="/menu"
                      className="px-3.5 py-2 rounded-full bg-[#3E2721] hover:bg-[#2D1E1B] text-[#FFFDF9] text-xs font-extrabold transition"
                    >
                      + Katalog Menu
                    </Link>
                  </div>
                </div>

                {keranjangItems.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-[#FAF4ED] border border-dashed border-[#EADCC8] space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FCE8EC] text-[#9E3B42] flex items-center justify-center text-2xl">
                      <i className="fa-solid fa-basket-shopping"></i>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#3D2B28]">
                      Keranjang Belanja Anda Kosong
                    </h3>
                    <p className="text-xs text-[#7A6158] max-w-md mx-auto">
                      Pilih kue favorit dari rekomendasi di bawah atau rancang kue ulang tahun sendiri dengan preview 3D interaktif.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {keranjangItems.map((it) => {
                      const gambar = it.foto_preview_url || it.foto_url || null;
                      return (
                        <div
                          key={it.id}
                          className="p-4 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-[#EADCC8] overflow-hidden flex items-center justify-center shrink-0">
                              {gambar ? (
                                <img src={gambar} alt={it.nama || "Kue"} className="w-full h-full object-cover" />
                              ) : (
                                <i className="fa-solid fa-cake-candles text-xl text-[#D3A29D]"></i>
                              )}
                            </div>
                            <div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold mb-1 ${
                                  it.jenis === "Custom"
                                    ? "bg-[#FCE8EC] text-[#9E3B42]"
                                    : "bg-[#E8F4EC] text-[#215934]"
                                }`}
                              >
                                {it.jenis === "Custom" ? "Kue Custom 3D" : "Kue Katalog"}
                              </span>
                              <h4 className="font-serif text-lg font-bold text-[#3D2B28] leading-tight">
                                {it.nama || (it.jenis === "Custom" ? "Kue Custom Desain Sendiri" : "Kue Patisserie")}
                              </h4>
                              {it.tulisan_kue && (
                                <p className="text-xs text-[#7A6158] italic">
                                  Ucapan: &ldquo;{it.tulisan_kue}&rdquo;
                                </p>
                              )}
                              <p className="text-xs font-extrabold text-[#9E3B42] mt-0.5">
                                {formatRupiah(it.harga_satuan || it.subtotal || 0)} × {it.jumlah} ={" "}
                                {formatRupiah(it.subtotal || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2.5">
                            {it.jenis !== "Custom" && (
                              <div className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-[#EADCC8]">
                                <button
                                  type="button"
                                  disabled={sedangUbahKeranjangId === it.id || it.jumlah <= 1}
                                  onClick={() => handleUbahQtyKeranjang(it, Number(it.jumlah) - 1)}
                                  className="w-6 h-6 rounded-full hover:bg-[#FAF4ED] font-black text-[#3D2B28] cursor-pointer disabled:opacity-40"
                                >
                                  -
                                </button>
                                <span className="text-xs font-extrabold min-w-[20px] text-center">
                                  {it.jumlah}
                                </span>
                                <button
                                  type="button"
                                  disabled={sedangUbahKeranjangId === it.id}
                                  onClick={() => handleUbahQtyKeranjang(it, Number(it.jumlah) + 1)}
                                  className="w-6 h-6 rounded-full hover:bg-[#FAF4ED] font-black text-[#3D2B28] cursor-pointer disabled:opacity-40"
                                >
                                  +
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={sedangUbahKeranjangId === it.id}
                              onClick={() => handleHapusItemKeranjang(it.id)}
                              className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center cursor-pointer transition disabled:opacity-40"
                              title="Hapus dari keranjang"
                            >
                              <i className="fa-regular fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 ud-card p-5 sm:p-6 space-y-4">
                <h3 className="font-serif text-xl font-black text-[#3D2B28]">
                  Ringkasan Tagihan Kue
                </h3>
                <div className="space-y-2.5 text-xs divide-y divide-[#F3E8DA]">
                  <div className="flex justify-between pt-1">
                    <span className="text-[#7A6158]">Subtotal Kue Custom</span>
                    <strong className="text-[#3D2B28]">
                      {formatRupiah(ringkasanKeranjang.subtotal_custom || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2.5">
                    <span className="text-[#7A6158]">Subtotal Kue Katalog</span>
                    <strong className="text-[#3D2B28]">
                      {formatRupiah(ringkasanKeranjang.subtotal_katalog || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2.5 text-sm font-extrabold">
                    <span className="text-[#3D2B28]">Total Harga Kue</span>
                    <span className="font-serif text-xl font-black text-[#9E3B42]">
                      {formatRupiah(ringkasanKeranjang.total_kue || 0)}
                    </span>
                  </div>
                  {ringkasanKeranjang.mode_pembayaran === "DP" && (ringkasanKeranjang.total_kue || 0) > 0 && (
                    <div className="pt-2.5 text-[11px] text-[#5A3B33]">
                      Kebijakan toko mendukung pembayaran <strong>DP {ringkasanKeranjang.persen_dp}%</strong> (sekitar{" "}
                      <strong>{formatRupiah(ringkasanKeranjang.jumlah_dp || 0)}</strong> sebelum ongkir).
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-[#7A6158] bg-[#FAF4ED] p-3 rounded-2xl border border-[#EADCC8]">
                  Ongkos kirim jarak dan pemilihan jadwal ambil/antar ditentukan pada langkah <strong>Checkout</strong>.
                </p>

                <div className="space-y-2 pt-1">
                  <Link
                    href={keranjangItems.length > 0 ? "/checkout" : "/menu"}
                    className="w-full py-3 rounded-full bg-[#9E3B42] hover:bg-[#7D2330] text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <i className="fa-solid fa-cash-register"></i>
                    <span>
                      {keranjangItems.length > 0 ? "Lanjut ke Checkout" : "Pilih Menu Kue Dahulu"}
                    </span>
                  </Link>
                  <Link
                    href="/keranjang"
                    className="w-full py-2.5 rounded-full border border-[#D9B37C] bg-white hover:bg-[#FAF4ED] text-[#3D2B28] text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <span>Buka Tampilan Meja Kasir</span>
                  </Link>
                </div>
              </div>
            </div>

            {katalogRekomendasi.length > 0 && (
              <div className="ud-card p-5 sm:p-6 space-y-4">
                <h3 className="font-serif text-xl font-black text-[#3D2B28]">
                  Tambahkan Kue Lainnya dari Katalog Toko
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {katalogRekomendasi.map((item) => {
                    const sedangTambah = sedangTambahProdukId === item.id;
                    const baruDitambah = Boolean(berhasilTambahMap[item.id]);
                    return (
                      <div
                        key={item.id}
                        className="kartu-pita-coquette border border-[#EADCC8] p-4 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="w-full h-32 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] overflow-hidden mb-3 flex items-center justify-center">
                            {item.foto_url && !gambarGagalMap[item.id] ? (
                              <img
                                src={item.foto_url}
                                alt={item.nama}
                                onError={() =>
                                  setGambarGagalMap((prev) => ({
                                    ...prev,
                                    [item.id]: true,
                                  }))
                                }
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <i className="fa-solid fa-cake-candles text-2xl text-[#D3A29D]"></i>
                            )}
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B8925A]">
                            {item.kategori}
                          </span>
                          <h4 className="font-serif text-base font-bold text-[#3D2B28] mt-0.5">
                            {item.nama}
                          </h4>
                          <p className="text-xs font-black text-[#9E3B42] mt-1">
                            {formatRupiah(item.harga)}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={sedangTambah}
                          onClick={() => handleTambahKeKeranjang(item.id, item.nama)}
                          className={`w-full py-2 rounded-full text-xs font-extrabold transition cursor-pointer disabled:opacity-50 ${
                            baruDitambah
                              ? "bg-[#215934] text-white"
                              : "bg-[#9E3B42] hover:bg-[#7D2330] text-white"
                          }`}
                        >
                          {baruDitambah ? "✓ Ditambahkan" : sedangTambah ? "Menambahkan..." : "+ Tambah ke Keranjang"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tabAktif === "riwayat" && (
          <div className="space-y-5">
            <div className="ud-card p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-black text-[#3D2B28]">
                    Daftar Invoice &amp; Struk Resmi Pesanan
                  </h2>
                  <p className="text-xs text-[#7A6158]">
                    Klik Lihat &amp; Cetak Struk untuk mengunduh bukti transaksi yang selaras dengan pembukuan Admin
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {["Semua", "Lunas", "DP", "Belum Bayar", "Selesai"].map((flt) => (
                    <button
                      key={flt}
                      type="button"
                      onClick={() => setFilterRiwayat(flt)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold transition cursor-pointer whitespace-nowrap ${
                        filterRiwayat === flt
                          ? "bg-[#9E3B42] text-white"
                          : "bg-[#FAF4ED] text-[#5A3B33] hover:bg-[#F1DBD0]/55 border border-[#EADCC8]"
                      }`}
                    >
                      {flt}
                    </button>
                  ))}
                </div>
              </div>

              {riwayatPesananTersaring.length === 0 ? (
                <p className="text-xs text-[#7A6158] py-6 text-center">
                  Belum ada riwayat transaksi pada kategori ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAF4ED] text-[#5A3B33] uppercase text-[11px] font-extrabold">
                        <th className="py-2.5 px-3.5 rounded-l-xl whitespace-nowrap">No. Invoice</th>
                        <th className="py-2.5 px-3.5 whitespace-nowrap">Tanggal Pesan</th>
                        <th className="py-2.5 px-3.5 whitespace-nowrap">Total Tagihan</th>
                        <th className="py-2.5 px-3.5 whitespace-nowrap">Terbayar</th>
                        <th className="py-2.5 px-3.5 whitespace-nowrap">Status Bayar</th>
                        <th className="py-2.5 px-3.5 whitespace-nowrap">Status Pesanan</th>
                        <th className="py-2.5 px-3.5 rounded-r-xl text-right whitespace-nowrap">Struk / Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3E8DA]">
                      {riwayatPesananTersaring.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAF6F0]">
                          <td className="py-3 px-3.5 font-extrabold text-[#3D2B28] whitespace-nowrap">
                            INV-{p.kode_pesanan}
                          </td>
                          <td className="py-3 px-3.5 text-[#5A3B33] whitespace-nowrap">
                            {formatTanggalSingkat(p.dibuat_pada)}
                          </td>
                          <td className="py-3 px-3.5 font-bold text-[#3D2B28] whitespace-nowrap">
                            {formatRupiah(p.total_bayar)}
                          </td>
                          <td className="py-3 px-3.5 font-bold text-[#215934] whitespace-nowrap">
                            {formatRupiah(p.jumlah_terbayar || 0)}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${badgeBayarWarna(p.status_bayar)}`}>
                              {p.status_bayar}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${badgeStatusWarna(p.status_pesanan)}`}>
                              {p.status_pesanan}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setPesananInvoice(p)}
                              className="px-3 py-1.5 rounded-full bg-[#3E2721] hover:bg-[#2D1E1B] text-[#FFFDF9] font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <i className="fa-solid fa-print text-[#E5BF88]"></i>
                              <span>Lihat &amp; Cetak Struk</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="ud-card p-5 space-y-3">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-black text-[#3D2B28]">
                  Catatan Pembayaran Masuk
                </h2>
                <p className="text-xs text-[#7A6158]">
                  Seluruh pembayaran Midtrans, Transfer Manual, maupun Pelunasan Tunai di Tempat
                </p>
              </div>

              {semuaPembayaranList.length === 0 ? (
                <p className="text-xs text-[#7A6158] py-5 text-center bg-[#FAF4ED]/60 rounded-xl border border-dashed border-[#EADCC8]">
                  Belum ada catatan pembayaran yang terekam.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAF4ED] text-[#5A3B33] uppercase text-[11px] font-extrabold">
                        <th className="py-3 px-4 rounded-l-xl">Waktu</th>
                        <th className="py-3 px-4">Pesanan</th>
                        <th className="py-3 px-4">Jenis & Metode</th>
                        <th className="py-3 px-4">Nominal</th>
                        <th className="py-3 px-4 rounded-r-xl">Status Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3E8DA]">
                      {semuaPembayaranList.map((b) => (
                        <tr key={b.id} className="hover:bg-[#FAF6F0]">
                          <td className="py-3 px-4 text-[#5A3B33]">
                            {formatTanggalWaktu(b.dibuat_pada)}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-[#3D2B28]">
                            <Link
                              href={`/pesanan-saya/${b.kode_pesanan}`}
                              className="hover:underline text-[#9E3B42]"
                            >
                              {b.kode_pesanan}
                            </Link>
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#3D2B28]">
                            {b.jenis || "Pembayaran"} • {b.metode || "Midtrans"}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-[#3D2B28]">
                            {formatRupiah(b.jumlah)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                b.status === "Dikonfirmasi" || b.status === "settlement" || b.status === "capture"
                                  ? "bg-[#DCF5E4] text-[#1C6E3D]"
                                  : b.status === "Ditolak" || b.status === "deny" || b.status === "cancel"
                                    ? "bg-rose-100 text-rose-800"
                                    : b.status === "expire"
                                      ? "bg-stone-100 text-stone-700"
                                      : "bg-[#FFF3D6] text-[#875C1A]"
                              }`}
                            >
                              {b.status === "settlement" || b.status === "capture"
                                ? "Dikonfirmasi"
                                : b.status === "pending"
                                  ? "Menunggu"
                                  : b.status === "expire"
                                    ? "Kedaluwarsa"
                                    : b.status === "deny" || b.status === "cancel"
                                      ? "Gagal"
                                      : b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tabAktif === "profil" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 space-y-4">
              <div className="ud-card p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full p-1 bg-gradient-to-tr from-[#9E3B42] to-[#C59B62] shadow-md">
                  <AvatarPelangganSvg className="w-full h-full rounded-full" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FCE8EC] text-[#9E3B42] text-[10px] font-extrabold uppercase tracking-wider border border-[#EBC0C8]">
                    Pelanggan Aktif
                  </span>
                  <h3 className="font-serif text-2xl font-black text-[#3D2B28] mt-1.5">
                    {profil.nama || "Pelanggan"}
                  </h3>
                  <p className="text-xs text-[#7A6158]">
                    {profil.email || "-"}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EADCC8] text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#7A6158]">WhatsApp:</span>
                    <strong className="text-[#3D2B28]">{profil.no_wa || "-"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A6158]">Total Pesanan:</span>
                    <strong className="text-[#9E3B42]">{daftarPesananState.length} pesanan</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A6158]">Bergabung:</span>
                    <span className="font-semibold text-[#3D2B28]">
                      {profil.dibuat_pada ? formatTanggal(profil.dibuat_pada) : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ud-card p-3 space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSubTabProfil("datadiri")}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition cursor-pointer ${
                    subTabProfil === "datadiri"
                      ? "bg-[#9E3B42] text-white"
                      : "text-[#5A3B33] hover:bg-[#FAF4ED]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <i className="fa-regular fa-id-card"></i>
                    <span>Data Diri & Pin Alamat Utama</span>
                  </span>
                  <i className="fa-solid fa-chevron-right text-[10px]"></i>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTabProfil("keamanan")}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition cursor-pointer ${
                    subTabProfil === "keamanan"
                      ? "bg-[#9E3B42] text-white"
                      : "text-[#5A3B33] hover:bg-[#FAF4ED]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>Keamanan & Kata Sandi</span>
                  </span>
                  <i className="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
              </div>
            </div>

            <div className="lg:col-span-8">
              {subTabProfil === "datadiri" ? (
                <div className="ud-card p-6 sm:p-7">
                  <div className="pb-4 mb-5 border-b border-[#EADCC8]">
                    <h3 className="font-serif text-xl font-black text-[#3D2B28]">
                      Data Kontak & Pin Lokasi Pengiriman Utama
                    </h3>
                    <p className="text-xs text-[#7A6158] mt-0.5">
                      Otomatis mengisi halaman Checkout dan menghitung perkiraan ongkir dari toko ke rumah Anda.
                    </p>
                  </div>

                  {pesanSuksesProfil && (
                    <div className="mb-5 p-4 rounded-2xl bg-[#DCF5E4] border border-[#B5E5C6] text-[#1C6E3D] text-xs font-bold flex items-center gap-2.5">
                      <i className="fa-solid fa-circle-check text-sm"></i>
                      <span>{pesanSuksesProfil}</span>
                    </div>
                  )}

                  {pesanErrorProfil && (
                    <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5">
                      <i className="fa-solid fa-circle-exclamation text-sm"></i>
                      <span>{pesanErrorProfil}</span>
                    </div>
                  )}

                  <form onSubmit={handleSimpanProfilDanAlamat} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
                          Nama Lengkap Penerima
                        </label>
                        <input
                          type="text"
                          required
                          value={formProfil.nama}
                          onChange={(e) =>
                            setFormProfil({ ...formProfil, nama: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
                          Nomor WhatsApp Aktif
                        </label>
                        <input
                          type="tel"
                          required
                          value={formProfil.no_wa}
                          onChange={(e) =>
                            setFormProfil({ ...formProfil, no_wa: e.target.value })
                          }
                          placeholder="081234567890"
                          className="w-full px-4 py-3 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
                        Email Akun Terdaftar
                      </label>
                      <input
                        type="email"
                        disabled
                        value={profil.email || ""}
                        className="w-full px-4 py-3 rounded-2xl bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="pt-3 border-t border-[#EADCC8] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-bold text-[#5A3B33]">
                            Pin Peta Lokasi Rumah (Klik Peta atau Geser Pin)
                          </label>
                          <p className="text-[11px] text-[#7A6158]">
                            Perkiraan jarak dan tarif ongkir akan langsung dihitung otomatis saat pin dipilih.
                          </p>
                        </div>
                        {infoOngkirProfil.memuat ? (
                          <span className="px-3 py-1 rounded-full bg-[#FAF4ED] border border-[#D9B37C] text-[11px] font-bold text-[#5A3B33]">
                            <i className="fa-solid fa-circle-notch fa-spin mr-1.5 text-[#9E3B42]"></i>
                            Menghitung ongkir...
                          </span>
                        ) : infoOngkirProfil.status === "ok" ? (
                          <span className="px-3 py-1 rounded-full bg-[#DCF5E4] border border-[#B5E5C6] text-[11px] font-extrabold text-[#1C6E3D]">
                            Jarak ~{infoOngkirProfil.jarak_km} km • Ongkir {formatRupiah(infoOngkirProfil.ongkir)}
                          </span>
                        ) : infoOngkirProfil.status === "diluarJangkauan" ? (
                          <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-extrabold text-rose-700">
                            Jarak {infoOngkirProfil.jarak_km} km (Di luar jangkauan kirim)
                          </span>
                        ) : null}
                      </div>

                      <PetaLokasi
                        posisiToko={
                          pengaturanToko && pengaturanToko.lat_toko && pengaturanToko.lng_toko
                            ? { lat: Number(pengaturanToko.lat_toko), lng: Number(pengaturanToko.lng_toko) }
                            : null
                        }
                        posisiTujuan={
                          alamatTersimpan.lat_alamat && alamatTersimpan.lng_alamat
                            ? { lat: Number(alamatTersimpan.lat_alamat), lng: Number(alamatTersimpan.lng_alamat) }
                            : null
                        }
                        onUbahTujuan={(lat, lng) => {
                          setAlamatTersimpan((prev) => ({
                            ...prev,
                            lat_alamat: lat,
                            lng_alamat: lng,
                          }));
                        }}
                      />

                      <div>
                        <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
                          Alamat Pengiriman Lengkap
                        </label>
                        <textarea
                          rows={3}
                          value={alamatTersimpan.alamat_lengkap}
                          onChange={(e) =>
                            setAlamatTersimpan({
                              ...alamatTersimpan,
                              alamat_lengkap: e.target.value,
                            })
                          }
                          placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan..."
                          className="w-full px-4 py-3 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
                          Patokan Kurir / Catatan Rumah
                        </label>
                        <input
                          type="text"
                          value={alamatTersimpan.patokan}
                          onChange={(e) =>
                            setAlamatTersimpan({
                              ...alamatTersimpan,
                              patokan: e.target.value,
                            })
                          }
                          placeholder="Contoh: Pagar krem di seberang taman"
                          className="w-full px-4 py-3 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42]"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={sedangSimpanProfil}
                        className="px-6 py-3 rounded-full bg-[#9E3B42] hover:bg-[#7D2330] text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>
                          {sedangSimpanProfil
                            ? "Menyimpan..."
                            : "Simpan Profil & Lokasi Utama"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="ud-card p-6 sm:p-7">
                  <div className="pb-4 mb-5 border-b border-[#EADCC8]">
                    <h3 className="font-serif text-xl font-black text-[#3D2B28]">
                      Keamanan & Ganti Kata Sandi
                    </h3>
                    <p className="text-xs text-[#7A6158] mt-0.5">
                      Gunakan minimal 8 karakter untuk menjaga keamanan akun pemesanan Anda
                    </p>
                  </div>

                  {pesanSuksesSandi && (
                    <div className="mb-5 p-4 rounded-2xl bg-[#DCF5E4] border border-[#B5E5C6] text-[#1C6E3D] text-xs font-bold flex items-center gap-2.5">
                      <i className="fa-solid fa-circle-check text-sm"></i>
                      <span>{pesanSuksesSandi}</span>
                    </div>
                  )}

                  {pesanErrorSandi && (
                    <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5">
                      <i className="fa-solid fa-circle-exclamation text-sm"></i>
                      <span>{pesanErrorSandi}</span>
                    </div>
                  )}

                  <form onSubmit={handleGantiKataSandi} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
                        Kata Sandi Saat Ini
                      </label>
                      <div className="relative">
                        <input
                          type={lihatSandiLama ? "text" : "password"}
                          required
                          value={formSandi.kataSandiLama}
                          onChange={(e) =>
                            setFormSandi({ ...formSandi, kataSandiLama: e.target.value })
                          }
                          placeholder="Masukkan kata sandi lama..."
                          className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42]"
                        />
                        <button
                          type="button"
                          onClick={() => setLihatSandiLama(!lihatSandiLama)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A6158] hover:text-[#3D2B28] cursor-pointer"
                        >
                          <i className={`fa-regular ${lihatSandiLama ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
                        Kata Sandi Baru (Minimal 8 Karakter)
                      </label>
                      <div className="relative">
                        <input
                          type={lihatSandiBaru ? "text" : "password"}
                          required
                          value={formSandi.kataSandiBaru}
                          onChange={(e) =>
                            setFormSandi({ ...formSandi, kataSandiBaru: e.target.value })
                          }
                          placeholder="Minimal 8 karakter..."
                          className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42]"
                        />
                        <button
                          type="button"
                          onClick={() => setLihatSandiBaru(!lihatSandiBaru)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A6158] hover:text-[#3D2B28] cursor-pointer"
                        >
                          <i className={`fa-regular ${lihatSandiBaru ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5A3B33] mb-1.5">
                        Ulangi Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input
                          type={lihatKonfirmasiSandi ? "text" : "password"}
                          required
                          value={formSandi.konfirmasiSandi}
                          onChange={(e) =>
                            setFormSandi({ ...formSandi, konfirmasiSandi: e.target.value })
                          }
                          placeholder="Ketik ulang kata sandi baru..."
                          className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42]"
                        />
                        <button
                          type="button"
                          onClick={() => setLihatKonfirmasiSandi(!lihatKonfirmasiSandi)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A6158] hover:text-[#3D2B28] cursor-pointer"
                        >
                          <i className={`fa-regular ${lihatKonfirmasiSandi ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={sedangSimpanSandi}
                        className="px-6 py-3 rounded-full bg-[#9E3B42] hover:bg-[#7D2330] text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        <i className="fa-solid fa-key"></i>
                        <span>
                          {sedangSimpanSandi ? "Memperbarui..." : "Perbarui Kata Sandi"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {tabAktif === "bantuan" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="ud-card p-5 space-y-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9E3B42]">
                    Simulasi Interaktif
                  </span>
                  <h2 className="font-serif text-lg sm:text-xl font-black text-[#3D2B28]">
                    Cek Ketersediaan Tanggal Dapur
                  </h2>
                  <p className="text-xs text-[#7A6158]">
                    Memeriksa hari libur dan batas kuota harian yang diatur oleh Admin Toko
                  </p>
                </div>

                <input
                  type="date"
                  value={tanggalCekKuota}
                  min={hariIniIso}
                  onChange={(e) => setTanggalCekKuota(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-bold text-[#3D2B28] outline-none focus:border-[#9E3B42]"
                />

                {hasilCekTanggal && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${hasilCekTanggal.warna}`}>
                    <i className={`${hasilCekTanggal.ikon} text-sm mt-0.5`}></i>
                    <div>
                      <p className="font-extrabold">{hasilCekTanggal.judul}</p>
                      <p className="mt-0.5 leading-relaxed text-[11px]">{hasilCekTanggal.pesan}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="ud-card p-5 space-y-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B8925A]">
                    Kalkulator Tarif Pengaturan Admin
                  </span>
                  <h2 className="font-serif text-lg sm:text-xl font-black text-[#3D2B28]">
                    Simulasi Ongkir Berdasarkan Jarak
                  </h2>
                  <p className="text-xs text-[#7A6158]">
                    Geser jarak untuk melihat tarif ongkir berundak resmi toko
                  </p>
                </div>

                {tarifJarakList.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-[#FAF4ED] border border-[#EADCC8] text-xs text-[#7A6158]">
                    Admin toko belum mengatur tabel tarif jarak pengiriman. Saat ini Anda dapat memilih metode <strong>Ambil di Toko</strong>.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#5A3B33]">
                        Perkiraan Jarak Jalan:
                      </span>
                      <strong className="font-serif text-lg font-black text-[#9E3B42]">
                        {jarakSimulasiKm} km
                      </strong>
                    </div>

                    <input
                      type="range"
                      min="0.5"
                      max={maksKmToko ? Math.max(maksKmToko + 5, 25) : 30}
                      step="0.5"
                      value={jarakSimulasiKm}
                      onChange={(e) => setJarakSimulasiKm(Number(e.target.value))}
                      className="w-full accent-[#9E3B42] cursor-pointer"
                    />

                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        hasilSimulasiOngkir.status === "ok"
                          ? "bg-[#DCF5E4] border-[#B5E5C6] text-[#1C6E3D]"
                          : "bg-rose-50 border-rose-200 text-rose-700"
                      }`}
                    >
                      <span className="font-bold">
                        {hasilSimulasiOngkir.status === "ok"
                          ? "Tarif Ongkos Kirim:"
                          : `Di luar jangkauan kirim${maksKmToko ? ` (maks. ${maksKmToko} km)` : ""}`}
                      </span>
                      {hasilSimulasiOngkir.status === "ok" && (
                        <strong className="text-sm font-black">
                          {formatRupiah(hasilSimulasiOngkir.tarif)}
                        </strong>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7 space-y-5">
                <div className="ud-card p-5">
                  <div className="pb-3 mb-4 border-b border-[#EADCC8]">
                    <h2 className="font-serif text-lg sm:text-xl font-black text-[#3D2B28]">
                      Hubungi Admin Toko via WhatsApp
                    </h2>
                    <p className="text-xs text-[#7A6158] mt-0.5">
                      Format pesan akan terisi otomatis dengan kode pesanan Anda
                    </p>
                  </div>

                  {pesanSuksesTiket && (
                    <div className="mb-4 p-3 rounded-xl bg-[#DCF5E4] border border-[#B5E5C6] text-[#1C6E3D] text-xs font-bold flex items-center gap-2">
                      <i className="fa-solid fa-circle-check text-sm"></i>
                      <span>{pesanSuksesTiket}</span>
                    </div>
                  )}

                  <form onSubmit={handleBuatTiketBantuan} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#5A3B33] mb-1">
                          Pilih Kode Pesanan
                        </label>
                        <select
                          value={formTiket.kode_pesanan}
                          onChange={(e) =>
                            setFormTiket({ ...formTiket, kode_pesanan: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:border-[#9E3B42]"
                        >
                          <option value="Umum (Belum Pesan)">Pertanyaan Umum</option>
                          {daftarPesananState.map((p) => (
                            <option key={p.id} value={p.kode_pesanan}>
                              {p.kode_pesanan} ({p.status_pesanan})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#5A3B33] mb-1">
                          Kategori Bantuan
                        </label>
                        <select
                          value={formTiket.kategori}
                          onChange={(e) =>
                            setFormTiket({ ...formTiket, kategori: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:border-[#9E3B42]"
                        >
                          <option value="Status pembuatan kue">Status pembuatan kue (Petugas)</option>
                          <option value="Pembayaran">Verifikasi Pembayaran (Admin)</option>
                          <option value="Pengiriman atau pengambilan">Pengiriman / Ambil di Toko</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5A3B33] mb-1">
                        Judul / Subjek Pertanyaan
                      </label>
                      <input
                        type="text"
                        required
                        value={formTiket.subjek}
                        onChange={(e) =>
                          setFormTiket({ ...formTiket, subjek: e.target.value })
                        }
                        placeholder="Contoh: Konfirmasi jam ambil pesanan"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5A3B33] mb-1">
                        Detail Pesan
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={formTiket.pesan}
                        onChange={(e) =>
                          setFormTiket({ ...formTiket, pesan: e.target.value })
                        }
                        placeholder="Tuliskan pertanyaan Anda untuk tim Admin toko..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF4ED] border border-[#EADCC8] text-xs font-semibold text-[#3D2B28] outline-none focus:bg-white focus:border-[#9E3B42]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!(tokoPublik && tokoPublik.no_wa) && !(pengaturanToko && pengaturanToko.no_wa)}
                      className="px-6 py-3 rounded-full bg-[#215934] hover:bg-[#194729] text-white text-xs font-extrabold shadow-sm transition cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <i className="fa-brands fa-whatsapp text-sm"></i>
                      <span>Kirim ke WhatsApp Admin Toko</span>
                    </button>
                  </form>
                </div>

                {daftarTiketBantuan.length > 0 && (
                  <div className="ud-card p-6 space-y-3">
                    <h3 className="font-serif text-lg font-black text-[#3D2B28]">
                      Riwayat Pertanyaan Saya
                    </h3>
                    <div className="space-y-2.5">
                      {daftarTiketBantuan.map((t) => (
                        <div
                          key={t.id}
                          className="p-4 rounded-2xl bg-[#FAF4ED] border border-[#EADCC8] space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-[#9E3B42]">
                              {t.id} • {t.kode_pesanan}
                            </span>
                            <span className="text-[11px] text-[#7A6158]">
                              {formatTanggalWaktu(t.dibuat_pada)}
                            </span>
                          </div>
                          <p className="font-extrabold text-[#3D2B28]">{t.subjek}</p>
                          <p className="text-[#5A3B33]">{t.pesan}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 space-y-5">
                <div className="ud-card p-6 space-y-3">
                  <h3 className="font-serif text-xl font-black text-[#3D2B28]">
                    Panduan Alur Sistem (FAQ Interaktif)
                  </h3>
                  <div className="space-y-2">
                    {daftarFaq.map((item, idx) => {
                      const terbuka = faqTerbukaIdx === idx;
                      return (
                        <div
                          key={item.tanya}
                          className="rounded-2xl border border-[#EADCC8] bg-[#FAF4ED] overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setFaqTerbukaIdx(terbuka ? -1 : idx)}
                            className="w-full px-4 py-3 text-left text-xs font-extrabold text-[#3D2B28] flex items-center justify-between gap-2 cursor-pointer hover:bg-[#F5ECE2] transition"
                          >
                            <span>{item.tanya}</span>
                            <i className={`fa-solid fa-chevron-down text-[10px] text-[#9E3B42] transition-transform ${terbuka ? "rotate-180" : ""}`}></i>
                          </button>
                          {terbuka && (
                            <div className="px-4 pb-3.5 text-xs text-[#5A3B33] leading-relaxed border-t border-[#EADCC8]/70 pt-2.5 bg-white">
                              {item.jawab}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="ud-card p-6 space-y-3 text-xs text-[#5A3B33]">
                  <h3 className="font-serif text-lg font-black text-[#3D2B28]">
                    Informasi Gerai Toko
                  </h3>
                  {((tokoPublik && tokoPublik.alamat) || (pengaturanToko && pengaturanToko.alamat)) && (
                    <div className="flex items-start gap-3">
                      <i className="fa-solid fa-location-dot text-[#9E3B42] mt-0.5"></i>
                      <div>
                        <strong className="text-[#3D2B28] block">Lokasi Pengambilan Kue:</strong>
                        <span>{(tokoPublik && tokoPublik.alamat) || pengaturanToko.alamat}</span>
                      </div>
                    </div>
                  )}
                  {((tokoPublik && tokoPublik.no_wa) || (pengaturanToko && pengaturanToko.no_wa)) && (
                    <div className="flex items-start gap-3">
                      <i className="fa-brands fa-whatsapp text-[#215934] mt-0.5"></i>
                      <div>
                        <strong className="text-[#3D2B28] block">WhatsApp Resmi:</strong>
                        <span>{(pengaturanToko && pengaturanToko.no_wa) || tokoPublik.no_wa}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <PortalLedge />

      {pesananTiketQr && isMounted && createPortal(
        <div
          className="fixed inset-0 z-[9998] bg-[#2D1E1B]/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPesananTiketQr(null)}
        >
          <div
            className="bg-[#FFFDF9] rounded-3xl max-w-md w-full p-6 border-2 border-[#C59B62] shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EADCC8] pb-3">
              <div className="text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9E3B42]">
                  Tiket Pengambilan Kue
                </span>
                <h3 className="font-serif text-2xl font-black text-[#3D2B28]">
                  {pesananTiketQr.kode_pesanan}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPesananTiketQr(null)}
                className="w-8 h-8 rounded-full bg-[#FAF4ED] text-[#3D2B28] flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {pesananTiketQr.qrDataUrl && (
              <div className="p-4 bg-[#FAF4ED] rounded-3xl border-2 border-dashed border-[#D9B37C] inline-block mx-auto">
                <img
                  src={pesananTiketQr.qrDataUrl}
                  alt={pesananTiketQr.kode_pesanan}
                  className="w-48 h-48 rounded-2xl mx-auto"
                />
              </div>
            )}

            <div className="text-xs text-[#5A3B33] space-y-1">
              <p className="font-extrabold text-[#3D2B28]">
                {pesananTiketQr.nama_penerima} • {pesananTiketQr.isi_singkat}
              </p>
              <p>{formatTeksJadwal(pesananTiketQr).teks} ({formatTeksJadwal(pesananTiketQr).sub})</p>
              <div className="pt-1 flex items-center justify-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeStatusWarna(pesananTiketQr.status_pesanan)}`}>
                  {pesananTiketQr.status_pesanan}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeBayarWarna(pesananTiketQr.status_bayar)}`}>
                  {pesananTiketQr.status_bayar}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#7A6158] bg-[#FAF4ED] p-3 rounded-2xl border border-[#EADCC8]">
              Tunjukkan kode QR ini kepada <strong>Petugas Kasir / Dapur</strong> saat mengambil kue pesanan Anda di gerai.
            </p>

            <div className="flex items-center justify-center gap-2.5 pt-1">
              <Link
                href={`/pesanan-saya/${pesananTiketQr.kode_pesanan}`}
                className="px-5 py-2.5 rounded-full bg-[#9E3B42] hover:bg-[#7D2330] text-white text-xs font-extrabold transition"
              >
                Buka Halaman Tiket Penuh
              </Link>
              <button
                type="button"
                onClick={() => setPesananTiketQr(null)}
                className="px-4 py-2.5 rounded-full border border-[#EADCC8] text-xs font-bold text-[#3D2B28] hover:bg-[#FAF4ED] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {pesananInvoice && isMounted && createPortal(
        <div
          className="fixed inset-0 z-[9998] bg-[#2D1E1B]/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPesananInvoice(null)}
        >
          <div
            className="bg-[#FFFDF9] rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-[#EADCC8] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#EADCC8] pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1C6E3D] bg-[#DCF5E4] px-2.5 py-0.5 rounded-full">
                  Struk / Invoice Resmi
                </span>
                <h3 className="font-serif text-2xl font-black text-[#3D2B28] mt-1">
                  {namaToko}
                </h3>
                <p className="text-xs text-[#7A6158]">
                  {(pengaturanToko && pengaturanToko.alamat) || ""} • WA: {(pengaturanToko && pengaturanToko.no_wa) || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPesananInvoice(null)}
                className="w-8 h-8 rounded-full bg-[#FAF4ED] text-[#3D2B28] flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF4ED] p-4 rounded-2xl border border-[#EADCC8]">
              <div>
                <span className="text-[#7A6158] block">No. Pesanan:</span>
                <strong className="text-[#3D2B28] text-sm">
                  {pesananInvoice.kode_pesanan}
                </strong>
              </div>
              <div>
                <span className="text-[#7A6158] block">Tanggal Pesan:</span>
                <strong className="text-[#3D2B28]">
                  {formatTanggalSingkat(pesananInvoice.dibuat_pada)}
                </strong>
              </div>
              <div>
                <span className="text-[#7A6158] block">Penerima:</span>
                <strong className="text-[#3D2B28]">
                  {pesananInvoice.nama_penerima} ({pesananInvoice.no_wa})
                </strong>
              </div>
              <div>
                <span className="text-[#7A6158] block">Jadwal:</span>
                <strong className="text-[#3D2B28]">
                  {formatTeksJadwal(pesananInvoice).teks}
                </strong>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-extrabold text-[#3D2B28] uppercase text-[11px] tracking-wider">
                Rincian Item Pesanan
              </p>
              <div className="divide-y divide-[#F3E8DA]">
                {(pesananInvoice.pesanan_item || []).map((it, idxIt) => (
                  <div key={it.id || idxIt} className="py-2 flex justify-between">
                    <span>
                      <strong>{it.nama_item || (it.produk && it.produk.nama) || "Kue"}</strong> ×{it.jumlah || 1}
                    </span>
                    <span className="font-bold">
                      {formatRupiah(it.subtotal || (Number(it.harga_satuan || 0) * Number(it.jumlah || 1)))}
                    </span>
                  </div>
                ))}
                {(pesananInvoice.pesanan_pilihan || []).map((pil) => (
                  <div key={pil.id} className="py-1.5 flex justify-between text-[#5A3B33]">
                    <span>
                      {pil.nama_grup}: {pil.nama_item}
                      {pil.jumlah > 1 ? ` ×${pil.jumlah}` : ""}
                    </span>
                    <span className="font-semibold">
                      {pil.harga === 0
                        ? "Termasuk"
                        : formatRupiah((pil.harga || 0) * (pil.jumlah || 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#EADCC8] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#5A3B33]">
                <span>Subtotal Kue</span>
                <span>{formatRupiah(pesananInvoice.total_kue)}</span>
              </div>
              <div className="flex justify-between text-[#5A3B33]">
                <span>
                  Ongkos Kirim ({pesananInvoice.metode_pengiriman}
                  {pesananInvoice.jarak_km ? ` • ${pesananInvoice.jarak_km} km` : ""})
                </span>
                <span>{formatRupiah(pesananInvoice.ongkir || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#3D2B28] pt-1.5 border-t border-[#F3E8DA]">
                <span>Total Tagihan</span>
                <span className="text-[#9E3B42]">{formatRupiah(pesananInvoice.total_bayar)}</span>
              </div>
              <div className="flex justify-between text-[#1C6E3D] font-bold">
                <span>Total Terbayar</span>
                <span>{formatRupiah(pesananInvoice.jumlah_terbayar || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#875C1A]">
                <span>Sisa Pelunasan</span>
                <span>
                  {formatRupiah(
                    Math.max(
                      0,
                      (Number(pesananInvoice.total_bayar) || 0) -
                        (Number(pesananInvoice.jumlah_terbayar) || 0)
                    )
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EADCC8]">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-full bg-[#3E2721] hover:bg-[#2D1E1B] text-[#FFFDF9] text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-print text-[#E5BF88]"></i>
                <span>Cetak / Simpan PDF</span>
              </button>
              <Link
                href={`/pesanan-saya/${pesananInvoice.kode_pesanan}`}
                className="px-4 py-2.5 rounded-full border border-[#D9B37C] text-[#3D2B28] hover:bg-[#FAF4ED] text-xs font-bold"
              >
                Halaman Tiket
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}

      {pesananBatalTarget && isMounted && createPortal(
        <div className="fixed inset-0 z-[9998] bg-[#2D1E1B]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-[#EADCC8]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADCC8]">
              <h3 className="font-serif text-lg font-black text-[#3D2B28]">
                Konfirmasi Batalkan Pesanan
              </h3>
              <button
                type="button"
                onClick={() => setPesananBatalTarget(null)}
                className="text-[#7A6158] hover:text-[#3D2B28] text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p className="text-xs text-[#5A3B33] leading-relaxed">
              Apakah Anda yakin ingin membatalkan pesanan <strong>{pesananBatalTarget.kode_pesanan}</strong>? Kuota jadwal dapur akan dikembalikan ke sistem.
            </p>
            {pesanBatalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {pesanBatalError}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-[#5A3B33] mb-1">
                Alasan pembatalan (opsional):
              </label>
              <textarea
                rows={2}
                value={alasanBatalInput}
                onChange={(e) => setAlasanBatalInput(e.target.value)}
                placeholder="Contoh: Ingin mengubah jadwal pengambilan"
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF4ED] border border-[#EADCC8] rounded-2xl outline-none focus:border-[#9E3B42]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EADCC8]">
              <button
                type="button"
                disabled={sedangBatal}
                onClick={() => setPesananBatalTarget(null)}
                className="px-4 py-2 rounded-full border border-[#EADCC8] text-xs font-bold text-[#5A3B33] hover:bg-[#FAF4ED] cursor-pointer disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={sedangBatal}
                onClick={handleKonfirmasiBatal}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <i className={`fa-solid ${sedangBatal ? "fa-circle-notch fa-spin" : "fa-ban"} text-xs`}></i>
                <span>{sedangBatal ? "Membatalkan..." : "Ya, Batalkan"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {modalKeluarBuka && isMounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#2D1E1B]/70 backdrop-blur-xs"
            onClick={() => !sedangKeluar && setModalKeluarBuka(false)}
          />
          <div className="relative bg-[#FFFDF9] border-2 border-[#EADCC8] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#FCE8EC] border border-[#EBC0C8] text-[#9E3B42] flex items-center justify-center text-2xl">
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </div>
            <div>
              <h3 className="font-serif text-2xl font-black text-[#3D2B28]">
                Konfirmasi Keluar Akun
              </h3>
              <p className="text-xs text-[#7A6158] mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin keluar dari akun <strong className="text-[#3D2B28]">Pelanggan</strong>? Anda dapat masuk kembali kapan saja untuk memantau status pesanan kue Anda.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={sedangKeluar}
                onClick={() => setModalKeluarBuka(false)}
                className="px-5 py-2.5 rounded-full border border-[#D9B37C] text-[#3D2B28] bg-white hover:bg-[#FAF4ED] text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangKeluar}
                onClick={handleKeluar}
                className="px-5 py-2.5 rounded-full bg-[#9E3B42] hover:bg-[#7D2330] text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <i className={`fa-solid ${sedangKeluar ? "fa-spinner fa-spin" : "fa-arrow-right-from-bracket"}`}></i>
                <span>{sedangKeluar ? "Sedang Keluar..." : "Ya, Keluar"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ModalPesan
        terbuka={modalInfo.terbuka}
        judul={modalInfo.judul}
        pesan={modalInfo.pesan}
        tipe={modalInfo.tipe}
        padaTutup={() => setModalInfo({ ...modalInfo, terbuka: false })}
      />
    </div>
  );
}
