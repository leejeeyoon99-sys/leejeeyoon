/* ============================================================
   pixel-art.js  —  Lee Jeeyoon mascot, black & white only.
   Sprites are string grids:  '#'=black  'o'=white  '.'=transparent
   renderScene() composites sprites onto a canvas with crisp pixels.
   Exposes window.PixelArt
   ============================================================ */
(function () {
  // ---- HEAD (chibi, bob cut, black hair/eyes) — exact 24 cols ---------
  const HEAD2 = [
    "........########........", // 0 hair top
    "......############......", // 1
    ".....##############.....", // 2
    "....################....", // 3
    "...##################...", // 4
    "..####################..", // 5
    "..####################..", // 6
    "..###oooooooooooooo###..", // 7 bangs / face top
    "..###oooooooooooooo###..", // 8
    "..###oo###oooo###oo###..", // 9 eyes
    "..###oo###oooo###oo###..", // 10 eyes
    "..###oooooooooooooo###..", // 11
    "..###oooooooooooooo###..", // 12
    "..###oooooooooooooo###..", // 13
    "..###oooo#oooo#oooo###..", // 14 smile corners
    "..###ooooo####ooooo###..", // 15 smile
    "..###oooooooooooooo###..", // 16
    "..###oooooooooooooo###..", // 17
    "..####oooooooooooo####..", // 18 chin rounding (long hair stays wide)
    "..#####oooooooooo#####..", // 19
    "..######oooooooo######..", // 20 jaw -> neck
    "..#####...oooo...#####..", // 21 neck + hair falling to shoulders
    "..####....oooo....####..", // 22
    "..####....oooo....####..", // 23
    "..###.....oooo.....###..", // 24 hair tips
  ];

  // ---- WAVING HAND (open palm, spread fingers) ----
  const HAND = [
    ".#.#.#.#.",
    ".#.#.#.#.",
    "#########",
    "#########",
    "#########",
    "#########",
    ".#######.",
    "...###...",
  ];

  // ---- POINTING HAND (index out, points right) ----
  const POINT = [
    "..........",
    "......####",
    ".#########",
    "##########",
    ".#########",
    "......####",
    "..........",
  ];

  // ---- BODY (chibi torso + arms down) ~20 wide ----
  const BODY = [
    "....############....",
    "...##############...",
    "..################..",
    "..##oooooooooooo##..",
    ".###oooooooooooo###.",
    ".###oooooooooooo###.",
    ".###oooooooooooo###.",
    ".###oooooooooooo###.",
    "..#oooooooooooooo#..",
    "..oooooooooooooooo..",
    "..oooooooooooooooo..",
    ".oooooooooooooooooo.",
    ".oooooooooooooooooo.",
    "####oooooooooooo####",
  ];

  // ---- SPARKLE / four-point star ----
  const STAR = [
    "...#...",
    "...#...",
    ".#####.",
    "#######",
    ".#####.",
    "...#...",
    "...#...",
  ];
  const SPARK = [
    "..#..",
    "#####",
    "..#..",
  ];

  // normalize: pad rows of a sprite to equal width
  function norm(rows) {
    const w = Math.max.apply(null, rows.map(r => r.length));
    return rows.map(r => r.padEnd(w, "."));
  }

  const SPRITES = {
    head: norm(HEAD2),
    hand: norm(HAND),
    point: norm(POINT),
    body: norm(BODY),
    star: norm(STAR),
    spark: norm(SPARK),
  };

  function spriteSize(name) {
    const s = SPRITES[name];
    return { w: s[0].length, h: s.length };
  }

  /* draw one sprite onto ctx at pixel-cell (gx,gy), each cell = scale px.
     opts: {flip, white='#fff', black='#000', invert} */
  function drawSprite(ctx, name, gx, gy, scale, opts) {
    opts = opts || {};
    const black = opts.black || "#000";
    const white = opts.white || "#fff";
    let rows = SPRITES[name];
    if (opts.flip) rows = rows.map(r => r.split("").reverse().join(""));
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const c = rows[y][x];
        if (c === ".") continue;
        let fill = c === "#" ? black : white;
        if (opts.invert) fill = c === "#" ? white : black;
        ctx.fillStyle = fill;
        ctx.fillRect((gx + x) * scale, (gy + y) * scale, scale, scale);
      }
    }
  }

  /* renderScene(canvas, sceneSpec)
     sceneSpec = { cols, rows, scale, parts:[{sprite,x,y,flip,invert}], opts }
     Sizes the canvas to cols*scale x rows*scale. */
  function renderScene(canvas, spec) {
    const scale = spec.scale || 8;
    canvas.width = spec.cols * scale;
    canvas.height = spec.rows * scale;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    if (spec.bg) { ctx.fillStyle = spec.bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    (spec.parts || []).forEach(p => {
      drawSprite(ctx, p.sprite, p.x, p.y, scale, { flip: p.flip, invert: p.invert, black: spec.black, white: spec.white });
    });
    canvas.style.imageRendering = "pixelated";
    return canvas;
  }

  // Pre-baked poses → returns a scene spec (caller sets scale)
  // Kawaii sticker style: big head + floating hand(s) + sparkles. No body.
  function pose(name, scale) {
    scale = scale || 8;
    if (name === "wave") {
      return {
        cols: 33, rows: 30, scale,
        parts: [
          { sprite: "head", x: 0, y: 3 },
          { sprite: "hand", x: 24, y: 3 },          // raised waving hand, upper-right
          { sprite: "spark", x: 27, y: 14 },
          { sprite: "spark", x: 1, y: 0 },
        ],
      };
    }
    if (name === "point") {
      return {
        cols: 38, rows: 28, scale,
        parts: [
          { sprite: "head", x: 0, y: 1 },
          { sprite: "point", x: 25, y: 12 },         // pointing hand to the right
          { sprite: "spark", x: 33, y: 6 },
        ],
      };
    }
    if (name === "wink") {
      // alt greeting: head + star
      return {
        cols: 30, rows: 28, scale,
        parts: [
          { sprite: "head", x: 0, y: 2 },
          { sprite: "star", x: 24, y: 2 },
        ],
      };
    }
    // headshot (ID card)
    return {
      cols: 24, rows: 25, scale,
      parts: [{ sprite: "head", x: 0, y: 0 }],
    };
  }

  window.PixelArt = { SPRITES, renderScene, drawSprite, spriteSize, pose, norm };
})();
