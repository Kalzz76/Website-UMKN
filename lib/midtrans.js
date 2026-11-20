import crypto from "crypto";

export function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const isProduction =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ||
    (!serverKey.startsWith("SB-") && !clientKey.startsWith("SB-"));

  const snapUrl = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const snapScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return {
    serverKey,
    clientKey,
    isProduction,
    snapUrl,
    snapScriptUrl,
  };
}

export async function buatSnapToken({ orderId, grossAmount, nama, noWa, itemDetails = [] }) {
  const { serverKey, snapUrl } = getMidtransConfig();

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  }

  const authString = Buffer.from(`${serverKey}:`).toString("base64");

  const payload = {
    transaction_details: {
      order_id: String(orderId),
      gross_amount: Math.round(Number(grossAmount)),
    },
    customer_details: {
      first_name: nama || "Pelanggan Cravely",
      phone: noWa || "",
    },
  };

  if (Array.isArray(itemDetails) && itemDetails.length > 0) {
    payload.item_details = itemDetails.map((it) => ({
      id: String(it.id || "item"),
      price: Math.round(Number(it.price || it.harga || grossAmount)),
      quantity: Number(it.quantity || it.jumlah || 1),
      name: String(it.name || it.nama || "Item Kue").slice(0, 50),
    }));
  }

  const res = await fetch(snapUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify(payload),
  });

  const hasil = await res.json();

  if (!res.ok || !hasil.token) {
    throw new Error(hasil.error_messages ? hasil.error_messages.join(", ") : "Gagal membuat transaksi Snap.");
  }

  return hasil;
}

export function verifikasiSignatureKey({ orderId, statusCode, grossAmount, signatureKey }) {
  const { serverKey } = getMidtransConfig();
  if (!serverKey) return false;

  const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const hash = crypto.createHash("sha512").update(rawString).digest("hex");

  return hash === signatureKey;
}
