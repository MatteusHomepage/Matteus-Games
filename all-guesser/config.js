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

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function activeSettings(id, s) {
  if (CFG.mode === "auto") return [s.default];
  const chosen = gameCfg(id).settings[s.key];
  const all = s.options.map((o) => o.v);
  const list = (Array.isArray(chosen) ? chosen : [chosen]).filter((v) =>
    all.includes(v),
  );
  return list.length ? list : [s.default];
}

function resolveRound(id) {
  const schema = FR.schemas[id];
  const st = gameCfg(id);
  const auto = CFG.mode === "auto";
  const settings = { diff: effectiveDiff(id) };
  if (schema.modes) settings.mode = pick(activeModes(id));
  schema.settings.forEach((s) => {
    settings[s.key] = pick(activeSettings(id, s));
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

function renderGlobalDiff() {
  const box = $("setupDiff");
  box.innerHTML = LEVELS.map(
    (l) =>
      `<button type="button" class="pill${l === CFG.diff ? " sel" : ""}" data-level="${l}" onclick="setGlobalDiff('${l}')">${LEVEL_NAMES[l]}</button>`,
  ).join("");
  const info = $("setupInfo");
  info.dataset.level = CFG.diff;
  info.innerHTML = `<div><b>${CFG.rounds}</b><small>ROUNDS</small></div><div><b>${enabledGames().length}</b><small>GAMES</small></div><div><b>${LEVEL_FEEL[CFG.diff]}</b><small>FEEL</small></div>`;
}

function setGlobalDiff(level) {
  CFG.diff = level;
  saveCfg();
  renderSetup();
  if ($("configView").classList.contains("active")) renderConfig();
}

function setRounds(n) {
  CFG.rounds = Math.max(MIN_ROUNDS, Math.min(MAX_ROUNDS, n));
  saveCfg();
  renderSetup();
}

function renderRounds() {
  $("agRounds").innerHTML =
    `<button type="button" class="chip" onclick="setRounds(CFG.rounds - 1)" aria-label="Fewer rounds">−</button><button type="button" class="chip" onclick="setRounds(CFG.rounds + 1)" aria-label="More rounds">+</button>` +
    ROUND_PRESETS.map(
      (n) =>
        `<button type="button" class="chip${n === CFG.rounds ? " sel" : ""}" onclick="setRounds(${n})">${n}</button>`,
    ).join("") +
    (ROUND_PRESETS.includes(CFG.rounds)
      ? ""
      : `<button type="button" class="chip sel">${CFG.rounds}</button>`);
}

function renderSetup() {
  $("agModeSummary").textContent = modeSummary();
  $("agModeSub").textContent = modeDetail();
  renderGlobalDiff();
  renderRounds();
  updateScoreChip();
}

function modeDetail() {
  const ids = enabledGames();
  return ids.map(gameTitle).join(" · ");
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
      showToast("Keep at least one.");
      return;
    }
    now.delete(value);
  } else now.add(value);
  st.modes = schema.modes.options.map((o) => o.v).filter((v) => now.has(v));
  saveCfg();
  renderConfig();
}

function toggleGameSetting(id, key, value) {
  const schema = FR.schemas[id];
  const s = schema.settings.find((x) => x.key === key);
  const st = gameCfg(id);
  const now = new Set(activeSettingsRaw(id, s));
  if (now.has(value)) {
    if (now.size === 1) {
      showToast("Keep at least one.");
      return;
    }
    now.delete(value);
  } else now.add(value);
  st.settings[key] = s.options.map((o) => o.v).filter((v) => now.has(v));
  saveCfg();
  renderConfig();
}

function activeSettingsRaw(id, s) {
  const chosen = gameCfg(id).settings[s.key];
  const all = s.options.map((o) => o.v);
  const list = (Array.isArray(chosen) ? chosen : [chosen]).filter((v) =>
    all.includes(v),
  );
  return list.length ? list : [s.default];
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

function gameTilesHTML() {
  return AG_GAMES.map((g, i) => {
    const on = gameCfg(g.id).on;
    const loaded = ready(g.id);
    return `<button type="button" class="cat-tile${on ? " sel" : ""}" style="--h:${g.h};--i:${i}" aria-pressed="${on}" onclick="toggleGame('${g.id}')"><span class="ct-ic">${g.icon}</span><b>${esc(g.title.replace(" Guesser", ""))}</b><small>${esc(loaded ? g.tag : "Loading…")}</small><i class="ct-check">${CHECK_SVG}</i></button>`;
  }).join("");
}

function optionsHTML(options, isOn, handler) {
  if (options.some((o) => o.ic))
    return `<div class="cat-grid sm">${options
      .map(
        (o, i) =>
          `<button type="button" class="cat-tile${isOn(o.v) ? " sel" : ""}" style="--h:${o.h === undefined ? (i * 47) % 360 : o.h};--i:${i}" aria-pressed="${isOn(o.v)}" onclick="${handler(o.v)}"><span class="ct-ic">${o.ic || ""}</span><b>${esc(o.l)}</b><i class="ct-check">${CHECK_SVG}</i></button>`,
      )
      .join("")}</div>`;
  return `<div class="chips ag-chips">${options
    .map(
      (o) =>
        `<button type="button" class="chip${isOn(o.v) ? " sel" : ""}" aria-pressed="${isOn(o.v)}" onclick="${handler(o.v)}">${esc(o.l)}</button>`,
    )
    .join("")}</div>`;
}

function fieldHTML(label, body) {
  return `<div class="field"><label class="field-label">${esc(label)}</label>${body}</div>`;
}

function heartsLabel(schema) {
  if (!schema.modes || !schema.hearts.modes) return "HEARTS";
  const names = schema.hearts.modes.map(
    (m) => schema.modes.options.find((o) => o.v === m).l.split(" ")[0],
  );
  return `HEARTS · ${names.join(", ").toUpperCase()} MODE`;
}

function panelHTML(g) {
  const schema = FR.schemas[g.id];
  const st = gameCfg(g.id);
  const auto = CFG.mode === "auto";
  const head = `<h3><span class="ag-dot" style="--h:${g.h}"></span>${esc(g.title.toUpperCase())}</h3>`;
  if (!schema)
    return `<div class="setup-sec ag-panel">${head}<p class="helper">Loading this game…</p></div>`;
  let body = "";
  if (schema.diff) {
    const pill = (v, label) =>
      `<button type="button" class="pill${st.diff === v ? " sel" : ""}" data-level="${v}" onclick="setGameDiff('${g.id}','${v}')">${label}</button>`;
    body += fieldHTML(
      "DIFFICULTY",
      `<div class="diff wrap">${pill("auto", "Auto · " + LEVEL_NAMES[CFG.diff])}${LEVELS.map((l) => pill(l, LEVEL_NAMES[l])).join("")}</div>`,
    );
  }
  if (schema.modes) {
    const on = new Set(activeModes(g.id));
    body += fieldHTML(
      schema.modes.label.toUpperCase(),
      optionsHTML(
        schema.modes.options,
        (v) => on.has(v),
        (v) => `toggleGameMode('${g.id}','${v}')`,
      ),
    );
  }
  schema.settings.forEach((s) => {
    const on = new Set(auto ? [s.default] : activeSettingsRaw(g.id, s));
    body += fieldHTML(
      s.label.toUpperCase(),
      optionsHTML(
        s.options,
        (v) => on.has(v),
        (v) => `toggleGameSetting('${g.id}','${s.key}','${v}')`,
      ),
    );
  });
  const hearts = heartsInfo(g.id);
  if (hearts) {
    const value = (!auto && st.hearts) || hearts.def;
    body += fieldHTML(
      heartsLabel(schema),
      `<div class="ag-hearts"><button type="button" class="chip" onclick="stepHearts('${g.id}',-1)" aria-label="Fewer hearts">−</button><b>${value}</b><button type="button" class="chip" onclick="stepHearts('${g.id}',1)" aria-label="More hearts">+</button><span class="helper">${!auto && st.hearts ? `<button type="button" class="link" onclick="resetHearts('${g.id}')">Reset to ${hearts.def}</button>` : `Default for ${LEVEL_NAMES[effectiveDiff(g.id)]}`}</span></div>`,
    );
  }
  return `<div class="setup-sec ag-panel${auto ? " off" : ""}">${head}${body}</div>`;
}

function renderConfig() {
  const auto = CFG.mode === "auto";
  $("agSeg").innerHTML = ["auto", "manual"]
    .map(
      (m) =>
        `<button type="button" class="pill${CFG.mode === m ? " sel" : ""}" data-level="auto" onclick="setCfgMode('${m}')">${m === "auto" ? "Auto" : "Manual"}</button>`,
    )
    .join("");
  $("agSegNote").textContent = auto
    ? "Games and game modes are shuffled. Every game uses its default topic, and hearts follow the difficulty from the meter. Switch to Manual to change any of it."
    : "Full control. Pick difficulty, modes, topics and hearts for every game you've selected. Several topics or modes means they are shuffled.";
  $("agTiles").innerHTML = gameTilesHTML();
  $("agPanels").innerHTML = AG_GAMES.filter((g) => gameCfg(g.id).on)
    .map(panelHTML)
    .join("");
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
