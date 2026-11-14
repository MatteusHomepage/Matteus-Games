(() => {
  const active =
    new URLSearchParams(location.search).get("embed") === "1" ||
    window.name === "ag-embed" ||
    location.hash === "#embed";
  const AGE = { active, def: null };
  window.AGE = AGE;
  if (!active) {
    AGE.define = () => {};
    return;
  }

  const BASE_CSS = `
    html.embedded .topbar,
    html.embedded .foot,
    html.embedded .modal-back,
    html.embedded .hub-btn,
    html.embedded .back,
    html.embedded #toast,
    html.embedded #moreBtn,
    html.embedded .reg-row,
    html.embedded .rg-top,
    html.embedded .score-chip { display: none !important; }
    html.embedded body { min-height: 0; padding-top: 0; }
    html.embedded main, html.embedded .main { padding-top: 12px; }
  `;

  const post = (message) => parent.postMessage({ ag: 1, ...message }, "*");
  let rid = 0;
  let announced = false;

  post({ type: "boot" });
  window.addEventListener("error", (event) =>
    post({ type: "error", message: String(event.message || "error") }),
  );
  window.addEventListener("unhandledrejection", (event) =>
    post({
      type: "error",
      message: String((event.reason && event.reason.message) || event.reason),
    }),
  );

  const schema = () => {
    const d = AGE.def;
    return {
      id: d.id,
      diff: d.diff !== false,
      modes: d.modes || null,
      settings:
        typeof d.settings === "function" ? d.settings() : d.settings || [],
      hearts: d.hearts || null,
    };
  };

  const announce = () => {
    if (!AGE.def) return;
    announced = true;
    post({ type: "ready", schema: schema() });
  };

  document.documentElement.classList.add("embedded");
  const style = document.createElement("style");
  style.textContent = BASE_CSS;
  document.head.appendChild(style);

  AGE.define = (def) => {
    AGE.def = def;
    if (def.css) {
      const extra = document.createElement("style");
      extra.textContent = def.css;
      document.head.appendChild(extra);
    }
    announce();
  };

  AGE.finish = (result) => post({ type: "result", rid, ...result });
  AGE.next = () => post({ type: "next", rid });
  AGE.fail = (message) => post({ type: "fail", rid, message });

  AGE.silence = (points, streak) => {
    window.srv = () =>
      Promise.resolve({
        points: points(),
        streak: streak ? streak() : 0,
        rejected: false,
      });
    window.localStats = () => {};
  };

  AGE.account = (name) => {
    const me = window.ME;
    if (me && me.token) return me;
    return { token: "embedded", username: name || "Player" };
  };

  window.addEventListener("message", (event) => {
    const m = event.data;
    if (!m || m.ag !== 1) return;
    if (!AGE.def) {
      if (m.type === "hello") post({ type: "boot" });
      return;
    }
    if (m.type === "hello") {
      post({ type: "boot" });
      announce();
    } else if (m.type === "play") {
      rid = m.rid;
      Promise.resolve()
        .then(() => AGE.def.play(m.settings || {}))
        .catch((e) => AGE.fail(String((e && e.message) || e)));
    } else if (m.type === "prepare" && AGE.def.prepare) {
      Promise.resolve()
        .then(() => AGE.def.prepare(m.settings || {}))
        .catch(() => {});
    } else if (m.type === "stop" && AGE.def.stop) AGE.def.stop();
  });

  window.addEventListener("load", () => {
    if (!announced) announce();
  });
})();
