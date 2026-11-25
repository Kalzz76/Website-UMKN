import crypto from "crypto";

export function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const isProduction =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

  const snapUrl = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const snapScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const apiUrl = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  return {
    serverKey,
    clientKey,
    isProduction,
    snapUrl,
    snapScriptUrl,
    apiUrl,
  };
}

export async function buatSnapToken({
  orderId,
  grossAmount,
  nama,
  noWa,
  email,
  itemDetails = [],
  customExpiryMinute,
}) {
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
      email: email || undefined,
    },
  };

  if (customExpiryMinute && Number(customExpiryMinute) > 0) {
    payload.custom_expiry = {
      expiry_duration: Math.max(1, Math.round(Number(customExpiryMinute))),
      unit: "minute",
    };
  }

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
    throw new Error(
      hasil.error_messages
        ? hasil.error_messages.join(", ")
        : hasil.status_message || hasil.error || "Gagal membuat transaksi Snap."
    );
  }

  return hasil;
}

export async function chargeCoreApi(payload) {
  const { serverKey, apiUrl } = getMidtransConfig();

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  }

  const authString = Buffer.from(`${serverKey}:`).toString("base64");

  const res = await fetch(`${apiUrl}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const hasil = await res.json();
  const kode = Number(hasil.status_code);

  if (!res.ok || (kode !== 200 && kode !== 201)) {
    throw new Error(
      hasil.validation_messages?.join(", ") ||
        hasil.status_message ||
        "Gagal membuat transaksi pembayaran."
    );
  }

  return hasil;
}

export async function cekStatusMidtrans(orderId) {
  const { serverKey, apiUrl } = getMidtransConfig();

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  }

  const authString = Buffer.from(`${serverKey}:`).toString("base64");

  const res = await fetch(`${apiUrl}/${encodeURIComponent(orderId)}/status`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${authString}`,
    },
    cache: "no-store",
  });

  return await res.json();
}

export function verifikasiSignatureKey({ orderId, statusCode, grossAmount, signatureKey }) {
  const { serverKey } = getMidtransConfig();
  const sigSecret = process.env.MIDTRANS_SIGNATURE_KEY || serverKey;
  if (!sigSecret) return false;

  const rawString = `${orderId}${statusCode}${grossAmount}${sigSecret}`;
  const hash = crypto.createHash("sha512").update(rawString).digest("hex");

  return hash === signatureKey;
}

export async function batalkanTransaksiMidtrans(orderId) {
  const { serverKey, apiUrl } = getMidtransConfig();
  if (!serverKey || !orderId) return null;

  const authString = Buffer.from(`${serverKey}:`).toString("base64");

  try {
    const res = await fetch(`${apiUrl}/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      cache: "no-store",
    });

    return await res.json();
  } catch {
    return null;
  }
}
