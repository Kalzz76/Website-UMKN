"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function OvenAuth({ defaultMode = "welcome", initialTarget = "login" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tujuan = searchParams.get("ke");
  const forceOpen = searchParams.get("open") === "1";

  const [view, setView] = useState(() => (forceOpen ? initialTarget : defaultMode));
  const [isOpen, setIsOpen] = useState(() => forceOpen && (initialTarget === "login" || initialTarget === "reg"));

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  const [regNama, setRegNama] = useState("");
  const [regWa, setRegWa] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regErrors, setRegErrors] = useState({});

  const [memuat, setMemuat] = useState(false);
  const [closingMsg, setClosingMsg] = useState("Silakan tunggu sebentar...");
  const [successTitle, setSuccessTitle] = useState("Sukses!");
  const [successMsg, setSuccessMsg] = useState("Pendaftaran Berhasil!");

  const wallRef = useRef(null);
  const stageRef = useRef(null);
  const ovenRef = useRef(null);

  const trayRefs = {
    loginEmail: useRef(null),
    loginPassword: useRef(null),
    regNama: useRef(null),
    regWa: useRef(null),
    regEmail: useRef(null),
    regPassword: useRef(null),
  };

  const R = 735 / 493;
  const FX = 0.6286 + 0.1741 / 2;
  const FY = 0.651 + 0.221 / 2;
  const PY = 0.8;

  const playTingSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [1318, 1975].forEach((freq, i) => {
        const t = ctx.currentTime + 1.1 + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.8);
      });
    } catch (e) {}
  }, []);

  const calculateZoom = useCallback((targetView) => {
    if (!stageRef.current || !wallRef.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const Sw = Math.max(vw, vh * R);
    const Sh = Sw / R;
    const px = Sw > vw + 1 ? Math.min(1, Math.max(0, (vw / 2 - FX * Sw) / (vw - Sw))) : 0.5;
    const sl = (vw - Sw) * px;
    const st = (vh - Sh) * PY;

    const on = targetView !== "welcome";
    Object.assign(stageRef.current.style, {
      width: Sw + "px",
      height: Sh + "px",
      left: sl + "px",
      top: st + "px",
      transformOrigin: FX * 100 + "% " + FY * 100 + "%",
    });

    wallRef.current.classList.toggle("zoomed", on);

    if (!on) {
      stageRef.current.style.setProperty("--s", "1");
      stageRef.current.style.setProperty("--dx", "0px");
      stageRef.current.style.setProperty("--dy", "0px");
      return;
    }

    const X = sl + Sw * FX;
    const Y = st + Sh * FY;
    const Wd = Sw * 0.1741;
    const Wt = Math.min(vw * (vw < vh * 0.9 ? 0.94 : 0.5), vh * 0.728);
    stageRef.current.style.setProperty("--s", String(Wt / Wd));
    stageRef.current.style.setProperty("--dx", vw / 2 - X + "px");
    stageRef.current.style.setProperty("--dy", vh * 0.45 - Y + "px");
  }, [R, FX, FY, PY]);

  const go = useCallback((targetMode) => {
    const cleanTarget = targetMode.replace(/\d+$/, "");
    const wasOpen = isOpen;
    setView(cleanTarget);
    setLoginErrors({});
    setRegErrors({});

    const willOpen = cleanTarget === "login" || cleanTarget === "reg";
    setIsOpen(willOpen);

    if (willOpen) {
      if (cleanTarget === "login") {
        window.history.replaceState(null, "", tujuan ? `/masuk?ke=${encodeURIComponent(tujuan)}` : "/masuk");
      } else if (cleanTarget === "reg") {
        window.history.replaceState(null, "", tujuan ? `/daftar?ke=${encodeURIComponent(tujuan)}` : "/daftar");
      }
      setTimeout(() => {
        const input = document.querySelector(`#rack${cleanTarget === "login" ? "Login" : "Reg"} input`);
        if (input) input.focus({ preventScroll: true });
      }, !wasOpen ? 1200 : 350);
    }

    calculateZoom(cleanTarget);
  }, [isOpen, tujuan, calculateZoom]);

  useEffect(() => {
    calculateZoom(view);
    const handleResize = () => calculateZoom(view);
    window.addEventListener("resize", handleResize);

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        go("welcome");
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [view, isOpen, calculateZoom, go]);

  const shakeTray = (ref) => {
    if (ref?.current) {
      ref.current.classList.remove("shake");
      void ref.current.offsetWidth;
      ref.current.classList.add("shake");
    }
  };

  async function handleLogin(e) {
    e.preventDefault();
    setLoginErrors({});

    let hasError = false;
    const newErrors = {};

    if (!loginEmail.trim()) {
      newErrors.email = "Email wajib diisi";
      shakeTray(trayRefs.loginEmail);
      hasError = true;
    }
    if (!loginPassword) {
      newErrors.password = "Password wajib diisi";
      shakeTray(trayRefs.loginPassword);
      hasError = true;
    }

    if (hasError) {
      setLoginErrors(newErrors);
      return;
    }

    setMemuat(true);
    setClosingMsg("Memeriksa resep akun...");
    setView("closing");
    setIsOpen(false);
    calculateZoom("closing");

    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setMemuat(false);
      const msg = (error.message || "").toLowerCase();
      const userMsg = msg.includes("email not confirmed")
        ? "Email belum terverifikasi"
        : "Email atau password salah";

      setLoginErrors({ email: userMsg });
      setView("login");
      setIsOpen(true);
      calculateZoom("login");
      shakeTray(trayRefs.loginEmail);
      return;
    }

    const { data: profil, error: errorProfil } = await supabase
      .from("profil")
      .select("role, aktif")
      .eq("id", data.user.id)
      .single();

    if (errorProfil || !profil) {
      setMemuat(false);
      setLoginErrors({ email: "Gagal mengambil data akun" });
      setView("login");
      setIsOpen(true);
      calculateZoom("login");
      return;
    }

    if (!profil.aktif) {
      await supabase.auth.signOut();
      setMemuat(false);
      setLoginErrors({ email: "Akun ini telah dinonaktifkan" });
      setView("login");
      setIsOpen(true);
      calculateZoom("login");
      return;
    }

    setSuccessTitle("Selamat Datang!");
    setSuccessMsg("Login berhasil! Membuka dapur...");
    setView("success");
    playTingSound();

    setTimeout(() => {
      if (profil.role === "admin" || profil.role === "staf") {
        router.push("/dashboard");
      } else {
        const cleanTujuan = tujuan && typeof tujuan === "string" && tujuan.startsWith("/") && !tujuan.startsWith("//") ? tujuan : "/";
        router.push(cleanTujuan);
      }
      router.refresh();
    }, 1800);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegErrors({});

    let hasError = false;
    const newErrors = {};

    if (!regNama.trim() || regNama.trim().length < 2) {
      newErrors.nama = "Min. 2 karakter";
      shakeTray(trayRefs.regNama);
      hasError = true;
    }
    if (!regWa.trim() || regWa.trim().length < 8) {
      newErrors.wa = "Min. 8 angka";
      shakeTray(trayRefs.regWa);
      hasError = true;
    }
    if (!regEmail.trim() || !regEmail.includes("@") || !regEmail.includes(".")) {
      newErrors.email = "Format email salah";
      shakeTray(trayRefs.regEmail);
      hasError = true;
    }
    if (!regPassword || regPassword.length < 6) {
      newErrors.password = "Min. 6 karakter";
      shakeTray(trayRefs.regPassword);
      hasError = true;
    }

    if (hasError) {
      setRegErrors(newErrors);
      return;
    }

    setMemuat(true);
    setClosingMsg("Memanggang akun baru...");
    setView("closing");
    setIsOpen(false);
    calculateZoom("closing");

    try {
      const res = await fetch("/api/daftar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: regNama.trim(),
          no_wa: regWa.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMemuat(false);
        setRegErrors({ email: data.pesan || "Pendaftaran gagal" });
        setView("reg");
        setIsOpen(true);
        calculateZoom("reg");
        shakeTray(trayRefs.regEmail);
        return;
      }

      setMemuat(false);
      setSuccessTitle("Ting! Akun Jadi!");
      setSuccessMsg("Pendaftaran berhasil! Siap untuk login.");
      setView("success");
      playTingSound();

      setLoginEmail(regEmail.trim());

      setTimeout(() => {
        go("login");
      }, 2500);
    } catch (err) {
      setMemuat(false);
      setRegErrors({ email: "Gangguan koneksi internet" });
      setView("reg");
      setIsOpen(true);
      calculateZoom("reg");
    }
  }

  const isLoginEmailValid = loginEmail.trim().length > 0;
  const isLoginPasswordValid = loginPassword.length > 0;

  const isRegNamaValid = regNama.trim().length >= 2;
  const isRegWaValid = regWa.trim().length >= 8;
  const isRegEmailValid = /^\S+@\S+\.\S+$/.test(regEmail.trim());
  const isRegPasswordValid = regPassword.length >= 6;

  return (
    <div className="oven-page">
      <div className="wall" id="wall" ref={wallRef}>
        <div className="stage" id="stage" ref={stageRef}>
          <img
            className="photo"
            alt="Dapur pixel hangat dengan kompor dan oven krem"
            src="/images/oven-kitchen.jpg"
          />

          <main
            className="da oven"
            id="oven"
            ref={ovenRef}
            data-view={view}
            {...(isOpen ? { "data-open": "" } : {})}
          >
            <div className="steam" aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
            </div>

            <div className="cav">
              {/* FORM LOGIN */}
              <form
                className="rack"
                id="rackLogin"
                onSubmit={handleLogin}
                noValidate
              >
                <h3 className="ttl">
                  <svg viewBox="0 0 16 12">
                    <use href="#hat" />
                  </svg>
                  Login
                </h3>

                <div className="trays">
                  <div
                    className={`tray ${isLoginEmailValid ? "done" : ""}`}
                    ref={trayRefs.loginEmail}
                  >
                    <div className="hdr">
                      <b>1</b>Email
                      <span className="err" role="alert">
                        {loginErrors.email || ""}
                      </span>
                      <svg viewBox="0 0 8 8">
                        <use href="#cookie" />
                      </svg>
                    </div>
                    <label className="f">
                      <input
                        id="lu"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          setLoginErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        placeholder="you@email.com"
                        autoComplete="username"
                        disabled={memuat}
                      />
                    </label>
                  </div>

                  <div
                    className={`tray ${isLoginPasswordValid ? "done" : ""}`}
                    ref={trayRefs.loginPassword}
                  >
                    <div className="hdr">
                      <b>2</b>Password
                      <span className="err" role="alert">
                        {loginErrors.password || ""}
                      </span>
                      <svg viewBox="0 0 8 8">
                        <use href="#cookie" />
                      </svg>
                    </div>
                    <label className="f">
                      <input
                        id="lp"
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          setLoginErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        placeholder="Password"
                        autoComplete="current-password"
                        disabled={memuat}
                      />
                      <button
                        className="eye"
                        type="button"
                        onClick={() => setShowLoginPassword((p) => !p)}
                        aria-label="Toggle password visibility"
                      >
                        {showLoginPassword ? "hide" : "show"}
                      </button>
                    </label>
                  </div>

                  <div className="quick-row">
                    <span className="quick-label">⚡ Akses:</span>
                    <button
                      type="button"
                      className="q-btn"
                      onClick={() => {
                        setLoginEmail("admin@cravely.com");
                        setLoginPassword("password123");
                        setLoginErrors({});
                      }}
                    >
                      👑 Admin
                    </button>
                    <button
                      type="button"
                      className="q-btn"
                      onClick={() => {
                        setLoginEmail("petugas@cravely.com");
                        setLoginPassword("password123");
                        setLoginErrors({});
                      }}
                    >
                      🧑‍🍳 Petugas
                    </button>
                  </div>
                </div>

                <div className="row">
                  <button
                    className="link"
                    type="button"
                    onClick={() => go("reg")}
                  >
                    Create account
                  </button>
                  <button className="btn" type="submit" disabled={memuat}>
                    {memuat ? "Baking..." : "Login"}
                  </button>
                </div>
              </form>

              {/* FORM REGISTER */}
              <form
                className="rack"
                id="rackReg"
                onSubmit={handleRegister}
                noValidate
              >
                <h3 className="ttl">
                  <div className="ttl-left">
                    <svg viewBox="0 0 16 12">
                      <use href="#hat" />
                    </svg>
                    <span>Register</span>
                  </div>
                </h3>

                <div className="trays">
                  <div
                    className={`tray ${isRegNamaValid ? "done" : ""}`}
                    ref={trayRefs.regNama}
                  >
                    <div className="hdr">
                      <b>1</b>Nama
                      <span className="err" role="alert">
                        {regErrors.nama || ""}
                      </span>
                      <svg viewBox="0 0 8 8">
                        <use href="#cookie" />
                      </svg>
                    </div>
                    <label className="f">
                      <input
                        id="rn"
                        type="text"
                        value={regNama}
                        onChange={(e) => {
                          setRegNama(e.target.value);
                          setRegErrors((prev) => ({ ...prev, nama: "" }));
                        }}
                        placeholder="Nama Lengkap"
                        autoComplete="name"
                        disabled={memuat}
                      />
                    </label>
                  </div>

                  <div
                    className={`tray ${isRegWaValid ? "done" : ""}`}
                    ref={trayRefs.regWa}
                  >
                    <div className="hdr">
                      <b>2</b>WhatsApp
                      <span className="err" role="alert">
                        {regErrors.wa || ""}
                      </span>
                      <svg viewBox="0 0 8 8">
                        <use href="#cookie" />
                      </svg>
                    </div>
                    <label className="f">
                      <input
                        id="rw"
                        type="tel"
                        value={regWa}
                        onChange={(e) => {
                          setRegWa(e.target.value);
                          setRegErrors((prev) => ({ ...prev, wa: "" }));
                        }}
                        placeholder="081234567890"
                        autoComplete="tel"
                        disabled={memuat}
                      />
                    </label>
                  </div>

                  <div
                    className={`tray ${isRegEmailValid ? "done" : ""}`}
                    ref={trayRefs.regEmail}
                  >
                    <div className="hdr">
                      <b>3</b>Email
                      <span className="err" role="alert">
                        {regErrors.email || ""}
                      </span>
                      <svg viewBox="0 0 8 8">
                        <use href="#cookie" />
                      </svg>
                    </div>
                    <label className="f">
                      <input
                        id="re"
                        type="email"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          setRegErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        placeholder="you@email.com"
                        autoComplete="email"
                        disabled={memuat}
                      />
                    </label>
                  </div>

                  <div
                    className={`tray ${isRegPasswordValid ? "done" : ""}`}
                    ref={trayRefs.regPassword}
                  >
                    <div className="hdr">
                      <b>4</b>Password
                      <span className="err" role="alert">
                        {regErrors.password || ""}
                      </span>
                      <svg viewBox="0 0 8 8">
                        <use href="#cookie" />
                      </svg>
                    </div>
                    <label className="f">
                      <input
                        id="rp"
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          setRegErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        placeholder="Min. 6 karakter"
                        autoComplete="new-password"
                        disabled={memuat}
                      />
                      <button
                        className="eye"
                        type="button"
                        onClick={() => setShowRegPassword((p) => !p)}
                        aria-label="Toggle password visibility"
                      >
                        {showRegPassword ? "hide" : "show"}
                      </button>
                    </label>
                  </div>
                </div>

                <div className="row">
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => go("login")}
                  >
                    ‹ Login
                  </button>
                  <button className="btn" type="submit" disabled={memuat}>
                    {memuat ? "Baking..." : "Register"}
                  </button>
                </div>
              </form>
            </div>

            {/* OVEN DOOR */}
            <div
              className="door"
              id="door"
              role="button"
              tabIndex={0}
              aria-label="Open the oven"
              onClick={() => {
                if (view === "welcome") go(initialTarget);
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && view === "welcome") {
                  e.preventDefault();
                  go(initialTarget);
                }
              }}
            >
              <i className="hd"></i>
              <div className="win">
                <div className="gl g-welcome">
                  <svg className="hat" viewBox="0 0 16 12">
                    <use href="#hat" />
                  </svg>
                  <h2>Welcome!</h2>
                  <p>Open oven to begin</p>
                </div>

                <div className="gl g-closing">
                  <div className="spin"></div>
                  <h2 style={{ fontSize: "7cqw" }}>Baking...</h2>
                  <p>{closingMsg}</p>
                </div>

                <div className="gl g-success">
                  <span className="spark l">✦</span>
                  <span className="spark r">✦</span>
                  <svg className="hat" viewBox="0 0 16 12">
                    <use href="#hat" />
                  </svg>
                  <h2 id="sTitle" style={{ fontSize: "7.4cqw" }}>
                    {successTitle}
                  </h2>
                  <p id="sMsg">{successMsg}</p>
                  <button
                    className="link"
                    type="button"
                    style={{ margin: 0 }}
                    onClick={() => go("login")}
                  >
                    Kembali ke Oven
                  </button>
                </div>
              </div>
            </div>

            <span className="ting">Ting!</span>
            <svg className="hand" viewBox="0 0 16 18">
              <use href="#hand" />
            </svg>
            <div className="spill"></div>

            <button
              className="btn ghost shut"
              type="button"
              onClick={() => go("welcome")}
            >
              ✕ Close oven
            </button>
          </main>
        </div>

        {/* HANGING CHALKBOARD SIGN */}
        <aside className="sign" aria-label="Cravely Welcome">
          <div className="sign-brand">
            <svg viewBox="0 0 16 12" aria-hidden="true">
              <use href="#hat" />
            </svg>
            <h1>Cravely</h1>
          </div>
          <p className="sign-tag">
            Selamat datang di dapur Cravely! Masuk atau buat akun baru untuk mulai memesan kue custom impian Anda.
          </p>
          <div className="sign-actions">
            <button
              className={`s-btn ${initialTarget === "reg" ? "ghost" : ""}`}
              type="button"
              onClick={() => go("login")}
            >
              Login
            </button>
            <button
              className={`s-btn ${initialTarget === "reg" ? "" : "ghost"}`}
              type="button"
              onClick={() => go("reg")}
            >
              Register
            </button>
          </div>
          <p className="sign-hint">atau ketuk pintu oven yang hangat</p>

          <div className="sign-links">
            <Link href="/toko" title="Kembali ke Toko">
              ← Kembali ke Toko
            </Link>
            <Link href="/lupa-sandi" title="Lupa kata sandi">
              Lupa sandi?
            </Link>
          </div>
        </aside>
      </div>

      {/* SVG PIXEL ICONS DEFS */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <g id="hat">
            <path
              fill="currentColor"
              d="M5 0h6v1h2v1h1v5h-1v1H3V7H2V2h1V1h2z"
            />
            <rect x="4" y="8" width="8" height="4" fill="currentColor" />
            <rect x="4" y="11" width="8" height="1" fill="#000" opacity=".28" />
          </g>
          <g id="cookie">
            <path
              fill="#d9a05b"
              d="M2 0h4v1h1v1h1v4H7v1H6v1H2V7H1V6H0V2h1V1h1z"
            />
            <g fill="#5a3220">
              <rect x="2" y="2" width="1" height="1" />
              <rect x="5" y="3" width="1" height="1" />
              <rect x="3" y="5" width="1" height="1" />
              <rect x="5" y="5" width="1" height="1" />
            </g>
          </g>

          {/* CUTE BAKER'S OVEN MITT (Sarung Tangan Pemanggang Kue Asli, Tanpa Jari Tengah) */}
          <g id="hand">
            {/* Dark Outline */}
            <g fill="#3a1d17">
              {/* Rounded mitt dome */}
              <rect x="7" y="1" width="6" height="2" />
              <rect x="5" y="3" width="10" height="11" />
              {/* Thumb pointing towards oven */}
              <rect x="2" y="6" width="4" height="2" />
              <rect x="1" y="8" width="4" height="3" />
              <rect x="2" y="11" width="4" height="2" />
              {/* Folded Cuff rim */}
              <rect x="4" y="14" width="11" height="4" />
            </g>

            {/* Mitt Cloth Padding (Warm Cream) */}
            <g fill="#fffdf9">
              <rect x="7" y="2" width="6" height="2" />
              <rect x="6" y="4" width="8" height="10" />
              <rect x="2" y="8" width="3" height="3" />
              <rect x="3" y="7" width="3" height="1" />
              <rect x="3" y="11" width="3" height="1" />
            </g>

            {/* Folded Coral Cuff */}
            <g fill="#f08f86">
              <rect x="5" y="15" width="9" height="2" />
            </g>

            {/* Quilted diamond stitching */}
            <g fill="#d9cdb4">
              <rect x="7" y="5" width="2" height="1" />
              <rect x="11" y="5" width="2" height="1" />
              <rect x="9" y="7" width="2" height="1" />
              <rect x="7" y="9" width="2" height="1" />
              <rect x="11" y="9" width="2" height="1" />
              <rect x="9" y="11" width="2" height="1" />
              <rect x="3" y="9" width="1" height="1" />
            </g>

            {/* Cute mini heart patch on mitt */}
            <g fill="#c9605a">
              <rect x="8" y="8" width="4" height="2" />
              <rect x="9" y="10" width="2" height="1" />
            </g>

            {/* Golden baking sparkles */}
            <g fill="#f4c35a">
              <rect x="0" y="3" width="2" height="1" />
              <rect x="1" y="2" width="1" height="3" />
              <rect x="14" y="2" width="2" height="1" />
              <rect x="15" y="1" width="1" height="3" />
            </g>
          </g>
        </defs>
      </svg>
    </div>
  );
}
