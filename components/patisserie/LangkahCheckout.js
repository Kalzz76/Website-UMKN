"use client";

import React from "react";
import { QrCode, Landmark } from "lucide-react";

export const OPSI_METODE = [
  { id: "qris", label: "QRIS", info: "GoPay, OVO, DANA, ShopeePay, m-banking", ikon: QrCode, grup: "QRIS" },
  { id: "bca", label: "BCA Virtual Account", info: "Transfer via BCA mobile / ATM", ikon: Landmark, grup: "VA" },
  { id: "bni", label: "BNI Virtual Account", info: "Transfer via BNI mobile / ATM", ikon: Landmark, grup: "VA" },
  { id: "bri", label: "BRI Virtual Account", info: "Transfer via BRImo / ATM", ikon: Landmark, grup: "VA" },
  { id: "mandiri", label: "Mandiri Bill Payment", info: "Livin' by Mandiri / ATM", ikon: Landmark, grup: "VA" },
  { id: "permata", label: "Permata Virtual Account", info: "Bisa dari bank mana saja", ikon: Landmark, grup: "VA" },
];

export function PilihMetodeBayar({ nilai, onUbah }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {OPSI_METODE.map((m) => {
        const Ikon = m.ikon;
        const aktif = nilai === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onUbah(m.id)}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
              aktif
                ? "border-[#7D2330] bg-[#FFF5F2] ring-1 ring-[#7D2330]"
                : "border-[#E6D4C6] bg-white/70 hover:bg-white"
            } ${m.id === "qris" ? "sm:col-span-2" : ""}`}
          >
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                aktif ? "bg-[#7D2330] text-white" : "bg-[#F5ECE3] text-[#7D2330]"
              }`}
            >
              <Ikon className="w-[18px] h-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="font-bold text-xs sm:text-sm text-[#4A2E2B] block">
                {m.label}
                {m.id === "qris" && (
                  <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                    Paling cepat
                  </span>
                )}
              </span>
              <span className="text-[11px] text-[#7D5A50]">{m.info}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const LANGKAH = ["Pengiriman", "Konfirmasi", "Pembayaran"];

export function LangkahCheckout({ aktif }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      {LANGKAH.map((nama, i) => {
        const no = i + 1;
        const selesai = aktif >= no;
        return (
          <React.Fragment key={nama}>
            {i > 0 && (
              <div
                className={`w-8 sm:w-12 h-[2px] -mt-4 transition-colors ${
                  aktif >= no ? "bg-[#4A2E2B]" : "bg-[#CDBFAA]"
                }`}
              />
            )}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  selesai ? "bg-[#4A2E2B] text-white" : "border border-[#CDBFAA] text-[#7D5A50] bg-[#FAF4EE]"
                }`}
              >
                {no}
              </div>
              <span
                className={`text-[11px] sm:text-xs mt-1 ${
                  aktif === no ? "font-bold text-[#4A2E2B]" : "text-[#7D5A50]"
                }`}
              >
                {nama}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
