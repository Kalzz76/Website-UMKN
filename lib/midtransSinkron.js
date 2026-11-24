import { getSupabaseAdmin } from "./supabaseServer";

export async function sinkronkanStatusMidtrans({
  orderId,
  statusCode,
  grossAmount,
  transactionStatus,
  paymentType,
  fraudStatus,
}) {
  const supabase = getSupabaseAdmin();

  let statusDb = "Gagal";
  const ts = (transactionStatus || "").toLowerCase();
  const fs = (fraudStatus || "").toLowerCase();

  if (ts === "settlement" || (ts === "capture" && (fs === "accept" || !fs))) {
    statusDb = "Dikonfirmasi";
  } else if (ts === "pending") {
    statusDb = "Menunggu";
  } else if (["deny", "cancel", "failure"].includes(ts)) {
    statusDb = "Gagal";
  } else if (ts === "expire") {
    statusDb = "Kedaluwarsa";
  }

  const { data: bayarExisting } = await supabase
    .from("pembayaran")
    .select("*, pesanan(*)")
    .or(`midtrans_order_id.eq.${orderId},bukti.eq.midtrans-${orderId}`)
    .maybeSingle();

  let pembayaran = bayarExisting;
  let pesanan = bayarExisting?.pesanan;

  if (!pembayaran) {
    const parts = String(orderId).split("-");
    if (parts.length >= 2) {
      const kodePesanan = `${parts[0]}-${parts[1]}`;
      const jenisRaw = (parts[2] || "LUNAS").toUpperCase();
      let jenisBayar = "Lunas";
      if (jenisRaw === "DP") {
        jenisBayar = "DP";
      } else if (jenisRaw === "PELUNASAN") {
        jenisBayar = "Pelunasan";
      }

      const { data: pData } = await supabase
        .from("pesanan")
        .select("*")
        .eq("kode_pesanan", kodePesanan)
        .maybeSingle();

      if (pData) {
        pesanan = pData;
        const nominal = Math.round(Number(grossAmount || 0));
        let metodeDb = "QRIS";
        const ptLower = (paymentType || "").toLowerCase();
        if (ptLower.includes("bank") || ptLower.includes("va") || ptLower.includes("transfer")) {
          metodeDb = "Transfer Bank";
        }

        const { data: newBayar } = await supabase
          .from("pembayaran")
          .insert({
            id_pesanan: pData.id,
            jenis: jenisBayar,
            jumlah: nominal,
            metode: metodeDb,
            bukti: `midtrans-${orderId}`,
            midtrans_order_id: orderId,
            status: statusDb,
          })
          .select("*, pesanan(*)")
          .single();

        pembayaran = newBayar;
      }
    }
  }

  if (!pembayaran || !pesanan) {
    return {
      sukses: false,
      pesan: "Pembayaran atau pesanan tidak ditemukan di database.",
    };
  }

  const nominalGross = Math.round(Number(grossAmount || 0));
  if (nominalGross > 0 && Number(pembayaran.jumlah) > 0 && nominalGross !== Number(pembayaran.jumlah)) {
    return {
      sukses: false,
      pesan: `gross_amount (${nominalGross}) tidak cocok dengan tagihan pembayaran (${pembayaran.jumlah}).`,
    };
  }

  if (statusDb === "Dikonfirmasi") {
    if (pembayaran.status === "Dikonfirmasi") {
      return {
        sukses: true,
        sudahDiproses: true,
        status: "Dikonfirmasi",
        status_bayar: pesanan.status_bayar,
        status_pesanan: pesanan.status_pesanan,
      };
    }

    const waktuKonfirmasi = new Date().toISOString();

    await supabase
      .from("pembayaran")
      .update({
        status: "Dikonfirmasi",
        dikonfirmasi_pada: waktuKonfirmasi,
      })
      .eq("id", pembayaran.id);

    const { data: pesananTerkini } = await supabase
      .from("pesanan")
      .select("*")
      .eq("id", pesanan.id)
      .single();

    if (pesananTerkini?.status_pesanan === "Dibatalkan") {
      await supabase
        .from("pesanan")
        .update({
          perlu_refund: true,
        })
        .eq("id", pesanan.id);

      await supabase.from("riwayat_pesanan").insert({
        id_pesanan: pesanan.id,
        keterangan: "Dibayar lewat Midtrans",
        id_user: null,
      });

      return {
        sukses: true,
        status: "Dikonfirmasi",
        perlu_refund: true,
        status_pesanan: "Dibatalkan",
      };
    }

    const { data: semuaBayar } = await supabase
      .from("pembayaran")
      .select("jumlah")
      .eq("id_pesanan", pesanan.id)
      .eq("status", "Dikonfirmasi");

    const totalTerbayar = (semuaBayar || []).reduce(
      (acc, cur) => acc + Number(cur.jumlah || 0),
      0
    );

    let statusBaru = pesanan.status_bayar;
    if (totalTerbayar >= pesanan.total_bayar) {
      statusBaru = "Lunas";
    } else if (totalTerbayar > 0) {
      statusBaru = "DP Dibayar";
    }

    let statusPesananBaru = pesanan.status_pesanan;
    if (pesanan.status_pesanan === "Menunggu Pembayaran") {
      statusPesananBaru = "Diterima";
    }

    await supabase
      .from("pesanan")
      .update({
        jumlah_terbayar: totalTerbayar,
        status_bayar: statusBaru,
        status_pesanan: statusPesananBaru,
      })
      .eq("id", pesanan.id);

    await supabase.from("riwayat_pesanan").insert({
      id_pesanan: pesanan.id,
      keterangan: "Dibayar lewat Midtrans",
      id_user: null,
    });

    return {
      sukses: true,
      status: "Dikonfirmasi",
      status_bayar: statusBaru,
      status_pesanan: statusPesananBaru,
      jumlah_terbayar: totalTerbayar,
    };
  }

  if (pembayaran.status !== statusDb) {
    await supabase
      .from("pembayaran")
      .update({
        status: statusDb,
      })
      .eq("id", pembayaran.id);
  }

  return {
    sukses: true,
    status: statusDb,
    status_bayar: pesanan.status_bayar,
    status_pesanan: pesanan.status_pesanan,
  };
}
