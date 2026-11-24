"use client";

import React, { useEffect, useRef, useState } from "react";
import { LocateFixed, AlertCircle } from "lucide-react";

export default function PetaLokasi({
  posisiToko = null,
  posisiTujuan = null,
  onUbahTujuan = null,
  onUbahToko = null,
  mode = "tujuan",
  tinggi = "280px",
  bisaDipilih = true,
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerTokoRef = useRef(null);
  const markerTujuanRef = useRef(null);
  const [pesanGeolokasi, setPesanGeolokasi] = useState("");
  const [sedangGeolokasi, setSedangGeolokasi] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let map = mapInstanceRef.current;

    async function inisialisasiPeta() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!containerRef.current) return;

      const latAwal =
        mode === "toko"
          ? posisiToko?.lat || -6.9175
          : posisiTujuan?.lat || posisiToko?.lat || -6.9175;
      const lngAwal =
        mode === "toko"
          ? posisiToko?.lng || 107.6191
          : posisiTujuan?.lng || posisiToko?.lng || 107.6191;

      if (!map) {
        map = L.map(containerRef.current, {
          center: [latAwal, lngAwal],
          zoom: 14,
          scrollWheelZoom: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> kontributor',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;

        if (bisaDipilih) {
          map.on("click", (e) => {
            if (mode === "toko" && onUbahToko) {
              onUbahToko(e.latlng.lat, e.latlng.lng);
            } else if (onUbahTujuan) {
              onUbahTujuan(e.latlng.lat, e.latlng.lng);
            }
          });
        }
      }

      const iconToko = L.divIcon({
        className: "custom-toko-pin",
        html: `<div style="background:#4A2E2B;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:14px;cursor:${mode === "toko" && bisaDipilih ? "grab" : "default"};"><i class="fa-solid fa-store"></i></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const iconTujuan = L.divIcon({
        className: "custom-tujuan-pin",
        html: `<div style="background:#BA2B2B;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 4px 10px rgba(186,43,43,0.4);font-size:15px;cursor:grab;"><i class="fa-solid fa-location-dot"></i></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      if (posisiToko?.lat && posisiToko?.lng) {
        const tokoDraggable = Boolean(mode === "toko" && bisaDipilih && onUbahToko);
        if (!markerTokoRef.current) {
          markerTokoRef.current = L.marker([posisiToko.lat, posisiToko.lng], {
            icon: iconToko,
            draggable: tokoDraggable,
          })
            .addTo(map)
            .bindPopup("<b>Titik Lokasi Toko</b><br/>Pusat awal perhitungan pengiriman");

          if (tokoDraggable) {
            markerTokoRef.current.on("dragend", (event) => {
              const pos = event.target.getLatLng();
              onUbahToko(pos.lat, pos.lng);
            });
          }
        } else {
          markerTokoRef.current.setLatLng([posisiToko.lat, posisiToko.lng]);
          if (markerTokoRef.current.dragging) {
            if (tokoDraggable) {
              markerTokoRef.current.dragging.enable();
            } else {
              markerTokoRef.current.dragging.disable();
            }
          }
        }
      }

      if (mode !== "toko" && posisiTujuan?.lat && posisiTujuan?.lng) {
        if (!markerTujuanRef.current) {
          markerTujuanRef.current = L.marker([posisiTujuan.lat, posisiTujuan.lng], {
            icon: iconTujuan,
            draggable: Boolean(bisaDipilih && onUbahTujuan),
          }).addTo(map);

          if (bisaDipilih && onUbahTujuan) {
            markerTujuanRef.current.on("dragend", (event) => {
              const pos = event.target.getLatLng();
              onUbahTujuan(pos.lat, pos.lng);
            });
          }
        } else {
          markerTujuanRef.current.setLatLng([posisiTujuan.lat, posisiTujuan.lng]);
        }

        if (posisiToko?.lat && posisiToko?.lng) {
          const bounds = L.latLngBounds([
            [posisiToko.lat, posisiToko.lng],
            [posisiTujuan.lat, posisiTujuan.lng],
          ]);
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        } else {
          map.panTo([posisiTujuan.lat, posisiTujuan.lng]);
        }
      } else if (mode === "toko" && posisiToko?.lat && posisiToko?.lng) {
        map.panTo([posisiToko.lat, posisiToko.lng]);
      }
    }

    inisialisasiPeta();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerTokoRef.current = null;
        markerTujuanRef.current = null;
      }
    };
  }, [mode, posisiToko?.lat, posisiToko?.lng, posisiTujuan?.lat, posisiTujuan?.lng]);

  function handleGunakanLokasiSaya() {
    setPesanGeolokasi("");
    if (!navigator.geolocation) {
      setPesanGeolokasi("Peramban Anda tidak mendukung penentuan lokasi otomatis.");
      return;
    }

    setSedangGeolokasi(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSedangGeolokasi(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mode === "toko" && onUbahToko) {
          onUbahToko(lat, lng);
        } else if (onUbahTujuan) {
          onUbahTujuan(lat, lng);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
        }
      },
      (err) => {
        setSedangGeolokasi(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPesanGeolokasi(
            "Izin akses lokasi ditolak. Silakan geser pin pada peta atau tentukan langsung."
          );
        } else {
          setPesanGeolokasi(
            "Gagal mendeteksi lokasi saat ini. Silakan tentukan pin langsung pada peta."
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#E6D4C6] bg-[#F5ECE3] shadow-xs">
      <div ref={containerRef} style={{ width: "100%", height: tinggi, zIndex: 1 }} />

      {bisaDipilih && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGunakanLokasiSaya}
            disabled={sedangGeolokasi}
            className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-[#4A2E2B] text-[11px] font-bold shadow-md border border-[#E6D4C6] flex items-center gap-1.5 cursor-pointer backdrop-blur-xs transition active:scale-95 disabled:opacity-50"
            title="Deteksi lokasi saya saat ini"
          >
            <LocateFixed
              className={`w-3.5 h-3.5 text-[#BA2B2B] ${
                sedangGeolokasi ? "animate-spin" : ""
              }`}
            />
            <span>{sedangGeolokasi ? "Mencari..." : "Gunakan lokasi saya"}</span>
          </button>
        </div>
      )}

      {pesanGeolokasi && (
        <div className="absolute bottom-2 left-2 right-2 z-[1000] p-2 rounded-xl bg-red-50/95 border border-red-200 text-red-700 text-[11px] flex items-center justify-between gap-2 shadow-sm backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
            <span>{pesanGeolokasi}</span>
          </div>
          <button
            type="button"
            onClick={() => setPesanGeolokasi("")}
            className="text-red-800 font-bold px-1.5 py-0.5 cursor-pointer hover:bg-red-100 rounded"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
