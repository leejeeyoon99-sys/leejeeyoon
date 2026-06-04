/* ====================================================================
   site.js — interactions for the pixel-zine portfolio.
   Depends on pixel-art.js (window.PixelArt).
   ==================================================================== */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- mascots ---------- */
  function renderMascot(canvas) {
    if (!canvas) return;
    const pose = canvas.dataset.pose || "wave";
    const scale = +canvas.dataset.scale || 6;
    const invert = canvas.dataset.invert === "1";
    const spec = PixelArt.pose(pose, scale);
    if (invert) { spec.black = "#fff"; spec.white = "#000"; }
    PixelArt.renderScene(canvas, spec);
  }

  /* ---------- pixel chart thumbnails ---------- */
  // px helper
  function cell(ctx, x, y, w, h, s, color) {
    ctx.fillStyle = color || "#000";
    ctx.fillRect(x * s, y * s, (w || 1) * s, (h || 1) * s);
  }
  function setupCanvas(canvas, gw, gh, s) {
    canvas.width = gw * s; canvas.height = gh * s;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    return ctx;
  }

  // 청약 dashboard — bar chart + trend
  function drawBars(canvas) {
    const s = 4, GW = 92, GH = 58;
    const ctx = setupCanvas(canvas, GW, GH, s);
    // top title chips
    cell(ctx, 6, 5, 18, 4, s); cell(ctx, 28, 5, 10, 4, s);
    cell(ctx, GW - 16, 5, 10, 4, s);
    // frame
    cell(ctx, 6, 12, 1, 38, s);            // y axis
    cell(ctx, 6, 49, GW - 12, 1, s);       // x axis
    // bars
    const heights = [14, 22, 18, 30, 25, 36, 31, 40];
    let x = 12;
    heights.forEach((h, i) => {
      cell(ctx, x, 49 - h, 7, h, s);
      // tick label
      cell(ctx, x + 1, 51, 5, 2, s);
      x += 10;
    });
    // dotted trend line over the bars
    let prev = null;
    heights.forEach((h, i) => {
      const px = 12 + i * 10 + 3, py = 49 - h - 5;
      cell(ctx, px - 1, py - 1, 3, 3, s);
      prev = [px, py];
    });
  }

  // VOC dashboard — donut + horizontal bars
  function drawDonut(canvas) {
    const s = 4, GW = 92, GH = 58;
    const ctx = setupCanvas(canvas, GW, GH, s);
    // title chips
    cell(ctx, 6, 5, 16, 4, s); cell(ctx, GW - 18, 5, 12, 4, s);
    // donut (ring with a gap wedge)
    const cx = 26, cy = 34, R = 15, r = 8;
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      const dx = gx - cx, dy = gy - cy, d = Math.sqrt(dx * dx + dy * dy);
      const ang = Math.atan2(dy, dx); // -PI..PI
      if (d <= R && d >= r) {
        // leave a wedge gap between ~ -0.5 and 0.4 rad on the right
        if (ang > -0.5 && ang < 0.5) continue;
        cell(ctx, gx, gy, 1, 1, s);
      }
    }
    // legend / horizontal bars on the right
    const bx = 50, bw = [34, 26, 20, 12];
    bw.forEach((w, i) => {
      const y = 16 + i * 9;
      cell(ctx, bx, y, 4, 5, s);       // dot key
      cell(ctx, bx + 6, y, w, 5, s);   // bar
    });
  }

  /* ---------- marquee duplication (seamless) ---------- */
  function setupMarquee() {
    $$(".marquee .track").forEach(t => {
      t.innerHTML = t.innerHTML + t.innerHTML; // duplicate for 50% loop
    });
  }

  /* ---------- cursor trail ---------- */
  let lastTrail = 0;
  function trail(e) {
    const now = performance.now();
    if (now - lastTrail < 22) return;
    lastTrail = now;
    const d = document.createElement("div");
    d.className = "trail";
    const sz = 4 + Math.random() * 4;
    d.style.width = d.style.height = sz + "px";
    d.style.left = (e.clientX - sz / 2) + "px";
    d.style.top = (e.clientY - sz / 2) + "px";
    d.style.transition = "opacity .55s linear, transform .55s linear";
    document.body.appendChild(d);
    requestAnimationFrame(() => {
      d.style.opacity = "0";
      d.style.transform = "scale(.2) rotate(45deg)";
    });
    setTimeout(() => d.remove(), 600);
  }

  /* ---------- confetti stars ---------- */
  function starCanvas(px) {
    const c = document.createElement("canvas");
    PixelArt.renderScene(c, { cols: 7, rows: 7, scale: px, parts: [{ sprite: "star", x: 0, y: 0 }] });
    return c;
  }
  function burst(x, y, n) {
    n = n || 14;
    for (let i = 0; i < n; i++) {
      const c = starCanvas(2 + Math.floor(Math.random() * 3));
      c.className = "confetti";
      c.style.left = x + "px"; c.style.top = y + "px";
      document.body.appendChild(c);
      const ang = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 6;
      let vx = Math.cos(ang) * spd, vy = Math.sin(ang) * spd - 4;
      let px = x, py = y, life = 0, rot = 0, vr = (Math.random() - .5) * 30;
      (function step() {
        life += 16; vy += 0.45; px += vx; py += vy; rot += vr;
        c.style.transform = `translate(${px - x}px,${py - y}px) rotate(${rot}deg)`;
        c.style.opacity = String(Math.max(0, 1 - life / 1100));
        if (life < 1100) requestAnimationFrame(step); else c.remove();
      })();
    }
  }

  /* ---------- ambient hero sparkle ---------- */
  function ambientSparkle() {
    const hero = $("#home");
    if (!hero) return;
    setInterval(() => {
      if (document.hidden) return;
      const r = hero.getBoundingClientRect();
      if (r.bottom < 0) return;
      const c = starCanvas(2 + Math.floor(Math.random() * 2));
      c.className = "confetti";
      const x = r.left + Math.random() * r.width;
      const y = r.top + r.height * (.2 + Math.random() * .6);
      c.style.left = x + "px"; c.style.top = y + "px";
      document.body.appendChild(c);
      let life = 0;
      (function step() {
        life += 16;
        c.style.transform = `translateY(${-life / 22}px)`;
        c.style.opacity = String(Math.max(0, .9 - life / 1400));
        if (life < 1400) requestAnimationFrame(step); else c.remove();
      })();
    }, 1300);
  }

  /* ---------- visitor counter ---------- */
  function counter() {
    const el = $("#counter");
    if (!el) return;
    let n = parseInt(localStorage.getItem("jy_visits") || "0", 10);
    if (!sessionStorage.getItem("jy_counted")) {
      n = n || 1203; n += 1;
      localStorage.setItem("jy_visits", String(n));
      sessionStorage.setItem("jy_counted", "1");
    } else { n = n || 1204; }
    const str = String(n).padStart(6, "0");
    el.innerHTML = str.split("").map(d => `<span class="dgt">${d}</span>`).join("");
  }

  /* ---------- guestbook ---------- */
  function guestbook() {
    const list = $("#gbList"), form = $("#gbForm");
    if (!list || !form) return;
    const KEY = "jy_guestbook";
    const seed = [
      { who: "지나가던 디자이너", msg: "포트폴리오 너무 귀엽다…! 픽셀아트 최고 ✦" },
      { who: "anon", msg: "data viz 작업 깔끔해요. 연락드릴게요!" },
    ];
    let entries = JSON.parse(localStorage.getItem(KEY) || "null") || seed;
    function render() {
      list.innerHTML = entries.map(e => `
        <div class="gb-entry"><div class="who">${esc(e.who)} <span style="font-size:11px;opacity:.6">★</span></div>
        <div>${esc(e.msg)}</div></div>`).join("");
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
    render();
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const who = $("#gbWho").value.trim() || "익명";
      const msg = $("#gbMsg").value.trim();
      if (!msg) return;
      entries = [{ who, msg }, ...entries].slice(0, 30);
      localStorage.setItem(KEY, JSON.stringify(entries));
      render();
      form.reset();
      const r = form.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + 20, 18);
    });
  }

  /* ---------- reveal (CSS handles entrance; JS no longer required) ---------- */

  /* ---------- init ---------- */
  function init() {
    $$("canvas.mascot").forEach(renderMascot);
    $$("[data-thumb]").forEach(c => { c.dataset.thumb === "bars" ? drawBars(c) : drawDonut(c); });
    setupMarquee();
    counter();
    guestbook();
    ambientSparkle();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) window.addEventListener("mousemove", trail, { passive: true });
    // confetti burst on stamp buttons
    $$(".stamp").forEach(b => b.addEventListener("click", (e) => {
      burst(e.clientX, e.clientY, 16);
    }));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
