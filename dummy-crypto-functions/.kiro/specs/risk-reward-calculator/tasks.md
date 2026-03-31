# Implementation Plan: Risk/Reward Calculator

## Overview

Add a Risk/Reward Ratio Calculator card to both the Long and Short panels. All changes land in three existing files: `app.html`, `calc.js`, and `tests.js`. No new files are created.

## Tasks

- [x] 1. Add pure helper functions to `calc.js`
  - Add `rrRisk(entryPrice, stopPrice, positionSize, leverage)` — computes `(|entry − stop| / entry) × pos × leverage`
  - Add `rrReward(entryPrice, takeProfitPrice, positionSize, leverage)` — computes `(|entry − tp| / entry) × pos × leverage`
  - Add `rrRatio(reward, risk)` — returns `reward / risk` as a number, or `null` when risk is zero
  - Add `rrVerdict(ratio)` — returns verdict string based on thresholds (< 1.0, 1.0–1.5, 1.5–2.0, ≥ 2.0)
  - Place under a new `/* ─── 8. Risk/reward calculator ─── */` section banner, following existing style
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 1.1 Write unit tests for `rrRisk`
    - Mirror `rrRisk` verbatim in the helpers block at the top of `tests.js`
    - Add `suite('rrRisk')` covering: typical long/short inputs, zero stop distance, scaling linearity
    - _Requirements: 6.1, 6.6_

  - [ ]* 1.2 Write unit tests for `rrReward`
    - Mirror `rrReward` verbatim in the helpers block at the top of `tests.js`
    - Add `suite('rrReward')` covering: typical inputs, zero TP distance, scaling linearity
    - _Requirements: 6.2, 6.6_

  - [ ]* 1.3 Write unit tests for `rrRatio`
    - Mirror `rrRatio` verbatim in the helpers block at the top of `tests.js`
    - Add `suite('rrRatio')` covering: typical ratio, risk = 0 returns null, reward = 0, scale-invariance property (reward × k, risk × k yields same ratio)
    - _Requirements: 1.3, 6.3, 6.5, 6.6_

  - [ ]* 1.4 Write unit tests for `rrVerdict`
    - Mirror `rrVerdict` verbatim in the helpers block at the top of `tests.js`
    - Add `suite('rrVerdict')` covering: all four verdict bands, exact boundary values (1.0, 1.5, 2.0), value just below each boundary
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.4, 6.6_

- [x] 2. Checkpoint — run tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Add `HELP_CONTENT` entries and `calcRR` DOM driver to `calc.js`
  - Add `'rr-long'` and `'rr-short'` keys to the existing `HELP_CONTENT` object with title and body text
  - Implement `calcRR(type)` following the same pattern as `calcStop` / `calcPnl`:
    - Derive `p = type[0]` for ID prefixing
    - Read and validate all inputs (entry, TP, SL, leverage, pos); `alert()` on invalid/missing values
    - Apply direction-aware validation: long requires TP > entry and SL < entry; short requires TP < entry and SL > entry
    - Call `rrRisk`, `rrReward`, `rrRatio`; handle null ratio (zero-risk edge case)
    - Call `rrVerdict` and apply the correct CSS class (`metric--loss`, `metric--neutral`, `metric--profit`) to the verdict card
    - Write results to `{p}-rr-risk`, `{p}-rr-reward`, `{p}-rr-ratio`, `{p}-rr-verdict`
    - Display ratio as `"1 : N"` where N is `ratio.toFixed(2)`
    - Call `updateActual` on leverage/pos input, and `showResults` at the end
  - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.5, 4.1, 4.2, 4.3, 4.4, 5.3, 5.5_

- [x] 4. Add Risk/Reward card markup to `app.html`
  - Add the card to `#panel-long` (after the existing Position Distribution card) with IDs `l-rr-{field}`
  - Add the card to `#panel-short` (after the existing Position Distribution card) with IDs `s-rr-{field}`
  - Card structure:
    - Header: title "Risk/Reward", badge `card-badge--long` / `card-badge--short`, help button `data-modal="rr-long"` / `data-modal="rr-short"`
    - `field-grid--3`: entry price, leverage, position size inputs
    - `field-grid--halves`: TP price input + readonly actual position size field
    - Second `field-grid--halves`: SL price input (second half empty or single field row)
    - Calculate button calling `calcRR('long')` / `calcRR('short')` via `onclick`
    - Results div with four metric cards: Risk (USD), Reward (USD), Ratio, Verdict
    - Verdict metric card needs an `id` for the card element itself (for CSS class toggling)
  - Use `oninput` on leverage and pos fields to call `updateActual(...)` inline, consistent with other cards
  - _Requirements: 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All changes are in existing files only — no new files
- The `calcRR` function is not unit-tested (DOM-dependent); only the four pure helpers are tested
- Run tests with: `docker run -it --rm -v "$(pwd):/app" -w /app node:24-alpine node tests.js`
