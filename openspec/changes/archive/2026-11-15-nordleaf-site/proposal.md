# Proposal

## Why

Nordleaf (a plant and planter shop in Poland) needs a fast, photo-first showcase site where visitors browse plants, planters and ready sets and send an inquiry — no cart, no payments. The shop owner must be able to change photos and descriptions herself. The approved design exists only as a React prototype (CDN scripts, mock data, fake submit), so it cannot be published as is. Source of decisions: `decisions.md`.

## What Changes

- Port the existing design (`.agents/propose/nordleaf.design`) into a new Astro project (TypeScript, static output) with visual parity; no layout/color/typography redesign.
- Keep all design effects (parallax, tilt, magnetic buttons, pill nav, progress bar, step line, reveal) in one small vanilla script, no React runtime.
- Move client-editable text and media into Content Collections (`plants`, `planters`, `sets`, `site` singleton), with placeholder content.
- Add a real inquiry form: server route, Turnstile, honeypot, rate limiting (Cloudflare Rate Limiting binding), Resend email with one optional photo (≤5 MB).
- Add Decap CMS at `/admin` (GitHub backend `newage/nordleaf`, branch `main`, editorial workflow off) with a separate OAuth proxy Worker (`workers/decap-auth`).
- Self-host fonts and icons; no third-party runtime requests except Turnstile (loaded lazily) and Cloudflare Web Analytics.
- Add Docker-based local development (`docker/Makefile`: up/down/build/rebuild/console; services `app` and `decap`).
- Deploy both Workers via Cloudflare Workers Builds (no GitHub Actions); manual setup steps documented in README.
- Add security/cache headers, README, `.env.example`, `PORTING_NOTES.md`.

## Capabilities

### New Capabilities
- `showcase-page`: the public single-page Polish site — sections, catalogue tabs, "ask about this item" prefill, visual parity, accessibility, performance and no-third-party-request guarantees.
- `inquiry-form`: submitting an inquiry (fields, optional photo, spam protection, rate limiting, email delivery, success/error states, no-JS fallback).
- `content-management`: client-side editing of collections and site texts through Decap CMS and GitHub OAuth, resulting in a published update.

### Modified Capabilities
<!-- none: greenfield project, no existing specs -->

## Impact

- New code: whole Astro project (`src/`, `public/admin/`, `workers/decap-auth/`, `docker/`, `wrangler.jsonc`, `README.md`, `.env.example`).
- Dependencies: Astro, `@astrojs/cloudflare`, `@fontsource*`, Decap CMS (CDN-free bundle or self-hosted), Resend API (HTTP).
- External systems (manual setup by a human): GitHub OAuth App, Cloudflare Turnstile widget, Resend account/domain, Cloudflare Workers Builds for two Workers, DNS/custom domain.
