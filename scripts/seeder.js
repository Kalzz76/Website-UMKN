const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function muatEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const baris = fs.readFileSync(envPath, "utf-8").split("\n");
  const env = {};
  for (let i = 0; i < baris.length; i++) {
    const line = baris[i].trim();
    if (!line || !line.includes("=")) continue;
    const bagian = line.split("=");
    const kunci = bagian[0].trim();
    const nilai = bagian.slice(1).join("=").trim();
    env[kunci] = nilai;
  }
  return env;
}

async function jalankanSeeder() {
  const env = muatEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Gagal: URL atau Service Role Key Supabase tidak ditemukan di .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Memulai proses seeding database Supabase...");

  await supabase.from("pengaturan_toko").upsert({
    id: 1,
    nama_toko: "Cravely Bakery",
    slogan: "Buat hari lebih manis dengan kue terbaik kami ♡",
    alamat: "Jl. Melati No. 12, Jakarta Selatan",
    no_wa: "081234567890",
    jam_operasional: "Senin - Minggu: 08.00 - 20.00",
    jam_buka: "08:00:00",
    jam_tutup: "20:00:00",
    kuota_harian: 5,
    minimal_hari_pesan: 2,
    mode_pembayaran: "DP",
    persen_dp: 50,
    batas_bayar_jam: 24,
    nama_bank: "BCA",
    no_rekening: "1234567890",
    atas_nama: "Cravely Bakery",
  });

  const daftarGrup = [
    { nama: "Jenis Kue", urutan: 1, wajib: true, jenis_pilihan: "satu", peran_visual: "badan", peran_dashboard: "jenis" },
    { nama: "Ukuran", urutan: 2, wajib: true, jenis_pilihan: "satu", peran_visual: "ukuran", peran_dashboard: null },
    { nama: "Rasa", urutan: 3, wajib: true, jenis_pilihan: "satu", peran_visual: "badan", peran_dashboard: "terlaris" },
    { nama: "Krim", urutan: 4, wajib: true, jenis_pilihan: "satu", peran_visual: "krim", peran_dashboard: null },
    { nama: "Topping", urutan: 5, wajib: false, jenis_pilihan: "banyak", peran_visual: "topping", peran_dashboard: null },
  ];

  for (let i = 0; i < daftarGrup.length; i++) {
    const g = daftarGrup[i];
    const { data: grupDb } = await supabase
      .from("grup_opsi")
      .select("id")
      .eq("nama", g.nama)
      .maybeSingle();

    let grupId = grupDb ? grupDb.id : null;
    if (!grupId) {
      const { data: grupBaru } = await supabase
        .from("grup_opsi")
        .insert(g)
        .select("id")
        .single();
      grupId = grupBaru ? grupBaru.id : null;
    } else {
      await supabase.from("grup_opsi").update({ peran_dashboard: g.peran_dashboard }).eq("id", grupId);
    }

    if (!grupId) continue;

    let items = [];
    if (g.nama === "Jenis Kue") {
      items = [
        { nama: "Custom Cake", harga: 0, aktif: true, urutan: 1, warna: "#1e4b3c", kode_visual: "custom" },
        { nama: "Regular Cake", harga: 0, aktif: true, urutan: 2, warna: "#608d7c", kode_visual: "regular" },
        { nama: "Cupcake", harga: 0, aktif: true, urutan: 3, warna: "#b2cfbe", kode_visual: "cupcake" },
      ];
    } else if (g.nama === "Ukuran") {
      items = [
        { nama: "Kecil (15 cm)", harga: 80000, aktif: true, urutan: 1, kode_visual: "kecil" },
        { nama: "Sedang (20 cm)", harga: 150000, aktif: true, urutan: 2, kode_visual: "sedang" },
        { nama: "Besar (25 cm)", harga: 250000, aktif: true, urutan: 3, kode_visual: "besar" },
      ];
    } else if (g.nama === "Rasa") {
      items = [
        { nama: "Coklat", harga: 40000, aktif: true, urutan: 1, warna: "#5c3a21", kode_visual: "coklat" },
        { nama: "Vanilla", harga: 35000, aktif: true, urutan: 2, warna: "#fbf0d9", kode_visual: "vanilla" },
        { nama: "Strawberry", harga: 40000, aktif: true, urutan: 3, warna: "#f472b6", kode_visual: "strawberry" },
        { nama: "Red Velvet", harga: 45000, aktif: true, urutan: 4, warna: "#991b1b", kode_visual: "red_velvet" },
        { nama: "Matcha", harga: 45000, aktif: true, urutan: 5, warna: "#4d7c0f", kode_visual: "matcha" },
      ];
    } else if (g.nama === "Krim") {
      items = [
        { nama: "Buttercream Putih", harga: 20000, aktif: true, urutan: 1, warna: "#ffffff", kode_visual: "putih" },
        { nama: "Buttercream Pink", harga: 25000, aktif: true, urutan: 2, warna: "#fbcfe8", kode_visual: "pink" },
        { nama: "Buttercream Coklat", harga: 25000, aktif: true, urutan: 3, warna: "#78350f", kode_visual: "coklat" },
        { nama: "Cream Cheese", harga: 30000, aktif: true, urutan: 4, warna: "#fef3c7", kode_visual: "cream_cheese" },
      ];
    } else if (g.nama === "Topping") {
      items = [
        { nama: "Strawberry Segar", harga: 20000, aktif: true, urutan: 1, warna: "#ef4444", kode_visual: "strawberry" },
        { nama: "Coklat Chip", harga: 15000, aktif: true, urutan: 2, warna: "#451a03", kode_visual: "coklat_chip" },
        { nama: "Aneka Buah", harga: 25000, aktif: true, urutan: 3, warna: "#f59e0b", kode_visual: "buah" },
        { nama: "Lilin Ulang Tahun", harga: 10000, aktif: true, urutan: 4, warna: "#fbbf24", kode_visual: "lilin" },
      ];
    }

    for (let j = 0; j < items.length; j++) {
      const it = items[j];
      const { data: itemDb } = await supabase
        .from("opsi_item")
        .select("id")
        .eq("id_grup", grupId)
        .eq("nama", it.nama)
        .maybeSingle();

      if (!itemDb) {
        await supabase.from("opsi_item").insert({
          id_grup: grupId,
          ...it,
        });
      }
    }
  }

  const daftarZona = [
    { nama: "Zona 1 (Radius 0 - 5 km)", tarif: 15000, aktif: true },
    { nama: "Zona 2 (Radius 5 - 10 km)", tarif: 30000, aktif: true },
    { nama: "Zona 3 (Radius 10 - 20 km)", tarif: 50000, aktif: true },
  ];

  for (let i = 0; i < daftarZona.length; i++) {
    const z = daftarZona[i];
    const { data: zonaDb } = await supabase
      .from("zona_ongkir")
      .select("id")
      .eq("nama", z.nama)
      .maybeSingle();

    if (!zonaDb) {
      await supabase.from("zona_ongkir").insert(z);
    }
  }

  const daftarBahan = [
    { nama: "Tepung Terigu", satuan: "kg", jumlah: 50, batas_minimum: 10 },
    { nama: "Telur Ayam", satuan: "butir", jumlah: 200, batas_minimum: 30 },
    { nama: "Gula Pasir", satuan: "kg", jumlah: 40, batas_minimum: 8 },
    { nama: "Mentega", satuan: "kg", jumlah: 25, batas_minimum: 5 },
    { nama: "Coklat Bubuk", satuan: "kg", jumlah: 15, batas_minimum: 3 },
    { nama: "Whipping Cream", satuan: "liter", jumlah: 20, batas_minimum: 5 },
    { nama: "Strawberry Segar", satuan: "kg", jumlah: 10, batas_minimum: 2 },
  ];

  for (let i = 0; i < daftarBahan.length; i++) {
    const b = daftarBahan[i];
    const { data: bahanDb } = await supabase
      .from("bahan")
      .select("id")
      .eq("nama", b.nama)
      .maybeSingle();

    if (!bahanDb) {
      await supabase.from("bahan").insert(b);
    }
  }

  console.log("Seeding data berhasil diselesaikan!");
}

jalankanSeeder();
