# Project Structure

## File Layout

```
/
├── login.html       # Entry point — auth gate only, loads auth.js
├── app.html         # Calculator app — loaded dynamically after successful auth
├── auth.js          # Auth logic — SHA-256 credential verification + dynamic app loading
├── style.css        # All visual rules — single stylesheet, no imports except Google Fonts
├── calc.js          # All logic — single script, appended dynamically by auth.js after auth
└── .kiro/
    ├── specs/       # Feature specs (requirements, design, tasks)
    └── steering/    # These steering files
```

No subdirectories for source files. Everything lives at the root.

## app.html Conventions

- One `<div class="modal-overlay">` at the top of `<body>` for the shared help modal
- Tab buttons inside `.tabs`, each calling `switchTab('long')` / `switchTab('short')`
- Two panels: `#panel-long` and `#panel-short`; the inactive one carries `class="hidden"`
- Each calculator tool is a `<div class="card">` inside the active panel
- Card structure:
  ```html
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">…</h2>
      <span class="card-badge card-badge--{long|short}">…</span>
      <button class="help-btn" onclick="openModal('{key}')">?</button>
    </div>
    <!-- field-grid, inputs, button, results -->
  </div>
  ```
- Event handlers are inline `oninput` / `onclick` attributes — no `addEventListener` in JS
- `<script src="calc.js">` is NOT a static tag in `app.html` — it is appended dynamically by `auth.js` after successful authentication

## Element ID Naming

IDs follow the pattern `{panel}-{card}-{field}` where:
- `{panel}` = `l` (long) or `s` (short)
- `{card}` = `stop`, `pnl`, `mvm`, `pm`, `sim`
- `{field}` = descriptive suffix (`entry`, `leverage`, `pos`, `sl`, `actual`, `range`, etc.)

Examples: `l-stop-entry`, `s-pnl-leverage`, `l-sim-range`, `s-liq-tick`

Result/output elements follow `{panel}-{abbrev}-{output}`:
- `l-sr-price`, `l-pr-pnl`, `l-mr-pct`, `l-pm-upper`, `l-sim-pnl`

## calc.js Conventions

- `'use strict';` at the top
- `$(id)` helper wraps `document.getElementById` — always use this, never query by class in logic code
- `fmt(n)` formats a number as a USD string — use for all dollar outputs
- `fmtUnit(n)` formats a number as a plain decimal (6 decimal places) — use for asset unit amounts
- `showResults(id)` adds `.visible` to a results container — call at the end of each `calc*` function
- `updateActual(leverageId, posId, actualId)` — shared helper for live actual-position display
- Functions are grouped by feature with a section comment banner:
  ```js
  /* ─── Section name ───────────────────────────────────────────────────────── */
  ```
- Each `calc*` / `on*` function takes `type` (`'long'` or `'short'`) and derives `p = type[0]` for ID prefixing
- Fallback values are inlined at the read site: `|| 10` for leverage, `|| 4000` for position size, `|| 5` for stop-loss %

## style.css Conventions

- `:root` block at the top defines all CSS custom properties (colours, radii, font)
- Sections separated by comment banners matching the JS style
- Section order:
  1. Reset & base
  2. Google Font import
  3. App shell / header / main
  4. Tabs
  5. Panel / card
  6. Fields
  7. Help modal
  8. Read-only display field
  9. Buttons
  10. Help button
  11. Results / metrics
  12. Status badge
  13. Simulator slider
  14. Responsive overrides (`@media`)
- Dynamic positioning (e.g. tick `left`, fill bar `width`) is set via `element.style.*` in JS — not in CSS
