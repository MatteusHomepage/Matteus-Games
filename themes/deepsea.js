(() => {
  const cfg = {
    hue: 176,
    bgHue: 212,
    spread: 0.3,
    sat: 0.95,
    lift: 0.02,
    textSat: 0.55,
  };

  MG.theme({
    id: "deepsea",
    name: "Deep Sea",
    note: "Calm navy and teal.",
    thumbs: "deepsea",
    preview: {
      bg: "#04111d",
      surface: "#0d3350",
      accent: "#2de2c8",
      text: "#e4f6fb",
    },
    fonts:
      "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap",
    vars: MG.darkVars({
      ...cfg,
      vars: {
        "--font-body": '"Manrope", sans-serif',
        "--font-display": '"Sora", sans-serif',
        "--cf-0": "#2de2c8",
        "--cf-1": "#4aa8ff",
        "--cf-2": "#9be7ff",
        "--cf-3": "#7a8cff",
        "--cf-4": "#e4f6fb",
        "--cf-5": "#ffd37a",
        "--g-ocean-0": "#0d3350",
        "--g-ocean-1": "#08233a",
        "--g-ocean-2": "#04111d",
        "--g-land": "#1f5470",
        "--g-land-edge": "rgba(150,230,255,0.45)",
        "--g-start": "#ffd37a",
        "--g-reveal": "#2de2c8",
        "--tab-0": "120,160,185",
        "--tab-1": "228,246,251",
      },
    }),
    override: {
      "030504": "#04111d",
      "0f1812": "#0c3250",
      "0a110d": "#071f35",
      "070c09": "#051526",
    },
    color: MG.dark(cfg),
    css: `
      html[data-theme="deepsea"] .spot::before {
        background: linear-gradient(180deg, #0f4a6e 0%, #082a45 50%, #04111d 100%);
      }
      html[data-theme="deepsea"] .primary {
        background: linear-gradient(135deg, #2de2c8, #3aa0ff);
        color: #031422;
        box-shadow: 0 6px 22px rgba(45, 226, 200, 0.25);
      }
      html[data-theme="deepsea"] .primary:hover:not(:disabled) {
        background: linear-gradient(135deg, #5ff0da, #5ab5ff);
        box-shadow: 0 8px 28px rgba(45, 226, 200, 0.4);
      }
      html[data-theme="deepsea"] .mode-card,
      html[data-theme="deepsea"] .bg-card,
      html[data-theme="deepsea"] .tile,
      html[data-theme="deepsea"] .sheet {
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 10, 25, 0.45);
      }
      html[data-theme="deepsea"] .brand-text,
      html[data-theme="deepsea"] h1 {
        letter-spacing: -0.02em;
      }
    `,
  });
})();
