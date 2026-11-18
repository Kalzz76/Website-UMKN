import Link from "next/link";
import { formatTanggalSingkat } from "@/lib/format";
import PreviewKue from "@/components/PreviewKue";

export default function DashboardStafView({
  namaToko,
  slogan,
  antreanKue,
  stokMenipis,
}) {
  function getBadgeStatusClass(status) {
    if (status === "Diterima") return "bg-[#dcf5e4] text-[#26804a]";
    if (status === "Sedang Dibuat") return "bg-[#eff5dc] text-[#53702a]";
    if (status === "Siap") return "bg-[#d7f3e1] text-[#1c6e3d]";
    return "bg-[#eaf0eb] text-[#556e5f]";
  }

  return (
    <>
      <div className="section-top-row">
        <div className="hero-banner-card" style={{ gridColumn: "1 / -1" }}>
          <div className="hero-text-block" style={{ maxWidth: "70%" }}>
            <div className="hero-tag">Dapur Produksi</div>
            <h2 className="hero-heading">
              {namaToko || "Cravely Bakery"}!
              <span className="hero-sparkle-mark">///</span>
            </h2>
            <p className="hero-subtext">
              {slogan || "Buat hari lebih manis dengan kue terbaik kami ♡"}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        <div className="content-card">
          <div className="card-top-row">
            <div className="card-heading-group">
              <i className="fa-solid fa-fire-burner"></i>
              <h3 className="card-heading-text">Kue yang Harus Dibuat</h3>
            </div>
            <Link href="/dashboard/pesanan" className="card-see-all-link">
              <span>Lihat Semua Pesanan</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {antreanKue.length === 0 ? (
            <div className="empty-state-centered">
              Tidak ada antrean pembuatan kue saat ini
            </div>
          ) : (
            <div className="orders-flow-list">
              {antreanKue.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/pesanan/${item.kode_pesanan}`}
                  className="order-flow-row"
                >
                  <div className="order-thumb-meta">
                    <div className="order-preview-box">
                      <PreviewKue pilihan={item.pilihan || []} />
                    </div>
                    <div className="order-code-time">
                      <span className="order-code-title">
                        {item.kode_pesanan}
                      </span>
                      <span className="order-time-sub">
                        Target: {formatTanggalSingkat(item.tanggal_ambil)} •{" "}
                        {item.jam_ambil ? item.jam_ambil.slice(0, 5) : "-"}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "var(--color-text-main)",
                      }}
                    >
                      {item.nama_penerima}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {item.metode_pengiriman === "Ambil"
                        ? "Ambil di Tempat"
                        : "Kirim Kurir"}
                    </span>
                  </div>
                  <span
                    className={`order-status-pill ${getBadgeStatusClass(
                      item.status_pesanan
                    )}`}
                  >
                    {item.status_pesanan}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="content-card">
          <div className="card-top-row">
            <div className="card-heading-group">
              <i
                className="fa-solid fa-triangle-exclamation"
                style={{ color: "#c0392b" }}
              ></i>
              <h3 className="card-heading-text">Peringatan Stok Menipis</h3>
            </div>
            <Link href="/dashboard/stok" className="card-see-all-link">
              <span>Kelola Stok</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {stokMenipis.length === 0 ? (
            <div className="empty-state-centered">
              Semua stok bahan dalam kondisi aman
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {stokMenipis.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "#fef2f2",
                    borderRadius: "12px",
                    border: "1px solid #fee2e2",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#991b1b",
                      }}
                    >
                      {b.nama}
                    </span>
                    <span style={{ fontSize: "10px", color: "#b91c1c" }}>
                      Batas minimum: {b.batas_minimum} {b.satuan}
                    </span>
                  </div>
                  <span
                    style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      fontWeight: "800",
                      fontSize: "11.5px",
                      padding: "3px 8px",
                      borderRadius: "9999px",
                    }}
                  >
                    Sisa {b.jumlah} {b.satuan}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
