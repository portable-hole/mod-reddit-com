# Cold backup of redditstatic.com modmail assets

Snapshot taken 2026-06-12 from `https://www.redditstatic.com/modmail/`. Modmail is a dead product upstream; if Reddit ever purges its CDN these files are unrecoverable, and the revival dies with them. **Nothing here is wired into the userscript** — it loads live from redditstatic, which keeps us byte-identical with what mod.reddit.com served.

| File | Source path under `/modmail/` | Loaded by |
|---|---|---|
| `Modmail.cfbbe51406254e922bc1.css` | `chunkCSS/…` | userscript `<link>` |
| `runtime~Modmail.741ddec20aaf5c2ab9f5.js` | root | clientRecover `addScript` |
| `vendors~Modmail.1757105564638be6db65.js` | root | clientRecover `addScript` |
| `Modmail.fe6613eee4e66a40913d.js` | root | clientRecover `addScript` |
| `rfont.…woff` / `.ttf` / `.eot` / `.svg` | `fonts/icon/…` | CSS `@font-face` (+ userscript base64 workaround uses the woff) |
| `favicon-16x16.png`, `favicon-32x32.png`, `android-icon-192x192.png` | `favicon/…` | userscript `<link rel=icon>` / `@icon` |

The webpack runtime has no async-chunk table — these three JS files are the complete bundle set. The CSS references only the rfont family (all four formats included) and inline data-URIs.

## If redditstatic ever 404s

Serve these from any static host (GitHub raw works) and update:

1. The `<link href=…css>` URL in the userscript's rebuilt `<head>`, plus the favicon links.
2. The three `addScript(…)` URLs in `clientRecover` (runtime, vendors, Modmail — keep that order).
3. The `RFONT_URL` constant in the userscript's font pre-loader (the base64 `@font-face` injection already sidesteps CORS, so any host works).

Caveat: the CSS hardcodes absolute `https://www.redditstatic.com/modmail/fonts/...` URLs in its `@font-face`; those will 404 too, but the userscript's injected base64 `@font-face` for `rfont` takes precedence, so icons survive without editing the CSS.
