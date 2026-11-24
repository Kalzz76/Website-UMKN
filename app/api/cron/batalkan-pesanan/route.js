import { NextResponse } from "next/server";
import { batalkanKedaluwarsa } from "@/lib/kedaluwarsa";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { pesan: "Akses cron ditolak." },
      { status: 401 }
    );
  }

  const hasil = await batalkanKedaluwarsa(true);

  return NextResponse.json({
    pesan: "Pemeriksaan cron pembatalan otomatis selesai.",
    dibatalkan: hasil.dibatalkan,
  });
}
