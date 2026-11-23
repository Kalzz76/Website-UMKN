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
  MapPin,
  Clock,
  Sparkles,
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
  const [shippingCost, setShippingCost] = useState(15000);
  const [pickupMethod, setPickupMethod] = useState<"kurir" | "toko">("kurir");

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [greetingNote, setGreetingNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subtotal Calculation
  const subtotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const activeShipping = pickupMethod === "kurir" && cart.length > 0 ? shippingCost : 0;
  const grandTotal = Math.max(0, subtotal + activeShipping - discountAmount);

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
      "🧁 *PESANAN BARU - CRAVELY PATISSERIE* 🧁",
      "─────────────────────────",
      `*Nama Pemesan:* ${customerName.trim()}`,
      `*Nomor WhatsApp:* ${phone.trim()}`,
      `*Metode Pengambilan:* ${pickupMethod === "kurir" ? "Kirim Kurir Bandung" : "Ambil di Toko"}`,
      pickupDate ? `*Tanggal Diambil/Kirim:* ${pickupDate}` : "",
      pickupMethod === "kurir" && address.trim() ? `*Alamat Pengiriman:* ${address.trim()}` : "",
      greetingNote.trim() ? `*Catatan Lilin / Kartu Ucapan:* ${greetingNote.trim()}` : "",
      "",
      "📋 *DAFTAR KUE PESANAN:*",
      ...cart.map(
        (item, idx) =>
          `${idx + 1}. ${item.nama} (${item.qty} pcs) - ${formatRupiah(item.harga * item.qty)}`
      ),
      "─────────────────────────",
      `*Subtotal:* ${formatRupiah(subtotal)}`,
      pickupMethod === "kurir" ? `*Ongkos Kirim:* ${formatRupiah(activeShipping)}` : "*Ongkir:* Bebas Ongkir (Ambil Toko)",
      appliedVoucher ? `*Diskon Voucher (${appliedVoucher}):* -${formatRupiah(discountAmount)}` : "",
      `*TOTAL PEMBAYARAN:* ${formatRupiah(grandTotal)}`,
      "─────────────────────────",
      "Mohon informasi rekening pembayaran & konfirmasi ketersediaan slot dapur Cravely. Terima kasih! ♡",
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
    <div className="w-full relative">
      {/* ==================== PAGE HEADER ==================== */}
      <div className="relative mb-6 sm:mb-8">
        <div className="flex items-center gap-4 w-full">
          {/* Left Decorative Botanical Sketch */}
          <div className="shrink-0 text-[#C4A999] opacity-75 hidden sm:block">
            <svg width="42" height="28" viewBox="0 0 50 35" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M45,28 Q25,12 5,5" strokeLinecap="round" />
              <path d="M30,18 C28,12 22,13 23,18 C24,23 30,22 30,18 Z" fill="currentColor" fillOpacity="0.2" />
              <path d="M16,10 C13,6 8,7 9,11 C10,15 16,14 16,10 Z" fill="currentColor" fillOpacity="0.2" />
            </svg>
          </div>

          <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-[44px] text-[#4A2E2B] font-normal shrink-0 tracking-tight">
            Keranjang Belanja
          </h1>

          <div className="flex-1 h-[1px] bg-[#D4BCAF] relative" />

          {/* Right Decorative Botanical Sketch */}
          <div className="shrink-0 text-[#C4A999] opacity-75 hidden sm:block">
            <svg width="42" height="28" viewBox="0 0 50 35" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M5,28 Q25,12 45,5" strokeLinecap="round" />
              <path d="M20,18 C22,12 28,13 27,18 C26,23 20,22 20,18 Z" fill="currentColor" fillOpacity="0.2" />
              <path d="M34,10 C37,6 42,7 41,11 C40,15 34,14 34,10 Z" fill="currentColor" fillOpacity="0.2" />
            </svg>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#7D5A50] mt-1">
          Pastikan pesanan kamu sudah sesuai ya ♡
        </p>
      </div>

      {/* ==================== MAIN 2-COLUMN LAYOUT ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-9 items-start">
        {/* ==================== LEFT COLUMN: PRODUCT LIST TABLE ==================== */}
        <div className="lg:col-span-8 xl:col-span-8 w-full flex flex-col justify-between relative">
          {cart.length === 0 ? (
            /* Empty Cart View */
            <div className="bg-[#FFFDF9] rounded-3xl border border-[#F0E4D8] p-10 sm:p-14 text-center shadow-xs">
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
              {/* Table Header Bar */}
              <div className="bg-[#F7EBE1] text-[#6E4238] rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider grid grid-cols-12 items-center mb-3">
                <div className="col-span-6 sm:col-span-6">Produk</div>
                <div className="col-span-2 text-center hidden sm:block">Harga</div>
                <div className="col-span-3 sm:col-span-2 text-center">Jumlah</div>
                <div className="col-span-3 sm:col-span-2 text-right">Subtotal</div>
              </div>

              {/* Product Rows List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {cart.map((item, index) => {
                    const photoSrc =
                      CAKE_PHOTO_MAP[item.nama] ||
                      "/images/patisserie/etalase_chiffon_strawberry_1795156812551.jpg";
                    const descText =
                      CAKE_DESC_MAP[item.nama] || "Kue artisan homemade lembut dari dapur Cravely";
                    const itemSubtotal = item.harga * item.qty;

                    return (
                      <motion.div
                        key={item.id || `${item.nama}-${index}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.22 }}
                        className="bg-[#FFFDF9] rounded-2xl p-3.5 sm:p-4 border border-[#F0E4D8] shadow-xs hover:shadow-sm transition-all grid grid-cols-12 items-center gap-3"
                      >
                        {/* Col 1: Photo & Product Title */}
                        <div className="col-span-12 sm:col-span-6 flex items-center gap-3.5">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-[#F5ECE3] border border-[#EFE2D6]">
                            <img
                              src={photoSrc}
                              alt={item.nama}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-serif font-bold text-sm sm:text-base text-[#381F1B] leading-snug line-clamp-2">
                              {item.nama}
                            </h4>
                            <p className="text-[11px] sm:text-xs text-[#7D5A50] line-clamp-1 mt-0.5">
                              {descText}
                            </p>
                            {/* Mobile Price View */}
                            <span className="sm:hidden text-xs font-semibold text-[#6E4238] block mt-1">
                              {formatRupiah(item.harga)}
                            </span>
                          </div>
                        </div>

                        {/* Col 2: Unit Price (Desktop only) */}
                        <div className="hidden sm:block sm:col-span-2 text-center text-xs sm:text-sm font-semibold text-[#4A2E2B] font-serif tabular-nums">
                          {formatRupiah(item.harga)}
                        </div>

                        {/* Col 3: Quantity Counter Pill */}
                        <div className="col-span-6 sm:col-span-2 flex items-center justify-start sm:justify-center">
                          <div className="bg-[#FAF0E6] px-2.5 py-1 rounded-full border border-[#E8DACB] flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(index, -1)}
                              className="text-[#6E4238] hover:text-[#7D2330] p-0.5 transition active:scale-90 cursor-pointer"
                              aria-label="Kurangi jumlah"
                            >
                              <Minus className="w-3 h-3 stroke-[2.5]" />
                            </button>

                            <span className="text-xs sm:text-sm font-bold text-[#3D2B28] min-w-[16px] text-center tabular-nums">
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

                        {/* Col 4: Subtotal & Delete Trash Button */}
                        <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-2.5">
                          <span className="text-xs sm:text-sm font-bold text-[#4A2E2B] font-serif tabular-nums">
                            {formatRupiah(itemSubtotal)}
                          </span>

                          <button
                            type="button"
                            onClick={() => onUpdateQty(index, -item.qty)}
                            className="p-1.5 rounded-lg text-[#8C6D62] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus produk dari keranjang"
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

              {/* Bottom Navigation: Lanjut Belanja */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onNavigate("menu")}
                  className="px-4 py-2 rounded-xl bg-[#FAF0E6] hover:bg-[#F3E3D3] border border-[#E8DACB] text-[#5C3D2E] text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Lanjut Belanja</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Left Corner Delicate Cake Sketch */}
          <div className="mt-10 pointer-events-none opacity-30 hidden sm:block">
            <svg width="110" height="68" viewBox="0 0 120 75" fill="none" stroke="#7D5A50" strokeWidth="1.2">
              <path d="M10,65 L95,65 L110,38 L25,38 Z" strokeLinejoin="round" />
              <path d="M10,65 L10,50 L25,25 L110,25 L110,38" strokeLinejoin="round" />
              <path d="M10,50 L95,50 L110,25" strokeLinejoin="round" />
              <line x1="12" y1="57" x2="95" y2="57" strokeDasharray="2,2" />
              <circle cx="68" cy="18" r="6" stroke="#7D5A50" />
              <circle cx="78" cy="19" r="5" stroke="#7D5A50" />
              <path d="M68,12 Q71,7 75,8" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: RINGKASAN PESANAN CARD ==================== */}
        <div className="lg:col-span-4 xl:col-span-4 w-full">
          <div className="rounded-3xl border border-[#EFE3D5] bg-[#FFFDF9] shadow-sm overflow-hidden">
            {/* Header: Burgundy #7D2330 with Cute Cake Illustration */}
            <div className="bg-[#7D2330] text-white px-6 py-4.5 flex items-center justify-between relative overflow-hidden">
              <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white relative z-10">
                Ringkasan Pesanan
              </h2>

              {/* Top-Right Cake Line-Art Illustration */}
              <div className="relative z-10 opacity-90 text-[#F9CCD2]">
                <svg width="60" height="42" viewBox="0 0 70 50" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M5,42 L55,42 L65,22 L15,22 Z" strokeLinejoin="round" />
                  <path d="M5,42 L5,32 L15,12 L65,12 L65,22" strokeLinejoin="round" />
                  <path d="M5,32 L55,32 L65,12" strokeLinejoin="round" />
                  <circle cx="40" cy="8" r="4" stroke="currentColor" fill="#FFFDF9" fillOpacity="0.2" />
                  <path d="M40,4 Q42,1 45,2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Body Summary Information */}
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-[#5C3D2E]">
                <span>Subtotal ({totalItemCount} Produk)</span>
                <span className="font-semibold text-[#381F1B] font-serif tabular-nums">
                  {formatRupiah(subtotal)}
                </span>
              </div>

              {/* Ongkos Kirim & Method Toggle */}
              <div>
                <div className="flex items-center justify-between text-[#5C3D2E]">
                  <div className="flex items-center gap-1.5">
                    <span>Ongkos Kirim</span>
                    <button
                      type="button"
                      title="Pengiriman kurir area Bandung Raya. Ambil di toko gratis ongkir!"
                      className="text-[#8C6D62] hover:text-[#7D2330]"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="font-semibold text-[#381F1B] font-serif tabular-nums">
                    {pickupMethod === "kurir" && cart.length > 0 ? formatRupiah(shippingCost) : "Gratis (Ambil Toko)"}
                  </span>
                </div>

                {/* Delivery Option Toggle */}
                <div className="mt-2 flex items-center gap-2 bg-[#FAF0E6] p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPickupMethod("kurir")}
                    className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                      pickupMethod === "kurir"
                        ? "bg-[#7D2330] text-white shadow-xs"
                        : "text-[#5C3D2E] hover:text-[#381F1B]"
                    }`}
                  >
                    Kirim Kurir
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupMethod("toko")}
                    className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                      pickupMethod === "toko"
                        ? "bg-[#7D2330] text-white shadow-xs"
                        : "text-[#5C3D2E] hover:text-[#381F1B]"
                    }`}
                  >
                    Ambil di Toko
                  </button>
                </div>
              </div>

              {/* Applied Voucher Discount Row */}
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
                      className="text-xs text-red-600 hover:text-red-800 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-[#F0E4D8] pt-3.5 flex items-center justify-between">
                <span className="font-serif font-bold text-sm sm:text-base text-[#381F1B]">
                  Total Pembayaran
                </span>
                <span className="font-serif font-bold text-lg sm:text-xl text-[#7D2330] tabular-nums">
                  {formatRupiah(grandTotal)}
                </span>
              </div>

              {/* Voucher Code Input Bar */}
              <form onSubmit={handleApplyVoucher} className="pt-2">
                <div className="flex items-center bg-[#FAF0E6] border border-[#E8DACB] rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-[#7D2330] transition">
                  <div className="pl-3 text-[#8C6D62]">
                    <Tag className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Kode Voucher (CRAVELY20)"
                    className="w-full px-2.5 py-2 text-xs bg-transparent text-[#3D2B28] placeholder-[#9E8278] focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="bg-[#7D2330] hover:bg-[#681C27] text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer shrink-0"
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
                  className="w-full py-3.5 rounded-xl bg-[#7D2330] hover:bg-[#681C27] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Checkout Sekarang →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Subtext Under Order Summary Card */}
          <div className="mt-8 text-center">
            <p className="font-serif italic text-sm sm:text-base text-[#7D5A50]">
              Terima kasih sudah memilih Cravely ♡
            </p>
          </div>
        </div>
      </div>

      {/* ==================== INTERACTIVE CHECKOUT MODAL ==================== */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
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
                    Kasir &amp; Pengiriman Cravely
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
                    Tanggal Pengambilan / Kirim
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

                {pickupMethod === "kurir" && (
                  <div>
                    <label className="block text-xs font-bold text-[#381F1B] mb-1">
                      Alamat Pengiriman (Area Bandung) <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#8C6D62] absolute left-3 top-3" />
                      <textarea
                        required
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Nama jalan, nomor rumah, kecamatan, kota"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF4EE] border border-[#E8DACB] text-[#381F1B] focus:outline-none focus:ring-1 focus:ring-[#7D2330]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#381F1B] mb-1">
                    Catatan Ucapan Lilin / Kartu Ucapan
                  </label>
                  <textarea
                    rows={2}
                    value={greetingNote}
                    onChange={(e) => setGreetingNote(e.target.value)}
                    placeholder="Contoh: Happy Birthday Sarah ke-21 (Lilin angka 2 & 1)"
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
                    className="px-4 py-2.5 rounded-xl border border-[#D9C4B2] text-[#6E4238] font-bold text-xs hover:bg-[#FAF0E6] transition"
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
