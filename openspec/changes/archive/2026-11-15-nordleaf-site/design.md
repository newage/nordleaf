# Design

## Context

Greenfield repository (`origin` = `git@github.com:newage/nordleaf.git`, branch `main`). The source of truth for visuals is `.agents/propose/nordleaf.design/Main.dc.html` (plain CSS with custom properties, effects in a `tick()` scroll handler, content inline in `renderVals`). Stack, hosting and CMS are fixed by `.agents/propose/setup.md`; session decisions are in `decisions.md`. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Visual parity port with minimal JS and no third-party runtime requests.
- Client-editable content through collections ↔ Decap fields.
- A real, abuse-resistant inquiry form on a single server route.

**Non-Goals:**
- Redesign, cart/payments, multi-page navigation, i18n beyond Polish.
- Performing manual third-party setup (GitHub OAuth App, Turnstile, Resend, Cloudflare login, DNS): documented as a checklist only.
- GitHub Actions or any CI deploy pipeline.

## Decisions

**1. Static Astro + one dynamic route.** All pages prerender; only `src/pages/api/contact.ts` has `prerender = false` (via `@astrojs/cloudflare`). Alternative: separate form Worker — rejected: fixed by the brief and adds a deploy unit.

**2. Components.** Port the design into `.astro` components per section (Header, Hero, About, Offer with tabs, Steps, Contact, Footer). Static markup stays in components; client-editable text/media come from collections and the `site` singleton. Design CSS is kept as plain CSS in `src/styles/` (global tokens + per-component styles); no rewrite to another system.

**3. One vanilla effects script (~3 KB, `defer`).** Replaces `componentDidMount`/`tick`: scroll progress, parallax (hero, band), steps line, reveal (IntersectionObserver), tilt, magnetic buttons, pill nav, tabs, mobile menu, ask-prefill. Effects run on all devices (decision: parity over C/B alternatives); `prefers-reduced-motion` is still honored for accessibility (documented in PORTING_NOTES.md). No React island: nothing is complex enough to justify it. Scroll work is rAF-throttled and passive.

**4. Tabs without hydration cost.** All three item groups are rendered in HTML; the script toggles visibility and `aria-selected`. Works for crawlers and degrades to stacked lists if JS fails.

**5. Images.** Content collections reference images via `image()` schema; `<Picture/>` outputs AVIF + WebP with `sizes`. The design's 11 "crops" of one asset become 11 placeholder images in `src/assets/placeholders/` with the design's aspect ratios.

**6. Fonts.** `@fontsource-variable/inter-tight` and `@fontsource/instrument-serif` (no variable build exists), subset latin + latin-ext, imported in the layout; preload the critical weights. No Google Fonts link.

**7. Form route.** Order: parse multipart → honeypot → Rate Limiting binding (key = client IP header) → Turnstile siteverify → validate fields, single file type/size (magic-byte check, not just MIME) → sanitize → Resend HTTP API with attachment → JSON. A no-JS plain POST returns a minimal HTML result via `Accept` negotiation. Client script downscales to 1600 px via canvas and lazily injects Turnstile on focus/`IntersectionObserver`. Rate limit values are tuned during implementation (open in decisions.md).

**8. Decap CMS.** `public/admin/index.html` loads a self-hosted/bundled Decap build (no unpkg); `config.yml` declares `backend: github`, `repo: newage/nordleaf`, `branch: main`, `base_url` = auth Worker URL, `auth_endpoint: auth`, `local_backend: true` for dev, `publish_mode` simple, Polish labels, `media_folder: src/assets/...` with relative `public_folder`. Collections mirror the Astro content schemas (single source of field names).

**9. Auth Worker.** `workers/decap-auth` with its own `wrangler.jsonc`: `/auth` sets/records `state` (signed cookie or HMAC-signed state parameter, stateless) and redirects to GitHub; `/callback` validates `state`, exchanges the code with `GITHUB_OAUTH_ID/SECRET`, responds with the Decap `postMessage` handshake page. Scope `public_repo` or `repo` depending on repo visibility (README). No token logging.

**10. Deploy.** Two Cloudflare Workers Builds integrations on `main` (site: repo root; auth: `workers/decap-auth`). Static assets configured in `wrangler.jsonc`; `public/_headers` carries cache and security headers (CSP allows only self, Turnstile, Cloudflare analytics). A Decap commit to `main` triggers the build, so editors see changes in minutes. Alternative GitHub Actions — rejected by decision.

**11. Local dev in Docker.** `docker/Dockerfile` + `docker-compose.yml` + `docker/Makefile` (up/down/build/rebuild/console). Services: `app` (`astro dev`, :4321) and `decap` (`decap-server`, writes to the mounted repo). `wrangler dev` is run through `make console`. Turnstile test keys and a local rate-limit binding come from `.dev.vars`/`.env.example`.

**12. Verification.** Playwright (dev dependency) script captures original design and port at 375/768/1280 px and records network requests; results go to `PORTING_NOTES.md`. Lighthouse mobile result goes into the README.

## Risks / Trade-offs

- [Parity effects on mobile hurt Lighthouse/TBT] → rAF throttling, passive listeners, transform-only animations; measure early and report; if the score is below 90 raise it to the user before cutting effects.
- [CSP blocks Decap or Turnstile] → test `/admin` and the form against the real headers; use hashes/nonces only if needed.
- [Rate Limiting binding semantics in local dev] → fall back to a no-op binding locally; document.
- [Decap bundle size/external script] → self-host the pinned Decap script under `public/admin/`.
- [Resend attachments: sender domain not verified] → documented manual step; use Resend sandbox sender until the domain is set.
- [Workers Builds cannot build the nested auth Worker without root-directory config] → README checklist step.
- [Single design asset → placeholders differ from the mockup photo] → expected; real photos come from the client.

## Migration Plan

Greenfield: initial commits to `main` trigger the first deploy once the manual Cloudflare setup is done. Rollback = revert the commit on `main` or roll back the Workers deployment in the Cloudflare dashboard.

## Open Questions

- Custom domain name (needed only for README/CSP examples and the OAuth callback URL).
- Exact rate-limit numbers (per-60-s limit) — tuned at implementation.
