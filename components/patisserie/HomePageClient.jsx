"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CafeScene } from "@/components/patisserie/CafeScene";
import { CafeStoryShowcase } from "@/components/patisserie/CafeStoryShowcase";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";
import { PatisserieFooter } from "@/components/patisserie/PatisserieFooter";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";

export default function HomePageClient({ popularCakes = [], toko = null }) {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [clientToko, setClientToko] = useState(toko);

  React.useEffect(() => {
    const punyaIsi = Boolean(
      toko &&
        (toko.nama_toko ||
          toko.alamat ||
          toko.no_wa ||
          toko.wa_link ||
          toko.jam?.senin_jumat ||
          toko.jam?.sabtu_minggu)
    );
    if (punyaIsi) {
      setClientToko(toko);
      return;
    }

    let aktif = true;
    fetch("/api/pengaturan")
      .then((r) => r.json())
      .then((res) => {
        if (aktif && res?.sukses && res?.data) {
          const d = res.data;
          let bersihWa = String(d.no_wa || "").replace(/[^0-9]/g, "");
          if (bersihWa.startsWith("0")) bersihWa = "62" + bersihWa.slice(1);
          else if (bersihWa.startsWith("8")) bersihWa = "62" + bersihWa;

          let igHandle = (d.instagram || "")
            .trim()
            .replace(/^https?:\/\/(www\.)?instagram\.com\/?/, "")
            .replace(/^@+/, "")
            .replace(/\/.*$/, "");
          const igUrl = igHandle ? `https://instagram.com/${igHandle}` : "";
          if (igHandle) igHandle = `@${igHandle}`;

          const formatJam = (b, t) =>
            b && t
              ? `${String(b).slice(0, 5).replace(":", ".")} – ${String(t).slice(0, 5).replace(":", ".")} WIB`
              : "";
          const seninJumat = formatJam(
            d.jam_buka_senin_jumat || d.jam_buka,
            d.jam_tutup_senin_jumat || d.jam_tutup
          );
          const sabtuMinggu = formatJam(
            d.jam_buka_sabtu_minggu || d.jam_buka,
            d.jam_tutup_sabtu_minggu || d.jam_tutup
          );

          let tautanPeta = (d.tautan_peta || "").trim();
          if (
            tautanPeta &&
            !tautanPeta.startsWith("http://") &&
            !tautanPeta.startsWith("https://")
          ) {
            tautanPeta = `https://${tautanPeta}`;
          }

          setClientToko({
            nama_toko: (d.nama_toko || "").trim(),
            alamat: (d.alamat || "").trim(),
            no_wa: bersihWa,
            wa_link: bersihWa ? `https://wa.me/${bersihWa}` : "",
            email: (d.email || "").trim(),
            instagram_handle: igHandle,
            instagram_url: igUrl,
            tautan_peta: tautanPeta,
            deskripsi_footer: (d.deskripsi_footer || "").trim(),
            jam: {
              senin_jumat: seninJumat,
              sabtu_minggu: sabtuMinggu,
              ringkas: seninJumat || sabtuMinggu || "",
            },
            minimal_hari_pesan:
              d.minimal_hari_pesan !== null &&
              d.minimal_hari_pesan !== undefined &&
              d.minimal_hari_pesan !== ""
                ? Number(d.minimal_hari_pesan)
                : null,
            minimal_hari_katalog:
              d.minimal_hari_katalog !== null &&
              d.minimal_hari_katalog !== undefined &&
              d.minimal_hari_katalog !== ""
                ? Number(d.minimal_hari_katalog)
                : null,
            maks_jarak_kirim_km:
              d.maks_jarak_kirim_km !== null &&
              d.maks_jarak_kirim_km !== undefined &&
              d.maks_jarak_kirim_km !== ""
                ? Number(d.maks_jarak_kirim_km)
                : null,
          });
        }
      })
      .catch(() => {});

    return () => {
      aktif = false;
    };
  }, [toko]);

  const tokoAktif = clientToko || toko;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#toko") {
      const timer = window.setTimeout(() => {
        const stage = document.querySelector('[data-cafe-stage="true"]');
        if (stage) {
          const top = Math.max(0, stage.offsetHeight - window.innerHeight);
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 80);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const handleNavigate = (view) => {
    if (view === "custom") {
      router.push("/pesan");
    } else if (view === "katalog" || view === "menu") {
      router.push("/menu");
    } else if (view === "etalase") {
      router.push("/menu");
    } else if (view === "toko") {
      const stage = document.querySelector('[data-cafe-stage="true"]');
      const top = stage ? Math.max(0, stage.offsetHeight - window.innerHeight) : 0;
      window.scrollTo({ top, behavior: "smooth" });
    } else if (view === "kasir" || view === "checkout") {
      router.push("/keranjang");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGoToMenuWithCake = (menuId) => {
    router.push(`/menu?id=${menuId}`);
  };

  return (
    <div className="min-h-screen bg-ivory text-ink selection:bg-blush selection:text-cherry">
      <DynamicIslandNavbar showEntered={entered} toko={tokoAktif} />

      <CafeScene
        startInside={false}
        onEnteredChange={setEntered}
        onNavigate={handleNavigate}
        onOpenInfo={() => {
          const el = document.getElementById("about-us");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        toko={tokoAktif}
      />

      <CafeStoryShowcase
        onNavigate={handleNavigate}
        onGoToMenuWithCake={handleGoToMenuWithCake}
        onNotify={showToast}
        popularCakes={popularCakes}
        toko={tokoAktif}
      />

      <PatisserieFooter
        onNavigate={handleNavigate}
        onOpenHampers={() => {}}
        onExitShop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        toko={tokoAktif}
      />

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-24 right-5 z-[90] bg-[#3D2B28] text-[#FFFDF9] border border-[#C59B62] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <PipingBagCursor />
    </div>
  );
}
