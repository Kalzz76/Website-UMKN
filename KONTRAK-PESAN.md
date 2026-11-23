# Panduan Integrasi Studio Custom Cake ke Keranjang

Dokumen ini adalah spesifikasi kontrak teknis untuk menghubungkan halaman studio custom cake (`/pesan`) ke sistem keranjang terpadu (`/checkout`).

## Endpoint Tambah ke Keranjang

- **URL**: `/api/keranjang`
- **Method**: `POST`
- **Authentication**: Wajib login sebagai pengguna/pelanggan (terautentikasi melalui Supabase Auth cookies). Jika belum login, API mengembalikan HTTP 401.
- **Content-Type**: `multipart/form-data`

---

## Format FormData

| Field | Tipe | Wajib? | Keterangan & Aturan Validasi |
| :--- | :--- | :---: | :--- |
| `jenis` | String | **Ya** | Harus bernilai `"Custom"`. |
| `pilihan` | String (JSON) | **Ya** | JSON array berisi daftar item opsi yang dipilih pelanggan.<br>Format: `[{"id_item": 1, "jumlah": 1}, {"id_item": 5, "jumlah": 2}]`<br>• Semua grup bertipe `wajib = true` harus terisi.<br>• Grup dengan `jenis_pilihan = 'satu'` tidak boleh duplikat.<br>• Untuk grup `jenis_pilihan = 'banyak'`, jumlah maksimal per item adalah 20. |
| `tulisan_kue` | String | Tidak | Teks ucapan yang akan ditulis di atas kue (maksimal 100 karakter). |
| `catatan` | String | Tidak | Catatan tambahan atau instruksi khusus dari pemesan. |
| `desain_json` | String (JSON) | Tidak | JSON object struktur visual 3D (template, posisi stiker, teks dekorasi, warna). |
| `foto_preview` | File (Blob) | **Ya** | File gambar snapshot render 3D kue (format JPG atau PNG, ukuran maksimal 2 MB). |
| `foto_bentuk_kustom` | File (Blob) | Kondisional | Wajib dilampirkan jika memilih opsi bentuk kustom ("Buat Bentuk Sendiri"). Format JPG/PNG, maksimal 2 MB. |
| `foto_gambar_kustom` | File (Blob) | Kondisional | Wajib dilampirkan jika memilih opsi stiker/gambar kustom ("Gambar Kustom"). Format JPG/PNG, maksimal 2 MB. |

---

## Contoh Pengiriman (JavaScript Client)

```javascript
const formData = new FormData();
formData.append("jenis", "Custom");

const pilihanOpsi = [
  { id_item: 1, jumlah: 1 },
  { id_item: 4, jumlah: 1 },
  { id_item: 12, jumlah: 2 }
];
formData.append("pilihan", JSON.stringify(pilihanOpsi));

formData.append("tulisan_kue", "Happy 20th Birthday!");
formData.append("catatan", "Krim jangan terlalu manis ya kak.");
formData.append("desain_json", JSON.stringify(studioState3D));

formData.append("foto_preview", blobSnapshot3D, "snapshot-kue.png");

if (fileBentukKustom) {
  formData.append("foto_bentuk_kustom", fileBentukKustom);
}
if (fileGambarKustom) {
  formData.append("foto_gambar_kustom", fileGambarKustom);
}

const response = await fetch("/api/keranjang", {
  method: "POST",
  body: formData,
});

if (response.status === 401) {
  window.location.href = "/masuk?ke=/pesan";
  return;
}

const hasil = await response.json();
if (!response.ok) {
  alert(hasil.pesan || "Gagal memasukkan ke keranjang.");
  return;
}

window.location.href = "/checkout";
```

---

## Format Respon

### Respon Sukses (HTTP 200)

```json
{
  "sukses": true,
  "pesan": "Kue custom berhasil ditambahkan ke keranjang.",
  "id_item": 42
}
```

### Respon Error

- **HTTP 401 Unauthorized**:
  ```json
  { "pesan": "Silakan masuk terlebih dahulu." }
  ```

- **HTTP 400 Bad Request** (Validasi gagal):
  ```json
  { "pesan": "Grup Ukuran Kue wajib dipilih." }
  ```

- **HTTP 400 Bad Request** (Batas item):
  ```json
  { "pesan": "Maksimal 10 kue custom dalam satu keranjang." }
  ```
  atau
  ```json
  { "pesan": "Keranjang belanja sudah penuh (maksimal 20 item)." }
  ```

---

## Endpoint Terkait Lainnya

1. **Jumlah Item Keranjang (Untuk Badge Navbar)**:
   - `GET /api/keranjang/jumlah`
   - Mengembalikan `{ "jumlah": 3 }`

2. **Daftar Isi Keranjang**:
   - `GET /api/keranjang`
   - Mengembalikan `{ "items": [...], "ringkasan": {...} }`
