"use client";

import { useState, useEffect, useRef } from "react";
import { getFotoProdukFallback } from "@/lib/fotoProdukFallback";

export default function GambarProduk({
  src,
  nama,
  className = "w-full h-full object-cover",
}) {
  const fallback = getFotoProdukFallback(nama);
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [gagal, setGagal] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setImgSrc(src || fallback);
    setGagal(false);
  }, [src, fallback]);

  function tanganiError() {
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
    } else {
      setGagal(true);
    }
  }

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      tanganiError();
    }
  }, [imgSrc]);

  if (!imgSrc || gagal) {
    return <i className="fa-solid fa-cake-candles text-[#D9C5B2] text-2xl" />;
  }

  return (
    <img
      ref={imgRef}
      src={imgSrc}
      alt={nama || "Produk"}
      className={className}
      onError={tanganiError}
    />
  );
}
