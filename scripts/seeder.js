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

  const formatIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });
  const tglHariIni = formatIso.format(new Date());

  const akunDaftar = [
    {
      email: "petugas@cravely.com",
      password: "password123",
      nama: "Petugas Dapur Cravely",
      no_wa: "081234567899",
      role: "staf",
    },
    {
      email: "admin@cravely.com",
      password: "password123",
      nama: "Admin Cravely",
      no_wa: "081234567890",
      role: "admin",
    },
  ];

  for (let i = 0; i < akunDaftar.length; i++) {
    const akun = akunDaftar[i];
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = (listData?.users || []).find((u) => u.email === akun.email);

    let userId = existing ? existing.id : null;

    if (!existing) {
      const { data: userBaru } = await supabase.auth.admin.createUser({
        email: akun.email,
        password: akun.password,
        email_confirm: true,
        user_metadata: {
          nama: akun.nama,
          no_wa: akun.no_wa,
        },
      });

      if (userBaru?.user) {
        userId = userBaru.user.id;
      }
    } else {
      await supabase.auth.admin.updateUserById(userId, {
        password: akun.password,
        email_confirm: true,
      });
    }

    if (userId) {
      await supabase.from("profil").upsert({
        id: userId,
        nama: akun.nama,
        no_wa: akun.no_wa,
        role: akun.role,
        aktif: true,
      });
    }
  }

  const { count: pesananAda } = await supabase
    .from("pesanan")
    .select("*", { count: "exact", head: true });

  if (!pesananAda || pesananAda === 0) {
    const { data: pesananDb1 } = await supabase
      .from("pesanan")
      .insert({
        nama_penerima: "Siti Rahma",
        no_wa: "081298765432",
        tulisan_kue: "Happy Birthday Sarah 21st!",
        catatan: "Krim jangan terlalu manis, lilin tolong dipisah.",
        tanggal_ambil: tglHariIni,
        jam_ambil: "14:00:00",
        metode_pengiriman: "Ambil",
        status_pesanan: "Diterima",
        status_bayar: "Lunas",
        total_kue: 230000,
        total_bayar: 230000,
        jumlah_terbayar: 230000,
      })
      .select("id")
      .single();

    if (pesananDb1?.id) {
      await supabase.from("pesanan_pilihan").insert([
        {
          id_pesanan: pesananDb1.id,
          nama_grup: "Ukuran",
          nama_item: "Sedang (20 cm)",
          harga: 150000,
          kode_visual: "sedang",
          peran_visual: "ukuran",
        },
        {
          id_pesanan: pesananDb1.id,
          nama_grup: "Rasa",
          nama_item: "Vanilla",
          harga: 35000,
          warna: "#fbf0d9",
          kode_visual: "vanilla",
          peran_visual: "badan",
        },
        {
          id_pesanan: pesananDb1.id,
          nama_grup: "Krim",
          nama_item: "Buttercream Pink",
          harga: 25000,
          warna: "#fbcfe8",
          kode_visual: "pink",
          peran_visual: "krim",
        },
        {
          id_pesanan: pesananDb1.id,
          nama_grup: "Topping",
          nama_item: "Strawberry Segar",
          harga: 20000,
          warna: "#ef4444",
          kode_visual: "strawberry",
          peran_visual: "topping",
        },
      ]);

      await supabase.from("riwayat_pesanan").insert({
        id_pesanan: pesananDb1.id,
        keterangan: "Pesanan masuk dan diterima dapur produksi.",
      });
    }

    const { data: pesananDb2 } = await supabase
      .from("pesanan")
      .insert({
        nama_penerima: "Budi Santoso",
        no_wa: "081311223344",
        tulisan_kue: "Anniversary 5th Budi & Linda",
        catatan: "Antar hati-hati, jangan sampai miring.",
        tanggal_ambil: tglHariIni,
        jam_ambil: "16:30:00",
        metode_pengiriman: "Kirim",
        alamat: "Jl. Kemang Raya No. 45, Jakarta Selatan",
        ongkir: 15000,
        status_pesanan: "Sedang Dibuat",
        status_bayar: "DP Dibayar",
        total_kue: 230000,
        total_bayar: 245000,
        jumlah_dp: 122500,
        jumlah_terbayar: 122500,
      })
      .select("id")
      .single();

    if (pesananDb2?.id) {
      await supabase.from("pesanan_pilihan").insert([
        {
          id_pesanan: pesananDb2.id,
          nama_grup: "Ukuran",
          nama_item: "Sedang (20 cm)",
          harga: 150000,
          kode_visual: "sedang",
          peran_visual: "ukuran",
        },
        {
          id_pesanan: pesananDb2.id,
          nama_grup: "Rasa",
          nama_item: "Coklat",
          harga: 40000,
          warna: "#5c3a21",
          kode_visual: "coklat",
          peran_visual: "badan",
        },
        {
          id_pesanan: pesananDb2.id,
          nama_grup: "Krim",
          nama_item: "Buttercream Coklat",
          harga: 25000,
          warna: "#78350f",
          kode_visual: "coklat",
          peran_visual: "krim",
        },
        {
          id_pesanan: pesananDb2.id,
          nama_grup: "Topping",
          nama_item: "Coklat Chip",
          harga: 15000,
          warna: "#451a03",
          kode_visual: "coklat_chip",
          peran_visual: "topping",
        },
      ]);

      await supabase.from("riwayat_pesanan").insert({
        id_pesanan: pesananDb2.id,
        keterangan: "Pesanan mulai dibuat di dapur produksi.",
      });
    }
  }

  console.log("Seeding data berhasil diselesaikan!");
}

jalankanSeeder();
