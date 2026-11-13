const $ = (id) => document.getElementById(id);
const SUPABASE_URL = "https://mrrixocnhsfulglipvek.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fIFvv3lqR66EOuclo_bscg_Qv8OKNt1";
const LEVELS = ["easy", "medium", "hard", "expert", "impossible"];
const MAX_PLAYERS = 40;
let ME = null;
const TOKEN_KEY = "sg_token";
const LEVEL_NAMES = { easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert", impossible: "Impossible" };
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
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/\s-\s.*$/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const tk = (t) => norm(t.title) + "|" + norm(t.artist);
const sameSong = (t, track) => t.id === track.id || tk(t) === tk(track);
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
const currentName = () => (ME && ME.username) || lsGet("sg_name", "") || "Player";
const NAME_RE = /^[A-Za-z0-9ÅÄÖåäö _.,!?'\-]{3,20}$/;
function checkUsername(v) {
  if (!NAME_RE.test(v)) return "Usernames are 3–20 characters: letters (A–Z, Å, Ä, Ö), numbers and . , ! ? ' - _";
  if (v !== v.trim() || /\s{2,}/.test(v)) return "No extra spaces in usernames.";
  return "";
}
const CROWN_I = '<svg viewBox="2 3.5 20 16.5" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';
const MEDAL_I =
  '<svg viewBox="4.8 1 14.4 21" fill="currentColor"><path d="M6.5 2h4.2l1.6 6.2-3.4 1.6zM17.5 2h-4.2l-1.6 6.2 3.4 1.6z" fill-opacity="0.65"/><circle cx="12" cy="15.2" r="6.6"/><circle cx="12" cy="15.2" r="4" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="1.5"/></svg>';
const HEART_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
let RANK_SRC = {};
const MAIN_BOARDS = ["score"];
const BOARD_LABEL = {
  score: "Score",
  routes: "Routes solved",
  countries: "Countries found",
  accuracy: "Accuracy",
  streak: "Best streak",
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
const BLANK = () => ({ routes: 0, countries: 0, wrong: 0, best: 0, duels: 0, wins: 0, score: 0 });
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
  srv("bg_reset").then((st) =>
    showToast(st ? "All your statistics and scores were reset." : "Couldn't reset right now."),
  );
}
function statTiles() {
  const tot = stats.countries + stats.wrong;
  const acc = tot ? Math.round((stats.countries / tot) * 100) + "%" : "–";
  return [
    [stats.routes.toLocaleString(), "Routes solved"],
    [stats.countries.toLocaleString(), "Countries found"],
    [acc, "Accuracy"],
    [stats.best.toLocaleString(), "Best streak"],
    [stats.duels.toLocaleString(), "Duels played"],
    [stats.wins.toLocaleString(), "Duels won"],
  ]
    .map(([v, l]) => `<div class="stat-tile"><b>${v}</b><span>${l}</span></div>`)
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
    o.frequency.value = { correct: 660, wrong: 170, win: 880, lose: 140, advance: 420 }[kind] || 440;
    o.type = kind === "wrong" || kind === "lose" ? "triangle" : "sine";
    g.gain.setValueAtTime(Math.max(0.0001, sfxVol() * 0.12), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (kind === "wrong" || kind === "lose" ? 0.35 : 0.22));
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
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
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
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + i * 0.08 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0 + i * 0.08);
      o.stop(t0 + 1.7);
    });
  } catch (e) {}
}
const VIEWS = ["homeView", "gameView", "multiplayerView", "lobbyView", "duelView", "resultView"];
function showView(id) {
  document.body.classList.remove("noscroll");
  document.querySelectorAll(".bg-stage.full").forEach((e) => e.classList.remove("full"));
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
  const cols = ["#19d77b", "#0ecb70", "#55efa0", "#0b8f52", "#9aa6a0", "#d6ded9"];
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
    const paused = $("settingsModal").classList.contains("open") || document.hidden;
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
const ATLAS = {
  low: "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json",
  high: "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json",
};
function topoToFeatures(topo, name) {
  const tf = topo.transform;
  const arcs = topo.arcs.map((arc) => {
    let x = 0,
      y = 0;
    return arc.map((p) => {
      if (tf) {
        x += p[0];
        y += p[1];
        return [x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]];
      }
      return [p[0], p[1]];
    });
  });
  const arcPts = (i) => (i < 0 ? arcs[~i].slice().reverse() : arcs[i]);
  const ring = (idxs) => {
    const pts = [];
    idxs.forEach((i, k) => {
      const a = arcPts(i);
      (k ? a.slice(1) : a).forEach((p) => pts.push(p));
    });
    return pts;
  };
  const geom = (g) => {
    if (g.type === "Polygon") return { type: "Polygon", coordinates: g.arcs.map(ring) };
    if (g.type === "MultiPolygon") return { type: "MultiPolygon", coordinates: g.arcs.map((poly) => poly.map(ring)) };
    return null;
  };
  return topo.objects[name].geometries
    .map((g) => ({ type: "Feature", id: g.id, properties: g.properties || {}, geometry: geom(g) }))
    .filter((f) => f.geometry);
}
const LAND = { low: null, high: null },
  ATLAS_STATE = { promise: null, error: "" };
let LOWFC = null;
const lowFC = () => (LAND.low ? (LOWFC ||= { type: "FeatureCollection", features: LAND.low }) : null);
function featureCode(f) {
  const id = f.id === undefined || f.id === null ? "" : String(f.id).padStart(3, "0");
  if (id && BYID[id]) return BYID[id].code;
  if (f.properties && f.properties.name === "Kosovo") return "XK";
  return null;
}
async function fetchTopo(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("map data " + r.status);
  return topoToFeatures(await r.json(), "countries");
}
function loadAtlas() {
  if (ATLAS_STATE.promise) return ATLAS_STATE.promise;
  ATLAS_STATE.promise = (async () => {
    if (!window.d3) throw new Error("The map library didn't load.");
    const high = await fetchTopo(ATLAS.high);
    LAND.high = high;
    fetchTopo(ATLAS.low)
      .then((l) => {
        LAND.low = l;
        try {
          Object.values(GL).forEach((g) => g && g.draw());
        } catch (e) {}
      })
      .catch(() => {});
    return true;
  })().catch((e) => {
    ATLAS_STATE.promise = null;
    ATLAS_STATE.error = String((e && e.message) || e);
    throw e;
  });
  return ATLAS_STATE.promise;
}
const D2R = Math.PI / 180;
const qEuler = (e) => {
  const l = (e[0] / 2) * D2R,
    p = (e[1] / 2) * D2R,
    g = (e[2] / 2) * D2R,
    sl = Math.sin(l),
    cl = Math.cos(l),
    sp = Math.sin(p),
    cp = Math.cos(p),
    sg = Math.sin(g),
    cg = Math.cos(g);
  return [
    cl * cp * cg + sl * sp * sg,
    sl * cp * cg - cl * sp * sg,
    cl * sp * cg + sl * cp * sg,
    cl * cp * sg - sl * sp * cg,
  ];
};
const qCart = (e) => {
  const l = e[0] * D2R,
    p = e[1] * D2R,
    cp = Math.cos(p);
  return [cp * Math.cos(l), cp * Math.sin(l), Math.sin(p)];
};
const qToEuler = (q) => [
  Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) / D2R,
  Math.asin(Math.max(-1, Math.min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) / D2R,
  Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) / D2R,
];
const qMul = (a, b) => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];
const qConj = (q) => [q[0], -q[1], -q[2], -q[3]];
const qNorm = (q) => {
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
};
function qDelta(v0, v1) {
  const w = [v0[1] * v1[2] - v0[2] * v1[1], v0[2] * v1[0] - v0[0] * v1[2], v0[0] * v1[1] - v0[1] * v1[0]],
    l = Math.hypot(w[0], w[1], w[2]);
  if (!l) return [1, 0, 0, 0];
  const t = Math.acos(Math.max(-1, Math.min(1, v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2]))) / 2,
    s = Math.sin(t);
  return [Math.cos(t), (w[2] / l) * s, (-w[1] / l) * s, (w[0] / l) * s];
}
function qPow(q, f) {
  if (q[0] < 0) q = [-q[0], -q[1], -q[2], -q[3]];
  const th = Math.acos(Math.min(1, q[0])),
    s = Math.sin(th);
  if (s < 1e-7) return [1, 0, 0, 0];
  const k = Math.sin(th * f) / s;
  return [Math.cos(th * f), q[1] * k, q[2] * k, q[3] * k];
}
function qSlerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (d < 0) {
    b = [-b[0], -b[1], -b[2], -b[3]];
    d = -d;
  }
  if (d > 0.9995) return qNorm(a.map((x, i) => x + (b[i] - x) * t));
  const th = Math.acos(d),
    s = Math.sin(th),
    w1 = Math.sin((1 - t) * th) / s,
    w2 = Math.sin(t * th) / s;
  return a.map((x, i) => x * w1 + b[i] * w2);
}
const STATE_COL = { start: "#f1ecd8", green: "#2fe08a", yellow: "#e8b84a", red: "#ef4d4d", reveal: "#1f9d5f" };
const LABEL_AT = {};
function labelPoint(code, feat) {
  if (LABEL_AT[code]) return LABEL_AT[code];
  let g = feat.geometry;
  if (g.type === "MultiPolygon") {
    let best = null,
      ba = -1;
    g.coordinates.forEach((c) => {
      const f = { type: "Polygon", coordinates: c },
        a = d3.geoArea(f);
      if (a > ba) {
        ba = a;
        best = f;
      }
    });
    g = best;
  }
  return (LABEL_AT[code] = d3.geoCentroid({ type: "Feature", geometry: g }));
}
function makeGlobe(host) {
  const cv = document.createElement("canvas");
  cv.setAttribute("aria-label", "Interactive globe. Drag to rotate.");
  cv.tabIndex = 0;
  host.insertBefore(cv, host.firstChild);
  const c2 = cv.getContext("2d");
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.6);
  const path = d3.geoPath(proj, c2);
  const projF = d3.geoOrthographic().clipAngle(90).precision(0.7),
    pathF = d3.geoPath(projF, c2);
  const sphere = { type: "Sphere" };
  const G = {
    q: qEuler([-12, -28, 0]),
    rot: [-12, -28, 0],
    zoom: 1,
    zoomT: 1,
    w: 0,
    h: 0,
    dpr: 1,
    raf: 0,
    moving: 0,
    states: new Map(),
    drag: false,
    anim: 0,
    zanim: 0,
    labels: true,
    hiT: 0,
    ready: false,
    feats: new Map(),
    fc: null,
  };
  const setQ = (q) => {
    G.q = qNorm(q);
    G.rot = qToEuler(G.q);
  };
  const radius = () => Math.min(G.w, G.h) * 0.47 * G.zoom;
  function resize() {
    const r = host.getBoundingClientRect();
    G.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    G.w = Math.max(10, r.width);
    G.h = Math.max(10, r.height);
    cv.width = Math.round(G.w * G.dpr);
    cv.height = Math.round(G.h * G.dpr);
    draw();
  }
  function setData() {
    G.fc = { type: "FeatureCollection", features: LAND.high };
    G.feats.clear();
    LAND.high.forEach((f) => {
      const c = featureCode(f);
      if (c) G.feats.set(c, f);
    });
    cullInfo(LAND.high);
    G.ready = true;
    draw();
  }
  function cullInfo(list) {
    if (list.__cull) return;
    list.__cull = true;
    list.forEach((f) => {
      const c = d3.geoCentroid(f);
      let r = 0;
      const walk = (a) => {
        if (typeof a[0] === "number") {
          const d = d3.geoDistance(c, a);
          if (d > r) r = d;
        } else for (let i = 0; i < a.length; i++) walk(a[i]);
      };
      walk(f.geometry.coordinates);
      f.__c = c;
      f.__r = r;
      const g = f.geometry,
        polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
      f.__w = polys.some((pl) =>
        pl.some((rg) => {
          let a = 1e9,
            b = -1e9;
          rg.forEach((p) => {
            if (p[0] < a) a = p[0];
            if (p[0] > b) b = p[0];
          });
          return b - a >= 359;
        }),
      );
    });
  }
  const under = document.createElement("canvas"),
    over = document.createElement("canvas");
  let layerKey = "";
  function layers(R, cx, cy) {
    const key = [G.w, G.h, G.dpr, R.toFixed(1)].join("|");
    if (key === layerKey) return;
    layerKey = key;
    under.width = over.width = cv.width;
    under.height = over.height = cv.height;
    const u = under.getContext("2d"),
      o = over.getContext("2d"),
      p = d3.geoPath(d3.geoOrthographic().translate([cx, cy]).scale(R).clipAngle(90).precision(0.6), null);
    [u, o].forEach((k) => k.setTransform(G.dpr, 0, 0, G.dpr, 0, 0));
    let g = u.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.2);
    g.addColorStop(0, "rgba(25,215,123,0.2)");
    g.addColorStop(0.35, "rgba(25,215,123,0.07)");
    g.addColorStop(1, "rgba(25,215,123,0)");
    u.fillStyle = g;
    u.beginPath();
    u.arc(cx, cy, R * 1.2, 0, 6.2832);
    u.fill();
    g = u.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R * 1.05);
    g.addColorStop(0, "#16202c");
    g.addColorStop(0.5, "#0e1520");
    g.addColorStop(1, "#070b12");
    u.beginPath();
    u.arc(cx, cy, R, 0, 6.2832);
    u.fillStyle = g;
    u.fill();
    g = o.createRadialGradient(cx - R * 0.32, cy - R * 0.36, R * 0.3, cx, cy, R);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.7, "rgba(2,5,9,0.22)");
    g.addColorStop(1, "rgba(2,5,9,0.72)");
    o.beginPath();
    o.arc(cx, cy, R, 0, 6.2832);
    o.fillStyle = g;
    o.fill();
    o.beginPath();
    o.arc(cx, cy, R, 0, 6.2832);
    o.strokeStyle = "rgba(190,225,205,0.16)";
    o.lineWidth = 1;
    o.stroke();
  }
  function decimate(list, k) {
    if (k <= 1) return list;
    const ring = (r) => {
      if (r.length < 90) return r;
      const out = [];
      for (let i = 0; i < r.length - 1; i += k) out.push(r[i]);
      out.push(r[r.length - 1]);
      if (out.length < 4) return r;
      const a1 = d3.geoArea({ type: "Polygon", coordinates: [r] }),
        a2 = d3.geoArea({ type: "Polygon", coordinates: [out] });
      return Math.abs(a2 - a1) <= 0.05 * Math.max(a1, 1e-9) ? out : r;
    };
    return list.map((f) => {
      const g = f.geometry;
      if (!g) return f;
      const geometry =
        g.type === "Polygon"
          ? { type: "Polygon", coordinates: g.coordinates.map(ring) }
          : g.type === "MultiPolygon"
            ? { type: "MultiPolygon", coordinates: g.coordinates.map((poly) => poly.map(ring)) }
            : g;
      const m = { ...f, geometry };
      m.__c = f.__c;
      m.__r = f.__r;
      m.__w = f.__w;
      return m;
    });
  }
  function polyList(list) {
    const out = [];
    list.forEach((f) => {
      const g = f.geometry;
      if (!g) return;
      const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
      polys.forEach((coords) => {
        const geo = { type: "Polygon", coordinates: coords };
        if (d3.geoArea(geo) > 2 * Math.PI) return;
        const c = d3.geoCentroid(geo);
        let r = 0;
        coords[0].forEach((p) => {
          const d = d3.geoDistance(c, p);
          if (d > r) r = d;
        });
        if (coords[0].some((p) => Math.abs(p[1]) > 89.5)) r = Math.PI;
        out.push({ geo, c, r });
      });
    });
    return out;
  }
  function draw() {
    G.raf = 0;
    if (!G.w) return;
    const R = radius(),
      cx = G.w / 2,
      cy = G.h / 2;
    proj.translate([cx, cy]).scale(R).rotate(G.rot);
    c2.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    c2.clearRect(0, 0, G.w, G.h);
    layers(R, cx, cy);
    c2.save();
    c2.setTransform(1, 0, 0, 1, 0, 0);
    c2.drawImage(under, 0, 0);
    c2.restore();
    const k = G.moving ? (G.zoom < 1.4 ? 4 : G.zoom < 2.2 ? 3 : G.zoom < 3.2 ? 2 : 1) : 1;
    const cap = Math.min(Math.PI / 2, Math.asin(Math.min(1, Math.hypot(G.w, G.h) / 2 / R)) + 0.08);
    LAND.lv ||= [];
    LAND.lvF ||= [];
    LAND.lvP ||= [];
    if (!LAND.lv[k]) {
      LAND.lv[k] = decimate(LAND.high, k);
      LAND.lvF[k] = new Map();
      LAND.lv[k].forEach((f) => {
        const c = featureCode(f);
        if (c) LAND.lvF[k].set(c, f);
      });
      LAND.lvP[k] = polyList(LAND.lv[k]);
    }
    proj.clipExtent([
      [-24, -24],
      [G.w + 24, G.h + 24],
    ]);
    if (G.fc) {
      const centre = proj.invert([cx, cy]),
        lim = cap,
        list = LAND.lvP[k];
      proj.precision(G.moving ? 1.6 : 0.7);
      c2.beginPath();
      list.forEach((p) => {
        if (p.r * R < 0.35) return;
        if (!centre || d3.geoDistance(p.c, centre) < lim + p.r) path(p.geo);
      });
      c2.fillStyle = "#2c3933";
      c2.fill();
      c2.strokeStyle = "rgba(178,196,186,0.42)";
      c2.lineWidth = Math.max(0.4, Math.min(0.9, R / 380));
      c2.lineJoin = "round";
      c2.stroke();
    }
    G.states.forEach((st, code) => {
      let f = LAND.lvF[k].get(code) || G.feats.get(code);
      if (!f) return;
      if (f.__ok === undefined) f.__ok = d3.geoArea(f) < 2 * Math.PI;
      if (!f.__ok) {
        f = G.feats.get(code);
        if (!f) return;
        if (f.__ok === undefined) f.__ok = d3.geoArea(f) < 2 * Math.PI;
        if (!f.__ok) return;
      }
      c2.beginPath();
      path(f);
      c2.fillStyle = STATE_COL[st.kind] || "#fff";
      c2.globalAlpha = st.kind === "reveal" ? 0.8 : 1;
      c2.fill();
      c2.globalAlpha = 1;
      c2.strokeStyle = "rgba(8,12,10,0.6)";
      c2.lineWidth = 0.7;
      c2.stroke();
    });
    c2.save();
    c2.setTransform(1, 0, 0, 1, 0, 0);
    c2.drawImage(over, 0, 0);
    c2.restore();
    if (G.labels) drawLabels(R);
  }
  function drawLabels(R) {
    const centre = proj.invert([G.w / 2, G.h / 2]),
      placed = [];
    if (!centre) return;
    const zf = Math.max(0, Math.min(1, (G.zoom - 0.82) / 0.16));
    if (zf <= 0.01) return;
    const fs = Math.max(10, Math.min(12, G.w / 36));
    c2.font = `700 ${fs}px "DM Sans", sans-serif`;
    c2.textBaseline = "middle";
    c2.textAlign = "center";
    const items = [];
    G.states.forEach((st, code) => {
      if (!st.label) return;
      const f = G.feats.get(code);
      if (!f) return;
      const ll = labelPoint(code, f);
      if (d3.geoDistance(ll, centre) > 1.42) return;
      const p = proj(ll);
      if (!p) return;
      items.push({ code, st, x: p[0], y: p[1], d: d3.geoDistance(ll, centre) });
    });
    items.sort((a, b) => b.y - a.y);
    items.forEach((it) => {
      const name = CT[it.code] ? CT[it.code].name : it.code;
      const w = c2.measureText(name).width + 16,
        h = fs + 8;
      const x = it.x;
      let y = it.y - h / 2 - 6;
      for (let k = 0; k < 6; k++) {
        const hit = placed.find((r) => Math.abs(r.x - x) < (r.w + w) / 2 && Math.abs(r.y - y) < h + 1);
        if (!hit) break;
        y = hit.y - h - 3;
      }
      placed.push({ x, y, w });
      const light = it.st.kind === "start";
      c2.save();
      c2.globalAlpha = zf * Math.max(0, Math.min(1, (1.42 - it.d) / 0.25));
      if (!G.moving) {
        c2.shadowColor = "rgba(0,0,0,0.5)";
        c2.shadowBlur = 7;
        c2.shadowOffsetY = 2;
      }
      c2.beginPath();
      c2.roundRect ? c2.roundRect(x - w / 2, y - h / 2, w, h, h / 2) : c2.rect(x - w / 2, y - h / 2, w, h);
      c2.fillStyle = light ? "#f1ecd8" : "rgba(9,14,11,0.94)";
      c2.fill();
      c2.restore();
      c2.save();
      c2.globalAlpha = zf * Math.max(0, Math.min(1, (1.42 - it.d) / 0.25));
      if (!light) {
        c2.beginPath();
        c2.roundRect ? c2.roundRect(x - w / 2, y - h / 2, w, h, h / 2) : c2.rect(x - w / 2, y - h / 2, w, h);
        c2.lineWidth = 1;
        c2.strokeStyle = STATE_COL[it.st.kind] || "#fff";
        c2.globalAlpha *= 0.6;
        c2.stroke();
        c2.globalAlpha = zf * Math.max(0, Math.min(1, (1.42 - it.d) / 0.25));
      }
      c2.beginPath();
      c2.moveTo(x - 3.5, y + h / 2 - 0.5);
      c2.lineTo(x + 3.5, y + h / 2 - 0.5);
      c2.lineTo(x, y + h / 2 + 4);
      c2.closePath();
      c2.fillStyle = light ? "#f1ecd8" : "rgba(9,14,11,0.94)";
      c2.fill();
      c2.fillStyle = light ? "#161b17" : "#f1f6f2";
      c2.fillText(name, x, y + 0.5);
      c2.restore();
    });
  }
  function want() {
    if (!G.raf) G.raf = requestAnimationFrame(draw);
  }
  function bump() {
    if (!G.moving) document.body.classList.add("gmove");
    G.moving++;
    clearTimeout(G.hiT);
    G.hiT = setTimeout(() => {
      G.moving = 0;
      document.body.classList.remove("gmove");
      want();
    }, 140);
    want();
  }
  function stopRot() {
    cancelAnimationFrame(G.anim);
    G.anim = 0;
  }
  function fly(lonlat, zoom, ms) {
    stopRot();
    const from = G.q,
      to = qEuler([-lonlat[0], -lonlat[1], 0]),
      z0 = G.zoom,
      t0 = performance.now();
    G.zoomT = zoom;
    cancelAnimationFrame(G.zanim);
    G.zanim = 0;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms),
        e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setQ(qSlerp(from, to, e));
      G.zoom = z0 + (zoom - z0) * e;
      bump();
      if (k < 1) G.anim = requestAnimationFrame(step);
      else G.anim = 0;
    };
    G.anim = requestAnimationFrame(step);
  }
  function frame(a, b) {
    const A = G.feats.get(a),
      B = G.feats.get(b);
    if (!A || !B) return;
    const pa = labelPoint(a, A),
      pb = labelPoint(b, B);
    const mid = d3.geoInterpolate(pa, pb)(0.5),
      ang = d3.geoDistance(pa, pb);
    const z = Math.max(1, Math.min(3.2, 0.62 / Math.max(0.22, Math.sin(Math.min(ang, 2.2) * 0.75))));
    fly(mid, z, 1200);
  }
  function zoomTick() {
    let last = performance.now();
    const step = (t) => {
      const dt = Math.min(50, t - last);
      last = t;
      G.zoom += (G.zoomT - G.zoom) * (1 - Math.exp(-dt / 85));
      bump();
      if (Math.abs(G.zoomT - G.zoom) > G.zoomT * 0.002) G.zanim = requestAnimationFrame(step);
      else {
        G.zoom = G.zoomT;
        G.zanim = 0;
        want();
      }
    };
    if (!G.zanim) G.zanim = requestAnimationFrame(step);
  }
  function zoomBy(k) {
    G.zoomT = Math.max(0.75, Math.min(8, G.zoomT * k));
    zoomTick();
  }
  const ptrs = new Map();
  let pinch = 0,
    drag = null;
  let rc = null;
  const local = (e) => {
    const r = rc || (rc = cv.getBoundingClientRect());
    return [e.clientX - r.left, e.clientY - r.top];
  };
  function onSphere(x, y, rot) {
    const R = radius(),
      cx = G.w / 2,
      cy = G.h / 2;
    let dx = x - cx,
      dy = y - cy;
    const d = Math.hypot(dx, dy),
      lim = R * 0.996;
    if (d > lim) {
      dx *= lim / d;
      dy *= lim / d;
    }
    proj.translate([cx, cy]).scale(R).rotate(rot);
    const ll = proj.invert([cx + dx, cy + dy]);
    return ll ? qCart(ll) : null;
  }
  const setRot = (l, p) => {
    G.rot = [l, Math.max(-90, Math.min(90, p)), 0];
    G.q = qEuler(G.rot);
  };
  const degPerPx = () => (K_DRAG * 57.2958) / radius();
  const K_DRAG = 0.9;
  cv.addEventListener("pointerdown", (e) => {
    rc = null;
    cv.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, local(e));
    stopRot();
    host.classList.add("drag");
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
      drag = null;
      return;
    }
    const [x, y] = local(e);
    drag = { lx: x, ly: y, t: performance.now(), vl: 0, vp: 0 };
    setRot(G.rot[0], G.rot[1]);
    bump();
  });
  cv.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, local(e));
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()],
        d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch) {
        G.zoomT = G.zoom = Math.max(0.75, Math.min(8, (G.zoom * d) / pinch));
        bump();
      }
      pinch = d;
      return;
    }
    if (!drag) return;
    const [x, y] = local(e),
      now = performance.now(),
      dt = Math.max(4, now - drag.t),
      k = degPerPx();
    const cosp = Math.max(0.35, Math.cos(G.rot[1] * D2R));
    const dl = ((x - drag.lx) * k) / cosp,
      dp = -(y - drag.ly) * k;
    drag.lx = x;
    drag.ly = y;
    drag.t = now;
    drag.vl = drag.vl * 0.55 + (dl / dt) * 0.45;
    drag.vp = drag.vp * 0.55 + (dp / dt) * 0.45;
    setRot(G.rot[0] + dl, G.rot[1] + dp);
    bump();
  });
  const up = (e) => {
    ptrs.delete(e.pointerId);
    pinch = 0;
    if (ptrs.size) {
      drag = null;
      return;
    }
    host.classList.remove("drag");
    const d = drag;
    drag = null;
    if (d && performance.now() - d.t < 80 && Math.hypot(d.vl, d.vp) > 0.02) coast(d.vl, d.vp);
  };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
  function coast(vl, vp) {
    let last = performance.now();
    const step = (t) => {
      const dt = Math.min(40, t - last);
      last = t;
      const f = Math.exp(-dt / 380);
      vl *= f;
      vp *= f;
      if (Math.hypot(vl, vp) < 0.004) {
        G.anim = 0;
        want();
        return;
      }
      setRot(G.rot[0] + vl * dt, G.rot[1] + vp * dt);
      bump();
      G.anim = requestAnimationFrame(step);
    };
    stopRot();
    G.anim = requestAnimationFrame(step);
  }
  cv.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomBy(Math.exp(-Math.max(-120, Math.min(120, dy)) * 0.0018));
    },
    { passive: false },
  );
  cv.addEventListener("keydown", (e) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (k) {
      e.preventDefault();
      const ang = (7 * D2R) / Math.max(1, G.zoom),
        ax = [-k[1], k[0], 0],
        s = Math.sin(ang / 2);
      const r = [Math.cos(ang / 2), 0, 0, 0];
      const c = onSphere(G.w / 2, G.h / 2, G.rot),
        t = onSphere(G.w / 2 + k[0] * -40, G.h / 2 + k[1] * 40, G.rot);
      if (c && t) {
        stopRot();
        setQ(qNorm(qMul(G.q, qDelta(t, c))));
        bump();
      }
    } else if (e.key === "+" || e.key === "=") zoomBy(1.25);
    else if (e.key === "-") zoomBy(1 / 1.25);
  });
  new ResizeObserver(() => resize()).observe(host);
  return {
    G,
    resize,
    setData,
    draw: want,
    drawNow: draw,
    frame,
    zoomBy,
    set(code, kind, label = true) {
      G.states.set(code, { kind, label });
      want();
    },
    clear() {
      G.states.clear();
      want();
    },
    setLabels(v) {
      G.labels = !!v;
      want();
    },
    home() {
      fly([10, 25], 1, 900);
    },
    show(code) {
      const f = G.feats.get(code);
      if (!f) return;
      const ll = labelPoint(code, f),
        c = proj.invert([G.w / 2, G.h / 2]);
      if (!c || d3.geoDistance(ll, c) > 1.15) fly(ll, G.zoomT, 900);
    },
  };
}
const REGIONS = [
  { v: "all", label: "All continents" },
  { v: "continental", label: "Continental" },
  { v: "AF", label: "Africa" },
  { v: "AS", label: "Asia" },
  { v: "EU", label: "Europe" },
  { v: "NA", label: "North America" },
  { v: "SA", label: "South America" },
];
const regionLabel = (v) => (REGIONS.find((r) => r.v === v) || REGIONS[0]).label;
function wheelTick() {
  try {
    const v = sfxVol();
    if (v <= 0) return;
    const c = ctx(),
      t = c.currentTime;
    const len = Math.floor(c.sampleRate * 0.012),
      buf = c.createBuffer(1, len, c.sampleRate),
      d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const n = c.createBufferSource(),
      bp = c.createBiquadFilter(),
      ng = c.createGain();
    n.buffer = buf;
    bp.type = "bandpass";
    bp.frequency.value = 2600;
    bp.Q.value = 0.9;
    ng.gain.value = Math.min(1, v * 1.4);
    n.connect(bp);
    bp.connect(ng);
    ng.connect(c.destination);
    n.start(t);
    const o = c.createOscillator(),
      og = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(1500, t);
    o.frequency.exponentialRampToValueAtTime(700, t + 0.03);
    og.gain.setValueAtTime(Math.max(0.0002, v * 0.2), t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.connect(og);
    og.connect(c.destination);
    o.start(t);
    o.stop(t + 0.06);
  } catch (e) {}
}
function makeWheel(root, items, value, onChange, opts = {}) {
  const calm = !!opts.calm;
  root.classList.add("wheel-h");
  if (calm) root.classList.add("calm");
  root.innerHTML = '<i class="wheel-arrow"></i><div class="wheel-items"></div>';
  const box = root.querySelector(".wheel-items"),
    arrow = root.querySelector(".wheel-arrow"),
    N = items.length;
  const els = items.map((it) => {
    const b = document.createElement("span");
    b.className = "wheel-item";
    b.textContent = it.label;
    box.appendChild(b);
    return b;
  });
  const GAP = 18;
  let X = [],
    T = 0,
    unit = 90;
  function measure() {
    const w = els.map((e) => e.getBoundingClientRect().width || 70);
    X = [];
    let acc = 0;
    for (let i = 0; i < N; i++) {
      X.push(acc);
      acc += (w[i] + w[(i + 1) % N]) / 2 + GAP;
    }
    T = acc;
    unit = T / N;
  }
  const IW = () => unit;
  let raw = Math.max(
      0,
      items.findIndex((x) => x.v === value),
    ),
    committed = Math.round(raw),
    shown = committed,
    raf = 0,
    drag = null,
    arrowT = 0;
  root.tabIndex = 0;
  root.setAttribute("role", "listbox");
  root.setAttribute("aria-label", "Region");
  const wrap = (i) => ((i % N) + N) % N;
  const Xf = (t) => {
    const n = Math.floor(t),
      f = t - n,
      i = wrap(n),
      nx = i === N - 1 ? T : X[i + 1];
    return X[i] + Math.floor(n / N) * T + (nx - X[i]) * f;
  };
  const warp = (p) => {
    if (calm) return p;
    const r = Math.round(p),
      f = p - r;
    return r + Math.sign(f) * 0.5 * Math.pow(Math.abs(f) * 2, 1.15);
  };
  const ease = (x) => x * x * (3 - 2 * x);
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  function render() {
    if (!X.length) measure();
    const p = warp(raw),
      c = Xf(p);
    els.forEach((b, i) => {
      let d = i - p;
      d = ((((d + N / 2) % N) + N) % N) - N / 2;
      const ad = Math.abs(d);
      if (ad > 1.75) {
        b.style.opacity = 0;
        b.style.visibility = "hidden";
        return;
      }
      b.style.visibility = "visible";
      const op = ad <= 1 ? 1 - 0.5 * ease(ad) : 0.5 * ease(Math.max(0, (1.75 - ad) / 0.75));
      b.style.opacity = op.toFixed(3);
      const k = ease(Math.max(0, 1 - ad)),
        g = (v) => mix(143, 255, k);
      b.style.color = `rgb(${mix(143, 255, k)},${mix(156, 255, k)},${mix(148, 255, k)})`;
      b.style.transform = `translateX(${(Xf(p + d) - c).toFixed(1)}px)`;
      b.classList.toggle("sel", ad < 0.5);
    });
    const idx = wrap(Math.round(raw));
    if (idx !== shown) {
      shown = idx;
      wheelTick();
    }
  }
  function showArrow(on) {
    clearTimeout(arrowT);
    if (on) arrow.classList.add("on");
    else arrowT = setTimeout(() => arrow.classList.remove("on"), 650);
  }
  function settleDone() {
    const idx = wrap(Math.round(raw));
    if (idx !== committed) {
      committed = idx;
      onChange(items[idx].v, items[idx]);
    }
    showArrow(false);
  }
  function spring(target, v0) {
    cancelAnimationFrame(raf);
    showArrow(true);
    let last = performance.now(),
      vel = v0 || 0;
    const step = (t) => {
      const dt = Math.min(0.04, (t - last) / 1000);
      last = t;
      const k = calm ? 90 : 120,
        c = 2 * Math.sqrt(k),
        a = k * (target - raw) - c * vel;
      vel += a * dt;
      raw += vel * dt;
      render();
      if (Math.abs(target - raw) < 0.0015 && Math.abs(vel) < 0.02) {
        raw = target;
        render();
        settleDone();
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => vel;
  }
  let springVel = null;
  function goTo(target, v0) {
    cancelAnimationFrame(raf);
    springVel = spring(target, v0);
  }
  function nudge(k) {
    goTo(Math.round(raw) + k);
  }
  root.addEventListener("pointerdown", (e) => {
    cancelAnimationFrame(raf);
    raf = 0;
    drag = { x: e.clientX, t: performance.now(), moved: 0, v: 0, x0: e.clientX };
    root.setPointerCapture(e.pointerId);
    showArrow(true);
    root.classList.add("drag");
  });
  root.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x,
      now = performance.now(),
      dt = Math.max(6, now - drag.t);
    const gain = 0.9;
    raw -= (dx / IW()) * gain;
    drag.v = drag.v * 0.6 + (((-dx / IW()) * gain) / dt) * 1000 * 0.4;
    drag.moved += Math.abs(dx);
    drag.x = e.clientX;
    drag.t = now;
    render();
  });
  const end = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    root.classList.remove("drag");
    if (d.moved < 5) {
      const r = root.getBoundingClientRect(),
        off = (e.clientX - (r.left + r.width / 2)) / IW();
      goTo(Math.round(raw) + Math.max(-1, Math.min(1, Math.round(off))));
      return;
    }
    const v = performance.now() - d.t < 120 ? d.v : 0;
    goTo(Math.round(raw + Math.max(-1.5, Math.min(1.5, v * 0.18))), Math.max(-6, Math.min(6, v)));
  };
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
  let wt = 0;
  root.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const n = performance.now();
      if (n - wt < 130) return;
      wt = n;
      const dd = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(dd) > 2) nudge(dd > 0 ? 1 : -1);
    },
    { passive: false },
  );
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nudge(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nudge(-1);
    }
  });
  new ResizeObserver(() => {
    measure();
    render();
  }).observe(root);
  measure();
  render();
  if (document.fonts) {
    document.fonts.ready.then(() => {
      measure();
      render();
    });
    document.fonts.addEventListener &&
      document.fonts.addEventListener("loadingdone", () => {
        measure();
        render();
      });
  }
  setTimeout(() => {
    measure();
    render();
  }, 400);
  return {
    set(v) {
      const i = items.findIndex((x) => x.v === v);
      if (i < 0) return;
      cancelAnimationFrame(raf);
      raf = 0;
      raw = i;
      committed = i;
      shown = i;
      render();
    },
    get: () => items[committed].v,
  };
}
const CT = {},
  BYID = {};
CDATA.split("\n").forEach((l) => {
  const [id, code, name, cont] = l.split("|");
  const o = { code, id, name, cont };
  CT[code] = o;
  BYID[id] = o;
});
const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const COUNTRIES = Object.values(CT).map((c) => ({ ...c, keys: [fold(c.name), ...(ALIASES[c.code] || []).map(fold)] }));
const CONT_NAME = { AF: "Africa", AS: "Asia", EU: "Europe", NA: "North America", SA: "South America", OC: "Oceania" };
const ADJ = {};
EDGE_STR.split(";").forEach((part) => {
  const [a, bs] = part.split(":");
  bs.split(",").forEach((b) => {
    (ADJ[a] ||= new Set()).add(b);
    (ADJ[b] ||= new Set()).add(a);
  });
});
const flagImg = (c, cls = "bg-flag") =>
  `<img class="${cls}" src="https://flagcdn.com/w40/${c.toLowerCase()}.png" srcset="https://flagcdn.com/w80/${c.toLowerCase()}.png 2x" alt="" onerror="this.style.visibility='hidden'">`;
const cname = (c) => (CT[c] ? CT[c].name : c);
const DISTC = {};
function distFrom(s) {
  if (DISTC[s]) return DISTC[s];
  const d = { [s]: 0 },
    q = [s];
  for (let i = 0; i < q.length; i++)
    for (const y of ADJ[q[i]] || [])
      if (!(y in d)) {
        d[y] = d[q[i]] + 1;
        q.push(y);
      }
  return (DISTC[s] = d);
}
function makeRoute(a, b) {
  const da = distFrom(a),
    db = distFrom(b),
    L = da[b],
    on = new Set(),
    det = new Set(),
    layers = [];
  Object.keys(da).forEach((x) => {
    if (x === a || x === b) return;
    const t = da[x] + (db[x] === undefined ? 99 : db[x]);
    if (t === L) {
      on.add(x);
      (layers[da[x]] ||= []).push(x);
    } else if (t <= L + 2) det.add(x);
  });
  return { a, b, L, between: L - 1, on, det, layers };
}
function isComplete(rt, greens) {
  let cur = [rt.a];
  for (let k = 1; k <= rt.L - 1; k++) {
    const nx = (rt.layers[k] || []).filter((x) => greens.has(x) && cur.some((y) => ADJ[y].has(x)));
    if (!nx.length) return false;
    cur = nx;
  }
  return true;
}
function foundPath(r) {
  const ok = new Set([r.a, r.b]);
  r.guesses.forEach((k, c) => {
    if (k !== "red") ok.add(c);
  });
  const prev = { [r.a]: null },
    q = [r.a];
  while (q.length && !(r.b in prev)) {
    const x = q.shift();
    ADJ[x].forEach((y) => {
      if (ok.has(y) && !(y in prev)) {
        prev[y] = x;
        q.push(y);
      }
    });
  }
  if (!(r.b in prev)) return null;
  const path = [];
  for (let x = r.b; x !== null; x = prev[x]) path.unshift(x);
  return path;
}
function bestPath(rt, greens) {
  let prev = [rt.a];
  const best = { [rt.a]: { s: 0, from: null } };
  for (let k = 1; k <= rt.L - 1; k++) {
    const layer = [];
    (rt.layers[k] || []).forEach((x) => {
      let bx = null;
      prev.forEach((y) => {
        if (ADJ[y].has(x)) {
          const s = best[y].s + (greens.has(x) ? 1 : 0);
          if (!bx || s > bx.s) bx = { s, from: y };
        }
      });
      if (bx) {
        best[x] = bx;
        layer.push(x);
      }
    });
    prev = layer;
  }
  let end = prev[0],
    bs = -1;
  prev.forEach((x) => {
    if (best[x].s > bs) {
      bs = best[x].s;
      end = x;
    }
  });
  const path = [rt.b];
  for (let x = end; x; x = best[x] && best[x].from) {
    path.unshift(x);
    if (x === rt.a) break;
  }
  return path;
}
const GRAPH_NODES = Object.keys(ADJ).filter((c) => CT[c] && CT[c].cont !== "OC");
const POOLS = {};
function poolFor(scope) {
  if (POOLS[scope]) return POOLS[scope];
  const pairs = [];
  for (let i = 0; i < GRAPH_NODES.length; i++) {
    const a = GRAPH_NODES[i],
      da = distFrom(a);
    for (let j = i + 1; j < GRAPH_NODES.length; j++) {
      const b = GRAPH_NODES[j];
      const ok = scope === "continental" ? CT[a].cont !== CT[b].cont : CT[a].cont === scope && CT[b].cont === scope;
      if (ok && da[b] !== undefined && da[b] >= 2) pairs.push({ a, b, n: da[b] - 1 });
    }
  }
  return (POOLS[scope] = { pairs, M: pairs.reduce((m, p) => Math.max(m, p.n), 0) });
}
function bandFor(di, M) {
  if (M >= 15)
    return [
      [1, 2],
      [3, 4],
      [5, 7],
      [8, 9],
      [10, 15],
    ][di];
  const lo = 1 + Math.floor((di * M) / 5);
  return [lo, di === 4 ? M : Math.max(lo, Math.floor(((di + 1) * M) / 5))];
}
let RECENT = [];
try {
  RECENT = JSON.parse(lsGet("bg_recent", "[]")) || [];
} catch (e) {
  RECENT = [];
}
function pushRecent(a, b) {
  const rt = makeRoute(a, b);
  RECENT.push(a, b);
  rt.on.forEach((x) => RECENT.push("m:" + x));
  RECENT = RECENT.slice(-220);
  lsSet("bg_recent", JSON.stringify(RECENT));
}
function weightedPick(c, easy) {
  if (c.length > 140) c = shuffle(c.slice()).slice(0, 140);
  const cnt = {};
  RECENT.forEach((x) => {
    cnt[x] = (cnt[x] || 0) + 1;
  });
  let tot = 0;
  const w = c.map((p) => {
    const rt = makeRoute(p.a, p.b);
    let mids = 0,
      k = 0;
    rt.on.forEach((x) => {
      mids += cnt["m:" + x] || 0;
      k++;
    });
    const score = 1.6 * ((cnt[p.a] || 0) + (cnt[p.b] || 0)) + (k ? mids / Math.sqrt(k) : 0) * 0.5 + Math.random() * 0.4;
    const x = Math.pow(1 / (1 + score), 1.7) * (easy && p.n === 1 ? 2 : 1);
    tot += x;
    return x;
  });
  let r = Math.random() * tot;
  for (let i = 0; i < c.length; i++) {
    r -= w[i];
    if (r <= 0) return c[i];
  }
  return c[c.length - 1];
}
function chooseRound(scope, diff) {
  const di = Math.max(0, LEVELS.indexOf(diff));
  const scopes = scope === "all" ? ["AF", "AS", "EU", "NA", "SA"] : [scope];
  const opts = [];
  scopes.forEach((sc) => {
    const P = poolFor(sc);
    if (!P.pairs.length) return;
    if (scope === "all" && P.M < [0, 1, 3, 5, 7][di]) return;
    const [lo, hi] = bandFor(di, P.M);
    let c = P.pairs.filter((p) => p.n >= lo && p.n <= hi);
    if (di === 0) {
      const f = c.filter((p) => FAMOUS.has(p.a) && FAMOUS.has(p.b));
      if (f.length >= 30) c = f;
      else {
        const h = c.filter((p) => FAMOUS.has(p.a) || FAMOUS.has(p.b));
        if (h.length >= 12) c = h;
      }
    } else if (di === 1) {
      const f = c.filter((p) => FAMOUS.has(p.a) || FAMOUS.has(p.b));
      if (f.length >= 10) c = f;
    }
    if (c.length) opts.push(c);
  });
  if (!opts.length) {
    const P = poolFor(scope === "all" ? "AS" : scope);
    opts.push(P.pairs.length ? P.pairs : poolFor("continental").pairs);
  }
  let pick = opts[0];
  if (opts.length > 1) {
    const ws = opts.map((o) => Math.sqrt(o.length)),
      tot = ws.reduce((x, y) => x + y, 0);
    let r = Math.random() * tot;
    pick = opts[opts.length - 1];
    for (let i = 0; i < opts.length; i++) {
      r -= ws[i];
      if (r <= 0) {
        pick = opts[i];
        break;
      }
    }
  }
  const p = weightedPick(pick, di === 0);
  return Math.random() < 0.5 ? { a: p.a, b: p.b } : { a: p.b, b: p.a };
}
const DIFF_MULT = { easy: 1, medium: 1.2, hard: 1.4, expert: 2.2, impossible: 3.2 };
const HEARTS = { easy: 6, medium: 7, hard: 10, expert: 12, impossible: 15 };
const WRONG_CAP = [1e9, 2600, 1500, 800, 400];
function ptsFor(diff, n, wrongs, secs, before) {
  const speed = 0.3 + 0.7 * Math.exp(-Math.max(0.5, secs) / (14 * n + 12));
  let p = Math.round(
    (450 + 330 * n) * speed * Math.pow(0.8, wrongs) * (DIFF_MULT[diff] || 1) * (1 + Math.min(0.25, 0.05 * before)),
  );
  p = Math.min(p, WRONG_CAP[Math.min(wrongs, 4)]);
  return Math.max(10, p);
}
const R = { solo: null, duel: null },
  GL = { solo: null, duel: null };
const SEARCH_SVG =
  '<svg class="mag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const X_SVG =
  '<svg class="xm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const BACK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const FLAME_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2 1-3.2 2-4.3.3 1.3 1 2 1.8 2.3C10.5 8 10.8 4.5 12 2z"/></svg>';
const FLAG_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>';
const CROWN_SVG =
  '<svg class="crown" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';
const CHIP_ICON = {
  green:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 5 5 9-11"/></svg>',
  yellow:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9c3-4 6 4 9 0s5-3 7 0M4 16c3-4 6 4 9 0s5-3 7 0"/></svg>',
  red: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};
function gameHTML(p) {
  return `
    <div class="bg-card" id="${p}Panel">
      <div class="bg-head">
        <div class="bg-side"><small>FROM</small><b class="nm" id="${p}From">&nbsp;</b></div>
        <div class="bg-mid"><small>BETWEEN</small><b id="${p}Between">-</b></div>
        <div class="bg-side to"><small>TO</small><b class="nm" id="${p}To">&nbsp;</b></div>
      </div>
      <div class="bg-stage" id="${p}Stage">
        <div class="bg-chips" id="${p}Chips"></div>
        <div class="bg-load" id="${p}Load"><i></i><span>Loading the globe...</span></div>
        <button class="bg-ctl info" onclick="toggleLegend('${p}')" aria-label="What do the colours mean?"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg></button>
        <div class="bg-legend" id="${p}Legend"><div><i style="background:#2fe08a"></i><b>Green</b> On a shortest route</div><div><i style="background:#e8b84a"></i><b>Yellow</b> A short detour</div><div><i style="background:#ef4d4d"></i><b>Red</b> Off course</div></div>
        <div class="bg-zoom">
          <button class="bg-ctl" onclick="zoomGlobe('${p}',1.35)" aria-label="Zoom in">+</button>
          <button class="bg-ctl" onclick="zoomGlobe('${p}',1/1.35)" aria-label="Zoom out">&minus;</button>
          <button class="bg-ctl" onclick="toggleFull('${p}')" aria-label="Full screen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
        </div>
        <div class="bg-crumb" id="${p}Crumb"></div>
      </div>
      <div id="${p}Action">
        <div class="answer-row">
          <div class="search" id="${p}Search">${SEARCH_SVG}<input id="${p}Input" autocomplete="off" spellcheck="false" placeholder="Search countries..." oninput="guessInput('${p}')" onkeydown="guessKey(event,'${p}')" />${X_SVG}<div class="hearts-in" id="${p}HeartsCard" title="Hearts left"><b id="${p}Hearts">6</b>${HEART_SVG}</div></div>
          <button class="gs-btn" id="${p}Btn" onclick="guessPress('${p}')"><span class="ico">${FLAG_SVG}</span><span class="lbl">Give up</span></button>
        </div>
        <div class="sugg" id="${p}Sugg"></div>
        <div class="msg" id="${p}Msg"></div>
      </div>
    </div>`;
}
function toggleLegend(p) {
  $(p + "Legend").classList.toggle("open");
}
function zoomGlobe(p, k) {
  GL[p] && GL[p].zoomBy(k);
}
function toggleFull(p) {
  const st = $(p + "Stage"),
    on = !st.classList.contains("full");
  st.classList.toggle("full", on);
  document.body.classList.toggle("noscroll", on);
  if (GL[p]) setTimeout(() => GL[p].resize(), 30);
}
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Escape") {
      const f = document.querySelector(".bg-stage.full");
      if (f) {
        toggleFull(f.id.replace("Stage", ""));
        e.stopImmediatePropagation();
      }
    }
  },
  true,
);
function ensureGlobe(p) {
  return loadAtlas().then(() => {
    if (!GL[p]) {
      GL[p] = makeGlobe($(p + "Stage"));
      GL[p].setLabels(lsGet("bg_labels", "1") === "1");
      GL[p].setData();
      GL[p].resize();
    }
    $(p + "Load").classList.remove("show");
    return GL[p];
  });
}
const setMsg = (p, html, cls = "") => {
  const m = $(p + "Msg");
  m.className = "msg " + cls;
  m.innerHTML = html;
};
function setHearts(p, n) {
  $(p + "Hearts").textContent = Math.max(0, n);
}
function hitHeart(p) {
  const c = $(p + "HeartsCard");
  c.classList.remove("hit");
  void c.offsetWidth;
  c.classList.add("hit");
}
function wrongFx(p) {
  sfx("wrong");
  try {
    navigator.vibrate && navigator.vibrate(70);
  } catch (e) {}
  const s = $(p + "Search");
  s.classList.remove("bad");
  void s.offsetWidth;
  s.classList.add("bad");
  clearTimeout(s._t);
  s._t = setTimeout(() => s.classList.remove("bad"), 900);
}
function renderChips(p) {
  const r = R[p];
  if (!r) {
    $(p + "Chips").innerHTML = "";
    return;
  }
  $(p + "Chips").innerHTML = [...r.guesses]
    .map(([code, kind]) => `<span class="bg-chip ${kind}">${CHIP_ICON[kind]}${esc(cname(code))}</span>`)
    .join("");
}
function renderCrumb(p) {
  const r = R[p];
  if (!r) {
    $(p + "Crumb").innerHTML = "";
    return;
  }
  const path = bestPath(r.rt, r.greens),
    mid = path.slice(1, -1),
    parts = [];
  parts.push(`<b>${esc(cname(r.a))}</b>`);
  let unknown = 0;
  const flush = () => {
    if (unknown) {
      parts.push('<i class="gap">' + "- ".repeat(Math.min(4, unknown + 1)).trim() + "</i>");
      unknown = 0;
    }
  };
  mid.forEach((x) => {
    if (r.greens.has(x)) {
      flush();
      parts.push(`<b class="g">${esc(cname(x))}</b>`);
    } else unknown++;
  });
  flush();
  parts.push(`<b>${esc(cname(r.b))}</b>`);
  $(p + "Crumb").innerHTML = parts.join('<i class="arr">&rsaquo;</i>');
}
function setupRound(p, a, b, diff) {
  const rt = makeRoute(a, b);
  R[p] = {
    a,
    b,
    rt,
    diff,
    guesses: new Map(),
    greens: new Set(),
    hearts: HEARTS[diff] || 6,
    max: HEARTS[diff] || 6,
    wrongs: 0,
    found: 0,
    startedAt: Date.now(),
    locked: false,
  };
  const g = GL[p];
  g.clear();
  g.set(a, "start");
  g.set(b, "start");
  $(p + "From").innerHTML = `<span>${esc(cname(a))}</span>${flagImg(a)}`;
  $(p + "To").innerHTML = `${flagImg(b)}<span>${esc(cname(b))}</span>`;
  $(p + "Between").textContent = rt.between;
  setHearts(p, R[p].hearts);
  renderChips(p);
  renderCrumb(p);
  $(p + "Input").value = "";
  GUESSED_CLEAR(p);
  resetSearch(p);
  setMsg(p, "");
  $(p + "Action").style.display = "";
  g.frame(a, b);
  setTimeout(() => {
    if (R[p] && R[p].a === a && R[p].b === b) R[p].startedAt = Date.now();
  }, 1100);
}
function revealRoute(p) {
  const r = R[p];
  if (!r) return;
  bestPath(r.rt, r.greens).forEach((x) => {
    if (x !== r.a && x !== r.b && !r.greens.has(x)) GL[p].set(x, "reveal");
  });
  renderCrumbFull(p);
}
function renderCrumbFull(p) {
  const r = R[p],
    path = bestPath(r.rt, r.greens);
  $(p + "Crumb").innerHTML = path
    .map((x, i) => `<b class="${i && i < path.length - 1 ? "g" : ""}">${esc(cname(x))}</b>`)
    .join('<i class="arr">&rsaquo;</i>');
}
function routeHTML(path) {
  return `<div class="route-line">${path.map((c) => `<span class="rl-c">${flagImg(c, "bg-flag sm")}${esc(cname(c))}</span>`).join('<i class="arr">&rsaquo;</i>')}</div>`;
}
const routeRevealHTML = (path) => `<div class="reveal route"><small>A SHORTEST ROUTE</small>${routeHTML(path)}</div>`;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const SQ = { solo: { timer: 0, items: [], sel: -1 }, duel: { timer: 0, items: [], sel: -1 } };
const PICKED = { solo: null, duel: null };
const GUESSED = { solo: new Set(), duel: new Set() };
const GUESSED_CLEAR = (p) => GUESSED[p].clear();
function rankCountries(raw) {
  const q = fold(raw);
  if (!q) return [];
  const out = [];
  COUNTRIES.forEach((c) => {
    let best = 0;
    c.keys.forEach((k, i) => {
      let s = 0;
      if (k === q) s = 100;
      else if (k.startsWith(q)) s = 80;
      else if (k.split(" ").some((w) => w.startsWith(q))) s = 60;
      else if (k.includes(q)) s = 35;
      if (s && i) s -= 4;
      if (s > best) best = s;
    });
    if (best) out.push({ c, s: best + (FAMOUS.has(c.code) ? 3 : 0) });
  });
  out.sort((a, b) => b.s - a.s || a.c.name.localeCompare(b.c.name));
  return out.map((x) => x.c);
}
function updateBtn(p) {
  const has = !!PICKED[p],
    b = $(p + "Btn");
  b.classList.toggle("is-guess", has);
  b.querySelector(".lbl").textContent = has ? "Guess" : "Give up";
}
function hideSugg(p) {
  const b = $(p + "Sugg");
  b.innerHTML = "";
  b.classList.remove("open");
  SQ[p].items = [];
  SQ[p].sel = -1;
}
function resetSearch(p) {
  hideSugg(p);
  PICKED[p] = null;
  updateBtn(p);
}
function guessInput(p) {
  PICKED[p] = null;
  updateBtn(p);
  const raw = $(p + "Input").value.trim();
  hideSugg(p);
  if (!raw) return;
  const list = rankCountries(raw);
  renderSugg(p, list);
  const q = fold(raw),
    r = R[p],
    ex = list.find((c) => c.keys.includes(q));
  if (ex && r && !r.locked && !r.guesses.has(ex.code) && ex.code !== r.a && ex.code !== r.b) {
    PICKED[p] = ex.code;
    updateBtn(p);
  }
}
function renderSugg(p, list) {
  const box = $(p + "Sugg"),
    st = SQ[p];
  st.items = list;
  st.sel = -1;
  box.innerHTML = "";
  if (!list.length) box.innerHTML = '<div class="sugg-row none">No matches</div>';
  list.forEach((c, i) => {
    const b = document.createElement("button");
    const r = R[p],
      done = r && (r.guesses.has(c.code) || c.code === r.a || c.code === r.b);
    b.className = "sugg-row" + (done ? " done" : "");
    b.dataset.i = i;
    b.innerHTML = `${flagImg(c.code, "sg-flag")}<span class="t"><b>${esc(c.name)}</b><small>${esc(CONT_NAME[c.cont] || "")}</small></span>${done ? '<span class="ag">' + (r && (c.code === r.a || c.code === r.b) ? "Given" : "Already guessed") + "</span>" : ""}`;
    if (done) b.disabled = true;
    b.onclick = () => {
      pickGuess(p, c);
      $(p + "Input").blur();
    };
    box.appendChild(b);
  });
  box.scrollTop = 0;
  box.classList.add("open");
}
function pickGuess(p, c) {
  resetSearch(p);
  PICKED[p] = c.code;
  $(p + "Input").value = c.name;
  updateBtn(p);
}
function guessKey(e, p) {
  const st = SQ[p],
    rows = [...$(p + "Sugg").querySelectorAll(".sugg-row[data-i]:not(.done)")];
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    if (!rows.length) return;
    e.preventDefault();
    if (e.key === "ArrowDown") st.sel = (st.sel + 1) % rows.length;
    else st.sel = st.sel <= 0 ? rows.length - 1 : st.sel - 1;
    rows.forEach((r, i) => r.classList.toggle("active", i === st.sel));
    rows[st.sel].scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") {
    if (st.sel >= 0 && rows[st.sel]) pickGuess(p, st.items[Number(rows[st.sel].dataset.i)]);
    else if (PICKED[p]) guessPress(p, true);
    else if (rows.length === 1) pickGuess(p, st.items[Number(rows[0].dataset.i)]);
  } else if (e.key === "Escape") hideSugg(p);
}
function guessPress(p, enter) {
  const code = PICKED[p];
  if (!code) {
    if (!enter) giveUp(p);
    return;
  }
  const typed = fold($(p + "Input").value),
    cc = CT[code];
  if (!cc || !COUNTRIES.find((c) => c.code === code).keys.includes(typed)) {
    PICKED[p] = null;
    updateBtn(p);
    return;
  }
  $(p + "Input").value = "";
  resetSearch(p);
  playGuess(p, code);
}
function giveUp(p) {
  const r = R[p];
  if (!r || r.locked) return;
  p === "solo" ? soloEnd(false) : finishDuel(false);
}
function playGuess(p, code) {
  const r = R[p];
  if (!r || r.locked) return;
  if (code === r.a || code === r.b) {
    setMsg(p, "That's one of the two starting countries.");
    return;
  }
  if (r.guesses.has(code)) return;
  const kind = r.rt.on.has(code) ? "green" : r.rt.det.has(code) ? "yellow" : "red";
  r.guesses.set(code, kind);
  if (kind === "green") r.greens.add(code);
  GL[p].set(code, kind);
  GL[p].show(code);
  renderChips(p);
  renderCrumb(p);
  if (kind === "green") {
    r.found++;
    localStats((x) => {
      x.countries++;
    });
    srv(p === "solo" ? "bg_found" : "bg_duel_guess", p === "solo" ? {} : { kind: "found", secs: 0 });
    sfx("correct");
    setMsg(p, "");
    const fp = foundPath(r);
    if (fp) {
      r.finalPath = fp;
      r.detour = fp.length - 1 > r.rt.L;
      p === "solo" ? soloEnd(true) : finishDuel(true);
    }
  } else if (kind === "yellow") {
    sfx("advance");
    setMsg(p, '<span class="y">A short detour.</span> It\'s close, but not on the shortest route.');
    const fp = foundPath(r);
    if (fp) {
      r.finalPath = fp;
      r.detour = fp.length - 1 > r.rt.L;
      p === "solo" ? soloEnd(true) : finishDuel(true);
    }
  } else {
    r.wrongs++;
    r.hearts--;
    localStats((x) => {
      x.wrong++;
    });
    srv(p === "solo" ? "bg_wrong" : "bg_duel_guess", p === "solo" ? {} : { kind: "wrong", secs: 0 });
    wrongFx(p);
    setHearts(p, r.hearts);
    hitHeart(p);
    setMsg(p, '<span class="bad">Off course.</span> ' + esc(cname(code)) + " isn't near the shortest route.");
    if (r.hearts <= 0) p === "solo" ? soloEnd(false) : finishDuel(false);
  }
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
      box.querySelectorAll(".pill").forEach((x) => x.classList.toggle("sel", x === b));
      onPick(l);
    };
    box.appendChild(b);
  });
}
let WHEEL = { solo: null, duel: null };
function setScope(v) {
  if (!REGIONS.some((r) => r.v === v) || v === S.scope) return;
  S.scope = v;
  lsSet("bg_scope", v);
  if ($("gameView").classList.contains("active")) beginSolo();
}
const S = {
  diff: "easy",
  scope: lsGet("bg_scope", "all"),
  token: 0,
  cancel: null,
  pendingLoad: false,
  ls: {},
  lastEst: 0,
};
if (!REGIONS.some((r) => r.v === S.scope)) S.scope = "all";
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
  resetSearch("solo");
  R.solo = null;
  showView("homeView");
}
async function beginSolo() {
  const t = ++S.token;
  closeSoloResult();
  R.solo = null;
  resetSearch("solo");
  $("soloInput").value = "";
  $("soloLoad").classList.add("show");
  try {
    await ensureGlobe("solo");
  } catch (e) {
    if (t !== S.token) return;
    $("soloLoad").classList.remove("show");
    setMsg(
      "solo",
      'Couldn\'t load the world map.<button class="retry" onclick="beginSolo()">Retry</button><small style="display:block;margin-top:8px;color:#7f8b83">' +
        esc(ATLAS_STATE.error) +
        "</small>",
    );
    return;
  }
  if (t !== S.token) return;
  newSoloRound();
}
function newSoloRound() {
  const pick = chooseRound(S.scope, S.diff);
  pushRecent(pick.a, pick.b);
  setupRound("solo", pick.a, pick.b, S.diff);
  srv("bg_start_round", { a: pick.a, b: pick.b, diff: S.diff });
}
function soloEnd(correct) {
  const r = R.solo;
  if (!r || r.locked) return;
  r.locked = true;
  S.lastEst = 0;
  resetSearch("solo");
  const secs = (Date.now() - r.startedAt) / 1000;
  let streak = 0,
    nextDiff = "",
    pending = null;
  if (correct) {
    streak = S.ls[S.diff] = (S.ls[S.diff] || 0) + 1;
    const est = ME && ME.token ? ptsFor(S.diff, r.rt.between, r.wrongs, secs, streak - 1) : 0;
    S.lastEst = est;
    localStats((x) => {
      x.routes++;
      x.score += est;
      x.best = Math.max(x.best, streak);
    });
    pending = srv("bg_correct", { secs: Math.max(0.5, secs) });
    sfx("correct");
    if (lsGet("bg_autodiff", "0") === "1") {
      const i = LEVELS.indexOf(S.diff);
      if (i >= 0 && i < LEVELS.length - 1) nextDiff = LEVELS[i + 1];
    }
  } else {
    S.ls[S.diff] = 0;
    srv("bg_loss");
    sfx("lose");
    revealRoute("solo");
  }
  S.pendingLoad = !!nextDiff;
  showSoloResult(correct, secs, streak, nextDiff, pending);
}
function showSoloResult(correct, secs, streak, nextDiff, pending) {
  const r = R.solo,
    tok = S.token,
    secTxt = secs < 10 ? secs.toFixed(1) : Math.round(secs);
  const detour = correct && r.detour,
    path = correct && r.finalPath ? r.finalPath : bestPath(r.rt, r.greens);
  $("soloResult").innerHTML = correct
    ? `<div class="res good strip"><div class="res-badges"><span class="stamp">${detour ? "DETOUR ROUTE" : "SHORTEST ROUTE"} &middot; ${secTxt}S</span><span class="streak" id="soloStreakTxt">${FLAME_SVG} ${streak} in a row</span><span class="streak" id="soloPts">+${S.lastEst ? S.lastEst.toLocaleString() : "…"} pts</span>${nextDiff ? `<span class="streak">&#8593; ${LEVEL_NAMES[nextDiff]} next</span>` : ""}</div>${detour ? '<div class="res-eyebrow">YOUR ROUTE (A DETOUR)</div>' : ""}${routeHTML(path)}${detour ? `<div class="res-eyebrow">THE SHORTEST ROUTE</div>${routeHTML(bestPath(r.rt, new Set()))}` : ""}
        <div class="res-actions"><button class="res-next" onclick="nextSolo()">Next</button></div><div class="cool"><i id="soloCool"></i></div></div>`
    : `<div class="res bad strip"><div class="res-badges"><span class="stamp">${r.hearts <= 0 ? "OUT OF HEARTS" : "GAVE UP"}</span><span class="streak" style="color:#9aa6a0">No score</span></div><div class="res-eyebrow">THE SHORTEST ROUTE</div>${routeHTML(path)}
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
  $("soloAction").style.display = "none";
  $("soloResult").style.display = "block";
  window.__resAt = Date.now();
  if (correct) confetti();
  const bar = $("soloCool");
  if (lsGet("bg_autonext", "1") === "1") {
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
  if (!R.solo || !R.solo.locked) return;
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
  route: null,
  path: [],
  roundDiff: "easy",
  rid: 0,
  score: {},
  answers: {},
  locked: true,
  resolved: false,
  startedAt: 0,
  roundStart: 0,
  wrongs: 0,
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
  duelScope = lsGet("bg_scope", "all"),
  duelRandom = false;
let SBC = null;
function sb() {
  if (!SBC) {
    if (!window.supabase) throw new Error("Supabase library did not load. Reload the page.");
    SBC = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return SBC;
}
const supabaseClient = sb;
const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
const send = (event, payload) => D.channel?.send({ type: "broadcast", event, payload });
const settingsText = () =>
  D.settings
    ? `${D.settings.random ? "Random difficulty" : LEVEL_NAMES[D.settings.difficulty]} · ${regionLabel(D.settings.region)}${D.settings.timer ? " · " + timerName(D.settings.timer) + " timer" : ""}${D.settings.tabs ? " · Tab changes tracked" : ""} · ${D.settings.total} rounds`
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
  document.querySelectorAll("#timerMenu .dd-item").forEach((i) => i.classList.toggle("sel", Number(i.dataset.v) === v));
  $("timerDD").classList.remove("open");
}
document.addEventListener("click", (e) => {
  document.querySelectorAll(".dd.open").forEach((x) => {
    if (!x.contains(e.target)) x.classList.remove("open");
  });
});
function awayWho(id) {
  return id === D.myId ? "You" : (D.players.find((x) => x.id === id) || {}).name || "A player";
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
  if (!D.inMatch || D.locked || !D.settings || !D.settings.tabs || D.mine) return;
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
  t.textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
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
      finishDuel(false);
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
    const total = Math.max(1, Math.min(100, Math.floor(Number($("duelRounds").value) || 10)));
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
      region: duelScope,
      total,
      random: duelRandom,
      timer: duelTimerSel,
      tabs: !!$("duelTabs").checked,
    };
    D.total = total;
    D.score = { [D.myId]: 0 };
    loadAtlas().catch(() => {});
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
    if (D.joining && !D.settings) failJoin("That duel code doesn't exist. Check it and try again.");
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
        others = Object.keys(D.channel.presenceState() || {}).filter((k) => k !== D.myId).length;
      } catch (e) {}
      if (!others && Date.now() - t0 > 2500) failJoin("That duel code doesn't exist. Check it and try again.");
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
const broadcastRoster = () => send("roster", { players: D.players, hostId: D.myId, settings: D.settings });
async function connectDuel() {
  D.channel = D.client.channel("border-guesser-" + D.code, {
    config: { broadcast: { self: false }, presence: { key: D.myId } },
  });
  const on = (ev, fn) => D.channel.on("broadcast", { event: ev }, ({ payload }) => fn(payload || {}));
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
      D.players.push({ id: p.id, name: String(p.name || "Player").slice(0, 24) });
      D.score[p.id] = 0;
    } else known.name = String(p.name || known.name).slice(0, 24);
    broadcastRoster();
    updateLobby();
  });
  on("roster", (p) => {
    if (D.host || !Array.isArray(p.players) || !p.players.some((x) => x.id === D.myId)) return;
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
    failJoin(p.reason === "full" ? "That duel is full." : "That duel has already started, so you can't join anymore.");
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
    const t = setTimeout(() => reject(new Error("Could not connect. Check your connection.")), 10000);
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
  const diff = D.settings.random ? LEVELS[Math.floor(Math.random() * LEVELS.length)] : D.settings.difficulty;
  const pick = chooseRound(D.settings.region, diff);
  pushRecent(pick.a, pick.b);
  const path = bestPath(makeRoute(pick.a, pick.b), new Set());
  if (!D.channel) return;
  const payload = {
    settings: D.settings,
    total: D.total,
    round: D.round,
    route: pick,
    path,
    score: D.score,
    diff,
    players: D.players,
  };
  send(event, payload);
  beginRound(payload);
}
async function beginRound(p) {
  clearTimeout(D.nextTimer);
  clearTimeout(D.podTimer);
  stopConfetti();
  const a = p.route && p.route.a,
    b = p.route && p.route.b;
  if (!CT[a] || !CT[b] || !ADJ[a] || !ADJ[b] || distFrom(a)[b] === undefined) return;
  D.inMatch = true;
  D.finished = false;
  D.started = true;
  if (p.players) D.players = p.players;
  D.round = p.round;
  D.total = p.total;
  D.route = { a, b };
  D.path = Array.isArray(p.path) ? p.path.filter((x) => CT[x]) : [];
  D.score = p.score;
  D.roundDiff = LEVELS.includes(p.diff) ? p.diff : D.settings.difficulty;
  D.answers = {};
  D.away = {};
  D.mine = false;
  renderAway();
  D.locked = true;
  D.resolved = false;
  D.roundStart = Date.now();
  D.wrongs = 0;
  const rid = ++D.rid;
  $("lbOverlay").classList.remove("open");
  $("duelBody").classList.remove("waiting");
  $("duelWait").classList.remove("show");
  showView("duelView");
  $("duelRound").textContent =
    `Round ${p.round} / ${p.total}` + (D.settings.random ? " · " + LEVEL_NAMES[D.roundDiff] : "");
  $("duelScore").textContent = (D.score[D.myId] || 0).toLocaleString();
  $("duelLoad").classList.add("show");
  try {
    await ensureGlobe("duel");
  } catch (e) {
    if (rid === D.rid) {
      showToast("Couldn't load the world map.");
      D.locked = false;
      R.duel = null;
      finishDuel(false);
    }
    return;
  }
  if (rid !== D.rid || !D.inMatch) return;
  setupRound("duel", a, b, D.roundDiff);
  D.locked = false;
  startDuelTimer(D.settings.timer || 0);
}
function finishDuel(correct) {
  if (D.locked) return;
  D.locked = true;
  const r = R.duel;
  if (r) r.locked = true;
  resetSearch("duel");
  if (!correct && r) revealRoute("duel");
  $("duelBody").classList.add("waiting");
  $("duelWait").classList.add("show");
  const secs = r ? (Date.now() - r.startedAt) / 1000 : 0;
  let points = 0;
  if (correct && r) {
    points = ptsFor(D.roundDiff, r.rt.between, r.wrongs, secs, D.streak);
    D.streak++;
    localStats((x) => {
      x.routes++;
      x.best = Math.max(x.best, D.streak);
    });
    srv("bg_duel_guess", { kind: "correct", secs: Math.max(0.5, secs) });
    sfx("correct");
  } else {
    D.streak = 0;
    srv("bg_duel_guess", { kind: "lost", secs: 0 });
    sfx("lose");
  }
  const payload = { id: D.myId, correct: !!correct, points, cheat: !!D.mine };
  if (D.host) handleDone(payload);
  else send("done", payload);
}
function handleDone(p) {
  if (!p?.id || D.answers[p.id] || D.resolved || !D.players.some((x) => x.id === p.id)) return;
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
  const payload = { score: D.score, prev, answers: D.answers, path: D.path, round: D.round, total: D.total, names };
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
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))).toLocaleString();
    if (k < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}
function showRoundResult(p) {
  D.locked = true;
  D.score = p.score;
  $("duelScore").textContent = (p.score[D.myId] || 0).toLocaleString();
  const ids = Object.keys(p.score);
  const prevOrder = [...ids].sort((a, b) => (p.prev[b] || 0) - (p.prev[a] || 0) || ids.indexOf(a) - ids.indexOf(b));
  const newOrder = [...ids].sort(
    (a, b) => (p.score[b] || 0) - (p.score[a] || 0) || prevOrder.indexOf(a) - prevOrder.indexOf(b),
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
    ${routeRevealHTML(p.path || [])}
    <div class="lb" style="height:${ids.length * 72}px">${rows}</div>
    <div class="lb-foot">${last ? "Final results coming up..." : "Next route starting soon..."}</div></div>`;
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
    .map((id) => ({ id, me: id === D.myId, score: p.score[id] || 0, name: p.names?.[id] || "Player" }))
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
    srv("bg_duel", { won });
  }
  const H = { 1: 200, 2: 150, 3: 110 };
  const col = (r) => `<div class="pd-col ${r.place === 1 ? "first" : ""}">
    <div class="pd-av">${r.place === 1 && !tie ? CROWN_SVG : ""}${esc((r.name || "?").trim().charAt(0).toUpperCase())}</div>
    <div class="pd-name">${nameHTML(r.name)}${r.me ? " <small>(you)</small>" : ""}</div>
    <div class="pd-score">${r.score.toLocaleString()}</div>
    <div class="pd-block" data-h="${H[r.place] || 110}">${r.place}</div></div>`;
  const order = rows.length >= 2 ? [rows[1], rows[0], rows[2]].filter(Boolean) : [rows[0]];
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
const BOARDS = {
  score: { val: (p) => Number(p.score), fmt: (v) => v.toLocaleString(), dir: -1 },
  routes: { label: "Routes solved", val: (p) => Number(p.routes), fmt: (v) => v.toLocaleString(), dir: -1 },
  countries: { label: "Countries found", val: (p) => Number(p.countries), fmt: (v) => v.toLocaleString(), dir: -1 },
  accuracy: {
    label: "Accuracy",
    val: (p) =>
      Number(p.countries) + Number(p.wrong) >= 10
        ? Number(p.countries) / (Number(p.countries) + Number(p.wrong))
        : null,
    fmt: (v) => Math.round(v * 1000) / 10 + "%",
    dir: -1,
    note: "Needs at least 10 guesses to qualify.",
  },
  streak: { label: "Best streak", val: (p) => Number(p.best_streak), fmt: (v) => v.toLocaleString(), dir: -1 },
  duels: { label: "Duels played", val: (p) => Number(p.duels), fmt: (v) => v.toLocaleString(), dir: -1 },
  wins: { label: "Duels won", val: (p) => Number(p.wins), fmt: (v) => v.toLocaleString(), dir: -1 },
};
const STAT_KEYS = ["routes", "countries", "accuracy", "streak", "duels", "wins"];
let PROFILES = [];
const liveProfiles = () => PROFILES;
function boardRows(key) {
  const b = BOARDS[key];
  const rows = liveProfiles()
    .map((p) => ({ p, v: b.val(p) }))
    .filter((r) => r.v !== null && Number.isFinite(r.v) && r.v > 0);
  rows.sort((a, z) => b.dir * (a.v - z.v) || String(a.p.username).localeCompare(String(z.p.username)));
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
      .from("border_stats")
      .select("id,username,score,routes,countries,wrong,best_streak,duels,wins")
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
      .channel("bg-stats-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "border_stats" }, (pl) => {
        if (pl.eventType === "DELETE") PROFILES = PROFILES.filter((p) => p.id !== pl.old?.id);
        else if (pl.new?.id) {
          const i = PROFILES.findIndex((p) => p.id === pl.new.id);
          if (i >= 0) PROFILES[i] = { ...PROFILES[i], ...pl.new };
          else PROFILES.push(pl.new);
          if (ME && pl.new.id === ME.id && pl.new.username && pl.new.username !== ME.username) {
            ME.username = pl.new.username;
            refreshIdentity();
            renderAccount();
          }
        }
        boardsChanged();
      })
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
const LB = { tab: "score", stat: "routes" };
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
    .map(([k, l]) => `<button class="tab ${LB.tab === k ? "sel" : ""}" onclick="setLbTab('${k}')">${l}</button>`)
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
  if (!rows.length) html = '<div class="lb-note">Nobody is on this leaderboard yet. Be the first!</div>';
  let mine = "";
  if (ME && ME.id) {
    const idx = rows.findIndex((r) => r.p.id === ME.id);
    if (idx >= 10) mine = '<div class="lb-dots">• • •</div>' + lbRow(rows[idx], 0);
    else if (idx < 0)
      mine =
        '<div class="lb-note">You\'re not on this leaderboard yet.' +
        (BOARDS[key].note ? " " + BOARDS[key].note : "") +
        "</div>";
  }
  if (isStats && BOARDS[key].note && ME && !mine.includes("not on"))
    mine += '<div class="lb-note" style="padding-top:8px">' + BOARDS[key].note + "</div>";
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
  const m = String((e && e.message) || e || "") + " " + String((e && (e.code || e.details)) || "");
  if (/username_taken/.test(m)) return "That username is already taken.";
  if (/username_invalid/.test(m))
    return "Usernames are 3–20 characters: letters (A–Z, Å, Ä, Ö), numbers and . , ! ? ' - _";
  if (/invalid_token/.test(m)) return "That data token doesn't match any account.";
  if (/could not find the function|schema cache|PGRST202|42883/i.test(m))
    return "The server isn't set up yet. Run supabase-border-setup.sql in Supabase first.";
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
        if (st && st.id) applyState(pendingOps > 0 ? { ...st, stats: null } : st);
        return st;
      })
      .catch((e) => {
        pendingOps--;
        if (Date.now() - warnedAt > 20000) {
          warnedAt = Date.now();
          showToast("Couldn't save your progress. " + apiMsg(e));
        }
        if (pendingOps === 0 && !resyncing && name !== "bg_get") {
          resyncing = true;
          srv("bg_get").finally(() => {
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
      routes: stats.routes,
      countries: stats.countries,
      wrong: stats.wrong,
      best_streak: stats.best,
      duels: stats.duels,
      wins: stats.wins,
    });
  boardsChanged();
}
const rowToStats = (r) => ({
  routes: Number(r.routes) || 0,
  countries: Number(r.countries) || 0,
  wrong: Number(r.wrong) || 0,
  best: Number(r.best_streak) || 0,
  duels: Number(r.duels) || 0,
  wins: Number(r.wins) || 0,
  score: Number(r.score) || 0,
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
    const st = await api("bg_create", { u: name });
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
  const st = await api("bg_get", { t });
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
    document.execCommand("copy") ? ok() : showToast("Select the token and copy it.");
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
    const st = await api("bg_set_username", { t: ME.token, u: v });
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
    const st = await api("bg_get", { t });
    if (st && st.id) applyState(st);
    else {
      ME = null;
      lsSet(TOKEN_KEY, "");
      lsSet("sg_name", "");
      refreshIdentity();
      maybeWelcome();
      showToast("That account wasn't found. Create a new one or enter another data token.");
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
  $("autoDiff").checked = lsGet("bg_autodiff", "0") === "1";
  $("autoNext").checked = lsGet("bg_autonext", "1") === "1";
  $("showLabels").checked = lsGet("bg_labels", "1") === "1";
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
  lsSet("bg_autodiff", $("autoDiff").checked ? "1" : "0");
  lsSet("bg_autonext", $("autoNext").checked ? "1" : "0");
  lsSet("bg_labels", $("showLabels").checked ? "1" : "0");
  closeSettings();
}
$("autoDiff").onchange = () => lsSet("bg_autodiff", $("autoDiff").checked ? "1" : "0");
$("autoNext").onchange = () => lsSet("bg_autonext", $("autoNext").checked ? "1" : "0");
$("showLabels").onchange = () => {
  lsSet("bg_labels", $("showLabels").checked ? "1" : "0");
  Object.values(GL).forEach((g) => g && g.setLabels($("showLabels").checked));
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
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key !== "Enter") return;
  const a = document.activeElement,
    tag = a ? a.tagName : "";
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (a && a.isContentEditable)) return;
  if (document.querySelector(".modal-back.open") || $("lbOverlay").classList.contains("open")) return;
  const p = $("gameView").classList.contains("active")
    ? "solo"
    : $("duelView").classList.contains("active")
      ? "duel"
      : null;
  if (!p) return;
  if (p === "solo" && R.solo && R.solo.locked) {
    e.preventDefault();
    nextSolo();
    return;
  }
  if (!R[p] || R[p].locked || (p === "duel" && D.locked)) return;
  e.preventDefault();
  if (tag === "BUTTON") a.blur();
  $(p + "Input").focus();
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
  `<div class="reg-row"><div class="wheel-h" id="soloWheel"></div><button class="back" onclick="leaveGame()" aria-label="Back">${BACK_SVG}</button><button class="score-chip" onclick="openLb('score')" aria-label="Open leaderboard"><span id="soloScore">0</span><span class="rk" id="soloRank"></span></button></div>
  <div id="soloBody" class="game-body"><div class="diff" id="soloDiff"></div>${gameHTML("solo")}</div><div id="soloResult" style="display:none"></div>`;
$("duelStack").innerHTML =
  `<div class="duel-top"><button class="back" onclick="guardLeave(() => disconnectDuel())" aria-label="Back">${BACK_SVG}</button><span id="duelRound">Round 1 / 10</span><span class="rg-cheat" id="duelCheat" hidden></span><span class="duel-right"><span class="dtimer" id="duelTimer"></span><span class="score" id="duelScore">0</span></span></div>
  <div class="duel-wrap"><div id="duelBody" class="game-body">${gameHTML("duel")}</div><div class="cheat-note" id="duelCheatNote" hidden></div><div id="duelWait" class="wait"><i></i>Waiting for the other players...</div></div>`;
renderDiff("duelDiff", duelDiffSel, (l) => {
  duelDiffSel = l;
});
$("timerMenu").innerHTML = TIMERS.map(
  ([v, l]) =>
    `<button type="button" class="dd-item${v === 0 ? " sel" : ""}" data-v="${v}" onclick="pickTimer(${v})">${l}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10" /></svg></button>`,
).join("");
if (!REGIONS.some((r) => r.v === duelScope)) duelScope = "all";
WHEEL.solo = makeWheel($("soloWheel"), REGIONS, S.scope, (v) => setScope(v));
WHEEL.duel = makeWheel(
  $("duelWheel"),
  REGIONS,
  duelScope,
  (v) => {
    duelScope = v;
  },
  { calm: true },
);
recomputeRanks();
updateUserCard();
updateScoreChip();
initAccount();
setTimeout(() => {
  loadAtlas().catch(() => {});
}, 2500);
document.addEventListener("keydown", (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || (e.key !== "Enter" && e.key !== " ")) return;
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
