"use client";

import { useEffect, useRef } from "react";

export default function RootLoading() {
  const svgRef = useRef(null);
  const bowlAssemblyRef = useRef(null);
  const groundShadowRef = useRef(null);
  const batterSwirlGroupRef = useRef(null);
  const whiskGroupRef = useRef(null);
  const whiskClipPathRef = useRef(null);
  const whiskRippleRef = useRef(null);
  const whiskMeniscusFrontRef = useRef(null);
  const particlesLayerRef = useRef(null);

  useEffect(() => {
    const bowlAssembly = bowlAssemblyRef.current;
    const groundShadow = groundShadowRef.current;
    const batterSwirlGroup = batterSwirlGroupRef.current;
    const whiskGroup = whiskGroupRef.current;
    const whiskClipPath = whiskClipPathRef.current;
    const whiskRipple = whiskRippleRef.current;
    const whiskMeniscusFront = whiskMeniscusFrontRef.current;
    const particlesLayer = particlesLayerRef.current;

    if (
      !bowlAssembly ||
      !groundShadow ||
      !batterSwirlGroup ||
      !whiskGroup ||
      !whiskClipPath ||
      !whiskRipple ||
      !whiskMeniscusFront ||
      !particlesLayer
    ) {
      return;
    }

    const SVG_NS = "http://www.w3.org/2000/svg";
    const CENTER_X = 300;
    const CENTER_Y = 287;
    const AUTO_RX = 64;
    const AUTO_RY = 14;

    const state = {
      speed: 1.2,
      orbitAngle: 0,
      swirlAngle: 0,
      whiskX: CENTER_X,
      whiskY: CENTER_Y + 2,
      whiskTilt: 22,
      bowlRock: 0,
      lastTimestamp: 0,
      dropletCooldown: 0,
      sparkleCooldown: 0.35,
      particles: [],
    };

    let rafId = 0;

    function spawnDroplet(originX, originY, intensity) {
      if (state.particles.length > 28) return;

      const el = document.createElementNS(SVG_NS, "ellipse");
      const radius = 3.2 + Math.random() * 4.4;
      const isLight = Math.random() > 0.45;
      el.setAttribute("rx", radius.toFixed(2));
      el.setAttribute("ry", (radius * 0.85).toFixed(2));
      el.setAttribute("fill", isLight ? "var(--drop-light)" : "var(--drop-dark)");

      const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
      const speedMag = (75 + Math.random() * 85) * Math.min(1.6, 0.7 + intensity * 0.45);
      const startX = originX + (Math.random() - 0.5) * 34;
      const startY = originY - 6 - Math.random() * 10;

      particlesLayer.appendChild(el);
      state.particles.push({
        type: "droplet",
        el,
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speedMag,
        vy: Math.sin(angle) * speedMag - 30,
        gravity: 310,
        age: 0,
        maxAge: 0.55 + Math.random() * 0.35,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 260,
      });
    }

    function spawnSparkle() {
      if (state.particles.length > 28) return;

      const el = document.createElementNS(SVG_NS, "path");
      el.setAttribute(
        "d",
        "M 0,-12 Q 2,-2 12,0 Q 2,2 0,12 Q -2,2 -12,0 Q -2,-2 0,-12 Z"
      );
      el.setAttribute("fill", "var(--sparkle-color)");

      const side = Math.random() > 0.5 ? 1 : -1;
      const startX = CENTER_X + side * (115 + Math.random() * 90);
      const startY = 140 + Math.random() * 125;

      particlesLayer.appendChild(el);
      state.particles.push({
        type: "sparkle",
        el,
        x: startX,
        y: startY,
        vx: side * (6 + Math.random() * 10),
        vy: -14 - Math.random() * 16,
        age: 0,
        maxAge: 0.85 + Math.random() * 0.55,
        maxScale: 0.55 + Math.random() * 0.65,
        rot: Math.random() * 45,
        vrot: (Math.random() - 0.5) * 70,
      });
    }

    function updateParticles(dt) {
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.age += dt;

        if (p.age >= p.maxAge) {
          if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
          state.particles.splice(i, 1);
          continue;
        }

        const progress = p.age / p.maxAge;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;

        if (p.type === "droplet") {
          p.vy += p.gravity * dt;
          const scale = Math.max(0.15, 1 - progress * 0.65);
          const opacity = progress < 0.7 ? 0.95 : (1 - progress) / 0.3;
          p.el.setAttribute(
            "transform",
            `translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)}) rotate(${p.rot.toFixed(1)}) scale(${scale.toFixed(3)})`
          );
          p.el.setAttribute("opacity", Math.max(0, opacity).toFixed(3));
        } else {
          const scaleWave = Math.sin(progress * Math.PI);
          const scale = p.maxScale * scaleWave;
          p.el.setAttribute(
            "transform",
            `translate(${p.x.toFixed(2)}, ${p.y.toFixed(2)}) rotate(${p.rot.toFixed(1)}) scale(${scale.toFixed(3)})`
          );
          p.el.setAttribute("opacity", (scaleWave * 0.92).toFixed(3));
        }
      }
    }

    function animate(timestamp) {
      if (!state.lastTimestamp) state.lastTimestamp = timestamp;
      const dt = Math.min(0.05, (timestamp - state.lastTimestamp) / 1000);
      state.lastTimestamp = timestamp;

      const omega = 3.2 * state.speed;
      state.orbitAngle += omega * dt;
      state.swirlAngle += 145 * state.speed * dt;

      const targetWhiskX = CENTER_X + Math.cos(state.orbitAngle) * AUTO_RX;
      const targetWhiskY = CENTER_Y + 2 + Math.sin(state.orbitAngle) * AUTO_RY;

      const lerp = 1 - Math.exp(-14 * dt);
      state.whiskX += (targetWhiskX - state.whiskX) * lerp;
      state.whiskY += (targetWhiskY - state.whiskY) * lerp;

      const targetTilt = 22 + ((state.whiskX - CENTER_X) / AUTO_RX) * 14;
      state.whiskTilt += (targetTilt - state.whiskTilt) * lerp;

      const activeStirIntensity = state.speed;

      const targetRock =
        ((state.whiskX - CENTER_X) / 90) *
        Math.min(3.2, 1.2 + activeStirIntensity * 0.9);
      state.bowlRock += (targetRock - state.bowlRock) * (1 - Math.exp(-8 * dt));

      state.dropletCooldown -= dt;
      if (activeStirIntensity > 0.35 && state.dropletCooldown <= 0) {
        spawnDroplet(state.whiskX, state.whiskY, activeStirIntensity);
        state.dropletCooldown = Math.max(
          0.12,
          0.52 / Math.max(0.4, activeStirIntensity)
        );
      }

      state.sparkleCooldown -= dt;
      if (activeStirIntensity > 0.25 && state.sparkleCooldown <= 0) {
        spawnSparkle();
        state.sparkleCooldown = Math.max(
          0.35,
          1.15 / Math.max(0.5, activeStirIntensity)
        );
      }

      updateParticles(dt);

      batterSwirlGroup.setAttribute(
        "transform",
        `rotate(${state.swirlAngle.toFixed(2)})`
      );

      whiskGroup.setAttribute(
        "transform",
        `translate(${state.whiskX.toFixed(2)}, ${state.whiskY.toFixed(2)}) rotate(${state.whiskTilt.toFixed(2)})`
      );

      const wx = state.whiskX;
      const wy = state.whiskY;
      const meniscusCurveY = wy + 8;
      whiskClipPath.setAttribute(
        "d",
        `M 0,0 L 600,0 L 600,${wy.toFixed(2)} L ${(wx + 42).toFixed(2)},${wy.toFixed(2)} Q ${wx.toFixed(2)},${meniscusCurveY.toFixed(2)} ${(wx - 42).toFixed(2)},${wy.toFixed(2)} L 0,${wy.toFixed(2)} Z`
      );

      const rippleScale =
        0.92 +
        Math.min(0.28, activeStirIntensity * 0.12) +
        Math.sin(timestamp * 0.015) * 0.05;
      whiskRipple.setAttribute(
        "transform",
        `translate(${wx.toFixed(2)}, ${wy.toFixed(2)}) scale(${rippleScale.toFixed(3)})`
      );
      whiskMeniscusFront.setAttribute(
        "transform",
        `translate(${wx.toFixed(2)}, ${wy.toFixed(2)}) scale(${(0.96 + Math.sin(timestamp * 0.015) * 0.04).toFixed(3)}, 1)`
      );

      bowlAssembly.setAttribute(
        "transform",
        `rotate(${state.bowlRock.toFixed(2)}, 300, 424)`
      );
      const shadowShift = state.bowlRock * 1.4;
      const shadowScale = 1 + Math.abs(state.bowlRock) * 0.008;
      groundShadow.setAttribute(
        "transform",
        `translate(${shadowShift.toFixed(2)}, 0) scale(${shadowScale.toFixed(3)}, 1)`
      );
      groundShadow.setAttribute("transform-origin", "300 438");

      rafId = window.requestAnimationFrame(animate);
    }

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      while (particlesLayer.firstChild) {
        particlesLayer.removeChild(particlesLayer.firstChild);
      }
    };
  }, []);

  return (
    <div className="cravely-batter-loader" role="status" aria-live="polite">
      <style>{`
        .cravely-batter-loader {
          --bg-color: #fdf6ee;
          --bg-accent: #f9ecdc;
          --shadow-color: rgba(212, 165, 138, 0.34);
          --bowl-body: #f49ea8;
          --bowl-shade: #e88491;
          --bowl-rim-outer: #e67c8a;
          --bowl-rim-inner: #f7b6be;
          --bowl-inside-wall: #df7482;
          --bowl-highlight: rgba(255, 255, 255, 0.42);
          --bowl-dots: #fff9f5;
          --bow-main: #e86e7e;
          --bow-knot: #d45063;
          --bow-shadow: rgba(180, 62, 82, 0.22);
          --batter-base: #fceab8;
          --batter-swirl-dark: #f3cf80;
          --batter-swirl-light: #fff6dc;
          --batter-ripple: rgba(255, 249, 232, 0.78);
          --whisk-handle: #ec687a;
          --whisk-handle-shade: #d95266;
          --whisk-handle-gloss: #f9a3ae;
          --whisk-collar: #9eaab5;
          --whisk-collar-dark: #82909d;
          --whisk-wire: #7d8b99;
          --drop-light: #fbe2a0;
          --drop-dark: #f5ce75;
          --sparkle-color: #f49ca8;
          --ui-text: #5d3e44;
          position: fixed;
          inset: 0;
          z-index: 100;
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px;
          font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: radial-gradient(circle at 50% 42%, var(--bg-color) 45%, var(--bg-accent) 100%);
          color: var(--ui-text);
        }
        .cravely-batter-stage {
          width: 100%;
          max-width: 560px;
          aspect-ratio: 6 / 5;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          user-select: none;
          -webkit-user-select: none;
        }
        .cravely-batter-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
          display: block;
        }
      `}</style>

      <div className="cravely-batter-stage">
        <svg
          ref={svgRef}
          className="cravely-batter-svg"
          viewBox="0 0 600 500"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Animasi mengaduk adonan kue di dalam mangkuk"
        >
          <defs>
            <clipPath id="batterClip">
              <ellipse cx="300" cy="285" rx="146" ry="40" />
            </clipPath>

            <clipPath id="whiskSubmergeClip">
              <path
                ref={whiskClipPathRef}
                d="M 0,0 L 600,0 L 600,289 L 340,289 Q 300,297 260,289 L 0,289 Z"
              />
            </clipPath>

            <linearGradient id="bowlShadingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity="0" />
              <stop offset="72%" stopColor="#000000" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
            </linearGradient>

            <radialGradient id="batterDepthGrad" cx="50%" cy="46%" r="55%">
              <stop offset="68%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#d8a24a" stopOpacity="0.22" />
            </radialGradient>

            <linearGradient id="handleShadeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          <ellipse
            ref={groundShadowRef}
            cx="300"
            cy="438"
            rx="126"
            ry="15"
            fill="var(--shadow-color)"
          />

          <g ref={bowlAssemblyRef}>
            <g>
              <ellipse
                cx="300"
                cy="280"
                rx="162"
                ry="48"
                fill="var(--bowl-rim-outer)"
              />
              <ellipse
                cx="300"
                cy="280"
                rx="154"
                ry="43"
                fill="var(--bowl-rim-inner)"
              />
              <ellipse
                cx="300"
                cy="284"
                rx="147"
                ry="40"
                fill="var(--bowl-inside-wall)"
              />
            </g>

            <g clipPath="url(#batterClip)">
              <ellipse
                cx="300"
                cy="288"
                rx="150"
                ry="44"
                fill="var(--batter-base)"
              />

              <g transform="translate(300, 287) scale(1, 0.285)">
                <g ref={batterSwirlGroupRef}>
                  <path
                    d="M 0,0
                       C 20,-10 42,-2 48,18
                       C 56,46 26,78 -14,82
                       C -64,87 -106,46 -110,-12
                       C -114,-74 -62,-124 8,-128
                       C 80,-132 138,-78 144,-4"
                    fill="none"
                    stroke="var(--batter-swirl-dark)"
                    strokeWidth="24"
                    strokeLinecap="round"
                    opacity="0.88"
                  />
                  <path
                    d="M 0,0
                       C -22,12 -46,2 -52,-20
                       C -60,-50 -24,-84 20,-86
                       C 72,-88 114,-42 116,18
                       C 118,82 62,132 -12,134"
                    fill="none"
                    stroke="var(--batter-swirl-dark)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    opacity="0.72"
                  />
                  <path
                    d="M -6,-8
                       C 14,-24 44,-18 62,4
                       C 82,28 70,72 34,92
                       C -14,118 -78,96 -104,48"
                    fill="none"
                    stroke="var(--batter-swirl-light)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    opacity="0.92"
                  />
                  <path
                    d="M 10,10
                       C -12,26 -42,22 -64,-4
                       C -86,-30 -72,-78 -30,-100
                       C 22,-126 88,-100 116,-48"
                    fill="none"
                    stroke="var(--batter-swirl-light)"
                    strokeWidth="15"
                    strokeLinecap="round"
                    opacity="0.86"
                  />
                  <path
                    d="M -18,-6 C -8,-22 18,-20 24,-2 C 28,12 12,24 -4,20"
                    fill="none"
                    stroke="var(--batter-swirl-light)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </g>
              </g>

              <ellipse
                cx="300"
                cy="285"
                rx="146"
                ry="40"
                fill="url(#batterDepthGrad)"
              />

              <g ref={whiskRippleRef} transform="translate(300, 289)">
                <ellipse
                  cx="0"
                  cy="0"
                  rx="44"
                  ry="12.5"
                  fill="none"
                  stroke="var(--batter-ripple)"
                  strokeWidth="3.2"
                  opacity="0.72"
                />
                <ellipse
                  cx="0"
                  cy="1"
                  rx="32"
                  ry="9"
                  fill="var(--batter-swirl-dark)"
                  opacity="0.32"
                />
              </g>
            </g>

            <g clipPath="url(#whiskSubmergeClip)">
              <g ref={whiskGroupRef} transform="translate(300, 289) rotate(24)">
                <g
                  fill="none"
                  stroke="var(--whisk-wire)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M 0,48 C -44,36 -46,-20 -8,-54 C 8,-58 8,-58 8,-54 C 46,-20 44,36 0,48 Z"
                    strokeWidth="3.6"
                  />
                  <path
                    d="M 0,48 C -31,38 -32,-20 -6,-54 C 6,-57 6,-57 6,-54 C 32,-20 31,38 0,48 Z"
                    strokeWidth="3.4"
                  />
                  <path
                    d="M 0,48 C -17,40 -18,-20 -3,-54 C 3,-56 3,-56 3,-54 C 18,-20 17,40 0,48 Z"
                    strokeWidth="3.2"
                  />
                  <path d="M 0,48 L 0,-54" strokeWidth="3" />
                </g>

                <path
                  d="M -11,-50 L 11,-50 L 13,-66 C 13,-69 9,-71 0,-71 C -9,-71 -13,-69 -13,-66 Z"
                  fill="var(--whisk-collar)"
                  stroke="var(--whisk-collar-dark)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <line
                  x1="-9"
                  y1="-57"
                  x2="9"
                  y2="-57"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <ellipse
                  cx="0"
                  cy="-178"
                  rx="6.5"
                  ry="11"
                  fill="none"
                  stroke="var(--whisk-handle)"
                  strokeWidth="4.2"
                />

                <rect
                  x="-11.5"
                  y="-170"
                  width="23"
                  height="104"
                  rx="11.5"
                  fill="var(--whisk-handle)"
                />
                <rect
                  x="-11.5"
                  y="-170"
                  width="23"
                  height="104"
                  rx="11.5"
                  fill="url(#handleShadeGrad)"
                />
                <rect
                  x="-6.5"
                  y="-160"
                  width="4.5"
                  height="80"
                  rx="2.25"
                  fill="var(--whisk-handle-gloss)"
                  opacity="0.72"
                />
              </g>
            </g>

            <g clipPath="url(#batterClip)">
              <g ref={whiskMeniscusFrontRef} transform="translate(300, 289)">
                <path
                  d="M -38,0 Q 0,13 38,0 Q 22,19 -22,19 Z"
                  fill="var(--batter-base)"
                  opacity="0.96"
                />
                <path
                  d="M -34,3 Q 0,15 34,3"
                  fill="none"
                  stroke="var(--batter-swirl-dark)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.72"
                />
                <path
                  d="M -30,1 Q 0,10.5 30,1"
                  fill="none"
                  stroke="var(--batter-swirl-light)"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  opacity="0.95"
                />
                <path
                  d="M -42,4 Q 0,19 42,4"
                  fill="none"
                  stroke="var(--batter-ripple)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  opacity="0.82"
                />
              </g>
            </g>

            <g>
              <path
                d="M 138,280
                   A 162,48 0 0,0 462,280
                   C 462,374 394,424 300,424
                   C 206,424 138,374 138,280 Z"
                fill="var(--bowl-body)"
              />

              <path
                d="M 138,280
                   A 162,48 0 0,0 462,280
                   C 462,374 394,424 300,424
                   C 206,424 138,374 138,280 Z"
                fill="url(#bowlShadingGrad)"
              />

              <path
                d="M 141,280 A 159,45 0 0,0 459,280"
                fill="none"
                stroke="var(--bowl-rim-outer)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 146,281 A 154,43 0 0,0 454,281"
                fill="none"
                stroke="var(--bowl-rim-inner)"
                strokeWidth="4.2"
                strokeLinecap="round"
              />

              <path
                d="M 164,338 C 176,374 206,399 246,410"
                fill="none"
                stroke="var(--bowl-highlight)"
                strokeWidth="8"
                strokeLinecap="round"
              />

              <path
                d="M 148,308 A 152,43 0 0,0 452,308"
                fill="none"
                stroke="var(--bowl-dots)"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeDasharray="0.1 16.5"
              />

              <g transform="translate(300, 381)">
                <path
                  d="M -36,-10 L -5,0 L -34,15 C -39,8 -40,-3 -36,-10 Z
                     M 36,-10 L 5,0 L 34,15 C 39,8 40,-3 36,-10 Z"
                  fill="var(--bow-shadow)"
                  transform="translate(0, 3)"
                />
                <path
                  d="M -4,-3 L -34,-15 C -40,-8 -40,8 -34,15 L -4,3 Z"
                  fill="var(--bow-main)"
                  stroke="var(--bow-main)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M 4,-3 L 34,-15 C 40,-8 40,8 34,15 L 4,3 Z"
                  fill="var(--bow-main)"
                  stroke="var(--bow-main)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <rect
                  x="-9"
                  y="-8.5"
                  width="18"
                  height="17"
                  rx="6"
                  fill="var(--bow-knot)"
                />
                <ellipse
                  cx="-2.5"
                  cy="-3"
                  rx="2.5"
                  ry="1.8"
                  fill="rgba(255,255,255,0.28)"
                />
              </g>
            </g>
          </g>

          <g ref={particlesLayerRef} pointerEvents="none" />
        </svg>
      </div>
    </div>
  );
}
