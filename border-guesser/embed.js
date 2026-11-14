(() => {
  if (!AGE.active) return;
  const BORDER_HEARTS = { ...HEARTS };

  AGE.define({
    id: "border",
    settings: [
      {
        key: "scope",
        label: "Continent",
        options: REGIONS.map((r) => ({ v: r.v, l: r.label })),
        default: "all",
      },
    ],
    hearts: { byDiff: { ...BORDER_HEARTS }, max: 30 },
    css: `
      html.embedded #soloDiff, html.embedded .score-chip, html.embedded #scoreChip { display: none !important; }
    `,
    prepare: () => ensureGlobe("solo").catch(() => {}),
    stop() {
      S.token++;
      closeSoloResult();
      resetSearch("solo");
    },
    play(s) {
      ME = AGE.account(s.player);
      if (s.fresh) S.ls = {};
      S.diff = s.diff;
      S.scope = REGIONS.some((r) => r.v === s.scope) ? s.scope : "all";
      S.pendingLoad = false;
      HEARTS[s.diff] = s.hearts || BORDER_HEARTS[s.diff];
      startSolo();
    },
  });

  (() => {
    const showResult = showSoloResult;
    window.showSoloResult = (correct, ...rest) => {
      showResult(correct, ...rest);
      AGE.finish({ correct, points: correct ? S.lastEst : 0 });
    };
    window.nextSolo = () => {
      if (R.solo && R.solo.locked) AGE.next();
    };
    AGE.silence(() => S.lastEst);
  })();
})();
