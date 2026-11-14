(() => {
  const Y = 54;
  const greenish = (h) => h >= 100 && h <= 190;

  MG.theme({
    id: "contrast",
    name: "High Contrast",
    note: "Black, white and yellow. Easy to read.",
    thumbs: "contrast",
    preview: {
      bg: "#000000",
      surface: "#1a1a1a",
      accent: "#ffe600",
      text: "#ffffff",
    },
    fonts:
      "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap",
    vars: {
      "--scheme": "dark",
      "--font-body": '"Atkinson Hyperlegible", sans-serif',
      "--font-display": '"Atkinson Hyperlegible", sans-serif',
      "--easy": "#3dff7a",
      "--medium": "#ffe600",
      "--hard": "#ff9d1a",
      "--expert": "#ff5252",
      "--impossible": "#d28aff",
      "--green": "#3dff7a",
      "--red": "#ff5252",
      "--cf-0": "#ffe600",
      "--cf-1": "#ffffff",
      "--cf-2": "#3dff7a",
      "--cf-3": "#4dc3ff",
      "--cf-4": "#ff5252",
      "--cf-5": "#ff9d1a",
      "--g-ocean-0": "#000000",
      "--g-ocean-1": "#000000",
      "--g-ocean-2": "#000000",
      "--g-glow-0": "rgba(255,230,0,0)",
      "--g-glow-1": "rgba(255,230,0,0)",
      "--g-glow-2": "rgba(255,230,0,0)",
      "--g-shade-0": "rgba(0,0,0,0)",
      "--g-shade-1": "rgba(0,0,0,0)",
      "--g-shade-2": "rgba(0,0,0,0)",
      "--g-rim": "#ffffff",
      "--g-land": "#2b2b2b",
      "--g-land-edge": "#ffffff",
      "--g-state-edge": "#000000",
      "--g-start": "#ffe600",
      "--g-green": "#3dff7a",
      "--g-yellow": "#ffe600",
      "--g-red": "#ff5252",
      "--g-reveal": "#3dff7a",
      "--g-pill": "#000000",
      "--g-pill-text": "#ffffff",
      "--g-light-text": "#000000",
      "--tab-0": "200,200,200",
      "--tab-1": "255,230,0",
    },
    override: {
      "030504": "#000000",
      "0f1812": "#000000",
      "0a110d": "#000000",
      "070c09": "#000000",
      "7f8b83": "#d6d6d6",
      "8a978e": "#e0e0e0",
      aab5ad: "#f0f0f0",
    },
    color(c) {
      const { h, s, l } = c;
      if (l < 0.3) return [0, 0, l * 0.5];
      if (greenish(h) && s > 0.3) return [Y, 1, l > 0.75 ? 0.82 : 0.55];
      if (l > 0.55 && s < 0.5) return [0, 0, Math.max(0.86, l)];
      if (l >= 0.3 && s < 0.4) return [0, 0, 0.82];
      return [h, Math.max(s, 0.8), Math.max(l, 0.6)];
    },
    css: `
      html[data-theme="contrast"] .spot {
        display: none;
      }
      html[data-theme="contrast"] :focus-visible {
        outline: 3px solid #ffe600;
        outline-offset: 2px;
      }
      html[data-theme="contrast"] .mode-card,
      html[data-theme="contrast"] .bg-card,
      html[data-theme="contrast"] .tile,
      html[data-theme="contrast"] .sheet,
      html[data-theme="contrast"] .hub-btn,
      html[data-theme="contrast"] .user-card,
      html[data-theme="contrast"] .back,
      html[data-theme="contrast"] .score-chip,
      html[data-theme="contrast"] .stat-tile,
      html[data-theme="contrast"] .option,
      html[data-theme="contrast"] .cat-tile,
      html[data-theme="contrast"] .dd-btn,
      html[data-theme="contrast"] .skip-btn,
      html[data-theme="contrast"] .pill,
      html[data-theme="contrast"] input:not([type="range"]):not([type="checkbox"]),
      html[data-theme="contrast"] select {
        border-color: #fff;
        box-shadow: 0 0 0 1px #fff;
        background-color: #000;
        color: #fff;
      }
      html[data-theme="contrast"] .mode-card:hover,
      html[data-theme="contrast"] .tile:hover,
      html[data-theme="contrast"] .option:hover:not(:disabled),
      html[data-theme="contrast"] .cat-tile:hover {
        border-color: #ffe600;
        box-shadow: 0 0 0 1px #ffe600;
      }
      html[data-theme="contrast"] .primary {
        background: #ffe600;
        color: #000;
        border: 1px solid #fff;
        box-shadow: 0 0 0 1px #fff;
        font-weight: 700;
      }
      html[data-theme="contrast"] .primary:disabled,
      html[data-theme="contrast"] button:disabled {
        opacity: 0.55;
      }
      html[data-theme="contrast"] .pill.sel,
      html[data-theme="contrast"] .cat-tile.sel,
      html[data-theme="contrast"] .tab.sel {
        background: #ffe600;
        color: #000;
        border-color: #fff;
      }
      html[data-theme="contrast"] .cat-tile.sel small,
      html[data-theme="contrast"] .cat-tile.sel * {
        color: #000;
      }
      html[data-theme="contrast"] .res-next {
        background: #ffe600;
        color: #000;
        border: 1px solid #fff;
      }
    `,
  });
})();
