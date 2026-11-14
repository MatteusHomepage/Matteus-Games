const D = {
  client: null,
  channel: null,
  code: "",
  host: false,
  hostId: "",
  players: [],
  settings: null,
  plan: [],
  seen: new Set(),
  round: 0,
  total: 10,
  rid: 0,
  score: {},
  answers: {},
  away: {},
  answered: true,
  cheat: false,
  resolved: false,
  bestRound: 0,
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

const CROWN_SVG =
  '<svg class="crown" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';

const makeCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
const send = (event, payload) =>
  D.channel?.send({ type: "broadcast", event, payload });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function settingsText() {
  const s = D.settings;
  if (!s) return "";
  const names = s.games.map((id) => gameTitle(id).replace(" Guesser", ""));
  return [
    s.random ? "Random difficulty" : LEVEL_NAMES[s.diff],
    s.games.length === AG_GAMES.length ? "All games" : names.join(", "),
    s.total + (s.total === 1 ? " round" : " rounds"),
  ]
    .concat(s.tabs ? ["Tab changes shown"] : [])
    .join(" · ");
}

function openMulti() {
  renderSetup();
  showView("multiplayerView");
}

async function createDuel() {
  const btn = $("createBtn");
  btn.disabled = true;
  try {
    D.client = sb();
    D.name = currentName();
    D.code = makeCode();
    D.host = true;
    D.hostId = D.myId;
    D.started = false;
    D.players = [{ id: D.myId, name: D.name }];
    D.settings = {
      diff: CFG.diff,
      random: CFG.randomDiff,
      total: CFG.rounds,
      tabs: CFG.trackTabs,
      games: enabledGames(),
    };
    D.total = CFG.rounds;
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
  const inp = $("joinCode");
  const m = $("joinMsg");
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
  D.channel = D.client.channel("all-guesser-" + D.code, {
    config: { broadcast: { self: false }, presence: { key: D.myId } },
  });
  const on = (event, fn) =>
    D.channel.on("broadcast", { event }, ({ payload }) => fn(payload || {}));
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
    if (D.host) return;
    D.settings = p.settings;
    D.plan = p.plan;
    D.seen = new Set();
    beginRound(p);
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

async function startDuel() {
  if (!D.host || D.players.length < 2 || D.started) return;
  D.started = true;
  const btn = $("startBtn");
  btn.disabled = true;
  btn.textContent = "Loading games...";
  const ids = D.settings.games.filter((id) =>
    AG_GAMES.some((g) => g.id === id),
  );
  const missing = await whenSchemas(ids, READY_WAIT);
  const playable = ids.filter((id) => !missing.includes(id));
  if (!playable.length) {
    D.started = false;
    showToast(missing.map(loadProblem).join(" "));
    updateLobby();
    return;
  }
  if (missing.length)
    showToast(missing.map(loadProblem).join(" ") + " It was left out.");
  D.plan = buildPlan(D.settings.total, playable).map((game) => {
    const settings = resolveRound(game);
    if (D.settings.random) settings.diff = pick(LEVELS);
    return { game, settings, seed: Math.floor(Math.random() * 4294967296) };
  });
  D.settings = { ...D.settings, games: playable };
  D.seen = new Set();
  D.score = {};
  D.players.forEach((x) => {
    D.score[x.id] = 0;
  });
  D.round = 0;
  hostNextRound("match-start");
}

async function hostNextRound(event = "new-round") {
  D.round++;
  const entry = D.plan[D.round - 1];
  const schema = FR.schemas[entry.game];
  if (schema && schema.pick && !entry.pick) {
    const round = D.round;
    const pick = await requestPick(entry.game, 1000000 + round, {
      ...entry.settings,
      seed: entry.seed,
    });
    if (!D.channel || D.round !== round) return;
    entry.pick = pick;
  }
  const payload = {
    settings: D.settings,
    plan: D.plan,
    total: D.total,
    round: D.round,
    score: D.score,
    players: D.players,
  };
  send(event, payload);
  beginRound(payload);
}

function duelHud() {
  $("duelRound").textContent = `Round ${D.round} / ${D.total}`;
  $("duelScore").textContent = (D.score[D.myId] || 0).toLocaleString();
}

function beginRound(p) {
  clearTimeout(D.nextTimer);
  clearTimeout(D.podTimer);
  stopConfetti();
  const entry = p.plan && p.plan[p.round - 1];
  if (!entry || !D.settings) return;
  D.plan = p.plan;
  D.inMatch = true;
  D.finished = false;
  D.started = true;
  if (p.players) D.players = p.players;
  D.round = p.round;
  D.total = p.total;
  D.score = p.score;
  if (p.round === 1) D.bestRound = 0;
  D.answers = {};
  D.away = {};
  D.cheat = false;
  D.answered = false;
  D.resolved = false;
  const rid = ++D.rid;
  const fresh = !D.seen.has(entry.game);
  D.seen.add(entry.game);
  $("lbOverlay").classList.remove("open");
  document.body.classList.remove("ag-waiting");
  $("duelWait").classList.remove("show");
  document.body.classList.add("ag-playing");
  showView("duelView");
  renderAway();
  duelHud();
  setBadge(entry);
  playEntry(entry, rid, fresh, entry.seed);
}

function duelResult(id, m) {
  if (id !== CUR.game || m.rid !== CUR.rid || D.answered || !D.inMatch) return;
  D.answered = true;
  const points = Math.max(
    0,
    Math.min(MAX_ROUND_POINTS, Math.round(Number(m.points) || 0)),
  );
  D.bestRound = Math.max(D.bestRound, points);
  document.body.classList.add("ag-waiting");
  $("duelWait").classList.add("show");
  sfx(m.correct ? "correct" : "lose");
  const payload = {
    id: D.myId,
    correct: !!m.correct,
    points,
    cheat: D.cheat,
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
    points: Math.max(0, Math.min(MAX_ROUND_POINTS, Number(p.points) || 0)),
    cheat: !!p.cheat,
  };
  checkResolve();
}

function checkResolve() {
  if (D.resolved || !D.inMatch || !D.host) return;
  if (D.players.every((pl) => D.answers[pl.id])) resolveDuelRound();
}

function resolveDuelRound() {
  if (D.resolved) return;
  D.resolved = true;
  const prev = { ...D.score };
  Object.values(D.answers).forEach((a) => {
    D.score[a.id] = (D.score[a.id] || 0) + a.points;
  });
  const names = {};
  D.players.forEach((pl) => {
    names[pl.id] = pl.name;
  });
  const payload = {
    score: D.score,
    prev,
    answers: D.answers,
    round: D.round,
    total: D.total,
    names,
  };
  if (D.round >= D.total) {
    send("match-end", payload);
    showMatchResult(payload);
    return;
  }
  send("round-result", payload);
  showRoundResult(payload);
}

function showRoundResult(p) {
  document.body.classList.remove("ag-waiting");
  $("duelWait").classList.remove("show");
  renderRoundBoard(p);
  if (D.host) {
    clearTimeout(D.nextTimer);
    D.nextTimer = setTimeout(() => hostNextRound(), 8500);
  }
}

function showMatchResult(p) {
  if (D.finished) return;
  D.finished = true;
  clearTimeout(D.nextTimer);
  document.body.classList.remove("ag-waiting");
  renderMatchBoard(p);
}

function ansLine(a) {
  if (!a) return "";
  const cheat = a.cheat ? ' <i class="mr-cheat">CHEATING</i>' : "";
  return `<em class="ans${a.correct ? "" : " no"}">${a.correct ? "Correct" : "Missed"}</em>${cheat}`;
}

function renderRoundBoard(p) {
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
  const entry = D.plan[p.round - 1];
  const rows = ids
    .map((id) => {
      const me = id === D.myId;
      const a = p.answers[id];
      return `<div class="lb-row ${prevOrder[0] === id ? "first" : ""}" data-id="${esc(id)}" style="--i:${prevOrder.indexOf(id)}">
            <span class="rank">${prevOrder.indexOf(id) + 1}</span>
            <span class="nm"><span class="nm-in">${nameHTML(p.names?.[id] || "Player")}${me ? " <small>(you)</small>" : ""}</span>${ansLine(a)}</span>
            <span class="gain">+${a ? a.points : 0}</span>
            <span class="pts">${(p.prev[id] || 0).toLocaleString()}</span></div>`;
    })
    .join("");
  const ov = $("lbOverlay");
  ov.innerHTML = `<div class="lb-inner">
          <div class="eyebrow">ROUND ${p.round} / ${p.total}</div>
          <h2>Leaderboard</h2>
          <div class="rg-reveal-q">${esc(gameTitle(entry.game))} · ${esc(LEVEL_NAMES[entry.settings.diff])}</div>
          <div class="lb" style="height:${ids.length * 72}px">${rows}</div>
          <div class="lb-foot">${last ? "Final results coming up..." : "Next round starting soon..."}</div></div>`;
  ov.classList.add("open");
  setTimeout(() => {
    ov.querySelectorAll(".lb-row").forEach((row) => {
      const id = row.dataset.id;
      const idx = newOrder.indexOf(id);
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
  stopFrames();
  document.body.classList.remove("ag-playing");
  $("lbOverlay").classList.remove("open");
  const rows = Object.keys(p.score)
    .map((id) => ({
      id,
      me: id === D.myId,
      score: p.score[id] || 0,
      name: p.names?.[id] || "Player",
    }))
    .sort((a, b) => b.score - a.score);
  let place = 0;
  let prevScore = null;
  rows.forEach((r, i) => {
    if (r.score !== prevScore) place = i + 1;
    r.place = place;
    prevScore = r.score;
  });
  const tie = rows.filter((r) => r.place === 1).length > 1;
  const won = !tie && !!rows[0]?.me;
  localStats((x) => {
    x.duels++;
    if (won) x.wins++;
    x.best = Math.max(x.best, D.bestRound);
  });
  srv("ag_duel", { won, best: D.bestRound });
  const heights = { 1: 200, 2: 150, 3: 110 };
  const col = (r) => `<div class="pd-col ${r.place === 1 ? "first" : ""}">
          <div class="pd-av">${r.place === 1 && !tie ? CROWN_SVG : ""}${esc((r.name || "?").trim().charAt(0).toUpperCase())}</div>
          <div class="pd-name">${nameHTML(r.name)}${r.me ? " <small>(you)</small>" : ""}</div>
          <div class="pd-score">${r.score.toLocaleString()}</div>
          <div class="pd-block" data-h="${heights[r.place] || 110}">${r.place}</div></div>`;
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
  showView("duelResultView");
  buildUp(3200);
  clearTimeout(D.podTimer);
  D.podTimer = setTimeout(() => {
    if (!$("duelResultView").classList.contains("active")) return;
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

function awayWho(id) {
  return id === D.myId
    ? "You"
    : (D.players.find((x) => x.id === id) || {}).name || "A player";
}

function renderAway() {
  const pill = $("duelCheat");
  const ids = Object.keys(D.away || {});
  if (!ids.length) {
    pill.hidden = true;
    return;
  }
  pill.hidden = false;
  pill.textContent = ids.map((id) => awayWho(id) + " changed tabs").join(" · ");
}

function markAway() {
  if (!D.inMatch || D.answered || !D.settings || !D.settings.tabs) return;
  if (D.cheat) return;
  D.cheat = true;
  D.away[D.myId] = true;
  send("away", { id: D.myId, round: D.round });
  renderAway();
}

function onAway(p) {
  if (
    !D.inMatch ||
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
    if (!document.hasFocus() && !document.hidden) markAway();
  }, 1500);
});

async function disconnectDuel(view = "multiplayerView") {
  clearTimeout(D.helloTimer);
  clearTimeout(D.nextTimer);
  clearTimeout(D.podTimer);
  D.rid++;
  stopConfetti();
  stopFrames();
  document.body.classList.remove("ag-playing", "ag-waiting");
  $("lbOverlay").classList.remove("open");
  const ch = D.channel;
  const cl = D.client;
  D.channel = null;
  D.players = [];
  D.hostId = "";
  D.settings = null;
  D.plan = [];
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
