function interpolate(points, year) {
  if (!points.length) return 0;
  if (year <= points[0].year) return points[0].value;
  if (year >= points[points.length - 1].year) return points[points.length - 1].value;
  let i = 0;
  while (i < points.length - 1 && points[i + 1].year < year) i++;
  const a = points[i], b = points[i + 1];
  const t = (year - a.year) / (b.year - a.year);
  return a.value + (b.value - a.value) * t;
}

function turningPoints(values) {
  const turns = [];
  for (let i = 1; i < values.length - 1; i++) {
    const before = values[i] - values[i - 1];
    const after = values[i + 1] - values[i];
    if ((before > 0 && after < 0) || (before < 0 && after > 0)) turns.push(i);
  }
  return turns;
}

export function scorePrediction(dataset, prediction) {
  const future = dataset.future;
  const actual = future.map(p => p.value);
  const predicted = future.map(p => interpolate(prediction, p.year));
  const visibleValues = dataset.visible.map(p => p.value);
  const min = Math.min(...visibleValues);
  const max = Math.max(...visibleValues);
  const scale = Math.max(max - min, Math.abs(max) * 0.08, 1);

  const errors = actual.map((v, i) => Math.abs(v - predicted[i]) / scale);
  const meanError = errors.reduce((a, b) => a + b, 0) / Math.max(errors.length, 1);
  const accuracy = Math.max(0, Math.min(100, 100 * Math.exp(-2.35 * meanError)));

  let correctDirection = 0, directionCount = 0;
  for (let i = 1; i < actual.length; i++) {
    const actualDelta = actual[i] - actual[i - 1];
    const predictedDelta = predicted[i] - predicted[i - 1];
    if (Math.abs(actualDelta) < scale * 0.008) continue;
    directionCount++;
    if (Math.sign(actualDelta) === Math.sign(predictedDelta) || Math.abs(predictedDelta) < scale * 0.008) {
      correctDirection += Math.sign(actualDelta) === Math.sign(predictedDelta) ? 1 : 0.5;
    }
  }
  const trend = directionCount ? 100 * correctDirection / directionCount : 50;

  const actualTurns = turningPoints(actual);
  const predictedTurns = turningPoints(predicted);
  let matched = 0;
  const used = new Set();
  for (const turn of actualTurns) {
    let best = -1, distance = Infinity;
    predictedTurns.forEach((candidate, index) => {
      const d = Math.abs(candidate - turn);
      if (!used.has(index) && d <= Math.max(2, Math.round(actual.length * 0.12)) && d < distance) {
        best = index; distance = d;
      }
    });
    if (best >= 0) { matched++; used.add(best); }
  }
  const turning = actualTurns.length === 0
    ? (predictedTurns.length === 0 ? 100 : Math.max(0, 100 - predictedTurns.length * 15))
    : 100 * matched / Math.max(actualTurns.length, predictedTurns.length, 1);

  const finalError = Math.abs(actual[actual.length - 1] - predicted[predicted.length - 1]) / scale;
  const finalValue = Math.max(0, Math.min(100, 100 * Math.exp(-2.1 * finalError)));

  const total = Math.round(10000 * (
    accuracy * 0.55 + trend * 0.20 + turning * 0.10 + finalValue * 0.15
  ) / 100);

  return {
    total,
    metrics: [
      { name: "Overall accuracy", value: accuracy, weight: "55%" },
      { name: "Trend accuracy", value: trend, weight: "20%" },
      { name: "Turning points", value: turning, weight: "10%" },
      { name: "Final value", value: finalValue, weight: "15%" }
    ],
    meanError,
    finalError,
    actualTurns: actualTurns.length,
    matchedTurns: matched
  };
}

export function interpolatePrediction(points, year) {
  return interpolate(points, year);
}
