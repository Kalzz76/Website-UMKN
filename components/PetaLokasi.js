"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export default function PetaLokasi({
  lat,
  lng,
  onChange,
  latToko,
  lngToko,
  mode = "pelanggan",
  noWaToko = "",
  tinggi = "320px",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markerTokoRef = useRef(null);
  const LRef = useRef(null);

  const [memuatPeta, setMemuatPeta] = useState(true);
  const [gagalPeta, setGagalPeta] = useState(false);
  const [memuatLokasi, setMemuatLokasi] = useState(false);
  const [pesanLokasi, setPesanLokasi] = useState("");

  const defaultPusat =
    latToko !== null && latToko !== undefined && lngToko !== null && lngToko !== undefined && !isNaN(Number(latToko)) && !isNaN(Number(lngToko))
      ? [Number(latToko), Number(lngToko)]
      : [-2.5489, 118.0149];
  const defaultZoom =
    latToko !== null && latToko !== undefined && lngToko !== null && lngToko !== undefined && !isNaN(Number(latToko)) && !isNaN(Number(lngToko))
      ? 13
      : 5;

  useEffect(() => {
    let aktif = true;

    async function inisialisasi() {
      try {
        const leafletModule = await import("leaflet");
        const L = leafletModule.default || leafletModule;
        LRef.current = L;

        if (!aktif || !containerRef.current) return;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = L.map(containerRef.current, {
          center: defaultPusat,
          zoom: defaultZoom,
          zoomControl: true,
        });
        mapRef.current = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const ikonToko = L.divIcon({
          className: "peta-marker-toko-icon",
          html: '<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#7D2330;border:2px solid #ffffff;border-radius:50%;box-shadow:0 3px 6px rgba(0,0,0,0.3);color:#ffffff;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const ikonTujuan = L.divIcon({
          className: "peta-marker-tujuan-icon",
          html: '<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#e11d48;border:2px solid #ffffff;border-radius:50%;box-shadow:0 4px 8px rgba(0,0,0,0.35);color:#ffffff;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        if (
          mode !== "toko" &&
          latToko !== null &&
          latToko !== undefined &&
          lngToko !== null &&
          lngToko !== undefined &&
          !isNaN(Number(latToko)) &&
          !isNaN(Number(lngToko))
        ) {
          markerTokoRef.current = L.marker([Number(latToko), Number(lngToko)], {
            icon: ikonToko,
            interactive: true,
          })
            .addTo(map)
            .bindPopup("<strong>Lokasi Toko Cravely</strong>");
        }

        const initialLat = lat !== null && lat !== undefined && !isNaN(Number(lat)) ? Number(lat) : null;
        const initialLng = lng !== null && lng !== undefined && !isNaN(Number(lng)) ? Number(lng) : null;

        if (initialLat !== null && initialLng !== null) {
          const markerBaru = L.marker([initialLat, initialLng], {
            icon: mode === "toko" ? ikonToko : ikonTujuan,
            draggable: true,
          }).addTo(map);

          markerBaru.on("dragend", (e) => {
            const pos = e.target.getLatLng();
            if (onChange) onChange({ lat: pos.lat, lng: pos.lng });
          });

          markerRef.current = markerBaru;
          map.setView([initialLat, initialLng], 15);
        }

        map.on("click", (e) => {
          const clickedLat = e.latlng.lat;
          const clickedLng = e.latlng.lng;

          if (markerRef.current) {
            markerRef.current.setLatLng([clickedLat, clickedLng]);
          } else {
            const m = L.marker([clickedLat, clickedLng], {
              icon: mode === "toko" ? ikonToko : ikonTujuan,
              draggable: true,
            }).addTo(map);

            m.on("dragend", (ev) => {
              const pos = ev.target.getLatLng();
              if (onChange) onChange({ lat: pos.lat, lng: pos.lng });
            });

            markerRef.current = m;
          }

          if (onChange) onChange({ lat: clickedLat, lng: clickedLng });
        });

        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 200);

        setMemuatPeta(false);
      } catch {
        setGagalPeta(true);
        setMemuatPeta(false);
      }
    }

    inisialisasi();

    return () => {
      aktif = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mode, latToko, lngToko]);

  useEffect(() => {
    if (!mapRef.current || !LRef.current) return;
    const currentLat = lat !== null && lat !== undefined && !isNaN(Number(lat)) ? Number(lat) : null;
    const currentLng = lng !== null && lng !== undefined && !isNaN(Number(lng)) ? Number(lng) : null;

    if (currentLat === null || currentLng === null) {
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    if (markerRef.current) {
      const pos = markerRef.current.getLatLng();
      if (Math.abs(pos.lat - currentLat) > 0.00001 || Math.abs(pos.lng - currentLng) > 0.00001) {
        markerRef.current.setLatLng([currentLat, currentLng]);
      }
    } else {
      const L = LRef.current;
      const ikonToko = L.divIcon({
        className: "peta-marker-toko-icon",
        html: '<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#7D2330;border:2px solid #ffffff;border-radius:50%;box-shadow:0 3px 6px rgba(0,0,0,0.3);color:#ffffff;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const ikonTujuan = L.divIcon({
        className: "peta-marker-tujuan-icon",
        html: '<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#e11d48;border:2px solid #ffffff;border-radius:50%;box-shadow:0 4px 8px rgba(0,0,0,0.35);color:#ffffff;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const m = L.marker([currentLat, currentLng], {
        icon: mode === "toko" ? ikonToko : ikonTujuan,
        draggable: true,
      }).addTo(mapRef.current);

      m.on("dragend", (ev) => {
        const p = ev.target.getLatLng();
        if (onChange) onChange({ lat: p.lat, lng: p.lng });
      });

      markerRef.current = m;
    }
  }, [lat, lng, mode, onChange]);

  function handleGunakanLokasiSaya() {
    setPesanLokasi("");
    if (typeof window === "undefined" || !navigator.geolocation) {
      setPesanLokasi("Browser Anda tidak mendukung deteksi lokasi otomatis.");
      return;
    }

    setMemuatLokasi(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMemuatLokasi(false);
        const myLat = pos.coords.latitude;
        const myLng = pos.coords.longitude;

        if (onChange) onChange({ lat: myLat, lng: myLng });
        if (mapRef.current) {
          mapRef.current.flyTo([myLat, myLng], 16, { duration: 1.2 });
        }
      },
      (err) => {
        setMemuatLokasi(false);
        if (err.code === 1) {
          setPesanLokasi(
            "Izin lokasi ditolak. Silakan izinkan akses lokasi pada ikon gembok/pengaturan peramban browser Anda."
          );
        } else if (err.code === 3) {
          setPesanLokasi("Waktu permintaan lokasi habis. Silakan coba lagi atau klik langsung pada peta.");
        } else {
          setPesanLokasi("Gagal membaca lokasi otomatis. Silakan tentukan lokasi dengan mengeklik peta.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  if (gagalPeta) {
    const waBersih = (noWaToko || "6281234567890").replace(/[^0-9]/g, "");
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
        <p className="font-bold">Peta lokasi tidak dapat dimuat saat ini.</p>
        <p>
          Anda dapat memilih opsi <strong>Ambil di Toko</strong> atau hubungi kami langsung via WhatsApp untuk dibantu pemesanan pengiriman manual.
        </p>
        <a
          href={`https://wa.me/${waBersih}?text=${encodeURIComponent("Halo Cakely, saya mengalami kendala pada peta saat checkout.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
        >
          <span>Hubungi via WhatsApp</span>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-[#7D5A50]">
          Klik pada peta atau geser pin merah untuk menandai titik pengantaran
        </span>
        <button
          type="button"
          onClick={handleGunakanLokasiSaya}
          disabled={memuatLokasi}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D5C2B2] bg-white hover:bg-[#FAF4ED] text-[#4A2E2B] text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          <span>{memuatLokasi ? "Mencari lokasi..." : "Gunakan lokasi saya"}</span>
        </button>
      </div>

      {pesanLokasi && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center justify-between">
          <span>{pesanLokasi}</span>
          <button
            type="button"
            onClick={() => setPesanLokasi("")}
            className="text-rose-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div
        className="w-full rounded-2xl border border-[#ECDCCE] overflow-hidden relative shadow-2xs"
        style={{ height: tinggi }}
      >
        {memuatPeta && (
          <div className="absolute inset-0 bg-[#FAF4ED] flex items-center justify-center z-10 text-xs text-[#7D5A50] font-semibold">
            Memuat peta interaktif...
          </div>
        )}
        <div ref={containerRef} className="w-full h-full z-0" />
      </div>

      {lat !== null && lat !== undefined && lng !== null && lng !== undefined && (
        <div className="flex items-center justify-between text-[11px] text-[#7D5A50] px-1">
          <span>
            Koordinat: {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
          </span>
          <span className="text-[10px] italic">Pin dapat digeser langsung</span>
        </div>
      )}
    </div>
  );
}
