/* ====================================================================
   stair-jump.js — 8x8 character hopping up an infinite block staircase.
   Black & white only. Pure canvas, no libraries.
   Camera follows the character so the climb loops forever (seamless).
   ==================================================================== */
(function () {
  "use strict";
  const canvas = document.getElementById("game");
  if (!canvas) return;                  // safe when embedded without the game
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const toggleBtn = document.getElementById("toggle");

  // ---- units -------------------------------------------------------
  const P = 6;                 // device px per pixel-cell
  const GW = canvas.width / P; // 120 cells
  const GH = canvas.height / P;// 84 cells
  const B = 10;                // staircase block size (cells)
  const APEX = 15;             // jump arc height (cells)
  const SX = 44, SY = 50;      // character's fixed screen cell position (feet)
  const JUMP_MS = 460, LAND_MS = 130;

  // ---- character sprites (8x8). '#'=white body, 'o'=black eye, '.'=empty ----
  const STAND = [
    "..####..",
    ".######.",
    ".#o##o#.",
    ".######.",
    ".######.",
    ".######.",
    ".##..##.",
    "##....##",
  ];
  const JUMP = [
    "#..##..#",   // arms up
    ".######.",
    ".#o##o#.",
    ".######.",
    ".######.",
    ".######.",
    ".######.",
    ".##..##.",
  ];

  // ---- state -------------------------------------------------------
  let col = 0;            // current column index the char stands/leaves from
  let phase = "jump";     // "jump" | "land"
  let tStart = 0;         // ms timestamp when current phase began
  let landings = 0;
  let dust = [];          // {x,y,vx,vy,size} in world cells
  let stars = [];         // background parallax stars
  let paused = false;
  let last = 0;

  // seed background stars (screen-space, slow parallax scroll)
  for (let i = 0; i < 9; i++) {
    stars.push({ x: Math.random() * GW, y: Math.random() * GH * 0.7, tw: Math.random() * Math.PI * 2 });
  }

  // ---- helpers -----------------------------------------------------
  function rect(cx, cy, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx) * P, Math.round(cy) * P, Math.round(w) * P, Math.round(h) * P);
  }
  function drawSprite(rows, leftCell, topCell, color) {
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === ".") continue;
        rect(leftCell + x, topCell + y, 1, 1, ch === "o" ? "#000" : color);
      }
    }
  }

  // camera derived from (col, phase progress t)
  function camera(t) {
    return {
      x: col * B + B / 2 + t * B - SX,
      y: -col * B - t * B - SY,
    };
  }

  function spawnDust(wx, wy) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const dir = (i / (n - 1)) * 2 - 1;          // -1..1 spread
      dust.push({
        x: wx + dir * 2,
        y: wy,
        vx: dir * (14 + Math.random() * 14),       // cells/sec outward
        vy: -(10 + Math.random() * 16),            // pop up
        size: 2 + Math.random() * 1.5,
        life: 0,
        ttl: 0.45 + Math.random() * 0.25,
      });
    }
  }

  // ---- update ------------------------------------------------------
  function update(now, dt) {
    const elapsed = now - tStart;
    if (phase === "jump") {
      if (elapsed >= JUMP_MS) {
        // landed on next column
        col += 1;
        landings += 1;
        if (scoreEl) scoreEl.textContent = String(landings % 1000).padStart(3, "0");
        const cam = camera(1);                     // t=1 -> feet at next col top
        spawnDust(cam.x + SX, cam.y + SY + 8);     // dust at feet level
        phase = "land";
        tStart = now;
      }
    } else { // land
      if (elapsed >= LAND_MS) { phase = "jump"; tStart = now; }
    }
    // dust physics
    for (const d of dust) {
      d.life += dt;
      d.vy += 60 * dt;          // gravity
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.size -= 3.2 * dt;       // shrink
    }
    dust = dust.filter(d => d.life < d.ttl && d.size > 0.4);
    // star twinkle
    for (const s of stars) s.tw += dt * 3;
  }

  // ---- draw --------------------------------------------------------
  function draw(now) {
    // background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const t = phase === "jump" ? Math.min((now - tStart) / JUMP_MS, 1) : 1;
    const cam = camera(t);

    // parallax stars (move slowly opposite camera)
    for (const s of stars) {
      const sx = ((s.x - cam.x * 0.18) % GW + GW) % GW;
      const sy = ((s.y - cam.y * 0.18) % (GH * 0.75) + (GH * 0.75)) % (GH * 0.75);
      if (Math.sin(s.tw) > -0.3) rect(sx, sy, 1, 1, "#fff");
    }

    // staircase blocks
    const leftCol = Math.floor(cam.x / B) - 1;
    const rightCol = Math.floor((cam.x + GW) / B) + 1;
    for (let c = leftCol; c <= rightCol; c++) {
      const colTop = -c * B;                 // world y of this column's top
      const screenX = c * B - cam.x;
      if (screenX > GW || screenX + B < 0) continue;
      for (let yb = colTop; yb - cam.y < GH + B; yb += B) {
        const sy = yb - cam.y;
        if (sy > GH) break;
        // tile: white block with 1-cell black border + center dot
        rect(screenX, sy, B, B, "#fff");
        rect(screenX, sy, B, 1, "#000");
        rect(screenX, sy, 1, B, "#000");
        rect(screenX + B - 1, sy, 1, B, "#000");
        rect(screenX, sy + B - 1, B, 1, "#000");
        rect(screenX + B / 2 - 1, sy + B / 2 - 1, 2, 2, "#000"); // stud
      }
    }

    // dust (white puffs) — drawn relative to camera
    for (const d of dust) {
      const sx = d.x - cam.x, sy = d.y - cam.y;
      rect(sx - d.size / 2, sy - d.size / 2, d.size, d.size, "#fff");
    }

    // character (fixed screen x = SX; feet bob with jump arc)
    const feetScreenY = SY - (phase === "jump" ? APEX * Math.sin(Math.PI * t) : 0);
    const rows = phase === "jump" ? JUMP : STAND;
    drawSprite(rows, SX - 4, feetScreenY - 8, "#fff");
  }

  // ---- loop --------------------------------------------------------
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    if (!paused) update(now, dt);
    draw(now);
    requestAnimationFrame(frame);
  }

  // ---- controls ----------------------------------------------------
  function setPaused(p) {
    paused = p;
    if (toggleBtn) toggleBtn.textContent = p ? "▶ PLAY" : "❚❚ PAUSE";
    if (!p) { last = 0; tStart = performance.now(); } // resync timers
  }
  if (toggleBtn) toggleBtn.addEventListener("click", () => setPaused(!paused));

  // respect reduced motion: start paused on a static frame
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  tStart = performance.now();
  if (reduce) { paused = true; if (toggleBtn) toggleBtn.textContent = "▶ PLAY"; }
  requestAnimationFrame(frame);
})();
