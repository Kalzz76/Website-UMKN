"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as THREE from "three";
import PreviewKue from "@/components/PreviewKue";
import PortalLedge from "@/components/PortalLedge";
import { DynamicIslandNavbar } from "@/components/patisserie/DynamicIslandNavbar";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { hitungTotal } from "@/lib/hitungHarga";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/format";
import "./cakecraft.css";

const VISUAL_SIZE = {
  mini: { d: 10, s: "1–2 orang" },
  small: { d: 14, s: "3–5 orang" },
  medium: { d: 18, s: "6–10 orang" },
  large: { d: 22, s: "10–15 orang" },
};

const VISUAL_DECO_ICON = {
  drip: "🍫",
  straw: "🍓",
  berry: "🫐",
  flower: "🌸",
  spr: "✨",
  candle: "🕯️",
};

const VISUAL_ELS = {
  stiker: { icon: "😊", emos: ["❤️", "💗", "⭐", "🌈", "😊"] },
  topper: { icon: "⭐", emos: ["🐰", "🐻", "🦄", "🎀", "👑"] },
  bunga: { icon: "🌸", emos: ["🌸", "🌼", "🌷", "🌹"] },
  buah: { icon: "🍎", emos: ["🍓", "🍒", "🍑", "🫐", "🍋"] },
  cokelat: { icon: "🍫", emos: ["🍫", "🍪", "🍩", "🍬", "🍭"] },
  lainnya: { icon: "•••", emos: ["🎈", "✨", "🎉", "🧁"] },
};

const FONTS = ["Baloo 2", "Pacifico", "Fredoka", "Dancing Script", "Nunito"];
const PAL = [
  "#fbd5e0",
  "#D96B91",
  "#e53935",
  "#ffb38a",
  "#ffd54f",
  "#81c784",
  "#90caf9",
  "#d1c4e9",
  "#5c6bc0",
  "#ab47bc",
  "#6d3b27",
];

const CAT = [
  [-0.95, 0.1],
  [-0.9, -0.8],
  [-0.45, -0.45],
  [0, -0.55],
  [0.45, -0.45],
  [0.9, -0.8],
  [0.95, 0.1],
  [0.8, 0.55],
  [0.4, 0.85],
  [0, 0.92],
  [-0.4, 0.85],
  [-0.8, 0.55],
];

const STEPS = [
  ["Jenis Kue", "🧁"],
  ["Ukuran", "⤢"],
  ["Bentuk", "⬡"],
  ["Rasa", "🎨"],
  ["Dekorasi", "☆"],
  ["Custom Desain", "✎"],
  ["Rincian Bahan", "🧾"],
  ["Pengambilan", "🚚"],
  ["Review Pesanan", "💌"],
];

const STEPS_PER_TYPE = {
  cake:    [0, 1, 2, 3, 4, 5, 6],
  cupcake: [0, 1, 3, 4, 6],
  tart:    [0, 1, 3, 4, 6],
  donut:   [0, 1, 3, 4, 6],
  cookies: [0, 1, 3, 4, 6],
};

function getActiveSteps(itemType) {
  return STEPS_PER_TYPE[itemType] || STEPS_PER_TYPE.cake;
}

const STEP_LABEL_OVERRIDE = {
  cupcake: { 1: "Porsi Cupcake", 3: "Rasa Muffin", 4: "Topping & Krim" },
  tart:    { 1: "Ukuran Tart", 3: "Rasa Custard", 4: "Topping Buah" },
  donut:   { 1: "Jumlah Donat", 3: "Rasa Adonan", 4: "Glaze & Topping" },
  cookies: { 1: "Jumlah Cookies", 3: "Varian Rasa", 4: "Topping & Extra" },
};

const STEP_DESC_OVERRIDE = {
  cupcake: {
    1: "Pilih jumlah atau paket cupcake yang ingin kamu pesan.",
    3: "Pilih rasa adonan muffin cupcake favoritmu.",
    4: "Pilih frosting swirl krim dan hiasan di atas cupcake.",
  },
  tart: {
    1: "Pilih ukuran kue pie atau fruit tart sesuai kebutuhanmu.",
    3: "Pilih rasa isian custard lembut di dalam pie.",
    4: "Pilih topping buah segar atau hiasan di atas pie.",
  },
  donut: {
    1: "Pilih jumlah donat satuan atau paket boks pesta.",
    3: "Pilih rasa adonan donat kentang lembut.",
    4: "Pilih lelehan glaze berkilau dan taburan topping donat.",
  },
  cookies: {
    1: "Pilih jumlah keping soft-baked cookies atau toples.",
    3: "Pilih varian rasa adonan cookies renyah lumer.",
    4: "Pilih ekstra taburan choco chips atau sprinkles pelangi.",
  },
};

const SIZE_CONFIG = {
  cake: {
    mini: { label: "Mini", sub: "Diameter 10 cm (1–2 orang)" },
    small: { label: "Small", sub: "Diameter 14 cm (3–5 orang)" },
    medium: { label: "Medium", sub: "Diameter 18 cm (6–10 orang)" },
    large: { label: "Large", sub: "Diameter 22 cm (10–15 orang)" },
  },
  cupcake: {
    mini: { label: "Satuan (1 Pcs)", sub: "1 buah cupcake manis" },
    small: { label: "Paket 2 Pcs", sub: "2 buah cupcake favorit" },
    medium: { label: "Box 4 Pcs", sub: "Box isi 4 cupcake pesta" },
    large: { label: "Box 6 Pcs", sub: "Box isi 6 cupcake hampers" },
  },
  tart: {
    mini: { label: "Mini Tart", sub: "Diameter 8 cm (1 orang)" },
    small: { label: "Medium Tart", sub: "Diameter 14 cm (2–3 orang)" },
    medium: { label: "Large Tart", sub: "Diameter 18 cm (4–6 orang)" },
    large: { label: "Party Tart", sub: "Diameter 22 cm (8–10 orang)" },
  },
  donut: {
    mini: { label: "Satuan (1 Pcs)", sub: "1 buah donat empuk" },
    small: { label: "Paket 3 Pcs", sub: "3 buah donat kombinasi" },
    medium: { label: "Half Dozen (6 Pcs)", sub: "Box isi 6 donat lezat" },
    large: { label: "One Dozen (12 Pcs)", sub: "Box isi 12 donat pesta" },
  },
  cookies: {
    mini: { label: "1 Giant Cookie", sub: "1 keping cookie jumbo" },
    small: { label: "Paket 3 Cookies", sub: "3 keping cookie lezat" },
    medium: { label: "Box 6 Cookies", sub: "Box isi 6 keping cookie" },
    large: { label: "Jar / Toples", sub: "Toples cookies istimewa" },
  },
};

const BASE_TYPES = [
  {
    key: "cake",
    label: "Kue Ultah",
    desc: "Kue ulang tahun spons klasik berlapis lembut",
    icon: "🎂",
  },
  {
    key: "cupcake",
    label: "Cupcake",
    desc: "Muffin lembut berpori dalam paper cup pleated",
    icon: "🧁",
  },
  {
    key: "tart",
    label: "Kue Pie",
    desc: "Pie crust renyah dengan isian custard lembut",
    icon: "🥧",
  },
  {
    key: "donut",
    label: "Donat",
    desc: "Donat goreng empuk dengan proofing ring sempurna",
    icon: "🍩",
  },
  {
    key: "cookies",
    label: "Cookies",
    desc: "Soft-baked butter cookies renyah dengan choco chips",
    icon: "🍪",
  },
];

const MENU_CATEGORIES = [
  { key: "semua", label: "Semua", icon: "✨" },
  { key: "ultah", label: "Kue Ulang Tahun", icon: "🎂" },
  { key: "tart", label: "Kue Tart", icon: "🥧" },
  { key: "cupcake", label: "Cupcake", icon: "🧁" },
  { key: "donut", label: "Donat", icon: "🍩" },
  { key: "cookies", label: "Cookies", icon: "🍪" },
];

const TPL = [
  {
    id: 1,
    n: "Strawberry Shortcake",
    cat: "ultah",
    catLabel: "Kue Ulang Tahun",
    d: "Sponge vanila super lembut, chantilly cream & stroberi Lembang",
    badge: "Terlaris",
    price: 110000,
    itemType: "cake",
    s: {
      shape: "round",
      size: "small",
      flavor: "vanilla",
      fill: "jam",
      icing: "#FFFDF9",
      deco: { drip: true, straw: true },
      items: [
        {
          id: 1,
          t: "text",
          text: "Happy Birthday!",
          font: "Baloo 2",
          px: 28,
          color: "#9E3B42",
          align: "center",
          fx: "normal",
        },
      ],
    },
  },
  {
    id: 2,
    n: "Chocolate Fudge Cake",
    cat: "tart",
    catLabel: "Kue Tart",
    d: "Cokelat Belgia 70% intens, ganache lumer berkilau",
    badge: "Favorit",
    price: 120000,
    itemType: "cake",
    s: {
      shape: "round",
      size: "medium",
      flavor: "choco",
      fill: "ganache",
      icing: "#4A2B20",
      deco: { drip: true, berry: true },
      items: [],
    },
  },
  {
    id: 3,
    n: "Red Velvet Rose Cake",
    cat: "ultah",
    catLabel: "Kue Ulang Tahun",
    d: "Kue hati red velvet, cream cheese New Zealand & kelopak mawar",
    badge: "Signature",
    price: 125000,
    itemType: "cake",
    s: {
      shape: "heart",
      size: "small",
      flavor: "velvet",
      fill: "cheese",
      icing: "#FFF8F0",
      deco: { flower: true, drip: true },
      items: [],
    },
  },
  {
    id: 4,
    n: "Vintage Coquette Cake",
    cat: "ultah",
    catLabel: "Kue Ulang Tahun",
    d: "Kue piping pita Lambeth estetik, mawar & mutiara",
    badge: "Viral di Bandung",
    price: 110000,
    itemType: "cake",
    s: {
      shape: "round",
      size: "medium",
      flavor: "vanilla",
      fill: "cream",
      icing: "#F8D7E0",
      deco: { drip: true, flower: true, straw: true },
      items: [
        {
          id: 1,
          t: "text",
          text: "Vintage Coquette",
          font: "Baloo 2",
          px: 26,
          color: "#8E4A56",
          align: "center",
          fx: "normal",
        },
      ],
    },
  },
  {
    id: 5,
    n: "Vanilla Bliss Earl Grey",
    cat: "tart",
    catLabel: "Kue Tart",
    d: "Infusi teh Earl Grey bergamot, krim vanila & mawar kering",
    badge: "Artisan Tart",
    price: 100000,
    itemType: "tart",
    tartVariant: "earlgrey",
    s: {
      shape: "round",
      size: "small",
      flavor: "vanilla",
      fill: "cream",
      icing: "#F4EDE2",
      deco: { flower: true, drip: false },
      items: [],
    },
  },
  {
    id: 6,
    n: "Tiramisu Pandan Suji",
    cat: "tart",
    catLabel: "Kue Tart",
    d: "Pandan suji wangi alami, mascarpone cream & drizzle kakao",
    badge: "Resep Warisan",
    price: 120000,
    itemType: "tart",
    tartVariant: "pandan",
    s: {
      shape: "round",
      size: "medium",
      flavor: "vanilla",
      fill: "cheese",
      icing: "#E0ECDA",
      deco: { drip: true },
      items: [],
    },
  },
  {
    id: 7,
    n: "The Rose Garden Tart",
    cat: "tart",
    catLabel: "Kue Tart",
    d: "Tart almond renyah dengan custard mawar & aneka buah berry",
    badge: "Signature",
    price: 135000,
    itemType: "tart",
    tartVariant: "rosegarden",
    s: {
      shape: "round",
      size: "medium",
      flavor: "vanilla",
      fill: "cream",
      icing: "#FFF2E6",
      deco: { flower: true, berry: true },
      items: [],
    },
  },
  {
    id: 8,
    n: "Berry Peach Cupcake",
    cat: "cupcake",
    catLabel: "Cupcake",
    d: "Cupcake mentega lembut, mahkota krim persik & berry segar",
    badge: "Artisan Cupcake",
    price: 45000,
    itemType: "cupcake",
    cupcakeVariant: "peach",
    s: {
      shape: "round",
      size: "mini",
      flavor: "vanilla",
      fill: "cream",
      icing: "#FFD8BE",
      deco: { berry: true },
      items: [],
    },
  },
  {
    id: 9,
    n: "Cinnamon Mint Cupcake",
    cat: "cupcake",
    catLabel: "Cupcake",
    d: "Rempah kayu manis hangat, krim mint segar & stick kayu manis",
    badge: "Chef Pick",
    price: 45000,
    itemType: "cupcake",
    cupcakeVariant: "mint",
    s: {
      shape: "round",
      size: "mini",
      flavor: "choco",
      fill: "cream",
      icing: "#BEE3CB",
      deco: {},
      items: [],
    },
  },
  {
    id: 10,
    n: "Choco Butter Cookies Box",
    cat: "cookies",
    catLabel: "Cookies",
    d: "Kue kering butter Wijsman berpadu choco chips renyah gurih",
    badge: "Favorit Camilan",
    price: 65000,
    itemType: "cookies",
    s: {
      shape: "round",
      size: "mini",
      flavor: "choco",
      fill: "cream",
      icing: "#EAE0D6",
      deco: {},
      items: [],
    },
  },
  {
    id: 11,
    n: "Golden Glazed Ring Donuts",
    cat: "donut",
    catLabel: "Donat",
    d: "Donat kentang empuk bertabur gula salju dan lelehan cokelat",
    badge: "Favorit Pagi",
    price: 36000,
    itemType: "donut",
    s: {
      shape: "round",
      size: "small",
      flavor: "vanilla",
      fill: "cream",
      icing: "#3E2211",
      deco: { drip: true },
      items: [],
    },
  },
  {
    id: 12,
    n: "Sundae Berry & Glazed Donuts",
    cat: "donut",
    catLabel: "Donat",
    d: "Donat kentang glaze mawar merah muda & es krim strawberry",
    badge: "Menu Akhir Pekan",
    price: 55000,
    itemType: "donut",
    s: {
      shape: "round",
      size: "small",
      flavor: "vanilla",
      fill: "jam",
      icing: "#EA6585",
      deco: { straw: true },
      items: [],
    },
  },
];

function getDefState() {
  return {
    shape: "round",
    size: "mini",
    flavor: "vanilla",
    fill: "cream",
    icing: "#f6b4c2",
    deco: {},
    candles: [],
    items: [],
    sel: null,
    cpts: null,
    pick: "pickup",
    pay: "bank",
    payScheme: "dp",
    f: {},
    itemType: "cake",
    tartVariant: null,
    cupcakeVariant: null,
    namaItem: null,
    kategoriItem: null,
    hargaItem: null,
  };
}

function formatNamaItem(nama) {
  if (!nama) return "";
  return nama.replace(/Ø/g, "").replace(/\s+/g, " ").trim();
}

const FLAV_COLORS = {
  vanilla: "#fbefd5",
  choco: "#8a5a3c",
  velvet: "#c0404e",
  straw: "#f9cdd6",
};

const FILL_COLORS = {
  cream: "#fffaf0",
  ganache: "#5b3322",
  jam: "#d6304a",
  cheese: "#fff0c9",
};

const FLAV = {
  vanilla: ["Vanilla", 0, "#fbefd5"],
  choco: ["Cokelat", 10000, "#8a5a3c"],
  velvet: ["Red Velvet", 15000, "#c0404e"],
  straw: ["Stroberi", 10000, "#f9cdd6"],
};

const FILL = {
  cream: ["Krim Vanilla", 0, "#fffaf0"],
  ganache: ["Ganache Cokelat", 8000, "#5b3322"],
  jam: ["Selai Stroberi", 5000, "#d6304a"],
  cheese: ["Cream Cheese", 12000, "#fff0c9"],
};

const CCOL = [
  "#ff8fb1",
  "#6ec1ff",
  "#f5c542",
  "#ffffff",
  "#7ee0b5",
  "#ef5350",
  "#b39ddb",
];

let sd = 11;
const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const resetSeed = () => {
  sd = 11;
};

let SPATULA_TEXS = null;
function getSpatulaTextures() {
  if (SPATULA_TEXS) return SPATULA_TEXS;
  if (typeof document === "undefined") return { map: null, bump: null };

  const n = 512;
  const cvD = document.createElement("canvas");
  const cvB = document.createElement("canvas");
  cvD.width = cvD.height = cvB.width = cvB.height = n;
  const ctxD = cvD.getContext("2d");
  const ctxB = cvB.getContext("2d");
  const imgD = ctxD.createImageData(n, n);
  const imgB = ctxB.createImageData(n, n);

  let q = 13;
  const r = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const a = new Float32Array(n * n);
  const b = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) a[i] = r();

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let t = 0;
      for (let i = -16; i <= 16; i++) {
        t += a[y * n + ((x + i + n) % n)];
      }
      b[y * n + x] = t / 33;
    }
  }

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const raw = b[y * n + x];
      const fine = a[y * n + x];
      const v = Math.max(
        0,
        Math.min(1, 0.5 + (raw - 0.5) * 5.2 + (fine - 0.5) * 0.18)
      );
      const k = (y * n + x) * 4;

      // Bump: 0..255
      imgB.data[k] = imgB.data[k + 1] = imgB.data[k + 2] = Math.floor(v * 255);
      imgB.data[k + 3] = 255;

      // Diffuse tonal contrast: creates visible light/shadow ridges on Vanilla, Pink, etc.
      const dVal = Math.min(255, Math.floor(185 + v * 70));
      imgD.data[k] = imgD.data[k + 1] = imgD.data[k + 2] = dVal;
      imgD.data[k + 3] = 255;
    }
  }
  ctxD.putImageData(imgD, 0, 0);
  ctxB.putImageData(imgB, 0, 0);

  const diffTex = new THREE.CanvasTexture(cvD);
  diffTex.wrapS = diffTex.wrapT = THREE.RepeatWrapping;
  diffTex.repeat.set(1, 1);

  const bumpTex = new THREE.CanvasTexture(cvB);
  bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(1, 1);

  return (SPATULA_TEXS = { map: diffTex, bump: bumpTex });
}

function bumpTex() {
  return getSpatulaTextures().bump;
}

let CRUMB_TEXS = null;
function getCrumbTexture() {
  if (CRUMB_TEXS) return CRUMB_TEXS;
  if (typeof document === "undefined") return { map: null, bump: null };

  const n = 256;
  const cvD = document.createElement("canvas");
  const cvB = document.createElement("canvas");
  cvD.width = cvD.height = cvB.width = cvB.height = n;
  const ctxD = cvD.getContext("2d");
  const ctxB = cvB.getContext("2d");

  ctxD.fillStyle = "#fff4e0";
  ctxD.fillRect(0, 0, n, n);
  ctxB.fillStyle = "#888888";
  ctxB.fillRect(0, 0, n, n);

  let q = 29;
  const r = () => (q = (q * 16807) % 2147483647) / 2147483647;

  for (let i = 0; i < 2800; i++) {
    const cx = r() * n,
      cy = r() * n;
    const rad = 0.6 + r() * 2.2;
    const alpha = 0.15 + r() * 0.35;
    ctxD.beginPath();
    ctxD.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxD.fillStyle =
      r() < 0.25
        ? `rgba(165, 115, 60, ${alpha * 0.9})`
        : `rgba(215, 175, 120, ${alpha})`;
    ctxD.fill();

    ctxB.beginPath();
    ctxB.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxB.fillStyle = r() < 0.3 ? "#222222" : "#dddddd";
    ctxB.fill();
  }

  const map = new THREE.CanvasTexture(cvD);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2.5, 2.5);

  const bump = new THREE.CanvasTexture(cvB);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(2.5, 2.5);

  return (CRUMB_TEXS = { map, bump });
}

function crumbTex() {
  return getCrumbTexture().map;
}

let PITS = null;
function pitsTex() {
  if (PITS) return PITS;
  const n = 64,
    d = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = x / n - 0.5,
        dy = y / n - 0.5;
      const v = 255 - 225 * Math.exp(-(dx * dx + dy * dy) * 85);
      const k = (y * n + x) * 4;
      d[k] = d[k + 1] = d[k + 2] = Math.max(25, v) | 0;
      d[k + 3] = 255;
    }
  }
  PITS = new THREE.DataTexture(d, n, n, THREE.RGBAFormat);
  PITS.wrapS = PITS.wrapT = THREE.RepeatWrapping;
  PITS.repeat.set(8, 5);
  PITS.minFilter = THREE.LinearFilter;
  PITS.magFilter = THREE.LinearFilter;
  PITS.generateMipmaps = true;
  PITS.needsUpdate = true;
  return PITS;
}

let CUPCAKE_MUFFIN_TEXS = null;
function getCupcakeMuffinTextures() {
  if (CUPCAKE_MUFFIN_TEXS) return CUPCAKE_MUFFIN_TEXS;
  if (typeof document === "undefined") return { map: null, bump: null };
  const n = 256;
  const cvD = document.createElement("canvas");
  const cvB = document.createElement("canvas");
  cvD.width = cvD.height = cvB.width = cvB.height = n;
  const ctxD = cvD.getContext("2d");
  const ctxB = cvB.getContext("2d");

  const grad = ctxD.createRadialGradient(n / 2, n / 2, 10, n / 2, n / 2, n / 2);
  grad.addColorStop(0, "#FFFFFF");
  grad.addColorStop(0.65, "#E8E8E8");
  grad.addColorStop(1, "#CECECE");
  ctxD.fillStyle = grad;
  ctxD.fillRect(0, 0, n, n);

  ctxB.fillStyle = "#888888";
  ctxB.fillRect(0, 0, n, n);

  let q = 47;
  const r = () => (q = (q * 16807) % 2147483647) / 2147483647;

  for (let i = 0; i < 2400; i++) {
    const cx = r() * n;
    const cy = r() * n;
    const rad = 0.5 + r() * 2.4;
    const isDeepPore = r() < 0.22;
    const alpha = 0.2 + r() * 0.45;

    ctxD.beginPath();
    ctxD.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxD.fillStyle = isDeepPore
      ? `rgba(0, 0, 0, ${alpha * 0.35})`
      : `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctxD.fill();

    ctxB.beginPath();
    ctxB.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxB.fillStyle = isDeepPore ? "#1a1a1a" : "#e6e6e6";
    ctxB.fill();
  }

  const map = new THREE.CanvasTexture(cvD);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);

  const bump = new THREE.CanvasTexture(cvB);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(2, 2);

  return (CUPCAKE_MUFFIN_TEXS = { map, bump });
}

let CUPCAKE_PAPER_TEXS = null;
function getCupcakePaperTextures() {
  if (CUPCAKE_PAPER_TEXS) return CUPCAKE_PAPER_TEXS;
  if (typeof document === "undefined") return { map: null, bump: null };
  const n = 256;
  const cvD = document.createElement("canvas");
  const cvB = document.createElement("canvas");
  cvD.width = cvD.height = cvB.width = cvB.height = n;
  const ctxD = cvD.getContext("2d");
  const ctxB = cvB.getContext("2d");

  ctxD.fillStyle = "#FAF2E5";
  ctxD.fillRect(0, 0, n, n);
  ctxB.fillStyle = "#888888";
  ctxB.fillRect(0, 0, n, n);

  const folds = 36;
  for (let i = 0; i < folds; i++) {
    const x = (i / folds) * n;
    const w = n / folds;
    ctxD.fillStyle = "rgba(185, 160, 135, 0.35)";
    ctxD.fillRect(x, 0, 1.8, n);
    ctxD.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctxD.fillRect(x + w * 0.5, 0, 1.5, n);

    const bGrad = ctxB.createLinearGradient(x, 0, x + w, 0);
    bGrad.addColorStop(0, "#222222");
    bGrad.addColorStop(0.5, "#eeeeee");
    bGrad.addColorStop(1, "#222222");
    ctxB.fillStyle = bGrad;
    ctxB.fillRect(x, 0, w, n);
  }

  const map = new THREE.CanvasTexture(cvD);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 1);

  const bump = new THREE.CanvasTexture(cvB);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(1, 1);

  return (CUPCAKE_PAPER_TEXS = { map, bump });
}

let PIE_CRUST_TEXS = null;
function getPieCrustTextures() {
  if (PIE_CRUST_TEXS) return PIE_CRUST_TEXS;
  if (typeof document === "undefined") return { map: null, bump: null };
  const n = 256;
  const cvD = document.createElement("canvas");
  const cvB = document.createElement("canvas");
  cvD.width = cvD.height = cvB.width = cvB.height = n;
  const ctxD = cvD.getContext("2d");
  const ctxB = cvB.getContext("2d");

  ctxD.fillStyle = "#DB9E53";
  ctxD.fillRect(0, 0, n, n);
  ctxB.fillStyle = "#888888";
  ctxB.fillRect(0, 0, n, n);

  let q = 89;
  const r = () => (q = (q * 16807) % 2147483647) / 2147483647;

  for (let i = 0; i < 2200; i++) {
    const cx = r() * n;
    const cy = r() * n;
    const rad = 0.8 + r() * 2.8;
    const isBrown = r() < 0.3;
    const alpha = 0.2 + r() * 0.4;

    ctxD.beginPath();
    ctxD.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxD.fillStyle = isBrown
      ? `rgba(145, 80, 22, ${alpha * 0.9})`
      : `rgba(248, 218, 160, ${alpha})`;
    ctxD.fill();

    ctxB.beginPath();
    ctxB.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxB.fillStyle = isBrown ? "#333333" : "#dcdcdc";
    ctxB.fill();
  }

  const map = new THREE.CanvasTexture(cvD);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 2);

  const bump = new THREE.CanvasTexture(cvB);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(3, 2);

  return (PIE_CRUST_TEXS = { map, bump });
}

let PIE_CUSTARD_TEXS = null;
function getPieCustardTextures() {
  if (PIE_CUSTARD_TEXS) return PIE_CUSTARD_TEXS;
  if (typeof document === "undefined") return { map: null, bump: null };
  const n = 256;
  const cvD = document.createElement("canvas");
  const cvB = document.createElement("canvas");
  cvD.width = cvD.height = cvB.width = cvB.height = n;
  const ctxD = cvD.getContext("2d");
  const ctxB = cvB.getContext("2d");

  const grad = ctxD.createRadialGradient(n / 2, n / 2, 10, n / 2, n / 2, n / 2);
  grad.addColorStop(0, "#FFFFFF");
  grad.addColorStop(0.7, "#EEEEEE");
  grad.addColorStop(1, "#DDDDDD");
  ctxD.fillStyle = grad;
  ctxD.fillRect(0, 0, n, n);

  ctxB.fillStyle = "#888888";
  ctxB.fillRect(0, 0, n, n);

  let q = 103;
  const r = () => (q = (q * 16807) % 2147483647) / 2147483647;

  for (let i = 0; i < 450; i++) {
    const cx = r() * n;
    const cy = r() * n;
    const rad = 0.5 + r() * 1.6;
    ctxD.beginPath();
    ctxD.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxD.fillStyle = r() < 0.4 ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.35)";
    ctxD.fill();

    ctxB.beginPath();
    ctxB.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxB.fillStyle = r() < 0.4 ? "#555555" : "#cccccc";
    ctxB.fill();
  }

  const map = new THREE.CanvasTexture(cvD);
  const bump = new THREE.CanvasTexture(cvB);

  return (PIE_CUSTARD_TEXS = { map, bump });
}

let DONUT_TEXS = null;
function getDonutTextures() {
  if (DONUT_TEXS) return DONUT_TEXS;
  if (typeof document === "undefined") return { map: null, bump: null };
  const n = 256;
  const cvD = document.createElement("canvas");
  const cvB = document.createElement("canvas");
  cvD.width = cvD.height = cvB.width = cvB.height = n;
  const ctxD = cvD.getContext("2d");
  const ctxB = cvB.getContext("2d");

  const vGrad = ctxD.createLinearGradient(0, 0, 0, n);
  vGrad.addColorStop(0, "#EAEAEA");
  vGrad.addColorStop(0.12, "#CCCCCC");
  vGrad.addColorStop(0.28, "#AAAAAA");
  vGrad.addColorStop(0.42, "#C0C0C0");
  vGrad.addColorStop(0.50, "#FAFAFA");
  vGrad.addColorStop(0.58, "#C0C0C0");
  vGrad.addColorStop(0.72, "#AAAAAA");
  vGrad.addColorStop(0.88, "#CCCCCC");
  vGrad.addColorStop(1.0, "#EAEAEA");

  ctxD.fillStyle = vGrad;
  ctxD.fillRect(0, 0, n, n);

  ctxB.fillStyle = "#888888";
  ctxB.fillRect(0, 0, n, n);

  let q = 137;
  const r = () => (q = (q * 16807) % 2147483647) / 2147483647;

  for (let i = 0; i < 1800; i++) {
    const cx = r() * n;
    const cy = r() * n;
    const rad = 0.6 + r() * 2.2;
    const isBlister = r() < 0.25;

    ctxD.beginPath();
    ctxD.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxD.fillStyle = isBlister
      ? "rgba(0, 0, 0, 0.15)"
      : "rgba(255, 255, 255, 0.25)";
    ctxD.fill();

    ctxB.beginPath();
    ctxB.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxB.fillStyle = isBlister ? "#333333" : "#d8d8d8";
    ctxB.fill();
  }

  const map = new THREE.CanvasTexture(cvD);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 1);

  const bump = new THREE.CanvasTexture(cvB);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(4, 1);

  return (DONUT_TEXS = { map, bump });
}

let COOKIE_TEXS = null;
function getCookieTextures() {
  if (COOKIE_TEXS) return COOKIE_TEXS;
  if (typeof document === "undefined") return { map: null, bump: null };
  const n = 256;
  const cvD = document.createElement("canvas");
  const cvB = document.createElement("canvas");
  cvD.width = cvD.height = cvB.width = cvB.height = n;
  const ctxD = cvD.getContext("2d");
  const ctxB = cvB.getContext("2d");

  ctxD.fillStyle = "#E4E4E4";
  ctxD.fillRect(0, 0, n, n);
  ctxB.fillStyle = "#999999";
  ctxB.fillRect(0, 0, n, n);

  let q = 181;
  const r = () => (q = (q * 16807) % 2147483647) / 2147483647;

  ctxD.strokeStyle = "#888888";
  ctxB.strokeStyle = "#111111";
  ctxD.lineCap = "round";
  ctxB.lineCap = "round";

  for (let c = 0; c < 18; c++) {
    let x = n * 0.2 + r() * n * 0.6;
    let y = n * 0.2 + r() * n * 0.6;
    const len = 15 + r() * 45;
    const ang = r() * Math.PI * 2;
    const sw = 2.0 + r() * 2.5;

    ctxD.lineWidth = sw;
    ctxB.lineWidth = sw + 1.5;

    ctxD.beginPath();
    ctxB.beginPath();
    ctxD.moveTo(x, y);
    ctxB.moveTo(x, y);

    for (let s = 0; s < 4; s++) {
      x += Math.cos(ang + (r() - 0.5) * 0.8) * (len / 4);
      y += Math.sin(ang + (r() - 0.5) * 0.8) * (len / 4);
      ctxD.lineTo(x, y);
      ctxB.lineTo(x, y);
    }
    ctxD.stroke();
    ctxB.stroke();
  }

  for (let i = 0; i < 2200; i++) {
    const cx = r() * n;
    const cy = r() * n;
    const rad = 0.6 + r() * 2.6;
    const isDark = r() < 0.28;

    ctxD.beginPath();
    ctxD.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxD.fillStyle = isDark
      ? "rgba(0, 0, 0, 0.2)"
      : "rgba(255, 255, 255, 0.35)";
    ctxD.fill();

    ctxB.beginPath();
    ctxB.arc(cx, cy, rad, 0, Math.PI * 2);
    ctxB.fillStyle = isDark ? "#222222" : "#e0e0e0";
    ctxB.fill();
  }

  const map = new THREE.CanvasTexture(cvD);
  const bump = new THREE.CanvasTexture(cvB);

  return (COOKIE_TEXS = { map, bump });
}

let STRAW_TEX = null;
let STRAW_BUMP = null;
function getStrawberryTextures() {
  if (STRAW_TEX && STRAW_BUMP) return { map: STRAW_TEX, bump: STRAW_BUMP };
  if (typeof document === "undefined") return null;
  try {
    const n = 128;
    const cvColor = document.createElement("canvas");
    cvColor.width = cvColor.height = n;
    const ctxColor = cvColor.getContext("2d");

    const cvBump = document.createElement("canvas");
    cvBump.width = cvBump.height = n;
    const ctxBump = cvBump.getContext("2d");

    // Red strawberry base
    ctxColor.fillStyle = "#d42033";
    ctxColor.fillRect(0, 0, n, n);

    // Bump base (high = 255)
    ctxBump.fillStyle = "#ffffff";
    ctxBump.fillRect(0, 0, n, n);

    const rows = 6;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      const y = ((r + 0.5) / rows) * n;
      const offset = (r % 2) * (n / cols / 2);
      for (let c = 0; c < cols; c++) {
        const x = ((c / cols) * n + offset) % n;

        // Dark dimple pit on color map
        ctxColor.beginPath();
        ctxColor.ellipse(x, y, 4.5, 6, 0, 0, Math.PI * 2);
        ctxColor.fillStyle = "#500710";
        ctxColor.fill();

        // Golden-yellow seed in center of pit
        ctxColor.beginPath();
        ctxColor.ellipse(x, y, 1.8, 3.2, 0, 0, Math.PI * 2);
        ctxColor.fillStyle = "#f5cb42";
        ctxColor.fill();

        // Pit indentation on bump map (darker = recessed pit)
        ctxBump.beginPath();
        ctxBump.ellipse(x, y, 5, 6.5, 0, 0, Math.PI * 2);
        ctxBump.fillStyle = "#111111";
        ctxBump.fill();
      }
    }

    STRAW_TEX = new THREE.CanvasTexture(cvColor);
    STRAW_TEX.wrapS = STRAW_TEX.wrapT = THREE.RepeatWrapping;
    STRAW_TEX.repeat.set(4, 3);

    STRAW_BUMP = new THREE.CanvasTexture(cvBump);
    STRAW_BUMP.wrapS = STRAW_BUMP.wrapT = THREE.RepeatWrapping;
    STRAW_BUMP.repeat.set(4, 3);

    return { map: STRAW_TEX, bump: STRAW_BUMP };
  } catch {
    return null;
  }
}

let CAN = null;
function candleTex() {
  if (CAN) return CAN;
  const n = 64,
    d = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const f = ((x + y) % 32) < 16;
      const k = (y * n + x) * 4;
      d[k] = d[k + 1] = d[k + 2] = f ? 150 : 255;
      d[k + 3] = 255;
    }
  }
  CAN = new THREE.DataTexture(d, n, n, THREE.RGBAFormat);
  CAN.wrapS = CAN.wrapT = THREE.RepeatWrapping;
  CAN.repeat.set(1, 2);
  CAN.minFilter = THREE.LinearFilter;
  CAN.magFilter = THREE.LinearFilter;
  CAN.needsUpdate = true;
  return CAN;
}

const _mc = {};
const clearMatCache = () => {
  for (const k in _mc) delete _mc[k];
};
const M = (c, r = 0.55, extra = {}) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
const MB = (c, o = {}) => {
  const sp = getSpatulaTextures();
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.62,
    envMapIntensity: 0.5,
    map: sp.map,
    bumpMap: sp.bump,
    bumpScale: 15.0,
    ...o,
  });
};
const MM = (c, o = {}) => {
  const k =
    c +
    "|" +
    (o.roughness ?? "") +
    "|" +
    (o.bumpScale ?? "") +
    (o.bumpMap ? "b" : "");
  return (
    _mc[k] ||
    (_mc[k] = MB(c, { bumpMap: null, roughness: 0.42, ...o }))
  );
};

const mesh = (g, m, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  return o;
};
const cyl = (a, b, h, s = 48) => new THREE.CylinderGeometry(a, b, h, s);
const sph = (
  g,
  r,
  c,
  x = 0,
  y = 0,
  z = 0,
  sx = 1,
  sy = 1,
  sz = 1,
  o = {}
) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16), MM(c, o));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  g.add(m);
  return m;
};
const cone = (g, r, h, c, x = 0, y = 0, z = 0, o = {}) => {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 18), MM(c, o));
  m.position.set(x, y, z);
  g.add(m);
  return m;
};
const tube = (g, a, b, h, c, x = 0, y = 0, z = 0, o = {}) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, 24), MM(c, o));
  m.position.set(x, y, z);
  g.add(m);
  return m;
};
const ring = (g, R, r, c, x = 0, y = 0, z = 0, arc = 6.283, o = {}) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 12, 40, arc), MM(c, o));
  m.position.set(x, y, z);
  g.add(m);
  return m;
};
function slab(g, sh, d, c) {
  const ge = new THREE.ExtrudeGeometry(sh, {
    depth: d,
    bevelEnabled: true,
    bevelSize: 0.014,
    bevelThickness: 0.014,
    bevelSegments: 3,
    curveSegments: 28,
  });
  ge.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(ge, MM(c, { roughness: 0.28 }));
  g.add(m);
  return m;
}

function heartShape(r) {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9 * r);
  s.bezierCurveTo(-0.2 * r, -0.6 * r, -r, -0.3 * r, -r, 0.25 * r);
  s.bezierCurveTo(-r, 0.8 * r, -0.3 * r, r, 0, 0.55 * r);
  s.bezierCurveTo(0.3 * r, r, r, 0.8 * r, r, 0.25 * r);
  s.bezierCurveTo(r, -0.3 * r, 0.2 * r, -0.6 * r, 0, -0.9 * r);
  return s;
}

function fp(R, shape = "round", cpts = null) {
  const k = shape;
  const s = new THREE.Shape();
  if (k === "round") {
    s.absarc(0, 0, R, 0, Math.PI * 2);
  } else if (k === "square") {
    const a = R * 0.92,
      r = 0.16;
    s.moveTo(-a + r, -a);
    s.lineTo(a - r, -a);
    s.quadraticCurveTo(a, -a, a, -a + r);
    s.lineTo(a, a - r);
    s.quadraticCurveTo(a, a, a - r, a);
    s.lineTo(-a + r, a);
    s.quadraticCurveTo(-a, a, -a, a - r);
    s.lineTo(-a, -a + r);
    s.quadraticCurveTo(-a, -a, -a + r, -a);
  } else if (k === "heart") {
    return heartShape(R * 1.12);
  } else if (k === "star" || k === "hex") {
    const n = k === "star" ? 10 : 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (k === "star" ? Math.PI / 2 : 0);
      const r = k === "star" ? (i % 2 ? R * 0.58 : R * 1.2) : R * 1.05;
      s[i ? "lineTo" : "moveTo"](r * Math.cos(a), r * Math.sin(a));
    }
    s.closePath();
  } else {
    new THREE.CatmullRomCurve3(
      (cpts || CAT).map(
        (p) => new THREE.Vector3(p[0] * R * 1.1, -p[1] * R * 1.1, 0)
      ),
      true
    )
      .getPoints(100)
      .forEach((p, i) => s[i ? "lineTo" : "moveTo"](p.x, p.y));
  }
  return s;
}

function loopOf(R, shape = "round", cpts = null) {
  const sh = fp(R, shape, cpts);
  const n = Math.min(480, Math.max(160, Math.round(sh.getLength() / 0.028)));
  let P = sh
    .getSpacedPoints(n)
    .slice(0, -1)
    .map((p) => [p.x, -p.y]);
  if (shape !== "round") {
    for (let k = 0; k < 3; k++) {
      P = P.map((p, i, A) => {
        const a = A[(i + A.length - 1) % A.length];
        const b = A[(i + 1) % A.length];
        return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4];
      });
    }
  }
  const N = P.length;
  const T = P.map((p, i) => {
    const a = P[(i + N - 2) % N];
    const b = P[(i + 2) % N];
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    return [tz / l, -tx / l];
  });
  let g = 0;
  P.forEach((p, i) => {
    g += p[0] * T[i][0] + p[1] * T[i][1];
  });
  const cw = g < 0;
  if (cw) {
    T.forEach((t) => {
      t[0] = -t[0];
      t[1] = -t[1];
    });
  }
  let L = 0;
  const U = P.map((p, i) => {
    if (i) L += Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]);
    return L;
  });
  return { P, T, N, U, L, cw };
}

function sweep(lp, rows, mat) {
  const { P, T, N, U, cw } = lp;
  const r0 = rows(0);
  const J = r0.length;
  const fl = r0[J - 1][1] > r0[0][1] ? cw : !cw;
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i < N; i++) {
    const r = rows(i);
    for (let j = 0; j < J; j++) {
      pos.push(
        P[i][0] + T[i][0] * r[j][0],
        r[j][1],
        P[i][1] + T[i][1] * r[j][0]
      );
      uv.push(U[i], r[j][1]);
    }
  }
  for (let i = 0; i < (lp.closed === false ? N - 1 : N); i++) {
    const i2 = (i + 1) % N;
    for (let j = 0; j < J - 1; j++) {
      const a = i * J + j,
        b = i2 * J + j,
        c = i2 * J + j + 1,
        d = i * J + j + 1;
      if (fl) idx.push(a, b, d, b, c, d);
      else idx.push(a, d, b, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function dripLen(lp, on) {
  const { L, U } = lp;
  const C = [];
  if (on) {
    const n = Math.max(5, Math.round(L / 0.42));
    for (let k = 0; k < n; k++) {
      C.push([
        ((k + 0.3 + rnd() * 0.4) / n) * L,
        0.2 + rnd() * 0.34,
        0.05 + rnd() * 0.035,
      ]);
    }
  }
  return U.map((u) => {
    let d = on ? 0.13 : 0.1;
    for (const [c, a, w] of C) {
      let q = Math.abs(u - c);
      q = Math.min(q, L - q);
      d = Math.max(d, 0.12 + a * Math.exp(-(q / w) * (q / w)));
    }
    return d;
  });
}

function swirlGeo(r, h) {
  const K = 32,
    M2 = 14,
    pos = [],
    idx = [];
  for (let j = 0; j <= M2; j++) {
    const t = j / M2,
      rr =
        r *
        Math.pow(Math.max(0, 1 - Math.pow(t, 1.7)), 0.85) *
        (1 + 0.07 * Math.sin(t * 22));
    for (let k = 0; k < K; k++) {
      const a = (k / K) * Math.PI * 2,
        m = 1 + 0.12 * Math.cos(7 * a + t * 7);
      pos.push(Math.cos(a) * rr * m, t * h, Math.sin(a) * rr * m);
    }
  }
  for (let j = 0; j < M2; j++)
    for (let k = 0; k < K; k++) {
      const k2 = (k + 1) % K,
        a = j * K + k,
        b = j * K + k2,
        c = (j + 1) * K + k2,
        d = (j + 1) * K + k;
      idx.push(a, d, b, b, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const berryGeo = () =>
  new THREE.LatheGeometry(
    [
      [0, 0],
      [0.04, 0.03],
      [0.09, 0.09],
      [0.125, 0.16],
      [0.14, 0.22],
      [0.135, 0.27],
      [0.1, 0.31],
      [0, 0.32],
    ].map((p) => new THREE.Vector2(p[0], p[1])),
    22
  );

function stand(pr) {
  const pts = [
    [0, -0.7],
    [1.15, -0.7],
    [1.2, -0.68],
    [0.62, -0.6],
    [0.4, -0.5],
    [0.34, -0.34],
    [0.42, -0.16],
    [pr * 0.9, -0.075],
    [pr, -0.05],
    [pr, 0],
    [pr * 0.985, 0.012],
    [0, 0.012],
  ].map((p) => new THREE.Vector2(p[0], p[1]));
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 96), M("#FFFDF9", 0.35));
}

function getResolvedPastryColors(S) {
  let flavColor = "#fbefd5";
  if (S.flavor === "choco") flavColor = "#5a3825";
  else if (S.flavor === "velvet") flavColor = "#9a1b28";
  else if (S.flavor === "straw") flavColor = "#e8526a";
  else if (FLAV[S.flavor]) flavColor = FLAV[S.flavor][2];

  let fillColor = "#3E1F11";
  if (S.fill === "jam" || S.fill === "straw" || S.fill === "berry") fillColor = "#C62828";
  else if (S.fill === "cheese") fillColor = "#FFF176";
  else if (S.fill === "cream" || S.fill === "vanilla") fillColor = "#FFF9C4";
  else if (S.fill === "ganache" || S.fill === "choco") fillColor = "#281206";
  else if (FILL[S.fill]) fillColor = FILL[S.fill][2];
  else if (FILL_COLORS[S.fill]) fillColor = FILL_COLORS[S.fill];

  return { flavColor, fillColor };
}

function makeItemPlatter(itemType, pr, M, S) {
  if (!itemType || itemType === "cake") {
    return stand(pr);
  }
  const g = new THREE.Group();
  if (itemType === "tart") {
    const basePts = [
      [0, -0.7],
      [pr * 0.9, -0.7],
      [pr * 0.94, -0.68],
      [pr * 0.94, -0.08],
      [pr * 0.98, -0.04],
      [pr * 0.98, -0.01],
      [0, -0.01],
    ].map((p) => new THREE.Vector2(p[0], p[1]));
    const woodBlock = new THREE.Mesh(
      new THREE.LatheGeometry(basePts, 64),
      new THREE.MeshStandardMaterial({ color: "#BD8C58", roughness: 0.65 })
    );
    g.add(woodBlock);

    const panPts = [
      [0, -0.01],
      [pr * 0.86, -0.01],
      [pr * 0.98, 0.01],
      [pr * 1.06, 0.035],
      [pr * 1.04, 0.04],
      [pr * 0.96, 0.018],
      [0, 0.018],
    ].map((p) => new THREE.Vector2(p[0], p[1]));
    const piePan = new THREE.Mesh(
      new THREE.LatheGeometry(panPts, 64),
      new THREE.MeshStandardMaterial({
        color: "#C2C9CF",
        metalness: 0.75,
        roughness: 0.28,
      })
    );
    g.add(piePan);
    return g;
  }
  if (itemType === "cupcake") {
    const pts = [
      [0, -0.7],
      [0.9, -0.7],
      [0.95, -0.68],
      [0.45, -0.62],
      [0.28, -0.42],
      [0.26, -0.15],
      [0.38, -0.03],
      [pr * 0.95, -0.005],
      [pr * 1.12, 0.032],
      [pr * 1.08, 0.036],
      [pr * 0.96, 0.014],
      [0, 0.014],
    ].map((p) => new THREE.Vector2(p[0], p[1]));
    const plate = new THREE.Mesh(
      new THREE.LatheGeometry(pts, 64),
      new THREE.MeshStandardMaterial({
        color: "#FAF7F2",
        roughness: 0.22,
        metalness: 0.04,
      })
    );
    g.add(plate);

    const goldRim = new THREE.Mesh(
      new THREE.TorusGeometry(pr * 1.1, 0.012, 12, 64),
      new THREE.MeshStandardMaterial({
        color: "#D4AF37",
        metalness: 0.85,
        roughness: 0.25,
      })
    );
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.y = 0.032;
    g.add(goldRim);
    return g;
  }
  if (itemType === "donut") {
    const blockPts = [
      [0, -0.7],
      [pr * 0.84, -0.7],
      [pr * 0.88, -0.68],
      [pr * 0.42, -0.52],
      [pr * 0.35, -0.18],
      [pr * 0.45, -0.05],
      [0, -0.05],
    ].map((p) => new THREE.Vector2(p[0], p[1]));
    const riser = new THREE.Mesh(
      new THREE.LatheGeometry(blockPts, 48),
      new THREE.MeshStandardMaterial({ color: "#8E5429", roughness: 0.72 })
    );
    g.add(riser);

    const board = new THREE.Mesh(
      new THREE.CylinderGeometry(pr * 1.18, pr * 1.14, 0.06, 48),
      new THREE.MeshStandardMaterial({ color: "#A86D3C", roughness: 0.65 })
    );
    board.position.y = -0.025;
    g.add(board);

    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(pr * 1.85, pr * 1.85),
      new THREE.MeshStandardMaterial({
        color: "#FAF4E8",
        roughness: 0.85,
        transparent: true,
        opacity: 0.95,
      })
    );
    paper.rotation.x = -Math.PI / 2;
    paper.rotation.z = 0.12;
    paper.position.y = 0.008;
    g.add(paper);
    return g;
  }
  if (itemType === "cookies") {
    const blockPts = [
      [0, -0.7],
      [pr * 0.84, -0.7],
      [pr * 0.88, -0.68],
      [pr * 0.38, -0.45],
      [pr * 0.32, -0.15],
      [pr * 0.48, -0.04],
      [0, -0.04],
    ].map((p) => new THREE.Vector2(p[0], p[1]));
    const riser = new THREE.Mesh(
      new THREE.LatheGeometry(blockPts, 48),
      new THREE.MeshStandardMaterial({ color: "#484038", roughness: 0.75 })
    );
    g.add(riser);

    const slate = new THREE.Mesh(
      new THREE.CylinderGeometry(pr * 1.18, pr * 1.22, 0.05, 48),
      new THREE.MeshStandardMaterial({
        color: "#28292C",
        roughness: 0.88,
        metalness: 0.12,
      })
    );
    slate.position.y = -0.02;
    g.add(slate);

    const bevel = new THREE.Mesh(
      new THREE.TorusGeometry(pr * 1.17, 0.014, 8, 48),
      new THREE.MeshStandardMaterial({ color: "#3B3C40", roughness: 0.9 })
    );
    bevel.rotation.x = Math.PI / 2;
    bevel.position.y = 0.006;
    g.add(bevel);
    return g;
  }
  return stand(pr);
}

function makeOneCupcake(paperMat, muffinMat, S, sliced) {
  const g = new THREE.Group();
  const crumbTex = getCrumbTexture();
  const { flavColor, fillColor } = getResolvedPastryColors(S);
  let muffinColor = flavColor;

  const cutAngle = sliced ? Math.PI * 0.45 : 0;
  const cutCenter = 0.8;
  const uStart = sliced ? cutCenter + cutAngle / 2 : 0;
  const uLength = sliced ? Math.PI * 2 - cutAngle : Math.PI * 2;

  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.54, 0.68, 48, 1, false, uStart, uLength),
    paperMat
  );
  cup.position.y = 0.34;
  g.add(cup);

  const muffinPts = [
    new THREE.Vector2(0, 0.60),
    new THREE.Vector2(0.76, 0.60),
    new THREE.Vector2(0.86, 0.72),
    new THREE.Vector2(0.83, 0.88),
    new THREE.Vector2(0.62, 1.06),
    new THREE.Vector2(0.32, 1.18),
    new THREE.Vector2(0, 1.20),
  ];
  const domeGeo = new THREE.LatheGeometry(muffinPts, 48, uStart, uLength);
  const dome = new THREE.Mesh(domeGeo, muffinMat);
  g.add(dome);

  const hasDeco = S.deco && (S.deco.straw || S.deco.drip || S.deco.flower || S.deco.spr || S.deco.berry);
  if (hasDeco || (S.icing && S.icing !== "#FFFDF9" && S.icing !== "#f6b4c2")) {
    const creamColor = S.icing || "#FFFDF8";
    const swirl = new THREE.Mesh(swirlGeo(0.24, 0.38), MM(creamColor, { roughness: 0.35 }));
    swirl.position.y = 1.12;
    g.add(swirl);

    if (S.deco && S.deco.straw) {
      const berry = new THREE.Mesh(getBerryG(), MB("#d62234", { roughness: 0.3 }));
      berry.position.set(0, 1.5, 0);
      berry.scale.setScalar(1.2);
      g.add(berry);
    }
    if (S.deco && S.deco.berry) {
      const bk = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), MB("#1C1524", { roughness: 0.3 }));
      bk.position.set(0, 1.48, 0);
      g.add(bk);
    }
    if (S.deco && S.deco.spr) {
      const spGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 6);
      const spColors = ["#FFF", "#FFD54F", "#81C784", "#FF4081", "#448AFF"];
      for (let i = 0; i < 20; i++) {
        const a = uStart + (i * uLength) / 20;
        const spMat = new THREE.MeshStandardMaterial({
          color: spColors[i % spColors.length],
          roughness: 0.4,
        });
        const sp = new THREE.Mesh(spGeo, spMat);
        sp.position.set(Math.sin(a) * 0.22, 1.16 + (i % 3) * 0.08, Math.cos(a) * 0.22);
        sp.rotation.set(Math.PI / 2, 0, (i * 1.5) % Math.PI);
        g.add(sp);
      }
    }
    if (S.deco && S.deco.flower) {
      const fl = new THREE.Group();
      flowerB(fl, "#FF85A2", 5, 0.08);
      fl.position.set(0, 1.48, 0);
      g.add(fl);
    }
  }

  if (sliced) {
    const crumbMat = new THREE.MeshStandardMaterial({
      color: muffinColor,
      roughness: 0.95,
      map: crumbTex.map,
      bumpMap: crumbTex.bump,
      bumpScale: 4.5,
      side: THREE.DoubleSide,
    });
    const fillMat = new THREE.MeshStandardMaterial({
      color: fillColor,
      roughness: 0.18,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const cupcakeWallShape = new THREE.Shape();
    cupcakeWallShape.moveTo(0, 0.01);
    cupcakeWallShape.lineTo(0.53, 0.01);
    cupcakeWallShape.lineTo(0.77, 0.65);
    cupcakeWallShape.lineTo(0.86, 0.72);
    cupcakeWallShape.lineTo(0.83, 0.88);
    cupcakeWallShape.lineTo(0.62, 1.06);
    cupcakeWallShape.lineTo(0.32, 1.18);
    cupcakeWallShape.lineTo(0, 1.20);
    cupcakeWallShape.closePath();
    const wallGeo = new THREE.ShapeGeometry(cupcakeWallShape);

    const w1 = new THREE.Mesh(wallGeo, crumbMat);
    w1.rotation.y = uStart - Math.PI / 2;
    const fCore1 = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), fillMat);
    fCore1.scale.set(1.15, 1.45, 1.0);
    fCore1.position.set(0.25, 0.78, 0.003);
    w1.add(fCore1);
    const fDrop1 = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), fillMat);
    fDrop1.scale.set(0.8, 1.3, 1.0);
    fDrop1.position.set(0.25, 0.52, 0.003);
    w1.add(fDrop1);
    const pEdge1 = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.03), paperMat);
    pEdge1.position.set(0.32, 0.02, 0.002);
    w1.add(pEdge1);
    g.add(w1);

    const w2 = new THREE.Mesh(wallGeo, crumbMat);
    w2.rotation.y = (uStart + uLength) - Math.PI / 2;
    const fCore2 = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), fillMat);
    fCore2.scale.set(1.15, 1.45, 1.0);
    fCore2.position.set(0.25, 0.78, -0.003);
    w2.add(fCore2);
    const fDrop2 = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), fillMat);
    fDrop2.scale.set(0.8, 1.3, 1.0);
    fDrop2.position.set(0.25, 0.52, -0.003);
    w2.add(fDrop2);
    const pEdge2 = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.03), paperMat);
    pEdge2.position.set(0.32, 0.02, -0.002);
    w2.add(pEdge2);
    g.add(w2);

    const sliceG = new THREE.Group();
    const slArc = cutAngle - 0.05;
    const sCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.54, 0.68, 20, 1, false, -slArc / 2, slArc),
      paperMat
    );
    sCup.position.y = 0.34;
    sliceG.add(sCup);

    const sDome = new THREE.Mesh(new THREE.LatheGeometry(muffinPts, 20, -slArc / 2, slArc), muffinMat);
    sliceG.add(sDome);

    const sw1 = new THREE.Mesh(wallGeo, crumbMat);
    sw1.rotation.y = -slArc / 2 - Math.PI / 2;
    const sCore1 = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), fillMat);
    sCore1.scale.set(1.15, 1.45, 1.0);
    sCore1.position.set(0.25, 0.78, -0.003);
    sw1.add(sCore1);
    const sDrop1 = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), fillMat);
    sDrop1.scale.set(0.8, 1.3, 1.0);
    sDrop1.position.set(0.25, 0.52, -0.003);
    sw1.add(sDrop1);
    sliceG.add(sw1);

    const sw2 = new THREE.Mesh(wallGeo, crumbMat);
    sw2.rotation.y = slArc / 2 - Math.PI / 2;
    const sCore2 = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), fillMat);
    sCore2.scale.set(1.15, 1.45, 1.0);
    sCore2.position.set(0.25, 0.78, 0.003);
    sw2.add(sCore2);
    const sDrop2 = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), fillMat);
    sDrop2.scale.set(0.8, 1.3, 1.0);
    sDrop2.position.set(0.25, 0.52, 0.003);
    sw2.add(sDrop2);
    sliceG.add(sw2);

    if (hasDeco || (S.icing && S.icing !== "#FFFDF9" && S.icing !== "#f6b4c2")) {
      const creamColor = S.icing || "#FFFDF8";
      const sSwirl = new THREE.Mesh(swirlGeo(0.18, 0.26), MM(creamColor, { roughness: 0.35 }));
      sSwirl.position.y = 1.10;
      sliceG.add(sSwirl);
    }

    sliceG.rotation.y = cutCenter;
    const pullDist = 0.30;
    sliceG.position.set(Math.sin(cutCenter) * pullDist, 0, Math.cos(cutCenter) * pullDist);
    g.add(sliceG);
  }

  return g;
}

function build3DCupcake(add, M, MB, S, sliced) {
  const g = new THREE.Group();
  const paperTex = getCupcakePaperTextures();
  const muffinTex = getCupcakeMuffinTextures();

  let muffinColor = "#E5A75B";
  if (S.flavor === "choco") muffinColor = "#4A2716";
  else if (S.flavor === "velvet") muffinColor = "#8A1E26";
  else if (S.flavor === "straw") muffinColor = "#DC5972";

  const paperMat = new THREE.MeshStandardMaterial({
    color: "#FAF2E5",
    roughness: 0.65,
    map: paperTex.map,
    bumpMap: paperTex.bump,
    bumpScale: 5.0,
  });

  const muffinMat = new THREE.MeshStandardMaterial({
    color: muffinColor,
    roughness: 0.82,
    map: muffinTex.map,
    bumpMap: muffinTex.bump,
    bumpScale: 6.5,
  });

  const baseScale = 0.52;
  const isMini = S.size === "mini";
  const isSmall = S.size === "small";
  const isMed = S.size === "medium";

  if (isMini) {
    const c1 = makeOneCupcake(paperMat, muffinMat, S, sliced);
    c1.scale.setScalar(baseScale);
    g.add(c1);
  } else if (isSmall) {
    const c1 = makeOneCupcake(paperMat, muffinMat, S, sliced);
    c1.scale.setScalar(baseScale * 0.95);
    c1.position.set(-0.35, 0, 0);
    g.add(c1);

    const c2 = makeOneCupcake(paperMat, muffinMat, S, false);
    c2.scale.setScalar(baseScale * 0.95);
    c2.position.set(0.35, 0, 0);
    g.add(c2);
  } else if (isMed) {
    const pts = [
      [-0.32, -0.32],
      [0.32, -0.32],
      [-0.32, 0.32],
      [0.32, 0.32],
    ];
    pts.forEach(([x, z], i) => {
      const c = makeOneCupcake(paperMat, muffinMat, S, i === 2 && sliced);
      c.scale.setScalar(baseScale * 0.82);
      c.position.set(x, 0, z);
      g.add(c);
    });
  } else {
    const pts = [
      [-0.42, -0.28],
      [0, -0.28],
      [0.42, -0.28],
      [-0.42, 0.28],
      [0, 0.28],
      [0.42, 0.28],
    ];
    pts.forEach(([x, z], i) => {
      const c = makeOneCupcake(paperMat, muffinMat, S, i === 3 && sliced);
      c.scale.setScalar(baseScale * 0.72);
      c.position.set(x, 0, z);
      g.add(c);
    });
  }

  add(g);
}

function makeTartCutWall(crustMat, fillMat, custardMat) {
  const wallG = new THREE.Group();

  const bShape = new THREE.Shape();
  bShape.moveTo(0, 0.01);
  bShape.lineTo(1.48, 0.01);
  bShape.lineTo(1.48, 0.06);
  bShape.lineTo(0, 0.06);
  bShape.closePath();
  wallG.add(new THREE.Mesh(new THREE.ShapeGeometry(bShape), crustMat));

  const fShape = new THREE.Shape();
  fShape.moveTo(0, 0.06);
  fShape.lineTo(1.46, 0.06);
  fShape.lineTo(1.46, 0.16);
  fShape.lineTo(0, 0.16);
  fShape.closePath();
  wallG.add(new THREE.Mesh(new THREE.ShapeGeometry(fShape), fillMat));

  const cShape = new THREE.Shape();
  cShape.moveTo(0, 0.16);
  cShape.lineTo(1.46, 0.16);
  cShape.lineTo(1.46, 0.24);
  cShape.lineTo(0, 0.23);
  cShape.closePath();
  wallG.add(new THREE.Mesh(new THREE.ShapeGeometry(cShape), custardMat));

  const rShape = new THREE.Shape();
  rShape.moveTo(1.46, 0.01);
  rShape.lineTo(1.62, 0.24);
  rShape.lineTo(1.46, 0.24);
  rShape.closePath();
  wallG.add(new THREE.Mesh(new THREE.ShapeGeometry(rShape), crustMat));

  return wallG;
}

function build3DTart(add, M, MB, S, sliced) {
  const g = new THREE.Group();
  const crustTex = getPieCrustTextures();
  const custardTex = getPieCustardTextures();
  const { flavColor, fillColor } = getResolvedPastryColors(S);

  const sc = S.size === "large" ? 0.88 : S.size === "medium" ? 0.76 : S.size === "mini" ? 0.58 : 0.68;
  g.scale.setScalar(sc);

  let custardColor = "#FFBD28";
  if (S.flavor === "choco") custardColor = "#3C1F10";
  else if (S.flavor === "velvet") custardColor = "#9A1B28";
  else if (S.flavor === "straw") custardColor = "#E8425A";

  const crustMat = new THREE.MeshStandardMaterial({
    color: "#DCA052",
    roughness: 0.72,
    map: crustTex.map,
    bumpMap: crustTex.bump,
    bumpScale: 4.5,
  });

  const fillMat = new THREE.MeshStandardMaterial({
    color: fillColor,
    roughness: 0.22,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const custardMat = new THREE.MeshStandardMaterial({
    color: custardColor,
    roughness: 0.18,
    metalness: 0.05,
    envMapIntensity: 0.95,
    map: custardTex.map,
    bumpMap: custardTex.bump,
    bumpScale: 1.2,
  });

  const cutAngle = sliced ? 0.85 : 0;
  const cutCenter = 0.82;
  const uStart = sliced ? cutCenter + cutAngle / 2 : 0;
  const uLength = sliced ? Math.PI * 2 - cutAngle : Math.PI * 2;

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(1.62, 1.45, 0.16, 64, 1, false, uStart, uLength),
    crustMat
  );
  shell.position.y = 0.08;
  g.add(shell);

  const fillDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(1.48, 1.44, 0.08, 64, 1, false, uStart, uLength),
    fillMat
  );
  fillDisk.position.y = 0.11;
  g.add(fillDisk);

  const fluteGeo = new THREE.SphereGeometry(0.12, 12, 10);
  fluteGeo.scale(0.85, 1.2, 1.35);
  const totalFlutes = sliced ? 26 : 34;
  for (let i = 0; i < totalFlutes; i++) {
    const a = uStart + 0.05 + (i * (uLength - 0.10)) / Math.max(1, totalFlutes - 1);
    const fl = new THREE.Mesh(fluteGeo, crustMat);
    fl.position.set(Math.sin(a) * 1.58, 0.22, Math.cos(a) * 1.58);
    fl.rotation.y = a;
    fl.rotation.x = 0.25;
    g.add(fl);
  }

  const custard = new THREE.Mesh(
    new THREE.CylinderGeometry(1.52, 1.50, 0.14, 64, 1, false, uStart, uLength),
    custardMat
  );
  custard.position.y = 0.21;
  g.add(custard);

  const inTartCut = (x, z) => {
    if (!sliced) return false;
    let a = Math.atan2(x, z) - cutCenter;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    return Math.abs(a) < cutAngle / 2 + 0.12;
  };

  if (S.deco && S.deco.straw) {
    [
      [0, 0],
      [0.5, 0.35],
      [-0.5, 0.35],
      [-0.5, -0.35],
      [0, -0.7],
      [-0.75, 0],
    ].forEach(([bx, bz]) => {
      if (inTartCut(bx, bz)) return;
      const berry = new THREE.Mesh(getBerryG(), MB("#D62234", { roughness: 0.28 }));
      berry.position.set(bx, 0.36, bz);
      berry.scale.setScalar(0.95);
      g.add(berry);
    });
  }

  if (S.deco && S.deco.berry) {
    [
      [-0.28, 0.2],
      [-0.28, -0.2],
      [0, -0.38],
    ].forEach(([bx, bz]) => {
      if (inTartCut(bx, bz)) return;
      const bk = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), MB("#1C1524", { roughness: 0.3 }));
      bk.position.set(bx, 0.34, bz);
      g.add(bk);
    });
  }

  if (S.deco && S.deco.spr) {
    const spGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6);
    const spColors = ["#FFF", "#FFD54F", "#81C784", "#FF4081", "#448AFF"];
    for (let i = 0; i < 24; i++) {
      const a = uStart + (i * uLength) / 24;
      const rad = 0.3 + (i % 5) * 0.24;
      const spMat = new THREE.MeshStandardMaterial({
        color: spColors[i % spColors.length],
        roughness: 0.4,
      });
      const sp = new THREE.Mesh(spGeo, spMat);
      sp.position.set(Math.sin(a) * rad, 0.29, Math.cos(a) * rad);
      sp.rotation.set(Math.PI / 2, 0, (i * 1.3) % Math.PI);
      g.add(sp);
    }
  }

  if (S.deco && S.deco.drip) {
    const dripMat = new THREE.MeshStandardMaterial({
      color: "#3B1E11",
      roughness: 0.2,
      metalness: 0.1,
    });
    for (let i = 0; i < 4; i++) {
      const dr = new THREE.Mesh(new THREE.TorusGeometry(0.3 + i * 0.25, 0.02, 8, 24, uLength), dripMat);
      dr.rotation.x = Math.PI / 2;
      dr.rotation.z = -uStart;
      dr.position.y = 0.285;
      g.add(dr);
    }
  }

  if (sliced) {
    const pw1 = makeTartCutWall(crustMat, fillMat, custardMat);
    pw1.rotation.y = uStart - Math.PI / 2;
    g.add(pw1);

    const pw2 = makeTartCutWall(crustMat, fillMat, custardMat);
    pw2.rotation.y = (uStart + uLength) - Math.PI / 2;
    g.add(pw2);

    const sliceG = new THREE.Group();
    const slArc = cutAngle - 0.05;
    const sShell = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.45, 0.16, 20, 1, false, -slArc / 2, slArc), crustMat);
    sShell.position.y = 0.08;
    sliceG.add(sShell);

    const sFill = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.44, 0.08, 20, 1, false, -slArc / 2, slArc), fillMat);
    sFill.position.y = 0.11;
    sliceG.add(sFill);

    const sCustard = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.50, 0.14, 20, 1, false, -slArc / 2, slArc), custardMat);
    sCustard.position.y = 0.21;
    sliceG.add(sCustard);

    for (let i = 0; i < 4; i++) {
      const flA = -slArc / 2 + 0.05 + (i * (slArc - 0.10)) / 3;
      const sFl = new THREE.Mesh(fluteGeo, crustMat);
      sFl.position.set(Math.sin(flA) * 1.58, 0.22, Math.cos(flA) * 1.58);
      sFl.rotation.y = flA;
      sFl.rotation.x = 0.25;
      sliceG.add(sFl);
    }

    const sw1 = makeTartCutWall(crustMat, fillMat, custardMat);
    sw1.rotation.y = -slArc / 2 - Math.PI / 2;
    sliceG.add(sw1);

    const sw2 = makeTartCutWall(crustMat, fillMat, custardMat);
    sw2.rotation.y = slArc / 2 - Math.PI / 2;
    sliceG.add(sw2);

    if (S.deco && S.deco.straw) {
      const sBerry = new THREE.Mesh(getBerryG(), MB("#D62234", { roughness: 0.28 }));
      sBerry.position.set(0, 0.36, 0.9);
      sBerry.scale.setScalar(0.95);
      sliceG.add(sBerry);
    }

    sliceG.rotation.y = cutCenter;
    const pullDist = 0.26;
    sliceG.position.set(Math.sin(cutCenter) * pullDist, 0, Math.cos(cutCenter) * pullDist);
    g.add(sliceG);
  }

  add(g);
}

function makeOneDonut(donutTex, donutMat, S, sliced) {
  const g = new THREE.Group();
  const crumbTex = getCrumbTexture();
  const { flavColor, fillColor } = getResolvedPastryColors(S);

  const cutAngle = sliced ? 0.78 : 0;
  const cutCenter = 0.82;
  const arc = sliced ? Math.PI * 2 - cutAngle : Math.PI * 2;

  const donutRing = new THREE.Group();
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.38, 36, 64, arc),
    donutMat
  );
  torus.rotation.x = Math.PI / 2;
  torus.position.y = 0.38;
  donutRing.add(torus);

  const hasGlaze = S.deco && (S.deco.drip || S.deco.straw || S.deco.spr || S.deco.flower || S.deco.berry);
  let glazeMat = null;
  if (hasGlaze) {
    let glazeColor = "#3E2211";
    if (S.deco && S.deco.straw) glazeColor = "#F06292";
    else if (S.deco && (S.deco.flower || S.deco.berry)) glazeColor = "#FFF8EE";

    glazeMat = new THREE.MeshStandardMaterial({
      color: glazeColor,
      roughness: 0.18,
      metalness: 0.08,
      envMapIntensity: 0.95,
    });
    const glaze = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.385, 24, 64, arc),
      glazeMat
    );
    glaze.rotation.x = Math.PI / 2;
    glaze.position.y = 0.385;
    donutRing.add(glaze);

    if (S.deco && S.deco.spr) {
      const spGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6);
      const spColors = ["#FFF", "#FFD54F", "#81C784", "#FF4081", "#448AFF"];
      const spCount = sliced ? 22 : 32;
      for (let i = 0; i < spCount; i++) {
        const a = (i * arc) / spCount + (Math.random() - 0.5) * 0.15;
        const r = 0.72 + (Math.random() - 0.5) * 0.28;
        const spMat = new THREE.MeshStandardMaterial({
          color: spColors[i % spColors.length],
          roughness: 0.4,
        });
        const sp = new THREE.Mesh(spGeo, spMat);
        sp.position.set(Math.cos(a) * r, 0.76, Math.sin(a) * r);
        sp.rotation.set(Math.PI / 2, 0, Math.random() * Math.PI);
        donutRing.add(sp);
      }
    }
  }

  if (sliced) {
    const crumbMat = new THREE.MeshStandardMaterial({
      color: flavColor,
      roughness: 0.95,
      map: crumbTex.map,
      bumpMap: crumbTex.bump,
      bumpScale: 4.0,
      side: THREE.DoubleSide,
    });
    const fillMat = new THREE.MeshStandardMaterial({
      color: fillColor,
      roughness: 0.18,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const capGeo = new THREE.CircleGeometry(0.38, 32);
    const fillCoreGeo = new THREE.CircleGeometry(0.22, 24);

    const c1 = new THREE.Mesh(capGeo, crumbMat);
    c1.position.set(0.72, 0.38, 0);
    c1.lookAt(0.72, 0.38, 1);
    const core1 = new THREE.Mesh(fillCoreGeo, fillMat);
    core1.position.z = 0.003;
    c1.add(core1);
    donutRing.add(c1);

    const c2 = new THREE.Mesh(capGeo, crumbMat);
    c2.position.set(0.72 * Math.cos(arc), 0.38, 0.72 * Math.sin(arc));
    c2.lookAt(
      0.72 * Math.cos(arc) - Math.sin(arc),
      0.38,
      0.72 * Math.sin(arc) + Math.cos(arc)
    );
    const core2 = new THREE.Mesh(fillCoreGeo, fillMat);
    core2.position.z = 0.003;
    c2.add(core2);
    donutRing.add(c2);

    donutRing.rotation.y = -(cutCenter + cutAngle / 2);
    g.add(donutRing);

    const chunkG = new THREE.Group();
    const slArc = cutAngle - 0.05;
    const slTorus = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.38, 24, 20, slArc), donutMat);
    slTorus.rotation.x = Math.PI / 2;
    slTorus.position.y = 0.38;
    chunkG.add(slTorus);

    if (glazeMat) {
      const slGlaze = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.385, 16, 20, slArc), glazeMat);
      slGlaze.rotation.x = Math.PI / 2;
      slGlaze.position.y = 0.385;
      chunkG.add(slGlaze);
    }

    const sc1 = new THREE.Mesh(capGeo, crumbMat);
    sc1.position.set(0.72, 0.38, 0);
    sc1.lookAt(0.72, 0.38, -1);
    const sCore1 = new THREE.Mesh(fillCoreGeo, fillMat);
    sCore1.position.z = 0.003;
    sc1.add(sCore1);
    chunkG.add(sc1);

    const sc2 = new THREE.Mesh(capGeo, crumbMat);
    sc2.position.set(0.72 * Math.cos(slArc), 0.38, 0.72 * Math.sin(slArc));
    sc2.lookAt(
      0.72 * Math.cos(slArc) + Math.sin(slArc),
      0.38,
      0.72 * Math.sin(slArc) - Math.cos(slArc)
    );
    const sCore2 = new THREE.Mesh(fillCoreGeo, fillMat);
    sCore2.position.z = 0.003;
    sc2.add(sCore2);
    chunkG.add(sc2);

    chunkG.rotation.y = -(cutCenter + cutAngle / 2);
    const pull = 0.28;
    chunkG.position.set(Math.sin(cutCenter) * pull, 0, Math.cos(cutCenter) * pull);
    g.add(chunkG);
  } else {
    g.add(donutRing);
  }

  return g;
}

function build3DDonat(add, M, MB, S, sliced) {
  const g = new THREE.Group();
  const donutTex = getDonutTextures();

  let donutColor = "#DCA052";
  if (S.flavor === "choco") donutColor = "#4A2816";
  else if (S.flavor === "velvet") donutColor = "#8A1E27";
  else if (S.flavor === "straw") donutColor = "#DC5770";

  const donutMat = new THREE.MeshStandardMaterial({
    color: donutColor,
    roughness: 0.62,
    envMapIntensity: 0.3,
    map: donutTex.map,
    bumpMap: donutTex.bump,
    bumpScale: 3.8,
  });

  const baseScale = 0.52;
  const isMini = S.size === "mini";
  const isSmall = S.size === "small";

  if (isMini) {
    const d1 = makeOneDonut(donutTex, donutMat, S, sliced);
    d1.scale.setScalar(baseScale);
    g.add(d1);
  } else if (isSmall) {
    const d1 = makeOneDonut(donutTex, donutMat, S, sliced);
    d1.scale.setScalar(baseScale * 0.95);
    d1.position.set(-0.35, 0, -0.12);
    g.add(d1);

    const d2 = makeOneDonut(donutTex, donutMat, S, false);
    d2.scale.setScalar(baseScale * 0.95);
    d2.position.set(0.35, 0, -0.12);
    g.add(d2);

    const d3 = makeOneDonut(donutTex, donutMat, S, false);
    d3.scale.setScalar(baseScale * 0.95);
    d3.position.set(0, 0.38 * baseScale, 0.18);
    g.add(d3);
  } else {
    const d1 = makeOneDonut(donutTex, donutMat, S, sliced);
    d1.scale.setScalar(baseScale * 0.85);
    d1.position.set(-0.4, 0, -0.2);
    g.add(d1);

    const d2 = makeOneDonut(donutTex, donutMat, S, false);
    d2.scale.setScalar(baseScale * 0.85);
    d2.position.set(0.4, 0, -0.2);
    g.add(d2);

    const d3 = makeOneDonut(donutTex, donutMat, S, false);
    d3.scale.setScalar(baseScale * 0.85);
    d3.position.set(0, 0, 0.35);
    g.add(d3);

    const d4 = makeOneDonut(donutTex, donutMat, S, false);
    d4.scale.setScalar(baseScale * 0.85);
    d4.position.set(-0.2, 0.36 * baseScale, 0);
    g.add(d4);

    const d5 = makeOneDonut(donutTex, donutMat, S, false);
    d5.scale.setScalar(baseScale * 0.85);
    d5.position.set(0.2, 0.36 * baseScale, 0);
    g.add(d5);

    const d6 = makeOneDonut(donutTex, donutMat, S, false);
    d6.scale.setScalar(baseScale * 0.85);
    d6.position.set(0, 0.72 * baseScale, 0);
    g.add(d6);
  }

  add(g);
}

function makeOneCookie(cookieTex, cookieMat, chipMat, S) {
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.12, 0.26, 48),
    cookieMat
  );
  base.position.y = 0.13;
  g.add(base);

  const topDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.12, 36, 20),
    cookieMat
  );
  topDome.scale.set(1.0, 0.32, 1.0);
  topDome.position.y = 0.12;
  g.add(topDome);

  const chipGeo = new THREE.ConeGeometry(0.13, 0.16, 7);
  const chipPositions = [
    [0.22, 0.30, 0.18, 0.2, 0.4, 0.1],
    [-0.32, 0.28, -0.22, -0.3, 0.8, 0.2],
    [0.05, 0.33, -0.38, 0.4, -0.2, 0.5],
    [-0.45, 0.24, 0.28, 0.1, 1.2, -0.3],
    [0.48, 0.24, -0.15, -0.2, -0.5, 0.4],
    [-0.08, 0.32, 0.35, 0.3, 0.6, 0.2],
    [0.35, 0.26, 0.42, -0.4, 0.3, -0.1],
    [-0.55, 0.20, -0.12, 0.1, -0.7, 0.3],
  ];

  chipPositions.forEach(([x, y, z, rx, ry, rz]) => {
    const ch = new THREE.Mesh(chipGeo, chipMat);
    ch.position.set(x, y, z);
    ch.rotation.set(rx, ry, rz);
    g.add(ch);
  });

  if (S.deco && S.deco.spr) {
    const spGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 6);
    const spColors = ["#FFF", "#FFD54F", "#81C784", "#FF4081", "#448AFF"];
    for (let i = 0; i < 20; i++) {
      const a = (i * Math.PI * 2) / 20;
      const r = 0.4 + Math.random() * 0.45;
      const sp = new THREE.Mesh(
        spGeo,
        new THREE.MeshStandardMaterial({ color: spColors[i % spColors.length], roughness: 0.4 })
      );
      sp.position.set(Math.cos(a) * r, 0.32, Math.sin(a) * r);
      sp.rotation.set(Math.PI / 2, 0, Math.random() * Math.PI);
      g.add(sp);
    }
  }

  if (S.deco && S.deco.drip) {
    const dripMat = new THREE.MeshStandardMaterial({
      color: "#3B1E11",
      roughness: 0.25,
      metalness: 0.1,
    });
    for (let i = 0; i < 4; i++) {
      const dr = new THREE.Mesh(new THREE.TorusGeometry(0.25 + i * 0.2, 0.022, 8, 32), dripMat);
      dr.rotation.x = Math.PI / 2;
      dr.position.y = 0.32;
      g.add(dr);
    }
  }

  return g;
}

function build3DCookies(add, M, MB, S) {
  const g = new THREE.Group();
  const cookieTex = getCookieTextures();

  let cookieColor = "#D59B58";
  let chipColor = "#25140A";
  if (S.flavor === "choco") {
    cookieColor = "#3C1F11";
    chipColor = "#FFF0DB";
  } else if (S.flavor === "velvet") {
    cookieColor = "#821A22";
    chipColor = "#FFF0DB";
  } else if (S.flavor === "straw") {
    cookieColor = "#D85B70";
    chipColor = "#25140A";
  }

  const cookieMat = new THREE.MeshStandardMaterial({
    color: cookieColor,
    roughness: 0.78,
    map: cookieTex.map,
    bumpMap: cookieTex.bump,
    bumpScale: 8.0,
  });

  const chipMat = new THREE.MeshStandardMaterial({
    color: chipColor,
    roughness: 0.52,
  });

  const baseScale = 0.52;
  const isMini = S.size === "mini";
  const isSmall = S.size === "small";

  if (isMini) {
    const c1 = makeOneCookie(cookieTex, cookieMat, chipMat, S);
    c1.scale.setScalar(baseScale * 1.15);
    g.add(c1);
  } else if (isSmall) {
    const c1 = makeOneCookie(cookieTex, cookieMat, chipMat, S);
    c1.scale.setScalar(baseScale * 0.95);
    c1.position.set(-0.35, 0, -0.1);
    g.add(c1);

    const c2 = makeOneCookie(cookieTex, cookieMat, chipMat, S);
    c2.scale.setScalar(baseScale * 0.95);
    c2.position.set(0.35, 0, -0.1);
    g.add(c2);

    const c3 = makeOneCookie(cookieTex, cookieMat, chipMat, S);
    c3.scale.setScalar(baseScale * 0.95);
    c3.position.set(0, 0.12, 0.2);
    g.add(c3);
  } else {
    const offsets = [
      [-0.38, 0, -0.22],
      [0.38, 0, -0.22],
      [-0.35, 0, 0.22],
      [0.35, 0, 0.22],
      [-0.1, 0.14, 0],
      [0.1, 0.14, 0],
    ];
    offsets.forEach(([x, y, z]) => {
      const c = makeOneCookie(cookieTex, cookieMat, chipMat, S);
      c.scale.setScalar(baseScale * 0.85);
      c.position.set(x, y, z);
      g.add(c);
    });
  }

  add(g);
}

/* ===== ruang dapur isometrik (CakeCraft Studio) ===== */
const KC = {};
const hxColor = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const KM = (c, r = 0.75) =>
  KC[c + r] ||
  (KC[c + r] = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
  }));
const kb = (g, w, h, d, c, x, y, z, r = 0.75) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), KM(c, r));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
};
const kc = (g, a, b, h, c, x, y, z, r = 0.75, seg = 24) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, seg), KM(c, r));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
};
const ks = (g, r, c, x, y, z, sx = 1, sy = 1, sz = 1, rg = 0.75) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), KM(c, rg));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  g.add(m);
  return m;
};
function tileTex(rx, ry, base, grout) {
  const n = 64,
    d = new Uint8Array(n * n * 4),
    B = hxColor(base),
    G = hxColor(grout);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const e = x < 2 || y < 2 ? G : B,
        k = (y * n + x) * 4;
      d[k] = e[0];
      d[k + 1] = e[1];
      d[k + 2] = e[2];
      d[k + 3] = 255;
    }
  const t = new THREE.DataTexture(d, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}
function kplant(g, x, y, z, s, pot, leaf, n) {
  const p = new THREE.Group();
  p.position.set(x, y, z);
  p.scale.setScalar(s);
  kc(p, 0.46, 0.33, 0.8, pot, 0, 0.4, 0);
  kc(p, 0.5, 0.5, 0.1, pot, 0, 0.82, 0);
  kc(p, 0.42, 0.42, 0.04, "#4a3a2a", 0, 0.85, 0);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + i * 0.7,
      k = 0.5 + (i % 3) * 0.22,
      d = new THREE.Vector3(Math.cos(a) * k, 1, Math.sin(a) * k).normalize(),
      l = ks(p, 0.3, leaf, 0, 0, 0, 0.42, 1.45, 0.14);
    l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    l.position
      .copy(d)
      .multiplyScalar(0.42)
      .add(new THREE.Vector3(0, 0.85, 0));
  }
  g.add(p);
}

/* ===== Karakter Patissier Imut di Studio Dapur ===== */
function limb(g, a, b, r, c) {
  const A = new THREE.Vector3(...a),
    B = new THREE.Vector3(...b),
    d = B.clone().sub(A),
    m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r * 0.9, d.length(), 14),
      KM(c, 0.6)
    );
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  m.castShadow = true;
  g.add(m);
  return m;
}

function buildGirl() {
  const g = new THREE.Group(),
    skin = "#fbe2d4",
    hair = "#6a3733",
    wt = "#fffaf6",
    pk = "#ee8da3",
    pkD = "#d96f8a",
    R = 0.78,
    HY = 3.4,
    fz = (x, y) => Math.sqrt(Math.max(0.02, R * R - x * x - y * y)) * 0.95;

  function tube(par, pts, rf, col, rough) {
    const cv = new THREE.CatmullRomCurve3(
        pts.map((v) => new THREE.Vector3(v[0], v[1], v[2]))
      ),
      TS = 24,
      RS = 16,
      geo = new THREE.TubeGeometry(cv, TS, 1, RS, false),
      pa = geo.attributes.position;
    for (let i = 0; i <= TS; i++) {
      const t = i / TS,
        c = cv.getPointAt(t),
        f = rf(t);
      for (let j = 0; j <= RS; j++) {
        const k = i * (RS + 1) + j;
        pa.setXYZ(
          k,
          c.x + (pa.getX(k) - c.x) * f,
          c.y + (pa.getY(k) - c.y) * f,
          c.z + (pa.getZ(k) - c.z) * f
        );
      }
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, KM(col, rough));
    m.castShadow = true;
    par.add(m);
    return m;
  }
  const slv = (t) =>
      0.25 - 0.05 * t + 0.05 * Math.pow(Math.max(0, (t - 0.78) / 0.22), 1.5),
    fr = (t) => 0.1 - 0.025 * t,
    hr = (t) => Math.max(0.5, 1 - 0.5 * Math.pow(t, 2));

  function hand(par) {
    const h = new THREE.Group();
    par.add(h);
    ks(h, 0.15, skin, 0, 0.14, 0, 1, 1.05, 0.7, 0.6);
    [
      [-0.08, 0.8],
      [-0.03, 1],
      [0.03, 1],
      [0.08, 0.8],
    ].forEach((f, j) => {
      const m = ks(
        h,
        0.05,
        skin,
        f[0] * 1.1,
        0.36 + f[1] * 0.03,
        0,
        1,
        2.2 * f[1] + 0.4,
        1.1,
        0.6
      );
      m.rotation.z = (j - 1.5) * -0.1;
    });
    const t = ks(h, 0.058, skin, 0.16, 0.18, 0.03, 1, 2.1, 1.1, 0.6);
    t.rotation.z = -0.85;
    h.scale.setScalar(1.1);
    return h;
  }

  /* kaki: kaos kaki putih + sepatu merah */
  for (const x of [-0.22, 0.22]) {
    kc(g, 0.1, 0.1, 0.5, wt, x, 0.3, 0, 0.8);
    ks(g, 0.19, "#b03a48", x, 0.08, 0.1, 1, 0.6, 1.5, 0.4);
  }

  /* rok pink mengembang + renda putih */
  kc(g, 0.46, 0.8, 0.95, pk, 0, 1.0, 0, 0.85, 40);
  const rf = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.045, 8, 40),
    KM(wt, 0.8)
  );
  rf.rotation.x = Math.PI / 2;
  rf.position.y = 0.53;
  g.add(rf);
  const wb = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.05, 8, 36),
    KM(pkD, 0.8)
  );
  wb.rotation.x = Math.PI / 2;
  wb.position.y = 1.5;
  g.add(wb);

  /* blus putih + bib apron pink dengan saku hati */
  const to = kc(g, 0.4, 0.46, 1.0, wt, 0, 2.02, 0, 0.85, 28);
  to.scale.z = 0.85;
  ks(g, 0.45, wt, 0, 2.5, 0, 1, 0.35, 0.75, 0.85);
  kb(g, 0.6, 0.8, 0.05, pk, 0, 1.95, 0.38, 0.85);
  kb(g, 0.62, 0.05, 0.06, pkD, 0, 2.35, 0.38, 0.85);
  for (const q of [-1, 1]) {
    tube(
      g,
      [
        [q * 0.24, 2.35, 0.38],
        [q * 0.26, 2.6, 0.2],
        [q * 0.28, 2.72, -0.1],
      ],
      (t) => 0.05,
      pk,
      0.85
    );
  }
  kb(g, 0.28, 0.24, 0.03, wt, 0, 1.8, 0.43, 0.85);
  for (const q of [-1, 1])
    ks(g, 0.05, "#e24a6a", q * 0.035, 1.83, 0.46, 1, 1, 0.4, 0.5);
  const hb = kb(g, 0.075, 0.075, 0.03, "#e24a6a", 0, 1.79, 0.46, 0.5);
  hb.rotation.z = Math.PI / 4;
  kc(g, 0.17, 0.19, 0.28, wt, 0, 2.64, 0, 0.8);

  /* lengan kanan (tergantung santai / siap melambai) */
  const ar = new THREE.Group();
  ar.position.set(-0.6, 2.45, 0);
  g.add(ar);
  ks(ar, 0.27, wt, 0, 0, 0, 1, 1, 1, 0.85);
  tube(
    ar,
    [
      [0, 0, 0],
      [-0.1, -0.2, 0.01],
      [-0.18, -0.4, 0.03],
    ],
    slv,
    wt,
    0.85
  );
  const fa = new THREE.Group();
  fa.position.set(-0.18, -0.4, 0.03);
  ar.add(fa);
  tube(
    fa,
    [
      [0.03, 0.1, 0],
      [0, 0, 0],
      [-0.08, -0.45, 0.05],
      [-0.12, -0.88, 0.12],
    ],
    fr,
    skin,
    0.6
  );
  const wh = new THREE.Group();
  wh.position.set(-0.12, -0.88, 0.12);
  fa.add(wh);
  hand(wh).rotation.z = Math.PI;

  /* lengan kiri */
  const al = new THREE.Group();
  al.position.set(0.6, 2.45, 0);
  g.add(al);
  ks(al, 0.27, wt, 0, 0, 0, 1, 1, 1, 0.85);
  tube(
    al,
    [
      [0, 0, 0],
      [0.1, -0.2, 0.01],
      [0.18, -0.4, 0.03],
    ],
    slv,
    wt,
    0.85
  );
  const lf = new THREE.Group();
  lf.position.set(0.18, -0.4, 0.03);
  al.add(lf);
  tube(
    lf,
    [
      [-0.03, 0.1, 0],
      [0, 0, 0],
      [0.08, -0.45, 0.05],
      [0.12, -0.88, 0.12],
    ],
    fr,
    skin,
    0.6
  );
  const lw = new THREE.Group();
  lw.position.set(0.12, -0.88, 0.12);
  lf.add(lw);
  hand(lw).rotation.z = Math.PI;

  /* kepala */
  const hd = new THREE.Group();
  hd.position.y = HY;
  g.add(hd);
  ks(hd, R, skin, 0, 0, 0, 1, 1, 0.95, 0.55);
  ks(hd, 0.4, skin, 0, -0.36, 0.2, 1, 0.85, 0.9, 0.55);
  const ey = new THREE.Group();
  hd.add(ey);
  for (const q of [-1, 1]) {
    const x = q * 0.28,
      y = -0.1,
      z = fz(x, y);
    ks(ey, 0.17, "#ffffff", x, y, z - 0.03, 1.05, 1.15, 0.35, 0.3);
    ks(ey, 0.155, "#6b3a2a", x, y, z, 0.95, 1.15, 0.3, 0.25);
    ks(ey, 0.1, "#c98a52", x, y - 0.06, z + 0.012, 1.1, 0.5, 0.3, 0.3);
    ks(ey, 0.085, "#2a1410", x, y, z + 0.025, 1, 1.1, 0.3, 0.2);
    ks(ey, 0.045, "#ffffff", x + q * 0.05, y + 0.06, z + 0.05, 1, 1, 0.4, 0.2);
    ks(
      ey,
      0.022,
      "#ffffff",
      x - q * 0.05,
      y - 0.07,
      z + 0.045,
      1,
      1,
      0.4,
      0.2
    );
    const ld = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.028, 6, 18, Math.PI),
      KM("#3a1d18", 0.4)
    );
    ld.scale.set(1.08, 1, 1);
    ld.position.set(x, y + 0.01, z + 0.01);
    ey.add(ld);
    ks(
      hd,
      0.15,
      "#ff9aa8",
      q * 0.47,
      -0.27,
      fz(0.47, -0.27) - 0.03,
      1.3,
      0.6,
      0.3,
      0.8
    );
    ks(hd, 0.09, skin, q * 0.77, -0.05, 0, 0.5, 1, 0.8, 0.55);
  }
  ks(hd, 0.035, "#eebfae", 0, -0.2, fz(0, -0.2) + 0.01, 1, 1.2, 0.8, 0.6);
  const mo = new THREE.Group();
  mo.position.set(0, -0.36, fz(0, -0.36) - 0.01);
  hd.add(mo);
  const sm = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.014, 6, 14, Math.PI),
    KM("#c4505a", 0.5)
  );
  sm.rotation.z = Math.PI;
  sm.position.y = 0.04;
  mo.add(sm);

  /* rambut panjang coklat manis */
  ks(hd, R * 1.03, hair, 0, 0.04, -0.22, 1.02, 1, 0.85, 0.5);
  const bk = kc(g, 0.62, 0.7, 1.5, hair, 0, 2.5, -0.32, 0.5, 28);
  bk.scale.z = 0.5;
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.05, 32, 24, 0, 6.283, 0, 1.35),
    KM(hair, 0.45)
  );
  cap.position.y = 0.02;
  cap.castShadow = true;
  hd.add(cap);

  function lock(par, pts, r, tip) {
    const cv = new THREE.CatmullRomCurve3(
        pts.map((v) => new THREE.Vector3(v[0], v[1], v[2]))
      ),
      TS = 20,
      RS = 12,
      geo = new THREE.TubeGeometry(cv, TS, r, RS, false),
      pa = geo.attributes.position;
    for (let i = 0; i <= TS; i++) {
      const t = i / TS,
        c = cv.getPointAt(t),
        f = Math.max(tip, 1 - (1 - tip) * Math.pow(t, 1.6));
      for (let j = 0; j <= RS; j++) {
        const k = i * (RS + 1) + j;
        pa.setXYZ(
          k,
          c.x + (pa.getX(k) - c.x) * f,
          c.y + (pa.getY(k) - c.y) * f,
          c.z + (pa.getZ(k) - c.z) * f
        );
      }
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, KM(hair, 0.45));
    m.castShadow = true;
    par.add(m);
    return m;
  }

  for (const x of [-0.56, -0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42, 0.56])
    lock(
      hd,
      [
        [x * 0.85, 0.72, -0.02],
        [x * 0.95, 0.52, fz(x, 0.52) + 0.02],
        [x, 0.32, fz(x, 0.32) + 0.05],
        [x * 1.02, 0.15, fz(x, 0.15) + 0.05],
      ],
      0.13,
      0.3
    );
  for (const q of [-1, 1]) {
    lock(
      hd,
      [
        [q * 0.66, 0.3, 0.2],
        [q * 0.77, 0, 0.2],
        [q * 0.75, -0.3, 0.25],
        [q * 0.66, -0.5, 0.38],
      ],
      0.13,
      0.25
    );
    lock(
      hd,
      [
        [q * 0.6, 0.28, 0.52],
        [q * 0.64, -0.05, 0.45],
        [q * 0.6, -0.32, 0.5],
      ],
      0.08,
      0.3
    );
    lock(
      g,
      [
        [q * 0.76, HY - 0.3, -0.05],
        [q * 0.92, HY - 0.9, -0.12],
        [q * 0.92, HY - 1.45, -0.12],
        [q * 0.84, HY - 1.95, -0.08],
      ],
      0.17,
      0.75
    );
  }

  /* pita pink di atas kepala */
  const bw = new THREE.Group();
  bw.position.set(-0.3, 0.78, 0.22);
  bw.rotation.z = 0.35;
  hd.add(bw);
  for (const q of [-1, 1]) {
    const lp = ks(bw, 0.17, pk, q * 0.2, 0, 0, 1.2, 0.8, 0.5, 0.5);
    lp.rotation.z = q * 0.25;
  }
  ks(bw, 0.08, pkD, 0, 0, 0.04, 1, 1, 0.8, 0.5);

  /* balon "Haii!" */
  if (typeof document !== "undefined") {
    try {
      const cb = document.createElement("canvas");
      cb.width = 256;
      cb.height = 160;
      const c2 = cb.getContext("2d");
      if (c2) {
        c2.fillStyle = "#ffffff";
        c2.strokeStyle = "#ee8da3";
        c2.lineWidth = 8;
        c2.lineJoin = "round";
        c2.beginPath();
        c2.moveTo(40, 10);
        c2.arcTo(246, 10, 246, 60, 30);
        c2.arcTo(246, 112, 200, 112, 30);
        c2.lineTo(90, 112);
        c2.lineTo(34, 150);
        c2.lineTo(60, 112);
        c2.arcTo(10, 112, 10, 60, 30);
        c2.arcTo(10, 10, 60, 10, 30);
        c2.closePath();
        c2.fill();
        c2.stroke();
        c2.fillStyle = "#d96f8a";
        c2.font = "bold 54px sans-serif";
        c2.textAlign = "center";
        c2.textBaseline = "middle";
        c2.fillText("Haii! 👋", 128, 62);
        const bub = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(cb),
            transparent: true,
            opacity: 0,
            depthTest: false,
          })
        );
        bub.position.set(1.3, 4.7, 0);
        bub.renderOrder = 10;
        bub.visible = false;
        g.add(bub);
        g.userData.bub = bub;
      }
    } catch (_) {}
  }

  g.userData.fa = fa;
  g.userData.hd = hd;
  g.userData.ey = ey;
  g.userData.wh = wh;
  g.userData.ar = ar;
  g.userData.al = al;
  g.userData.mo = mo;

  return g;
}

function charAnim(t, kitchen) {
  if (!kitchen) return;
  const u = kitchen.userData?.girl;
  if (!u) return;
  const G = kitchen.userData?.girlG;
  if (G) {
    G.rotation.z = Math.sin(t * 0.0015) * 0.025;
    G.scale.y = 0.9 * (1 + Math.sin(t * 0.003) * 0.01);
  }
  const p = (t % 11000) / 3000,
    e = p < 1 ? Math.max(0, Math.min(1, p / 0.15, (1 - p) / 0.15)) : 0,
    E = e * e * (3 - 2 * e),
    sw = Math.sin(t * 0.013);
  if (u.ar) u.ar.rotation.z = -1.7 * E + Math.sin(t * 0.0018) * 0.03 * (1 - E);
  if (u.fa) u.fa.rotation.z = -1.5 * E + sw * 0.3 * E + Math.sin(t * 0.004) * 0.05 * (1 - E);
  if (u.wh) u.wh.rotation.z = sw * 0.35 * E;
  if (u.al) u.al.rotation.z = Math.sin(t * 0.0017 + 1) * 0.03;
  if (u.hd) {
    u.hd.rotation.z = 0.05 + E * 0.08 + Math.sin(t * 0.002) * 0.04;
    u.hd.rotation.y = Math.sin(t * 0.0013) * 0.12;
    u.hd.rotation.x = Math.sin(t * 0.0021) * 0.03;
  }
  if (u.mo) u.mo.scale.y = 1 + Math.sin(t * 0.004) * 0.1 + Math.abs(sw) * 0.6 * E;
  if (u.ey) u.ey.scale.y = (t % 3800) < 140 ? 0.12 : 1;
  if (u.bub) {
    u.bub.visible = E > 0.01;
    u.bub.material.opacity = E;
    const k = 0.6 + 0.4 * E;
    u.bub.scale.set(1.7 * k, 1.06 * k, 1);
  }
}

function buildKitchen() {
  const g = new THREE.Group(),
    F = -3.1,
    CT = -0.7,
    wood = "#dca168",
    cab = "#f5ebd8",
    tp = "#73432a",
    wl = "#FAF5EC";

  // Base platform & tile floor
  kb(g, 13.4, 0.8, 13.4, "#ebdcc9", 0, F - 0.4, 0, 0.8);
  const fl = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 11),
    new THREE.MeshStandardMaterial({
      map: tileTex(6, 6, "#FAF4EC", "#dacdc0"),
      roughness: 0.45,
    })
  );
  fl.rotation.x = -Math.PI / 2;
  fl.position.set(0.05, F + 0.003, 0.05);
  fl.receiveShadow = true;
  g.add(fl);

  // Back wall group
  const backGroup = new THREE.Group();
  kb(backGroup, 11, 7.4, 0.6, tp, 0, F + 3.7, -5.8);
  kb(backGroup, 11, 7.2, 0.1, wl, 0, F + 3.6, -5.45);
  const bs = new THREE.Mesh(
    new THREE.PlaneGeometry(10.8, 2.9),
    new THREE.MeshStandardMaterial({
      map: tileTex(12, 3, "#FFFFFF", "#ded2c2"),
      roughness: 0.35,
    })
  );
  bs.position.set(0, CT + 1.45, -5.39);
  bs.receiveShadow = true;
  backGroup.add(bs);

  // Range hood & chimney
  const hd = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 1.5, 1, 4),
    KM("#FFFFFF", 0.4)
  );
  hd.rotation.y = Math.PI / 4;
  hd.scale.set(1, 1, 0.7);
  hd.position.set(-0.2, CT + 2.8, -4.9);
  hd.castShadow = true;
  backGroup.add(hd);
  kb(backGroup, 0.9, 1.7, 0.9, "#FFFFFF", -0.2, 3.45, -5.0, 0.4);

  // Lampu spot hangat di bawah range hood kompor
  const hoodLight = new THREE.PointLight(0xffedd0, 0.95, 7, 1.5);
  hoodLight.position.set(-0.2, CT + 2.1, -4.8);
  backGroup.add(hoodLight);

  // Lampu hangat di bawah rak dinding
  const shelfLight = new THREE.PointLight(0xfff2dc, 0.75, 8, 1.6);
  shelfLight.position.set(3.4, 1.3, -4.9);
  backGroup.add(shelfLight);

  // Floating shelves on back wall with jars & plant
  [1.5, 2.6].forEach((y) => {
    kb(backGroup, 3.4, 0.12, 0.62, wood, 3.4, y, -5.08);
    for (let j = 0; j < 4; j++) {
      kc(
        backGroup,
        0.2,
        0.2,
        0.5,
        ["#e8dcc0", "#d9c8a0", "#efe6cf", "#cdb98f"][j],
        2.35 + j * 0.55,
        y + 0.31,
        -5.1
      );
      kc(
        backGroup,
        0.21,
        0.21,
        0.08,
        "#a47c4f",
        2.35 + j * 0.55,
        y + 0.6,
        -5.1
      );
    }
  });
  kplant(backGroup, 4.55, 2.75, -5.05, 0.34, "#c97b4a", "#5f9e5a", 6);
  g.add(backGroup);

  // Left wall group
  const leftGroup = new THREE.Group();
  kb(leftGroup, 0.6, 7.4, 11.6, tp, -5.8, F + 3.7, -0.3);
  kb(leftGroup, 0.1, 7.2, 11, wl, -5.45, F + 3.6, 0);
    const bl = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 2.9),
    new THREE.MeshStandardMaterial({
      map: tileTex(8, 3, "#FFFFFF", "#ded2c2"),
      roughness: 0.35,
    })
  );
  bl.rotation.y = Math.PI / 2;
  bl.position.set(-5.39, CT + 1.45, -2);
  bl.receiveShadow = true;
  leftGroup.add(bl);
  kb(leftGroup, 0.55, 0.75, 2.4, "#f5f2ea", -5.1, 3.3, -1.8, 0.5); // AC
  kb(leftGroup, 0.62, 0.12, 3.2, wood, -5.08, 1.7, 0.0);
  kb(leftGroup, 0.62, 0.12, 3.2, wood, -5.08, 2.8, 0.0);
  [-1, -0.2, 0.6].forEach((z) =>
    kc(leftGroup, 0.15, 0.12, 0.3, "#f3ede0", -5.1, 1.91, z + 0.2)
  );
  kplant(leftGroup, -5.1, 2.86, -0.9, 0.3, "#f1ece2", "#4f8a4e", 6);
  g.add(leftGroup);

  /* kabinet belakang + kompor */
  kb(g, 10.8, 2.25, 1.5, cab, 0, F + 1.125, -4.65);
  kb(g, 4.0, 0.18, 1.7, wood, -3.4, CT - 0.09, -4.6);
  kb(g, 4.4, 0.18, 1.7, wood, 3.2, CT - 0.09, -4.6);
  for (let x = -3.6; x < 5.4; x += 1.8) {
    if (x > -1.6 && x < 1.4) continue;
    kb(g, 0.04, 1.9, 0.02, "#cdb98f", x, F + 1.15, -3.89);
    kb(g, 0.06, 0.4, 0.05, "#9c8767", x + 0.15, F + 1.7, -3.86);
  }
  kb(g, 2.4, 2.3, 1.6, "#f2eee4", -0.2, F + 1.15, -4.6);
  kb(g, 2.4, 0.06, 1.6, "#2e2b29", -0.2, CT + 0.03, -4.6);
  [
    [-0.75, -4.9],
    [0.35, -4.9],
    [-0.75, -4.3],
    [0.35, -4.3],
  ].forEach(([x, z]) => {
    kc(g, 0.3, 0.3, 0.04, "#585451", x, CT + 0.09, z);
    kc(g, 0.13, 0.13, 0.05, "#171514", x, CT + 0.1, z);
  });
  kb(g, 2.1, 1.3, 0.05, "#e9e4d8", -0.2, F + 1.05, -3.76);
  kb(g, 1.5, 0.7, 0.03, "#26292b", -0.2, F + 1.15, -3.73);
  const hb = kc(g, 0.035, 0.035, 1.7, "#bdb6a6", -0.2, F + 1.75, -3.68);
  hb.rotation.z = Math.PI / 2;

  // Bak cuci piring (sink) + keran melengkung
  kb(g, 1.9, 0.04, 1, "#9aa6ab", 3.2, CT + 0.02, -4.6);
  kb(g, 1.6, 0.05, 0.7, "#6f7b80", 3.2, CT + 0.03, -4.6);
  kc(g, 0.05, 0.05, 0.7, "#c9ced1", 3.2, CT + 0.4, -5.1, 0.3);
  const fc = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.05, 8, 20, Math.PI),
    KM("#c9ced1", 0.3)
  );
  fc.position.set(3.2, CT + 0.75, -4.82);
  fc.rotation.y = Math.PI / 2;
  g.add(fc);

  /* kabinet kiri & kulkas */
  kb(g, 1.5, 2.25, 6.2, cab, -4.65, F + 1.125, -2.3);
  kb(g, 1.7, 0.18, 6.4, wood, -4.6, CT - 0.09, -2.3);
  for (let z = -4.2; z < 0.8; z += 1.7) {
    kb(g, 0.02, 1.9, 0.04, "#cdb98f", -3.89, F + 1.15, z);
    kb(g, 0.05, 0.4, 0.06, "#9c8767", -3.86, F + 1.7, z + 0.15);
  }
  kb(g, 1.9, 4.8, 2.2, "#f4efe4", -4.45, F + 2.4, 2.5);
  kb(g, 0.02, 0.05, 2.2, "#c9c2b2", -3.49, F + 3.2, 2.5);
  kb(g, 0.06, 0.9, 0.06, "#b9b2a2", -3.45, F + 3.9, 1.75);
  kb(g, 0.06, 0.9, 0.06, "#b9b2a2", -3.45, F + 2.2, 1.75);

  /* island + bangku */
  const isl = new THREE.Group();
  g.add(isl);
  g.userData.island = isl;
  kb(isl, 6.6, 2.2, 3.4, cab, 0, F + 1.1, 0);
  kb(isl, 7, 0.2, 3.8, wood, 0, CT - 0.1, 0);
  for (const x of [-2.2, 0, 2.2])
    kb(isl, 0.04, 1.8, 0.02, "#cdb98f", x, F + 1.1, 1.71);
  for (const x of [-1.6, 1.6]) {
    kc(isl, 0.45, 0.45, 0.13, wood, x, F + 1.95, 2.75);
    for (const [a, b] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ])
      kc(isl, 0.04, 0.04, 1.9, wood, x + a * 0.28, F + 0.95, 2.75 + b * 0.28);
  }
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 12, 0, 6.283, Math.PI / 2, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: "#8b8f83",
      roughness: 0.5,
      side: THREE.DoubleSide,
    })
  );
  bowl.position.set(-2.5, CT + 0.5, -0.85);
  bowl.castShadow = true;
  isl.add(bowl);
  [
    [-0.18, 0],
    [0.18, 0.05],
    [0, -0.18],
    [0.05, 0.2],
  ].forEach(([dx, dz]) =>
    ks(isl, 0.22, "#7bbf4a", -2.5 + dx, CT + 0.4, -0.85 + dz, 1, 0.95, 1, 0.4)
  );
  kc(isl, 0.5, 0.42, 0.05, "#f7f4ee", 2.5, CT + 0.025, 0.8);
  [
    [0, 0],
    [0.15, 0.1],
    [-0.15, 0.05],
    [0.05, -0.15],
  ].forEach(([dx, dz]) =>
    ks(isl, 0.16, "#5f9e5a", 2.5 + dx, CT + 0.12, 0.8 + dz, 1, 0.6, 1)
  );
  kc(isl, 0.14, 0.12, 0.28, "#ffffff", 2.2, CT + 0.14, -0.7);

  kplant(g, -4.6, F, 4.6, 1, "#c97b4a", "#5f9e5a", 11);
  kplant(g, 5.0, F, 3.3, 0.85, "#f1ece2", "#4f8a4e", 10);
  kplant(g, 4.9, CT, -4.8, 0.5, "#c97b4a", "#5f9e5a", 7);

  // Lampu gantung cantik di atas meja island (Pendant Lamps)
  [-1.8, 1.8].forEach((lx) => {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, 0);

    // Ceiling mount
    kc(lamp, 0.12, 0.12, 0.05, "#2d2522", 0, 4.25, 0, 0.4);
    // Kabel gantung ramping
    kc(lamp, 0.012, 0.012, 1.8, "#2d2522", 0, 3.35, 0, 0.5);
    // Fitting kuningan mewah
    kc(lamp, 0.08, 0.12, 0.12, "#d4af37", 0, 2.45, 0, 0.3);

    // Kap lampu kerucut (Burgundy / Rose)
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.52, 0.42, 28, 1, true),
      new THREE.MeshStandardMaterial({
        color: "#A36361",
        roughness: 0.35,
        side: THREE.DoubleSide,
      })
    );
    shade.position.set(0, 2.3, 0);
    shade.castShadow = true;
    lamp.add(shade);

    // Ring dalam keemasan reflektif
    kc(lamp, 0.5, 0.5, 0.03, "#ffdf99", 0, 2.1, 0, 0.3);

    // Bohlam menyala terang & hangat
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff6d6 })
    );
    bulb.position.set(0, 2.15, 0);
    lamp.add(bulb);

    // Sumber cahaya lampu hangat menerangi kue & meja
    const pLight = new THREE.PointLight(0xfff0d0, 1.35, 14, 1.4);
    pLight.position.set(0, 1.95, 0);
    lamp.add(pLight);

    g.add(lamp);
  });

  // Karakter cewek patissier imut di dapur studio
  const gr = buildGirl();
  gr.position.set(2.6, F, -3);
  gr.rotation.y = 0.785;
  gr.scale.setScalar(0.9);
  g.add(gr);
  g.userData.girl = gr.userData;
  g.userData.girlG = gr;

  g.userData.backGroup = backGroup;
  g.userData.leftGroup = leftGroup;

  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  return g;
}

const buildKitchenStudio = buildKitchen;

const TCUT = 0.9;
const WCUT = 0.95;
let CUSH = null;
const getCush = () => {
  if (!CUSH) CUSH = swirlGeo(0.1, 0.07);
  return CUSH;
};
let BERRYG = null;
const getBerryG = () => {
  if (!BERRYG) BERRYG = berryGeo();
  return BERRYG;
};

function sliceLoop(lp) {
  const { P, T, N } = lp;
  const kept = P.map((p) => {
    let a = Math.atan2(p[0], p[1]) - TCUT;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    return Math.abs(a) > WCUT / 2;
  });
  let st = -1;
  for (let i = 0; i < N; i++) {
    if (kept[i] && !kept[(i + N - 1) % N]) {
      st = i;
      break;
    }
  }
  if (st < 0) return lp;
  const ix = [];
  for (let k = 0; k < N; k++) {
    const i = (st + k) % N;
    if (!kept[i]) break;
    ix.push(i);
  }
  const P2 = ix.map((i) => P[i]),
    T2 = ix.map((i) => T[i]);
  let L = 0;
  const U = P2.map((p, i) => {
    if (i) L += Math.hypot(p[0] - P2[i - 1][0], p[1] - P2[i - 1][1]);
    return L;
  });
  return {
    P: P2,
    T: T2,
    N: P2.length,
    U,
    L,
    cw: lp.cw,
    closed: false,
    A: P2[0],
    B: P2[P2.length - 1],
  };
}

function cutFaces(lp, H, body, fl, ice, D) {
  const g = new THREE.Group(),
    cr = getCrumbTexture(),
    fy = H * 0.47,
    st = [
      [0, fy - 0.045, body, 1],
      [fy - 0.045, fy + 0.045, fl, 0],
      [fy + 0.045, H, body, 1],
      [H, H + 0.055, ice, 2],
    ];
  [lp.A, lp.B].forEach((E, ei) => {
    const len = Math.hypot(E[0], E[1]) * 2;
    const T = lp.T[ei ? lp.N - 1 : 0];
    const dd = Math.max(0.04, D ? D[ei ? lp.N - 1 : 0] : 0.08);

    // Endcap geometry closing the outer drip/icing curtain along the cut flank
    const eInner = [E[0] - T[0] * 0.02, E[1] - T[1] * 0.02];
    const eOuter = [E[0] + T[0] * 0.045, E[1] + T[1] * 0.045];
    const y0 = H - dd;
    const y1 = H + 0.055;
    const gq = new THREE.BufferGeometry();
    gq.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          eInner[0], y0, eInner[1],
          eOuter[0], y0, eOuter[1],
          eOuter[0], y1, eOuter[1],
          eInner[0], y1, eInner[1],
        ],
        3
      )
    );
    gq.setIndex([0, 1, 2, 0, 2, 3]);
    gq.computeVertexNormals();
    g.add(
      new THREE.Mesh(
        gq,
        new THREE.MeshStandardMaterial({
          color: ice,
          roughness: 0.35,
          side: THREE.DoubleSide,
        })
      )
    );

    // Endcap closing the filling ribbon bulge
    const eFill = [E[0] + T[0] * 0.04, E[1] + T[1] * 0.04];
    const gqFill = new THREE.BufferGeometry();
    gqFill.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          E[0], fy - 0.045, E[1],
          eFill[0], fy, eFill[1],
          E[0], fy + 0.045, E[1],
        ],
        3
      )
    );
    gqFill.setIndex([0, 1, 2]);
    gqFill.computeVertexNormals();
    g.add(
      new THREE.Mesh(
        gqFill,
        new THREE.MeshStandardMaterial({
          color: fl,
          roughness: 0.45,
          side: THREE.DoubleSide,
        })
      )
    );
    st.forEach(([y0, y1, c, sp]) => {
      const ge = new THREE.BufferGeometry();
      ge.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          [0, y0, 0, E[0], y0, E[1], E[0], y1, E[1], 0, y1, 0],
          3
        )
      );
      ge.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(
          [0, y0 * 2, len, y0 * 2, len, y1 * 2, 0, y1 * 2],
          2
        )
      );
      ge.setIndex([0, 1, 2, 0, 2, 3]);
      ge.computeVertexNormals();

      let mat;
      if (sp === 1) {
        // Authentic sponge cake crumb
        mat = new THREE.MeshStandardMaterial({
          color: c,
          map: cr.map,
          bumpMap: cr.bump,
          bumpScale: 6.0,
          roughness: 0.85,
          side: THREE.DoubleSide,
        });
      } else if (sp === 2) {
        // Top cream slice face
        mat = new THREE.MeshStandardMaterial({
          color: ice,
          roughness: 0.4,
          side: THREE.DoubleSide,
        });
      } else {
        // Filling layer
        mat = new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.45,
          side: THREE.DoubleSide,
        });
      }

      g.add(new THREE.Mesh(ge, mat));
    });
  });
  return g;
}

const GLY = {};
function glyphGeo(ch) {
  if (GLY[ch]) return GLY[ch];
  if (typeof document === "undefined") {
    return { g: new THREE.BufferGeometry(), wx: 0, wy: 0.3 };
  }
  const W = 160,
    c = document.createElement("canvas");
  c.width = c.height = W;
  const x = c.getContext("2d");
  x.fillStyle = "#fff";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `800 ${W * 0.8}px "Baloo 2","Fredoka",sans-serif`;
  x.fillText(ch, W / 2, W * 0.55);

  const d = x.getImageData(0, 0, W, W).data,
    a = new Float32Array(W * W),
    t = new Float32Array(W * W);
  for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255;

  for (let y = 0; y < W; y++)
    for (let q = 0; q < W; q++) {
      let u = 0;
      for (let k = -1; k <= 1; k++)
        u += a[y * W + Math.min(W - 1, Math.max(0, q + k))];
      t[y * W + q] = u / 3;
    }
  for (let q = 0; q < W; q++)
    for (let y = 0; y < W; y++) {
      let u = 0;
      for (let k = -1; k <= 1; k++)
        u += t[Math.min(W - 1, Math.max(0, y + k)) * W + q];
      a[y * W + q] = u / 3;
    }
  for (let i = 0; i < a.length; i++) {
    const v = Math.max(0, Math.min(1, (a[i] - 0.12) / 0.5));
    a[i] = v * v * (3 - 2 * v);
  }
  const m = { W, H: W, a },
    mp = (q) => (u, v, h) => [(u - 0.5) * 0.3, v * 0.36, q * h],
    f = reliefGeo(m, mp(1), 0.05),
    b = reliefGeo(m, mp(-1), 0.05);

  let wy = 0.34,
    wx = 0;
  for (let j = 0; j < W; j++) {
    let sx = 0,
      n = 0;
    for (let i = 0; i < W; i++)
      if (a[j * W + i] > 0.6) {
        sx += i;
        n++;
      }
    if (n) {
      wx = (sx / n / W - 0.5) * 0.3;
      wy = (1 - j / W) * 0.36;
      break;
    }
  }
  const pa = f.attributes.position.array,
    pb = b.attributes.position.array,
    pos = new Float32Array(pa.length + pb.length);
  pos.set(pa);
  pos.set(pb, pa.length);
  const n = pa.length / 3,
    idx = Array.from(f.index.array);
  Array.from(b.index.array).forEach((i) => idx.push(i + n));

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return (GLY[ch] = { g, wx, wy });
}

function strawberry(g, s = 1) {
  const texs = getStrawberryTextures();
  const mat = texs
    ? new THREE.MeshStandardMaterial({
        map: texs.map,
        bumpMap: texs.bump,
        bumpScale: 15.0,
        roughness: 0.3,
      })
    : MM("#d9253a", { bumpMap: pitsTex(), bumpScale: 25.0, roughness: 0.3 });
  const b = new THREE.Mesh(getBerryG(), mat);
  b.scale.setScalar(s);
  b.position.y = -0.02;
  g.add(b);
  for (let j = 0; j < 5; j++) {
    const a = (j / 5) * 6.283,
      l = sph(
        g,
        0.05 * s,
        "#3f9a4c",
        Math.cos(a) * 0.08 * s,
        0.3 * s,
        Math.sin(a) * 0.08 * s,
        1.8,
        0.3,
        0.8,
        { roughness: 0.5 }
      );
    l.rotation.y = -a;
    l.rotation.z = 0.25;
  }
  tube(g, 0.008 * s, 0.008 * s, 0.07 * s, "#3f9a4c", 0, 0.34 * s, 0);
}

const blueb = (g) => {
  sph(g, 0.09, "#4a5fb0", 0, 0.07, 0, 1, 0.92, 1, { roughness: 0.35 });
  for (let j = 0; j < 5; j++) {
    const a = (j / 5) * 6.283;
    sph(g, 0.012, "#27315f", Math.cos(a) * 0.022, 0.152, Math.sin(a) * 0.022);
  }
};

const rasp = (g, c = "#d81b60") => {
  const n = 18;
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 0.9,
      r = Math.sqrt(1 - y * y),
      a = i * 2.4;
    sph(
      g,
      0.036,
      c,
      Math.cos(a) * r * 0.075,
      0.02 + y * 0.075,
      Math.sin(a) * r * 0.075,
      1,
      1,
      1,
      { roughness: 0.4 }
    );
  }
};

const flowerB = (g, c, n, pr, daisy) => {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283,
      m = sph(
        g,
        pr,
        c,
        Math.cos(a) * pr * 1.25,
        0.035,
        Math.sin(a) * pr * 1.25,
        daisy ? 1.9 : 1,
        0.45,
        daisy ? 0.55 : 1
      );
    m.rotation.y = -a;
  }
  sph(g, pr * 0.55, "#f7c948", 0, 0.055, 0, 1, 0.7, 1);
};

const starS = (g, c, s, n = 5, inn = 0.45) => {
  const sh = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * 6.283 + 1.5708,
      r = i % 2 ? s * inn : s;
    sh[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r);
  }
  sh.closePath();
  const m = slab(g, sh, s * 0.4, c);
  m.position.y = s * 1.05;
  m.rotation.x = -0.12;
};

const heartS = (g, c, s) => {
  const m = slab(g, heartShape(s), s * 0.4, c);
  m.position.y = s * 0.92;
  m.rotation.x = -0.12;
};

const TOP = {
  straw: (g) => strawberry(g, 1),
  berry: (g, k) => [blueb, rasp, (q) => rasp(q, "#3b1f4f")][k % 3](g),
  flower: (g) => flowerB(g, "#ffd1dc", 5, 0.07),
};

const MODELS = {
  "\u2764": (g) => heartS(g, "#e8344f", 0.2),
  "💗": (g) => heartS(g, "#f48fb1", 0.2),
  "⭐": (g) => starS(g, "#ffc83d", 0.2),
  "😊": (g) => {
    sph(g, 0.15, "#ffd23f", 0, 0.16, 0, 1, 1, 0.42, { roughness: 0.3 });
    sph(g, 0.02, "#3a2a1a", -0.05, 0.2, 0.06);
    sph(g, 0.02, "#3a2a1a", 0.05, 0.2, 0.06);
    const m = ring(g, 0.07, 0.011, "#3a2a1a", 0, 0.15, 0.06, Math.PI);
    m.rotation.z = Math.PI;
  },
  "🌈": (g) => {
    ["#ff5a5f", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7"].forEach((c, i) =>
      ring(g, 0.24 - i * 0.032, 0.018, c, 0, 0.02, 0, Math.PI, {
        roughness: 0.3,
      })
    );
    sph(g, 0.05, "#fff", -0.24, 0.04, 0, 1.3, 0.8, 0.8);
    sph(g, 0.05, "#fff", 0.24, 0.04, 0, 1.3, 0.8, 0.8);
  },
  "🌸": (g) => flowerB(g, "#ffc2d4", 5, 0.07),
  "🌼": (g) => flowerB(g, "#ffffff", 10, 0.04, true),
  "🌷": (g) => {
    [
      [-0.04, 0],
      [0.04, 0],
      [0, 0.035],
    ].forEach(([x, z]) =>
      sph(g, 0.07, "#f0507a", x, 0.22, z, 0.8, 1.3, 0.8, { roughness: 0.3 })
    );
    tube(g, 0.012, 0.012, 0.2, "#3f9a4c", 0, 0.1, 0);
    const l = sph(g, 0.06, "#3f9a4c", 0.06, 0.08, 0, 2, 0.25, 0.8);
    l.rotation.z = 0.6;
  },
  "🌹": (g) => {
    for (let l = 0; l < 3; l++) {
      const n = 4 + l * 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + l,
          m = sph(
            g,
            0.05 + l * 0.01,
            "#c2185b",
            Math.cos(a) * (0.015 + l * 0.035),
            0.12 - l * 0.025,
            Math.sin(a) * (0.015 + l * 0.035),
            1,
            0.6,
            1,
            { roughness: 0.3 }
          );
        m.rotation.y = -a;
      }
    }
    sph(g, 0.03, "#e8346f", 0, 0.14, 0);
  },
  "🐰": (g) => {
    const c = "#f6e3cf";
    sph(g, 0.15, c, 0, 0.15, 0, 1, 0.95, 0.9);
    sph(g, 0.12, c, 0, 0.36, 0.02);
    [-1, 1].forEach((q) => {
      const e = sph(g, 0.04, c, q * 0.065, 0.58, 0, 1, 4.2, 0.7);
      e.rotation.z = -q * 0.15;
      const i = sph(g, 0.025, "#f6a5b8", q * 0.065, 0.58, 0.02, 1, 3.6, 0.4);
      i.rotation.z = -q * 0.15;
      sph(g, 0.016, "#3a2a2a", q * 0.045, 0.375, 0.11);
      sph(g, 0.03, "#f8a5b5", q * 0.085, 0.335, 0.095, 1, 0.7, 0.5);
      sph(g, 0.04, c, q * 0.09, 0.04, 0.13, 1, 0.8, 1.1);
    });
    sph(g, 0.022, "#f48fa5", 0, 0.345, 0.125, 1.1, 0.8, 0.8);
    sph(g, 0.05, "#fffaf5", 0, 0.1, -0.15);
  },
  "🐻": (g) => {
    const c = "#c8956a";
    sph(g, 0.14, c, 0, 0.13, 0, 1, 0.95, 0.9);
    sph(g, 0.12, c, 0, 0.33, 0.01);
    [-1, 1].forEach((q) => {
      sph(g, 0.05, c, q * 0.1, 0.43, 0);
      sph(g, 0.03, "#e8c9a3", q * 0.1, 0.43, 0.025);
      sph(g, 0.016, "#2a1a12", q * 0.045, 0.35, 0.11);
      sph(g, 0.045, c, q * 0.09, 0.05, 0.12, 1, 0.9, 1.1);
    });
    sph(g, 0.055, "#e8c9a3", 0, 0.3, 0.1, 1, 0.8, 0.9);
    sph(g, 0.02, "#2a1a12", 0, 0.32, 0.15);
  },
  "🦄": (g) => {
    sph(g, 0.13, "#ffffff", 0, 0.2, 0);
    sph(g, 0.07, "#ffffff", 0, 0.16, 0.1, 1, 0.8, 1);
    const h = cone(g, 0.035, 0.22, "#f5c542", 0, 0.4, 0.02, {
      roughness: 0.25,
    });
    h.rotation.x = 0.2;
    [-1, 1].forEach((q) => {
      cone(g, 0.03, 0.07, "#fff", q * 0.08, 0.33, 0);
      sph(g, 0.016, "#3a2a2a", q * 0.05, 0.22, 0.115);
    });
    for (let i = 0; i < 4; i++)
      sph(
        g,
        0.06 - i * 0.005,
        i % 2 ? "#f48fb1" : "#b39ddb",
        0,
        0.32 - i * 0.07,
        -0.1 - i * 0.01
      );
  },
  "🎀": (g) => {
    const c = "#f06292";
    [-1, 1].forEach((q) => {
      const m = sph(g, 0.1, c, q * 0.11, 0.14, 0, 1.5, 1, 0.45, {
        roughness: 0.3,
      });
      m.rotation.z = q * 0.3;
      const t = cone(g, 0.04, 0.14, c, q * 0.05, 0.04, 0);
      t.rotation.z = q * 0.4;
    });
    sph(g, 0.05, "#ec407a", 0, 0.14, 0.01, 1, 1, 0.9, { roughness: 0.25 });
  },
  "👑": (g) => {
    tube(g, 0.13, 0.13, 0.08, "#f5b301", 0, 0.06, 0, { roughness: 0.2 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.283;
      cone(
        g,
        0.03,
        0.11,
        "#f5b301",
        Math.cos(a) * 0.115,
        0.15,
        Math.sin(a) * 0.115,
        { roughness: 0.2 }
      );
      sph(
        g,
        0.018,
        i % 2 ? "#e53935" : "#3949ab",
        Math.cos(a) * 0.13,
        0.07,
        Math.sin(a) * 0.13,
        1,
        1,
        1,
        { roughness: 0.15 }
      );
    }
  },
  "🍓": (g) => strawberry(g, 1.2),
  "🍒": (g) => {
    [
      [-0.07, 0.07, 0],
      [0.08, 0.06, 0.03],
    ].forEach(([x, y, z]) => {
      sph(g, 0.07, "#c2123a", x, y, z, 1, 0.95, 1, { roughness: 0.2 });
      const s = tube(
        g,
        0.005,
        0.005,
        0.28,
        "#4d7c3a",
        x * 0.5,
        y + 0.12,
        z * 0.5
      );
      s.rotation.z = x * 3.5;
    });
    const l = sph(g, 0.045, "#3f9a4c", 0, 0.27, 0, 1.8, 0.25, 0.9);
    l.rotation.z = 0.4;
  },
  "🍑": (g) => {
    sph(g, 0.12, "#ffad8f", 0, 0.12, 0, 1, 0.95, 1, { roughness: 0.5 });
    sph(g, 0.07, "#ffc7a6", 0.04, 0.15, 0.07, 1, 1, 0.8, { roughness: 0.5 });
    const l = sph(g, 0.05, "#3f9a4c", 0, 0.24, 0, 1.8, 0.25, 0.9);
    l.rotation.z = 0.3;
  },
  "🫐": (g) => {
    [
      [-0.06, 0],
      [0.06, 0],
      [0, 0.09],
    ].forEach(([x, z]) => {
      const q = new THREE.Group();
      q.position.set(x, 0, z);
      blueb(q);
      g.add(q);
    });
  },
  "🍋": (g) => {
    sph(g, 0.1, "#ffe14d", 0, 0.1, 0, 1.4, 1, 1, { roughness: 0.45 });
    sph(g, 0.025, "#ffe14d", 0.14, 0.1, 0);
    sph(g, 0.025, "#ffe14d", -0.14, 0.1, 0);
    const l = sph(g, 0.05, "#3f9a4c", 0, 0.2, 0, 1.8, 0.25, 0.9);
    l.rotation.z = 0.3;
  },
  "🍫": (g) => {
    const w = 0.075;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++) {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(w, 0.045, w),
          MM("#5b3326", { roughness: 0.3 })
        );
        b.position.set(
          (i - 1) * (w + 0.012),
          0.035,
          (j - 0.5) * (w + 0.012)
        );
        g.add(b);
      }
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.02, 0.2),
      MM("#4a2a1d")
    );
    b.position.y = 0.01;
    g.add(b);
    g.rotation.y = 0.4;
  },
  "🍪": (g) => {
    tube(g, 0.12, 0.12, 0.045, "#d9a066", 0, 0.025, 0, { roughness: 0.7 });
    [
      [0.05, 0.03],
      [-0.06, 0.04],
      [0.02, -0.07],
      [-0.05, -0.04],
      [0.08, -0.03],
      [-0.01, 0],
      [0, 0.08],
    ].forEach(([x, z]) => sph(g, 0.02, "#3b2417", x, 0.05, z, 1, 0.6, 1));
  },
  "🍩": (g) => {
    const a = ring(
      g,
      0.1,
      0.05,
      "#e8b675",
      0,
      0.06,
      0,
      6.283,
      { roughness: 0.6 }
    );
    a.rotation.x = Math.PI / 2;
    const b = ring(
      g,
      0.1,
      0.054,
      "#f48fb1",
      0,
      0.082,
      0,
      6.283,
      { roughness: 0.25 }
    );
    b.rotation.x = Math.PI / 2;
    b.scale.z = 0.55;
    ["#fff", "#ffd166", "#06d6a0", "#118ab2"].forEach((c, i) => {
      const t = sph(
        g,
        0.01,
        c,
        Math.cos(i * 1.6) * 0.1,
        0.11,
        Math.sin(i * 1.6) * 0.1,
        3,
        0.8,
        0.8
      );
      t.rotation.y = i;
    });
  },
  "🍬": (g) => {
    sph(g, 0.075, "#ef476f", 0, 0.08, 0, 1.3, 1, 1, { roughness: 0.2 });
    [1, -1].forEach((q) => {
      const c = cone(g, 0.065, 0.1, "#ff8fa3", q * 0.145, 0.08, 0);
      c.rotation.z = q * (Math.PI / 2);
    });
  },
  "🍭": (g) => {
    tube(g, 0.01, 0.01, 0.3, "#ffffff", 0, 0.15, 0);
    const d = tube(g, 0.1, 0.1, 0.03, "#ff6f91", 0, 0.34, 0, {
      roughness: 0.2,
    });
    d.rotation.x = Math.PI / 2;
    ring(g, 0.07, 0.012, "#fff", 0, 0.34, 0.02);
    ring(g, 0.04, 0.012, "#fff", 0, 0.34, 0.02);
  },
  "🎈": (g) => {
    sph(g, 0.12, "#ff5d73", 0, 0.4, 0, 1, 1.18, 1, { roughness: 0.15 });
    const k = cone(g, 0.02, 0.04, "#ff5d73", 0, 0.25, 0);
    k.rotation.x = Math.PI;
    tube(g, 0.003, 0.003, 0.22, "#dddddd", 0, 0.12, 0);
  },
  "✨": (g) => starS(g, "#ffd23f", 0.2, 4, 0.28),
  "🎉": (g) => {
    const c = cone(g, 0.08, 0.22, "#ffb703", 0, 0.11, 0, {
      roughness: 0.4,
    });
    c.rotation.z = 0.3;
    ["#ff5a5f", "#4dabf7", "#69db7c", "#ffe066", "#d1a3ff"].forEach((q) => {
      for (let j = 0; j < 3; j++)
        sph(
          g,
          0.013,
          q,
          (rnd() - 0.5) * 0.3,
          0.28 + rnd() * 0.2,
          (rnd() - 0.5) * 0.3
        );
    });
  },
  "🧁": (g) => {
    tube(g, 0.085, 0.06, 0.1, "#f6c1d1", 0, 0.05, 0);
    const m = new THREE.Mesh(swirlGeo(0.1, 0.13), MM("#fff6ee"));
    m.position.y = 0.1;
    g.add(m);
    sph(g, 0.03, "#d81b60", 0, 0.25, 0);
  },
};

function textMask(it, ol) {
  if (typeof document === "undefined") {
    return { W: 512, H: 256, a: new Float32Array(512 * 256) };
  }
  const W = 512,
    H2 = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H2;
  const x = c.getContext("2d");
  const L = (it.text || "").split("\n").slice(0, 3);
  const f0 = (it.px || 32) * 1.4;

  x.textBaseline = "middle";
  x.textAlign = it.align || "center";
  x.fillStyle = "#fff";
  x.strokeStyle = "#fff";
  x.lineJoin = "round";
  const ax = it.align === "left" ? 35 : it.align === "right" ? 477 : 256;

  L.forEach((t, i) => {
    let fs = f0;
    do {
      x.font = `600 ${fs}px "${it.font || "Baloo 2"}", cursive`;
      fs -= 2;
    } while (x.measureText(t).width > 440 && fs > 10);
    const y = H2 / 2 + (i - (L.length - 1) / 2) * f0 * 1.1;
    if (ol) {
      x.lineWidth = 10;
      x.strokeText(t, ax, y);
    }
    x.fillText(t, ax, y);
  });

  const d = x.getImageData(0, 0, W, H2).data;
  const a = new Float32Array(W * H2);
  for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255;

  const t = new Float32Array(a.length);
  const r = 2;
  for (let p = 0; p < 2; p++) {
    for (let y = 0; y < H2; y++) {
      let s = 0;
      for (let k = -r; k <= r; k++)
        s += a[y * W + Math.max(0, Math.min(W - 1, k))];
      for (let k = 0; k < W; k++) {
        t[y * W + k] = s / (2 * r + 1);
        s +=
          a[y * W + Math.min(W - 1, k + r + 1)] -
          a[y * W + Math.max(0, k - r)];
      }
    }
    for (let k = 0; k < W; k++) {
      let s = 0;
      for (let y = -r; y <= r; y++)
        s += t[Math.max(0, Math.min(H2 - 1, y)) * W + k];
      for (let y = 0; y < H2; y++) {
        a[y * W + k] = s / (2 * r + 1);
        s +=
          t[Math.min(H2 - 1, y + r + 1) * W + k] -
          t[Math.max(0, y - r) * W + k];
      }
    }
  }
  return { W, H: H2, a };
}

function reliefGeo(m, map, depth) {
  const { W, H, a } = m;
  const gx = (W / 2) | 0;
  const gy = (H / 2) | 0;
  const pos = [];
  const hs = [];
  const idx = [];

  for (let j = 0; j <= gy; j++) {
    for (let i = 0; i <= gx; i++) {
      const h = a[Math.min(H - 1, j * 2) * W + Math.min(W - 1, i * 2)];
      hs.push(h);
      const p = map(i / gx, 1 - j / gy, Math.pow(h, 0.8) * depth);
      pos.push(p[0], p[1], p[2]);
    }
  }
  for (let j = 0; j < gy; j++) {
    for (let i = 0; i < gx; i++) {
      const A = j * (gx + 1) + i;
      const B = A + 1;
      const C = A + gx + 1;
      const D = C + 1;
      if (Math.max(hs[A], hs[B], hs[C], hs[D]) > 0.05) {
        idx.push(A, C, B, B, C, D);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function relief(m, map, mat, depth) {
  return new THREE.Mesh(reliefGeo(m, map, depth), mat);
}

const PRESET = {
  hati: () =>
    Array.from({ length: 120 }, (_, i) => {
      const t = (i / 120) * 6.2832;
      return [
        16 * Math.sin(t) ** 3,
        -(
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t)
        ),
      ];
    }),
  bintang: () =>
    Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * 6.2832,
        r = i % 2 ? 0.48 : 1;
      return [r * Math.sin(a), -r * Math.cos(a)];
    }),
  bunga: () =>
    Array.from({ length: 120 }, (_, i) => {
      const t = (i / 120) * 6.2832,
        r = 0.72 + 0.28 * Math.cos(5 * t);
      return [r * Math.sin(t), -r * Math.cos(t)];
    }),
  awan: () =>
    Array.from({ length: 120 }, (_, i) => {
      const t = (i / 120) * 6.2832,
        r = 0.78 + 0.22 * Math.abs(Math.sin(3 * t));
      return [r * Math.sin(t), -r * Math.cos(t)];
    }),
  kucing: () => CAT.map((p) => [p[0], p[1]]),
};

const PRENM = {
  hati: "♥ Hati",
  bintang: "★ Bintang",
  bunga: "✿ Bunga",
  awan: "☁ Awan",
  kucing: "🐱 Kucing",
};

function fromPts(raw) {
  const n = 84,
    P = raw.slice();
  P.push(P[0]);
  const L = [0];
  for (let i = 1; i < P.length; i++) {
    L.push(
      L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])
    );
  }
  const tot = L[L.length - 1] || 1;
  let out = [],
    j = 0;
  for (let i = 0; i < n; i++) {
    const d = (i / n) * tot;
    while (j < L.length - 2 && L[j + 1] < d) j++;
    const t = (d - L[j]) / (L[j + 1] - L[j] || 1);
    out.push([
      P[j][0] + (P[j + 1][0] - P[j][0]) * t,
      P[j][1] + (P[j + 1][1] - P[j][1]) * t,
    ]);
  }
  for (let p = 0; p < 2; p++) {
    out = out.map((q, i, A) => {
      const a = A[(i + n - 1) % n],
        b = A[(i + 1) % n];
      return [(a[0] + 2 * q[0] + b[0]) / 4, (a[1] + 2 * q[1] + b[1]) / 4];
    });
  }
  const xs = out.map((q) => q[0]),
    ys = out.map((q) => q[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const k =
    Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) /
      2 || 1;
  return out.map((q) => [
    +((q[0] - cx) / k).toFixed(3),
    +((q[1] - cy) / k).toFixed(3),
  ]);
}

function cekAdaWebGL() {
  if (typeof window === "undefined") return false;
  try {
    const cv = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (cv.getContext("webgl") || cv.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export default function PesanPage() {
  const router = useRouter();

  const [S, setS] = useState(getDefState);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [mode, setMode] = useState("custom");
  const [tplI, setTplI] = useState(null);
  const [menuCat, setMenuCat] = useState("semua");
  const [cartCount, setCartCount] = useState(1);
  const [openC, setOpenC] = useState(-1);
  const [tool, setTool] = useState("draw");
  const [fav, setFav] = useState(false);
  const [autoSpin, setAutoSpin] = useState(true);
  const [view2D, setView2D] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  const [user, setUser] = useState(null);
  const [profil, setProfil] = useState(null);
  const [pengaturan, setPengaturan] = useState(null);
  const [daftarGrup, setDaftarGrup] = useState([]);
  const [daftarItem, setDaftarItem] = useState([]);
  const [daftarZona, setDaftarZona] = useState([]);
  const [ketersediaan, setKetersediaan] = useState(null);

  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const [sedangKirim, setSedangKirim] = useState(false);

  const [sliced, setSliced] = useState(false);
  const [cT, setCT] = useState("num");
  const [cC, setCC] = useState("#ff8fb1");
  const [showShapeModal, setShowShapeModal] = useState(false);
  const [isStudioView, setIsStudioView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [orderCode] = useState(() => {
    return (
      "CC-" +
      new Date().toISOString().slice(2, 10).replace(/-/g, "") +
      "-" +
      Math.floor(1000 + Math.random() * 9000)
    );
  });

  const customStateRef = useRef(getDefState());

  useEffect(() => {
    if (mode === "custom") {
      customStateRef.current = S;
    }
  }, [S, mode]);

  const canvasRef = useRef(null);
  const vboxRef = useRef(null);
  const vboxContainerRef = useRef(null);
  const ovPrevRef = useRef(null);
  const ovBkRef = useRef(null);
  const cstkRef = useRef([]);
  const dc2Ref = useRef(null);
  const st2Ref = useRef([]);
  const modalDrawingRef = useRef(false);
  const drawCanvasRef = useRef(null);
  const drawingRef = useRef(false);
  const drawStrokeRef = useRef([]);
  const uploadedImageFileRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVecRef = useRef(new THREE.Vector2());

  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const stateRef = useRef(S);
  useEffect(() => {
    stateRef.current = S;
  }, [S]);

  const autoSpinRef = useRef(autoSpin);
  useEffect(() => {
    autoSpinRef.current = autoSpin;
  }, [autoSpin]);

  const threeStateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    root: null,
    cake: null,
    flames: [],
    dragItem: null,
    flame: null,
    th: 0.5,
    ph: 0.42,
    dist: 5.8,
    dragging: false,
    pts: new Map(),
    pd: 0,
    reqId: null,
    lastSize: null,
  });

  const histRef = useRef([]);
  const hiRef = useRef(-1);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastShow(true);
    setTimeout(() => {
      setToastShow(false);
    }, 2500);
  }, []);

  const snap = useCallback(
    (stateToSnap) => {
      const st = stateToSnap || S;
      const j = JSON.stringify({ ...st, f: 0 });
      const hist = histRef.current;
      const hi = hiRef.current;
      if (hist[hi] === j) return;
      const nextHist = hist.slice(0, hi + 1);
      nextHist.push(j);
      if (nextHist.length > 60) nextHist.shift();
      histRef.current = nextHist;
      hiRef.current = nextHist.length - 1;
    },
    [S]
  );

  const handleUndo = useCallback(() => {
    if (hiRef.current > 0) {
      hiRef.current -= 1;
      const parsed = JSON.parse(histRef.current[hiRef.current]);
      setS((prev) => ({ ...parsed, f: prev.f }));
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (hiRef.current < histRef.current.length - 1) {
      hiRef.current += 1;
      const parsed = JSON.parse(histRef.current[hiRef.current]);
      setS((prev) => ({ ...parsed, f: prev.f }));
    }
  }, []);

  useEffect(() => {
    if (S.itemType === "cookies" && sliced) {
      setSliced(false);
    }
  }, [S.itemType, sliced]);

  useEffect(() => {
    setHasWebGL(cekAdaWebGL());

    async function muatData() {
      const supabase = getSupabaseBrowser();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (u) {
        setUser(u);
        const { data: p } = await supabase
          .from("profil")
          .select("*")
          .eq("id", u.id)
          .single();
        if (p) {
          setProfil(p);
          setS((prev) => ({
            ...prev,
            f: {
              ...prev.f,
              nm: prev.f.nm || p.nama || "",
              ph: prev.f.ph || p.no_wa || "",
              em: prev.f.em || u.email || "",
            },
          }));
        }
      }

      const { data: toko } = await supabase
        .from("pengaturan_toko")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (toko) setPengaturan(toko);

      const { data: grupList } = await supabase
        .from("grup_opsi")
        .select("*")
        .order("urutan", { ascending: true });
      if (grupList) setDaftarGrup(grupList);

      const { data: itemList } = await supabase
        .from("opsi_item")
        .select("*")
        .eq("aktif", true)
        .order("urutan", { ascending: true });
      if (itemList) setDaftarItem(itemList);

      const { data: zonaList } = await supabase
        .from("zona_ongkir")
        .select("*")
        .eq("aktif", true)
        .order("id", { ascending: true });
      if (zonaList) setDaftarZona(zonaList);

      try {
        const resAvail = await fetch("/api/ketersediaan");
        if (resAvail.ok) {
          const dAvail = await resAvail.json();
          setKetersediaan(dAvail);
        }
      } catch {}

      try {
        sessionStorage.removeItem("cravely_custom_draft");
        sessionStorage.removeItem("cravely_custom_maxstep");
      } catch {}
      setMaxStep(0);
    }
    muatData();
  }, []);

  useEffect(() => {
    snap(S);
  }, []);

  const [pendingLeaveHref, setPendingLeaveHref] = useState(null);
  const allowLeaveRef = useRef(false);

  useEffect(() => {
    try {
      sessionStorage.removeItem("cravely_custom_draft");
      sessionStorage.removeItem("cravely_custom_maxstep");
    } catch {}
  }, []);

  const isDirty =
    !sedangKirim &&
    (step > 0 ||
      (S.items && S.items.length > 0) ||
      (S.candles && S.candles.length > 0) ||
      S.shape !== "round" ||
      S.size !== "mini" ||
      S.flavor !== "vanilla" ||
      S.cpts !== null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty || allowLeaveRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const handleDocumentClick = (e) => {
      if (!isDirty || allowLeaveRef.current) return;
      const anchor = e.target?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (href === "/pesan" || href.startsWith("/pesan?")) return;
      if (anchor.target === "_blank") return;
      e.preventDefault();
      e.stopPropagation();
      setPendingLeaveHref(href);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty]);

  useEffect(() => {
    const active = getActiveSteps(S.itemType);
    if (!active.includes(step)) {
      const nextValid = active.find((s) => s >= step) ?? active[0] ?? 0;
      setStep(nextValid);
    }
  }, [S.itemType, step]);

  const selItem = (S.items || []).find((i) => i.id === S.sel);

  useEffect(() => {
    if (!hasWebGL) return;
    const cv = canvasRef.current;
    const box = vboxRef.current;
    if (!cv || !box) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: cv,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      setHasWebGL(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 150);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xf3c9d6, 0.72);
    scene.add(hemi);
    const dl = new THREE.DirectionalLight(0xffffff, 0.7);
    dl.position.set(3, 6, 5);
    dl.castShadow = true;
    dl.shadow.mapSize.width = 2048;
    dl.shadow.mapSize.height = 2048;
    dl.shadow.camera.near = 1;
    dl.shadow.camera.far = 60;
    dl.shadow.bias = -0.0004;
    dl.shadow.normalBias = 0.02;
    scene.add(dl);

    const dl2 = new THREE.DirectionalLight(0xffd6e0, 0.2);
    dl2.position.set(-4, 2, -3);
    scene.add(dl2);

    const root = new THREE.Group();
    const cake = new THREE.Group();
    scene.add(root);
    root.add(cake);

    const kitchen = buildKitchen();
    kitchen.visible = false;
    scene.add(kitchen);

    if (typeof window !== "undefined") {
      window.__cake = cake;
      window.__scene = scene;
      window.__kitchen = kitchen;
    }

    threeStateRef.current.renderer = renderer;
    threeStateRef.current.scene = scene;
    threeStateRef.current.camera = camera;
    threeStateRef.current.root = root;
    threeStateRef.current.cake = cake;
    threeStateRef.current.kitchen = kitchen;
    threeStateRef.current.hemi = hemi;
    threeStateRef.current.dl = dl;
    threeStateRef.current.dl2 = dl2;
    threeStateRef.current.isStudio = false;

    function handleResize() {
      if (!box || !renderer || !camera) return;
      const w = box.clientWidth || 300;
      const h = box.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    const ro = new ResizeObserver(handleResize);
    ro.observe(box);
    handleResize();

    function animate(t) {
      threeStateRef.current.reqId = requestAnimationFrame(animate);
      const ts = threeStateRef.current;
      if (autoSpinRef.current && !ts.dragging) {
        ts.th += 0.006;
      }
      root.rotation.y = ts.th;

      if (ts.isStudio) {
        if (kitchen) {
          kitchen.visible = true;
          const szData = VISUAL_SIZE[stateRef.current.size] || { d: 14 };
          const R = szData.d / 12;
          if (kitchen.userData && kitchen.userData.island) {
            const k = Math.max(1, (2.6 * R + 1.8) / 6.8);
            kitchen.userData.island.scale.set(k, 1, k);
          }
          charAnim(t, kitchen);
        }
        scene.background = null;
        root.position.set(0, 0, 0);
        root.scale.setScalar(1);

        if (camera.fov !== 24) {
          camera.fov = 24;
          camera.updateProjectionMatrix();
        }
        if (hemi.intensity !== 1.1) {
          hemi.intensity = 1.1;
          hemi.color.setHex(0xfffaee);
          hemi.groundColor.setHex(0xf2e4d5);
        }
        if (dl.castShadow) {
          dl.castShadow = false;
        }
        if (dl.intensity !== 1.05) {
          dl.intensity = 1.05;
          dl.color.setHex(0xfffaea);
          dl.position.set(7, 16, 10);
          const sc = dl.shadow.camera;
          sc.left = sc.bottom = -11;
          sc.right = sc.top = 11;
          sc.far = 60;
          sc.updateProjectionMatrix();
        }
        if (ts.dl2 && ts.dl2.intensity !== 0.65) {
          ts.dl2.intensity = 0.65;
          ts.dl2.color.setHex(0xfff3e6);
          ts.dl2.position.set(-8, 9, -5);
        }

        const szData = VISUAL_SIZE[stateRef.current.size] || { d: 14 };
        const R = szData.d / 12;
        const rDist = ts.dist || (21 + R * 3.5);
        const az = 0.785;
        const el = ts.ph || 0.58;
        const c = Math.cos(el);
        camera.position.set(
          rDist * Math.sin(az) * c,
          -0.2 + rDist * Math.sin(el),
          rDist * Math.cos(az) * c
        );
        camera.lookAt(0, -0.2, 0);
      } else {
        if (kitchen) kitchen.visible = false;
        scene.background = null;
        root.position.set(0, 0, 0);
        root.scale.setScalar(1);

        if (camera.fov !== 35) {
          camera.fov = 35;
          camera.updateProjectionMatrix();
        }
        if (hemi.intensity !== 0.75) {
          hemi.intensity = 0.75;
          hemi.color.setHex(0xffffff);
          hemi.groundColor.setHex(0xf3c9d6);
        }
        if (!dl.castShadow) {
          dl.castShadow = true;
        }
        if (dl.intensity !== 0.75) {
          dl.intensity = 0.75;
          dl.color.setHex(0xffffff);
          dl.position.set(3, 6, 5);
          const sc = dl.shadow.camera;
          sc.left = sc.bottom = -5;
          sc.right = sc.top = 5;
          sc.far = 20;
          sc.updateProjectionMatrix();
        }
        if (ts.dl2 && ts.dl2.intensity !== 0.25) {
          ts.dl2.intensity = 0.25;
          ts.dl2.color.setHex(0xffd6e0);
          ts.dl2.position.set(-4, 2, -3);
        }

        camera.position.set(
          0,
          0.45 + ts.dist * Math.sin(ts.ph),
          ts.dist * Math.cos(ts.ph)
        );
        camera.lookAt(0, 0.42, 0);
      }

      if (ts.flames && ts.flames.length) {
        ts.flames.forEach((f, i) => {
          f.scale.set(
            1 + Math.sin(t * 0.02 + i) * 0.12,
            1.6 + Math.sin(t * 0.031 + i * 2) * 0.2,
            1
          );
        });
      }
      renderer.render(scene, camera);
    }
    threeStateRef.current.reqId = requestAnimationFrame(animate);

    const ndc = (e) => {
      const r = cv.getBoundingClientRect();
      mouseVecRef.current.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1
      );
      raycasterRef.current.setFromCamera(mouseVecRef.current, camera);
    };

    const pickItem = (e) => {
      ndc(e);
      if (!cake) return null;
      const intersects = raycasterRef.current.intersectObjects(cake.children, true);
      for (const x of intersects) {
        let o = x.object;
        while (o && o.userData.itemId == null && o.userData.candleId == null) {
          o = o.parent;
        }
        if (o && o.userData.candleId != null) {
          return { kind: "candle", id: o.userData.candleId };
        }
        if (o && o.userData.itemId != null) {
          return { kind: "item", id: o.userData.itemId };
        }
      }
      return null;
    };

    const moveItem = (e) => {
      const ts = threeStateRef.current;
      if (!cake || (ts.dragItem == null && ts.dragCandle == null)) return;
      const currentS = stateRef.current;
      const szData = VISUAL_SIZE[currentS.size] || { d: 14 };
      const R = (szData.d || 14) / 12;
      const planeY = ts.cakeTop ?? 1.1;

      ndc(e);
      cake.updateMatrixWorld(true);
      const inv = new THREE.Matrix4().copy(cake.matrixWorld).invert();
      const ray = raycasterRef.current.ray.clone().applyMatrix4(inv);
      const p = new THREE.Vector3();
      if (!ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY), p)) return;

      let x = p.x / R;
      let z = p.z / R;
      const m = Math.hypot(x, z);
      const maxR = ts.dragCandle != null ? 0.88 : 0.95;
      if (m > maxR) {
        x *= maxR / m;
        z *= maxR / m;
      }

      if (ts.dragCandle != null) {
        const cand = (currentS.candles || []).find((c) => c.id === ts.dragCandle);
        if (!cand) return;
        cand.x = +x.toFixed(2);
        cand.z = +z.toFixed(2);
        cake.children.forEach((c) => {
          if (c.userData.candleId === cand.id) c.position.set(cand.x * R, planeY, cand.z * R);
        });
        return;
      }

      const it = (currentS.items || []).find((i) => i.id === ts.dragItem);
      if (!it) return;
      it.x = +x.toFixed(2);
      it.z = +z.toFixed(2);
      cake.children.forEach((c) => {
        if (c.userData.itemId === it.id) c.position.set(it.x * R, planeY, it.z * R);
        if (c.userData.ringFor === it.id) c.position.set(it.x * R, planeY + 0.012, it.z * R);
      });
    };

    function onPointerDown(e) {
      cv.setPointerCapture(e.pointerId);
      const ts = threeStateRef.current;
      if (!ts.pts.size && (stepRef.current === 4 || stepRef.current === 5)) {
        const hit = pickItem(e);
        if (hit?.kind === "candle") {
          ts.dragCandle = hit.id;
        } else if (hit?.kind === "item" && stepRef.current === 5) {
          ts.dragItem = hit.id;
          setS((prev) => ({ ...prev, sel: hit.id }));
        }
      }
      ts.pts.set(e.pointerId, [e.clientX, e.clientY]);
      ts.dragging = true;
      if (ts.pts.size === 2) {
        const [a, b] = [...ts.pts.values()];
        ts.pd = Math.hypot(a[0] - b[0], a[1] - b[1]);
      }
    }

    function onPointerMove(e) {
      const ts = threeStateRef.current;
      if (!ts.pts.has(e.pointerId)) return;
      if (ts.dragItem != null || ts.dragCandle != null) {
        moveItem(e);
        return;
      }
      const o = ts.pts.get(e.pointerId);
      if (ts.pts.size === 1) {
        ts.th += (e.clientX - o[0]) * 0.01;
        ts.ph = Math.max(0.05, Math.min(1.5, ts.ph + (e.clientY - o[1]) * 0.006));
      }
      ts.pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (ts.pts.size === 2) {
        const [a, b] = [...ts.pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        ts.dist = Math.max(
          ts.isStudio ? 4.5 : 3.4,
          Math.min(ts.isStudio ? 18 : 11, (ts.dist * ts.pd) / (d || 1))
        );
        ts.pd = d;
      }
    }

    function onPointerUp(e) {
      const ts = threeStateRef.current;
      ts.pts.delete(e.pointerId);
      if (!ts.pts.size) {
        ts.dragging = false;
        if (ts.dragItem != null || ts.dragCandle != null) {
          ts.dragItem = null;
          ts.dragCandle = null;
          setS((prev) => ({
            ...prev,
            items: [...(stateRef.current.items || [])],
            candles: [...(stateRef.current.candles || [])],
          }));
        }
      }
    }

    function onWheel(e) {
      e.preventDefault();
      const ts = threeStateRef.current;
      ts.dist = Math.max(
        ts.isStudio ? 4.5 : 3.4,
        Math.min(ts.isStudio ? 18 : 11, ts.dist * (1 + e.deltaY * 0.001))
      );
    }

    cv.addEventListener("pointerdown", onPointerDown);
    cv.addEventListener("pointermove", onPointerMove);
    cv.addEventListener("pointerup", onPointerUp);
    cv.addEventListener("pointercancel", onPointerUp);
    cv.addEventListener("wheel", onWheel, { passive: false });

    function handleFsChange() {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      threeStateRef.current.isStudio = isFs;
      setIsStudioView(isFs);
      const szData = VISUAL_SIZE[stateRef.current.size] || { d: 14 };
      const R = szData.d / 12;
      if (isFs) {
        threeStateRef.current.th = 0;
        threeStateRef.current.ph = 0.58;
        threeStateRef.current.dist = 21 + R * 3.5;
      } else {
        threeStateRef.current.dist = R * 2.6 + 3.6;
        threeStateRef.current.ph = 0.38;
      }
      handleResize();
    }
    document.addEventListener("fullscreenchange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      ro.disconnect();
      cancelAnimationFrame(threeStateRef.current.reqId);
      cv.removeEventListener("pointerdown", onPointerDown);
      cv.removeEventListener("pointermove", onPointerMove);
      cv.removeEventListener("pointerup", onPointerUp);
      cv.removeEventListener("pointercancel", onPointerUp);
      cv.removeEventListener("wheel", onWheel);
      renderer.dispose();
    };
  }, [hasWebGL]);

  const buildCake = useCallback(() => {
    if (!hasWebGL) return;
    const ts = threeStateRef.current;
    const cake = ts.cake;
    if (!cake) return;

    while (cake.children.length) {
      const c = cake.children[0];
      cake.remove(c);
      c.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) {
            o.material.forEach((m) => {
              if (m.map && !m.isSprite) m.map.dispose();
              m.dispose();
            });
          } else {
            if (o.material.map && !o.isSprite) o.material.map.dispose();
            o.material.dispose();
          }
        }
      });
    }

    ts.flames = [];
    resetSeed();
    for (const k in _mc) delete _mc[k];

    const szData = VISUAL_SIZE[S.size] || { d: 14, s: "3–5 orang" };
    const R = (szData.d || 14) / 12;
    const H = 1.04;
    const ice = S.icing || "#f6b4c2";

    const add = (o, c = 1) => {
      o.traverse((m) => {
        if (m.isMesh || m.isInstancedMesh) m.castShadow = m.receiveShadow = !!c;
      });
      cake.add(o);
      return o;
    };

    if (ts.lastSize !== S.size) {
      ts.dist = ts.isStudio ? 21 + R * 3.5 : R * 2.6 + 3.6;
      ts.lastSize = S.size;
    }
    if (ts.kitchen && ts.kitchen.userData && ts.kitchen.userData.island) {
      const k = Math.max(1, (2.6 * R + 1.8) / 6.8);
      ts.kitchen.userData.island.scale.set(k, 1, k);
    }

    let lp = loopOf(R, S.shape, S.cpts);
    if (sliced) lp = sliceLoop(lp);
    const top = H + 0.06;

    const sc = S.size === "large" ? 1.25 : S.size === "medium" ? 1.12 : S.size === "mini" ? 0.88 : 1.0;
    let standRadius = R * 1.3 + 0.5;
    if (S.itemType === "cupcake") standRadius = 0.85;
    else if (S.itemType === "tart") standRadius = 1.35;
    else if (S.itemType === "cookies") standRadius = 0.85;
    else if (S.itemType === "donut") standRadius = 0.85;
    add(makeItemPlatter(S.itemType, standRadius, M, S));

    if (!ts.isStudio) {
      const gs = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 16),
        new THREE.ShadowMaterial({ opacity: 0.22 })
      );
      gs.rotation.x = -Math.PI / 2;
      gs.position.y = -0.699;
      gs.receiveShadow = true;
      cake.add(gs);
    }

    if (S.itemType === "cupcake") {
      build3DCupcake(add, M, MB, S, sliced);
      return;
    }
    if (S.itemType === "tart") {
      build3DTart(add, M, MB, S, sliced);
      return;
    }
    if (S.itemType === "cookies") {
      build3DCookies(add, M, MB, S);
      return;
    }
    if (S.itemType === "donut") {
      build3DDonat(add, M, MB, S, sliced);
      return;
    }

    const itemFlav = daftarItem.find(
      (it) => it.kode_visual === S.flavor || it.id === S.flavorId
    );
    const flavColor =
      itemFlav && itemFlav.warna
        ? itemFlav.warna
        : FLAV[S.flavor]
        ? FLAV[S.flavor][2]
        : "#fbefd5";

    const itemFill = daftarItem.find(
      (it) => it.kode_visual === S.fill || it.id === S.fillId
    );
    const fillColor =
      itemFill && itemFill.warna
        ? itemFill.warna
        : FILL[S.fill]
        ? FILL[S.fill][2]
        : "#fffaf0";

    // Sponge
    add(
      sweep(
        lp,
        () => [
          [-0.05, 0],
          [-0.012, 0.035],
          [0, 0.11],
          [0, H * 0.5],
          [0, H - 0.02],
        ],
        MB(flavColor, { roughness: 0.62, bumpScale: 15.0 })
      )
    );

    // Filling ribbon
    const fy = H * 0.47;
    add(
      sweep(
        lp,
        () => [
          [0, fy - 0.045],
          [0.03, fy - 0.018],
          [0.038, fy],
          [0.03, fy + 0.018],
          [0, fy + 0.045],
        ],
        MB(fillColor, { roughness: 0.45, bumpScale: 16.0 })
      )
    );

    // Drip
    const D = dripLen(lp, !!(S.deco && S.deco.drip));
    const mi = MB(ice, { roughness: 0.35, bumpScale: 6.0 });
    add(
      sweep(
        lp,
        (i) => {
          const d = D[i];
          return [
            [-0.02, H + 0.05],
            [0.015, H + 0.047],
            [0.034, H + 0.025],
            [0.04, H - 0.02],
            [0.04, H - d * 0.35],
            [0.04, H - d * 0.7],
            [0.036, H - d * 0.88],
            [0.025, H - d * 0.96],
            [0.005, H - d],
          ];
        },
        mi
      )
    );

    // Top face
    const cp = lp.P.map(
      (p, i) =>
        new THREE.Vector2(
          p[0] - lp.T[i][0] * 0.02,
          -(p[1] - lp.T[i][1] * 0.02)
        )
    );
    if (lp.closed === false) cp.push(new THREE.Vector2(0, 0));
    const cg = new THREE.ShapeGeometry(new THREE.Shape(cp));
    cg.rotateX(-Math.PI / 2);
    cg.translate(0, H + 0.05, 0);
    add(new THREE.Mesh(cg, mi));

    if (lp.closed === false) {
      add(cutFaces(lp, H, flavColor, fillColor, ice, D));
    }

    // Mutiara di dasar kue
    {
      const n = Math.round(lp.L / 0.15);
      const im = new THREE.InstancedMesh(
        new THREE.SphereGeometry(1, 10, 8),
        MB("#FFF8F0", { roughness: 0.4, bumpMap: null }),
        n
      );
      const d = new THREE.Object3D();
      for (let k = 0; k < n; k++) {
        const i = Math.floor((k * lp.N) / n);
        d.position.set(
          lp.P[i][0] + lp.T[i][0] * 0.035,
          0.075,
          lp.P[i][1] + lp.T[i][1] * 0.035
        );
        d.scale.setScalar(0.062);
        d.updateMatrix();
        im.setMatrixAt(k, d.matrix);
      }
      add(im);
    }

    const CUSH = getCush();
    const kinds = ["straw", "berry", "flower"].filter((k) => S.deco && S.deco[k]);
    const sideText = ["round", "square", "hex"].includes(S.shape);
    const topText =
      !sideText &&
      (S.items || []).some((q) => q.t === "text" && q.text && q.text.trim());
    const inCut = (x, z, m = 0) => {
      if (!sliced) return false;
      let q = Math.atan2(x, z) - TCUT;
      q = Math.atan2(Math.sin(q), Math.cos(q));
      return Math.abs(q) < WCUT / 2 + m;
    };
    const cream = MM("#FFFDF8", { roughness: 0.4 });
    const plant = (kind, x, z, k, sc) => {
      const g = new THREE.Group();
      g.position.set(x, top, z);
      g.rotation.y = k;
      g.scale.setScalar(sc);
      g.add(new THREE.Mesh(CUSH, cream));
      const m = new THREE.Group();
      m.position.y = 0.045;
      if (TOP[kind]) TOP[kind](m, k);
      g.add(m);
      add(g);
    };

    if (kinds.length) {
      const K = Math.max(8, 2 * Math.round(lp.L / 0.95));
      const sg = swirlGeo(0.13, 0.2);
      for (let k = 0; k < K; k++) {
        const i = Math.min(lp.N - 1, Math.floor((k * lp.N) / K));
        const x = lp.P[i][0] * 0.8;
        const z = lp.P[i][1] * 0.8;
        if (k % 2 === 0) {
          add(mesh(sg, cream, x, top, z));
        } else {
          plant(kinds[(k >> 1) % kinds.length], x, z, k, 1.1);
        }
      }
      if (!topText && !(S.candles || []).length && kinds.length > 1) {
        [0, 1, 2].forEach((j) => {
          const a = j * 2.09 + 0.5;
          const rr = R * 0.32;
          const x = Math.sin(a) * rr;
          const z = Math.cos(a) * rr;
          if (!inCut(x, z)) plant(kinds[j % kinds.length], x, z, j + 3, 1.15);
        });
      }
    }

    if (S.deco && S.deco.flower) {
      for (let k = 0; k < 8; k++) {
        const i = Math.min(lp.N - 1, Math.floor(((k + 0.5) * lp.N) / 8));
        const q = new THREE.Group();
        q.position.set(
          lp.P[i][0] + lp.T[i][0] * 0.05,
          0.3 + ((k * 5) % 4) * 0.12,
          lp.P[i][1] + lp.T[i][1] * 0.05
        );
        q.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(lp.T[i][0], 0, lp.T[i][1])
        );
        q.scale.setScalar(0.75);
        flowerB(q, "#ffd1dc", 5, 0.06);
        add(q);
      }
    }

    if (S.deco && S.deco.spr) {
      const n = 140,
        n2 = 100;
      const cs = ["#ff6f91", "#ffd166", "#06d6a0", "#118ab2", "#ffffff"];
      const im = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.013, 0.013, 0.09, 6),
        MM("#fff", { roughness: 0.4 }),
        n + n2
      );
      const d = new THREE.Object3D(),
        c = new THREE.Color();
      for (let k = 0; k < n + n2; k++) {
        const i = Math.floor(rnd() * lp.N);
        if (k < n) {
          const q = Math.sqrt(rnd()) * 0.88;
          d.position.set(lp.P[i][0] * q, top + 0.008, lp.P[i][1] * q);
          d.rotation.set(1.5708, 0, rnd() * 6.28);
        } else {
          d.position.set(
            lp.P[i][0] + lp.T[i][0] * 0.04,
            0.12 + rnd() * (H - 0.3),
            lp.P[i][1] + lp.T[i][1] * 0.04
          );
          d.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
        }
        d.updateMatrix();
        im.setMatrixAt(k, d.matrix);
        im.setColorAt(k, c.set(cs[k % 5]));
      }
      add(im, 0);
    }

    // Lilin (candles)
    ts.cakeTop = top;
    const cs = S.candles || [];
    if (cs.length) {
      const pts = [],
        slots = [];
      for (const dz of [0, -0.34, 0.34, -0.68, 0.68]) {
        const z = -R * 0.1 + dz;
        const w = 2 * Math.sqrt(Math.max(0, (R * 0.86) ** 2 - z * z));
        const cap = Math.max(0, Math.floor(w / 0.3));
        for (let k = 0; k < cap && slots.length < cs.length; k++) {
          slots.push([(k - (cap - 1) / 2) * Math.min(0.34, w / cap), z]);
        }
      }
      cs.forEach((cand, i) => {
        const hasCustomPos = cand.x != null && cand.z != null;
        const sl = slots[i];
        if (!hasCustomPos && !sl) return;
        const x = hasCustomPos ? cand.x * R : sl[0],
          z = hasCustomPos ? cand.z * R : sl[1];
        if (inCut(x, z)) return;
        const g = new THREE.Group(),
          sc = 0.9 + R * 0.1;
        g.position.set(x, top, z);
        g.scale.setScalar(sc);
        g.userData.candleId = cand.id;
        g.add(new THREE.Mesh(CUSH, cream));
        let wx = 0,
          wy = 0.44;
        if (cand.t === "stick") {
          const cd = new THREE.Mesh(
            new THREE.CylinderGeometry(0.038, 0.038, 0.46, 24),
            MB(cand.col, { map: candleTex(), bumpMap: null, roughness: 0.5 })
          );
          cd.position.y = 0.21;
          g.add(cd);
        } else {
          const gl = glyphGeo(cand.c);
          const m = new THREE.Mesh(
            gl.g,
            MM(cand.col, { roughness: 0.3, side: THREE.DoubleSide })
          );
          m.position.y = 0.12;
          g.add(m);
          tube(g, 0.007, 0.007, 0.2, "#f1e4cf", 0, 0.03, 0);
          wx = gl.wx;
          wy = 0.12 + gl.wy;
        }
        tube(g, 0.004, 0.004, 0.05, "#333333", wx, wy + 0.02, 0);
        const f = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 12, 10),
          new THREE.MeshBasicMaterial({ color: "#ffcf4a" })
        );
        f.position.set(wx, wy + 0.08, 0);
        f.scale.y = 1.6;
        g.add(f);
        ts.flames.push(f);
        const gw = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 12, 10),
          new THREE.MeshBasicMaterial({
            color: "#ffb347",
            transparent: true,
            opacity: 0.25,
            depthWrite: false,
          })
        );
        gw.position.copy(f.position);
        gw.scale.y = 1.5;
        g.add(gw);
        add(g);
        pts.push([x, z]);
      });
      if (pts.length) {
        const pl = new THREE.PointLight(
          0xffb36b,
          Math.min(0.9, 0.35 + 0.08 * pts.length),
          2.6
        );
        pl.position.set(0, top + 0.7, pts[0][1]);
        cake.add(pl);
      }
    }

    // Items
    (S.items || []).forEach((it) => {
      if (it.t === "text") {
        if (!it.text || !it.text.trim()) return;
        const side = sideText;
        const w = side ? Math.min(R * 1.7, 1.9) : R * 1.7;
        const yc = H * 0.42;
        const dp = it.fx === "shadow" ? 0.07 : 0.045;
        let map;
        if (side) {
          if (S.shape === "round") {
            const rr = R + 0.05,
              an = Math.min(w / rr, 3);
            map = (u, v, h) => {
              const t = (u - 0.5) * an,
                r = rr + h;
              return [r * Math.sin(t), yc + ((v - 0.5) * w) / 2, r * Math.cos(t)];
            };
          } else {
            const zf =
              Math.max(
                ...lp.P.filter((p) => Math.abs(p[0]) < 0.06).map((p) => p[1])
              ) + 0.05;
            map = (u, v, h) => [(u - 0.5) * w, yc + ((v - 0.5) * w) / 2, zf + h];
          }
        } else {
          map = (u, v, h) => [
            (u - 0.5) * w,
            top + 0.01 + h,
            R * 0.1 - ((v - 0.5) * w) / 2,
          ];
        }
        try {
          if (it.fx === "outline") {
            add(
              relief(
                textMask(it, true),
                map,
                MM("#ffffff", { roughness: 0.4, side: THREE.DoubleSide }),
                dp * 0.6
              )
            );
          }
          add(
            relief(
              textMask(it, false),
              map,
              MM(it.color || "#333333", {
                roughness: 0.3,
                side: THREE.DoubleSide,
              }),
              dp
            )
          );
        } catch (e) {
          console.error(e);
        }
        return;
      }

      if (inCut(it.x, it.z, 0.15) && Math.hypot(it.x, it.z) > 0.1) return;
      const g = new THREE.Group(),
        inner = new THREE.Group();
      const sc =
        (it.sz || 1) * (it.k === "Topper" ? 1.1 : 0.8) * (0.55 + R * 0.5);
      const stk = it.k === "Stiker" || it.e === "✨";
      const tilt = (((it.id * 37) % 11) / 11 - 0.5) * 0.22;

      if (it.t === "img") {
        const fm = new THREE.MeshStandardMaterial({
          color: "#fff",
          roughness: 0.5,
        });
        const sm = MM("#fff");
        const bx = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.04), [
          sm,
          sm,
          sm,
          sm,
          fm,
          sm,
        ]);
        bx.position.y = 0.27;
        inner.add(bx);
        if (it.src) {
          new THREE.TextureLoader().load(it.src, (t) => {
            fm.map = t;
            fm.needsUpdate = true;
            const m = Math.max(t.image.width || 1, t.image.height || 1);
            bx.scale.set((t.image.width || 1) / m, (t.image.height || 1) / m, 1);
          });
        }
      } else {
        const cleanKey = (it.e || "").replace(/\uFE0F/g, "");
        const modelFn =
          MODELS[cleanKey] || ((q) => sph(q, 0.12, "#f48fb1", 0, 0.12, 0));
        modelFn(inner);
      }

      if (stk) {
        inner.position.y = 0.17;
        tube(g, 0.008, 0.008, 0.4, "#f1e4cf", 0, -0.02, 0);
        sph(g, 0.035, "#FFFDF8", 0, 0.012, 0, 1, 0.45, 1);
      } else {
        g.add(new THREE.Mesh(swirlGeo(it.k === "Topper" ? 0.2 : 0.13, 0.09), cream));
        inner.position.y = it.k === "Cokelat" ? -0.01 : 0.05;
        if (it.k === "Cokelat") inner.rotation.x = -0.5;
      }
      inner.rotation.z += tilt;
      g.add(inner);
      g.scale.setScalar(sc);
      g.rotation.y = it.rot || 0;
      g.position.set(it.x * R, top, it.z * R);
      g.userData.itemId = it.id;
      add(g);

      if (step === 5 && it.id === S.sel) {
        const rg = new THREE.Mesh(
          new THREE.TorusGeometry(0.24 * sc + 0.03, 0.012, 8, 48),
          new THREE.MeshBasicMaterial({ color: "#D96B91" })
        );
        rg.rotation.x = Math.PI / 2;
        rg.position.set(it.x * R, top + 0.012, it.z * R);
        rg.userData.ringFor = it.id;
        add(rg, 0);
      }
    });
  }, [S, daftarItem, hasWebGL, sliced, step]);

  useEffect(() => {
    buildCake();
  }, [buildCake]);

  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      Promise.all(FONTS.map((f) => document.fonts.load(`600 40px "${f}"`)))
        .then(() => {
          buildCake();
        })
        .catch(() => {});
    }
  }, [buildCake]);

  const paintModalCanvas = useCallback(() => {
    const c = dc2Ref.current;
    const x = c && c.getContext && c.getContext("2d");
    if (!x) return;
    const w = c.width,
      h = c.height,
      k = Math.min(w, h) * 0.36;
    const d = c.width / (c.getBoundingClientRect().width || c.width);

    x.clearRect(0, 0, w, h);
    x.lineWidth = 1;
    x.strokeStyle = "#E8D6D0";
    const g = 48 * d;
    for (let i = g; i < w; i += g) {
      x.beginPath();
      x.moveTo(i, 0);
      x.lineTo(i, h);
      x.stroke();
    }
    for (let j = g; j < h; j += g) {
      x.beginPath();
      x.moveTo(0, j);
      x.lineTo(w, j);
      x.stroke();
    }

    x.setLineDash([10 * d, 8 * d]);
    x.strokeStyle = "#EFA7B8";
    x.beginPath();
    x.arc(w / 2, h / 2, k, 0, 6.283);
    x.stroke();
    x.setLineDash([]);

    const P = S.cpts || CAT;
    x.lineJoin = x.lineCap = "round";
    x.lineWidth = 5 * d;
    x.strokeStyle = "#D96B91";
    x.fillStyle = "#FCE8EC";
    x.beginPath();
    const q = P.map((p) => [w / 2 + p[0] * k, h / 2 + p[1] * k]);
    const n = q.length;
    const m = (i) => [
      (q[i % n][0] + q[(i + 1) % n][0]) / 2,
      (q[i % n][1] + q[(i + 1) % n][1]) / 2,
    ];
    x.moveTo(...m(n - 1));
    for (let i = 0; i < n; i++) {
      const a = m(i);
      x.quadraticCurveTo(q[i][0], q[i][1], a[0], a[1]);
    }
    x.closePath();
    x.fill();
    x.stroke();

    if (st2Ref.current.length > 1) {
      x.strokeStyle = "#713D50";
      x.lineWidth = 4 * d;
      x.beginPath();
      st2Ref.current.forEach((p, i) => x[i ? "lineTo" : "moveTo"](p[0], p[1]));
      x.stroke();
    }
  }, [S.cpts]);

  const sizeDC = useCallback(() => {
    const c = dc2Ref.current;
    if (!c || !c.getBoundingClientRect) return;
    const r = c.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    if (!r.width) return;
    c.width = Math.round(r.width * d);
    c.height = Math.round(r.height * d);
    paintModalCanvas();
  }, [paintModalCanvas]);

  const openShapeModal = useCallback(() => {
    ovBkRef.current = { shape: S.shape, cpts: S.cpts };
    cstkRef.current = [];
    st2Ref.current = [];
    setS((prev) => ({ ...prev, shape: "custom" }));
    setShowShapeModal(true);
    threeStateRef.current.ph = 0.62;
    setAutoSpin(true);
    setTimeout(() => {
      sizeDC();
    }, 50);
  }, [S.shape, S.cpts, sizeDC]);

  const closeShapeModal = useCallback(
    (ok) => {
      if (!ok && ovBkRef.current) {
        setS((prev) => ({
          ...prev,
          shape: ovBkRef.current.shape,
          cpts: ovBkRef.current.cpts,
        }));
      }
      setShowShapeModal(false);
      if (ok) snap();
    },
    [snap]
  );

  const getModalPt = (e) => {
    const c = dc2Ref.current;
    if (!c) return [0, 0];
    const r = c.getBoundingClientRect();
    return [
      ((e.clientX - r.left) * c.width) / r.width,
      ((e.clientY - r.top) * c.height) / r.height,
    ];
  };

  const onModalPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    modalDrawingRef.current = true;
    st2Ref.current = [getModalPt(e)];
  };

  const onModalPointerMove = (e) => {
    if (!modalDrawingRef.current) return;
    st2Ref.current.push(getModalPt(e));
    paintModalCanvas();
  };

  const onModalPointerUp = (e) => {
    if (!modalDrawingRef.current) return;
    modalDrawingRef.current = false;
    if (st2Ref.current.length > 12) {
      cstkRef.current.push(S.cpts);
      const newPts = fromPts(st2Ref.current);
      setS((prev) => ({ ...prev, shape: "custom", cpts: newPts }));
    }
    st2Ref.current = [];
    paintModalCanvas();
  };

  const handleSelectPreset = (key) => {
    if (!PRESET[key]) return;
    cstkRef.current.push(S.cpts);
    const newPts = fromPts(PRESET[key]());
    setS((prev) => ({ ...prev, shape: "custom", cpts: newPts }));
    setTimeout(paintModalCanvas, 10);
  };

  const handleModalUndo = () => {
    if (cstkRef.current.length) {
      const last = cstkRef.current.pop();
      setS((prev) => ({ ...prev, shape: "custom", cpts: last }));
      setTimeout(paintModalCanvas, 10);
    }
  };

  const handleModalClear = () => {
    cstkRef.current.push(S.cpts);
    setS((prev) => ({ ...prev, shape: "custom", cpts: null }));
    setTimeout(paintModalCanvas, 10);
  };

  useEffect(() => {
    if (showShapeModal) {
      if (ovPrevRef.current && vboxRef.current) {
        ovPrevRef.current.appendChild(vboxRef.current);
      }
      document.body.style.overflow = "hidden";
    } else {
      if (vboxContainerRef.current && vboxRef.current) {
        vboxContainerRef.current.prepend(vboxRef.current);
      }
      document.body.style.overflow = "";
    }
    requestAnimationFrame(() => {
      const box = vboxRef.current;
      const { renderer, camera } = threeStateRef.current;
      if (box && renderer && camera) {
        const w = box.clientWidth || 300;
        const h = box.clientHeight || 300;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    });
  }, [showShapeModal]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showShapeModal) {
        closeShapeModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShapeModal, closeShapeModal]);

  const handleAddCandle = useCallback(
    (val) => {
      if ((S.candles || []).length >= 12) {
        showToast("Maksimal 12 lilin");
        return;
      }
      const newCandle = {
        id: Date.now() + Math.random(),
        t: cT,
        c: cT === "stick" ? "" : val,
        col: cC,
      };
      setS((prev) => {
        const next = {
          ...prev,
          candles: [...(prev.candles || []), newCandle],
        };
        snap(next);
        return next;
      });
    },
    [cT, cC, S.candles, showToast, snap]
  );

  const handleDeleteCandle = useCallback(
    (id) => {
      setS((prev) => {
        const next = {
          ...prev,
          candles: (prev.candles || []).filter((c) => c.id !== id),
        };
        snap(next);
        return next;
      });
    },
    [snap]
  );

  const handleClearCandles = useCallback(() => {
    setS((prev) => {
      const next = {
        ...prev,
        candles: [],
      };
      snap(next);
      return next;
    });
  }, [snap]);

  const handleRotateItem = useCallback(
    (dir) => {
      setS((prev) => {
        const nextItems = (prev.items || []).map((it) => {
          if (it.id !== prev.sel) return it;
          const currentRot = it.rot || 0;
          const newRot = dir === 0 ? 0 : currentRot + dir * 0.5;
          return { ...it, rot: newRot };
        });
        const next = { ...prev, items: nextItems };
        snap(next);
        return next;
      });
    },
    [snap]
  );

  const paintDC = useCallback(() => {
    const c = drawCanvasRef.current;
    if (!c) return;
    const x = c.getContext("2d");
    x.clearRect(0, 0, 300, 210);
    const P = S.cpts || (S.shape === "custom" ? CAT : null);
    x.lineWidth = 4;
    x.lineJoin = x.lineCap = "round";
    x.strokeStyle = "#D96B91";

    if (P) {
      const k = 85;
      x.beginPath();
      P.forEach((p, i) =>
        x[i ? "lineTo" : "moveTo"](150 + p[0] * k, 105 + p[1] * k * 0.95)
      );
      x.closePath();
      x.fillStyle = "#FCE8EC";
      x.fill();
      x.stroke();
    }
  }, [S.cpts, S.shape]);

  useEffect(() => {
    if (step === 2) {
      paintDC();
    }
  }, [step, paintDC]);

  function handleModeChange(newMode) {
    if (newMode === mode) return;
    if (newMode === "custom") {
      setMode("custom");
      setTplI(null);
      setMaxStep(0);
      try {
        sessionStorage.removeItem("cravely_custom_maxstep");
      } catch {}
      const restored = customStateRef.current || getDefState();
      const nextS = {
        ...restored,
        f: S.f,
      };
      setS(nextS);
      snap(nextS);
    } else {
      setMode("tpl");
      setMaxStep(0);
      try {
        sessionStorage.removeItem("cravely_custom_maxstep");
      } catch {}
      const targetIdx = tplI !== null ? tplI : 0;
      setTplI(targetIdx);
      const targetItem = TPL[targetIdx] || TPL[0];
      const nextS = {
        ...getDefState(),
        ...targetItem.s,
        itemType: targetItem.itemType || "cake",
        tartVariant: targetItem.tartVariant,
        cupcakeVariant: targetItem.cupcakeVariant,
        namaItem: targetItem.n,
        kategoriItem: targetItem.catLabel,
        hargaItem: targetItem.price,
        f: S.f,
      };
      setS(nextS);
      snap(nextS);
    }
  }

  function handleSet(k, v) {
    setS((prev) => {
      let next = { ...prev, [k]: v };
      if (k === "pick" && v === "delivery" && prev.pay === "cash") {
        next.pay = "bank";
      }
      snap(next);
      return next;
    });
  }

  function handleDecoToggle(k) {
    setS((prev) => {
      const nextDeco = { ...prev.deco, [k]: !prev.deco[k] };
      const next = { ...prev, deco: nextDeco };
      snap(next);
      return next;
    });
  }

  function handleAddText() {
    const nextId =
      (S.items || []).reduce((max, it) => Math.max(max, it.id || 0), 0) + 1;
    const newItem = {
      id: nextId,
      t: "text",
      text: "Teks baru",
      font: "Baloo 2",
      px: 28,
      color: "#5b2a1b",
      align: "center",
      fx: "normal",
    };
    setS((prev) => {
      const next = {
        ...prev,
        items: [...prev.items, newItem],
        sel: nextId,
      };
      snap(next);
      return next;
    });
  }

  function handleAddEmoji(catCode, catName, emojiChar) {
    const nextId =
      (S.items || []).reduce((max, it) => Math.max(max, it.id || 0), 0) + 1;
    const nonTextCount = (S.items || []).filter((i) => i.t !== "text").length;
    const g = (2 * Math.PI * nonTextCount) / 5;
    const newItem = {
      id: nextId,
      t: "emoji",
      e: emojiChar,
      k: catName,
      kode_visual: catCode,
      sz: 1,
      x: catCode === "topper" ? 0 : 0.55 * Math.sin(g),
      z: catCode === "topper" ? -0.1 : -0.55 * Math.cos(g),
    };
    setS((prev) => {
      const next = {
        ...prev,
        items: [...prev.items, newItem],
        sel: nextId,
      };
      snap(next);
      return next;
    });
  }

  function handleDeleteItem(idToDelete) {
    setS((prev) => {
      const filtered = prev.items.filter((i) => i.id !== idToDelete);
      const nextSel = filtered.length ? filtered[0].id : null;
      const next = {
        ...prev,
        items: filtered,
        sel: nextSel,
      };
      snap(next);
      return next;
    });
  }

  function handleNudge(dx, dz) {
    if (!selItem) return;
    setS((prev) => {
      const nextItems = prev.items.map((it) => {
        if (it.id === prev.sel) {
          const nx = Math.max(-1, Math.min(1, Number((it.x + dx).toFixed(2))));
          const nz = Math.max(-1, Math.min(1, Number((it.z + dz).toFixed(2))));
          return { ...it, x: nx, z: nz };
        }
        return it;
      });
      const next = { ...prev, items: nextItems };
      snap(next);
      return next;
    });
  }

  function handleItemProp(k, val) {
    setS((prev) => {
      const nextItems = prev.items.map((it) => {
        if (it.id === prev.sel) {
          return { ...it, [k]: val };
        }
        return it;
      });
      return { ...prev, items: nextItems };
    });
  }

  function handleUploadImg(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      showToast("Ukuran gambar maksimal 2 MB");
      return;
    }
    uploadedImageFileRef.current = f;
    const reader = new FileReader();
    reader.onload = () => {
      const nextId =
        (S.items || []).reduce((max, it) => Math.max(max, it.id || 0), 0) + 1;
      const newItem = {
        id: nextId,
        t: "img",
        src: reader.result,
        file: f,
        sz: 1,
        x: 0,
        z: 0,
      };
      setS((prev) => {
        const next = {
          ...prev,
          items: [...prev.items, newItem],
          sel: nextId,
        };
        snap(next);
        return next;
      });
    };
    reader.readAsDataURL(f);
  }

  function handleFieldChange(k, v) {
    setS((prev) => ({
      ...prev,
      f: { ...prev.f, [k]: v },
    }));
  }

  function handleDateChange(e) {
    const val = e.target.value;
    if (!val) {
      handleFieldChange("dt", "");
      return;
    }
    if (ketersediaan?.tanggal_minimal && val < ketersediaan.tanggal_minimal) {
      showToast(`Pemesanan minimal mulai tanggal ${ketersediaan.tanggal_minimal}`);
      return;
    }
    const tutup = (ketersediaan?.tanggal_tutup || []).find(
      (t) => (t.tanggal || t) === val
    );
    if (tutup) {
      showToast(`Tanggal ${val} toko sedang tutup: ${tutup.alasan || "Libur"}`);
      return;
    }
    if ((ketersediaan?.tanggal_penuh || []).includes(val)) {
      showToast(`Kuota pesanan pada tanggal ${val} sudah penuh.`);
      return;
    }
    handleFieldChange("dt", val);
  }

  const grupJenis = daftarGrup.find(
    (g) => g.peran_dashboard === "jenis" || g.nama === "Jenis Kue"
  );
  const grupUkuran = daftarGrup.find(
    (g) => g.peran_visual === "ukuran" || g.nama === "Ukuran"
  );
  const grupBentuk = daftarGrup.find(
    (g) => g.peran_visual === "bentuk" || g.nama === "Bentuk"
  );
  const grupRasa = daftarGrup.find(
    (g) =>
      g.peran_dashboard === "terlaris" ||
      g.nama === "Rasa" ||
      g.peran_visual === "badan"
  );
  const grupIsian = daftarGrup.find((g) => g.nama === "Isian");
  const grupWarnaKrim = daftarGrup.find(
    (g) =>
      g.peran_visual === "krim" ||
      g.nama === "Warna Krim" ||
      g.nama === "Krim"
  );
  const grupDekorasi = daftarGrup.find(
    (g) => g.peran_visual === "topping" || g.nama === "Dekorasi"
  );
  const grupStiker = daftarGrup.find(
    (g) =>
      g.peran_visual === "stiker" ||
      g.nama === "Elemen Hiasan" ||
      g.nama === "Stiker & Topper"
  );
  const grupDesainKustom = daftarGrup.find(
    (g) => g.nama === "Desain Kustom"
  );

  const itemsUkuran = daftarItem.filter((it) => it.id_grup === grupUkuran?.id);
  const itemsBentuk = daftarItem.filter((it) => it.id_grup === grupBentuk?.id);
  const itemsRasa = daftarItem.filter((it) => it.id_grup === grupRasa?.id);
  const itemsIsian = daftarItem.filter((it) => it.id_grup === grupIsian?.id);
  const itemsWarnaKrim = daftarItem.filter(
    (it) => it.id_grup === grupWarnaKrim?.id
  );
  const itemsDekorasi = daftarItem.filter(
    (it) => it.id_grup === grupDekorasi?.id
  );
  const itemsStiker = daftarItem.filter((it) => it.id_grup === grupStiker?.id);
  const itemsDesainKustom = daftarItem.filter(
    (it) => it.id_grup === grupDesainKustom?.id
  );

  function getPilihanItemsList() {
    const res = [];
    if (!daftarItem.length) return res;

    if (grupJenis) {
      const it =
        mode === "tpl"
          ? daftarItem.find(
              (x) =>
                x.id_grup === grupJenis.id &&
                (x.kode_visual === "template" ||
                  x.nama.toLowerCase().includes("template"))
            )
          : daftarItem.find(
              (x) =>
                x.id_grup === grupJenis.id &&
                (x.kode_visual === "custom" ||
                  x.nama.toLowerCase().includes("custom"))
            ) || daftarItem.find((x) => x.id_grup === grupJenis.id);
      if (it) res.push({ id_item: it.id, jumlah: 1 });
    }

    if (grupUkuran) {
      const it =
        daftarItem.find(
          (x) => x.id_grup === grupUkuran.id && x.kode_visual === S.size
        ) || itemsUkuran[0];
      if (it) res.push({ id_item: it.id, jumlah: 1 });
    }

    if (grupBentuk) {
      const it =
        daftarItem.find(
          (x) => x.id_grup === grupBentuk.id && x.kode_visual === S.shape
        ) || itemsBentuk[0];
      if (it) res.push({ id_item: it.id, jumlah: 1 });
    }

    if (grupRasa) {
      const it =
        daftarItem.find(
          (x) => x.id_grup === grupRasa.id && x.kode_visual === S.flavor
        ) || itemsRasa[0];
      if (it) res.push({ id_item: it.id, jumlah: 1 });
    }

    if (grupIsian) {
      const it =
        daftarItem.find(
          (x) => x.id_grup === grupIsian.id && x.kode_visual === S.fill
        ) || itemsIsian[0];
      if (it) res.push({ id_item: it.id, jumlah: 1 });
    }

    if (grupWarnaKrim) {
      const it =
        daftarItem.find(
          (x) =>
            x.id_grup === grupWarnaKrim.id &&
            x.warna &&
            x.warna.toLowerCase() === (S.icing || "").toLowerCase()
        ) || itemsWarnaKrim[0];
      if (it) res.push({ id_item: it.id, jumlah: 1 });
    }

    if (grupDekorasi && S.deco) {
      for (let i = 0; i < itemsDekorasi.length; i++) {
        const it = itemsDekorasi[i];
        if (S.deco[it.kode_visual]) {
          res.push({ id_item: it.id, jumlah: 1 });
        }
      }
    }

    if (grupStiker && S.items) {
      const hitungKategori = {};
      for (let i = 0; i < S.items.length; i++) {
        const el = S.items[i];
        if (el.t === "emoji") {
          const key = (el.kode_visual || el.k || "").toLowerCase();
          hitungKategori[key] = (hitungKategori[key] || 0) + 1;
        }
      }
      for (let i = 0; i < itemsStiker.length; i++) {
        const it = itemsStiker[i];
        const kode = (it.kode_visual || "").toLowerCase();
        const nama = (it.nama || "").toLowerCase();
        const qty = hitungKategori[kode] || hitungKategori[nama] || 0;
        if (qty > 0) {
          res.push({ id_item: it.id, jumlah: Math.min(20, qty) });
        }
      }
    }

    if (grupDesainKustom && S.items) {
      const imgCount = S.items.filter((x) => x.t === "img").length;
      if (imgCount > 0) {
        const it = itemsDesainKustom[0];
        if (it) {
          res.push({ id_item: it.id, jumlah: Math.min(20, imgCount) });
        }
      }
    }

    return res;
  }

  function getOngkir() {
    if (S.pick !== "delivery") return 0;
    if (S.zonaId && daftarZona.length > 0) {
      const z = daftarZona.find((x) => x.id === S.zonaId);
      if (z) return z.tarif || 0;
    }
    if (daftarZona.length > 0) {
      return daftarZona[0].tarif || 0;
    }
    return 0;
  }

  const rincianHarga = hitungTotal({
    pilihan: getPilihanItemsList(),
    daftarItem,
    ongkir: getOngkir(),
    pengaturanDP: pengaturan,
  });

  const persenDp = pengaturan?.persen_dp || 50;
  const isDpActive =
    pengaturan?.mode_pembayaran !== "Lunas" && S.payScheme !== "lunas";
  const selectedTemplate = mode === "tpl" && tplI !== null ? TPL[tplI] : null;
  const totalBiayaPesanan = selectedTemplate?.price
    ? selectedTemplate.price + getOngkir()
    : rincianHarga.total_bayar;
  const jumlahDpSekarang = isDpActive
    ? Math.round((totalBiayaPesanan * persenDp) / 100)
    : totalBiayaPesanan;
  const sisaPelunasan = totalBiayaPesanan - jumlahDpSekarang;

  function getLineItems() {
    if (mode === "tpl" && tplI !== null && TPL[tplI]) {
      const it = TPL[tplI];
      return [
        [it.n, it.price, 0, false],
        [`Kategori: ${it.catLabel}`, 0, 0, true],
        [`Komposisi: ${it.d}`, 0, 0, true],
      ];
    }
    const items = getPilihanItemsList();
    const rows = [];
    const mapItem = new Map();
    for (let i = 0; i < daftarItem.length; i++) {
      mapItem.set(daftarItem[i].id, daftarItem[i]);
    }
    const mapGrup = new Map();
    for (let i = 0; i < daftarGrup.length; i++) {
      mapGrup.set(daftarGrup[i].id, daftarGrup[i]);
    }

    for (let i = 0; i < items.length; i++) {
      const { id_item, jumlah } = items[i];
      const it = mapItem.get(id_item);
      if (!it) continue;
      const gr = mapGrup.get(it.id_grup);
      if (it.kode_visual === "candle" || it.nama.toLowerCase().includes("lilin")) {
        continue;
      }
      const subtotal = Number(it.harga || 0) * (jumlah || 1);
      const stepTarget =
        gr?.peran_visual === "ukuran"
          ? 1
          : gr?.peran_visual === "bentuk"
          ? 2
          : gr?.peran_visual === "badan" ||
            gr?.peran_visual === "krim" ||
            gr?.nama === "Isian"
          ? 3
          : gr?.peran_visual === "topping"
          ? 4
          : gr?.peran_visual === "stiker" || gr?.nama === "Desain Kustom"
          ? 5
          : 0;

      let labelName = "";
      if (gr?.peran_visual === "ukuran") {
        const d =
          VISUAL_SIZE[it.kode_visual]?.d ||
          (it.nama.match(/\d+/) ? it.nama.match(/\d+/)[0] : 14);
        labelName = `ukuran ${it.kode_visual || formatNamaItem(it.nama).toLowerCase()} (diameter ${d} cm)`;
      } else if (gr?.peran_visual === "bentuk") {
        labelName = `bentuk ${it.nama.toLowerCase()}`;
      } else if (gr?.peran_visual === "badan") {
        labelName = `rasa ${it.nama.toLowerCase()}`;
      } else if (gr?.nama === "Isian") {
        labelName = `isian ${it.nama.toLowerCase()}`;
      } else if (gr?.peran_visual === "krim") {
        labelName = `krim ${it.nama.toLowerCase()}`;
      } else if (gr?.peran_visual === "topping") {
        labelName = `dekorasi ${it.nama.toLowerCase()}`;
      } else if (gr?.peran_visual === "stiker") {
        labelName = `hiasan ${it.nama.toLowerCase()}${jumlah > 1 ? ` (${jumlah} pcs)` : ""}`;
      } else {
        labelName = `${it.nama.toLowerCase()}${jumlah > 1 ? ` x ${jumlah}` : ""}`;
      }

      rows.push([labelName, subtotal, stepTarget, it.harga === 0]);
    }

    (S.items || []).forEach((it) => {
      if (it.t === "text" && it.text && it.text.trim()) {
        rows.push([
          `tulisan "${it.text.replace(/\n/g, " ").slice(0, 22)}"`,
          0,
          5,
          true,
        ]);
      }
    });

    if ((S.candles || []).length > 0) {
      const labelLilin = S.candles
        .map((c) => (c.t === "stick" ? "Batang" : c.c))
        .join(", ");
      rows.push([`lilin kue (${labelLilin})`, 0, 4, true]);
    }
    return rows;
  }

  function validateStep(sIdx) {
    const active = getActiveSteps(S.itemType);
    if (!active.includes(sIdx)) return "";
    if (sIdx === 0) {
      if (!S.itemType) {
        return "Pilih salah satu bentuk dasar kue terlebih dahulu ya.";
      }
      return "";
    }
    if (sIdx === 1) {
      if (!S.size) return "Pilih ukuran terlebih dahulu ya.";
      return "";
    }
    if (sIdx === 2) {
      if (!S.shape) return "Pilih bentuk kue terlebih dahulu ya.";
      return "";
    }
    if (sIdx === 3) {
      if (!S.flavor) return "Pilih rasa terlebih dahulu ya.";
      if (S.itemType === "cake" && !S.fill) return "Pilih isian krim terlebih dahulu ya.";
      if (S.itemType === "cake" && !S.icing) return "Pilih warna krim icing terlebih dahulu ya.";
      return "";
    }
    if (sIdx === 7) {
      return checkValidation();
    }
    return "";
  }

  function go(targetStep) {
    const active = getActiveSteps(S.itemType);
    let i = Math.max(0, Math.min(8, targetStep));
    if (i === step) return;

    if (!active.includes(i)) {
      showToast("Langkah ini tidak tersedia untuk jenis kue ini.");
      return;
    }

    if (i > step) {
      const myPos = active.indexOf(i);
      const curPos = active.indexOf(step);
      const maxPos = active.reduce(
        (acc, sIdx, pos) => (sIdx <= maxStep ? Math.max(acc, pos) : acc),
        0
      );
      const isNextAllowed = myPos === curPos + 1 || myPos <= maxPos;
      if (!isNextAllowed) {
        showToast("Selesaikan langkah sebelumnya terlebih dahulu ya.");
        return;
      }
      for (let k = step; k < i; k++) {
        if (!active.includes(k)) continue;
        const err = validateStep(k);
        if (err) {
          showToast(err);
          return;
        }
      }
      setMaxStep((prev) => Math.max(prev, i));
    }

    setStep(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function checkValidation() {
    if (!S.f.nm || !S.f.nm.trim()) return "Isi nama pemesan terlebih dahulu ya";
    if (!S.f.ph || !S.f.ph.trim()) return "Isi nomor WhatsApp terlebih dahulu ya";
    const digits = S.f.ph.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15)
      return "Nomor WhatsApp tidak valid (minimal 9 digit angka)";
    if (!S.f.dt) return "Pilih tanggal pengambilan/pengantaran terlebih dahulu ya";
    if (!S.f.tm) return "Pilih jam pengambilan/pengantaran terlebih dahulu ya";
    if (S.pick === "delivery" && (!S.f.addr || !S.f.addr.trim())) {
      return "Isi alamat pengantaran terlebih dahulu ya";
    }
    if (!S.pay) return "Pilih metode pembayaran terlebih dahulu ya";
    if (S.pick === "delivery" && S.pay === "cash") {
      return "Metode pembayaran tunai di toko hanya tersedia jika pesanan diambil di toko";
    }
    return "";
  }

  async function getCanvasSnapshot() {
    const cv = canvasRef.current;
    if (!cv) return null;
    const ts = threeStateRef.current;
    if (ts.renderer && ts.scene && ts.camera) {
      ts.renderer.render(ts.scene, ts.camera);
    }
    const maxDim = 1000;
    let w = cv.width;
    let h = cv.height;
    if (w <= 0 || h <= 0) return null;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    const tempCv = document.createElement("canvas");
    tempCv.width = w;
    tempCv.height = h;
    const ctx = tempCv.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(cv, 0, 0, w, h);
    return new Promise((resolve) => {
      tempCv.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.85
      );
    });
  }

  async function getShapeCanvasBlob() {
    const dc = drawCanvasRef.current;
    if (dc) {
      return new Promise((resolve) => {
        dc.toBlob((b) => resolve(b), "image/png");
      });
    }
    const pts = S.cpts || CAT;
    if (!pts || !pts.length) return null;
    const off = document.createElement("canvas");
    off.width = 320;
    off.height = 240;
    const ctx = off.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, off.width, off.height);
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const px = off.width / 2 + p[0] * 90;
      const py = off.height / 2 + p[1] * 90;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = "#F1DBD0";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#A36361";
    ctx.stroke();
    return new Promise((resolve) => {
      off.toBlob((b) => resolve(b), "image/png");
    });
  }

  async function handleAddToCart() {
    if (!user) {
      showToast("Silakan masuk terlebih dahulu untuk menambahkan ke keranjang.");
      setTimeout(() => {
        router.push("/masuk?ke=/pesan");
      }, 1000);
      return;
    }

    const imgItem = (S.items || []).find((i) => i.t === "img");
    if (imgItem && !uploadedImageFileRef.current) {
      showToast("Silakan unggah gambar desain kustom terlebih dahulu.");
      return;
    }

    setSedangKirim(true);

    const txtTulisan = (S.items || [])
      .filter((i) => i.t === "text" && i.text)
      .map((i) => i.text.trim())
      .join(" / ");

    const desainJson = {
      nama_kue: (S.customName || "").trim() || null,
      itemType: S.itemType || "cake",
      jenis_kue_label:
        BASE_TYPES.find((b) => b.key === (S.itemType || "cake"))?.label || "Kue Ultah",
      nama_template: mode === "tpl" && tplI !== null ? TPL[tplI]?.n : null,
      shape: S.shape,
      size: S.size,
      flavor: S.flavor,
      fill: S.fill,
      icing: S.icing,
      deco: S.deco || {},
      candles: S.candles || [],
      cpts: S.shape === "custom" ? S.cpts || CAT : null,
      items: (S.items || []).map((it) => ({
        id: it.id,
        t: it.t,
        text: it.text || null,
        font: it.font || null,
        px: it.px || null,
        color: it.color || null,
        align: it.align || null,
        fx: it.fx || null,
        k: it.k || null,
        kode_visual: it.kode_visual || null,
        e: it.e || null,
        x: it.x || 0,
        z: it.z || 0,
        sz: it.sz || 1,
      })),
    };

    const formData = new FormData();
    formData.append("jenis", "Custom");
    formData.append("tulisan_kue", txtTulisan || "");
    formData.append("catatan", (S.f.notes || "").trim());
    formData.append("pilihan", JSON.stringify(getPilihanItemsList()));
    formData.append("desain_json", JSON.stringify(desainJson));

    try {
      const snapBlob = await getCanvasSnapshot();
      if (snapBlob) {
        formData.append("foto_preview", snapBlob, "preview.jpg");
      }
    } catch {}

    if (S.shape === "custom") {
      try {
        const shapeBlob = await getShapeCanvasBlob();
        if (shapeBlob) {
          formData.append("foto_bentuk_kustom", shapeBlob, "bentuk.png");
        }
      } catch {}
    }

    if (uploadedImageFileRef.current) {
      formData.append("foto_gambar_kustom", uploadedImageFileRef.current);
    }

    try {
      const res = await fetch("/api/keranjang", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setSedangKirim(false);

      if (!res.ok) {
        showToast(data.pesan || "Gagal menambahkan kue ke keranjang.");
        return;
      }

      allowLeaveRef.current = true;
      setCartCount((c) => c + 1);
      window.dispatchEvent(new Event("cravely_cart_updated"));
      sessionStorage.removeItem("cravely_custom_draft");
      sessionStorage.removeItem("cravely_custom_maxstep");
      showToast("Kue custom berhasil masuk keranjang! 🛒");
      setTimeout(() => {
        router.push("/keranjang");
      }, 700);
    } catch {
      setSedangKirim(false);
      showToast("Gagal terhubung ke server. Silakan coba kembali.");
    }
  }

  async function handleOrderSubmit() {
    const err = checkValidation();
    if (err) {
      showToast(err);
      return;
    }

    if (!user) {
      showToast("Silakan masuk terlebih dahulu untuk menyelesaikan pesanan.");
      setTimeout(() => {
        router.push("/masuk?ke=/pesan");
      }, 1200);
      return;
    }

    const imgItem = (S.items || []).find((i) => i.t === "img");
    if (imgItem && !uploadedImageFileRef.current) {
      showToast("Silakan unggah gambar desain kustom terlebih dahulu.");
      return;
    }

    setSedangKirim(true);

    const txtTulisan = (S.items || [])
      .filter((i) => i.t === "text" && i.text)
      .map((i) => i.text.trim())
      .join(" / ");

    const desainJson = {
      nama_kue: (S.customName || "").trim() || null,
      itemType: S.itemType || "cake",
      jenis_kue_label:
        BASE_TYPES.find((b) => b.key === (S.itemType || "cake"))?.label || "Kue Ultah",
      nama_template: mode === "tpl" && tplI !== null ? TPL[tplI]?.n : null,
      shape: S.shape,
      size: S.size,
      flavor: S.flavor,
      fill: S.fill,
      icing: S.icing,
      deco: S.deco || {},
      candles: S.candles || [],
      cpts: S.shape === "custom" ? S.cpts || CAT : null,
      items: (S.items || []).map((it) => ({
        id: it.id,
        t: it.t,
        text: it.text || null,
        font: it.font || null,
        px: it.px || null,
        color: it.color || null,
        align: it.align || null,
        fx: it.fx || null,
        k: it.k || null,
        kode_visual: it.kode_visual || null,
        e: it.e || null,
        x: it.x || 0,
        z: it.z || 0,
        sz: it.sz || 1,
      })),
    };

    const formData = new FormData();
    formData.append("nama_penerima", (S.f.nm || "").trim());
    formData.append("no_wa", (S.f.ph || "").trim());
    formData.append("tulisan_kue", txtTulisan || "");
    const namaMetodeBayar =
      S.pay === "bank"
        ? `Transfer Bank (${pengaturan?.nama_bank || "BCA"})`
        : S.pay === "qris"
        ? "QRIS"
        : "Tunai di Toko";

    const catatanRincian = [
      isDpActive
        ? `[Skema: DP ${persenDp}% (${formatRupiah(jumlahDpSekarang)}) | Sisa: ${formatRupiah(sisaPelunasan)}]`
        : "[Skema: Bayar Penuh / Lunas]",
      `[Metode: ${namaMetodeBayar}]`,
      (S.f.notes || "").trim(),
    ]
      .filter(Boolean)
      .join(" ");

    formData.append("catatan", catatanRincian);
    formData.append("tanggal_ambil", S.f.dt || "");
    formData.append("jam_ambil", S.f.tm || "10:00");
    formData.append("metode_pengiriman", S.pick === "delivery" ? "Kirim" : "Ambil");
    if (S.pick === "delivery") {
      formData.append("alamat", (S.f.addr || "").trim());
      if (S.zonaId) {
        formData.append("id_zona", String(S.zonaId));
      } else if (daftarZona.length > 0) {
        formData.append("id_zona", String(daftarZona[0].id));
      }
    }

    const itemsPilihan = getPilihanItemsList();
    formData.append("pilihan", JSON.stringify(itemsPilihan));
    formData.append("desain_json", JSON.stringify(desainJson));

    try {
      const snapBlob = await getCanvasSnapshot();
      if (snapBlob) {
        formData.append("foto_preview", snapBlob, "preview.jpg");
      }
    } catch {}

    if (S.shape === "custom") {
      try {
        const shapeBlob = await getShapeCanvasBlob();
        if (shapeBlob) {
          formData.append("foto_bentuk_kustom", shapeBlob, "bentuk.png");
        }
      } catch {}
    }

    if (uploadedImageFileRef.current) {
      formData.append("foto_gambar_kustom", uploadedImageFileRef.current);
    }

    try {
      const res = await fetch("/api/pesanan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setSedangKirim(false);

      if (!res.ok) {
        showToast(data.pesan || "Terjadi kendala saat mengirim pesanan.");
        return;
      }

      setCartCount((c) => c + 1);
      sessionStorage.removeItem("cravely_custom_draft");
      sessionStorage.removeItem("cravely_custom_maxstep");
      showToast("Pesanan berhasil dibuat!");
      setTimeout(() => {
        router.push(`/user/${data.kode_pesanan}`);
      }, 1000);
    } catch {
      setSedangKirim(false);
      showToast("Gagal terhubung ke server. Silakan coba kembali.");
    }
  }

  function handlePrev() {
    const active = getActiveSteps(S.itemType);
    let curPos = active.indexOf(step);
    if (curPos > 0) {
      go(active[curPos - 1]);
    }
  }

  function handleNext() {
    const active = getActiveSteps(S.itemType);
    let curPos = active.indexOf(step);
    if (curPos < 0) {
      const nextValid = active.find((s) => s > step) ?? active[0] ?? 0;
      go(nextValid);
      return;
    }
    const err = validateStep(step);
    if (err) {
      showToast(err);
      return;
    }
    if (step === 6 || step === 8) {
      handleAddToCart();
      return;
    }
    if (curPos < active.length - 1) {
      const nextStep = active[curPos + 1];
      go(nextStep);
      return;
    }
  }

  function renderCakeSVG(sz, body, ice) {
    const szData = VISUAL_SIZE[sz] || { d: 14 };
    const rx = 20 + szData.d * 1.75;
    const t = 36;
    const b = 64;
    const d = [8, 15, 6, 13, 9];
    return (
      <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="72" rx="56" ry="12" fill="#e8dce2" />
        <ellipse cx="60" cy="68" rx="56" ry="12" fill="#faf4f7" />
        <path
          d={`M${60 - rx},${t}V${b}A${rx},${rx * 0.28} 0 0 0 ${60 + rx},${b}V${t}Z`}
          fill={body}
        />
        {d.map((l, i) => {
          const x = 60 - rx + 8 + (i * (2 * rx - 16)) / 4;
          return (
            <rect
              key={i}
              x={x - 3.5}
              y={t}
              width="7"
              height={l + 4}
              rx="3.5"
              fill={ice}
            />
          );
        })}
        <ellipse cx="60" cy={t} rx={rx} ry={rx * 0.28} fill={ice} />
        {[
          [-0.45, 2],
          [0, -1],
          [0.45, 2],
        ].map(([k, dy], idx) => {
          const x = 60 + rx * k;
          return (
            <g key={idx}>
              <circle cx={x} cy={t - 3 + dy} r="6" fill="#e0303f" />
              <path
                d={`M${x - 3},${t - 8 + dy}h6l-3 3z`}
                fill="#3d9a4a"
              />
            </g>
          );
        })}
      </svg>
    );
  }

  function renderSizeIcon(itemType, sz) {
    if (itemType === "cake") {
      return renderCakeSVG(sz, "#fbefd5", S.icing || "#f6b4c2");
    }
    return renderBaseItemSVG(itemType);
  }

  function renderShapeSVG(k) {
    const f = "#fce8ec";
    const s = "#d96b91";
    if (k === "round") {
      return (
        <svg viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="22" fill={f} stroke={s} strokeWidth="3" />
        </svg>
      );
    }
    if (k === "square") {
      return (
        <svg viewBox="0 0 60 60">
          <rect
            x="11"
            y="11"
            width="38"
            height="38"
            rx="6"
            fill={f}
            stroke={s}
            strokeWidth="3"
          />
        </svg>
      );
    }
    if (k === "heart") {
      return (
        <svg viewBox="0 0 60 60">
          <path
            d="M30 48s-17-10.5-17-21a10 10 0 0 1 17-6 10 10 0 0 1 17 6c0 10.5-17 21-17 21z"
            fill={f}
            stroke={s}
            strokeWidth="3"
          />
        </svg>
      );
    }
    if (k === "star") {
      return (
        <svg viewBox="0 0 60 60">
          <path
            d="M30 8l6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2z"
            fill={f}
            stroke={s}
            strokeWidth="3"
          />
        </svg>
      );
    }
    if (k === "hex") {
      return (
        <svg viewBox="0 0 60 60">
          <polygon
            points="30,8 48,19 48,41 30,52 12,41 12,19"
            fill={f}
            stroke={s}
            strokeWidth="3"
          />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="22" fill={f} stroke={s} strokeWidth="3" />
      </svg>
    );
  }

  function renderBaseItemSVG(key) {
    if (key === "cupcake") {
      return (
        <svg viewBox="0 0 100 85" width="80" height="68" fill="none">
          <path d="M26 44 L34 74 Q50 78 66 74 L74 44 Z" fill="#FAF2E5" stroke="#D8C7B5" strokeWidth="1.5" />
          <path d="M34 46 L38 74" stroke="#D8C7B5" strokeWidth="1.2" />
          <path d="M42 46 L45 75" stroke="#D8C7B5" strokeWidth="1.2" />
          <path d="M50 46 L50 76" stroke="#D8C7B5" strokeWidth="1.2" />
          <path d="M58 46 L55 75" stroke="#D8C7B5" strokeWidth="1.2" />
          <path d="M66 46 L62 74" stroke="#D8C7B5" strokeWidth="1.2" />
          <ellipse cx="50" cy="44" rx="27" ry="9" fill="#C88235" />
          <path d="M23 44 C23 24 77 24 77 44 C77 48 23 48 23 44 Z" fill="#E5A85A" />
          <ellipse cx="50" cy="34" rx="20" ry="10" fill="#E8B06C" opacity="0.6" />
          <circle cx="44" cy="32" r="1.5" fill="#B46B24" opacity="0.7" />
          <circle cx="56" cy="36" r="1.2" fill="#B46B24" opacity="0.7" />
          <circle cx="50" cy="28" r="1.3" fill="#B46B24" opacity="0.7" />
        </svg>
      );
    }
    if (key === "tart") {
      return (
        <svg viewBox="0 0 100 85" width="80" height="68" fill="none">
          <ellipse cx="50" cy="54" rx="38" ry="14" fill="#B5762D" />
          <ellipse cx="50" cy="50" rx="38" ry="14" fill="#DCA052" />
          <path d="M12 50 Q16 46 20 50 Q24 46 28 50 Q32 46 36 50 Q40 46 44 50 Q48 46 52 50 Q56 46 60 50 Q64 46 68 50 Q72 46 76 50 Q80 46 84 50 Q88 46 88 50" stroke="#9E5D20" strokeWidth="2.5" fill="none" />
          <ellipse cx="50" cy="48" rx="31" ry="10" fill="#FFBD28" />
          <ellipse cx="48" cy="47" rx="22" ry="6.5" fill="#FFCA42" opacity="0.7" />
          <circle cx="42" cy="46" r="1" fill="#C27A10" />
          <circle cx="54" cy="48" r="1.2" fill="#C27A10" />
        </svg>
      );
    }
    if (key === "donut") {
      return (
        <svg viewBox="0 0 100 85" width="80" height="68" fill="none">
          <ellipse cx="50" cy="52" rx="34" ry="20" fill="#B76922" />
          <ellipse cx="50" cy="50" rx="34" ry="18" fill="#CA7C30" />
          <ellipse cx="50" cy="48" rx="33" ry="14" fill="#F7E6CC" stroke="#DF9A50" strokeWidth="1.5" />
          <ellipse cx="50" cy="44" rx="32" ry="12" fill="#CA7C30" />
          <ellipse cx="50" cy="44" rx="12" ry="6" fill="#FFFDF8" />
          <ellipse cx="50" cy="42" rx="24" ry="7" fill="#E89B48" opacity="0.6" />
        </svg>
      );
    }
    if (key === "cookies") {
      return (
        <svg viewBox="0 0 100 85" width="80" height="68" fill="none">
          <ellipse cx="50" cy="52" rx="33" ry="21" fill="#A26829" />
          <ellipse cx="50" cy="48" rx="33" ry="20" fill="#CD9854" />
          <ellipse cx="48" cy="46" rx="26" ry="15" fill="#DEC28E" opacity="0.5" />
          <path d="M32 42 Q40 46 48 44 Q56 42 66 48" stroke="#8A4F1E" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M42 34 Q46 42 44 54" stroke="#8A4F1E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M52 46 Q58 52 64 56" stroke="#8A4F1E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <ellipse cx="38" cy="40" rx="3.5" ry="3" fill="#25140A" />
          <ellipse cx="54" cy="38" rx="4" ry="3.5" fill="#25140A" />
          <ellipse cx="46" cy="52" rx="4.5" ry="3.5" fill="#25140A" />
          <ellipse cx="62" cy="46" rx="3" ry="2.5" fill="#25140A" />
          <ellipse cx="32" cy="50" rx="3" ry="2.5" fill="#25140A" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 100 85" width="80" height="68" fill="none">
        <ellipse cx="50" cy="62" rx="36" ry="12" fill="#E8D5B5" />
        <path d="M14 42 L14 62 C14 69 86 69 86 62 L86 42 Z" fill="#F8EAD6" />
        <ellipse cx="50" cy="42" rx="36" ry="12" fill="#F8EAD6" />
        <ellipse cx="50" cy="42" rx="34" ry="10.5" fill="#FFFBF5" />
        <path d="M14 52 C30 55 70 55 86 52" stroke="#E3C49B" strokeWidth="2.5" strokeDasharray="2 3" />
        <path d="M14 42 C14 48 86 48 86 42" stroke="#F1DFC8" strokeWidth="1.5" />
      </svg>
    );
  }

  function renderPastrySVG(item) {
    const type = item.itemType || "cake";
    if (type === "cupcake") {
      const isMint = item.cupcakeVariant === "mint";
      const swirlCol = isMint ? "#BCE5CD" : "#FFCDB0";
      return (
        <svg viewBox="0 0 100 85" width="80" height="68" fill="none">
          <path d="M30 46 L36 74 Q50 78 64 74 L70 46 Z" fill="#FBF3EA" stroke="#DCCABB" strokeWidth="2" />
          <path d="M38 48 L42 74" stroke="#E6D6C7" strokeWidth="1.5" />
          <path d="M50 48 L50 75" stroke="#E6D6C7" strokeWidth="1.5" />
          <path d="M62 48 L58 74" stroke="#E6D6C7" strokeWidth="1.5" />
          <ellipse cx="50" cy="46" rx="22" ry="7" fill={isMint ? "#4A2B1D" : "#C99450"} />
          <path d="M26 44 Q50 20 74 44 Q50 35 26 44 Z" fill={swirlCol} />
          <ellipse cx="50" cy="32" rx="16" ry="8" fill={swirlCol} />
          <circle cx="50" cy="22" r="7" fill={swirlCol} />
          {isMint ? (
            <g>
              <line x1="52" y1="26" x2="62" y2="10" stroke="#683515" strokeWidth="4" strokeLinecap="round" />
              <circle cx="44" cy="18" r="4.5" fill="#448F46" />
            </g>
          ) : (
            <g>
              <circle cx="44" cy="18" r="5" fill="#FA7E52" />
              <circle cx="54" cy="18" r="4" fill="#B81C38" />
            </g>
          )}
        </svg>
      );
    }
    if (type === "tart") {
      return (
        <svg viewBox="0 0 100 85" width="80" height="68" fill="none">
          <ellipse cx="50" cy="56" rx="38" ry="14" fill="#B37E38" />
          <ellipse cx="50" cy="52" rx="37" ry="13" fill="#C8944B" />
          <ellipse cx="50" cy="48" rx="33" ry="10" fill={item.s?.icing || "#FFF4E2"} />
          <circle cx="50" cy="46" r="6" fill="#DF253A" />
          <circle cx="38" cy="48" r="5" fill="#271F36" />
          <circle cx="62" cy="48" r="5" fill="#DF253A" />
          <circle cx="44" cy="44" r="3.5" fill="#EA8DA2" />
          <circle cx="56" cy="44" r="3.5" fill="#271F36" />
        </svg>
      );
    }
    if (type === "cookies") {
      return (
        <svg viewBox="0 0 100 85" width="80" height="68" fill="none">
          <rect x="30" y="28" width="40" height="46" rx="6" fill="#EBF4F9" stroke="#C2DCED" strokeWidth="2" opacity="0.85" />
          <rect x="28" y="22" width="44" height="8" rx="3" fill="#D4AF37" />
          <circle cx="50" cy="19" r="4" fill="#D4AF37" />
          <rect x="30" y="32" width="40" height="6" fill="#8E2A3E" />
          <circle cx="43" cy="50" r="10" fill="#C99653" />
          <circle cx="57" cy="58" r="9" fill="#B88542" />
          <circle cx="40" cy="48" r="1.8" fill="#381F13" />
          <circle cx="45" cy="53" r="1.8" fill="#381F13" />
          <circle cx="55" cy="56" r="1.8" fill="#381F13" />
        </svg>
      );
    }
    if (type === "donut") {
      return (
        <svg viewBox="0 0 100 85" width="80" height="68" fill="none">
          <ellipse cx="50" cy="58" rx="32" ry="14" fill="#D28E4A" />
          <ellipse cx="50" cy="54" rx="30" ry="12" fill="#EE6586" />
          <ellipse cx="50" cy="54" rx="10" ry="5" fill="#FAF4EE" />
          <line x1="38" y1="52" x2="42" y2="52" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
          <line x1="58" y1="52" x2="62" y2="52" stroke="#FFEA79" strokeWidth="2" strokeLinecap="round" />
          <line x1="48" y1="60" x2="52" y2="60" stroke="#6FE3E8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="68" cy="30" r="6" fill="#B00E26" />
          <path d="M68 24 Q72 16 75 18" stroke="#3C2210" strokeWidth="2" fill="none" />
        </svg>
      );
    }
    if (item.s?.shape === "heart") return renderShapeSVG("heart");
    return renderCakeSVG(item.s?.size || "small", FLAV_COLORS[item.s?.flavor] || "#fbefd5", item.s?.icing || "#f6b4c2");
  }

  function renderBarcodeSVG(seed) {
    const bars = [];
    const s = String(seed || "CRAVELY-BAKERY-2026");
    let h = 0;
    let x = 0;
    for (let c = 0; c < s.length; c++) {
      h = (Math.imul(h, 31) + s.charCodeAt(c)) >>> 0;
    }
    for (let i = 0; i < 64; i++) {
      h = (Math.imul(h, 1103515245) + 12345) >>> 0;
      const w = 1 + ((h >>> 16) % 4);
      const g = 1 + ((h >>> 20) % 3);
      bars.push(
        <rect key={i} x={x} y="0" width={w} height="64" />
      );
      x += w + g;
    }
    return (
      <svg
        className="bc"
        viewBox={`0 0 ${x} 64`}
        preserveAspectRatio="none"
        fill="#3B2326"
        aria-hidden="true"
        style={{
          width: "100%",
          height: "48px",
          display: "block",
          margin: "14px 0 6px",
        }}
      >
        {bars}
      </svg>
    );
  }

  const startHour =
    parseInt((ketersediaan?.jam_buka || "08:00").slice(0, 2), 10) || 8;
  const endHour =
    parseInt((ketersediaan?.jam_tutup || "20:00").slice(0, 2), 10) || 20;
  const daftarJam = [];
  for (let h = startHour; h <= endHour; h++) {
    daftarJam.push(String(h).padStart(2, "0") + ":00");
  }

  const todayFormatted = formatTanggalIndonesia(new Date());

  return (
    <>
      <DynamicIslandNavbar showEntered={true} toko={pengaturan} />
      <div className="cakecraft-studio" style={{ paddingTop: "68px" }}>
        <div className="wrap">
        <div className="steps">
          {getActiveSteps(S.itemType).map((idx) => {
            const item = STEPS[idx];
            const activeSteps = getActiveSteps(S.itemType);
            const posInActive = activeSteps.indexOf(step);
            const myPos = activeSteps.indexOf(idx);
            const isDone = myPos < posInActive;
            const isCur = idx === step;
            const maxPos = activeSteps.reduce(
              (acc, sIdx, pos) => (sIdx <= maxStep ? Math.max(acc, pos) : acc),
              0
            );
            const isUnlocked = myPos <= Math.max(posInActive, maxPos);
            const override = STEP_LABEL_OVERRIDE[S.itemType] || {};
            const label = override[idx] || item[0];
            return (
              <button
                key={idx}
                className={`st ${isDone ? "done" : ""} ${isCur ? "cur" : ""} ${
                  !isUnlocked ? "locked" : ""
                }`}
                onClick={() => {
                  if (!isUnlocked) {
                    showToast("Selesaikan langkah sebelumnya terlebih dahulu ya");
                    return;
                  }
                  go(idx);
                }}
                title={!isUnlocked ? "Langkah ini belum terbuka" : label}
              >
                <span className="ic">
                  {!isUnlocked ? "🔒" : isDone ? "✓" : item[1]}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        <main className={step === 5 ? "d" : ""}>
          <section
            className={`card ${step === 8 ? "rcp" : step === 6 ? "thm" : ""}`}
            id="L"
          >
            {step === 0 && (
              <div>
                <div className="ttl">
                  <span className="ti">🧁</span>
                  <div>
                    <h1>Pilih Jenis Kue</h1>
                    <p>Pilih jenis dasar kue atau pastry yang ingin kamu kreasikan, dan beri nama spesial untuk kuemu.</p>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div className="lb">Beri Nama Kue Custom Kamu</div>
                  <input
                    type="text"
                    value={S.customName || ""}
                    onChange={(e) => handleSet("customName", e.target.value)}
                    placeholder="Contoh: Kue Ultah Rina / Choco Kitty Dream..."
                    maxLength={60}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "14px",
                      border: "1.5px solid #D3A29D",
                      background: "#FFFDF9",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "#3B2326",
                      outline: "none",
                    }}
                  />
                </div>

                <div className="lb">Pilihan Jenis Kue &amp; Pastry</div>
                <div className="grid">
                  {BASE_TYPES.map((item) => {
                    const isSelected = (S.itemType || "cake") === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`opt ${isSelected ? "on" : ""}`}
                        style={{ position: "relative" }}
                        onClick={() => {
                          const nextS = {
                            ...S,
                            itemType: item.key,
                            tartVariant: null,
                            cupcakeVariant: null,
                            namaItem: item.label,
                            deco: {},
                            candles: [],
                            items: [],
                            shape: item.key === "cake" ? (S.shape || "round") : "round",
                            fill: item.key === "cake" ? (S.fill || "cream") : null,
                            icing: item.key === "cake" ? (S.icing || "#f6b4c2") : null,
                            flavor: "vanilla",
                            size: S.size || "small",
                          };
                          setS(nextS);
                          setMaxStep(0);
                          snap(nextS);
                        }}
                      >
                        {isSelected && (
                          <span
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: "var(--cherry, #8E2A3E)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </span>
                        )}
                        {renderBaseItemSVG(item.key)}
                        <b>{item.label}</b>
                        <small>{item.desc}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="tip">
                  Pilih bentuk dasar kue atau pastry polos, lalu lanjutkan ke tahap berikutnya untuk mengatur ukuran, rasa, dan dekorasi.
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="ttl">
                  <span className="ti">⤢</span>
                  <div>
                    <h1>{STEP_LABEL_OVERRIDE[S.itemType]?.[1] ? `Pilih ${STEP_LABEL_OVERRIDE[S.itemType][1]}` : "Pilih Ukuran Kue"}</h1>
                    <p>{STEP_DESC_OVERRIDE[S.itemType]?.[1] || "Tentukan ukuran kue sesuai kebutuhanmu."}</p>
                  </div>
                </div>
                <div className="grid">
                  {itemsUkuran.map((item) => {
                    const cfg = (SIZE_CONFIG[S.itemType] || SIZE_CONFIG.cake)[item.kode_visual] || {
                      label: formatNamaItem(item.nama),
                      sub: "Pilihan ukuran",
                    };
                    const isSelected = S.size === item.kode_visual;
                    return (
                      <button
                        key={item.id}
                        className={`opt ${isSelected ? "on" : ""}`}
                        onClick={() => handleSet("size", item.kode_visual)}
                      >
                        {renderSizeIcon(S.itemType, item.kode_visual)}
                        <b>{cfg.label}</b>
                        <small>{cfg.sub}</small>
                        <em>{item.harga ? formatRupiah(item.harga) : "Termasuk"}</em>
                      </button>
                    );
                  })}
                </div>
                <div className="tip">
                  {S.size ? (
                    S.itemType === "cake"
                      ? `Ukuran ${S.size.charAt(0).toUpperCase() + S.size.slice(1)} cocok untuk ${VISUAL_SIZE[S.size]?.s || "keluarga"}.`
                      : `Ukuran atau porsi terpilih cocok untuk pesananmu.`
                  ) : "Pilih salah satu ukuran atau porsi di atas."}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="ttl">
                  <span className="ti">⬡</span>
                  <div>
                    <h1>Pilih Bentuk Kue</h1>
                    <p>Tentukan bentuk kue sesuai dengan keinginanmu.</p>
                  </div>
                </div>
                <div className="grid">
                  {itemsBentuk.map((item) => {
                    const isCustom = item.kode_visual === "custom";
                    const isSelected = S.shape === item.kode_visual;
                    return isCustom ? (
                      <button
                        key={item.id}
                        className={`opt dash ${isSelected ? "on" : ""}`}
                        onClick={() => handleSet("shape", "custom")}
                      >
                        <span className="big">+</span>
                        <b>{item.nama}</b>
                        <small>
                          {item.harga ? `+${formatRupiah(item.harga)}` : "Termasuk"}
                        </small>
                      </button>
                    ) : (
                      <button
                        key={item.id}
                        className={`opt ${isSelected ? "on" : ""}`}
                        onClick={() => handleSet("shape", item.kode_visual)}
                      >
                        {renderShapeSVG(item.kode_visual)}
                        <b>{item.nama}</b>
                        <small>
                          {item.harga ? `+${formatRupiah(item.harga)}` : "Termasuk"}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="ttl">
                  <span className="ti">🎨</span>
                  <div>
                    <h1>{STEP_LABEL_OVERRIDE[S.itemType]?.[3] ? `Pilih ${STEP_LABEL_OVERRIDE[S.itemType][3]}` : "Pilih Rasa dan Isian"}</h1>
                    <p>{STEP_DESC_OVERRIDE[S.itemType]?.[3] || "Rasa sponge, isian tengah, dan warna krim luar."}</p>
                  </div>
                </div>
                <div className="lb">{S.itemType === "cake" ? "Rasa sponge" : "Rasa adonan"}</div>
                <div className="grid">
                  {itemsRasa.map((item) => (
                    <button
                      key={item.id}
                      className={`opt ${S.flavor === item.kode_visual ? "on" : ""}`}
                      onClick={() => handleSet("flavor", item.kode_visual)}
                    >
                      <i
                        className="sw"
                        style={{ background: item.warna || "#fbefd5" }}
                      ></i>
                      <b>{item.nama}</b>
                      <small>
                        {item.harga ? `+${formatRupiah(item.harga)}` : "Termasuk"}
                      </small>
                    </button>
                  ))}
                </div>

                {S.itemType === "cake" && (
                  <>
                    <div className="lb">Isian</div>
                    <div className="grid">
                      {itemsIsian.map((item) => (
                        <button
                          key={item.id}
                          className={`opt ${S.fill === item.kode_visual ? "on" : ""}`}
                          onClick={() => handleSet("fill", item.kode_visual)}
                        >
                          <i
                            className="sw"
                            style={{ background: item.warna || "#fffaf0" }}
                          ></i>
                          <b>{item.nama}</b>
                          <small>
                            {item.harga ? `+${formatRupiah(item.harga)}` : "Termasuk"}
                          </small>
                        </button>
                      ))}
                    </div>

                    <div className="lb">Warna krim</div>
                    <div className="sc">
                      {itemsWarnaKrim.map((item) => {
                        const isSelected =
                          (S.icing || "").toLowerCase() ===
                          (item.warna || "").toLowerCase();
                        return (
                          <button
                            key={item.id}
                            className={`ch ${isSelected ? "on" : ""}`}
                            onClick={() => handleSet("icing", item.warna)}
                          >
                            <i style={{ background: item.warna }}></i>
                            {item.nama}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="ttl">
                  <span className="ti">☆</span>
                  <div>
                    <h1>{STEP_LABEL_OVERRIDE[S.itemType]?.[4] ? `Pilih ${STEP_LABEL_OVERRIDE[S.itemType][4]}` : "Pilih Dekorasi"}</h1>
                    <p>{STEP_DESC_OVERRIDE[S.itemType]?.[4] || "Boleh pilih lebih dari satu."}</p>
                  </div>
                </div>
                <div className="grid">
                  {itemsDekorasi.map((item) => {
                    const isSelected = !!(S.deco && S.deco[item.kode_visual]);
                    const icon = VISUAL_DECO_ICON[item.kode_visual] || "✨";
                    return (
                      <button
                        key={item.id}
                        className={`opt ${isSelected ? "on" : ""}`}
                        onClick={() => handleDecoToggle(item.kode_visual)}
                      >
                        <span className="big">{icon}</span>
                        <b>{item.nama}</b>
                        <small>
                          {item.harga ? `+${formatRupiah(item.harga)}` : "Termasuk"}
                        </small>
                      </button>
                    );
                  })}
                </div>
                <div className="tip">
                  {S.itemType === "cake"
                    ? "Di langkah berikutnya kamu bisa menambah stiker, topper, dan tulisan sendiri."
                    : "Topping terpilih akan langsung tampil menghiasi kue pada tampilan 3D di samping."}
                </div>

                {S.itemType === "cake" && (
                  <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1.5px dashed #EBD5C8" }}>
                    <div className="lb" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>🕯️ Tambah Lilin Kue (Maks. 12)</span>
                      {(S.candles || []).length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearCandles}
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color: "#9E3B42",
                            textDecoration: "underline",
                            cursor: "pointer",
                          }}
                        >
                          Hapus Semua ({S.candles.length})
                        </button>
                      )}
                    </div>

                    <div className="sc" style={{ marginBottom: "10px" }}>
                      <button
                        type="button"
                        className={`ch ${cT === "num" ? "on" : ""}`}
                        onClick={() => setCT("num")}
                      >
                        🔢 Angka (0-9)
                      </button>
                      <button
                        type="button"
                        className={`ch ${cT === "let" ? "on" : ""}`}
                        onClick={() => setCT("let")}
                      >
                        🔤 Huruf (A-Z)
                      </button>
                      <button
                        type="button"
                        className={`ch ${cT === "stick" ? "on" : ""}`}
                        onClick={() => setCT("stick")}
                      >
                        🕯️ Batang
                      </button>
                    </div>

                    <div className="pal" style={{ marginBottom: "12px" }}>
                      {["#ff8fb1", "#f4c35a", "#8fd3ff", "#b8e986", "#d8b4fe", "#ffffff", "#ff6b6b"].map((col) => (
                        <button
                          key={col}
                          type="button"
                          style={{ background: col }}
                          className={cC === col ? "on" : ""}
                          onClick={() => setCC(col)}
                          aria-label={`Warna lilin ${col}`}
                        />
                      ))}
                    </div>

                    {cT === "stick" ? (
                      <button
                        type="button"
                        className="el"
                        style={{ justifyContent: "center", margin: 0 }}
                        onClick={() => handleAddCandle("")}
                      >
                        <span>🕯️</span>
                        <span>+ Tambah Lilin Batang</span>
                      </button>
                    ) : (
                      <div className="sc" style={{ gap: "6px" }}>
                        {(cT === "num"
                          ? ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
                          : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
                        ).map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            className="ch"
                            style={{ minWidth: "38px", justifyContent: "center", fontWeight: 800 }}
                            onClick={() => handleAddCandle(ch)}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    )}

                    {(S.candles || []).length > 0 && (
                      <div style={{ marginTop: "12px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#7A5E60", marginBottom: "6px" }}>
                          Lilin terpasang ({S.candles.length}/12) · Geser lilin di kue 3D untuk atur posisi:
                        </div>
                        <div className="sc">
                          {S.candles.map((cand) => (
                            <button
                              key={cand.id}
                              type="button"
                              className="ch on"
                              onClick={() => handleDeleteCandle(cand.id)}
                              title="Klik untuk hapus lilin"
                            >
                              <i style={{ background: cand.col }} />
                              <span>{cand.t === "stick" ? "Batang" : cand.c}</span>
                              <span style={{ marginLeft: "4px", opacity: 0.75 }}>✕</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="hd2">✨ Tambah Elemen</div>
                <p className="sub2">Pilih elemen untuk menghiasi kue kamu</p>
                <button className="el" onClick={handleAddText}>
                  <span>T</span>
                  <span>Teks</span>
                </button>

                {itemsStiker.map((item, idx) => {
                  const visual =
                    VISUAL_ELS[item.kode_visual] ||
                    VISUAL_ELS[item.nama.toLowerCase()] || {
                      icon: "✨",
                      emos: ["✨", "⭐", "🎉"],
                    };
                  return (
                    <div key={item.id}>
                      <button
                        className={`el ${openC === idx ? "on" : ""}`}
                        onClick={() => setOpenC(openC === idx ? -1 : idx)}
                      >
                        <span>{visual.icon}</span>
                        <span>{item.nama}</span>
                        <small style={{ marginLeft: "auto", fontSize: "12px", opacity: 0.8 }}>
                          {item.harga ? `+${formatRupiah(item.harga)}` : "Termasuk"}
                        </small>
                      </button>
                      {openC === idx && (
                        <div className="ep">
                          {visual.emos.map((emo, eIdx) => (
                            <button
                              key={eIdx}
                              onClick={() =>
                                handleAddEmoji(item.kode_visual, item.nama, emo)
                              }
                              aria-label={`Tambah ${emo}`}
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="hd2" style={{ marginTop: "12px" }}>
                  Warna
                </div>
                <p className="sub2">
                  {selItem && selItem.t === "text"
                    ? "untuk teks terpilih"
                    : "untuk krim kue"}
                </p>
                <div className="pal">
                  {PAL.map((c) => {
                    const isPalOn =
                      selItem && selItem.t === "text"
                        ? selItem.color === c
                        : S.icing === c;
                    return (
                      <button
                        key={c}
                        style={{ background: c }}
                        className={isPalOn ? "on" : ""}
                        onClick={() => {
                          if (selItem && selItem.t === "text") {
                            handleItemProp("color", c);
                          } else {
                            handleSet("icing", c);
                          }
                        }}
                        aria-label={`Warna ${c}`}
                      ></button>
                    );
                  })}
                </div>

                <label
                  className="el"
                  style={{ margin: "14px 0 0", justifyContent: "center" }}
                >
                  <span>☁️</span>
                  <span>Upload Gambar</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    hidden
                    onChange={handleUploadImg}
                  />
                </label>
                <p
                  className="sub2"
                  style={{ textAlign: "center", marginTop: "6px" }}
                >
                  Format: PNG, JPG (maks 2 MB)
                </p>
              </div>
            )}

            {step === 6 && (
              <div>
                <div className="ttl">
                  <span className="ti">🧾</span>
                  <div>
                    <h1>Rincian Bahan Kue</h1>
                    <p>
                      {mode === "tpl" && tplI !== null
                        ? `Template ${TPL[tplI].n} siap dipesan.`
                        : "Cek lagi rincian bahan dan komposisi kue sebelum lanjut ke pengambilan."}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div className="lb">Nama Kue Custom Kamu</div>
                  <input
                    type="text"
                    value={S.customName || ""}
                    onChange={(e) => handleSet("customName", e.target.value)}
                    placeholder="Contoh: Kue Ultah Rina / Choco Kitty Dream..."
                    maxLength={60}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "14px",
                      border: "1.5px solid #D3A29D",
                      background: "#FFFDF9",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "#3B2326",
                      outline: "none",
                    }}
                  />
                </div>

                <div className="rcpw">
                  <span
                    className="stk"
                    style={{
                      left: "-26px",
                      top: "-20px",
                      transform: "rotate(-10deg)",
                    }}
                  >
                    🎂
                  </span>
                  <span
                    className="stk"
                    style={{
                      right: "-22px",
                      bottom: "40px",
                      transform: "rotate(8deg)",
                    }}
                  >
                    🍒
                  </span>
                  <div className="rc">
                    <h2>RINCIAN BAHAN KUE</h2>
                    <div className="s">CEK LAGI KOMPOSISI BAHAN KUE SEBELUM LANJUT!</div>
                    <div className="st2">
                      {pengaturan?.nama_toko
                        ? pengaturan.nama_toko.toUpperCase()
                        : "CRAVELY BAKERY"}
                    </div>
                    <div className="ast">{"*".repeat(32)}</div>
                    <div className="dt">TANGGAL: {todayFormatted.toUpperCase()}</div>
                    {(S.customName || "").trim() && (
                      <div className="dt" style={{ fontWeight: 700, color: "#9E3B42" }}>
                        NAMA KUE: {(S.customName || "").trim().toUpperCase()}
                      </div>
                    )}
                    <div className="ast">{"*".repeat(32)}</div>

                    {getLineItems().map((line, lIdx) => (
                      <div key={lIdx} className="rl">
                        <span>{line[0]}</span>
                        <span>
                          {line[3] ? "Termasuk" : formatRupiah(line[1])}
                        </span>
                      </div>
                    ))}

                    <div className="dbl"></div>
                    <div className="tt">
                      <span>TOTAL KUE:</span>
                      <span>{formatRupiah(rincianHarga.total_kue)}</span>
                    </div>
                    <div className="s" style={{ marginTop: "6px" }}>
                      *belum termasuk ongkir
                    </div>
                    {renderBarcodeSVG(orderCode)}
                    <div className="s">{orderCode || "KUE-BARU"}</div>
                  </div>
                </div>
                <p className="hint2">
                  {mode === "tpl"
                    ? "Template tidak bisa diubah. Mau atur sendiri? Kembali ke Jenis Kue dan pilih Custom Sendiri."
                    : "Pastikan semua pilihan bahan dan dekorasi sudah sesuai sebelum lanjut."}
                </p>
              </div>
            )}

            {step === 7 && (
              <div>
                <div className="ttl">
                  <span className="ti">🚚</span>
                  <div>
                    <h1>Pengambilan dan Pembayaran</h1>
                    <p>
                      Pilih cara kue sampai ke tanganmu, isi data pemesan, lalu
                      pilih cara bayar.
                    </p>
                  </div>
                </div>
                <div className="g2c">
                  <button
                    className={`mode ${S.pick === "pickup" ? "on" : ""}`}
                    onClick={() => handleSet("pick", "pickup")}
                  >
                    <span className="mi">🏪</span>
                    <b>Ambil di toko</b>
                    <span>Gratis · ambil langsung di toko kami</span>
                  </button>
                  <button
                    className={`mode ${S.pick === "delivery" ? "on" : ""}`}
                    onClick={() => handleSet("pick", "delivery")}
                  >
                    <span className="mi">🚚</span>
                    <b>Diantar</b>
                    <span>
                      {daftarZona.length > 0
                        ? `+${formatRupiah(getOngkir())} · diantar sampai rumah`
                        : "Diantar sampai rumah"}
                    </span>
                  </button>
                </div>

                <div className="g2">
                  <label className="fl">
                    Nama Pemesan *
                    <input
                      placeholder="Nama lengkap"
                      value={S.f.nm || ""}
                      onChange={(e) => handleFieldChange("nm", e.target.value)}
                    />
                  </label>
                  <label className="fl">
                    No. WhatsApp *
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={15}
                      placeholder="08xxxxxxxxxx"
                      value={S.f.ph || ""}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        handleFieldChange("ph", digitsOnly);
                      }}
                    />
                  </label>
                </div>

                <div className="g2">
                  <label className="fl">
                    Email
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={S.f.em || ""}
                      onChange={(e) => handleFieldChange("em", e.target.value)}
                    />
                  </label>
                  <label className="fl">
                    Tanggal Pengambilan/Pengantaran *
                    <input
                      type="date"
                      min={ketersediaan?.tanggal_minimal || ""}
                      value={S.f.dt || ""}
                      onChange={handleDateChange}
                    />
                  </label>
                </div>

                <div className="g2">
                  <label className="fl">
                    Jam Pengambilan/Pengantaran *
                    <select
                      value={S.f.tm || ""}
                      onChange={(e) => handleFieldChange("tm", e.target.value)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid #f0d5db",
                        background: "#fff",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#4a2d36",
                      }}
                    >
                      <option value="">-- Pilih Jam Pengambilan --</option>
                      {daftarJam.map((jam) => (
                        <option key={jam} value={jam}>
                          {jam} WIB
                        </option>
                      ))}
                    </select>
                  </label>
                  {S.pick === "delivery" && daftarZona.length > 0 && (
                    <label className="fl">
                      Area Pengantaran (Zona) *
                      <select
                        value={
                          S.zonaId || (daftarZona[0] ? daftarZona[0].id : "")
                        }
                        onChange={(e) =>
                          handleSet("zonaId", Number(e.target.value))
                        }
                        style={{
                          padding: "10px 14px",
                          borderRadius: "12px",
                          border: "1.5px solid #f0d5db",
                          background: "#fff",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#4a2d36",
                        }}
                      >
                        {daftarZona.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.nama} (+{formatRupiah(z.tarif)})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                {S.pick === "delivery" && (
                  <div style={{ marginTop: "10px" }}>
                    <label className="fl">
                      Alamat Lengkap Pengantaran *
                      <input
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                        value={S.f.addr || ""}
                        onChange={(e) =>
                          handleFieldChange("addr", e.target.value)
                        }
                      />
                    </label>
                  </div>
                )}

                <div className="lb">Skema Pembayaran</div>
                <div className="g2c" style={{ marginBottom: "14px" }}>
                  <button
                    type="button"
                    className={`mode ${isDpActive ? "on" : ""}`}
                    onClick={() => handleSet("payScheme", "dp")}
                  >
                    <span className="mi">🪙</span>
                    <b>Uang Muka (DP {persenDp}%)</b>
                    <span>
                      Bayar {formatRupiah(jumlahDpSekarang)} sekarang · sisa{" "}
                      {formatRupiah(sisaPelunasan)} saat siap
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`mode ${!isDpActive ? "on" : ""}`}
                    onClick={() => handleSet("payScheme", "lunas")}
                  >
                    <span className="mi">💳</span>
                    <b>Bayar Penuh (100%)</b>
                    <span>
                      Langsung bayar {formatRupiah(totalBiayaPesanan)} sekarang
                      sekaligus
                    </span>
                  </button>
                </div>

                <div className="lb">Metode pembayaran</div>
                <div className="grid">
                  {[
                    ["bank", "🏦", "Transfer Bank"],
                    ["qris", "📱", "QRIS"],
                    ...(S.pick === "pickup"
                      ? [["cash", "💵", "Tunai di Toko"]]
                      : []),
                  ].map(([val, icon, lbl]) => (
                    <button
                      key={val}
                      className={`opt ${S.pay === val ? "on" : ""}`}
                      onClick={() => handleSet("pay", val)}
                    >
                      <span className="big">{icon}</span>
                      <b>{lbl}</b>
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    borderRadius: "16px",
                    background: "#FFFDF7",
                    color: "#3B2326",
                    border: "1.5px dashed #CDBFAA",
                    boxShadow: "0 4px 12px rgba(163, 99, 97, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <b style={{ fontSize: "13px", color: "#A36361" }}>
                      {S.pay === "qris"
                        ? "📌 QRIS Resmi Cravely Bakery"
                        : S.pay === "cash"
                        ? "📌 Pembayaran Tunai di Kasir Toko"
                        : "📌 Rekening Bank Resmi Toko"}
                    </b>
                    {S.pay !== "cash" && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "10px",
                          background: "#F1DBD0",
                          border: "1px solid #D3A29D",
                          color: "#A36361",
                          boxShadow: "0 1px 3px rgba(163, 99, 97, 0.1)",
                        }}
                      >
                        Batas: {pengaturan?.batas_bayar_jam || 24} Jam
                      </span>
                    )}
                  </div>
                  {S.pay === "bank" && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#3B2326",
                        lineHeight: "1.6",
                      }}
                    >
                      <div>
                        Bank: <b>{pengaturan?.nama_bank || "BCA"}</b>
                      </div>
                      <div>
                        No. Rekening:{" "}
                        <b style={{ letterSpacing: "1px", color: "#A36361" }}>
                          {pengaturan?.no_rekening || "1234567890"}
                        </b>
                      </div>
                      <div>
                        Atas Nama: <b>{pengaturan?.atas_nama || "Cravely Bakery"}</b>
                      </div>
                    </div>
                  )}
                  {S.pay === "qris" && (
                    <div style={{ textAlign: "center", margin: "8px 0" }}>
                      {pengaturan?.gambar_qris ? (
                        <>
                          <img
                            src={pengaturan.gambar_qris}
                            alt="QRIS Toko"
                            style={{
                              width: "150px",
                              height: "150px",
                              objectFit: "contain",
                              background: "#ffffff",
                              padding: "6px",
                              borderRadius: "12px",
                              display: "inline-block",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                            }}
                          />
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#e0d5b8",
                              marginTop: "4px",
                            }}
                          >
                            Scan QRIS dari BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay
                          </div>
                        </>
                      ) : (
                        <div
                          style={{
                            fontSize: "12.5px",
                            color: "#ffffff",
                            padding: "4px 0",
                            textAlign: "left",
                          }}
                        >
                          Mendukung semua aplikasi e-wallet & m-banking. Barcode QRIS resmi akan tampil di tiket rincian pesanan Anda.
                        </div>
                      )}
                    </div>
                  )}
                  {S.pay === "cash" && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#ffffff",
                        lineHeight: "1.6",
                      }}
                    >
                      <div>
                        Lokasi Kasir: <b>{pengaturan?.alamat || "Toko Cravely Bakery"}</b>
                      </div>
                      <div>
                        Metode: <b>Bayar tunai di kasir saat mengambil kue</b>
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "11.5px",
                      color: "#7A5E60",
                      marginTop: "8px",
                      fontWeight: 600,
                    }}
                  >
                    {isDpActive
                      ? `* Cukup bayar DP ${formatRupiah(jumlahDpSekarang)} agar pesanan langsung masuk jadwal dapur. Sisa ${formatRupiah(sisaPelunasan)} saat siap.`
                      : `* Silakan transfer senilai ${formatRupiah(totalBiayaPesanan)} untuk pelunasan langsung.`}
                  </div>
                </div>

                <label className="fl" style={{ marginTop: "14px" }}>
                  Catatan tambahan (opsional)
                  <textarea
                    placeholder="Pesan khusus untuk dapur kami"
                    value={S.f.notes || ""}
                    onChange={(e) =>
                      handleFieldChange("notes", e.target.value)
                    }
                  ></textarea>
                </label>
                <div className="tip">
                  Pesanan custom butuh waktu pembuatan minimal{" "}
                  {pengaturan?.minimal_hari_pesan || 2} hari. Silakan pilih
                  tanggal sesuai ketersediaan.
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="pp">
                <div className="note">
                  made
                  <br />
                  with love ♡
                </div>
                <div className="tul">🌷🎀</div>
                <div className="bub">Pesanan</div>
                <div className="thx">Terima kasih banyak!</div>
                <div className="rib">cek lagi pesananmu sebelum dikirim ♡</div>

                <div className="pr">
                  <div className="pf">
                    No. Pesanan : <span className="dots">(Otomatis saat dikirim)</span>
                  </div>
                  <div className="pf">
                    Tanggal : <span className="dots">{todayFormatted}</span>
                  </div>
                </div>

                <div className="pf" style={{ marginTop: "12px" }}>
                  ♡ Nama Pelanggan :{" "}
                  <span className="dots">{S.f.nm || "-"}</span>
                </div>
                <div className="pf" style={{ marginTop: "6px" }}>
                  ♡ Kontak WhatsApp :{" "}
                  <span className="dots">{S.f.ph || "-"}</span>
                </div>
                <div className="pf" style={{ marginTop: "6px" }}>
                  ♡ Pengambilan :{" "}
                  <span className="dots">
                    {S.pick === "delivery"
                      ? `Diantar ke: ${S.f.addr || "-"}`
                      : "Ambil di Toko"}
                  </span>
                </div>
                <div className="pf" style={{ marginTop: "6px" }}>
                  ♡ Waktu Diambil :{" "}
                  <span className="dots">
                    {S.f.dt
                      ? `${formatTanggalIndonesia(S.f.dt)}, jam ${S.f.tm || "-"}`
                      : "-"}
                  </span>
                </div>

                <div className="tb">
                  <div className="tr h">
                    <span>No.</span>
                    <span>Item / Deskripsi</span>
                    <span>Qty</span>
                    <span>Harga Satuan</span>
                    <span>Jumlah (Rp)</span>
                  </div>
                  {(() => {
                    const rows = getLineItems().map((l) => [l[0], l[1]]);
                    if (S.pick === "delivery") {
                      rows.push(["ongkir antar", getOngkir()]);
                    }
                    return rows.map((r, i) => (
                      <div key={i} className="tr">
                        <span>{i + 1}</span>
                        <span className="ds">{r[0]}</span>
                        <span>1</span>
                        <span className="rt">
                          {r[1] > 0 ? (
                            formatRupiah(r[1])
                          ) : (
                            <span style={{ color: "#ADB697", fontWeight: 700 }}>
                              Termasuk
                            </span>
                          )}
                        </span>
                        <span className="rt">
                          {r[1] > 0 ? (
                            formatRupiah(r[1])
                          ) : (
                            <span style={{ color: "#ADB697", fontWeight: 700 }}>
                              Termasuk
                            </span>
                          )}
                        </span>
                      </div>
                    ));
                  })()}
                  <div className="tr tot-row tl">
                    <span className="tot-lbl">Total Pesanan</span>
                    <span className="tot-val rt">
                      <b>{formatRupiah(totalBiayaPesanan)}</b>
                    </span>
                  </div>
                  {isDpActive && (
                    <>
                      <div className="tr dp-row">
                        <span className="dp-lbl">Wajib DP ({persenDp}%)</span>
                        <span className="dp-val rt">
                          <b>{formatRupiah(jumlahDpSekarang)}</b>
                        </span>
                      </div>
                      <div className="tr sisa-row">
                        <span className="sisa-lbl">Sisa Pelunasan (saat siap)</span>
                        <span className="sisa-val rt">
                          <span>{formatRupiah(sisaPelunasan)}</span>
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pn">
                  <div className="bx">
                    <i className="tag">Skema & Pembayaran</i>
                    <div
                      style={{
                        fontWeight: 800,
                        color: "#A36361",
                        marginBottom: "8px",
                        fontSize: "14px",
                      }}
                    >
                      {isDpActive
                        ? `Uang Muka (DP ${persenDp}%)`
                        : "Bayar Penuh (Lunas 100%)"}
                    </div>
                    <div
                      className="cb"
                      style={{
                        color: S.pay === "bank" ? "#A36361" : "#7A5E60",
                        fontWeight: S.pay === "bank" ? 800 : 600,
                      }}
                    >
                      {S.pay === "bank" ? "☑" : "☐"} Transfer Bank 🏦 (
                      {pengaturan?.nama_bank || "BCA"})
                    </div>
                    <div
                      className="cb"
                      style={{
                        color: S.pay === "qris" ? "#A36361" : "#7A5E60",
                        fontWeight: S.pay === "qris" ? 800 : 600,
                      }}
                    >
                      {S.pay === "qris" ? "☑" : "☐"} QRIS 📱 (Semua E-Wallet & Bank)
                    </div>
                    {S.pick === "pickup" && (
                      <div
                        className="cb"
                        style={{
                          color: S.pay === "cash" ? "#A36361" : "#7A5E60",
                          fontWeight: S.pay === "cash" ? 800 : 600,
                        }}
                      >
                        {S.pay === "cash" ? "☑" : "☐"} Tunai di Toko 💵
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: "10px",
                        paddingTop: "8px",
                        borderTop: "1.5px dashed #CDBFAA",
                        fontSize: "12px",
                        color: "#3B2326",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Bayar Sekarang:</span>
                      <b style={{ fontSize: "14px", color: "#A36361" }}>
                        {formatRupiah(jumlahDpSekarang)}
                      </b>
                    </div>
                  </div>

                  <div className="bx">
                    <i className="tag">Catatan</i>
                    <div
                      style={{
                        fontSize: "12.5px",
                        color: "#3B2326",
                        lineHeight: "1.5",
                      }}
                    >
                      <div>
                        <b>Pengambilan:</b>{" "}
                        {S.pick === "delivery"
                          ? `Diantar (${S.f.addr || "-"})`
                          : "Ambil di Toko"}
                      </div>
                      <div style={{ marginTop: "4px" }}>
                        <b>Dibutuhkan:</b>{" "}
                        {S.f.dt
                          ? `${formatTanggalIndonesia(S.f.dt)}, jam ${
                              S.f.tm || "-"
                            }`
                          : "-"}
                      </div>
                      {S.f.notes && (
                        <div
                          style={{
                            marginTop: "4px",
                            fontStyle: "italic",
                            color: "#7A5E60",
                          }}
                        >
                          &ldquo;{S.f.notes}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ty">Terima kasih!</div>
                <p className="ap">Kami menghargai dukunganmu ♡</p>
                <span className="cup">☕</span>
                <span className="fl2">🌸</span>
              </div>
            )}
          </section>

          <section id="V" ref={vboxContainerRef}>
            <div
              className={`vbox ${isStudioView || isFullscreen ? "studio-mode" : ""}`}
              ref={vboxRef}
              id="vbox"
            >
              {hasWebGL ? (
                <canvas
                  ref={canvasRef}
                  id="cv"
                  aria-label="Pratinjau kue 3D"
                ></canvas>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                  }}
                >
                  <PreviewKue
                    pilihan={getPilihanItemsList().map((p) => {
                      const it = daftarItem.find((x) => x.id === p.id_item);
                      const gr = daftarGrup.find((g) => g.id === it?.id_grup);
                      return {
                        peran_visual: gr ? gr.peran_visual : null,
                        kode_visual: it ? it.kode_visual : "",
                        warna: it ? it.warna : "",
                        nama_item: it ? it.nama : "",
                      };
                    })}
                    tulisan={(S.items || [])
                      .filter((i) => i.t === "text" && i.text)
                      .map((i) => i.text)
                      .join(" / ")}
                  />
                </div>
              )}

              {hasWebGL && (isStudioView || isFullscreen) && (
                <div className="hud">
                  <b>{formatRupiah(selectedTemplate?.price || rincianHarga?.total_kue || rincianHarga?.total_bayar || 0)}</b>
                  <span>{selectedTemplate ? `${selectedTemplate.n} · Cravely Bakery` : "Custom Cake · Cravely Bakery"}</span>
                </div>
              )}
              {hasWebGL && (isStudioView || isFullscreen) && (
                <button
                  className="hx"
                  onClick={() => {
                    try {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      }
                    } catch (_) {}
                    setIsStudioView(false);
                    threeStateRef.current.isStudio = false;
                    const szData = VISUAL_SIZE[S.size] || { d: 14 };
                    const R = szData.d / 12;
                    threeStateRef.current.th = 0.5;
                    threeStateRef.current.ph = 0.38;
                    threeStateRef.current.dist = R * 2.6 + 3.6;
                  }}
                >
                  ✕ Keluar layar penuh
                </button>
              )}

              <div className="vt">
                {step === 5 ? (
                  <>
                    <div className="col" style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="ib"
                        onClick={handleUndo}
                        disabled={hiRef.current < 1}
                        aria-label="Urungkan"
                        title="Urungkan"
                      >
                        ↶
                      </button>
                      <button
                        className="ib"
                        onClick={handleRedo}
                        disabled={hiRef.current >= histRef.current.length - 1}
                        aria-label="Ulangi"
                        title="Ulangi"
                      >
                        ↷
                      </button>
                      {S.itemType !== "cookies" && (
                        <button
                          className={`ib ${sliced ? "on" : ""}`}
                          onClick={() => {
                            const next = !sliced;
                            setSliced(next);
                            if (next) {
                              threeStateRef.current.th = -0.9;
                              setAutoSpin(false);
                            }
                          }}
                          aria-label="Potong kue"
                          title="Potong kue"
                        >
                          🍰
                        </button>
                      )}
                    </div>
                    {hasWebGL && (
                      <div className="seg">
                        <button
                          className={view2D ? "" : "on"}
                          onClick={() => {
                            setView2D(false);
                            threeStateRef.current.ph = 0.38;
                          }}
                        >
                          3D
                        </button>
                        <button
                          className={view2D ? "on" : ""}
                          onClick={() => {
                            setView2D(true);
                            threeStateRef.current.ph = 1.5;
                            threeStateRef.current.th = 0;
                            setAutoSpin(false);
                          }}
                        >
                          2D
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <span></span>
                    {hasWebGL && (
                      <div className="col">
                        {S.itemType !== "cookies" && (
                          <button
                            type="button"
                            className={`ib ${sliced ? "on" : ""}`}
                            onClick={() => {
                              const next = !sliced;
                              setSliced(next);
                              if (next) {
                                threeStateRef.current.th = -0.9;
                                setAutoSpin(false);
                              }
                            }}
                            aria-label="Potong kue"
                            title="Potong kue"
                          >
                            🍰
                          </button>
                        )}
                        <button
                          type="button"
                          className={`ib ${isStudioView ? "on" : ""}`}
                          onClick={() => {
                            const next = !isStudioView;
                            setIsStudioView(next);
                            threeStateRef.current.isStudio = next;
                            const szData = VISUAL_SIZE[S.size] || { d: 14 };
                            const R = szData.d / 12;
                            if (next) {
                              threeStateRef.current.th = 0;
                              threeStateRef.current.ph = 0.58;
                              threeStateRef.current.dist = 21 + R * 3.5;
                            } else {
                              threeStateRef.current.th = 0.5;
                              threeStateRef.current.ph = 0.38;
                              threeStateRef.current.dist = R * 2.6 + 3.6;
                            }
                          }}
                          aria-label="Studio Dapur"
                          title="Tampilan Studio Dapur"
                        >
                          🏠
                        </button>
                        <button
                          type="button"
                          className="ib"
                          onClick={() => {
                            try {
                              if (document.fullscreenElement) {
                                document.exitFullscreen();
                              } else if (vboxRef.current) {
                                vboxRef.current.requestFullscreen();
                              }
                            } catch (_) {}
                          }}
                          aria-label="Layar penuh"
                          title="Layar penuh (Studio Dapur)"
                        >
                          ⛶
                        </button>
                        <button
                          type="button"
                          className="ib"
                          onClick={() => {
                            const ts = threeStateRef.current;
                            const szData = VISUAL_SIZE[S.size] || { d: 14 };
                            const R = szData.d / 12;
                            if (ts.isStudio) {
                              ts.dist = ts.dist > 18 ? 14 : 21 + R * 3.5;
                            } else {
                              ts.dist =
                                ts.dist > 5 ? 3.8 : (szData.d / 12) * 2.6 + 3.6;
                            }
                          }}
                          aria-label="Zoom"
                          title="Perbesar / Perkecil"
                        >
                          🔍
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                className={`fav ${fav ? "on" : ""}`}
                onClick={() => setFav(!fav)}
                aria-label="Favorit"
              >
                {fav ? "♥" : "♡"}
              </button>

              <div className="pill">
                <button
                  onClick={() => {
                    threeStateRef.current.th -= 0.6;
                    setAutoSpin(false);
                  }}
                  aria-label="Putar kiri"
                >
                  ‹
                </button>
                <button
                  className={autoSpin ? "on" : ""}
                  onClick={() => setAutoSpin(!autoSpin)}
                >
                  ⟳ Putar
                </button>
                <button
                  onClick={() => {
                    threeStateRef.current.th += 0.6;
                    setAutoSpin(false);
                  }}
                  aria-label="Putar kanan"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="under">
              {step === 2 ? (
                <div className="card">
                  <div className="ttl" style={{ marginBottom: "6px" }}>
                    <span
                      className="ti"
                      style={{
                        width: "34px",
                        height: "34px",
                        fontSize: "17px",
                      }}
                    >
                      ✎
                    </span>
                    <div>
                      <h1 style={{ fontSize: "20px" }}>Bentuk Kustom</h1>
                      <p>Gambar bentuk kue sesuai keinginanmu!</p>
                    </div>
                  </div>
                  <div className="shp">
                    <button
                      type="button"
                      className="dcprev"
                      onClick={openShapeModal}
                      aria-label="Buka area gambar layar penuh"
                    >
                      <canvas
                        ref={drawCanvasRef}
                        id="dc"
                        width="300"
                        height="210"
                      ></canvas>
                      <span>✏️ Klik untuk menggambar di layar penuh</span>
                    </button>
                    <div className="tools">
                      <button
                        type="button"
                        className="on"
                        onClick={openShapeModal}
                      >
                        ✏️ Gambar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setS((prev) => {
                            const next = {
                              ...prev,
                              cpts: null,
                              shape: "round",
                            };
                            snap(next);
                            return next;
                          });
                        }}
                      >
                        🗑 Reset
                      </button>
                    </div>
                    <div className="tips">
                      <b>💡 Tips:</b>
                      <br />
                      Kamu bisa menggambar bentuk bebas seperti karakter, logo,
                      atau desain unik lainnya! 🐱
                    </div>
                  </div>
                </div>
              ) : step !== 5 && step !== 6 && step !== 8 ? (
                <div className="card">
                  <h3
                    style={{
                      font: "700 17px 'Baloo 2'",
                      marginBottom: "10px",
                    }}
                  >
                    Ringkasan Pesanan
                  </h3>
                  <div className="sum">
                    {S.itemType && S.itemType !== "cake"
                      ? renderBaseItemSVG(S.itemType)
                      : S.shape === "round" || S.shape === "custom"
                      ? renderCakeSVG(
                          S.size,
                          "#fbefd5",
                          S.icing || "#f6b4c2"
                        )
                      : renderShapeSVG(S.shape)}
                    <div style={{ flex: 1 }}>
                      <h3>
                        {(S.customName || "").trim() ||
                          (S.itemType === "cupcake"
                            ? "Custom Cupcake"
                            : S.itemType === "tart"
                            ? "Custom Kue Pie"
                            : S.itemType === "donut"
                            ? "Custom Donat"
                            : S.itemType === "cookies"
                            ? "Custom Cookies"
                            : "Custom Cake")}
                      </h3>
                      <p>
                        {S.itemType && S.itemType !== "cake"
                          ? `${BASE_TYPES.find((b) => b.key === S.itemType)?.label || "Pastry"} · ${S.size?.toUpperCase() || "MINI"}`
                          : `${S.shape} · ${S.size?.toUpperCase() || "MINI"} (diameter ${VISUAL_SIZE[S.size]?.d || 14} cm)`}
                      </p>
                      <p>
                        {`${S.flavor || "vanilla"} · ${S.fill || "cream"}`}
                      </p>
                    </div>
                    <button
                      className="rv"
                      style={{
                        border: 0,
                        padding: 0,
                        color: "var(--ink)",
                        fontWeight: "800",
                        textDecoration: "underline",
                      }}
                      onClick={() => go(step > 5 ? 6 : step || 1)}
                    >
                      Ubah ✎
                    </button>
                  </div>
                  <div className="tot">
                    <span>Total Harga</span>
                    <span>{formatRupiah(totalBiayaPesanan)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {step === 5 && (
            <section className="card" id="Rp">
              {!selItem ? (
                <div>
                  <div className="hd2">Pengaturan Elemen</div>
                  <div className="tips">
                    Tambahkan teks atau elemen dari menu kiri, lalu klik elemen
                    di daftar untuk mengatur.
                  </div>
                </div>
              ) : selItem.t === "text" ? (
                <div>
                  <div className="hd2">T Pengaturan Teks</div>
                  <textarea
                    maxLength={50}
                    aria-label="Isi teks"
                    value={selItem.text || ""}
                    onChange={(e) => handleItemProp("text", e.target.value)}
                  ></textarea>
                  <div className="cnt">
                    {(selItem.text || "").length} / 50
                  </div>

                  <div className="lb" style={{ marginTop: 0 }}>
                    Font
                  </div>
                  <select
                    value={selItem.font || "Baloo 2"}
                    onChange={(e) => handleItemProp("font", e.target.value)}
                  >
                    {FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>

                  <div className="lb">Ukuran</div>
                  <div className="rng">
                    <input
                      type="range"
                      min="16"
                      max="64"
                      value={selItem.px || 32}
                      onChange={(e) =>
                        handleItemProp("px", Number(e.target.value))
                      }
                    />
                    <span>{selItem.px || 32} px</span>
                  </div>

                  <div className="lb">Warna</div>
                  <input
                    type="color"
                    value={selItem.color || "#5b2a1b"}
                    aria-label="Warna teks"
                    onChange={(e) => handleItemProp("color", e.target.value)}
                  />

                  <div className="lb">Posisi</div>
                  <div className="sg">
                    {[
                      ["left", "⇤ Kiri"],
                      ["center", "≡ Tengah"],
                      ["right", "Kanan ⇥"],
                    ].map(([al, lbl]) => (
                      <button
                        key={al}
                        className={selItem.align === al ? "on" : ""}
                        onClick={() => handleItemProp("align", al)}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>

                  <div className="lb">Efek</div>
                  <div className="sg">
                    {["normal", "shadow", "outline"].map((fx) => (
                      <button
                        key={fx}
                        className={selItem.fx === fx ? "on" : ""}
                        onClick={() => handleItemProp("fx", fx)}
                      >
                        {fx.charAt(0).toUpperCase() + fx.slice(1)}
                      </button>
                    ))}
                  </div>

                  <button
                    className="el"
                    style={{
                      margin: "12px 0 0",
                      justifyContent: "center",
                      color: "#c62828",
                    }}
                    onClick={() => handleDeleteItem(selItem.id)}
                  >
                    🗑 Hapus teks
                  </button>
                </div>
              ) : (
                <div>
                  <div className="hd2">
                    {selItem.e || "🖼️"} Pengaturan Elemen
                  </div>
                  <div className="lb" style={{ marginTop: 0 }}>
                    Ukuran
                  </div>
                  <div className="rng">
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={selItem.sz || 1}
                      onChange={(e) =>
                        handleItemProp("sz", Number(e.target.value))
                      }
                    />
                    <span>{selItem.sz || 1}×</span>
                  </div>

                  <div className="lb">Posisi di atas kue</div>
                  <div className="sg">
                    <button onClick={() => handleNudge(-0.1, 0)}>◀ Kiri</button>
                    <button onClick={() => handleNudge(0, -0.1)}>
                      ▲ Belakang
                    </button>
                    <button onClick={() => handleNudge(0.1, 0)}>Kanan ▶</button>
                    <button onClick={() => handleNudge(0, 0.1)}>▼ Depan</button>
                    <button
                      style={{ gridColumn: "span 2", color: "#c62828" }}
                      onClick={() => handleDeleteItem(selItem.id)}
                    >
                      🗑 Hapus
                    </button>
                  </div>
                </div>
              )}

              {(S.items || []).length > 0 && (
                <>
                  <div className="lb">Elemen di kue</div>
                  <div className="sc">
                    {S.items.map((i) => (
                      <button
                        key={i.id}
                        className={`ch ${i.id === S.sel ? "on" : ""}`}
                        onClick={() => handleSet("sel", i.id)}
                      >
                        {i.t === "text"
                          ? "T " + (i.text || "").slice(0, 8)
                          : i.e || "🖼️"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </main>

        <footer>
          <button
            className="btn prv"
            style={{
              visibility:
                getActiveSteps(S.itemType).indexOf(step) > 0
                  ? "visible"
                  : "hidden",
            }}
            onClick={handlePrev}
          >
            ‹ {getActiveSteps(S.itemType).indexOf(step) > 1 ? "Kembali" : "Sebelumnya"}
          </button>

          <div className="fr">
            <div style={{ textAlign: "right" }}>
              <b style={{ display: "block", fontSize: "16px" }}>
                {formatRupiah(isDpActive ? jumlahDpSekarang : totalBiayaPesanan)}
              </b>
              {isDpActive ? (
                <small
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "var(--mut, #8E6573)",
                    fontWeight: 700,
                  }}
                >
                  DP {persenDp}% · Total {formatRupiah(totalBiayaPesanan)}
                </small>
              ) : null}
            </div>
            <button
              className="btn nxt"
              disabled={sedangKirim}
              onClick={handleNext}
            >
              {sedangKirim
                ? "Menyimpan..."
                : step === 6
                ? "🛒 Masukkan ke Keranjang"
                : "Selanjutnya ›"}
            </button>
          </div>
        </footer>
      </div>

            {showShapeModal && (
        <div className="ov" id="ov">
          <div className="ovl">
            <div id="ovPrev" ref={ovPrevRef}></div>
          </div>
          <div className="ovr">
            <div className="ovtop">
              <div className="ovh">Kanvas Bentuk Kue</div>
              <p className="ovsub">
                Gambar satu garis tertutup di kanvas. Garis akan dihaluskan dan
                disesuaikan otomatis dengan ukuran kue.
              </p>
              <div className="ovsec">Pilih titik awal:</div>
              <div className="sc" id="ovPre">
                {Object.entries(PRENM).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="ch"
                    onClick={() => handleSelectPreset(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="dcw">
              <canvas
                id="dc2"
                ref={dc2Ref}
                onPointerDown={onModalPointerDown}
                onPointerMove={onModalPointerMove}
                onPointerUp={onModalPointerUp}
                onPointerCancel={onModalPointerUp}
              />
            </div>
            <div className="ovft">
              <div className="ovact">
                <button
                  type="button"
                  className="btn sec"
                  id="ovUndo"
                  onClick={handleModalUndo}
                  disabled={cstkRef.current.length === 0}
                >
                  ↶ Urungkan
                </button>
                <button
                  type="button"
                  className="btn sec"
                  id="ovClear"
                  onClick={handleModalClear}
                >
                  Mulai Ulang
                </button>
              </div>
              <div className="ovact">
                <button
                  type="button"
                  className="btn sec"
                  id="ovCancel"
                  onClick={() => closeShapeModal(false)}
                >
                  Batal (Esc)
                </button>
                <button
                  type="button"
                  className="btn pri"
                  id="ovOk"
                  onClick={() => closeShapeModal(true)}
                >
                  Selesai Menggambar ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PortalLedge />

      {pendingLeaveHref && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(42, 22, 18, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setPendingLeaveHref(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#FFFDF9",
              border: "2px solid #D3A29D",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(42, 22, 18, 0.25)",
              color: "#3B2326",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>⚠️</div>
            <h3
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "20px",
                fontWeight: 800,
                marginBottom: "8px",
                color: "#3B2326",
              }}
            >
              Keluar dari Cake Studio?
            </h3>
            <p
              style={{
                fontSize: "13.5px",
                lineHeight: 1.55,
                color: "#6E5255",
                marginBottom: "20px",
              }}
            >
              Desain kue kustom yang sedang dibuat belum dimasukkan ke keranjang.
              Jika Anda keluar sekarang, seluruh desain akan ter-reset dan tidak
              disimpan sebagai draft.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn sec"
                onClick={() => setPendingLeaveHref(null)}
              >
                Lanjut Desain
              </button>
              <button
                type="button"
                className="btn pri"
                onClick={() => {
                  const target = pendingLeaveHref;
                  setPendingLeaveHref(null);
                  allowLeaveRef.current = true;
                  router.push(target);
                }}
              >
                Keluar &amp; Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toastShow ? "show" : ""}`}>{toastMsg}</div>
      </div>
    </>
  );
}
