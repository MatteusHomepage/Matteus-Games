const FR = { frames: {}, schemas: {}, listeners: [] };

function mountFrames() {
  const box = $("agStage");
  AG_GAMES.forEach((g) => {
    const frame = document.createElement("iframe");
    frame.className = "ag-frame";
    frame.dataset.id = g.id;
    frame.title = g.title;
    frame.allow = "autoplay";
    frame.src = g.url + "?embed=1";
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

window.addEventListener("message", (event) => {
  const m = event.data;
  if (!m || m.ag !== 1) return;
  const id = frameOf(event.source);
  if (!id) return;
  if (m.type === "ready") {
    FR.schemas[id] = m.schema;
    FR.listeners.forEach((fn) => fn("schema", id, m));
  } else if (m.type === "result") onRoundResult(id, m);
  else if (m.type === "next") onRoundNext(id, m);
  else if (m.type === "fail") onRoundFail(id, m);
});
