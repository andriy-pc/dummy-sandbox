# Design Document — calculator-ux-enhancements

## Overview

This document describes the technical design for four UX enhancement groups applied to the BTC Trading Calculator — a single-page vanilla JS/HTML/CSS application with no build tooling or frameworks.

The enhancements are purely additive or surgical removals within the three existing files (`index.html`, `style.css`, `calc.js`). No new files, modules, or dependencies are introduced.

**Enhancement groups:**

1. Help button hover highlight + modal system (Requirements 1 & 2)
2. Remove global defaults bar (Requirement 3)
3. Actual position size live display (Requirement 4)
4. Live PnL simulator polish — slider range, liquidation marker, dual PnL display (Requirements 5, 6, 7)

---

## Architecture

The application is a single HTML page with inline event handlers (`oninput`, `onclick`) wired directly to global functions in `calc.js`. There is no component framework, no module system, and no state management library.

```
index.html  ──── DOM structure, inline event handlers
    │
    └── calc.js  ──── all logic as global functions
    └── style.css ──── all visual rules
```

All changes follow this same pattern: DOM elements in `index.html`, styling in `style.css`, logic in `calc.js`.

### Data flow

```
User input (oninput / onclick)
        │
        ▼
Global function in calc.js
        │
        ├── reads DOM input values directly via $()
        ├── computes derived values
        └── writes results back to DOM element .textContent / .style
```

No intermediate state objects are maintained between calls — every function reads fresh from the DOM on each invocation.

---

## Components and Interfaces

### 1. Help Button (`.help-btn`)

Already present in `index.html` on every card header. Needs only CSS hover rules added to `style.css`.

**Hover interaction** — pure CSS, no JS:
```css
.help-btn:hover { /* brightness / border highlight */ }
```

**Click interaction** — existing `onclick="openModal('key')"` attributes already wired in HTML.

### 2. Help Modal (`#modal-overlay`)

The modal overlay and inner `#modal-title` / `#modal-body` elements already exist in `index.html`. Two JS functions need to be implemented:

```js
openModal(key)   // looks up content map, populates title/body, shows overlay
closeModal()     // hides overlay
```

**Content map** — a plain object keyed by the eight tool keys:

| Key | Card |
|---|---|
| `stop-long` | Stop-loss (Long) |
| `stop-short` | Stop-loss (Short) |
| `pnl-long` | PnL calculator (Long) |
| `pnl-short` | PnL calculator (Short) |
| `mvm` | Movement % (shared) |
| `range` | Price range (shared) |
| `slider-long` | Live PnL simulator (Long) |
| `slider-short` | Live PnL simulator (Short) |

The overlay already has `onclick="closeModal()"` and the inner `.modal` has `onclick="event.stopPropagation()"` — click-outside-to-close is already wired.

### 3. Global Defaults Bar Removal

**HTML**: Delete the `<div class="constants-bar">` block from `<header>`.

**JS**: Delete `getConst()`. Replace all call sites:
- `calcStop` — inline `leverage = parseFloat($(p+'-stop-leverage').value) || 10` and `stoploss = (parseFloat($(p+'-stop-sl').value) || 5) / 100`
- `calcPnl` — inline `leverage = parseFloat($(p+'-pnl-leverage').value) || 10`
- `calcMvm` — no leverage/possize used currently (no change needed)
- `getPositionSize` — replace `getConst().possize` fallback with literal `4000`

**CSS**: The `.constants-bar` and `.const-field` rules can remain (dead CSS is harmless) or be removed for cleanliness. Design choice: remove them to keep the stylesheet clean.

### 4. `updateActual(leverageId, posId, actualId)`

Already referenced in `index.html` on every card's `oninput` handlers. The function body needs to be implemented in `calc.js`:

```js
function updateActual(leverageId, posId, actualId) {
  const lev = parseFloat($(leverageId).value);
  const pos = parseFloat($(posId).value);
  $(actualId).textContent = (lev > 0 && pos > 0) ? fmt(lev * pos) : '—';
}
```

The `.readonly-field` elements that display the result are already in `index.html`.

### 5. `onSimInput(type)` — Slider Range Initialisation

Called on every `oninput` of the simulator's entry/leverage/pos fields. Responsibilities:

1. Call `updateActual` for the sim card's actual position field.
2. Read `entry` from `{p}-sim-entry`.
3. If `entry` is valid: set slider `min = entry * 0.80`, `max = entry * 1.20`, `value = entry` (midpoint), update axis labels, update entry tick position, update liquidation marker, call `onSlider` to refresh readout.
4. If `entry` is invalid: reset axis labels and readout to `—`.

### 6. `onSlider(type)` — Slider Drag Handler

Called on every `oninput` of the range input. Responsibilities:

1. Read current slider value as `simPrice`.
2. Read `entry`, `leverage`, `pos` from sim fields (with fallbacks).
3. Compute PnL:
   - Long: `pnl = (simPrice - entry) * (pos * leverage / entry)`
   - Short: `pnl = (entry - simPrice) * (pos * leverage / entry)`
4. Compute `pnlPct = (pnl / pos) * 100`.
5. Compute `priceChange = simPrice - entry`.
6. Write `{p}-sim-price-out`, `{p}-sim-pnl` (USD), `{p}-sim-pct` (%), `{p}-sim-chg`.
7. Apply `metric--profit` / `metric--loss` class to `{p}-sim-pnl-card`.
8. Update fill bars (`{p}-fill-loss`, `{p}-fill-profit`) widths.
9. Update liquidation marker position/visibility.

### 7. Liquidation Marker (`.slider-liq-tick`)

A new `<div class="slider-liq-tick" id="{p}-liq-tick">` element added inside `.slider-track-outer` in `index.html` for both Long and Short simulator cards.

**Position calculation:**
```
liqPct = (liqPrice - min) / (max - min) * 100
element.style.left = liqPct + '%'
element.style.display = (liqPct >= 0 && liqPct <= 100) ? 'block' : 'none'
```

**Liquidation price formulas:**
- Long: `entry * (1 - 1/leverage)`
- Short: `entry * (1 + 1/leverage)`

---

## Data Models

There are no persistent data structures. All state lives in DOM input values. The only new "data" introduced is the help content map:

```js
const HELP_CONTENT = {
  'stop-long': {
    title: 'Stop-Loss Calculator — Long',
    body:  'Calculates the stop-loss price for a long position. ...'
  },
  'stop-short': { ... },
  'pnl-long':   { ... },
  'pnl-short':  { ... },
  'mvm':        { ... },
  'range':      { ... },
  'slider-long':  { ... },
  'slider-short': { ... }
};
```

**Derived values computed on demand (not stored):**

| Value | Formula |
|---|---|
| Actual position size | `pos × leverage` |
| Slider min | `entry × 0.80` |
| Slider max | `entry × 1.20` |
| Liq price (long) | `entry × (1 − 1/leverage)` |
| Liq price (short) | `entry × (1 + 1/leverage)` |
| PnL USD (long) | `(simPrice − entry) × (pos × leverage / entry)` |
| PnL USD (short) | `(entry − simPrice) × (pos × leverage / entry)` |
| PnL % | `pnlUSD / pos × 100` |
| Liq marker left% | `(liqPrice − min) / (max − min) × 100` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Help modal content completeness

*For any* key in the set `{stop-long, stop-short, pnl-long, pnl-short, mvm, range, slider-long, slider-short}`, calling `openModal(key)` must result in the modal overlay becoming visible, `#modal-title` containing a non-empty string, and `#modal-body` containing a non-empty string that matches the `HELP_CONTENT` entry for that key.

**Validates: Requirements 2.1, 2.6**

---

### Property 2: Hard-coded fallback values

*For any* card where the leverage field is empty or zero and the position size field is empty or zero, the calculation functions (`calcStop`, `calcPnl`) must produce results equivalent to using leverage = 10 and position size = 4000, rather than NaN or zero.

**Validates: Requirements 3.3**

---

### Property 3: Actual position size display invariant

*For any* pair of leverage and position size values: if both are positive numbers, `updateActual` must set the target element's text to `fmt(leverage × posSize)`; if either is absent, zero, or negative, the element must display `"—"`.

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 4: Slider range initialisation

*For any* valid positive entry price, after `onSimInput` executes: the slider's `min` attribute must equal `entry × 0.80`, the `max` attribute must equal `entry × 1.20`, and the slider's `value` must equal `entry` (the midpoint). This must hold regardless of whether entry price was just typed or changed from a previous value.

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 5: Liquidation marker position and visibility

*For any* valid entry price and leverage ≥ 1: the liquidation price must be computed as `entry × (1 − 1/leverage)` for long and `entry × (1 + 1/leverage)` for short. If the liquidation price falls within `[entry × 0.80, entry × 1.20]`, the marker element must be visible and its `left` style must equal `(liqPrice − min) / (max − min) × 100` percent. If the liquidation price falls outside that range, the marker must be hidden.

**Validates: Requirements 6.1, 6.2, 6.3, 6.5**

---

### Property 6: Dual PnL display correctness and color coding

*For any* slider position (simulated price), entry price, leverage, and position size: `onSlider` must simultaneously display the USD PnL as `(simPrice − entry) × (pos × leverage / entry)` (long) or `(entry − simPrice) × (pos × leverage / entry)` (short) in `{p}-sim-pnl`, and the percentage PnL as `pnlUSD / pos × 100` in `{p}-sim-pct`. When PnL > 0 the card must carry class `metric--profit`; when PnL < 0 it must carry `metric--loss`. When simPrice equals entry, both values must be `$0.00` and `0.00%`. This property includes the zero/edge case.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

---

## Error Handling

All inputs are `<input type="number">` elements. Invalid or empty values parse to `NaN` via `parseFloat`. The following defensive patterns are applied consistently:

- **Fallback for leverage**: `parseFloat(el.value) || 10` — defaults to 10 when empty/NaN.
- **Fallback for position size**: `parseFloat(el.value) || 4000` — defaults to 4000 when empty/NaN.
- **Guard for entry price**: if `!entry || entry <= 0`, slider range is not set and readout shows `—`.
- **Guard for actual position field**: `updateActual` checks `lev > 0 && pos > 0` before computing; otherwise shows `—`.
- **Liquidation marker out-of-range**: marker is hidden via `display: none` when `liqPct < 0 || liqPct > 100`.
- **`calcStop` / `calcPnl` guard**: existing `alert()` guards on entry price remain; leverage/pos now use inline fallbacks instead of `getConst()`.

No exceptions are thrown; all error states are silent UI resets (show `—` or hide element).

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:

- **Unit tests** cover specific examples, structural DOM assertions, and edge cases.
- **Property tests** verify universal invariants across randomly generated inputs.

### Unit Tests (specific examples)

- `closeModal()` hides `#modal-overlay` (covers Requirements 2.3, 2.4)
- `#modal-overlay` has a `.modal-close` button child (covers Requirement 2.2)
- `.constants-bar` is absent from the rendered DOM (covers Requirement 3.1)
- `#l-stop-actual` and `#s-stop-actual` are `<div>` elements, not `<input>` (covers Requirement 4.4)
- `openModal('stop-long')` then `closeModal()` leaves overlay hidden (round-trip example)

### Property-Based Tests

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (browser-compatible, no build step required via CDN or inline bundle).

**Minimum iterations**: 100 per property.

Each property test must include a comment tag in the format:
`// Feature: calculator-ux-enhancements, Property N: <property_text>`

| Property | Test description | Arbitraries |
|---|---|---|
| P1 | For each of the 8 keys, `openModal(key)` populates non-empty title and body | `fc.constantFrom(...8 keys)` |
| P2 | `calcStop`/`calcPnl` with empty leverage/pos fields produce same result as leverage=10, pos=4000 | `fc.double({min:1000, max:200000})` for entry |
| P3 | `updateActual` with positive inputs shows `fmt(lev*pos)`; with invalid inputs shows `"—"` | `fc.double` for lev/pos, including 0 and negative |
| P4 | After `onSimInput`, slider min/max/value match ±20% formula | `fc.double({min:1000, max:200000})` for entry |
| P5 | Liquidation marker left% and visibility match formula for all entry/leverage combos | `fc.double` for entry, `fc.integer({min:1, max:200})` for leverage |
| P6 | `onSlider` USD and % PnL match formulas; color class matches sign; zero entry = zero PnL | `fc.double` for simPrice, entry, leverage, pos |

### Testing Notes

- Tests run directly in the browser against the live DOM (no test runner required for unit tests; fast-check can be loaded via CDN for property tests).
- Alternatively, pure logic functions (`updateActual`, PnL formula, liq price formula, slider range formula) can be extracted into a thin testable module and tested with Node + fast-check.
- Property tests should seed the DOM with a minimal fixture (a hidden test container) to avoid side effects on the visible UI.
