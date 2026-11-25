import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabaseServer";
import { chargeCoreApi, cekStatusMidtrans, batalkanTransaksiMidtrans } from "@/lib/midtrans";
import { sinkronkanStatusMidtrans } from "@/lib/midtransSinkron";
import { cekRateLimit } from "@/lib/rateLimit";

// Detail transaksi Core API disimpan di kolom snap_token dengan prefix "core:"
// supaya tidak butuh migrasi skema.
const PREFIX = "core:";

const METODE = {
  qris: { label: "QRIS", metodeDb: "QRIS", menitMaks: 15 },
  bca: { label: "BCA Virtual Account", metodeDb: "Transfer Bank", bank: "bca" },
  bni: { label: "BNI Virtual Account", metodeDb: "Transfer Bank", bank: "bni" },
  bri: { label: "BRI Virtual Account", metodeDb: "Transfer Bank", bank: "bri" },
  permata: { label: "Permata Virtual Account", metodeDb: "Transfer Bank", bank: "permata" },
  mandiri: { label: "Mandiri Bill Payment", metodeDb: "Transfer Bank" },
};

function bacaDetail(row) {
  if (!row?.snap_token?.startsWith(PREFIX)) return null;
  try {
    return JSON.parse(row.snap_token.slice(PREFIX.length));
  } catch {
    return null;
  }
}

// "2026-11-25 10:11:23" (WIB) -> ISO
function waktuMidtransKeIso(str) {
  if (!str) return null;
  const d = new Date(`${str.replace(" ", "T")}+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function muatPesanan(kode) {
  const supabaseUser = await getSupabaseServer();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return { error: ["Silakan masuk terlebih dahulu.", 401] };
  if (!kode) return { error: ["Kode pesanan wajib disertakan.", 400] };

  const supabase = getSupabaseAdmin();
  const { data: pesanan } = await supabase
    .from("pesanan")
    .select("*")
    .eq("kode_pesanan", kode)
    .single();
  if (!pesanan) return { error: ["Pesanan tidak ditemukan.", 404] };
  if (pesanan.id_pelanggan !== user.id) {
    return { error: ["Akses ditolak. Pesanan ini bukan milik Anda.", 403] };
  }

  const { data: pengaturan } = await supabase
    .from("pengaturan_toko")
    .select("batas_bayar_jam")
    .eq("id", 1)
    .single();
  const batasJam = Number(pengaturan?.batas_bayar_jam ?? 24);
  const batasBayarMs = new Date(pesanan.dibuat_pada).getTime() + batasJam * 3600000;

  return { user, supabase, pesanan, batasBayarMs };
}

function hitungTagihan(pesanan) {
  const total = Number(pesanan.total_bayar || 0);
  const terbayar = Number(pesanan.jumlah_terbayar || 0);
  const sisa = Math.max(0, total - terbayar);
  const dp = Number(pesanan.jumlah_dp || 0);

  if (terbayar > 0 || pesanan.status_bayar === "DP Dibayar") {
    return { nominal: sisa, jenis: "Pelunasan" };
  }
  if (dp > 0 && dp < total) {
    return { nominal: dp, jenis: "DP" };
  }
  return { nominal: total, jenis: "Lunas" };
}

function ringkasPesanan(pesanan, batasBayarMs) {
  const tagihan = hitungTagihan(pesanan);
  return {
    kode_pesanan: pesanan.kode_pesanan,
    nama_penerima: pesanan.nama_penerima,
    metode_pengiriman: pesanan.metode_pengiriman,
    tanggal_ambil: pesanan.tanggal_ambil,
    jam_ambil: pesanan.jam_ambil,
    total_bayar: Number(pesanan.total_bayar || 0),
    jumlah_terbayar: Number(pesanan.jumlah_terbayar || 0),
    status_pesanan: pesanan.status_pesanan,
    status_bayar: pesanan.status_bayar,
    batas_bayar: new Date(batasBayarMs).toISOString(),
    nominal_tagihan: tagihan.nominal,
    jenis_tagihan: tagihan.jenis,
  };
}

async function tagihanAktif(supabase, idPesanan) {
  const { data: rows } = await supabase
    .from("pembayaran")
    .select("*")
    .eq("id_pesanan", idPesanan)
    .eq("status", "Menunggu")
    .order("dibuat_pada", { ascending: false });

  for (const row of rows || []) {
    const detail = bacaDetail(row);
    if (detail && new Date(detail.kedaluwarsa).getTime() > Date.now()) {
      return { row, detail };
    }
  }
  return null;
}

function bolehBayar(pesanan, batasBayarMs) {
  if (["Selesai", "Dibatalkan"].includes(pesanan.status_pesanan)) {
    return `Pesanan telah ${pesanan.status_pesanan.toLowerCase()} dan tidak dapat dibayar.`;
  }
  if (pesanan.status_bayar === "Lunas") return "Pesanan ini sudah lunas.";
  if (pesanan.status_pesanan === "Menunggu Pembayaran" && batasBayarMs <= Date.now()) {
    return "Batas waktu pembayaran telah habis.";
  }
  return null;
}

export async function GET(request) {
  const kode = new URL(request.url).searchParams.get("kode");
  const hasil = await muatPesanan(kode);
  if (hasil.error) {
    return NextResponse.json({ pesan: hasil.error[0] }, { status: hasil.error[1] });
  }
  const { supabase, pesanan, batasBayarMs } = hasil;
  const aktif = await tagihanAktif(supabase, pesanan.id);

  return NextResponse.json({
    pesanan: ringkasPesanan(pesanan, batasBayarMs),
    tagihan: aktif ? aktif.detail : null,
    alasan_tidak_bisa_bayar: bolehBayar(pesanan, batasBayarMs),
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const metode = String(body.metode || "").toLowerCase();
    const cfg = METODE[metode];
    if (!cfg) {
      return NextResponse.json({ pesan: "Metode pembayaran tidak dikenal." }, { status: 400 });
    }

    const hasil = await muatPesanan(body.kode);
    if (hasil.error) {
      return NextResponse.json({ pesan: hasil.error[0] }, { status: hasil.error[1] });
    }
    const { user, supabase, pesanan, batasBayarMs } = hasil;

    const { diizinkan, tungguDetik } = cekRateLimit(`charge:${user.id}`, 8, 30000);
    if (!diizinkan) {
      return NextResponse.json(
        { pesan: `Terlalu banyak permintaan. Coba lagi dalam ${tungguDetik} detik.` },
        { status: 429 }
      );
    }

    const alasan = bolehBayar(pesanan, batasBayarMs);
    if (alasan) return NextResponse.json({ pesan: alasan }, { status: 400 });

    // Pakai ulang tagihan yang masih aktif dengan metode yang sama.
    const aktif = await tagihanAktif(supabase, pesanan.id);
    if (aktif && aktif.detail.metode === metode && !body.buat_baru) {
      return NextResponse.json({ sukses: true, tagihan: aktif.detail });
    }

    // Tagihan lama (metode lain / diminta baru): cek dulu, lalu batalkan.
    const { data: menunggu } = await supabase
      .from("pembayaran")
      .select("*")
      .eq("id_pesanan", pesanan.id)
      .eq("status", "Menunggu");

    for (const row of menunggu || []) {
      if (!row.midtrans_order_id) continue;
      try {
        const st = await cekStatusMidtrans(row.midtrans_order_id);
        if (st?.transaction_status) {
          const sync = await sinkronkanStatusMidtrans({
            orderId: st.order_id || row.midtrans_order_id,
            statusCode: st.status_code,
            grossAmount: st.gross_amount,
            transactionStatus: st.transaction_status,
            paymentType: st.payment_type,
            fraudStatus: st.fraud_status,
          });
          if (sync?.status === "Dikonfirmasi") {
            return NextResponse.json({ sukses: true, sudah_dibayar: true });
          }
        }
      } catch {}
      await batalkanTransaksiMidtrans(row.midtrans_order_id);
      await supabase
        .from("pembayaran")
        .update({ status: "Gagal" })
        .eq("id", row.id)
        .eq("status", "Menunggu");
    }

    const { nominal, jenis } = hitungTagihan(pesanan);
    if (nominal <= 0) {
      return NextResponse.json({ pesan: "Nominal pembayaran tidak valid." }, { status: 400 });
    }

    const sisaMenitOrder =
      pesanan.status_pesanan === "Menunggu Pembayaran"
        ? Math.floor((batasBayarMs - Date.now()) / 60000)
        : 24 * 60;
    const menit = Math.max(1, Math.min(sisaMenitOrder, cfg.menitMaks || 24 * 60));

    const { count } = await supabase
      .from("pembayaran")
      .select("id", { count: "exact", head: true })
      .eq("id_pesanan", pesanan.id);
    const orderId = `${pesanan.kode_pesanan}-${jenis.toUpperCase()}-${(count || 0) + 1}`;

    const payload = {
      transaction_details: { order_id: orderId, gross_amount: Math.round(nominal) },
      customer_details: {
        first_name: pesanan.nama_penerima || "Pelanggan Cravely",
        phone: pesanan.no_wa || "",
        email: user.email || undefined,
      },
      item_details: [
        {
          id: pesanan.kode_pesanan,
          price: Math.round(nominal),
          quantity: 1,
          name: `Pesanan ${pesanan.kode_pesanan} (${jenis})`.slice(0, 50),
        },
      ],
      custom_expiry: { expiry_duration: menit, unit: "minute" },
    };

    if (metode === "qris") {
      payload.payment_type = "qris";
      payload.qris = { acquirer: "gopay" };
    } else if (metode === "mandiri") {
      payload.payment_type = "echannel";
      payload.echannel = { bill_info1: "Pesanan", bill_info2: pesanan.kode_pesanan };
    } else {
      payload.payment_type = "bank_transfer";
      payload.bank_transfer = { bank: cfg.bank };
    }

    const res = await chargeCoreApi(payload);

    const detail = {
      metode,
      label: cfg.label,
      order_id: orderId,
      nominal: Math.round(nominal),
      jenis,
      kedaluwarsa:
        waktuMidtransKeIso(res.expiry_time) || new Date(Date.now() + menit * 60000).toISOString(),
    };

    if (metode === "qris") {
      detail.qr_string = res.qr_string || "";
      detail.qr_url = res.actions?.find((a) => a.name === "generate-qr-code")?.url || "";
    } else if (metode === "mandiri") {
      detail.biller_code = res.biller_code;
      detail.bill_key = res.bill_key;
    } else if (metode === "permata") {
      detail.va_number = res.permata_va_number || res.va_numbers?.[0]?.va_number;
    } else {
      detail.va_number = res.va_numbers?.[0]?.va_number;
    }

    const { error: errInsert } = await supabase.from("pembayaran").insert({
      id_pesanan: pesanan.id,
      jenis,
      jumlah: Math.round(nominal),
      metode: cfg.metodeDb,
      bukti: `midtrans-${orderId}`,
      midtrans_order_id: orderId,
      snap_token: PREFIX + JSON.stringify(detail),
      status: "Menunggu",
    });

    if (errInsert) {
      await batalkanTransaksiMidtrans(orderId);
      return NextResponse.json({ pesan: "Gagal menyimpan tagihan pembayaran." }, { status: 500 });
    }

    return NextResponse.json({ sukses: true, tagihan: detail });
  } catch (err) {
    return NextResponse.json(
      { pesan: err.message || "Gagal membuat tagihan pembayaran." },
      { status: 500 }
    );
  }
}
