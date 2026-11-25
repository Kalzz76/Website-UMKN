"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as THREE from "three";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function OvenAuth({ initialTarget = "login" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tujuan = searchParams.get("ke");

  const [isRegisterActive, setIsRegisterActive] = useState(
    () => initialTarget === "reg"
  );

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [regNama, setRegNama] = useState("");
  const [regWa, setRegWa] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [memuat, setMemuat] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const toastTimerRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayBoxRef = useRef(null);

  const showToast = useCallback((message) => {
    setToastMsg(message);
    setToastVisible(true);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 3400);
  }, []);

  const switchPanel = useCallback(
    (toRegister) => {
      setIsRegisterActive(toRegister);
      if (typeof window !== "undefined") {
        if (toRegister) {
          window.history.replaceState(
            null,
            "",
            tujuan ? `/daftar?ke=${encodeURIComponent(tujuan)}` : "/daftar"
          );
        } else {
          window.history.replaceState(
            null,
            "",
            tujuan ? `/masuk?ke=${encodeURIComponent(tujuan)}` : "/masuk"
          );
        }
      }
    },
    [tujuan]
  );

  async function handleLogin(e) {
    e.preventDefault();
    const email = loginEmail.trim();
    const pass = loginPassword;

    if (!email || !pass) {
      showToast("Mohon isi email dan kata sandi terlebih dahulu.");
      return;
    }

    setMemuat(true);
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setMemuat(false);
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("email not confirmed")) {
        showToast("Email akun Anda belum terverifikasi.");
      } else {
        showToast("Email atau kata sandi salah. Silakan periksa kembali.");
      }
      return;
    }

    const { data: profil, error: errorProfil } = await supabase
      .from("profil")
      .select("nama, role, aktif")
      .eq("id", data.user.id)
      .single();

    if (errorProfil || !profil) {
      setMemuat(false);
      showToast("Gagal mengambil data profil pengguna.");
      return;
    }

    if (!profil.aktif) {
      await supabase.auth.signOut();
      setMemuat(false);
      showToast("Akun Anda telah dinonaktifkan. Silakan hubungi admin.");
      return;
    }

    showToast(`Selamat datang kembali, ${profil.nama || email}!`);

    window.setTimeout(() => {
      if (profil.role === "admin" || profil.role === "staf") {
        router.push("/dashboard");
      } else {
        const cleanTujuan =
          tujuan &&
          typeof tujuan === "string" &&
          tujuan.startsWith("/") &&
          !tujuan.startsWith("//") &&
          !tujuan.includes("://") &&
          tujuan !== "/"
            ? tujuan
            : "/user";
        router.push(cleanTujuan);
      }
      router.refresh();
    }, 650);
  }

  async function handleRegister(e) {
    e.preventDefault();
    const nama = regNama.trim();
    const wa = regWa.trim();
    const email = regEmail.trim();
    const pass = regPassword;

    if (!nama || nama.length < 2) {
      showToast("Nama lengkap minimal 2 karakter.");
      return;
    }
    if (!wa || wa.replace(/[^0-9]/g, "").length < 8) {
      showToast("Nomor WhatsApp minimal 8 angka.");
      return;
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showToast("Format alamat email tidak valid.");
      return;
    }
    if (!pass || pass.length < 6) {
      showToast("Kata sandi minimal 6 karakter.");
      return;
    }

    setMemuat(true);
    try {
      const res = await fetch("/api/daftar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          no_wa: wa,
          email,
          password: pass,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMemuat(false);
        showToast(data.pesan || "Pendaftaran gagal, silakan coba lagi.");
        return;
      }

      setMemuat(false);
      showToast(`Akun atas nama ${nama} berhasil dibuat! Silakan masuk.`);
      setLoginEmail(email);
      setRegPassword("");
      switchPanel(false);
    } catch {
      setMemuat(false);
      showToast("Terjadi gangguan koneksi internet.");
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayEl = overlayBoxRef.current;
    if (!canvas || !overlayEl) return;

    let rafId = 0;
    let resizeObserver = null;

    const getSize = () => ({
      w: overlayEl.clientWidth || window.innerWidth,
      h: overlayEl.clientHeight || window.innerHeight,
    });

    const initial = getSize();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd9baa0);

    const camera = new THREE.PerspectiveCamera(
      34,
      initial.w / initial.h,
      0.1,
      60
    );
    camera.position.set(0, 14.5, 2.3);
    camera.lookAt(0, 0, -0.35);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initial.w, initial.h, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ("outputColorSpace" in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    const ambientLight = new THREE.AmbientLight(0xfff1e0, 1.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff4e2, 2.4);
    sunLight.position.set(5.5, 14, 4.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.right = 10;
    sunLight.shadow.camera.top = 8;
    sunLight.shadow.camera.bottom = -8;
    sunLight.shadow.bias = -0.0008;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xf6d5b8, 0.95);
    fillLight.position.set(-7, 9, -4);
    scene.add(fillLight);

    const ovenLight = new THREE.PointLight(0xff8e3c, 1.4, 9, 0);
    ovenLight.position.set(5.15, 1.35, -3.55);
    scene.add(ovenLight);

    function applySRGB(tex) {
      if ("colorSpace" in tex) {
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      return tex;
    }

    function createTileTexture() {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#efe0cf";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "#d9a684";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillRect(128, 128, 128, 128);
      ctx.strokeStyle = "rgba(120, 74, 46, 0.14)";
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 128, 128);
      ctx.strokeRect(128, 0, 128, 128);
      ctx.strokeRect(0, 128, 128, 128);
      ctx.strokeRect(128, 128, 128, 128);
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(16, 12);
      return applySRGB(tex);
    }

    function createWoodTexture() {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#d5b087";
      ctx.fillRect(0, 0, 512, 256);
      const planks = 8;
      const plankH = 256 / planks;
      const tones = ["#d8b38a", "#cca276", "#d2ab81", "#c79d72"];
      for (let i = 0; i < planks; i++) {
        ctx.fillStyle = tones[i % tones.length];
        ctx.fillRect(0, i * plankH, 512, plankH - 1.5);
        ctx.fillStyle = "rgba(110, 68, 36, 0.14)";
        ctx.fillRect(0, (i + 1) * plankH - 1.5, 512, 1.5);
        ctx.strokeStyle = "rgba(130, 82, 42, 0.08)";
        ctx.lineWidth = 1;
        for (let g = 0; g < 3; g++) {
          ctx.beginPath();
          const y = i * plankH + 6 + g * 8;
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(170, y + 3, 340, y - 3, 512, y);
          ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 1.6);
      return applySRGB(tex);
    }

    function createParticleTexture() {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext("2d");
      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, "rgba(255, 252, 245, 0.95)");
      grad.addColorStop(0.5, "rgba(255, 246, 232, 0.45)");
      grad.addColorStop(1, "rgba(255, 246, 232, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }

    function createStarShape(outerR, innerR, points) {
      const shape = new THREE.Shape();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      return shape;
    }

    function createHeartShape(scale) {
      const s = new THREE.Shape();
      s.moveTo(0, -0.35 * scale);
      s.bezierCurveTo(
        0.55 * scale,
        0.05 * scale,
        0.55 * scale,
        0.65 * scale,
        0,
        0.35 * scale
      );
      s.bezierCurveTo(
        -0.55 * scale,
        0.65 * scale,
        -0.55 * scale,
        0.05 * scale,
        0,
        -0.35 * scale
      );
      return s;
    }

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xc8d0d8,
      metalness: 0.78,
      roughness: 0.25,
    });
    const ceramicWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xfffaf3,
      roughness: 0.32,
    });
    const berryMat = new THREE.MeshStandardMaterial({
      color: 0xd93648,
      roughness: 0.35,
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 28),
      new THREE.MeshStandardMaterial({
        map: createTileTexture(),
        roughness: 0.82,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    floor.receiveShadow = true;
    scene.add(floor);

    function createLimbSegment(
      startVec,
      endVec,
      radiusStart,
      radiusEnd,
      material
    ) {
      const dir = new THREE.Vector3().subVectors(endVec, startVec);
      const len = dir.length();
      const geo = new THREE.CylinderGeometry(radiusEnd, radiusStart, len, 14);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.copy(startVec).addScaledVector(dir, 0.5);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      );
      mesh.castShadow = true;
      return mesh;
    }

    const matRight = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.04, 1.35),
      new THREE.MeshStandardMaterial({ color: 0x9e3b42, roughness: 0.95 })
    );
    matRight.position.set(3.35, -1.18, -2.75);
    matRight.receiveShadow = true;
    scene.add(matRight);

    const matRightBorder = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 0.045, 1.05),
      new THREE.MeshStandardMaterial({ color: 0xdcb48c, roughness: 0.95 })
    );
    matRightBorder.position.set(3.35, -1.178, -2.75);
    matRightBorder.receiveShadow = true;
    scene.add(matRightBorder);

    const matLeft = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.04, 1.35),
      new THREE.MeshStandardMaterial({ color: 0x5f856e, roughness: 0.95 })
    );
    matLeft.position.set(-3.85, -1.18, -2.75);
    matLeft.receiveShadow = true;
    scene.add(matLeft);

    const matLeftBorder = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 0.045, 1.05),
      new THREE.MeshStandardMaterial({ color: 0xdfe6dc, roughness: 0.95 })
    );
    matLeftBorder.position.set(-3.85, -1.178, -2.75);
    matLeftBorder.receiveShadow = true;
    scene.add(matLeftBorder);

    const frontRunner = new THREE.Mesh(
      new THREE.BoxGeometry(11.6, 0.035, 1.25),
      new THREE.MeshStandardMaterial({ color: 0x9e3b42, roughness: 0.96 })
    );
    frontRunner.position.set(0, -1.182, 3.65);
    frontRunner.receiveShadow = true;
    scene.add(frontRunner);

    const frontRunnerInner = new THREE.Mesh(
      new THREE.BoxGeometry(11.1, 0.04, 0.92),
      new THREE.MeshStandardMaterial({ color: 0xe8cfb6, roughness: 0.96 })
    );
    frontRunnerInner.position.set(0, -1.18, 3.65);
    frontRunnerInner.receiveShadow = true;
    scene.add(frontRunnerInner);

    const backCounterY = 0.25;
    const backCabinetMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a28,
      roughness: 0.8,
    });
    const backTopMat = new THREE.MeshStandardMaterial({
      color: 0xede2d4,
      roughness: 0.55,
    });

    const backCounterBase = new THREE.Mesh(
      new THREE.BoxGeometry(24.0, 1.4, 1.35),
      backCabinetMat
    );
    backCounterBase.position.set(0, -0.5, -4.45);
    backCounterBase.receiveShadow = true;
    scene.add(backCounterBase);

    const backCounterTop = new THREE.Mesh(
      new THREE.BoxGeometry(24.2, 0.14, 1.48),
      backTopMat
    );
    backCounterTop.position.set(0, backCounterY - 0.07, -4.45);
    backCounterTop.castShadow = true;
    backCounterTop.receiveShadow = true;
    scene.add(backCounterTop);

    const ovenGroup = new THREE.Group();
    ovenGroup.position.set(5.15, backCounterY, -4.38);
    scene.add(ovenGroup);

    const ovenBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.85, 1.28),
      new THREE.MeshStandardMaterial({
        color: 0x2f2a28,
        metalness: 0.45,
        roughness: 0.42,
      })
    );
    ovenBody.position.y = 0.42;
    ovenBody.castShadow = true;
    ovenGroup.add(ovenBody);

    const ovenGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffa64d,
      emissive: 0xff6e1a,
      emissiveIntensity: 1.15,
      roughness: 0.2,
    });
    const ovenWindow = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.08, 0.16),
      ovenGlowMat
    );
    ovenWindow.position.set(0, 0.65, 0.62);
    ovenGroup.add(ovenWindow);

    const ovenHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.35, 10),
      metalMat
    );
    ovenHandle.rotation.z = Math.PI / 2;
    ovenHandle.position.set(0, 0.82, 0.72);
    ovenGroup.add(ovenHandle);

    const ovenTray = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.04, 0.86),
      new THREE.MeshStandardMaterial({
        color: 0x45494e,
        metalness: 0.7,
        roughness: 0.35,
      })
    );
    ovenTray.position.set(0, 0.87, -0.05);
    ovenTray.castShadow = true;
    ovenGroup.add(ovenTray);

    const pastryGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd98a3c,
      roughness: 0.52,
    });
    for (let i = 0; i < 3; i++) {
      const bun = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 10),
        pastryGoldMat
      );
      bun.scale.set(1.25, 0.65, 0.95);
      bun.position.set((i - 1) * 0.44, 0.96, -0.05);
      bun.castShadow = true;
      ovenGroup.add(bun);
    }

    const plateStack = new THREE.Group();
    plateStack.position.set(1.65, backCounterY, -4.3);
    scene.add(plateStack);
    for (let i = 0; i < 4; i++) {
      const pl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.42, 0.06, 22),
        ceramicWhiteMat
      );
      pl.position.y = 0.03 + i * 0.065;
      pl.castShadow = true;
      plateStack.add(pl);
    }

    const copperPot = new THREE.Group();
    copperPot.position.set(3.1, backCounterY, -4.32);
    scene.add(copperPot);
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xc87447,
      metalness: 0.78,
      roughness: 0.26,
    });
    const potBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.4, 0.45, 22),
      copperMat
    );
    potBody.position.y = 0.225;
    potBody.castShadow = true;
    copperPot.add(potBody);
    const potHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.05, 0.09),
      metalMat
    );
    potHandle.position.set(-0.62, 0.36, 0);
    copperPot.add(potHandle);

    const standMixer = new THREE.Group();
    standMixer.position.set(-5.35, backCounterY, -4.28);
    standMixer.rotation.y = 0.22;
    scene.add(standMixer);
    const mixerRedMat = new THREE.MeshStandardMaterial({
      color: 0x9e3b42,
      roughness: 0.28,
      metalness: 0.18,
    });
    const mixerBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.14, 0.66),
      mixerRedMat
    );
    mixerBase.position.y = 0.07;
    mixerBase.castShadow = true;
    standMixer.add(mixerBase);
    const mixerNeck = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.72, 0.46),
      mixerRedMat
    );
    mixerNeck.position.set(-0.26, 0.44, 0);
    mixerNeck.castShadow = true;
    standMixer.add(mixerNeck);
    const mixerHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 0.82, 18),
      mixerRedMat
    );
    mixerHead.rotation.z = Math.PI / 2;
    mixerHead.position.set(0.05, 0.76, 0);
    mixerHead.castShadow = true;
    standMixer.add(mixerHead);
    const mixerBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.22, 0.38, 20),
      metalMat
    );
    mixerBowl.position.set(0.22, 0.32, 0);
    mixerBowl.castShadow = true;
    standMixer.add(mixerBowl);

    const breadBasket = new THREE.Group();
    breadBasket.position.set(-2.35, backCounterY, -4.3);
    breadBasket.rotation.y = -0.12;
    scene.add(breadBasket);
    const basketBox = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.56, 0.24, 20),
      new THREE.MeshStandardMaterial({ color: 0xb07c49, roughness: 0.9 })
    );
    basketBox.scale.set(1.25, 1, 0.82);
    basketBox.position.y = 0.12;
    basketBox.castShadow = true;
    breadBasket.add(basketBox);
    for (let i = -1; i <= 1; i++) {
      const baguette = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 1.05, 12),
        pastryGoldMat
      );
      baguette.rotation.z = Math.PI / 2;
      baguette.rotation.y = i * 0.18;
      baguette.position.set(0, 0.26 + Math.abs(i) * 0.03, i * 0.2);
      baguette.castShadow = true;
      breadBasket.add(baguette);
    }

    const herbPot = new THREE.Group();
    herbPot.position.set(0.05, backCounterY, -4.28);
    scene.add(herbPot);
    const terraPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.2, 0.34, 16),
      new THREE.MeshStandardMaterial({ color: 0xb96242, roughness: 0.8 })
    );
    terraPot.position.y = 0.17;
    terraPot.castShadow = true;
    herbPot.add(terraPot);
    const herbMat = new THREE.MeshStandardMaterial({
      color: 0x4f7a53,
      roughness: 0.85,
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 10),
        herbMat
      );
      leaf.position.set(Math.cos(a) * 0.15, 0.38, Math.sin(a) * 0.15);
      herbPot.add(leaf);
    }

    const kettleGroup = new THREE.Group();
    kettleGroup.position.set(7.45, backCounterY, -4.35);
    scene.add(kettleGroup);
    const kettleBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.36, 0.48, 20),
      copperMat
    );
    kettleBody.position.y = 0.24;
    kettleBody.castShadow = true;
    kettleGroup.add(kettleBody);
    const kettleLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0x3b2820, roughness: 0.5 })
    );
    kettleLid.position.y = 0.5;
    kettleGroup.add(kettleLid);

    for (let i = 0; i < 2; i++) {
      const cJar = new THREE.Group();
      cJar.position.set(8.55 + i * 0.72, backCounterY, -4.35);
      scene.add(cJar);
      const cJarBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, 0.55, 18),
        new THREE.MeshStandardMaterial({
          color: i === 0 ? 0xf3d6b0 : 0x7c4a2e,
          roughness: 0.55,
        })
      );
      cJarBody.position.y = 0.275;
      cJarBody.castShadow = true;
      cJar.add(cJarBody);
      const cJarCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.27, 0.27, 0.08, 18),
        new THREE.MeshStandardMaterial({ color: 0xa66d3f, roughness: 0.65 })
      );
      cJarCap.position.y = 0.58;
      cJar.add(cJarCap);
    }

    const scaleGroup = new THREE.Group();
    scaleGroup.position.set(-7.55, backCounterY, -4.32);
    scene.add(scaleGroup);
    const scaleBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.36, 0.64),
      new THREE.MeshStandardMaterial({ color: 0x7ba38a, roughness: 0.4 })
    );
    scaleBase.position.y = 0.18;
    scaleBase.castShadow = true;
    scaleGroup.add(scaleBase);
    const scalePan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.26, 0.12, 20),
      metalMat
    );
    scalePan.position.y = 0.44;
    scalePan.castShadow = true;
    scaleGroup.add(scalePan);

    const pitcher = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.32, 0.56, 18),
      ceramicWhiteMat
    );
    pitcher.position.set(-8.85, backCounterY + 0.28, -4.34);
    pitcher.castShadow = true;
    scene.add(pitcher);

    const sideCounterRight = new THREE.Group();
    sideCounterRight.position.set(8.85, 0, 0.15);
    scene.add(sideCounterRight);

    const sideRightBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 1.4, 5.4),
      backCabinetMat
    );
    sideRightBase.position.y = -0.5;
    sideRightBase.receiveShadow = true;
    sideCounterRight.add(sideRightBase);

    const sideRightTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.16, 5.55),
      backTopMat
    );
    sideRightTop.position.y = backCounterY - 0.08;
    sideRightTop.castShadow = true;
    sideRightTop.receiveShadow = true;
    sideCounterRight.add(sideRightTop);

    const clocheBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.62, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0xa66d3f, roughness: 0.55 })
    );
    clocheBase.position.set(-0.05, backCounterY + 0.04, -1.55);
    clocheBase.castShadow = true;
    sideCounterRight.add(clocheBase);

    const displayCake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.52, 0.38, 22),
      new THREE.MeshStandardMaterial({ color: 0x5c3320, roughness: 0.35 })
    );
    displayCake.position.set(-0.05, backCounterY + 0.27, -1.55);
    displayCake.castShadow = true;
    sideCounterRight.add(displayCake);

    const clocheDome = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.64,
        22,
        16,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.52
      ),
      new THREE.MeshStandardMaterial({
        color: 0xeef8ff,
        roughness: 0.1,
        metalness: 0.08,
        transparent: true,
        opacity: 0.34,
      })
    );
    clocheDome.position.set(-0.05, backCounterY + 0.08, -1.55);
    sideCounterRight.add(clocheDome);

    const box1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.34, 1.15),
      new THREE.MeshStandardMaterial({ color: 0xf7cdd4, roughness: 0.7 })
    );
    box1.position.set(-0.02, backCounterY + 0.17, 0.25);
    box1.rotation.y = 0.08;
    box1.castShadow = true;
    sideCounterRight.add(box1);

    const boxRibbon1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.17, 0.36, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x9e3b42, roughness: 0.5 })
    );
    boxRibbon1.position.copy(box1.position);
    boxRibbon1.rotation.y = 0.08;
    sideCounterRight.add(boxRibbon1);

    const box2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.28, 0.92),
      new THREE.MeshStandardMaterial({ color: 0xfff4e6, roughness: 0.72 })
    );
    box2.position.set(-0.02, backCounterY + 0.48, 0.25);
    box2.rotation.y = -0.14;
    box2.castShadow = true;
    sideCounterRight.add(box2);

    const coffeeTray = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.05, 1.35),
      new THREE.MeshStandardMaterial({ color: 0x8b5a36, roughness: 0.65 })
    );
    coffeeTray.position.set(-0.05, backCounterY + 0.025, 1.85);
    coffeeTray.castShadow = true;
    sideCounterRight.add(coffeeTray);

    for (let i = 0; i < 2; i++) {
      const mug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.16, 0.28, 16),
        ceramicWhiteMat
      );
      mug.position.set(
        -0.22 + i * 0.44,
        backCounterY + 0.19,
        1.68 + i * 0.28
      );
      mug.castShadow = true;
      sideCounterRight.add(mug);
    }

    const rightPlant = new THREE.Group();
    rightPlant.position.set(8.55, -1.2, 3.65);
    scene.add(rightPlant);
    const bigPotMat = new THREE.MeshStandardMaterial({
      color: 0xb96242,
      roughness: 0.8,
    });
    const bigPotR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.54, 0.38, 0.72, 18),
      bigPotMat
    );
    bigPotR.position.y = 0.36;
    bigPotR.castShadow = true;
    rightPlant.add(bigPotR);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x45734b,
      roughness: 0.82,
    });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const lf = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 10),
        foliageMat
      );
      lf.scale.set(1.25, 0.55, 0.85);
      lf.position.set(
        Math.cos(a) * 0.34,
        0.82 + (i % 2) * 0.14,
        Math.sin(a) * 0.34
      );
      lf.rotation.y = -a;
      lf.castShadow = true;
      rightPlant.add(lf);
    }

    const sideCounterLeft = new THREE.Group();
    sideCounterLeft.position.set(-8.85, 0, 0.15);
    scene.add(sideCounterLeft);

    const sideLeftBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 1.4, 5.4),
      backCabinetMat
    );
    sideLeftBase.position.y = -0.5;
    sideLeftBase.receiveShadow = true;
    sideCounterLeft.add(sideLeftBase);

    const sideLeftTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.16, 5.55),
      backTopMat
    );
    sideLeftTop.position.y = backCounterY - 0.08;
    sideLeftTop.castShadow = true;
    sideLeftTop.receiveShadow = true;
    sideCounterLeft.add(sideLeftTop);

    const cinPan = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.06, 1.75),
      new THREE.MeshStandardMaterial({
        color: 0x45494e,
        metalness: 0.7,
        roughness: 0.35,
      })
    );
    cinPan.position.set(0.05, backCounterY + 0.03, -1.4);
    cinPan.castShadow = true;
    sideCounterLeft.add(cinPan);

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        const roll = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.21, 0.16, 16),
          pastryGoldMat
        );
        roll.position.set(
          -0.22 + c * 0.52,
          backCounterY + 0.14,
          -1.9 + r * 0.5
        );
        roll.castShadow = true;
        sideCounterLeft.add(roll);
        const glaze = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.16, 0.04, 14),
          ceramicWhiteMat
        );
        glaze.position.set(
          -0.22 + c * 0.52,
          backCounterY + 0.23,
          -1.9 + r * 0.5
        );
        sideCounterLeft.add(glaze);
      }
    }

    const cutBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.07, 1.55),
      new THREE.MeshStandardMaterial({ color: 0xba8756, roughness: 0.65 })
    );
    cutBoard.position.set(0.05, backCounterY + 0.035, 0.7);
    cutBoard.rotation.y = 0.06;
    cutBoard.castShadow = true;
    sideCounterLeft.add(cutBoard);

    const sourdough = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 14),
      new THREE.MeshStandardMaterial({ color: 0xc97b36, roughness: 0.72 })
    );
    sourdough.scale.set(0.88, 0.58, 1.25);
    sourdough.position.set(0.05, backCounterY + 0.24, 0.65);
    sourdough.castShadow = true;
    sideCounterLeft.add(sourdough);

    const leftPlant = rightPlant.clone();
    leftPlant.position.set(-8.55, -1.2, 3.65);
    scene.add(leftPlant);

    const flourSack = new THREE.Group();
    flourSack.position.set(-5.75, -1.2, 3.35);
    scene.add(flourSack);
    const sackBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.54, 0.82, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4b68c, roughness: 0.95 })
    );
    sackBody.position.y = 0.41;
    sackBody.castShadow = true;
    flourSack.add(sackBody);
    const sackFlourTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0xfdf9f2, roughness: 0.95 })
    );
    sackFlourTop.scale.set(1, 0.45, 1);
    sackFlourTop.position.y = 0.8;
    flourSack.add(sackFlourTop);

    const sugarSack = flourSack.clone();
    sugarSack.scale.set(0.78, 0.75, 0.78);
    sugarSack.position.set(-4.72, -1.2, 3.68);
    scene.add(sugarSack);

    const trolleyGroup = new THREE.Group();
    trolleyGroup.position.set(2.55, -1.2, 3.55);
    trolleyGroup.rotation.y = -0.12;
    scene.add(trolleyGroup);

    const trolleyShelf = new THREE.Mesh(
      new THREE.BoxGeometry(1.95, 0.1, 1.15),
      new THREE.MeshStandardMaterial({ color: 0xa66d3f, roughness: 0.6 })
    );
    trolleyShelf.position.y = 0.82;
    trolleyShelf.castShadow = true;
    trolleyShelf.receiveShadow = true;
    trolleyGroup.add(trolleyShelf);

    const trolleyPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.4, 0.05, 20),
      ceramicWhiteMat
    );
    trolleyPlate.position.set(-0.35, 0.89, 0);
    trolleyPlate.castShadow = true;
    trolleyGroup.add(trolleyPlate);

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const tart = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.12, 0.08, 14),
        pastryGoldMat
      );
      tart.position.set(
        -0.35 + Math.cos(a) * 0.18,
        0.95,
        Math.sin(a) * 0.18
      );
      trolleyGroup.add(tart);
    }

    const foldedTowel = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.08, 0.78),
      new THREE.MeshStandardMaterial({ color: 0xf7cdd4, roughness: 0.9 })
    );
    foldedTowel.position.set(0.45, 0.91, 0);
    foldedTowel.castShadow = true;
    trolleyGroup.add(foldedTowel);

    const stoolGroup = new THREE.Group();
    stoolGroup.position.set(5.65, -1.2, 3.35);
    scene.add(stoolGroup);
    const stoolSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.46, 0.1, 20),
      new THREE.MeshStandardMaterial({ color: 0x9c663c, roughness: 0.65 })
    );
    stoolSeat.position.y = 0.72;
    stoolSeat.castShadow = true;
    stoolGroup.add(stoolSeat);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.038, 0.72, 10),
        new THREE.MeshStandardMaterial({ color: 0x734932, roughness: 0.75 })
      );
      leg.position.set(Math.cos(a) * 0.28, 0.36, Math.sin(a) * 0.28);
      stoolGroup.add(leg);
    }

    const stoolLeft = stoolGroup.clone();
    stoolLeft.position.set(-2.35, -1.2, 3.55);
    scene.add(stoolLeft);

    const counterTopY = 0.28;

    const islandBase = new THREE.Mesh(
      new THREE.BoxGeometry(13.2, 1.38, 4.1),
      new THREE.MeshStandardMaterial({ color: 0x5c3a28, roughness: 0.82 })
    );
    islandBase.position.set(0, -0.51, 0.25);
    islandBase.castShadow = true;
    islandBase.receiveShadow = true;
    scene.add(islandBase);

    const islandTrim = new THREE.Mesh(
      new THREE.BoxGeometry(13.56, 0.16, 4.46),
      new THREE.MeshStandardMaterial({ color: 0x6b442a, roughness: 0.68 })
    );
    islandTrim.position.set(0, counterTopY - 0.1, 0.25);
    islandTrim.castShadow = true;
    islandTrim.receiveShadow = true;
    scene.add(islandTrim);

    const islandTop = new THREE.Mesh(
      new THREE.BoxGeometry(13.38, 0.14, 4.3),
      new THREE.MeshStandardMaterial({
        map: createWoodTexture(),
        roughness: 0.62,
      })
    );
    islandTop.position.set(0, counterTopY - 0.07, 0.25);
    islandTop.castShadow = true;
    islandTop.receiveShadow = true;
    scene.add(islandTop);

    const flourDustMat = new THREE.MeshStandardMaterial({
      color: 0xfffaf2,
      roughness: 0.96,
      transparent: true,
      opacity: 0.36,
    });
    const dustPatchPositions = [
      [-2.6, 0.25, 1.35],
      [-4.2, -0.5, 0.95],
      [2.1, -0.35, 0.8],
    ];
    dustPatchPositions.forEach(([px, pz, pr]) => {
      const patch = new THREE.Mesh(
        new THREE.CircleGeometry(pr, 24),
        flourDustMat
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(px, counterTopY + 0.004, pz);
      scene.add(patch);
    });

    const cakeStation = new THREE.Group();
    cakeStation.position.set(3.35, counterTopY, -0.15);
    scene.add(cakeStation);

    const turntablePedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.82, 0.14, 28),
      metalMat
    );
    turntablePedestal.position.y = 0.07;
    turntablePedestal.castShadow = true;
    turntablePedestal.receiveShadow = true;
    cakeStation.add(turntablePedestal);

    const cakeSpinner = new THREE.Group();
    cakeSpinner.position.y = 0.14;
    cakeStation.add(cakeSpinner);

    const platter = new THREE.Mesh(
      new THREE.CylinderGeometry(1.32, 1.24, 0.07, 36),
      ceramicWhiteMat
    );
    platter.position.y = 0.035;
    platter.castShadow = true;
    platter.receiveShadow = true;
    cakeSpinner.add(platter);

    const tier1Mat = new THREE.MeshStandardMaterial({
      color: 0x8f5334,
      roughness: 0.45,
    });
    const tier1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.96, 0.98, 0.52, 32),
      tier1Mat
    );
    tier1.position.y = 0.33;
    tier1.castShadow = true;
    tier1.receiveShadow = true;
    cakeSpinner.add(tier1);

    const creamFrostingMat = new THREE.MeshStandardMaterial({
      color: 0xfff5e8,
      roughness: 0.35,
    });
    const tier1FrostingTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.97, 0.97, 0.08, 32),
      creamFrostingMat
    );
    tier1FrostingTop.position.y = 0.6;
    tier1FrostingTop.receiveShadow = true;
    cakeSpinner.add(tier1FrostingTop);

    const tier2Mat = new THREE.MeshStandardMaterial({
      color: 0xfbeee0,
      roughness: 0.36,
    });
    const tier2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.64, 0.44, 30),
      tier2Mat
    );
    tier2.position.y = 0.85;
    tier2.castShadow = true;
    tier2.receiveShadow = true;
    cakeSpinner.add(tier2);

    const pinkPipingMat = new THREE.MeshStandardMaterial({
      color: 0xf4a2ae,
      roughness: 0.38,
    });
    const pipingRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.055, 10, 28),
      pinkPipingMat
    );
    pipingRim.rotation.x = Math.PI / 2;
    pipingRim.position.y = 1.07;
    pipingRim.castShadow = true;
    cakeSpinner.add(pipingRim);

    const berryGeo = new THREE.SphereGeometry(0.09, 14, 14);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const b = new THREE.Mesh(berryGeo, berryMat);
      b.scale.set(1, 1.18, 1);
      b.position.set(Math.cos(a) * 0.36, 1.14, Math.sin(a) * 0.36);
      b.castShadow = true;
      cakeSpinner.add(b);
    }
    const centerBerry = new THREE.Mesh(berryGeo, berryMat);
    centerBerry.scale.set(1.15, 1.25, 1.15);
    centerBerry.position.set(0, 1.16, 0);
    centerBerry.castShadow = true;
    cakeSpinner.add(centerBerry);

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xfaf7f2,
      roughness: 0.72,
    });
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x9e3b42,
      roughness: 0.82,
    });
    const apron2Mat = new THREE.MeshStandardMaterial({
      color: 0xb86b35,
      roughness: 0.82,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf0c19d,
      roughness: 0.62,
    });
    const skin2Mat = new THREE.MeshStandardMaterial({
      color: 0xe3b18a,
      roughness: 0.62,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x3b2518,
      roughness: 0.78,
    });
    const hair2Mat = new THREE.MeshStandardMaterial({
      color: 0x5c3622,
      roughness: 0.78,
    });
    const hatMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.75,
    });

    const bakerGroup = new THREE.Group();
    bakerGroup.position.set(3.35, -0.22, -2.72);
    scene.add(bakerGroup);

    const chef1Shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.75, 20),
      new THREE.MeshBasicMaterial({
        color: 0x1a0e08,
        transparent: true,
        opacity: 0.25,
      })
    );
    chef1Shadow.rotation.x = -Math.PI / 2;
    chef1Shadow.position.y = -0.93;
    bakerGroup.add(chef1Shadow);

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.54, 0.64, 1.32, 22),
      shirtMat
    );
    torso.scale.set(1.24, 1, 0.68);
    torso.position.y = 0.56;
    torso.castShadow = true;
    bakerGroup.add(torso);

    const apronFront = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, 1.04, 0.1),
      apronMat
    );
    apronFront.position.set(0, 0.48, 0.4);
    apronFront.castShadow = true;
    bakerGroup.add(apronFront);

    const bakerHeadGroup = new THREE.Group();
    bakerHeadGroup.position.set(0, 1.48, 0.06);
    bakerGroup.add(bakerHeadGroup);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 22, 20),
      skinMat
    );
    head.castShadow = true;
    bakerHeadGroup.add(head);

    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.46,
        20,
        16,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.55
      ),
      hairMat
    );
    hairCap.rotation.x = -0.35;
    hairCap.position.y = 0.04;
    bakerHeadGroup.add(hairCap);

    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.32, -0.02);
    hatGroup.rotation.x = -0.1;
    bakerHeadGroup.add(hatGroup);

    const hatBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.42, 0.32, 24),
      hatMat
    );
    hatBand.position.y = 0.12;
    hatBand.castShadow = true;
    hatGroup.add(hatBand);

    const centerPuff = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 18, 16),
      hatMat
    );
    centerPuff.position.y = 0.5;
    centerPuff.castShadow = true;
    hatGroup.add(centerPuff);

    const puffGeo = new THREE.SphereGeometry(0.28, 14, 14);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const puff = new THREE.Mesh(puffGeo, hatMat);
      puff.position.set(Math.cos(a) * 0.27, 0.42, Math.sin(a) * 0.27);
      puff.castShadow = true;
      hatGroup.add(puff);
    }

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.68, 1.06, 0.16);
    bakerGroup.add(leftArmPivot);

    const c1LShoulder = new THREE.Vector3(0, 0, 0);
    const c1LElbow = new THREE.Vector3(-0.08, -0.14, 0.62);
    const c1LHandPos = new THREE.Vector3(0.08, -0.26, 1.24);
    leftArmPivot.add(
      createLimbSegment(c1LShoulder, c1LElbow, 0.17, 0.145, shirtMat)
    );
    const c1LElbowJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      shirtMat
    );
    c1LElbowJoint.position.copy(c1LElbow);
    leftArmPivot.add(c1LElbowJoint);
    leftArmPivot.add(
      createLimbSegment(c1LElbow, c1LHandPos, 0.13, 0.11, skinMat)
    );

    const leftHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 14, 14),
      skinMat
    );
    leftHand.position.copy(c1LHandPos);
    leftHand.castShadow = true;
    leftArmPivot.add(leftHand);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.68, 1.12, 0.16);
    bakerGroup.add(rightArmPivot);

    const c1RShoulder = new THREE.Vector3(0, 0, 0);
    const c1RElbow = new THREE.Vector3(0.06, 0.22, 0.72);
    const c1RHandPos = new THREE.Vector3(-0.34, 0.64, 1.72);
    rightArmPivot.add(
      createLimbSegment(c1RShoulder, c1RElbow, 0.17, 0.145, shirtMat)
    );
    const c1RElbowJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      shirtMat
    );
    c1RElbowJoint.position.copy(c1RElbow);
    rightArmPivot.add(c1RElbowJoint);
    rightArmPivot.add(
      createLimbSegment(c1RElbow, c1RHandPos, 0.13, 0.11, skinMat)
    );

    const rightHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 14, 14),
      skinMat
    );
    rightHand.position.copy(c1RHandPos);
    rightHand.castShadow = true;
    rightArmPivot.add(rightHand);

    const pipingBag = new THREE.Group();
    pipingBag.position.set(
      c1RHandPos.x - 0.04,
      c1RHandPos.y + 0.04,
      c1RHandPos.z + 0.14
    );
    pipingBag.rotation.set(0.55, 0.2, 0.28);
    rightArmPivot.add(pipingBag);

    const bagCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.19, 0.74, 16),
      new THREE.MeshStandardMaterial({ color: 0xf7b9c4, roughness: 0.45 })
    );
    bagCone.rotation.x = Math.PI;
    bagCone.position.y = 0.26;
    bagCone.castShadow = true;
    pipingBag.add(bagCone);

    const bagTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.052, 0.17, 12),
      metalMat
    );
    bagTip.rotation.x = Math.PI;
    bagTip.position.y = -0.17;
    pipingBag.add(bagTip);

    const bookGroup = new THREE.Group();
    bookGroup.position.set(1.25, counterTopY, -0.95);
    bookGroup.rotation.y = 0.22;
    scene.add(bookGroup);

    const bookCover = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.04, 0.86),
      new THREE.MeshStandardMaterial({ color: 0x8a3d2b, roughness: 0.7 })
    );
    bookCover.position.y = 0.02;
    bookCover.castShadow = true;
    bookGroup.add(bookCover);

    const pageMat = new THREE.MeshStandardMaterial({
      color: 0xfffaf0,
      roughness: 0.9,
    });
    const pageL = new THREE.Mesh(
      new THREE.BoxGeometry(0.53, 0.05, 0.78),
      pageMat
    );
    pageL.position.set(-0.28, 0.055, 0);
    bookGroup.add(pageL);

    const pageR = new THREE.Mesh(
      new THREE.BoxGeometry(0.53, 0.05, 0.78),
      pageMat
    );
    pageR.position.set(0.28, 0.055, 0);
    bookGroup.add(pageR);

    const bookmark = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.015, 0.92),
      new THREE.MeshStandardMaterial({ color: 0xd9384a, roughness: 0.6 })
    );
    bookmark.position.set(0.02, 0.085, 0.08);
    bookGroup.add(bookmark);

    const coolingRack = new THREE.Group();
    coolingRack.position.set(1.55, counterTopY, 1.38);
    coolingRack.rotation.y = -0.06;
    scene.add(coolingRack);

    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x2e3136,
      metalness: 0.75,
      roughness: 0.35,
    });
    const rackPlate = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.04, 1.05),
      wireMat
    );
    rackPlate.position.y = 0.05;
    rackPlate.castShadow = true;
    coolingRack.add(rackPlate);

    for (let i = 0; i < 2; i++) {
      const croissant = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.095, 10, 16, Math.PI * 1.15),
        pastryGoldMat
      );
      croissant.rotation.x = Math.PI / 2;
      croissant.rotation.z = 0.3 + i * 0.4;
      croissant.position.set(-0.42 + i * 0.56, 0.14, -0.12);
      croissant.castShadow = true;
      coolingRack.add(croissant);
    }

    const macaronColors = [0xf4a2ae, 0xa8d5ba, 0xf7dc8b];
    for (let i = 0; i < 3; i++) {
      const mac = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.11, 16),
        new THREE.MeshStandardMaterial({
          color: macaronColors[i],
          roughness: 0.45,
        })
      );
      mac.position.set(-0.45 + i * 0.45, 0.13, 0.28);
      mac.castShadow = true;
      coolingRack.add(mac);
    }

    const berryDish = new THREE.Group();
    berryDish.position.set(5.45, counterTopY, -0.75);
    scene.add(berryDish);

    const dishBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.28, 0.16, 22),
      ceramicWhiteMat
    );
    dishBowl.position.y = 0.08;
    dishBowl.castShadow = true;
    dishBowl.receiveShadow = true;
    berryDish.add(dishBowl);

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 12, 12),
        berryMat
      );
      b.position.set(Math.cos(a) * 0.15, 0.17, Math.sin(a) * 0.15);
      b.castShadow = true;
      berryDish.add(b);
    }

    const sprinkleColors = [0xf28ba8, 0x5c3420];
    for (let i = 0; i < 2; i++) {
      const sJar = new THREE.Group();
      sJar.position.set(5.35 + i * 0.62, counterTopY, 0.35 + i * 0.18);
      scene.add(sJar);
      const sFill = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.19, 0.36, 16),
        new THREE.MeshStandardMaterial({
          color: sprinkleColors[i],
          roughness: 0.7,
        })
      );
      sFill.position.y = 0.18;
      sFill.castShadow = true;
      sJar.add(sFill);
      const sLid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16),
        metalMat
      );
      sLid.position.y = 0.4;
      sJar.add(sLid);
    }

    const spatulaGroup = new THREE.Group();
    spatulaGroup.position.set(5.15, counterTopY + 0.04, 1.48);
    spatulaGroup.rotation.y = -0.35;
    scene.add(spatulaGroup);

    const spatHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.05, 0.56, 12),
      new THREE.MeshStandardMaterial({ color: 0x3b2820, roughness: 0.5 })
    );
    spatHandle.rotation.z = Math.PI / 2;
    spatHandle.position.x = -0.32;
    spatHandle.castShadow = true;
    spatulaGroup.add(spatHandle);

    const spatBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.02, 0.13),
      metalMat
    );
    spatBlade.position.x = 0.32;
    spatBlade.castShadow = true;
    spatulaGroup.add(spatBlade);

    const baker2Group = new THREE.Group();
    baker2Group.position.set(-3.85, -0.22, -2.72);
    scene.add(baker2Group);

    const chef2Shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 20),
      new THREE.MeshBasicMaterial({
        color: 0x1a0e08,
        transparent: true,
        opacity: 0.25,
      })
    );
    chef2Shadow.rotation.x = -Math.PI / 2;
    chef2Shadow.position.y = -0.93;
    baker2Group.add(chef2Shadow);

    const torso2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 1.28, 22),
      shirtMat
    );
    torso2.scale.set(1.2, 1, 0.66);
    torso2.position.y = 0.54;
    torso2.castShadow = true;
    baker2Group.add(torso2);

    const apron2Front = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.0, 0.1),
      apron2Mat
    );
    apron2Front.position.set(0, 0.46, 0.38);
    apron2Front.castShadow = true;
    baker2Group.add(apron2Front);

    const baker2HeadGroup = new THREE.Group();
    baker2HeadGroup.position.set(0, 1.44, 0.06);
    baker2Group.add(baker2HeadGroup);

    const head2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 22, 20),
      skin2Mat
    );
    head2.castShadow = true;
    baker2HeadGroup.add(head2);

    const hair2Cap = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.44,
        20,
        16,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.58
      ),
      hair2Mat
    );
    hair2Cap.rotation.x = -0.3;
    hair2Cap.position.y = 0.04;
    baker2HeadGroup.add(hair2Cap);

    const hairBun = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 14, 14),
      hair2Mat
    );
    hairBun.position.set(0, 0.08, -0.46);
    hairBun.castShadow = true;
    baker2HeadGroup.add(hairBun);

    const cap2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.43, 0.44, 0.24, 22),
      new THREE.MeshStandardMaterial({ color: 0x9e3b42, roughness: 0.72 })
    );
    cap2.position.set(0, 0.32, 0.02);
    cap2.rotation.x = 0.08;
    cap2.castShadow = true;
    baker2HeadGroup.add(cap2);

    const cap2Top = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.43,
        18,
        14,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.5
      ),
      new THREE.MeshStandardMaterial({ color: 0x9e3b42, roughness: 0.72 })
    );
    cap2Top.scale.set(1, 0.45, 1);
    cap2Top.position.set(0, 0.43, 0.02);
    cap2Top.castShadow = true;
    baker2HeadGroup.add(cap2Top);

    const baker2LeftArmPivot = new THREE.Group();
    baker2LeftArmPivot.position.set(-0.64, 1.06, 0.16);
    baker2Group.add(baker2LeftArmPivot);

    const c2LShoulder = new THREE.Vector3(0, 0, 0);
    const c2LElbow = new THREE.Vector3(-0.22, 0.06, 0.58);
    const c2LHandPos = new THREE.Vector3(-0.26, 0.02, 1.18);
    baker2LeftArmPivot.add(
      createLimbSegment(c2LShoulder, c2LElbow, 0.16, 0.138, shirtMat)
    );
    const c2LElbowJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.132, 12, 12),
      shirtMat
    );
    c2LElbowJoint.position.copy(c2LElbow);
    baker2LeftArmPivot.add(c2LElbowJoint);
    baker2LeftArmPivot.add(
      createLimbSegment(c2LElbow, c2LHandPos, 0.122, 0.106, skin2Mat)
    );

    const b2LeftHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 14, 14),
      skin2Mat
    );
    b2LeftHand.position.copy(c2LHandPos);
    b2LeftHand.castShadow = true;
    baker2LeftArmPivot.add(b2LeftHand);

    const baker2RightArmPivot = new THREE.Group();
    baker2RightArmPivot.position.set(0.64, 1.12, 0.16);
    baker2Group.add(baker2RightArmPivot);

    const c2RShoulder = new THREE.Vector3(0, 0, 0);
    const c2RElbow = new THREE.Vector3(0.08, 0.24, 0.72);
    const c2RHandPos = new THREE.Vector3(-0.78, 0.52, 1.64);
    baker2RightArmPivot.add(
      createLimbSegment(c2RShoulder, c2RElbow, 0.16, 0.138, shirtMat)
    );
    const c2RElbowJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.132, 12, 12),
      shirtMat
    );
    c2RElbowJoint.position.copy(c2RElbow);
    baker2RightArmPivot.add(c2RElbowJoint);
    baker2RightArmPivot.add(
      createLimbSegment(c2RElbow, c2RHandPos, 0.122, 0.106, skin2Mat)
    );

    const b2RightHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 14, 14),
      skin2Mat
    );
    b2RightHand.position.copy(c2RHandPos);
    b2RightHand.castShadow = true;
    baker2RightArmPivot.add(b2RightHand);

    const bowlGroup = new THREE.Group();
    bowlGroup.position.set(-4.25, counterTopY, -0.78);
    scene.add(bowlGroup);

    const steelBowlMat = new THREE.MeshStandardMaterial({
      color: 0xd0d7de,
      metalness: 0.76,
      roughness: 0.22,
    });
    const bowlOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.84, 0.55, 0.56, 32),
      steelBowlMat
    );
    bowlOuter.position.y = 0.28;
    bowlOuter.castShadow = true;
    bowlOuter.receiveShadow = true;
    bowlGroup.add(bowlOuter);

    const bowlRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.84, 0.03, 10, 32),
      steelBowlMat
    );
    bowlRim.rotation.x = Math.PI / 2;
    bowlRim.position.y = 0.55;
    bowlGroup.add(bowlRim);

    const batter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.77, 0.72, 0.08, 28),
      new THREE.MeshStandardMaterial({ color: 0xffe49e, roughness: 0.28 })
    );
    batter.position.y = 0.5;
    bowlGroup.add(batter);

    const whiskOrbitPivot = new THREE.Group();
    whiskOrbitPivot.position.y = 0.5;
    bowlGroup.add(whiskOrbitPivot);

    const whiskGroup = new THREE.Group();
    whiskGroup.position.set(0.2, 0, 0);
    whiskGroup.rotation.z = -0.35;
    whiskOrbitPivot.add(whiskGroup);

    const whiskHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.048, 0.72, 12),
      new THREE.MeshStandardMaterial({ color: 0x9e3b42, roughness: 0.48 })
    );
    whiskHandle.position.y = 0.54;
    whiskHandle.castShadow = true;
    whiskGroup.add(whiskHandle);

    for (let i = 0; i < 4; i++) {
      const loop = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.015, 8, 16),
        metalMat
      );
      loop.position.y = 0.12;
      loop.scale.set(0.85, 1.3, 1);
      loop.rotation.y = (i / 4) * Math.PI;
      whiskGroup.add(loop);
    }

    const pastryGroup = new THREE.Group();
    pastryGroup.position.set(-1.85, counterTopY, 1.25);
    scene.add(pastryGroup);

    const parchmentMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 0.02, 1.82),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 })
    );
    parchmentMesh.position.y = 0.01;
    parchmentMesh.receiveShadow = true;
    pastryGroup.add(parchmentMesh);

    const doughMat = new THREE.MeshStandardMaterial({
      color: 0xe3c08d,
      roughness: 0.72,
    });
    const dough = new THREE.Mesh(
      new THREE.CylinderGeometry(0.66, 0.69, 0.055, 30),
      doughMat
    );
    dough.scale.set(1.16, 1, 0.88);
    dough.position.set(-0.18, 0.045, 0.06);
    dough.castShadow = true;
    dough.receiveShadow = true;
    pastryGroup.add(dough);

    const rollingPin = new THREE.Group();
    rollingPin.position.set(-0.15, 0.16, -0.25);
    rollingPin.rotation.y = 0.18;
    pastryGroup.add(rollingPin);

    const pinWoodMat = new THREE.MeshStandardMaterial({
      color: 0xc68b59,
      roughness: 0.45,
    });
    const pinBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.105, 1.02, 18),
      pinWoodMat
    );
    pinBody.rotation.z = Math.PI / 2;
    pinBody.castShadow = true;
    rollingPin.add(pinBody);

    const pinHandleL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.058, 0.3, 14),
      new THREE.MeshStandardMaterial({ color: 0x9c6236, roughness: 0.5 })
    );
    pinHandleL.rotation.z = Math.PI / 2;
    pinHandleL.position.x = -0.66;
    pinHandleL.castShadow = true;
    rollingPin.add(pinHandleL);

    const pinHandleR = pinHandleL.clone();
    pinHandleR.position.x = 0.66;
    rollingPin.add(pinHandleR);

    const metallicCutterMat = new THREE.MeshStandardMaterial({
      color: 0xbac4ce,
      metalness: 0.86,
      roughness: 0.18,
    });
    const starGeo = new THREE.ExtrudeGeometry(createStarShape(0.22, 0.1, 5), {
      depth: 0.1,
      bevelEnabled: false,
    });
    const starCutter = new THREE.Mesh(starGeo, metallicCutterMat);
    starCutter.rotation.x = -Math.PI / 2;
    starCutter.position.set(0.74, 0.02, 0.46);
    starCutter.castShadow = true;
    pastryGroup.add(starCutter);

    const starCookie = new THREE.Mesh(
      new THREE.ExtrudeGeometry(createStarShape(0.19, 0.088, 5), {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 2,
      }),
      doughMat
    );
    starCookie.rotation.x = -Math.PI / 2;
    starCookie.position.set(0.32, 0.02, 0.62);
    starCookie.castShadow = true;
    pastryGroup.add(starCookie);

    const heartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.29), {
      depth: 0.1,
      bevelEnabled: false,
    });
    const heartCutter = new THREE.Mesh(heartGeo, metallicCutterMat);
    heartCutter.rotation.x = -Math.PI / 2;
    heartCutter.position.set(0.76, 0.02, -0.42);
    heartCutter.castShadow = true;
    pastryGroup.add(heartCutter);

    const heartCookie = new THREE.Mesh(
      new THREE.ExtrudeGeometry(createHeartShape(0.25), {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 2,
      }),
      doughMat
    );
    heartCookie.rotation.x = -Math.PI / 2;
    heartCookie.position.set(-0.78, 0.02, 0.56);
    heartCookie.castShadow = true;
    pastryGroup.add(heartCookie);

    const rackGroup = new THREE.Group();
    rackGroup.position.set(-5.25, counterTopY, 1.28);
    rackGroup.rotation.y = 0.03;
    scene.add(rackGroup);

    const panMetalMat = new THREE.MeshStandardMaterial({
      color: 0x3b3e42,
      metalness: 0.72,
      roughness: 0.34,
    });
    const panRimMat = new THREE.MeshStandardMaterial({
      color: 0x26282b,
      metalness: 0.65,
      roughness: 0.42,
    });

    const rackFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.04, 0.12, 1.42),
      panMetalMat
    );
    rackFrame.position.y = 0.06;
    rackFrame.castShadow = true;
    rackFrame.receiveShadow = true;
    rackGroup.add(rackFrame);

    const vanillaCakeMat = new THREE.MeshStandardMaterial({
      color: 0xe6be84,
      roughness: 0.78,
    });
    const chocoCakeMat = new THREE.MeshStandardMaterial({
      color: 0x5c3624,
      roughness: 0.75,
    });
    const cupcakeFrostings = [
      0xf4a2ae,
      0xfff3df,
      0xf4a2ae,
      0xfff3df,
      0xf4a2ae,
      0xfff3df,
    ];
    const linerMat = new THREE.MeshStandardMaterial({
      color: 0xe8c7a3,
      roughness: 0.85,
    });

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        const cup = new THREE.Group();
        cup.position.set((c - 1) * 0.63, 0.12, (r - 0.5) * 0.62);

        const wellRing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.255, 0.255, 0.012, 22),
          panRimMat
        );
        wellRing.position.y = 0.004;
        cup.add(wellRing);

        const liner = new THREE.Mesh(
          new THREE.CylinderGeometry(0.23, 0.2, 0.09, 20),
          linerMat
        );
        liner.position.y = 0.035;
        cup.add(liner);

        const cakeDome = new THREE.Mesh(
          new THREE.SphereGeometry(
            0.22,
            18,
            12,
            0,
            Math.PI * 2,
            0,
            Math.PI * 0.55
          ),
          idx % 2 === 0 ? chocoCakeMat : vanillaCakeMat
        );
        cakeDome.scale.set(1, 0.58, 1);
        cakeDome.position.y = 0.065;
        cakeDome.castShadow = true;
        cup.add(cakeDome);

        const frostingMat = new THREE.MeshStandardMaterial({
          color: cupcakeFrostings[idx],
          roughness: 0.36,
        });
        const swirlBase = new THREE.Mesh(
          new THREE.TorusGeometry(0.12, 0.055, 10, 20),
          frostingMat
        );
        swirlBase.rotation.x = Math.PI / 2;
        swirlBase.position.y = 0.16;
        swirlBase.castShadow = true;
        cup.add(swirlBase);

        const swirlTop = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 14, 12),
          frostingMat
        );
        swirlTop.scale.set(1, 0.72, 1);
        swirlTop.position.y = 0.195;
        swirlTop.castShadow = true;
        cup.add(swirlTop);

        const miniCherry = new THREE.Mesh(
          new THREE.SphereGeometry(0.052, 12, 12),
          berryMat
        );
        miniCherry.position.y = 0.265;
        miniCherry.castShadow = true;
        cup.add(miniCherry);

        rackGroup.add(cup);
      }
    }

    const jarGroup = new THREE.Group();
    jarGroup.position.set(-2.55, counterTopY, -1.12);
    scene.add(jarGroup);

    const jarFlourInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.37, 0.37, 0.72, 22),
      new THREE.MeshStandardMaterial({ color: 0xfefbf6, roughness: 0.92 })
    );
    jarFlourInner.position.y = 0.38;
    jarGroup.add(jarFlourInner);

    const jarGlassBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.85, 24),
      new THREE.MeshStandardMaterial({
        color: 0xeaf4f8,
        roughness: 0.12,
        metalness: 0.08,
        transparent: true,
        opacity: 0.38,
      })
    );
    jarGlassBody.position.y = 0.425;
    jarGlassBody.castShadow = true;
    jarGroup.add(jarGlassBody);

    const woodenLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.39, 0.37, 0.15, 22),
      new THREE.MeshStandardMaterial({ color: 0xa66d3f, roughness: 0.65 })
    );
    woodenLid.position.y = 0.91;
    woodenLid.castShadow = true;
    jarGroup.add(woodenLid);

    const butterGroup = new THREE.Group();
    butterGroup.position.set(-5.95, counterTopY, -1.05);
    butterGroup.rotation.y = -0.1;
    scene.add(butterGroup);

    const butterPlate = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.06, 0.6),
      ceramicWhiteMat
    );
    butterPlate.position.y = 0.03;
    butterPlate.castShadow = true;
    butterPlate.receiveShadow = true;
    butterGroup.add(butterPlate);

    const butterStick = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.2, 0.31),
      new THREE.MeshStandardMaterial({ color: 0xffdf73, roughness: 0.34 })
    );
    butterStick.position.y = 0.16;
    butterStick.castShadow = true;
    butterGroup.add(butterStick);

    const eggTrayGroup = new THREE.Group();
    eggTrayGroup.position.set(-1.35, counterTopY, -0.95);
    eggTrayGroup.rotation.y = 0.06;
    scene.add(eggTrayGroup);

    const carton = new THREE.Mesh(
      new THREE.BoxGeometry(1.32, 0.14, 0.86),
      new THREE.MeshStandardMaterial({ color: 0xc8a274, roughness: 0.92 })
    );
    carton.position.y = 0.07;
    carton.castShadow = true;
    carton.receiveShadow = true;
    eggTrayGroup.add(carton);

    const eggMat = new THREE.MeshStandardMaterial({
      color: 0xdcb48a,
      roughness: 0.36,
    });
    const eggGeo = new THREE.SphereGeometry(0.13, 16, 16);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const egg = new THREE.Mesh(eggGeo, eggMat);
        egg.scale.set(1, 1.24, 1);
        egg.position.set((c - 1) * 0.37, 0.2, (r - 0.5) * 0.34);
        egg.castShadow = true;
        eggTrayGroup.add(egg);
      }
    }

    const dustCount = 75;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 14;
      dustPositions[i * 3 + 1] = 0.6 + Math.random() * 5.2;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 7.5;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(dustPositions, 3)
    );
    const dustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.22,
        map: createParticleTexture(),
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      })
    );
    scene.add(dustPoints);

    let targetMouseX = 0;
    let targetMouseY = 0;
    const onMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.55;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.35;
    };
    window.addEventListener("mousemove", onMouseMove);

    function handleResize() {
      const { w, h } = getSize();
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }

    window.addEventListener("resize", handleResize);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(overlayEl);
    }

    const startTime = performance.now();
    function animate(now) {
      rafId = window.requestAnimationFrame(animate);
      const t = (now - startTime) * 0.001;

      cakeSpinner.rotation.y = t * 0.45;

      bakerHeadGroup.rotation.y = Math.sin(t * 1.1) * 0.12;
      bakerHeadGroup.rotation.x = 0.24 + Math.sin(t * 2.2) * 0.04;

      rightArmPivot.rotation.y = Math.sin(t * 2.2) * 0.14;
      rightArmPivot.rotation.x = Math.cos(t * 2.2) * 0.06;

      leftArmPivot.rotation.y = Math.sin(t * 1.5 + 1.0) * 0.06;
      leftArmPivot.position.y = 1.06 + Math.sin(t * 2.8) * 0.018;

      baker2HeadGroup.rotation.y = Math.sin(t * 1.35 + 0.8) * 0.14;
      baker2HeadGroup.rotation.x = 0.22 + Math.cos(t * 2.4) * 0.035;
      baker2RightArmPivot.rotation.y = Math.sin(t * 2.4) * 0.08;
      baker2RightArmPivot.rotation.x = Math.cos(t * 2.4) * 0.04;
      baker2LeftArmPivot.position.y = 1.06 + Math.sin(t * 2.4) * 0.015;

      whiskOrbitPivot.rotation.y = t * 2.4;
      whiskGroup.rotation.y = -t * 1.2;

      const rollWave = Math.sin(t * 1.6);
      rollingPin.position.z = -0.12 + rollWave * 0.24;
      pinBody.rotation.x = rollWave * 1.6;

      const flicker = Math.sin(t * 3.1) * 0.12;
      ovenLight.intensity = 1.35 + flicker * 0.3;
      ovenGlowMat.emissiveIntensity = 1.15 + flicker * 1.4;

      const posAttr = dustGeo.attributes.position;
      for (let i = 0; i < dustCount; i++) {
        let y = posAttr.getY(i) + 0.004;
        const x = posAttr.getX(i) + Math.sin(t * 0.7 + i) * 0.0025;
        if (y > 6.0) y = 0.5;
        posAttr.setXYZ(i, x, y, posAttr.getZ(i));
      }
      posAttr.needsUpdate = true;

      camera.position.x += (targetMouseX - camera.position.x) * 0.05;
      camera.position.z += (2.3 + targetMouseY - camera.position.z) * 0.05;
      camera.lookAt(0, 0, -0.35);

      renderer.render(scene, camera);
    }

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="cravely-slider-auth-root">
      <style>{`
        .cravely-slider-auth-root {
          --accent: #a64b3c;
          --accent-dark: #8c372a;
          --accent-cherry: #9e3b42;
          --accent-gold: #c59b62;
          --accent-soft: #f7ece4;
          --text-main: #3a2315;
          --text-muted: #7c6454;
          --bg-page: #fdf6ee;
          --bg-input: #faf4ee;
          --border-soft: #e6d6c8;
          --white: #fffdf9;
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: var(--white);
          color: var(--text-main);
          overflow: hidden;
          font-family: "Poppins", sans-serif;
        }
        .cravely-slider-container {
          background-color: var(--white);
          border-radius: 0;
          box-shadow: none;
          position: relative;
          overflow: hidden;
          width: 100vw;
          height: 100vh;
          max-width: none;
          min-height: 100vh;
        }
        .cravely-back-home {
          position: fixed;
          top: 20px;
          left: 24px;
          z-index: 150;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(255, 253, 249, 0.92);
          border: 1.5px solid rgba(197, 155, 98, 0.55);
          color: var(--text-main);
          font-size: 0.78rem;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 6px 18px rgba(58, 35, 21, 0.12);
          backdrop-filter: blur(8px);
          transition: all 0.22s ease;
        }
        .cravely-back-home:hover {
          background: var(--accent-cherry);
          border-color: var(--accent-cherry);
          color: #ffffff;
          transform: translateY(-1px);
        }
        .cravely-form-container {
          position: absolute;
          top: 0;
          height: 100%;
          transition: all 0.6s ease-in-out;
        }
        .cravely-login-container {
          left: 0;
          width: 50%;
          z-index: 2;
        }
        .cravely-slider-container.right-panel-active .cravely-login-container {
          transform: translateX(100%);
          opacity: 0;
          pointer-events: none;
        }
        .cravely-register-container {
          left: 0;
          width: 50%;
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }
        .cravely-slider-container.right-panel-active .cravely-register-container {
          transform: translateX(100%);
          opacity: 1;
          z-index: 5;
          pointer-events: auto;
          animation: cravelyAuthShow 0.6s;
        }
        @keyframes cravelyAuthShow {
          0%, 49.99% {
            opacity: 0;
            z-index: 1;
          }
          50%, 100% {
            opacity: 1;
            z-index: 5;
          }
        }
        .cravely-auth-form {
          background-color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 46px;
          height: 100%;
          text-align: center;
        }
        .cravely-auth-brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 13px;
          border-radius: 999px;
          background: var(--accent-soft);
          border: 1px solid rgba(197, 155, 98, 0.45);
          color: var(--accent-cherry);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .cravely-auth-title {
          font-weight: 700;
          font-size: 1.9rem;
          letter-spacing: -0.02em;
          color: var(--text-main);
          margin-bottom: 14px;
        }
        .cravely-input-group {
          position: relative;
          width: 100%;
          max-width: 380px;
          margin: 6px 0;
        }
        .cravely-auth-input {
          background-color: var(--bg-input);
          border: 1.5px solid var(--border-soft);
          border-radius: 12px;
          padding: 12px 16px;
          width: 100%;
          font-size: 0.88rem;
          color: var(--text-main);
          outline: none;
          font-family: "Poppins", sans-serif;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
        }
        .cravely-input-group.has-toggle .cravely-auth-input {
          padding-right: 44px;
        }
        .cravely-auth-input::placeholder {
          color: #a48d7d;
        }
        .cravely-auth-input:focus {
          border-color: var(--accent);
          background-color: #ffffff;
          box-shadow: 0 0 0 3.5px rgba(166, 75, 60, 0.14);
        }
        .cravely-toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }
        .cravely-toggle-password:hover,
        .cravely-toggle-password.active {
          color: var(--accent);
        }
        .cravely-form-options {
          display: flex;
          width: 100%;
          max-width: 380px;
          align-items: center;
          justify-content: space-between;
          margin: 8px 0 14px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .cravely-checkbox-label {
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          user-select: none;
        }
        .cravely-checkbox-label input[type="checkbox"] {
          accent-color: var(--accent);
          width: 15px;
          height: 15px;
          cursor: pointer;
        }
        .cravely-forgot-link {
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .cravely-forgot-link:hover {
          color: var(--accent-cherry);
          text-decoration: underline;
        }
        .cravely-btn-primary {
          border-radius: 999px;
          border: 1.5px solid var(--accent);
          background: linear-gradient(135deg, var(--accent-cherry) 0%, #b86b35 100%);
          color: #ffffff;
          font-size: 0.92rem;
          font-weight: 600;
          padding: 12px 52px;
          letter-spacing: 0.02em;
          cursor: pointer;
          font-family: "Poppins", sans-serif;
          transition: transform 0.2s ease, filter 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 8px 18px rgba(158, 59, 66, 0.26);
          margin-top: 6px;
        }
        .cravely-btn-primary:hover:not(:disabled) {
          filter: brightness(1.06);
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(158, 59, 66, 0.34);
        }
        .cravely-btn-primary:active:not(:disabled) {
          transform: scale(0.96);
        }
        .cravely-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .cravely-quick-access {
          width: 100%;
          max-width: 380px;
          margin-top: 20px;
          padding-top: 14px;
          border-top: 1px dashed var(--border-soft);
        }
        .cravely-quick-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .cravely-quick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .cravely-quick-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1.5px solid var(--border-soft);
          background-color: var(--bg-input);
          color: var(--text-main);
          font-family: "Poppins", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cravely-quick-btn:hover {
          border-color: var(--accent-gold);
          background-color: var(--accent-soft);
          color: var(--accent-cherry);
          transform: translateY(-1px);
        }
        .cravely-mobile-switch {
          display: none;
          margin-top: 18px;
          font-size: 0.84rem;
          color: var(--text-muted);
        }
        .cravely-mobile-switch button {
          background: none;
          border: none;
          color: var(--accent-cherry);
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          margin-left: 4px;
          font-family: "Poppins", sans-serif;
        }
        .cravely-overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.6s ease-in-out;
          z-index: 100;
        }
        .cravely-slider-container.right-panel-active .cravely-overlay-container {
          transform: translateX(-100%);
        }
        .cravely-overlay {
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          background-color: #4d3020;
          color: #ffffff;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }
        .cravely-slider-container.right-panel-active .cravely-overlay {
          transform: translateX(50%);
        }
        .cravely-bakery-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          z-index: 1;
          pointer-events: none;
        }
        .cravely-overlay-scrim {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: radial-gradient(
              circle at 25% 50%,
              rgba(38, 18, 12, 0.44) 0%,
              rgba(38, 18, 12, 0.22) 55%,
              rgba(38, 18, 12, 0.38) 100%
            ),
            radial-gradient(
              circle at 75% 50%,
              rgba(38, 18, 12, 0.44) 0%,
              rgba(38, 18, 12, 0.22) 55%,
              rgba(38, 18, 12, 0.38) 100%
            );
        }
        .cravely-overlay-panel {
          position: absolute;
          top: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 38px;
          text-align: center;
          height: 100%;
          width: 50%;
          z-index: 3;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }
        .cravely-overlay-left {
          left: 0;
          transform: translateX(-20%);
        }
        .cravely-slider-container.right-panel-active .cravely-overlay-left {
          transform: translateX(0);
        }
        .cravely-overlay-right {
          right: 0;
          transform: translateX(0);
        }
        .cravely-slider-container.right-panel-active .cravely-overlay-right {
          transform: translateX(20%);
        }
        .cravely-overlay-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 999px;
          border: 1px solid rgba(245, 213, 165, 0.78);
          background: rgba(46, 22, 16, 0.56);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 14px;
          color: #fff6eb;
        }
        .cravely-overlay-panel h2 {
          font-size: 2.15rem;
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 14px;
          color: #ffffff;
          text-shadow: 0 4px 18px rgba(24, 12, 6, 0.65);
        }
        .cravely-overlay-panel p {
          font-size: 0.88rem;
          font-weight: 400;
          line-height: 1.6;
          max-width: 310px;
          text-wrap: balance;
          margin-bottom: 26px;
          color: rgba(255, 249, 242, 0.96);
          text-shadow: 0 2px 10px rgba(24, 12, 6, 0.75);
        }
        .cravely-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          border: 1.8px solid rgba(255, 255, 255, 0.92);
          background-color: rgba(46, 22, 16, 0.48);
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 600;
          padding: 11px 36px;
          letter-spacing: 0.03em;
          cursor: pointer;
          font-family: "Poppins", sans-serif;
          transition: all 0.28s ease;
        }
        .cravely-btn-ghost:hover {
          background-color: #ffffff;
          color: var(--text-main);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(24, 12, 6, 0.35);
        }
        .cravely-btn-ghost:active {
          transform: scale(0.96);
        }
        .cravely-btn-ghost .arrow-right,
        .cravely-btn-ghost .arrow-left {
          transition: transform 0.25s ease;
        }
        .cravely-btn-ghost:hover .arrow-right {
          transform: translateX(4px);
        }
        .cravely-btn-ghost:hover .arrow-left {
          transform: translateX(-4px);
        }
        .cravely-toast {
          position: fixed;
          bottom: 26px;
          left: 50%;
          transform: translateX(-50%) translateY(90px);
          background-color: var(--text-main);
          color: #fff8f1;
          padding: 12px 24px;
          border-radius: 999px;
          font-size: 0.86rem;
          font-weight: 500;
          box-shadow: 0 12px 30px rgba(58, 35, 21, 0.28);
          opacity: 0;
          pointer-events: none;
          transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 999;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cravely-toast.show {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        .cravely-toast-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: #f3a661;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .cravely-slider-auth-root {
            overflow-y: auto;
          }
          .cravely-overlay-container {
            display: none;
          }
          .cravely-form-container {
            width: 100%;
          }
          .cravely-slider-container.right-panel-active .cravely-login-container {
            transform: translateX(-100%);
            opacity: 0;
          }
          .cravely-slider-container.right-panel-active .cravely-register-container {
            transform: translateX(0);
          }
          .cravely-auth-form {
            padding: 0 28px;
          }
          .cravely-mobile-switch {
            display: block;
          }
        }
      `}</style>

      <Link href="/" className="cravely-back-home">
        <span>&larr;</span>
        <span>Beranda</span>
      </Link>

      <div
        className={`cravely-slider-container${
          isRegisterActive ? " right-panel-active" : ""
        }`}
      >
        <div className="cravely-form-container cravely-register-container">
          <form className="cravely-auth-form" onSubmit={handleRegister} noValidate>
            <span className="cravely-auth-brand-pill">Cravely Patisserie</span>
            <h1 className="cravely-auth-title">Daftar Akun.</h1>

            <div className="cravely-input-group">
              <input
                type="text"
                className="cravely-auth-input"
                placeholder="Nama Lengkap"
                value={regNama}
                onChange={(e) => setRegNama(e.target.value)}
                disabled={memuat}
                required
              />
            </div>

            <div className="cravely-input-group">
              <input
                type="tel"
                className="cravely-auth-input"
                placeholder="Nomor WhatsApp (cth: 081234567890)"
                value={regWa}
                onChange={(e) => setRegWa(e.target.value)}
                disabled={memuat}
                required
              />
            </div>

            <div className="cravely-input-group">
              <input
                type="email"
                className="cravely-auth-input"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                disabled={memuat}
                required
              />
            </div>

            <div className="cravely-input-group has-toggle">
              <input
                type={showRegPassword ? "text" : "password"}
                className="cravely-auth-input"
                placeholder="Kata Sandi (min. 6 karakter)"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                disabled={memuat}
                required
              />
              <button
                type="button"
                className={`cravely-toggle-password${
                  showRegPassword ? " active" : ""
                }`}
                onClick={() => setShowRegPassword((v) => !v)}
                aria-label="Lihat kata sandi"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <button
              type="submit"
              className="cravely-btn-primary"
              disabled={memuat}
            >
              {memuat ? "Memproses..." : "Daftar"}
            </button>

            <p className="cravely-mobile-switch">
              Sudah punya akun?
              <button type="button" onClick={() => switchPanel(false)}>
                Masuk
              </button>
            </p>
          </form>
        </div>

        <div className="cravely-form-container cravely-login-container">
          <form className="cravely-auth-form" onSubmit={handleLogin} noValidate>
            <span className="cravely-auth-brand-pill">Cravely Patisserie</span>
            <h1 className="cravely-auth-title">Masuk.</h1>

            <div className="cravely-input-group">
              <input
                type="email"
                className="cravely-auth-input"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={memuat}
                required
              />
            </div>

            <div className="cravely-input-group has-toggle">
              <input
                type={showLoginPassword ? "text" : "password"}
                className="cravely-auth-input"
                placeholder="Kata Sandi"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={memuat}
                required
              />
              <button
                type="button"
                className={`cravely-toggle-password${
                  showLoginPassword ? " active" : ""
                }`}
                onClick={() => setShowLoginPassword((v) => !v)}
                aria-label="Lihat kata sandi"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <div className="cravely-form-options">
              <label className="cravely-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ingat saya</span>
              </label>
              <Link href="/lupa-sandi" className="cravely-forgot-link">
                Lupa kata sandi?
              </Link>
            </div>

            <button
              type="submit"
              className="cravely-btn-primary"
              disabled={memuat}
            >
              {memuat ? "Memproses..." : "Masuk"}
            </button>

            <div className="cravely-quick-access">
              <div className="cravely-quick-header">
                <span>Akses Cepat</span>
                <span>Klik Isi Otomatis</span>
              </div>
              <div className="cravely-quick-grid">
                <button
                  type="button"
                  className="cravely-quick-btn"
                  onClick={() => {
                    setLoginEmail("admin@cravely.com");
                    setLoginPassword("password123");
                    showToast("Akun Admin siap digunakan.");
                  }}
                >
                  <span>👑</span>
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  className="cravely-quick-btn"
                  onClick={() => {
                    setLoginEmail("petugas@cravely.com");
                    setLoginPassword("password123");
                    showToast("Akun Petugas siap digunakan.");
                  }}
                >
                  <span>🧑‍🍳</span>
                  <span>Petugas</span>
                </button>
              </div>
            </div>

            <p className="cravely-mobile-switch">
              Belum punya akun?
              <button type="button" onClick={() => switchPanel(true)}>
                Daftar
              </button>
            </p>
          </form>
        </div>

        <div className="cravely-overlay-container">
          <div className="cravely-overlay" ref={overlayBoxRef}>
            <canvas ref={canvasRef} className="cravely-bakery-canvas" />
            <div className="cravely-overlay-scrim" />

            <div className="cravely-overlay-panel cravely-overlay-left">
              <span className="cravely-overlay-badge">Cravely Patisserie</span>
              <h2>Selamat Datang Kembali!</h2>
              <p>
                Sudah punya akun? Masuk sekarang dan lanjutkan kreasi kue manis
                favoritmu di dapur kami.
              </p>
              <button
                type="button"
                className="cravely-btn-ghost"
                onClick={() => switchPanel(false)}
              >
                <span className="arrow-left">&larr;</span>
                <span>Masuk</span>
              </button>
            </div>

            <div className="cravely-overlay-panel cravely-overlay-right">
              <span className="cravely-overlay-badge">Cravely Patisserie</span>
              <h2>Mulai Cerita Manismu!</h2>
              <p>
                Belum punya akun? Bergabunglah bersama kami dan pesan kreasi kue
                hangat setiap hari.
              </p>
              <button
                type="button"
                className="cravely-btn-ghost"
                onClick={() => switchPanel(true)}
              >
                <span>Daftar</span>
                <span className="arrow-right">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`cravely-toast${toastVisible ? " show" : ""}`}
        role="status"
        aria-live="polite"
      >
        <span className="cravely-toast-dot" />
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}
