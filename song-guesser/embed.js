(() => {
  if (!AGE.active) return;
  AGE.define({
    id: "song",
    modes: {
      key: "mode",
      label: "Game mode",
      options: [
        {
          v: "type",
          l: "Type the answer",
          s: "No hearts, one guess at a time",
          h: 150,
          ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>',
        },
        {
          v: "click",
          l: "Click the answer",
          s: "Pick from four, hearts apply",
          h: 214,
          ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3.5v11l3-2.5 2.2 5 2.3-1-2.2-5H18z"/></svg>',
        },
      ],
      default: ["type"],
    },
    settings: [],
    hearts: {
      modes: ["click"],
      byDiff: {
        easy: CLICK_LIVES,
        medium: CLICK_LIVES,
        hard: CLICK_LIVES,
        expert: CLICK_LIVES,
        impossible: CLICK_LIVES,
      },
      max: 9,
    },
    css: `
      html.embedded #soloDiff, html.embedded .score-chip, html.embedded #scoreChip { display: none !important; }
    `,
    revealSel: ["reveal"],
    reveal: () => (S.track ? revealHTML(S.track) : ""),
    prepare: (s) => loadTracks(s.diff).catch(() => {}),
    pick: async (s) => {
      FORCED = null;
      await loadTracks(s.diff);
      const track = pickTrack(s.diff);
      if (!track) return null;
      return {
        track,
        options: s.mode === "click" ? makeOptions(track, s.diff) : null,
      };
    },
    stop() {
      S.token++;
      closeSoloResult();
      clips.solo.stop();
    },
    play(s) {
      ME = AGE.account(s.player);
      AGE.def.lives = s.hearts || CLICK_LIVES;
      if (s.fresh) S.ls = {};
      S.diff = s.diff;
      S.pendingLoad = false;
      FORCED = s.pick || null;
      startSolo(s.mode);
    },
  });

  let FORCED = null;

  (() => {
    const pickTrack0 = pickTrack;
    window.pickTrack = (level) => {
      if (!FORCED) return pickTrack0(level);
      markRecent(FORCED.track);
      return FORCED.track;
    };
    const makeOptions0 = makeOptions;
    window.makeOptions = (track, level) => {
      if (!FORCED || !FORCED.options) return makeOptions0(track, level);
      const options = FORCED.options;
      FORCED = null;
      return options;
    };
    const newRound = newSoloRound;
    window.newSoloRound = () => {
      newRound();
      FORCED = null;
      if (S.mode === "click" && S.track) {
        S.lives = AGE.def.lives;
        setLives("solo", S.lives);
      }
    };
    const showResult = showSoloResult;
    window.showSoloResult = (correct, ...rest) => {
      showResult(correct, ...rest);
      AGE.finish({ correct, points: correct ? S.lastEst : 0 });
    };
    window.nextSolo = () => {
      if (S.locked) AGE.next();
    };
    AGE.silence(() => S.lastEst);
  })();
})();
