const $ = (id) => document.getElementById(id);
const SUPABASE_URL = "https://mrrixocnhsfulglipvek.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fIFvv3lqR66EOuclo_bscg_Qv8OKNt1";
const LEVELS = ["easy", "medium", "hard", "expert", "impossible"];
const MAX_PLAYERS = 40;
let ME = null;
const TOKEN_KEY = "sg_token";
const LEVEL_NAMES = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
  impossible: "Impossible",
};
const lsGet = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? d : v;
  } catch (e) {
    return d;
  }
};
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch (e) {}
};
let toastTimer;
function showToast(m) {
  const el = $("toast");
  el.textContent = m;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const sfxVol = () => Number(lsGet("sg_sfx", 0.35));
const currentName = () =>
  (ME && ME.username) || lsGet("sg_name", "") || "Player";
const NAME_RE = /^[A-Za-z0-9ÅÄÖåäö _.,!?'\-]{3,20}$/;
function checkUsername(v) {
  if (!NAME_RE.test(v))
    return "Usernames are 3–20 characters: letters (A–Z, Å, Ä, Ö), numbers and . , ! ? ' - _";
  if (v !== v.trim() || /\s{2,}/.test(v))
    return "No extra spaces in usernames.";
  return "";
}
const CROWN_I =
  '<svg viewBox="2 3.5 20 16.5" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';
const MEDAL_I =
  '<svg viewBox="4.8 1 14.4 21" fill="currentColor"><path d="M6.5 2h4.2l1.6 6.2-3.4 1.6zM17.5 2h-4.2l-1.6 6.2 3.4 1.6z" fill-opacity="0.65"/><circle cx="12" cy="15.2" r="6.6"/><circle cx="12" cy="15.2" r="4" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="1.5"/></svg>';
let RANK_SRC = {};
const MAIN_BOARDS = ["score"];
const BOARD_LABEL = {
  score: "Score",
  matched: "Sizes matched",
  accuracy: "Accuracy",
  streak: "Best streak",
  closest: "Closest match",
  duels: "Duels played",
  wins: "Duels won",
};
const RANK_WORD = { 1: "1st", 2: "2nd", 3: "3rd" };
function trophyList(name) {
  const src = RANK_SRC[String(name || "").toLowerCase()] || [];
  const byRank = (x, y) => x.rank - y.rank;
  return [
    ...src
      .filter((x) => MAIN_BOARDS.includes(x.key))
      .sort(byRank)
      .map((x) => ({ ...x, kind: "crown" })),
    ...src
      .filter((x) => !MAIN_BOARDS.includes(x.key))
      .sort(byRank)
      .map((x) => ({ ...x, kind: "medal" })),
  ];
}
function nameHTML(name) {
  const n0 = String(name ?? "");
  const nm = `<span class="nm-t" title="${esc(n0)}">${esc(n0)}</span>`;
  const list = trophyList(n0);
  if (!list.length) return `<span class="nm-rk">${nm}</span>`;
  const size = list.length <= 2 ? 1.35 : list.length <= 4 ? 1.22 : 1.1;
  const icons = list
    .map(
      (x, i) =>
        `<i class="tr ${x.kind === "crown" ? "cr" : "md"} rk${x.rank}" style="--i:${i}">${x.kind === "crown" ? CROWN_I : MEDAL_I}</i>`,
    )
    .join("");
  return `<span class="nm-rk"><button type="button" class="trophies" data-name="${esc(n0)}" style="--s:${size}em" aria-label="${esc(n0)} has ${list.length} trophies. Show details">${icons}</button>${nm}</span>`;
}
function showTrophies(name) {
  const list = trophyList(name);
  $("trWho").textContent = name;
  $("trList").innerHTML = list.length
    ? list
        .map(
          (x) =>
            `<div class="tr-item"><i class="tr ${x.kind === "crown" ? "cr" : "md"} rk${x.rank}" style="--i:0">${x.kind === "crown" ? CROWN_I : MEDAL_I}</i><div><b>${RANK_WORD[x.rank]} place &middot; ${x.kind === "crown" ? "Crown" : "Medal"}</b><span class="d">${esc(BOARD_LABEL[x.key] || x.key)} leaderboard</span></div></div>`,
        )
        .join("")
    : '<div class="lb-note">No trophies right now.</div>';
  $("trModal").classList.add("open");
}
function closeTrophies() {
  $("trModal").classList.remove("open");
}
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest(".trophies");
  if (b) {
    e.preventDefault();
    showTrophies(b.dataset.name);
  }
});
const BLANK = () => ({
  matched: 0,
  missed: 0,
  best: 0,
  duels: 0,
  wins: 0,
  score: 0,
  closest: null,
});
let stats = BLANK();
let resetArm = 0;
function resetStats() {
  const b = document.querySelector(".reset-btn");
  if (!resetArm) {
    resetArm = setTimeout(() => {
      resetArm = 0;
      b.textContent = "Reset statistics";
    }, 3500);
    b.textContent = "Tap again to confirm";
    return;
  }
  clearTimeout(resetArm);
  resetArm = 0;
  b.textContent = "Reset statistics";
  srv("sz_reset").then((st) =>
    showToast(
      st
        ? "All your statistics and scores were reset."
        : "Couldn't reset right now.",
    ),
  );
}
const fmtClosest = (v) => (v < 10 ? v.toFixed(2) : v.toFixed(1)) + "% off";
function statTiles() {
  const tot = stats.matched + stats.missed;
  const acc = tot ? Math.round((stats.matched / tot) * 100) + "%" : "–";
  return [
    [stats.matched.toLocaleString(), "Sizes matched"],
    [acc, "Accuracy"],
    [stats.best.toLocaleString(), "Best streak"],
    [stats.closest === null ? "–" : fmtClosest(stats.closest), "Closest match"],
    [stats.duels.toLocaleString(), "Duels played"],
    [stats.wins.toLocaleString(), "Duels won"],
  ]
    .map(
      ([v, l]) => `<div class="stat-tile"><b>${v}</b><span>${l}</span></div>`,
    )
    .join("");
}
let actx = null;
function ctx() {
  actx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === "suspended") actx.resume();
  return actx;
}
function sfx(kind) {
  try {
    const c = ctx(),
      o = c.createOscillator(),
      g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.frequency.value =
      { correct: 660, wrong: 170, win: 880, lose: 140, advance: 420 }[kind] ||
      440;
    o.type = kind === "wrong" || kind === "lose" ? "triangle" : "sine";
    g.gain.setValueAtTime(Math.max(0.0001, sfxVol() * 0.12), c.currentTime);
    g.gain.exponentialRampToValueAtTime(
      0.001,
      c.currentTime + (kind === "wrong" || kind === "lose" ? 0.35 : 0.22),
    );
    o.start();
    o.stop(c.currentTime + 0.37);
  } catch (e) {}
}
function buildUp(ms) {
  try {
    const c = ctx(),
      t0 = c.currentTime,
      d = ms / 1000,
      v = sfxVol() * 0.3;
    if (v <= 0) return;
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(90, t0);
    o.frequency.exponentialRampToValueAtTime(560, t0 + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 0.35), t0 + d);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + d + 0.05);
    const len = Math.floor(c.sampleRate * 0.07),
      buf = c.createBuffer(1, len, c.sampleRate),
      data = buf.getChannelData(0);
    for (let i = 0; i < len; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    let t = 0,
      gap = 0.2;
    while (t < d - 0.1) {
      const s = c.createBufferSource(),
        gg = c.createGain();
      s.buffer = buf;
      gg.gain.value = v * (0.25 + 0.75 * (t / d));
      s.connect(gg);
      gg.connect(c.destination);
      s.start(t0 + t);
      t += gap;
      gap = Math.max(0.04, gap * 0.9);
    }
  } catch (e) {}
}
function fanfare() {
  try {
    const c = ctx(),
      t0 = c.currentTime,
      v = sfxVol() * 0.22;
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + i * 0.08);
      g.gain.exponentialRampToValueAtTime(
        Math.max(0.0002, v),
        t0 + i * 0.08 + 0.03,
      );
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0 + i * 0.08);
      o.stop(t0 + 1.7);
    });
  } catch (e) {}
}
const VIEWS = [
  "homeView",
  "gameView",
  "multiplayerView",
  "lobbyView",
  "duelView",
  "resultView",
];
function showView(id) {
  VIEWS.forEach((v) => $(v).classList.remove("active"));
  void $(id).offsetWidth;
  $(id).classList.add("active");
  if (id === "duelView") armBack();
  else disarmBack();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function goHome() {
  S.token++;
  closeSoloResult();
  stopAnim("solo");
  stopAnim("duel");
  stopConfetti();
  if (D.channel) disconnectDuel("homeView");
  else {
    clearTimeout(D.podTimer);
    showView("homeView");
  }
}
const cf = { raf: 0 };
function stopConfetti() {
  cancelAnimationFrame(cf.raf);
  const cv = $("confetti");
  cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
}
function confetti(big) {
  stopConfetti();
  const cv = $("confetti"),
    x = cv.getContext("2d");
  cv.width = innerWidth;
  cv.height = innerHeight;
  const cols = [
    "#19d77b",
    "#0ecb70",
    "#55efa0",
    "#0b8f52",
    "#9aa6a0",
    "#d6ded9",
  ];
  const parts = Array.from({ length: big ? 260 : 150 }, () => ({
    x: Math.random() * cv.width,
    y: -20 - Math.random() * cv.height * 0.7,
    w: 5 + Math.random() * 7,
    h: 3 + Math.random() * 6,
    vx: (Math.random() - 0.5) * 2,
    vy: 2 + Math.random() * 3.5,
    r: Math.random() * 6.28,
    vr: (Math.random() - 0.5) * 0.25,
    c: cols[(Math.random() * cols.length) | 0],
    round: Math.random() < 0.25,
  }));
  const frame = () => {
    x.clearRect(0, 0, cv.width, cv.height);
    let alive = false;
    parts.forEach((p) => {
      p.x += p.vx + Math.sin(p.y / 40 + p.r) * 0.6;
      p.y += p.vy;
      p.r += p.vr;
      if (p.y < cv.height + 20) {
        alive = true;
        x.save();
        x.translate(p.x, p.y);
        x.rotate(p.r);
        x.fillStyle = p.c;
        if (p.round) {
          x.beginPath();
          x.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, 6.28);
          x.fill();
        } else x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        x.restore();
      }
    });
    if (alive) cf.raf = requestAnimationFrame(frame);
    else x.clearRect(0, 0, cv.width, cv.height);
  };
  cf.raf = requestAnimationFrame(frame);
}
function runCooldown(ms, el, onTick, onDone) {
  let acc = 0,
    last = performance.now(),
    wasPlaying = false;
  const id = setInterval(() => {
    const now = performance.now(),
      dt = now - last;
    last = now;
    const paused =
      $("settingsModal").classList.contains("open") || document.hidden;
    if (paused) {
      if (el && !el.paused) {
        el.pause();
        wasPlaying = true;
      }
      return;
    }
    if (wasPlaying) {
      wasPlaying = false;
      el?.play().catch(() => {});
    }
    acc += dt;
    onTick(Math.min(1, acc / ms));
    if (acc >= ms) {
      clearInterval(id);
      onDone();
    }
  }, 80);
  return () => clearInterval(id);
}
function artSVG(art) {
  return art
    .split(";")
    .map((s) => {
      const t = s.trim();
      if (!t) return "";
      const i1 = t.indexOf(" "),
        kind = t.slice(0, i1),
        rest = t.slice(i1 + 1),
        i2 = rest.indexOf(" "),
        cls = rest.slice(0, i2),
        a = rest.slice(i2 + 1),
        c = cls === "-" ? "" : ` class="${cls.split("").join(" ")}"`,
        v = a.split(" ");
      if (kind === "R")
        return `<rect${c} x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" rx="${v[4] || 0}"/>`;
      if (kind === "C")
        return `<circle${c} cx="${v[0]}" cy="${v[1]}" r="${v[2]}"/>`;
      if (kind === "E")
        return `<ellipse${c} cx="${v[0]}" cy="${v[1]}" rx="${v[2]}" ry="${v[3]}"/>`;
      if (kind === "L")
        return `<line${c} x1="${v[0]}" y1="${v[1]}" x2="${v[2]}" y2="${v[3]}"/>`;
      if (kind === "P") return `<path${c} d="${a}"/>`;
      if (kind === "Y") return `<polygon${c} points="${a}"/>`;
      return "";
    })
    .join("");
}
const SW = 400,
  SH = 320;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const TOL = {
  easy: 0.15,
  medium: 0.17,
  hard: 0.19,
  expert: 0.22,
  impossible: 0.25,
};
const DIFF_MULT = {
  easy: 1,
  medium: 1.2,
  hard: 1.4,
  expert: 2.2,
  impossible: 3.2,
};
const RULE = {
  easy: { r: [1, 1], t: [1, 2], q: [0.2, 5] },
  medium: { r: [1, 2], t: [2, 3], q: [0.3, 4.5] },
  hard: { r: [2, 3], t: [3, 4], q: [0.2, 6] },
  expert: { r: [3, 4], t: [3, 5], q: [0.17, 8] },
  impossible: { r: [4, 5], t: [4, 5], q: [0.16, 9] },
};
const dimsOf = (it) => {
  const w = it.vb[2],
    h = it.vb[3];
  return it.d === "w" ? [it.m, (it.m * h) / w] : [(it.m * w) / h, it.m];
};
const spanOf = (it) => Math.max(...dimsOf(it));
const POOLS = {};
LEVELS.forEach((lv) => {
  const R0 = RULE[lv],
    by = {};
  ITEMS.forEach((t, ti) => {
    if (t.k < R0.t[0] || t.k > R0.t[1]) return;
    ITEMS.forEach((r, ri) => {
      if (ri === ti || r.k < R0.r[0] || r.k > R0.r[1]) return;
      const q = spanOf(t) / spanOf(r);
      if (q >= R0.q[0] && q <= R0.q[1] && (q < 0.8 || q > 1.25))
        (by[ti] = by[ti] || []).push(ri);
    });
  });
  POOLS[lv] = { by, tg: Object.keys(by).map(Number) };
});
const RECENT = { t: [], r: [] };
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
function chooseRound(diff) {
  const P = POOLS[diff] || POOLS.easy,
    keep = Math.max(1, Math.min(18, Math.floor(P.tg.length / 2)));
  let tg = P.tg.filter((t) => !RECENT.t.includes(t));
  if (!tg.length) tg = P.tg;
  const t = pickOne(tg);
  let rf = P.by[t].filter((r) => !RECENT.r.includes(r));
  if (!rf.length) rf = P.by[t];
  const r = pickOne(rf);
  RECENT.t.push(t);
  RECENT.r.push(r);
  while (RECENT.t.length > keep) RECENT.t.shift();
  while (RECENT.r.length > 3) RECENT.r.shift();
  return { r, t };
}
function prng(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const imperial = () => lsGet("sz_imp", "0") === "1";
const sig = (v) =>
  Number(v.toPrecision(3)).toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });
function fmtLen(m) {
  if (imperial()) {
    const inch = m / 0.0254;
    if (inch < 12) return sig(inch) + " in";
    const ft = inch / 12;
    if (ft < 10) {
      let f = Math.floor(ft),
        i = Math.round((ft - f) * 12);
      if (i === 12) {
        f++;
        i = 0;
      }
      return i ? f + " ft " + i + " in" : f + " ft";
    }
    if (ft < 100) return sig(ft) + " ft";
    if (ft < 5280) return Math.round(ft).toLocaleString() + " ft";
    return sig(ft / 5280) + " mi";
  }
  if (m < 0.01) return sig(m * 1000) + " mm";
  if (m < 1) return sig(m * 100) + " cm";
  if (m < 1000) return sig(m) + " m";
  return sig(m / 1000) + " km";
}
const sizeText = (it) => (it.a ? "~" : "") + fmtLen(it.m) + " " + it.w;
function makeScene(ri, ti, seed) {
  const rnd = prng(seed),
    R0 = ITEMS[ri],
    T0 = ITEMS[ti],
    [rw, rh] = dimsOf(R0),
    [tw, th] = dimsOf(T0);
  let p = Math.min(
    (0.42 * SW) / rw,
    (0.5 * SH) / rh,
    (0.8 * SW) / tw,
    (0.8 * SH) / th,
  );
  p *= 0.86 + 0.14 * rnd();
  const ref = { w: rw * p, h: rh * p },
    real = { w: tw * p, h: th * p };
  ref.x = 12;
  ref.y = SH - 12 - ref.h;
  const span = Math.max(real.w, real.h);
  const big = 1.5 + 0.9 * rnd(),
    small = Math.max(0.36 + 0.26 * rnd(), 22 / span),
    fitsBig = real.w * big <= 0.9 * SW && real.h * big <= 0.84 * SH,
    smallOk = small <= 0.66;
  const f =
    smallOk && (!fitsBig || rnd() < 0.5)
      ? small
      : fitsBig
        ? big
        : Math.max(small, 0.66);
  const g = { w: real.w * f, h: real.h * f };
  g.x = Math.max(10, Math.min(SW * 0.58 - g.w / 2, SW - 34 - g.w));
  g.y = Math.max(30, Math.min(SH * 0.42 - g.h / 2, SH - 24 - g.h));
  return { ri, ti, p, ref, real, g };
}
const ptsFor = (diff, err, secs, before) => {
  const tol = TOL[diff] || 0.15,
    speed = 0.4 + 0.6 * Math.exp(-Math.max(0, secs - 3) / 45),
    close = 1 - 0.45 * Math.min(1, err / tol),
    p = Math.round(
      700 *
        speed *
        close *
        (DIFF_MULT[diff] || 1) *
        (1 + Math.min(0.25, 0.05 * before)),
    );
  return Math.max(20, p);
};
const pctOf = (err) => Math.max(0.05, Math.round(err * 10000) / 100);
const R = { solo: null, duel: null };
const BACK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const FLAME_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2 1-3.2 2-4.3.3 1.3 1 2 1.8 2.3C10.5 8 10.8 4.5 12 2z"/></svg>';
const CROWN_SVG =
  '<svg class="crown" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';
function gameHTML(p) {
  return `
    <div class="sz-card" id="${p}Panel">
      <div class="sz-stage" id="${p}Stage">
        <svg class="sz-svg" id="${p}Svg" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMid meet">
          <defs><pattern id="${p}Grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#0e1712" stroke-width="1"/></pattern></defs>
          <rect width="${SW}" height="${SH}" fill="url(#${p}Grid)"/>
          <svg class="sz-art sz-ref" id="${p}Ref" overflow="visible"></svg>
          <rect class="sz-box" id="${p}Box" fill="none"/>
          <svg class="sz-art sz-obj" id="${p}Obj" overflow="visible"></svg>
          <svg class="sz-art sz-real" id="${p}Real" overflow="visible"></svg>
          <rect class="sz-hit" id="${p}Hit" fill="transparent"/>
          <g class="sz-hdl" id="${p}Hdl"><circle r="13"/><path d="M-5 5L5 -5M0.5 -5.5H5.5V-0.5M-0.5 5.5H-5.5V0.5"/></g>
        </svg>
      </div>
      <div class="sz-legend">
        <div class="sz-ln"><i class="g"></i><span>Reference (in green): <b id="${p}RefTxt"></b></span></div>
        <div class="sz-ln"><i class="w"></i><span>Object (in white): <b id="${p}ObjTxt"></b></span></div>
        <div class="sz-ln r" id="${p}RealLn" hidden><i class="r"></i><span>Real size (in red): <b id="${p}RealTxt"></b></span></div>
      </div>
      <div id="${p}Action">
        <div class="answer-row">
          <button class="gs-btn" id="${p}Skip" onclick="skipPress('${p}')">Skip</button>
          <button class="gs-btn is-guess" id="${p}Btn" onclick="lockIn('${p}')">Lock in</button>
        </div>
        <div class="msg" id="${p}Msg"></div>
      </div>
    </div>`;
}
const setMsg = (p, html, cls = "") => {
  const m = $(p + "Msg");
  m.className = "msg " + cls;
  m.innerHTML = html;
};
const svgPt = (p, e) => {
  const r = $(p + "Svg").getBoundingClientRect();
  return [
    ((e.clientX - r.left) / r.width) * SW,
    ((e.clientY - r.top) / r.height) * SH,
  ];
};
const canTouch = (p) => {
  const r = R[p];
  return !!r && !r.locked && !(p === "duel" && D.locked);
};
const clampG = (g) => ({
  ...g,
  x: clamp(g.x, 34 - g.w, SW - 24 - g.w),
  y: clamp(g.y, 24, SH - 34),
});
function putItem(el, it) {
  el.setAttribute("viewBox", it.vb.join(" "));
  el.setAttribute("preserveAspectRatio", "none");
  el.innerHTML = artSVG(it.art);
}
function place(el, r) {
  el.setAttribute("x", r.x);
  el.setAttribute("y", r.y);
  el.setAttribute("width", Math.max(0.01, r.w));
  el.setAttribute("height", Math.max(0.01, r.h));
}
function draw(p) {
  const r = R[p];
  if (!r) return;
  const g = r.g,
    hit = $(p + "Hit");
  place($(p + "Obj"), g);
  place($(p + "Box"), g);
  place(hit, { x: g.x - 6, y: g.y - 6, w: g.w + 12, h: g.h + 12 });
  $(p + "Hdl").setAttribute(
    "transform",
    `translate(${g.x + g.w + 9} ${g.y - 9})`,
  );
}
function scaleAbout(p, k) {
  const r = R[p],
    g = r.g,
    span = Math.max(g.w, g.h);
  k = clamp(
    k,
    8 / span,
    Math.max(8 / span, Math.min((SW - 8) / g.w, (SH - 8) / g.h)),
  );
  const w = g.w * k,
    h = g.h * k;
  r.g = clampG({ x: g.x + (g.w - w) / 2, y: g.y + (g.h - h) / 2, w, h });
  r.touched = true;
  draw(p);
}
function bindStage(p) {
  const svg = $(p + "Svg"),
    stage = $(p + "Stage");
  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    if (!canTouch(p) || (e.pointerType === "mouse" && e.button !== 0)) return;
    const kind = e.target.closest(".sz-hdl")
      ? "scale"
      : e.target.closest(".sz-hit")
        ? "move"
        : "";
    if (!kind) return;
    e.preventDefault();
    const [x, y] = svgPt(p, e);
    drag = { kind, x, y, g: { ...R[p].g }, id: e.pointerId };
    try {
      svg.setPointerCapture(e.pointerId);
    } catch (err) {}
    stage.classList.add("drag");
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!canTouch(p)) {
      drag = null;
      stage.classList.remove("drag");
      return;
    }
    const [x, y] = svgPt(p, e),
      g0 = drag.g,
      r = R[p];
    if (drag.kind === "move")
      r.g = clampG({ ...g0, x: g0.x + x - drag.x, y: g0.y + y - drag.y });
    else {
      const d2 = g0.w * g0.w + g0.h * g0.h,
        span = Math.max(g0.w, g0.h);
      let k = 1 + ((x - drag.x) * g0.w - (y - drag.y) * g0.h) / d2;
      const hi = Math.max(
        8 / span,
        Math.min((SW - 24 - g0.x) / g0.w, (g0.y + g0.h - 24) / g0.h),
      );
      k = clamp(k, 8 / span, hi);
      r.g = { x: g0.x, y: g0.y + g0.h - g0.h * k, w: g0.w * k, h: g0.h * k };
    }
    r.touched = true;
    draw(p);
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    stage.classList.remove("drag");
  };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
  stage.addEventListener(
    "wheel",
    (e) => {
      if (!canTouch(p)) return;
      e.preventDefault();
      scaleAbout(
        p,
        Math.exp(
          (-(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * 1.6) / 1000,
        ),
      );
    },
    { passive: false },
  );
}
function setLegend(p) {
  const r = R[p];
  if (!r) return;
  const rf = ITEMS[r.ri],
    tg = ITEMS[r.ti];
  $(p + "RefTxt").textContent = rf.n + ", " + sizeText(rf);
  $(p + "ObjTxt").textContent = tg.n;
  $(p + "RealTxt").textContent = sizeText(tg);
}
function refreshTexts() {
  ["solo", "duel"].forEach(setLegend);
  const res = $("soloResult");
  if (R.solo && res && res.style.display === "block") showSoloUnits();
}
const ANIM = { solo: 0, duel: 0 };
function stopAnim(p) {
  cancelAnimationFrame(ANIM[p]);
  clearTimeout(ANIM[p + "T"]);
  ANIM[p] = 0;
}
function setupRound(p, ri, ti, seed, diff) {
  stopAnim(p);
  const sc = makeScene(ri, ti, seed);
  R[p] = {
    ri,
    ti,
    diff,
    sc,
    g: { ...sc.g },
    locked: false,
    startedAt: Date.now(),
    touched: false,
  };
  $(p + "Stage").classList.remove("locked", "drag");
  putItem($(p + "Ref"), ITEMS[ri]);
  place($(p + "Ref"), sc.ref);
  putItem($(p + "Obj"), ITEMS[ti]);
  putItem($(p + "Real"), ITEMS[ti]);
  $(p + "Real").style.opacity = 0;
  $(p + "RealLn").hidden = true;
  draw(p);
  setLegend(p);
  setMsg(p, "");
  $(p + "Action").style.display = "";
  setTimeout(() => {
    if (R[p] && R[p].sc === sc) R[p].startedAt = Date.now();
  }, 300);
}
const easeIO = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const mix = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});
function revealRound(p, done) {
  stopAnim(p);
  const r = R[p],
    sc = r.sc,
    still = matchMedia("(prefers-reduced-motion: reduce)").matches,
    U = { w: Math.max(r.g.w, sc.real.w), h: Math.max(r.g.h, sc.real.h) },
    gap = 18,
    pad = 16,
    z = Math.min(
      (SW - 2 * pad) / Math.max(U.w, sc.ref.w),
      (SH - 2 * pad - gap) / (U.h + sc.ref.h),
      10,
    ),
    top = (SH - (U.h * z + gap + sc.ref.h * z)) / 2,
    base = top + U.h * z,
    ux = (SW - U.w * z) / 2,
    refF = {
      x: (SW - sc.ref.w * z) / 2,
      y: base + gap,
      w: sc.ref.w * z,
      h: sc.ref.h * z,
    },
    guessF = { x: ux, y: base - r.g.h * z, w: r.g.w * z, h: r.g.h * z },
    realF = {
      x: ux,
      y: base - sc.real.h * z,
      w: sc.real.w * z,
      h: sc.real.h * z,
    },
    g0 = { ...r.g },
    TA = still ? 1 : 900,
    TB = still ? 1 : 800,
    ref = $(p + "Ref"),
    obj = $(p + "Obj"),
    real = $(p + "Real"),
    t0 = performance.now();
  $(p + "Stage").classList.add("locked");
  $(p + "Stage").classList.remove("drag");
  place(real, g0);
  let fin = false;
  const finish = () => {
    if (fin) return;
    fin = true;
    cancelAnimationFrame(ANIM[p]);
    ANIM[p] = 0;
    place(ref, refF);
    place(obj, guessF);
    place(real, realF);
    real.style.opacity = 1;
    $(p + "RealLn").hidden = false;
    if (done) done();
  };
  const frame = (now) => {
    const e = now - t0,
      a = easeIO(clamp(e / TA, 0, 1)),
      b = easeIO(clamp((e - TA) / TB, 0, 1)),
      gn = mix(g0, guessF, a);
    place(ref, mix(sc.ref, refF, a));
    place(obj, gn);
    place(real, e < TA ? gn : mix(guessF, realF, b));
    real.style.opacity = clamp((e - TA * 0.7) / 300, 0, 1);
    if (e < TA + TB) ANIM[p] = requestAnimationFrame(frame);
    else finish();
  };
  ANIM[p] = requestAnimationFrame(frame);
  ANIM[p + "T"] = setTimeout(finish, TA + TB + 500);
}
function renderDiff(id, current, onPick) {
  const box = $(id);
  box.innerHTML = "";
  LEVELS.forEach((l) => {
    const b = document.createElement("button");
    b.className = "pill" + (l === current ? " sel" : "");
    b.dataset.level = l;
    b.textContent = LEVEL_NAMES[l];
    b.onclick = () => {
      box
        .querySelectorAll(".pill")
        .forEach((x) => x.classList.toggle("sel", x === b));
      onPick(l);
    };
    box.appendChild(b);
  });
}
const S = {
  diff: "easy",
  token: 0,
  cancel: null,
  pendingLoad: false,
  ls: {},
  lastEst: 0,
};
function startSolo() {
  closeSoloResult();
  showView("gameView");
  renderDiff("soloDiff", S.diff, (l) => {
    S.diff = l;
    beginSolo();
  });
  updateScoreChip();
  beginSolo();
}
function leaveGame() {
  S.pendingLoad = false;
  S.token++;
  closeSoloResult();
  stopAnim("solo");
  R.solo = null;
  showView("homeView");
}
function beginSolo() {
  S.token++;
  closeSoloResult();
  newSoloRound();
}
function newSoloRound() {
  const pick = chooseRound(S.diff);
  setupRound(
    "solo",
    pick.r,
    pick.t,
    Math.floor(Math.random() * 4294967296),
    S.diff,
  );
  srv("sz_start_round", { diff: S.diff });
}
function lockIn(p) {
  if (!canTouch(p)) return;
  const r = R[p],
    ratio = r.g.w / r.sc.real.w,
    err = Math.max(ratio, 1 / ratio) - 1;
  r.ratio = ratio;
  r.err = err;
  const ok = err <= TOL[r.diff];
  if (p === "solo") soloEnd(ok, err);
  else finishDuel(ok, err);
}
function skipPress(p) {
  if (!canTouch(p)) return;
  if (p === "solo") {
    S.ls[S.diff] = 0;
    srv("sz_skip");
    newSoloRound();
  } else finishDuel(false, 0, true);
}
function soloEnd(correct, err) {
  const r = R.solo;
  if (!r || r.locked) return;
  r.locked = true;
  S.lastEst = 0;
  const tok = S.token,
    secs = (Date.now() - r.startedAt) / 1000;
  let streak = 0,
    nextDiff = "",
    pending = null;
  if (correct) {
    streak = S.ls[S.diff] = (S.ls[S.diff] || 0) + 1;
    const est = ME && ME.token ? ptsFor(S.diff, err, secs, streak - 1) : 0;
    S.lastEst = est;
    localStats((x) => {
      x.matched++;
      x.score += est;
      x.best = Math.max(x.best, streak);
      x.closest =
        x.closest === null ? pctOf(err) : Math.min(x.closest, pctOf(err));
    });
    pending = srv("sz_correct", { err, secs: Math.max(0.5, secs) });
    sfx("correct");
    if (lsGet("sz_autodiff", "0") === "1") {
      const i = LEVELS.indexOf(S.diff);
      if (i >= 0 && i < LEVELS.length - 1) nextDiff = LEVELS[i + 1];
    }
  } else {
    S.ls[S.diff] = 0;
    localStats((x) => {
      x.missed++;
    });
    srv("sz_loss");
    sfx("lose");
  }
  S.pendingLoad = !!nextDiff;
  $("soloAction").style.display = "none";
  revealRound("solo", () => {
    if (tok === S.token && R.solo === r)
      showSoloResult(correct, err, secs, streak, nextDiff, pending);
  });
}
function soloCompare() {
  const r = R.solo,
    t = ITEMS[r.ti],
    mine = t.m * r.ratio;
  return `<span class="you"><i></i>You: ${(t.a ? "~" : "") + fmtLen(mine)}</span><span class="real"><i></i>Real: ${sizeText(t).replace(/ (wide|across|long|tall)$/, "")}</span>`;
}
function showSoloUnits() {
  const c = $("soloCmp");
  if (c) c.innerHTML = soloCompare();
}
function showSoloResult(correct, err, secs, streak, nextDiff, pending) {
  const r = R.solo,
    tok = S.token,
    secTxt = secs < 10 ? secs.toFixed(1) : Math.round(secs),
    off = err < 0.02 ? "SPOT ON" : Math.round(err * 100) + "% OFF",
    factor =
      (r.ratio < 1 ? "TOO SMALL" : "TOO BIG") +
      " &middot; " +
      (1 + err).toFixed(1) +
      "&times;";
  $("soloResult").innerHTML = correct
    ? `<div class="res good strip"><div class="res-badges"><span class="stamp">${off} &middot; ${secTxt}S</span><span class="streak" id="soloStreakTxt">${FLAME_SVG} ${streak} in a row</span><span class="streak" id="soloPts">+${S.lastEst ? S.lastEst.toLocaleString() : "…"} pts</span>${nextDiff ? `<span class="streak">&#8593; ${LEVEL_NAMES[nextDiff]} next</span>` : ""}</div><div class="sz-cmp" id="soloCmp">${soloCompare()}</div>
        <div class="res-actions"><button class="res-next" onclick="nextSolo()">Next</button></div><div class="cool"><i id="soloCool"></i></div></div>`
    : `<div class="res bad strip"><div class="res-badges"><span class="stamp">${factor}</span><span class="streak" style="color:#9aa6a0">No score</span></div><div class="sz-cmp" id="soloCmp">${soloCompare()}</div>
        <div class="res-actions"><button class="res-next" onclick="nextSolo()">Try another</button></div><div class="cool"><i id="soloCool"></i></div></div>`;
  if (pending)
    pending.then((st) => {
      if (tok !== S.token) return;
      const pt = $("soloPts"),
        sk = $("soloStreakTxt");
      if (!pt) return;
      if (!st) pt.textContent = "Not saved";
      else if (st.rejected) pt.textContent = "Too quick to count";
      else {
        pt.textContent = "+" + Number(st.points).toLocaleString() + " pts";
        if (sk) sk.innerHTML = FLAME_SVG + " " + st.streak + " in a row";
      }
    });
  $("soloResult").style.display = "block";
  window.__resAt = Date.now();
  if (correct) confetti();
  const bar = $("soloCool");
  if (lsGet("sz_autonext", "1") === "1") {
    S.cancel = runCooldown(
      correct ? 7000 : 8000,
      null,
      (k) => {
        bar.style.width = k * 100 + "%";
      },
      () => {
        S.cancel = null;
        if (tok === S.token) nextSolo();
      },
    );
  } else {
    bar.parentNode.style.display = "none";
  }
}
function nextSolo() {
  if (!R.solo || !R.solo.locked || $("soloResult").style.display !== "block")
    return;
  if (S.pendingLoad) {
    S.pendingLoad = false;
    const i = LEVELS.indexOf(S.diff);
    if (i >= 0 && i < LEVELS.length - 1) S.diff = LEVELS[i + 1];
    renderDiff("soloDiff", S.diff, (l) => {
      S.diff = l;
      beginSolo();
    });
    beginSolo();
    return;
  }
  closeSoloResult();
  newSoloRound();
}
function closeSoloResult() {
  if (S.cancel) {
    S.cancel();
    S.cancel = null;
  }
  $("soloResult").style.display = "none";
  $("soloResult").innerHTML = "";
  $("soloAction").style.display = "";
  stopConfetti();
}
function itemRevealHTML(pr) {
  const t = ITEMS[pr && pr.t];
  if (!t) return "";
  return `<div class="rv-item"><svg class="sz-art" viewBox="${t.vb.join(" ")}" preserveAspectRatio="xMidYMid meet" overflow="visible">${artSVG(t.art)}</svg><div><small>REAL SIZE</small><b>${esc(t.n)}</b><span>${esc(sizeText(t))}</span></div></div>`;
}
const D = {
  client: null,
  channel: null,
  code: "",
  host: false,
  hostId: "",
  players: [],
  settings: null,
  round: 0,
  total: 10,
  pair: null,
  roundDiff: "easy",
  rid: 0,
  score: {},
  answers: {},
  locked: true,
  resolved: false,
  startedAt: 0,
  roundStart: 0,
  streak: 0,
  finished: false,
  inMatch: false,
  started: false,
  joining: false,
  myId: crypto.randomUUID(),
  name: currentName(),
  helloTimer: null,
  nextTimer: null,
  podTimer: null,
};
let duelDiffSel = "easy",
  duelRandom = false;
let SBC = null;
function sb() {
  if (!SBC) {
    if (!window.supabase)
      throw new Error("Supabase library did not load. Reload the page.");
    SBC = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return SBC;
}
const makeCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
const send = (event, payload) =>
  D.channel?.send({ type: "broadcast", event, payload });
const settingsText = () =>
  D.settings
    ? `${D.settings.random ? "Random difficulty" : LEVEL_NAMES[D.settings.difficulty]}${D.settings.timer ? " · " + timerName(D.settings.timer) + " timer" : ""}${D.settings.tabs ? " · Tab changes tracked" : ""} · ${D.settings.total} rounds`
    : "";
function toggleDD(e, id) {
  e?.stopPropagation();
  document.querySelectorAll(".dd.open").forEach((x) => {
    if (x.id !== id) x.classList.remove("open");
  });
  $(id).classList.toggle("open");
}
const TIMERS = [
  [0, "Off"],
  [15, "15 seconds"],
  [30, "30 seconds"],
  [45, "45 seconds"],
  [60, "60 seconds"],
  [90, "1.5 minutes"],
  [120, "2 minutes"],
  [180, "3 minutes"],
  [240, "4 minutes"],
  [300, "5 minutes"],
];
let duelTimerSel = 0;
const timerName = (v) => (TIMERS.find((t) => t[0] === v) || [0, ""])[1];
function pickTimer(v) {
  duelTimerSel = v;
  $("timerLabel").textContent = timerName(v);
  document
    .querySelectorAll("#timerMenu .dd-item")
    .forEach((i) => i.classList.toggle("sel", Number(i.dataset.v) === v));
  $("timerDD").classList.remove("open");
}
document.addEventListener("click", (e) => {
  document.querySelectorAll(".dd.open").forEach((x) => {
    if (!x.contains(e.target)) x.classList.remove("open");
  });
});
function awayWho(id) {
  return id === D.myId
    ? "You"
    : (D.players.find((x) => x.id === id) || {}).name || "A player";
}
function renderAway() {
  const pill = $("duelCheat"),
    note = $("duelCheatNote"),
    ids = Object.keys(D.away || {});
  if (!pill || !note) return;
  if (!ids.length) {
    pill.hidden = true;
    note.hidden = true;
    return;
  }
  pill.hidden = false;
  pill.textContent = ids.map((id) => awayWho(id) + " changed tabs").join(" · ");
  note.hidden = false;
  note.innerHTML = ids
    .map(
      (id) =>
        esc(awayWho(id)) +
        " changed tabs, " +
        (id === D.myId ? "your" : "their") +
        " answer will be marked as cheating.",
    )
    .join("<br>");
}
function markAway() {
  if (!D.inMatch || D.locked || !D.settings || !D.settings.tabs || D.mine)
    return;
  D.mine = true;
  D.away[D.myId] = true;
  send("away", { id: D.myId, round: D.round });
  renderAway();
}
function onAway(p) {
  if (
    !D.inMatch ||
    D.locked ||
    !D.settings ||
    !D.settings.tabs ||
    p.round !== D.round ||
    p.id === D.myId ||
    !D.players.some((x) => x.id === p.id)
  )
    return;
  D.away[p.id] = true;
  renderAway();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) markAway();
});
window.addEventListener("blur", () => {
  setTimeout(() => {
    if (!document.hasFocus()) markAway();
  }, 1500);
});
function paintTimer(left) {
  const t = $("duelTimer");
  t.textContent =
    Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
  t.classList.toggle("low", left <= 10);
}
function stopDuelTimer() {
  clearInterval(D.tmr);
  D.tmr = 0;
  const t = $("duelTimer");
  if (t) t.classList.remove("on", "low");
}
function startDuelTimer(sec) {
  stopDuelTimer();
  if (!sec) return;
  const end = Date.now() + sec * 1000;
  $("duelTimer").classList.add("on");
  paintTimer(sec);
  D.tmr = setInterval(() => {
    if (D.locked || !D.inMatch) {
      stopDuelTimer();
      return;
    }
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    paintTimer(left);
    if (left <= 0) {
      stopDuelTimer();
      setMsg("duel", "Time's up!");
      sfx("wrong");
      finishDuel(false, 0, true);
    }
  }, 200);
}
function setDuelRandom(v) {
  duelRandom = !!v;
  $("duelDiff").classList.toggle("off", duelRandom);
}
async function createDuel() {
  const btn = $("createBtn");
  btn.disabled = true;
  try {
    const total = Math.max(
      1,
      Math.min(100, Math.floor(Number($("duelRounds").value) || 10)),
    );
    $("duelRounds").value = total;
    D.client = sb();
    D.name = currentName();
    D.code = makeCode();
    D.host = true;
    D.hostId = D.myId;
    D.started = false;
    D.players = [{ id: D.myId, name: D.name }];
    D.settings = {
      difficulty: duelDiffSel,
      total,
      random: duelRandom,
      timer: duelTimerSel,
      tabs: !!$("duelTabs").checked,
    };
    D.total = total;
    D.score = { [D.myId]: 0 };
    await connectDuel();
    showLobby();
  } catch (e) {
    showToast(e.message || "Could not create duel.");
    await disconnectDuel(null);
  }
  btn.disabled = false;
}
function onJoinInput() {
  const inp = $("joinCode");
  inp.value = inp.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  inp.classList.remove("err");
  $("joinMsg").classList.remove("show");
  if (inp.value.length === 6) joinDuel(inp.value);
}
function joinFail(msg) {
  const inp = $("joinCode"),
    m = $("joinMsg");
  inp.value = "";
  inp.disabled = false;
  inp.classList.add("err", "shake");
  m.textContent = msg;
  m.classList.remove("note");
  m.classList.add("show");
  showToast(msg);
  setTimeout(() => inp.classList.remove("shake"), 450);
  clearTimeout(joinFail.t);
  joinFail.t = setTimeout(() => {
    m.classList.remove("show");
    inp.classList.remove("err");
  }, 9000);
  inp.focus();
}
function joinNote(msg) {
  const m = $("joinMsg");
  m.textContent = msg;
  m.classList.add("show", "note");
}
function failJoin(msg) {
  clearTimeout(joinFail.watch);
  clearInterval(joinFail.pres);
  try {
    disconnectDuel(null).catch(() => {});
  } catch (e) {}
  joinFail(msg);
}
async function joinDuel(code) {
  if (D.joining) return;
  D.joining = true;
  $("joinCode").disabled = true;
  joinNote("Looking for that duel...");
  clearTimeout(joinFail.t);
  $("joinCode").classList.remove("err");
  clearTimeout(joinFail.watch);
  clearInterval(joinFail.pres);
  joinFail.watch = setTimeout(() => {
    if (D.joining && !D.settings)
      failJoin("That duel code doesn't exist. Check it and try again.");
  }, 7000);
  try {
    D.client = sb();
    D.name = currentName();
    D.code = code;
    D.host = false;
    D.hostId = "";
    D.players = [];
    D.settings = null;
    D.started = false;
    await connectDuel();
    const t0 = Date.now();
    joinFail.pres = setInterval(() => {
      if (D.settings || !D.channel) {
        clearInterval(joinFail.pres);
        return;
      }
      let others = 1;
      try {
        others = Object.keys(D.channel.presenceState() || {}).filter(
          (k) => k !== D.myId,
        ).length;
      } catch (e) {}
      if (!others && Date.now() - t0 > 2500)
        failJoin("That duel code doesn't exist. Check it and try again.");
    }, 300);
    let tries = 0;
    const hello = () => {
      if (D.settings || !D.channel) return;
      if (tries++ >= 5) {
        failJoin("That duel code doesn't exist. Check it and try again.");
        return;
      }
      send("hello", { id: D.myId, name: D.name });
      D.helloTimer = setTimeout(hello, 800);
    };
    hello();
  } catch (e) {
    failJoin(e.message || "Couldn't connect. Check your connection.");
  }
}
const broadcastRoster = () =>
  send("roster", { players: D.players, hostId: D.myId, settings: D.settings });
async function connectDuel() {
  D.channel = D.client.channel("size-guesser-" + D.code, {
    config: { broadcast: { self: false }, presence: { key: D.myId } },
  });
  const on = (ev, fn) =>
    D.channel.on("broadcast", { event: ev }, ({ payload }) =>
      fn(payload || {}),
    );
  on("hello", (p) => {
    if (!D.host || !p.id) return;
    const known = D.players.find((x) => x.id === p.id);
    if (!known) {
      if (D.started) {
        send("denied", { to: p.id, reason: "started" });
        return;
      }
      if (D.players.length >= MAX_PLAYERS) {
        send("denied", { to: p.id, reason: "full" });
        return;
      }
      D.players.push({
        id: p.id,
        name: String(p.name || "Player").slice(0, 24),
      });
      D.score[p.id] = 0;
    } else known.name = String(p.name || known.name).slice(0, 24);
    broadcastRoster();
    updateLobby();
  });
  on("roster", (p) => {
    if (
      D.host ||
      !Array.isArray(p.players) ||
      !p.players.some((x) => x.id === D.myId)
    )
      return;
    const first = !D.settings;
    clearTimeout(D.helloTimer);
    D.settings = p.settings;
    D.total = p.settings.total;
    D.hostId = p.hostId;
    D.players = p.players;
    if (first) {
      D.score = {};
      D.players.forEach((x) => {
        D.score[x.id] = 0;
      });
      showLobby();
    } else if (!D.inMatch) updateLobby();
  });
  on("denied", (p) => {
    if (D.host || p.to !== D.myId) return;
    failJoin(
      p.reason === "full"
        ? "That duel is full."
        : "That duel has already started, so you can't join anymore.",
    );
  });
  on("kick", (p) => {
    if (!D.host && p.id === D.myId) {
      showToast("The host removed you from the duel.");
      disconnectDuel();
    }
  });
  on("match-start", (p) => {
    if (!D.host) {
      D.settings = p.settings;
      beginRound(p);
    }
  });
  on("new-round", (p) => {
    if (!D.host) beginRound(p);
  });
  on("done", (p) => {
    if (D.host) handleDone(p);
  });
  on("away", (p) => onAway(p));
  on("round-result", (p) => {
    if (!D.host) showRoundResult(p);
  });
  on("match-end", (p) => {
    if (!D.host) showMatchResult(p);
  });
  D.channel.on("presence", { event: "leave" }, ({ key }) => {
    if (key !== D.myId && D.channel) playerLeft(key);
  });
  await new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error("Could not connect. Check your connection.")),
      10000,
    );
    D.channel.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        clearTimeout(t);
        resolve();
      }
      if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
        clearTimeout(t);
        reject(new Error("Could not connect to the duel channel."));
      }
    });
  });
  await D.channel.track({ id: D.myId, name: D.name });
}
function playerLeft(id) {
  if (D.finished) return;
  if (D.host) {
    const i = D.players.findIndex((x) => x.id === id);
    if (i < 0) return;
    const gone = D.players.splice(i, 1)[0];
    delete D.answers[id];
    delete D.score[id];
    if (!D.inMatch) {
      broadcastRoster();
      updateLobby();
      return;
    }
    showToast(gone.name + " left the duel.");
    if (D.players.length < 2) {
      showToast("Everyone else left the duel.");
      disconnectDuel();
      return;
    }
    broadcastRoster();
    checkResolve();
  } else if (id === D.hostId) {
    showToast("The host left the duel.");
    disconnectDuel();
  }
}
function kickPlayer(id) {
  if (!D.host || D.inMatch || id === D.myId) return;
  const i = D.players.findIndex((x) => x.id === id);
  if (i < 0) return;
  send("kick", { id });
  D.players.splice(i, 1);
  delete D.score[id];
  broadcastRoster();
  updateLobby();
}
function showLobby() {
  clearTimeout(joinFail.watch);
  clearInterval(joinFail.pres);
  $("joinMsg").classList.remove("show", "note");
  D.joining = false;
  showView("lobbyView");
  $("lobbyCode").textContent = D.code;
  updateLobby();
}
const X_SM =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
function updateLobby() {
  const n = D.players.length;
  $("lobbyCount").textContent = n + (n === 1 ? " player" : " players");
  $("playerList").innerHTML = D.players
    .map((pl) => {
      const isHost = pl.id === D.hostId || (D.host && pl.id === D.myId);
      const me = pl.id === D.myId;
      return `<div class="pl-row"><span class="pl-name">${nameHTML(pl.name)}${me ? " <small>(you)</small>" : ""}</span>${isHost ? '<span class="pl-tag">HOST</span>' : ""}${D.host && !isHost ? `<button class="kick" onclick="kickPlayer('${esc(pl.id)}')" aria-label="Remove player" title="Remove player">${X_SM}</button>` : ""}</div>`;
    })
    .join("");
  $("lobbySettings").textContent = settingsText();
  const b = $("startBtn");
  b.disabled = !D.host || n < 2;
  b.textContent = D.host
    ? n < 2
      ? "Waiting for players..."
      : "Start duel (" + n + " players)"
    : "Waiting for host to start...";
}
function copyCode() {
  if (!navigator.clipboard?.writeText) {
    showToast("Duel code: " + D.code);
    return;
  }
  navigator.clipboard
    .writeText(D.code)
    .then(() => showToast("Duel code copied."))
    .catch(() => showToast("Duel code: " + D.code));
}
function startMatch() {
  if (!D.host || D.players.length < 2 || D.started) return;
  D.started = true;
  $("startBtn").disabled = true;
  D.score = {};
  D.players.forEach((x) => {
    D.score[x.id] = 0;
  });
  D.round = 0;
  D.streak = 0;
  hostNextRound("match-start");
}
async function hostNextRound(event = "new-round") {
  D.round++;
  const diff = D.settings.random
    ? LEVELS[Math.floor(Math.random() * LEVELS.length)]
    : D.settings.difficulty;
  const pick = chooseRound(diff);
  if (!D.channel) return;
  const payload = {
    settings: D.settings,
    total: D.total,
    round: D.round,
    pair: {
      r: pick.r,
      t: pick.t,
      seed: Math.floor(Math.random() * 4294967296),
    },
    score: D.score,
    diff,
    players: D.players,
  };
  send(event, payload);
  beginRound(payload);
}
function beginRound(p) {
  clearTimeout(D.nextTimer);
  clearTimeout(D.podTimer);
  stopConfetti();
  const pr = p.pair || {};
  if (
    !ITEMS[pr.r] ||
    !ITEMS[pr.t] ||
    pr.r === pr.t ||
    !Number.isFinite(pr.seed)
  )
    return;
  D.inMatch = true;
  D.finished = false;
  D.started = true;
  if (p.players) D.players = p.players;
  D.round = p.round;
  D.total = p.total;
  D.pair = { r: pr.r, t: pr.t };
  D.score = p.score;
  D.roundDiff = LEVELS.includes(p.diff) ? p.diff : D.settings.difficulty;
  D.answers = {};
  D.away = {};
  D.mine = false;
  renderAway();
  D.locked = true;
  D.resolved = false;
  D.roundStart = Date.now();
  D.rid++;
  $("lbOverlay").classList.remove("open");
  $("duelBody").classList.remove("waiting");
  $("duelWait").classList.remove("show");
  showView("duelView");
  $("duelRound").textContent =
    `Round ${p.round} / ${p.total}` +
    (D.settings.random ? " · " + LEVEL_NAMES[D.roundDiff] : "");
  $("duelScore").textContent = (D.score[D.myId] || 0).toLocaleString();
  setupRound("duel", pr.r, pr.t, pr.seed >>> 0, D.roundDiff);
  D.locked = false;
  startDuelTimer(D.settings.timer || 0);
}
function finishDuel(correct, err = 0, skipped = false) {
  if (D.locked) return;
  D.locked = true;
  const r = R.duel;
  if (r) r.locked = true;
  $("duelBody").classList.add("waiting");
  $("duelWait").classList.add("show");
  const secs = r ? (Date.now() - r.startedAt) / 1000 : 0;
  let points = 0;
  if (correct && r) {
    points = ptsFor(D.roundDiff, err, secs, D.streak);
    D.streak++;
    localStats((x) => {
      x.matched++;
      x.best = Math.max(x.best, D.streak);
      x.closest =
        x.closest === null ? pctOf(err) : Math.min(x.closest, pctOf(err));
    });
    srv("sz_duel_guess", { kind: "correct", err, secs: Math.max(0.5, secs) });
    sfx("correct");
  } else {
    D.streak = 0;
    if (!skipped)
      localStats((x) => {
        x.missed++;
      });
    srv("sz_duel_guess", {
      kind: skipped ? "skip" : "missed",
      err: 0,
      secs: 0,
    });
    sfx("lose");
  }
  if (r) revealRound("duel", null);
  const payload = { id: D.myId, correct: !!correct, points, cheat: !!D.mine };
  if (D.host) handleDone(payload);
  else send("done", payload);
}
function handleDone(p) {
  if (
    !p?.id ||
    D.answers[p.id] ||
    D.resolved ||
    !D.players.some((x) => x.id === p.id)
  )
    return;
  D.answers[p.id] = {
    id: p.id,
    cheat: !!p.cheat,
    correct: !!p.correct,
    points: Math.max(0, Math.min(30000, Number(p.points) || 0)),
  };
  checkResolve();
}
function checkResolve() {
  if (D.resolved || !D.inMatch || !D.host) return;
  if (D.players.every((pl) => D.answers[pl.id])) resolveRound();
}
function resolveRound() {
  if (D.resolved) return;
  D.resolved = true;
  const prev = { ...D.score };
  Object.values(D.answers).forEach((a) => {
    D.score[a.id] = (D.score[a.id] || 0) + (a.correct ? a.points : 0);
  });
  const names = {};
  D.players.forEach((pl) => {
    names[pl.id] = pl.name;
  });
  const payload = {
    score: D.score,
    prev,
    answers: D.answers,
    pair: D.pair,
    round: D.round,
    total: D.total,
    names,
  };
  if (D.round >= D.total) {
    const res = { score: D.score, names };
    send("match-end", res);
    showMatchResult(res);
    return;
  }
  send("round-result", payload);
  showRoundResult(payload);
  D.nextTimer = setTimeout(() => hostNextRound(), 6500);
}
function countUp(el, from, to, ms = 800) {
  const t0 = performance.now();
  const f = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = Math.round(
      from + (to - from) * (1 - Math.pow(1 - k, 3)),
    ).toLocaleString();
    if (k < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}
function showRoundResult(p) {
  D.locked = true;
  D.score = p.score;
  $("duelScore").textContent = (p.score[D.myId] || 0).toLocaleString();
  const ids = Object.keys(p.score);
  const prevOrder = [...ids].sort(
    (a, b) =>
      (p.prev[b] || 0) - (p.prev[a] || 0) || ids.indexOf(a) - ids.indexOf(b),
  );
  const newOrder = [...ids].sort(
    (a, b) =>
      (p.score[b] || 0) - (p.score[a] || 0) ||
      prevOrder.indexOf(a) - prevOrder.indexOf(b),
  );
  const last = p.round >= p.total;
  const rows = ids
    .map((id) => {
      const me = id === D.myId;
      return `<div class="lb-row ${prevOrder[0] === id ? "first" : ""}" data-id="${esc(id)}" style="--i:${prevOrder.indexOf(id)}">
      <span class="rank">${prevOrder.indexOf(id) + 1}</span>
      <span class="nm">${nameHTML(p.names?.[id] || "Player")}${me ? " <small>(you)</small>" : ""}${p.answers[id]?.cheat ? ' <i class="mr-cheat">CHEATING</i>' : ""}</span>
      <span class="gain">+${p.answers[id]?.correct ? p.answers[id].points : 0}</span>
      <span class="pts">${(p.prev[id] || 0).toLocaleString()}</span></div>`;
    })
    .join("");
  const ov = $("lbOverlay");
  ov.innerHTML = `<div class="lb-inner">
    <div class="eyebrow">ROUND ${p.round} / ${p.total}</div>
    <h2>Leaderboard</h2>
    ${itemRevealHTML(p.pair)}
    <div class="lb" style="height:${ids.length * 72}px">${rows}</div>
    <div class="lb-foot">${last ? "Final results coming up..." : "Next object coming up..."}</div></div>`;
  ov.classList.add("open");
  setTimeout(() => {
    ov.querySelectorAll(".lb-row").forEach((row) => {
      const id = row.dataset.id,
        idx = newOrder.indexOf(id);
      row.style.setProperty("--i", idx);
      row.classList.toggle("first", idx === 0);
      row.querySelector(".rank").textContent = idx + 1;
      row.querySelector(".gain").classList.add("show");
      countUp(row.querySelector(".pts"), p.prev[id] || 0, p.score[id] || 0);
    });
    if (newOrder.join() !== prevOrder.join()) sfx("advance");
  }, 1100);
}
function showMatchResult(p) {
  if (D.finished) return;
  D.finished = true;
  clearTimeout(D.nextTimer);
  D.inMatch = false;
  $("lbOverlay").classList.remove("open");
  const rows = Object.keys(p.score)
    .map((id) => ({
      id,
      me: id === D.myId,
      score: p.score[id] || 0,
      name: p.names?.[id] || "Player",
    }))
    .sort((a, b) => b.score - a.score);
  let pl = 0,
    prevS = null;
  rows.forEach((r, i) => {
    if (r.score !== prevS) pl = i + 1;
    r.place = pl;
    prevS = r.score;
  });
  const tie = rows.filter((r) => r.place === 1).length > 1;
  {
    const won = !tie && !!rows[0]?.me;
    localStats((x) => {
      x.duels++;
      if (won) x.wins++;
    });
    srv("sz_duel", { won });
  }
  const H = { 1: 200, 2: 150, 3: 110 };
  const col = (r) => `<div class="pd-col ${r.place === 1 ? "first" : ""}">
    <div class="pd-av">${r.place === 1 && !tie ? CROWN_SVG : ""}${esc((r.name || "?").trim().charAt(0).toUpperCase())}</div>
    <div class="pd-name">${nameHTML(r.name)}${r.me ? " <small>(you)</small>" : ""}</div>
    <div class="pd-score">${r.score.toLocaleString()}</div>
    <div class="pd-block" data-h="${H[r.place] || 110}">${r.place}</div></div>`;
  const order =
    rows.length >= 2 ? [rows[1], rows[0], rows[2]].filter(Boolean) : [rows[0]];
  const rest = rows.slice(3);
  $("podium").innerHTML = `
    <div class="pd-intro" id="pdIntro"><div class="eyebrow">THE RESULTS ARE IN</div><h2>And the winner is...</h2>
      <div class="pd-bars">${Array.from({ length: 13 }, (_, i) => `<i style="--k:${i}"></i>`).join("")}</div></div>
    <div class="pd-stage" id="pdStage">
      <h1 class="pd-title">${tie ? "It's a tie!" : nameHTML(rows[0].name) + " wins!"}</h1>
      <div class="pd-podium">${order.map(col).join("")}</div>
      ${rest.length ? `<div class="pd-rest">${rest.map((r) => `<div class="pd-rest-row"><span class="rn">${r.place}</span><span class="nm">${nameHTML(r.name)}${r.me ? " <small>(you)</small>" : ""}</span><b>${r.score.toLocaleString()}</b></div>`).join("")}</div>` : ""}
      <button class="primary" style="min-width:160px" onclick="goHome()">Home</button></div>`;
  showView("resultView");
  buildUp(3200);
  clearTimeout(D.podTimer);
  D.podTimer = setTimeout(() => {
    if (!$("resultView").classList.contains("active")) return;
    $("pdIntro").style.display = "none";
    $("pdStage").classList.add("show");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.querySelectorAll(".pd-block").forEach((b) => {
          b.style.height = b.dataset.h + "px";
        });
      }),
    );
    fanfare();
    confetti(true);
  }, 3300);
}
async function disconnectDuel(view = "multiplayerView") {
  clearTimeout(D.helloTimer);
  clearTimeout(D.nextTimer);
  clearTimeout(D.podTimer);
  D.rid++;
  stopConfetti();
  $("lbOverlay").classList.remove("open");
  const ch = D.channel,
    cl = D.client;
  D.channel = null;
  D.players = [];
  D.hostId = "";
  D.settings = null;
  D.inMatch = false;
  D.started = false;
  D.joining = false;
  D.resolved = true;
  D.finished = false;
  $("joinCode").disabled = false;
  $("joinCode").value = "";
  if (view) showView(view);
  if (ch) {
    try {
      await Promise.race([ch.unsubscribe(), delay(1500)]);
    } catch (e) {}
    try {
      cl?.removeChannel(ch);
    } catch (e) {}
  }
}
let PROFILES = [];
const liveProfiles = () => PROFILES;
const BOARDS = {
  score: {
    val: (p) => Number(p.score),
    fmt: (v) => v.toLocaleString(),
    dir: -1,
  },
  matched: {
    label: "Sizes matched",
    val: (p) => Number(p.matched),
    fmt: (v) => v.toLocaleString(),
    dir: -1,
  },
  accuracy: {
    label: "Accuracy",
    val: (p) =>
      Number(p.matched) + Number(p.missed) >= 10
        ? Number(p.matched) / (Number(p.matched) + Number(p.missed))
        : null,
    fmt: (v) => Math.round(v * 1000) / 10 + "%",
    dir: -1,
    note: "Needs at least 10 attempts to qualify.",
  },
  streak: {
    label: "Best streak",
    val: (p) => Number(p.best_streak),
    fmt: (v) => v.toLocaleString(),
    dir: -1,
  },
  closest: {
    label: "Closest match",
    val: (p) =>
      p.closest === null || p.closest === undefined ? null : Number(p.closest),
    fmt: fmtClosest,
    dir: 1,
    note: "The smallest error on a size you matched.",
  },
  duels: {
    label: "Duels played",
    val: (p) => Number(p.duels),
    fmt: (v) => v.toLocaleString(),
    dir: -1,
  },
  wins: {
    label: "Duels won",
    val: (p) => Number(p.wins),
    fmt: (v) => v.toLocaleString(),
    dir: -1,
  },
};
const STAT_KEYS = ["matched", "accuracy", "streak", "closest", "duels", "wins"];
function boardRows(key) {
  const b = BOARDS[key];
  const rows = liveProfiles()
    .map((p) => ({ p, v: b.val(p) }))
    .filter((r) => r.v !== null && Number.isFinite(r.v) && r.v > 0);
  rows.sort(
    (a, z) =>
      b.dir * (a.v - z.v) ||
      String(a.p.username).localeCompare(String(z.p.username)),
  );
  let rank = 0,
    prev = null;
  rows.forEach((r, i) => {
    if (prev === null || r.v !== prev) rank = i + 1;
    r.rank = rank;
    prev = r.v;
  });
  return rows;
}
function recomputeRanks() {
  const src = {};
  Object.keys(BOARDS).forEach((k) =>
    boardRows(k).forEach((r) => {
      if (r.rank > 3) return;
      const n = String(r.p.username).toLowerCase();
      (src[n] = src[n] || []).push({ rank: r.rank, key: k });
    }),
  );
  RANK_SRC = src;
}
let boardsT = 0;
function boardsChanged() {
  clearTimeout(boardsT);
  boardsT = setTimeout(() => {
    recomputeRanks();
    updateUserCard();
    updateScoreChip();
    if ($("lbModal").classList.contains("open")) renderLb();
    if (D.channel && $("lobbyView").classList.contains("active")) updateLobby();
  }, 60);
}
async function fetchProfiles() {
  try {
    const { data, error } = await sb()
      .from("size_stats")
      .select("id,username,score,matched,missed,best_streak,duels,wins,closest")
      .limit(5000);
    if (!error && Array.isArray(data)) {
      PROFILES = data;
      boardsChanged();
    }
  } catch (e) {}
}
let boardSub = null;
function subscribeBoards() {
  if (boardSub || !window.supabase) return;
  try {
    boardSub = sb()
      .channel("sz-stats-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "size_stats" },
        (pl) => {
          if (pl.eventType === "DELETE")
            PROFILES = PROFILES.filter((p) => p.id !== pl.old?.id);
          else if (pl.new?.id) {
            const i = PROFILES.findIndex((p) => p.id === pl.new.id);
            if (i >= 0) PROFILES[i] = { ...PROFILES[i], ...pl.new };
            else PROFILES.push(pl.new);
            if (
              ME &&
              pl.new.id === ME.id &&
              pl.new.username &&
              pl.new.username !== ME.username
            ) {
              ME.username = pl.new.username;
              refreshIdentity();
              renderAccount();
            }
          }
          boardsChanged();
        },
      )
      .subscribe();
  } catch (e) {}
}
function updateScoreChip() {
  const el = $("soloScore");
  if (!el) return;
  const v = stats.score || 0;
  el.textContent = v.toLocaleString();
  let t = "";
  if (ME && ME.id && v > 0) {
    const r = boardRows("score").find((x) => x.p.id === ME.id);
    if (r) t = r.rank <= 10 ? "#" + r.rank : "10+";
  }
  $("soloRank").textContent = t;
}
const LB = { tab: "score", stat: "matched" };
function openLb(tab) {
  closeMenu();
  if (tab === "score" || tab === "stats") LB.tab = tab;
  $("lbModal").classList.add("open");
  renderLb();
  fetchProfiles();
}
function closeLb() {
  $("lbModal").classList.remove("open");
}
function lbRow(r, i) {
  const me = ME && r.p.id === ME.id;
  const key = LB.tab === "stats" ? LB.stat : LB.tab;
  return `<div class="lbr ${r.rank <= 3 ? "p" + r.rank : ""} ${me ? "me" : ""}" style="animation-delay:${i * 25}ms"><span class="lbr-rank">${r.rank}</span><span class="lbr-name">${nameHTML(r.p.username)}${me ? " <small>(you)</small>" : ""}</span><b>${BOARDS[key].fmt(r.v)}</b></div>`;
}
function renderLb() {
  const isStats = LB.tab === "stats";
  $("lbTabs").innerHTML = [
    ["score", "Score"],
    ["stats", "Statistics"],
  ]
    .map(
      ([k, l]) =>
        `<button class="tab ${LB.tab === k ? "sel" : ""}" onclick="setLbTab('${k}')">${l}</button>`,
    )
    .join("");
  $("lbStats").hidden = !isStats;
  if (isStats) {
    $("lbTiles").innerHTML = statTiles();
    $("lbChips").innerHTML = STAT_KEYS.map(
      (k) =>
        `<button class="chip ${LB.stat === k ? "sel" : ""}" onclick="setLbStat('${k}')">${BOARDS[k].label}</button>`,
    ).join("");
  }
  const key = isStats ? LB.stat : LB.tab;
  const rows = boardRows(key);
  let html = rows.slice(0, 10).map(lbRow).join("");
  if (!rows.length)
    html =
      '<div class="lb-note">Nobody is on this leaderboard yet. Be the first!</div>';
  let mine = "";
  if (ME && ME.id) {
    const idx = rows.findIndex((r) => r.p.id === ME.id);
    if (idx >= 10)
      mine = '<div class="lb-dots">• • •</div>' + lbRow(rows[idx], 0);
    else if (idx < 0)
      mine =
        '<div class="lb-note">You\'re not on this leaderboard yet.' +
        (BOARDS[key].note ? " " + BOARDS[key].note : "") +
        "</div>";
  }
  if (isStats && BOARDS[key].note && ME && !mine.includes("not on"))
    mine +=
      '<div class="lb-note" style="padding-top:8px">' +
      BOARDS[key].note +
      "</div>";
  $("lbList").innerHTML = html;
  $("lbMine").innerHTML = mine;
}
function setLbTab(t) {
  LB.tab = t;
  renderLb();
}
function setLbStat(k) {
  LB.stat = k;
  renderLb();
}
function toggleMenu(e) {
  e.stopPropagation();
  $("menuPop").classList.toggle("open");
}
function closeMenu() {
  $("menuPop").classList.remove("open");
}
document.addEventListener("click", (e) => {
  if (!e.target.closest(".user-card")) closeMenu();
});
const TOKEN_RE = /^[A-Za-z0-9]{20,128}$/;
const api = async (name, args) => {
  const { data, error } = await sb().rpc(name, args);
  if (error) throw error;
  return data;
};
function apiMsg(e) {
  const m =
    String((e && e.message) || e || "") +
    " " +
    String((e && (e.code || e.details)) || "");
  if (/username_taken/.test(m)) return "That username is already taken.";
  if (/username_invalid/.test(m))
    return "Usernames are 3–20 characters: letters (A–Z, Å, Ä, Ö), numbers and . , ! ? ' - _";
  if (/invalid_token/.test(m))
    return "That data token doesn't match any account.";
  if (/could not find the function|schema cache|PGRST202|42883/i.test(m))
    return "The server isn't set up yet. Run supabase-size-setup.sql in Supabase first.";
  return "Couldn't reach the server. Check your connection and try again.";
}
let warnedAt = 0;
let pendingOps = 0;
let resyncing = false;
let srvChain = Promise.resolve();
function srv(name, args = {}) {
  if (!ME || !ME.token) return Promise.resolve(null);
  pendingOps++;
  const run = () =>
    api(name, { t: ME.token, ...args })
      .then((st) => {
        pendingOps--;
        if (st && st.id)
          applyState(pendingOps > 0 ? { ...st, stats: null } : st);
        return st;
      })
      .catch((e) => {
        pendingOps--;
        if (Date.now() - warnedAt > 20000) {
          warnedAt = Date.now();
          showToast("Couldn't save your progress. " + apiMsg(e));
        }
        if (pendingOps === 0 && !resyncing && name !== "sz_get") {
          resyncing = true;
          srv("sz_get").finally(() => {
            resyncing = false;
          });
        }
        return null;
      });
  const p = srvChain.then(run, run);
  srvChain = p.catch(() => {});
  return p;
}
function localStats(fn) {
  if (!ME || !ME.token) return;
  fn(stats);
  const r = PROFILES.find((p) => p.id === ME.id);
  if (r)
    Object.assign(r, {
      score: stats.score,
      matched: stats.matched,
      missed: stats.missed,
      best_streak: stats.best,
      duels: stats.duels,
      wins: stats.wins,
      closest: stats.closest,
    });
  boardsChanged();
}
const rowToStats = (r) => ({
  matched: Number(r.matched) || 0,
  missed: Number(r.missed) || 0,
  best: Number(r.best_streak) || 0,
  duels: Number(r.duels) || 0,
  wins: Number(r.wins) || 0,
  score: Number(r.score) || 0,
  closest:
    r.closest === null || r.closest === undefined ? null : Number(r.closest),
});
function applyState(st) {
  ME = { ...(ME || {}), id: st.id, username: st.username };
  if (st.token) ME.token = st.token;
  lsSet("sg_name", st.username);
  if (st.stats) {
    stats = rowToStats(st.stats);
    const row = { ...st.stats, id: st.id, username: st.username };
    const i = PROFILES.findIndex((p) => p.id === st.id);
    if (i >= 0) PROFILES[i] = row;
    else PROFILES.push(row);
  }
  refreshIdentity();
  renderAccount();
}
function refreshIdentity() {
  D.name = currentName();
  updateUserCard();
  updateScoreChip();
  boardsChanged();
}
const wcMsg = (t) => {
  const m = $("wcMsg");
  m.textContent = t || "";
  m.className = "auth-msg" + (t ? " show" : "");
};
function wcShow(which) {
  ["new", "token", "done"].forEach((k) => {
    $("wc_" + k).hidden = k !== which;
  });
  wcMsg("");
}
function maybeWelcome() {
  if (!lsGet(TOKEN_KEY, "")) {
    wcShow("new");
    $("welcomeModal").classList.add("open");
  }
}
async function createAccount() {
  const name = $("wcName").value.trim(),
    bad = checkUsername(name);
  if (bad) {
    wcMsg(bad);
    return;
  }
  const btn = $("wcCreate");
  btn.disabled = true;
  try {
    const st = await api("sz_create", { u: name });
    lsSet(TOKEN_KEY, st.token);
    ME = { token: st.token };
    applyState(st);
    $("wcTokenOut").value = st.token;
    wcShow("done");
  } catch (e) {
    wcMsg(apiMsg(e));
  } finally {
    btn.disabled = false;
  }
}
async function loadToken(raw) {
  const t = String(raw || "").replace(/\s/g, "");
  if (!TOKEN_RE.test(t)) throw new Error("invalid_token");
  const st = await api("sz_get", { t });
  if (!st || !st.id) throw new Error("invalid_token");
  lsSet(TOKEN_KEY, t);
  ME = { token: t };
  applyState(st);
}
async function wcLoad() {
  const btn = $("wcLoad");
  btn.disabled = true;
  try {
    await loadToken($("wcToken").value);
    $("welcomeModal").classList.remove("open");
    showToast("Welcome back, " + ME.username + "!");
  } catch (e) {
    wcMsg(apiMsg(e));
  } finally {
    btn.disabled = false;
  }
}
function wcDone() {
  $("welcomeModal").classList.remove("open");
}
function copyText(v, inp) {
  const ok = () => showToast("Data token copied.");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(v)
      .then(ok)
      .catch(() => fallbackCopy(inp, ok));
  } else fallbackCopy(inp, ok);
}
function fallbackCopy(inp, ok) {
  try {
    inp.focus();
    inp.select();
    document.execCommand("copy")
      ? ok()
      : showToast("Select the token and copy it.");
  } catch (e) {
    showToast("Select the token and copy it.");
  }
}
const copyToken = () => copyText($("ac_token").value, $("ac_token"));
const PEN =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
const CHECK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 5 5 9-11"/></svg>';
const COPY =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
let EDIT = false;
const authMsg = (t, good) => {
  const m = $("authMsg");
  m.textContent = t || "";
  m.className = "auth-msg" + (t ? " show" : "") + (good ? " good" : "");
};
function setEditBtn(editing) {
  const b = $("ac_btn_username");
  b.innerHTML = editing ? CHECK : PEN;
  b.setAttribute("aria-label", editing ? "Confirm" : "Edit username");
  b.onclick = () => (editing ? commitEdit() : startEdit());
}
function resetField() {
  const i = $("ac_username");
  i.readOnly = true;
  i.classList.remove("editing");
  i.value = (ME && ME.username) || currentName();
  setEditBtn(false);
}
function renderAccount() {
  if (!$("ac_username")) return;
  if (!EDIT) resetField();
  $("ac_token").value = (ME && ME.token) || "";
  $("ac_btn_copy").innerHTML = COPY;
  $("ac_btn_switch").innerHTML = CHECK;
}
function startEdit() {
  EDIT = true;
  authMsg("");
  const i = $("ac_username");
  i.readOnly = false;
  i.classList.add("editing");
  setEditBtn(true);
  i.focus();
}
function cancelEdit() {
  if (!EDIT) return;
  EDIT = false;
  resetField();
}
async function commitEdit() {
  if (!EDIT) return;
  const v = $("ac_username").value.trim(),
    bad = checkUsername(v);
  if (bad) {
    authMsg(bad);
    return;
  }
  if (ME && v === ME.username) {
    cancelEdit();
    return;
  }
  try {
    const st = await api("sz_set_username", { t: ME.token, u: v });
    EDIT = false;
    applyState(st);
    authMsg("");
    showToast("Username updated.");
  } catch (e) {
    authMsg(apiMsg(e));
  }
}
function toggleSwitch() {
  const b = $("tokenSwitch");
  b.hidden = !b.hidden;
  if (!b.hidden) $("tokenIn").focus();
  authMsg("");
}
async function commitSwitch() {
  const v = $("tokenIn").value.replace(/\s/g, "");
  if (!v) {
    authMsg("Paste a data token first.");
    return;
  }
  if (ME && v === ME.token) {
    $("tokenSwitch").hidden = true;
    $("tokenIn").value = "";
    return;
  }
  try {
    await loadToken(v);
    $("tokenIn").value = "";
    $("tokenSwitch").hidden = true;
    authMsg("");
    showToast("Switched to " + ME.username + ".");
  } catch (e) {
    authMsg(apiMsg(e));
  }
}
async function initAccount() {
  if (!window.supabase) {
    showToast("Couldn't load the online library. Reload the page.");
    return;
  }
  try {
    subscribeBoards();
    fetchProfiles();
  } catch (e) {}
  const t = lsGet(TOKEN_KEY, "");
  if (!t) return;
  ME = { token: t, username: lsGet("sg_name", "") };
  try {
    const st = await api("sz_get", { t });
    if (st && st.id) applyState(st);
    else {
      ME = null;
      lsSet(TOKEN_KEY, "");
      lsSet("sg_name", "");
      refreshIdentity();
      maybeWelcome();
      showToast(
        "That account wasn't found. Create a new one or enter another data token.",
      );
    }
  } catch (e) {}
}
const updateUserCard = () => {
  $("userName").innerHTML = nameHTML(currentName());
};
function setRange(id, textId) {
  const r = $(id);
  r.style.setProperty("--v", r.value * 100 + "%");
  $(textId).textContent = Math.round(r.value * 100) + "%";
}
function openSettings() {
  closeMenu();
  $("tokenSwitch").hidden = true;
  authMsg("");
  $("sfxVol").value = sfxVol();
  $("autoDiff").checked = lsGet("sz_autodiff", "0") === "1";
  $("autoNext").checked = lsGet("sz_autonext", "1") === "1";
  $("unitsImp").checked = imperial();
  setRange("sfxVol", "sfxVolText");
  EDIT = false;
  renderAccount();
  $("settingsModal").classList.add("open");
}
function closeSettings() {
  cancelEdit();
  $("tokenSwitch").hidden = true;
  $("settingsModal").classList.remove("open");
}
async function saveSettings() {
  if (EDIT) {
    await commitEdit();
    if (EDIT) return;
  }
  lsSet("sg_sfx", $("sfxVol").value);
  lsSet("sz_autodiff", $("autoDiff").checked ? "1" : "0");
  lsSet("sz_autonext", $("autoNext").checked ? "1" : "0");
  lsSet("sz_imp", $("unitsImp").checked ? "1" : "0");
  refreshTexts();
  closeSettings();
}
$("autoDiff").onchange = () =>
  lsSet("sz_autodiff", $("autoDiff").checked ? "1" : "0");
$("autoNext").onchange = () =>
  lsSet("sz_autonext", $("autoNext").checked ? "1" : "0");
$("unitsImp").onchange = () => {
  lsSet("sz_imp", $("unitsImp").checked ? "1" : "0");
  refreshTexts();
};
$("sfxVol").oninput = () => setRange("sfxVol", "sfxVolText");
$("sfxVol").onchange = () => {
  lsSet("sg_sfx", $("sfxVol").value);
  sfx("correct");
};
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if ($("trModal").classList.contains("open")) {
    closeTrophies();
    return;
  }
  if ($("lbModal").classList.contains("open")) closeLb();
  else if ($("settingsModal").classList.contains("open")) closeSettings();
  closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key !== "Enter")
    return;
  const a = document.activeElement,
    tag = a ? a.tagName : "";
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (a && a.isContentEditable)
  )
    return;
  if (
    document.querySelector(".modal-back.open") ||
    $("lbOverlay").classList.contains("open")
  )
    return;
  const p = $("gameView").classList.contains("active")
    ? "solo"
    : $("duelView").classList.contains("active")
      ? "duel"
      : null;
  if (!p) return;
  if (p === "solo" && R.solo && R.solo.locked) {
    if ($("soloResult").style.display === "block") {
      e.preventDefault();
      nextSolo();
    }
    return;
  }
  if (!canTouch(p)) return;
  e.preventDefault();
  if (tag === "BUTTON") a.blur();
  lockIn(p);
});
function matchActive() {
  return $("duelView").classList.contains("active") && D.inMatch && !D.finished;
}
document.body.insertAdjacentHTML(
  "beforeend",
  `<div class="modal-back" id="leaveModal" role="dialog" aria-modal="true" aria-labelledby="leaveT" onclick="if (event.target === this) closeLeave(false)"><div class="sheet leave"><div class="lv-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19Z"/><path d="M12 10v4.5M12 17.6v.1"/></svg></div><h2 id="leaveT">Leave this match?</h2><p>You will lose your progress for this match.</p><div class="lv-stats" id="leaveStats"></div><div class="lv-actions"><button class="primary" id="leaveStay" onclick="closeLeave(false)">Keep playing</button><button class="lv-go" onclick="closeLeave(true)">Leave match</button></div></div></div>`,
);
let leaveCb = null;
function leaveStats() {
  const mine = (D.score && D.score[D.myId]) || 0;
  $("leaveStats").innerHTML =
    `<span><small>ROUND</small><b>${D.round} / ${D.total}</b></span><span><small>POINTS</small><b>${mine.toLocaleString()}</b></span><span><small>PLAYERS</small><b>${D.players.length}</b></span>`;
}
function openLeave(fn) {
  if ($("leaveModal").classList.contains("open")) return;
  leaveCb = fn;
  leaveStats();
  $("leaveModal").classList.add("open");
  setTimeout(() => {
    try {
      $("leaveStay").focus();
    } catch (e) {}
  }, 60);
}
function closeLeave(go) {
  $("leaveModal").classList.remove("open");
  const f = leaveCb;
  leaveCb = null;
  if (go && f) f();
}
let backArmed = false,
  backIgnore = 0;
function armBack() {
  if (backArmed) return;
  backArmed = true;
  try {
    history.pushState({ lv: 1 }, "");
  } catch (e) {}
}
function disarmBack() {
  if (!backArmed) return;
  backArmed = false;
  try {
    if (history.state && history.state.lv) {
      backIgnore++;
      history.back();
    }
  } catch (e) {}
}
window.addEventListener("popstate", () => {
  if (backIgnore) {
    backIgnore--;
    return;
  }
  if (matchActive()) {
    try {
      history.pushState({ lv: 1 }, "");
    } catch (e) {}
    openLeave(() => disconnectDuel());
  } else backArmed = false;
});
function guardLeave(fn) {
  if (matchActive()) openLeave(fn);
  else fn();
}
const tryHome = () => guardLeave(goHome);
window.addEventListener("beforeunload", (e) => {
  if (matchActive()) {
    e.preventDefault();
    e.returnValue = "You will lose your progress for this match.";
    return e.returnValue;
  }
});
document.addEventListener(
  "keydown",
  (e) => {
    if (!$("leaveModal").classList.contains("open")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeLeave(false);
    } else if (e.key === "Enter") e.stopPropagation();
  },
  true,
);
$("soloStack").innerHTML =
  `<div class="reg-row"><button class="back" onclick="leaveGame()" aria-label="Back">${BACK_SVG}</button><button class="score-chip" onclick="openLb('score')" aria-label="Open leaderboard"><span id="soloScore">0</span><span class="rk" id="soloRank"></span></button></div>
  <div id="soloBody" class="game-body"><div class="diff" id="soloDiff"></div>${gameHTML("solo")}</div><div id="soloResult" style="display:none"></div>`;
$("duelStack").innerHTML =
  `<div class="duel-top"><button class="back" onclick="guardLeave(() => disconnectDuel())" aria-label="Back">${BACK_SVG}</button><span id="duelRound">Round 1 / 10</span><span class="rg-cheat" id="duelCheat" hidden></span><span class="duel-right"><span class="dtimer" id="duelTimer"></span><span class="score" id="duelScore">0</span></span></div>
  <div class="duel-wrap"><div id="duelBody" class="game-body">${gameHTML("duel")}</div><div class="cheat-note" id="duelCheatNote" hidden></div><div id="duelWait" class="wait"><i></i>Waiting for the other players...</div></div>`;
bindStage("solo");
bindStage("duel");
renderDiff("duelDiff", duelDiffSel, (l) => {
  duelDiffSel = l;
});
$("timerMenu").innerHTML = TIMERS.map(
  ([v, l]) =>
    `<button type="button" class="dd-item${v === 0 ? " sel" : ""}" data-v="${v}" onclick="pickTimer(${v})">${l}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10" /></svg></button>`,
).join("");
recomputeRanks();
updateUserCard();
updateScoreChip();
initAccount();
document.addEventListener("keydown", (e) => {
  if (
    e.repeat ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    (e.key !== "Enter" && e.key !== " ")
  )
    return;
  const r = document.getElementById("soloResult"),
    b = r && r.style.display === "block" && r.querySelector(".res-next");
  if (
    !b ||
    r.classList.contains("hold") ||
    document.querySelector(".modal-back.open") ||
    Date.now() - (window.__resAt || 0) < 450
  )
    return;
  e.preventDefault();
  b.click();
});
(function intro() {
  const el = document.getElementById("intro");
  setTimeout(() => el.classList.add("out"), 2800);
  setTimeout(() => el.remove(), 3300);
  maybeWelcome();
})();
