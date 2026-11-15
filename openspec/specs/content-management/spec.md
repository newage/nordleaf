# content-management Specification

## Purpose

Lets the shop owner edit photos, descriptions and site texts through a web CMS without a developer, with changes published to the live site.

## Requirements

### Requirement: CMS at /admin
The site SHALL expose Decap CMS at `/admin` with Polish labels for all fields, collections mirroring `plants`, `planters`, `sets` and the `site` texts, and editorial workflow disabled.

#### Scenario: Opening the CMS
- **WHEN** an authorized editor opens `/admin`
- **THEN** the CMS loads with Polish labels and lists the plants, planters, sets and site texts

### Requirement: Edits become site content
Saving an entry in the CMS SHALL commit directly to `main` of `newage/nordleaf`; image fields SHALL write files to `src/assets` and reference them by relative path, so the next build publishes the change.

#### Scenario: Editing a description
- **WHEN** the editor changes the description of a plant and publishes
- **THEN** a commit on `main` modifies the corresponding content file and the deployed site shows the new text after the automatic build

#### Scenario: Replacing a photo
- **WHEN** the editor uploads a new photo for an item
- **THEN** the file is stored under `src/assets` and the entry references it with a relative path

### Requirement: GitHub OAuth via proxy Worker
Authentication SHALL go through a separate Cloudflare Worker: `GET /auth` redirects to GitHub authorization with a `state` value, and `GET /callback` validates `state`, exchanges the code using secret credentials and returns the token to the opener window via `postMessage` in the format Decap expects. Tokens SHALL never be logged.

#### Scenario: Successful login
- **WHEN** an editor completes GitHub authorization
- **THEN** the callback returns the token to the CMS window and the editor is logged in

#### Scenario: State mismatch
- **WHEN** the callback receives a `state` that does not match the one issued
- **THEN** the Worker rejects the request and exchanges no code

### Requirement: Local editing
In local development, the CMS SHALL work against the local filesystem through Decap `local_backend`, writing correct content files without GitHub.

#### Scenario: Local edit
- **WHEN** a developer runs the local environment and edits an entry in `/admin`
- **THEN** the corresponding file in `src/content` is changed on disk
