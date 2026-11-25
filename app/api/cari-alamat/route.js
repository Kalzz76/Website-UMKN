import { NextResponse } from "next/server";
import { cekRateLimit } from "@/lib/rateLimit";

const cachePencarian = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request) {
  const ip = request.headers.get("x-forwarded-for") || "anonim";
  const { diizinkan } = cekRateLimit(`cari-alamat:${ip}`, 12, 10000);
  if (!diizinkan) {
    return NextResponse.json(
      { pesan: "Terlalu banyak permintaan pencarian. Tunggu beberapa detik.", hasil: [] },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng") ?? searchParams.get("lon");

  if (latParam !== null && lngParam !== null) {
    const lat = Number(latParam);
    const lng = Number(lngParam);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ alamat: "", hasil: [] }, { status: 400 });
    }

    const cacheKey = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
    const cached = cachePencarian.get(cacheKey);
    if (cached && Date.now() - cached.waktu < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=id`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "CravelyBakery/1.0 (halo@cravely.id)",
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        return NextResponse.json({ alamat: "", hasil: [] });
      }

      const data = await res.json();
      const alamat = data?.display_name || "";
      const payload = {
        alamat,
        hasil: alamat ? [{ display_name: alamat, lat, lon: lng }] : [],
      };

      cachePencarian.set(cacheKey, {
        waktu: Date.now(),
        data: payload,
      });

      return NextResponse.json(payload);
    } catch {
      return NextResponse.json({ alamat: "", hasil: [] });
    }
  }

  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length < 3) {
    return NextResponse.json({ hasil: [] });
  }

  const cacheKey = q.toLowerCase();
  const cached = cachePencarian.get(cacheKey);
  if (cached && Date.now() - cached.waktu < CACHE_TTL_MS) {
    return NextResponse.json({ hasil: cached.data });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=id&limit=5&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "CravelyBakery/1.0 (halo@cravely.id)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ hasil: [] });
    }

    const data = await res.json();
    const hasil = (data || []).map((item) => ({
      display_name: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon),
    }));

    cachePencarian.set(cacheKey, {
      waktu: Date.now(),
      data: hasil,
    });

    return NextResponse.json({ hasil });
  } catch {
    return NextResponse.json({ hasil: [] });
  }
}
