"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Chart from "chart.js/auto";
import { formatRupiah, formatTanggalSingkat, formatWaktu } from "@/lib/format";
import PreviewKue from "@/components/PreviewKue";

export default function DashboardAdminView({
  namaToko,
  slogan,
  kueHariIni = 0,
  metrikPeriode,
  dataGrafik,
  terlarisPerPeriode,
  donutPerPeriode,
  pesananTerbaru,
}) {
  const [periodeAktif, setPeriodeAktif] = useState("bulan_ini");
  const [rentangGrafik, setRentangGrafik] = useState("7hari");
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const donutCanvasRef = useRef(null);
  const donutInstanceRef = useRef(null);

  const metrik = metrikPeriode[periodeAktif] || metrikPeriode.bulan_ini || {
    totalPesanan: 0,
    persenPesanan: null,
    perluDikonfirmasi: 0,
    totalPendapatan: 0,
    persenPendapatan: null,
    pelangganAktif: 0,
    persenPelanggan: null,
  };

  const donutInfo = donutPerPeriode[periodeAktif] || {
    adaGrup: false,
    namaGrup: "",
    kosong: true,
    pesan: "Belum ada grup yang diset sebagai jenis kue di menu Harga & Opsi",
    items: [],
    total: 0,
  };

  const terlarisInfo = terlarisPerPeriode[periodeAktif] || {
    adaGrup: false,
    namaGrup: "",
    kosong: true,
    pesan: "Belum ada grup yang diset sebagai terlaris di menu Harga & Opsi",
    items: [],
  };

  useEffect(() => {
    if (!chartCanvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const configGrafik = dataGrafik[rentangGrafik] || {
      labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
      data: [0, 0, 0, 0, 0, 0, 0],
    };

    const ctx = chartCanvasRef.current.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 165);
    gradient.addColorStop(0, "rgba(28, 78, 61, 0.30)");
    gradient.addColorStop(1, "rgba(28, 78, 61, 0.0)");

    let maxVal = 0;
    let maxIndex = -1;
    for (let i = 0; i < configGrafik.data.length; i++) {
      if (configGrafik.data[i] > maxVal) {
        maxVal = configGrafik.data[i];
        maxIndex = i;
      }
    }

    const pointBackgroundColors = configGrafik.data.map((_, i) =>
      i === maxIndex && maxVal > 0 ? "#1e4839" : "#ffffff"
    );
    const pointRadiuses = configGrafik.data.map((_, i) =>
      i === maxIndex && maxVal > 0 ? 6 : 4
    );

    const hitungMaxY = maxVal > 0 ? Math.ceil(maxVal * 1.25) : 100000;

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: configGrafik.labels,
        datasets: [
          {
            label: "Pendapatan",
            data: configGrafik.data,
            borderColor: "#1e4839",
            borderWidth: 2.8,
            pointBackgroundColor: pointBackgroundColors,
            pointBorderColor: "#1e4839",
            pointBorderWidth: 2.5,
            pointRadius: pointRadiuses,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: "#1e4839",
            pointHoverBorderColor: "#ffffff",
            fill: true,
            backgroundColor: gradient,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#17382d",
            titleFont: { family: "Plus Jakarta Sans", size: 11 },
            bodyFont: { family: "Plus Jakarta Sans", size: 12, weight: "700" },
            padding: 8,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function (contextItem) {
                return formatRupiah(contextItem.parsed.y);
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#7f9488",
              font: { family: "Plus Jakarta Sans", size: 10.5, weight: "600" },
            },
          },
          y: {
            min: 0,
            max: hitungMaxY,
            ticks: {
              color: "#7f9488",
              font: { family: "Plus Jakarta Sans", size: 10, weight: "600" },
              callback: function (val) {
                if (val >= 1000000) {
                  return (
                    (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1) + "jt"
                  );
                }
                if (val >= 1000) {
                  return (val / 1000).toFixed(0) + "rb";
                }
                return val;
              },
            },
            grid: {
              color: "rgba(215, 226, 218, 0.45)",
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [rentangGrafik, dataGrafik]);

  useEffect(() => {
    if (!donutCanvasRef.current) return;

    if (donutInstanceRef.current) {
      donutInstanceRef.current.destroy();
    }

    if (!donutInfo.adaGrup || donutInfo.kosong || donutInfo.items.length === 0) {
      return;
    }

    const ctx = donutCanvasRef.current.getContext("2d");
    const labels = donutInfo.items.map((item) => item.nama);
    const dataValues = donutInfo.items.map((item) => item.jumlah);
    const backgroundColors = donutInfo.items.map((item) => item.warna);

    donutInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: backgroundColors,
            borderWidth: 3,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#17382d",
            bodyFont: { family: "Plus Jakarta Sans", size: 11, weight: "600" },
            cornerRadius: 8,
            callbacks: {
              label: function (ctxItem) {
                const nilai = ctxItem.raw || 0;
                const persen =
                  donutInfo.total > 0
                    ? Math.round((nilai / donutInfo.total) * 100)
                    : 0;
                return ` ${ctxItem.label}: ${nilai} (${persen}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (donutInstanceRef.current) {
        donutInstanceRef.current.destroy();
      }
    };
  }, [donutInfo]);

  function getBadgeStatusClass(status) {
    if (status === "Menunggu Pembayaran") return "bg-[#eaf0eb] text-[#556e5f]";
    if (status === "Diterima") return "bg-[#dcf5e4] text-[#26804a]";
    if (status === "Sedang Dibuat") return "bg-[#eff5dc] text-[#53702a]";
    if (status === "Siap") return "bg-[#d7f3e1] text-[#1c6e3d]";
    if (status === "Dikirim") return "bg-[#daf1ec] text-[#1f7366]";
    if (status === "Selesai") return "bg-[#d8edd9] text-[#17382d]";
    return "bg-[#fae8e8] text-[#9c3838]";
  }

  const badgeRankClasses = ["gold", "silver", "bronze"];

  const judulDonut = donutInfo.namaGrup
    ? `Pesanan Berdasarkan ${donutInfo.namaGrup}`
    : "Pesanan Berdasarkan Jenis Kue";

  const judulTerlaris = terlarisInfo.namaGrup
    ? `${terlarisInfo.namaGrup} Terlaris`
    : "Daftar Terlaris";

  return (
    <>
      <div className="section-top-row">
        <div className="hero-banner-card">
          <div className="hero-text-block">
            <div className="hero-tag">Selamat Datang di</div>
            <h2 className="hero-heading">
              {namaToko || "Cravely Bakery"}!
              <span className="hero-sparkle-mark">///</span>
            </h2>
            <p className="hero-subtext">
              {slogan || "Buat hari lebih manis dengan kue terbaik kami ♡"}
            </p>
          </div>
        </div>

        <div className="metrics-column-wrapper">
          <div className="metrics-header-bar">
            <div className="card-heading-group">
              <i className="fa-solid fa-chart-pie"></i>
              <span className="card-heading-text">Ringkasan Toko</span>
            </div>
            <div className="period-select-wrap">
              <i className="fa-regular fa-calendar"></i>
              <span className="period-select-label">Periode:</span>
              <select
                className="period-select-dropdown"
                value={periodeAktif}
                onChange={(e) => setPeriodeAktif(e.target.value)}
                aria-label="Pilih Periode"
              >
                <option value="hari_ini">Hari Ini</option>
                <option value="minggu_ini">Minggu Ini</option>
                <option value="bulan_ini">Bulan Ini</option>
                <option value="tahun_ini">Tahun Ini</option>
              </select>
            </div>
          </div>

          <div className="metrics-quad-grid">
            <div className="metric-item-box">
              <div className="metric-icon-wrap green">
                <i className="fa-solid fa-bag-shopping"></i>
              </div>
              <div className="metric-info-col">
                <span className="metric-lbl">Total Pesanan</span>
                <div className="metric-val-row">
                  <span className="metric-val">
                    {metrik.totalPesanan.toLocaleString("id-ID")}
                  </span>
                  {metrik.persenPesanan !== null && (
                    <span
                      className={`metric-growth-rate ${
                        metrik.persenPesanan < 0 ? "down" : ""
                      }`}
                    >
                      <i
                        className={`fa-solid ${
                          metrik.persenPesanan < 0
                            ? "fa-arrow-down"
                            : "fa-arrow-up"
                        }`}
                      ></i>
                      {metrik.persenPesanan > 0 ? "+" : ""}
                      {metrik.persenPesanan}%
                    </span>
                  )}
                </div>
                <span className="metric-sub-detail">
                  {kueHariIni} kue harus dibuat hari ini
                </span>
              </div>
              <svg className="metric-wave-svg" viewBox="0 0 100 50" fill="none">
                <path
                  d="M0 45 C30 20 60 50 100 25"
                  stroke="#90c6a9"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M10 50 C40 30 70 55 100 38"
                  stroke="#badbc8"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>

            <div className="metric-item-box">
              <div className="metric-icon-wrap cherry">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div className="metric-info-col">
                <span className="metric-lbl">Perlu Dikonfirmasi</span>
                <div className="metric-val-row">
                  <span className="metric-val">
                    {metrik.perluDikonfirmasi.toLocaleString("id-ID")}
                  </span>
                </div>
                <span className="metric-sub-detail">bukti bayar</span>
              </div>
              <svg className="metric-wave-svg" viewBox="0 0 100 50" fill="none">
                <path
                  d="M0 45 C30 25 60 48 100 28"
                  stroke="#f1a69d"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M10 50 C40 35 70 55 100 40"
                  stroke="#fad0cb"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>

            <div className="metric-item-box">
              <div className="metric-icon-wrap gold">
                <i className="fa-solid fa-coins"></i>
              </div>
              <div className="metric-info-col">
                <span className="metric-lbl">Total Pendapatan</span>
                <div className="metric-val-row">
                  <span className="metric-val money">
                    {formatRupiah(metrik.totalPendapatan)}
                  </span>
                  {metrik.persenPendapatan !== null && (
                    <span
                      className={`metric-growth-rate ${
                        metrik.persenPendapatan < 0 ? "down" : ""
                      }`}
                    >
                      <i
                        className={`fa-solid ${
                          metrik.persenPendapatan < 0
                            ? "fa-arrow-down"
                            : "fa-arrow-up"
                        }`}
                      ></i>
                      {metrik.persenPendapatan > 0 ? "+" : ""}
                      {metrik.persenPendapatan}%
                    </span>
                  )}
                </div>
              </div>
              <svg className="metric-wave-svg" viewBox="0 0 100 50" fill="none">
                <path
                  d="M0 45 C30 22 60 45 100 25"
                  stroke="#eccf8c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M10 50 C40 32 70 52 100 36"
                  stroke="#f6e5be"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>

            <div className="metric-item-box">
              <div className="metric-icon-wrap peach">
                <i className="fa-solid fa-users"></i>
              </div>
              <div className="metric-info-col">
                <span className="metric-lbl">Pelanggan Aktif</span>
                <div className="metric-val-row">
                  <span className="metric-val">
                    {metrik.pelangganAktif.toLocaleString("id-ID")}
                  </span>
                  {metrik.persenPelanggan !== null && (
                    <span
                      className={`metric-growth-rate ${
                        metrik.persenPelanggan < 0 ? "down" : ""
                      }`}
                    >
                      <i
                        className={`fa-solid ${
                          metrik.persenPelanggan < 0
                            ? "fa-arrow-down"
                            : "fa-arrow-up"
                        }`}
                      ></i>
                      {metrik.persenPelanggan > 0 ? "+" : ""}
                      {metrik.persenPelanggan}%
                    </span>
                  )}
                </div>
              </div>
              <svg className="metric-wave-svg" viewBox="0 0 100 50" fill="none">
                <path
                  d="M0 45 C30 25 60 48 100 28"
                  stroke="#e8bda4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M10 50 C40 35 70 55 100 40"
                  stroke="#f5dcd0"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="section-bottom-row">
        <div className="main-cards-column">
          <div className="row-middle-cards">
            <div className="content-card">
              <div className="card-top-row">
                <div className="card-heading-group">
                  <i className="fa-solid fa-chart-line"></i>
                  <h3 className="card-heading-text">Grafik Penjualan</h3>
                </div>
                <div className="chart-filter-pills">
                  <button
                    type="button"
                    className={`filter-pill-btn ${
                      rentangGrafik === "7hari" ? "active" : ""
                    }`}
                    onClick={() => setRentangGrafik("7hari")}
                  >
                    7 Hari
                  </button>
                  <button
                    type="button"
                    className={`filter-pill-btn ${
                      rentangGrafik === "30hari" ? "active" : ""
                    }`}
                    onClick={() => setRentangGrafik("30hari")}
                  >
                    30 Hari
                  </button>
                  <button
                    type="button"
                    className={`filter-pill-btn ${
                      rentangGrafik === "90hari" ? "active" : ""
                    }`}
                    onClick={() => setRentangGrafik("90hari")}
                  >
                    90 Hari
                  </button>
                </div>
              </div>

              <div className="chart-canvas-box">
                <canvas ref={chartCanvasRef}></canvas>
              </div>
            </div>

            <div className="content-card">
              <div className="card-top-row">
                <div className="card-heading-group">
                  <i className="fa-solid fa-crown"></i>
                  <h3 className="card-heading-text">{judulTerlaris}</h3>
                </div>
                <Link
                  href="/dashboard/harga-opsi"
                  className="card-see-all-link"
                >
                  <span>Atur</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>

              {!terlarisInfo.adaGrup ? (
                <div className="empty-state-centered">
                  {terlarisInfo.pesan}
                </div>
              ) : terlarisInfo.kosong || terlarisInfo.items.length === 0 ? (
                <div className="empty-state-centered">
                  {terlarisInfo.pesan}
                </div>
              ) : (
                <div className="popular-items-list">
                  {terlarisInfo.items.map((item, index) => (
                    <div key={item.nama} className="pop-row-item">
                      <div
                        className={`rank-num-badge ${
                          badgeRankClasses[index] || "bronze"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div
                        className="pop-color-dot"
                        style={{ backgroundColor: item.warna || "#17382d" }}
                        title={item.nama}
                      />
                      <div className="pop-info-cell">
                        <div className="pop-title-ratio">
                          <span className="pop-item-name">{item.nama}</span>
                          <span className="pop-item-percent">
                            {item.persen}%
                          </span>
                        </div>
                        <div className="pop-item-sold">
                          {item.jumlah} terjual
                        </div>
                        <div className="pop-progress-rail">
                          <div
                            className="pop-progress-bar"
                            style={{ width: `${item.persen}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="row-bottom-cards">
            <div className="content-card">
              <div className="card-top-row">
                <div className="card-heading-group">
                  <i className="fa-solid fa-cake-candles"></i>
                  <h3 className="card-heading-text">{judulDonut}</h3>
                </div>
              </div>

              {!donutInfo.adaGrup ? (
                <div className="empty-state-centered">{donutInfo.pesan}</div>
              ) : donutInfo.kosong || donutInfo.items.length === 0 ? (
                <div className="empty-state-centered">{donutInfo.pesan}</div>
              ) : (
                <div className="donut-body-wrap">
                  <div className="donut-chart-holder">
                    <canvas ref={donutCanvasRef}></canvas>
                    <div className="donut-center-stat">
                      <div className="donut-number-val">{donutInfo.total}</div>
                      <div className="donut-number-lbl">Pesanan</div>
                    </div>
                  </div>

                  <div className="donut-legend-col">
                    {donutInfo.items.map((item) => (
                      <div key={item.nama} className="legend-row-item">
                        <div className="legend-bullet-text">
                          <span
                            className="legend-dot-circle"
                            style={{ backgroundColor: item.warna }}
                          ></span>
                          <span>{item.nama}</span>
                        </div>
                        <span className="legend-val-num">{item.persen}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="content-card">
              <div className="card-top-row">
                <div className="card-heading-group">
                  <i className="fa-regular fa-clock"></i>
                  <h3 className="card-heading-text">Pesanan Terbaru</h3>
                </div>
                <Link href="/dashboard/pesanan" className="card-see-all-link">
                  <span>Lihat Semua</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>

              {pesananTerbaru.length === 0 ? (
                <div className="empty-state-centered">
                  Belum ada pesanan terbaru
                </div>
              ) : (
                <div className="orders-flow-list">
                  {pesananTerbaru.map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/pesanan?kode=${p.kode_pesanan}`}
                      className="order-flow-row"
                    >
                      <div className="order-thumb-meta">
                        <div className="order-preview-box">
                          {p.fotoPreviewUrl ? (
                            <img
                              src={p.fotoPreviewUrl}
                              alt="Thumbnail"
                              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                            />
                          ) : (
                            <PreviewKue pilihan={p.pilihan || []} />
                          )}
                        </div>
                        <div className="order-code-time">
                          <span className="order-code-title">
                            {p.kode_pesanan}
                          </span>
                          <span className="order-time-sub">
                            {formatTanggalSingkat(p.dibuat_pada)} •{" "}
                            {formatWaktu(p.dibuat_pada)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`order-status-pill ${getBadgeStatusClass(
                          p.status_pesanan
                        )}`}
                      >
                        {p.status_pesanan}
                      </span>
                      <span className="order-price-val">
                        {formatRupiah(p.total_bayar)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="vertical-promo-card"></div>
      </div>
    </>
  );
}
