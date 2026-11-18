"use client";

export default function ModalPesan({ terbuka, judul, pesan, tipe = "info", onTutup }) {
  if (!terbuka) return null;

  let ikonWarna = "text-sky-500 fa-circle-info";
  if (tipe === "sukses") {
    ikonWarna = "text-emerald-500 fa-circle-check";
  } else if (tipe === "error") {
    ikonWarna = "text-rose-500 fa-circle-exclamation";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="mb-4">
          <i className={`fa-solid ${ikonWarna} text-4xl`}></i>
        </div>
        <h3 className="text-lg font-bold text-stone-900">{judul}</h3>
        <p className="mt-2 text-sm text-stone-600 whitespace-pre-line">{pesan}</p>
        <button
          type="button"
          onClick={onTutup}
          className="mt-6 w-full py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
