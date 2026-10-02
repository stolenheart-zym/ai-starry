/* ═══════════════════════════════════════════════════════
   智涌星河 · 滚动叙事引擎
   星点导航 / 彗星进度 / 章节联动 / 显现动画 / 视差
   ═══════════════════════════════════════════════════════ */

(function () {
  const CHAPTERS = [
    { id: "s0", no: "序", name: "星夜启程" },
    { id: "s1", no: "壹", name: "启明 · 新质生产力" },
    { id: "s2", no: "贰", name: "星河 · 智能经济" },
    { id: "s3", no: "叁", name: "星宿 · 赋能百业" },
    { id: "s4", no: "肆", name: "双子 · 全球版图" },
    { id: "s5", no: "伍", name: "星爆 · 算力革命" },
    { id: "s6", no: "陆", name: "星尘 · 生产力引擎" },
    { id: "s7", no: "柒", name: "引力 · 未来之约" },
  ];

  Starry.init();

  /* ── 星点导航 ── */
  const nav = document.getElementById("star-nav");
  CHAPTERS.forEach(function (c) {
    const b = document.createElement("button");
    b.dataset.name = c.no + " " + c.name;
    b.setAttribute("aria-label", c.name);
    b.addEventListener("click", function () {
      document.getElementById(c.id).scrollIntoView({ behavior: "smooth" });
    });
    nav.appendChild(b);
  });

  /* ── 彗星进度条 ── */
  const comet = document.getElementById("comet");
  let ticking = false;
  function updateComet() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    comet.style.width = (max > 0 ? scrollY / max * 100 : 0) + "%";
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateComet); }
  }, { passive: true });

  /* ── 左下章节指示 ── */
  const chTag = document.getElementById("chapter-tag");
  let chSwapTimer = null;
  function setChapter(c) {
    clearTimeout(chSwapTimer);
    chTag.classList.add("swap");
    chSwapTimer = setTimeout(function () {
      chTag.querySelector(".ch-no").textContent = c.no;
      chTag.querySelector(".ch-name").textContent = c.name;
      chTag.classList.remove("swap");
    }, 240);
  }

  /* ── 行业面板联动 ── */
  const indName = document.getElementById("ind-name");
  const indDesc = document.getElementById("ind-desc");
  const indStats = document.getElementById("ind-stats");
  function updateIndustryPanel(d) {
    indName.textContent = d.name;
    indDesc.textContent = d.desc;
    indStats.innerHTML = "";
    d.stats.forEach(function (s) {
      const li = document.createElement("li");
      li.innerHTML = "<b>" + s[0] + "</b><span class=\"v\">" + s[1] + "</span>";
      indStats.appendChild(li);
    });
  }

  /* ── 图表构建（首次进入对应章节时执行）── */
  Charts.build("s2", function () {
    Charts.river("river-global", {
      data: DATA.globalMarket,
      color: "#7ee8fa",
      flowColor: "#eafcff",
      height: 360,
      fmtV: function (v) { return v + " 十亿美元"; },
      milestones: [
        { t: 2022.83, title: "ChatGPT 发布", note: "2022 年 11 月 · 2 个月破亿用户，史上最快" },
        { t: 2024.2, title: "「人工智能＋」行动", note: "2024 年政府工作报告 · AI 成为生产力关键词" },
      ],
    });
    Charts.river("river-china", {
      data: DATA.chinaMarket,
      color: "#ffd75e",
      flowColor: "#fff3c4",
      height: 300,
      fmtV: function (v) { return v + " 亿元"; },
      milestones: [
        { t: 2025, title: "核心产业破万亿", note: "信通院测算 · 2025 年有望超 1.2 万亿元" },
      ],
    });
  });
  Charts.build("s3", function () {
    Charts.constellation("constellation", DATA.industries, updateIndustryPanel);
  });
  Charts.build("s4", function () {
    Charts.duel("duel", DATA.duelMetrics);
  });
  Charts.build("s5", function () {
    Charts.novaInit("#nova-canvas");
    Charts.computeCurve("compute-curve", DATA.compute);
    Charts.smartBars("smart-compute", DATA.smartCompute);
  });
  Charts.build("s6", function () {
    Charts.meters("meters", DATA.meters);
    Charts.jobs("jobs-bars");
  });
  Charts.build("s7", function () {
    Charts.gravityInit("#gravity-canvas");
    Charts.timeline("timeline", DATA.timeline);
  });

  /* ── 章节观察：导航高亮 / 章节指示 / 图表触发 ── */
  const secObs = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      const idx = CHAPTERS.findIndex(function (c) { return c.id === id; });
      if (idx >= 0) {
        setChapter(CHAPTERS[idx]);
        nav.querySelectorAll("button").forEach(function (b, i) {
          b.classList.toggle("active", i === idx);
        });
      }
      if (id === "s5") Charts.novaFire();
      if (id === "s7") Charts.gravityWake();
      else Charts.gravitySleep();
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  document.querySelectorAll("section.chapter").forEach(function (s) { secObs.observe(s); });

  /* ── 滚动显现 ── */
  const rvObs = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("on");
        rvObs.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".rv").forEach(function (el) { rvObs.observe(el); });

  /* ── 大数字滚动 ── */
  const cntObs = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      const el = en.target;
      cntObs.unobserve(el);
      Charts.countUp(el, parseFloat(el.dataset.count), {
        prefix: el.dataset.prefix || "",
        suffix: el.dataset.suffix || "",
        dec: parseInt(el.dataset.dec || "0", 10),
      });
    });
  }, { threshold: 0.5 });
  document.querySelectorAll("[data-count]").forEach(function (el) { cntObs.observe(el); });

  /* ── 鼠标视差（星空 + 标题）── */
  let mx = 0, my = 0, px = 0, py = 0, ptick = false;
  const heroTitle = document.getElementById("hero-title");
  window.addEventListener("mousemove", function (ev) {
    mx = ev.clientX / innerWidth - 0.5;
    my = ev.clientY / innerHeight - 0.5;
    Starry.setMouse(mx, my);
    if (!ptick) { ptick = true; requestAnimationFrame(parallax); }
  });
  function parallax() {
    ptick = false;
    px += (mx - px) * 0.06;
    py += (my - py) * 0.06;
    if (heroTitle) {
      heroTitle.style.transform = "translate(" + (px * 20).toFixed(1) + "px," + (py * 14).toFixed(1) + "px)";
    }
    if (Math.abs(mx - px) > 0.001 || Math.abs(my - py) > 0.001) {
      ptick = true;
      requestAnimationFrame(parallax);
    }
  }

  /* ── 窗口缩放：重建图表 ── */
  let rsTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(rsTimer);
    rsTimer = setTimeout(function () {
      Charts.novaSize();
      Charts.gravitySize();
      Charts.rebuildAll();
    }, 350);
  });

  updateComet();
})();
