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
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/\s-\s.*$/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const tk = (t) => norm(t.title) + "|" + norm(t.artist);
function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const vol = () => Number(lsGet("sg_music", 0.8));
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
  score: "High score",
  matches: "Matches played",
  best_round: "Best graph",
  best_acc: "Best match",
  duels: "Duels played",
  wins: "Duels won",
};
const RANK_WORD = { 1: "1st", 2: "2nd", 3: "3rd" };
function rankTip(name) {
  const src = RANK_SRC[String(name || "").toLowerCase()];
  if (!src || !src.length) return "";
  const by = {};
  src.forEach((x) => {
    (by[x.rank] = by[x.rank] || []).push(BOARD_LABEL[x.key] || x.key);
  });
  return Object.keys(by)
    .sort()
    .map((r) => "#" + r + " in " + by[r].join(", "))
    .join("\n");
}
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
  high: 0,
  matches: 0,
  graphs: 0,
  best: 0,
  acc: 0,
  duels: 0,
  wins: 0,
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
  srv("gg_reset").then((st) =>
    showToast(
      st
        ? "All your statistics and scores were reset."
        : "Couldn't reset right now.",
    ),
  );
}
function statTiles() {
  return [
    [stats.high, "High score"],
    [stats.matches, "Matches played"],
    [stats.best, "Best graph"],
    [stats.acc ? stats.acc + "%" : "–", "Best match"],
    [stats.duels, "Duels played"],
    [stats.wins, "Duels won"],
  ]
    .map(
      ([v, l]) =>
        `<div class="stat-tile"><b>${typeof v === "number" ? v.toLocaleString() : v}</b><span>${l}</span></div>`,
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
  "setupView",
  "gameView",
  "matchView",
  "multiplayerView",
  "lobbyView",
  "duelView",
  "resultView",
];
function showView(id) {
  document.body.classList.remove("noscroll");
  VIEWS.forEach((v) => $(v).classList.remove("active"));
  void $(id).offsetWidth;
  $(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (id === "gameView" || id === "duelView") armBack();
  else disarmBack();
}
function goHome() {
  S.token++;
  stopRoundTimer("solo");
  M = null;
  closeSoloResult();
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
const TOPICS = window.GG_TOPICS || [];
const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
const IC = (p) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const CATS = [
  {
    k: "games",
    n: "Games",
    s: "Video games, board games & launches",
    h: 150,
    ic: IC(
      '<rect x="2" y="6" width="20" height="12" rx="6"/><path d="M7 10v4M5 12h4"/><circle cx="15.5" cy="13" r="1"/><circle cx="18" cy="11" r="1"/>',
    ),
  },
  {
    k: "screen",
    n: "Screen",
    s: "Films, series & cartoons",
    h: 350,
    ic: IC(
      '<rect x="3" y="9" width="18" height="11" rx="2"/><path d="m3 9 2.6-5 3.2.7L6 9.5M9.8 9l2.6-5 3.2.7L12.8 9.5M16.6 9l2.6-4.6 2 .5"/>',
    ),
  },
  {
    k: "music",
    n: "Music",
    s: "Artists, hits & tours",
    h: 178,
    ic: IC(
      '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="16" r="2.6"/>',
    ),
  },
  {
    k: "web",
    n: "Web & Tech",
    s: "Apps, coins, gadgets & trends",
    h: 214,
    ic: IC(
      '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    ),
  },
  {
    k: "sports",
    n: "Sports",
    s: "Teams, stars & tournaments",
    h: 32,
    ic: IC(
      '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    ),
  },
  {
    k: "world",
    n: "World",
    s: "Events, seasons & food",
    h: 272,
    ic: IC(
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z"/>',
    ),
  },
  {
    k: "mix",
    n: "Surprise me",
    s: "A new topic every graph",
    h: 46,
    ic: IC(
      '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.1" fill="currentColor"/><circle cx="15" cy="9" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="9" cy="15" r="1.1" fill="currentColor"/><circle cx="15" cy="15" r="1.1" fill="currentColor"/>',
    ),
  },
];
const CAT = Object.fromEntries(CATS.map((c) => [c.k, c]));
const REAL_CATS = CATS.filter((c) => c.k !== "mix").map((c) => c.k);
const DIFF_MULT = {
  easy: 1,
  medium: 1.25,
  hard: 1.5,
  expert: 1.9,
  impossible: 2.4,
};
const DIFF_FEEL = {
  easy: "Well known",
  medium: "Mixed",
  hard: "Tricky",
  expert: "Obscure",
  impossible: "Chaos",
};
const TIME = { easy: 60, medium: 60, hard: 75, expert: 90, impossible: 90 };
const MATCH_ROUNDS = 5;
const GRID_Y = 16;
const matchOf = (err) => Math.pow(Math.max(0, 1 - err / 40), 1.4);
const ptsOf = (diff, m) =>
  Math.min(3000, Math.round(1000 * m * m * DIFF_MULT[diff]));
const pctText = (m) => Math.round(m * 100) + "%";
const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const mIdx = (s) => {
  const [y, m] = s.split("-").map(Number);
  return y * 12 + m - 1;
};
const mLabel = (i) => MON[((i % 12) + 12) % 12] + " " + Math.floor(i / 12);
const stepFor = (n) => [1, 2, 3, 4, 6].find((s) => Math.ceil(n / s) <= 40) || 6;
const PV =
  "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/";
async function fetchMonthly(t) {
  const url =
    PV +
    encodeURIComponent(t.a.replace(/ /g, "_")) +
    "/monthly/" +
    t.f.replace("-", "") +
    "0100/" +
    t.e.replace("-", "") +
    "0100";
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error("http " + r.status);
    const j = await r.json();
    return Array.isArray(j.items) ? j.items : [];
  } finally {
    clearTimeout(to);
  }
}
function buildSeries(t, items) {
  const a = mIdx(t.f),
    n = mIdx(t.e) - a + 1,
    step = stepFor(n);
  const raw = new Array(n).fill(0),
    got = new Array(n).fill(false);
  items.forEach((it) => {
    const ts = String(it.timestamp);
    const i = mIdx(ts.slice(0, 4) + "-" + ts.slice(4, 6)) - a;
    if (i >= 0 && i < n) {
      raw[i] = Number(it.views) || 0;
      got[i] = true;
    }
  });
  const k = Math.ceil(n / step),
    cut = Math.floor((mIdx(t.x) - a) / step);
  if (got.filter(Boolean).length < n * 0.4) return null;
  const hidFrom = mIdx(t.x) - a;
  if (got.slice(hidFrom).filter(Boolean).length < (n - hidFrom) * 0.85)
    return null;
  const cols = [];
  for (let c = 0; c < k; c++) {
    let s = 0,
      m = 0;
    for (let j = c * step; j < Math.min(n, (c + 1) * step); j++) {
      s += raw[j];
      m++;
    }
    cols.push(s / m);
  }
  const mx = Math.max(...cols);
  if (!(mx > 0) || cut < 6 || k - cut < 10) return null;
  const v = cols.map((x) => Math.round((x / mx) * 1000) / 10);
  const hid = v.slice(cut);
  if (Math.max(...hid) - Math.min(...hid) < 6) return null;
  return { id: t.id, t, step, a, n, k, cut, v };
}
const GCACHE = new Map();
const FAILED = new Set();
function loadGraph(id) {
  if (GCACHE.has(id)) return GCACHE.get(id);
  const t = TOPIC[id];
  const p = fetchMonthly(t).then((items) => {
    const g = buildSeries(t, items);
    if (!g) throw new Error("unusable");
    return g;
  });
  GCACHE.set(id, p);
  p.catch(() => {
    GCACHE.delete(id);
    FAILED.add(id);
  });
  return p;
}
let SEEN_LIST = [];
try {
  SEEN_LIST = JSON.parse(lsGet("gg_seen", "[]")).filter((x) => TOPIC[x]);
} catch (e) {
  SEEN_LIST = [];
}
function markSeen(id) {
  SEEN_LIST = SEEN_LIST.filter((x) => x !== id);
  SEEN_LIST.push(id);
  if (SEEN_LIST.length > Math.floor(TOPICS.length * 0.7)) SEEN_LIST.shift();
  lsSet("gg_seen", JSON.stringify(SEEN_LIST));
}
const LV = { easy: 1, medium: 2, hard: 3, expert: 4, impossible: 5 };
function pickTopic(cat, diff, used) {
  const want = LV[diff] || 1,
    seen = new Set(SEEN_LIST);
  let list = TOPICS.filter(
    (t) =>
      (cat === "mix" || t.c === cat) && !used.has(t.id) && !FAILED.has(t.id),
  );
  if (!list.length)
    list = TOPICS.filter((t) => !used.has(t.id) && !FAILED.has(t.id));
  if (!list.length) return "";
  const w = list.map((t) => {
    const gap = Math.abs(t.d - want);
    return (
      (gap === 0 ? 6 : gap === 1 ? 2.5 : gap === 2 ? 0.6 : 0.15) *
      (seen.has(t.id) ? 1 : 3)
    );
  });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) {
    r -= w[i];
    if (r <= 0) return list[i].id;
  }
  return list[list.length - 1].id;
}
async function fetchPick(cat, diff, used, first) {
  let id = first;
  for (let i = 0; i < 6; i++) {
    if (!id || used.has(id) || FAILED.has(id)) id = pickTopic(cat, diff, used);
    if (!id) break;
    try {
      const g = await loadGraph(id);
      used.add(id);
      markSeen(id);
      return g;
    } catch (e) {
      id = "";
    }
  }
  return null;
}
const randCat = () => REAL_CATS[Math.floor(Math.random() * REAL_CATS.length)];
const catLabel = (k) => (CAT[k] ? CAT[k].n : "");
const CHECK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 5 5 9-11"/></svg>';
function renderCats(id, current, onPick, opts = {}) {
  const box = $(id);
  const list = opts.noMix ? CATS.filter((c) => c.k !== "mix") : CATS;
  box.className =
    "cat-grid" + (opts.sm ? " sm" : "") + (opts.noMix ? " six" : "");
  box.innerHTML = list
    .map(
      (
        c,
        i,
      ) => `<button type="button" class="cat-tile${c.k === current ? " sel" : ""}" data-k="${c.k}" style="--h:${c.h};--i:${i}" aria-pressed="${c.k === current}">
          <span class="ct-ic">${c.ic}</span><b>${c.n}</b>${opts.sm ? "" : `<small>${c.s}</small>`}<i class="ct-check">${CHECK_SVG}</i></button>`,
    )
    .join("");
  box.querySelectorAll(".cat-tile").forEach((b) => {
    b.onclick = () => {
      box.querySelectorAll(".cat-tile").forEach((x) => {
        x.classList.toggle("sel", x === b);
        x.setAttribute("aria-pressed", x === b);
      });
      onPick(b.dataset.k);
    };
  });
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
const R = { solo: null, duel: null };
const BACK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const SKIP_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 5 8 7-8 7zM17 5v14"/></svg>';
const CLEAR_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>';
const PEN_BIG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4.5 1L4.5 14.5z"/><path d="M13 21h8"/></svg>';
const CROWN_SVG =
  '<svg class="crown" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';
function gameHTML(p) {
  return `
          <div class="rg-card gg-card" id="${p}Panel">
            <div class="rg-qhead"><span class="rg-cat" id="${p}Cat"></span><span class="rg-dtag" id="${p}DiffTag"></span><span class="rg-cheat" id="${p}Cheat" hidden></span><span class="rg-time" id="${p}Time"></span></div>
            <div class="rg-tbar" id="${p}TbarBox"><i id="${p}Tbar"></i></div>
            <h2 class="rg-q" id="${p}Q">&nbsp;</h2>
            <p class="rg-sub" id="${p}Sub">&nbsp;</p>
            <div class="gg-chart" id="${p}Chart"></div>
          </div>
          <div id="${p}Action">
            <div class="gg-actions">
              <button class="gs-btn gg-side" id="${p}Clear" onclick="clearDraw('${p}')" disabled><span class="ico">${CLEAR_SVG}</span><span class="lbl">Clear</span></button>
              <button class="gg-go" id="${p}Go" onclick="goPress('${p}')" disabled>Draw to 2025</button>
              <button class="gs-btn gg-side" id="${p}Btn" onclick="skipPress('${p}')"><span class="ico">${SKIP_SVG}</span><span class="lbl">Skip</span></button>
            </div>
            <div class="msg" id="${p}Msg"></div>
            <div class="cheat-note" id="${p}CheatNote" hidden></div>
          </div>`;
}
const setMsg = (p, html, cls = "") => {
  const m = $(p + "Msg");
  m.className = "msg " + cls;
  m.innerHTML = html;
};
const pool = (p) => (p === "solo" ? M : D);
const fmtTime = (s) =>
  Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
const TM = { solo: 0, duel: 0 };
function paintTimer(p) {
  const r = R[p];
  if (!r) return;
  const left = Math.max(0, r.limit - r.elapsed),
    low = r.limit && left <= Math.min(10, r.limit * 0.25);
  $(p + "Time").textContent = r.limit ? fmtTime(Math.ceil(left)) : "";
  $(p + "TbarBox").style.visibility = r.limit ? "visible" : "hidden";
  $(p + "Tbar").style.width = (r.limit ? (left / r.limit) * 100 : 0) + "%";
  $(p + "TbarBox").classList.toggle("low", !!low);
  $(p + "Time").classList.toggle("low", !!low);
  if (p === "duel") {
    const t = $("duelTimer");
    t.textContent = fmtTime(Math.ceil(left));
    t.classList.toggle("on", !!r.limit);
    t.classList.toggle("low", !!low);
  }
}
function stopRoundTimer(p) {
  clearInterval(TM[p]);
  TM[p] = 0;
  if (p === "duel") $("duelTimer").classList.remove("on", "low");
}
function startRoundTimer(p, limit, onEnd) {
  stopRoundTimer(p);
  const r = R[p];
  r.limit = limit;
  r.elapsed = 0;
  paintTimer(p);
  if (!limit) return;
  let last = performance.now();
  TM[p] = setInterval(() => {
    const now = performance.now(),
      dt = now - last;
    last = now;
    if (!R[p] || R[p] !== r || r.locked) {
      stopRoundTimer(p);
      return;
    }
    r.elapsed += dt / 1000;
    paintTimer(p);
    if (r.elapsed >= limit) {
      stopRoundTimer(p);
      onEnd();
    }
  }, 100);
}
function awayWho(id) {
  return id === D.myId
    ? "You"
    : (D.players.find((x) => x.id === id) || {}).name || "A player";
}
function renderAway() {
  const pill = $("duelCheat"),
    note = $("duelCheatNote"),
    ids = Object.keys(D.away || {});
  if (!ids.length) {
    pill.hidden = true;
    note.hidden = true;
    note.innerHTML = "";
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
        " graph will be marked as cheating.",
    )
    .join("<br>");
}
function markAway() {
  if (!D.inMatch || D.locked || !D.settings || !D.settings.tabs) return;
  const r = R.duel;
  if (!r || r.locked || r.cheat) return;
  r.cheat = true;
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
    !D.players.some((x) => x.id === p.id) ||
    p.id === D.myId
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
function clampNum(el, fin) {
  const min = Number(el.min),
    max = Number(el.max);
  if (el.value === "") {
    if (fin) el.value = el.defaultValue;
    return;
  }
  const v = Math.floor(Number(el.value));
  if (!isFinite(v)) {
    el.value = el.defaultValue;
    return;
  }
  if (v > max) {
    el.value = max;
    showToast("The most you can set here is " + max + ".");
  } else if (fin && v < min) el.value = min;
  else if (String(v) !== el.value && fin) el.value = v;
}
const ANIM = { solo: 0, duel: 0 };
function stopAnim(p) {
  cancelAnimationFrame(ANIM[p]);
  clearTimeout(ANIM[p + "T"]);
  ANIM[p] = 0;
}
const easeIO = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lastYear = (g) => Math.floor((g.a + g.n - 1) / 12);
function geom(p) {
  const r = R[p],
    g = r.g,
    el = $(p + "Chart");
  const W = Math.max(280, Math.round(el.clientWidth || 640));
  const H = Math.round(clamp(W * 0.6, 250, 420));
  const ML = 40,
    MR = 14,
    MT = 14,
    MB = 30,
    pw = W - ML - MR,
    ph = H - MT - MB,
    n = g.k;
  return {
    W,
    H,
    ML,
    MR,
    MT,
    MB,
    pw,
    ph,
    n,
    X: (i) => ML + (pw * i) / (n - 1),
    Y: (v) => MT + ph * (1 - v / 100),
  };
}
const monthOf = (g, col) => g.a + col * g.step;
const colLabel = (g, col) => mLabel(monthOf(g, col));
function snapV(v) {
  return (Math.round((clamp(v, 0, 100) / 100) * GRID_Y) / GRID_Y) * 100;
}
const ptsStr = (G, list) =>
  list.map(([c, v]) => G.X(c).toFixed(1) + "," + G.Y(v).toFixed(1)).join(" ");
function youList(r) {
  const g = r.g,
    out = [[g.cut - 1, g.v[g.cut - 1]]];
  r.vals.forEach((v, i) => {
    if (v !== null) out.push([g.cut + i, v]);
  });
  return out;
}
function finalVals(r) {
  const g = r.g,
    hid = g.k - g.cut,
    out = r.vals.slice();
  let prevI = -1,
    prevV = g.v[g.cut - 1];
  for (let i = 0; i < hid; i++) {
    if (out[i] === null) continue;
    if (i - prevI > 1)
      for (let j = prevI + 1; j < i; j++)
        out[j] = prevV + ((out[i] - prevV) * (j - prevI)) / (i - prevI);
    prevI = i;
    prevV = out[i];
  }
  for (let j = prevI + 1; j < hid; j++) out[j] = prevV;
  return out;
}
const anyDrawn = (r) => r.vals.some((v) => v !== null);
const complete = (r) => r.vals[r.vals.length - 1] !== null;
function errOf(r) {
  const g = r.g,
    fv = finalVals(r);
  let s = 0;
  fv.forEach((v, i) => {
    s += Math.abs(v - g.v[g.cut + i]);
  });
  return s / fv.length;
}
function chartHTML(p) {
  const r = R[p],
    g = r.g,
    G = geom(p),
    { X, Y } = G;
  r.G = G;
  const x0 = X(g.cut - 1),
    right = G.ML + G.pw;
  let s = `<svg class="gg-svg" width="${G.W}" height="${G.H}" viewBox="0 0 ${G.W} ${G.H}" role="img" aria-label="Line chart of Wikipedia page views for ${esc(g.t.n)}">`;
  s += `<rect class="gg-zone" x="${x0}" y="${G.MT}" width="${right - x0}" height="${G.ph}"/>`;
  for (let i = 0; i <= 8; i++) {
    const v = i * 12.5;
    s += `<line class="gg-grid${i % 2 ? " minor" : ""}" x1="${G.ML}" x2="${right}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>`;
    if (i % 2 === 0)
      s += `<text class="gg-yl" x="${G.ML - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`;
  }
  const perYear = (G.pw / (g.k - 1)) * (12 / g.step),
    every = perYear >= 46 ? 1 : perYear >= 23 ? 2 : 4;
  const y0 = Math.ceil((g.a - (g.step - 1) / 2) / 12),
    y1 = Math.floor((g.a + g.n) / 12);
  for (let y = y0; y <= y1; y++) {
    if (y % every) continue;
    const c = (y * 12 - g.a - (g.step - 1) / 2) / g.step;
    if (c < 0 || c > g.k - 1) continue;
    s += `<line class="gg-grid year" x1="${X(c).toFixed(1)}" x2="${X(c).toFixed(1)}" y1="${G.MT}" y2="${G.MT + G.ph}"/><text class="gg-xl" x="${X(c).toFixed(1)}" y="${G.H - 9}" text-anchor="middle">${y}</text>`;
  }
  if (G.pw / (g.k - 1) >= 30)
    for (let c = g.cut; c < g.k; c++)
      s += `<line class="gg-col" x1="${X(c).toFixed(1)}" x2="${X(c).toFixed(1)}" y1="${G.MT}" y2="${G.MT + G.ph}"/>`;
  s += `<line class="gg-axis" x1="${G.ML}" x2="${right}" y1="${G.MT + G.ph}" y2="${G.MT + G.ph}"/>`;
  s += `<polyline class="gg-given" points="${ptsStr(
    G,
    g.v.slice(0, g.cut).map((v, i) => [i, v]),
  )}"/>`;
  s += `<line class="gg-cut" x1="${x0}" x2="${x0}" y1="${G.MT}" y2="${G.MT + G.ph}"/>`;
  s += `<path class="gg-real" id="${p}Real" pathLength="1" d=""/><path class="gg-you" id="${p}You" pathLength="1" d=""/>`;
  s += `<circle class="gg-dot" cx="${x0}" cy="${Y(g.v[g.cut - 1]).toFixed(1)}" r="6.5"/>`;
  s += `<g class="gg-tip" id="${p}Tip" visibility="hidden"><line id="${p}TipLn" y1="${G.MT}" y2="${G.MT + G.ph}"/><circle id="${p}TipDot" r="5"/><circle id="${p}TipDot2" r="5"/><rect id="${p}TipBg" rx="11" height="22"/><text id="${p}TipTx" text-anchor="middle"></text></g>`;
  s += "</svg>";
  s += `<div class="gg-hint" id="${p}Hint" style="left:${((x0 + right) / 2).toFixed(1)}px;top:${(G.MT + G.ph / 2).toFixed(1)}px">${PEN_BIG}<b>Draw the rest.</b></div>`;
  s += `<div class="gg-legend" id="${p}Legend" hidden><span><i class="you"></i>You</span><span><i class="real"></i>Real</span></div>`;
  $(p + "Chart").innerHTML = s;
  paintYou(p);
}
function pathD(G, list) {
  return list
    .map(
      ([c, v], i) =>
        (i ? "L" : "M") + G.X(c).toFixed(1) + " " + G.Y(v).toFixed(1),
    )
    .join("");
}
function paintYou(p) {
  const r = R[p];
  if (!r || !r.G) return;
  const G = r.G,
    y = $(p + "You");
  if (!y) return;
  y.setAttribute("d", anyDrawn(r) ? pathD(G, youList(r)) : "");
  y.style.strokeDasharray = "";
  y.style.strokeDashoffset = "";
  $(p + "Hint").style.display = anyDrawn(r) || r.locked ? "none" : "";
  const done = complete(r),
    g = r.g;
  $(p + "Go").disabled = r.locked || !done;
  $(p + "Go").textContent = done ? "Reveal" : "Draw to " + lastYear(g);
  $(p + "Go").classList.toggle("ready", done && !r.locked);
  $(p + "Clear").disabled = r.locked || !anyDrawn(r);
}
function showTip(p, col, items, text) {
  const r = R[p],
    G = r.G,
    g = r.g,
    x = G.X(col);
  const tip = $(p + "Tip"),
    tx = $(p + "TipTx"),
    bg = $(p + "TipBg");
  tip.setAttribute("visibility", "visible");
  $(p + "TipLn").setAttribute("x1", x);
  $(p + "TipLn").setAttribute("x2", x);
  const d1 = $(p + "TipDot"),
    d2 = $(p + "TipDot2");
  d1.setAttribute("cx", x);
  d1.setAttribute("cy", G.Y(items[0]));
  d1.setAttribute("class", items.length > 1 ? "real" : "you");
  if (items.length > 1) {
    d2.setAttribute("visibility", "visible");
    d2.setAttribute("cx", x);
    d2.setAttribute("cy", G.Y(items[1]));
    d2.setAttribute("class", "you");
  } else d2.setAttribute("visibility", "hidden");
  tx.textContent = text;
  const w = Math.max(70, text.length * 6.6 + 22),
    px = clamp(x, w / 2 + 2, G.W - w / 2 - 2);
  const hi = Math.max(...items),
    lo = Math.min(...items),
    py = G.Y(hi) - 38 < G.MT ? G.Y(lo) + 14 : G.Y(hi) - 38;
  bg.setAttribute("x", px - w / 2);
  bg.setAttribute("width", w);
  bg.setAttribute("y", py);
  tx.setAttribute("x", px);
  tx.setAttribute("y", py + 15);
}
function hideTip(p) {
  const t = $(p + "Tip");
  if (t) t.setAttribute("visibility", "hidden");
}
function canDraw(p) {
  const r = R[p];
  return !!(r && r.g && !r.locked && !r.loading && (p === "solo" || !D.locked));
}
function colAt(p, e) {
  const r = R[p],
    G = r.G,
    g = r.g,
    svg = $(p + "Chart").querySelector("svg.gg-svg");
  const b = svg.getBoundingClientRect(),
    x = e.clientX - b.left,
    y = e.clientY - b.top;
  const inZone = x >= G.X(g.cut - 1) + 3;
  const col = clamp(
    Math.round(((x - G.ML) / G.pw) * (G.n - 1)),
    g.cut,
    g.k - 1,
  );
  const v = snapV((1 - (y - G.MT) / G.ph) * 100);
  return { inZone, col, v, x, y };
}
function drawAt(p, e) {
  const r = R[p];
  if (!canDraw(p)) return;
  const c = colAt(p, e),
    g = r.g;
  if (!c.inZone) {
    r.last = -1;
    hideTip(p);
    return;
  }
  const i = c.col - g.cut;
  if (r.last >= 0 && r.last !== i) {
    const a = r.last,
      b = i,
      va = r.vals[a],
      lo = Math.min(a, b),
      hi = Math.max(a, b);
    for (let j = lo; j <= hi; j++)
      r.vals[j] = snapV(va + ((c.v - va) * (j - a)) / (b - a));
  } else r.vals[i] = c.v;
  r.last = i;
  paintYou(p);
  showTip(p, c.col, [c.v], colLabel(g, c.col) + " · " + Math.round(c.v));
}
function hoverRead(p, e) {
  const r = R[p];
  if (!r || !r.revealed || !r.G) return;
  const G = r.G,
    g = r.g,
    svg = $(p + "Chart").querySelector("svg.gg-svg");
  const b = svg.getBoundingClientRect(),
    x = e.clientX - b.left,
    y = e.clientY - b.top;
  if (x < G.ML || x > G.W - G.MR || y < 0 || y > G.H) {
    hideTip(p);
    return;
  }
  const col = clamp(Math.round(((x - G.ML) / G.pw) * (G.n - 1)), 0, g.k - 1);
  const real = g.v[col];
  if (col >= g.cut && !r.skipped) {
    const mine = r.fv[col - g.cut];
    showTip(
      p,
      col,
      [real, mine],
      colLabel(g, col) +
        " · Real " +
        Math.round(real) +
        " · You " +
        Math.round(mine),
    );
  } else showTip(p, col, [real], colLabel(g, col) + " · " + Math.round(real));
}
function bindDraw(p) {
  const panel = $(p + "Panel");
  panel.onpointerdown = (e) => {
    if (e.button > 0 || e.target.closest("button, a, input")) return;
    const r = R[p];
    if (!canDraw(p)) return;
    r.down = true;
    r.last = -1;
    if (e.pointerType === "mouse") e.preventDefault();
    drawAt(p, e);
  };
}
["solo", "duel"].forEach((p) => {
  window.addEventListener(
    "pointermove",
    (e) => {
      const r = R[p];
      if (!r) return;
      if (r.down) {
        if (e.pointerType !== "mouse" || e.buttons & 1) drawAt(p, e);
        else {
          r.down = false;
          r.last = -1;
        }
      } else if (r.revealed && e.pointerType === "mouse") hoverRead(p, e);
    },
    { passive: true },
  );
  const up = () => {
    const r = R[p];
    if (r && r.down) {
      r.down = false;
      r.last = -1;
      hideTip(p);
    }
  };
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  window.addEventListener("blur", up);
});
window.addEventListener("resize", () => {
  ["solo", "duel"].forEach((p) => {
    const r = R[p];
    if (!r || !r.g || !$(p + "Chart").firstChild || r.animating) return;
    const w = Math.round($(p + "Chart").clientWidth);
    if (w === r.G.W) return;
    chartHTML(p);
    if (r.revealed) revealStatic(p);
  });
});
function clearDraw(p) {
  const r = R[p];
  if (!r || r.locked) return;
  r.vals = r.vals.map(() => null);
  r.last = -1;
  hideTip(p);
  paintYou(p);
}
function setupRound(p, g, diff, limit, cat) {
  stopAnim(p);
  R[p] = {
    g,
    diff,
    cat,
    vals: new Array(g.k - g.cut).fill(null),
    last: -1,
    down: false,
    locked: false,
    loading: false,
    revealed: false,
    skipped: false,
    animating: false,
    elapsed: 0,
    limit,
    G: null,
    fv: null,
    cheat: false,
  };
  $(p + "Cheat").hidden = true;
  $(p + "CheatNote").hidden = true;
  $(p + "Cat").textContent = catLabel(g.t.c);
  $(p + "Cat").style.setProperty("--h", CAT[g.t.c].h);
  $(p + "DiffTag").textContent = LEVEL_NAMES[diff];
  $(p + "DiffTag").dataset.level = diff;
  $(p + "Q").textContent = "Wikipedia views for “" + g.t.n + "”";
  $(p + "Sub").textContent =
    "relative page views per month · 100 = the busiest stretch";
  setMsg(p, "");
  $(p + "Action").style.display = "";
  $(p + "Chart").classList.remove("loading", "fail");
  chartHTML(p);
  bindDraw(p);
  const card = $(p + "Panel");
  card.classList.remove("flip");
  void card.offsetWidth;
  card.classList.add("flip");
  startRoundTimer(p, limit, () => {
    sfx("wrong");
    if (anyDrawn(R[p])) {
      setMsg(p, "Time's up! Your drawing is locked in.");
      endRound(p, "done");
    } else {
      setMsg(p, "Time's up!");
      endRound(p, "time");
    }
  });
}
function loadingRound(p, text) {
  stopAnim(p);
  const r = (R[p] = { g: null, loading: true, locked: false });
  $(p + "Chart").classList.add("loading");
  $(p + "Chart").classList.remove("fail");
  $(p + "Chart").innerHTML =
    `<div class="gg-load"><i></i><span>${text || "Loading real data..."}</span></div>`;
  $(p + "Q").textContent = " ";
  $(p + "Sub").textContent = " ";
  $(p + "Go").disabled = true;
  $(p + "Go").textContent = "Reveal";
  $(p + "Clear").disabled = true;
  $(p + "TbarBox").style.visibility = "hidden";
  $(p + "Time").textContent = "";
  return r;
}
function failRound(p, retry) {
  $(p + "Chart").classList.add("fail");
  $(p + "Chart").innerHTML =
    `<div class="gg-load"><span>Couldn't load the graph data. Check your connection.</span><button class="retry" onclick="${retry}">Retry</button></div>`;
}
const endRound = (p, kind) => (p === "solo" ? soloEnd(kind) : finishDuel(kind));
function goPress(p) {
  const r = R[p];
  if (!r || r.locked || !complete(r)) return;
  endRound(p, "done");
}
function skipPress(p) {
  const r = R[p];
  if (!r || r.locked || !r.g) return;
  endRound(p, "skip");
}
function lockRound(p, kind) {
  const r = R[p];
  r.locked = true;
  r.down = false;
  r.last = -1;
  r.skipped = kind !== "done";
  r.fv = kind === "done" ? finalVals(r) : null;
  r.err = kind === "done" ? errOf(r) : 0;
  r.m = kind === "done" ? matchOf(r.err) : 0;
  r.pts = kind === "done" ? ptsOf(r.diff, r.m) : 0;
  stopRoundTimer(p);
  hideTip(p);
  return r;
}
function revealStatic(p) {
  const r = R[p],
    G = r.G,
    g = r.g;
  const real = [[g.cut - 1, g.v[g.cut - 1]]].concat(
    g.v.slice(g.cut).map((v, i) => [g.cut + i, v]),
  );
  $(p + "Real").setAttribute("d", pathD(G, real));
  $(p + "Real").style.strokeDasharray = "";
  $(p + "Real").style.strokeDashoffset = "";
  const y = $(p + "You");
  if (r.fv) {
    y.setAttribute(
      "d",
      pathD(
        G,
        [[g.cut - 1, g.v[g.cut - 1]]].concat(
          r.fv.map((v, i) => [g.cut + i, v]),
        ),
      ),
    );
    y.style.strokeDasharray = "";
    y.style.strokeDashoffset = "";
  } else y.setAttribute("d", "");
  $(p + "Hint").style.display = "none";
  $(p + "Legend").hidden = !r.fv;
}
function revealRound(p, done) {
  stopAnim(p);
  const r = R[p],
    G = r.G,
    g = r.g,
    still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  r.animating = true;
  $(p + "Action").style.display = "none";
  const real = [[g.cut - 1, g.v[g.cut - 1]]].concat(
    g.v.slice(g.cut).map((v, i) => [g.cut + i, v]),
  );
  const you = r.fv
    ? [[g.cut - 1, g.v[g.cut - 1]]].concat(r.fv.map((v, i) => [g.cut + i, v]))
    : null;
  const ry = $(p + "You"),
    rr = $(p + "Real");
  $(p + "Hint").style.display = "none";
  ry.setAttribute("d", you ? pathD(G, you) : "");
  rr.setAttribute("d", pathD(G, real));
  ry.style.strokeDasharray = "1";
  rr.style.strokeDasharray = "1";
  ry.style.strokeDashoffset = you ? "1" : "0";
  rr.style.strokeDashoffset = "1";
  const TA = still || !you ? 1 : 1500,
    PAUSE = still || !you ? 1 : 350,
    TB = still ? 1 : 1900,
    t0 = performance.now();
  let fin = false;
  const finish = () => {
    if (fin) return;
    fin = true;
    cancelAnimationFrame(ANIM[p]);
    ANIM[p] = 0;
    r.animating = false;
    r.revealed = true;
    revealStatic(p);
    if (done) done();
  };
  const frame = (now) => {
    const e = now - t0;
    if (you)
      ry.style.strokeDashoffset = String(1 - easeIO(clamp(e / TA, 0, 1)));
    rr.style.strokeDashoffset = String(
      1 - easeIO(clamp((e - TA - PAUSE) / TB, 0, 1)),
    );
    if (e < TA + PAUSE + TB) ANIM[p] = requestAnimationFrame(frame);
    else finish();
  };
  ANIM[p] = requestAnimationFrame(frame);
  ANIM[p + "T"] = setTimeout(finish, TA + PAUSE + TB + 600);
}
const srcHTML = (g) =>
  `<div class="gg-src">Real data: monthly page views of “${esc(g.t.a)}” on English Wikipedia (Wikimedia pageviews, user traffic). ${esc(mLabel(g.a))} to ${esc(mLabel(g.a + g.n - 1))}, ${g.step === 1 ? "monthly" : g.step + "-month averages"}.</div>`;
const S = { token: 0, cancel: null };
let M = null;
const SET = { diff: lsGet("gg_diff", "easy"), cat: lsGet("gg_cat", "mix") };
if (!LEVELS.includes(SET.diff)) SET.diff = "easy";
if (!CAT[SET.cat]) SET.cat = "mix";
function updateSetupInfo() {
  const d = SET.diff;
  $("setupInfo").innerHTML =
    `<div><b>${MATCH_ROUNDS}</b><small>GRAPHS</small></div><div><b>${DIFF_FEEL[d]}</b><small>TOPICS</small></div><div><b>×${DIFF_MULT[d]}</b><small>SCORE</small></div>`;
  $("setupInfo").dataset.level = d;
}
function startSolo() {
  closeSoloResult();
  stopRoundTimer("solo");
  stopAnim("solo");
  M = null;
  R.solo = null;
  showView("setupView");
  renderDiff("setupDiff", SET.diff, (l) => {
    SET.diff = l;
    lsSet("gg_diff", l);
    updateSetupInfo();
  });
  renderCats("setupCats", SET.cat, (k) => {
    SET.cat = k;
    lsSet("gg_cat", k);
  });
  updateSetupInfo();
  updateScoreChip();
}
function leaveGame() {
  S.token++;
  stopRoundTimer("solo");
  stopAnim("solo");
  closeSoloResult();
  R.solo = null;
  M = null;
  startSolo();
}
function beginMatch() {
  S.token++;
  closeSoloResult();
  stopConfetti();
  M = {
    diff: SET.diff,
    cat: SET.cat,
    round: 0,
    score: 0,
    rounds: [],
    used: new Set(),
    next: null,
  };
  showView("gameView");
  $("soloDiff").textContent = LEVEL_NAMES[M.diff];
  $("soloDiff").dataset.level = M.diff;
  updateScoreChip();
  nextGraph();
}
function renderDots() {
  $("soloDots").innerHTML = Array.from({ length: MATCH_ROUNDS }, (_, i) => {
    const rr = M.rounds[i],
      cls = rr
        ? rr.kind === "done"
          ? "good"
          : "bad"
        : i === M.round - 1
          ? "now"
          : "";
    return `<i class="${cls}"></i>`;
  }).join("");
}
function paintMatchScore() {
  $("soloMatch").textContent = M.score.toLocaleString();
  $("soloMatchBox").classList.toggle(
    "beat",
    M.score > 0 && M.score > (stats.high || 0),
  );
}
async function nextGraph() {
  const tok = S.token;
  M.round++;
  $("soloRound").textContent = `Graph ${M.round} / ${MATCH_ROUNDS}`;
  closeSoloResult();
  loadingRound("solo");
  renderDots();
  paintMatchScore();
  const cat = M.cat === "mix" ? randCat() : M.cat;
  const first = M.next && !M.used.has(M.next) ? M.next : "";
  M.next = null;
  const g = await fetchPick(cat, M.diff, M.used, first);
  if (tok !== S.token || !M) return;
  if (!g) {
    M.round--;
    failRound("solo", "retryGraph()");
    return;
  }
  setupRound("solo", g, M.diff, 0, cat);
  const ahead = pickTopic(M.cat === "mix" ? randCat() : M.cat, M.diff, M.used);
  if (ahead) {
    M.next = ahead;
    loadGraph(ahead).catch(() => {
      if (M && M.next === ahead) M.next = null;
    });
  }
}
function retryGraph() {
  if (!M) return;
  nextGraph();
}
function soloEnd(kind) {
  const r = R.solo;
  if (!r || r.locked || !r.g) return;
  lockRound("solo", kind);
  const secs = Math.max(0.5, r.elapsed || 0),
    ok = kind === "done",
    tok = S.token;
  M.rounds.push({
    kind,
    m: r.m,
    err: r.err,
    pts: r.pts,
    secs,
    name: r.g.t.n,
    id: r.g.id,
  });
  M.score += r.pts;
  sfx(ok && r.m >= 0.5 ? "correct" : "lose");
  $("soloAction").style.display = "none";
  revealRound("solo", () => {
    if (tok !== S.token || R.solo !== r) return;
    paintMatchScore();
    renderDots();
    showSoloResult(kind, r);
  });
}
function matchWord(m) {
  return m >= 0.9
    ? "Spot on"
    : m >= 0.75
      ? "Very close"
      : m >= 0.55
        ? "Pretty good"
        : m >= 0.35
          ? "In the area"
          : "Way off";
}
function showSoloResult(kind, r) {
  const tok = S.token,
    ok = kind === "done",
    last = M.round >= MATCH_ROUNDS,
    good = ok && r.m >= 0.55;
  const label = last ? "See results" : "Next graph";
  $("soloResult").innerHTML =
    `<div class="res ${good ? "good" : "bad"} strip rg-res">
          <div class="res-badges"><span class="stamp">${ok ? pctText(r.m) + " MATCH" : kind === "time" ? "TIME'S UP" : "SKIPPED"}</span><span class="streak"${ok ? "" : ' style="color:#9aa6a0"'}>${ok ? "+" + r.pts.toLocaleString() + " pts" : "No score"}</span>${ok ? `<span class="streak" style="color:#9aa6a0">${matchWord(r.m)}</span>` : ""}</div>
          ${srcHTML(r.g)}
          <div class="res-actions"><button class="res-next" onclick="nextSolo()">${label}</button></div><div class="cool"><i id="soloCool"></i></div></div>`;
  $("soloResult").style.display = "block";
  window.__resAt = Date.now();
  if (good && r.m >= 0.8) confetti();
  const bar = $("soloCool");
  if (lsGet("gg_autonext", "1") === "1")
    S.cancel = runCooldown(
      good ? 9000 : 10000,
      null,
      (k) => {
        bar.style.width = k * 100 + "%";
      },
      () => {
        S.cancel = null;
        if (tok === S.token) nextSolo();
      },
    );
  else $("soloResult").querySelector(".cool").style.visibility = "hidden";
}
function nextSolo() {
  if (
    !R.solo ||
    !R.solo.locked ||
    !M ||
    $("soloResult").style.display !== "block"
  )
    return;
  if (M.round >= MATCH_ROUNDS) {
    endMatch();
    return;
  }
  nextGraph();
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
function endMatch() {
  closeSoloResult();
  const m = M,
    tok = S.token;
  const drawn = m.rounds.filter((x) => x.kind === "done");
  const prevHigh = stats.high || 0,
    isHigh = m.score > prevHigh;
  localStats((x) => {
    x.matches++;
    x.graphs += drawn.length;
    x.high = Math.max(x.high, m.score);
    x.best = Math.max(x.best, ...m.rounds.map((y) => y.pts), 0);
    x.acc = Math.max(x.acc, ...drawn.map((y) => Math.round(y.m * 100)), 0);
  });
  const pending = srv("gg_match", {
    diff: m.diff,
    rounds: m.rounds.map((x) => ({
      m: Math.round(x.m * 10000) / 10000,
      secs: Math.round(x.secs * 100) / 100,
      skip: x.kind !== "done",
    })),
  });
  const rows = m.rounds
    .map(
      (x, i) =>
        `<div class="mr-row" style="animation-delay:${i * 70}ms"><span class="n">${i + 1}</span><span class="a">${esc(x.name)}${x.kind === "done" ? "" : " <em>" + (x.kind === "time" ? "Time's up" : "Skipped") + "</em>"}</span><span class="t" style="color:${x.kind === "done" ? "#19d77b" : "#7f8b83"}">${x.kind === "done" ? pctText(x.m) : ""}</span><b>${x.pts.toLocaleString()}</b></div>`,
    )
    .join("");
  $("matchBox").innerHTML =
    `<div class="eyebrow">${LEVEL_NAMES[m.diff].toUpperCase()} · ${m.cat === "mix" ? "ALL TOPICS" : catLabel(m.cat).toUpperCase()}</div>
          <h1 class="mr-score" id="mrScore">0</h1>
          <div class="mr-high ${isHigh ? "new" : ""}" id="mrHigh">${isHigh ? "NEW HIGH SCORE" : "HIGH SCORE " + prevHigh.toLocaleString()}</div>
          <div class="mr-list">${rows}</div>
          <div class="mr-actions"><button class="primary" onclick="startSolo()">Play again</button><button class="skip-btn small" onclick="tryHome()">Home</button></div>`;
  showView("matchView");
  countUp($("mrScore"), 0, m.score, 1100);
  if (isHigh && m.score > 0) {
    setTimeout(() => {
      if ($("matchView").classList.contains("active")) {
        confetti(true);
        fanfare();
      }
    }, 900);
  }
  const t0 = Date.now();
  pending.then((st) => {
    if (tok !== S.token || !st || st.points === undefined) return;
    setTimeout(
      () => {
        if (tok !== S.token || !$("mrScore")) return;
        if (st.rejected) {
          $("mrHigh").textContent =
            "Too quick to count. Wait a moment between matches.";
          $("mrHigh").classList.remove("new");
          return;
        }
        if (Number(st.points) !== m.score)
          $("mrScore").textContent = Number(st.points).toLocaleString();
      },
      Math.max(0, 1250 - (Date.now() - t0)),
    );
  });
  M = null;
}
let leaveCb = null,
  leaveBypass = false;
function matchActive() {
  if (leaveBypass) return false;
  if ($("gameView").classList.contains("active") && M) return true;
  if ($("duelView").classList.contains("active") && D.inMatch && !D.finished)
    return true;
  return false;
}
function leaveStats() {
  const box = $("leaveStats");
  if ($("duelView").classList.contains("active") && D.inMatch) {
    box.innerHTML = `<span><small>GRAPH</small><b>${D.round} / ${D.total}</b></span><span><small>POINTS</small><b>${((D.score && D.score[D.myId]) || 0).toLocaleString()}</b></span>`;
  } else if (M) {
    box.innerHTML = `<span><small>GRAPH</small><b>${M.round} / ${MATCH_ROUNDS}</b></span><span><small>POINTS</small><b>${M.score.toLocaleString()}</b></span>`;
  } else box.innerHTML = "";
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
var backArmed = false,
  backIgnore = 0;
function armBack() {
  if (backArmed) return;
  backArmed = true;
  try {
    history.pushState({ rg: 1 }, "");
  } catch (e) {}
}
function disarmBack() {
  if (!backArmed) return;
  backArmed = false;
  try {
    if (history.state && history.state.rg) {
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
      history.pushState({ rg: 1 }, "");
    } catch (e) {}
    const duel = $("duelView").classList.contains("active");
    openLeave(duel ? () => disconnectDuel() : leaveGame);
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
    } else if (e.key === "Enter") {
      e.stopPropagation();
    }
  },
  true,
);
const D = {
  client: null,
  channel: null,
  code: "",
  host: false,
  hostId: "",
  players: [],
  settings: null,
  round: 0,
  total: 7,
  cat: "",
  diff: "easy",
  qi: 0,
  rid: 0,
  score: {},
  answers: {},
  away: {},
  locked: true,
  resolved: false,
  used: new Set(),
  bestRound: 0,
  bestAcc: 0,
  gid: "",
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
  duelCatSel = lsGet("gg_dcat", "world"),
  duelRandom = false,
  duelRandomCat = false;
if (!CAT[duelCatSel] || duelCatSel === "mix") duelCatSel = "world";
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
const supabaseClient = sb;
const makeCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
const send = (event, payload) =>
  D.channel?.send({ type: "broadcast", event, payload });
const settingsText = () => {
  const s = D.settings;
  if (!s) return "";
  return [
    s.random ? "Random difficulty" : LEVEL_NAMES[s.difficulty],
    s.randomTheme ? "Random topics" : catLabel(s.theme),
    s.timer ? timerName(s.timer) + " timer" : "No timer",
    s.total + (s.total === 1 ? " graph" : " graphs"),
  ]
    .concat(s.tabs ? ["Tab changes shown"] : [])
    .join(" · ");
};
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
function setDuelRandom(v) {
  duelRandom = !!v;
  $("duelDiff").classList.toggle("off", duelRandom);
}
function setDuelRandomCat(v) {
  duelRandomCat = !!v;
  $("duelCats").classList.toggle("off", duelRandomCat);
}
function pickDuelDiff(l) {
  duelDiffSel = l;
}
async function createDuel() {
  const btn = $("createBtn");
  btn.disabled = true;
  try {
    const total = Math.max(
      1,
      Math.min(30, Math.floor(Number($("duelRounds").value) || MATCH_ROUNDS)),
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
      theme: duelCatSel,
      random: duelRandom,
      randomTheme: duelRandomCat,
      timer: duelTimerSel,
      total,
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
  D.channel = D.client.channel("graph-guesser-" + D.code, {
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
  D.used = new Set();
  hostNextRound("match-start");
}
async function hostNextRound(event = "new-round") {
  const st = D.settings,
    tok = ++D.rid;
  D.round++;
  const diff = st.random
    ? LEVELS[Math.floor(Math.random() * LEVELS.length)]
    : st.difficulty;
  const cat = st.randomTheme ? randCat() : st.theme;
  const g = await fetchPick(cat, diff, D.used, "");
  if (!D.channel || tok !== D.rid) return;
  if (!g) {
    showToast("Couldn't load graph data. Check your connection.");
    D.round--;
    D.nextTimer = setTimeout(() => hostNextRound(event), 4000);
    return;
  }
  const payload = {
    settings: st,
    total: D.total,
    round: D.round,
    cat,
    diff,
    gid: g.id,
    score: D.score,
    players: D.players,
  };
  send(event, payload);
  beginRound(payload);
}
async function beginRound(p) {
  clearTimeout(D.nextTimer);
  clearTimeout(D.podTimer);
  stopAnim("duel");
  stopConfetti();
  if (!TOPIC[p.gid] || !D.settings) return;
  D.inMatch = true;
  D.finished = false;
  D.started = true;
  if (p.players) D.players = p.players;
  D.round = p.round;
  D.total = p.total;
  D.cat = p.cat;
  D.diff = LEVELS.includes(p.diff) ? p.diff : "easy";
  D.gid = p.gid;
  D.score = p.score;
  if (p.round === 1) {
    D.bestRound = 0;
    D.bestAcc = 0;
  }
  D.answers = {};
  D.away = {};
  D.locked = true;
  D.resolved = false;
  const rid = ++D.rid;
  $("lbOverlay").classList.remove("open");
  $("duelBody").classList.remove("waiting");
  $("duelWait").classList.remove("show");
  showView("duelView");
  $("duelRound").textContent = `Graph ${p.round} / ${p.total}`;
  $("duelScore").textContent = (D.score[D.myId] || 0).toLocaleString();
  loadingRound("duel");
  let g = null;
  try {
    g = await loadGraph(p.gid);
  } catch (e) {
    g = null;
  }
  if (rid !== D.rid || !D.inMatch) return;
  if (!g) {
    failRound("duel", "retryDuelGraph()");
    D.loadFail = p.gid;
    setTimeout(() => {
      if (rid === D.rid && R.duel && !R.duel.g) {
        D.locked = false;
        finishDuel("skip");
      }
    }, 3500);
    return;
  }
  D.locked = false;
  setupRound("duel", g, D.diff, D.settings.timer || 0, D.cat);
}
async function retryDuelGraph() {
  const id = D.gid,
    rid = D.rid;
  loadingRound("duel");
  let g = null;
  try {
    g = await loadGraph(id);
  } catch (e) {
    g = null;
  }
  if (rid !== D.rid || !D.inMatch || D.answers[D.myId]) return;
  if (!g) {
    failRound("duel", "retryDuelGraph()");
    return;
  }
  D.locked = false;
  setupRound("duel", g, D.diff, D.settings.timer || 0, D.cat);
}
function finishDuel(kind) {
  if (D.locked && !(R.duel && !R.duel.g)) return;
  if (D.answers[D.myId]) return;
  D.locked = true;
  let r = R.duel;
  if (r && r.g) lockRound("duel", kind);
  else r = null;
  stopRoundTimer("duel");
  $("duelBody").classList.add("waiting");
  $("duelWait").classList.add("show");
  const ok = kind === "done" && !!r,
    points = ok ? r.pts : 0,
    m = ok ? r.m : 0;
  if (ok) {
    D.bestRound = Math.max(D.bestRound, points);
    D.bestAcc = Math.max(D.bestAcc, Math.round(m * 100));
    sfx("correct");
  } else sfx("lose");
  const payload = {
    id: D.myId,
    correct: ok,
    points,
    m,
    kind: ok ? "done" : kind === "time" ? "time" : "skip",
    cheat: !!(r && r.cheat),
  };
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
    correct: !!p.correct,
    points: Math.max(0, Math.min(3000, Number(p.points) || 0)),
    m: Math.max(0, Math.min(1, Number(p.m) || 0)),
    kind: String(p.kind || "").slice(0, 8),
    cheat: !!p.cheat,
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
    cat: D.cat,
    diff: D.diff,
    gid: D.gid,
    round: D.round,
    total: D.total,
    names,
  };
  if (D.round >= D.total) {
    const res = {
      score: D.score,
      names,
      answers: D.answers,
      cat: D.cat,
      diff: D.diff,
      gid: D.gid,
      round: D.round,
      total: D.total,
    };
    send("match-end", res);
    showMatchResult(res);
    return;
  }
  send("round-result", payload);
  showRoundResult(payload);
}
function roundRevealHTML(p) {
  const t = TOPIC[p.gid];
  if (!t) return "";
  return `<div class="rg-reveal-q">${esc(t.n)}</div>`;
}
function playDuelReveal(p, then) {
  $("duelBody").classList.remove("waiting");
  $("duelWait").classList.remove("show");
  const r = R.duel;
  if (!r || !r.g || !r.locked) {
    then();
    return;
  }
  revealRound("duel", () => setTimeout(then, 1800));
}
function showRoundResult(p) {
  D.locked = true;
  playDuelReveal(p, () => {
    renderRoundBoard(p);
    if (D.host) {
      clearTimeout(D.nextTimer);
      D.nextTimer = setTimeout(() => hostNextRound(), 8500);
    }
  });
}
function showMatchResult(p) {
  if (D.finished) return;
  D.finished = true;
  clearTimeout(D.nextTimer);
  playDuelReveal(p, () => renderMatchBoard(p));
}
function ansLine(a) {
  if (!a) return "";
  const ch = a.cheat ? ' <i class="mr-cheat">CHEATING</i>' : "";
  if (!a.correct)
    return `<em class="ans no">${a.kind === "time" ? "Time's up" : "Skipped"}</em>${ch}`;
  return `<em class="ans"><span style="color:#19d77b">${pctText(a.m || 0)} match</span></em>${ch}`;
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
function renderRoundBoard(p) {
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
            <span class="nm"><span class="nm-in">${nameHTML(p.names?.[id] || "Player")}${me ? " <small>(you)</small>" : ""}</span>${ansLine(p.answers[id])}</span>
            <span class="gain">+${p.answers[id]?.correct ? p.answers[id].points : 0}</span>
            <span class="pts">${(p.prev[id] || 0).toLocaleString()}</span></div>`;
    })
    .join("");
  const ov = $("lbOverlay");
  ov.innerHTML = `<div class="lb-inner">
          <div class="eyebrow">GRAPH ${p.round} / ${p.total}</div>
          <h2>Leaderboard</h2>
          ${roundRevealHTML(p)}
          <div class="lb" style="height:${ids.length * 72}px">${rows}</div>
          <div class="lb-foot">${last ? "Final results coming up..." : "Next graph starting soon..."}</div></div>`;
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
function renderMatchBoard(p) {
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
    srv("gg_duel", { won, best: D.bestRound, acc: D.bestAcc });
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
            <button class="primary" style="min-width:160px" onclick="tryHome()">Home</button></div>`;
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
  stopAnim("duel");
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
const BOARDS = {
  score: {
    val: (p) => Number(p.high_score),
    fmt: (v) => v.toLocaleString(),
    dir: -1,
  },
  matches: {
    label: "Matches played",
    val: (p) => Number(p.matches),
    fmt: (v) => v.toLocaleString(),
    dir: -1,
  },
  best_round: {
    label: "Best round",
    val: (p) => Number(p.best_round),
    fmt: (v) => v.toLocaleString(),
    dir: -1,
  },
  best_acc: {
    label: "Best match",
    val: (p) => Number(p.best_acc),
    fmt: (v) => v + "%",
    dir: -1,
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
const STAT_KEYS = ["matches", "best_round", "best_acc", "duels", "wins"];
let PROFILES = [];
const liveProfiles = () => PROFILES;
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
      .from("graph_stats")
      .select(
        "id,username,high_score,matches,graphs,best_round,best_acc,duels,wins",
      )
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
      .channel("gg-stats-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "graph_stats" },
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
  const v = stats.high || 0;
  el.textContent = v.toLocaleString();
  let t = "";
  if (ME && ME.id && v > 0) {
    const r = boardRows("score").find((x) => x.p.id === ME.id);
    if (r) t = r.rank <= 10 ? "#" + r.rank : "10+";
  }
  $("soloRank").textContent = t;
}
const LB = { tab: "score", stat: "matches" };
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
    return "The server isn't set up yet. Run supabase-graph-setup.sql in Supabase first.";
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
        if (pendingOps === 0 && !resyncing && name !== "gg_get") {
          resyncing = true;
          srv("gg_get").finally(() => {
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
      high_score: stats.high,
      matches: stats.matches,
      graphs: stats.graphs,
      best_round: stats.best,
      best_acc: stats.acc,
      duels: stats.duels,
      wins: stats.wins,
    });
  boardsChanged();
}
const rowToStats = (r) => ({
  high: Number(r.high_score) || 0,
  matches: Number(r.matches) || 0,
  graphs: Number(r.graphs) || 0,
  best: Number(r.best_round) || 0,
  acc: Number(r.best_acc) || 0,
  duels: Number(r.duels) || 0,
  wins: Number(r.wins) || 0,
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
    const st = await api("gg_create", { u: name });
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
  const st = await api("gg_get", { t });
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
    const st = await api("gg_set_username", { t: ME.token, u: v });
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
    const st = await api("gg_get", { t });
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
  $("autoNext").checked = lsGet("gg_autonext", "1") === "1";
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
  lsSet("gg_autonext", $("autoNext").checked ? "1" : "0");
  closeSettings();
}
$("autoNext").onchange = () =>
  lsSet("gg_autonext", $("autoNext").checked ? "1" : "0");
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
  if (p === "solo" && R.solo && R.solo.locked && M) {
    e.preventDefault();
    nextSolo();
    return;
  }
  if (!R[p] || R[p].locked || (p === "duel" && D.locked)) return;
  e.preventDefault();
  if (tag === "BUTTON") a.blur();
  if (!$(p + "Go").disabled) goPress(p);
});
document.body.insertAdjacentHTML(
  "beforeend",
  `<div class="modal-back" id="leaveModal" role="dialog" aria-modal="true" aria-labelledby="leaveT" onclick="if (event.target === this) closeLeave(false)"><div class="sheet leave"><div class="lv-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19Z"/><path d="M12 10v4.5M12 17.6v.1"/></svg></div><h2 id="leaveT">Leave this match?</h2><p>You will lose your progress for this match.</p><div class="lv-stats" id="leaveStats"></div><div class="lv-actions"><button class="primary" id="leaveStay" onclick="closeLeave(false)">Keep playing</button><button class="lv-go" onclick="closeLeave(true)">Leave match</button></div></div></div>`,
);
document.querySelector(".hub-btn").addEventListener("click", (ev) => {
  if (matchActive()) {
    ev.preventDefault();
    const href = ev.currentTarget.href;
    openLeave(() => {
      leaveBypass = true;
      location.href = href;
    });
  }
});
$("soloStack").innerHTML =
  `<div class="rg-top"><button class="back" onclick="guardLeave(leaveGame)" aria-label="Back">${BACK_SVG}</button>
          <div class="rg-prog"><b id="soloRound">Graph 1 / 5</b><div class="rg-dots" id="soloDots"></div></div>
          <div class="rg-chipbox"><button class="score-chip" onclick="openLb('score')" aria-label="High score. Open leaderboard" title="Your high score"><small>BEST</small><span id="soloScore">0</span><span class="rk" id="soloRank"></span></button><div class="mscore" id="soloMatchBox" title="This match"><small>NOW</small><span id="soloMatch">0</span></div></div></div>
        <div id="soloBody" class="game-body">${gameHTML("solo")}</div><div id="soloResult" style="display:none"></div><span id="soloDiff" hidden></span>`;
$("duelStack").innerHTML =
  `<div class="duel-top"><button class="back" onclick="guardLeave(() => disconnectDuel())" aria-label="Back">${BACK_SVG}</button><span id="duelRound">Graph 1 / 5</span><span class="duel-right"><span class="dtimer" id="duelTimer"></span><span class="score" id="duelScore">0</span></span></div>
        <div class="duel-wrap"><div id="duelBody" class="game-body">${gameHTML("duel")}</div><div id="duelWait" class="wait"><i></i>Waiting for the other players...</div></div>`;
renderDiff("duelDiff", duelDiffSel, pickDuelDiff);
renderCats(
  "duelCats",
  duelCatSel,
  (k) => {
    duelCatSel = k;
    lsSet("gg_dcat2", k);
  },
  { sm: true, noMix: true },
);
$("timerMenu").innerHTML = TIMERS.map(
  ([v, l]) =>
    `<button type="button" class="dd-item${v === 0 ? " sel" : ""}" data-v="${v}" onclick="pickTimer(${v})">${l}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10" /></svg></button>`,
).join("");
pickTimer(90);
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
