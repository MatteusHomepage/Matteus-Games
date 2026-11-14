const CFG_KEY = "ag_cfg";
const LEVEL_FEEL = {
  easy: "Relaxed",
  medium: "Balanced",
  hard: "Tough",
  expert: "Brutal",
  impossible: "Chaos",
};
const MIN_ROUNDS = 3;
const MAX_ROUNDS = 30;
const ROUND_PRESETS = [5, 10, 15, 20];

const defaultCfg = () => ({
  mode: "auto",
  rounds: 10,
  diff: "medium",
  games: {},
});

function loadCfg() {
  let saved = {};
  try {
    saved = JSON.parse(lsGet(CFG_KEY, "{}")) || {};
  } catch (e) {
    saved = {};
  }
  const cfg = { ...defaultCfg(), ...saved };
  if (cfg.mode !== "manual") cfg.mode = "auto";
  if (!LEVELS.includes(cfg.diff)) cfg.diff = "medium";
  cfg.rounds = Math.max(
    MIN_ROUNDS,
    Math.min(MAX_ROUNDS, Math.floor(Number(cfg.rounds)) || 10),
  );
  if (!cfg.games || typeof cfg.games !== "object") cfg.games = {};
  return cfg;
}

const CFG = loadCfg();
const saveCfg = () => lsSet(CFG_KEY, JSON.stringify(CFG));

function gameCfg(id) {
  if (!CFG.games[id])
    CFG.games[id] = {
      on: true,
      diff: "auto",
      modes: null,
      settings: {},
      hearts: null,
    };
  return CFG.games[id];
}

const gameTitle = (id) => AG_GAMES.find((g) => g.id === id).title;
const gameIcon = (id) => AG_GAMES.find((g) => g.id === id).icon;
const enabledGames = () =>
  AG_GAMES.filter((g) => gameCfg(g.id).on).map((g) => g.id);

function effectiveDiff(id) {
  const st = gameCfg(id);
  return CFG.mode === "auto" || st.diff === "auto" || !LEVELS.includes(st.diff)
    ? CFG.diff
    : st.diff;
}

function activeModes(id) {
  const schema = FR.schemas[id];
  if (!schema || !schema.modes) return [];
  const all = schema.modes.options.map((o) => o.v);
  if (CFG.mode === "auto") return all;
  const chosen = (gameCfg(id).modes || schema.modes.default).filter((v) =>
    all.includes(v),
  );
  return chosen.length ? chosen : schema.modes.default;
}

function heartsInfo(id) {
  const schema = FR.schemas[id];
  if (!schema || !schema.hearts) return null;
  const h = schema.hearts;
  if (h.modes && !activeModes(id).some((m) => h.modes.includes(m))) return null;
  return { def: h.byDiff[effectiveDiff(id)], max: h.max || 30 };
}

function resolveRound(id) {
  const schema = FR.schemas[id];
  const st = gameCfg(id);
  const auto = CFG.mode === "auto";
  const settings = { diff: effectiveDiff(id) };
  if (schema.modes) {
    const pool = activeModes(id);
    settings.mode = pool[Math.floor(Math.random() * pool.length)];
  }
  schema.settings.forEach((s) => {
    const v = auto ? null : st.settings[s.key];
    settings[s.key] = s.options.some((o) => o.v === v) ? v : s.default;
  });
  const info = heartsInfo(id);
  const h = schema.hearts;
  const applies = info && (!h.modes || h.modes.includes(settings.mode));
  if (!auto && applies && st.hearts) settings.hearts = st.hearts;
  return settings;
}

function modeSummary() {
  const ids = enabledGames();
  if (CFG.mode === "auto")
    return `Auto · ${ids.length} ${ids.length === 1 ? "game" : "games"} shuffled`;
  return `Manual · ${ids
    .map(gameTitle)
    .map((t) => t.replace(" Guesser", ""))
    .join(", ")}`;
}

function renderMeter() {
  const box = $("agMeter");
  box.innerHTML = LEVELS.map(
    (l, i) =>
      `<button type="button" class="ag-lv${l === CFG.diff ? " sel" : ""}" data-level="${l}" style="--h:${34 + i * 15}px" onclick="setGlobalDiff('${l}')" aria-label="${LEVEL_NAMES[l]}" aria-pressed="${l === CFG.diff}"><i></i><span>${LEVEL_NAMES[l]}</span></button>`,
  ).join("");
  $("agMeterInfo").dataset.level = CFG.diff;
  $("agMeterInfo").innerHTML =
    `<b>${LEVEL_NAMES[CFG.diff]}</b><span>${LEVEL_FEEL[CFG.diff]}</span>`;
}

function setGlobalDiff(level) {
  CFG.diff = level;
  saveCfg();
  renderMeter();
  renderSetup();
  if ($("configView").classList.contains("active")) renderConfig();
}

function setRounds(n) {
  CFG.rounds = Math.max(MIN_ROUNDS, Math.min(MAX_ROUNDS, n));
  saveCfg();
  renderRounds();
}

function renderRounds() {
  $("agRounds").innerHTML =
    `<button type="button" class="ag-step" onclick="setRounds(CFG.rounds - 1)" aria-label="Fewer rounds">−</button><b>${CFG.rounds}</b><button type="button" class="ag-step" onclick="setRounds(CFG.rounds + 1)" aria-label="More rounds">+</button>` +
    ROUND_PRESETS.map(
      (n) =>
        `<button type="button" class="ag-chip${n === CFG.rounds ? " sel" : ""}" onclick="setRounds(${n})">${n}</button>`,
    ).join("");
}

function renderSetup() {
  $("agModeSummary").textContent = modeSummary();
  renderRounds();
  updateScoreChip();
}

function setCfgMode(mode) {
  CFG.mode = mode;
  saveCfg();
  renderConfig();
  renderSetup();
}

function toggleGame(id) {
  const st = gameCfg(id);
  if (st.on && enabledGames().length === 1) {
    showToast("Pick at least one game.");
    return;
  }
  st.on = !st.on;
  saveCfg();
  renderConfig();
  renderSetup();
}

function setGameDiff(id, level) {
  gameCfg(id).diff = level;
  saveCfg();
  renderConfig();
}

function toggleGameMode(id, value) {
  const st = gameCfg(id);
  const schema = FR.schemas[id];
  const now = new Set(st.modes || schema.modes.default);
  if (now.has(value)) {
    if (now.size === 1) {
      showToast("Keep at least one mode.");
      return;
    }
    now.delete(value);
  } else now.add(value);
  st.modes = schema.modes.options.map((o) => o.v).filter((v) => now.has(v));
  saveCfg();
  renderConfig();
}

function setGameSetting(id, key, value) {
  gameCfg(id).settings[key] = value;
  saveCfg();
  renderConfig();
}

function stepHearts(id, delta) {
  const info = heartsInfo(id);
  const st = gameCfg(id);
  const now = st.hearts || info.def;
  st.hearts = Math.max(1, Math.min(info.max, now + delta));
  if (st.hearts === info.def) st.hearts = null;
  saveCfg();
  renderConfig();
}

function resetHearts(id) {
  gameCfg(id).hearts = null;
  saveCfg();
  renderConfig();
}

function tileHTML(g) {
  const on = gameCfg(g.id).on;
  const loaded = ready(g.id);
  return `<button type="button" class="ag-tile${on ? " on" : ""}${loaded ? "" : " wait"}" onclick="toggleGame('${g.id}')" aria-pressed="${on}"><span class="ag-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10" /></svg></span><span class="tg-ico">${g.icon}</span><b>${esc(g.title)}</b><small>${esc(loaded ? g.tag : "Loading…")}</small></button>`;
}

function chipRow(options, selected, handler) {
  return options
    .map(
      (o) =>
        `<button type="button" class="ag-chip${selected(o.v) ? " sel" : ""}" onclick="${handler(o.v)}">${esc(o.l)}</button>`,
    )
    .join("");
}

function panelHTML(g) {
  const schema = FR.schemas[g.id];
  const st = gameCfg(g.id);
  if (!schema)
    return `<div class="ag-panel"><div class="ag-ph"><span class="tg-ico">${g.icon}</span><b>${esc(g.title)}</b></div><p class="ag-note">Loading this game…</p></div>`;
  let body = "";
  if (schema.diff) {
    const level = (v, l) =>
      `<button type="button" class="pill${st.diff === v ? " sel" : ""}"${v === "auto" ? ' data-level="auto"' : ` data-level="${v}"`} onclick="setGameDiff('${g.id}','${v}')">${l}</button>`;
    body += `<div class="ag-row"><label>Difficulty</label><div class="diff wrap">${level("auto", "Auto · " + LEVEL_NAMES[CFG.diff])}${LEVELS.map((l) => level(l, LEVEL_NAMES[l])).join("")}</div></div>`;
  }
  if (schema.modes) {
    const on = new Set(activeModes(g.id));
    body += `<div class="ag-row"><label>${esc(schema.modes.label)}</label><div class="ag-chips">${chipRow(
      schema.modes.options,
      (v) => on.has(v),
      (v) => `toggleGameMode('${g.id}','${v}')`,
    )}</div></div>`;
  }
  schema.settings.forEach((s) => {
    const current = s.options.some((o) => o.v === st.settings[s.key])
      ? st.settings[s.key]
      : s.default;
    body += `<div class="ag-row"><label>${esc(s.label)}</label><div class="ag-chips">${chipRow(
      s.options,
      (v) => v === current,
      (v) => `setGameSetting('${g.id}','${s.key}','${v}')`,
    )}</div></div>`;
  });
  const hearts = heartsInfo(g.id);
  if (hearts) {
    const value = st.hearts || hearts.def;
    body += `<div class="ag-row"><label>Hearts${schema.modes && schema.hearts.modes ? " (" + schema.hearts.modes.map((m) => schema.modes.options.find((o) => o.v === m).l.split(" ")[0]).join(", ") + " mode)" : ""}</label><div class="ag-hearts"><button type="button" class="ag-step" onclick="stepHearts('${g.id}',-1)" aria-label="Fewer hearts">−</button><b>${value}</b><button type="button" class="ag-step" onclick="stepHearts('${g.id}',1)" aria-label="More hearts">+</button><span class="ag-def">${st.hearts ? `<button type="button" class="link" onclick="resetHearts('${g.id}')">Reset to ${hearts.def}</button>` : `Default for ${LEVEL_NAMES[effectiveDiff(g.id)]}`}</span></div></div>`;
  }
  return `<div class="ag-panel"><div class="ag-ph"><span class="tg-ico">${g.icon}</span><b>${esc(g.title)}</b></div>${body}</div>`;
}

function renderConfig() {
  $("agSeg").innerHTML = ["auto", "manual"]
    .map(
      (m) =>
        `<button type="button" class="${CFG.mode === m ? "sel" : ""}" onclick="setCfgMode('${m}')">${m === "auto" ? "Auto" : "Manual"}</button>`,
    )
    .join("");
  $("agSegNote").textContent =
    CFG.mode === "auto"
      ? "Games and game modes are shuffled. Every game uses its default topic, and hearts follow the difficulty you picked on the meter."
      : "You are in control. Set difficulty, modes, topics and hearts for each game you pick.";
  $("agTiles").innerHTML = AG_GAMES.map(tileHTML).join("");
  $("agPanels").innerHTML =
    CFG.mode === "manual"
      ? AG_GAMES.filter((g) => gameCfg(g.id).on)
          .map(panelHTML)
          .join("")
      : "";
}

function openConfig() {
  renderConfig();
  showView("configView");
}

function closeConfig() {
  renderSetup();
  showView("setupView");
}

FR.listeners.push((kind) => {
  if (kind !== "schema") return;
  if ($("configView").classList.contains("active")) renderConfig();
  if ($("setupView").classList.contains("active")) renderSetup();
});
