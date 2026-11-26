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
      let alamat = "";

      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1&accept-language=id`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "CravelyBakery/1.0 (halo@cravely.id)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const data = await res.json();
          alamat = data?.display_name || "";
        }
      } catch {}

      if (!alamat) {
        try {
          const urlPhoton = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
          const resPhoton = await fetch(urlPhoton, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000),
          });
          if (resPhoton.ok) {
            const ph = await resPhoton.json();
            const prop = ph?.features?.[0]?.properties;
            if (prop) {
              const bagian = [];
              if (prop.name) bagian.push(prop.name);
              if (prop.street && !bagian.includes(prop.street)) bagian.push(prop.street);
              if (prop.district && !bagian.includes(prop.district)) bagian.push(prop.district);
              if (prop.city && !bagian.includes(prop.city)) bagian.push(prop.city);
              if (prop.state && !bagian.includes(prop.state)) bagian.push(prop.state);
              if (prop.postcode) bagian.push(prop.postcode);
              if (prop.country && !bagian.includes(prop.country)) bagian.push(prop.country);
              alamat = bagian.join(", ");
            }
          }
        } catch {}
      }

      if (!alamat) {
        try {
          const urlBdc = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=id`;
          const resBdc = await fetch(urlBdc, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000),
          });
          if (resBdc.ok) {
            const fb = await resBdc.json();
            const bagian = [];
            if (fb.locality && !bagian.includes(fb.locality)) bagian.push(fb.locality);
            if (fb.city && !bagian.includes(fb.city)) bagian.push(fb.city);
            if (fb.principalSubdivision && !bagian.includes(fb.principalSubdivision)) bagian.push(fb.principalSubdivision);
            if (fb.postcode) bagian.push(fb.postcode);
            if (fb.countryName && !bagian.includes(fb.countryName)) bagian.push(fb.countryName);
            alamat = bagian.join(", ");
          }
        } catch {}
      }

      const payload = {
        alamat,
        hasil: alamat ? [{ display_name: alamat, lat, lon: lng }] : [],
      };

      if (alamat) {
        cachePencarian.set(cacheKey, {
          waktu: Date.now(),
          data: payload,
        });
      }

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
