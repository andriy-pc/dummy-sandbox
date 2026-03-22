# Crypto Calc

A browser-based trading calculator for leveraged long and short positions. No build step, no dependencies, no server required.

## Features

- **Stop-loss calculator** — stop price, distance, loss per unit, and total loss
- **PnL calculator** — leveraged profit/loss in USD and as % of collateral
- **Movement % calculator** — price change from entry with position status and liquidation warning
- **Price range calculator** — upper/lower targets from entry + move %
- **Live PnL simulator** — drag a slider across ±20% of entry; liquidation marker shown on track
- **Long / Short tabs** — all tools available for both directions

## Usage

Serve the files from any static HTTP server (required for `fetch` and `crypto.subtle`):

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080/login.html`.

> `crypto.subtle` requires a secure context (HTTPS or localhost). Opening `login.html` directly as a `file://` URL will not work.

## Auth

Login is handled client-side via SHA-256. The expected hash in `auth.js` is the SHA-256 of `username + password` concatenated.

To set your own credentials, run this in a browser console on an HTTPS page:

```js
const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourusernamepassword'));
console.log(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
```

Replace `EXPECTED_HASH` in `auth.js` with the output.

## File Structure

```
/
├── login.html   # Entry point — auth gate
├── app.html     # Calculator UI — loaded dynamically after auth
├── auth.js      # SHA-256 credential check + dynamic app loading
├── calc.js      # All calculator logic
└── style.css    # Single stylesheet (IBM Plex Mono via Google Fonts)
```

## Stack

Plain HTML5, CSS3, and ES6+ JavaScript. No frameworks, no bundler, no npm.
