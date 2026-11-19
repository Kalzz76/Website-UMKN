"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as THREE from "three";
import PreviewKue from "@/components/PreviewKue";
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
    deco: {},
    items: [],
    sel: null,
    cpts: null,
    pick: "pickup",
    pay: "bank",
    f: {},
  };
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
  const [cartCount, setCartCount] = useState(1);
  const [openC, setOpenC] = useState(-1);
  const [tool, setTool] = useState("draw");
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

  const canvasRef = useRef(null);
  const vboxRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const drawingRef = useRef(false);
  const drawStrokeRef = useRef([]);
  const uploadedImageFileRef = useRef(null);

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

      const saved = sessionStorage.getItem("cravely_custom_draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) setS(parsed);
        } catch {}
      }

      const savedMax = sessionStorage.getItem("cravely_custom_maxstep");
      if (savedMax) {
        try {
          const num = Number(savedMax);
          if (!isNaN(num)) setMaxStep(num);
        } catch {}
      }
    }
    muatData();
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
          if (o.material.map && !o.isSprite) o.material.map.dispose();
          o.material.dispose();
        }
      });
    }

    ts.flame = null;
    const szData = VISUAL_SIZE[S.size] || { d: 14, s: "3–5 orang" };
    const R = (szData.d || 14) / 12;
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

    const itemFlav = daftarItem.find(
      (it) => it.kode_visual === S.flavor || it.id === S.flavorId
    );
    const flavColor = itemFlav && itemFlav.warna ? itemFlav.warna : "#fbefd5";

    const itemFill = daftarItem.find(
      (it) => it.kode_visual === S.fill || it.id === S.fillId
    );
    const fillColor = itemFill && itemFill.warna ? itemFill.warna : "#fffaf0";

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
  }, [S, daftarItem, hasWebGL]);

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

  function getLineItems() {
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

      const labelName = `${gr ? gr.nama : "Opsi"}: ${it.nama}${
        jumlah > 1 ? ` x ${jumlah}` : ""
      }`;
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

    return rows;
  }

  function validateStep(sIdx) {
    if (sIdx === 0) {
      if (mode === "tpl" && tplI === null) {
        return "Pilih salah satu template kue terlebih dahulu ya.";
      }
      return "";
    }
    if (sIdx === 1) {
      if (!S.size) return "Pilih ukuran kue terlebih dahulu ya.";
      return "";
    }
    if (sIdx === 2) {
      if (!S.shape) return "Pilih bentuk kue terlebih dahulu ya.";
      return "";
    }
    if (sIdx === 3) {
      if (!S.flavor) return "Pilih rasa bolu kue terlebih dahulu ya.";
      if (!S.fill) return "Pilih isian krim terlebih dahulu ya.";
      if (!S.icing) return "Pilih warna krim icing terlebih dahulu ya.";
      return "";
    }
    if (sIdx === 7) {
      return checkValidation();
    }
    return "";
  }

  function go(targetStep) {
    let i = Math.max(0, Math.min(8, targetStep));
    if (i === step) return;

    if (mode === "tpl") {
      if (i > 0 && tplI === null) {
        showToast("Pilih salah satu template dulu ya");
        return;
      }
      if (i >= 1 && i <= 5) {
        i = i < step ? 0 : 6;
      }
    }

    if (i > step) {
      const isNextAllowed =
        (mode === "tpl" && step === 0 && i === 6) ||
        i === step + 1 ||
        i <= maxStep;
      if (!isNextAllowed) {
        showToast("Selesaikan langkah sebelumnya terlebih dahulu ya.");
        return;
      }
      for (let k = step; k < i; k++) {
        if (mode === "tpl" && k >= 1 && k <= 5) continue;
        const err = validateStep(k);
        if (err) {
          showToast(err);
          return;
        }
      }
      setMaxStep((prev) => {
        const nextVal = Math.max(prev, i);
        try {
          sessionStorage.setItem("cravely_custom_maxstep", String(nextVal));
        } catch {}
        return nextVal;
      });
    }

    setStep(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function checkValidation() {
    if (!S.f.nm || !S.f.nm.trim()) return "Isi nama pemesan terlebih dahulu ya";
    if (!S.f.ph || !S.f.ph.trim()) return "Isi nomor WhatsApp terlebih dahulu ya";
    if (!S.f.dt) return "Pilih tanggal pengambilan/pengantaran terlebih dahulu ya";
    if (!S.f.tm) return "Pilih jam pengambilan/pengantaran terlebih dahulu ya";
    if (S.pick === "delivery" && (!S.f.addr || !S.f.addr.trim())) {
      return "Isi alamat pengantaran terlebih dahulu ya";
    }
    if (!S.pay) return "Pilih metode pembayaran terlebih dahulu ya";
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
    if (!dc) return null;
    return new Promise((resolve) => {
      dc.toBlob((b) => resolve(b), "image/png");
    });
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

    if (S.shape === "custom" && !S.cpts) {
      showToast("Silakan gambar bentuk kue kustom terlebih dahulu ya.");
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
      nama_template: mode === "tpl" && tplI !== null ? TPL[tplI]?.n : null,
      shape: S.shape,
      size: S.size,
      flavor: S.flavor,
      fill: S.fill,
      icing: S.icing,
      deco: S.deco || {},
      cpts: S.cpts || null,
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
    formData.append("catatan", (S.f.notes || "").trim());
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
    const err = validateStep(step);
    if (err) {
      showToast(err);
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

  function renderBarcodeSVG(seed) {
    const bars = [];
    let curX = 10;
    const str = String(seed || "KUE-BARU");
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const w1 = (charCode % 3) + 1;
      const w2 = ((charCode >> 1) % 2) + 1;
      bars.push(
        <rect
          key={i * 2}
          x={curX}
          y="0"
          width={w1}
          height="32"
          fill="#182b23"
        />
      );
      curX += w1 + w2;
      if (curX > 180) break;
    }
    return (
      <svg
        viewBox="0 0 200 32"
        style={{
          width: "100%",
          maxHeight: "32px",
          display: "block",
          margin: "8px 0 4px",
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
            {(profil?.role === "admin" || profil?.role === "staf") && (
              <Link href="/dashboard">Dashboard</Link>
            )}
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
              const isUnlocked = idx <= maxStep;
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
                  title={!isUnlocked ? "Langkah ini belum terbuka" : item[0]}
                >
                  <span className="ic">
                    {!isUnlocked ? "🔒" : isDone ? "✓" : item[1]}
                  </span>
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
                      setMaxStep(0);
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
                      setMaxStep(0);
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
                                  "#fbefd5",
                                  t.s.icing || "#f6b4c2"
                                )}
                            <b>{t.n}</b>
                            <small>{t.d}</small>
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
                  {itemsUkuran.map((item) => {
                    const visual = VISUAL_SIZE[item.kode_visual] || {
                      d: 14,
                      s: "3–5 orang",
                    };
                    const isSelected = S.size === item.kode_visual;
                    return (
                      <button
                        key={item.id}
                        className={`opt ${isSelected ? "on" : ""}`}
                        onClick={() => handleSet("size", item.kode_visual)}
                      >
                        {renderCakeSVG(
                          item.kode_visual,
                          "#fbefd5",
                          S.icing || "#f6b4c2"
                        )}
                        <b>{item.nama}</b>
                        <small>Diameter {visual.d} cm</small>
                        <em>{item.harga ? formatRupiah(item.harga) : "Termasuk"}</em>
                      </button>
                    );
                  })}
                </div>
                <div className="tip">
                  Ukuran {S.size.charAt(0).toUpperCase() + S.size.slice(1)} cocok
                  untuk {VISUAL_SIZE[S.size]?.s || "keluarga"}.
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
                    <h1>Pilih Rasa dan Isian</h1>
                    <p>Rasa sponge, isian tengah, dan warna krim luar.</p>
                  </div>
                </div>
                <div className="lb">Rasa sponge</div>
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
                          <span>
                            {line[3] ? "Termasuk" : formatRupiah(line[1])}
                          </span>
                        </div>
                      ) : (
                        <button
                          key={lIdx}
                          className="rl"
                          onClick={() => go(line[2])}
                        >
                          <span>{line[0]}</span>
                          <span>
                            {line[3] ? "Termasuk" : formatRupiah(line[1])}
                          </span>
                        </button>
                      )
                    )}

                    <div className="dbl"></div>
                    <div className="tt">
                      <span>TOTAL KUE:</span>
                      <span>{formatRupiah(rincianHarga.total_kue)}</span>
                    </div>
                    <div className="s" style={{ marginTop: "6px" }}>
                      *belum termasuk ongkir
                    </div>
                    {renderBarcodeSVG("KUE-REVIEW")}
                    <div className="s">KUE-BARU</div>
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
                      placeholder="08xxxxxxxxxx"
                      value={S.f.ph || ""}
                      onChange={(e) => handleFieldChange("ph", e.target.value)}
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

                <div className="lb">Metode pembayaran</div>
                <div className="grid">
                  {[
                    ["bank", "🏦", "Transfer Bank"],
                    ["qris", "📱", "QRIS"],
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
                    const rows = getLineItems().map((l) => [l[0], l[1], l[3]]);
                    if (S.pick === "delivery") {
                      rows.push([
                        "Ongkir Antar",
                        rincianHarga.ongkir,
                        rincianHarga.ongkir === 0,
                      ]);
                    }
                    const count = Math.max(6, rows.length);
                    return Array.from({ length: count }, (_, i) => {
                      const r = rows[i];
                      return (
                        <div key={i} className="tr">
                          <span>{r ? i + 1 : ""}</span>
                          <span className="ds">{r ? r[0] : ""}</span>
                          <span>{r ? 1 : ""}</span>
                          <span className="rt">
                            {r
                              ? r[2]
                                ? "Termasuk"
                                : formatRupiah(r[1])
                              : ""}
                          </span>
                          <span className="rt">
                            {r
                              ? r[2]
                                ? "Termasuk"
                                : formatRupiah(r[1])
                              : ""}
                          </span>
                        </div>
                      );
                    });
                  })()}
                  <div className="tr tot-row tl">
                    <span className="tot-lbl">Total Kue</span>
                    <span className="tot-val rt">
                      <b>{formatRupiah(rincianHarga.total_kue)}</b>
                    </span>
                  </div>
                  {S.pick === "delivery" && (
                    <div className="tr tot-row tl">
                      <span className="tot-lbl">Ongkir</span>
                      <span className="tot-val rt">
                        <b>{formatRupiah(rincianHarga.ongkir)}</b>
                      </span>
                    </div>
                  )}
                  <div className="tr tot-row tl">
                    <span className="tot-lbl">Total Bayar</span>
                    <span className="tot-val rt">
                      <b>{formatRupiah(rincianHarga.total_bayar)}</b>
                    </span>
                  </div>
                </div>

                <div className="pn">
                  <div className="bx">
                    <i className="tag">Rincian Pembayaran Sekarang</i>
                    {pengaturan?.mode_pembayaran === "DP" ? (
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#182b23" }}>
                          Tagihan DP ({pengaturan.persen_dp || 50}%): {formatRupiah(rincianHarga.jumlah_dp)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                          Sisa Pelunasan: {formatRupiah(rincianHarga.total_bayar - rincianHarga.jumlah_dp)} (dilunasi saat kue diambil / dikirim)
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#182b23" }}>
                        Tagihan Pembayaran Penuh: {formatRupiah(rincianHarga.total_bayar)}
                      </div>
                    )}
                    <div style={{ marginTop: "10px", fontSize: "13px" }}>
                      <b>Metode Terpilih: </b>
                      {S.pay === "bank" ? "Transfer Bank" : "QRIS"}
                    </div>
                    {S.pay === "bank" ? (
                      <div style={{ marginTop: "8px", fontSize: "12px", background: "#f8f9f8", padding: "8px 12px", borderRadius: "10px" }}>
                        <div><b>Bank:</b> {pengaturan?.nama_bank || "BCA"}</div>
                        <div><b>No. Rekening:</b> {pengaturan?.no_rekening || "1234567890"}</div>
                        <div><b>Atas Nama:</b> {pengaturan?.atas_nama || "Cravely Bakery"}</div>
                      </div>
                    ) : (
                      <div style={{ marginTop: "8px", textAlign: "center" }}>
                        {pengaturan?.gambar_qris ? (
                          <img
                            src={pengaturan.gambar_qris}
                            alt="QRIS Toko"
                            style={{ maxWidth: "160px", margin: "0 auto", borderRadius: "8px", border: "1px solid #ddd" }}
                          />
                        ) : (
                          <div style={{ fontSize: "12px", color: "#555" }}>
                            Scan QRIS saat melakukan pembayaran.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bx">
                    <i className="tag">Catatan Tambahan</i>
                    <div className="nt">
                      {S.f.notes && S.f.notes.trim() ? S.f.notes : "Tidak ada catatan khusus"}
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

          <section id="V">
            <div className="vbox" ref={vboxRef} id="vbox">
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
                    {hasWebGL && (
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
                    )}
                  </>
                ) : (
                  <>
                    <span></span>
                    {hasWebGL && (
                      <div className="col">
                        <button
                          className="ib"
                          onClick={() => {
                            const szData = VISUAL_SIZE[S.size] || { d: 14 };
                            threeStateRef.current.th = 0.5;
                            threeStateRef.current.ph = 0.42;
                            threeStateRef.current.dist =
                              (szData.d / 12) * 2.6 + 3.6;
                            setAutoSpin(true);
                          }}
                          aria-label="Reset"
                        >
                          ↻
                        </button>
                        <button
                          className="ib"
                          onClick={() => {
                            const ts = threeStateRef.current;
                            const szData = VISUAL_SIZE[S.size] || { d: 14 };
                            ts.dist =
                              ts.dist > 5 ? 4 : (szData.d / 12) * 2.6 + 3.6;
                          }}
                          aria-label="Zoom"
                        >
                          🔍
                        </button>
                        <button
                          className={`ib ${autoSpin ? "on" : ""}`}
                          onClick={() => setAutoSpin(!autoSpin)}
                          aria-label="Putar otomatis"
                        >
                          ⟳
                        </button>
                      </div>
                    )}
                  </>
                )}
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
                          "#fbefd5",
                          S.icing || "#f6b4c2"
                        )
                      : renderShapeSVG(S.shape)}
                    <div style={{ flex: 1 }}>
                      <h3>
                        {mode === "tpl" && tplI !== null
                          ? TPL[tplI].n
                          : "Custom Cake"}
                      </h3>
                      <p>
                        {S.shape} · {S.size.toUpperCase()} (diameter{" "}
                        {VISUAL_SIZE[S.size]?.d || 14} cm)
                      </p>
                      <p>
                        {S.flavor} · {S.fill}
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
                    <span>{formatRupiah(rincianHarga.total_bayar)}</span>
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
            <b>{formatRupiah(rincianHarga.total_bayar)}</b>
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
