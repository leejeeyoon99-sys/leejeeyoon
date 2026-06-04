/* ====================================================================
   sounds.js — 8-bit Web Audio sound effects
   순수 Web Audio API, 외부 파일 없음.
   ==================================================================== */
(function () {
  "use strict";

  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* ── 기본 오실레이터 헬퍼 ─────────────────────────────── */
  function tone(freq, type, startTime, duration, vol, ac) {
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type      = type || "square";
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(vol || 0.18, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  /* ── 효과음 정의 ─────────────────────────────────────── */

  /**
   * coin() — 마리오 코인 ♪
   * 짧고 높은 두 음: E5 → B5
   */
  function coin() {
    if (!enabled) return;
    const ac = getCtx();
    const t  = ac.currentTime;
    tone(659, "square", t,        0.06, 0.22, ac);  // E5
    tone(988, "square", t + 0.07, 0.12, 0.22, ac);  // B5
  }

  /**
   * jump() — 점프 효과
   * 주파수가 빠르게 올라가는 sweep
   */
  function jump() {
    if (!enabled) return;
    const ac  = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = "square";
    const t = ac.currentTime;
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.18);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * select() — 네비/메뉴 선택
   * 짧은 단음 blip
   */
  function select() {
    if (!enabled) return;
    const ac = getCtx();
    const t  = ac.currentTime;
    tone(440, "square", t, 0.07, 0.15, ac);
  }

  /**
   * hover() — 카드/링크 호버
   * 아주 작은 blip (거의 안 들릴 듯 살짝만)
   */
  function hover() {
    if (!enabled) return;
    const ac = getCtx();
    const t  = ac.currentTime;
    tone(330, "square", t, 0.04, 0.07, ac);
  }

  /**
   * levelup() — 방명록 제출 / 레벨업 팡파레
   * C-E-G-C 아르페지오
   */
  function levelup() {
    if (!enabled) return;
    const ac    = getCtx();
    const t     = ac.currentTime;
    const notes = [262, 330, 392, 523];  // C4 E4 G4 C5
    notes.forEach((f, i) => tone(f, "square", t + i * 0.1, 0.18, 0.2, ac));
  }

  /**
   * error() — 잘못된 입력 등
   * 낮은 buzz
   */
  function error() {
    if (!enabled) return;
    const ac = getCtx();
    const t  = ac.currentTime;
    tone(110, "square", t,        0.08, 0.2, ac);
    tone(98,  "square", t + 0.09, 0.1,  0.2, ac);
  }

  /**
   * startup() — 페이지 첫 로드 후 첫 클릭 시 짧은 인트로
   * 마리오 스타트업 느낌
   */
  function startup() {
    if (!enabled) return;
    const ac    = getCtx();
    const t     = ac.currentTime;
    // G4-C5-E5-G5 빠르게
    [[392, 0], [523, 0.08], [659, 0.16], [784, 0.24]].forEach(([f, dt]) => {
      tone(f, "square", t + dt, 0.12, 0.18, ac);
    });
  }

  /* ── 토글 버튼 ───────────────────────────────────────── */
  function createToggle() {
    const btn = document.createElement("button");
    btn.id        = "sfx-toggle";
    btn.title     = "효과음 켜기/끄기";
    btn.innerHTML = "♪";
    btn.setAttribute("aria-label", "효과음 켜기/끄기");
    Object.assign(btn.style, {
      position:   "fixed",
      bottom:     "20px",
      right:      "20px",
      zIndex:     "9999",
      background: "#000",
      color:      "#fff",
      border:     "2px solid #fff",
      fontFamily: "'Press Start 2P', monospace, sans-serif",
      fontSize:   "14px",
      width:      "40px",
      height:     "40px",
      cursor:     "pointer",
      lineHeight: "1",
      padding:    "0",
      imageRendering: "pixelated",
    });
    btn.addEventListener("click", () => {
      enabled = !enabled;
      btn.innerHTML    = enabled ? "♪" : "✕";
      btn.style.opacity = enabled ? "1" : "0.4";
      if (enabled) { startup(); }
    });
    document.body.appendChild(btn);
  }

  /* ── 이벤트 연결 ─────────────────────────────────────── */
  function attachSounds() {
    // 첫 상호작용으로 AudioContext 언락
    let started = false;
    function firstTouch() {
      if (started) return;
      started = true;
      startup();
      document.removeEventListener("click",      firstTouch);
      document.removeEventListener("touchstart", firstTouch);
    }
    document.addEventListener("click",      firstTouch, { once: true });
    document.addEventListener("touchstart", firstTouch, { once: true, passive: true });

    // 네비게이션 링크
    document.querySelectorAll("nav a, .nav a").forEach(a => {
      a.addEventListener("click", () => { select(); });
    });

    // 버튼 / stamp 클릭 → coin
    document.querySelectorAll(".stamp, button:not(#sfx-toggle)").forEach(b => {
      b.addEventListener("click", () => { coin(); });
    });

    // 카드 / 프로젝트 링크 호버 → hover blip
    document.querySelectorAll(".card, .proj-card, .work-card, a[href]").forEach(el => {
      el.addEventListener("mouseenter", () => { hover(); });
    });

    // 방명록 제출 → levelup
    const gbForm = document.querySelector("#gbForm");
    if (gbForm) {
      gbForm.addEventListener("submit", () => {
        setTimeout(levelup, 80); // confetti랑 타이밍 맞춤
      });
    }

    // 방명록 입력창 포커스 → select
    const gbWho = document.querySelector("#gbWho");
    const gbMsg = document.querySelector("#gbMsg");
    if (gbWho) gbWho.addEventListener("focus", () => select());
    if (gbMsg) gbMsg.addEventListener("focus", () => select())

    // 스크롤 섹션 진입 → jump (IntersectionObserver)
    const sections = document.querySelectorAll("section[id], .section");
    if (sections.length > 0) {
      const sectionObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio > 0.3) {
            jump();
          }
        });
      }, { threshold: 0.3 });
      sections.forEach(s => sectionObs.observe(s));
    }
  }

  /* ── 초기화 ──────────────────────────────────────────── */
  function init() {
    createToggle();
    attachSounds();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 외부 접근용
  window.SFX = { coin, jump, select, hover, levelup, error, startup };
})();
