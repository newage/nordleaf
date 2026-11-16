# showcase-page Specification

## Purpose

Defines the public one-page Polish showcase site: its sections, catalogue browsing, link to the inquiry form, and its quality guarantees (parity with the approved design, accessibility, performance, privacy).

## Requirements

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
The page SHALL reproduce the approved design's layout, spacing, colors, typography and interaction effects (preloader, parallax, tilt, magnetic buttons, pill navigation, scroll progress, step line, reveal, split headings, image curtain reveal, custom cursor, scroll ticker, back-to-top, auto-hiding header) at 375, 768 and 1280 px, deviating only where technically required; deviations SHALL be listed in `PORTING_NOTES.md`.

#### Scenario: Screenshot comparison
- **WHEN** the original design and the ported page are rendered at 375, 768 and 1280 px
- **THEN** differences are limited to those documented in `PORTING_NOTES.md`

#### Scenario: Reduced motion
- **WHEN** the visitor's system requests reduced motion
- **THEN** content remains fully readable and usable, the preloader is not shown, and the cursor, ticker and decorative animations are disabled or static

### Requirement: No third-party runtime requests
The page SHALL load fonts, icons and images from its own origin. The only external requests permitted are the Turnstile widget (loaded lazily when the form is focused or visible) and Cloudflare Web Analytics; no cookies SHALL be set and no consent banner shown.

#### Scenario: Network log
- **WHEN** the page is loaded and scrolled to the form in a clean browser
- **THEN** no request goes to Google Fonts, a script CDN or any domain other than the site, Turnstile and Cloudflare analytics

### Requirement: Image delivery
Images SHALL be served via responsive AVIF and WebP with `srcset`/`sizes` and explicit width and height, preserving the design's aspect ratios. Source images SHALL be the customer-approved visuals, optimized without upscaling beyond their original resolution, and the hero and band sections SHALL use the approved main background.

#### Scenario: No layout shift from images
- **WHEN** the page loads on a throttled mobile profile
- **THEN** cumulative layout shift is below 0.1

#### Scenario: Approved visuals shown
- **WHEN** the page is rendered
- **THEN** the hero and band show the approved background, the About section shows its approved image, and every offer card (plants, planters, sets) shows its own approved image with no placeholder remaining

#### Scenario: Optimized sources
- **WHEN** the source images are inspected
- **THEN** none is a lossless PNG, none is upscaled beyond its original size, and the background is no wider than 2560 px

### Requirement: Performance and caching
The page SHALL reach a Lighthouse mobile performance score of at least 90 with LCP under 3.0 s (the full-screen preloader delays the hero by design). Hashed assets under `/_astro/` SHALL be served with immutable long-lived cache headers, and responses SHALL include `Content-Security-Policy`, `X-Content-Type-Options` and `Referrer-Policy` headers.

#### Scenario: Lighthouse run
- **WHEN** Lighthouse mobile is run against the production build
- **THEN** the performance score is at least 90, LCP is under 3.0 s and the result is documented in the README

### Requirement: Accessibility
The page SHALL use semantic landmarks, meaningful `alt` text for content images, labels for form controls, visible focus states and sufficient color contrast, without altering the visual design.

#### Scenario: Keyboard navigation
- **WHEN** a visitor tabs through the page
- **THEN** every interactive element receives a visible focus indicator in a logical order

### Requirement: Preloader on every load
The page SHALL show a full-screen preloader for about 2.2 s on every page load, then reveal the hero with the design's staged animation. The preloader SHALL need no JavaScript and SHALL NOT remain after its animation ends.

#### Scenario: Repeat visit
- **WHEN** a visitor loads the page a second time in the same session
- **THEN** the preloader is shown again and then disappears, leaving the hero visible

#### Scenario: JavaScript disabled
- **WHEN** the page is loaded without JavaScript
- **THEN** the preloader disappears on its own and all content is visible

### Requirement: Custom cursor on fine pointers
On devices with a fine pointer and without a reduced-motion preference, the page SHALL show a cursor dot and ring that follow the pointer, enlarge over links and buttons, and show a "Zobacz" label over catalogue cards. The native cursor SHALL remain usable and touch devices SHALL show no custom cursor.

#### Scenario: Hovering a card
- **WHEN** a mouse user hovers a catalogue card
- **THEN** the ring grows and shows the label "Zobacz"

#### Scenario: Touch device
- **WHEN** the page is opened on a device whose primary pointer is coarse
- **THEN** no custom cursor element is displayed

### Requirement: Split headings
Section headings SHALL animate word by word when they enter the viewport. The heading SHALL expose its full text to assistive technology as a single string and SHALL be readable without JavaScript.

#### Scenario: Heading enters the viewport
- **WHEN** the "Oferta" heading scrolls into view
- **THEN** its words rise into place in sequence

#### Scenario: Screen reader
- **WHEN** a screen reader reads a split heading
- **THEN** it announces the complete heading text once

### Requirement: Header hides on scroll down
The fixed header SHALL slide out of view when the visitor scrolls down past the first screen and SHALL return on scroll up, near the top of the page, or while the mobile menu is open.

#### Scenario: Scrolling down then up
- **WHEN** a visitor scrolls down 1000 px and then up 50 px
- **THEN** the header is hidden after the first movement and visible after the second

### Requirement: Back-to-top control
After the visitor scrolls, the page SHALL show a round back-to-top link with a ring indicating reading progress; activating it SHALL scroll to the top.

#### Scenario: Using back-to-top
- **WHEN** a visitor at the contact section activates the control
- **THEN** the page scrolls to the top and the control is hidden again

### Requirement: Scroll ticker
Between the steps and contact sections the page SHALL show two decorative outline-text rows that move horizontally in opposite directions as the page scrolls. The rows SHALL be hidden from assistive technology.

#### Scenario: Scrolling past the ticker
- **WHEN** the visitor scrolls through the page
- **THEN** the two rows shift in opposite directions in proportion to scroll progress

### Requirement: About section image with badge
The about section SHALL show a rounded image with a rotating circular text badge ("ROŚLINY • DONICE • ZESTAWY •"), which slows into a faster spin on hover. The image SHALL reveal with a curtain animation and carry editor-supplied alt text.

#### Scenario: Hovering the badge
- **WHEN** a mouse user hovers the badge
- **THEN** its text ring spins faster and the center disc tilts
