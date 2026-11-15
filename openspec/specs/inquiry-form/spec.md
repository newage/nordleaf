# inquiry-form Specification

## Purpose

Defines how a visitor sends an inquiry (with an optional interior photo) from the site, how spam and abuse are blocked, and how the inquiry reaches the shop by email.

## Requirements

### Requirement: Inquiry fields and validation
The form SHALL accept name (required), email (required), phone (optional), message (required) and one optional image. The server SHALL validate all inputs and sanitize text before using it in the email.

#### Scenario: Missing required field
- **WHEN** a request omits the email or message
- **THEN** the server responds with a 4xx JSON error naming the invalid field and sends no email

#### Scenario: Valid inquiry
- **WHEN** a request with valid name, email and message passes all checks
- **THEN** the server sends an email to the configured recipient and responds with a JSON success result

### Requirement: Optional photo upload
The form SHALL accept at most one image of type jpg, png or webp up to 5 MB. The client SHALL downscale the image to a maximum of 1600 px on its longer side before upload; the server SHALL re-validate type and size and attach the image to the email.

#### Scenario: Oversize or invalid file
- **WHEN** a request contains a file larger than 5 MB or of another type
- **THEN** the server rejects it with a 4xx JSON error and sends no email

#### Scenario: Large photo selected
- **WHEN** the visitor selects a 4000 px wide photo
- **THEN** the uploaded image is at most 1600 px on its longer side

### Requirement: Spam protection
The server SHALL verify a Cloudflare Turnstile token, reject requests with a filled honeypot field, and rate-limit requests per client using the Cloudflare Rate Limiting binding.

#### Scenario: Invalid Turnstile token
- **WHEN** the token is missing or fails server-side verification
- **THEN** the request is rejected and no email is sent

#### Scenario: Honeypot filled
- **WHEN** the hidden honeypot field has a value
- **THEN** the request is rejected without sending an email

#### Scenario: Rate limit exceeded
- **WHEN** one client exceeds the configured request limit within the window
- **THEN** the server responds with HTTP 429 and sends no email

### Requirement: Feedback without page reload
With JavaScript enabled, the form SHALL submit without reloading the page and show distinct success and error states; without JavaScript it SHALL still work as a plain POST with a readable result page where feasible.

#### Scenario: Successful submit
- **WHEN** the visitor submits a valid form
- **THEN** a success message replaces the form without a page reload

#### Scenario: Server error
- **WHEN** the server responds with an error
- **THEN** an error message is shown and the entered data is kept

### Requirement: Lazy Turnstile loading
The Turnstile script SHALL load only when the form receives focus or becomes visible.

#### Scenario: Page load without interacting with the form
- **WHEN** the page loads and the form is not visible or focused
- **THEN** no Turnstile request is made

### Requirement: Secrets never exposed
Secret keys (Turnstile secret, Resend API key, recipient address) SHALL be read from server-side secrets only; only the Turnstile site key MAY reach the client.

#### Scenario: Built output inspection
- **WHEN** the production client bundle is searched for secret values
- **THEN** none are found
