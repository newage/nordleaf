## MODIFIED Requirements

### Requirement: Visual parity with the approved design
The page SHALL reproduce the approved design's layout, spacing, colors, typography and interaction effects (preloader, parallax, tilt, magnetic buttons, pill navigation, scroll progress, step line, reveal, split headings, image curtain reveal, custom cursor, scroll ticker, back-to-top, auto-hiding header) at 375, 768 and 1280 px, deviating only where technically required; deviations SHALL be listed in `PORTING_NOTES.md`.

#### Scenario: Screenshot comparison
- **WHEN** the original design and the ported page are rendered at 375, 768 and 1280 px
- **THEN** differences are limited to those documented in `PORTING_NOTES.md`

#### Scenario: Reduced motion
- **WHEN** the visitor's system requests reduced motion
- **THEN** content remains fully readable and usable, the preloader is not shown, and the cursor, ticker and decorative animations are disabled or static

### Requirement: Performance and caching
The page SHALL reach a Lighthouse mobile performance score of at least 90 with LCP under 3.0 s (the full-screen preloader delays the hero by design). Hashed assets under `/_astro/` SHALL be served with immutable long-lived cache headers, and responses SHALL include `Content-Security-Policy`, `X-Content-Type-Options` and `Referrer-Policy` headers.

#### Scenario: Lighthouse run
- **WHEN** Lighthouse mobile is run against the production build
- **THEN** the performance score is at least 90, LCP is under 3.0 s and the result is documented in the README

## ADDED Requirements

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
