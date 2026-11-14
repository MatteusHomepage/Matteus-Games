(() => {
  const cfg = {
    hue: 328,
    bgHue: 268,
    spread: 0.4,
    sat: 1,
    lift: 0.04,
    textSat: 0.5,
  };

  MG.theme({
    id: "synthwave",
    name: "Synthwave",
    note: "Neon pink on a purple night.",
    thumbs: "synthwave",
    preview: {
      bg: "#0c0420",
      surface: "#2a0f4d",
      accent: "#ff2e97",
      text: "#fbe9ff",
    },
    fonts:
      "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Rubik:wght@400;500;600;700&display=swap",
    vars: MG.darkVars({
      ...cfg,
      vars: {
        "--font-body": '"Rubik", sans-serif',
        "--font-display": '"Chakra Petch", sans-serif',
        "--cf-0": "#ff2e97",
        "--cf-1": "#ff8a3d",
        "--cf-2": "#ffe14d",
        "--cf-3": "#00e5ff",
        "--cf-4": "#b46bff",
        "--cf-5": "#ffffff",
        "--g-ocean-0": "#2a0f4d",
        "--g-ocean-1": "#1b0838",
        "--g-ocean-2": "#0e0422",
        "--g-land": "#4a2275",
        "--g-land-edge": "rgba(255,120,200,0.55)",
        "--g-glow-0": "rgba(255,46,151,0.28)",
        "--g-start": "#ffe14d",
        "--g-reveal": "#00e5ff",
        "--tab-0": "170,140,210",
        "--tab-1": "255,233,255",
      },
    }),
    override: {
      "030504": "#0c0420",
      "0f1812": "#2a0a4a",
      "0a110d": "#1c0638",
      "070c09": "#110326",
    },
    color: MG.dark(cfg),
    css: `
      html[data-theme="synthwave"] body {
        background-image:
          linear-gradient(180deg, transparent 62%, rgba(255, 46, 151, 0.16) 100%),
          repeating-linear-gradient(90deg, rgba(255, 46, 151, 0.2) 0 1px, transparent 1px 56px),
          repeating-linear-gradient(0deg, rgba(255, 46, 151, 0.2) 0 1px, transparent 1px 28px);
        background-size: 100% 100%, 100% 26vh, 100% 26vh;
        background-position: 0 0, 0 100%, 0 100%;
        background-repeat: no-repeat;
        background-attachment: fixed;
      }
      html[data-theme="synthwave"] .spot::before {
        background: linear-gradient(180deg, #3a0f66 0%, #230847 55%, #130329 100%);
      }
      html[data-theme="synthwave"] .primary {
        background: linear-gradient(90deg, #ff2e97, #ff8a3d);
        color: #1a0633;
        box-shadow: 0 0 18px rgba(255, 46, 151, 0.45);
      }
      html[data-theme="synthwave"] .primary:hover:not(:disabled) {
        background: linear-gradient(90deg, #ff4aa8, #ff9d5c);
        box-shadow: 0 0 28px rgba(255, 46, 151, 0.7);
      }
      html[data-theme="synthwave"] .mode-card,
      html[data-theme="synthwave"] .bg-card,
      html[data-theme="synthwave"] .tile,
      html[data-theme="synthwave"] .sheet {
        border-color: rgba(255, 46, 151, 0.45);
        box-shadow: 0 0 22px rgba(255, 46, 151, 0.12);
      }
      html[data-theme="synthwave"] .mode-card:hover,
      html[data-theme="synthwave"] .tile:hover {
        border-color: #ff2e97;
        box-shadow: 0 0 30px rgba(255, 46, 151, 0.35);
      }
      html[data-theme="synthwave"] h1,
      html[data-theme="synthwave"] h2,
      html[data-theme="synthwave"] .brand-text {
        text-shadow: 0 0 22px rgba(255, 46, 151, 0.55);
      }
      html[data-theme="synthwave"] .pill.sel,
      html[data-theme="synthwave"] .cat-tile.sel {
        box-shadow: 0 0 16px rgba(255, 46, 151, 0.45);
      }
    `,
  });
})();
