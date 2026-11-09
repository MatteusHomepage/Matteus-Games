import { loadRandomDataset } from "./datasets.js";
import { createGraphRenderer, drawStaticChart } from "./graph.js";
import { scorePrediction } from "./scoring.js";

const $ = id => document.getElementById(id);
const els = {
  title: $("chartTitle"), description: $("chartDescription"), category: $("categoryPill"),
  datasetName: $("datasetName"), axisNote: $("axisNote"), mainChart: $("mainChart"),
  loading: $("loadingOverlay"), complete: $("completeButton"), undo: $("undoButton"),
  clear: $("clearButton"), skip: $("skipButton"), drawStatus: $("drawStatus"),
  hint: $("chartHint"), results: $("resultsSection"), score: $("totalScore"),
  metrics: $("scoreMetrics"),
  predictionChart: $("predictionChart"), realChart: $("realChart"),
  next: $("nextButton"), source: $("sourceButton"), round: $("roundNumber"),
  toast: $("toast"), about: $("aboutModal"), errorRow: $("errorRow"), errorText: $("errorText"), retry: $("retryButton")
};

const state = {
  dataset: null,
  prediction: [],
  strokes: [],
  activeStroke: null,
  revealed: false,
  round: 1,
  previousSlug: null,
  drawing: true,
  renderer: null,
  result: null
};

state.renderer = createGraphRenderer(els.mainChart, () => state);

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function setLoading(loading) {
  els.loading.classList.toggle("hidden", !loading);
  if (loading) els.errorRow.classList.add("hidden");
  els.complete.disabled = loading || !state.prediction.length || state.revealed;
  els.skip.disabled = loading;
}

function updateControls() {
  const hasDrawing = state.prediction.length > 1;
  els.undo.disabled = !state.strokes.length || state.revealed;
  els.clear.disabled = !hasDrawing || state.revealed;
  els.complete.disabled = !hasDrawing || state.revealed;
  els.drawStatus.textContent = hasDrawing ? "Prediction ready — lock it in" : "Draw a line across the missing years";
  els.hint.textContent = hasDrawing ? "You can still adjust your prediction" : "Draw from the dotted line to the right";
  state.renderer.draw();
}

function setText(dataset) {
  els.title.textContent = `${dataset.name} — ${dataset.entity}`;
  els.description.textContent = `${dataset.description} ${dataset.firstYear}–${dataset.lastYear}. What happens after ${dataset.cutoffYear}?`;
  els.category.textContent = "REAL DATA";
  els.datasetName.textContent = dataset.name;
  els.axisNote.textContent = `${dataset.unit} · ${dataset.source}`;
}

function makePredictionFromStrokes() {
  if (!state.dataset) return [];
  const all = state.strokes.flat();
  if (all.length < 2) return [];
  all.sort((a, b) => a.year - b.year);
  const deduped = [];
  for (const p of all) {
    const previous = deduped[deduped.length - 1];
    if (!previous || p.year - previous.year > .02) deduped.push(p);
    else deduped[deduped.length - 1] = p;
  }
  const start = state.dataset.visible[state.dataset.visible.length - 1];
  const endYear = state.dataset.lastYear;
  const points = [{ year: start.year, value: start.value }, ...deduped.filter(p => p.year > start.year)];
  if (points.length < 2) return [];
  if (points[points.length - 1].year < endYear) {
    const last = points[points.length - 1];
    points.push({ year: endYear, value: last.value });
  }
  return points;
}

function loadDrawing() {
  state.prediction = makePredictionFromStrokes();
  updateControls();
}

function pointerDown(event) {
  if (!state.dataset || state.revealed || !state.drawing) return;
  const point = state.renderer.coords(event.clientX, event.clientY);
  if (!state.renderer.isInsidePlot(point) || point.year <= state.dataset.cutoffYear + 0.15) return;
  event.preventDefault();
  els.mainChart.setPointerCapture(event.pointerId);
  state.activeStroke = [point];
  state.strokes.push(state.activeStroke);
  loadDrawing();
}

function pointerMove(event) {
  if (!state.activeStroke) return;
  const point = state.renderer.coords(event.clientX, event.clientY);
  if (!state.renderer.isInsidePlot(point)) return;
  const last = state.activeStroke[state.activeStroke.length - 1];
  if (Math.abs(point.year - last.year) < .18) return;
  state.activeStroke.push({ year: point.year, value: point.value });
  loadDrawing();
}

function pointerUp() {
  if (!state.activeStroke) return;
  state.activeStroke = null;
  loadDrawing();
}

els.mainChart.addEventListener("pointerdown", pointerDown);
els.mainChart.addEventListener("pointermove", pointerMove);
els.mainChart.addEventListener("pointerup", pointerUp);
els.mainChart.addEventListener("pointercancel", pointerUp);
els.mainChart.addEventListener("lostpointercapture", pointerUp);

els.undo.addEventListener("click", () => {
  state.strokes.pop();
  loadDrawing();
});
els.clear.addEventListener("click", () => {
  state.strokes = [];
  state.prediction = [];
  updateControls();
});
els.complete.addEventListener("click", completeRound);
els.retry.addEventListener("click", () => nextRound(false));
els.skip.addEventListener("click", () => nextRound(true));
els.next.addEventListener("click", () => nextRound(false));
els.source.addEventListener("click", () => {
  if (state.dataset) window.open(state.dataset.url, "_blank", "noopener,noreferrer");
});

function renderMetrics(metrics) {
  els.metrics.innerHTML = metrics.map(metric => `
    <div class="metric">
      <div class="metric-top"><span>${metric.name}</span><strong>${Math.round(metric.value)}%</strong></div>
      <div class="metric-track"><div class="metric-fill" style="width:${Math.max(0, Math.min(100, metric.value))}%"></div></div>
      <div class="metric-weight">${metric.weight} OF TOTAL SCORE</div>
    </div>
  `).join("");
}

function completeRound() {
  if (state.revealed || state.prediction.length < 2) return;
  state.revealed = true;
  state.result = scorePrediction(state.dataset, state.prediction);
  const result = state.result;
  els.score.textContent = result.total.toLocaleString("en-US");
  renderMetrics(result.metrics);
  drawStaticChart(els.predictionChart, state.dataset, state.prediction, "prediction");
  drawStaticChart(els.realChart, state.dataset, state.prediction, "real");
  els.results.classList.remove("hidden");
  els.results.scrollIntoView({ behavior: "smooth", block: "start" });
  els.complete.disabled = true;
  els.undo.disabled = true;
  els.clear.disabled = true;
  els.drawStatus.textContent = "Prediction submitted";
  els.hint.textContent = "The real data has been revealed";
  state.renderer.draw();
}

async function nextRound(skipped = false) {
  state.previousSlug = state.dataset?.slug || state.previousSlug;
  state.round += 1;
  els.round.textContent = String(state.round).padStart(2, "0");
  els.results.classList.add("hidden");
  state.dataset = null;
  state.prediction = [];
  state.strokes = [];
  state.activeStroke = null;
  state.revealed = false;
  state.result = null;
  setLoading(true);
  els.title.textContent = "Finding your next graph…";
  els.description.textContent = "Fetching a fresh real-world dataset.";
  els.category.textContent = "LOADING DATA";
  els.datasetName.textContent = "—";
  els.drawStatus.textContent = "Loading a new challenge";
  window.scrollTo({ top: 0, behavior: "smooth" });
  try {
    state.dataset = await loadRandomDataset(state.previousSlug);
    setText(state.dataset);
    state.renderer.draw();
    if (skipped) toast("Graph skipped. Here's a new one.");
  } catch (error) {
    console.error(error);
    els.title.textContent = "Couldn't load a graph";
    els.category.textContent = "NO DATA";
    els.description.textContent = "The data source did not respond. Try again in a moment.";
    els.errorText.textContent = error.message || "Could not load a graph.";
    els.errorRow.classList.remove("hidden");
    toast("Could not load a graph.");
  } finally {
    setLoading(false);
    updateControls();
  }
}

async function start() {
  setLoading(true);
  try {
    state.dataset = await loadRandomDataset();
    setText(state.dataset);
  } catch (error) {
    console.error(error);
    els.title.textContent = "Couldn't load a graph";
    els.description.textContent = "The data source did not respond. Try again in a moment.";
    els.category.textContent = "NO DATA";
    els.errorText.textContent = error.message || "Could not load a graph.";
    els.errorRow.classList.remove("hidden");
    toast("Could not load a graph.");
  } finally {
    setLoading(false);
    updateControls();
  }
}

$("aboutButton").addEventListener("click", () => els.about.classList.remove("hidden"));
$("closeAbout").addEventListener("click", () => els.about.classList.add("hidden"));
$("gotItButton").addEventListener("click", () => els.about.classList.add("hidden"));
els.about.addEventListener("click", event => {
  if (event.target === els.about) els.about.classList.add("hidden");
});

start();
