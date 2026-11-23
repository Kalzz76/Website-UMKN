"use client";
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, ExternalLink, X } from 'lucide-react';
import { formatRupiah, type CartItem, type ViewType } from './patisserieData';
import { CoquetteRibbonCard, DessertIllustration } from './DessertIllustrations';

interface KasirViewProps {
  cart: CartItem[];
  customerName: string;
  pickupDate: string;
  onCustomerNameChange: (v: string) => void;
  onPickupDateChange: (v: string) => void;
  onUpdateQty: (index: number, delta: number) => void;
  onNavigate: (view: ViewType) => void;
  onNotify: (msg: string) => void;
}

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
  const [pickupMethod, setPickupMethod] = useState<'toko' | 'kurir'>('toko');
  const [paymentMethod, setPaymentMethod] = useState('QRIS Instan');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const shipping = pickupMethod === 'kurir' && cart.length > 0 ? 15000 : 0;
  const grandTotal = subtotal + shipping;

  const orderSummaryText = [
    'Halo Kasir Cravely, konfirmasi pesanan:',
    ...cart.map((it) => `- ${it.nama} x${it.qty} (${formatRupiah(it.harga * it.qty)})`),
    `Total: ${formatRupiah(grandTotal)}`,
    `Nama: ${customerName.trim() || 'Pelanggan'}`,
    `Tanggal: ${pickupDate || 'Sesuai konfirmasi'}`,
    `Metode: ${pickupMethod === 'kurir' ? 'Kirim Kurir' : 'Ambil di Toko'} (${paymentMethod})`,
  ].join('\n');

  const handleConfirm = () => {
    if (cart.length === 0) {
      onNotify('Tambahkan kue terlebih dahulu sebelum membayar.');
      return;
    }
    setReceiptOpen(true);
    onNotify('Struk pesanan berhasil disiapkan di Meja Kasir!');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderSummaryText);
      setCopied(true);
      onNotify('Detail pesanan disalin ke clipboard!');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify('Silakan salin teks pesanan secara manual.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-ivory pt-24 lg:pt-32 pb-16 px-4 sm:px-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => onNavigate('toko')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-khaki hover:border-burgundy text-xs sm:text-sm font-bold text-ink shadow-sm transition"
          >
            ← Kembali ke Ruang Cafe
          </button>
          <span className="font-coquette text-xs sm:text-sm font-bold text-cherry">
            Meja Kasir Cravely
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left: Coquette Ribbon Cart Items */}
          <div className="lg:col-span-7 bg-[#FDF5E7] rounded-3xl p-5 sm:p-7 border-2 border-dusty/60 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-dusty/40 pb-3">
              <div>
                <span className="font-script text-3xl text-cherry leading-none block">Sweet Basket</span>
                <h2 className="font-coquette text-lg sm:text-xl font-bold text-ink">
                  Pesanan di Meja Kasir
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('katalog')}
                className="text-xs font-bold text-cherry underline underline-offset-4 hover:text-burgundy"
              >
                + Tambah Menu Desserts
              </button>
            </div>

            <div className="space-y-6 pt-2">
              {cart.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <p className="text-sm text-ink/65">
                    Keranjang masih kosong. Silakan pilih kue berpita dari Menu Desserts atau racik di Custom Cake 3D.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('katalog')}
                    className="px-5 py-2 rounded-full bg-cherry text-white text-xs font-bold hover:bg-burgundy transition"
                  >
                    Lihat Menu Desserts
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cart.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -24, scale: 0.95 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <CoquetteRibbonCard variant="cart">
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-16 h-16 flex-none rounded-2xl bg-blush/35 flex items-center justify-center p-1">
                              <DessertIllustration tipe={item.tipe} className="w-14 h-14" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-coquette font-bold text-xs sm:text-sm text-ink truncate">
                                {item.nama}
                              </h3>
                              <p className="text-xs font-bold text-cherry mt-0.5 tabular-nums">
                                {formatRupiah(item.harga)}{' '}
                                <span className="text-ink/50 font-normal">/ item</span>
                              </p>
                              <p className="text-[11px] font-bold text-burgundy mt-0.5 tabular-nums">
                                Subtotal: {formatRupiah(item.harga * item.qty)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-ivory border border-dusty/70 rounded-full px-2.5 py-1 flex-none">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(idx, -1)}
                              aria-label={`Kurangi jumlah ${item.nama}`}
                              className="w-6 h-6 rounded-full bg-white hover:bg-cherry hover:text-white text-cherry font-bold text-xs transition flex items-center justify-center"
                            >
                              −
                            </button>
                            <span className="text-xs font-bold w-5 text-center text-ink tabular-nums">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(idx, 1)}
                              aria-label={`Tambah jumlah ${item.nama}`}
                              className="w-6 h-6 rounded-full bg-white hover:bg-cherry hover:text-white text-cherry font-bold text-xs transition flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </CoquetteRibbonCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="pt-4 border-t-2 border-dashed border-dusty/60 flex items-center justify-between">
              <span className="text-sm font-bold text-ink/75">Total Pembayaran</span>
              <span className="font-serif text-3xl font-bold text-cherry tabular-nums">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {/* Right: Order & Payment Form */}
          <div className="lg:col-span-5 bg-[#FFFDF9] rounded-3xl p-6 border-2 border-dusty/60 shadow-sm space-y-4">
            <div className="text-center border-b border-dusty/30 pb-3">
              <span className="font-script text-2xl text-cherry block leading-none">With Love</span>
              <h3 className="font-coquette text-lg font-bold text-ink">Detail Pengambilan &amp; Bayar</h3>
            </div>

            <div>
              <label htmlFor="kasir-nama" className="block text-xs font-bold text-ink/75 mb-1">
                Nama Pemesan
              </label>
              <input
                id="kasir-nama"
                type="text"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Contoh: Nabila Putri"
                className="w-full px-3.5 py-2.5 rounded-xl border border-dusty/70 bg-ivory/50 text-sm font-semibold outline-none focus:border-cherry"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="kasir-tanggal" className="block text-xs font-bold text-ink/75 mb-1">
                  Tanggal
                </label>
                <input
                  id="kasir-tanggal"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => onPickupDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-dusty/70 bg-ivory/50 text-xs font-semibold outline-none focus:border-cherry"
                />
              </div>
              <div>
                <label htmlFor="kasir-ambil" className="block text-xs font-bold text-ink/75 mb-1">
                  Pengambilan
                </label>
                <select
                  id="kasir-ambil"
                  value={pickupMethod}
                  onChange={(e) => setPickupMethod(e.target.value as 'toko' | 'kurir')}
                  className="w-full px-3 py-2 rounded-xl border border-dusty/70 bg-ivory/50 text-xs font-semibold outline-none focus:border-cherry"
                >
                  <option value="toko">Ambil di Toko (Gratis)</option>
                  <option value="kurir">Kirim Kurir (+Rp 15.000)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="kasir-bayar" className="block text-xs font-bold text-ink/75 mb-1">
                Metode Pembayaran
              </label>
              <select
                id="kasir-bayar"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-dusty/70 bg-ivory/50 text-sm font-semibold outline-none focus:border-cherry"
              >
                <option value="QRIS Instan">QRIS Instan</option>
                <option value="Transfer Bank BCA / Mandiri">Transfer Bank BCA / Mandiri</option>
                <option value="Bayar Tunai di Kasir">Bayar Tunai di Kasir</option>
                <option value="E-Wallet (GoPay / OVO / Dana)">E-Wallet (GoPay / OVO / Dana)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3 rounded-full bg-cherry hover:bg-burgundy text-white font-coquette text-xs sm:text-sm font-bold tracking-wider shadow-md transition"
            >
              Konfirmasi &amp; Bayar Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* Coquette Order Confirmation Receipt Modal */}
      <AnimatePresence>
        {receiptOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-ink/55 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setReceiptOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FFFDF9] rounded-3xl p-6 max-w-md w-full border-2 border-cherry/60 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-script text-2xl text-cherry leading-none block">Thank You</span>
                  <h3 className="font-coquette text-lg font-bold text-ink">Struk Pesanan Siap</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptOpen(false)}
                  aria-label="Tutup struk pesanan"
                  className="w-8 h-8 rounded-full bg-ivory border border-khaki text-ink flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <pre className="whitespace-pre-wrap font-sans text-xs bg-ivory border-2 border-dashed border-dusty/80 rounded-2xl p-4 text-ink leading-relaxed">
                {orderSummaryText}
              </pre>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-ivory border border-dusty text-xs font-bold text-ink hover:bg-blush/50 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-cherry" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Pesanan'}</span>
                </button>
                <a
                  href={`https://wa.me/6281234567890?text=${encodeURIComponent(orderSummaryText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-cherry hover:bg-burgundy text-white text-xs font-bold transition"
                >
                  <span>Kirim WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
