(() => {
  if (!AGE.active) return;
  const RARE_USED = new Set();

  AGE.define({
    id: "rare",
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
        default: "general",
      },
    ],
    hearts: { byDiff: { ...HEARTS }, max: 30 },
    css: `
      html.embedded #soloDots, html.embedded #soloRound, html.embedded #soloMatchBox, html.embedded #soloDiff { display: none !important; }
    `,
    reveal: () =>
      R.solo
        ? `<div class="rg-reveal-q">${esc(R.solo.it.q)}</div>` +
          answerRevealHTML(R.solo.it)
        : "",
    settle: () =>
      new Promise((resolve) => {
        const t0 = Date.now();
        const tick = () => {
          const hold = $("soloResult").classList.contains("hold");
          if (!hold || Date.now() - t0 > 14000) return setTimeout(resolve, 900);
          setTimeout(tick, 150);
        };
        tick();
      }),
    stop() {
      S.token++;
      stopRoundTimer("solo");
      stopScene();
      closeSoloResult();
      resetSearch("solo");
    },
    play(s) {
      ME = AGE.account(s.player);
      if (s.fresh) RARE_USED.clear();
      const hearts = s.hearts || HEARTS[s.diff];
      S.token++;
      closeSoloResult();
      stopConfetti();
      stopRoundTimer("solo");
      M = {
        diff: s.diff,
        cat: CAT[s.cat] ? s.cat : "general",
        round: 0,
        score: 0,
        hearts,
        maxHearts: hearts,
        rounds: [],
        used: RARE_USED,
      };
      showView("gameView");
      nextQuestion();
    },
  });

  (() => {
    const soloEnd0 = soloEnd;
    window.soloEnd = (kind, info) => {
      soloEnd0(kind, info);
      const last = M && M.rounds[M.rounds.length - 1];
      AGE.pending = {
        correct: kind === "correct",
        points: last ? last.pts : 0,
      };
    };
    const showResult = showSoloResult;
    window.showSoloResult = (kind, info, secs) => {
      showResult(kind, info, secs);
      const done = () =>
        AGE.finish(AGE.pending || { correct: false, points: 0 });
      setTimeout(done, kind === "correct" ? 600 : 0);
    };
    window.nextSolo = () => {
      if (
        R.solo &&
        R.solo.locked &&
        !$("soloResult").classList.contains("hold")
      )
        AGE.next();
    };
    AGE.silence(() => 0);
  })();
})();
