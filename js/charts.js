/* ═══════════════════════════════════════════════════════
   智涌星河 · 数据可视化引擎（D3 v7 + Canvas）
   星河河流图 / 星宿星座图 / 双子星对比 / 超新星 /
   算力对数曲线 / 米特环 / 引力场 / 时间线
   ═══════════════════════════════════════════════════════ */

const Charts = (function () {
  const registry = [];
  const built = {};
  const flowStates = {};
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* 注册可重建的图表（resize 时整体重绘） */
  function build(id, fn) {
    if (built[id]) return;
    built[id] = true;
    registry.push({ id: id, fn: fn });
    fn();
  }
  function rebuildAll() { registry.forEach(function (r) { r.fn(); }); }

  /* ────────── 工具 ────────── */
  const tip = document.getElementById("tooltip");
  function tipShow(ev, title, note) {
    tip.hidden = false;
    tip.innerHTML = '<div class="tt-title">' + title + "</div>" + (note ? '<div class="tt-note">' + note + "</div>" : "");
    tipMove(ev);
  }
  function tipMove(ev) {
    tip.style.left = (ev.clientX + 16) + "px";
    tip.style.top = (ev.clientY + 16) + "px";
  }
  function tipHide() { tip.hidden = true; }

  function countUp(el, target, opt) {
    opt = opt || {};
    const prefix = opt.prefix || "", suffix = opt.suffix || "", dec = opt.dec || 0;
    const dur = opt.dur || 1800, delay = opt.delay || 0;
    const t0 = performance.now() + delay;
    function tick(now) {
      if (now < t0) { requestAnimationFrame(tick); return; }
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * e).toLocaleString("zh-CN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function sup10(e) {
    return "10" + String(e).split("").map(function (c) { return "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c]; }).join("");
  }

  /* ═══════════════════════════════════════════════
     贰 · 星河河流图
     面积渐变 + 描边发光 + 流光粒子 + 里程碑星
     ═══════════════════════════════════════════════ */
  function river(containerId, cfg) {
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    const w = Math.max(el.clientWidth || 600, 320);
    const h = cfg.height || 330;
    const m = { l: 60, r: 28, t: 30, b: 44 };
    const data = cfg.data;
    const svg = d3.select(el).append("svg").attr("viewBox", "0 0 " + w + " " + h).attr("width", "100%").attr("height", h);
    const xs = d3.scaleLinear().domain(d3.extent(data, function (d) { return d.y; })).range([m.l, w - m.r]);
    const ys = d3.scaleLinear().domain([0, d3.max(data, function (d) { return d.v; }) * 1.16]).range([h - m.b, m.t]);
    const line = d3.line().x(function (d) { return xs(d.y); }).y(function (d) { return ys(d.v); }).curve(d3.curveMonotoneX);
    const area = d3.area().x(function (d) { return xs(d.y); }).y0(h - m.b).y1(function (d) { return ys(d.v); }).curve(d3.curveMonotoneX);

    const defs = svg.append("defs");
    const gid = containerId + "-grad", fid = containerId + "-blur";
    const grad = defs.append("linearGradient").attr("id", gid).attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 1);
    grad.append("stop").attr("offset", "0%").attr("stop-color", cfg.color).attr("stop-opacity", 0.55);
    grad.append("stop").attr("offset", "100%").attr("stop-color", cfg.color).attr("stop-opacity", 0.02);
    defs.append("filter").attr("id", fid).attr("x", "-60%").attr("y", "-60%").attr("width", "220%").attr("height", "220%")
      .append("feGaussianBlur").attr("stdDeviation", 5);

    /* 网格与坐标轴 */
    svg.append("g").attr("class", "grid").selectAll("line").data(ys.ticks(4)).join("line")
      .attr("x1", m.l).attr("x2", w - m.r).attr("y1", function (d) { return ys(d); }).attr("y2", function (d) { return ys(d); })
      .attr("stroke", "rgba(126,232,250,.10)").attr("stroke-dasharray", "3 6");
    svg.append("g").selectAll("text").data(ys.ticks(4)).join("text")
      .attr("x", m.l - 8).attr("y", function (d) { return ys(d); }).attr("dy", "0.35em")
      .attr("text-anchor", "end").attr("fill", "rgba(232,236,255,.55)").attr("font-size", 11)
      .text(function (d) { return d; });
    svg.append("g").selectAll("text")
      .data(data.filter(function (d, i) { return w > 620 || i % 2 === 0; })).join("text")
      .attr("x", function (d) { return xs(d.y); }).attr("y", h - m.b + 24)
      .attr("text-anchor", "middle")
      .attr("fill", function (d) { return d.e ? "rgba(255,215,94,.65)" : "rgba(232,236,255,.55)"; })
      .attr("font-size", 11.5).text(function (d) { return d.y; });

    /* 面积与线条 */
    const areaPath = svg.append("path").attr("d", area(data)).attr("fill", "url(#" + gid + ")").attr("opacity", 0);
    const glowLine = svg.append("path").attr("d", line(data)).attr("fill", "none")
      .attr("stroke", cfg.color).attr("stroke-width", 9).attr("opacity", 0.26)
      .attr("filter", "url(#" + fid + ")").attr("stroke-linecap", "round");
    const mainLine = svg.append("path").attr("d", line(data)).attr("fill", "none")
      .attr("stroke", cfg.color).attr("stroke-width", 2.4).attr("stroke-linecap", "round");

    const total = mainLine.node().getTotalLength();
    [glowLine, mainLine].forEach(function (p) {
      p.attr("stroke-dasharray", total).attr("stroke-dashoffset", total)
        .transition().duration(2100).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
    });
    areaPath.transition().delay(1000).duration(1400).attr("opacity", 1);

    /* 预测段虚线 */
    const fc = data.filter(function (d) { return d.e; });
    if (fc.length > 1) {
      const idx = data.findIndex(function (d) { return d.e; });
      svg.append("path").attr("d", line([data[idx - 1]].concat(fc))).attr("fill", "none")
        .attr("stroke", cfg.color).attr("stroke-width", 2.4).attr("stroke-dasharray", "5 8")
        .attr("opacity", 0).transition().delay(2000).duration(1200).attr("opacity", 0.9);
    }

    /* 里程碑亮星 */
    (cfg.milestones || []).forEach(function (mk) {
      /* 线性插值求里程碑对应的数值 */
      let d0 = data[0];
      for (let i = 0; i < data.length - 1; i++) {
        if (mk.t >= data[i].y && mk.t <= data[i + 1].y) {
          const f = (mk.t - data[i].y) / (data[i + 1].y - data[i].y);
          d0 = { y: mk.t, v: data[i].v + f * (data[i + 1].v - data[i].v) };
          break;
        }
        d0 = data[data.length - 1];
      }
      const g = svg.append("g").attr("transform", "translate(" + xs(d0.y) + "," + ys(d0.v) + ")")
        .style("cursor", "pointer").attr("opacity", 0);
      g.transition().delay(2600).duration(800).attr("opacity", 1);
      g.append("circle").attr("r", 13).attr("fill", "none").attr("stroke", cfg.color).attr("stroke-opacity", 0.4).attr("class", "ms-ring");
      g.append("circle").attr("r", 8).attr("fill", "#ffd75e").attr("opacity", 0.3);
      g.append("circle").attr("r", 4.4).attr("fill", "#ffd75e");
      g.append("text").attr("x", 15).attr("y", -12).attr("fill", "#ffd75e").attr("font-size", 12.5)
        .attr("font-family", "KaiTi, STKaiti, serif").text(mk.title);
      g.on("mouseenter", function (ev) { tipShow(ev, mk.title, mk.note); })
        .on("mousemove", tipMove)
        .on("mouseleave", tipHide);
    });

    /* 沿河流动的星光（按容器去重，防止 rebuild 后残留循环） */
    flowStates[containerId] = false;
    const flowG = svg.append("g");
    const dots = d3.range(10).map(function (i) {
      return {
        p: -i / 10,
        sp: 0.0011 + Math.random() * 0.001,
        c: flowG.append("circle").attr("r", 2.4).attr("fill", cfg.flowColor).attr("opacity", 0),
      };
    });
    function flowStep() {
      if (!flowStates[containerId]) return;
      const L = mainLine.node().getTotalLength();
      dots.forEach(function (d) {
        d.p += d.sp;
        if (d.p > 1.02) d.p = -0.02;
        const p = Math.max(0, Math.min(1, d.p));
        const pt = mainLine.node().getPointAtLength(p * L);
        d.c.attr("cx", pt.x).attr("cy", pt.y).attr("opacity", 0.5 + 0.5 * Math.sin(p * Math.PI));
      });
      requestAnimationFrame(flowStep);
    }
    new IntersectionObserver(function (en) {
      flowStates[containerId] = en[0].isIntersecting;
      if (en[0].isIntersecting) requestAnimationFrame(flowStep);
    }, { threshold: 0.25 }).observe(el);

    /* 悬停查数 */
    const guide = svg.append("line").attr("y1", m.t).attr("y2", h - m.b)
      .attr("stroke", "rgba(255,215,94,.4)").attr("stroke-dasharray", "3 4").attr("opacity", 0);
    const hdot = svg.append("circle").attr("r", 4.5).attr("fill", cfg.color).attr("opacity", 0);
    svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b)
      .attr("fill", "transparent")
      .on("mousemove", function (ev) {
        const t = xs.invert(d3.pointer(ev, this)[0] + m.l);
        let d0 = data[0];
        data.forEach(function (d) { if (Math.abs(d.y - t) < Math.abs(d0.y - t)) d0 = d; });
        guide.attr("x1", xs(d0.y)).attr("x2", xs(d0.y)).attr("opacity", 1);
        hdot.attr("cx", xs(d0.y)).attr("cy", ys(d0.v)).attr("opacity", 1);
        const i = data.indexOf(d0);
        const growth = i > 0 ? " · 同比 +" + ((d0.v - data[i - 1].v) / data[i - 1].v * 100).toFixed(1) + "%" : "";
        tipShow(ev, d0.y + " 年", (cfg.fmtV ? cfg.fmtV(d0.v) : d0.v) + growth + (d0.e ? "（预测）" : ""));
      })
      .on("mouseleave", function () { guide.attr("opacity", 0); hdot.attr("opacity", 0); tipHide(); });
  }

  /* ═══════════════════════════════════════════════
     叁 · 星宿星座图（环形星群 + 中心雷达 + 点击联动）
     ═══════════════════════════════════════════════ */
  function constellation(containerId, data, onSelect) {
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    const w = Math.max(el.clientWidth || 640, 320);
    const h = Math.min(560, Math.max(450, w * 0.66));
    const svg = d3.select(el).append("svg").attr("viewBox", "0 0 " + w + " " + h).attr("width", "100%").attr("height", h);
    const cx = w / 2, cy = h / 2 + 6;
    const R = Math.min(w, h) * 0.34;
    const n = data.length, D = 4;
    const dimNames = ["应用深度", "效率提升", "成本优化", "创新引领"];
    const pos = data.map(function (d, i) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / n;
      return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });

    const defs = svg.append("defs");
    const sgId = containerId + "-sg";
    const sg = defs.append("radialGradient").attr("id", sgId);
    sg.append("stop").attr("offset", "0%").attr("stop-color", "#fff8e1");
    sg.append("stop").attr("offset", "55%").attr("stop-color", "#ffd75e");
    sg.append("stop").attr("offset", "100%").attr("stop-color", "#f5a623").attr("stop-opacity", 0);

    /* 星座连线骨架 */
    const skel = svg.append("g").attr("stroke", "rgba(126,232,250,.16)").attr("stroke-dasharray", "2 7").attr("stroke-width", 1);
    for (let i = 0; i < n; i++) {
      [2, 3].forEach(function (k) {
        const j = (i + k) % n;
        skel.append("line").attr("x1", pos[i].x).attr("y1", pos[i].y).attr("x2", pos[j].x).attr("y2", pos[j].y);
      });
    }

    /* 中心雷达图 */
    const RAD = Math.min(R * 0.3, 90);
    const rPt = function (i, v) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / D;
      return [cx + v / 100 * RAD * Math.cos(a), cy + v / 100 * RAD * Math.sin(a)];
    };
    const rPoly = function (vals) {
      return d3.line()(d3.range(D).map(function (i) { return rPt(i, vals[i]); })) + "Z";
    };
    const gridG = svg.append("g");
    [0.5, 1].forEach(function (f) {
      gridG.append("circle").attr("cx", cx).attr("cy", cy).attr("r", RAD * f)
        .attr("fill", "none").attr("stroke", "rgba(126,232,250,.16)");
    });
    d3.range(D).forEach(function (i) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / D;
      gridG.append("line").attr("x1", cx).attr("y1", cy)
        .attr("x2", cx + RAD * Math.cos(a)).attr("y2", cy + RAD * Math.sin(a))
        .attr("stroke", "rgba(126,232,250,.12)");
      gridG.append("text")
        .attr("x", cx + (RAD + 22) * Math.cos(a)).attr("y", cy + (RAD + 22) * Math.sin(a)).attr("dy", "0.32em")
        .attr("text-anchor", Math.abs(Math.cos(a)) < 0.3 ? "middle" : (Math.cos(a) > 0 ? "start" : "end"))
        .attr("fill", "rgba(232,236,255,.62)").attr("font-size", 12).text(dimNames[i]);
    });
    const radarArea = svg.append("path").attr("d", rPoly(data[0].radar))
      .attr("fill", "rgba(255,215,94,.16)").attr("stroke", "#ffd75e").attr("stroke-width", 1.8);
    svg.append("text").attr("x", cx).attr("y", cy + 34).attr("text-anchor", "middle")
      .attr("fill", "rgba(232,236,255,.45)").attr("font-size", 10.5).text("行业数字化雷达");

    /* 选中连线（中心 → 星辰） */
    const rays = svg.append("g");
    pos.forEach(function (p, i) {
      rays.append("line").attr("x1", cx).attr("y1", cy).attr("x2", p.x).attr("y2", p.y)
        .attr("stroke", "#ffd75e").attr("stroke-dasharray", "4 7").attr("opacity", 0).attr("stroke-width", 1.2);
    });

    /* 星辰 */
    let current = 0;
    const starG = svg.append("g");
    data.forEach(function (d, i) {
      const g = starG.append("g").attr("transform", "translate(" + pos[i].x + "," + pos[i].y + ")")
        .style("cursor", "pointer");
      const inner = g.append("g");
      inner.append("circle").attr("r", 24).attr("fill", "url(#" + sgId + ")").attr("opacity", 0.85);
      inner.append("circle").attr("r", 24).attr("fill", "none").attr("stroke", "rgba(255,215,94,.5)");
      inner.append("circle").attr("r", 34).attr("fill", "none").attr("stroke", "#ffd75e").attr("stroke-opacity", 0.16).attr("class", "star-halo");
      inner.append("text").attr("dy", "0.36em").attr("text-anchor", "middle")
        .attr("fill", "#1a1f3d").attr("font-size", 19).attr("font-weight", 700)
        .attr("font-family", "KaiTi, STKaiti, serif").text(d.char);
      /* 名称标签（环外） */
      const dx = pos[i].x - cx, dy = pos[i].y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      svg.append("text")
        .attr("x", pos[i].x + dx / dist * 40).attr("y", pos[i].y + dy / dist * 40)
        .attr("dy", "0.34em")
        .attr("text-anchor", Math.abs(dx) < 20 ? "middle" : (dx > 0 ? "start" : "end"))
        .attr("fill", "rgba(232,236,255,.6)").attr("font-size", 12.5)
        .attr("font-family", "KaiTi, STKaiti, serif").text(d.name);

      g.on("mouseenter", function (ev) {
        inner.transition().duration(240).attr("transform", "scale(1.14)");
        tipShow(ev, d.name, d.desc);
      })
        .on("mousemove", tipMove)
        .on("mouseleave", function () {
          inner.transition().duration(240).attr("transform", "scale(1)");
          tipHide();
        })
        .on("click", function () { select(i); });
    });

    function select(i) {
      current = i;
      const d = data[i];
      const curPath = radarArea.attr("d");
      const newPath = rPoly(d.radar);
      radarArea.transition().duration(750).ease(d3.easeCubicInOut)
        .attrTween("d", function () { return d3.interpolateString(curPath, newPath); });
      rays.selectAll("line").transition().duration(600)
        .attr("opacity", function (_, k) { return k === i ? 0.65 : 0; });
      starG.selectAll("g > g").transition().duration(400).attr("opacity", function (_, k) { return k === i ? 1 : 0.42; });
      if (onSelect) onSelect(d);
    }
    select(0);
  }

  /* ═══════════════════════════════════════════════
     肆 · 双子星对比（双球 + 能量桥 + 动画条形 + 指标切换）
     ═══════════════════════════════════════════════ */
  function duel(containerId, metrics) {
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    el.innerHTML =
      '<div class="duel-top">' +
      '  <div class="duel-orb cn">' +
      '    <div class="orb-ball"></div>' +
      '    <div class="orb-title">中国</div>' +
      '    <div class="orb-sub">东方辰星</div>' +
      '    <div class="orb-val" id="val-cn">—</div>' +
      "  </div>" +
      '  <div class="duel-mid">' +
      '    <div class="duel-vs">VS</div>' +
      '    <div class="duel-beam"></div>' +
      '    <div class="duel-ratio" id="duel-ratio">—</div>' +
      "  </div>" +
      '  <div class="duel-orb us">' +
      '    <div class="orb-ball"></div>' +
      '    <div class="orb-title">美国</div>' +
      '    <div class="orb-sub">西方辉星</div>' +
      '    <div class="orb-val" id="val-us">—</div>' +
      "  </div>" +
      "</div>" +
      '<div class="duel-bars" id="duel-bars">' +
      '  <div class="bar-row"><span class="bar-name cn">中国</span><div class="bar-track"><div class="bar-fill cn" id="bar-cn"></div></div><span class="bar-val" id="barv-cn"></span></div>' +
      '  <div class="bar-row"><span class="bar-name us">美国</span><div class="bar-track"><div class="bar-fill us" id="bar-us"></div></div><span class="bar-val" id="barv-us"></span></div>' +
      "</div>" +
      '<div class="duel-metrics" id="duel-metrics"></div>' +
      '<div class="duel-src" id="duel-src"></div>';

    const btnBox = el.querySelector("#duel-metrics");
    metrics.forEach(function (m, i) {
      const b = document.createElement("button");
      b.textContent = m.name;
      b.addEventListener("click", function () { set(i); });
      btnBox.appendChild(b);
    });

    const ballCn = el.querySelector("#orb-cn .orb-ball");
    const ballUs = el.querySelector("#orb-us .orb-ball");
    const barCn = el.querySelector("#bar-cn");
    const barUs = el.querySelector("#bar-us");
    const valCn = el.querySelector("#val-cn");
    const valUs = el.querySelector("#val-us");
    const barvCn = el.querySelector("#barv-cn");
    const barvUs = el.querySelector("#barv-us");

    function set(i) {
      const m = metrics[i];
      const mx = Math.max(m.cn, m.us);
      ballCn.style.transform = "scale(" + (0.55 + 0.5 * m.cn / mx).toFixed(3) + ")";
      ballUs.style.transform = "scale(" + (0.55 + 0.5 * m.us / mx).toFixed(3) + ")";
      ballCn.style.boxShadow = m.cn >= m.us ? "0 0 70px 16px rgba(255,215,94,.55)" : "0 0 50px 8px rgba(255,215,94,.45)";
      ballUs.style.boxShadow = m.us >= m.cn ? "0 0 70px 16px rgba(126,232,250,.55)" : "0 0 50px 8px rgba(126,232,250,.45)";
      barCn.style.width = (m.cn / mx * 100) + "%";
      barUs.style.width = (m.us / mx * 100) + "%";
      valCn.textContent = m.cnLabel;
      valUs.textContent = m.usLabel;
      barvCn.textContent = m.cnLabel;
      barvUs.textContent = m.usLabel;
      const ratio = m.cn >= m.us
        ? "中国 ≈ 美国的 " + (m.cn / m.us).toFixed(1) + " 倍"
        : "美国 ≈ 中国的 " + (m.us / m.cn).toFixed(1) + " 倍";
      el.querySelector("#duel-ratio").textContent = ratio;
      el.querySelector("#duel-src").textContent = "数据来源：" + m.src;
      btnBox.querySelectorAll("button").forEach(function (b, k) { b.classList.toggle("active", k === i); });
    }
    set(0);
  }

  /* ═══════════════════════════════════════════════
     伍 · 超新星爆发（Canvas 粒子爆炸）
     ═══════════════════════════════════════════════ */
  let nvCvs = null, nvCtx = null, nvParts = [], nvActive = false, nvT0 = 0, nvW = 0, nvH = 0, nvRunning = false;
  function novaInit(sel) {
    nvCvs = document.querySelector(sel);
    nvCtx = nvCvs.getContext("2d");
    novaSize();
  }
  function novaSize() {
    if (!nvCvs) return;
    const r = nvCvs.parentElement.getBoundingClientRect();
    nvW = Math.max(r.width, 280); nvH = Math.max(r.height - 40, 260);
    nvCvs.width = nvW * DPR; nvCvs.height = nvH * DPR;
    nvCvs.style.width = nvW + "px"; nvCvs.style.height = nvH + "px";
    nvCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function novaFire() {
    if (reduced || !nvCvs) return;
    const warm = ["#ffd75e", "#fff3c4", "#ffb300", "#fff8e1"];
    const cool = ["#7ee8fa", "#4a7dff", "#b48cff"];
    nvParts = [];
    for (let i = 0; i < 300; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.6 + Math.random() * 8.5;
      nvParts.push({
        x: nvW / 2, y: nvH / 2,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 1,
        col: Math.random() < 0.68 ? warm[(Math.random() * warm.length) | 0] : cool[(Math.random() * cool.length) | 0],
      });
    }
    nvActive = true; nvT0 = performance.now();
    if (!nvRunning) { nvRunning = true; requestAnimationFrame(novaLoop); }
  }
  function novaLoop(now) {
    if (!nvActive) { nvRunning = false; return; }
    const e = (now - nvT0) / 1000;
    nvCtx.clearRect(0, 0, nvW, nvH);
    /* 冲击波 */
    nvCtx.strokeStyle = "rgba(255,240,200," + Math.max(0, 0.5 - e * 0.33).toFixed(3) + ")";
    nvCtx.lineWidth = 2;
    nvCtx.beginPath(); nvCtx.arc(nvW / 2, nvH / 2, e * 190, 0, Math.PI * 2); nvCtx.stroke();
    /* 核心 */
    const g = nvCtx.createRadialGradient(nvW / 2, nvH / 2, 0, nvW / 2, nvH / 2, 34 + e * 60);
    g.addColorStop(0, "rgba(255,250,235," + Math.max(0, 0.9 - e * 0.4).toFixed(3) + ")");
    g.addColorStop(0.4, "rgba(255,215,94," + Math.max(0, 0.55 - e * 0.3).toFixed(3) + ")");
    g.addColorStop(1, "rgba(255,215,94,0)");
    nvCtx.fillStyle = g;
    nvCtx.beginPath(); nvCtx.arc(nvW / 2, nvH / 2, 34 + e * 60, 0, Math.PI * 2); nvCtx.fill();
    /* 粒子 */
    nvCtx.lineWidth = 2;
    nvCtx.lineCap = "round";
    let alive = false;
    nvParts.forEach(function (p) {
      if (p.life <= 0) return;
      alive = true;
      p.vx *= 0.982; p.vy *= 0.982;
      const nx = p.x + p.vx, ny = p.y + p.vy;
      nvCtx.strokeStyle = p.col;
      nvCtx.globalAlpha = Math.max(0, p.life);
      nvCtx.beginPath();
      nvCtx.moveTo(p.x, p.y);
      nvCtx.lineTo(nx, ny);
      nvCtx.stroke();
      p.x = nx; p.y = ny;
      p.life -= 0.005;
    });
    nvCtx.globalAlpha = 1;
    if (!alive) { nvActive = false; nvRunning = false; }
    else requestAnimationFrame(novaLoop);
  }

  /* ═══════════════════════════════════════════════
     伍 · 算力对数曲线
     ═══════════════════════════════════════════════ */
  function computeCurve(containerId, data) {
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    const w = Math.max(el.clientWidth || 600, 320);
    const h = 330;
    const m = { l: 64, r: 30, t: 28, b: 44 };
    const svg = d3.select(el).append("svg").attr("viewBox", "0 0 " + w + " " + h).attr("width", "100%").attr("height", h);
    const xs = d3.scaleLinear().domain([2012, 2024]).range([m.l, w - m.r]);
    const ys = d3.scaleLog().domain([1e15, 1e27]).range([h - m.b, m.t]);
    const line = d3.line().x(function (d) { return xs(d.y); }).y(function (d) { return ys(d.f); }).curve(d3.curveMonotoneX);

    const defs = svg.append("defs");
    const gid = containerId + "-grad", fid = containerId + "-blur";
    const grad = defs.append("linearGradient").attr("id", gid).attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 1);
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#b48cff").attr("stop-opacity", 0.5);
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#b48cff").attr("stop-opacity", 0.02);
    defs.append("filter").attr("id", fid).attr("x", "-60%").attr("y", "-60%").attr("width", "220%").attr("height", "220%")
      .append("feGaussianBlur").attr("stdDeviation", 5);

    const area = d3.area().x(function (d) { return xs(d.y); }).y0(h - m.b).y1(function (d) { return ys(d.f); }).curve(d3.curveMonotoneX);
    const areaPath = svg.append("path").attr("d", area(data)).attr("fill", "url(#" + gid + ")").attr("opacity", 0);
    const glow = svg.append("path").attr("d", line(data)).attr("fill", "none")
      .attr("stroke", "#b48cff").attr("stroke-width", 9).attr("opacity", 0.25)
      .attr("filter", "url(#" + fid + ")").attr("stroke-linecap", "round");
    const main = svg.append("path").attr("d", line(data)).attr("fill", "none")
      .attr("stroke", "#c9a6ff").attr("stroke-width", 2.4).attr("stroke-linecap", "round");
    const total = main.node().getTotalLength();
    [glow, main].forEach(function (p) {
      p.attr("stroke-dasharray", total).attr("stroke-dashoffset", total)
        .transition().duration(2200).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);
    });
    areaPath.transition().delay(1100).duration(1400).attr("opacity", 1);

    /* 网格（对数） */
    svg.append("g").selectAll("line").data([16, 18, 20, 22, 24, 26]).join("line")
      .attr("x1", m.l).attr("x2", w - m.r)
      .attr("y1", function (d) { return ys(Math.pow(10, d)); }).attr("y2", function (d) { return ys(Math.pow(10, d)); })
      .attr("stroke", "rgba(126,232,250,.10)").attr("stroke-dasharray", "3 6");
    svg.append("g").selectAll("text").data([16, 18, 20, 22, 24, 26]).join("text")
      .attr("x", m.l - 8).attr("y", function (d) { return ys(Math.pow(10, d)); }).attr("dy", "0.35em")
      .attr("text-anchor", "end").attr("fill", "rgba(232,236,255,.55)").attr("font-size", 11)
      .text(function (d) { return sup10(d); });
    svg.append("g").selectAll("text").data(data).join("text")
      .attr("x", function (d) { return xs(d.y); }).attr("y", h - m.b + 22)
      .attr("text-anchor", "middle").attr("fill", "rgba(232,236,255,.55)").attr("font-size", 11)
      .text(function (d) { return d.y; });

    /* 数据点 + 标签 */
    const labelOff = {
      "AlexNet": [0, 14, "end"],
      "AlphaGo Zero": [-10, -16, "end"],
      "GPT-3": [8, 16, "start"],
      "GPT-4": [-14, -18, "end"],
      "Gemini Ultra": [0, -16, "start"],
    };
    data.forEach(function (d) {
      const g = svg.append("g").attr("transform", "translate(" + xs(d.y) + "," + ys(d.f) + ")").attr("opacity", 0);
      g.transition().delay(2300).duration(700).attr("opacity", 1);
      g.append("circle").attr("r", 11).attr("fill", "none").attr("stroke", "#b48cff").attr("stroke-opacity", 0.35).attr("class", "ms-ring");
      g.append("circle").attr("r", 4.2).attr("fill", "#e3d0ff");
      const off = labelOff[d.label] || [8, 6, "start"];
      g.append("text").attr("x", off[0]).attr("y", off[1]).attr("text-anchor", off[2])
        .attr("fill", "rgba(232,236,255,.75)").attr("font-size", 11.5)
        .attr("font-family", "KaiTi, STKaiti, serif").text(d.label);
      g.style("cursor", "pointer")
        .on("mouseenter", function (ev) { tipShow(ev, d.label + "（" + d.y + "）", "训练算力约 " + d.f.toExponential(1) + " FLOPs"); })
        .on("mousemove", tipMove)
        .on("mouseleave", tipHide);
    });

    /* 标注 */
    svg.append("text").attr("x", w - m.r - 8).attr("y", m.t + 10).attr("text-anchor", "end")
      .attr("fill", "#ffd75e").attr("font-size", 13)
      .attr("font-family", "KaiTi, STKaiti, serif").text("每 3.4 个月翻一番");
    svg.append("text").attr("x", w - m.r - 8).attr("y", m.t + 34).attr("text-anchor", "end")
      .attr("fill", "rgba(232,236,255,.6)").attr("font-size", 11.5).text("8 年增长约 30 万倍（OpenAI）");
  }

  /* ═══════════════════════════════════════════════
     伍 · 中国智能算力柱状图
     ═══════════════════════════════════════════════ */
  function smartBars(containerId, data) {
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    const w = Math.max(el.clientWidth || 600, 320);
    const h = 300;
    const m = { l: 52, r: 26, t: 36, b: 40 };
    const svg = d3.select(el).append("svg").attr("viewBox", "0 0 " + w + " " + h).attr("width", "100%").attr("height", h);
    const xs = d3.scaleBand().domain(data.map(function (d) { return d.y; })).range([m.l, w - m.r]).padding(0.28);
    const ys = d3.scaleLinear().domain([0, d3.max(data, function (d) { return d.v; }) * 1.14]).range([h - m.b, m.t]);

    const defs = svg.append("defs");
    const gid = containerId + "-g";
    const grad = defs.append("linearGradient").attr("id", gid).attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 1);
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#7ee8fa");
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#2d5bd8").attr("stop-opacity", 0.5);

    svg.append("g").selectAll("line").data(ys.ticks(4)).join("line")
      .attr("x1", m.l).attr("x2", w - m.r)
      .attr("y1", function (d) { return ys(d); }).attr("y2", function (d) { return ys(d); })
      .attr("stroke", "rgba(126,232,250,.10)").attr("stroke-dasharray", "3 6");
    svg.append("g").selectAll("text").data(ys.ticks(4)).join("text")
      .attr("x", m.l - 8).attr("y", function (d) { return ys(d); }).attr("dy", "0.35em")
      .attr("text-anchor", "end").attr("fill", "rgba(232,236,255,.55)").attr("font-size", 11)
      .text(function (d) { return d; });

    const y0 = ys(0);
    data.forEach(function (d, i) {
      const bw = xs.bandwidth();
      const g = svg.append("g");
      if (d.e) {
        g.append("rect").attr("x", xs(d.y)).attr("y", y0).attr("width", bw).attr("height", 0)
          .attr("rx", 7).attr("fill", "rgba(126,232,250,.07)")
          .attr("stroke", "#7ee8fa").attr("stroke-dasharray", "4 5").attr("stroke-opacity", 0.7)
          .transition().delay(400 + i * 150).duration(1100).ease(d3.easeCubicOut)
          .attr("y", ys(d.v)).attr("height", y0 - ys(d.v));
      } else {
        g.append("rect").attr("x", xs(d.y)).attr("y", y0).attr("width", bw).attr("height", 0)
          .attr("rx", 7).attr("fill", "url(#" + gid + ")")
          .transition().delay(200 + i * 150).duration(1100).ease(d3.easeCubicOut)
          .attr("y", ys(d.v)).attr("height", y0 - ys(d.v));
      }
      g.append("text").attr("x", xs(d.y) + bw / 2).attr("y", ys(d.v) - 10)
        .attr("text-anchor", "middle")
        .attr("fill", d.e ? "#ffd75e" : "#eafcff")
        .attr("font-size", 12.5).attr("font-weight", 600)
        .attr("opacity", 0).transition().delay(700 + i * 150).duration(700)
        .attr("opacity", 1).text(d.v);
      g.append("text").attr("x", xs(d.y) + bw / 2).attr("y", h - m.b + 22)
        .attr("text-anchor", "middle")
        .attr("fill", d.e ? "rgba(255,215,94,.65)" : "rgba(232,236,255,.55)")
        .attr("font-size", 11.5).text(d.y + (d.e ? "（预测）" : ""));
    });
    /* 增速标注 */
    svg.append("text").attr("x", w - m.r - 6).attr("y", ys(725.3) - 18).attr("text-anchor", "end")
      .attr("fill", "#ffd75e").attr("font-size", 12.5).attr("font-weight", 700).text("2024 年同比 +74.1%");
  }

  /* ═══════════════════════════════════════════════
     陆 · 米特环（环形进度 + 数字滚动）
     ═══════════════════════════════════════════════ */
  function meters(containerId, items) {
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    const C = 2 * Math.PI * 48;
    items.forEach(function (it, i) {
      const card = document.createElement("div");
      card.className = "meter glass";
      const gid = "meter-grad-" + i;
      card.innerHTML =
        '<div class="meter-ring">' +
        '  <svg class="meter-svg" viewBox="0 0 120 120">' +
        '    <defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
        '      <stop offset="0%" stop-color="#fff3c4"/><stop offset="100%" stop-color="#f5a623"/>' +
        "    </linearGradient></defs>" +
        '    <circle cx="60" cy="60" r="48" class="meter-track"/>' +
        '    <circle cx="60" cy="60" r="48" class="meter-fill" stroke="url(#' + gid + ')" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"/>' +
        "  </svg>" +
        '  <div class="meter-num"><div><b>0</b><span>' + it.suffix + "</span></div></div>" +
        "</div>" +
        '<div class="meter-label">' + it.label + "</div>" +
        '<div class="meter-src">' + it.src + "</div>";
      el.appendChild(card);
      const fill = card.querySelector(".meter-fill");
      const num = card.querySelector(".meter-num b");
      new IntersectionObserver(function (en, ob) {
        if (!en[0].isIntersecting) return;
        ob.disconnect();
        fill.style.strokeDashoffset = (C * (1 - it.value / 100)).toFixed(1);
        countUp(num, it.value, { dur: 1600 });
      }, { threshold: 0.5 }).observe(card);
    });
  }

  /* ═══════════════════════════════════════════════
     陆 · 岗位创造 / 取代对比条
     ═══════════════════════════════════════════════ */
  function jobs(containerId) {
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    const d = DATA.jobs;
    const rows = [
      { name: "创造", val: d.created, label: "1.7 亿个新岗位", cls: "cn", pct: 100 },
      { name: "取代", val: d.displaced, label: "9200 万个岗位", cls: "us", pct: d.displaced / d.created * 100 },
    ];
    rows.forEach(function (r) {
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML =
        '<span class="bar-name ' + r.cls + '">' + r.name + "</span>" +
        '<div class="bar-track"><div class="bar-fill ' + r.cls + '" style="width:0%"></div></div>' +
        '<span class="bar-val">' + r.label + "</span>";
      el.appendChild(row);
      new IntersectionObserver(function (en, ob) {
        if (!en[0].isIntersecting) return;
        ob.disconnect();
        row.querySelector(".bar-fill").style.width = r.pct + "%";
      }, { threshold: 0.6 }).observe(row);
    });
    const net = document.createElement("div");
    net.style.cssText = "margin-top:16px;text-align:center;font-family:var(--serif);letter-spacing:.1em;font-size:1.05rem;color:var(--ink-dim)";
    net.innerHTML = '净增 <b style="color:var(--gold);font-size:1.4rem;margin:0 6px">7800 万</b> 个岗位';
    el.appendChild(net);
  }

  /* ═══════════════════════════════════════════════
     柒 · 引力场（光标吸引四色粒子）
     ═══════════════════════════════════════════════ */
  let gCvs = null, gCtx = null, gParts = [], gW = 0, gH = 0, gRun = false, gMouse = null;
  const GTYPES = ["#ffd75e", "#7ee8fa", "#b48cff", "#7cf0a8"];
  function gravityInit(sel) {
    gCvs = document.querySelector(sel);
    gCtx = gCvs.getContext("2d");
    gravitySize();
    gParts = [];
    for (let i = 0; i < 168; i++) {
      gParts.push({
        x: Math.random() * gW, y: Math.random() * gH,
        vx: 0, vy: 0,
        t: (Math.random() * GTYPES.length) | 0,
        ph: Math.random() * 6.28,
      });
    }
    gCvs.addEventListener("mousemove", function (ev) {
      const r = gCvs.getBoundingClientRect();
      gMouse = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    });
    gCvs.addEventListener("mouseleave", function () { gMouse = null; });
  }
  function gravitySize() {
    if (!gCvs) return;
    const r = gCvs.parentElement.getBoundingClientRect();
    gW = Math.max(r.width - 12, 300); gH = 340;
    gCvs.width = gW * DPR; gCvs.height = gH * DPR;
    gCvs.style.width = gW + "px"; gCvs.style.height = gH + "px";
    gCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function gravityWake() {
    if (!gCvs || gRun) return;
    gRun = true;
    requestAnimationFrame(gravityLoop);
  }
  function gravitySleep() { gRun = false; }
  function gravityLoop(now) {
    if (!gRun) return;
    gCtx.clearRect(0, 0, gW, gH);
    /* 光标引力核心 */
    if (gMouse) {
      const g = gCtx.createRadialGradient(gMouse.x, gMouse.y, 0, gMouse.x, gMouse.y, 60);
      g.addColorStop(0, "rgba(255,250,235,.14)");
      g.addColorStop(1, "rgba(255,250,235,0)");
      gCtx.fillStyle = g;
      gCtx.beginPath(); gCtx.arc(gMouse.x, gMouse.y, 60, 0, Math.PI * 2); gCtx.fill();
    }
    gParts.forEach(function (p) {
      if (gMouse) {
        const dx = gMouse.x - p.x, dy = gMouse.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.min(0.75, 420 / (d + 80));
        p.vx += dx / d * f * 0.16;
        p.vy += dy / d * f * 0.16;
        p.vx += -dy / d * f * 0.05;   /* 旋绕，如被引力俘获 */
        p.vy += dx / d * f * 0.05;
      } else {
        p.vx += Math.sin(now * 0.0004 + p.ph) * 0.012;
        p.vy += Math.cos(now * 0.0005 + p.ph) * 0.012;
      }
      p.vx *= 0.945; p.vy *= 0.945;
      p.vx += (Math.random() - 0.5) * 0.05;
      p.vy += (Math.random() - 0.5) * 0.05;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 4) { p.x = 4; p.vx *= -0.6; }
      if (p.x > gW - 4) { p.x = gW - 4; p.vx *= -0.6; }
      if (p.y < 4) { p.y = 4; p.vy *= -0.6; }
      if (p.y > gH - 4) { p.y = gH - 4; p.vy *= -0.6; }
      const c = GTYPES[p.t];
      gCtx.fillStyle = c;
      gCtx.globalAlpha = 0.12;
      gCtx.beginPath(); gCtx.arc(p.x, p.y, 5, 0, Math.PI * 2); gCtx.fill();
      gCtx.globalAlpha = 0.92;
      gCtx.beginPath(); gCtx.arc(p.x, p.y, 1.7, 0, Math.PI * 2); gCtx.fill();
      gCtx.globalAlpha = 1;
    });
    requestAnimationFrame(gravityLoop);
  }

  /* ═══════════════════════════════════════════════
     柒 · 时间线
     ═══════════════════════════════════════════════ */
  function timeline(containerId, items) {
    const el = document.getElementById(containerId);
    el.innerHTML = '<div class="tl-line"></div><div class="tl-items"></div>';
    const box = el.querySelector(".tl-items");
    items.forEach(function (it, i) {
      const item = document.createElement("div");
      item.className = "tl-item" + (i % 2 ? " flip" : "");
      item.style.transitionDelay = (i * 0.1) + "s";
      item.innerHTML =
        '<div class="tl-dot"></div>' +
        '<div class="tl-card"><b>' + it.y + "</b><h4>" + it.t + "</h4><p>" + it.d + "</p></div>";
      box.appendChild(item);
    });
  }

  return {
    build: build,
    rebuildAll: rebuildAll,
    countUp: countUp,
    river: river,
    constellation: constellation,
    duel: duel,
    novaInit: novaInit,
    novaSize: novaSize,
    novaFire: novaFire,
    computeCurve: computeCurve,
    smartBars: smartBars,
    meters: meters,
    jobs: jobs,
    gravityInit: gravityInit,
    gravitySize: gravitySize,
    gravityWake: gravityWake,
    gravitySleep: gravitySleep,
    timeline: timeline,
  };
})();
