"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { RotateCcw, ZoomIn, ZoomOut, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import {
  formatRupiah,
  type CustomCakeOrderPayload,
  type ViewType,
} from './patisserieData';

interface CustomCakeStudioProps {
  onSendToKasir: (payload: CustomCakeOrderPayload) => void;
  onNavigate: (view: ViewType) => void;
}

type SizeKey = 'mini' | 'small' | 'medium' | 'large';
type ShapeKey = 'round' | 'square' | 'heart' | 'star' | 'hex' | 'custom';
type FlavorKey = 'vanilla' | 'choco' | 'velvet' | 'straw';
type FillKey = 'cream' | 'ganache' | 'jam' | 'cheese';
type DecoKey = 'drip' | 'straw' | 'berry' | 'flower' | 'spr' | 'candle';

interface CakeState {
  size: SizeKey;
  shape: ShapeKey;
  flavor: FlavorKey;
  fill: FillKey;
  icing: string;
  deco: Record<DecoKey, boolean>;
  text: string;
  textColor: string;
  toppers: Array<{ id: number; emoji: string; x: number; z: number }>;
  customPts: Array<[number, number]> | null;
  customerName: string;
  date: string;
  notes: string;
}

const SIZES: Record<SizeKey, { d: number; price: number; serves: string; label: string }> = {
  mini: { d: 10, price: 85000, serves: '1–2 orang', label: 'Mini' },
  small: { d: 14, price: 125000, serves: '3–5 orang', label: 'Small' },
  medium: { d: 18, price: 165000, serves: '6–10 orang', label: 'Medium' },
  large: { d: 22, price: 210000, serves: '10–15 orang', label: 'Large' },
};

const SHAPES: Record<ShapeKey, { label: string; price: number }> = {
  round: { label: 'Lingkaran', price: 0 },
  square: { label: 'Kotak', price: 0 },
  heart: { label: 'Hati', price: 10000 },
  star: { label: 'Bintang', price: 15000 },
  hex: { label: 'Hexagon', price: 10000 },
  custom: { label: 'Gambar Sendiri', price: 25000 },
};

const FLAVORS: Record<FlavorKey, { label: string; price: number; color: string }> = {
  vanilla: { label: 'Vanilla', price: 0, color: '#FBEFD5' },
  choco: { label: 'Cokelat', price: 10000, color: '#8A5A3C' },
  velvet: { label: 'Red Velvet', price: 15000, color: '#C0404E' },
  straw: { label: 'Stroberi', price: 10000, color: '#F9CDD6' },
};

const FILLINGS: Record<FillKey, { label: string; price: number; color: string }> = {
  cream: { label: 'Krim Vanilla', price: 0, color: '#FFFAF0' },
  ganache: { label: 'Ganache Cokelat', price: 8000, color: '#5B3322' },
  jam: { label: 'Selai Stroberi', price: 5000, color: '#D6304A' },
  cheese: { label: 'Cream Cheese', price: 12000, color: '#FFF0C9' },
};

const ICINGS = [
  { label: 'Blush Pink', hex: '#F6B4C2' },
  { label: 'Ivory Cream', hex: '#FFF8F0' },
  { label: 'Choco Truffle', hex: '#6B3D2A' },
  { label: 'Pastel Mint', hex: '#BFE8D8' },
  { label: 'Butter Yellow', hex: '#FBE39A' },
  { label: 'Soft Lavender', hex: '#D8C7F0' },
];

const DECOS: Record<DecoKey, { label: string; price: number }> = {
  drip: { label: 'Lelehan Krim', price: 12000 },
  straw: { label: 'Stroberi Segar', price: 10000 },
  berry: { label: 'Mixed Berry', price: 15000 },
  flower: { label: 'Bunga Gula', price: 8000 },
  spr: { label: 'Taburan Manis', price: 5000 },
  candle: { label: 'Lilin Ulang Tahun', price: 3000 },
};

const TOPPER_CHOICES = ['🎀', '🌸', '🍓', '👑', '❤️', '✨', '🐰', '🐻'];

const TEMPLATES: Array<{ name: string; desc: string; patch: Partial<CakeState> }> = [
  {
    name: 'Strawberry Coquette',
    desc: 'Vanilla lembut, selai stroberi & stroberi segar.',
    patch: {
      size: 'small',
      shape: 'round',
      flavor: 'vanilla',
      fill: 'jam',
      icing: '#F6B4C2',
      deco: { drip: true, straw: true, berry: false, flower: true, spr: false, candle: false },
    },
  },
  {
    name: 'Choco Berry Royale',
    desc: 'Cokelat ganache pekat & mixed berry segar.',
    patch: {
      size: 'medium',
      shape: 'round',
      flavor: 'choco',
      fill: 'ganache',
      icing: '#6B3D2A',
      deco: { drip: true, straw: false, berry: true, flower: false, spr: true, candle: false },
    },
  },
  {
    name: 'Velvet Heart Love',
    desc: 'Kue hati red velvet, cream cheese & bunga gula.',
    patch: {
      size: 'small',
      shape: 'heart',
      flavor: 'velvet',
      fill: 'cheese',
      icing: '#FFF8F0',
      deco: { drip: true, straw: false, berry: false, flower: true, spr: true, candle: true },
    },
  },
];

const STEPS = [
  'Jenis Kue',
  'Ukuran',
  'Bentuk',
  'Rasa & Krim',
  'Dekorasi',
  'Tulisan & Topper',
  'Review & Kirim',
];

function createShapeGeometry(
  shape: ShapeKey,
  R: number,
  H: number,
  customPts: Array<[number, number]> | null
): THREE.BufferGeometry {
  if (shape === 'round') {
    return new THREE.CylinderGeometry(R, R, H, 56);
  }
  if (shape === 'square') {
    const s = new THREE.Shape();
    const w = R * 0.88;
    const r = R * 0.16;
    s.moveTo(-w + r, -w);
    s.lineTo(w - r, -w);
    s.quadraticCurveTo(w, -w, w, -w + r);
    s.lineTo(w, w - r);
    s.quadraticCurveTo(w, w, w - r, w);
    s.lineTo(-w + r, w);
    s.quadraticCurveTo(-w, w, -w, w - r);
    s.lineTo(-w, -w + r);
    s.quadraticCurveTo(-w, -w, -w + r, -w);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: H,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -H / 2, 0);
    return geo;
  }

  const s = new THREE.Shape();
  if (shape === 'heart') {
    const k = R * 0.062;
    s.moveTo(0, -10 * k);
    s.bezierCurveTo(14 * k, -1 * k, 16 * k, 14 * k, 0, 7 * k);
    s.bezierCurveTo(-16 * k, 14 * k, -14 * k, -1 * k, 0, -10 * k);
  } else if (shape === 'star') {
    const spikes = 5;
    for (let i = 0; i < spikes * 2; i++) {
      const rad = i % 2 === 0 ? R * 1.06 : R * 0.56;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
  } else if (shape === 'hex') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * R;
      const y = Math.sin(a) * R;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
  } else if (shape === 'custom' && customPts && customPts.length >= 6) {
    customPts.forEach(([px, py], i) => {
      if (i === 0) s.moveTo(px * R, -py * R);
      else s.lineTo(px * R, -py * R);
    });
    s.closePath();
  } else {
    return new THREE.CylinderGeometry(R, R, H, 56);
  }

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: H,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -H / 2, 0);
  return geo;
}

export const CustomCakeStudio: React.FC<CustomCakeStudioProps> = ({
  onSendToKasir,
  onNavigate,
}) => {
  const [step, setStep] = useState(0);
  const [autoSpin, setAutoSpin] = useState(true);
  const [zoomed, setZoomed] = useState(false);

  const [cake, setCake] = useState<CakeState>({
    size: 'small',
    shape: 'round',
    flavor: 'vanilla',
    fill: 'cream',
    icing: '#F6B4C2',
    deco: {
      drip: true,
      straw: true,
      berry: false,
      flower: true,
      spr: false,
      candle: false,
    },
    text: 'Happy Birthday!',
    textColor: '#5B2A1B',
    toppers: [{ id: 1, emoji: '🎀', x: 0, z: 0 }],
    customPts: null,
    customerName: '',
    date: '',
    notes: '',
  });

  const totalPrice = useMemo(() => {
    const decoCost = (Object.keys(cake.deco) as DecoKey[]).reduce(
      (sum, k) => sum + (cake.deco[k] ? DECOS[k].price : 0),
      0
    );
    const topperCost = cake.toppers.length * 6000;
    return (
      SIZES[cake.size].price +
      SHAPES[cake.shape].price +
      FLAVORS[cake.flavor].price +
      FILLINGS[cake.fill].price +
      decoCost +
      topperCost
    );
  }, [cake]);

  // Three.js Viewport Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const cakeGroupRef = useRef<THREE.Group | null>(null);
  const rotRef = useRef({ theta: 0.55, phi: 0.45, dist: 5.2, dragging: false, lastX: 0 });
  const autoSpinRef = useRef(autoSpin);

  useEffect(() => {
    autoSpinRef.current = autoSpin;
  }, [autoSpin]);

  useEffect(() => {
    rotRef.current.dist = zoomed ? 3.8 : 5.3;
  }, [zoomed]);

  // Initialize Three.js Scene once
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xf8c9d4, 1.05));
    const dirLight = new THREE.DirectionalLight(0xfffaf2, 0.9);
    dirLight.position.set(3.5, 6.5, 5);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0xf6b4c2, 0.45);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const root = new THREE.Group();
    const cakeGroup = new THREE.Group();
    root.add(cakeGroup);
    scene.add(root);
    cakeGroupRef.current = cakeGroup;

    const handleResize = () => {
      if (!box) return;
      const w = Math.max(1, box.clientWidth);
      const h = Math.max(1, box.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(box);
    handleResize();

    let rafId = 0;
    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      if (autoSpinRef.current && !rotRef.current.dragging) {
        rotRef.current.theta += 0.0055;
      }
      root.rotation.y = rotRef.current.theta;
      const d = rotRef.current.dist;
      const p = rotRef.current.phi;
      camera.position.set(0, 0.55 + d * Math.sin(p), d * Math.cos(p));
      camera.lookAt(0, 0.45, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      renderer.dispose();
    };
  }, []);

  // Rebuild 3D cake meshes whenever cake configuration changes
  useEffect(() => {
    const group = cakeGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    const R = SIZES[cake.size].d / 12;
    const H = 1.02;

    const makeMat = (color: string, roughness = 0.5) =>
      new THREE.MeshStandardMaterial({ color, roughness });

    // Cake Pedestal Plate
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 1.38, R * 1.3, 0.09, 56),
      makeMat('#FFFDF9', 0.25)
    );
    plate.position.y = -0.045;
    group.add(plate);

    const goldRim = new THREE.Mesh(
      new THREE.TorusGeometry(R * 1.35, 0.018, 10, 64),
      makeMat('#C59B62', 0.3)
    );
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.y = 0;
    group.add(goldRim);

    // Cake Body
    const bodyGeo = createShapeGeometry(cake.shape, R, H, cake.customPts);
    const bodyMesh = new THREE.Mesh(bodyGeo, makeMat(FLAVORS[cake.flavor].color, 0.65));
    bodyMesh.position.y = H / 2;
    group.add(bodyMesh);

    // Filling Layer
    const fillGeo = createShapeGeometry(cake.shape, R * 1.015, 0.08, cake.customPts);
    const fillMesh = new THREE.Mesh(fillGeo, makeMat(FILLINGS[cake.fill].color, 0.45));
    fillMesh.position.y = H * 0.48;
    group.add(fillMesh);

    // Top Icing Layer
    const iceGeo = createShapeGeometry(cake.shape, R * 1.02, 0.14, cake.customPts);
    const iceMesh = new THREE.Mesh(iceGeo, makeMat(cake.icing, 0.28));
    iceMesh.position.y = H - 0.02;
    group.add(iceMesh);

    // Decorative Drips around rim
    if (cake.deco.drip) {
      const dripMat = makeMat(cake.icing === '#FFF8F0' ? '#F3B4C2' : '#FFF8F0', 0.24);
      const count = 16;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const len = 0.2 + (i % 3) * 0.11;
        const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, len, 10), dripMat);
        drip.position.set(Math.cos(a) * R * 0.96, H - len / 2 - 0.02, Math.sin(a) * R * 0.96);
        group.add(drip);
      }
    }

    // Fresh Strawberries
    if (cake.deco.straw) {
      const count = 8;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const berry = new THREE.Mesh(
          new THREE.ConeGeometry(0.11, 0.2, 14),
          makeMat('#C92C3E', 0.35)
        );
        berry.rotation.x = Math.PI;
        berry.position.set(Math.cos(a) * R * 0.68, H + 0.13, Math.sin(a) * R * 0.68);
        group.add(berry);

        const leaf = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.02, 0.03, 6),
          makeMat('#6B8E5B', 0.6)
        );
        leaf.position.set(Math.cos(a) * R * 0.68, H + 0.23, Math.sin(a) * R * 0.68);
        group.add(leaf);
      }
    }

    // Mixed Berries
    if (cake.deco.berry) {
      const count = 12;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + 0.25;
        const col = i % 2 === 0 ? '#3E4C85' : '#9E3B42';
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), makeMat(col, 0.3));
        b.position.set(Math.cos(a) * R * 0.56, H + 0.1, Math.sin(a) * R * 0.56);
        group.add(b);
      }
    }

    // Sugar Flowers
    if (cake.deco.flower) {
      const count = 6;
      const petalColors = ['#F7B7C5', '#FFF2DA', '#E9A3B8'];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + 0.4;
        const flower = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.1, 0),
          makeMat(petalColors[i % petalColors.length], 0.45)
        );
        flower.scale.set(1, 0.55, 1);
        flower.position.set(Math.cos(a) * R * 0.78, H + 0.09, Math.sin(a) * R * 0.78);
        group.add(flower);
      }
    }

    // Festive Sprinkles
    if (cake.deco.spr) {
      const sprCols = ['#EFA7B8', '#F6D55C', '#9AD3BC', '#FFFDF9', '#D88C9A'];
      for (let i = 0; i < 28; i++) {
        const a = i * 2.399;
        const r = Math.sqrt(i / 28) * R * 0.85;
        const sp = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.025, 0.025),
          makeMat(sprCols[i % sprCols.length], 0.35)
        );
        sp.rotation.y = a;
        sp.position.set(Math.cos(a) * r, H + 0.065, Math.sin(a) * r);
        group.add(sp);
      }
    }

    // Birthday Candles
    if (cake.deco.candle) {
      const offsets = [
        [-0.22, -0.15],
        [0, -0.22],
        [0.22, -0.15],
      ];
      offsets.forEach(([ox, oz], idx) => {
        const stick = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032, 0.032, 0.46, 12),
          makeMat(idx === 1 ? '#EFA7B8' : '#FFFDF9', 0.4)
        );
        stick.position.set(ox * R, H + 0.25, oz * R);
        group.add(stick);

        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(0.052, 10, 10),
          new THREE.MeshBasicMaterial({ color: '#FFC95C' })
        );
        flame.scale.set(0.7, 1.35, 0.7);
        flame.position.set(ox * R, H + 0.53, oz * R);
        group.add(flame);
      });
    }

    // Custom Text Plaque on Cake Top
    if (cake.text.trim()) {
      const c = document.createElement('canvas');
      c.width = 768;
      c.height = 384;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 768, 384);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 62px "Cormorant Garamond", serif';
        ctx.fillStyle = cake.textColor;
        ctx.fillText(cake.text.slice(0, 26), 384, 192);
      }
      const tex = new THREE.CanvasTexture(c);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(R * 1.45, R * 0.72),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(0, H + 0.075, R * 0.14);
      group.add(plane);
    }

    // Emoji Toppers
    cake.toppers.forEach((topper) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '150px sans-serif';
        ctx.fillText(topper.emoji, 128, 134);
      }
      const tex = new THREE.CanvasTexture(c);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sprite.scale.set(0.48, 0.48, 1);
      sprite.position.set(topper.x * R * 0.65, H + 0.32, topper.z * R * 0.65);
      group.add(sprite);
    });
  }, [cake]);

  // Freehand Custom Shape Canvas
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokeRef = useRef<Array<[number, number]>>([]);
  const drawingRef = useRef(false);

  const paintDrawCanvas = (pts: Array<[number, number]> | null) => {
    const c = drawCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    if (!pts || pts.length < 2) return;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#9E3B42';
    ctx.fillStyle = '#FCE8EC';
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const px = 140 + x * 82;
      const py = 95 + y * 75;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  useEffect(() => {
    if (step === 2) {
      paintDrawCanvas(cake.customPts);
    }
  }, [step, cake.customPts]);

  const handleAddTopper = (emoji: string) => {
    const n = cake.toppers.length;
    const angle = (n * 2.2) % (Math.PI * 2);
    const radius = n === 0 ? 0 : 0.62;
    setCake((prev) => ({
      ...prev,
      toppers: [
        ...prev.toppers,
        {
          id: Date.now() + Math.random(),
          emoji,
          x: Math.sin(angle) * radius,
          z: -Math.cos(angle) * radius,
        },
      ],
    }));
  };

  const handleSubmitOrder = () => {
    const summaryName = `Custom Cake 3D (${SHAPES[cake.shape].label}, ${FLAVORS[cake.flavor].label}, Ø${SIZES[cake.size].d}cm)`;
    onSendToKasir({
      nama: summaryName,
      harga: totalPrice,
      pemesan: cake.customerName,
      tanggal: cake.date,
      catatan: cake.notes || cake.text,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-gradient-to-b from-[#FCE8EC] via-ivory to-[#F8E5E3] pt-24 lg:pt-32 pb-16 px-4 sm:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Top Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <button
            type="button"
            onClick={() => onNavigate('toko')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-dusty text-xs sm:text-sm font-bold text-ink shadow-sm hover:bg-blush/50 transition"
          >
            ← Kembali ke Ruang Cafe
          </button>
          <p className="text-xs font-bold text-burgundy">
            Studio Racik 3D Interaktif · Geser kue untuk memutar 360°
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
          {STEPS.map((label, idx) => {
            const active = idx === step;
            const done = idx < step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition shrink-0 border ${
                  active
                    ? 'bg-cherry text-white border-cherry shadow-md'
                    : done
                      ? 'bg-blush/80 text-ink border-dusty'
                      : 'bg-white/80 text-ink/70 border-dusty/50 hover:border-cherry/60'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-[11px]">
                  {done ? '✓' : idx + 1}
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Controls Card */}
          <div className="lg:col-span-6 bg-[#FFFDF9] border-2 border-dusty/60 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-coquette text-lg sm:text-xl font-bold text-ink">
                    Pilih Inspirasi atau Racik Sendiri
                  </h2>
                  <p className="text-xs text-ink/65 mt-1">
                    Mulai dari template siap pakai atau lanjutkan ke tahap berikutnya untuk kustomisasi penuh.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => {
                        setCake((prev) => ({ ...prev, ...tpl.patch }));
                        setStep(6);
                      }}
                      className="text-left p-4 rounded-2xl bg-ivory border-2 border-dusty/60 hover:border-cherry hover:bg-blush/35 transition flex flex-col justify-between gap-2"
                    >
                      <div>
                        <p className="font-coquette text-xs font-bold text-cherry">{tpl.name}</p>
                        <p className="text-[11px] text-ink/70 mt-1 leading-relaxed">{tpl.desc}</p>
                      </div>
                      <span className="text-[11px] font-bold text-burgundy">Pilih Template →</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-3 rounded-2xl bg-blush/70 hover:bg-blush border border-dusty text-ink font-bold text-sm transition"
                >
                  Atau Racik Kue Custom Dari Awal →
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-coquette text-lg font-bold text-ink">Pilih Ukuran Kue</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(SIZES) as SizeKey[]).map((k) => {
                    const s = SIZES[k];
                    const on = cake.size === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCake((prev) => ({ ...prev, size: k }))}
                        className={`p-4 rounded-2xl border-2 text-left transition ${
                          on
                            ? 'border-cherry bg-blush/45 shadow-sm'
                            : 'border-dusty/50 bg-ivory/60 hover:border-dusty'
                        }`}
                      >
                        <p className="font-coquette text-sm font-bold text-ink">{s.label}</p>
                        <p className="text-xs text-ink/65 mt-0.5">
                          Ø {s.d} cm · {s.serves}
                        </p>
                        <p className="text-sm font-bold text-cherry mt-2 tabular-nums">
                          {formatRupiah(s.price)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-coquette text-lg font-bold text-ink">Pilih Bentuk Kue</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.keys(SHAPES) as ShapeKey[]).map((k) => {
                    const sh = SHAPES[k];
                    const on = cake.shape === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCake((prev) => ({ ...prev, shape: k }))}
                        className={`p-3.5 rounded-2xl border-2 text-center transition ${
                          on
                            ? 'border-cherry bg-blush/45'
                            : 'border-dusty/50 bg-ivory/60 hover:border-dusty'
                        }`}
                      >
                        <p className="font-bold text-sm text-ink">{sh.label}</p>
                        <p className="text-xs text-cherry font-semibold mt-1 tabular-nums">
                          {sh.price ? '+' + formatRupiah(sh.price) : 'Termasuk'}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Freehand Custom Shape Canvas */}
                <div className="p-4 rounded-2xl bg-ivory border border-dusty/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">
                      Kanvas Bentuk Bebas (geser untuk menggambar bentuk kuemu)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCake((prev) => ({ ...prev, customPts: null, shape: 'round' }))}
                      className="text-xs font-bold text-cherry hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                  <canvas
                    ref={drawCanvasRef}
                    width={280}
                    height={190}
                    onPointerDown={(e) => {
                      const c = drawCanvasRef.current;
                      if (!c) return;
                      c.setPointerCapture(e.pointerId);
                      drawingRef.current = true;
                      const r = c.getBoundingClientRect();
                      strokeRef.current = [
                        [((e.clientX - r.left) * 280) / r.width, ((e.clientY - r.top) * 190) / r.height],
                      ];
                    }}
                    onPointerMove={(e) => {
                      if (!drawingRef.current || !drawCanvasRef.current) return;
                      const r = drawCanvasRef.current.getBoundingClientRect();
                      strokeRef.current.push([
                        ((e.clientX - r.left) * 280) / r.width,
                        ((e.clientY - r.top) * 190) / r.height,
                      ]);
                      const ctx = drawCanvasRef.current.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, 280, 190);
                        ctx.strokeStyle = '#9E3B42';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        strokeRef.current.forEach(([x, y], i) => {
                          if (i === 0) ctx.moveTo(x, y);
                          else ctx.lineTo(x, y);
                        });
                        ctx.stroke();
                      }
                    }}
                    onPointerUp={() => {
                      if (!drawingRef.current) return;
                      drawingRef.current = false;
                      const pts = strokeRef.current;
                      if (pts.length > 10) {
                        const xs = pts.map((p) => p[0]);
                        const ys = pts.map((p) => p[1]);
                        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
                        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
                        const scale =
                          Math.max(
                            Math.max(...xs) - Math.min(...xs),
                            Math.max(...ys) - Math.min(...ys)
                          ) / 2 || 1;
                        const sampled: Array<[number, number]> = Array.from({ length: 32 }, (_, i) => {
                          const p = pts[Math.floor((i * pts.length) / 32)];
                          return [(p[0] - cx) / scale, (p[1] - cy) / scale];
                        });
                        setCake((prev) => ({ ...prev, customPts: sampled, shape: 'custom' }));
                      }
                    }}
                    className="w-full h-[180px] bg-white rounded-xl border border-dusty/60 touch-none"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="font-coquette text-lg font-bold text-ink">Rasa Sponge, Isian &amp; Krim</h2>
                <div>
                  <p className="text-xs font-bold text-ink/70 mb-2">Rasa Sponge</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(Object.keys(FLAVORS) as FlavorKey[]).map((k) => {
                      const f = FLAVORS[k];
                      const on = cake.flavor === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setCake((prev) => ({ ...prev, flavor: k }))}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition ${
                            on ? 'border-cherry bg-blush/45' : 'border-dusty/50 bg-ivory/60'
                          }`}
                        >
                          <span
                            className="w-9 h-9 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: f.color }}
                          />
                          <span className="text-xs font-bold text-ink">{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-ink/70 mb-2">Isian Tengah</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(Object.keys(FILLINGS) as FillKey[]).map((k) => {
                      const f = FILLINGS[k];
                      const on = cake.fill === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setCake((prev) => ({ ...prev, fill: k }))}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition ${
                            on ? 'border-cherry bg-blush/45' : 'border-dusty/50 bg-ivory/60'
                          }`}
                        >
                          <span
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: f.color }}
                          />
                          <span className="text-[11px] font-bold text-ink text-center">{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-ink/70 mb-2">Warna Krim</p>
                  <div className="flex flex-wrap gap-2">
                    {ICINGS.map((ic) => {
                      const on = cake.icing === ic.hex;
                      return (
                        <button
                          key={ic.hex}
                          type="button"
                          onClick={() => setCake((prev) => ({ ...prev, icing: ic.hex }))}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition ${
                            on ? 'border-cherry bg-blush/45' : 'border-dusty/50 bg-ivory/60'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-ink/15"
                            style={{ backgroundColor: ic.hex }}
                          />
                          <span>{ic.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-coquette text-lg font-bold text-ink">Pilih Dekorasi Kue</h2>
                <p className="text-xs text-ink/65">Boleh memilih lebih dari satu hiasan manis.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.keys(DECOS) as DecoKey[]).map((k) => {
                    const d = DECOS[k];
                    const on = cake.deco[k];
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() =>
                          setCake((prev) => ({
                            ...prev,
                            deco: { ...prev.deco, [k]: !prev.deco[k] },
                          }))
                        }
                        className={`p-4 rounded-2xl border-2 text-center transition ${
                          on
                            ? 'border-cherry bg-blush/50 shadow-sm'
                            : 'border-dusty/50 bg-ivory/60 hover:border-dusty'
                        }`}
                      >
                        <p className="text-sm font-bold text-ink">{d.label}</p>
                        <p className="text-xs font-bold text-cherry mt-1 tabular-nums">
                          +{formatRupiah(d.price)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="font-coquette text-lg font-bold text-ink">Tulisan &amp; Topper Lucu</h2>
                <div>
                  <label htmlFor="custom-cake-text" className="block text-xs font-bold text-ink/75 mb-1">
                    Tulisan di Atas Kue
                  </label>
                  <input
                    id="custom-cake-text"
                    type="text"
                    maxLength={26}
                    value={cake.text}
                    onChange={(e) => setCake((prev) => ({ ...prev, text: e.target.value }))}
                    placeholder="Contoh: Happy Birthday!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-dusty/70 bg-ivory/60 text-sm font-semibold outline-none focus:border-cherry"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold text-ink/75 mb-1.5">Warna Tulisan</p>
                  <div className="flex items-center gap-2.5">
                    {['#5B2A1B', '#9E3B42', '#A36361', '#D96B91', '#4E6B53', '#FFFFFF'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCake((prev) => ({ ...prev, textColor: col }))}
                        aria-label={`Pilih warna tulisan ${col}`}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          cake.textColor === col
                            ? 'border-cherry scale-110'
                            : 'border-dusty/60'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-bold text-ink/75">Tambah Topper (+Rp 6.000 / topper)</p>
                    {cake.toppers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCake((prev) => ({ ...prev, toppers: [] }))}
                        className="inline-flex items-center gap-1 text-xs font-bold text-cherry hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Semua
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TOPPER_CHOICES.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleAddTopper(em)}
                        className="w-11 h-11 rounded-xl bg-ivory border border-dusty/70 hover:border-cherry hover:bg-blush/50 text-xl transition"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <h2 className="font-coquette text-lg font-bold text-ink">Ringkasan &amp; Catatan Kue</h2>
                <div className="bg-ivory rounded-2xl p-4 border-2 border-dashed border-burgundy/55 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Ukuran {SIZES[cake.size].label} (Ø{SIZES[cake.size].d} cm)</span>
                    <span className="font-bold tabular-nums">{formatRupiah(SIZES[cake.size].price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bentuk {SHAPES[cake.shape].label}</span>
                    <span className="font-bold tabular-nums">
                      {SHAPES[cake.shape].price ? formatRupiah(SHAPES[cake.shape].price) : 'Termasuk'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rasa {FLAVORS[cake.flavor].label} · Isian {FILLINGS[cake.fill].label}</span>
                    <span className="font-bold tabular-nums">
                      {formatRupiah(FLAVORS[cake.flavor].price + FILLINGS[cake.fill].price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dekorasi &amp; Topper ({cake.toppers.length})</span>
                    <span className="font-bold tabular-nums">
                      {formatRupiah(
                        totalPrice -
                          SIZES[cake.size].price -
                          SHAPES[cake.shape].price -
                          FLAVORS[cake.flavor].price -
                          FILLINGS[cake.fill].price
                      )}
                    </span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-dusty/60 flex justify-between text-sm font-bold text-cherry">
                    <span>Total Kue Custom</span>
                    <span className="tabular-nums">{formatRupiah(totalPrice)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cc-nama" className="block text-xs font-bold text-ink/75 mb-1">
                      Nama Pemesan
                    </label>
                    <input
                      id="cc-nama"
                      type="text"
                      value={cake.customerName}
                      onChange={(e) => setCake((prev) => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Contoh: Nabila Putri"
                      className="w-full px-3.5 py-2 rounded-xl border border-dusty/70 bg-ivory/60 text-xs font-semibold outline-none focus:border-cherry"
                    />
                  </div>
                  <div>
                    <label htmlFor="cc-tgl" className="block text-xs font-bold text-ink/75 mb-1">
                      Tanggal Pengambilan
                    </label>
                    <input
                      id="cc-tgl"
                      type="date"
                      value={cake.date}
                      onChange={(e) => setCake((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-dusty/70 bg-ivory/60 text-xs font-semibold outline-none focus:border-cherry"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cc-notes" className="block text-xs font-bold text-ink/75 mb-1">
                    Catatan Khusus
                  </label>
                  <textarea
                    id="cc-notes"
                    rows={2}
                    value={cake.notes}
                    onChange={(e) => setCake((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Permintaan rasa kurang manis, warna pita kotak, dll."
                    className="w-full px-3.5 py-2 rounded-xl border border-dusty/70 bg-ivory/60 text-xs font-semibold outline-none focus:border-cherry"
                  />
                </div>
              </div>
            )}

            {/* Step Navigation Buttons */}
            <div className="pt-4 border-t border-dusty/40 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="px-4 py-2 rounded-full bg-ivory border border-dusty/70 text-xs font-bold text-ink disabled:opacity-35 hover:bg-blush/40 transition"
              >
                ‹ Sebelumnya
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  className="px-5 py-2.5 rounded-full bg-cherry hover:bg-burgundy text-white text-xs font-bold shadow-sm transition"
                >
                  Selanjutnya ›
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cherry hover:bg-burgundy text-white text-xs font-bold shadow-md transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Kirim ke Kasir Toko</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Live 3D Preview Card */}
          <div className="lg:col-span-6 space-y-4">
            <div
              ref={boxRef}
              className="relative h-[360px] sm:h-[430px] rounded-3xl overflow-hidden border-2 border-dusty/60 shadow-lg"
              style={{
                background: 'radial-gradient(circle at 50% 38%, #FFF9F2 0%, #FCE8EC 55%, #F0C2CB 100%)',
              }}
            >
              <canvas
                ref={canvasRef}
                onPointerDown={(e) => {
                  rotRef.current.dragging = true;
                  rotRef.current.lastX = e.clientX;
                }}
                onPointerMove={(e) => {
                  if (!rotRef.current.dragging) return;
                  rotRef.current.theta += (e.clientX - rotRef.current.lastX) * 0.012;
                  rotRef.current.lastX = e.clientX;
                }}
                onPointerUp={() => {
                  rotRef.current.dragging = false;
                }}
                onPointerLeave={() => {
                  rotRef.current.dragging = false;
                }}
                className="w-full h-full block touch-none"
              />

              {/* Viewport Controls */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    rotRef.current.theta = 0.55;
                    rotRef.current.phi = 0.45;
                    setZoomed(false);
                    setAutoSpin(true);
                  }}
                  aria-label="Reset posisi kamera 3D"
                  className="w-10 h-10 rounded-xl bg-white/90 hover:bg-white border border-dusty/60 shadow-sm flex items-center justify-center text-ink transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomed((z) => !z)}
                  aria-label="Zoom kue 3D"
                  className="w-10 h-10 rounded-xl bg-white/90 hover:bg-white border border-dusty/60 shadow-sm flex items-center justify-center text-ink transition"
                >
                  {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                </button>
              </div>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-dusty/60 rounded-full p-1 shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    rotRef.current.theta -= 0.6;
                    setAutoSpin(false);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-bold hover:bg-blush/50"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setAutoSpin((a) => !a)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                    autoSpin ? 'bg-blush text-cherry' : 'text-ink/70 hover:bg-ivory'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{autoSpin ? 'Berputar' : 'Diam'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    rotRef.current.theta += 0.6;
                    setAutoSpin(false);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-bold hover:bg-blush/50"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Live Price Bar */}
            <div className="bg-[#FFFDF9] border-2 border-dusty/60 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-ink/65">Estimasi Harga Custom Cake</p>
                <p className="text-xs text-burgundy font-semibold mt-0.5">
                  {SHAPES[cake.shape].label} · {FLAVORS[cake.flavor].label} · Ø{SIZES[cake.size].d} cm
                </p>
              </div>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-cherry tabular-nums">
                {formatRupiah(totalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
