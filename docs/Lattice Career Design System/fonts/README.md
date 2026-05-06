# Fonts

Lattice uses three families, all loaded via Google Fonts CDN in `colors_and_type.css`:

- **Geist** — sans, weights 400/500/600/700
- **Geist Mono** — mono, weights 400/500
- **Instrument Serif** — display serif, regular + italic

No `.woff2` / `.ttf` files are bundled. The CDN copy works fine for prototypes.

## If you need self-hosted fonts

1. Download Geist + Geist Mono from <https://vercel.com/font> (free, OFL).
2. Download Instrument Serif from <https://fonts.google.com/specimen/Instrument+Serif>.
3. Drop the `.woff2` files in this folder.
4. Replace the `@import url(...)` line at the top of `colors_and_type.css` with `@font-face` declarations pointing at the local files.

## Substitution flag

The original `ai-career-api` codebase uses **Inter** + system stack. Lattice substitutes:

| Original | Lattice substitute | Available where |
| --- | --- | --- |
| Inter | Geist | Google Fonts |
| — (no display) | Instrument Serif | Google Fonts |
| — (no mono) | Geist Mono | Google Fonts |

If Geist isn't available in a particular environment, the next-best fall-backs (already wired into `--font-sans` etc.) are **Inter** → ui-sans-serif → system-ui. The visual feel will be a touch flatter but functional.
