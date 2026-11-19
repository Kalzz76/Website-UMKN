"use client";

import { useEffect } from "react";

export default function ModalPesan({ terbuka, judul, pesan, tipe = "info", onTutup }) {
  useEffect(() => {
    if (terbuka) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [terbuka]);

  if (!terbuka) return null;

  let ikonWarna = "text-sky-500 fa-circle-info";
  if (tipe === "sukses") {
    ikonWarna = "text-emerald-500 fa-circle-check";
  } else if (tipe === "error") {
    ikonWarna = "text-rose-500 fa-circle-exclamation";
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && onTutup) onTutup();
      }}
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <div className="bg-[#fbf6e9] border-2 border-[#e8dfc8] rounded-[24px] p-7 max-w-sm w-full text-center shadow-2xl">
        <div className="mb-4">
          <i className={`fa-solid ${ikonWarna} text-4xl`}></i>
        </div>
        <h3 className="text-lg font-bold text-[#1d3b2e]">{judul}</h3>
        <p className="mt-2 text-sm text-stone-600 whitespace-pre-line">{pesan}</p>
        <button
          type="button"
          onClick={onTutup}
          className="mt-6 w-full h-[40px] rounded-xl font-bold bg-[#ba2b2b] hover:bg-[#a62525] text-white transition text-xs shadow-sm cursor-pointer"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
