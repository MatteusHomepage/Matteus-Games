const CFG_KEY = "ag_cfg";
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 30;

const defaultCfg = () => ({
  mode: "auto",
  rounds: 10,
  diff: "medium",
  randomDiff: false,
  trackTabs: false,
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

function followsMeter(id) {
  return CFG.mode === "auto" || gameCfg(id).diff === "auto";
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

function activeSettingsRaw(id, s) {
  const chosen = gameCfg(id).settings[s.key];
  const all = s.options.map((o) => o.v);
  const list = (Array.isArray(chosen) ? chosen : [chosen]).filter((v) =>
    all.includes(v),
  );
  return list.length ? list : [s.default];
}

function activeSettings(id, s) {
  return CFG.mode === "auto" ? [s.default] : activeSettingsRaw(id, s);
}

function heartsInfo(id) {
  const schema = FR.schemas[id];
  if (!schema || !schema.hearts) return null;
  const h = schema.hearts;
  if (h.modes && !activeModes(id).some((m) => h.modes.includes(m))) return null;
  return { def: h.byDiff[effectiveDiff(id)], max: h.max || 99 };
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function resolveRound(id) {
  const schema = FR.schemas[id];
  const st = gameCfg(id);
  const auto = CFG.mode === "auto";
  const diff =
    CFG.randomDiff && followsMeter(id) ? pick(LEVELS) : effectiveDiff(id);
  const settings = { diff };
  if (schema.modes) settings.mode = pick(activeModes(id));
  schema.settings.forEach((s) => {
    settings[s.key] = pick(activeSettings(id, s));
  });
  const h = schema.hearts;
  const applies = h && (!h.modes || h.modes.includes(settings.mode));
  if (!auto && applies && st.hearts) settings.hearts = st.hearts;
  return settings;
}

function modeSummary() {
  const ids = enabledGames();
  const names = ids.map((id) => gameTitle(id).replace(" Guesser", ""));
  const list = ids.length === AG_GAMES.length ? "All games" : names.join(", ");
  return `${list} · ${CFG.mode === "auto" ? "Auto" : "Manual"}`;
}

const ARROW_SVG =
  '<svg class="ag-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>';

function formHTML(p, tabsNote, action) {
  return `<div class="field">
      <label class="field-label">DIFFICULTY</label>
      <div class="diff wrap" id="${p}Diff" style="margin: 0"></div>
    </div>
    <div class="switch-row">
      <span>Random difficulty<small>Every round picks its own difficulty.</small></span>
      <label class="switch"><input type="checkbox" id="${p}Random" onchange="setRandomDiff(this.checked)" /><i></i></label>
    </div>
    <div class="field">
      <label class="field-label">GAME MODES</label>
      <div class="ag-modes">
        <div class="ag-sum" id="${p}Sum"></div>
        <button type="button" class="primary ag-go" onclick="openConfig('${p}')">Configure${ARROW_SVG}</button>
      </div>
    </div>
    <div class="field">
      <label class="field-label" for="${p}Rounds">ROUNDS</label>
      <input class="round-count" id="${p}Rounds" type="number" min="1" max="30" step="1" value="10" oninput="clampNum(this)" onchange="clampNum(this, true); setRounds(this.value)" />
    </div>
    <div class="switch-row">
      <span>Track tab changes<small>${tabsNote}</small></span>
      <label class="switch"><input type="checkbox" id="${p}Tabs" onchange="setTrackTabs(this.checked)" /><i></i></label>
    </div>
    ${action}`;
}

function mountForms() {
  $("soloForm").innerHTML = formHTML(
    "solo",
    "If you leave the page during a round, it is marked.",
    '<button class="primary full" id="agStart" onclick="startMatch()">Start match →</button>',
  );
  $("duelForm").innerHTML = formHTML(
    "duel",
    "If a player leaves the page during a round, everyone sees it and their round is marked.",
    '<button class="primary full" id="createBtn" onclick="createDuel()">Create duel →</button>',
  );
}

function renderSetup() {
  ["solo", "duel"].forEach((p) => {
    if (!$(p + "Sum")) return;
    $(p + "Sum").textContent = modeSummary();
    $(p + "Rounds").value = CFG.rounds;
    $(p + "Random").checked = CFG.randomDiff;
    $(p + "Tabs").checked = CFG.trackTabs;
    $(p + "Diff").innerHTML = LEVELS.map(
      (l) =>
        `<button type="button" class="pill${l === CFG.diff ? " sel" : ""}" data-level="${l}" onclick="setGlobalDiff('${l}')">${LEVEL_NAMES[l]}</button>`,
    ).join("");
  });
  updateScoreChip();
}

function setGlobalDiff(level) {
  CFG.diff = level;
  saveCfg();
  renderSetup();
}

function setRounds(value) {
  const n = Math.floor(Number(value)) || CFG.rounds;
  CFG.rounds = Math.max(MIN_ROUNDS, Math.min(MAX_ROUNDS, n));
  saveCfg();
  renderSetup();
}

function setRandomDiff(on) {
  CFG.randomDiff = !!on;
  saveCfg();
}

function setTrackTabs(on) {
  CFG.trackTabs = !!on;
  saveCfg();
}

function clampNum(el, fin) {
  const min = Number(el.min);
  const max = Number(el.max);
  if (el.value === "") {
    if (fin) el.value = el.defaultValue;
    return;
  }
  const v = Math.floor(Number(el.value));
  if (!isFinite(v)) {
    el.value = el.defaultValue;
    return;
  }
  if (v > max) el.value = max;
  else if (v < min && fin) el.value = min;
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
  const st = gameCfg(id);
  st.diff = level;
  st.hearts = null;
  saveCfg();
  renderConfig();
}

function toggleIn(list, all, value) {
  const now = new Set(list);
  if (now.has(value)) {
    if (now.size === 1) {
      showToast("Keep at least one.");
      return null;
    }
    now.delete(value);
  } else now.add(value);
  return all.filter((v) => now.has(v));
}

function toggleGameMode(id, value) {
  const schema = FR.schemas[id];
  const all = schema.modes.options.map((o) => o.v);
  const next = toggleIn(activeModes(id), all, value);
  if (!next) return;
  gameCfg(id).modes = next;
  saveCfg();
  renderConfig();
}

function toggleGameSetting(id, key, value) {
  const s = FR.schemas[id].settings.find((x) => x.key === key);
  const all = s.options.map((o) => o.v);
  const next = toggleIn(activeSettingsRaw(id, s), all, value);
  if (!next) return;
  gameCfg(id).settings[key] = next;
  saveCfg();
  renderConfig();
}

function setHearts(id, value) {
  const info = heartsInfo(id);
  const n = Math.max(1, Math.min(info.max, Math.floor(Number(value)) || 0));
  gameCfg(id).hearts = n && n !== info.def ? n : null;
  saveCfg();
  renderConfig();
}

function gameTilesHTML() {
  return AG_GAMES.map((g, i) => {
    const on = gameCfg(g.id).on;
    return `<button type="button" class="cat-tile${on ? " sel" : ""}" style="--h:${g.h};--i:${i}" aria-pressed="${on}" onclick="toggleGame('${g.id}')"><span class="ct-ic">${g.icon}</span><b>${esc(g.title)}</b><small>${esc(g.tag)}</small><i class="ct-check">${CHECK_SVG}</i></button>`;
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

const fieldHTML = (label, body) =>
  `<div class="field"><label class="field-label">${esc(label)}</label>${body}</div>`;

function panelHTML(g) {
  const schema = FR.schemas[g.id];
  const st = gameCfg(g.id);
  if (!schema)
    return `<div class="menu ag-panel"><h2>${esc(g.title)}</h2><p>Loading…</p></div>`;
  let body = "";
  if (schema.diff) {
    const pill = (v, label) =>
      `<button type="button" class="pill${st.diff === v ? " sel" : ""}" data-level="${v}" onclick="setGameDiff('${g.id}','${v}')">${label}</button>`;
    body += fieldHTML(
      "DIFFICULTY",
      `<div class="diff wrap" style="margin:0">${pill("auto", "Auto · " + LEVEL_NAMES[CFG.diff])}${LEVELS.map((l) => pill(l, LEVEL_NAMES[l])).join("")}</div>`,
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
    const on = new Set(activeSettingsRaw(g.id, s));
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
  if (hearts)
    body += fieldHTML(
      "HEARTS",
      `<input class="round-count" type="number" min="1" max="${hearts.max}" step="1" value="${st.hearts || hearts.def}" oninput="clampNum(this)" onchange="clampNum(this, true); setHearts('${g.id}', this.value)" />`,
    );
  return `<div class="menu ag-panel"><h2>${esc(g.title)}</h2>${body}</div>`;
}

function renderConfig() {
  const auto = CFG.mode === "auto";
  $("agSeg").innerHTML = ["auto", "manual"]
    .map(
      (m) =>
        `<button type="button" class="chip${CFG.mode === m ? " sel" : ""}" onclick="setCfgMode('${m}')">${m === "auto" ? "Auto" : "Manual"}</button>`,
    )
    .join("");
  $("agTiles").innerHTML = gameTilesHTML();
  setTimeout(updateMore, 60);
  $("agPanels").innerHTML = auto
    ? ""
    : AG_GAMES.filter((g) => gameCfg(g.id).on)
        .map(panelHTML)
        .join("");
}

let configBack = "setupView";

function openConfig(from) {
  configBack = from === "duel" ? "multiplayerView" : "setupView";
  renderConfig();
  showView("configView");
}

function closeConfig() {
  renderSetup();
  showView(configBack);
}

function updateMore() {
  const el = $("agMore");
  if (!el) return;
  const room =
    document.documentElement.scrollHeight - window.scrollY - innerHeight;
  el.classList.toggle(
    "show",
    $("configView").classList.contains("active") && room > 140,
  );
}

function scrollMore() {
  window.scrollBy({ top: innerHeight * 0.7, behavior: "smooth" });
}

window.addEventListener("scroll", updateMore, { passive: true });
window.addEventListener("resize", updateMore);

FR.listeners.push((kind) => {
  if (kind !== "schema") return;
  if ($("configView").classList.contains("active")) renderConfig();
  if ($("setupView").classList.contains("active")) renderSetup();
});
