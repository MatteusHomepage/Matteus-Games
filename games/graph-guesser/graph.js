const COLORS = {
  grid: "#dedcd5",
  text: "#77756f",
  actual: "#3157e8",
  prediction: "#e35d3f",
  cutoff: "#171717",
  background: "#f4f3ef"
};

export function createGraphRenderer(canvas, getState) {
  const ctx = canvas.getContext("2d");
  let width = 0, height = 0, dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function geometry(state) {
    const compact = width < 500;
    const margin = { left: compact ? 49 : 64, right: 18, top: 18, bottom: 34 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const years = state.dataset.points.map(p => p.year);
    const minYear = years[0], maxYear = years[years.length - 1];
    const visible = state.dataset.visible.map(p => p.value);
    const minVal = Math.min(...visible), maxVal = Math.max(...visible);
    const range = Math.max(maxVal - minVal, Math.abs(maxVal) * .08, 1);
    const yMin = minVal - range * .38;
    const yMax = maxVal + range * .48;
    return {
      margin, plotW, plotH, minYear, maxYear, yMin, yMax,
      x: year => margin.left + (year - minYear) / (maxYear - minYear || 1) * plotW,
      y: value => margin.top + (yMax - value) / (yMax - yMin || 1) * plotH
    };
  }

  function formatValue(value) {
    const abs = Math.abs(value);
    if (abs >= 1e9) return (value / 1e9).toFixed(1) + "B";
    if (abs >= 1e6) return (value / 1e6).toFixed(1) + "M";
    if (abs >= 1e4) return (value / 1e3).toFixed(0) + "k";
    if (abs >= 100) return value.toFixed(0);
    if (abs >= 10) return value.toFixed(1);
    return value.toFixed(2);
  }

  function line(points, g, color, lineWidth, dash = [], smooth = false) {
    if (!points.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(dash);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const coords = points.map(p => ({ x: g.x(p.year), y: g.y(p.value) }));
    ctx.moveTo(coords[0].x, coords[0].y);
    if (smooth && coords.length > 2) {
      for (let i = 1; i < coords.length - 1; i++) {
        const midX = (coords[i].x + coords[i + 1].x) / 2;
        const midY = (coords[i].y + coords[i + 1].y) / 2;
        ctx.quadraticCurveTo(coords[i].x, coords[i].y, midX, midY);
      }
      const last = coords[coords.length - 1];
      ctx.lineTo(last.x, last.y);
    } else {
      coords.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    }
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const state = getState();
    if (!state?.dataset || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const g = geometry(state);
    const { margin, plotW, plotH } = g;

    ctx.save();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = COLORS.text;
    ctx.font = "10px Arial, sans-serif";
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = margin.top + plotH * i / yTicks;
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + plotW, y); ctx.stroke();
      const value = g.yMax - (g.yMax - g.yMin) * i / yTicks;
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(formatValue(value), margin.left - 9, y);
    }
    const yearTicks = 5;
    for (let i = 0; i <= yearTicks; i++) {
      const year = Math.round(g.minYear + (g.maxYear - g.minYear) * i / yearTicks);
      const x = g.x(year);
      ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(String(year), x, margin.top + plotH + 11);
    }
    ctx.restore();

    const cutoffX = g.x(state.dataset.cutoffYear);
    ctx.save();
    ctx.fillStyle = "rgba(49,87,232,.035)";
    ctx.fillRect(cutoffX, margin.top, margin.left + plotW - cutoffX, plotH);
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "rgba(23,23,23,.55)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cutoffX, margin.top); ctx.lineTo(cutoffX, margin.top + plotH); ctx.stroke();
    ctx.restore();

    line(state.dataset.visible, g, COLORS.actual, 2.8);
    const last = state.dataset.visible[state.dataset.visible.length - 1];
    ctx.save();
    ctx.fillStyle = COLORS.actual;
    ctx.beginPath(); ctx.arc(g.x(last.year), g.y(last.value), 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    if (state.prediction?.length > 1) {
      line(state.prediction, g, COLORS.prediction, 3, [], true);
      const lastPrediction = state.prediction[state.prediction.length - 1];
      ctx.fillStyle = COLORS.prediction;
      ctx.beginPath(); ctx.arc(g.x(lastPrediction.year), g.y(lastPrediction.value), 3.5, 0, Math.PI * 2); ctx.fill();
    }

    if (state.revealed) {
      line(state.dataset.future, g, COLORS.actual, 3);
    }
    return g;
  }

  function coords(clientX, clientY) {
    const state = getState();
    const rect = canvas.getBoundingClientRect();
    const g = geometry(state);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const year = g.minYear + (x - g.margin.left) / g.plotW * (g.maxYear - g.minYear);
    const value = g.yMax - (y - g.margin.top) / g.plotH * (g.yMax - g.yMin);
    return { year: Math.max(state.dataset.cutoffYear, Math.min(g.maxYear, year)), value, x, y, g };
  }

  function isInsidePlot(point) {
    return point.x >= point.g.margin.left && point.x <= point.g.margin.left + point.g.plotW &&
      point.y >= point.g.margin.top && point.y <= point.g.margin.top + point.g.plotH;
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  requestAnimationFrame(resize);

  return { draw, coords, isInsidePlot, destroy: () => observer.disconnect() };
}

export function drawStaticChart(canvas, dataset, prediction, mode = "prediction") {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = rect.width, h = rect.height;
  if (w < 20 || h < 20) return;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const margin = { left: 55, right: 14, top: 12, bottom: 29 };
  const pw = w - margin.left - margin.right, ph = h - margin.top - margin.bottom;
  const all = dataset.points;
  const minYear = all[0].year, maxYear = all[all.length - 1].year;
  const vals = dataset.visible.map(p => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = Math.max(max - min, Math.abs(max) * .08, 1);
  const yMin = min - range * .38, yMax = max + range * .48;
  const x = year => margin.left + (year - minYear) / (maxYear - minYear || 1) * pw;
  const y = value => margin.top + (yMax - value) / (yMax - yMin || 1) * ph;

  ctx.strokeStyle = "rgba(190,205,192,.10)";
  ctx.fillStyle = "#87948a";
  ctx.font = "9px Arial, sans-serif";
  for (let i = 0; i <= 4; i++) {
    const yy = margin.top + ph * i / 4;
    ctx.beginPath(); ctx.moveTo(margin.left, yy); ctx.lineTo(margin.left + pw, yy); ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) {
    const yr = Math.round(minYear + (maxYear - minYear) * i / 4);
    const xx = x(yr);
    ctx.beginPath(); ctx.moveTo(xx, margin.top); ctx.lineTo(xx, margin.top + ph); ctx.stroke();
    ctx.textAlign = "center"; ctx.fillText(String(yr), xx, h - 8);
  }

  function stroke(points, color, width, dash = [], smooth = false) {
    if (!points.length) return;
    const coords = points.map(p => ({ x: x(p.year), y: y(p.value) }));
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.setLineDash(dash);
    ctx.moveTo(coords[0].x, coords[0].y);
    if (smooth && coords.length > 2) {
      for (let i = 1; i < coords.length - 1; i++) {
        const midX = (coords[i].x + coords[i + 1].x) / 2;
        const midY = (coords[i].y + coords[i + 1].y) / 2;
        ctx.quadraticCurveTo(coords[i].x, coords[i].y, midX, midY);
      }
      ctx.lineTo(coords.at(-1).x, coords.at(-1).y);
    } else coords.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke(); ctx.setLineDash([]);
  }
  stroke(dataset.visible, "#3157e8", 2.5);
  if (mode === "prediction") {
    stroke(prediction, "#e35d3f", 3, [5, 4], true);
  } else {
    stroke(dataset.future, "#3157e8", 2.8);
  }
}
