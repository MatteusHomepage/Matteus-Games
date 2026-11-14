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
    html.embedded, html.embedded body { min-height: 0 !important; height: auto !important; background: transparent !important; overflow: hidden !important; }
    html.embedded .spot { display: none !important; }
    html.embedded body { padding-top: 0; }
    html.embedded main, html.embedded .main { padding-top: 0; padding-bottom: 0; flex: none; }
    html.embedded .bg-stage { height: clamp(240px, 62vw, 400px) !important; }
  `;

  const post = (message) => parent.postMessage({ ag: 1, ...message }, "*");
  let rid = 0;
  let announced = false;
  let lastHeight = 0;

  const seeded = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const nativeRandom = Math.random;

  const measure = () => {
    const h = Math.ceil(document.body.getBoundingClientRect().height);
    if (h === lastHeight) return;
    lastHeight = h;
    post({ type: "size", h });
  };

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
      pick: !!d.pick,
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
      const seed = (m.settings || {}).seed;
      Math.random = seed == null ? nativeRandom : seeded(seed);
      Promise.resolve()
        .then(() => AGE.def.play(m.settings || {}))
        .catch((e) => AGE.fail(String((e && e.message) || e)));
    } else if (m.type === "pick" && AGE.def.pick) {
      Promise.resolve()
        .then(() => AGE.def.pick(m.settings || {}))
        .then((pick) => post({ type: "picked", rid: m.rid, pick }))
        .catch(() => post({ type: "picked", rid: m.rid, pick: null }));
    } else if (m.type === "prepare" && AGE.def.prepare) {
      Promise.resolve()
        .then(() => AGE.def.prepare(m.settings || {}))
        .catch(() => {});
    } else if (m.type === "stop") {
      Math.random = nativeRandom;
      if (AGE.def.stop) AGE.def.stop();
    }
  });

  window.addEventListener("load", () => {
    if (!announced) announce();
    new ResizeObserver(measure).observe(document.body);
    setInterval(measure, 300);
    measure();
  });
})();
