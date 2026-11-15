# Spec Delta

## Purpose

Defines the public one-page Polish showcase site: its sections, catalogue browsing, link to the inquiry form, and its quality guarantees (parity with the approved design, accessibility, performance, privacy).

## ADDED Requirements

### Requirement: Single-page structure in Polish
The site SHALL be a single page with `lang="pl"` containing the sections hero, about (`#o-nas`), offer (`#oferta`), how to order (`#jak-zamowic`) and contact (`#kontakt`), with a navigation linking to them. All UI strings SHALL be Polish.

#### Scenario: Navigation to a section
- **WHEN** a visitor activates the "Kontakt" navigation link
- **THEN** the page scrolls smoothly to the contact section with the fixed header not covering its heading

#### Scenario: Document language and headings
- **WHEN** the page is inspected
- **THEN** the document language is `pl` and the page has exactly one `h1` with a non-skipping heading order

### Requirement: Catalogue tabs
The offer section SHALL present three tabs — plants, planters, sets — each listing items from the matching content collection with image, name, description and tag.

#### Scenario: Switching tab
- **WHEN** a visitor selects the "Donice" tab
- **THEN** the planter items are shown, the active tab is exposed to assistive technology as selected, and the grid layout matches the design (4 columns for plants/planters, 3 for sets)

### Requirement: Ask about an item
Each catalogue item SHALL offer an "ask" action that moves the visitor to the inquiry form with the message pre-filled with the item name and focuses the message field.

#### Scenario: Asking about an item
- **WHEN** a visitor activates the ask action on "Sukulenty"
- **THEN** the page scrolls to the form and the message field contains "Dzień dobry, interesuje mnie: Sukulenty. " and has focus

### Requirement: Visual parity with the approved design
The page SHALL reproduce the approved design's layout, spacing, colors, typography and interaction effects (parallax, tilt, magnetic buttons, pill navigation, scroll progress, step line, reveal) at 375, 768 and 1280 px, deviating only where technically required; deviations SHALL be listed in `PORTING_NOTES.md`.

#### Scenario: Screenshot comparison
- **WHEN** the original design and the ported page are rendered at 375, 768 and 1280 px
- **THEN** differences are limited to those documented in `PORTING_NOTES.md`

#### Scenario: Reduced motion
- **WHEN** the visitor's system requests reduced motion
- **THEN** content remains fully readable and usable (effects may be disabled)

### Requirement: No third-party runtime requests
The page SHALL load fonts, icons and images from its own origin. The only external requests permitted are the Turnstile widget (loaded lazily when the form is focused or visible) and Cloudflare Web Analytics; no cookies SHALL be set and no consent banner shown.

#### Scenario: Network log
- **WHEN** the page is loaded and scrolled to the form in a clean browser
- **THEN** no request goes to Google Fonts, a script CDN or any domain other than the site, Turnstile and Cloudflare analytics

### Requirement: Image delivery
Images SHALL be served via responsive AVIF and WebP with `srcset`/`sizes` and explicit width and height, preserving the design's aspect ratios.

#### Scenario: No layout shift from images
- **WHEN** the page loads on a throttled mobile profile
- **THEN** cumulative layout shift is below 0.1

### Requirement: Performance and caching
The page SHALL reach a Lighthouse mobile performance score of at least 90 with LCP under 2.5 s. Hashed assets under `/_astro/` SHALL be served with immutable long-lived cache headers, and responses SHALL include `Content-Security-Policy`, `X-Content-Type-Options` and `Referrer-Policy` headers.

#### Scenario: Lighthouse run
- **WHEN** Lighthouse mobile is run against the production build
- **THEN** the performance score is at least 90 and the result is documented in the README

### Requirement: Accessibility
The page SHALL use semantic landmarks, meaningful `alt` text for content images, labels for form controls, visible focus states and sufficient color contrast, without altering the visual design.

#### Scenario: Keyboard navigation
- **WHEN** a visitor tabs through the page
- **THEN** every interactive element receives a visible focus indicator in a logical order
