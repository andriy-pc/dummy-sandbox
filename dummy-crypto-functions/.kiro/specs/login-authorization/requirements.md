# Requirements Document

## Introduction

This feature adds a client-side authorization gate to the BTC Trading Calculator. On first load, the browser displays only a login screen. The main calculator page is not loaded, not injected into the DOM, and not present in any network response until the user successfully authenticates. Authentication is performed entirely in the browser using the Web Crypto API: the username and password are concatenated into a single string, SHA-256 is computed, and the result is compared against a hard-coded hash. On success, the calculator app is dynamically fetched and rendered. On failure, an inline error message is shown. The login screen shares the same dark color scheme as the main app.

## Glossary

- **Auth_Gate**: The login screen rendered on initial page load, containing the username and password fields and the login button.
- **Credential_String**: The single string formed by concatenating the username and password values entered by the user (no separator).
- **Hash_Verifier**: The client-side component that computes SHA-256 of the Credential_String using the Web Crypto API and compares it to the hard-coded expected hash.
- **Expected_Hash**: The hard-coded SHA-256 hex string embedded in the auth script that represents the correct credentials.
- **App_Loader**: The component responsible for dynamically fetching and injecting the main calculator content after successful authentication.
- **Main_App**: The full calculator interface currently defined in `index.html` and `calc.js`.

---

## Requirements

### Requirement 1: Initial Page Load Shows Only the Auth Gate

**User Story:** As a user, I want the page to show only a login form on first load, so that the calculator content is not accessible without authentication.

#### Acceptance Criteria

1. WHEN the browser loads the page, THE Auth_Gate SHALL render a login form containing a username input field, a password input field, and a login button.
2. WHEN the browser loads the page, THE Auth_Gate SHALL render no content from the Main_App — no HTML structure, no calculator scripts, and no calculator styles shall be present in the DOM or initiated as network requests.
3. THE Auth_Gate SHALL apply the same CSS custom properties (`--bg`, `--bg-card`, `--bg-input`, `--border`, `--text`, `--text-muted`, `--font`) as the Main_App so that the login screen matches the dark color scheme.

---

### Requirement 2: Credential Hashing

**User Story:** As a developer, I want credentials verified via SHA-256 client-side, so that no plaintext password is stored or transmitted.

#### Acceptance Criteria

1. WHEN the user submits the login form, THE Hash_Verifier SHALL concatenate the username field value and the password field value into a single Credential_String with no separator character between them.
2. WHEN the Credential_String is formed, THE Hash_Verifier SHALL compute the SHA-256 digest of the UTF-8 encoded Credential_String using the browser's native `crypto.subtle.digest` API.
3. THE Hash_Verifier SHALL encode the resulting digest as a lowercase hexadecimal string of exactly 64 characters.
4. THE Hash_Verifier SHALL compare the resulting hex string against the Expected_Hash value that is hard-coded in the auth script.

---

### Requirement 3: Successful Authentication Loads the Main App

**User Story:** As an authenticated user, I want the calculator to load immediately after correct credentials are entered, so that I can start using the tool without navigating to another page.

#### Acceptance Criteria

1. WHEN the computed SHA-256 hex string equals the Expected_Hash, THE App_Loader SHALL remove the Auth_Gate from the DOM.
2. WHEN the computed SHA-256 hex string equals the Expected_Hash, THE App_Loader SHALL dynamically fetch `index.html` content and inject the Main_App HTML structure into the document body.
3. WHEN the computed SHA-256 hex string equals the Expected_Hash, THE App_Loader SHALL dynamically load `calc.js` by appending a `<script>` element to the document so that all calculator functions become available.

---

### Requirement 4: Failed Authentication Shows an Error Message

**User Story:** As a user who enters wrong credentials, I want to see a clear error message, so that I know authentication failed and can try again.

#### Acceptance Criteria

1. WHEN the computed SHA-256 hex string does not equal the Expected_Hash, THE Auth_Gate SHALL display an error message below the input fields with the text "Invalid credentials".
2. WHEN the computed SHA-256 hex string does not equal the Expected_Hash, THE Auth_Gate SHALL retain the username and password input fields so the user can correct and resubmit.
3. WHEN the computed SHA-256 hex string does not equal the Expected_Hash, THE Auth_Gate SHALL NOT load any part of the Main_App into the DOM or initiate any network request for `index.html` or `calc.js`.
4. WHEN the user modifies either input field after a failed attempt, THE Auth_Gate SHALL hide the error message until the next submission.

---

### Requirement 5: Main App Content Is Never Exposed Before Auth

**User Story:** As the app owner, I want the main page source to be completely absent from the browser before authentication, so that the content cannot be accessed by inspecting network traffic or the DOM.

#### Acceptance Criteria

1. THE Auth_Gate SHALL NOT embed any Main_App HTML, inline scripts referencing `calc.js` functions, or calculator DOM elements in the initial HTML document delivered to the browser.
2. WHEN a user opens browser developer tools before authenticating, THE Auth_Gate SHALL ensure that no request for `index.html` content or `calc.js` appears in the network panel.
3. WHEN a user inspects the DOM before authenticating, THE Auth_Gate SHALL ensure that no calculator card, panel, tab, or modal element is present in the document tree.

---

### Requirement 6: Auth Gate Visual Design

**User Story:** As a user, I want the login screen to look consistent with the calculator app, so that the experience feels cohesive.

#### Acceptance Criteria

1. THE Auth_Gate SHALL display the login form centered on the page against the `--bg` background color.
2. THE Auth_Gate SHALL style the username and password inputs using the same `.field input` visual rules (background `--bg-input`, border `--border`, font `--font`, height 36px) as the Main_App inputs.
3. THE Auth_Gate SHALL style the login button using the same `.btn` base rules as the Main_App buttons, using the `--neutral` accent color (`#60a5fa`) for its border and text.
4. THE Auth_Gate SHALL display the app logo ("₿ BTC CALC") above the login form using the same logo markup and styles as the Main_App header.
5. THE Auth_Gate SHALL style the error message text using the `--loss` color (`#ef4444`) and position it below the login button.

---

### Requirement 7: Login Form Interaction

**User Story:** As a user, I want the login form to behave predictably, so that I can submit credentials efficiently.

#### Acceptance Criteria

1. WHEN the user presses the Enter key while focus is on either input field, THE Auth_Gate SHALL submit the login form as if the login button were clicked.
2. WHEN the login form is submitted with an empty username field or an empty password field, THE Auth_Gate SHALL display the error message "Invalid credentials" without performing a SHA-256 computation.
3. WHEN the page loads, THE Auth_Gate SHALL set focus to the username input field automatically.
