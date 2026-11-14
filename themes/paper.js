(() => {
  const ACCENT_HUE = 16;
  const INK = "4a3728";

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const greenish = (h) => h >= 110 && h <= 185;
  const yellowish = (h) => h >= 38 && h <= 72;

  const surface = (l) => 0.995 - l * 1.2;
  const text = (l) => 0.45 - 0.795 * (l - 0.52);

  MG.theme({
    id: "paper",
    name: "Paper",
    note: "Warm paper and serif type.",
    preview: {
      bg: "#f6efe0",
      surface: "#efe0c6",
      accent: "#c2522b",
      text: "#4a3728",
    },
    thumbs: "paper",
    fonts:
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Lora:wght@400;500;600;700&display=swap",
    vars: {
      "--scheme": "light",
      "--card": "#fffaf0",
      "--font-body": '"Lora", serif',
      "--font-display": '"Fraunces", serif',
      "--easy": "#4f8a3c",
      "--medium": "#d9a400",
      "--hard": "#ec7a12",
      "--expert": "#e53e3e",
      "--impossible": "#9b4dea",
      "--green": "#4f8a3c",
      "--red": "#e53e3e",
      "--ink": "#4a3728",
      "--pop": "#c2522b",
      "--cf-0": "#c2522b",
      "--cf-1": "#e07a5f",
      "--cf-2": "#e9b44c",
      "--cf-3": "#6a994e",
      "--cf-4": "#3d6b7d",
      "--cf-5": "#8c5e3c",
      "--g-ocean-0": "#d3e1e0",
      "--g-ocean-1": "#c0d3d2",
      "--g-ocean-2": "#a9c2c2",
      "--g-glow-0": "rgba(194,82,43,0.22)",
      "--g-glow-1": "rgba(194,82,43,0.08)",
      "--g-glow-2": "rgba(194,82,43,0)",
      "--g-shade-0": "rgba(110,80,40,0)",
      "--g-shade-1": "rgba(110,80,40,0.08)",
      "--g-shade-2": "rgba(110,80,40,0.26)",
      "--g-rim": "rgba(74,55,40,0.35)",
      "--g-land": "#f9f1de",
      "--g-land-edge": "rgba(74,55,40,0.3)",
      "--g-state-edge": "rgba(74,55,40,0.55)",
      "--g-start": "#ffd84d",
      "--g-green": "#34c759",
      "--g-yellow": "#ff9f1c",
      "--g-red": "#ff4d4d",
      "--g-reveal": "#7fdc9a",
      "--g-pill": "rgba(255,250,240,0.97)",
      "--g-pill-text": "#4a3728",
      "--g-light-text": "#4a3728",
      "--g-pill-shadow": "rgba(74,55,40,0.28)",
      "--tab-0": "120,118,160",
      "--tab-1": "21,21,43",
    },
    css: `
      html[data-theme="paper"] body {
        background-image: radial-gradient(rgba(194,82,43,0.1) 1.2px, transparent 1.3px);
        background-size: 24px 24px;
      }
      html[data-theme="paper"] .hub-btn,
      html[data-theme="paper"] .user-card {
        background: var(--card);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 4px 6px rgba(74, 55, 40, 0.16);
        color: var(--ink);
      }
      html[data-theme="paper"] .mode-card {
        background: var(--card);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 6px 12px rgba(74, 55, 40, 0.16);
        transition: transform 0.15s, box-shadow 0.15s;
      }
      html[data-theme="paper"] .mode-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: 0 0 0 1px var(--ink), 0 8px 18px rgba(74, 55, 40, 0.16);
        border-color: var(--ink);
        background: var(--card);
      }
      html[data-theme="paper"] .primary {
        color: #fff;
        background: var(--pop);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 4px 0 1px var(--ink);
      }
      html[data-theme="paper"] .primary:hover:not(:disabled) {
        background: var(--pop);
        transform: translateY(-1px);
        box-shadow: 0 0 0 1px var(--ink), 0 5px 0 1px var(--ink);
      }
      html[data-theme="paper"] .primary:active:not(:disabled) {
        transform: translateY(3px);
        box-shadow: 0 0 0 1px var(--ink), 0 1px 0 1px var(--ink);
      }
      html[data-theme="paper"] .bg-card {
        background: var(--card);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 7px 15px rgba(74, 55, 40, 0.16);
      }
      html[data-theme="paper"] .bg-stage {
        box-shadow:
          0 -1px 0 1px var(--ink),
          0 1px 0 1px var(--ink);
      }
      html[data-theme="paper"] .back,
      html[data-theme="paper"] .score-chip {
        background: var(--card);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 4px 6px rgba(74, 55, 40, 0.16);
        color: var(--ink);
      }
      html[data-theme="paper"] .pill {
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
      }
      html[data-theme="paper"] .pill.sel {
        box-shadow: 0 0 0 1px var(--ink), 0 3px 0 1px var(--ink);
      }
      html[data-theme="paper"] input:not([type="range"]):not([type="checkbox"]),
      html[data-theme="paper"] select,
      html[data-theme="paper"] .skip-btn,
      html[data-theme="paper"] .dd-btn {
        background: var(--card);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
        color: var(--ink);
      }
      html[data-theme="paper"] input:focus {
        border-color: var(--pop);
        box-shadow: 0 0 0 3px rgba(194, 82, 43, 0.2);
      }
      html[data-theme="paper"] .gs-btn {
        background: var(--card);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
        color: var(--ink);
      }
      html[data-theme="paper"] .gs-btn.is-guess {
        background: var(--pop);
        color: #fff;
        box-shadow: 0 0 0 1px var(--ink), 0 3px 0 1px var(--ink);
      }
      html[data-theme="paper"] .menu,
      html[data-theme="paper"] .duel-grid > div {
        background: var(--card);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 7px 15px rgba(74, 55, 40, 0.16);
      }
      html[data-theme="paper"] .sheet {
        background: var(--card);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 8px 18px rgba(74, 55, 40, 0.16);
      }
      html[data-theme="paper"] .brand,
      html[data-theme="paper"] .brand-text {
        color: var(--ink);
      }
      html[data-theme="paper"] .brand-mark {
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 4px 6px rgba(74, 55, 40, 0.16);
        color: #fff;
      }
      html[data-theme="paper"] .tab {
        color: #6e5a49;
      }
      html[data-theme="paper"] .tab:hover {
        color: var(--ink);
      }
      html[data-theme="paper"] .tab.sel {
        background: var(--pop);
        color: #fff;
        box-shadow: 0 0 0 1px var(--ink);
      }
      html[data-theme="paper"] .cat-tile {
        background: var(--card);
        color: var(--ink);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 5px 9px rgba(74, 55, 40, 0.16);
      }
      html[data-theme="paper"] .cat-tile small {
        color: #6e5a49;
      }
      html[data-theme="paper"] .cat-tile:hover {
        box-shadow: 0 0 0 1px var(--ink), 0 7px 15px rgba(74, 55, 40, 0.16);
        border-color: var(--ink);
      }
      html[data-theme="paper"] .cat-tile.sel {
        background: var(--c);
        color: var(--ink);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 7px 15px rgba(74, 55, 40, 0.16);
      }
      html[data-theme="paper"] .cat-tile.sel small {
        color: rgba(74, 55, 40, 0.8);
      }
      html[data-theme="paper"] .cat-tile .ct-ic,
      html[data-theme="paper"] .cat-tile.sel .ct-ic {
        background: var(--ink);
        color: #fff;
      }
      html[data-theme="paper"] .cat-tile .ct-check {
        background: var(--ink);
        color: #fff;
      }
      html[data-theme="paper"] .stat-tile {
        background: var(--card);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
      }
      html[data-theme="paper"] .stat-tile span {
        color: #6e5a49;
      }
      html[data-theme="paper"] .res-next {
        background: var(--pop);
        color: #fff;
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 4px 0 1px var(--ink);
      }
      html[data-theme="paper"] .res-next:hover {
        background: var(--pop);
      }
      html[data-theme="paper"] .res.bad .res-next {
        background: var(--card);
        color: var(--red);
      }
      html[data-theme="paper"] .cool {
        background: rgba(74, 55, 40, 0.12);
      }
      html[data-theme="paper"] button:disabled {
        opacity: 0.5;
      }
      html[data-theme="paper"] .tile {
        background: var(--card);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 6px 12px rgba(74, 55, 40, 0.16);
        transition: transform 0.15s, box-shadow 0.15s;
      }
      html[data-theme="paper"] .tile:hover,
      html[data-theme="paper"] .tile:focus-visible {
        transform: translate(-2px, -2px);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 8px 18px rgba(74, 55, 40, 0.16);
      }
      html[data-theme="paper"] .tile-art {
        background: #efe0c6;
        border-bottom-color: var(--ink);
      }
      html[data-theme="paper"] .tile-pic {
        filter: blur(7px) brightness(1);
      }
      html[data-theme="paper"] .tile:hover .tile-pic {
        filter: blur(5px) brightness(1);
      }
      html[data-theme="paper"] .tile-ico {
        background: var(--card);
        color: var(--pop);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 4px 6px rgba(74, 55, 40, 0.16);
      }
      html[data-theme="paper"] .tile:hover .tile-ico {
        background: var(--pop);
        color: #fff;
      }
      html[data-theme="paper"] .tile-go {
        color: var(--pop);
      }
      html[data-theme="paper"] .tile p {
        color: #6e5a49;
      }
      html[data-theme="paper"] .more {
        background: var(--card);
        color: var(--ink);
        border: 1px solid var(--ink);
        box-shadow: 0 0 0 1px var(--ink), 0 4px 6px rgba(74, 55, 40, 0.16);
      }
      html[data-theme="paper"] #setupInfo div,
      html[data-theme="paper"] .option {
        background: var(--card);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
      }
      html[data-theme="paper"] .option:hover:not(:disabled) {
        background: #f1e4cc;
        border-color: var(--ink);
      }
      html[data-theme="paper"] #setupInfo small,
      html[data-theme="paper"] .option small {
        color: #6e5a49;
      }
      html[data-theme="paper"] .tier-legend {
        background: var(--card);
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
      }
      html[data-theme="paper"] .tier-legend span {
        color: var(--ink);
        border-color: rgba(74, 55, 40, 0.25);
      }
      html[data-theme="paper"] .muted,
      html[data-theme="paper"] .helper {
        color: #6e5a49;
      }
    `,
    override: {
      "000000": INK,
      ffffff: "#4a3728",
      "030504": "#f6efe0",
      "0f1812": "#fbf6ea",
      "0a110d": "#f8f0df",
      "070c09": "#f4ebd8",
      "7f8b83": "#7e6a58",
      "8a978e": "#6e5a49",
      aab5ad: "#5b4838",
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
      if (l > 0.55 && s < 0.35) return [28, 0.2 + s * 0.3, text(l)];
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
