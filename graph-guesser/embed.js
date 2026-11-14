(() => {
  if (!AGE.active) return;
  const GRAPH_USED = new Set();

  AGE.define({
    id: "graph",
    settings: () => [
      {
        key: "cat",
        label: "Category",
        options: CATS.map((c) => ({
          v: c.k,
          l: c.n,
          s: c.s,
          h: c.h,
          ic: c.ic,
        })),
        default: "mix",
      },
    ],
    hearts: null,
    css: `
      html.embedded #soloDots, html.embedded #soloRound, html.embedded #soloMatchBox, html.embedded #soloDiff { display: none !important; }
    `,
    prepare: (s) => {
      const cat = !CAT[s.cat] || s.cat === "mix" ? randCat() : s.cat;
      const id = pickTopic(cat, s.diff, GRAPH_USED);
      if (id) loadGraph(id).catch(() => {});
    },
    stop() {
      S.token++;
      stopRoundTimer("solo");
      stopAnim("solo");
      closeSoloResult();
    },
    play(s) {
      ME = AGE.account(s.player);
      if (s.fresh) GRAPH_USED.clear();
      S.token++;
      closeSoloResult();
      stopConfetti();
      stopRoundTimer("solo");
      stopAnim("solo");
      M = {
        diff: s.diff,
        cat: CAT[s.cat] ? s.cat : "mix",
        round: 0,
        score: 0,
        rounds: [],
        used: GRAPH_USED,
        next: null,
      };
      showView("gameView");
      nextGraph();
    },
  });

  (() => {
    const showResult = showSoloResult;
    window.showSoloResult = (kind, r) => {
      showResult(kind, r);
      const ok = kind === "done";
      AGE.finish({ correct: ok && r.m >= 0.55, points: ok ? r.pts : 0 });
    };
    window.nextSolo = () => {
      if (R.solo && R.solo.locked && $("soloResult").style.display === "block")
        AGE.next();
    };
    AGE.silence(() => 0);
  })();
})();
