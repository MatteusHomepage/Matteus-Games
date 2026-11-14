(() => {
  const cfg = {
    hue: 40,
    bgHue: 34,
    spread: 0.2,
    sat: 0.95,
    lift: 0,
    textSat: 0.85,
  };

  MG.theme({
    id: "terminal",
    name: "Terminal",
    note: "Amber text on a CRT.",
    thumbs: "terminal",
    preview: {
      bg: "#0a0702",
      surface: "#2a1d05",
      accent: "#ffb000",
      text: "#ffd98a",
    },
    fonts:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap",
    vars: MG.darkVars({
      ...cfg,
      vars: {
        "--font-body": '"IBM Plex Mono", monospace',
        "--font-display": '"IBM Plex Mono", monospace',
        "--cf-0": "#ffb000",
        "--cf-1": "#ffd060",
        "--cf-2": "#ff7a00",
        "--cf-3": "#a8ff60",
        "--cf-4": "#ffe9b8",
        "--cf-5": "#8a5a00",
        "--g-ocean-0": "#1a1204",
        "--g-ocean-1": "#120d03",
        "--g-ocean-2": "#0a0702",
        "--g-land": "#3a2808",
        "--g-land-edge": "rgba(255,176,0,0.5)",
        "--g-start": "#ffd98a",
        "--g-reveal": "#a8ff60",
        "--tab-0": "160,120,50",
        "--tab-1": "255,217,138",
      },
    }),
    override: {
      "030504": "#0a0702",
      "0f1812": "#1c1304",
      "0a110d": "#120c03",
      "070c09": "#0d0903",
      ffffff: "#ffe3a3",
    },
    color: MG.dark(cfg),
    css: `
      html[data-theme="terminal"] body::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9999;
        background:
          repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.22) 0 1px, transparent 1px 3px),
          radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.45) 100%);
      }
      html[data-theme="terminal"] .mode-card,
      html[data-theme="terminal"] .bg-card,
      html[data-theme="terminal"] .tile,
      html[data-theme="terminal"] .sheet,
      html[data-theme="terminal"] .primary,
      html[data-theme="terminal"] .pill,
      html[data-theme="terminal"] .dd-btn,
      html[data-theme="terminal"] .dd-menu,
      html[data-theme="terminal"] .skip-btn,
      html[data-theme="terminal"] input,
      html[data-theme="terminal"] select,
      html[data-theme="terminal"] .hub-btn,
      html[data-theme="terminal"] .user-card,
      html[data-theme="terminal"] .back,
      html[data-theme="terminal"] .score-chip,
      html[data-theme="terminal"] .cat-tile,
      html[data-theme="terminal"] .stat-tile,
      html[data-theme="terminal"] .option,
      html[data-theme="terminal"] .res-next {
        border-radius: 2px;
      }
      html[data-theme="terminal"] .mode-card,
      html[data-theme="terminal"] .bg-card,
      html[data-theme="terminal"] .tile,
      html[data-theme="terminal"] .sheet {
        border-color: rgba(255, 176, 0, 0.45);
        box-shadow: 0 0 16px rgba(255, 176, 0, 0.08);
      }
      html[data-theme="terminal"] .primary {
        letter-spacing: 0.02em;
        box-shadow: 0 0 14px rgba(255, 176, 0, 0.35);
      }
      html[data-theme="terminal"] h1,
      html[data-theme="terminal"] h2,
      html[data-theme="terminal"] .brand-text {
        text-shadow: 0 0 12px rgba(255, 176, 0, 0.5);
        letter-spacing: -0.02em;
      }
    `,
  });
})();
