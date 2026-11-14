(() => {
  if (!AGE.active) return;
  AGE.define({
    id: "size",
    settings: [
      {
        key: "cat",
        label: "Category",
        options: CATS.map((c) => ({ v: c.v, l: c.label })),
        default: "all",
      },
    ],
    hearts: null,
    css: `
      html.embedded #soloDiff, html.embedded .score-chip, html.embedded #scoreChip { display: none !important; }
    `,
    stop() {
      S.token++;
      closeSoloResult();
      stopAnim("solo");
    },
    revealSel: ["rv-item", "sz-art"],
    reveal: () => (R.solo ? itemRevealHTML({ t: R.solo.ti }) : ""),
    play(s) {
      ME = AGE.account(s.player);
      if (s.fresh) S.ls = {};
      S.diff = s.diff;
      S.cat = CATS.some((c) => c.v === s.cat) ? s.cat : "all";
      S.pendingLoad = false;
      startSolo();
    },
  });

  (() => {
    const showResult = showSoloResult;
    window.showSoloResult = (correct, ...rest) => {
      showResult(correct, ...rest);
      AGE.finish({ correct, points: S.lastEst || 0 });
    };
    window.nextSolo = () => {
      if (R.solo && R.solo.locked) AGE.next();
    };
    AGE.silence(() => S.lastEst);
  })();
})();
