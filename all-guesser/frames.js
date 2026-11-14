const FR = { frames: {}, schemas: {}, info: {}, listeners: [] };

function mountFrames() {
  const box = $("agStage");
  AG_GAMES.forEach((g) => {
    const frame = document.createElement("iframe");
    frame.className = "ag-frame";
    frame.dataset.id = g.id;
    frame.title = g.title;
    frame.allow = "autoplay";
    frame.addEventListener("load", () => {
      frame.dataset.loaded = "1";
    });
    frame.name = "ag-embed";
    frame.src = `${g.url}?embed=1&t=${Date.now()}`;
    box.appendChild(frame);
    FR.frames[g.id] = frame;
  });
}

function frameOf(source) {
  return Object.keys(FR.frames).find(
    (id) => FR.frames[id].contentWindow === source,
  );
}

function sendTo(id, message) {
  const frame = FR.frames[id];
  if (frame && frame.contentWindow)
    frame.contentWindow.postMessage({ ag: 1, ...message }, "*");
}

function showFrame(id) {
  Object.keys(FR.frames).forEach((key) =>
    FR.frames[key].classList.toggle("on", key === id),
  );
}

function ready(id) {
  return !!FR.schemas[id];
}

function whenSchemas(ids, timeout) {
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      const missing = ids.filter((id) => !ready(id));
      if (!missing.length || Date.now() - started > timeout) resolve(missing);
      else {
        ids
          .filter((id) => !ready(id))
          .forEach((id) => sendTo(id, { type: "hello" }));
        setTimeout(check, 400);
      }
    };
    check();
  });
}

function loadProblem(id) {
  const frame = FR.frames[id];
  const name = gameTitle(id);
  const info = FR.info[id] || {};
  const url = AG_GAMES.find((g) => g.id === id).url.replace("../", "");
  if (!frame.dataset.loaded)
    return `${name} couldn't be opened. Check that ${url} is uploaded and allowed to be embedded.`;
  if (!info.boot)
    return `${name} opened but isn't set up for All Guesser. Upload its latest index.html and embed.js, plus the embed folder.`;
  return info.error
    ? `${name} failed to start: ${info.error}.`
    : `${name} opened but isn't set up for All Guesser. Upload its latest embed.js.`;
}

window.addEventListener("message", (event) => {
  const m = event.data;
  if (!m || m.ag !== 1) return;
  const id = frameOf(event.source);
  if (!id) return;
  if (m.type === "boot") FR.info[id] = { ...FR.info[id], boot: true };
  else if (m.type === "error")
    FR.info[id] = { ...FR.info[id], error: m.message };
  else if (m.type === "ready") {
    FR.schemas[id] = m.schema;
    FR.listeners.forEach((fn) => fn("schema", id, m));
  } else if (m.type === "result") onRoundResult(id, m);
  else if (m.type === "next") onRoundNext(id, m);
  else if (m.type === "fail") onRoundFail(id, m);
});
