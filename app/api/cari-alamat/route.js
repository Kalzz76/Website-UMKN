import { NextResponse } from "next/server";

const cachePencarian = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
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
