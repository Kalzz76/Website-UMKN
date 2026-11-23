"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowLeft,
  Tag,
  Info,
  X,
  Ticket,
  Calendar,
  User,
  Phone,
  Cake,
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
  cart = [],
  customerName = "",
  pickupDate = "",
  onCustomerNameChange = () => {},
  onPickupDateChange = () => {},
  onUpdateQty = () => {},
  onNavigate = () => {},
  onNotify = () => {},
}) => {
  const router = useRouter();
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [showShippingTooltip, setShowShippingTooltip] = useState(false);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [candleOption, setCandleOption] = useState("Lilin Spiral Emas (5 Batang)");
  const [greetingNote, setGreetingNote] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"kurir" | "ambil">("kurir");
  const [isSubmitting, setIsSubmitting] = useState(false);

  let subtotal = 0;
  let totalItemCount = 0;
  const itemsList = Array.isArray(cart) ? cart : [];
  for (let i = 0; i < itemsList.length; i++) {
    const item = itemsList[i];
    if (item) {
      subtotal += (Number(item.harga) || 0) * (Number(item.qty) || 1);
      totalItemCount += Number(item.qty) || 1;
    }
  }
  const shippingFee = itemsList.length > 0 ? 15000 : 0;
  const grandTotal = Math.max(0, subtotal + shippingFee - discountAmount);

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
      onNotify(`Voucher ${code} berhasil! Hemat ${formatRupiah(discount)}`);
    } else if (code === "MANIS10" || code === "DISKON10") {
      const discount = 10000;
      setDiscountAmount(discount);
      setAppliedVoucher(code);
      onNotify(`Voucher ${code} berhasil! Diskon Rp 10.000`);
    } else if (code === "CAKELY15" || code === "GRATISONGKIR") {
      const discount = 15000;
      setDiscountAmount(discount);
      setAppliedVoucher(code);
      onNotify(`Voucher ${code} berhasil! Diskon Ongkos Kirim Rp 15.000`);
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

  // Open Checkout Page
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      onNotify("Keranjang belanja masih kosong.");
      return;
    }
    router.push("/checkout");
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
      "🧁 *KONFIRMASI PESANAN - CAKELY PATISSERIE* 🧁",
      "─────────────────────────",
      `*Nama Pemesan:* ${customerName.trim()}`,
      `*Nomor WhatsApp:* ${phone.trim()}`,
      `*Metode:* ${deliveryType === "kurir" ? "Kirim Kurir Khusus Kue (Pendingin)" : "Ambil di Toko"}`,
      deliveryAddress.trim() ? `*Alamat Pengiriman:* ${deliveryAddress.trim()}` : "",
      pickupDate ? `*Tanggal / Waktu Acara:* ${pickupDate}` : "",
      `*Pilihan Lilin:* ${candleOption}`,
      greetingNote.trim() ? `*Tulisan Kartu Ucapan:* "${greetingNote.trim()}"` : "*Kartu Ucapan:* Tanpa ucapan khusus",
      specialRequest.trim() ? `*Catatan Khusus:* ${specialRequest.trim()}` : "",
      "",
      "📋 *DAFTAR PESANAN:*",
      ...cart.map(
        (item, idx) =>
          `${idx + 1}. ${item.nama} (${item.qty} pcs) - ${formatRupiah(item.harga * item.qty)}`
      ),
      "─────────────────────────",
      `*Subtotal (${totalItemCount} Produk):* ${formatRupiah(subtotal)}`,
      `*Ongkos Kirim:* ${formatRupiah(shippingFee)}`,
      appliedVoucher ? `*Diskon Voucher (${appliedVoucher}):* -${formatRupiah(discountAmount)}` : "",
      `*TOTAL PEMBAYARAN:* ${formatRupiah(grandTotal)}`,
      "─────────────────────────",
      "Mohon konfirmasi ketersediaan pesanan & nomor rekening transfer / QRIS. Terima kasih banyak! ♡",
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
    <div className="w-full relative pb-4">
      {/* ==================== HEADER: KERANJANG BELANJA ==================== */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-4 sm:gap-6 w-full">
          <h1
            className="text-4xl sm:text-5xl lg:text-[52px] text-[#4A2E2B] shrink-0 font-normal tracking-tight select-none"
            style={{ fontFamily: "'Alex Brush', 'Great Vibes', 'Dancing Script', cursive" }}
          >
            Keranjang Belanja
          </h1>
          <div className="flex-1 h-[1.5px] bg-[#D7C0B2] opacity-85" />
        </div>
        <p className="text-xs sm:text-sm text-[#7D5A50] mt-1.5 font-sans">
          Pastikan pesanan kamu sudah sesuai ya ♡
        </p>
      </div>

      {/* ==================== 2-COLUMN SHOPPING LAYOUT ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* ==================== LEFT COLUMN: PRODUCT TABLE ==================== */}
        <div className="lg:col-span-8 w-full">
          {itemsList.length === 0 ? (
            /* Empty Cart Container */
            <div className="bg-[#FAF4ED] rounded-[28px] border border-[#ECDCCE] p-10 sm:p-14 text-center shadow-xs">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#F3E5D8] flex items-center justify-center text-[#7D2330] mb-4">
                <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#4A2E2B]">
                Keranjang Belanja Kamu Kosong
              </h3>
              <p className="text-xs sm:text-sm text-[#7D5A50] max-w-md mx-auto mt-2 leading-relaxed">
                Belum ada kue di keranjangmu. Yuk jelajahi etalase dan temukan kue favorit untuk momen bahagiamu!
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
              {/* Product Table Card Container */}
              <div className="bg-[#FAF4ED] rounded-[26px] border border-[#ECDCCE] overflow-hidden p-5 sm:p-7 shadow-[0_2px_12px_rgba(90,56,47,0.03)]">
                {/* Table Header Bar */}
                <div className="grid grid-cols-12 items-center text-xs sm:text-sm font-serif font-bold text-[#4A2E2B] pb-4 border-b border-[#EEDBCE]">
                  <div className="col-span-12 sm:col-span-5 lg:col-span-5 pl-1">Produk</div>
                  <div className="hidden sm:block sm:col-span-2 text-center">Harga</div>
                  <div className="hidden sm:block sm:col-span-2 text-center">Jumlah</div>
                  <div className="hidden sm:block sm:col-span-2 text-center">Subtotal</div>
                  <div className="hidden sm:block sm:col-span-1 text-center"></div>
                </div>

                {/* Product Rows List */}
                <div className="divide-y divide-[#EEDBCE]">
                  <AnimatePresence>
                    {itemsList.map((item, index) => {
                      const photoSrc =
                        CAKE_PHOTO_MAP[item.nama] ||
                        "/images/patisserie/etalase_chiffon_strawberry_1795156812551.jpg";
                      const descText =
                        CAKE_DESC_MAP[item.nama] || "Kue lembut dengan krim stroberi segar";
                      const itemSubtotal = item.harga * item.qty;

                      return (
                        <motion.div
                          key={item.id || `${item.nama}-${index}`}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="py-5 sm:py-6 grid grid-cols-12 items-center gap-3 sm:gap-4"
                        >
                          {/* Col 1: Product Thumbnail & Name */}
                          <div className="col-span-12 sm:col-span-5 lg:col-span-5 flex items-center gap-3.5 sm:gap-4 pl-1">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-[#F5ECE3] border border-[#E6D4C6] shadow-xs">
                              <img
                                src={photoSrc}
                                alt={item.nama}
                                className="w-full h-full object-cover object-center"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-serif font-bold text-base sm:text-lg text-[#3E2522] leading-tight">
                                {item.nama}
                              </h4>
                              <p className="text-xs text-[#8C6D62] mt-1 line-clamp-2 leading-relaxed">
                                {descText}
                              </p>
                              {/* Mobile-only price row */}
                              <div className="sm:hidden flex items-center justify-between mt-2 pt-2 border-t border-[#EEDBCE]/70">
                                <span className="font-serif font-medium text-xs text-[#3E2522]">
                                  {formatRupiah(item.harga)}
                                </span>
                                <span className="font-serif font-bold text-xs text-[#7D2330]">
                                  Subtotal: {formatRupiah(itemSubtotal)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Price (Desktop) */}
                          <div className="hidden sm:block sm:col-span-2 text-center font-serif font-bold text-sm sm:text-base text-[#4A2E2B] tabular-nums">
                            {formatRupiah(item.harga)}
                          </div>

                          {/* Col 3: Quantity Pill */}
                          <div className="col-span-6 sm:col-span-2 flex items-center justify-start sm:justify-center">
                            <div className="bg-[#FAF0E6] border border-[#E8DACB] rounded-full px-3.5 py-1.5 flex items-center gap-3 shadow-none">
                              <button
                                type="button"
                                onClick={() => onUpdateQty(index, -1)}
                                className="text-[#6E4238] hover:text-[#7D2330] p-0.5 transition active:scale-90 cursor-pointer"
                                aria-label="Kurangi jumlah"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
                              </button>

                              <span className="text-xs sm:text-sm font-serif font-bold text-[#4A2E2B] min-w-[16px] text-center tabular-nums">
                                {item.qty}
                              </span>

                              <button
                                type="button"
                                onClick={() => onUpdateQty(index, 1)}
                                className="text-[#6E4238] hover:text-[#7D2330] p-0.5 transition active:scale-90 cursor-pointer"
                                aria-label="Tambah jumlah"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                              </button>
                            </div>
                          </div>

                          {/* Col 4: Subtotal */}
                          <div className="hidden sm:block sm:col-span-2 text-center font-serif font-bold text-sm sm:text-base text-[#4A2E2B] tabular-nums">
                            {formatRupiah(itemSubtotal)}
                          </div>

                          {/* Col 5: Trash Icon (Bare Icon matching mockup) */}
                          <div className="col-span-6 sm:col-span-1 flex items-center justify-end sm:justify-center">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(index, -item.qty)}
                              className="text-[#7D5A50] hover:text-[#7D2330] p-1.5 transition active:scale-90 cursor-pointer"
                              title="Hapus produk"
                              aria-label={`Hapus ${item.nama}`}
                            >
                              <Trash2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[1.6]" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Back to Shopping Button */}
              <div className="mt-5 flex items-center justify-start">
                <button
                  type="button"
                  onClick={() => onNavigate("menu")}
                  className="px-5 py-2.5 rounded-2xl bg-[#FAF4ED] hover:bg-[#F3E5D8] border border-[#ECDCCE] text-[#5C3D32] text-xs sm:text-sm font-semibold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2]" />
                  <span>Lanjut Belanja</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================== RIGHT COLUMN: ORDER SUMMARY CARD ==================== */}
        <div className="lg:col-span-4 w-full">
          <div className="rounded-[26px] border border-[#ECDCCE] bg-[#FAF4ED] shadow-sm overflow-hidden">
            {/* Header: Deep Burgundy with Line-Art Cake Illustration */}
            <div className="bg-[#7D2330] text-white px-6 py-4.5 flex items-center justify-between relative overflow-hidden">
              <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white relative z-10">
                Ringkasan Pesanan
              </h2>

              {/* Cake Sketch Illustration in Header */}
              <div className="relative z-10 opacity-90 text-[#FFF5ED]">
                <svg width="68" height="46" viewBox="0 0 74 50" fill="none" stroke="currentColor" strokeWidth="1.25">
                  {/* Plate Ellipse */}
                  <ellipse cx="37" cy="42" rx="33" ry="5.5" stroke="currentColor" opacity="0.6" />
                  {/* Bottom Cake Slice Triangle/Prism */}
                  <path d="M12,41 L58,41 L66,24 L20,24 Z" strokeLinejoin="round" />
                  {/* Vertical Cake Height */}
                  <path d="M12,41 L12,30 L20,13 L66,13 L66,24" strokeLinejoin="round" />
                  {/* Frosting Layer Divider */}
                  <path d="M12,35 L58,35 L66,18" strokeDasharray="2,1.5" opacity="0.75" />
                  {/* Top Cake Face */}
                  <path d="M12,30 L58,30 L66,13" strokeLinejoin="round" />
                  {/* Cherry on Top */}
                  <circle cx="43" cy="8.5" r="4" stroke="currentColor" fill="#FFF5ED" fillOpacity="0.25" />
                  <path d="M43,4.5 Q45,1 48,2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Body: Clean Summary Details */}
            <div className="p-6 sm:p-7 space-y-4 text-xs sm:text-sm">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-[#5C3D32]">
                <span>Subtotal ({totalItemCount} Produk)</span>
                <span className="font-serif font-bold text-sm sm:text-base text-[#4A2E2B] tabular-nums">
                  {formatRupiah(subtotal)}
                </span>
              </div>

              {/* Ongkos Kirim with Info Icon */}
              <div className="flex items-center justify-between text-[#5C3D32] relative">
                <div className="flex items-center gap-1.5">
                  <span>Ongkos Kirim</span>
                  <button
                    type="button"
                    onClick={() => setShowShippingTooltip(!showShippingTooltip)}
                    onMouseEnter={() => setShowShippingTooltip(true)}
                    onMouseLeave={() => setShowShippingTooltip(false)}
                    className="w-4 h-4 rounded-full border border-[#7D5A50] text-[#7D5A50] flex items-center justify-center text-[10px] font-serif italic hover:text-[#7D2330] hover:border-[#7D2330] cursor-pointer"
                    aria-label="Info ongkos kirim"
                  >
                    i
                  </button>

                  {/* Info Tooltip */}
                  <AnimatePresence>
                    {showShippingTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute left-0 bottom-7 z-30 bg-[#4A2E2B] text-white text-[11px] p-2.5 rounded-xl shadow-lg w-56 leading-snug"
                      >
                        Pengiriman menggunakan kurir khusus kue dengan wadah berpendingin agar kue tetap dingin, utuh, dan cantik saat sampai.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="font-serif font-bold text-sm sm:text-base text-[#4A2E2B] tabular-nums">
                  {formatRupiah(shippingFee)}
                </span>
              </div>

              {/* Voucher Discount Row (If Applied) */}
              {appliedVoucher && (
                <div className="flex items-center justify-between text-emerald-800 font-semibold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
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

              {/* Total Pembayaran */}
              <div className="pt-2 flex items-center justify-between">
                <span className="font-serif font-bold text-base sm:text-lg text-[#4A2E2B]">
                  Total Pembayaran
                </span>
                <span className="font-serif font-bold text-2xl sm:text-[26px] text-[#4A2E2B] tabular-nums tracking-tight">
                  {formatRupiah(grandTotal)}
                </span>
              </div>

              {/* Voucher Input Bar */}
              <form onSubmit={handleApplyVoucher} className="pt-2">
                <div className="flex items-center bg-[#FAF0E6] border border-[#E8DACB] rounded-2xl p-1.5 focus-within:ring-1 focus-within:ring-[#7D2330] transition">
                  <div className="pl-2 text-[#7D5A50]">
                    <Ticket className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Kode Voucher"
                    className="w-full px-2.5 py-1 text-xs bg-transparent text-[#4A2E2B] placeholder-[#9E8278] focus:outline-none uppercase font-medium"
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
                  <ShoppingBag className="w-4 h-4 stroke-[2]" />
                  <span>Checkout Sekarang →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Subtext: "Terima kasih sudah memilih Cakely ♡" with Cursive Script */}
          <div className="mt-7 text-center sm:text-right pr-2 sm:pr-4">
            <p
              className="text-xl sm:text-2xl text-[#7D5A50] leading-snug select-none"
              style={{ fontFamily: "'Alex Brush', 'Great Vibes', 'Dancing Script', cursive" }}
            >
              Terima kasih<br />
              <span className="relative inline-block mt-0.5">
                sudah memilih Cakely ♡
                {/* Underline Swoop */}
                <svg
                  className="w-full h-2.5 text-[#7D5A50]/70 -mt-0.5"
                  viewBox="0 0 160 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="M4,3 Q80,11 156,2" strokeLinecap="round" />
                </svg>
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ==================== INTERACTIVE CHECKOUT MODAL ==================== */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={() => setIsCheckoutModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FFFDF9] rounded-3xl border-2 border-[#EEDBCE] max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E3D7]">
                <div>
                  <span
                    className="text-2xl text-[#7D2330] leading-none block"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    Formulir Pemesanan
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#4A2E2B]">
                    Detail Pengiriman & Acara
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#6E4238] hover:bg-[#F2DBD0] flex items-center justify-center transition cursor-pointer"
                  aria-label="Tutup popup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendWhatsAppOrder} className="mt-4 space-y-3.5 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-[#4A2E2B] mb-1">
                    Nama Pemesan <span className="text-[#7D2330]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-[#9E8278]" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => onCustomerNameChange(e.target.value)}
                      placeholder="Nama lengkap pemesan"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ECD9CC] bg-[#FAF5EE] text-[#4A2E2B] focus:outline-none focus:border-[#7D2330]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#4A2E2B] mb-1">
                    Nomor WhatsApp <span className="text-[#7D2330]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#9E8278]" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ECD9CC] bg-[#FAF5EE] text-[#4A2E2B] focus:outline-none focus:border-[#7D2330]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#4A2E2B] mb-1">
                      Metode
                    </label>
                    <select
                      value={deliveryType}
                      onChange={(e) => setDeliveryType(e.target.value as "kurir" | "ambil")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECD9CC] bg-[#FAF5EE] text-[#4A2E2B] focus:outline-none focus:border-[#7D2330]"
                    >
                      <option value="kurir">Kirim Kurir (+Rp 15.000)</option>
                      <option value="ambil">Ambil di Toko</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A2E2B] mb-1">
                      Tanggal & Jam Pengambilan
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#9E8278]" />
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => onPickupDateChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ECD9CC] bg-[#FAF5EE] text-[#4A2E2B] focus:outline-none focus:border-[#7D2330]"
                      />
                    </div>
                  </div>
                </div>

                {deliveryType === "kurir" && (
                  <div>
                    <label className="block font-bold text-[#4A2E2B] mb-1">
                      Alamat Pengiriman
                    </label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Alamat lengkap tujuan pengiriman kue..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#ECD9CC] bg-[#FAF5EE] text-[#4A2E2B] focus:outline-none focus:border-[#7D2330]"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-[#4A2E2B] mb-1">
                    Pilihan Lilin Ulang Tahun
                  </label>
                  <select
                    value={candleOption}
                    onChange={(e) => setCandleOption(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ECD9CC] bg-[#FAF5EE] text-[#4A2E2B] focus:outline-none focus:border-[#7D2330]"
                  >
                    <option value="Lilin Spiral Emas (5 Batang)">Lilin Spiral Emas (5 Batang)</option>
                    <option value="Lilin Angka (Mohon tulis angka di catatan)">Lilin Angka Custom</option>
                    <option value="Lilin Pastel Mewah (Panjang 6 Batang)">Lilin Pastel Mewah (Panjang 6 Batang)</option>
                    <option value="Tanpa Lilin">Tanpa Lilin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A2E2B] mb-1">
                    Tulisan Kartu Ucapan / Di Atas Kue
                  </label>
                  <input
                    type="text"
                    value={greetingNote}
                    onChange={(e) => setGreetingNote(e.target.value)}
                    placeholder="Contoh: Happy 24th Birthday Sarah! ♡"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ECD9CC] bg-[#FAF5EE] text-[#4A2E2B] focus:outline-none focus:border-[#7D2330]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A2E2B] mb-1">
                    Catatan Dapur / Khusus
                  </label>
                  <input
                    type="text"
                    value={specialRequest}
                    onChange={(e) => setSpecialRequest(e.target.value)}
                    placeholder="Contoh: Tolong kurangi tingkat kemanisan krim"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ECD9CC] bg-[#FAF5EE] text-[#4A2E2B] focus:outline-none focus:border-[#7D2330]"
                  />
                </div>

                {/* Total Recap */}
                <div className="bg-[#FAF0E6] rounded-xl p-3 border border-[#E8DACB] flex items-center justify-between font-serif">
                  <span className="font-bold text-[#4A2E2B]">Total Bayar:</span>
                  <span className="font-bold text-lg text-[#7D2330]">{formatRupiah(grandTotal)}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-[#7D2330] hover:bg-[#681C27] text-white font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isSubmitting ? "Menyiapkan Pesanan..." : "Kirim Pesanan ke WhatsApp →"}</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
