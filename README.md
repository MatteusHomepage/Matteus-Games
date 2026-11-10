# PLAYROOM

A static game hub designed to host multiple browser games in one GitHub repository and one Cloudflare Pages deployment.

## Folder structure

```text
/
├── index.html          # Landing page
├── hub.css             # Landing page styles
├── hub.js              # Reads the game catalogue
├── games.json          # The list of games shown on the landing page
└── games/
    └── graph-guesser/  # Graph Guesser (kept as its own self-contained game)
```

## Add another game

1. Create a folder inside `games/`, for example `games/number-rush/`.
2. Put that game's `index.html`, CSS, JavaScript and assets inside its folder. Use relative paths for its own files.
3. Open `games.json` and add one object to the array:

```json
{
  "title": "Number Rush",
  "description": "A quick mental-maths challenge.",
  "category": "PUZZLE · MATH",
  "status": "PLAY NOW",
  "href": "games/number-rush/",
  "featured": false,
  "number": "02",
  "art": "default",
  "symbol": "＋"
}
```

4. Commit and push. The new game appears on the home page automatically.

`href` is the path opened when someone clicks the game. Keep game files inside their own folder so styles, scripts and images do not conflict with other games.

## Deploy with GitHub + Cloudflare Pages

- Keep this folder's contents at the root of the GitHub repository (so the root `index.html` is the landing page).
- In Cloudflare Pages, connect the same repository.
- For a plain HTML/CSS/JS project, use no build command and set the output directory to `/` (or leave it as the repository root, depending on the Pages setup screen).
- Every game is then available under the same domain, for example `/games/graph-guesser/`.

Graph Guesser loads its public Our World in Data CSV datasets from the internet, so gameplay needs an internet connection.
