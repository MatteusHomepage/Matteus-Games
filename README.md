# Graph Guesser

A small browser game: study the visible part of a real historical graph, draw the missing section, then compare your guess with the data.

## Run it

The game uses JavaScript modules and fetches public CSV data, so do not open `index.html` directly as a `file://` URL.

1. Extract the folder.
2. Open a terminal in the `graph-guesser` folder.
3. Run `python -m http.server 8000`.
4. Open `http://localhost:8000`.

You can also upload the contents of this folder to a static host such as Cloudflare Pages. Keep `index.html` at the site root.

## Data and loading

Graphs are loaded from Our World in Data's public Grapher CSV files. Four candidate datasets are requested at once; each request has a nine-second timeout. The first valid response is used. If no graph can be loaded, it shows an error and a retry button instead of staying on the loading screen.

An internet connection is required to load new graphs.
