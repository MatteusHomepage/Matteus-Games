export const DATASETS = [
  { slug: "population", name: "Population", description: "The number of people living in a place.", unit: "people", minYears: 30 },
  { slug: "life-expectancy", name: "Life expectancy", description: "The average number of years a newborn could expect to live.", unit: "years", minYears: 30 },
  { slug: "co2", name: "CO₂ emissions", description: "Annual carbon dioxide emissions from fossil fuels and industry.", unit: "tonnes", minYears: 30 },
  { slug: "share-of-population-with-internet", name: "Internet use", description: "The share of people using the internet.", unit: "%", minYears: 15 },
  { slug: "renewable-share-energy", name: "Renewable energy", description: "The share of energy supplied by renewable sources.", unit: "%", minYears: 25 },
  { slug: "fertility-rate", name: "Fertility rate", description: "The average number of children born per woman.", unit: "births per woman", minYears: 30 },
  { slug: "child-mortality", name: "Child mortality", description: "The share of children who die before age five.", unit: "%", minYears: 30 },
  { slug: "gdp-per-capita-worldbank", name: "GDP per capita", description: "Economic output per person, adjusted for inflation.", unit: "international-$", minYears: 25 },
  { slug: "urbanization", name: "Urban population", description: "The share of people living in urban areas.", unit: "%", minYears: 30 }
];

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows;
}

async function fetchWithTimeout(url, timeout = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function parseDataset(dataset, csv) {
  const rows = parseCSV(csv);
  if (rows.length < 3) throw new Error("Empty dataset");
  const headers = rows[0].map(h => h.trim());
  const yearIndex = headers.findIndex(h => h.toLowerCase() === "year");
  const entityIndex = headers.findIndex(h => h.toLowerCase() === "entity");
  if (yearIndex < 0 || entityIndex < 0) throw new Error("Unexpected CSV columns");
  const valueIndex = headers.findIndex((h, i) => i !== yearIndex && i !== entityIndex && h.toLowerCase() !== "code");
  if (valueIndex < 0) throw new Error("No numeric column");

  const entities = new Map();
  for (const cells of rows.slice(1)) {
    const year = Number(cells[yearIndex]);
    const raw = cells[valueIndex]?.trim();
    const value = raw === "" || raw == null ? NaN : Number(raw);
    const entity = cells[entityIndex]?.trim();
    if (!entity || !Number.isFinite(year) || !Number.isFinite(value)) continue;
    if (!entities.has(entity)) entities.set(entity, []);
    entities.get(entity).push({ year, value });
  }

  const candidates = [...entities.entries()]
    .map(([entity, points]) => [entity, points.sort((a, b) => a.year - b.year)])
    .filter(([, points]) => points.length >= dataset.minYears && points.at(-1).year - points[0].year >= 20);
  if (!candidates.length) throw new Error("No long time series found");

  const [entity, points] = candidates[Math.floor(Math.random() * candidates.length)];
  const cutoffMin = Math.max(8, Math.floor(points.length * .43));
  const cutoffMax = Math.min(points.length - 7, Math.floor(points.length * .72));
  if (cutoffMax <= cutoffMin) throw new Error("Not enough data points");
  const cutoffIndex = cutoffMin + Math.floor(Math.random() * (cutoffMax - cutoffMin + 1));
  return {
    ...dataset, entity, points,
    visible: points.slice(0, cutoffIndex + 1),
    future: points.slice(cutoffIndex),
    cutoffIndex,
    firstYear: points[0].year,
    lastYear: points.at(-1).year,
    cutoffYear: points[cutoffIndex].year,
    valueLabel: headers[valueIndex],
    source: "Our World in Data",
    url: `https://ourworldindata.org/grapher/${dataset.slug}`
  };
}

export async function loadRandomDataset(previousSlug = null) {
  const pool = [...DATASETS].sort(() => Math.random() - .5);
  if (previousSlug && pool.length > 1 && pool[0].slug === previousSlug) [pool[0], pool[1]] = [pool[1], pool[0]];
  const attempts = pool.slice(0, 4);
  try {
    return await Promise.any(attempts.map(async dataset => {
      const csv = await fetchWithTimeout(`https://ourworldindata.org/grapher/${dataset.slug}.csv`);
      return parseDataset(dataset, csv);
    }));
  } catch (failure) {
    const errors = (failure.errors || []).map(error => error?.message || "Request failed");
    throw new Error(errors.join(" · ") || "No dataset could be loaded");
  }
}
