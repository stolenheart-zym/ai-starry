/* ═══════════════════════════════════════════════════════
   智涌星河 · 梵高《星月夜》动态背景引擎
   - 涡流场驱动的「笔触」粒子（致敬梵高的流动星空）
   - 明月 + 光环、闪烁星辰、银河带、村庄、丝柏树、流星
   ═══════════════════════════════════════════════════════ */

const Starry = (function () {
  const cvs = document.getElementById("sky");
  const ctx = cvs.getContext("2d");

  let W = 0, H = 0, DPR = 1;
  let staticLayer = null;      // 静态层（天空/银河/月亮/村庄/丝柏）
  let particles = [];
  let stars = [];
  let vortices = [];
  let windows = [];
  let streaks = [];
  let nextShoot = 3000;
  let mouse = { x: 0, y: 0 };  // 归一化 -0.5 ~ 0.5
  let reduced = false;

  const BLUES = ["#2b5fae", "#3b6fd4", "#5b8bd4", "#7499d6", "#274690", "#8fb3e8", "#4a6fbf"];
  const WARMS = ["#ffd75e", "#ffc93c", "#ffe9a8", "#fff3c4"];

  /* 星辰定义（占画面比例） */
  const STAR_DEFS = [
    [0.18, 0.20, 0.034], [0.34, 0.12, 0.017], [0.52, 0.24, 0.021],
    [0.66, 0.10, 0.015], [0.90, 0.30, 0.019], [0.12, 0.46, 0.013],
    [0.30, 0.40, 0.012], [0.76, 0.42, 0.014], [0.55, 0.62, 0.012], [0.94, 0.70, 0.013],
  ];
  /* 涡流中心（梵高式旋涡） */
  const VORTEX_DEFS = [
    [0.78, 0.17, 7.0, 1], [0.18, 0.22, 5.5, -1], [0.42, 0.36, 4.5, 1],
    [0.88, 0.55, 5.0, -1], [0.22, 0.68, 4.0, 1], [0.60, 0.50, 3.2, -1],
  ];

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ────────── 静态层：夜空、银河、月亮、村庄、丝柏 ────────── */
  function buildStatic() {
    staticLayer = document.createElement("canvas");
    staticLayer.width = W * DPR; staticLayer.height = H * DPR;
    const s = staticLayer.getContext("2d");
    s.setTransform(DPR, 0, 0, DPR, 0, 0);

    /* 夜空渐变 */
    const sky = s.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#060b22");
    sky.addColorStop(0.55, "#0c1a42");
    sky.addColorStop(0.85, "#14295c");
    sky.addColorStop(1, "#1c3166");
    s.fillStyle = sky;
    s.fillRect(0, 0, W, H);

    /* 银河带：沿贝塞尔曲线的柔光团 */
    s.globalCompositeOperation = "lighter";
    const p0 = { x: 0.88 * W, y: 0.08 * H }, p3 = { x: 0.12 * W, y: 0.85 * H };
    const p1 = { x: 0.62 * W, y: 0.28 * H }, p2 = { x: 0.35 * W, y: 0.62 * H };
    function bez(t) {
      const u = 1 - t;
      return {
        x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
      };
    }
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const c = bez(t);
      const px = c.x + rand(-70, 70), py = c.y + rand(-55, 55);
      const r = rand(40, 170);
      const g = s.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, "rgba(200, 220, 255, 0.055)");
      g.addColorStop(1, "rgba(200, 220, 255, 0)");
      s.fillStyle = g;
      s.beginPath(); s.arc(px, py, r, 0, Math.PI * 2); s.fill();
    }
    s.globalCompositeOperation = "source-over";

    /* 梵高式笔触纹理 */
    s.globalAlpha = 0.05;
    for (let i = 0; i < 260; i++) {
      const x = rand(0, W), y = rand(0, H * 0.85);
      const a = rand(0, Math.PI * 2), len = rand(8, 26);
      s.strokeStyle = BLUES[(Math.random() * BLUES.length) | 0];
      s.lineWidth = rand(1, 2.4);
      s.beginPath();
      s.moveTo(x, y);
      s.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      s.stroke();
    }
    s.globalAlpha = 1;

    /* 月亮（右上，新月 + 光环） */
    const mx = 0.8 * W, my = 0.16 * H, mr = Math.min(W, H) * 0.055;
    const glow = s.createRadialGradient(mx, my, 0, mx, my, mr * 7);
    glow.addColorStop(0, "rgba(255, 215, 94, 0.34)");
    glow.addColorStop(0.5, "rgba(255, 215, 94, 0.1)");
    glow.addColorStop(1, "rgba(255, 215, 94, 0)");
    s.fillStyle = glow;
    s.beginPath(); s.arc(mx, my, mr * 7, 0, Math.PI * 2); s.fill();

    const moonGrad = s.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.2, mx, my, mr);
    moonGrad.addColorStop(0, "#fff8e1");
    moonGrad.addColorStop(0.7, "#ffd75e");
    moonGrad.addColorStop(1, "#f5a623");
    s.save();
    s.beginPath(); s.arc(mx, my, mr, 0, Math.PI * 2); s.fillStyle = moonGrad; s.fill();
    s.globalCompositeOperation = "destination-out";
    s.beginPath(); s.arc(mx - mr * 0.5, my - mr * 0.28, mr * 0.95, 0, Math.PI * 2); s.fill();
    s.restore();

    /* 月亮的光环漩涡 */
    s.strokeStyle = "rgba(255, 215, 94, 0.16)";
    s.lineWidth = 2;
    s.beginPath(); s.ellipse(mx, my, mr * 3.1, mr * 2.5, -0.35, 0, Math.PI * 2); s.stroke();
    s.strokeStyle = "rgba(255, 215, 94, 0.1)";
    s.beginPath(); s.ellipse(mx, my, mr * 4.4, mr * 3.5, -0.35, 0, Math.PI * 2); s.stroke();
    s.strokeStyle = "rgba(255, 215, 94, 0.06)";
    s.beginPath(); s.ellipse(mx, my, mr * 5.8, mr * 4.6, -0.35, 0, Math.PI * 2); s.stroke();

    /* 远山与近丘 */
    s.fillStyle = "#0b1330";
    s.beginPath();
    s.moveTo(0, H * 0.88);
    s.quadraticCurveTo(W * 0.18, H * 0.78, W * 0.38, H * 0.86);
    s.quadraticCurveTo(W * 0.6, H * 0.76, W * 0.82, H * 0.86);
    s.quadraticCurveTo(W * 0.92, H * 0.82, W, H * 0.88);
    s.lineTo(W, H); s.lineTo(0, H); s.closePath(); s.fill();

    s.fillStyle = "#080e26";
    s.beginPath();
    s.moveTo(0, H * 0.95);
    s.quadraticCurveTo(W * 0.25, H * 0.87, W * 0.5, H * 0.94);
    s.quadraticCurveTo(W * 0.75, H * 0.86, W, H * 0.94);
    s.lineTo(W, H); s.lineTo(0, H); s.closePath(); s.fill();

    /* 村庄（小房子 + 教堂尖塔） */
    windows = [];
    const houseCol = "#0e1533";
    const baseY = H * 0.918;
    for (let i = 0; i < 9; i++) {
      const hx = W * (0.3 + i * 0.045) + rand(-6, 6);
      const hw = rand(16, 26), hh = rand(13, 20);
      const hy = baseY - hh;
      s.fillStyle = houseCol;
      s.fillRect(hx, hy, hw, hh);
      const wn = 2 + ((Math.random() * 2) | 0);
      for (let k = 0; k < wn; k++) {
        windows.push({ x: hx + hw * (0.25 + k * 0.35), y: hy + hh * 0.45, ph: Math.random() * 6.28 });
      }
    }
    /* 教堂 */
    const cx2 = W * 0.56;
    s.fillStyle = houseCol;
    s.fillRect(cx2 - 7, baseY - 18, 14, 18);
    s.beginPath();
    s.moveTo(cx2 - 5, baseY - 18);
    s.lineTo(cx2 + 5, baseY - 18);
    s.lineTo(cx2, baseY - 40);
    s.closePath(); s.fill();
    s.strokeStyle = "rgba(126, 232, 250, 0.25)";
    s.lineWidth = 1;
    s.beginPath(); s.moveTo(cx2, baseY - 40); s.lineTo(cx2, baseY - 45); s.stroke();
    s.beginPath(); s.moveTo(cx2 - 4, baseY - 43); s.lineTo(cx2 + 4, baseY - 43); s.stroke();

    /* 丝柏树（梵高式的火焰形） */
    const cyx = 0.075 * W, tipY = H * 0.6;
    s.fillStyle = "#0b1230";
    s.beginPath();
    s.moveTo(cyx - 16, H);
    s.quadraticCurveTo(cyx - 21, H * 0.85, cyx - 10, H * 0.78);
    s.quadraticCurveTo(cyx - 15, H * 0.72, cyx - 4, H * 0.66);
    s.quadraticCurveTo(cyx - 9, H * 0.63, cyx, tipY);
    s.quadraticCurveTo(cyx + 9, H * 0.63, cyx + 4, H * 0.66);
    s.quadraticCurveTo(cyx + 15, H * 0.72, cyx + 10, H * 0.78);
    s.quadraticCurveTo(cyx + 21, H * 0.85, cyx + 16, H);
    s.closePath(); s.fill();
    s.strokeStyle = "rgba(74, 125, 255, 0.18)";
    s.lineWidth = 1.5;
    s.beginPath();
    s.moveTo(cyx - 4, H * 0.98);
    s.quadraticCurveTo(cyx - 12, H * 0.76, cyx - 2, H * 0.65);
    s.stroke();
  }

  /* ────────── 粒子：涡流笔触 ────────── */
  function spawnParticle(anywhere) {
    const x = rand(-40, W + 40), y = anywhere ? rand(0, H * 0.9) : rand(H * 0.05, H * 0.9);
    return {
      x, y, px: x, py: y,
      ci: (Math.random() * BLUES.length) | 0,
      lw: rand(1.1, 2.3),
      life: rand(0.5, 1),
      dl: rand(0.0012, 0.003),
      wob: rand(0, 6.28),
    };
  }

  function stepParticles(dt) {
    const t = performance.now();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let vx = 0.06, vy = 0;
      for (let k = 0; k < vortices.length; k++) {
        const v = vortices[k];
        const dx = p.x - v.x, dy = p.y - v.y;
        const r2 = dx * dx + dy * dy + 900;
        const f = (v.s * 2200) / (r2 + 400);
        vx += v.spin * f * -dy;
        vy += v.spin * f * dx;
      }
      vx += Math.sin(p.y * 0.006 + t * 0.0004 + p.wob) * 0.09;
      vy += Math.cos(p.x * 0.005 + t * 0.00035 + p.wob) * 0.05;

      p.px = p.x; p.py = p.y;
      p.x += vx * dt; p.y += vy * dt;
      p.life -= p.dl * dt;
      if (p.life <= 0 || p.x < -60 || p.x > W + 60 || p.y < -40 || p.y > H * 0.95) {
        particles[i] = spawnParticle();
        continue;
      }

      /* 颜色：靠近星辰的笔触用暖色 */
      let col = BLUES[p.ci];
      for (let sI = 0; sI < stars.length; sI++) {
        const st = stars[sI];
        const dx = p.x - st.x, dy = p.y - st.y;
        if (dx * dx + dy * dy < st.r * st.r * 56) {
          col = WARMS[(Math.random() * WARMS.length) | 0];
          break;
        }
      }
      ctx.strokeStyle = col;
      ctx.globalAlpha = Math.max(0, Math.min(0.55, p.life * 0.5));
      ctx.lineWidth = p.lw;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ────────── 星辰闪烁 ────────── */
  function drawStars(t) {
    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      const tw = 0.72 + 0.28 * Math.sin(t * 0.001 * (0.7 + st.ph) + st.ph);
      /* 光晕环 */
      ctx.strokeStyle = "rgba(255, 215, 94, 0.28)";
      ctx.globalAlpha = 0.5 * tw;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r * 2.6, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.22 * tw;
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r * 4.2, 0, Math.PI * 2); ctx.stroke();
      /* 核心 */
      const g = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.r * 2.4);
      g.addColorStop(0, "rgba(255, 250, 230, " + (0.95 * tw) + ")");
      g.addColorStop(0.35, "rgba(255, 215, 94, " + (0.75 * tw) + ")");
      g.addColorStop(1, "rgba(255, 215, 94, 0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r * 2.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ────────── 村庄灯火 ────────── */
  function drawWindows(t) {
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      const a = 0.45 + 0.5 * Math.sin(t * 0.0016 + w.ph);
      if (a < 0.12) continue;   // 有的灯熄着
      ctx.fillStyle = "rgba(255, 215, 94, " + a.toFixed(3) + ")";
      ctx.fillRect(w.x - 1.4, w.y - 1.4, 2.8, 2.8);
    }
  }

  /* ────────── 流星 ────────── */
  function drawStreaks(t) {
    if (t > nextShoot) {
      nextShoot = t + rand(6000, 11000);
      const sx = rand(W * 0.2, W * 0.8), sy = rand(H * 0.05, H * 0.3);
      const ang = rand(-0.5, -0.1);
      streaks.push({
        pts: [{ x: sx, y: sy }],
        vx: Math.cos(ang) * rand(9, 13),
        vy: Math.sin(ang) * rand(9, 13) * -1,
        life: 1,
      });
    }
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      s.pts.push({ x: s.pts[s.pts.length - 1].x + s.vx, y: s.pts[s.pts.length - 1].y + s.vy });
      if (s.pts.length > 26) s.pts.shift();
      s.life -= 0.045;
      if (s.life <= 0 || s.pts[0].y > H) { streaks.splice(i, 1); continue; }
      const head = s.pts[s.pts.length - 1];
      const grad = ctx.createLinearGradient(s.pts[0].x, s.pts[0].y, head.x, head.y);
      grad.addColorStop(0, "rgba(255, 248, 225, 0)");
      grad.addColorStop(1, "rgba(255, 248, 225, " + (0.75 * s.life).toFixed(3) + ")");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for (let k = 1; k < s.pts.length; k++) ctx.lineTo(s.pts[k].x, s.pts[k].y);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 250, 235, " + s.life.toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(head.x, head.y, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ────────── 主循环 ────────── */
  let lastT = 0;
  function frame(t) {
    if (reduced) return;
    const dt = Math.min(2.5, (t - lastT) / 16.7 || 1);
    lastT = t;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(staticLayer, 0, 0);
    stepParticles(dt);
    drawStars(t);
    drawWindows(t);
    drawStreaks(t);
    requestAnimationFrame(frame);
  }

  function layout() {
    stars = STAR_DEFS.map(function (d) {
      return { x: d[0] * W, y: d[1] * H, r: d[2] * Math.min(W, H), ph: Math.random() * 6.28 };
    });
    vortices = VORTEX_DEFS.map(function (d) {
      return { x: d[0] * W, y: d[1] * H, s: d[2], spin: d[3] };
    });
    const n = Math.min(700, Math.floor((W * H) / 2600));
    particles = [];
    for (let i = 0; i < n; i++) particles.push(spawnParticle(true));
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cvs.width = W * DPR; cvs.height = H * DPR;
    cvs.style.width = W + "px"; cvs.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStatic();
    layout();
    if (reduced) {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(staticLayer, 0, 0);
      drawStars(1000);
      drawWindows(1000);
    }
  }

  let resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  function setMouse(nx, ny) { mouse.x = nx; mouse.y = ny; }

  function init() {
    reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resize();
    if (!reduced) requestAnimationFrame(frame);
  }

  return { init: init, resize: resize, setMouse: setMouse };
})();
