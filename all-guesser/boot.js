const VIEWS = [
  "homeView",
  "setupView",
  "multiplayerView",
  "lobbyView",
  "configView",
  "gameView",
  "duelView",
  "resultView",
  "duelResultView",
];

function showView(id) {
  document.body.classList.remove("noscroll");
  VIEWS.forEach((v) => $(v).classList.remove("active"));
  void $(id).offsetWidth;
  $(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(updateMore, 80);
}

function goHome() {
  if (D.channel || D.inMatch) disconnectDuel(null);
  if (soloActive()) leaveMatch();
  stopConfetti();
  M = null;
  document.body.classList.remove("ag-playing");
  showView("homeView");
}

function startSolo() {
  renderSetup();
  showView("setupView");
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

document.querySelector(".hub-btn").addEventListener("click", (event) => {
  if (!matchActive()) return;
  event.preventDefault();
  const href = event.currentTarget.href;
  openLeave(() => {
    leaveBypass = true;
    location.href = href;
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if ($("leaveModal").classList.contains("open")) closeLeave(false);
});

mountForms();
mountFrames();
renderSetup();
recomputeRanks();
updateUserCard();
updateScoreChip();
initAccount();

(function intro() {
  const el = document.getElementById("intro");
  setTimeout(() => el.classList.add("out"), 2800);
  setTimeout(() => el.remove(), 3300);
  maybeWelcome();
})();

window.addEventListener("beforeunload", (event) => {
  if (!matchActive()) return;
  event.preventDefault();
  event.returnValue = "You will lose your progress for this match.";
  return event.returnValue;
});
