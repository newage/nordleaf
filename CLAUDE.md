# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Nordleaf: a single-page Polish-language storefront for plants and planters with an enquiry form. Astro (static prerender) on Cloudflare Workers. Documentation (README, PORTING_NOTES, OpenSpec artifacts) is written in Ukrainian; site copy and CMS labels are Polish.

## Commands

- `npm run dev` — dev server (`predev` copies Decap CMS into `public/admin/vendor`); use `npx decap-server` alongside for local `/admin`
- `npm run build` / `npm run preview`
- `npm run check` — `astro check` (types)
- `npm test` — vitest (covers `src/**/*.test.ts` and `workers/**/*.test.ts`); single file: `npx vitest run src/lib/validate-contact.test.ts`
- Docker env: `cd docker && make up|down|console|build|rebuild` (site on :4321). After replacing/changing any image file run `make rebuild-frontend` — dev caches `/_image` responses in `.wrangler/state/v3/cache` (miniflare), which survives restarts and serves stale AVIF/WebP; browser cache/incognito is not the cause.
- To verify real response headers (CSP in `public/_headers`) use `npm run build && npx wrangler dev`; `astro dev` doesn't apply `_headers`.
- Local secrets: `cp .dev.vars.example .dev.vars` (test Turnstile keys only — Astro copies `.dev.vars` into `dist/server/`, so never put real secrets there). Set `RESEND_API_URL` to a mock server to avoid real Resend calls.

## Architecture

- **Single page**: `src/pages/index.astro` composes section components from `src/components/` inside `src/layouts/Base.astro`. Styles are per-section CSS in `src/styles/`; client JS is only vanilla scripts in `src/scripts/` (`effects.ts`, `contact-form.ts`) — no UI framework runtime.
- **Content**: Astro Content Collections defined in `src/content.config.ts`. `plants`, `planters`, `sets` are markdown catalogues sharing one schema (`name, desc, tag, image, alt, order`). `site` is one YAML file per section (`src/content/site/<id>.yaml`), validated by per-section schemas in `src/lib/site-schemas.ts` and read via `getSite(id)` in `src/lib/site.ts`. Adding/renaming a field means updating the Zod schema, the content files **and** `public/admin/config.yml` (Decap collections) together.
- **Decap CMS** (`public/admin/`): GitHub backend, `publish_mode: simple` — a CMS save is a commit to `main`, which triggers a rebuild. Uploaded images go to `src/assets/uploads/` and are referenced by relative path so Astro's `<Picture/>` generates AVIF/WebP. Placeholder photos live in `src/assets/placeholders/` (sizes in README).
- **Only dynamic route**: `src/pages/api/contact.ts` (`prerender = false`) delegates to `src/lib/contact-handler.ts`: rate limit (`CONTACT_LIMITER` binding in `wrangler.jsonc`, skipped if absent) → multipart validation (`validate-contact.ts`, image sniffing, ≤5 MB) → Turnstile (`turnstile.ts`) → Resend email. Responds JSON when `Accept: application/json`, otherwise a minimal HTML page (no-JS fallback). Form fields: `name, phone, message, image`.
- **Two separate Workers**: `nordleaf` (site + API, root `/`) and `nordleaf-decap-auth` (`workers/decap-auth/`, GitHub OAuth proxy for Decap, own `wrangler.jsonc`/package). Deployed by Cloudflare Workers Builds from `main` (no GitHub Actions). `TURNSTILE_SITE_KEY` / `CF_ANALYTICS_TOKEN` are build-time public vars; other secrets are Worker secrets (table in README).
- Headings are split into word spans at build time (`SplitHeading.astro` + `lib/split-words.ts`) with `aria-label` on the heading — keep this when editing headings (axe has 0 violations).
- `public/admin/config.yml` still contains `AUTH-WORKER-DOMAIN` / `SITE-DOMAIN` placeholders until the first-launch checklist in README is done; contact placeholders like `[NUMER TELEFONU]` intentionally render as non-clickable text.

## Process

Changes go through OpenSpec (`openspec/specs/` are current specs; `openspec/changes/archive/` holds past changes with `decisions.md`). `.claude/skills` and `.claude/commands/opsx` provide the explore/propose/apply/archive workflow. `.agents/propose/` holds the original design prototype and briefs; `PORTING_NOTES.md` lists deliberate deviations of the port from that design.
