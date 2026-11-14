const READY_WAIT = 20000;
const MAX_ROUND_POINTS = 6000;
let M = null;
let leaveCallback = null;
let leaveBypass = false;

function buildPlan(count, ids) {
  const plan = [];
  let bag = [];
  let last = "";
  while (plan.length < count) {
    if (!bag.length) {
      bag = shuffle(ids);
      if (bag.length > 1 && bag[0] === last) bag.push(bag.shift());
    }
    last = bag.shift();
    plan.push(last);
  }
  return plan;
}

const matchActive = () => !!M && M.active;

async function startMatch() {
  if (M && M.starting) return;
  const ids = enabledGames();
  const go = $("agStart");
  go.disabled = true;
  go.textContent = "Loading games…";
  M = { starting: true, active: false };
  const missing = await whenSchemas(ids, READY_WAIT);
  go.disabled = false;
  go.textContent = "Start match →";
  const playable = ids.filter((id) => !missing.includes(id));
  if (!playable.length) {
    M = null;
    showToast(missing.map(loadProblem).join(" "));
    return;
  }
  if (missing.length)
    showToast(missing.map(loadProblem).join(" ") + " It was left out.");
  const plan = buildPlan(CFG.rounds, playable).map((id) => ({
    game: id,
    settings: resolveRound(id),
  }));
  M = {
    active: true,
    plan,
    i: -1,
    rid: 0,
    score: 0,
    rounds: [],
    seen: new Set(),
    answered: false,
    current: "",
    left: 0,
  };
  document.body.classList.add("ag-playing");
  showView("gameView");
  renderHud();
  nextRound();
}

function nextRound() {
  M.i++;
  M.rid++;
  M.answered = false;
  M.left = 0;
  const entry = M.plan[M.i];
  const fresh = !M.seen.has(entry.game);
  M.seen.add(entry.game);
  if (M.current && M.current !== entry.game)
    sendTo(M.current, { type: "stop" });
  M.current = entry.game;
  showFrame(entry.game);
  renderHud();
  sendTo(entry.game, {
    type: "play",
    rid: M.rid,
    settings: { ...entry.settings, fresh, player: currentName() },
  });
  FR.frames[entry.game].focus();
  const ahead = M.plan[M.i + 1];
  if (ahead) sendTo(ahead.game, { type: "prepare", settings: ahead.settings });
}

function onRoundResult(id, m) {
  if (!matchActive() || id !== M.current || m.rid !== M.rid || M.answered)
    return;
  M.answered = true;
  const points = Math.max(
    0,
    Math.min(MAX_ROUND_POINTS, Math.round(Number(m.points) || 0)),
  );
  const entry = M.plan[M.i];
  M.rounds.push({
    game: id,
    diff: entry.settings.diff,
    ok: !!m.correct,
    pts: points,
    left: M.left,
  });
  M.score += points;
  renderHud(points);
}

function onRoundNext(id, m) {
  if (!matchActive() || id !== M.current || m.rid !== M.rid || !M.answered)
    return;
  if (M.i + 1 < M.plan.length) nextRound();
  else finishMatch();
}

function onRoundFail(id, m) {
  if (!matchActive() || id !== M.current || m.rid !== M.rid || M.answered)
    return;
  showToast(gameTitle(id) + " had a problem, so that round was skipped.");
  M.answered = true;
  M.rounds.push({
    game: id,
    diff: M.plan[M.i].settings.diff,
    ok: false,
    pts: 0,
    left: M.left,
  });
  onRoundNext(id, m);
}

function renderHud(gain) {
  if (!M || !M.plan) return;
  const entry = M.plan[Math.max(0, M.i)];
  $("agRound").textContent = `Round ${Math.max(1, M.i + 1)} / ${M.plan.length}`;
  $("agDots").innerHTML = M.plan
    .map((_, i) => {
      const r = M.rounds[i];
      const cls = r ? (r.ok ? "good" : "bad") : i === M.i ? "now" : "";
      return `<i class="${cls}"></i>`;
    })
    .join("");
  $("agNow").textContent = M.score.toLocaleString();
  $("agNowBox").classList.toggle(
    "beat",
    M.score > 0 && M.score > (stats.high || 0),
  );
  $("agBadge").innerHTML =
    `<span class="tg-ico">${gameIcon(entry.game)}</span><b>${esc(gameTitle(entry.game))}</b><small>${esc(LEVEL_NAMES[entry.settings.diff])}</small>`;
  $("agBadge").dataset.level = entry.settings.diff;
  if (gain) {
    const el = $("agGain");
    el.textContent = "+" + gain.toLocaleString();
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  }
}

function stopAllFrames() {
  Object.keys(FR.frames).forEach((id) => sendTo(id, { type: "stop" }));
  showFrame("");
}

function leaveMatch() {
  if (M) M.active = false;
  stopAllFrames();
  stopConfetti();
  document.body.classList.remove("ag-playing");
}

function finishMatch() {
  const rounds = M.rounds.slice();
  const score = M.score;
  const correct = rounds.filter((r) => r.ok).length;
  let streak = 0;
  let best = 0;
  rounds.forEach((r) => {
    streak = r.ok ? streak + 1 : 0;
    best = Math.max(best, streak);
  });
  const bestRound = Math.max(0, ...rounds.map((r) => r.pts));
  const before = stats.high || 0;
  const saved = srv("ag_match", {
    rounds: rounds.map((r) => ({ g: r.game, d: r.diff, ok: r.ok, pts: r.pts })),
  });
  leaveMatch();
  M = {
    active: false,
    last: { rounds, score, correct, best, bestRound, before },
  };
  showResults(saved);
}

function showResults(saved) {
  const r = M.last;
  const fresh = r.score > r.before && r.score > 0;
  $("agResult").innerHTML =
    `<div class="ag-hero"><div class="eyebrow">MATCH COMPLETE</div><div class="ag-total" id="agTotal">0</div><div class="ag-badges"><span class="streak" id="agSaved">${fresh ? "NEW HIGH SCORE" : "Saving…"}</span><span class="streak">${r.correct} / ${r.rounds.length} correct</span><span class="streak">Streak ${r.best}</span></div></div>
    <div class="ag-list">${r.rounds
      .map(
        (x) =>
          `<div class="ag-li ${x.ok ? "good" : "bad"}"><span class="tg-ico">${gameIcon(x.game)}</span><span><b>${esc(gameTitle(x.game))}</b><small data-level="${x.diff}">${LEVEL_NAMES[x.diff]}</small></span><em>${x.left ? "Left page · " : ""}${x.ok ? "Correct" : "Missed"}</em><strong>+${x.pts.toLocaleString()}</strong></div>`,
      )
      .join("")}</div>
    <div class="ag-actions"><button class="primary" onclick="playAgain()">Play again</button><button class="ghost" onclick="goHome()">Home</button></div>`;
  showView("resultView");
  countUp($("agTotal"), 0, r.score, 900);
  if (r.correct >= Math.ceil(r.rounds.length / 2) || fresh) {
    sfx("correct");
    confetti(fresh);
  } else sfx("lose");
  saved.then((st) => {
    const el = $("agSaved");
    if (!el) return;
    if (!st) el.textContent = "Not saved";
    else if (st.rejected) el.textContent = "Too quick to count";
    else if (st.new_high) el.textContent = "NEW HIGH SCORE";
    else el.textContent = "Saved";
  });
}

function countUp(el, from, to, ms) {
  const start = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - start) / ms);
    el.textContent = Math.round(
      from + (to - from) * (1 - Math.pow(1 - k, 3)),
    ).toLocaleString();
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function playAgain() {
  stopConfetti();
  M = null;
  document.body.classList.remove("ag-playing");
  showView("setupView");
  renderSetup();
}

function openLeave(callback) {
  leaveCallback = callback;
  const r = M && M.rounds ? M.rounds.length : 0;
  $("leaveStats").innerHTML =
    `<div><b>${r}</b><small>ROUNDS PLAYED</small></div><div><b>${(M ? M.score : 0).toLocaleString()}</b><small>POINTS</small></div>`;
  $("leaveModal").classList.add("open");
}

function closeLeave(go) {
  $("leaveModal").classList.remove("open");
  const callback = leaveCallback;
  leaveCallback = null;
  if (go && callback) callback();
}

function guardLeave(callback) {
  if (matchActive() && M.rounds.length) openLeave(callback);
  else callback();
}

function abandonMatch() {
  leaveMatch();
  M = null;
  showView("setupView");
  renderSetup();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && CFG.trackTabs && matchActive() && !M.answered)
    M.left++;
});
