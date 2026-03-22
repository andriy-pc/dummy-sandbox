# Implementation Plan: calculator-ux-enhancements

## Overview

Incremental implementation across three files (`index.html`, `style.css`, `calc.js`). Each task builds on the previous, ending with the simulator fully wired. No build tooling — plain vanilla JS/HTML/CSS.

## Tasks

- [x] 1. Add help button hover styles to style.css
  - Add `.help-btn:hover` rule with a distinct highlight (e.g. increased brightness, border color change)
  - Ensure the default `.help-btn` style is unchanged when not hovered
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement help modal logic in calc.js
  - [x] 2.1 Define `HELP_CONTENT` map with all 8 keys (`stop-long`, `stop-short`, `pnl-long`, `pnl-short`, `mvm`, `range`, `slider-long`, `slider-short`), each with a non-empty `title` and `body`
    - _Requirements: 2.1, 2.6_
  - [x] 2.2 Implement `openModal(key)` — looks up `HELP_CONTENT[key]`, sets `#modal-title` and `#modal-body`, shows `#modal-overlay`
    - _Requirements: 2.1, 2.5_
  - [x] 2.3 Implement `closeModal()` — hides `#modal-overlay`
    - _Requirements: 2.3, 2.4_
  - [ ]* 2.4 Write property test for help modal content completeness (Property 1)
    - **Property 1: Help modal content completeness**
    - For each of the 8 keys, `openModal(key)` must make the overlay visible and populate non-empty title and body matching `HELP_CONTENT`
    - Use `fc.constantFrom(...8 keys)`
    - **Validates: Requirements 2.1, 2.6**
    - `// Feature: calculator-ux-enhancements, Property 1: Help modal content completeness`

- [x] 3. Remove global defaults bar
  - [x] 3.1 Delete the `<div class="constants-bar">` block from `index.html`
    - _Requirements: 3.1_
  - [x] 3.2 Delete `getConst()` and `getPositionSize()` from `calc.js`; inline fallbacks directly in `calcStop` (`leverage || 10`, `stoploss || 5%`, `pos || 4000`) and `calcPnl` (`leverage || 10`, `pos || 4000`)
    - _Requirements: 3.2, 3.3_
  - [x] 3.3 Remove `.constants-bar` and `.const-field` CSS rules from `style.css`
    - _Requirements: 3.1_
  - [ ]* 3.4 Write property test for hard-coded fallback values (Property 2)
    - **Property 2: Hard-coded fallback values**
    - `calcStop`/`calcPnl` with empty leverage/pos fields must produce results equivalent to leverage=10, pos=4000
    - Use `fc.double({min: 1000, max: 200000})` for entry price
    - **Validates: Requirements 3.3**
    - `// Feature: calculator-ux-enhancements, Property 2: Hard-coded fallback values`

- [x] 4. Implement `updateActual()` and readonly field styles
  - [x] 4.1 Add `.readonly-field` CSS rules to `style.css` (styled display div, visually distinct from editable inputs)
    - _Requirements: 4.4_
  - [x] 4.2 Implement `updateActual(leverageId, posId, actualId)` in `calc.js` — reads both fields, sets `fmt(lev * pos)` when both are positive, otherwise sets `"—"`
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 4.3 Write property test for actual position size display invariant (Property 3)
    - **Property 3: Actual position size display invariant**
    - Positive lev+pos → `fmt(lev * pos)`; zero/negative/absent → `"—"`
    - Use `fc.double` for lev/pos including 0 and negative values
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - `// Feature: calculator-ux-enhancements, Property 3: Actual position size display invariant`

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement `onSimInput(type)` — slider range initialisation
  - Implement `onSimInput(type)` in `calc.js`:
    - Call `updateActual` for the sim card's actual position field
    - Read `entry` from `{p}-sim-entry`
    - If valid: set slider `min = entry * 0.80`, `max = entry * 1.20`, `value = entry`; update `{p}-sim-low` and `{p}-sim-high` axis labels; position entry tick; call `onSlider(type)`
    - If invalid: reset axis labels and readout to `"—"`
  - _Requirements: 5.1, 5.2, 5.3_
  - [ ]* 6.1 Write property test for slider range initialisation (Property 4)
    - **Property 4: Slider range initialisation**
    - After `onSimInput`, slider `min` = `entry × 0.80`, `max` = `entry × 1.20`, `value` = `entry`
    - Use `fc.double({min: 1000, max: 200000})` for entry
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - `// Feature: calculator-ux-enhancements, Property 4: Slider range initialisation`

- [x] 7. Add liquidation marker DOM element and CSS
  - [x] 7.1 Add `<div class="slider-liq-tick" id="l-liq-tick"></div>` inside `.slider-track-outer` in the Long simulator card in `index.html`; repeat for Short (`id="s-liq-tick"`)
    - _Requirements: 6.4_
  - [x] 7.2 Add `.slider-liq-tick` CSS rules to `style.css` — absolutely positioned, visually distinct from `.slider-entry-tick` (different color or label)
    - _Requirements: 6.4_

- [x] 8. Implement `onSlider(type)` — full slider drag handler
  - Implement `onSlider(type)` in `calc.js`:
    - Read `simPrice` from slider value, `entry`/`leverage`/`pos` from sim fields (with fallbacks)
    - Compute PnL USD (long: `(simPrice - entry) * (pos * leverage / entry)`; short: `(entry - simPrice) * (pos * leverage / entry)`)
    - Compute `pnlPct = (pnl / pos) * 100`
    - Write `{p}-sim-price-out`, `{p}-sim-pnl` (USD with sign), `{p}-sim-pct` (% with sign), `{p}-sim-chg`
    - Apply `metric--profit` / `metric--loss` to `{p}-sim-pnl-card`
    - Update fill bar widths (`{p}-fill-loss`, `{p}-fill-profit`)
    - Compute liq price (long: `entry * (1 - 1/leverage)`; short: `entry * (1 + 1/leverage)`), compute `liqPct = (liqPrice - min) / (max - min) * 100`, set `{p}-liq-tick` left% and display
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]* 8.1 Write property test for liquidation marker position and visibility (Property 5)
    - **Property 5: Liquidation marker position and visibility**
    - Liq price within `[entry × 0.80, entry × 1.20]` → marker visible, `left` = `(liqPrice - min) / (max - min) * 100%`; outside range → hidden
    - Use `fc.double` for entry, `fc.integer({min: 1, max: 200})` for leverage
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
    - `// Feature: calculator-ux-enhancements, Property 5: Liquidation marker position and visibility`
  - [ ]* 8.2 Write property test for dual PnL display correctness and color coding (Property 6)
    - **Property 6: Dual PnL display correctness and color coding**
    - USD PnL and % PnL match formulas; `metric--profit` when PnL > 0, `metric--loss` when PnL < 0; simPrice = entry → `$0.00` and `0.00%`
    - Use `fc.double` for simPrice, entry, leverage, pos
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
    - `// Feature: calculator-ux-enhancements, Property 6: Dual PnL display correctness and color coding`

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) loaded via CDN; seed the DOM with a minimal hidden fixture to avoid side effects on the visible UI
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each logical group
