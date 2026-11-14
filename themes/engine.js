(() => {
  const MG = (window.MG = { themes: {}, order: [], base: window.MG_BASE });
  const KEY = "mg_theme";

  MG.theme = (t) => {
    MG.themes[t.id] = t;
    MG.order.push(t.id);
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  MG.toHsl = (hex) => {
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let h = 0;
    let s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = ((g - b) / d + 6) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h, s, l };
  };

  MG.toHex = (h, s, l) => {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 1);
    l = clamp(l, 0, 1);
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const sector = [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ][Math.floor(h / 60) % 6];
    return sector
      .map((v) =>
        Math.round((v + m) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  };

  MG.dark = (o) => {
    const c = { spread: 0.25, sat: 1, lift: 0, textSat: 0.6, ...o };
    const bgHue = c.bgHue === undefined ? c.hue : c.bgHue;
    return (x) => {
      const { h, s, l } = x;
      const green = h >= 100 && h <= 190;
      if (green && s > 0.1) {
        if (l < 0.3) return [bgHue + (h - 150) * c.spread, s * c.sat, l];
        if (l > 0.7) return [c.hue, s * c.textSat, l];
        return [
          c.hue + (h - 150) * c.spread,
          s * c.sat,
          clamp(l + c.lift, 0, 1),
        ];
      }
      if (l < 0.3 && s < 0.4) return [bgHue, Math.max(s, 0.1) * c.sat, l];
    };
  };

  MG.darkVars = (o) => {
    const c = { bgHue: o.hue, ...o };
    const hx = (h, s, l) => "#" + MG.toHex(h, s, l);
    const rgb = (h, s, l, a) => {
      const v = MG.toHex(h, s, l);
      const n = (i) => parseInt(v.slice(i, i + 2), 16);
      return "rgba(" + n(0) + "," + n(2) + "," + n(4) + "," + a + ")";
    };
    return {
      "--scheme": "dark",
      "--cf-0": hx(c.hue, 0.9, 0.6),
      "--cf-1": hx(c.hue + 40, 0.9, 0.62),
      "--cf-2": hx(c.hue - 40, 0.9, 0.62),
      "--cf-3": hx(c.hue + 90, 0.85, 0.6),
      "--cf-4": hx(c.hue, 0.2, 0.7),
      "--cf-5": hx(c.hue, 0.3, 0.9),
      "--g-ocean-0": hx(c.bgHue, 0.4, 0.14),
      "--g-ocean-1": hx(c.bgHue, 0.4, 0.1),
      "--g-ocean-2": hx(c.bgHue, 0.4, 0.06),
      "--g-glow-0": rgb(c.hue, 0.9, 0.55, 0.2),
      "--g-glow-1": rgb(c.hue, 0.9, 0.55, 0.07),
      "--g-glow-2": rgb(c.hue, 0.9, 0.55, 0),
      "--g-rim": rgb(c.hue, 0.5, 0.8, 0.2),
      "--g-land": hx(c.bgHue, 0.25, 0.22),
      "--g-land-edge": rgb(c.hue, 0.3, 0.8, 0.4),
      "--g-state-edge": rgb(c.bgHue, 0.4, 0.05, 0.6),
      "--g-start": hx(c.hue, 0.5, 0.9),
      "--g-reveal": hx(c.hue, 0.7, 0.45),
      "--g-pill": rgb(c.bgHue, 0.4, 0.06, 0.94),
      "--g-pill-text": hx(c.hue, 0.3, 0.95),
      "--g-light-text": hx(c.bgHue, 0.4, 0.08),
      "--tab-0": (() => {
        const v = MG.toHex(c.hue, 0.15, 0.6);
        return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)).join(",");
      })(),
      "--tab-1": (() => {
        const v = MG.toHex(c.hue, 0.3, 0.95);
        return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)).join(",");
      })(),
      ...(o.vars || {}),
    };
  };

  const store = {
    get() {
      try {
        return localStorage.getItem(KEY);
      } catch (e) {
        return null;
      }
    },
    set(id) {
      try {
        localStorage.setItem(KEY, id);
      } catch (e) {}
    },
  };

  const scopePath = () => {
    try {
      if (window.top !== window) return window.top.location.pathname;
    } catch (e) {}
    return location.pathname;
  };

  const allowed = (t) => {
    if (!t.only) return true;
    const path = scopePath();
    return t.only.some((game) => path.includes("/" + game + "/"));
  };

  const preview = new URLSearchParams(location.search).get("theme");

  MG.saved = () => {
    const id = store.get();
    return MG.themes[id] ? id : "original";
  };

  MG.active = () => {
    const wanted = MG.themes[preview] ? preview : MG.saved();
    const t = MG.themes[wanted];
    return t && allowed(t) ? t : MG.themes.original;
  };

  const build = (t) => {
    const vars = { ...(t.vars || {}) };
    const raws = (MG.themes.original && MG.themes.original.colors) || [];
    raws.forEach((raw) => {
      const base = raw.slice(0, 6);
      const alpha = raw.slice(6);
      const ov = t.override && (t.override[raw] || t.override[base]);
      let out = ov ? String(ov).replace("#", "") : "";
      if (!out && t.color) {
        const hsl = MG.toHsl(base);
        const res = t.color({
          hex: base,
          raw,
          a: alpha ? parseInt(alpha, 16) / 255 : 1,
          ...hsl,
        });
        if (Array.isArray(res)) out = MG.toHex(res[0], res[1], res[2]);
        else if (res) out = String(res).replace("#", "");
      }
      if (out) vars["--c-" + raw] = "#" + (out.length > 6 ? out : out + alpha);
    });
    const body = Object.keys(vars)
      .map((k) => k + ":" + vars[k] + ";")
      .join("");
    return ":root{" + body + "}" + (t.css || "");
  };

  const ensure = (tag, id, parent) => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag);
      el.id = id;
      if (tag === "link") el.rel = "stylesheet";
      parent.appendChild(el);
    }
    return el;
  };

  let observer = null;
  const keepLast = (style) => {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
      if (document.head.lastElementChild !== style)
        document.head.appendChild(style);
    });
    observer.observe(document.head, { childList: true });
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => observer && observer.disconnect(), 50);
    });
  };

  let cache = {};
  MG.v = (name, fallback) => {
    if (!(name in cache))
      cache[name] = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    return cache[name] || fallback;
  };

  MG.thumb = (url) =>
    MG.current && MG.current.thumbs
      ? url.replace(/([^/]+)$/, MG.current.thumbs + "/$1")
      : url;

  MG.apply = () => {
    const t = MG.active();
    MG.current = t;
    document.documentElement.setAttribute("data-theme", t.id);
    const style = ensure("style", "mg-theme", document.head);
    style.textContent = t.id === "original" ? "" : build(t);
    document.head.appendChild(style);
    keepLast(style);
    const fonts = ensure("link", "mg-fonts", document.head);
    if (t.fonts) fonts.href = t.fonts;
    else fonts.removeAttribute("href");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && t.preview) meta.content = t.preview.bg;
    cache = {};
    if (MG.paint) MG.paint();
    window.dispatchEvent(new Event("mg-theme"));
  };

  MG.set = (id) => {
    if (!MG.themes[id]) return;
    store.set(id);
    MG.apply();
  };

  window.addEventListener("storage", (e) => {
    if (e.key === KEY) MG.apply();
  });

  const nice = (slug) =>
    slug
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");

  const PICKER_CSS = `
    .mg-themes{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:4px}
    .mg-theme{display:flex;flex-direction:column;gap:8px;text-align:left;padding:8px;border-radius:14px;border:2px solid var(--line);background:transparent;color:var(--text);cursor:pointer;font:inherit;transition:border-color .2s,transform .15s}
    .mg-theme:hover{border-color:var(--muted)}
    .mg-theme.on{border-color:var(--accent)}
    .mg-pv{position:relative;display:block;height:58px;border-radius:9px;overflow:hidden;border:1px solid rgba(128,128,128,.25)}
    .mg-pv i{position:absolute;left:10px;right:10px;top:10px;height:16px;border-radius:6px}
    .mg-pv b{position:absolute;left:10px;width:46%;bottom:9px;height:14px;border-radius:6px}
    .mg-name{font-size:13px;font-weight:700;padding:0 2px}
    .mg-quick{margin:2px 0 12px}
    .mg-quick-label{display:block;font-size:11px;font-weight:800;letter-spacing:1px;color:var(--muted);margin-bottom:8px}
    .mg-chips{display:flex;flex-wrap:wrap;gap:8px}
    .mg-chip{display:flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:999px;border:2px solid var(--line);background:transparent;color:var(--text);font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:border-color .2s}
    .mg-chip:hover{border-color:var(--muted)}
    .mg-chip.on{border-color:var(--accent)}
    .mg-dot{position:relative;width:24px;height:24px;border-radius:50%;border:1px solid rgba(128,128,128,.3);display:block}
    .mg-dot i{position:absolute;left:6px;top:6px;width:10px;height:10px;border-radius:50%}
    .mg-theme small{font-size:11px;color:var(--muted);padding:0 2px;margin-top:-5px;line-height:1.3}
  `;

  const cardHTML = (t) => {
    const pv = t.preview || {};
    const scope = t.only
      ? "Only on " + t.only.map(nice).join(", ")
      : t.note || "";
    const picked = MG.themes[preview] ? MG.current.id : MG.saved();
    const on = picked === t.id ? " on" : "";
    return `<button type="button" class="mg-theme${on}" data-theme-id="${t.id}">
      <span class="mg-pv" style="background:${pv.bg}"><i style="background:${pv.surface}"></i><b style="background:${pv.accent}"></b></span>
      <span class="mg-name">${t.name}</span><small>${scope}</small></button>`;
  };

  const quickHTML = (t) => {
    const pv = t.preview || {};
    const picked = MG.themes[preview] ? MG.current.id : MG.saved();
    return `<button type="button" class="mg-chip${picked === t.id ? " on" : ""}" data-theme-id="${t.id}">
      <span class="mg-dot" style="background:${pv.bg}"><i style="background:${pv.accent}"></i></span>${t.name}</button>`;
  };

  MG.paint = () => {
    const quick = document.getElementById("mgQuickGrid");
    if (quick)
      quick.innerHTML = MG.order.map((id) => quickHTML(MG.themes[id])).join("");
    const box = document.getElementById("mgThemeGrid");
    if (box)
      box.innerHTML = MG.order.map((id) => cardHTML(MG.themes[id])).join("");
  };

  const mountQuick = () => {
    const form = document.querySelector("#welcomeModal #wc_new");
    if (!form || document.getElementById("mgQuick")) return;
    const box = document.createElement("div");
    box.id = "mgQuick";
    box.className = "mg-quick";
    box.innerHTML = `<span class="mg-quick-label">THEME</span><div class="mg-chips" id="mgQuickGrid"></div>`;
    const create = form.querySelector(".primary");
    if (create) form.insertBefore(box, create);
    else form.appendChild(box);
    box.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-theme-id]");
      if (chip) MG.set(chip.dataset.themeId);
    });
    MG.paint();
  };

  const mountPicker = () => {
    if (!document.getElementById("mgPickerCss")) {
      const css = document.createElement("style");
      css.id = "mgPickerCss";
      css.textContent = PICKER_CSS;
      document.head.appendChild(css);
    }
    mountQuick();
    const sheet = document.querySelector("#settingsModal .sheet");
    if (!sheet || document.getElementById("mgThemes")) return;
    const section = document.createElement("section");
    section.id = "mgThemes";
    section.innerHTML = `<h3>Themes</h3><div class="mg-themes" id="mgThemeGrid"></div>`;
    const done = sheet.querySelector(".primary.full");
    if (done) sheet.insertBefore(section, done);
    else sheet.appendChild(section);
    section.addEventListener("click", (e) => {
      const card = e.target.closest("[data-theme-id]");
      if (card) MG.set(card.dataset.themeId);
    });
    MG.paint();
  };

  MG.boot = () => {
    MG.apply();
    document.addEventListener("DOMContentLoaded", mountPicker);
  };

  const ids = window.MG_THEMES || ["original"];
  let tags = `<link rel="stylesheet" href="${MG.base}original.css">`;
  ids.forEach((id) => {
    tags += `<script src="${MG.base}${id}.js"><\/script>`;
  });
  tags += "<script>MG.boot()<\/script>";
  document.write(tags);
})();
