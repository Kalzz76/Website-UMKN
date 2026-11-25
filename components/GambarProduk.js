"use client";

import { useState } from "react";
import { getFotoProdukFallback } from "@/lib/fotoProdukFallback";

export default function GambarProduk({
  src,
  nama,
  className = "w-full h-full object-cover",
}) {
  const fallback = getFotoProdukFallback(nama);
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [gagal, setGagal] = useState(false);

  if (!imgSrc || gagal) {
    return <i className="fa-solid fa-cake-candles text-[#D9C5B2] text-2xl" />;
  }

  return (
    <img
      src={imgSrc}
      alt={nama || "Produk"}
      className={className}
      onError={() => {
        if (fallback && imgSrc !== fallback) {
          setImgSrc(fallback);
        } else {
          setGagal(true);
        }
      }}
    />
  );
}
