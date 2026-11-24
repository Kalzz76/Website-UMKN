"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { usePatisserieCart } from "@/lib/patisserieCart";
import PreviewKue from "@/components/PreviewKue";

const PetaLokasi = dynamic(() => import("@/components/PetaLokasi"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-2xl bg-[#f3f7f3] border border-[#dce6de] flex items-center justify-center text-xs text-[#6b8274]">
      Memuat peta lokasi...
    </div>
  ),
});
import {
  formatRupiah,
  formatTanggal,
  formatTanggalIndonesia,
  formatTanggalSingkat,
  formatTanggalWaktu,
} from "@/lib/format";

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

function formatTeksJadwal(p) {
  if (p.metode_pengiriman === "Kirim") {
    const tglPasti = p.tanggal_pasti_kirim;
    const estAwal = p.estimasi_kirim_awal || p.tanggal_ambil;
    const estAkhir = p.estimasi_kirim_akhir;
    if (tglPasti) {
      return { teks: `Estimasi tiba ${formatTanggalIndonesia(tglPasti)}`, sub: "Pengiriman Kurir" };
    }
    if (estAwal && estAkhir && estAwal !== estAkhir) {
      return { teks: `Estimasi tiba ${formatRentangTanggal(estAwal, estAkhir)}`, sub: "Pengiriman Kurir" };
    }
    if (estAwal) {
      return { teks: `Estimasi tiba ${formatTanggalIndonesia(estAwal)}`, sub: "Pengiriman Kurir" };
    }
    return { teks: "Pengiriman Kurir", sub: "" };
  }
  return {
    teks: formatTanggalIndonesia(p.tanggal_ambil),
    sub: p.jam_ambil ? `Pukul ${p.jam_ambil.slice(0, 5)} WIB` : "Jam operasional",
  };
}

export default function DashboardPelangganView({
  profilAwal,
  pesananList = [],
  pengaturanToko,
  tokoPublik = null,
  zonaOngkirList = [],
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  const { totalQty: totalKeranjangQty, totalPrice: totalKeranjangHarga } =
    usePatisserieCart();

  const daftarTabValid = ["beranda", "pesanan", "riwayat", "profil", "bantuan"];
  const tabAwal = tabQuery && daftarTabValid.includes(tabQuery) ? tabQuery : "beranda";
  const [tabAktif, setTabAktif] = useState(tabAwal);
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);
  const [profil, setProfil] = useState(profilAwal || {});

  const [filterStatusPesanan, setFilterStatusPesanan] = useState("Semua");
  const [kataCariPesanan, setKataCariPesanan] = useState("");
  const [pesananDetailTerbuka, setPesananDetailTerbuka] = useState(null);

  const [filterRiwayat, setFilterRiwayat] = useState("Semua");
  const [pesananInvoice, setPesananInvoice] = useState(null);
  const [pesananBatalTarget, setPesananBatalTarget] = useState(null);
  const [alasanBatalInput, setAlasanBatalInput] = useState("");
  const [sedangBatal, setSedangBatal] = useState(false);
  const [pesanBatalError, setPesanBatalError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      setPesananBatalTarget(null);
      window.location.reload();
    } catch {
      setSedangBatal(false);
      setPesanBatalError("Terjadi kesalahan jaringan.");
    }
  }

  const [subTabProfil, setSubTabProfil] = useState("datadiri");
  const [formProfil, setFormProfil] = useState({
    nama: profilAwal?.nama || "",
    no_wa: profilAwal?.no_wa || "",
  });
  const [alamatTersimpan, setAlamatTersimpan] = useState({
    alamat_lengkap: profilAwal?.alamat || "",
    patokan: profilAwal?.patokan || "",
    lat_alamat: profilAwal?.lat_alamat || null,
    lng_alamat: profilAwal?.lng_alamat || null,
  });
  const [jumlahKeranjangApi, setJumlahKeranjangApi] = useState(totalKeranjangQty || 0);

  useEffect(() => {
    fetch("/api/keranjang/jumlah")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.jumlah === "number") {
          setJumlahKeranjangApi(data.jumlah);
        }
      })
      .catch(() => {});
  }, [totalKeranjangQty]);
  const [sedangSimpanProfil, setSedangSimpanProfil] = useState(false);
  const [pesanSuksesProfil, setPesanSuksesProfil] = useState("");
  const [pesanErrorProfil, setPesanErrorProfil] = useState("");

  const [formSandi, setFormSandi] = useState({
    kataSandiLama: "",
    kataSandiBaru: "",
    konfirmasiSandi: "",
  });
  const [sedangSimpanSandi, setSedangSimpanSandi] = useState(false);
  const [pesanSuksesSandi, setPesanSuksesSandi] = useState("");
  const [pesanErrorSandi, setPesanErrorSandi] = useState("");

  const [formTiket, setFormTiket] = useState({
    kode_pesanan: pesananList[0]?.kode_pesanan || "",
    tujuan_role: "Status pembuatan kue",
    kategori: "Status pembuatan kue",
    subjek: "",
    pesan: "",
  });
  const [daftarTiketBantuan, setDaftarTiketBantuan] = useState([]);
  const [pesanSuksesTiket, setPesanSuksesTiket] = useState("");
  const [sedangKeluar, setSedangKeluar] = useState(false);

  useEffect(() => {
    const daftarTabValid = ["beranda", "pesanan", "riwayat", "profil", "bantuan"];
    if (tabQuery && daftarTabValid.includes(tabQuery)) {
      setTabAktif(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    const userId = profilAwal?.id || "guest";
    try {
      if (profilAwal?.alamat || profilAwal?.lat_alamat) {
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
          const pesananKirimTerakhir = pesananList.find(
            (p) => p.metode_pengiriman === "Kirim" && p.alamat
          );
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
    } catch (e) {}
  }, [profilAwal, pesananList]);

  function gantiTab(kodeTab) {
    setTabAktif(kodeTab);
    setSidebarTerbuka(false);
    try {
      window.history.replaceState(null, "", `/user?tab=${kodeTab}`);
    } catch (e) {}
  }

  async function handleKeluar() {
    setSedangKeluar(true);
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/masuk");
    router.refresh();
  }

  const pesananAktifList = [];
  const pesananMenungguBayarList = [];
  const pesananSelesaiList = [];
  let totalBelanjaTerkonfirmasi = 0;
  let totalSisaTagihan = 0;
  let jumlahBuktiMenungguAdmin = 0;
  const semuaPembayaranList = [];

  for (let i = 0; i < pesananList.length; i++) {
    const p = pesananList[i];
    if (["Diterima", "Sedang Dibuat", "Siap", "Dikirim"].includes(p.status_pesanan)) {
      pesananAktifList.push(p);
    }
    if (p.status_pesanan === "Menunggu Pembayaran") {
      pesananMenungguBayarList.push(p);
    }
    if (p.status_pesanan === "Selesai") {
      pesananSelesaiList.push(p);
    }
    if (p.status_pesanan !== "Dibatalkan") {
      const sisa = Math.max(0, (Number(p.total_bayar) || 0) - (Number(p.jumlah_terbayar) || 0));
      totalSisaTagihan += sisa;
    }

    const bayarArr = p.pembayaran || [];
    for (let j = 0; j < bayarArr.length; j++) {
      const b = bayarArr[j];
      if (b.status === "Dikonfirmasi") {
        totalBelanjaTerkonfirmasi += Number(b.jumlah) || 0;
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

  const pesananUtamaDilacak =
    pesananAktifList[0] || pesananMenungguBayarList[0] || pesananList[0] || null;

  const pembayaranTerakhir = semuaPembayaranList[0] || null;

  function infoPenanggungJawab(pesanan) {
    const adaMenunggu = (pesanan.pembayaran || []).some(
      (b) => b.status === "Menunggu Konfirmasi"
    );
    const batasJam = Number(pengaturanToko?.batas_bayar_jam || 24);
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
        label: "Batal: pesanan telah dibatalkan",
        menunggu: "Selesai",
        ikon: "fa-solid fa-ban",
        warna: "bg-rose-50 text-rose-700 border-rose-200",
        deskripsi: pesanan.alasan_batal || "Pesanan telah dibatalkan oleh toko.",
      };
    }
    if (pesanan.status_pesanan === "Menunggu Pembayaran") {
      if (adaMenunggu) {
        return {
          label: "Toko: memeriksa bukti pembayaran Anda",
          menunggu: "Menunggu: Toko",
          ikon: "fa-solid fa-user-check",
          warna: "bg-amber-50 text-amber-800 border-amber-200",
          deskripsi: "Bukti bayar sedang diperiksa oleh toko.",
        };
      }
      return {
        label: "Pelanggan: selesaikan pembayaran",
        menunggu: "Menunggu: Anda",
        ikon: "fa-solid fa-wallet",
        warna: "bg-amber-50 text-amber-800 border-amber-200",
        deskripsi: `Bayar ${formatRupiah(bayarSekarang)} sebelum ${batasBayarTeks} agar pesanan diteruskan ke toko.`,
      };
    }
    if (pesanan.status_pesanan === "Diterima") {
      return {
        label: "Toko: pesanan dalam antrean produksi dapur",
        menunggu: "Menunggu: Toko",
        ikon: "fa-solid fa-clipboard-check",
        warna: "bg-sky-50 text-sky-800 border-sky-200",
        deskripsi: "Pembayaran telah terkonfirmasi dan pesanan masuk jadwal produksi dapur.",
      };
    }
    if (pesanan.status_pesanan === "Sedang Dibuat") {
      return {
        label: "Petugas: sedang memproses dan mendekorasi kue",
        menunggu: "Menunggu: Toko",
        ikon: "fa-solid fa-fire-burner",
        warna: "bg-blue-50 text-blue-800 border-blue-200",
        deskripsi: "Kue pesanan Anda sedang diproses dan didekorasi di dapur.",
      };
    }
    if (pesanan.status_pesanan === "Siap") {
      return {
        label: "Toko: kue siap diambil atau diantar",
        menunggu: pesanan.metode_pengiriman === "Ambil" ? "Menunggu: Anda" : "Menunggu: Toko",
        ikon: "fa-solid fa-box-open",
        warna: "bg-emerald-50 text-emerald-800 border-emerald-200",
        deskripsi:
          pesanan.metode_pengiriman === "Ambil"
            ? "Kue sudah siap diambil di toko dengan menunjukkan Tiket QR ke kasir."
            : "Kue sudah siap dan menunggu jadwal pengantaran kurir.",
      };
    }
    if (pesanan.status_pesanan === "Dikirim") {
      return {
        label: "Kurir: dalam perjalanan pengantaran",
        menunggu: "Menunggu: Toko",
        ikon: "fa-solid fa-truck-fast",
        warna: "bg-indigo-50 text-indigo-800 border-indigo-200",
        deskripsi: "Kurir sedang dalam perjalanan menuju alamat pengiriman Anda.",
      };
    }
    return {
      label: "Selesai: pesanan telah diterima",
      menunggu: "Selesai",
      ikon: "fa-solid fa-circle-check",
      warna: "bg-emerald-50 text-emerald-800 border-emerald-200",
      deskripsi: "Pesanan telah selesai diterima dengan baik.",
    };
  }

  function badgeStatusWarna(status) {
    if (status === "Menunggu Pembayaran") {
      return "bg-amber-100/90 text-amber-800 border border-amber-200";
    }
    if (status === "Diterima" || status === "Sedang Dibuat") {
      return "bg-sky-100/90 text-sky-800 border border-sky-200";
    }
    if (status === "Siap" || status === "Dikirim") {
      return "bg-indigo-100/90 text-indigo-800 border border-indigo-200";
    }
    if (status === "Selesai") {
      return "bg-emerald-100/90 text-emerald-800 border border-emerald-200";
    }
    if (status === "Dibatalkan") {
      return "bg-rose-100/90 text-rose-800 border border-rose-200";
    }
    return "bg-stone-100 text-stone-700 border border-stone-200";
  }

  function badgeBayarWarna(status) {
    if (status === "Lunas") {
      return "bg-emerald-100/90 text-emerald-800 border border-emerald-200";
    }
    if (status === "DP Dibayar") {
      return "bg-amber-100/90 text-amber-800 border border-amber-200";
    }
    return "bg-rose-100/90 text-rose-800 border border-rose-200";
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
    const isKatalog =
      pesanan?.pesanan_item?.length > 0 &&
      !pesanan?.tulisan_kue &&
      (!pesanan?.pesanan_pilihan || pesanan?.pesanan_pilihan.length === 0);
    return [
      {
        judul: "Menunggu Bayar",
        aktor: "Pelanggan",
        ikon: "fa-solid fa-credit-card",
      },
      {
        judul: "Pembayaran Diterima",
        aktor: "Sistem Toko",
        ikon: "fa-solid fa-clipboard-check",
      },
      {
        judul: isKatalog ? "Disiapkan Petugas" : "Diproses Petugas",
        aktor: "Petugas Dapur",
        ikon: "fa-solid fa-fire-burner",
      },
      {
        judul: "Kue Siap / Dikirim",
        aktor: "Petugas & Toko",
        ikon: "fa-solid fa-box-open",
      },
      {
        judul: "Pesanan Selesai",
        aktor: "Selesai",
        ikon: "fa-solid fa-circle-check",
      },
    ];
  }

  const pesananTersaring = pesananList.filter((p) => {
    if (filterStatusPesanan === "Aktif") {
      if (!["Diterima", "Sedang Dibuat", "Siap", "Dikirim"].includes(p.status_pesanan)) return false;
    } else if (filterStatusPesanan === "Pending") {
      if (p.status_pesanan !== "Menunggu Pembayaran") return false;
    } else if (filterStatusPesanan === "Diproses Petugas") {
      if (!["Diterima", "Sedang Dibuat"].includes(p.status_pesanan)) return false;
    } else if (filterStatusPesanan === "Siap & Dikirim") {
      if (!["Siap", "Dikirim"].includes(p.status_pesanan)) return false;
    } else if (filterStatusPesanan === "Selesai") {
      if (p.status_pesanan !== "Selesai") return false;
    } else if (filterStatusPesanan === "Dibatalkan") {
      if (p.status_pesanan !== "Dibatalkan") return false;
    }

    if (kataCariPesanan.trim()) {
      const q = kataCariPesanan.trim().toLowerCase();
      const cocokKode = (p.kode_pesanan || "").toLowerCase().includes(q);
      const cocokNama = (p.nama_penerima || "").toLowerCase().includes(q);
      const cocokTulisan = (p.tulisan_kue || "").toLowerCase().includes(q);
      const cocokItem =
        (p.isi_singkat || "").toLowerCase().includes(q) ||
        (p.pesanan_item || []).some((it) =>
          (it.produk?.nama || it.nama_item || "").toLowerCase().includes(q)
        );
      if (!cocokKode && !cocokNama && !cocokTulisan && !cocokItem) return false;
    }
    return true;
  });

  const riwayatPesananTersaring = pesananList.filter((p) => {
    if (filterRiwayat === "Selesai") return p.status_pesanan === "Selesai";
    if (filterRiwayat === "Lunas") return p.status_bayar === "Lunas";
    if (filterRiwayat === "DP") return p.status_bayar === "DP Dibayar";
    if (filterRiwayat === "Belum Bayar") return p.status_bayar === "Belum Bayar";
    return true;
  });

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
        const userId = profilAwal?.id || "guest";
        try {
          localStorage.setItem(
            `cravely_alamat_user_${userId}`,
            JSON.stringify(alamatTersimpan)
          );
        } catch (err) {}
        setPesanSuksesProfil(
          data.lokasiTersimpan === false
            ? data.pesan || "Profil diperbarui, namun lokasi pengiriman belum dapat disimpan di server."
            : "Profil dan lokasi pengiriman utama berhasil disimpan."
        );
      }
    } catch (err) {
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
    } catch (err) {
      setPesanErrorSandi("Terjadi kesalahan jaringan.");
    } finally {
      setSedangSimpanSandi(false);
    }
  }

  function handleBuatTiketBantuan(e) {
    e.preventDefault();
    setPesanSuksesTiket("");
    if (!formTiket.subjek.trim() || !formTiket.pesan.trim()) {
      return;
    }

    const nomorTiket = `TKT-${String(Date.now()).slice(-4)}`;
    const tiketBaru = {
      id: nomorTiket,
      kode_pesanan: formTiket.kode_pesanan || "-",
      tujuan_role: formTiket.tujuan_role || "Toko",
      kategori: formTiket.kategori || "Status pembuatan kue",
      subjek: formTiket.subjek.trim(),
      pesan: formTiket.pesan.trim(),
      status: "Menunggu Respons Toko",
      dibuat_pada: new Date().toISOString(),
    };

    const daftarBaru = [tiketBaru, ...daftarTiketBantuan];
    setDaftarTiketBantuan(daftarBaru);

    const userId = profilAwal?.id || "guest";
    try {
      localStorage.setItem(`cravely_tiket_bantuan_${userId}`, JSON.stringify(daftarBaru));
    } catch (err) {}

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
      `Pesan bantuan telah disiapkan. WhatsApp terbuka otomatis untuk melanjutkan percakapan dengan toko.`
    );
  }

  function buatLinkWaTiket(tiket) {
    const nomormentah = pengaturanToko?.no_wa || "";
    let nomor = nomormentah.replace(/[^0-9]/g, "");
    if (nomor.startsWith("0")) {
      nomor = "62" + nomor.slice(1);
    }
    if (!nomor) return null;
    const teks = `Halo ${pengaturanToko?.nama_toko || "Cravely Bakery"},\n\nSaya *${profil?.nama || "Pelanggan"}* ingin menanyakan bantuan:\n- Kode Pesanan: *${tiket.kode_pesanan}*\n- Kategori: *${tiket.kategori}*\n- Subjek: *${tiket.subjek}*\n\nPesan:\n${tiket.pesan}`;
    return `https://wa.me/${nomor}?text=${encodeURIComponent(teks)}`;
  }

  const menuSidebar = [
    {
      id: "beranda",
      label: "Beranda (Overview)",
      ikon: "fa-solid fa-border-all",
      badge: null,
    },
    {
      id: "pesanan",
      label: "Pesanan Saya",
      ikon: "fa-solid fa-cake-candles",
      badge: pesananAktifList.length > 0 ? String(pesananAktifList.length) : null,
    },
    {
      id: "riwayat",
      label: "Riwayat Transaksi",
      ikon: "fa-solid fa-file-invoice-dollar",
      badge: jumlahBuktiMenungguAdmin > 0 ? String(jumlahBuktiMenungguAdmin) : null,
    },
    {
      id: "profil",
      label: "Pengaturan Profil",
      ikon: "fa-solid fa-user-gear",
      badge: null,
    },
    {
      id: "bantuan",
      label: "Pusat Bantuan",
      ikon: "fa-solid fa-headset",
      badge: null,
    },
  ];

  const inisialUser = (profil?.nama || "P").slice(0, 2).toUpperCase();
  const namaToko = pengaturanToko?.nama_toko || "Cravely Bakery";
  const isStafAtauAdmin = profil?.role === "admin" || profil?.role === "staf";

  return (
    <div className="min-h-screen bg-[#eff4ee] text-[#182b23] flex flex-col lg:flex-row">
      {sidebarTerbuka && (
        <div
          className="fixed inset-0 bg-[#17382d]/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarTerbuka(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[#f8faf7] border-r border-[#dce6de] p-5 flex flex-col justify-between transition-transform duration-300 ease-out shadow-[8px_0_30px_rgba(23,56,45,0.04)] ${
          sidebarTerbuka ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-6 overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-[#17382d] text-white flex items-center justify-center text-lg shadow-[0_6px_16px_rgba(23,56,45,0.18)] group-hover:scale-105 transition">
                <i className="fa-solid fa-cake-candles"></i>
              </div>
              <div>
                <h2 className="font-extrabold text-base text-[#17382d] leading-tight">
                  {namaToko}
                </h2>
                <span className="text-[11px] font-semibold text-[#6b8274] block">
                  Dashboard Pelanggan
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarTerbuka(false)}
              className="lg:hidden w-8 h-8 rounded-xl bg-white border border-[#dce6de] text-[#17382d] flex items-center justify-center"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div className="rounded-3xl bg-white p-4 border border-[#dce6de] shadow-[0_6px_20px_rgba(23,56,45,0.04)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#eaf2ec] text-[#17382d] font-black text-sm flex items-center justify-center border border-[#cfe0d4] shadow-inner">
                {inisialUser}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#182b23] truncate">
                  {profil?.nama || "Pelanggan"}
                </p>
                <p className="text-[11px] text-[#6b8274] truncate">
                  {profil?.email || profil?.no_wa || "Akun Pelanggan"}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#eef3ee] flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#26804a] bg-[#dcf5e4] px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#26804a]"></span>
                Pelanggan Aktif
              </span>
              <span className="text-[#6b8274] font-semibold">
                {pesananList.length} Pesanan
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#788d80]">
              Menu Utama
            </p>
            <nav className="space-y-1.5">
              {menuSidebar.map((item) => {
                const aktif = tabAktif === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => gantiTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      aktif
                        ? "bg-[#17382d] text-white shadow-[0_8px_18px_rgba(23,56,45,0.18)]"
                        : "text-[#3a5246] hover:bg-white hover:shadow-xs"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <i
                        className={`${item.ikon} w-4 text-center ${
                          aktif ? "text-[#b8e0c9]" : "text-[#5f7a6c]"
                        }`}
                      ></i>
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          aktif
                            ? "bg-white/20 text-white"
                            : "bg-[#dcf5e4] text-[#26804a]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

        </div>

        <div className="pt-4 border-t border-[#dce6de] space-y-1">
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold text-[#3a5246] hover:bg-white transition"
          >
            <i className="fa-solid fa-house w-4 text-center text-[#5f7a6c]"></i>
            <span>Beranda Utama</span>
          </Link>
          <button
            type="button"
            disabled={sedangKeluar}
            onClick={handleKeluar}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
          >
            <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i>
            <span>{sedangKeluar ? "Keluar..." : "Keluar Akun"}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-[#eff4ee]/90 backdrop-blur-md border-b border-[#dce6de] px-4 sm:px-8 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarTerbuka(true)}
                className="lg:hidden w-10 h-10 rounded-2xl bg-white border border-[#dce6de] text-[#17382d] flex items-center justify-center shadow-xs"
              >
                <i className="fa-solid fa-bars"></i>
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-[#182b23]">
                  {tabAktif === "beranda" && "Ringkasan Aktivitas Saya"}
                  {tabAktif === "pesanan" && "Pelacakan Pesanan Saya"}
                  {tabAktif === "riwayat" && "Riwayat Transaksi & Struk"}
                  {tabAktif === "profil" && "Pengaturan Profil & Alamat"}
                  {tabAktif === "bantuan" && "Pusat Bantuan & Tiket"}
                </h1>
                <p className="text-xs text-[#6b8274] hidden sm:block">
                  {tabAktif === "beranda" &&
                    "Pantau status pembayaran, pembuatan, dan pengiriman pesanan Anda."}
                  {tabAktif === "pesanan" &&
                    "Lacak tahapan status pesanan kue dari pembayaran hingga siap diambil/dikirim."}
                  {tabAktif === "riwayat" &&
                    "Daftar pembayaran yang telah terkonfirmasi beserta unduhan struk/invoice."}
                  {tabAktif === "profil" &&
                    "Kelola data kontak, alamat pengiriman, serta keamanan akun Anda."}
                  {tabAktif === "bantuan" &&
                    "Ajukan pertanyaan atau kendala pesanan kepada tim toko."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/keranjang"
                className="px-3.5 py-2.5 rounded-2xl bg-white border border-[#dce6de] hover:bg-[#f6f9f6] text-[#17382d] text-xs font-bold inline-flex items-center gap-2 shadow-xs transition"
                title="Buka Keranjang Belanja"
              >
                <i className="fa-solid fa-bag-shopping"></i>
                <span className="hidden md:inline">Keranjang</span>
                {jumlahKeranjangApi > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#9E3B42] text-white text-[10px] font-extrabold leading-none">
                    {jumlahKeranjangApi}
                  </span>
                )}
              </Link>
              {isStafAtauAdmin && (
                <Link
                  href="/dashboard"
                  className="px-3.5 py-2 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold inline-flex items-center gap-1.5 hover:bg-amber-200 transition"
                >
                  <i className="fa-solid fa-user-shield"></i>
                  <span className="hidden sm:inline">Panel {profil.role === "admin" ? "Admin" : "Petugas"}</span>
                </Link>
              )}
              <Link
                href="/pesan"
                className="px-4 py-2.5 rounded-2xl bg-[#17382d] hover:bg-[#235343] text-white text-xs font-bold inline-flex items-center gap-2 shadow-[0_6px_16px_rgba(23,56,45,0.16)] transition"
              >
                <i className="fa-solid fa-plus"></i>
                <span className="hidden sm:inline">Cake Studio 3D</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {tabAktif === "beranda" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white rounded-3xl p-5 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#788d80]">
                        Pesanan Aktif
                      </span>
                      <div className="text-2xl font-black text-[#182b23] mt-1">
                        {pesananAktifList.length}
                      </div>
                      <span className="text-[11px] font-semibold text-sky-700 mt-1 block">
                        Sedang diproses toko
                      </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center text-lg shadow-inner">
                      <i className="fa-solid fa-fire-burner"></i>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#788d80]">
                        Menunggu Pembayaran
                      </span>
                      <div className="text-2xl font-black text-amber-700 mt-1">
                        {pesananMenungguBayarList.length}
                      </div>
                      <span className="text-[11px] font-semibold text-[#6b8274] mt-1 block">
                        {jumlahBuktiMenungguAdmin > 0
                          ? `${jumlahBuktiMenungguAdmin} bukti diproses toko`
                          : `Sisa tagihan: ${formatRupiah(totalSisaTagihan)}`}
                      </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center text-lg shadow-inner">
                      <i className="fa-solid fa-clock"></i>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#788d80]">
                        Total Belanja
                      </span>
                      <div className="text-2xl font-black text-[#17382d] mt-1">
                        {formatRupiah(totalBelanjaTerkonfirmasi)}
                      </div>
                      <span className="text-[11px] font-semibold text-[#26804a] mt-1 block">
                        Total pembayaran terkonfirmasi
                      </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-[#dcf5e4] text-[#26804a] border border-emerald-200 flex items-center justify-center text-lg shadow-inner">
                      <i className="fa-solid fa-sack-dollar"></i>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#788d80]">
                        Status Bayar Terakhir
                      </span>
                      <div className="text-base font-extrabold text-[#182b23] mt-1.5 truncate">
                        {pembayaranTerakhir
                          ? `${pembayaranTerakhir.jenis} • ${pembayaranTerakhir.status}`
                          : pesananList[0]
                            ? pesananList[0].status_bayar
                            : "Belum Ada"}
                      </div>
                      <span className="text-[11px] font-semibold text-[#6b8274] mt-1 block truncate">
                        {pembayaranTerakhir
                          ? `${pembayaranTerakhir.kode_pesanan} (${formatRupiah(pembayaranTerakhir.jumlah)})`
                          : "Belum ada pembayaran masuk"}
                      </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-[#eef4ef] text-[#17382d] border border-[#dce6de] flex items-center justify-center text-lg shadow-inner shrink-0">
                      <i className="fa-solid fa-receipt"></i>
                    </div>
                  </div>
                </div>

                {totalKeranjangQty > 0 && (
                  <div className="bg-[#FFFDF9] rounded-3xl p-4 sm:p-5 border border-[#E5D5C5] shadow-[0_8px_24px_rgba(61,43,40,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#FAF0E8] text-[#9E3B42] border border-[#E5C9BE] flex items-center justify-center text-lg shrink-0">
                        <i className="fa-solid fa-bag-shopping"></i>
                      </div>
                      <div className="text-xs">
                        <p className="font-extrabold text-[#3D2B28]">
                          Ada {totalKeranjangQty} kue di Keranjang Kasir ({formatRupiah(totalKeranjangHarga)})
                        </p>
                        <p className="text-[#7A6158] mt-0.5">
                          Lanjutkan checkout dessert pilihan Anda dari katalog Menu di Meja Kasir.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href="/menu"
                        className="px-3.5 py-2 rounded-xl border border-[#D9C5B2] bg-white hover:bg-[#FAF4EE] text-[#3D2B28] text-xs font-bold transition"
                      >
                        Lihat Menu
                      </Link>
                      <Link
                        href="/keranjang"
                        className="px-4 py-2 rounded-xl bg-[#9E3B42] hover:bg-[#822E34] text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                      >
                        <span>Buka Keranjang</span>
                        <i className="fa-solid fa-arrow-right text-[10px]"></i>
                      </Link>
                    </div>
                  </div>
                )}

                {pesananList.some((p) => p.perlu_refund && p.id !== pesananUtamaDilacak?.id) && (
                  <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3">
                    <i className="fa-solid fa-triangle-exclamation text-lg text-amber-600 shrink-0"></i>
                    <div>
                      <p className="font-extrabold">Pemberitahuan Pengembalian Dana</p>
                      <p className="mt-0.5">
                        Pembayaran diterima setelah pesanan dibatalkan; toko akan menghubungi Anda.
                      </p>
                    </div>
                  </div>
                )}

                {pesananUtamaDilacak && (
                  <div className="bg-white rounded-3xl p-6 border border-[#dce6de] shadow-[0_10px_28px_rgba(23,56,45,0.05)] space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eef3ee]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#26804a] bg-[#dcf5e4] px-2.5 py-0.5 rounded-full">
                            Pelacakan Langsung
                          </span>
                          <span className="text-xs font-bold text-[#6b8274]">
                            {pesananUtamaDilacak.metode_pengiriman === "Kirim"
                              ? formatTeksJadwal(pesananUtamaDilacak).teks
                              : `Jadwal Ambil: ${formatTanggalSingkat(pesananUtamaDilacak.tanggal_ambil)}${pesananUtamaDilacak.jam_ambil ? ` • ${pesananUtamaDilacak.jam_ambil.slice(0, 5)} WIB` : ""}`}
                          </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-[#182b23] mt-1">
                          Pesanan {pesananUtamaDilacak.kode_pesanan} — {pesananUtamaDilacak.nama_penerima}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeStatusWarna(pesananUtamaDilacak.status_pesanan)}`}>
                          {pesananUtamaDilacak.status_pesanan}
                        </span>
                        <Link
                          href={`/pesanan-saya/${pesananUtamaDilacak.kode_pesanan}`}
                          className="px-4 py-2 rounded-xl bg-[#17382d] hover:bg-[#235343] text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-qrcode"></i>
                          <span>Lihat Tiket</span>
                        </Link>
                      </div>
                    </div>

                    {pesananUtamaDilacak.perlu_refund && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3">
                        <i className="fa-solid fa-triangle-exclamation text-lg text-amber-600 shrink-0"></i>
                        <div>
                          <p className="font-extrabold">Pemberitahuan Pengembalian Dana</p>
                          <p className="mt-0.5">
                            Pembayaran diterima setelah pesanan dibatalkan; toko akan menghubungi Anda.
                          </p>
                        </div>
                      </div>
                    )}

                    {pesananUtamaDilacak.status_pesanan === "Dibatalkan" ? (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
                        <i className="fa-solid fa-circle-xmark text-lg text-rose-600"></i>
                        <div>
                          <p className="font-extrabold">Pesanan Dibatalkan oleh Admin</p>
                          <p className="mt-0.5">
                            Alasan: {pesananUtamaDilacak.alasan_batal || "Tidak disebutkan"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {dapatkanTahapStepper(pesananUtamaDilacak).map((thp, idx) => {
                          const idxSekarang = indeksTahapStepper(
                            pesananUtamaDilacak.status_pesanan
                          );
                          const selesai = idxSekarang > idx;
                          const aktif = idxSekarang === idx;
                          return (
                            <div
                              key={thp.judul}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                aktif
                                  ? "bg-[#eaf4ee] border-[#17382d] shadow-xs"
                                  : selesai
                                    ? "bg-[#f4faf6] border-emerald-200"
                                    : "bg-[#f8faf7] border-[#e6eee8] opacity-65"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                                    selesai
                                      ? "bg-[#26804a] text-white"
                                      : aktif
                                        ? "bg-[#17382d] text-white"
                                        : "bg-[#e3ece5] text-[#6b8274]"
                                  }`}
                                >
                                  <i className={selesai ? "fa-solid fa-check" : thp.ikon}></i>
                                </span>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6b8274]">
                                  {thp.menunggu || thp.aktor}
                                </span>
                              </div>
                              <p className="text-xs font-extrabold text-[#182b23]">
                                {thp.judul}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(() => {
                      const info = infoPenanggungJawab(pesananUtamaDilacak);
                      const logTerakhir =
                        pesananUtamaDilacak.riwayat_pesanan &&
                        pesananUtamaDilacak.riwayat_pesanan.length > 0
                          ? pesananUtamaDilacak.riwayat_pesanan[0]
                          : null;
                      return (
                        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${info.warna}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center text-sm shrink-0 shadow-xs">
                              <i className={info.ikon}></i>
                            </div>
                            <div className="text-xs">
                              <p className="font-extrabold">{info.label}</p>
                              <p className="mt-0.5 opacity-90">{info.deskripsi}</p>
                            </div>
                          </div>
                          {logTerakhir && (
                            <div className="text-[11px] bg-white/75 px-3 py-1.5 rounded-xl border border-black/5 shrink-0">
                              <span className="font-bold block">Update Terakhir:</span>
                              <span>{logTerakhir.keterangan}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="bg-white rounded-3xl p-6 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-extrabold text-[#182b23]">
                        5 Transaksi Terakhir
                      </h2>
                      <p className="text-xs text-[#6b8274]">
                        Ringkasan pesanan terbaru Anda
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => gantiTab("pesanan")}
                      className="text-xs font-extrabold text-[#17382d] hover:underline cursor-pointer"
                    >
                      Lihat Semua &rarr;
                    </button>
                  </div>

                  {pesananList.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl bg-[#f8faf7] border border-dashed border-[#dce6de]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#eaf2ec] text-[#17382d] flex items-center justify-center text-xl">
                        <i className="fa-solid fa-basket-shopping"></i>
                      </div>
                      <p className="text-sm font-extrabold text-[#182b23]">
                        Belum Ada Transaksi Pesanan
                      </p>
                      <p className="text-xs text-[#6b8274] mt-1 max-w-sm mx-auto">
                        Pesanan yang Anda buat akan muncul di sini dan langsung diteruskan ke Admin serta Petugas Produksi.
                      </p>
                      <Link
                        href="/pesan"
                        className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[#17382d] text-white text-xs font-bold"
                      >
                        <i className="fa-solid fa-plus"></i>
                        <span>Buat Pesanan Pertama</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#eff4ee] text-[#17382d] uppercase text-[11px] font-extrabold">
                            <th className="py-3 px-4 rounded-l-xl">Kode</th>
                            <th className="py-3 px-4">Jadwal Ambil/Kirim</th>
                            <th className="py-3 px-4">Metode</th>
                            <th className="py-3 px-4">Total Tagihan</th>
                            <th className="py-3 px-4">Status Bayar</th>
                            <th className="py-3 px-4">Status Pesanan</th>
                            <th className="py-3 px-4 rounded-r-xl text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef3ee]">
                          {pesananList.slice(0, 5).map((p) => {
                            const jadwal = formatTeksJadwal(p);
                            const sisaTagihanItem = Math.max(
                              0,
                              (Number(p.total_bayar) || 0) - (Number(p.jumlah_terbayar) || 0)
                            );
                            return (
                              <tr key={p.id} className="hover:bg-[#f8faf7] transition">
                                <td className="py-3.5 px-4 font-extrabold text-[#182b23]">
                                  {p.kode_pesanan}
                                  <span className="block text-[10px] font-medium text-[#6b8274]">
                                    {p.nama_penerima}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-[#3a5246]">
                                  <span className="font-bold block">
                                    {jadwal.teks}
                                  </span>
                                  <span className="text-[11px] text-[#6b8274]">
                                    {jadwal.sub}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-[#3a5246]">
                                  {p.metode_pengiriman === "Ambil" ? "Ambil di Toko" : "Kirim Kurir"}
                                </td>
                                <td className="py-3.5 px-4 font-extrabold text-[#182b23]">
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
                                  {isMounted && p.status_pesanan === "Menunggu Pembayaran" ? (
                                    <>
                                      <Link
                                        href={`/pesanan-saya/${p.kode_pesanan}`}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7D2330] hover:bg-[#681C27] text-white font-bold text-[11px] shadow-xs"
                                      >
                                        <i className="fa-solid fa-credit-card text-[10px]"></i>
                                        <span>Bayar</span>
                                      </Link>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPesananBatalTarget(p);
                                          setPesanBatalError("");
                                          setAlasanBatalInput("");
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer"
                                        title="Batalkan Pesanan"
                                      >
                                        <i className="fa-solid fa-ban"></i>
                                      </button>
                                    </>
                                  ) : null}
                                  {((p.pembayaran || []).some((b) => b.status === "Dikonfirmasi") || (Number(p.jumlah_terbayar) || 0) > 0) && (
                                    <button
                                      type="button"
                                      onClick={() => setPesananInvoice(p)}
                                      className="px-2.5 py-1.5 rounded-xl border border-[#dce6de] bg-white hover:bg-[#eff4ee] text-[#17382d] font-bold text-[11px] cursor-pointer"
                                      title="Lihat Struk"
                                    >
                                      <i className="fa-solid fa-file-invoice"></i>
                                    </button>
                                  )}
                                  <Link
                                    href={`/pesanan-saya/${p.kode_pesanan}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#17382d] hover:bg-[#235343] text-white font-bold text-[11px]"
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
              </>
            )}

            {tabAktif === "pesanan" && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl p-5 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: "Semua", label: "Semua" },
                      { id: "Aktif", label: "Aktif" },
                      { id: "Pending", label: "Pending Bayar" },
                      { id: "Diproses Petugas", label: "Diproses Petugas" },
                      { id: "Siap & Dikirim", label: "Siap / Dikirim" },
                      { id: "Selesai", label: "Selesai" },
                      { id: "Dibatalkan", label: "Dibatalkan" },
                    ].map((flt) => (
                      <button
                        key={flt.id}
                        type="button"
                        onClick={() => setFilterStatusPesanan(flt.id)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                          filterStatusPesanan === flt.id
                            ? "bg-[#17382d] text-white shadow-xs"
                            : "bg-[#f3f7f3] text-[#4b6356] hover:bg-[#e6efe7]"
                        }`}
                      >
                        {flt.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full md:w-64">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788d80] text-xs"></i>
                    <input
                      type="text"
                      value={kataCariPesanan}
                      onChange={(e) => setKataCariPesanan(e.target.value)}
                      placeholder="Cari kode, nama kue, atau penerima"
                      className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                    />
                  </div>
                </div>

                {pesananTersaring.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)]">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#eaf2ec] text-[#17382d] flex items-center justify-center text-2xl">
                      <i className="fa-solid fa-box-open"></i>
                    </div>
                    <h3 className="text-base font-extrabold text-[#182b23]">
                      Tidak Ada Pesanan Ditemukan
                    </h3>
                    <p className="text-xs text-[#6b8274] mt-1">
                      Belum ada pesanan yang sesuai dengan filter atau pencarian Anda.
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

                      return (
                        <div
                          key={p.id}
                          className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] space-y-4"
                        >
                          {p.perlu_refund && (
                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2.5">
                              <i className="fa-solid fa-triangle-exclamation text-amber-600 text-base shrink-0"></i>
                              <p className="font-semibold">
                                Pembayaran diterima setelah pesanan dibatalkan; toko akan menghubungi Anda.
                              </p>
                            </div>
                          )}

                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-20 h-20 rounded-2xl bg-[#f6f9f6] border border-[#dce6de] p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                                {p.fotoPreviewUrl ? (
                                  <img
                                    src={p.fotoPreviewUrl}
                                    alt={p.kode_pesanan}
                                    className="w-full h-full object-contain rounded-xl"
                                  />
                                ) : (
                                  <PreviewKue
                                    pilihan={p.pesanan_pilihan || []}
                                    tulisan={p.tulisan_kue || ""}
                                    className="w-full h-full"
                                  />
                                )}
                              </div>

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-base font-black text-[#182b23]">
                                    {p.kode_pesanan}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeStatusWarna(p.status_pesanan)}`}>
                                    {p.status_pesanan}
                                  </span>
                                </div>

                                <p className="text-xs font-bold text-[#3a5246]">
                                  Penerima: {p.nama_penerima} •{" "}
                                  {p.metode_pengiriman === "Ambil"
                                    ? "Ambil di Toko"
                                    : `Kirim Kurir${p.jarak_km ? ` (${p.jarak_km} km)` : p.zona_ongkir?.nama ? ` (${p.zona_ongkir.nama})` : ""}`}
                                </p>

                                <p className="text-xs text-[#6b8274]">
                                  <i className="fa-regular fa-calendar mr-1.5"></i>
                                  {p.metode_pengiriman === "Kirim" ? (
                                    <span>{formatTeksJadwal(p).teks}</span>
                                  ) : (
                                    <span>
                                      Jadwal: <strong>{formatTanggalIndonesia(p.tanggal_ambil)}</strong>
                                      {p.jam_ambil ? <> pukul <strong>{p.jam_ambil.slice(0, 5)} WIB</strong></> : null}
                                    </span>
                                  )}
                                </p>

                                {p.isi_singkat && (
                                  <p className="text-xs text-[#3a5246] font-medium">
                                    <i className="fa-solid fa-cake-candles mr-1.5 text-[#788d80]"></i>
                                    Pesanan: <strong>{p.isi_singkat}</strong>
                                  </p>
                                )}

                                {p.tulisan_kue && (
                                  <p className="text-xs text-[#17382d] font-semibold">
                                    <i className="fa-solid fa-pen-nib mr-1.5"></i>
                                    Ucapan: &ldquo;{p.tulisan_kue}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#eef3ee]">
                              <div className="lg:text-right">
                                <span className="text-[11px] text-[#788d80] font-bold block">
                                  Total Bayar
                                </span>
                                <span className="text-lg font-black text-[#17382d]">
                                  {formatRupiah(p.total_bayar)}
                                </span>
                                {sisa > 0 && p.status_pesanan !== "Dibatalkan" && (
                                  <span className="block text-[11px] font-bold text-amber-700">
                                    Belum Lunas: {formatRupiah(sisa)}
                                  </span>
                                )}
                                {isMounted && p.status_pesanan === "Menunggu Pembayaran" ? (
                                  <span className="block text-[10px] font-bold text-rose-600 mt-0.5">
                                    Batas: {formatTanggalWaktu(new Date(new Date(p.dibuat_pada).getTime() + (pengaturanToko?.batas_bayar_jam || 24) * 3600000))}
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {sisa > 0 && p.status_pesanan !== "Dibatalkan" && (
                                  <Link
                                    href={`/pesanan-saya/${p.kode_pesanan}`}
                                    className="px-4 py-2 rounded-xl bg-[#7D2330] hover:bg-[#681C27] text-white text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs"
                                  >
                                    <i className="fa-solid fa-credit-card"></i>
                                    <span>Bayar Sekarang</span>
                                  </Link>
                                )}
                                {isMounted && p.status_pesanan === "Menunggu Pembayaran" && (Number(p.jumlah_terbayar) || 0) === 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPesananBatalTarget(p);
                                      setPesanBatalError("");
                                      setAlasanBatalInput("");
                                    }}
                                    className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                                  >
                                    <i className="fa-solid fa-ban"></i>
                                    <span>Batal</span>
                                  </button>
                                )}
                                <Link
                                  href={`/pesanan-saya/${p.kode_pesanan}`}
                                  className="px-3.5 py-2 rounded-xl bg-[#17382d] hover:bg-[#235343] text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                                >
                                  <i className="fa-solid fa-qrcode"></i>
                                  <span>Tiket</span>
                                </Link>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPesananDetailTerbuka(terbuka ? null : p.id)
                                  }
                                  className="px-3.5 py-2 rounded-xl border border-[#dce6de] bg-[#f8faf7] hover:bg-[#eaf2ec] text-xs font-bold text-[#17382d] transition cursor-pointer"
                                >
                                  <i
                                    className={`fa-solid ${
                                      terbuka ? "fa-chevron-up" : "fa-clock-rotate-left"
                                    } mr-1.5`}
                                  ></i>
                                  {terbuka ? "Tutup Riwayat" : "Riwayat"}
                                </button>
                                {((p.pembayaran || []).some((b) => b.status === "Dikonfirmasi") || (Number(p.jumlah_terbayar) || 0) > 0) && (
                                  <button
                                    type="button"
                                    onClick={() => setPesananInvoice(p)}
                                    className="px-3.5 py-2 rounded-xl border border-[#dce6de] bg-white hover:bg-[#eff4ee] text-xs font-bold text-[#17382d] transition cursor-pointer"
                                  >
                                    <i className="fa-solid fa-receipt mr-1.5"></i>
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
                            <span className="text-[11px] font-extrabold uppercase tracking-wider shrink-0">
                              {info.menunggu || "Menunggu: Toko"}
                            </span>
                          </div>

                          {terbuka && (
                            <div className="pt-3 border-t border-[#eef3ee] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="bg-[#f8faf7] rounded-2xl p-4 border border-[#e5ede6] space-y-2">
                                <p className="font-extrabold text-[#17382d] uppercase text-[11px] tracking-wider">
                                  Komponen Kustomisasi Kue
                                </p>
                                <div className="divide-y divide-[#e5ede6]">
                                  {(p.pesanan_pilihan || []).map((pil) => (
                                    <div
                                      key={pil.id}
                                      className="py-1.5 flex items-center justify-between"
                                    >
                                      <span className="text-[#3a5246]">
                                        <strong className="text-[#182b23]">{pil.nama_grup}:</strong>{" "}
                                        {pil.nama_item}
                                        {pil.jumlah > 1 ? ` ×${pil.jumlah}` : ""}
                                      </span>
                                      <span className="font-bold text-[#17382d]">
                                        {pil.harga === 0
                                          ? "Termasuk"
                                          : formatRupiah((pil.harga || 0) * (pil.jumlah || 1))}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="bg-[#f8faf7] rounded-2xl p-4 border border-[#e5ede6] space-y-2">
                                <p className="font-extrabold text-[#17382d] uppercase text-[11px] tracking-wider">
                                  Riwayat Update dari Admin & Petugas
                                </p>
                                {(p.riwayat_pesanan || []).length === 0 ? (
                                  <p className="text-[#6b8274]">Belum ada log perubahan status.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {(p.riwayat_pesanan || []).map((r) => (
                                      <div
                                        key={r.id}
                                        className="flex items-start gap-2.5 border-l-2 border-[#17382d] pl-3 py-0.5"
                                      >
                                        <div>
                                          <p className="font-bold text-[#182b23]">
                                            {r.keterangan}
                                          </p>
                                          <p className="text-[11px] text-[#6b8274]">
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

            {tabAktif === "riwayat" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-[#182b23]">
                        Daftar Invoice & Struk Pesanan
                      </h2>
                      <p className="text-xs text-[#6b8274]">
                        Klik tombol Unduh / Cetak Struk untuk menyimpan bukti transaksi resmi toko
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {["Semua", "Lunas", "DP", "Belum Bayar", "Selesai"].map((flt) => (
                        <button
                          key={flt}
                          type="button"
                          onClick={() => setFilterRiwayat(flt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            filterRiwayat === flt
                              ? "bg-[#17382d] text-white"
                              : "bg-[#f3f7f3] text-[#4b6356] hover:bg-[#e6efe7]"
                          }`}
                        >
                          {flt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {riwayatPesananTersaring.length === 0 ? (
                    <p className="text-xs text-[#6b8274] py-6 text-center">
                      Belum ada riwayat transaksi pada kategori ini.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#eff4ee] text-[#17382d] uppercase text-[11px] font-extrabold">
                            <th className="py-3 px-4 rounded-l-xl">No. Invoice</th>
                            <th className="py-3 px-4">Tanggal Pesan</th>
                            <th className="py-3 px-4">Total Kue & Ongkir</th>
                            <th className="py-3 px-4">Dibayar</th>
                            <th className="py-3 px-4">Status Bayar</th>
                            <th className="py-3 px-4">Status Pesanan</th>
                            <th className="py-3 px-4 rounded-r-xl text-right">Struk / Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef3ee]">
                          {riwayatPesananTersaring.map((p) => (
                            <tr key={p.id} className="hover:bg-[#f8faf7]">
                              <td className="py-3.5 px-4 font-extrabold text-[#182b23]">
                                INV-{p.kode_pesanan}
                              </td>
                              <td className="py-3.5 px-4 text-[#3a5246]">
                                {formatTanggalSingkat(p.dibuat_pada)}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#182b23]">
                                {formatRupiah(p.total_bayar)}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#26804a]">
                                {formatRupiah(p.jumlah_terbayar || 0)}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeBayarWarna(p.status_bayar)}`}>
                                  {p.status_bayar}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeStatusWarna(p.status_pesanan)}`}>
                                  {p.status_pesanan}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setPesananInvoice(p)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#17382d] hover:bg-[#235343] text-white font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <i className="fa-solid fa-print"></i>
                                  <span>Lihat & Cetak Struk</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] space-y-4">
                  <div>
                    <h2 className="text-base font-extrabold text-[#182b23]">
                      Riwayat Pembayaran
                    </h2>
                    <p className="text-xs text-[#6b8274]">
                      Catatan transaksi pembayaran pesanan Anda
                    </p>
                  </div>

                  {semuaPembayaranList.length === 0 ? (
                    <p className="text-xs text-[#6b8274] py-6 text-center">
                      Belum ada pembayaran.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#eff4ee] text-[#17382d] uppercase text-[11px] font-extrabold">
                            <th className="py-3 px-4 rounded-l-xl">Tanggal</th>
                            <th className="py-3 px-4">Pesanan</th>
                            <th className="py-3 px-4">Jumlah</th>
                            <th className="py-3 px-4">Metode</th>
                            <th className="py-3 px-4 rounded-r-xl">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef3ee]">
                          {semuaPembayaranList.map((b) => (
                            <tr key={b.id} className="hover:bg-[#f8faf7]">
                              <td className="py-3 px-4 text-[#3a5246]">
                                {formatTanggalWaktu(b.dibuat_pada)}
                              </td>
                              <td className="py-3 px-4 font-extrabold text-[#182b23]">
                                <Link
                                  href={`/pesanan-saya/${b.kode_pesanan}`}
                                  className="hover:underline text-[#17382d]"
                                >
                                  {b.kode_pesanan}
                                </Link>
                              </td>
                              <td className="py-3 px-4 font-extrabold text-[#182b23]">
                                {formatRupiah(b.jumlah)}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-[#182b23]">
                                  {b.metode || "Midtrans"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    b.status === "Dikonfirmasi" || b.status === "settlement" || b.status === "capture"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : b.status === "Ditolak" || b.status === "deny" || b.status === "cancel"
                                        ? "bg-rose-100 text-rose-800"
                                        : b.status === "expire"
                                          ? "bg-stone-100 text-stone-700"
                                          : "bg-amber-100 text-amber-800"
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
                  <div className="bg-white rounded-3xl p-6 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] text-center space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-[#17382d] text-white font-black text-2xl flex items-center justify-center mx-auto shadow-[0_10px_20px_rgba(23,56,45,0.2)]">
                      {inisialUser}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#182b23]">
                        {profil?.nama || "Pelanggan"}
                      </h3>
                      <p className="text-xs text-[#6b8274] mt-0.5">
                        {profil?.email || "-"}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#eef3ee] text-left text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#6b8274]">WhatsApp:</span>
                        <span className="font-bold text-[#182b23]">
                          {profil?.no_wa || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b8274]">Bergabung:</span>
                        <span className="font-semibold text-[#182b23]">
                          {profil?.dibuat_pada ? formatTanggal(profil.dibuat_pada) : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-3 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setSubTabProfil("datadiri")}
                      className={`w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        subTabProfil === "datadiri"
                          ? "bg-[#17382d] text-white"
                          : "text-[#3a5246] hover:bg-[#f3f7f3]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <i className="fa-regular fa-id-card"></i>
                        <span>Data Diri & Alamat Pengiriman</span>
                      </span>
                      <i className="fa-solid fa-chevron-right text-[10px]"></i>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubTabProfil("keamanan")}
                      className={`w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        subTabProfil === "keamanan"
                          ? "bg-[#17382d] text-white"
                          : "text-[#3a5246] hover:bg-[#f3f7f3]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <i className="fa-solid fa-shield-halved"></i>
                        <span>Ganti Kata Sandi</span>
                      </span>
                      <i className="fa-solid fa-chevron-right text-[10px]"></i>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  {subTabProfil === "datadiri" ? (
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)]">
                      <div className="pb-4 mb-5 border-b border-[#eef3ee]">
                        <h3 className="text-base font-extrabold text-[#182b23]">
                          Profil & Alamat Pengiriman Utama
                        </h3>
                        <p className="text-xs text-[#6b8274] mt-0.5">
                          Data ini mengisi checkout otomatis dan dipakai toko saat memproses pesanan Anda.
                        </p>
                      </div>

                      {pesanSuksesProfil && (
                        <div className="mb-5 p-4 rounded-2xl bg-[#dcf5e4] border border-emerald-200 text-[#1c6e3d] text-xs font-bold flex items-center gap-2.5">
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
                            <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
                              Nama Lengkap
                            </label>
                            <input
                              type="text"
                              required
                              value={formProfil.nama}
                              onChange={(e) =>
                                setFormProfil({ ...formProfil, nama: e.target.value })
                              }
                              className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
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
                              className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                            />
                            {!/^(0|62|\+62)8[1-9][0-9]{6,11}$/.test(formProfil.no_wa?.trim() || "") && formProfil.no_wa && (
                              <p className="mt-1 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                                <i className="fa-solid fa-triangle-exclamation" />
                                <span>Format nomor belum standar Indonesia (contoh: 081234567890).</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
                            Email Akun (Tetap)
                          </label>
                          <input
                            type="email"
                            disabled
                            value={profil?.email || ""}
                            className="w-full px-4 py-3 rounded-2xl bg-stone-100 border border-stone-200 shadow-inner text-xs font-semibold text-stone-500 cursor-not-allowed"
                          />
                        </div>

                        <div className="pt-3 border-t border-[#eef3ee] space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-[#3a5246] mb-1">
                              Lokasi Pengiriman Utama (Pin Peta)
                            </label>
                            <p className="text-[11px] text-[#6b8274] mb-2">
                              Data ini mengisi checkout otomatis dan dipakai toko saat memproses pesanan Anda.
                            </p>
                            <PetaLokasi
                              posisiToko={
                                pengaturanToko?.lat_toko && pengaturanToko?.lng_toko
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
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
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
                              className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
                              Patokan Kurir / Catatan Lokasi
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
                              placeholder="Contoh: Pagar hitam sebelah minimarket, titip satpam jika tidak di rumah"
                              className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={sedangSimpanProfil}
                            className="px-6 py-3 rounded-2xl bg-[#17382d] hover:bg-[#235343] text-white text-xs font-extrabold shadow-[0_8px_18px_rgba(23,56,45,0.18)] transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                          >
                            <i className="fa-solid fa-floppy-disk"></i>
                            <span>
                              {sedangSimpanProfil
                                ? "Menyimpan..."
                                : "Simpan Profil & Alamat"}
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)]">
                      <div className="pb-4 mb-5 border-b border-[#eef3ee]">
                        <h3 className="text-base font-extrabold text-[#182b23]">
                          Keamanan & Ganti Kata Sandi
                        </h3>
                        <p className="text-xs text-[#6b8274] mt-0.5">
                          Pastikan kata sandi baru minimal 8 karakter
                        </p>
                      </div>

                      {pesanSuksesSandi && (
                        <div className="mb-5 p-4 rounded-2xl bg-[#dcf5e4] border border-emerald-200 text-[#1c6e3d] text-xs font-bold flex items-center gap-2.5">
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
                          <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
                            Kata Sandi Saat Ini
                          </label>
                          <input
                            type="password"
                            required
                            value={formSandi.kataSandiLama}
                            onChange={(e) =>
                              setFormSandi({
                                ...formSandi,
                                kataSandiLama: e.target.value,
                              })
                            }
                            placeholder="Masukkan kata sandi lama..."
                            className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
                            Kata Sandi Baru (Min. 8 Karakter)
                          </label>
                          <input
                            type="password"
                            required
                            value={formSandi.kataSandiBaru}
                            onChange={(e) =>
                              setFormSandi({
                                ...formSandi,
                                kataSandiBaru: e.target.value,
                              })
                            }
                            placeholder="Minimal 8 karakter..."
                            className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
                            Ulangi Kata Sandi Baru
                          </label>
                          <input
                            type="password"
                            required
                            value={formSandi.konfirmasiSandi}
                            onChange={(e) =>
                              setFormSandi({
                                ...formSandi,
                                konfirmasiSandi: e.target.value,
                              })
                            }
                            placeholder="Ketik ulang kata sandi baru..."
                            className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={sedangSimpanSandi}
                            className="px-6 py-3 rounded-2xl bg-[#17382d] hover:bg-[#235343] text-white text-xs font-extrabold shadow-[0_8px_18px_rgba(23,56,45,0.18)] transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                          >
                            <i className="fa-solid fa-key"></i>
                            <span>
                              {sedangSimpanSandi
                                ? "Memperbarui..."
                                : "Perbarui Kata Sandi"}
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)]">
                    <div className="pb-4 mb-5 border-b border-[#eef3ee]">
                      <h2 className="text-base font-extrabold text-[#182b23]">
                        Hubungi Toko via WhatsApp
                      </h2>
                      <p className="text-xs text-[#6b8274] mt-0.5">
                        Pesan akan terisi otomatis dengan detail pesanan Anda
                      </p>
                    </div>

                    {pesanSuksesTiket && (
                      <div className="mb-5 p-4 rounded-2xl bg-[#dcf5e4] border border-emerald-200 text-[#1c6e3d] text-xs font-bold flex items-center gap-2.5">
                        <i className="fa-solid fa-circle-check text-sm"></i>
                        <span>{pesanSuksesTiket}</span>
                      </div>
                    )}

                    <form onSubmit={handleBuatTiketBantuan} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
                            Pilih Kode Pesanan
                          </label>
                          <select
                            value={formTiket.kode_pesanan}
                            onChange={(e) =>
                              setFormTiket({
                                ...formTiket,
                                kode_pesanan: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                          >
                            <option value="Umum (Belum Pesan)">
                              Pertanyaan Umum
                            </option>
                            {pesananList.map((p) => (
                              <option key={p.id} value={p.kode_pesanan}>
                                {p.kode_pesanan} ({p.status_pesanan})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
                            Kategori Bantuan
                          </label>
                          <select
                            value={formTiket.kategori}
                            onChange={(e) =>
                              setFormTiket({
                                ...formTiket,
                                kategori: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                          >
                            <option value="Status pembuatan kue">
                              Status pembuatan kue
                            </option>
                            <option value="Pembayaran">
                              Pembayaran
                            </option>
                            <option value="Pengiriman atau pengambilan">
                              Pengiriman atau pengambilan
                            </option>
                            <option value="Lainnya">
                              Lainnya
                            </option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
                          Judul / Subjek
                        </label>
                        <input
                          type="text"
                          required
                          value={formTiket.subjek}
                          onChange={(e) =>
                            setFormTiket({ ...formTiket, subjek: e.target.value })
                          }
                          placeholder="Contoh: Pertanyaan jadwal ambil kue"
                          className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#3a5246] mb-1.5">
                          Detail Pesan
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={formTiket.pesan}
                          onChange={(e) =>
                            setFormTiket({ ...formTiket, pesan: e.target.value })
                          }
                          placeholder="Tuliskan pertanyaan atau kendala yang ingin Anda tanyakan ke tim toko..."
                          className="w-full px-4 py-3 rounded-2xl bg-[#f3f7f3] border border-[#dce6de] shadow-inner text-xs font-semibold text-[#182b23] outline-none focus:bg-white focus:border-[#17382d]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!tokoPublik?.no_wa && !pengaturanToko?.no_wa}
                        className="px-6 py-3 rounded-2xl bg-[#17382d] hover:bg-[#235343] text-white text-xs font-extrabold shadow-[0_8px_18px_rgba(23,56,45,0.18)] transition cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="fa-brands fa-whatsapp text-sm"></i>
                        <span>Kirim lewat WhatsApp</span>
                      </button>
                      {!tokoPublik?.no_wa && !pengaturanToko?.no_wa && (
                        <p className="text-[11px] font-semibold text-amber-700 mt-1">
                          Nomor WhatsApp toko belum tersedia saat ini.
                        </p>
                      )}
                    </form>
                  </div>

                  {daftarTiketBantuan.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] space-y-4">
                      <h3 className="text-sm font-extrabold text-[#182b23]">
                        Riwayat Pertanyaan Saya
                      </h3>
                      <div className="space-y-3">
                        {daftarTiketBantuan.map((t) => (
                          <div
                            key={t.id}
                            className="p-4 rounded-2xl bg-[#f8faf7] border border-[#dce6de] space-y-2 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-[#17382d]">
                                  {t.id}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  {t.kategori}
                                </span>
                                <span className="text-[#6b8274] font-semibold">
                                  • Pesanan: {t.kode_pesanan}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#6b8274]">
                                {formatTanggalWaktu(t.dibuat_pada)}
                              </span>
                            </div>
                            <p className="font-extrabold text-[#182b23]">
                              {t.subjek}
                            </p>
                            <p className="text-[#3a5246]">{t.pesan}</p>
                            <div className="pt-2 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-amber-700">
                                Status: {t.status}
                              </span>
                              {buatLinkWaTiket(t) && (
                                <a
                                  href={buatLinkWaTiket(t)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3.5 py-1.5 rounded-xl bg-[#26804a] hover:bg-[#1f693c] text-white font-bold text-[11px] inline-flex items-center gap-1.5"
                                >
                                  <i className="fa-brands fa-whatsapp text-sm"></i>
                                  <span>Buka WhatsApp Toko</span>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white rounded-3xl p-6 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] space-y-4">
                    <h3 className="text-sm font-extrabold text-[#182b23]">
                      Kontak Operasional Toko
                    </h3>
                    <div className="space-y-3 text-xs text-[#3a5246]">
                      {(tokoPublik?.jam?.senin_jumat || tokoPublik?.jam?.sabtu_minggu || (pengaturanToko?.jam_buka_senin_jumat && pengaturanToko?.jam_tutup_senin_jumat) || (pengaturanToko?.jam_buka_sabtu_minggu && pengaturanToko?.jam_tutup_sabtu_minggu)) && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#eaf2ec] text-[#17382d] flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-clock"></i>
                          </div>
                          <div>
                            <p className="font-bold text-[#182b23]">Jam Operasional</p>
                            {(tokoPublik?.jam?.senin_jumat || (pengaturanToko?.jam_buka_senin_jumat && pengaturanToko?.jam_tutup_senin_jumat)) && (
                              <p className="text-[11px] text-[#6b8274]">
                                Senin – Jumat: {tokoPublik?.jam?.senin_jumat || `${pengaturanToko.jam_buka_senin_jumat.slice(0, 5).replace(":", ".")} – ${pengaturanToko.jam_tutup_senin_jumat.slice(0, 5).replace(":", ".")} WIB`}
                              </p>
                            )}
                            {(tokoPublik?.jam?.sabtu_minggu || (pengaturanToko?.jam_buka_sabtu_minggu && pengaturanToko?.jam_tutup_sabtu_minggu)) && (
                              <p className="text-[11px] text-[#6b8274]">
                                Sabtu – Minggu: {tokoPublik?.jam?.sabtu_minggu || `${pengaturanToko.jam_buka_sabtu_minggu.slice(0, 5).replace(":", ".")} – ${pengaturanToko.jam_tutup_sabtu_minggu.slice(0, 5).replace(":", ".")} WIB`}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {(tokoPublik?.wa_link || pengaturanToko?.no_wa) && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#eaf2ec] text-[#17382d] flex items-center justify-center shrink-0">
                            <i className="fa-brands fa-whatsapp"></i>
                          </div>
                          <div>
                            <p className="font-bold text-[#182b23]">WhatsApp Toko</p>
                            <a
                              href={tokoPublik?.wa_link || `https://wa.me/${pengaturanToko.no_wa.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#26804a] font-bold hover:underline"
                            >
                              {pengaturanToko?.no_wa || tokoPublik?.no_wa}
                            </a>
                          </div>
                        </div>
                      )}

                      {(tokoPublik?.email || pengaturanToko?.email) && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#eaf2ec] text-[#17382d] flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-envelope"></i>
                          </div>
                          <div>
                            <p className="font-bold text-[#182b23]">Email Toko</p>
                            <a
                              href={`mailto:${tokoPublik?.email || pengaturanToko.email}`}
                              className="text-[#17382d] font-semibold hover:underline"
                            >
                              {tokoPublik?.email || pengaturanToko.email}
                            </a>
                          </div>
                        </div>
                      )}

                      {(tokoPublik?.alamat || pengaturanToko?.alamat) && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#eaf2ec] text-[#17382d] flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-location-dot"></i>
                          </div>
                          <div>
                            <p className="font-bold text-[#182b23]">Alamat Toko (Ambil di Tempat)</p>
                            <p>{tokoPublik?.alamat || pengaturanToko.alamat}</p>
                            {(tokoPublik?.tautan_peta || pengaturanToko?.tautan_peta) && (
                              <a
                                href={tokoPublik?.tautan_peta || pengaturanToko.tautan_peta}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[#26804a] font-bold hover:underline block mt-0.5"
                              >
                                Buka di Google Maps &rarr;
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {Boolean(pengaturanToko?.transfer_manual_aktif) && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#eaf2ec] text-[#17382d] flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-building-columns"></i>
                          </div>
                          <div>
                            <p className="font-bold text-[#182b23]">Rekening Resmi Pembayaran</p>
                            <p>
                              {pengaturanToko?.nama_bank || "BCA"} •{" "}
                              <strong>{pengaturanToko?.no_rekening || "-"}</strong>
                            </p>
                            <p className="text-[11px] text-[#6b8274]">
                              a.n. {pengaturanToko?.atas_nama || namaToko}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-[#dce6de] shadow-[0_8px_24px_rgba(23,56,45,0.04)] space-y-3">
                    <h3 className="text-sm font-extrabold text-[#182b23]">
                      Pertanyaan Umum
                    </h3>
                    <div className="space-y-2.5 text-xs text-[#3a5246]">
                      <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#e5ede6]">
                        <p className="font-extrabold text-[#17382d]">
                          1. Bagaimana pembayaran saya dikonfirmasi?
                        </p>
                        <p className="mt-1 text-[#6b8274]">
                          Pembayaran lewat Midtrans dikonfirmasi otomatis dan status berubah menjadi Diterima dalam beberapa saat. Kalau sudah membayar tetapi status belum berubah, buka tiket lalu tekan Cek Status Pembayaran.
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#e5ede6]">
                        <p className="font-extrabold text-[#17382d]">
                          2. Kapan kue saya mulai dibuat?
                        </p>
                        <p className="mt-1 text-[#6b8274]">
                          Petugas memproses pesanan berstatus Diterima sesuai jadwal. Kue custom melewati status Sedang Dibuat, sedangkan kue katalog langsung disiapkan.
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#e5ede6]">
                        <p className="font-extrabold text-[#17382d]">
                          3. Bagaimana syarat pengambilan atau pengiriman?
                        </p>
                        <p className="mt-1 text-[#6b8274]">
                          Pesanan harus lunas sebelum petugas menyerahkan atau mengirimkan kue.
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#e5ede6]">
                        <p className="font-extrabold text-[#17382d]">
                          4. Kapan pesanan saya tiba?
                        </p>
                        <p className="mt-1 text-[#6b8274]">
                          Untuk pengiriman, tampil estimasi tiba sesuai rentang tanggal di tiket. Untuk ambil di toko, sesuai tanggal dan jam yang dipilih.
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#e5ede6]">
                        <p className="font-extrabold text-[#17382d]">
                          5. Bagaimana ongkir dihitung?
                        </p>
                        <p className="mt-1 text-[#6b8274]">
                          Berdasarkan perkiraan jarak dari toko ke titik pengantaran dengan tarif mengikuti pengaturan toko.
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#f8faf7] border border-[#e5ede6]">
                        <p className="font-extrabold text-[#17382d]">
                          6. Bisakah saya membatalkan pesanan?
                        </p>
                        <p className="mt-1 text-[#6b8274]">
                          Bisa selama belum dibayar. Pesanan yang sudah dibayar atau kue custom yang sudah diproses tidak bisa dibatalkan sendiri; silakan hubungi toko.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {pesananInvoice && (
        <div
          className="fixed inset-0 z-50 bg-[#17382d]/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPesananInvoice(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#dce6de] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#eef3ee] pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#26804a] bg-[#dcf5e4] px-2.5 py-0.5 rounded-full">
                  Struk / Invoice Resmi
                </span>
                <h3 className="text-lg font-black text-[#182b23] mt-1">
                  {namaToko}
                </h3>
                <p className="text-xs text-[#6b8274]">
                  {pengaturanToko?.alamat || ""} • WA: {pengaturanToko?.no_wa || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPesananInvoice(null)}
                className="w-8 h-8 rounded-xl bg-[#f3f7f3] text-[#17382d] flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#f8faf7] p-4 rounded-2xl border border-[#e5ede6]">
              <div>
                <span className="text-[#6b8274] block">No. Pesanan:</span>
                <strong className="text-[#182b23] text-sm">
                  {pesananInvoice.kode_pesanan}
                </strong>
              </div>
              <div>
                <span className="text-[#6b8274] block">Tanggal Pesan:</span>
                <strong className="text-[#182b23]">
                  {formatTanggalSingkat(pesananInvoice.dibuat_pada)}
                </strong>
              </div>
              <div>
                <span className="text-[#6b8274] block">Penerima:</span>
                <strong className="text-[#182b23]">
                  {pesananInvoice.nama_penerima} ({pesananInvoice.no_wa})
                </strong>
              </div>
              <div>
                <span className="text-[#6b8274] block">Jadwal Ambil/Kirim:</span>
                <strong className="text-[#182b23]">
                  {formatTanggalSingkat(pesananInvoice.tanggal_ambil)} •{" "}
                  {pesananInvoice.jam_ambil?.slice(0, 5)} WIB
                </strong>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-extrabold text-[#17382d] uppercase text-[11px] tracking-wider">
                Rincian Item Kue Custom
              </p>
              <div className="divide-y divide-[#eef3ee]">
                {(pesananInvoice.pesanan_pilihan || []).map((pil) => (
                  <div key={pil.id} className="py-2 flex justify-between">
                    <span>
                      <strong>{pil.nama_grup}:</strong> {pil.nama_item}
                      {pil.jumlah > 1 ? ` ×${pil.jumlah}` : ""}
                    </span>
                    <span className="font-bold">
                      {pil.harga === 0
                        ? "Termasuk"
                        : formatRupiah((pil.harga || 0) * (pil.jumlah || 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#dce6de] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#3a5246]">
                <span>Subtotal Kue</span>
                <span>{formatRupiah(pesananInvoice.total_kue)}</span>
              </div>
              <div className="flex justify-between text-[#3a5246]">
                <span>
                  Ongkos Kirim ({pesananInvoice.metode_pengiriman}
                  {pesananInvoice.jarak_km ? ` - ${pesananInvoice.jarak_km} km` : ""})
                </span>
                <span>{formatRupiah(pesananInvoice.ongkir || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#182b23] pt-1.5 border-t border-[#eef3ee]">
                <span>Total Tagihan</span>
                <span>{formatRupiah(pesananInvoice.total_bayar)}</span>
              </div>
              <div className="flex justify-between text-[#26804a] font-bold">
                <span>Total Terbayar</span>
                <span>{formatRupiah(pesananInvoice.jumlah_terbayar || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-800">
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

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eef3ee]">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-[#17382d] hover:bg-[#235343] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-print"></i>
                <span>Cetak / Simpan PDF</span>
              </button>
              <Link
                href={`/pesanan-saya/${pesananInvoice.kode_pesanan}`}
                className="px-4 py-2.5 rounded-xl border border-[#dce6de] text-[#17382d] hover:bg-[#eff4ee] text-xs font-bold"
              >
                Buka Tiket QR
              </Link>
            </div>
          </div>
        </div>
      )}

      {pesananBatalTarget && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#eef3ee]">
              <h3 className="text-sm font-bold text-[#17382d]">Konfirmasi Batalkan Pesanan</h3>
              <button
                type="button"
                onClick={() => setPesananBatalTarget(null)}
                className="text-stone-400 hover:text-stone-600 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pesanan <strong>{pesananBatalTarget.kode_pesanan}</strong>? Tindakan ini tidak dapat dibatalkan dan kuota tanggal akan dilepas kembali.
            </p>
            {pesanBatalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {pesanBatalError}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Alasan pembatalan (opsional):
              </label>
              <textarea
                rows={2}
                value={alasanBatalInput}
                onChange={(e) => setAlasanBatalInput(e.target.value)}
                placeholder="Contoh: Ingin mengubah jadwal atau menu"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl outline-none focus:border-[#17382d]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eef3ee]">
              <button
                type="button"
                disabled={sedangBatal}
                onClick={() => setPesananBatalTarget(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={sedangBatal}
                onClick={handleKonfirmasiBatal}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {sedangBatal ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                    <span>Membatalkan...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-ban text-xs"></i>
                    <span>Ya, Batalkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
