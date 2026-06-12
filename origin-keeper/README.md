# Modmail Origin Keeper

Tiny Firefox (MV2) companion extension for the `mod.reddit.com revived (integrated)` userscript.

## Why it exists

Reddit's server answers every `mod.reddit.com` request with a redirect to `www.reddit.com/mail/*`. A userscript cannot stop an HTTP redirect — it only runs in the redirect's *target* document — so the revived modmail UI normally lives at `www.reddit.com/mail/*`.

That works, but two things key on the **real** `mod.reddit.com` origin and cannot be fooled by page JavaScript:

- **Toolbox** — `extension/data/util/platform.ts` activates its New Mod Mail module only when `location.host === 'mod.reddit.com'`
- **Stylus** (or any styler) rules scoped to `mod.reddit.com`

This extension strips the `Location` header from 3xx responses on `https://mod.reddit.com/mail/*` (main frame only). Firefox then renders the empty redirect body *at the mod.reddit.com origin*, where the userscript fires at `document-start` and rebuilds the old modmail UI. Toolbox and Stylus see the origin they expect. As a bonus, the modmail icon font loads natively (redditstatic's CORS policy whitelists mod.reddit.com), so the userscript's base64 font workaround becomes a no-op.

Everything else (auth, API calls) is origin-independent and keeps working exactly as before.

## Install

1. Load it:
   - **Temporary (per session):** `about:debugging` → This Firefox → Load Temporary Add-on → pick `manifest.json`. Gone after a restart.
   - **Permanent:** sign it unlisted at [AMO](https://addons.mozilla.org/developers/) (`web-ext sign` or upload the zipped folder; takes minutes), then install the signed `.xpi`. Firefox ESR/Developer Edition users can instead set `xpinstall.signatures.required = false` and install the zip directly.
2. In the Tampermonkey menu on a modmail page, choose **"Modmail host: use mod.reddit.com"**.
3. Visit modmail — the address bar should stay on `mod.reddit.com/mail/...`.

If the extension is missing or disabled, nothing breaks: the userscript's redirect loop-breaker notices the server redirect won and falls back to rendering at `www.reddit.com` for that session.

## Scope and safety

- Only touches `https://mod.reddit.com/mail/*`, only top-level navigations, only 3xx responses.
- No data collection, no remote code, ~30 lines.
