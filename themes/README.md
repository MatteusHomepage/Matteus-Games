# Themes

Every page loads `themes/theme.js`. It reads the chosen theme from the browser (`mg_theme`) and applies it before the page paints. The Themes section at the bottom of Settings lists every theme and changes it everywhere.

## Files

- `themes.js`: the list of themes. Add a theme's id here.
- `original.js` and `original.css`: a frozen copy of the original look. Never edit these. Every color in the games is a variable named `--c-<hex>` and `original.css` holds the original value of each.
- `daylight.js`, `paper.js`, `synthwave.js`, `terminal.js`, `deepsea.js`, `contrast.js`: the other themes.
- `engine.js`: loads the themes, applies them and builds the Settings picker.

## Make a new theme

1. Copy `daylight.js` to `mytheme.js` and change `id`, `name`, `note` and `preview`.
2. Add `"mytheme"` to the list in `themes.js`.
3. Open any page with `?theme=mytheme` on the end to try it without saving it.

## What a theme can set

- `color(c)`: called once for every color in the games. `c` has `h`, `s`, `l` (hue 0-360, saturation 0-1, lightness 0-1), `hex` and `a`. Return `[h, s, l]`, a hex string, or nothing to keep the color.
- `override`: exact replacements, for example `{ "19d77b": "#ff5c35" }`. Keys are the original hex without the `#`.
- `vars`: extra CSS variables such as fonts (`--font-body`, `--font-display`) and the difficulty colors (`--easy` ... `--impossible`).
- `fonts`: a Google Fonts URL.
- `css`: extra CSS for shapes, borders and shadows. Start selectors with `html[data-theme="mytheme"]`.
- `only`: a list of game folders. The theme only shows on those pages and every other page stays Original. Remove it to roll the theme out everywhere.

## Colors drawn in JavaScript

Canvas colors can't use CSS directly. In game code, read them with `MG.v("--name", "fallback")`. The fallback is the original color, so Original never changes. A theme sets `--name` in `vars`. Border Guesser's globe already does this (`--g-*` variables). Listen for the `mg-theme` event to redraw when the theme changes.

## Dark themes in one line

`MG.dark(cfg)` returns a `color` function that moves Original's green family to a new hue and keeps its dark layout. `MG.darkVars(cfg)` returns matching globe and confetti variables. `synthwave.js`, `terminal.js` and `deepsea.js` are about 20 lines of settings each (`hue` for the accent, `bgHue` for surfaces, `spread`, `sat`, `lift`) plus a few CSS rules. Copy one of them for a quick new dark theme.

## Hub thumbnails

Add `thumbs: "mytheme"` to a theme and put images in `thumbs/mytheme/` (same file names as `thumbs/`) to give the hub tiles their own pictures. Without it the hub uses the Original ones.
