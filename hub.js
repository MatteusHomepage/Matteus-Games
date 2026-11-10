const grid = document.querySelector("#gamesGrid");
const count = document.querySelector("#gameCount");

function graphArtwork() {
  return `<div class="card-art graph-art"><div class="art-label">DATA / PATTERNS</div><div class="mini-grid"></div><svg viewBox="0 0 440 210" aria-hidden="true"><path d="M8 165 C50 155 55 96 104 110 S164 190 204 125 S264 35 302 72 S365 140 430 18" fill="none" stroke="#b9f36b" stroke-width="4" stroke-linecap="round"/><circle cx="430" cy="18" r="5" fill="#b9f36b"/></svg><span class="art-number">01</span></div>`;
}
function genericArtwork(game) {
  return `<div class="card-art generic-art"><span class="generic-symbol">${game.symbol || "✳"}</span><span class="art-number">${game.number || "—"}</span></div>`;
}
function renderGame(game) {
  const article = document.createElement("article");
  article.className = `game-card ${game.featured ? "featured" : ""}`;
  const art = game.art === "graph" ? graphArtwork() : genericArtwork(game);
  article.innerHTML = `${art}<div class="card-content"><div class="card-meta"><span>${game.category || "GAME"}</span><span>${game.number || "—"}</span></div><h3>${escapeHTML(game.title)}</h3><p>${escapeHTML(game.description)}</p><a class="play-link" href="${safeHref(game.href)}"><span>${game.status || "PLAY"}</span><span class="play-arrow">↗</span></a></div>`;
  return article;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function safeHref(value) {
  const href = String(value || "#");
  return /^(https?:\/\/|\.\.?\/|\/)/.test(href) ? href.replace(/["<>]/g, "") : "#";
}
async function loadGames() {
  try {
    const response = await fetch("games.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load games list");
    const games = await response.json();
    grid.replaceChildren();
    games.forEach(game => grid.append(renderGame(game)));
    count.textContent = `${String(games.length).padStart(2, "0")} ${games.length === 1 ? "GAME" : "GAMES"}`;
    if (!games.length) grid.innerHTML = `<p class="empty-state">The collection is getting ready. Check back soon.</p>`;
  } catch (error) {
    grid.innerHTML = `<p class="empty-state">Games couldn't be loaded. Refresh the page to try again.</p>`;
    console.error(error);
  }
}
loadGames();
