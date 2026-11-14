const $ = (id) => document.getElementById(id);
const mgv = (name, fallback) =>
  window.MG && MG.v ? MG.v(name, fallback) : fallback;
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
  best_round: "Best round",
  best_streak: "Longest streak",
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
  rounds: 0,
  best: 0,
  streak: 0,
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
  srv("ag_reset").then((st) =>
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
    [stats.best, "Best round"],
    [stats.streak, "Longest streak"],
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
    mgv("--cf-0", "#19d77b"),
    mgv("--cf-1", "#0ecb70"),
    mgv("--cf-2", "#55efa0"),
    mgv("--cf-3", "#0b8f52"),
    mgv("--cf-4", "#9aa6a0"),
    mgv("--cf-5", "#d6ded9"),
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
  best_streak: {
    label: "Longest streak",
    val: (p) => Number(p.best_streak),
    fmt: (v) => v.toLocaleString(),
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
const STAT_KEYS = ["matches", "best_round", "best_streak", "duels", "wins"];
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
  }, 60);
}
async function fetchProfiles() {
  try {
    const { data, error } = await sb()
      .from("all_stats")
      .select(
        "id,username,high_score,matches,rounds,best_round,best_streak,duels,wins",
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
        { event: "*", schema: "public", table: "all_stats" },
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
    return "The server isn't set up yet. Run supabase-all-setup.sql in Supabase first.";
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
        if (pendingOps === 0 && !resyncing && name !== "ag_get") {
          resyncing = true;
          srv("ag_get").finally(() => {
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
      rounds: stats.rounds,
      best_round: stats.best,
      best_streak: stats.streak,
      duels: stats.duels,
      wins: stats.wins,
    });
  boardsChanged();
}
const rowToStats = (r) => ({
  high: Number(r.high_score) || 0,
  matches: Number(r.matches) || 0,
  rounds: Number(r.rounds) || 0,
  best: Number(r.best_round) || 0,
  streak: Number(r.best_streak) || 0,
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
    const st = await api("ag_create", { u: name });
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
  const st = await api("ag_get", { t });
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
    const st = await api("ag_set_username", { t: ME.token, u: v });
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
    const st = await api("ag_get", { t });
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
  closeSettings();
}
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
