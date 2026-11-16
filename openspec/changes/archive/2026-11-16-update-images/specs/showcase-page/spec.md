## MODIFIED Requirements

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
