export default function PreviewKue({
  pilihan = [],
  tulisan = "",
  tulisanKue = "",
  tulisan_kue = "",
  className = "",
}) {
  const teksTulisan = tulisan || tulisanKue || tulisan_kue || "";

  let daftarPilihan = [];
  if (Array.isArray(pilihan)) {
    daftarPilihan = pilihan;
  } else if (pilihan && typeof pilihan === "object") {
    daftarPilihan = Object.values(pilihan);
  }

  let itemUkuran = null;
  let itemBadan = null;
  let itemKrim = null;
  let itemBentuk = null;
  const daftarTopping = [];
  const daftarStiker = [];

  for (let i = 0; i < daftarPilihan.length; i++) {
    const item = daftarPilihan[i];
    if (!item) continue;
    if (item.peran_visual === "ukuran") {
      itemUkuran = item;
    } else if (item.peran_visual === "badan") {
      itemBadan = item;
    } else if (item.peran_visual === "krim") {
      itemKrim = item;
    } else if (item.peran_visual === "topping") {
      daftarTopping.push(item);
    } else if (item.peran_visual === "bentuk") {
      itemBentuk = item;
    } else if (item.peran_visual === "stiker") {
      daftarStiker.push(item);
    }
  }

  const kodeUkuran = itemUkuran ? itemUkuran.kode_visual : "medium";
  const warnaBadan = itemBadan && itemBadan.warna ? itemBadan.warna : "#5c3a21";
  const warnaKrim = itemKrim && itemKrim.warna ? itemKrim.warna : "#ffffff";

  function tentukanWarnaTeks(hex) {
    if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
      return "#ffffff";
    }
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const kecerahan = (r * 299 + g * 587 + b * 114) / 1000;
    if (kecerahan > 150) {
      return "#451a03";
    }
    return "#ffffff";
  }

  const warnaTeks = tentukanWarnaTeks(warnaBadan);

  function buatJalurTetes(cx, topY, rx, ry, jumlahTetes, kedalaman) {
    let d = `M ${cx - rx} ${topY}`;
    const step = Math.PI / jumlahTetes;
    for (let i = 0; i < jumlahTetes; i++) {
      const sudutMulai = Math.PI - i * step;
      const sudutTengah = sudutMulai - step / 2;
      const sudutAkhir = sudutMulai - step;

      const xTengah = cx + rx * Math.cos(sudutTengah);
      const yTengah = topY + ry * Math.sin(sudutTengah) + kedalaman;

      const xAkhir = cx + rx * Math.cos(sudutAkhir);
      const yAkhir = topY + ry * Math.sin(sudutAkhir);

      d += ` Q ${xTengah} ${yTengah} ${xAkhir} ${yAkhir}`;
    }
    d += ` A ${rx} ${ry} 0 0 1 ${cx - rx} ${topY} Z`;
    return d;
  }

  let tiers = [];
  const kUkuran = (kodeUkuran || "").toLowerCase();
  if (kUkuran === "mini" || kUkuran === "small" || kUkuran === "kecil") {
    tiers = [
      {
        cx: 200,
        baseY: 275,
        rx: 95,
        ry: 26,
        height: 90,
        jumlahTetes: 6,
        kedalamanTetes: 14,
        isTopTier: true,
      },
    ];
  } else if (kUkuran === "large" || kUkuran === "besar") {
    tiers = [
      {
        cx: 200,
        baseY: 295,
        rx: 120,
        ry: 32,
        height: 55,
        jumlahTetes: 8,
        kedalamanTetes: 10,
        isTopTier: false,
      },
      {
        cx: 200,
        baseY: 240,
        rx: 90,
        ry: 25,
        height: 50,
        jumlahTetes: 6,
        kedalamanTetes: 10,
        isTopTier: false,
      },
      {
        cx: 200,
        baseY: 190,
        rx: 65,
        ry: 18,
        height: 45,
        jumlahTetes: 5,
        kedalamanTetes: 10,
        isTopTier: true,
      },
    ];
  } else {
    tiers = [
      {
        cx: 200,
        baseY: 285,
        rx: 110,
        ry: 30,
        height: 70,
        jumlahTetes: 7,
        kedalamanTetes: 12,
        isTopTier: false,
      },
      {
        cx: 200,
        baseY: 215,
        rx: 78,
        ry: 22,
        height: 60,
        jumlahTetes: 5,
        kedalamanTetes: 11,
        isTopTier: true,
      },
    ];
  }

  const topTier = tiers[tiers.length - 1];

  let adaLilin = false;
  let adaStrawberry = false;
  let adaCoklatChip = false;
  let adaBuah = false;

  for (let j = 0; j < daftarTopping.length; j++) {
    const kv = (daftarTopping[j]?.kode_visual || "").toLowerCase();
    if (kv === "lilin" || kv === "candle") adaLilin = true;
    if (kv === "strawberry" || kv === "straw") adaStrawberry = true;
    if (kv === "coklat_chip" || kv === "spr" || kv === "flower") adaCoklatChip = true;
    if (kv === "buah" || kv === "berry") adaBuah = true;
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 400 360"
        className="w-full h-auto max-w-sm select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="200"
          cy="325"
          rx="155"
          ry="24"
          fill="rgba(0, 0, 0, 0.06)"
        />

        <ellipse
          cx="200"
          cy="312"
          rx="150"
          ry="20"
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        <path
          d="M 50 312 A 150 20 0 0 0 350 312 v 6 A 150 20 0 0 1 50 318 Z"
          fill="#cbd5e1"
        />

        {tiers.map((t, idx) => {
          const topY = t.baseY - t.height;
          const midY = topY + t.height * 0.55;
          const tetesPath = buatJalurTetes(
            t.cx,
            topY,
            t.rx,
            t.ry,
            t.jumlahTetes,
            t.kedalamanTetes
          );

          return (
            <g key={idx}>
              <path
                d={`M ${t.cx - t.rx} ${topY} A ${t.rx} ${t.ry} 0 0 0 ${t.cx + t.rx} ${topY} L ${t.cx + t.rx} ${t.baseY} A ${t.rx} ${t.ry} 0 0 1 ${t.cx - t.rx} ${t.baseY} Z`}
                fill={warnaBadan}
              />

              <path
                d={`M ${t.cx} ${topY + t.ry} A ${t.rx} ${t.ry} 0 0 0 ${t.cx + t.rx} ${topY} L ${t.cx + t.rx} ${t.baseY} A ${t.rx} ${t.ry} 0 0 1 ${t.cx} ${t.baseY + t.ry} Z`}
                fill="rgba(0, 0, 0, 0.08)"
              />

              <path
                d={`M ${t.cx - t.rx + 2} ${midY} A ${t.rx - 2} ${t.ry} 0 0 0 ${t.cx + t.rx - 2} ${midY}`}
                stroke={warnaKrim}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />

              <ellipse
                cx={t.cx}
                cy={topY}
                rx={t.rx}
                ry={t.ry}
                fill={warnaBadan}
              />

              <ellipse
                cx={t.cx}
                cy={topY}
                rx={t.rx * 0.98}
                ry={t.ry * 0.98}
                fill={warnaKrim}
              />

              <path d={tetesPath} fill={warnaKrim} />

              <ellipse
                cx={t.cx}
                cy={topY}
                rx={t.rx * 0.92}
                ry={t.ry * 0.92}
                fill={warnaKrim}
              />
            </g>
          );
        })}

        {teksTulisan.trim() !== "" && (
          <g>
            <text
              x={topTier.cx}
              y={topTier.baseY - topTier.height * 0.42}
              textAnchor="middle"
              fill={warnaTeks}
              fontSize={teksTulisan.length > 18 ? "10" : teksTulisan.length > 12 ? "12" : "14"}
              fontWeight="800"
              letterSpacing="0.5"
            >
              {teksTulisan}
            </text>
          </g>
        )}

        {adaCoklatChip && (
          <g fill="#3e2312">
            <circle cx={topTier.cx - topTier.rx * 0.4} cy={topTier.baseY - topTier.height - topTier.ry * 0.2} r="3" />
            <circle cx={topTier.cx + topTier.rx * 0.45} cy={topTier.baseY - topTier.height - topTier.ry * 0.1} r="3.5" />
            <circle cx={topTier.cx - topTier.rx * 0.2} cy={topTier.baseY - topTier.height + topTier.ry * 0.3} r="3" />
            <circle cx={topTier.cx + topTier.rx * 0.2} cy={topTier.baseY - topTier.height + topTier.ry * 0.25} r="2.5" />
            <circle cx={topTier.cx} cy={topTier.baseY - topTier.height - topTier.ry * 0.35} r="3" />
          </g>
        )}

        {adaBuah && (
          <g>
            <g transform={`translate(${topTier.cx - topTier.rx * 0.45}, ${topTier.baseY - topTier.height - 4}) scale(0.85)`}>
              <path
                d="M 0 -10 C 6 -10 10 -4 7 6 C 4 12 0 14 0 14 C 0 14 -4 12 -7 6 C -10 -4 -6 -10 0 -10 Z"
                fill="#e11d48"
              />
              <path d="M -5 -9 C -2 -7 0 -9 0 -9 C 0 -9 2 -7 5 -9 C 2 -6 0 -6 0 -6 C 0 -6 -2 -6 -5 -9 Z" fill="#15803d" />
            </g>
            <g transform={`translate(${topTier.cx + topTier.rx * 0.45}, ${topTier.baseY - topTier.height}) scale(0.9)`}>
              <path
                d="M -10 0 A 10 10 0 0 1 10 0 Z"
                fill="#ea580c"
              />
              <path
                d="M -8 -1 A 8 8 0 0 1 8 -1 Z"
                fill="#fed7aa"
              />
              <path
                d="M -6 -2 A 6 6 0 0 1 6 -2 Z"
                fill="#fb923c"
              />
            </g>
            <circle cx={topTier.cx - topTier.rx * 0.15} cy={topTier.baseY - topTier.height - topTier.ry * 0.3} r="5" fill="#4338ca" />
            <circle cx={topTier.cx + topTier.rx * 0.15} cy={topTier.baseY - topTier.height - topTier.ry * 0.35} r="4.5" fill="#3730a3" />
          </g>
        )}

        {adaStrawberry && !adaBuah && (
          <g>
            <g transform={`translate(${topTier.cx - topTier.rx * 0.35}, ${topTier.baseY - topTier.height - 4}) scale(0.9)`}>
              <path
                d="M 0 -12 C 7 -12 11 -4 8 7 C 5 13 0 16 0 16 C 0 16 -5 13 -8 7 C -11 -4 -7 -12 0 -12 Z"
                fill="#e11d48"
              />
              <path d="M -6 -11 C -2 -8 0 -10 0 -10 C 0 -10 2 -8 6 -11 C 3 -7 0 -8 0 -8 C 0 -8 -3 -7 -6 -11 Z" fill="#16a34a" />
              <circle cx="-2" cy="0" r="0.8" fill="#fef08a" />
              <circle cx="2" cy="2" r="0.8" fill="#fef08a" />
              <circle cx="0" cy="6" r="0.8" fill="#fef08a" />
            </g>
            <g transform={`translate(${topTier.cx + topTier.rx * 0.35}, ${topTier.baseY - topTier.height - 4}) scale(0.9)`}>
              <path
                d="M 0 -12 C 7 -12 11 -4 8 7 C 5 13 0 16 0 16 C 0 16 -5 13 -8 7 C -11 -4 -7 -12 0 -12 Z"
                fill="#e11d48"
              />
              <path d="M -6 -11 C -2 -8 0 -10 0 -10 C 0 -10 2 -8 6 -11 C 3 -7 0 -8 0 -8 C 0 -8 -3 -7 -6 -11 Z" fill="#16a34a" />
              <circle cx="-2" cy="0" r="0.8" fill="#fef08a" />
              <circle cx="2" cy="2" r="0.8" fill="#fef08a" />
              <circle cx="0" cy="6" r="0.8" fill="#fef08a" />
            </g>
          </g>
        )}

        {adaLilin && (
          <g transform={`translate(${topTier.cx}, ${topTier.baseY - topTier.height})`}>
            <rect
              x="-4"
              y="-38"
              width="8"
              height="36"
              rx="2"
              fill="#0ea5e9"
            />
            <path
              d="M -4 -30 L 4 -26 M -4 -20 L 4 -16 M -4 -10 L 4 -6"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="0"
              y1="-38"
              x2="0"
              y2="-44"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <ellipse
              cx="0"
              cy="-52"
              rx="6"
              ry="10"
              fill="#fef08a"
              opacity="0.5"
            />
            <path
              d="M 0 -58 C 4 -53 5 -47 0 -44 C -5 -47 -4 -53 0 -58 Z"
              fill="#f59e0b"
            />
            <path
              d="M 0 -55 C 2 -52 3 -48 0 -46 C -3 -48 -2 -52 0 -55 Z"
              fill="#ef4444"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
