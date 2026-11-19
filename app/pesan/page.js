"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as THREE from "three";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import "./cakecraft.css";

const SZ = {
  mini: { d: 10, p: 85000, s: "1–2 orang" },
  small: { d: 14, p: 125000, s: "3–5 orang" },
  medium: { d: 18, p: 165000, s: "6–10 orang" },
  large: { d: 22, p: 210000, s: "10–15 orang" },
};

const SHP = {
  round: ["Lingkaran", 0],
  square: ["Kotak", 0],
  heart: ["Hati", 10000],
  star: ["Bintang", 15000],
  hex: ["Hexagon", 10000],
  custom: ["Buat Sendiri", 25000],
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

const ICE = [
  ["Pink", "#f6b4c2"],
  ["Putih", "#FFF8F0"],
  ["Cokelat", "#6b3d2a"],
  ["Mint", "#bfe8d8"],
  ["Kuning", "#fbe39a"],
  ["Lavender", "#d8c7f0"],
];

const DECO = {
  drip: ["🍫", "Lelehan krim", 12000],
  straw: ["🍓", "Stroberi", 10000],
  berry: ["🫐", "Mixed berry", 15000],
  flower: ["🌸", "Bunga gula", 8000],
  spr: ["✨", "Taburan", 5000],
  candle: ["🕯️", "Lilin", 3000],
};

const ELS = [
  ["Stiker", "😊", ["❤️", "💗", "⭐", "🌈", "😊"], 3000],
  ["Topper", "⭐", ["🐰", "🐻", "🦄", "🎀", "👑"], 8000],
  ["Bunga", "🌸", ["🌸", "🌼", "🌷", "🌹"], 2000],
  ["Buah", "🍎", ["🍓", "🍒", "🍑", "🫐", "🍋"], 2500],
  ["Cokelat", "🍫", ["🍫", "🍪", "🍩", "🍬", "🍭"], 3000],
  ["Lainnya", "•••", ["🎈", "✨", "🎉", "🧁"], 2000],
];

const ELP = {
  Stiker: 3000,
  Topper: 8000,
  Bunga: 2000,
  Buah: 2500,
  Cokelat: 3000,
  Lainnya: 2000,
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
  ["Jenis Kue", "🎂"],
  ["Ukuran", "⤢"],
  ["Bentuk", "⬡"],
  ["Rasa", "🎨"],
  ["Dekorasi", "☆"],
  ["Custom Desain", "✎"],
  ["Review Kue", "🧾"],
  ["Pengambilan", "🚚"],
  ["Review Pesanan", "💌"],
];

const TPL = [
  {
    n: "Strawberry Dream",
    d: "Vanilla, selai stroberi, stroberi segar",
    s: { size: "small", fill: "jam" },
  },
  {
    n: "Choco Berry",
    d: "Cokelat, ganache, mixed berry",
    s: {
      size: "medium",
      flavor: "choco",
      fill: "ganache",
      icing: "#6b3d2a",
      deco: { drip: true, berry: true },
    },
  },
  {
    n: "Velvet Love",
    d: "Kue hati red velvet, cream cheese",
    s: {
      shape: "heart",
      size: "small",
      flavor: "velvet",
      fill: "cheese",
      icing: "#FFF8F0",
      deco: { flower: true, drip: true },
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
    deco: { drip: true, straw: true },
    items: [
      {
        id: 1,
        t: "text",
        text: "Happy Birthday!",
        font: "Baloo 2",
        px: 32,
        color: "#5b2a1b",
        align: "center",
        fx: "normal",
      },
    ],
    sel: 1,
    cpts: null,
    pick: "pickup",
    pay: "bank",
    f: {},
  };
}

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

function calcBase(s) {
  const szPrice = SZ[s.size] ? SZ[s.size].p : 85000;
  const shpPrice = SHP[s.shape] ? SHP[s.shape][1] : 0;
  const flavPrice = FLAV[s.flavor] ? FLAV[s.flavor][1] : 0;
  const fillPrice = FILL[s.fill] ? FILL[s.fill][1] : 0;
  const decoPrice = Object.keys(s.deco || {})
    .filter((k) => s.deco[k])
    .reduce((a, k) => a + (DECO[k] ? DECO[k][2] : 0), 0);
  const itemsPrice = (s.items || []).reduce(
    (a, i) =>
      a +
      (i.t === "text"
        ? 0
        : i.t === "img"
        ? 15000
        : ELP[i.k] || 2000),
    0
  );
  return szPrice + shpPrice + flavPrice + fillPrice + decoPrice + itemsPrice;
}

function calcTotal(s) {
  return calcBase(s) + (s.pick === "delivery" ? 15000 : 0);
}

export default function PesanPage() {
  const router = useRouter();

  const [S, setS] = useState(getDefState);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("custom");
  const [tplI, setTplI] = useState(null);
  const [cartCount, setCartCount] = useState(1);
  const [openC, setOpenC] = useState(-1);
  const [tool, setTool] = useState("draw");
  const [fav, setFav] = useState(false);
  const [autoSpin, setAutoSpin] = useState(true);
  const [view2D, setView2D] = useState(false);

  const [user, setUser] = useState(null);
  const [profil, setProfil] = useState(null);
  const [pengaturan, setPengaturan] = useState(null);
  const [daftarGrup, setDaftarGrup] = useState([]);
  const [daftarItem, setDaftarItem] = useState([]);
  const [daftarZona, setDaftarZona] = useState([]);

  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const [sedangKirim, setSedangKirim] = useState(false);

  const [orderCode] = useState(() => {
    return (
      "CC-" +
      new Date().toISOString().slice(2, 10).replace(/-/g, "") +
      "-" +
      Math.floor(1000 + Math.random() * 9000)
    );
  });

  const canvasRef = useRef(null);
  const vboxRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const drawingRef = useRef(false);
  const drawStrokeRef = useRef([]);

  const threeStateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    root: null,
    cake: null,
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

  const snap = useCallback((stateToSnap) => {
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
  }, [S]);

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
    async function loadInitial() {
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

      const saved = sessionStorage.getItem("cravely_custom_draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) setS(parsed);
        } catch {}
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    snap(S);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("cravely_custom_draft", JSON.stringify(S));
    } catch {}
  }, [S]);

  const selItem = (S.items || []).find((i) => i.id === S.sel);

  useEffect(() => {
    const cv = canvasRef.current;
    const box = vboxRef.current;
    if (!cv || !box) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: cv,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xf8c9d4, 0.95));
    const dl = new THREE.DirectionalLight(0xffffff, 0.85);
    dl.position.set(3, 6, 5);
    scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xffd6e0, 0.35);
    dl2.position.set(-4, 2, -3);
    scene.add(dl2);

    const root = new THREE.Group();
    const cake = new THREE.Group();
    scene.add(root);
    root.add(cake);

    threeStateRef.current.renderer = renderer;
    threeStateRef.current.scene = scene;
    threeStateRef.current.camera = camera;
    threeStateRef.current.root = root;
    threeStateRef.current.cake = cake;

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

    let start = performance.now();
    function animate(t) {
      threeStateRef.current.reqId = requestAnimationFrame(animate);
      const ts = threeStateRef.current;
      if (autoSpin && !ts.dragging) {
        ts.th += 0.006;
      }
      root.rotation.y = ts.th;
      camera.position.set(
        0,
        0.5 + ts.dist * Math.sin(ts.ph),
        ts.dist * Math.cos(ts.ph)
      );
      camera.lookAt(0, 0.4, 0);

      if (ts.flame) {
        const elapsed = (t - start) * 0.001;
        ts.flame.scale.set(
          1 + Math.sin(elapsed * 20) * 0.12,
          1.6 + Math.sin(elapsed * 31) * 0.2,
          1
        );
      }
      renderer.render(scene, camera);
    }
    threeStateRef.current.reqId = requestAnimationFrame(animate);

    function onPointerDown(e) {
      cv.setPointerCapture(e.pointerId);
      threeStateRef.current.pts.set(e.pointerId, [e.clientX, e.clientY]);
      threeStateRef.current.dragging = true;
      if (threeStateRef.current.pts.size === 2) {
        const [a, b] = [...threeStateRef.current.pts.values()];
        threeStateRef.current.pd = Math.hypot(a[0] - b[0], a[1] - b[1]);
      }
    }

    function onPointerMove(e) {
      const ts = threeStateRef.current;
      if (!ts.pts.has(e.pointerId)) return;
      const o = ts.pts.get(e.pointerId);
      if (ts.pts.size === 1) {
        ts.th += (e.clientX - o[0]) * 0.01;
        ts.ph = Math.max(0.05, Math.min(1.5, ts.ph + (e.clientY - o[1]) * 0.006));
      }
      ts.pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (ts.pts.size === 2) {
        const [a, b] = [...ts.pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        ts.dist = Math.max(3.4, Math.min(11, (ts.dist * ts.pd) / (d || 1)));
        ts.pd = d;
      }
    }

    function onPointerUp(e) {
      const ts = threeStateRef.current;
      ts.pts.delete(e.pointerId);
      if (!ts.pts.size) ts.dragging = false;
    }

    function onWheel(e) {
      e.preventDefault();
      const ts = threeStateRef.current;
      ts.dist = Math.max(3.4, Math.min(11, ts.dist * (1 + e.deltaY * 0.001)));
    }

    cv.addEventListener("pointerdown", onPointerDown);
    cv.addEventListener("pointermove", onPointerMove);
    cv.addEventListener("pointerup", onPointerUp);
    cv.addEventListener("pointercancel", onPointerUp);
    cv.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      ro.disconnect();
      cancelAnimationFrame(threeStateRef.current.reqId);
      cv.removeEventListener("pointerdown", onPointerDown);
      cv.removeEventListener("pointermove", onPointerMove);
      cv.removeEventListener("pointerup", onPointerUp);
      cv.removeEventListener("pointercancel", onPointerUp);
      cv.removeEventListener("wheel", onWheel);
      renderer.dispose();
    };
  }, []);

  const buildCake = useCallback(() => {
    const ts = threeStateRef.current;
    const cake = ts.cake;
    if (!cake) return;

    while (cake.children.length) {
      const c = cake.children[0];
      cake.remove(c);
      c.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map && !o.isSprite) o.material.map.dispose();
          o.material.dispose();
        }
      });
    }

    ts.flame = null;
    const R = (SZ[S.size] ? SZ[S.size].d : 10) / 12;
    const H = 1.04;
    const ice = S.icing || "#f6b4c2";

    if (ts.lastSize !== S.size) {
      ts.dist = R * 2.6 + 3.6;
      ts.lastSize = S.size;
    }

    const mat = (c, r = 0.55, extra = {}) =>
      new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
    const mesh = (g, m, x = 0, y = 0, z = 0) => {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      return o;
    };
    const cyl = (a, b, h, s = 48) => new THREE.CylinderGeometry(a, b, h, s);

    function heartShape(r) {
      const s = new THREE.Shape();
      s.moveTo(0, -0.9 * r);
      s.bezierCurveTo(-0.2 * r, -0.6 * r, -r, -0.3 * r, -r, 0.25 * r);
      s.bezierCurveTo(-r, 0.8 * r, -0.3 * r, r, 0, 0.55 * r);
      s.bezierCurveTo(0.3 * r, r, r, 0.8 * r, r, 0.25 * r);
      s.bezierCurveTo(r, -0.3 * r, 0.2 * r, -0.6 * r, 0, -0.9 * r);
      return s;
    }

    function fp(rad) {
      const k = S.shape;
      const s = new THREE.Shape();
      if (k === "round") {
        s.absarc(0, 0, rad, 0, Math.PI * 2);
      } else if (k === "square") {
        const a = rad * 0.92;
        const r = 0.16;
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
        return heartShape(rad * 1.12);
      } else if (k === "star" || k === "hex") {
        const n = k === "star" ? 10 : 6;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + (k === "star" ? Math.PI / 2 : 0);
          const r = k === "star" ? (i % 2 ? rad * 0.58 : rad * 1.2) : rad * 1.05;
          s[i ? "lineTo" : "moveTo"](r * Math.cos(a), r * Math.sin(a));
        }
        s.closePath();
      } else {
        const curvePoints = (S.cpts || CAT).map(
          (p) => new THREE.Vector3(p[0] * rad * 1.1, -p[1] * rad * 1.1, 0)
        );
        new THREE.CatmullRomCurve3(curvePoints, true)
          .getPoints(100)
          .forEach((p, i) => s[i ? "lineTo" : "moveTo"](p.x, p.y));
      }
      return s;
    }

    function solid(rad, h, y, m) {
      if (S.shape === "round") return mesh(cyl(rad, rad, h, 72), m, 0, y + h / 2, 0);
      const g = new THREE.ExtrudeGeometry(fp(rad), {
        depth: h,
        bevelEnabled: true,
        bevelSize: 0.025,
        bevelThickness: 0.025,
        bevelSegments: 2,
        curveSegments: 40,
      });
      g.rotateX(-Math.PI / 2);
      g.translate(0, y, 0);
      return new THREE.Mesh(g, m);
    }

    const pr = R * 1.35 + 0.55;
    cake.add(mesh(cyl(pr, pr, 0.08, 72), mat("#f3eaef", 0.3), 0, -0.04, 0));
    cake.add(mesh(cyl(0.5, 0.65, 0.5, 32), mat("#f3eaef", 0.3), 0, -0.33, 0));
    cake.add(
      mesh(
        cyl(Math.min(1.1, pr * 0.55), Math.min(1.1, pr * 0.55), 0.08, 48),
        mat("#e9dde3", 0.3),
        0,
        -0.58,
        0
      )
    );

    const flavColor = FLAV[S.flavor] ? FLAV[S.flavor][2] : "#fbefd5";
    const fillColor = FILL[S.fill] ? FILL[S.fill][2] : "#fffaf0";

    cake.add(solid(R, H, 0, mat(flavColor, 0.65)));
    cake.add(solid(R * 1.01, 0.07, H * 0.46, mat(fillColor, 0.5)));
    cake.add(solid(R * 1.015, 0.1, H - 0.06, mat(ice, 0.25)));

    const top = H + 0.1;

    if (S.deco && S.deco.drip) {
      const n = Math.round(R * 16);
      const L = [0.2, 0.38, 0.15, 0.46, 0.28, 0.34];
      fp(R * 1.02)
        .getSpacedPoints(n)
        .slice(0, -1)
        .forEach((p, i) => {
          const l = L[i % 6];
          cake.add(
            mesh(cyl(0.065, 0.065, l, 10), mat(ice, 0.25), p.x, H - l / 2, -p.y)
          );
          cake.add(
            mesh(
              new THREE.SphereGeometry(0.065, 10, 8),
              mat(ice, 0.25),
              p.x,
              H - l,
              -p.y
            )
          );
        });
    }

    const kinds = ["straw", "berry", "flower"].filter((k) => S.deco && S.deco[k]);
    if (kinds.length) {
      const n = Math.max(8, Math.round(R * 10));
      fp(R)
        .getSpacedPoints(n)
        .slice(0, -1)
        .forEach((p, i) => {
          const x = p.x * 0.74;
          const z = -p.y * 0.74;
          const y = top;

          if (i % 2 === 0) {
            cake.add(
              mesh(
                new THREE.SphereGeometry(0.14, 16, 12),
                mat("#FFF8F0", 0.4),
                x,
                y + 0.05,
                z
              )
            );
            cake.add(
              mesh(
                new THREE.SphereGeometry(0.08, 12, 10),
                mat("#fff", 0.4),
                x,
                y + 0.2,
                z
              )
            );
            return;
          }

          const k = kinds[(i >> 1) % kinds.length];
          if (k === "straw") {
            const b = mesh(
              new THREE.SphereGeometry(0.14, 16, 12),
              mat("#e0303f", 0.35),
              x,
              y + 0.1,
              z
            );
            b.scale.set(1, 1.2, 1);
            cake.add(b);
            cake.add(
              mesh(
                new THREE.ConeGeometry(0.08, 0.07, 6),
                mat("#3d9a4a"),
                x,
                y + 0.27,
                z
              )
            );
          } else if (k === "berry") {
            cake.add(
              mesh(
                new THREE.SphereGeometry(0.12, 14, 12),
                mat(["#4a4a94", "#c2185b", "#3b2a4f"][i % 3], 0.3),
                x,
                y + 0.08,
                z
              )
            );
          } else {
            for (let j = 0; j < 5; j++) {
              const a = (j / 5) * Math.PI * 2;
              const q = mesh(
                new THREE.SphereGeometry(0.07, 10, 8),
                mat("#fff", 0.5),
                x + 0.08 * Math.cos(a),
                y + 0.06,
                z + 0.08 * Math.sin(a)
              );
              q.scale.y = 0.6;
              cake.add(q);
            }
            cake.add(
              mesh(
                new THREE.SphereGeometry(0.05, 10, 8),
                mat("#f7c948"),
                x,
                y + 0.09,
                z
              )
            );
          }
        });
    }

    if (S.deco && S.deco.spr) {
      const cs = ["#ff6f91", "#ffd166", "#06d6a0", "#118ab2", "#fff"];
      const P = fp(R * 0.85).getSpacedPoints(40);
      for (let i = 0; i < 90; i++) {
        const p = P[i % 40];
        const k = Math.sqrt(Math.random());
        const b = mesh(
          new THREE.BoxGeometry(0.1, 0.025, 0.025),
          mat(cs[i % 5]),
          p.x * k,
          top - 0.01,
          -p.y * k
        );
        b.rotation.y = Math.random() * 3;
        cake.add(b);
      }
    }

    if (S.deco && S.deco.candle) {
      const z = -R * 0.4;
      cake.add(mesh(cyl(0.035, 0.035, 0.45, 12), mat("#ffd1dc"), 0, top + 0.2, z));
      const fl = mesh(
        new THREE.SphereGeometry(0.055, 12, 10),
        new THREE.MeshBasicMaterial({ color: "#ffcf4a" }),
        0,
        top + 0.48,
        z
      );
      fl.scale.y = 1.6;
      cake.add(fl);
      ts.flame = fl;
    }

    function createTextTexture(it) {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 512;
      const x = c.getContext("2d");
      const lines = String(it.text || "").split("\n").slice(0, 3);
      const fs0 = (it.px || 32) * 2.8;
      x.textBaseline = "middle";
      x.textAlign = it.align || "center";
      const ax =
        it.align === "left" ? 70 : it.align === "right" ? 954 : 512;

      lines.forEach((lineText, idx) => {
        let fs = fs0;
        do {
          x.font = `600 ${fs}px "${it.font || "Baloo 2"}", cursive`;
          fs -= 4;
        } while (x.measureText(lineText).width > 880 && fs > 20);

        const y = 256 + (idx - (lines.length - 1) / 2) * fs0 * 1.1;

        if (it.fx === "shadow") {
          x.shadowColor = "rgba(0, 0, 0, 0.5)";
          x.shadowBlur = 10;
          x.shadowOffsetY = 5;
        }
        if (it.fx === "outline") {
          x.lineWidth = 14;
          x.strokeStyle = "#ffffff";
          x.lineJoin = "round";
          x.strokeText(lineText, ax, y);
        }
        x.fillStyle = it.color || "#5b2a1b";
        x.fillText(lineText, ax, y);
        x.shadowColor = "transparent";
      });

      const tx = new THREE.CanvasTexture(c);
      tx.anisotropy = 4;
      return tx;
    }

    function createEmojiTexture(e) {
      const c = document.createElement("canvas");
      c.width = 128;
      c.height = 128;
      const x = c.getContext("2d");
      x.font = "100px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(e, 64, 70);
      return new THREE.CanvasTexture(c);
    }

    (S.items || []).forEach((it) => {
      if (it.t === "text") {
        if (!it.text || !it.text.trim()) return;
        const side = ["round", "square", "hex"].includes(S.shape);
        const mt = new THREE.MeshBasicMaterial({
          map: createTextTexture(it),
          transparent: true,
          depthWrite: false,
        });

        if (side) {
          const zf =
            (S.shape === "round"
              ? R
              : S.shape === "square"
              ? R * 0.92
              : R * 1.05 * 0.866) + 0.06;
          const w = Math.min(R * 1.7, 1.9);
          const p = mesh(new THREE.PlaneGeometry(w, w / 2), mt, 0, H * 0.42, zf);
          cake.add(p);
        } else {
          const w = R * 1.7;
          const p = mesh(new THREE.PlaneGeometry(w, w / 2), mt, 0, H + 0.08, R * 0.1);
          p.rotation.x = -Math.PI / 2;
          cake.add(p);
        }
        return;
      }

      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: it.t === "img" ? null : createEmojiTexture(it.e),
          transparent: true,
        })
      );
      const s = 0.5 * (it.sz || 1) * (it.k === "Topper" ? 1.4 : 1);
      sp.scale.set(s, s, 1);
      sp.position.set((it.x || 0) * R, top + s * 0.45, (it.z || 0) * R);

      if (it.t === "img" && it.src) {
        new THREE.TextureLoader().load(it.src, (tex) => {
          sp.material.map = tex;
          sp.material.needsUpdate = true;
          const aspect =
            (tex.image.width || 1) / Math.max(tex.image.width, tex.image.height);
          const aspectH =
            (tex.image.height || 1) / Math.max(tex.image.width, tex.image.height);
          sp.scale.set(s * aspect * 1.4, s * aspectH * 1.4, 1);
        });
      }
      cake.add(sp);
    });
  }, [S]);

  useEffect(() => {
    buildCake();
  }, [buildCake]);

  const paintDrawCanvas = useCallback(() => {
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

    const stroke = drawStrokeRef.current;
    if (stroke.length > 1) {
      x.beginPath();
      stroke.forEach((p, i) => x[i ? "lineTo" : "moveTo"](p[0], p[1]));
      x.stroke();
    }
  }, [S.cpts, S.shape]);

  useEffect(() => {
    if (step === 2) {
      paintDrawCanvas();
    }
  }, [step, paintDrawCanvas]);

  function onDrawDown(e) {
    const c = drawCanvasRef.current;
    if (!c) return;
    c.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const r = c.getBoundingClientRect();
    const pt = [
      ((e.clientX - r.left) * 300) / r.width,
      ((e.clientY - r.top) * 210) / r.height,
    ];
    drawStrokeRef.current = [pt];
  }

  function onDrawMove(e) {
    if (!drawingRef.current) return;
    const c = drawCanvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const pt = [
      ((e.clientX - r.left) * 300) / r.width,
      ((e.clientY - r.top) * 210) / r.height,
    ];
    drawStrokeRef.current.push(pt);
    paintDrawCanvas();
  }

  function onDrawUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const stroke = drawStrokeRef.current;
    if (stroke.length > 12) {
      const xs = stroke.map((p) => p[0]);
      const ys = stroke.map((p) => p[1]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const k =
        Math.max(
          Math.max(...xs) - Math.min(...xs),
          Math.max(...ys) - Math.min(...ys)
        ) / 2 || 1;
      const n = 36;
      const cpts = Array.from({ length: n }, (_, i) => {
        const p = stroke[Math.floor((i * stroke.length) / n)];
        return [(p[0] - cx) / k, (p[1] - cy) / k];
      });

      setS((prev) => {
        const next = { ...prev, shape: "custom", cpts };
        snap(next);
        return next;
      });
      drawStrokeRef.current = [];
      paintDrawCanvas();
    } else {
      drawStrokeRef.current = [];
      paintDrawCanvas();
    }
  }

  function handleSet(k, v) {
    setS((prev) => {
      const next = { ...prev, [k]: v };
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

  function handleAddEmoji(catIdx, emojiChar) {
    const nextId =
      (S.items || []).reduce((max, it) => Math.max(max, it.id || 0), 0) + 1;
    const categoryName = ELS[catIdx][0];
    const nonTextCount = (S.items || []).filter((i) => i.t !== "text").length;
    const g = (2 * Math.PI * nonTextCount) / 5;
    const newItem = {
      id: nextId,
      t: "emoji",
      e: emojiChar,
      k: categoryName,
      sz: 1,
      x: categoryName === "Topper" ? 0 : 0.55 * Math.sin(g),
      z: categoryName === "Topper" ? -0.1 : -0.55 * Math.cos(g),
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

  function go(targetStep) {
    const i = Math.max(0, Math.min(8, targetStep));
    if (mode === "tpl") {
      if (i > 0 && tplI === null) {
        showToast("Pilih satu template dulu ya");
        return;
      }
      if (i >= 1 && i <= 5) {
        setStep(i < step ? 0 : 6);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    setStep(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function checkValidation() {
    if (!S.f.nm) return "Isi nama dulu ya";
    if (!/.+@.+/.test(S.f.em || "")) return "Isi email yang valid dulu ya";
    if (!S.f.dt) return "Pilih tanggal dibutuhkan";
    if (S.pick === "delivery" && !S.f.addr) return "Isi alamat pengantaran";
    if (!S.pay) return "Pilih metode pembayaran dulu ya";
    if (S.pay === "other" && !S.f.payOther)
      return "Tulis metode pembayaran lainnya";
    return "";
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

    setSedangKirim(true);

    const txtNote = (S.items || [])
      .filter((i) => i.t === "text")
      .map((i) => i.text)
      .join(" / ");
    const decoSummary = Object.keys(S.deco || {})
      .filter((k) => S.deco[k])
      .map((k) => (DECO[k] ? DECO[k][1] : k))
      .join(", ");
    const itemsSummary = (S.items || [])
      .filter((i) => i.t !== "text")
      .map((i) => i.e || "Gambar kustom")
      .join(", ");

    const catatanFull = [
      `Bentuk: ${SHP[S.shape] ? SHP[S.shape][0] : S.shape}`,
      `Isian: ${FILL[S.fill] ? FILL[S.fill][0] : S.fill}`,
      `Krim: ${ICE.find((c) => c[1] === S.icing)?.[0] || S.icing}`,
      decoSummary ? `Dekorasi: ${decoSummary}` : "",
      itemsSummary ? `Elemen: ${itemsSummary}` : "",
      S.pay ? `Metode Bayar: ${S.pay}` : "",
      S.f.notes || "",
    ]
      .filter(Boolean)
      .join(" | ");

    const mappedPilihanIds = [];
    const sizeName = S.size;
    const dbSize = daftarItem.find(
      (it) =>
        it.kode_visual === sizeName ||
        it.nama.toLowerCase().includes(sizeName) ||
        (sizeName === "mini" && it.nama.toLowerCase().includes("kecil")) ||
        (sizeName === "small" && it.nama.toLowerCase().includes("kecil")) ||
        (sizeName === "medium" && it.nama.toLowerCase().includes("sedang")) ||
        (sizeName === "large" && it.nama.toLowerCase().includes("besar"))
    );
    if (dbSize) mappedPilihanIds.push(dbSize.id);

    const dbFlav = daftarItem.find(
      (it) =>
        it.kode_visual === S.flavor ||
        it.nama.toLowerCase().includes(FLAV[S.flavor]?.[0]?.toLowerCase() || "")
    );
    if (dbFlav) mappedPilihanIds.push(dbFlav.id);

    const dbIcing = daftarItem.find(
      (it) =>
        it.warna === S.icing ||
        it.nama.toLowerCase().includes(
          (ICE.find((c) => c[1] === S.icing)?.[0] || "").toLowerCase()
        )
    );
    if (dbIcing) mappedPilihanIds.push(dbIcing.id);

    if (S.deco) {
      Object.keys(S.deco).forEach((dk) => {
        if (!S.deco[dk]) return;
        const itm = daftarItem.find(
          (it) =>
            it.kode_visual === dk ||
            it.nama.toLowerCase().includes((DECO[dk]?.[1] || "").toLowerCase())
        );
        if (itm) mappedPilihanIds.push(itm.id);
      });
    }

    const formData = new FormData();
    formData.append("nama_penerima", S.f.nm || profil?.nama || "Pelanggan");
    formData.append("no_wa", S.f.ph || profil?.no_wa || "081234567890");
    formData.append("tulisan_kue", txtNote || "Happy Birthday");
    formData.append("catatan", catatanFull);
    formData.append("tanggal_ambil", S.f.dt);
    formData.append("jam_ambil", "10:00:00");
    formData.append("metode_pengiriman", S.pick === "delivery" ? "Kirim" : "Ambil");
    formData.append("alamat", S.pick === "delivery" ? S.f.addr || "-" : "-");
    if (daftarZona.length > 0) {
      formData.append("id_zona", String(daftarZona[0].id));
    }
    formData.append("pilihan_ids", JSON.stringify(mappedPilihanIds));

    const imgItem = (S.items || []).find((i) => i.t === "img" && i.file);
    if (imgItem && imgItem.file) {
      formData.append("foto_referensi", imgItem.file);
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
      showToast("Pesanan berhasil dibuat!");
      setTimeout(() => {
        router.push(`/pesanan-saya/${data.kode_pesanan}`);
      }, 1000);
    } catch {
      setSedangKirim(false);
      showToast("Gagal terhubung ke server. Silakan coba kembali.");
    }
  }

  function handleNext() {
    if (step === 0 && mode === "tpl") {
      if (tplI === null) {
        showToast("Pilih satu template dulu ya");
        return;
      }
      go(6);
      return;
    }
    if (step < 7) {
      go(step + 1);
      return;
    }
    if (step === 7) {
      const m = checkValidation();
      if (m) {
        showToast(m);
        return;
      }
      go(8);
      return;
    }
    if (step === 8) {
      handleOrderSubmit();
    }
  }

  function renderCakeSVG(sz, body, ice) {
    const rx = 20 + (SZ[sz] ? SZ[sz].d : 10) * 1.75;
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

  function renderShapeSVG(k) {
    const st = {
      fill: "#fbefd5",
      stroke: "#D96B91",
      strokeWidth: "4",
      strokeLinejoin: "round",
    };
    if (k === "round") {
      return (
        <svg viewBox="0 0 120 92">
          <ellipse cx="60" cy="46" rx="42" ry="30" {...st} />
        </svg>
      );
    }
    if (k === "square") {
      return (
        <svg viewBox="0 0 120 92">
          <rect x="22" y="14" width="76" height="64" rx="10" {...st} />
        </svg>
      );
    }
    if (k === "heart") {
      return (
        <svg viewBox="0 0 120 92">
          <path
            d="M60 84C50 70 14 56 14 34 14 16 42 10 60 30 78 10 106 16 106 34 106 56 70 70 60 84Z"
            {...st}
          />
        </svg>
      );
    }
    const n = k === "star" ? 10 : 6;
    const P = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r = k === "star" ? (i % 2 ? 20 : 44) : 42;
      P.push(
        (60 + r * Math.cos(a)).toFixed(1) +
          "," +
          (46 + r * Math.sin(a)).toFixed(1)
      );
    }
    return (
      <svg viewBox="0 0 120 92">
        <polygon points={P.join(" ")} {...st} />
      </svg>
    );
  }

  function renderBarcodeSVG(seed) {
    let h = 0;
    let x = 0;
    const rects = [];
    for (const c of seed) {
      h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
    }
    for (let i = 0; i < 64; i++) {
      h = (Math.imul(h, 1103515245) + 12345) >>> 0;
      const w = 1 + ((h >>> 16) % 4);
      const g = 1 + ((h >>> 20) % 3);
      rects.push(<rect key={i} x={x} y="0" width={w} height="64" />);
      x += w + g;
    }
    return (
      <svg
        className="bc"
        viewBox={`0 0 ${x} 64`}
        preserveAspectRatio="none"
        fill="#713D50"
        aria-hidden="true"
      >
        {rects}
      </svg>
    );
  }

  function getLineItems() {
    const z = SZ[S.size] || SZ.mini;
    const L = [
      [`ukuran ${S.size} (Ø${z.d} cm)`, z.p, 1],
      [`bentuk ${SHP[S.shape] ? SHP[S.shape][0].toLowerCase() : S.shape}`, SHP[S.shape] ? SHP[S.shape][1] : 0, 2],
      [`rasa ${FLAV[S.flavor] ? FLAV[S.flavor][0].toLowerCase() : S.flavor}`, FLAV[S.flavor] ? FLAV[S.flavor][1] : 0, 3],
      [`isian ${FILL[S.fill] ? FILL[S.fill][0].toLowerCase() : S.fill}`, FILL[S.fill] ? FILL[S.fill][1] : 0, 3],
      [`krim ${(ICE.find((x) => x[1] === S.icing) || ["Kustom"])[0].toLowerCase()}`, 0, 3],
    ];

    Object.keys(S.deco || {})
      .filter((k) => S.deco[k])
      .forEach((k) => {
        L.push([
          `dekorasi ${DECO[k] ? DECO[k][1].toLowerCase() : k}`,
          DECO[k] ? DECO[k][2] : 0,
          4,
        ]);
      });

    (S.items || []).forEach((i) => {
      if (i.t === "text") {
        L.push([`tulisan "${(i.text || "").replace(/\n/g, " ").slice(0, 22)}"`, 0, 5]);
      } else if (i.t === "img") {
        L.push(["gambar kustom", 15000, 5]);
      } else {
        L.push([`${(i.k || "").toLowerCase()} ${i.e || ""}`, ELP[i.k] || 2000, 5]);
      }
    });

    return L;
  }

  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const minDeliveryDate = new Date(Date.now() + 2 * 86400000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="cakecraft-studio">
      <div className="hd">
        <div className="in">
          <Link href="/" className="logo">
            <span style={{ fontSize: "38px" }}>🧁</span>
            <div>
              <b>{pengaturan?.nama_toko || "CakeCraft"}</b>
              <small>Make Your Cake, Your Way</small>
            </div>
          </Link>
          <nav>
            <Link href="/">Beranda</Link>
            <Link href="/pesan" className="on">
              Custom Cake
            </Link>
            <Link href="/pesanan-saya">Pesanan</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
          <div className="hr">
            <span className="cart">
              🛒<i>{cartCount}</i>
            </span>
            <div className="av">
              {profil?.nama ? profil.nama.slice(0, 1).toUpperCase() : "A"}
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="steps">
          {(mode === "tpl" ? [0, 6, 7, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8]).map(
            (idx) => {
              const item = STEPS[idx];
              const isDone = idx < step;
              const isCur = idx === step;
              return (
                <button
                  key={idx}
                  className={`st ${isDone ? "done" : ""} ${isCur ? "cur" : ""}`}
                  onClick={() => go(idx)}
                >
                  <span className="ic">{isDone ? "✓" : item[1]}</span>
                  {item[0]}
                </button>
              );
            }
          )}
        </div>

        <main className={step === 5 ? "d" : ""}>
          <section
            className={`card ${step === 8 ? "rcp" : step === 6 ? "thm" : ""}`}
            id="L"
          >
            {step === 0 && (
              <div>
                <div className="ttl">
                  <span className="ti">🎂</span>
                  <div>
                    <h1>Pilih Jenis Kue</h1>
                    <p>Buat sendiri dari nol, atau pilih template siap pakai.</p>
                  </div>
                </div>
                <div className="g2c">
                  <button
                    className={`mode ${mode === "custom" ? "on" : ""}`}
                    onClick={() => {
                      setMode("custom");
                    }}
                  >
                    <span className="mi">🎨</span>
                    <b>Custom Sendiri</b>
                    <span>Atur ukuran, bentuk, rasa, dekorasi, dan desain.</span>
                  </button>
                  <button
                    className={`mode ${mode === "tpl" ? "on" : ""}`}
                    onClick={() => {
                      setMode("tpl");
                    }}
                  >
                    <span className="mi">⚡</span>
                    <b>Template Siap Pakai</b>
                    <span>Tidak mau repot? Pilih satu, langsung review.</span>
                  </button>
                </div>

                {mode === "tpl" ? (
                  <>
                    <div className="lb">Pilih template</div>
                    <div className="grid">
                      {TPL.map((t, idx) => {
                        const isSelected = tplI === idx;
                        return (
                          <button
                            key={idx}
                            className={`opt ${isSelected ? "on" : ""}`}
                            onClick={() => {
                              setTplI(idx);
                              const nextS = {
                                ...getDefState(),
                                ...t.s,
                                f: S.f,
                              };
                              setS(nextS);
                              snap(nextS);
                            }}
                          >
                            {t.s.shape === "heart"
                              ? renderShapeSVG("heart")
                              : renderCakeSVG(
                                  t.s.size || "small",
                                  FLAV[t.s.flavor || "vanilla"][2],
                                  t.s.icing || "#f6b4c2"
                                )}
                            <b>{t.n}</b>
                            <small>{t.d}</small>
                            <em>
                              {formatRp(calcBase({ ...getDefState(), ...t.s }))}
                            </em>
                          </button>
                        );
                      })}
                    </div>
                    <div className="tip">
                      Template dipesan apa adanya, jadi langkah ukuran sampai
                      desain dilewati. Mau atur sendiri? Pilih Custom Sendiri.
                    </div>
                  </>
                ) : (
                  <div className="tip">
                    Mulai dari ukuran dan bentuk, lalu pilih rasa dan hiasan.
                    Hasilnya langsung tampil di preview 3D.
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="ttl">
                  <span className="ti">⤢</span>
                  <div>
                    <h1>Pilih Ukuran Kue</h1>
                    <p>Tentukan ukuran kue sesuai kebutuhanmu.</p>
                  </div>
                </div>
                <div className="grid">
                  {Object.entries(SZ).map(([k, v]) => (
                    <button
                      key={k}
                      className={`opt ${S.size === k ? "on" : ""}`}
                      onClick={() => handleSet("size", k)}
                    >
                      {renderCakeSVG(
                        k,
                        FLAV[S.flavor] ? FLAV[S.flavor][2] : "#fbefd5",
                        S.icing
                      )}
                      <b>{k.charAt(0).toUpperCase() + k.slice(1)}</b>
                      <small>Ø {v.d} cm</small>
                      <em>{formatRp(v.p)}</em>
                    </button>
                  ))}
                </div>
                <div className="tip">
                  Ukuran {S.size.charAt(0).toUpperCase() + S.size.slice(1)} cocok
                  untuk {SZ[S.size]?.s}
                  {S.size === "mini" ? ", pas untuk kejutan spesial!" : "."}
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
                  {Object.keys(SHP).map((k) =>
                    k === "custom" ? (
                      <button
                        key={k}
                        className={`opt dash ${S.shape === "custom" ? "on" : ""}`}
                        onClick={() => handleSet("shape", "custom")}
                      >
                        <span className="big">+</span>
                        <b>Buat Sendiri</b>
                        <small>+{formatRp(SHP.custom[1])}</small>
                      </button>
                    ) : (
                      <button
                        key={k}
                        className={`opt ${S.shape === k ? "on" : ""}`}
                        onClick={() => handleSet("shape", k)}
                      >
                        {renderShapeSVG(k)}
                        <b>{SHP[k][0]}</b>
                        {SHP[k][1] ? (
                          <small>+{formatRp(SHP[k][1])}</small>
                        ) : null}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="ttl">
                  <span className="ti">🎨</span>
                  <div>
                    <h1>Pilih Rasa dan Isian</h1>
                    <p>Rasa sponge, isian tengah, dan warna krim luar.</p>
                  </div>
                </div>
                <div className="lb">Rasa sponge</div>
                <div className="grid">
                  {Object.entries(FLAV).map(([k, v]) => (
                    <button
                      key={k}
                      className={`opt ${S.flavor === k ? "on" : ""}`}
                      onClick={() => handleSet("flavor", k)}
                    >
                      <i className="sw" style={{ background: v[2] }}></i>
                      <b>{v[0]}</b>
                      <small>{v[1] ? "+" + formatRp(v[1]) : "Termasuk"}</small>
                    </button>
                  ))}
                </div>
                <div className="lb">Isian</div>
                <div className="grid">
                  {Object.entries(FILL).map(([k, v]) => (
                    <button
                      key={k}
                      className={`opt ${S.fill === k ? "on" : ""}`}
                      onClick={() => handleSet("fill", k)}
                    >
                      <i className="sw" style={{ background: v[2] }}></i>
                      <b>{v[0]}</b>
                      <small>{v[1] ? "+" + formatRp(v[1]) : "Termasuk"}</small>
                    </button>
                  ))}
                </div>
                <div className="lb">Warna krim</div>
                <div className="sc">
                  {ICE.map((c) => (
                    <button
                      key={c[1]}
                      className={`ch ${S.icing === c[1] ? "on" : ""}`}
                      onClick={() => handleSet("icing", c[1])}
                    >
                      <i style={{ background: c[1] }}></i>
                      {c[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="ttl">
                  <span className="ti">☆</span>
                  <div>
                    <h1>Pilih Dekorasi</h1>
                    <p>Boleh pilih lebih dari satu.</p>
                  </div>
                </div>
                <div className="grid">
                  {Object.entries(DECO).map(([k, v]) => (
                    <button
                      key={k}
                      className={`opt ${S.deco && S.deco[k] ? "on" : ""}`}
                      onClick={() => handleDecoToggle(k)}
                    >
                      <span className="big">{v[0]}</span>
                      <b>{v[1]}</b>
                      <small>+{formatRp(v[2])}</small>
                    </button>
                  ))}
                </div>
                <div className="tip">
                  Di langkah berikutnya kamu bisa menambah stiker, topper, dan
                  tulisan sendiri.
                </div>
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
                {ELS.map((c, idx) => (
                  <div key={idx}>
                    <button
                      className={`el ${openC === idx ? "on" : ""}`}
                      onClick={() => setOpenC(openC === idx ? -1 : idx)}
                    >
                      <span>{c[1]}</span>
                      <span>{c[0]}</span>
                    </button>
                    {openC === idx && (
                      <div className="ep">
                        {c[2].map((emo, eIdx) => (
                          <button
                            key={eIdx}
                            onClick={() => handleAddEmoji(idx, emo)}
                            aria-label={`Tambah ${emo}`}
                          >
                            {emo}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
                  Format: PNG, JPG
                </p>
              </div>
            )}

            {step === 6 && (
              <div>
                <div className="ttl">
                  <span className="ti">🧾</span>
                  <div>
                    <h1>Review Kue</h1>
                    <p>
                      {mode === "tpl" && tplI !== null
                        ? `Template ${TPL[tplI].n} siap dipesan.`
                        : "Cek lagi kue kamu sebelum lanjut ke pengambilan."}
                    </p>
                  </div>
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
                    <h2>STRUK KUE</h2>
                    <div className="s">CEK LAGI KUE KAMU SEBELUM LANJUT!</div>
                    <div className="st2">
                      {pengaturan?.nama_toko
                        ? pengaturan.nama_toko.toUpperCase()
                        : "CAKECRAFT.CO"}
                    </div>
                    <div className="ast">{"*".repeat(32)}</div>
                    <div className="dt">TANGGAL: {todayFormatted.toUpperCase()}</div>
                    <div className="ast">{"*".repeat(32)}</div>

                    {getLineItems().map((line, lIdx) =>
                      mode === "tpl" ? (
                        <div key={lIdx} className="rl">
                          <span>{line[0]}</span>
                          <span>{line[1] ? formatRp(line[1]) : "termasuk"}</span>
                        </div>
                      ) : (
                        <button
                          key={lIdx}
                          className="rl"
                          onClick={() => go(line[2])}
                        >
                          <span>{line[0]}</span>
                          <span>{line[1] ? formatRp(line[1]) : "termasuk"}</span>
                        </button>
                      )
                    )}

                    <div className="dbl"></div>
                    <div className="tt">
                      <span>TOTAL:</span>
                      <span>{formatRp(calcBase(S))}</span>
                    </div>
                    <div className="s" style={{ marginTop: "6px" }}>
                      *belum termasuk ongkir
                    </div>
                    <div className="bars">
                      <div>
                        <i style={{ flex: 5 }}></i>
                        <i style={{ flex: 2 }}></i>
                      </div>
                      <div>
                        <i style={{ flex: 3 }}></i>
                        <i style={{ flex: 2 }}></i>
                      </div>
                    </div>
                    {renderBarcodeSVG(orderCode + calcBase(S))}
                    <div className="s">{orderCode}</div>
                  </div>
                </div>
                <p className="hint2">
                  {mode === "tpl"
                    ? "Template tidak bisa diubah. Mau atur sendiri? Kembali ke Jenis Kue dan pilih Custom Sendiri."
                    : "Klik baris mana saja untuk mengubahnya 🖍️"}
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
                    <span>+Rp 15.000 · diantar sampai rumah</span>
                  </button>
                </div>

                <div className="g2">
                  <label className="fl">
                    Nama
                    <input
                      placeholder="Nama lengkap"
                      value={S.f.nm || ""}
                      onChange={(e) => handleFieldChange("nm", e.target.value)}
                    />
                  </label>
                  <label className="fl">
                    Email
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={S.f.em || ""}
                      onChange={(e) => handleFieldChange("em", e.target.value)}
                    />
                  </label>
                </div>
                <div className="g2">
                  <label className="fl">
                    No. WhatsApp (opsional)
                    <input
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={S.f.ph || ""}
                      onChange={(e) => handleFieldChange("ph", e.target.value)}
                    />
                  </label>
                  <label className="fl">
                    Tanggal dibutuhkan
                    <input
                      type="date"
                      min={minDeliveryDate}
                      value={S.f.dt || ""}
                      onChange={(e) => handleFieldChange("dt", e.target.value)}
                    />
                  </label>
                </div>

                {S.pick === "delivery" && (
                  <div style={{ marginTop: "10px" }}>
                    <label className="fl">
                      Alamat pengantaran
                      <input
                        placeholder="Jalan, nomor, kota"
                        value={S.f.addr || ""}
                        onChange={(e) =>
                          handleFieldChange("addr", e.target.value)
                        }
                      />
                    </label>
                  </div>
                )}

                <div className="lb">Metode pembayaran</div>
                <div className="grid">
                  {[
                    ["cash", "💵", "Tunai"],
                    ["bank", "🏦", "Transfer Bank"],
                    ["ewallet", "📱", "E-Wallet"],
                    ["other", "✨", "Lainnya"],
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

                {S.pay === "other" && (
                  <div style={{ marginTop: "10px" }}>
                    <label className="fl">
                      Metode pembayaran lainnya
                      <input
                        placeholder="Contoh: QRIS, kartu kredit"
                        value={S.f.payOther || ""}
                        onChange={(e) =>
                          handleFieldChange("payOther", e.target.value)
                        }
                      />
                    </label>
                  </div>
                )}

                <label className="fl" style={{ marginTop: "14px" }}>
                  Catatan tambahan
                  <textarea
                    placeholder="Alergi, tema, atau pesan khusus"
                    value={S.f.notes || ""}
                    onChange={(e) =>
                      handleFieldChange("notes", e.target.value)
                    }
                  ></textarea>
                </label>
                <div className="tip">
                  Pesanan custom butuh waktu pembuatan minimal 2 hari, silakan
                  pilih tanggal sesuai kebutuhan.
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
                    No. Pesanan : <span className="dots">{orderCode}</span>
                  </div>
                  <div className="pf">
                    Tanggal : <span className="dots">{todayFormatted}</span>
                  </div>
                </div>

                <div className="pf" style={{ marginTop: "12px" }}>
                  ♡ Nama Pelanggan :{" "}
                  <span className="dots">{S.f.nm || "-"}</span>
                </div>
                <div className="pf" style={{ marginTop: "12px" }}>
                  ♡ Kontak : <span className="dots">{S.f.em || "-"}</span>
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
                      rows.push(["ongkir antar", 15000]);
                    }
                    const count = Math.max(8, rows.length);
                    return Array.from({ length: count }, (_, i) => {
                      const r = rows[i];
                      return (
                        <div key={i} className="tr">
                          <span>{r ? i + 1 : ""}</span>
                          <span className="ds">{r ? r[0] : ""}</span>
                          <span>{r ? 1 : ""}</span>
                          <span className="rt">
                            {r ? (r[1] ? formatRp(r[1]) : "0") : ""}
                          </span>
                          <span className="rt">
                            {r ? (r[1] ? formatRp(r[1]) : "0") : ""}
                          </span>
                        </div>
                      );
                    });
                  })()}
                  <div className="tr tl">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span className="tot2">Total</span>
                    <span className="rt">
                      <b>{formatRp(calcTotal(S))}</b>
                    </span>
                  </div>
                </div>

                <div className="pn">
                  <div className="bx">
                    <i className="tag">Metode Pembayaran</i>
                    <div className="cb">
                      {S.pay === "cash" ? "☑" : "☐"} Tunai 💵
                    </div>
                    <div className="cb">
                      {S.pay === "bank" ? "☑" : "☐"} Transfer Bank 🏦
                    </div>
                    <div className="cb">
                      {S.pay === "ewallet" ? "☑" : "☐"} E-Wallet 📱
                    </div>
                    <div className="cb">
                      {S.pay === "other" ? "☑" : "☐"} Lainnya :{" "}
                      {S.pay === "other" ? S.f.payOther || "" : ""}
                    </div>
                  </div>
                  <div className="bx">
                    <i className="tag">Catatan</i>
                    {[
                      S.pick === "delivery"
                        ? "Diantar ke: " + (S.f.addr || "-")
                        : "Ambil di toko",
                      S.f.dt ? "Dibutuhkan: " + S.f.dt : "Dibutuhkan: -",
                      S.f.ph ? "WhatsApp: " + S.f.ph : "",
                      S.f.notes || "",
                    ]
                      .filter(Boolean)
                      .map((t, idx) => (
                        <div key={idx} className="nt">
                          {t}
                        </div>
                      ))}
                    <div className="nt"></div>
                  </div>
                </div>

                <div className="ty">Terima kasih!</div>
                <p className="ap">Kami menghargai dukunganmu ♡</p>
                <span className="cup">☕</span>
                <span className="fl2">🌸</span>
              </div>
            )}
          </section>

          <section id="V">
            <div className="vbox" ref={vboxRef} id="vbox">
              <canvas ref={canvasRef} id="cv" aria-label="Pratinjau kue 3D"></canvas>
              <div className="vt">
                {step === 5 ? (
                  <>
                    <div className="col" style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="ib"
                        onClick={handleUndo}
                        disabled={hiRef.current < 1}
                        aria-label="Urungkan"
                      >
                        ↶
                      </button>
                      <button
                        className="ib"
                        onClick={handleRedo}
                        disabled={hiRef.current >= histRef.current.length - 1}
                        aria-label="Ulangi"
                      >
                        ↷
                      </button>
                    </div>
                    <div className="seg">
                      <button
                        className={view2D ? "" : "on"}
                        onClick={() => {
                          setView2D(false);
                          threeStateRef.current.ph = 0.42;
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
                  </>
                ) : (
                  <>
                    <span></span>
                    <div className="col">
                      <button
                        className="ib"
                        onClick={() => {
                          threeStateRef.current.th = 0.5;
                          threeStateRef.current.ph = 0.42;
                          threeStateRef.current.dist =
                            ((SZ[S.size] ? SZ[S.size].d : 10) / 12) * 2.6 + 3.6;
                          setAutoSpin(true);
                        }}
                        aria-label="Reset"
                      >
                        ⟳
                      </button>
                      <button
                        className="ib"
                        onClick={() => {
                          try {
                            if (document.fullscreenElement) {
                              document.exitFullscreen();
                            } else if (vboxRef.current) {
                              vboxRef.current.requestFullscreen();
                            }
                          } catch {}
                        }}
                        aria-label="Layar penuh"
                      >
                        ⛶
                      </button>
                      <button
                        className="ib"
                        onClick={() => {
                          const ts = threeStateRef.current;
                          ts.dist = ts.dist > 5 ? 4 : ((SZ[S.size] ? SZ[S.size].d : 10) / 12) * 2.6 + 3.6;
                        }}
                        aria-label="Zoom"
                      >
                        🔍
                      </button>
                    </div>
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
                    <canvas
                      ref={drawCanvasRef}
                      id="dc"
                      width="300"
                      height="210"
                      aria-label="Kanvas gambar bentuk"
                      onPointerDown={onDrawDown}
                      onPointerMove={onDrawMove}
                      onPointerUp={onDrawUp}
                    ></canvas>
                    <div className="tools">
                      <button
                        className={tool === "draw" ? "on" : ""}
                        onClick={() => setTool("draw")}
                      >
                        ✏️ Gambar
                      </button>
                      <button
                        onClick={() => {
                          setS((prev) => {
                            const next = { ...prev, cpts: null };
                            snap(next);
                            return next;
                          });
                          drawStrokeRef.current = [];
                          paintDrawCanvas();
                        }}
                      >
                        ◇ Hapus
                      </button>
                      <button
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
                          drawStrokeRef.current = [];
                          paintDrawCanvas();
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
                    {S.shape === "round" || S.shape === "custom"
                      ? renderCakeSVG(
                          S.size,
                          FLAV[S.flavor] ? FLAV[S.flavor][2] : "#fbefd5",
                          S.icing
                        )
                      : renderShapeSVG(S.shape)}
                    <div style={{ flex: 1 }}>
                      <h3>Custom Cake</h3>
                      <p>
                        {SHP[S.shape] ? SHP[S.shape][0] : S.shape} ·{" "}
                        {S.size.charAt(0).toUpperCase() + S.size.slice(1)} (Ø{" "}
                        {SZ[S.size] ? SZ[S.size].d : 10} cm)
                      </p>
                      <p>
                        {FLAV[S.flavor] ? FLAV[S.flavor][0] : S.flavor} ·{" "}
                        {FILL[S.fill] ? FILL[S.fill][0] : S.fill}
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
                    <span>{formatRp(calcTotal(S))}</span>
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
            style={{ visibility: step > 0 ? "visible" : "hidden" }}
            onClick={() => go(step - 1)}
          >
            ‹ {step > 2 ? "Kembali" : "Sebelumnya"}
          </button>

          {step < 3 && (
            <div className="trust">
              <span>🛡️ Pembayaran Aman</span>
              <span>🚚 Pengiriman Tepat Waktu</span>
              <span>♡ Kualitas Terbaik</span>
            </div>
          )}

          <div className="fr">
            <b>{formatRp(calcTotal(S))}</b>
            <button
              className="btn nxt"
              disabled={sedangKirim}
              onClick={handleNext}
            >
              {sedangKirim
                ? "Memproses..."
                : step === 8
                ? "Pesan Sekarang 🛒"
                : step === 7
                ? "Review Pesanan ›"
                : step === 6
                ? "Lanjut Pengambilan ›"
                : "Selanjutnya ›"}
            </button>
          </div>
        </footer>
      </div>

      <div className={`toast ${toastShow ? "show" : ""}`}>{toastMsg}</div>
    </div>
  );
}
