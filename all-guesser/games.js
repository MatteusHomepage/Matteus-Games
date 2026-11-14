const ICON = (path) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const AG_GAMES = [
  {
    id: "song",
    title: "Song Guesser",
    tag: "Music",
    url: "../song-guesser/index.html",
    icon: ICON('<path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" />'),
  },
  {
    id: "border",
    title: "Border Guesser",
    tag: "Geography",
    url: "../border-guesser/index.html",
    icon: ICON(
      '<circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />',
    ),
  },
  {
    id: "rare",
    title: "Rare Guesser",
    tag: "Trivia",
    url: "../rare-guesser/index.html",
    icon: ICON(
      '<path d="M12 3.5 19 10l-7 10.5L5 10z" /><path d="M5 10h14M9.5 10 12 3.5 14.5 10M9.5 10 12 20.5 14.5 10" />',
    ),
  },
  {
    id: "size",
    title: "Size Guesser",
    tag: "Sense of scale",
    url: "../size-guesser/index.html",
    icon: ICON('<path d="M5 19L19 5M11 5h8v8M13 19H5v-8" />'),
  },
  {
    id: "graph",
    title: "Graph Guesser",
    tag: "Trends",
    url: "../graph-guesser/index.html",
    icon: ICON(
      '<path d="M3 4v16h18" /><path d="M7 15l4-5 3 3 5-6" /><path d="M16 7h3v3" />',
    ),
  },
];
