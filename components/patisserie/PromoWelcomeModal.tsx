"use client";
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, X } from 'lucide-react';

interface PromoWelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onCopyCode: (text: string, label: string) => void;
}

const PROMO_PHOTO = '/images/patisserie/umkm_bakery_counter_1795398163126.jpg';

export const PromoWelcomeModal: React.FC<PromoWelcomeModalProps> = ({
  open,
  onClose,
  onCopyCode,
}) => {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleCopy = () => {
    onCopyCode('CRAVELY20', 'Kode Voucher 20%');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="judul-brosur-promo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-kayuGelap/78 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-[#FFFDF9] rounded-[2rem] border-2 border-dusty shadow-[0_30px_70px_rgba(38,20,16,0.6)] overflow-hidden my-auto"
          >
            {/* Inner subtle brass frame */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-kuningan/55 z-20"
            />

            {/* Top-right X Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup popup promosi"
              className="absolute top-5 right-5 z-30 w-10 h-10 rounded-full bg-ivory/95 hover:bg-cherry text-ink hover:text-white border border-dusty shadow-md flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Left: Real Bakery Counter Photo */}
              <div className="md:col-span-5 relative min-h-[210px] sm:min-h-[250px] md:min-h-full bg-blush/40 overflow-hidden">
                {!imgError ? (
                  <img
                    src={PROMO_PHOTO}
                    alt="Suasana etalase kue segar Cravely Patisserie Bandung"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-6 text-center text-xs font-bold text-cherry">
                    Cravely
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-kayuGelap/72 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 z-10 text-ivory">
                  <span className="inline-block px-3 py-1 rounded-full bg-kayuGelap/85 border border-kuningan/70 text-[10px] font-bold tracking-widest uppercase">
                    Fresh Daily Bake · Bandung
                  </span>
                </div>
              </div>

              {/* Right: Welcome Brochure & Voucher */}
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between text-center md:text-left relative z-20 bg-gradient-to-b from-[#FFFDF9] to-ivory/75">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2.5 mb-2">
                    <span className="w-8 h-8 rounded-full bg-[#2F453E] inline-flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                      <img
                        src="/assets/images/Icon.png"
                        alt="Cravely"
                        className="w-full h-full object-contain"
                      />
                    </span>
                    <span className="font-script text-2xl sm:text-3xl text-cherry leading-none">
                      Cravely
                    </span>
                  </div>

                  <p className="text-[11px] font-extrabold tracking-wider uppercase text-cherry mb-2">
                    Diskon Spesial 20% <span aria-hidden="true">·</span> Sweet Welcome Treat
                  </p>

                  <h2
                    id="judul-brosur-promo"
                    className="font-coquette text-lg sm:text-xl font-bold text-ink leading-snug"
                    style={{ textWrap: 'balance' }}
                  >
                    Selamat Datang di Cravely! Nikmati Potongan 20% Kue Hangat Pilihan
                  </h2>

                  <p className="text-xs sm:text-sm text-ink/80 mt-2.5 leading-relaxed">
                    Dapatkan potongan harga <b>20%</b> untuk pembelian seluruh varian{' '}
                    <i>Chiffon Cake</i>, <i>Kue Ulang Tahun</i>, dan <i>Cupcakes</i> yang dipanggang
                    segar setiap pagi di Bandung menggunakan 100% mentega murni.
                  </p>

                  {/* Voucher Code Box */}
                  <div className="mt-4 p-3 rounded-2xl bg-ivory border border-dashed border-burgundy/70 flex items-center justify-between gap-2">
                    <div className="text-left">
                      <span className="block text-[10px] uppercase tracking-wider text-ink/60 font-bold">
                        Kode Voucher Kasir
                      </span>
                      <span className="font-coquette text-sm sm:text-base font-bold text-cherry tracking-widest">
                        CRAVELY20
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blush hover:bg-dusty/50 text-cherry text-xs font-bold border border-cherry/30 transition whitespace-nowrap"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Kode</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-dusty/40">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 px-6 rounded-full bg-cherry hover:bg-burgundy text-white font-coquette text-xs sm:text-sm font-bold tracking-wider shadow-md transition-colors"
                  >
                    Tutup &amp; Lihat Isi Toko →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
