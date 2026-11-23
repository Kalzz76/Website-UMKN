"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowLeft,
  Tag,
  Check,
  Info,
  X,
  Phone,
  Calendar,
  User,
  Sparkles,
  Gift,
  Cake,
} from "lucide-react";
import { formatRupiah, type CartItem, type ViewType } from "./patisserieData";

export interface KasirViewProps {
  cart: CartItem[];
  customerName: string;
  pickupDate: string;
  onCustomerNameChange: (v: string) => void;
  onPickupDateChange: (v: string) => void;
  onUpdateQty: (index: number, delta: number) => void;
  onNavigate: (view: ViewType) => void;
  onNotify: (msg: string) => void;
}

const CAKE_PHOTO_MAP: Record<string, string> = {
  "Strawberry Shortcake": "/images/patisserie/etalase_chiffon_strawberry_1795156812551.jpg",
  "Chocolate Fudge Cake": "/images/patisserie/cake_pink_rose_chocolate_1795148928845.jpg",
  "Red Velvet Rose Cake": "/images/patisserie/cake_raspberry_lemonade_1795148927822.jpg",
  "Red Velvet Cake": "/images/patisserie/cake_raspberry_lemonade_1795148927822.jpg",
  "Vintage Coquette Cake": "/images/patisserie/etalase_ultah_coquette_1795156809819.jpg",
  "Vintage Coquette Birthday Cake": "/images/patisserie/etalase_ultah_coquette_1795156809819.jpg",
  "Vanilla Bliss Earl Grey": "/images/patisserie/etalase_chiffon_earlgrey_1795156809702.jpg",
  "Vanilla Bliss Cake": "/images/patisserie/etalase_chiffon_earlgrey_1795156809702.jpg",
  "Tiramisu Pandan Suji": "/images/patisserie/etalase_chiffon_pandan_1795156815155.jpg",
  "Tiramisu Cake": "/images/patisserie/etalase_chiffon_pandan_1795156815155.jpg",
  "Berry Peach Cupcake": "/images/patisserie/cupcake_berry_peach_1795148928217.jpg",
  "Cinnamon Mint Cupcake": "/images/patisserie/cupcake_cinnamon_mint_1795148928615.jpg",
  "The Rose Garden Tart": "/images/patisserie/cake_rose_garden_1795148927858.jpg",
  "Choco Butter Cookies Box": "/images/patisserie/umkm_orders_packed_1795398162960.jpg",
  "Choco Butter Cookies": "/images/patisserie/umkm_orders_packed_1795398162960.jpg",
  "Artisan Brioche & Roti Manis": "/images/patisserie/umkm_bakery_counter_1795398163126.jpg",
  "Artisan Brioche": "/images/patisserie/umkm_bakery_counter_1795398163126.jpg",
  "Sundae Berry & Glazed Donuts": "/images/patisserie/treats_donuts_sundae_1795148927789.jpg",
  "Raspberry Lemonade Cake": "/images/patisserie/cake_raspberry_lemonade_1795148927822.jpg",
  "Japanese Strawberry Chiffon": "/images/patisserie/etalase_chiffon_strawberry_1795156812551.jpg",
  "Pandan Kaya Chiffon Cake": "/images/patisserie/etalase_chiffon_pandan_1795156815155.jpg",
  "Earl Grey Milk Tea Chiffon": "/images/patisserie/etalase_chiffon_earlgrey_1795156809702.jpg",
};

const CAKE_DESC_MAP: Record<string, string> = {
  "Strawberry Shortcake": "Kue lembut dengan krim stroberi segar",
  "Chocolate Fudge Cake": "Cokelat premium dengan rasa rich",
  "Red Velvet Rose Cake": "Red velvet klasik dengan cream cheese lembut",
  "Red Velvet Cake": "Red velvet klasik dengan cream cheese lembut",
  "Vintage Coquette Cake": "Kue Lambeth piping pita estetik & manis",
  "Vintage Coquette Birthday Cake": "Kue Lambeth piping pita estetik & manis",
  "Vanilla Bliss Earl Grey": "Infusi teh Earl Grey wangi bergamot segar",
  "Vanilla Bliss Cake": "Infusi teh Earl Grey wangi bergamot segar",
  "Tiramisu Pandan Suji": "Chiffon pandan suji berbalut mascarpone cream",
  "Tiramisu Cake": "Chiffon pandan suji berbalut mascarpone cream",
  "Berry Peach Cupcake": "Cupcake mentega dengan buah persik manis",
  "Cinnamon Mint Cupcake": "Kayu manis hangat berpadu mint segar",
  "The Rose Garden Tart": "Pie almond renyah dengan mawar & buah berry",
  "Choco Butter Cookies Box": "Kue kering butter Wijsman & choco chips leleh",
  "Choco Butter Cookies": "Kue kering butter Wijsman & choco chips leleh",
  "Artisan Brioche & Roti Manis": "Roti brioche kaya telur & mentega Prancis",
  "Artisan Brioche": "Roti brioche kaya telur & mentega Prancis",
  "Sundae Berry & Glazed Donuts": "Donat kentang glaze mawar & strawberry sundae",
  "Raspberry Lemonade Cake": "Cake lemon segar berhias buah raspberry",
};

export const KasirView: React.FC<KasirViewProps> = ({
  cart,
  customerName,
  pickupDate,
  onCustomerNameChange,
  onPickupDateChange,
  onUpdateQty,
  onNavigate,
  onNotify,
}) => {
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);

  // Detail Tambahan Patisserie: Kemasan Hardbox Eksklusif & Free Kartu Lilin
  const packagingFee = cart.length > 0 ? 15000 : 0; // Kemasan Hardbox Eksklusif & Ice Gel Pendingin

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [candleOption, setCandleOption] = useState("Lilin Spiral Emas (5 Batang)");
  const [greetingNote, setGreetingNote] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Perhitungan Subtotal & Grand Total
  const subtotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const grandTotal = Math.max(0, subtotal + packagingFee - discountAmount);

  // Handle Voucher Apply
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      onNotify("Silakan masukkan kode voucher terlebih dahulu.");
      return;
    }

    if (code === "CRAVELY20" || code === "PROMO20") {
      const discount = Math.round(subtotal * 0.2);
      setDiscountAmount(discount);
      setAppliedVoucher(code);
      onNotify(`Voucher ${code} berhasil dipasang! Hemat ${formatRupiah(discount)}`);
    } else if (code === "MANIS10" || code === "DISKON10") {
      const discount = 10000;
      setDiscountAmount(discount);
      setAppliedVoucher(code);
      onNotify(`Voucher ${code} berhasil! Diskon Rp 10.000`);
    } else {
      onNotify("Kode voucher tidak valid atau sudah kedaluwarsa.");
    }
  };

  const handleRemoveVoucher = () => {
    setDiscountAmount(0);
    setAppliedVoucher(null);
    setVoucherCode("");
    onNotify("Voucher telah dihapus.");
  };

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      onNotify("Keranjang belanja masih kosong.");
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  // Finalize WhatsApp Order
  const handleSendWhatsAppOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      onNotify("Nama pemesan wajib diisi.");
      return;
    }
    if (!phone.trim()) {
      onNotify("Nomor WhatsApp aktif wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    const messageLines = [
      "🧁 *KONFIRMASI PESANAN - CRAVELY PATISSERIE* 🧁",
      "─────────────────────────",
      `*Nama Pemesan:* ${customerName.trim()}`,
      `*Nomor WhatsApp:* ${phone.trim()}`,
      pickupDate ? `*Tanggal / Waktu Acara:* ${pickupDate}` : "",
      `*Pilihan Lilin Kue:* ${candleOption}`,
      greetingNote.trim() ? `*Tulisan Kartu Ucapan:* "${greetingNote.trim()}"` : "*Kartu Ucapan:* Tanpa tulisan khusus",
      specialRequest.trim() ? `*Catatan Dapur:* ${specialRequest.trim()}` : "",
      "",
      "📋 *DAFTAR KUE:*",
      ...cart.map(
        (item, idx) =>
          `${idx + 1}. ${item.nama} (${item.qty} pcs) - ${formatRupiah(item.harga * item.qty)}`
      ),
      "─────────────────────────",
      `*Subtotal:* ${formatRupiah(subtotal)}`,
      `*Kemasan Hardbox & Ice Gel:* ${formatRupiah(packagingFee)}`,
      `*Lilin & Pisau Kue:* GRATIS (Include)`,
      appliedVoucher ? `*Diskon Voucher (${appliedVoucher}):* -${formatRupiah(discountAmount)}` : "",
      `*TOTAL PEMBAYARAN:* ${formatRupiah(grandTotal)}`,
      "─────────────────────────",
      "Mohon konfirmasi ketersediaan slot dapur Cravely & info rekening pembayaran. Terima kasih! ♡",
    ]
      .filter(Boolean)
      .join("\n");

    const encodedMessage = encodeURIComponent(messageLines);
    const waUrl = `https://wa.me/6281234567890?text=${encodedMessage}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setIsCheckoutModalOpen(false);
      window.open(waUrl, "_blank");
      onNotify("Membuka WhatsApp untuk konfirmasi pesanan...");
    }, 600);
  };

  return (
    <div className="w-full relative min-h-[750px] overflow-hidden pb-12">
      {/* ==================== BACKGROUND DECORATIVE ELEMENTS (BOTANICAL & WAVES) ==================== */}
      {/* Top Left Botanical Branch */}
      <div className="absolute top-0 left-0 pointer-events-none opacity-40 -translate-x-3 -translate-y-2 z-0 hidden md:block">
        <svg width="180" height="150" viewBox="0 0 200 160" fill="none" stroke="#6E4238" strokeWidth="1.2">
          <path d="M10,10 Q60,50 120,40 T190,10" strokeLinecap="round" />
          <path d="M40,25 C30,35 45,55 55,40 C65,25 45,15 40,25 Z" fill="#6E4238" fillOpacity="0.1" />
          <path d="M85,38 C80,55 105,65 110,48 C115,30 95,28 85,38 Z" fill="#6E4238" fillOpacity="0.1" />
          <path d="M135,32 C135,50 160,55 158,38 C155,20 138,20 135,32 Z" fill="#6E4238" fillOpacity="0.1" />
          <path d="M15,5 Q55,90 140,110" strokeLinecap="round" opacity="0.6" />
          <path d="M50,60 C40,75 60,90 70,75 Z" fill="#6E4238" fillOpacity="0.08" />
          <path d="M95,85 C90,105 115,110 115,90 Z" fill="#6E4238" fillOpacity="0.08" />
        </svg>
      </div>

      {/* Top Right Botanical Branch */}
      <div className="absolute top-0 right-0 pointer-events-none opacity-40 translate-x-4 -translate-y-2 z-0 hidden md:block">
        <svg width="180" height="150" viewBox="0 0 200 160" fill="none" stroke="#6E4238" strokeWidth="1.2">
          <path d="M190,10 Q140,50 80,40 T10,10" strokeLinecap="round" />
          <path d="M160,25 C170,35 155,55 145,40 C135,25 155,15 160,25 Z" fill="#6E4238" fillOpacity="0.1" />
          <path d="M115,38 C120,55 95,65 90,48 C85,30 105,28 115,38 Z" fill="#6E4238" fillOpacity="0.1" />
          <path d="M65,32 C65,50 40,55 42,38 C45,20 62,20 65,32 Z" fill="#6E4238" fillOpacity="0.1" />
          <path d="M185,5 Q145,90 60,110" strokeLinecap="round" opacity="0.6" />
          <path d="M150,60 C160,75 140,90 130,75 Z" fill="#6E4238" fillOpacity="0.08" />
          <path d="M105,85 C110,105 85,110 85,90 Z" fill="#6E4238" fillOpacity="0.08" />
        </svg>
      </div>

      {/* Bottom Organic Sweeping Waves (Terracotta & Burgundy) */}
      <div className="absolute bottom-0 inset-x-0 h-44 pointer-events-none overflow-hidden z-0">
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-full opacity-65"
        >
          {/* Layer 1: Soft Peach / Terracotta Wave */}
          <path
            d="M0,80 C320,170 540,30 840,110 C1140,190 1320,80 1440,60 L1440,200 L0,200 Z"
            fill="#F2DBD0"
          />
          {/* Layer 2: Deep Burgundy Flowing Bottom Accent */}
          <path
            d="M0,150 C240,110 420,180 720,130 C1020,80 1260,160 1440,140 L1440,200 L0,200 Z"
            fill="#7D2330"
          />
        </svg>
      </div>

      {/* ==================== PAGE CONTENT ==================== */}
      <div className="relative z-10">
        {/* ==================== HEADER: KERANJANG BELANJA ==================== */}
        <div className="mb-7 sm:mb-9">
          <div className="flex items-center gap-4 w-full">
            <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-[46px] text-[#4A2E2B] font-normal shrink-0 tracking-tight">
              Keranjang Belanja
            </h1>
            <div className="flex-1 h-[1px] bg-[#D4BCAF] relative" />
          </div>
          <p className="text-xs sm:text-sm text-[#7D5A50] mt-1.5 font-sans">
            Pastikan pesanan kamu sudah sesuai ya ♡
          </p>
        </div>

        {/* ==================== 2-COLUMN SHOPPING LAYOUT ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-9 items-start">
          {/* ==================== LEFT COLUMN: TABLE CONTAINER ==================== */}
          <div className="lg:col-span-8 xl:col-span-8 w-full">
            {cart.length === 0 ? (
              /* Empty Cart Container */
              <div className="bg-[#FDF6EE] rounded-[28px] border border-[#ECD9C9] p-10 sm:p-14 text-center shadow-xs">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#7D2330] mb-4">
                  <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#381F1B]">
                  Keranjang Belanja Kamu Kosong
                </h3>
                <p className="text-xs sm:text-sm text-[#7D5A50] max-w-md mx-auto mt-2 leading-relaxed">
                  Belum ada kue lezat di keranjangmu. Yuk jelajahi etalase dan temukan kue impian untuk momen spesialmu!
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("menu")}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7D2330] hover:bg-[#681C27] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>Lihat Menu Kue</span>
                  <span>→</span>
                </button>
              </div>
            ) : (
              <div>
                {/* Main Large Table Card Container */}
                <div className="bg-[#FDF6EE] rounded-[28px] border border-[#ECD9C9] p-4 sm:p-6 shadow-[0_4px_20px_rgba(90,56,47,0.04)]">
                  {/* Table Column Headers */}
                  <div className="grid grid-cols-12 items-center px-4 pb-3 text-xs sm:text-sm font-serif font-bold text-[#4A2E2B]">
                    <div className="col-span-6 sm:col-span-6">Produk</div>
                    <div className="col-span-2 text-center hidden sm:block">Harga</div>
                    <div className="col-span-3 sm:col-span-2 text-center">Jumlah</div>
                    <div className="col-span-3 sm:col-span-2 text-right">Subtotal</div>
                  </div>

                  {/* Product Cards Stack */}
                  <div className="space-y-3.5">
                    <AnimatePresence>
                      {cart.map((item, index) => {
                        const photoSrc =
                          CAKE_PHOTO_MAP[item.nama] ||
                          "/images/patisserie/etalase_chiffon_strawberry_1795156812551.jpg";
                        const descText =
                          CAKE_DESC_MAP[item.nama] || "Kue artisan lembut dengan bahan premium";
                        const itemSubtotal = item.harga * item.qty;

                        return (
                          <motion.div
                            key={item.id || `${item.nama}-${index}`}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-[#FFFDF9] rounded-2xl p-3.5 sm:p-4 border border-[#F3E5D8] shadow-[0_2px_10px_rgba(90,56,47,0.03)] hover:shadow-md transition-all grid grid-cols-12 items-center gap-3 sm:gap-4"
                          >
                            {/* Col 1: Product Thumbnail & Name (6 cols) */}
                            <div className="col-span-12 sm:col-span-6 flex items-center gap-3.5">
                              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-[#F5ECE3] border border-[#EFE2D6]">
                                <img
                                  src={photoSrc}
                                  alt={item.nama}
                                  className="w-full h-full object-cover object-center"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className="font-serif font-bold text-sm sm:text-base text-[#381F1B] leading-tight line-clamp-2">
                                  {item.nama}
                                </h4>
                                <p className="text-[11px] sm:text-xs text-[#8C6D62] line-clamp-2 mt-1 leading-snug">
                                  {descText}
                                </p>
                                {/* Mobile Price view */}
                                <span className="sm:hidden text-xs font-semibold text-[#6E4238] block mt-1">
                                  {formatRupiah(item.harga)}
                                </span>
                              </div>
                            </div>

                            {/* Col 2: Unit Price (2 cols, desktop only) */}
                            <div className="hidden sm:block sm:col-span-2 text-center text-xs sm:text-sm font-serif font-medium text-[#381F1B] tabular-nums">
                              {formatRupiah(item.harga)}
                            </div>

                            {/* Col 3: Counter Pill (2 cols) */}
                            <div className="col-span-6 sm:col-span-2 flex items-center justify-start sm:justify-center">
                              <div className="bg-[#FDF4EB] border border-[#ECD9C9] rounded-full px-3.5 py-1.5 flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(index, -1)}
                                  className="text-[#6E4238] hover:text-[#7D2330] p-0.5 transition active:scale-90 cursor-pointer"
                                  aria-label="Kurangi jumlah"
                                >
                                  <Minus className="w-3 h-3 stroke-[2.5]" />
                                </button>

                                <span className="text-xs sm:text-sm font-bold text-[#3D2B28] min-w-[14px] text-center tabular-nums">
                                  {item.qty}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(index, 1)}
                                  className="text-[#6E4238] hover:text-[#7D2330] p-0.5 transition active:scale-90 cursor-pointer"
                                  aria-label="Tambah jumlah"
                                >
                                  <Plus className="w-3 h-3 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>

                            {/* Col 4: Subtotal & Trash (2 cols) */}
                            <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-2.5 sm:gap-3">
                              <span className="text-xs sm:text-sm font-serif font-medium text-[#381F1B] tabular-nums">
                                {formatRupiah(itemSubtotal)}
                              </span>

                              <button
                                type="button"
                                onClick={() => onUpdateQty(index, -item.qty)}
                                className="p-1 rounded-lg text-[#8C6D62] hover:text-[#7D2330] transition-colors cursor-pointer"
                                title="Hapus produk"
                                aria-label={`Hapus ${item.nama}`}
                              >
                                <Trash2 className="w-4 h-4 stroke-[1.8]" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Back to Shopping Button */}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onNavigate("menu")}
                    className="px-4 py-2 rounded-xl bg-[#FAF0E6] hover:bg-[#F2E2D2] border border-[#E0CFBF] text-[#5C3D2E] text-xs sm:text-sm font-semibold flex items-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Lanjut Belanja</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Left Corner Delicate Cake Line-Art Sketch (On top of organic wave) */}
            <div className="mt-12 pointer-events-none opacity-40 hidden sm:block">
              <svg width="120" height="75" viewBox="0 0 130 85" fill="none" stroke="#6E4238" strokeWidth="1.2">
                <path d="M10,75 L105,75 L120,45 L25,45 Z" strokeLinejoin="round" />
                <path d="M10,75 L10,58 L25,30 L120,30 L120,45" strokeLinejoin="round" />
                <path d="M10,58 L105,58 L120,30" strokeLinejoin="round" />
                <line x1="12" y1="66" x2="105" y2="66" strokeDasharray="2,2" />
                <circle cx="75" cy="22" r="7" stroke="#6E4238" />
                <circle cx="86" cy="23" r="5" stroke="#6E4238" />
                <path d="M75,15 Q78,9 83,10" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* ==================== RIGHT COLUMN: ORDER SUMMARY CARD ==================== */}
          <div className="lg:col-span-4 xl:col-span-4 w-full">
            <div className="rounded-[26px] border border-[#ECD9C9] bg-[#FFFDF9] shadow-sm overflow-hidden">
              {/* Header: Burgundy #7D2330 with Cake Illustration */}
              <div className="bg-[#7D2330] text-white px-6 py-4.5 flex items-center justify-between relative overflow-hidden">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white relative z-10">
                  Ringkasan Pesanan
                </h2>

                {/* Cake Line-Art Illustration in Header */}
                <div className="relative z-10 opacity-90 text-[#F9CCD2]">
                  <svg width="68" height="46" viewBox="0 0 70 50" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M5,42 L55,42 L65,22 L15,22 Z" strokeLinejoin="round" />
                    <path d="M5,42 L5,32 L15,12 L65,12 L65,22" strokeLinejoin="round" />
                    <path d="M5,32 L55,32 L65,12" strokeLinejoin="round" />
                    <circle cx="40" cy="8" r="4" stroke="currentColor" fill="#FFFDF9" fillOpacity="0.2" />
                    <path d="M40,4 Q42,1 45,2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Body: Clean Summary Details */}
              <div className="p-6 space-y-4 text-xs sm:text-sm">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-[#5C3D2E]">
                  <span>Subtotal ({totalItemCount} Produk)</span>
                  <span className="font-serif font-medium text-[#381F1B] tabular-nums">
                    {formatRupiah(subtotal)}
                  </span>
                </div>

                {/* Kemasan Eksklusif & Ice Gel */}
                <div className="flex items-center justify-between text-[#5C3D2E]">
                  <div className="flex items-center gap-1.5">
                    <span>Kemasan Hardbox &amp; Ice Gel</span>
                    <span
                      title="Kemasan box eksklusif tebal berlapis foil & ice gel agar kue dingin & aman"
                      className="cursor-help text-[#8C6D62] hover:text-[#7D2330]"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <span className="font-serif font-medium text-[#381F1B] tabular-nums">
                    {formatRupiah(packagingFee)}
                  </span>
                </div>

                {/* Lilin & Pisau Kue (Gratis) */}
                <div className="flex items-center justify-between text-[#5C3D2E]">
                  <div className="flex items-center gap-1.5">
                    <span>Lilin Ulang Tahun &amp; Pisau</span>
                  </div>
                  <span className="font-semibold text-emerald-700">
                    Gratis (Include)
                  </span>
                </div>

                {/* Diskon Voucher (Jika ada) */}
                {appliedVoucher && (
                  <div className="flex items-center justify-between text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Diskon ({appliedVoucher})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif tabular-nums">-{formatRupiah(discountAmount)}</span>
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="text-xs text-red-600 hover:text-red-800 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Divider Line */}
                <div className="border-t border-[#F0E4D8] pt-3.5 flex items-center justify-between">
                  <span className="font-serif font-bold text-sm sm:text-base text-[#381F1B]">
                    Total Pembayaran
                  </span>
                  <span className="font-serif font-bold text-lg sm:text-xl text-[#381F1B] tabular-nums">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>

                {/* Voucher Input Bar */}
                <form onSubmit={handleApplyVoucher} className="pt-2">
                  <div className="flex items-center bg-[#FAF0E6] border border-[#E8DACB] rounded-2xl p-1 focus-within:ring-1 focus-within:ring-[#7D2330] transition">
                    <div className="pl-2.5 text-[#8C6D62]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                        <path d="M13 5v2"/>
                        <path d="M13 17v2"/>
                        <path d="M13 11v2"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Kode Voucher"
                      className="w-full px-2.5 py-1.5 text-xs bg-transparent text-[#3D2B28] placeholder-[#9E8278] focus:outline-none uppercase"
                    />
                    <button
                      type="submit"
                      className="bg-[#7D2330] hover:bg-[#681C27] text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Gunakan
                    </button>
                  </div>
                </form>

                {/* Main Checkout Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#7D2330] hover:bg-[#681C27] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Checkout Sekarang →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Subtext: "Terima kasih sudah memilih Cravely ♡" with Cursive Script */}
            <div className="mt-8 text-center relative">
              <p className="font-serif italic text-base sm:text-lg text-[#7D5A50]">
                Terima kasih<br />sudah memilih Cravely ♡
              </p>

              {/* Bottom Right Botanical Leaf Flourish */}
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 pointer-events-none opacity-40 hidden sm:block">
                <svg width="70" height="60" viewBox="0 0 80 70" fill="none" stroke="#6E4238" strokeWidth="1.2">
                  <path d="M70,60 Q40,30 10,40" strokeLinecap="round" />
                  <path d="M50,45 C55,30 35,25 38,40 Z" fill="#6E4238" fillOpacity="0.1" />
                  <path d="M25,38 C28,25 15,20 18,35 Z" fill="#6E4238" fillOpacity="0.1" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== INTERACTIVE CHECKOUT MODAL ==================== */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#FFFDF9] rounded-3xl border-2 border-[#C59B62]/60 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-[#7D2330] text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] tracking-widest uppercase font-bold text-[#F9CCD2] block">
                    Konfirmasi Pesanan
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Meja Kasir Cravely
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSendWhatsAppOrder} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-bold text-[#381F1B] mb-1">
                    Nama Pemesan <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8C6D62] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => onCustomerNameChange(e.target.value)}
                      placeholder="Nama lengkap kamu"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E8DACB] text-[#381F1B] focus:outline-none focus:ring-1 focus:ring-[#7D2330]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#381F1B] mb-1">
                    Nomor WhatsApp <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8C6D62] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E8DACB] text-[#381F1B] focus:outline-none focus:ring-1 focus:ring-[#7D2330]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#381F1B] mb-1">
                    Tanggal &amp; Waktu Acara / Kebutuhan
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#8C6D62] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => onPickupDateChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E8DACB] text-[#381F1B] focus:outline-none focus:ring-1 focus:ring-[#7D2330]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#381F1B] mb-1">
                    Pilihan Lilin Ulang Tahun (Gratis)
                  </label>
                  <div className="relative">
                    <Cake className="w-4 h-4 text-[#8C6D62] absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={candleOption}
                      onChange={(e) => setCandleOption(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E8DACB] text-[#381F1B] focus:outline-none focus:ring-1 focus:ring-[#7D2330] appearance-none cursor-pointer"
                    >
                      <option value="Lilin Spiral Emas (5 Batang)">Lilin Spiral Emas (5 Batang)</option>
                      <option value="Lilin Batang Pastel Ulir">Lilin Batang Pastel Ulir</option>
                      <option value="Lilin Angka (Tulis di Catatan)">Lilin Angka (Tulis di Catatan)</option>
                      <option value="Tanpa Lilin">Tanpa Lilin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#381F1B] mb-1">
                    Tulisan Kartu Ucapan Spesial (Gratis)
                  </label>
                  <textarea
                    rows={2}
                    value={greetingNote}
                    onChange={(e) => setGreetingNote(e.target.value)}
                    placeholder="Contoh: Happy 21st Birthday Sarah! Semoga hari-harimu selalu manis ♡"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E8DACB] text-[#381F1B] focus:outline-none focus:ring-1 focus:ring-[#7D2330]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#381F1B] mb-1">
                    Catatan Khusus untuk Dapur Cravely
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequest}
                    onChange={(e) => setSpecialRequest(e.target.value)}
                    placeholder="Contoh: Pisahkan topping stroberi / request pita warna merah marun"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E8DACB] text-[#381F1B] focus:outline-none focus:ring-1 focus:ring-[#7D2330]"
                  />
                </div>

                {/* Summary in modal */}
                <div className="p-3.5 rounded-xl bg-[#FAF0E6] border border-[#E8DACB] flex items-center justify-between">
                  <span className="font-semibold text-[#5C3D2E]">Total Pembayaran:</span>
                  <span className="font-serif font-bold text-base text-[#7D2330] tabular-nums">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D9C4B2] text-[#6E4238] font-bold text-xs hover:bg-[#FAF0E6] transition cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#7D2330] hover:bg-[#681C27] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? "Menyiapkan..." : "Kirim Pesanan ke WhatsApp"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
