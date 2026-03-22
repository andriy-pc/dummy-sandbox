# Implementation Plan: Login Authorization

## Overview

Add a client-side SHA-256 auth gate to the BTC Trading Calculator. The entry point becomes `login.html`; the existing `index.html` is renamed to `app.html`. On successful credential verification, `auth.js` dynamically fetches and injects `app.html` into the DOM. No storage of any kind is used — auth state lives only in the call stack.

## Tasks

- [x] 1. Rename index.html → app.html and strip the calc.js script tag
  - Rename `index.html` to `app.html`
  - Remove the `<script src="calc.js"></script>` line from the bottom of `app.html` (auth.js appends it dynamically after injection)
  - _Requirements: 3.2, 3.3, 5.1_

- [x] 2. Create login.html — the auth gate entry point
  - Create `login.html` at the project root
  - Include only: `<link rel="stylesheet" href="style.css">`, the auth gate markup (logo, form with username input, password input, login button, error span), and `<script src="auth.js">` at end of body
  - No reference to `calc.js`, `app.html`, or any calculator markup
  - IDs needed: `auth-username`, `auth-password`, `auth-submit`, `auth-error`
  - Logo markup mirrors the existing `.logo` structure from `app.html`
  - _Requirements: 1.1, 1.2, 6.1, 6.2, 6.3, 6.4, 6.5, 7.3_

- [x] 3. Create auth.js — credential hashing and dynamic app loading
  - Create `auth.js` at the project root; `'use strict';` at top; plain JS, no modules
  - Define `EXPECTED_HASH` constant with a clearly commented placeholder (developer replaces with their actual SHA-256 hex)
  - Implement `hashCredentials(username, password)` — concatenates `username + password` (no separator), UTF-8 encodes via `TextEncoder`, calls `crypto.subtle.digest('SHA-256', buffer)`, returns lowercase 64-char hex string
  - Implement `handleSubmit(event)` — reads inputs, guards empty fields (show error, return early without hashing), calls `hashCredentials`, compares to `EXPECTED_HASH`, calls `loadApp()` or `showError()`
  - Implement `loadApp()` — `fetch('app.html')`, parse via `DOMParser`, extract body innerHTML, replace `document.body.innerHTML`, append `<script src="calc.js">` to `document.body`; wrap in try/catch — on failure restore auth gate and show error
  - Implement `showError()` / `hideError()` — toggle visibility of `#auth-error`
  - On `DOMContentLoaded`: focus `#auth-username`; attach `keydown` Enter listeners to both inputs; attach `input` listeners to both inputs to call `hideError()`
  - Guard `crypto.subtle` availability (undefined on non-HTTPS); show error if unavailable
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 7.1, 7.2, 7.3_

  - [ ]* 3.1 Write property test for hashCredentials output format (Property 2)
    - **Property 2: SHA-256 hex output is always 64 lowercase hex characters**
    - Use `fc.string()` → call `hashCredentials` → assert `length === 64` and `/^[0-9a-f]+$/`
    - Tag: `// Feature: login-authorization, Property 2: Hash output is always 64 lowercase hex chars`
    - **Validates: Requirements 2.3**

  - [ ]* 3.2 Write property test for credential string concatenation (Property 3)
    - **Property 3: Credential string is strict concatenation with no separator**
    - Use `fc.string() × fc.string()` → assert `credentialString === u + p`
    - Tag: `// Feature: login-authorization, Property 3: Credential string is strict concatenation`
    - **Validates: Requirements 2.1**

  - [ ]* 3.3 Write property test for known-answer SHA-256 correctness (Property 4)
    - **Property 4: SHA-256 produces correct known-answer output**
    - Assert empty string hashes to `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
    - Tag: `// Feature: login-authorization, Property 4: Known-answer SHA-256 correctness`
    - **Validates: Requirements 2.2**

  - [ ]* 3.4 Write property test for wrong credentials never loading app (Property 5)
    - **Property 5: Wrong credentials never trigger app loading**
    - Use `fc.string() × fc.string()` filtered to exclude correct creds → assert no fetch called, no app DOM injected
    - Tag: `// Feature: login-authorization, Property 5: Wrong credentials never load app`
    - **Validates: Requirements 4.3, 5.2**

  - [ ]* 3.5 Write property test for empty field rejection (Property 6)
    - **Property 6: Empty field submissions are rejected without hashing**
    - Use `fc.oneof(fc.constant(''), fc.string())` for each field with at least one empty → assert `crypto.subtle.digest` not called
    - Tag: `// Feature: login-authorization, Property 6: Empty fields rejected without hashing`
    - **Validates: Requirements 7.2**

  - [x] 3.6 Write unit tests for auth.js pure logic in tests.js
    - Follow the existing pattern in `tests.js`: `'use strict'`, `require('assert/strict')`, `suite()` / `test()` / `assertClose()` helpers, Node-runnable with no browser dependencies
    - Extract and test only the pure, synchronous helper logic from `auth.js` — mirror the same approach used for `stopPrice`, `pnl`, `movement`, etc. in `tests.js`
    - Add a `suite('buildCredentialString')` block: test that `username + password` concatenation produces the correct string for known inputs (e.g. `'alice' + 'secret'` → `'alicesecret'`), that an empty username yields just the password, and that an empty password yields just the username
    - Add a `suite('hexFromBuffer')` block: test the `ArrayBuffer` → lowercase hex conversion helper with known byte sequences (e.g. `[0x00]` → `'00'`, `[0xff]` → `'ff'`, `[0xde, 0xad]` → `'dead'`)
    - Add a `suite('isEmptyCredential')` block: test the empty-field guard — both empty, only username empty, only password empty, both non-empty
    - Do NOT attempt to call `crypto.subtle`, `fetch`, or any DOM API in `tests.js` — those require a browser context and cannot run in Node
    - _Requirements: 2.1, 2.3, 7.2_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Extend style.css with auth gate styles
  - Append a new `/* ─── Auth gate ─────────────────────────────────────────────────────────── */` section to `style.css` after the existing rules
  - Add `.auth-wrap` — full-viewport flex centering (`min-height: 100vh`, `display: flex`, `align-items: center`, `justify-content: center`)
  - Add `.auth-card` — centered card using `--bg-card`, `--border`, `--radius-lg`, same padding as `.card`
  - Add `.auth-logo` — reuses `.logo` flex layout
  - Add `.auth-error` — `color: var(--loss)`, `display: none` by default, font-size 12px
  - Add `.btn--auth` — extends `.btn` base, border and text color use `--neutral` (`#60a5fa`)
  - Use only existing CSS custom properties from `:root`; no new custom properties
  - _Requirements: 1.3, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 5.1 Write property test for initial DOM isolation (Property 1)
    - **Property 1: Initial DOM contains no app content**
    - Parse `login.html` as a string; assert no `.card`, `#panel-long`, `calc.js`, `app.html` references appear
    - Tag: `// Feature: login-authorization, Property 1: Initial DOM has no app content`
    - **Validates: Requirements 1.2, 5.1, 5.3**

- [x] 6. Update CloudFormation — change default root object to login.html
  - In `cloudformation/cloudfront-setup.yaml`, change `DefaultRootObject: index.html` to `DefaultRootObject: login.html`
  - _Requirements: 1.1_

- [x] 7. Update steering document — reflect new file structure
  - In `.kiro/steering/structure.md`, update the File Layout section to replace `index.html` with `login.html` (entry point, auth gate), `app.html` (calculator app, loaded after auth), and `auth.js` (auth logic)
  - Update the `index.html Conventions` section heading and references to reflect that the calculator markup now lives in `app.html`
  - Note that `<script src="calc.js">` is no longer a static tag in `app.html` — it is appended dynamically by `auth.js` after successful authentication

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `EXPECTED_HASH` in `auth.js` is a placeholder constant — the developer must replace it with the SHA-256 hex of their actual `username + password` string
- Property tests use fast-check via CDN in `tests.js`; minimum 100 iterations per property
- No sessionStorage, localStorage, or cookies — auth state is ephemeral (call stack only)
- `crypto.subtle` requires HTTPS; the guard in `auth.js` handles non-secure origins gracefully
