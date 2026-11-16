## ADDED Requirements

### Requirement: About image editable in CMS
The `site` collection's about entry SHALL include an image and its alt text, both editable in the CMS with Polish labels; the image SHALL be stored under `src/assets` and referenced by relative path.

#### Scenario: Replacing the about photo
- **WHEN** the editor uploads a new photo and alt text for the about section and publishes
- **THEN** a commit on `main` updates `about.yaml` with the relative image path and alt, and the next build shows the new photo
