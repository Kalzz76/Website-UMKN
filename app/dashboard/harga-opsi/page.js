"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { formatRupiah } from "@/lib/format";
import ModalPesan from "@/components/ModalPesan";

export default function HargaOpsiPage() {
  const [daftarGrup, setDaftarGrup] = useState([]);
  const [daftarItem, setDaftarItem] = useState([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangProses, setSedangProses] = useState(false);

  const [modalGrupBuka, setModalGrupBuka] = useState(false);
  const [editGrupId, setEditGrupId] = useState(null);
  const [formGrup, setFormGrup] = useState({
    nama: "",
    urutan: 0,
    wajib: false,
    jenis_pilihan: "satu",
    peran_visual: "",
    peran_dashboard: "",
  });

  const [modalItemBuka, setModalItemBuka] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [grupAktifForItem, setGrupAktifForItem] = useState(null);
  const [formItem, setFormItem] = useState({
    id_grup: "",
    nama: "",
    harga: 0,
    aktif: true,
    urutan: 0,
    warna: "",
    kode_visual: "",
  });

  const [pesanErrorForm, setPesanErrorForm] = useState([]);
  const [notifikasi, setNotifikasi] = useState({
    terbuka: false,
    judul: "",
    pesan: "",
    tipe: "info",
  });

  async function muatData() {
    setSedangMemuat(true);
    const supabase = getSupabaseBrowser();

    const { data: grupList, error: errGrup } = await supabase
      .from("grup_opsi")
      .select("*")
      .order("urutan", { ascending: true });

    const { data: itemList, error: errItem } = await supabase
      .from("opsi_item")
      .select("*")
      .order("urutan", { ascending: true });

    if (!errGrup && grupList) {
      setDaftarGrup(grupList);
    }
    if (!errItem && itemList) {
      setDaftarItem(itemList);
    }
    setSedangMemuat(false);
  }

  useEffect(() => {
    muatData();
  }, []);

  function bukaModalTambahGrup() {
    setEditGrupId(null);
    setFormGrup({
      nama: "",
      urutan: daftarGrup.length + 1,
      wajib: false,
      jenis_pilihan: "satu",
      peran_visual: "",
      peran_dashboard: "",
    });
    setPesanErrorForm([]);
    setModalGrupBuka(true);
  }

  function bukaModalEditGrup(grup) {
    setEditGrupId(grup.id);
    setFormGrup({
      nama: grup.nama,
      urutan: grup.urutan,
      wajib: grup.wajib,
      jenis_pilihan: grup.jenis_pilihan,
      peran_visual: grup.peran_visual || "",
      peran_dashboard: grup.peran_dashboard || "",
    });
    setPesanErrorForm([]);
    setModalGrupBuka(true);
  }

  async function simpanGrup(e) {
    e.preventDefault();
    setPesanErrorForm([]);

    const errors = [];
    if (!formGrup.nama.trim()) {
      errors.push("Nama grup tidak boleh kosong.");
    }
    if (errors.length > 0) {
      setPesanErrorForm(errors);
      return;
    }

    setSedangProses(true);
    const aksi = editGrupId ? "edit_grup" : "tambah_grup";
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi,
        id: editGrupId,
        nama: formGrup.nama,
        urutan: formGrup.urutan,
        wajib: formGrup.wajib,
        jenis_pilihan: formGrup.jenis_pilihan,
        peran_visual: formGrup.peran_visual,
        peran_dashboard: formGrup.peran_dashboard,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setPesanErrorForm([hasil.pesan || "Terjadi kesalahan saat menyimpan grup."]);
      return;
    }

    setModalGrupBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function hapusGrup(grup) {
    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus grup "${grup.nama}"? Semua opsi item di dalamnya akan ikut terhapus. Jika opsi sudah pernah dipesan, data pesanan lama tetap aman.`
    );
    if (!yakin) return;

    setSedangProses(true);
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "hapus_grup",
        id: grup.id,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal menghapus grup.",
        tipe: "error",
      });
      return;
    }

    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  function bukaModalTambahItem(grup) {
    setEditItemId(null);
    setGrupAktifForItem(grup);
    const itemDiGrup = daftarItem.filter((item) => item.id_grup === grup.id);
    setFormItem({
      id_grup: grup.id,
      nama: "",
      harga: 0,
      aktif: true,
      urutan: itemDiGrup.length + 1,
      warna: "",
      kode_visual: "",
    });
    setPesanErrorForm([]);
    setModalItemBuka(true);
  }

  function bukaModalEditItem(item, grup) {
    setEditItemId(item.id);
    setGrupAktifForItem(grup);
    setFormItem({
      id_grup: item.id_grup,
      nama: item.nama,
      harga: item.harga,
      aktif: item.aktif,
      urutan: item.urutan,
      warna: item.warna || "",
      kode_visual: item.kode_visual || "",
    });
    setPesanErrorForm([]);
    setModalItemBuka(true);
  }

  async function simpanItem(e) {
    e.preventDefault();
    setPesanErrorForm([]);

    const errors = [];
    if (!formItem.nama.trim()) {
      errors.push("Nama opsi item tidak boleh kosong.");
    }
    if (formItem.harga < 0 || isNaN(Number(formItem.harga))) {
      errors.push("Harga harus berupa angka valid dan minimal 0.");
    }
    if (errors.length > 0) {
      setPesanErrorForm(errors);
      return;
    }

    setSedangProses(true);
    const aksi = editItemId ? "edit_item" : "tambah_item";
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi,
        id: editItemId,
        id_grup: formItem.id_grup,
        nama: formItem.nama,
        harga: Number(formItem.harga),
        aktif: formItem.aktif,
        urutan: formItem.urutan,
        warna: formItem.warna,
        kode_visual: formItem.kode_visual,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setPesanErrorForm([hasil.pesan || "Terjadi kesalahan saat menyimpan item."]);
      return;
    }

    setModalItemBuka(false);
    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  async function toggleAktifItem(item) {
    setSedangProses(true);
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "toggle_aktif_item",
        id: item.id,
        aktif: !item.aktif,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal mengubah status item.",
        tipe: "error",
      });
      return;
    }

    muatData();
  }

  async function hapusItem(item) {
    const yakin = window.confirm(
      `Apakah Anda yakin ingin menghapus item "${item.nama}"? Jika bahan sedang kosong, disarankan untuk menonaktifkannya saja agar tidak muncul bagi pelanggan.`
    );
    if (!yakin) return;

    setSedangProses(true);
    const res = await fetch("/api/opsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aksi: "hapus_item",
        id: item.id,
      }),
    });

    const hasil = await res.json();
    setSedangProses(false);

    if (!res.ok) {
      setNotifikasi({
        terbuka: true,
        judul: "Informasi",
        pesan: hasil.pesan || "Gagal menghapus item.",
        tipe: "error",
      });
      return;
    }

    setNotifikasi({
      terbuka: true,
      judul: "Berhasil",
      pesan: hasil.pesan,
      tipe: "sukses",
    });
    muatData();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">
            Harga & Opsi Kustomisasi
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Kelola grup opsi kue (ukuran, rasa, krim, topping) beserta daftar pilihan dan harganya.
          </p>
        </div>
        <button
          type="button"
          onClick={bukaModalTambahGrup}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm cursor-pointer"
        >
          <i className="fa-solid fa-plus text-sm"></i>
          <span>Tambah Grup</span>
        </button>
      </div>

      {sedangMemuat ? (
        <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-stone-100">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-rose-500"></i>
          <p className="text-sm font-medium">Memuat data grup dan opsi...</p>
        </div>
      ) : daftarGrup.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-stone-100 shadow-sm">
          <i className="fa-solid fa-layer-group text-4xl mb-3 text-stone-300"></i>
          <p className="text-base font-semibold text-stone-700">Belum ada grup opsi.</p>
          <p className="text-xs text-stone-400 mt-1">
            Klik tombol &quot;Tambah Grup&quot; untuk membuat grup kustomisasi pertama Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {daftarGrup.map((grup) => {
            const itemGrup = daftarItem.filter((it) => it.id_grup === grup.id);

            return (
              <div
                key={grup.id}
                className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-100">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center">
                        #{grup.urutan}
                      </span>
                      <h3 className="text-lg font-bold text-stone-900">
                        {grup.nama}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-medium ${
                          grup.wajib
                            ? "bg-rose-100 text-rose-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {grup.wajib ? "Wajib Dipilih" : "Opsional"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full font-medium bg-sky-100 text-sky-700">
                        {grup.jenis_pilihan === "satu" ? "Pilih Satu" : "Pilih Banyak"}
                      </span>
                      {grup.peran_visual ? (
                        <span className="px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                          Peran Visual: {grup.peran_visual}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-500">
                          Tanpa Peran Visual
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => bukaModalTambahItem(grup)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                      <span>Tambah Item</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => bukaModalEditGrup(grup)}
                      className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                      title="Edit Grup"
                    >
                      <i className="fa-solid fa-pen-to-square text-sm"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => hapusGrup(grup)}
                      className="p-2 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Hapus Grup"
                    >
                      <i className="fa-solid fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>

                {itemGrup.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-400 bg-stone-50/50 rounded-2xl">
                    Belum ada opsi item di grup ini. Silakan klik &quot;Tambah Item&quot;.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-100 text-stone-700 uppercase text-xs">
                        <tr>
                          <th className="py-2.5 px-3 rounded-l-xl w-14">Urutan</th>
                          <th className="py-2.5 px-3">Nama Opsi</th>
                          <th className="py-2.5 px-3">Harga</th>
                          <th className="py-2.5 px-3">Visual (Warna / Kode)</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right rounded-r-xl w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {itemGrup.map((item) => (
                          <tr key={item.id} className="hover:bg-stone-50/60 transition">
                            <td className="py-2.5 px-3 font-semibold text-stone-500 text-xs">
                              {item.urutan}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-stone-900">
                              {item.nama}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-stone-800">
                              {formatRupiah(item.harga)}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center space-x-2">
                                {item.warna ? (
                                  <div
                                    className="w-5 h-5 rounded-md border border-stone-300 shadow-inner flex-shrink-0"
                                    style={{ backgroundColor: item.warna }}
                                    title={item.warna}
                                  ></div>
                                ) : (
                                  <span className="text-xs text-stone-400">-</span>
                                )}
                                {item.kode_visual && (
                                  <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-xs font-mono">
                                    {item.kode_visual}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={() => toggleAktifItem(item)}
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                                  item.aktif
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.aktif ? "bg-emerald-500" : "bg-stone-400"
                                  }`}
                                ></span>
                                <span>{item.aktif ? "Aktif" : "Nonaktif"}</span>
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  type="button"
                                  onClick={() => bukaModalEditItem(item, grup)}
                                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                                  title="Edit Item"
                                >
                                  <i className="fa-solid fa-pen-to-square text-xs"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => hapusItem(item)}
                                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Hapus Item"
                                >
                                  <i className="fa-solid fa-trash text-xs"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalGrupBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <h3 className="text-lg font-bold text-stone-900">
                {editGrupId ? "Edit Grup Opsi" : "Tambah Grup Opsi"}
              </h3>
              <button
                type="button"
                onClick={() => setModalGrupBuka(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {pesanErrorForm.length > 0 && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                {pesanErrorForm.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            <form onSubmit={simpanGrup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Grup <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rasa, Ukuran, Krim, Topping"
                  value={formGrup.nama}
                  onChange={(e) =>
                    setFormGrup({ ...formGrup, nama: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formGrup.urutan}
                    onChange={(e) =>
                      setFormGrup({ ...formGrup, urutan: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Jenis Pilihan
                  </label>
                  <select
                    value={formGrup.jenis_pilihan}
                    onChange={(e) =>
                      setFormGrup({ ...formGrup, jenis_pilihan: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
                  >
                    <option value="satu">Pilih Satu (Radio)</option>
                    <option value="banyak">Pilih Banyak (Checkbox)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Peran Visual (Preview Kue)
                </label>
                <select
                  value={formGrup.peran_visual}
                  onChange={(e) =>
                    setFormGrup({ ...formGrup, peran_visual: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
                >
                  <option value="">Tidak ada efek visual (hanya harga)</option>
                  <option value="ukuran">Ukuran (mengatur skala & tingkat kue)</option>
                  <option value="badan">Badan (mengatur warna dasar kue)</option>
                  <option value="krim">Krim (mengatur warna lapisan krim)</option>
                  <option value="topping">Topping (menempelkan hiasan di atas kue)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tampil di dashboard sebagai
                </label>
                <select
                  value={formGrup.peran_dashboard || ""}
                  onChange={(e) =>
                    setFormGrup({ ...formGrup, peran_dashboard: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm bg-white"
                >
                  <option value="">Tidak ditampilkan</option>
                  <option value="jenis">Grafik jenis kue (donut)</option>
                  <option value="terlaris">Daftar terlaris</option>
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  Item di grup ini yang dihitung di dashboard
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formGrup.wajib}
                    onChange={(e) =>
                      setFormGrup({ ...formGrup, wajib: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-400 border-stone-300"
                  />
                  <span className="text-xs font-medium text-stone-700">
                    Wajib Dipilih oleh Pelanggan saat Memesan
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalGrupBuka(false)}
                  className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="px-5 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {sedangProses ? "Menyimpan..." : "Simpan Grup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalItemBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {editItemId ? "Edit Opsi Item" : "Tambah Opsi Item"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Grup: <span className="font-semibold text-stone-800">{grupAktifForItem?.nama}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalItemBuka(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {pesanErrorForm.length > 0 && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                {pesanErrorForm.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}

            <form onSubmit={simpanItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Opsi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Coklat, Strawberry Segar, 20 cm"
                  value={formItem.nama}
                  onChange={(e) =>
                    setFormItem({ ...formItem, nama: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Harga Tambahan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={formItem.harga}
                    onChange={(e) =>
                      setFormItem({ ...formItem, harga: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Urutan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formItem.urutan}
                    onChange={(e) =>
                      setFormItem({ ...formItem, urutan: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Warna Hex (opsional)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formItem.warna || "#5c3a21"}
                      onChange={(e) =>
                        setFormItem({ ...formItem, warna: e.target.value })
                      }
                      className="w-10 h-10 p-0.5 rounded-xl border border-stone-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="#5c3a21"
                      value={formItem.warna}
                      onChange={(e) =>
                        setFormItem({ ...formItem, warna: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Kode Visual (opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: coklat, kecil, lilin"
                    value={formItem.kode_visual}
                    onChange={(e) =>
                      setFormItem({ ...formItem, kode_visual: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-rose-400 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formItem.aktif}
                    onChange={(e) =>
                      setFormItem({ ...formItem, aktif: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-400 border-stone-300"
                  />
                  <span className="text-xs font-medium text-stone-700">
                    Opsi Aktif (Tampil dan dapat dipilih pelanggan)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalItemBuka(false)}
                  className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sedangProses}
                  className="px-5 py-2.5 rounded-full font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {sedangProses ? "Menyimpan..." : "Simpan Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalPesan
        terbuka={notifikasi.terbuka}
        judul={notifikasi.judul}
        pesan={notifikasi.pesan}
        tipe={notifikasi.tipe}
        onTutup={() => setNotifikasi({ ...notifikasi, terbuka: false })}
      />
    </div>
  );
}