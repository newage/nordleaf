локальна розробка в докері, папка docker з Makefile з up/down/build/rebuild/console, на проді розгортання без докера через github actions.
# Project: Nordleaf — one-page showcase site with inquiry form

## Goal
Single-page, photo-first website for a plant & planter shop (Poland, content in Polish).
No cart, no payments. Visitor browses plants / planters / ready sets and sends an inquiry.
Client must be able to edit photos and descriptions later via CMS without a developer.

## Fixed decisions (do NOT change or ask)
- Framework: Astro (latest stable), TypeScript, static output.
- Styling: plain CSS with custom properties (no Tailwind, no UI framework).
- Images: `astro:assets` (<Picture/>), AVIF+WebP, srcset/sizes, width/height always set.
- Fonts: self-hosted via @fontsource-variable, subset latin + latin-ext (Polish diacritics). No Google Fonts.
- Hosting: Cloudflare Workers with static assets (NOT Vercel, NOT Netlify).
- Content: Astro Content Collections (`plants`, `planters`, `sets`, plus `site` singleton for texts).
- CMS: Decap CMS at `/admin`, GitHub backend, custom OAuth proxy Worker (see below).
- Form: server route in the Astro project, `export const prerender = false`, via @astrojs/cloudflare. Everything else is prerendered.
- Spam protection: Cloudflare Turnstile (verified server-side) + hidden honeypot field + basic rate limiting.
- Email: Resend API (key in secret). Photo attachment up to 5 MB (jpg/png/webp), validated server-side.
- Analytics: Cloudflare Web Analytics only (no cookies, no consent banner).
- `<html lang="pl">`. UI strings in Polish; code, comments, commits in Polish.

## Existing design (source of truth)
The design is already built as HTML + React scripts, located in `.agents/propose/nordleaf.design`.
Your job is to PORT it into the Astro project with visual parity, not to redesign it.
Do not change layout, spacing, colors, typography or copy structure unless it is
technically required

### Porting rules
1. Static React components -> `.astro` components (no React runtime for static UI).
2. Interactivity: first try vanilla JS in a small `<script>`. Use a React island
   (`@astrojs/react`, `client:visible` or `client:idle`, never `client:load` unless
   needed) only where state logic is genuinely complex (e.g. gallery/lightbox).
   Target: the final page ships as little JS as possible.
3. Remove anything that exists only because the design was generated as a prototype:
   CDN scripts (React/ReactDOM UMD, Babel standalone, Tailwind Play CDN, unpkg/esm.sh),
   `type="text/babel"`, inline mock data, console logs, fake submit handlers.
4. No external requests at runtime (fonts, icons, images). Self-host fonts, inline or
   bundle SVG icons.
5. Styling: keep the design's existing approach (if it uses Tailwind, install Tailwind
   properly via the Astro integration with purge; if plain CSS, keep it). Do NOT rewrite
   styles into a different system.
6. Images: replace placeholder URLs/stock images with local files in `src/assets`
   rendered via `<Picture/>`. Keep original aspect ratios and set width/height.
7. Text and media that the client must edit move out of the markup into content
   collections / `site` singleton and are bound to Decap fields. Layout text that is
   not meant to change can stay in the components.
8. Replace the mock form handler with the real implementation (see Form spec).
9. Semantic HTML and accessibility pass: landmarks, one h1, heading order, alt text,
   labels, focus states, color contrast. Fix without changing the visual look.

### Verification
- Render the original `/design` and the ported page at 375, 768, 1280 px and compare
  screenshots; report differences in `PORTING_NOTES.md`.
- Check that no CDN or third-party domain appears in the network log.

## Form spec
Fields: name (required), email (required), phone (optional), message (required),
optional image upload (interior photo). Client-side: downscale image to max 1600px
before upload. Server-side: verify Turnstile token, check honeypot, validate types/sizes,
sanitize input, send email, return JSON. Show success/error states without page reload.
Works without JS as plain POST fallback if feasible.

## Repo layout
src/content/{plants,planters,sets}/*.md, src/content/site/*.yaml, src/assets/,
src/components/, src/pages/index.astro, src/pages/api/contact.ts, src/styles/,
public/admin/{index.html,config.yml}, workers/decap-auth/ (separate Worker, own wrangler.jsonc),
wrangler.jsonc, .env.example, README.md

## Decap CMS
- Config in public/admin/config.yml, collections mirror the content collections,
  image fields write to src/assets and reference relative paths.
- backend: github, repo/branch from env or README, `base_url` = auth Worker URL, `auth_endpoint: auth`.
- Use editorial workflow OFF (simple publish to main).
- Polish labels in the admin UI for all fields.

## Auth Worker (workers/decap-auth)
Minimal Cloudflare Worker: GET /auth redirects to GitHub OAuth authorize (scope `repo`
or `public_repo` as appropriate), GET /callback exchanges code for token using
GITHUB_OAUTH_ID / GITHUB_OAUTH_SECRET secrets and returns it to the opener via postMessage
in the format Decap expects. Based on the known open-source decap-proxy approach.
Validate `state`. Never log tokens.

## Performance & quality targets
Lighthouse mobile >= 90 (target 95+), LCP < 2.5s, CLS < 0.1.
Zero JS by default; only small scripts for menu, form, lazy Turnstile (load on form focus/visibility).
`_headers`: immutable long cache for /_astro/*, sane security headers (CSP, X-Content-Type-Options, Referrer-Policy).

## Secrets and config
Never commit secrets. Provide `.env.example` and README listing:
TURNSTILE_SITE_KEY (public), TURNSTILE_SECRET_KEY, RESEND_API_KEY, CONTACT_TO_EMAIL,
GITHUB_OAUTH_ID, GITHUB_OAUTH_SECRET. Use `wrangler secret put` for secrets.

## What you must NOT do yourself (stop and list as manual steps)
- Create/register the GitHub OAuth App, Turnstile widget, Resend account/domain, Cloudflare login.
- Touch DNS or the custom domain.
- Add real secrets to any file.
  Produce an exact step-by-step checklist for the human for each of these.

## Placeholder content
Logo, photos and copy come from the client later. Use clearly marked placeholders
(Polish lorem-style texts, neutral placeholder images) and sample entries in each collection.

## Definition of done
- `npm run build` passes with no warnings; `npx wrangler dev` runs locally.
- Form works locally with Turnstile test keys; honeypot and oversize/invalid file are rejected.
- Decap `/admin` loads locally (use local_backend for dev) and edits write correct files.
- Lighthouse mobile run documented in README.
- README covers: local dev, deploy, env/secrets, how the client edits content, how to rotate keys.
- Work in small commits; stop and ask only if a fixed decision above is technically impossible.