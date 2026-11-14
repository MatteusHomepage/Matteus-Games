(() => {
  const ACCENT_HUE = 252;
  const INK = "15152b";

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const greenish = (h) => h >= 110 && h <= 185;
  const yellowish = (h) => h >= 38 && h <= 72;

  const surface = (l) => 0.995 - l * 1.2;
  const text = (l) => 0.45 - 0.795 * (l - 0.52);

  MG.theme({
    id: "daylight",
    name: "Daylight",
    note: "White, clean and playful.",
    preview: {
      bg: "#fffdf8",
      surface: "#eeeaff",
      accent: "#5b4bff",
      text: "#15152b",
    },
    thumbs: "daylight",
    fonts:
      "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap",
    vars: {
      "--scheme": "light",
      "--font-body": '"Nunito", sans-serif',
      "--font-display": '"Fredoka", sans-serif',
      "--easy": "#1fb55a",
      "--medium": "#d9a400",
      "--hard": "#ec7a12",
      "--expert": "#e53e3e",
      "--impossible": "#9b4dea",
      "--green": "#1fb55a",
      "--red": "#e53e3e",
      "--ink": "#15152b",
      "--pop": "#5b4bff",
      "--cf-0": "#5b4bff",
      "--cf-1": "#ff5c8a",
      "--cf-2": "#ffd23f",
      "--cf-3": "#2fd27a",
      "--cf-4": "#2cb7ff",
      "--cf-5": "#ff8a3d",
      "--g-ocean-0": "#e3f3ff",
      "--g-ocean-1": "#c9e6fb",
      "--g-ocean-2": "#a9d3f5",
      "--g-glow-0": "rgba(91,75,255,0.22)",
      "--g-glow-1": "rgba(91,75,255,0.08)",
      "--g-glow-2": "rgba(91,75,255,0)",
      "--g-shade-0": "rgba(60,80,150,0)",
      "--g-shade-1": "rgba(60,80,150,0.08)",
      "--g-shade-2": "rgba(60,80,150,0.26)",
      "--g-rim": "rgba(21,21,43,0.35)",
      "--g-land": "#fbf4e4",
      "--g-land-edge": "rgba(21,21,43,0.3)",
      "--g-state-edge": "rgba(21,21,43,0.55)",
      "--g-start": "#ffd84d",
      "--g-green": "#34c759",
      "--g-yellow": "#ff9f1c",
      "--g-red": "#ff4d4d",
      "--g-reveal": "#7fdc9a",
      "--g-pill": "rgba(255,255,255,0.97)",
      "--g-pill-text": "#15152b",
      "--g-light-text": "#15152b",
      "--g-pill-shadow": "rgba(21,21,43,0.28)",
      "--tab-0": "120,118,160",
      "--tab-1": "21,21,43",
    },
    css: `
      html[data-theme="daylight"] body {
        background-image: radial-gradient(rgba(91,75,255,0.14) 1.4px, transparent 1.5px);
        background-size: 24px 24px;
      }
      html[data-theme="daylight"] .hub-btn,
      html[data-theme="daylight"] .user-card {
        background: #fff;
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 2px 2px 0 1px var(--ink);
        color: var(--ink);
      }
      html[data-theme="daylight"] .mode-card {
        background: #fff;
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 4px 4px 0 1px var(--ink);
        transition: transform 0.15s, box-shadow 0.15s;
      }
      html[data-theme="daylight"] .mode-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: 0 0 0 1px var(--ink), 6px 6px 0 1px var(--ink);
        border-color: var(--ink);
        background: #fff;
      }
      html[data-theme="daylight"] .primary {
        color: #fff;
        background: var(--pop);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 4px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .primary:hover:not(:disabled) {
        background: var(--pop);
        transform: translateY(-1px);
        box-shadow: 0 0 0 1px var(--ink), 0 5px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .primary:active:not(:disabled) {
        transform: translateY(3px);
        box-shadow: 0 0 0 1px var(--ink), 0 1px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .bg-card {
        background: #fff;
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 5px 5px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .bg-stage {
        box-shadow:
          0 -1px 0 1px var(--ink),
          0 1px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .back,
      html[data-theme="daylight"] .score-chip {
        background: #fff;
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 2px 2px 0 1px var(--ink);
        color: var(--ink);
      }
      html[data-theme="daylight"] .pill {
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
      }
      html[data-theme="daylight"] .pill.sel {
        box-shadow: 0 0 0 1px var(--ink), 0 3px 0 1px var(--ink);
      }
      html[data-theme="daylight"] input:not([type="range"]):not([type="checkbox"]),
      html[data-theme="daylight"] select,
      html[data-theme="daylight"] .skip-btn,
      html[data-theme="daylight"] .dd-btn {
        background: #fff;
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
        color: var(--ink);
      }
      html[data-theme="daylight"] input:focus {
        border-color: var(--pop);
        box-shadow: 0 0 0 3px rgba(91, 75, 255, 0.2);
      }
      html[data-theme="daylight"] .gs-btn {
        background: #fff;
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
        color: var(--ink);
      }
      html[data-theme="daylight"] .gs-btn.is-guess {
        background: var(--pop);
        color: #fff;
        box-shadow: 0 0 0 1px var(--ink), 0 3px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .menu,
      html[data-theme="daylight"] .duel-grid > div {
        background: #fff;
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 5px 5px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .sheet {
        background: #fff;
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 6px 6px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .brand,
      html[data-theme="daylight"] .brand-text {
        color: var(--ink);
      }
      html[data-theme="daylight"] .brand-mark {
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 2px 2px 0 1px var(--ink);
        color: #fff;
      }
      html[data-theme="daylight"] .tab {
        color: #4a4870;
      }
      html[data-theme="daylight"] .tab:hover {
        color: var(--ink);
      }
      html[data-theme="daylight"] .tab.sel {
        background: var(--pop);
        color: #fff;
        box-shadow: 0 0 0 1px var(--ink);
      }
      html[data-theme="daylight"] .cat-tile {
        background: #fff;
        color: var(--ink);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 3px 3px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .cat-tile small {
        color: #4a4870;
      }
      html[data-theme="daylight"] .cat-tile:hover {
        box-shadow: 0 0 0 1px var(--ink), 5px 5px 0 1px var(--ink);
        border-color: var(--ink);
      }
      html[data-theme="daylight"] .cat-tile.sel {
        background: var(--c);
        color: var(--ink);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 5px 5px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .cat-tile.sel small {
        color: rgba(21, 21, 43, 0.8);
      }
      html[data-theme="daylight"] .cat-tile .ct-ic,
      html[data-theme="daylight"] .cat-tile.sel .ct-ic {
        background: var(--ink);
        color: #fff;
      }
      html[data-theme="daylight"] .cat-tile .ct-check {
        background: var(--ink);
        color: #fff;
      }
      html[data-theme="daylight"] .stat-tile {
        background: #fff;
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
      }
      html[data-theme="daylight"] .stat-tile span {
        color: #4a4870;
      }
      html[data-theme="daylight"] .res-next {
        background: var(--pop);
        color: #fff;
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 4px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .res-next:hover {
        background: var(--pop);
      }
      html[data-theme="daylight"] .res.bad .res-next {
        background: #fff;
        color: var(--red);
      }
      html[data-theme="daylight"] .cool {
        background: rgba(21, 21, 43, 0.12);
      }
      html[data-theme="daylight"] button:disabled {
        opacity: 0.5;
      }
      html[data-theme="daylight"] .tile {
        background: #fff;
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 4px 4px 0 1px var(--ink);
        transition: transform 0.15s, box-shadow 0.15s;
      }
      html[data-theme="daylight"] .tile:hover,
      html[data-theme="daylight"] .tile:focus-visible {
        transform: translate(-2px, -2px);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 6px 6px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .tile-art {
        background: #eeeaff;
        border-bottom-color: var(--ink);
      }
      html[data-theme="daylight"] .tile-pic {
        filter: blur(7px) brightness(1);
      }
      html[data-theme="daylight"] .tile:hover .tile-pic {
        filter: blur(5px) brightness(1);
      }
      html[data-theme="daylight"] .tile-ico {
        background: #fff;
        color: var(--pop);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 2px 2px 0 1px var(--ink);
      }
      html[data-theme="daylight"] .tile:hover .tile-ico {
        background: var(--pop);
        color: #fff;
      }
      html[data-theme="daylight"] .tile-go {
        color: var(--pop);
      }
      html[data-theme="daylight"] .tile p {
        color: #4a4870;
      }
      html[data-theme="daylight"] .more {
        background: #fff;
        color: var(--ink);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 2px 2px 0 1px var(--ink);
      }
      html[data-theme="daylight"] #setupInfo div,
      html[data-theme="daylight"] .option {
        background: #fff;
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
      }
      html[data-theme="daylight"] .option:hover:not(:disabled) {
        background: #f1eefc;
        border-color: var(--ink);
      }
      html[data-theme="daylight"] #setupInfo small,
      html[data-theme="daylight"] .option small {
        color: #4a4870;
      }
      html[data-theme="daylight"] .tier-legend {
        background: #fff;
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
      }
      html[data-theme="daylight"] .tier-legend span {
        color: var(--ink);
        border-color: rgba(21, 21, 43, 0.25);
      }
      html[data-theme="daylight"] .muted,
      html[data-theme="daylight"] .helper {
        color: #4a4870;
      }
    `,
    override: {
      "000000": INK,
      ffffff: "#15152b",
      "030504": "#f1eefc",
      "0f1812": "#ffffff",
      "0a110d": "#fdfcff",
      "070c09": "#f9f8ff",
      "7f8b83": "#5a5882",
      "8a978e": "#4f4d78",
      aab5ad: "#403e66",
    },
    color(c) {
      const { h, s, l } = c;
      const accentFamily = greenish(h) && s > 0.3;
      const tint = greenish(h) && s <= 0.3;
      if (l < 0.3) {
        if (accentFamily) return [ACCENT_HUE, s * 0.9, surface(l)];
        if (tint || s < 0.15) return [40, 0.12 + s * 0.2, surface(l)];
        return [h, s * 0.85, surface(l)];
      }
      if (l > 0.55 && s < 0.35) return [250, 0.1 + s * 0.3, text(l)];
      if (accentFamily) {
        if (l > 0.75) return [ACCENT_HUE, 0.6, text(l)];
        return [ACCENT_HUE, 0.95, 0.6 - (l - 0.5) * 0.25];
      }
      if (s > 0.55 && l >= 0.35 && l <= 0.8) {
        return [h, s, yellowish(h) ? l * 0.7 : l * 0.82];
      }
      return [h, s * 0.9, l > 0.5 ? text(l) : surface(l) * 0.9];
    },
  });
})();
