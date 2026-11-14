const $ = (id) => document.getElementById(id);
const STEPS = [0.1, 0.5, 2, 8, 15];
const FRAC = [2, 6, 18, 50, 100];
const SUPABASE_URL = "https://mrrixocnhsfulglipvek.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fIFvv3lqR66EOuclo_bscg_Qv8OKNt1";
const LEVELS = ["easy", "medium", "hard", "expert", "impossible"];
const CLICK_LIVES = 2;
const MAX_PLAYERS = 40;
let ME = null;
const TOKEN_KEY = "sg_token";
const LEVEL_NAMES = { easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert", impossible: "Impossible" };
const TIERS = {
  easy: [["songs", EASY_SONGS, 120]],
  medium: [["songs", MEDIUM_SONGS, 100], ["songs", EASY_SONGS, 20]],
  hard: [[MEGA, 8, 20], [POPULAR, 3, 12], [CLASSIC, 0, 8], ["songs", MEDIUM_SONGS, 30], ["songs", HARD_SONGS, 30]],
  expert: [[POPULAR, 10, 22], [CLASSIC, 6, 16], [DEEP, 0, 9], [MEGA, 18, 30], ["songs", MEDIUM_SONGS, 10], ["songs", HARD_SONGS, 40]],
  impossible: [[NICHE, 0, 12], [DEEP, 8, 20], [LEGENDS, 4, 16], [CLASSIC, 16, 30], [POPULAR, 20, 34]],
};
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
function evictCache() {
  const rows = [];
  for (let i = 0; i < localStorage.length; i++) {
    const n = localStorage.key(i);
    if (!n || !/^sg_(at|sl)_/.test(n)) continue;
    let t = 0;
    try { t = JSON.parse(localStorage.getItem(n)).t || 0; } catch (e) {}
    rows.push([n, t]);
  }
  rows.sort((a, b) => a[1] - b[1]).slice(0, Math.ceil(rows.length / 3)).forEach((r) => localStorage.removeItem(r[0]));
}
const lsSet = (k, v) => {
  try { localStorage.setItem(k, v); return; } catch (e) {}
  try { evictCache(); localStorage.setItem(k, v); } catch (e) {}
};
let toastTimer;
function showToast(m) {
  const el = $("toast");
  el.textContent = m; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const norm = (s) => String(s || "").toLowerCase().replace(/\(.*?\)|\[.*?\]/g, "").replace(/\s-\s.*$/, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const tk = (t) => norm(t.title) + "|" + norm(t.artist);
const sameSong = (t, track) => t.id === track.id || tk(t) === tk(track);
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
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
const MEDAL_I = '<svg viewBox="4.8 1 14.4 21" fill="currentColor"><path d="M6.5 2h4.2l1.6 6.2-3.4 1.6zM17.5 2h-4.2l-1.6 6.2 3.4 1.6z" fill-opacity="0.65"/><circle cx="12" cy="15.2" r="6.6"/><circle cx="12" cy="15.2" r="4" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="1.5"/></svg>';
const HEART_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
let RANK_SRC = {};
const MAIN_BOARDS = ["type", "click"];
const BOARD_LABEL = { type: "Type answer (score)", click: "Click answer (score)", correct: "Songs guessed", accuracy: "Accuracy", streak: "Best streak", duels: "Duels played", wins: "Duels won" };
const RANK_WORD = { 1: "1st", 2: "2nd", 3: "3rd" };
function rankTip(name) {
  const src = RANK_SRC[String(name || "").toLowerCase()];
  if (!src || !src.length) return "";
  const by = {};
  src.forEach((x) => { (by[x.rank] = by[x.rank] || []).push(BOARD_LABEL[x.key] || x.key); });
  return Object.keys(by).sort().map((r) => "#" + r + " in " + by[r].join(", ")).join("\n");
}
function trophyList(name) {
  const src = RANK_SRC[String(name || "").toLowerCase()] || [];
  const byRank = (x, y) => x.rank - y.rank;
  return [...src.filter((x) => MAIN_BOARDS.includes(x.key)).sort(byRank).map((x) => ({ ...x, kind: "crown" })),
          ...src.filter((x) => !MAIN_BOARDS.includes(x.key)).sort(byRank).map((x) => ({ ...x, kind: "medal" }))];
}
function nameHTML(name) {
  const n0 = String(name ?? "");
  const nm = `<span class="nm-t" title="${esc(n0)}">${esc(n0)}</span>`;
  const list = trophyList(n0);
  if (!list.length) return `<span class="nm-rk">${nm}</span>`;
  const size = list.length <= 2 ? 1.35 : list.length <= 4 ? 1.22 : 1.1;
  const icons = list.map((x, i) => `<i class="tr ${x.kind === "crown" ? "cr" : "md"} rk${x.rank}" style="--i:${i}">${x.kind === "crown" ? CROWN_I : MEDAL_I}</i>`).join("");
  return `<span class="nm-rk"><button type="button" class="trophies" data-name="${esc(n0)}" style="--s:${size}em" aria-label="${esc(n0)} has ${list.length} trophies. Show details">${icons}</button>${nm}</span>`;
}
function showTrophies(name) {
  const list = trophyList(name);
  $("trWho").textContent = name;
  $("trList").innerHTML = list.length ? list.map((x) => `<div class="tr-item"><i class="tr ${x.kind === "crown" ? "cr" : "md"} rk${x.rank}" style="--i:0">${x.kind === "crown" ? CROWN_I : MEDAL_I}</i><div><b>${RANK_WORD[x.rank]} place &middot; ${x.kind === "crown" ? "Crown" : "Medal"}</b><span class="d">${esc(BOARD_LABEL[x.key] || x.key)} leaderboard</span></div></div>`).join("")
    : '<div class="lb-note">No trophies right now.</div>';
  $("trModal").classList.add("open");
}
function closeTrophies() { $("trModal").classList.remove("open"); }
document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest(".trophies"); if (b) { e.preventDefault(); showTrophies(b.dataset.name); } });
const BLANK = () => ({ correct: 0, wrong: 0, best: 0, fastest: null, duels: 0, wins: 0, score: { type: 0, click: 0 } });
let stats = BLANK();
const fmtSecs = (v) => (v < 10 ? v.toFixed(1) : Math.round(v)) + "s";
let resetArm = 0;
function resetStats() {
  const b = document.querySelector(".reset-btn");
  if (!resetArm) {
    resetArm = setTimeout(() => { resetArm = 0; b.textContent = "Reset statistics"; }, 3500);
    b.textContent = "Tap again to confirm";
    return;
  }
  clearTimeout(resetArm); resetArm = 0; b.textContent = "Reset statistics";
  srv("reset_stats").then((st) => showToast(st ? "All your statistics and scores were reset." : "Couldn't reset right now."));
}
function statTiles() {
  const tot = stats.correct + stats.wrong;
  const acc = tot ? Math.round((stats.correct / tot) * 100) + "%" : "–";
  const fast = stats.fastest !== null ? fmtSecs(stats.fastest) : "–";
  return [
    [stats.correct.toLocaleString(), "Songs guessed"], [acc, "Accuracy"], [stats.best.toLocaleString(), "Best streak"],
    [fast, "Fastest guess"], [stats.duels.toLocaleString(), "Duels played"], [stats.wins.toLocaleString(), "Duels won"],
  ].map(([v, l]) => `<div class="stat-tile"><b>${v}</b><span>${l}</span></div>`).join("");
}
let actx = null;
function ctx() { actx ||= new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); return actx; }
function sfx(kind) {
  try {
    const c = ctx(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.value = { correct: 660, wrong: 170, win: 880, lose: 140, advance: 420 }[kind] || 440;
    o.type = kind === "wrong" || kind === "lose" ? "triangle" : "sine";
    g.gain.setValueAtTime(Math.max(0.0001, sfxVol() * 0.12), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (kind === "wrong" || kind === "lose" ? 0.35 : 0.22));
    o.start(); o.stop(c.currentTime + 0.37);
  } catch (e) {}
}
function buildUp(ms) {
  try {
    const c = ctx(), t0 = c.currentTime, d = ms / 1000, v = sfxVol() * 0.3;
    if (v <= 0) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(90, t0); o.frequency.exponentialRampToValueAtTime(560, t0 + d);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 0.35), t0 + d);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.05);
    const len = Math.floor(c.sampleRate * 0.07), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    let t = 0, gap = 0.2;
    while (t < d - 0.1) {
      const s = c.createBufferSource(), gg = c.createGain();
      s.buffer = buf; gg.gain.value = v * (0.25 + 0.75 * (t / d));
      s.connect(gg); gg.connect(c.destination); s.start(t0 + t);
      t += gap; gap = Math.max(0.04, gap * 0.9);
    }
  } catch (e) {}
}
function fanfare() {
  try {
    const c = ctx(), t0 = c.currentTime, v = sfxVol() * 0.22;
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + i * 0.08);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + i * 0.08 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
      o.connect(g); g.connect(c.destination); o.start(t0 + i * 0.08); o.stop(t0 + 1.7);
    });
  } catch (e) {}
}
const VIEWS = ["homeView", "gameView", "multiplayerView", "lobbyView", "duelView", "resultView"];
function showView(id) {
  VIEWS.forEach((v) => $(v).classList.remove("active"));
  void $(id).offsetWidth;
  $(id).classList.add("active");
  if (id === "duelView") armBack(); else disarmBack();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function goHome() {
  S.token++;
  closeSoloResult();
  clips.solo.stop();
  stopConfetti();
  if (D.channel) disconnectDuel("homeView"); else { clearTimeout(D.podTimer); showView("homeView"); }
}
const cf = { raf: 0 };
function stopConfetti() {
  cancelAnimationFrame(cf.raf);
  const cv = $("confetti");
  cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
}
function confetti(big) {
  stopConfetti();
  const cv = $("confetti"), x = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ["#19d77b", "#0ecb70", "#55efa0", "#0b8f52", "#9aa6a0", "#d6ded9"];
  const parts = Array.from({ length: big ? 260 : 150 }, () => ({
    x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.7, w: 5 + Math.random() * 7, h: 3 + Math.random() * 6,
    vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3.5, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.25,
    c: cols[(Math.random() * cols.length) | 0], round: Math.random() < 0.25,
  }));
  const frame = () => {
    x.clearRect(0, 0, cv.width, cv.height);
    let alive = false;
    parts.forEach((p) => {
      p.x += p.vx + Math.sin(p.y / 40 + p.r) * 0.6; p.y += p.vy; p.r += p.vr;
      if (p.y < cv.height + 20) {
        alive = true;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c;
        if (p.round) { x.beginPath(); x.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, 6.28); x.fill(); } else x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        x.restore();
      }
    });
    if (alive) cf.raf = requestAnimationFrame(frame); else x.clearRect(0, 0, cv.width, cv.height);
  };
  cf.raf = requestAnimationFrame(frame);
}
function runCooldown(ms, el, onTick, onDone) {
  let acc = 0, last = performance.now(), wasPlaying = false;
  const id = setInterval(() => {
    const now = performance.now(), dt = now - last; last = now;
    const paused = $("settingsModal").classList.contains("open") || document.hidden;
    if (paused) { if (el && !el.paused) { el.pause(); wasPlaying = true; } return; }
    if (wasPlaying) { wasPlaying = false; el?.play().catch(() => {}); }
    acc += dt;
    onTick(Math.min(1, acc / ms));
    if (acc >= ms) { clearInterval(id); onDone(); }
  }, 80);
  return () => clearInterval(id);
}
const JUNK_T = /(\(|\[|\s-\s)[^)\]]*\b(live|remix|karaoke|instrumental|acoustic|demo|tribute|cover|sped up|slowed|reverb|medley|session|a cappella|radio edit|edit|mix|mixes)\b/i;
const JUNK_A = /\b(karaoke|tribute|remixes|sped up|slowed|live at|live in|live from|unplugged|in concert|mtv)\b/i;
const cleanTrack = (title, album) => !JUNK_T.test(title) && !JUNK_A.test(album || "");
const NET = { itunes: { q: [], n: 0, max: 2, gap: 450, down: 0 }, itunesjs: { q: [], n: 0, max: 2, gap: 450, down: 0 }, deezer: { q: [], n: 0, max: 3, gap: 320, down: 0 } };
function paced(name, fn) {
  const p = NET[name];
  return new Promise((res, rej) => { p.q.push({ fn, res, rej }); pump(name); });
}
function pump(name) {
  const p = NET[name];
  while (p.n < p.max && p.q.length) {
    const j = p.q.shift(); p.n++;
    Promise.resolve().then(j.fn).then(j.res, (e) => { if (e === SKIP) j.skip = true; j.rej(e); }).finally(() => setTimeout(() => { p.n--; pump(name); }, j.skip ? 0 : p.gap));
  }
}
async function itunesSearch(term, limit, byArtist) {
  const r = await fetch("https://itunes.apple.com/search?media=music&entity=song&limit=" + limit + (byArtist ? "&attribute=artistTerm" : "") + "&term=" + encodeURIComponent(term), { signal: AbortSignal.timeout(3500) });
  if (!r.ok) throw new Error("iTunes unavailable");
  const d = await r.json();
  return (d.results || []).filter((x) => x.previewUrl && x.trackName && x.artistName && cleanTrack(x.trackName, x.collectionName)).map((x) => ({
    id: "i" + x.trackId, title: x.trackName, artist: x.artistName, album: x.collectionName || "", preview: x.previewUrl,
    cover: (x.artworkUrl100 || "").replace("100x100", "300x300"),
  }));
}
function itunesJsonp(term, limit, byArtist) {
  return new Promise((resolve, reject) => {
    const cb = "it" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    const done = () => { clearTimeout(t); delete window[cb]; s.remove(); };
    const t = setTimeout(() => { done(); reject(new Error("timeout")); }, 4000);
    window[cb] = (d) => {
      done();
      resolve((d?.results || []).filter((x) => x.previewUrl && x.trackName && x.artistName && cleanTrack(x.trackName, x.collectionName)).map((x) => ({
        id: "i" + x.trackId, title: x.trackName, artist: x.artistName, album: x.collectionName || "", preview: x.previewUrl,
        cover: (x.artworkUrl100 || "").replace("100x100", "300x300"),
      })));
    };
    s.onerror = () => { done(); reject(new Error("blocked")); };
    s.src = "https://itunes.apple.com/search?media=music&entity=song&limit=" + limit + (byArtist ? "&attribute=artistTerm" : "") + "&term=" + encodeURIComponent(term) + "&callback=" + cb;
    document.head.appendChild(s);
  });
}
function deezerSearch(term, limit, byArtist) {
  return new Promise((resolve, reject) => {
    const cb = "dz" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    const done = () => { clearTimeout(t); delete window[cb]; s.remove(); };
    const t = setTimeout(() => { done(); reject(new Error("timeout")); }, 4000);
    window[cb] = (d) => {
      done();
      if (d && d.error) { reject(new Error((d.error.message || "error") + "")); return; }
      const list = (d?.data || []).filter((x) => x.preview && x.title && x.artist?.name && cleanTrack(x.title, x.album?.title)).map((x) => ({
        id: "d" + x.id, title: x.title, artist: x.artist.name, album: x.album?.title || "", preview: x.preview, cover: x.album?.cover_medium || "", pop: Number(x.rank) || 0,
      }));
      if (!list.length && (d?.data || []).length) { reject(new Error("no previews")); return; }
      resolve(list);
    };
    s.onerror = () => { done(); reject(new Error("blocked")); };
    const q = byArtist ? 'artist:"' + term.replace(/"/g, "") + '"' : term;
    s.src = "https://api.deezer.com/search?q=" + encodeURIComponent(q) + "&limit=" + limit + "&output=jsonp&callback=" + cb;
    document.head.appendChild(s);
  });
}
let LOAD_ERR = "";
const PROV = { itunes: itunesSearch, itunesjs: itunesJsonp, deezer: deezerSearch };
const RESTS = { itunes: 45000, itunesjs: 45000, deezer: 15000 };
const PNAME = { itunes: "iTunes", itunesjs: "iTunes (script)", deezer: "Deezer" };
const PERR = {};
const errSummary = () => Object.keys(PERR).map((k) => PNAME[k] + ": " + PERR[k]).join(" · ");
const SKIP = new Error("provider resting");
async function searchTerm(term, limit = 30, byArtist = false, urgent = false) {
  for (let round = 0; round < 2; round++) {
    let order = ["itunes", "itunesjs", "deezer"];
    const now = Date.now();
    const up = order.filter((n) => NET[n].down <= now);
    if (up.length) order = up; else order = [order.sort((a, b) => NET[a].down - NET[b].down)[0]];
    for (const name of order) {
      try {
        const run = () => (order.length > 1 && NET[name].down > Date.now() ? Promise.reject(SKIP) : PROV[name](term, limit, byArtist));
        const r = await (urgent ? run() : paced(name, run));
        if (r.length) { NET[name].down = 0; delete PERR[name]; return r; }
      } catch (e) {
        if (e === SKIP) continue;
        PERR[name] = String(e.message || e);
        LOAD_ERR = errSummary();
        NET[name].down = Date.now() + RESTS[name];
        if (name.startsWith("itunes") && /timeout|abort/i.test(String(e.message || e) + (e.name || ""))) NET.itunes.down = NET.itunesjs.down = Date.now() + RESTS.itunes;
      }
    }
    if (round === 0) await delay(1200);
  }
  return [];
}
const POOL = {}, LOADING = {};
function addTracks(level, list) {
  const pool = POOL[level] || (POOL[level] = []);
  const ids = new Set(pool.map((t) => t.id)), keys = new Set(pool.map(tk));
  list.forEach((t) => {
    if (ids.has(t.id) || keys.has(tk(t))) return;
    ids.add(t.id); keys.add(tk(t)); pool.push(t);
  });
}
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const plain = (v) => norm(String(v).normalize("NFD").replace(/[̀-ͯ]/g, ""));
function artistOk(name, artist) {
  const a = plain(artist);
  if (plain(name) === a) return true;
  return String(name).split(/\s*(?:,|&|\+|\bfeat\.?|\bft\.?|\bwith\b|\band\b|\bx\b|\/)\s*/i).some((p) => plain(p) === a);
}
const ART_CACHE = new Map();
function artistTracks(artist) {
  if (!ART_CACHE.has(artist)) {
    const ck = "sg_at_" + plain(artist);
    try {
      const c = JSON.parse(lsGet(ck, "null"));
      const kept = c && Date.now() - c.t < 14 * 864e5 ? c.l.filter((x) => String(x[0])[0] === "i") : [];
      if (kept.length >= 5) {
        const list = kept.map((x) => ({ id: x[0], title: x[1], artist: x[2], album: x[3], preview: x[4], cover: x[5] }));
        ART_CACHE.set(artist, Promise.resolve(list));
        return ART_CACHE.get(artist);
      }
    } catch (e) {}
    ART_CACHE.set(artist, searchTerm(artist, 40, true).catch(() => []).then((r) => {
      const seen = new Set();
      const out = r.filter((t) => artistOk(t.artist, artist)).filter((t) => { const k = tk(t); if (seen.has(k)) return false; seen.add(k); return true; });
      if (!out.length) ART_CACHE.delete(artist);
      else {
        const stable = out.filter((t) => t.id[0] === "i");
        if (stable.length >= 5) lsSet(ck, JSON.stringify({ t: Date.now(), l: stable.map((t) => [t.id, t.title, t.artist, t.album, t.preview, t.cover]) }));
      }
      return out;
    }));
  }
  return ART_CACHE.get(artist);
}
function freshPreview(t) {
  const id = String(t.id).slice(1);
  if (t.id[0] !== "d") {
    return fetch("https://itunes.apple.com/lookup?id=" + id, { signal: AbortSignal.timeout(4000) })
      .then((r) => r.json())
      .then((d) => (d.results && d.results[0] && d.results[0].previewUrl) || "")
      .catch(() => "");
  }
  return new Promise((resolve) => {
    const cb = "dt" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    const done = (v) => { clearTimeout(timer); delete window[cb]; s.remove(); resolve(v); };
    const timer = setTimeout(() => done(""), 4000);
    window[cb] = (d) => done((d && d.preview) || "");
    s.onerror = () => done("");
    s.src = "https://api.deezer.com/track/" + id + "?output=jsonp&callback=" + cb;
    document.head.appendChild(s);
  });
}
const BAD_VERSION = /karaoke|tribute|instrumental|made famous|originally performed|cover|lullaby|8-bit/i;
async function songLookup(spec) {
  const [title, artist] = spec.split("|"), ck = "sg_sl_" + plain(spec);
  try {
    const c = JSON.parse(lsGet(ck, "null"));
    if (c && Date.now() - c.t < 14 * 864e5 && c.x && String(c.x[0])[0] === "i") return { id: c.x[0], title: c.x[1], artist: c.x[2], album: c.x[3], preview: c.x[4], cover: c.x[5] };
  } catch (e) {}
  const r = await searchTerm(title + " " + artist, 10, false).catch(() => []);
  const nt = norm(title);
  const hit = r.find((t) => t.preview && artistOk(t.artist, artist) && (norm(t.title) === nt || norm(t.title).startsWith(nt)) && !BAD_VERSION.test(t.title + " " + (t.album || "") + " " + t.artist) && !/\blive\b/i.test(t.title + " " + (t.album || "")));
  if (hit && hit.id[0] === "i") lsSet(ck, JSON.stringify({ t: Date.now(), x: [hit.id, hit.title, hit.artist, hit.album, hit.preview, hit.cover] }));
  return hit || null;
}
function loadTracks(level) {
  const have = () => (POOL[level] || []).length;
  if (have() >= 6) return Promise.resolve(POOL[level]);
  if (LOADING[level]) return LOADING[level];
  const songsOnly = TIERS[level].every((e) => e[0] === "songs");
  const seenKeys = new Set(recent);
  const specKey = (s) => { const p = s.split("|"); return norm(p[0]) + "|" + norm(p[1]); };
  const unseenFirst = (list) => { const s = shuffle(list); return [...s.filter((x) => !seenKeys.has(specKey(x))), ...s.filter((x) => seenKeys.has(specKey(x)))]; };
  const terms = shuffle(TIERS[level].flatMap((e) => e[0] === "songs"
    ? unseenFirst(e[1]).slice(0, e[2]).map((s) => ({ s }))
    : e[0].map((a) => ({ a, from: e[1], to: e[2] }))));
  const U = songsOnly ? 12 : 8, MIN = 6;
  let ready = () => {};
  const gate = new Promise((r) => { ready = r; });
  const one = (t) => (t.s ? songLookup(t.s).then((x) => (x ? [x] : [])) : artistTracks(t.a).then((r) => r.slice(t.from, t.to)))
    .then((r) => { addTracks(level, r); if (have() >= MIN) ready(); }, () => {});
  const batch = (arr) => Promise.all(arr.map(one));
  const run = async () => {
    const rest = terms.slice(U);
    const wave1 = batch(terms.slice(0, U));
    await Promise.race([gate, wave1]);
    if (have() < MIN) { await wave1; await batch(rest.slice(0, U)); }
    if (have() < 6) { await delay(1500); await batch(rest.slice(U, U * 2)); }
    if (songsOnly && have() < 6) await batch(shuffle(MEGA.slice()).slice(0, 8).map((x) => ({ a: x, from: 0, to: 5 })));
    if (have() < 6) throw new Error("No playable songs found." + (LOAD_ERR ? " (" + LOAD_ERR + ")" : ""));
    const step = songsOnly ? 6 : 4;
    (async () => { await wave1; for (let i = 0; i < Math.min(rest.length, songsOnly ? 120 : 60); i += step) { if (have() >= (songsOnly ? 100 : 200)) break; await delay(songsOnly ? 2200 : 3500); await batch(rest.slice(i, i + step)); } })();
    return POOL[level];
  };
  LOADING[level] = run().finally(() => { delete LOADING[level]; });
  return LOADING[level];
}
const allTracks = () => Object.values(POOL).flat();
let recent = [];
try { recent = JSON.parse(lsGet("sg_recent", "[]")); } catch (e) {}
if (!Array.isArray(recent)) recent = [];
function markRecent(t) {
  const k = tk(t);
  recent = recent.filter((x) => x !== k); recent.push(k);
  if (recent.length > 1500) recent = recent.slice(-1500);
  lsSet("sg_recent", JSON.stringify(recent));
}
function pickTrack(level) {
  const pool = POOL[level] || [];
  if (!pool.length) return null;
  const rset = new Set(recent);
  let avail = pool.filter((t) => !rset.has(tk(t)));
  if (avail.length < Math.min(12, pool.length)) {
    const order = new Map(recent.map((k, i) => [k, i]));
    avail = [...pool].sort((a, b) => (order.get(tk(a)) ?? -1) - (order.get(tk(b)) ?? -1)).slice(0, Math.max(12, Math.ceil(pool.length * 0.3)));
  }
  const t = avail[Math.floor(Math.random() * avail.length)];
  markRecent(t);
  return t;
}
let optRecent = [];
const SAME_ARTIST = { easy: 0, medium: 0, hard: 1, expert: 2, impossible: 2 };
function makeOptions(track, level) {
  const pool = (POOL[level] || []).filter((t) => t.id !== track.id && norm(t.title) !== norm(track.title));
  const oset = new Set(optRecent);
  let cand = shuffle(pool.filter((t) => !oset.has(tk(t))));
  if (cand.length < 12) cand = shuffle(pool);
  const chosen = [], titles = new Set(), artists = new Set([track.artist]);
  for (const t of shuffle(pool.filter((x) => x.artist === track.artist))) {
    if (chosen.length >= (SAME_ARTIST[level] || 0)) break;
    if (titles.has(norm(t.title))) continue;
    titles.add(norm(t.title)); chosen.push(t);
  }
  for (const t of cand) {
    if (chosen.length >= 4) break;
    if (titles.has(norm(t.title)) || artists.has(t.artist)) continue;
    titles.add(norm(t.title)); artists.add(t.artist); chosen.push(t);
  }
  for (const t of cand) {
    if (chosen.length >= 4) break;
    if (chosen.includes(t) || titles.has(norm(t.title))) continue;
    titles.add(norm(t.title)); chosen.push(t);
  }
  chosen.forEach((t) => optRecent.push(tk(t)));
  if (optRecent.length > 120) optRecent = optRecent.slice(-120);
  return shuffle([...chosen, track]);
}
const DIFF_MULT = { easy: 1, medium: 1.2, hard: 1.4, expert: 2.2, impossible: 3.2 };
const STEP_F = [1, 0.9, 0.75, 0.55, 0.4];
function calcPoints({ secs, wrongs, step, mode, diff, streak }) {
  const speed = 0.25 + 0.75 * Math.exp(-secs / 20);
  const attempts = Math.pow(mode === "click" ? 0.45 : 0.62, wrongs);
  const snippet = STEP_F[Math.min(step, 4)];
  const modeMult = (mode === "type" ? 1.25 : 1) * (DIFF_MULT[diff] || 1);
  const combo = 1 + Math.min(0.25, 0.05 * streak);
  return Math.max(10, Math.round(1000 * speed * attempts * snippet * modeMult * combo));
}
const PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const PAUSE_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
const SKIP_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 5l10 7-10 7zM17 5h2v14h-2z"/></svg>';
const SEARCH_SVG = '<svg class="mag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const X_SVG = '<svg class="xm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const FLAME_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2 1-3.2 2-4.3.3 1.3 1 2 1.8 2.3C10.5 8 10.8 4.5 12 2z"/></svg>';
const CROWN_SVG = '<svg class="crown" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';
const clips = {};
function markPlay(p) { if (p === "solo") { if (!S.startedAt) S.startedAt = Date.now(); } else if (!D.startedAt) D.startedAt = Date.now(); }
const HOOK = new Map();
function findHook(url) {
  if (HOOK.has(url)) return HOOK.get(url);
  const pr = (async () => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (!r.ok) return 0;
      const raw = await r.arrayBuffer();
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const ac = new OAC(1, 1, 22050);
      const audio = await new Promise((res, rej) => { const p = ac.decodeAudioData(raw, res, rej); if (p && p.catch) p.catch(rej); });
      const maxStart = Math.min(15, audio.duration - 15.5);
      if (!(maxStart > 0.5)) return 0;
      const ch0 = audio.getChannelData(0), ch1 = audio.numberOfChannels > 1 ? audio.getChannelData(1) : ch0;
      const fs = Math.round(audio.sampleRate * 0.25), n = Math.floor(ch0.length / fs);
      const E = new Float32Array(n);
      for (let i = 0; i < n; i++) { let sum = 0; for (let k = i * fs; k < (i + 1) * fs; k++) { const v = (ch0[k] + ch1[k]) * 0.5; sum += v * v; } E[i] = Math.sqrt(sum / fs); }
      const mean = (x, y) => { x = Math.max(0, x); y = Math.min(n, y); if (y <= x) return 0; let t = 0; for (let i = x; i < y; i++) t += E[i]; return t / (y - x); };
      let best = 0, bestScore = -1;
      for (let st = 0; st <= Math.floor(maxStart * 4); st++) {
        const body = mean(st, st + 40), onset = st >= 6 ? mean(st, st + 6) - mean(st - 6, st) : 0;
        const score = body + 0.6 * onset;
        if (score > bestScore) { bestScore = score; best = st; }
      }
      return best / 4;
    } catch (e) { return 0; }
  })();
  HOOK.set(url, pr);
  if (HOOK.size > 80) HOOK.delete(HOOK.keys().next().value);
  return pr;
}
function makeClip(p) {
  const el = new Audio();
  el.preload = "auto";
  const c = { el, step: 0, raf: 0, start: 0, pt: 0, lt: 0, settled: true, waiting: false, ready: Promise.resolve(0) };
  const q = (id) => $(p + id);
  const seek = (t) => { try { el.currentTime = t; } catch (e) {} };
  c.render = () => {
    q("Fill").style.width = FRAC[c.step] + "%";
    q("Marker").style.left = "clamp(16px, " + FRAC[c.step] + "%, calc(100% - 16px))";
    q("MarkerText").textContent = STEPS[c.step] + "s";
    q("Len").textContent = STEPS[c.step] + "s";
  };
  c.prog = (w) => { q("Prog").style.width = w + "%"; };
  c.rings = (on) => {
    const row = q("Play").parentNode;
    if (on) {
      if (c.ringTimer) return;
      const spawn = () => { const r = document.createElement("i"); r.className = "play-ring"; r.addEventListener("animationend", () => r.remove()); row.insertBefore(r, row.firstChild); };
      spawn(); c.ringTimer = setInterval(spawn, 750);
    } else {
      clearInterval(c.ringTimer); c.ringTimer = 0;
      row.querySelectorAll(".play-ring").forEach((x) => x.remove());
    }
  };
  c.icon = (playing) => { q("Play").innerHTML = playing ? PAUSE_SVG : PLAY_SVG; c.rings(playing); };
  const prepare = (url, my) => {
    c.settled = false;
    c.ready = Promise.race([findHook(url), new Promise((r) => setTimeout(() => r(0), 1200))]).then((v) => {
      if (my === c.lt) { c.start = v || 0; c.settled = true; }
      return v;
    });
  };
  c.load = (url, track) => {
    c.stop(); c.step = 0; c.recovered = false; c.failed = false; c.start = 0; c.tr = track || null;
    const my = ++c.lt;
    el.src = url; el.load(); c.render();
    prepare(url, my);
  };
  c.recover = async () => {
    if (c.recovered || !c.tr) return false;
    c.recovered = true;
    const my = c.lt, url = await freshPreview(c.tr);
    if (my !== c.lt || !url) return false;
    c.tr.preview = url;
    el.src = url; el.load();
    prepare(url, my);
    return true;
  };
  const go = () => {
    c.waiting = false;
    markPlay(p);
    cancelAnimationFrame(c.raf);
    seek(c.start);
    el.volume = vol();
    const pr = el.play();
    if (pr) pr.catch((e) => {
      if (e && e.name === "AbortError") return;
      c.icon(false);
      if (e && e.name === "NotAllowedError") { showToast("Tap play again to start the audio."); return; }
      c.recover().then((ok) => { if (ok) c.play(); else showToast("Audio preview unavailable. Skip to the next song."); });
    });
    c.icon(true);
    const loop = () => {
      const t = el.currentTime - c.start, len = STEPS[c.step];
      c.prog(Math.max(0, Math.min(1, t / len)) * FRAC[c.step]);
      if (t >= len) { c.stop(); return; }
      c.raf = requestAnimationFrame(loop);
    };
    c.raf = requestAnimationFrame(loop);
  };
  c.play = () => {
    if (!el.src) return;
    c.wanted = true;
    const tok = ++c.pt;
    if (!c.settled) { c.waiting = true; c.icon(true); c.ready.then(() => { if (tok === c.pt) go(); }); return; }
    go();
  };
  c.playFree = () => {
    ++c.pt; c.waiting = false; cancelAnimationFrame(c.raf); c.raf = 0; c.prog(0);
    seek(c.start);
    el.volume = vol();
    const pr = el.play(); if (pr) pr.catch(() => {});
    c.icon(true);
  };
  c.stop = () => {
    ++c.pt; c.waiting = false; c.wanted = false;
    cancelAnimationFrame(c.raf); c.raf = 0;
    el.pause(); seek(c.start);
    c.icon(false); c.prog(0);
  };
  c.toggle = () => ((el.paused && !c.waiting) ? c.play() : c.stop());
  c.advance = (quiet) => {
    if (c.step >= STEPS.length - 1) return false;
    c.step++; c.render();
    if (!(!el.paused && c.raf)) c.play();
    if (!quiet) sfx("advance");
    return true;
  };
  el.addEventListener("ended", c.stop);
  el.addEventListener("error", () => {
    if (!el.src || !el.error || el.error.code === 1) return;
    const wanted = c.wanted;
    c.recover().then((ok) => {
      if (ok) { if (wanted) c.play(); return; }
      if (!c.failed) { c.failed = true; showToast("This preview is unavailable. Skip to the next song."); }
    });
  });
  return c;
}
function togglePlay(p) { clips[p].toggle(); }
function gameHTML(p) {
  const ticks = [1, 2, 3].map((i) => '<span class="clip-tick" style="left:' + FRAC[i] + '%"></span>').join("");
  return `
    <div class="clip-bar" id="${p}Bar"><div class="clip-fill" id="${p}Fill"></div><div class="clip-prog" id="${p}Prog"></div>${ticks}</div>
    <div class="clip-marker-wrap"><div class="clip-marker" id="${p}Marker"><i></i><span id="${p}MarkerText">0.1s</span></div></div>
    <div class="play-row">
      <button class="play-big" id="${p}Play" onclick="togglePlay('${p}')" aria-label="Play">${PLAY_SVG}</button>
      <span class="clip-len" id="${p}Len">0.1s</span>
    </div>
    <div id="${p}TypeArea">
      <div class="answer-row">
        <div class="search" id="${p}Search">${SEARCH_SVG}<input id="${p}Input" autocomplete="off" spellcheck="false" placeholder="Search for a song..." oninput="guessInput('${p}')" onkeydown="guessKey(event,'${p}')" /><i class="spin"></i>${X_SVG}</div>
        <button class="gs-btn" id="${p}Btn" onclick="guessPress('${p}')"><span class="ico">${SKIP_SVG}</span><span class="lbl">Skip</span></button>
      </div>
      <div class="sugg" id="${p}Sugg"></div>
    </div>
    <div id="${p}ClickArea" style="display:none">
      <div class="options" id="${p}Options"></div>
      <div class="click-actions">
        <button class="skip-btn" onclick="skipPress('${p}')">${SKIP_SVG}Skip</button>
        <div class="hearts" id="${p}HeartsCard" title="Lives left"><b id="${p}Hearts">${CLICK_LIVES}</b>${HEART_SVG}</div>
      </div>
    </div>
    <div class="msg" id="${p}Msg"></div>`;
}
const cur = (p) => (p === "solo" ? S.track : D.track);
function setMsg(p, html, cls = "") { const m = $(p + "Msg"); m.className = "msg " + cls; m.innerHTML = html; }
function revealHTML(t) {
  return `<div class="reveal"><img src="${esc(t.cover)}" alt="" onerror="this.style.visibility='hidden'"><div><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div></div>`;
}
function updateBtn(p) {
  const has = !!PICKED[p];
  const b = $(p + "Btn");
  b.classList.toggle("is-guess", has);
  b.querySelector(".lbl").textContent = has ? "Guess" : "Skip";
}
function wrongFx(p) {
  sfx("wrong");
  try { navigator.vibrate?.(70); } catch (e) {}
  const bar = $(p + "Bar");
  bar.classList.remove("bad"); void bar.offsetWidth; bar.classList.add("bad");
  const s = $(p + "Search");
  s.classList.remove("bad"); void s.offsetWidth; s.classList.add("bad");
  clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove("bad"), 900);
}
const SQ = { solo: { timer: 0, id: 0, items: [], sel: -1 }, duel: { timer: 0, id: 0, items: [], sel: -1 } };
const SCACHE = new Map();
const setLoading = (p, on) => $(p + "Search").classList.toggle("loading", on);
function hideSugg(p) { const b = $(p + "Sugg"); b.innerHTML = ""; b.classList.remove("open"); SQ[p].items = []; SQ[p].sel = -1; }
function resetSearch(p) { clearTimeout(SQ[p].timer); SQ[p].id++; setLoading(p, false); hideSugg(p); PICKED[p] = null; updateBtn(p); }
function uniqTracks(list) { const s = new Set(); return list.filter((t) => { const k = tk(t); if (s.has(k)) return false; s.add(k); return true; }); }
const FAME = new Map();
[[MEGA, 46], [POPULAR, 32], [CLASSIC, 26], [DEEP, 14], [LEGENDS, 10]].forEach(([list, v]) => list.forEach((a) => { const k = plain(a); if (!FAME.has(k) || FAME.get(k) < v) FAME.set(k, v); }));
const fameOf = (artist) => {
  const k = plain(artist);
  if (FAME.has(k)) return FAME.get(k);
  let best = 0;
  String(artist).split(/\s*(?:,|&|\+|\bfeat\.?|\bft\.?|\bwith\b|\band\b|\bx\b|\/)\s*/i).forEach((x) => { best = Math.max(best, FAME.get(plain(x)) || 0); });
  return best;
};
function cachedSearch(q) {
  const k = q.toLowerCase();
  if (SCACHE.has(k)) return SCACHE.get(k);
  const iUp = NET.itunes.down <= Date.now(), dUp = NET.deezer.down <= Date.now() || !iUp;
  const pr = Promise.all([
    iUp ? itunesSearch(q, 60).catch(() => itunesJsonp(q, 60)).catch((e) => { NET.itunes.down = Date.now() + RESTS.itunes; return []; }) : [],
    iUp ? itunesSearch(q, 30, true).catch(() => []) : [],
    dUp ? deezerSearch(q, 60).catch((e) => { NET.deezer.down = Date.now() + RESTS.deezer; return []; }) : [],
  ]).then(([a, b, c]) => {
    const pop = new Map();
    c.forEach((t) => pop.set(tk(t), t.pop));
    const seen = new Set(), out = [];
    [a, b, c].forEach((list) => list.forEach((t, i) => {
      const key = tk(t);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ ...t, pop: t.pop || pop.get(key) || 0, ord: i });
    }));
    if (!out.length) SCACHE.delete(k);
    return out;
  }).catch(() => { SCACHE.delete(k); return []; });
  SCACHE.set(k, pr);
  if (SCACHE.size > 60) SCACHE.delete(SCACHE.keys().next().value);
  return pr;
}
function rankTracks(list, raw) {
  const q = norm(raw);
  if (!q) return [];
  const toks = q.split(" ").filter(Boolean);
  return list.map((t) => {
    const ti = norm(t.title), ar = norm(t.artist), hay = ti + " " + ar;
    const hit = toks.filter((w) => hay.includes(w)).length;
    if (!hit) return null;
    const all = hit === toks.length;
    if (!all && (toks.length === 1 || hit < toks.length - 1)) return null;
    let s = hit * 20 + (all ? 100 : 0);
    if (ti === q) s += 300; else if (ti.startsWith(q)) s += 150; else if (ti.includes(q)) s += 80;
    if (hay.startsWith(q)) s += 60;
    if (hay === q) s += 100;
    toks.forEach((w) => { if (ti.split(" ").some((x) => x.startsWith(w))) s += 8; });
    s -= Math.min(20, ti.length / 6);
    s += fameOf(t.artist);
    if (t.pop) s += Math.min(40, Math.log10(t.pop + 1) * 6);
    if (t.ord !== undefined) s += Math.max(0, 14 - t.ord * 0.35);
    return { t, s };
  }).filter(Boolean).sort((a, b) => b.s - a.s).map((x) => x.t);
}
function guessInput(p) {
  PICKED[p] = null;
  updateBtn(p);
  const st = SQ[p], raw = $(p + "Input").value.trim();
  clearTimeout(st.timer); st.id++;
  hideSugg(p);
  if (!raw) { setLoading(p, false); return; }
  setLoading(p, true);
  const id = st.id;
  st.timer = setTimeout(() => runSearch(p, raw, id), 420);
}
async function runSearch(p, raw, id) {
  const st = SQ[p];
  let live = [];
  try { live = await Promise.race([cachedSearch(raw), new Promise((r) => setTimeout(() => r([]), 6000))]); } catch (e) {}
  if (id !== st.id) return;
  let items = rankTracks(uniqTracks([...live, ...allTracks()]), raw).slice(0, 40);
  if (!items.length) items = uniqTracks(live).slice(0, 20);
  setLoading(p, false);
  renderSugg(p, items);
}
function renderSugg(p, list) {
  const box = $(p + "Sugg"), st = SQ[p];
  st.items = list; st.sel = -1;
  box.innerHTML = "";
  if (!list.length) box.innerHTML = '<div class="sugg-row none">No matches</div>';
  list.forEach((t, i) => {
    const b = document.createElement("button");
    const done = GUESSED[p].has(tk(t));
    b.className = "sugg-row" + (done ? " done" : ""); b.dataset.i = i;
    b.innerHTML = `<img src="${esc(t.cover)}" alt="" onerror="this.style.visibility='hidden'"><span class="t"><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></span>${done ? '<span class="ag">Already guessed</span>' : ""}`;
    if (done) b.disabled = true;
    b.onclick = () => { pickGuess(p, t); $(p + "Input").blur(); };
    box.appendChild(b);
  });
  box.scrollTop = 0;
  box.classList.add("open");
}
const GUESSED = { solo: new Set(), duel: new Set() };
const PICKED = { solo: null, duel: null };
function pickGuess(p, t) {
  if (GUESSED[p].has(tk(t))) return;
  resetSearch(p);
  PICKED[p] = t;
  $(p + "Input").value = t.title + " \u2014 " + t.artist;
  updateBtn(p);
}
function guessKey(e, p) {
  const st = SQ[p];
  const rows = [...$(p + "Sugg").querySelectorAll(".sugg-row[data-i]")];
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    if (!rows.length) return;
    e.preventDefault();
    if (e.key === "ArrowDown") st.sel = (st.sel + 1) % rows.length; else st.sel = st.sel <= 0 ? rows.length - 1 : st.sel - 1;
    rows.forEach((r, i) => r.classList.toggle("active", i === st.sel));
    rows[st.sel].scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") {
    if (st.sel >= 0 && st.items[st.sel]) pickGuess(p, st.items[st.sel]); else guessPress(p, true);
  } else if (e.key === "Escape") { hideSugg(p); }
}
function guessPress(p, enter) {
  const t = PICKED[p];
  if (!t) { if (!enter) skipPress(p); return; }
  const ok = sameSong(t, cur(p));
  if (!ok) GUESSED[p].add(tk(t));
  $(p + "Input").value = "";
  resetSearch(p);
  submit(p, ok);
}
function skipPress(p) { p === "solo" ? soloSkip() : duelSkip(); }
function submit(p, ok) { p === "solo" ? soloAnswer(ok) : duelAnswer(ok); }
function setLives(p, n) { const el = $(p + "Hearts"); if (el) el.textContent = Math.max(0, n); }
function hitHeart(p) { const c = $(p + "HeartsCard"); c.classList.remove("hit"); void c.offsetWidth; c.classList.add("hit"); }
function renderOptions(p, list) {
  const box = $(p + "Options");
  box.innerHTML = "";
  list.forEach((t) => {
    const b = document.createElement("button");
    b.className = "option"; b.dataset.id = t.id;
    b.innerHTML = `<img src="${esc(t.cover)}" alt="" onerror="this.style.visibility='hidden'"><span><strong>${esc(t.title)}</strong><small>${esc(t.artist)}</small></span>`;
    b.onclick = () => {
      if (p === "solo" ? S.locked : D.locked) return;
      const ok = sameSong(t, cur(p));
      if (ok) b.classList.add("correct"); else { b.classList.add("wrong", "shake"); b.disabled = true; }
      submit(p, ok);
    };
    box.appendChild(b);
  });
}
function lockOptions(p, track) {
  document.querySelectorAll("#" + p + "Options .option").forEach((b) => {
    b.disabled = true;
    if (track && b.dataset.id === track.id) b.classList.add("correct");
  });
}
function applyMode(p, mode) {
  $(p + "TypeArea").style.display = mode === "type" ? "block" : "none";
  $(p + "ClickArea").style.display = mode === "click" ? "block" : "none";
}
function renderDiff(id, current, onPick) {
  const box = $(id);
  box.innerHTML = "";
  LEVELS.forEach((l) => {
    const b = document.createElement("button");
    b.className = "pill" + (l === current ? " sel" : "");
    b.dataset.level = l; b.textContent = LEVEL_NAMES[l];
    b.onclick = () => { box.querySelectorAll(".pill").forEach((x) => x.classList.toggle("sel", x === b)); onPick(l); };
    box.appendChild(b);
  });
}
const S = { mode: "type", diff: "easy", track: null, locked: true, token: 0, startedAt: 0, wrongs: 0, lives: CLICK_LIVES, cancel: null, pendingLoad: false, ls: {} };
function startSolo(mode) {
  closeSoloResult();
  S.mode = mode;
  showView("gameView");
  applyMode("solo", mode);
  renderDiff("soloDiff", S.diff, (l) => { S.diff = l; beginSolo(); });
  updateScoreChip();
  beginSolo();
}
function leaveGame() { S.pendingLoad = false; S.token++; closeSoloResult(); clips.solo.stop(); resetSearch("solo"); showView("homeView"); }
async function beginSolo() {
  const t = ++S.token;
  closeSoloResult();
  S.locked = true;
  clips.solo.stop();
  resetSearch("solo");
  $("soloInput").value = ""; updateBtn("solo");
  $("soloOptions").innerHTML = "";
  setMsg("solo", "Loading songs...", "loading");
  try { await loadTracks(S.diff); }
  catch (e) {
    if (t !== S.token) return;
    setMsg("solo", 'Couldn\'t reach the music catalogue.<button class="retry" onclick="beginSolo()">Retry</button>' + (LOAD_ERR ? '<small style="display:block;margin-top:8px;color:#7f8b83">' + esc(LOAD_ERR) + "</small>" : ""));
    return;
  }
  if (t !== S.token) return;
  newSoloRound();
}
function newSoloRound() {
  const tr = pickTrack(S.diff);
  if (!tr) { setMsg("solo", 'No songs available.<button class="retry" onclick="beginSolo()">Retry</button>'); return; }
  S.track = tr; S.locked = false; S.startedAt = 0; S.wrongs = 0; S.lives = CLICK_LIVES; setLives("solo", S.lives); GUESSED.solo.clear();
  clips.solo.load(tr.preview, tr);
  srv("start_round", { mode: S.mode, diff: S.diff });
  $("soloInput").value = ""; updateBtn("solo"); resetSearch("solo");
  setMsg("solo", "");
  if (S.mode === "click") renderOptions("solo", makeOptions(tr, S.diff)); else $("soloOptions").innerHTML = "";
}
function soloAnswer(ok) {
  if (S.locked) return;
  if (ok) { soloEnd(true); return; }
  S.wrongs++; localStats((x) => { x.wrong++; }); srv("record_wrong");
  wrongFx("solo");
  if (S.mode === "click") {
    S.lives--; setLives("solo", S.lives); hitHeart("solo");
    if (S.lives <= 0) { soloEnd(false); return; }
  }
  if (!clips.solo.advance(true)) soloEnd(false);
}
function soloSkip() {
  if (S.locked) return;
  if (!clips.solo.advance()) soloEnd(false);
}
function soloEnd(correct) {
  S.locked = true; S.lastEst = 0;
  clips.solo.stop();
  resetSearch("solo");
  const secs = S.startedAt ? (Date.now() - S.startedAt) / 1000 : 0;
  const key = S.mode + ":" + S.diff;
  let streak = 0, nextDiff = "", pending = null;
  if (correct) {
    streak = S.ls[key] = (S.ls[key] || 0) + 1;
    const est = ME && ME.token ? estPts(S.mode, S.diff, S.wrongs, clips.solo.step, secs, streak - 1) : 0, md = S.mode;
    S.lastEst = est;
    localStats((x) => { x.correct++; x.score[md] = (x.score[md] || 0) + est; x.best = Math.max(x.best, streak); x.fastest = x.fastest === null ? Math.max(0.5, secs) : Math.min(x.fastest, Math.max(0.5, secs)); });
    pending = srv("record_correct", { secs: Math.max(0.5, secs), step: clips.solo.step });
    sfx("correct");
    if (lsGet("sg_autodiff", "0") === "1") {
      const i = LEVELS.indexOf(S.diff);
      if (i >= 0 && i < LEVELS.length - 1) nextDiff = LEVELS[i + 1];
    }
  } else { S.ls[key] = 0; srv("record_loss"); sfx("lose"); }
  S.pendingLoad = !!nextDiff;
  showSoloResult(correct, secs, streak, nextDiff, pending);
}
function showSoloResult(correct, secs, streak, nextDiff = "", pending = null) {
  const t = S.track, tok = S.token;
  const secTxt = secs < 10 ? secs.toFixed(1) : Math.round(secs);
  const sub = esc(t.artist) + (t.album ? " · " + esc(t.album) : "");
  const art = `<img class="res-art" src="${esc(t.cover)}" alt="" onerror="this.style.visibility='hidden'">`;
  $("soloResult").innerHTML = correct
    ? `<div class="res good">${art}<h2 class="res-title">${esc(t.title)}</h2><div class="res-sub">${sub}</div>
        <div class="res-badges"><span class="stamp">GUESSED IN ${secTxt}S!</span><span class="streak" id="soloStreakTxt">${FLAME_SVG} ${streak} in a row</span><span class="streak" id="soloPts">+${S.lastEst ? S.lastEst.toLocaleString() : "…"} pts</span>${nextDiff ? `<span class="streak">&#8593; ${LEVEL_NAMES[nextDiff]} next</span>` : ""}</div>
        <div class="res-actions"><button class="res-next" onclick="nextSolo()">Next</button></div><div class="cool"><i id="soloCool"></i></div></div>`
    : `<div class="res bad">${art}<div class="res-eyebrow">IT WAS_</div><h2 class="res-title">${esc(t.title)}</h2><div class="res-sub">${sub}</div>
        <div class="res-badges"><span class="stamp">LOST!</span><span class="streak" style="color:#9aa6a0">No score</span></div>
        <div class="res-actions"><button class="res-next" onclick="nextSolo()">Try again</button></div><div class="cool"><i id="soloCool"></i></div></div>`;
  if (pending) pending.then((st) => {
    if (tok !== S.token) return;
    const pt = $("soloPts"), sk = $("soloStreakTxt");
    if (!pt) return;
    if (!st) pt.textContent = "Not saved";
    else if (st.rejected) pt.textContent = "Too quick to count";
    else { pt.textContent = "+" + Number(st.points).toLocaleString() + " pts"; if (sk) sk.innerHTML = FLAME_SVG + " " + st.streak + " in a row"; }
  });
  $("soloBody").style.display = "none";
  $("soloResult").style.display = "block"; window.__resAt = Date.now();
  document.body.classList.toggle("lost", !correct);
  if (correct) confetti();
  clips.solo.playFree();
  const el = clips.solo.el, bar = $("soloCool");
  if (lsGet("sg_autonext", "1") === "1") {
    S.cancel = runCooldown(correct ? 6500 : 6000, el, (k) => {
      bar.style.width = k * 100 + "%";
      if (k > 0.9) el.volume = Math.max(0, vol() * ((1 - k) / 0.1));
    }, () => { S.cancel = null; if (tok === S.token) nextSolo(); });
  } else {
    bar.parentNode.style.display = "none";
  }
}
function nextSolo() {
  if (!S.locked) return;
  if (S.pendingLoad) {
    S.pendingLoad = false;
    const i = LEVELS.indexOf(S.diff);
    if (i >= 0 && i < LEVELS.length - 1) S.diff = LEVELS[i + 1];
    renderDiff("soloDiff", S.diff, (l) => { S.diff = l; beginSolo(); });
    beginSolo();
    return;
  }
  closeSoloResult();
  newSoloRound();
}
function closeSoloResult() {
  if (S.cancel) { S.cancel(); S.cancel = null; }
  $("soloResult").style.display = "none"; $("soloResult").innerHTML = "";
  $("soloBody").style.display = "";
  document.body.classList.remove("lost");
  stopConfetti();
  if (clips.solo) { clips.solo.stop(); clips.solo.el.volume = vol(); }
}
const D = {
  client: null, channel: null, code: "", host: false, hostId: "", players: [], settings: null, round: 0, total: 10, track: null, roundDiff: "easy",
  score: {}, answers: {}, locked: true, resolved: false, startedAt: 0, roundStart: 0, wrongs: 0, lives: CLICK_LIVES, streak: 0, finished: false,
  inMatch: false, started: false, joining: false, myId: crypto.randomUUID(), name: currentName(),
  helloTimer: null, nextTimer: null, podTimer: null,
};
let duelDiffSel = "easy", duelMode = null, duelRandom = false;
let SBC = null;
function sb() {
  if (!SBC) {
    if (!window.supabase) throw new Error("Supabase library did not load. Reload the page.");
    SBC = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, realtime: { params: { eventsPerSecond: 10 } } });
  }
  return SBC;
}
const supabaseClient = sb;
const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
const send = (event, payload) => D.channel?.send({ type: "broadcast", event, payload });
const MODE_NAME = { type: "Type answer", click: "Click answer", both: "Both modes" };
const timerName = (v) => (TIMERS.find((t) => t[0] === v) || [0, ""])[1];
const settingsText = () => D.settings ? `${D.settings.random ? "Random difficulty" : LEVEL_NAMES[D.settings.difficulty]} · ${MODE_NAME[D.settings.mode] || "Click answer"}${D.settings.timer ? " · " + timerName(D.settings.timer) + " timer" : ""}${D.settings.tabs ? " · Tab changes tracked" : ""} · ${D.settings.total} rounds` : "";
function toggleDD(e, id) {
  e?.stopPropagation();
  document.querySelectorAll(".dd.open").forEach((d) => { if (d.id !== id) d.classList.remove("open"); });
  $(id).classList.toggle("open");
}
function pickMode(v, l) {
  duelMode = v;
  $("modeLabel").textContent = l; $("modeBtn").classList.add("has");
  document.querySelectorAll("#modeDD .dd-item").forEach((i) => i.classList.toggle("sel", i.dataset.v === v));
  $("modeDD").classList.remove("open");
  $("createBtn").disabled = false;
}
const TIMERS = [[0, "Off"], [15, "15 seconds"], [30, "30 seconds"], [45, "45 seconds"], [60, "60 seconds"], [90, "1.5 minutes"], [120, "2 minutes"], [180, "3 minutes"], [240, "4 minutes"], [300, "5 minutes"]];
let duelTimerSel = 0;
$("timerMenu").innerHTML = TIMERS.map(([v, l]) => `<button type="button" class="dd-item${v === 0 ? " sel" : ""}" data-v="${v}" onclick="pickTimer(${v})">${l}${`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10" /></svg>`}</button>`).join("");
function pickTimer(v) {
  duelTimerSel = v;
  $("timerLabel").textContent = TIMERS.find((t) => t[0] === v)[1];
  document.querySelectorAll("#timerMenu .dd-item").forEach((i) => i.classList.toggle("sel", Number(i.dataset.v) === v));
  $("timerDD").classList.remove("open");
}
function setDuelRandom(v) { duelRandom = !!v; $("duelDiff").classList.toggle("off", duelRandom); }
document.addEventListener("click", (e) => { document.querySelectorAll(".dd.open").forEach((d) => { if (!d.contains(e.target)) d.classList.remove("open"); }); });
async function createDuel() {
  if (!duelMode) { showToast("Choose a gamemode first."); return; }
  const btn = $("createBtn");
  btn.disabled = true;
  try {
    const total = Math.max(1, Math.min(100, Math.floor(Number($("duelRounds").value) || 10)));
    $("duelRounds").value = total;
    await loadTracks(duelRandom ? "easy" : duelDiffSel);
    D.client = sb();
    D.name = currentName();
    D.code = makeCode(); D.host = true; D.hostId = D.myId; D.started = false;
    D.players = [{ id: D.myId, name: D.name }];
    D.settings = { difficulty: duelDiffSel, mode: duelMode, total, random: duelRandom, timer: duelTimerSel, tabs: !!$("duelTabs").checked };
    D.total = total; D.score = { [D.myId]: 0 };
    await connectDuel();
    showLobby();
    if (duelRandom) (async () => { for (const l of LEVELS) { if (!D.channel) return; await loadTracks(l).catch(() => {}); await delay(600); } })();
  } catch (e) { showToast(e.message || "Could not create duel."); await disconnectDuel(null); }
  btn.disabled = !duelMode;
}
function onJoinInput() {
  const inp = $("joinCode");
  inp.value = inp.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  inp.classList.remove("err"); $("joinMsg").classList.remove("show");
  if (inp.value.length === 6) joinDuel(inp.value);
}
function joinFail(msg) {
  const inp = $("joinCode"), m = $("joinMsg");
  inp.value = ""; inp.disabled = false;
  inp.classList.add("err", "shake");
  m.textContent = msg; m.classList.remove("note"); m.classList.add("show");
  showToast(msg);
  setTimeout(() => inp.classList.remove("shake"), 450);
  clearTimeout(joinFail.t);
  joinFail.t = setTimeout(() => { m.classList.remove("show"); inp.classList.remove("err"); }, 9000);
  inp.focus();
}
function joinNote(msg) { const m = $("joinMsg"); m.textContent = msg; m.classList.add("show", "note"); }
function failJoin(msg) {
  clearTimeout(joinFail.watch); clearInterval(joinFail.pres);
  try { disconnectDuel(null).catch(() => {}); } catch (e) {}
  joinFail(msg);
}
async function joinDuel(code) {
  if (D.joining) return;
  D.joining = true;
  $("joinCode").disabled = true;
  joinNote("Looking for that duel...");
  clearTimeout(joinFail.t); $("joinCode").classList.remove("err");
  clearTimeout(joinFail.watch); clearInterval(joinFail.pres);
  joinFail.watch = setTimeout(() => { if (D.joining && !D.settings) failJoin("That duel code doesn't exist. Check it and try again."); }, 7000);
  try {
    D.client = sb();
    D.name = currentName();
    D.code = code; D.host = false; D.hostId = ""; D.players = []; D.settings = null; D.started = false;
    await connectDuel();
    const t0 = Date.now();
    joinFail.pres = setInterval(() => {
      if (D.settings || !D.channel) { clearInterval(joinFail.pres); return; }
      let others = 1;
      try { others = Object.keys(D.channel.presenceState() || {}).filter((k) => k !== D.myId).length; } catch (e) {}
      if (!others && Date.now() - t0 > 2500) failJoin("That duel code doesn't exist. Check it and try again.");
    }, 300);
    let tries = 0;
    const hello = () => {
      if (D.settings || !D.channel) return;
      if (tries++ >= 5) { failJoin("That duel code doesn't exist. Check it and try again."); return; }
      send("hello", { id: D.myId, name: D.name });
      D.helloTimer = setTimeout(hello, 800);
    };
    hello();
  } catch (e) { failJoin(e.message || "Couldn't connect. Check your connection."); }
}
const broadcastRoster = () => send("roster", { players: D.players, hostId: D.myId, settings: D.settings });
async function connectDuel() {
  D.channel = D.client.channel("song-guesser-" + D.code, { config: { broadcast: { self: false }, presence: { key: D.myId } } });
  const on = (ev, fn) => D.channel.on("broadcast", { event: ev }, ({ payload }) => fn(payload || {}));
  on("hello", (p) => {
    if (!D.host || !p.id) return;
    const known = D.players.find((x) => x.id === p.id);
    if (!known) {
      if (D.started) { send("denied", { to: p.id, reason: "started" }); return; }
      if (D.players.length >= MAX_PLAYERS) { send("denied", { to: p.id, reason: "full" }); return; }
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
    D.settings = p.settings; D.total = p.settings.total; D.hostId = p.hostId; D.players = p.players;
    if (first) { D.score = {}; D.players.forEach((x) => { D.score[x.id] = 0; }); showLobby(); } else if (!D.inMatch) updateLobby();
  });
  on("denied", (p) => {
    if (D.host || p.to !== D.myId) return;
    failJoin(p.reason === "full" ? "That duel is full." : "That duel has already started, so you can't join anymore.");
  });
  on("kick", (p) => { if (!D.host && p.id === D.myId) { showToast("The host removed you from the duel."); disconnectDuel(); } });
  on("match-start", (p) => { if (!D.host) { D.settings = p.settings; beginRound(p); } });
  on("new-round", (p) => { if (!D.host) beginRound(p); });
  on("done", (p) => { if (D.host) handleDone(p); });
  on("away", (p) => onAway(p));
  on("round-result", (p) => { if (!D.host) showRoundResult(p); });
  on("match-end", (p) => { if (!D.host) showMatchResult(p); });
  D.channel.on("presence", { event: "leave" }, ({ key }) => { if (key !== D.myId && D.channel) playerLeft(key); });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Could not connect. Check your connection.")), 10000);
    D.channel.subscribe((s) => {
      if (s === "SUBSCRIBED") { clearTimeout(t); resolve(); }
      if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") { clearTimeout(t); reject(new Error("Could not connect to the duel channel.")); }
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
    delete D.answers[id]; delete D.score[id];
    if (!D.inMatch) { broadcastRoster(); updateLobby(); return; }
    showToast(gone.name + " left the duel.");
    if (D.players.length < 2) { showToast("Everyone else left the duel."); disconnectDuel(); return; }
    broadcastRoster();
    checkResolve();
  } else if (id === D.hostId) { showToast("The host left the duel."); disconnectDuel(); }
}
function kickPlayer(id) {
  if (!D.host || D.inMatch || id === D.myId) return;
  const i = D.players.findIndex((x) => x.id === id);
  if (i < 0) return;
  send("kick", { id });
  D.players.splice(i, 1); delete D.score[id];
  broadcastRoster();
  updateLobby();
}
function showLobby() { clearTimeout(joinFail.watch); clearInterval(joinFail.pres); $("joinMsg").classList.remove("show", "note"); D.joining = false; showView("lobbyView"); $("lobbyCode").textContent = D.code; updateLobby(); }
const X_SM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
function updateLobby() {
  const n = D.players.length;
  $("lobbyCount").textContent = n + (n === 1 ? " player" : " players");
  $("playerList").innerHTML = D.players.map((pl) => {
    const isHost = pl.id === D.hostId || (D.host && pl.id === D.myId);
    const me = pl.id === D.myId;
    return `<div class="pl-row"><span class="pl-name">${nameHTML(pl.name)}${me ? " <small>(you)</small>" : ""}</span>${isHost ? '<span class="pl-tag">HOST</span>' : ""}${D.host && !isHost ? `<button class="kick" onclick="kickPlayer('${esc(pl.id)}')" aria-label="Remove player" title="Remove player">${X_SM}</button>` : ""}</div>`;
  }).join("");
  $("lobbySettings").textContent = settingsText();
  const b = $("startBtn");
  b.disabled = !D.host || n < 2;
  b.textContent = D.host ? (n < 2 ? "Waiting for players..." : "Start duel (" + n + " players)") : "Waiting for host to start...";
}
function copyCode() {
  if (!navigator.clipboard?.writeText) { showToast("Duel code: " + D.code); return; }
  navigator.clipboard.writeText(D.code).then(() => showToast("Duel code copied.")).catch(() => showToast("Duel code: " + D.code));
}
function startMatch() {
  if (!D.host || D.players.length < 2 || D.started) return;
  D.started = true;
  $("startBtn").disabled = true;
  D.score = {}; D.players.forEach((x) => { D.score[x.id] = 0; });
  D.round = 0; D.streak = 0;
  hostNextRound("match-start");
}
async function hostNextRound(event = "new-round") {
  D.round++;
  let diff = D.settings.random ? LEVELS[Math.floor(Math.random() * LEVELS.length)] : D.settings.difficulty;
  if (D.settings.random) await Promise.race([loadTracks(diff).catch(() => {}), delay(8000)]);
  if (!D.channel) return;
  let track = pickTrack(diff);
  if (!track) {
    for (const l of shuffle(LEVELS.filter((x) => (POOL[x] || []).length))) { track = pickTrack(l); if (track) { diff = l; break; } }
  }
  if (!track) { showToast("No songs available."); return; }
  const mode = D.settings.mode === "both" ? (Math.random() < 0.5 ? "type" : "click") : D.settings.mode;
  const options = mode === "click" ? makeOptions(track, diff) : [];
  const payload = { settings: D.settings, total: D.total, round: D.round, track, options, score: D.score, diff, mode, players: D.players };
  send(event, payload);
  beginRound(payload);
}
function beginRound(p) {
  clearTimeout(D.nextTimer); clearTimeout(D.podTimer);
  stopConfetti();
  D.inMatch = true; D.finished = false; D.started = true;
  if (p.players) D.players = p.players;
  D.round = p.round; D.total = p.total; D.track = p.track; D.score = p.score; D.roundDiff = p.diff || D.settings.difficulty;
  D.answers = {}; D.away = {}; D.mine = false; renderAway(); D.locked = false; D.resolved = false; D.startedAt = 0; D.roundStart = Date.now(); D.wrongs = 0; D.lives = CLICK_LIVES; setLives("duel", D.lives); GUESSED.duel.clear();
  $("lbOverlay").classList.remove("open");
  $("duelBody").classList.remove("waiting");
  $("duelWait").classList.remove("show");
  showView("duelView");
  D.roundMode = p.mode || (D.settings.mode === "both" ? "click" : D.settings.mode);
  $("duelRound").textContent = `Round ${p.round} / ${p.total}` + (D.settings.random ? " · " + LEVEL_NAMES[D.roundDiff] : "") + (D.settings.mode === "both" ? " · " + (D.roundMode === "type" ? "Type" : "Click") : "");
  $("duelScore").textContent = (D.score[D.myId] || 0).toLocaleString();
  applyMode("duel", D.roundMode);
  clips.duel.load(p.track.preview, p.track);
  $("duelInput").value = ""; updateBtn("duel"); resetSearch("duel");
  setMsg("duel", "");
  if (D.roundMode === "click") renderOptions("duel", p.options); else $("duelOptions").innerHTML = "";
  startDuelTimer(D.settings.timer || 0);
}
function awayWho(id) { return id === D.myId ? "You" : (D.players.find((x) => x.id === id) || {}).name || "A player"; }
function renderAway() {
  const pill = $("duelCheat"), note = $("duelCheatNote"), ids = Object.keys(D.away || {});
  if (!pill || !note) return;
  if (!ids.length) { pill.hidden = true; note.hidden = true; return; }
  pill.hidden = false;
  pill.textContent = ids.map((id) => awayWho(id) + " changed tabs").join(" · ");
  note.hidden = false;
  note.innerHTML = ids.map((id) => esc(awayWho(id)) + " changed tabs, " + (id === D.myId ? "your" : "their") + " answer will be marked as cheating.").join("<br>");
}
function markAway() {
  if (!D.inMatch || D.locked || !D.settings || !D.settings.tabs || D.mine) return;
  D.mine = true; D.away[D.myId] = true;
  send("away", { id: D.myId, round: D.round });
  renderAway();
}
function onAway(p) {
  if (!D.inMatch || D.locked || !D.settings || !D.settings.tabs || p.round !== D.round || p.id === D.myId || !D.players.some((x) => x.id === p.id)) return;
  D.away[p.id] = true;
  renderAway();
}
document.addEventListener("visibilitychange", () => { if (document.hidden) markAway(); });
window.addEventListener("blur", () => { setTimeout(() => { if (!document.hasFocus()) markAway(); }, 1500); });
function paintTimer(left) {
  const t = $("duelTimer"), m = Math.floor(left / 60), s2 = left % 60;
  t.textContent = m + ":" + String(s2).padStart(2, "0");
  t.classList.toggle("low", left <= 10);
}
function stopDuelTimer() { clearInterval(D.tmr); D.tmr = 0; const t = $("duelTimer"); if (t) { t.classList.remove("on", "low"); } }
function startDuelTimer(sec) {
  stopDuelTimer();
  if (!sec) return;
  const end = Date.now() + sec * 1000, t = $("duelTimer");
  t.classList.add("on"); paintTimer(sec);
  D.tmr = setInterval(() => {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    paintTimer(left);
    if (left <= 0) { stopDuelTimer(); if (!D.locked) { setMsg("duel", "Time's up!"); sfx("wrong"); finishDuel(false); } }
  }, 200);
}
function duelAnswer(ok) {
  if (D.locked) return;
  if (ok) { finishDuel(true); return; }
  D.wrongs++; localStats((x) => { x.wrong++; }); srv("record_duel_guess", { kind: "wrong", secs: 0 });
  wrongFx("duel");
  if (D.roundMode === "click") {
    D.lives--; setLives("duel", D.lives); hitHeart("duel");
    if (D.lives <= 0) { finishDuel(false); return; }
  }
  if (!clips.duel.advance(true)) finishDuel(false);
}
function duelSkip() {
  if (D.locked) return;
  if (!clips.duel.advance()) finishDuel(false);
}
function finishDuel(correct) {
  if (D.locked) return;
  D.locked = true;
  stopDuelTimer();
  clips.duel.stop();
  resetSearch("duel");
  lockOptions("duel", correct ? D.track : null);
  $("duelBody").classList.add("waiting");
  $("duelWait").classList.add("show");
  const secs = (Date.now() - (D.startedAt || D.roundStart)) / 1000;
  let points = 0;
  if (correct) {
    points = calcPoints({ secs, wrongs: D.wrongs, step: clips.duel.step, mode: D.roundMode, diff: D.roundDiff, streak: D.streak });
    D.streak++;
    localStats((x) => { x.correct++; x.best = Math.max(x.best, D.streak); x.fastest = x.fastest === null ? Math.max(0.5, secs) : Math.min(x.fastest, Math.max(0.5, secs)); });
    srv("record_duel_guess", { kind: "correct", secs: Math.max(0.5, secs) });
    sfx("correct");
  } else { D.streak = 0; srv("record_duel_guess", { kind: "lost", secs: 0 }); }
  const payload = { id: D.myId, correct, points, cheat: !!D.mine };
  if (D.host) handleDone(payload); else send("done", payload);
}
function handleDone(p) {
  if (!p?.id || D.answers[p.id] || D.resolved || !D.players.some((x) => x.id === p.id)) return;
  D.answers[p.id] = { id: p.id, cheat: !!p.cheat, correct: !!p.correct, points: Math.max(0, Math.min(5000, Number(p.points) || 0)) };
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
  Object.values(D.answers).forEach((a) => { D.score[a.id] = (D.score[a.id] || 0) + (a.correct ? a.points : 0); });
  const names = {}; D.players.forEach((pl) => { names[pl.id] = pl.name; });
  const payload = { score: D.score, prev, answers: D.answers, track: D.track, round: D.round, total: D.total, names };
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
  D.locked = true; stopDuelTimer();
  clips.duel.stop();
  D.score = p.score;
  $("duelScore").textContent = (p.score[D.myId] || 0).toLocaleString();
  const ids = Object.keys(p.score);
  const prevOrder = [...ids].sort((a, b) => (p.prev[b] || 0) - (p.prev[a] || 0) || ids.indexOf(a) - ids.indexOf(b));
  const newOrder = [...ids].sort((a, b) => (p.score[b] || 0) - (p.score[a] || 0) || prevOrder.indexOf(a) - prevOrder.indexOf(b));
  const last = p.round >= p.total;
  const rows = ids.map((id) => {
    const me = id === D.myId;
    return `<div class="lb-row ${prevOrder[0] === id ? "first" : ""}" data-id="${esc(id)}" style="--i:${prevOrder.indexOf(id)}">
      <span class="rank">${prevOrder.indexOf(id) + 1}</span>
      <span class="nm">${nameHTML(p.names?.[id] || "Player")}${me ? " <small>(you)</small>" : ""}${p.answers[id]?.cheat ? ' <i class="mr-cheat">CHEATING</i>' : ""}</span>
      <span class="gain">+${p.answers[id]?.correct ? p.answers[id].points : 0}</span>
      <span class="pts">${(p.prev[id] || 0).toLocaleString()}</span></div>`;
  }).join("");
  const ov = $("lbOverlay");
  ov.innerHTML = `<div class="lb-inner">
    <div class="eyebrow">ROUND ${p.round} / ${p.total}</div>
    <h2>Leaderboard</h2>
    ${revealHTML(p.track)}
    <div class="lb" style="height:${ids.length * 72}px">${rows}</div>
    <div class="lb-foot">${last ? "Final results coming up..." : "Next song starting soon..."}</div></div>`;
  ov.classList.add("open");
  setTimeout(() => {
    ov.querySelectorAll(".lb-row").forEach((row) => {
      const id = row.dataset.id, idx = newOrder.indexOf(id);
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
  D.inMatch = false; stopDuelTimer();
  clips.duel.stop();
  $("lbOverlay").classList.remove("open");
  const rows = Object.keys(p.score).map((id) => ({ id, me: id === D.myId, score: p.score[id] || 0, name: p.names?.[id] || "Player" })).sort((a, b) => b.score - a.score);
  let pl = 0, prevS = null;
  rows.forEach((r, i) => { if (r.score !== prevS) pl = i + 1; r.place = pl; prevS = r.score; });
  const tie = rows.filter((r) => r.place === 1).length > 1;
  { const won = !tie && !!rows[0]?.me; localStats((x) => { x.duels++; if (won) x.wins++; }); srv("record_duel", { won }); }
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
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll(".pd-block").forEach((b) => { b.style.height = b.dataset.h + "px"; });
    }));
    fanfare(); confetti(true);
  }, 3300);
}
async function disconnectDuel(view = "multiplayerView") {
  clearTimeout(D.helloTimer); clearTimeout(D.nextTimer); clearTimeout(D.podTimer);
  clips.duel?.stop();
  stopConfetti();
  $("lbOverlay").classList.remove("open");
  const ch = D.channel, cl = D.client;
  stopDuelTimer(); D.channel = null; D.players = []; D.hostId = ""; D.settings = null; D.inMatch = false; D.started = false; D.joining = false; D.resolved = true; D.finished = false;
  $("joinCode").disabled = false; $("joinCode").value = "";
  if (view) showView(view);
  if (ch) { try { await Promise.race([ch.unsubscribe(), delay(1500)]); } catch (e) {} try { cl?.removeChannel(ch); } catch (e) {} }
}
const BOARDS = {
  type: { val: (p) => Number(p.score_type), fmt: (v) => v.toLocaleString(), dir: -1 },
  click: { val: (p) => Number(p.score_click), fmt: (v) => v.toLocaleString(), dir: -1 },
  correct: { label: "Songs guessed", val: (p) => Number(p.correct), fmt: (v) => v.toLocaleString(), dir: -1 },
  accuracy: { label: "Accuracy", val: (p) => (Number(p.correct) + Number(p.wrong) >= 10 ? Number(p.correct) / (Number(p.correct) + Number(p.wrong)) : null), fmt: (v) => Math.round(v * 1000) / 10 + "%", dir: -1, note: "Needs at least 10 guesses to qualify." },
  streak: { label: "Best streak", val: (p) => Number(p.best_streak), fmt: (v) => v.toLocaleString(), dir: -1 },
  duels: { label: "Duels played", val: (p) => Number(p.duels), fmt: (v) => v.toLocaleString(), dir: -1 },
  wins: { label: "Duels won", val: (p) => Number(p.wins), fmt: (v) => v.toLocaleString(), dir: -1 },
};
const STAT_KEYS = ["correct", "accuracy", "streak", "duels", "wins"];
let PROFILES = [];
const liveProfiles = () => PROFILES;
function boardRows(key) {
  const b = BOARDS[key];
  const rows = liveProfiles().map((p) => ({ p, v: b.val(p) })).filter((r) => r.v !== null && Number.isFinite(r.v) && r.v > 0);
  rows.sort((a, z) => b.dir * (a.v - z.v) || String(a.p.username).localeCompare(String(z.p.username)));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { if (prev === null || r.v !== prev) rank = i + 1; r.rank = rank; prev = r.v; });
  return rows;
}
function recomputeRanks() {
  const src = {};
  Object.keys(BOARDS).forEach((k) => boardRows(k).forEach((r) => {
    if (r.rank > 3) return;
    const n = String(r.p.username).toLowerCase();
    (src[n] = src[n] || []).push({ rank: r.rank, key: k });
  }));
  RANK_SRC = src;
}
let boardsT = 0;
function boardsChanged() {
  clearTimeout(boardsT);
  boardsT = setTimeout(() => {
    recomputeRanks();
    updateUserCard(); updateScoreChip();
    if ($("lbModal").classList.contains("open")) renderLb();
    if (D.channel && $("lobbyView").classList.contains("active")) updateLobby();
  }, 60);
}
async function fetchProfiles() {
  try {
    const { data, error } = await sb().from("stats").select("id,username,score_type,score_click,correct,wrong,best_streak,fastest,duels,wins").limit(5000);
    if (!error && Array.isArray(data)) { PROFILES = data; boardsChanged(); }
  } catch (e) {}
}
let boardSub = null;
function subscribeBoards() {
  if (boardSub || !window.supabase) return;
  try {
    boardSub = sb().channel("stats-live").on("postgres_changes", { event: "*", schema: "public", table: "stats" }, (pl) => {
      if (pl.eventType === "DELETE") PROFILES = PROFILES.filter((p) => p.id !== pl.old?.id);
      else if (pl.new?.id) {
        const i = PROFILES.findIndex((p) => p.id === pl.new.id);
        if (i >= 0) PROFILES[i] = { ...PROFILES[i], ...pl.new }; else PROFILES.push(pl.new);
        if (ME && pl.new.id === ME.id && pl.new.username && pl.new.username !== ME.username) { ME.username = pl.new.username; refreshIdentity(); renderAccount(); }
      }
      boardsChanged();
    }).subscribe();
  } catch (e) {}
}
function updateScoreChip() {
  const el = $("soloScore");
  if (!el) return;
  const v = stats.score[S.mode] || 0;
  el.textContent = v.toLocaleString();
  let t = "";
  if (ME && ME.id && v > 0) {
    const r = boardRows(S.mode).find((x) => x.p.id === ME.id);
    if (r) t = r.rank <= 10 ? "#" + r.rank : "10+";
  }
  $("soloRank").textContent = t;
}
const LB = { tab: "type", stat: "correct" };
function openLb(tab) {
  closeMenu();
  if (tab === "type" || tab === "click" || tab === "stats") LB.tab = tab;
  $("lbModal").classList.add("open");
  renderLb();
  fetchProfiles();
}
function closeLb() { $("lbModal").classList.remove("open"); }
function lbRow(r, i) {
  const me = ME && r.p.id === ME.id;
  const key = LB.tab === "stats" ? LB.stat : LB.tab;
  return `<div class="lbr ${r.rank <= 3 ? "p" + r.rank : ""} ${me ? "me" : ""}" style="animation-delay:${i * 25}ms"><span class="lbr-rank">${r.rank}</span><span class="lbr-name">${nameHTML(r.p.username)}${me ? " <small>(you)</small>" : ""}</span><b>${BOARDS[key].fmt(r.v)}</b></div>`;
}
function renderLb() {
  const isStats = LB.tab === "stats";
  $("lbTabs").innerHTML = [["type", "Type answer"], ["click", "Click answer"], ["stats", "Statistics"]].map(([k, l]) => `<button class="tab ${LB.tab === k ? "sel" : ""}" onclick="setLbTab('${k}')">${l}</button>`).join("");
  $("lbStats").hidden = !isStats;
  if (isStats) {
    $("lbTiles").innerHTML = statTiles();
    $("lbChips").innerHTML = STAT_KEYS.map((k) => `<button class="chip ${LB.stat === k ? "sel" : ""}" onclick="setLbStat('${k}')">${BOARDS[k].label}</button>`).join("");
  }
  const key = isStats ? LB.stat : LB.tab;
  const rows = boardRows(key);
  let html = rows.slice(0, 10).map(lbRow).join("");
  if (!rows.length) html = '<div class="lb-note">Nobody is on this leaderboard yet. Be the first!</div>';
  let mine = "";
  if (ME && ME.id) {
    const idx = rows.findIndex((r) => r.p.id === ME.id);
    if (idx >= 10) mine = '<div class="lb-dots">• • •</div>' + lbRow(rows[idx], 0);
    else if (idx < 0) mine = '<div class="lb-note">You\'re not on this leaderboard yet.' + (BOARDS[key].note ? " " + BOARDS[key].note : "") + "</div>";
  }
  if (isStats && BOARDS[key].note && ME && !mine.includes("not on")) mine += '<div class="lb-note" style="padding-top:8px">' + BOARDS[key].note + "</div>";
  $("lbList").innerHTML = html;
  $("lbMine").innerHTML = mine;
}
function setLbTab(t) { LB.tab = t; renderLb(); }
function setLbStat(k) { LB.stat = k; renderLb(); }
function toggleMenu(e) { e.stopPropagation(); $("menuPop").classList.toggle("open"); }
function closeMenu() { $("menuPop").classList.remove("open"); }
document.addEventListener("click", (e) => { if (!e.target.closest(".user-card")) closeMenu(); });
const TOKEN_RE = /^[A-Za-z0-9]{20,128}$/;
const api = async (name, args) => { const { data, error } = await sb().rpc(name, args); if (error) throw error; return data; };
function apiMsg(e) {
  const m = String((e && e.message) || e || "") + " " + String((e && (e.code || e.details)) || "");
  if (/username_taken/.test(m)) return "That username is already taken.";
  if (/username_invalid/.test(m)) return "Usernames are 3–20 characters: letters (A–Z, Å, Ä, Ö), numbers and . , ! ? ' - _";
  if (/invalid_token/.test(m)) return "That data token doesn't match any account.";
  if (/could not find the function|schema cache|PGRST202|42883/i.test(m)) return "The server isn't set up yet. Run supabase-setup.sql in Supabase first.";
  return "Couldn't reach the server. Check your connection and try again.";
}
let warnedAt = 0;
let pendingOps = 0;
let resyncing = false;
function estPts(mode, diff, wrongs, step, secs, before) {
  const speed = 0.25 + 0.75 * Math.exp(-Math.max(0.5, secs) / 20);
  const att = Math.pow(mode === "click" ? 0.45 : 0.62, wrongs);
  const snip = [1, 0.9, 0.75, 0.55, 0.4][Math.min(4, Math.max(step || 0, wrongs))];
  const mult = (mode === "type" ? 1.25 : 1) * (DIFF_MULT[diff] || 1);
  let p = Math.round(1000 * speed * att * snip * mult * (1 + Math.min(0.25, 0.05 * before)));
  p = Math.min(p, [1e6, 1200, 600, 300, 150][Math.min(wrongs, 4)]);
  return Math.max(10, p);
}
let srvChain = Promise.resolve();
function srv(name, args = {}) {
  if (!ME || !ME.token) return Promise.resolve(null);
  pendingOps++;
  const run = () => api(name, { t: ME.token, ...args }).then((st) => {
    pendingOps--;
    if (st && st.id) applyState(pendingOps > 0 ? { ...st, stats: null } : st);
    return st;
  }).catch((e) => {
    pendingOps--;
    if (Date.now() - warnedAt > 20000) { warnedAt = Date.now(); showToast("Couldn't save your progress. " + apiMsg(e)); }
    if (pendingOps === 0 && !resyncing && name !== "get_player") { resyncing = true; srv("get_player").finally(() => { resyncing = false; }); }
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
  if (r) Object.assign(r, { score_type: stats.score.type, score_click: stats.score.click, correct: stats.correct, wrong: stats.wrong, best_streak: stats.best, fastest: stats.fastest, duels: stats.duels, wins: stats.wins });
  boardsChanged();
}
const rowToStats = (r) => ({
  correct: Number(r.correct) || 0, wrong: Number(r.wrong) || 0, best: Number(r.best_streak) || 0,
  fastest: r.fastest === null || r.fastest === undefined ? null : Number(r.fastest),
  duels: Number(r.duels) || 0, wins: Number(r.wins) || 0, score: { type: Number(r.score_type) || 0, click: Number(r.score_click) || 0 },
});
function applyState(st) {
  ME = { ...(ME || {}), id: st.id, username: st.username };
  if (st.token) ME.token = st.token;
  lsSet("sg_name", st.username);
  if (st.stats) {
    stats = rowToStats(st.stats);
    const row = { ...st.stats, id: st.id, username: st.username };
    const i = PROFILES.findIndex((p) => p.id === st.id);
    if (i >= 0) PROFILES[i] = row; else PROFILES.push(row);
  }
  refreshIdentity();
  renderAccount();
}
function refreshIdentity() {
  D.name = currentName();
  updateUserCard(); updateScoreChip();
  boardsChanged();
}
const wcMsg = (t) => { const m = $("wcMsg"); m.textContent = t || ""; m.className = "auth-msg" + (t ? " show" : ""); };
function wcShow(which) { ["new", "token", "done"].forEach((k) => { $("wc_" + k).hidden = k !== which; }); wcMsg(""); }
function maybeWelcome() { if (!lsGet(TOKEN_KEY, "")) { wcShow("new"); $("welcomeModal").classList.add("open"); } }
async function createAccount() {
  const name = $("wcName").value.trim(), bad = checkUsername(name);
  if (bad) { wcMsg(bad); return; }
  const btn = $("wcCreate"); btn.disabled = true;
  try {
    const st = await api("create_player", { u: name });
    lsSet(TOKEN_KEY, st.token);
    ME = { token: st.token };
    applyState(st);
    $("wcTokenOut").value = st.token;
    wcShow("done");
  } catch (e) { wcMsg(apiMsg(e)); }
  finally { btn.disabled = false; }
}
async function loadToken(raw) {
  const t = String(raw || "").replace(/\s/g, "");
  if (!TOKEN_RE.test(t)) throw new Error("invalid_token");
  const st = await api("get_player", { t });
  if (!st || !st.id) throw new Error("invalid_token");
  lsSet(TOKEN_KEY, t);
  ME = { token: t };
  applyState(st);
}
async function wcLoad() {
  const btn = $("wcLoad"); btn.disabled = true;
  try { await loadToken($("wcToken").value); $("welcomeModal").classList.remove("open"); showToast("Welcome back, " + ME.username + "!"); }
  catch (e) { wcMsg(apiMsg(e)); }
  finally { btn.disabled = false; }
}
function wcDone() { $("welcomeModal").classList.remove("open"); }
function copyText(v, inp) {
  const ok = () => showToast("Data token copied.");
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(v).then(ok).catch(() => fallbackCopy(inp, ok)); }
  else fallbackCopy(inp, ok);
}
function fallbackCopy(inp, ok) { try { inp.focus(); inp.select(); document.execCommand("copy") ? ok() : showToast("Select the token and copy it."); } catch (e) { showToast("Select the token and copy it."); } }
const copyToken = () => copyText($("ac_token").value, $("ac_token"));
const PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 5 5 9-11"/></svg>';
const COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
let EDIT = false;
const authMsg = (t, good) => { const m = $("authMsg"); m.textContent = t || ""; m.className = "auth-msg" + (t ? " show" : "") + (good ? " good" : ""); };
function setEditBtn(editing) {
  const b = $("ac_btn_username");
  b.innerHTML = editing ? CHECK : PEN;
  b.setAttribute("aria-label", editing ? "Confirm" : "Edit username");
  b.onclick = () => (editing ? commitEdit() : startEdit());
}
function resetField() { const i = $("ac_username"); i.readOnly = true; i.classList.remove("editing"); i.value = (ME && ME.username) || currentName(); setEditBtn(false); }
function renderAccount() {
  if (!$("ac_username")) return;
  if (!EDIT) resetField();
  $("ac_token").value = (ME && ME.token) || "";
  $("ac_btn_copy").innerHTML = COPY;
  $("ac_btn_switch").innerHTML = CHECK;
}
function startEdit() { EDIT = true; authMsg(""); const i = $("ac_username"); i.readOnly = false; i.classList.add("editing"); setEditBtn(true); i.focus(); }
function cancelEdit() { if (!EDIT) return; EDIT = false; resetField(); }
async function commitEdit() {
  if (!EDIT) return;
  const v = $("ac_username").value.trim(), bad = checkUsername(v);
  if (bad) { authMsg(bad); return; }
  if (ME && v === ME.username) { cancelEdit(); return; }
  try {
    const st = await api("set_username", { t: ME.token, u: v });
    EDIT = false; applyState(st); authMsg(""); showToast("Username updated.");
  } catch (e) { authMsg(apiMsg(e)); }
}
function toggleSwitch() { const b = $("tokenSwitch"); b.hidden = !b.hidden; if (!b.hidden) $("tokenIn").focus(); authMsg(""); }
async function commitSwitch() {
  const v = $("tokenIn").value.replace(/\s/g, "");
  if (!v) { authMsg("Paste a data token first."); return; }
  if (ME && v === ME.token) { $("tokenSwitch").hidden = true; $("tokenIn").value = ""; return; }
  try { await loadToken(v); $("tokenIn").value = ""; $("tokenSwitch").hidden = true; authMsg(""); showToast("Switched to " + ME.username + "."); }
  catch (e) { authMsg(apiMsg(e)); }
}
async function initAccount() {
  if (!window.supabase) { showToast("Couldn't load the online library. Reload the page."); return; }
  try { subscribeBoards(); fetchProfiles(); } catch (e) {}
  const t = lsGet(TOKEN_KEY, "");
  if (!t) return;
  ME = { token: t, username: lsGet("sg_name", "") };
  try {
    const st = await api("get_player", { t });
    if (st && st.id) applyState(st);
    else { ME = null; lsSet(TOKEN_KEY, ""); lsSet("sg_name", ""); refreshIdentity(); maybeWelcome(); showToast("That account wasn't found. Create a new one or enter another data token."); }
  } catch (e) {   }
}
const updateUserCard = () => { $("userName").innerHTML = nameHTML(currentName()); };
function setRange(id, textId) {
  const r = $(id);
  r.style.setProperty("--v", r.value * 100 + "%");
  $(textId).textContent = Math.round(r.value * 100) + "%";
}
function openSettings() {
  closeMenu();
  $("tokenSwitch").hidden = true; authMsg("");
  $("musicVol").value = vol(); $("sfxVol").value = sfxVol();
  $("autoDiff").checked = lsGet("sg_autodiff", "0") === "1";
  $("autoNext").checked = lsGet("sg_autonext", "1") === "1";
  setRange("musicVol", "musicVolText"); setRange("sfxVol", "sfxVolText");
  EDIT = false; renderAccount();
  $("settingsModal").classList.add("open");
}
function closeSettings() { cancelEdit(); $("tokenSwitch").hidden = true; $("settingsModal").classList.remove("open"); }
async function saveSettings() {
  if (EDIT) { await commitEdit(); if (EDIT) return; }
  lsSet("sg_music", $("musicVol").value); lsSet("sg_sfx", $("sfxVol").value);
  lsSet("sg_autodiff", $("autoDiff").checked ? "1" : "0");
  lsSet("sg_autonext", $("autoNext").checked ? "1" : "0");
  Object.values(clips).forEach((c) => { c.el.volume = vol(); });
  closeSettings();
}
$("autoDiff").onchange = () => lsSet("sg_autodiff", $("autoDiff").checked ? "1" : "0");
$("autoNext").onchange = () => lsSet("sg_autonext", $("autoNext").checked ? "1" : "0");
$("musicVol").oninput = () => { setRange("musicVol", "musicVolText"); Object.values(clips).forEach((c) => { c.el.volume = Number($("musicVol").value); }); };
$("sfxVol").oninput = () => setRange("sfxVol", "sfxVolText");
$("sfxVol").onchange = () => { lsSet("sg_sfx", $("sfxVol").value); sfx("correct"); };
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if ($("trModal").classList.contains("open")) { closeTrophies(); return; }
  if ($("lbModal").classList.contains("open")) closeLb();
  else if ($("settingsModal").classList.contains("open")) closeSettings();
  closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || (e.key !== " " && e.key !== "Enter")) return;
  const a = document.activeElement, tag = a ? a.tagName : "";
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (a && a.isContentEditable)) return;
  if (document.querySelector(".modal-back.open") || $("lbOverlay").classList.contains("open")) return;
  const p = $("gameView").classList.contains("active") ? "solo" : $("duelView").classList.contains("active") ? "duel" : null;
  if (!p) return;
  if (p === "solo" ? S.locked || !S.track : D.locked || !D.track) return;
  const mode = p === "solo" ? S.mode : D.roundMode;
  if (mode !== "type" && mode !== "click") return;
  e.preventDefault();
  if (tag === "BUTTON") a.blur();
  if (e.key === " ") togglePlay(p);
  else if (mode === "type" && PICKED[p]) guessPress(p);
  else skipPress(p);
});
function matchActive() {
  return $("duelView").classList.contains("active") && D.inMatch && !D.finished;
}
document.body.insertAdjacentHTML("beforeend", `<div class="modal-back" id="leaveModal" role="dialog" aria-modal="true" aria-labelledby="leaveT" onclick="if (event.target === this) closeLeave(false)"><div class="sheet leave"><div class="lv-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19Z"/><path d="M12 10v4.5M12 17.6v.1"/></svg></div><h2 id="leaveT">Leave this match?</h2><p>You will lose your progress for this match.</p><div class="lv-stats" id="leaveStats"></div><div class="lv-actions"><button class="primary" id="leaveStay" onclick="closeLeave(false)">Keep playing</button><button class="lv-go" onclick="closeLeave(true)">Leave match</button></div></div></div>`);
let leaveCb = null;
function leaveStats() {
  const mine = (D.score && D.score[D.myId]) || 0;
  $("leaveStats").innerHTML = `<span><small>ROUND</small><b>${D.round} / ${D.total}</b></span><span><small>POINTS</small><b>${mine.toLocaleString()}</b></span><span><small>PLAYERS</small><b>${D.players.length}</b></span>`;
}
function openLeave(fn) {
  if ($("leaveModal").classList.contains("open")) return;
  leaveCb = fn; leaveStats(); $("leaveModal").classList.add("open");
  setTimeout(() => { try { $("leaveStay").focus(); } catch (e) {} }, 60);
}
function closeLeave(go) {
  $("leaveModal").classList.remove("open");
  const f = leaveCb; leaveCb = null;
  if (go && f) f();
}
let backArmed = false, backIgnore = 0;
function armBack() { if (backArmed) return; backArmed = true; try { history.pushState({ lv: 1 }, ""); } catch (e) {} }
function disarmBack() { if (!backArmed) return; backArmed = false; try { if (history.state && history.state.lv) { backIgnore++; history.back(); } } catch (e) {} }
window.addEventListener("popstate", () => {
  if (backIgnore) { backIgnore--; return; }
  if (matchActive()) {
    try { history.pushState({ lv: 1 }, ""); } catch (e) {}
    openLeave(() => disconnectDuel());
  } else backArmed = false;
});
function guardLeave(fn) { if (matchActive()) openLeave(fn); else fn(); }
const tryHome = () => guardLeave(goHome);
window.addEventListener("beforeunload", (e) => {
  if (matchActive()) { e.preventDefault(); e.returnValue = "You will lose your progress for this match."; return e.returnValue; }
});
document.addEventListener("keydown", (e) => {
  if (!$("leaveModal").classList.contains("open")) return;
  if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeLeave(false); }
  else if (e.key === "Enter") e.stopPropagation();
}, true);
$("soloStack").innerHTML = `<div class="top-row"><button class="back" onclick="leaveGame()" aria-label="Back">${BACK_SVG}</button><button class="score-chip" onclick="openLb(S.mode)" aria-label="Open leaderboard"><span id="soloScore">0</span><span class="rk" id="soloRank"></span></button></div>
  <div id="soloBody" class="game-body"><div class="diff" id="soloDiff"></div>${gameHTML("solo")}</div><div id="soloResult" style="display:none"></div>`;
$("duelStack").innerHTML = `<div class="duel-top"><button class="back" onclick="guardLeave(() => disconnectDuel())" aria-label="Back">${BACK_SVG}</button><span id="duelRound">Round 1 / 10</span><span class="rg-cheat" id="duelCheat" hidden></span><span class="duel-right"><span class="dtimer" id="duelTimer"></span><span class="score" id="duelScore">0</span></span></div>
  <div class="duel-wrap"><div id="duelBody" class="game-body">${gameHTML("duel")}</div><div class="cheat-note" id="duelCheatNote" hidden></div><div id="duelWait" class="wait"><i></i>Waiting for the other person...</div></div>`;
clips.solo = makeClip("solo");
clips.duel = makeClip("duel");
[clips.solo, clips.duel].forEach((c) => { c.icon(false); c.render(); });
renderDiff("duelDiff", duelDiffSel, (l) => { duelDiffSel = l; });
recomputeRanks();
updateUserCard();
updateScoreChip();
initAccount();
document.addEventListener("keydown", (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || (e.key !== "Enter" && e.key !== " ")) return;
  const r = document.getElementById("soloResult"), b = r && r.style.display === "block" && r.querySelector(".res-next");
  if (!b || r.classList.contains("hold") || document.querySelector(".modal-back.open") || Date.now() - (window.__resAt || 0) < 450) return;
  e.preventDefault();
  b.click();
});
(function intro() {
  const el = document.getElementById("intro");
  setTimeout(() => el.classList.add("out"), 2800);
  setTimeout(() => el.remove(), 3300);
  maybeWelcome();
})();
    
