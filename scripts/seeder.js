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
    { nama: "Jenis Kue", urutan: 1, wajib: true, jenis_pilihan: "satu", peran_visual: null, peran_dashboard: "jenis" },
    { nama: "Ukuran", urutan: 2, wajib: true, jenis_pilihan: "satu", peran_visual: "ukuran", peran_dashboard: null },
    { nama: "Bentuk", urutan: 3, wajib: true, jenis_pilihan: "satu", peran_visual: "bentuk", peran_dashboard: null },
    { nama: "Rasa", urutan: 4, wajib: true, jenis_pilihan: "satu", peran_visual: "badan", peran_dashboard: "terlaris" },
    { nama: "Isian", urutan: 5, wajib: true, jenis_pilihan: "satu", peran_visual: null, peran_dashboard: null },
    { nama: "Warna Krim", urutan: 6, wajib: true, jenis_pilihan: "satu", peran_visual: "krim", peran_dashboard: null },
    { nama: "Dekorasi", urutan: 7, wajib: false, jenis_pilihan: "banyak", peran_visual: "topping", peran_dashboard: null },
    { nama: "Elemen Hiasan", urutan: 8, wajib: false, jenis_pilihan: "banyak", peran_visual: "stiker", peran_dashboard: null },
    { nama: "Desain Kustom", urutan: 9, wajib: false, jenis_pilihan: "banyak", peran_visual: null, peran_dashboard: null },
  ];

  await supabase.from("grup_opsi").update({ nama: "Warna Krim" }).eq("nama", "Krim");
  await supabase.from("grup_opsi").update({ nama: "Elemen Hiasan" }).eq("nama", "Stiker & Topper");

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
      await supabase.from("grup_opsi").update(g).eq("id", grupId);
    }

    if (!grupId) continue;

    let items = [];
    if (g.nama === "Jenis Kue") {
      items = [
        { nama: "Custom Cake", harga: 0, aktif: true, urutan: 1, warna: "#1e4b3c", kode_visual: "custom" },
        { nama: "Template Siap Pakai", harga: 0, aktif: true, urutan: 2, warna: "#608d7c", kode_visual: "template" },
      ];
    } else if (g.nama === "Ukuran") {
      items = [
        { nama: "Mini Ø10", harga: 85000, aktif: true, urutan: 1, kode_visual: "mini" },
        { nama: "Small Ø14", harga: 125000, aktif: true, urutan: 2, kode_visual: "small" },
        { nama: "Medium Ø18", harga: 165000, aktif: true, urutan: 3, kode_visual: "medium" },
        { nama: "Large Ø22", harga: 210000, aktif: true, urutan: 4, kode_visual: "large" },
      ];
    } else if (g.nama === "Bentuk") {
      items = [
        { nama: "Lingkaran", harga: 0, aktif: true, urutan: 1, kode_visual: "round" },
        { nama: "Kotak", harga: 0, aktif: true, urutan: 2, kode_visual: "square" },
        { nama: "Hati", harga: 10000, aktif: true, urutan: 3, kode_visual: "heart" },
        { nama: "Bintang", harga: 15000, aktif: true, urutan: 4, kode_visual: "star" },
        { nama: "Hexagon", harga: 10000, aktif: true, urutan: 5, kode_visual: "hex" },
        { nama: "Buat Sendiri", harga: 25000, aktif: true, urutan: 6, kode_visual: "custom" },
      ];
    } else if (g.nama === "Rasa") {
      items = [
        { nama: "Vanilla", harga: 0, aktif: true, urutan: 1, warna: "#fbefd5", kode_visual: "vanilla" },
        { nama: "Cokelat", harga: 10000, aktif: true, urutan: 2, warna: "#8a5a3c", kode_visual: "choco" },
        { nama: "Red Velvet", harga: 15000, aktif: true, urutan: 3, warna: "#c0404e", kode_visual: "velvet" },
        { nama: "Stroberi", harga: 10000, aktif: true, urutan: 4, warna: "#f9cdd6", kode_visual: "straw" },
      ];
    } else if (g.nama === "Isian") {
      items = [
        { nama: "Krim Vanilla", harga: 0, aktif: true, urutan: 1, warna: "#fffaf0", kode_visual: "cream" },
        { nama: "Ganache Cokelat", harga: 8000, aktif: true, urutan: 2, warna: "#5b3322", kode_visual: "ganache" },
        { nama: "Selai Stroberi", harga: 5000, aktif: true, urutan: 3, warna: "#d6304a", kode_visual: "jam" },
        { nama: "Cream Cheese", harga: 12000, aktif: true, urutan: 4, warna: "#fff0c9", kode_visual: "cheese" },
      ];
    } else if (g.nama === "Warna Krim") {
      items = [
        { nama: "Pink", harga: 0, aktif: true, urutan: 1, warna: "#f6b4c2", kode_visual: "pink" },
        { nama: "Putih", harga: 0, aktif: true, urutan: 2, warna: "#FFF8F0", kode_visual: "putih" },
        { nama: "Cokelat", harga: 0, aktif: true, urutan: 3, warna: "#6b3d2a", kode_visual: "coklat" },
        { nama: "Mint", harga: 0, aktif: true, urutan: 4, warna: "#bfe8d8", kode_visual: "mint" },
        { nama: "Kuning", harga: 0, aktif: true, urutan: 5, warna: "#fbe39a", kode_visual: "kuning" },
        { nama: "Lavender", harga: 0, aktif: true, urutan: 6, warna: "#d8c7f0", kode_visual: "lavender" },
      ];
    } else if (g.nama === "Dekorasi") {
      items = [
        { nama: "Lelehan Krim", harga: 12000, aktif: true, urutan: 1, warna: "#451a03", kode_visual: "drip" },
        { nama: "Stroberi", harga: 10000, aktif: true, urutan: 2, warna: "#ef4444", kode_visual: "straw" },
        { nama: "Mixed Berry", harga: 15000, aktif: true, urutan: 3, warna: "#4338ca", kode_visual: "berry" },
        { nama: "Bunga Gula", harga: 8000, aktif: true, urutan: 4, warna: "#f472b6", kode_visual: "flower" },
        { nama: "Taburan", harga: 5000, aktif: true, urutan: 5, warna: "#f59e0b", kode_visual: "spr" },
        { nama: "Lilin", harga: 3000, aktif: true, urutan: 6, warna: "#fbbf24", kode_visual: "candle" },
      ];
    } else if (g.nama === "Elemen Hiasan") {
      items = [
        { nama: "Stiker", harga: 5000, aktif: true, urutan: 1, kode_visual: "stiker" },
        { nama: "Topper", harga: 5000, aktif: true, urutan: 2, kode_visual: "topper" },
        { nama: "Bunga", harga: 5000, aktif: true, urutan: 3, kode_visual: "bunga" },
        { nama: "Buah", harga: 5000, aktif: true, urutan: 4, kode_visual: "buah" },
        { nama: "Cokelat", harga: 5000, aktif: true, urutan: 5, kode_visual: "cokelat" },
      ];
    } else if (g.nama === "Desain Kustom") {
      items = [
        { nama: "Gambar Kustom", harga: 20000, aktif: true, urutan: 1, kode_visual: "gambar_kustom" },
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
      } else {
        await supabase.from("opsi_item").update({
          ...it,
        }).eq("id", itemDb.id);
      }
    }
  }

  const itemNonaktif = [
    "Regular Cake", "Cupcake",
    "Kecil (15 cm)", "Sedang (20 cm)", "Besar (25 cm)",
    "Mini (10 cm, 1-2 orang)", "Kecil (14 cm, 3-5 orang)", "Sedang (18 cm, 6-10 orang)", "Besar (22 cm, 10-15 orang)",
    "Kucing Custom",
    "Matcha",
    "Buttercream Putih", "Buttercream Pink", "Buttercream Coklat",
    "Stroberi Segar", "Taburan Sprinkles", "Lilin Ulang Tahun", "Coklat Chip", "Aneka Buah",
    "Stiker Karakter", "Topper Kue", "Hiasan Bunga", "Buah Mini", "Cokelat Mini", "Aksesoris Lainnya",
  ];
  for (let k = 0; k < itemNonaktif.length; k++) {
    await supabase.from("opsi_item").update({ aktif: false }).eq("nama", itemNonaktif[k]);
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

if (process.argv.includes("--confirm")) {
  jalankanSeeder();
} else {
  console.log("Peringatan: Seeder database diblokir untuk mencegah penulisan data yang tidak disengaja. Jalankan dengan argumen --confirm jika memang ingin mengeksekusi.");
  process.exit(0);
}
