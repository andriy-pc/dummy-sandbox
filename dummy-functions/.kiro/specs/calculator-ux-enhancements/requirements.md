# Requirements Document

## Introduction

This feature extends the existing BTC Trading Calculator (vanilla JS/HTML/CSS) with four UX enhancements:

1. **Help tooltips/dialogs** — each tool card exposes a "?" button that opens a modal describing the tool.
2. **Remove global defaults bar** — the header's global constants bar (leverage, position size, stop loss %) is removed; each card already owns its own fields.
3. **Actual position size field** — every tool card shows a live read-only "Actual position size" value (position size × leverage).
4. **Live PnL simulator polish** — the existing simulator card gets a fixed ±20% slider range, a liquidation price marker on the track, and simultaneous $ + % PnL display.

The codebase is three files: `index.html`, `style.css`, `calc.js`. No build tooling or frameworks are used.

---

## Glossary

- **Calculator**: The BTC Trading Calculator web application.
- **Card**: A self-contained tool panel (Stop-loss, PnL, Movement %, Price range, Live PnL simulator) rendered inside a Long or Short tab panel.
- **Help_Modal**: The overlay dialog that describes a card's purpose, opened by clicking the "?" button.
- **Help_Button**: The "?" button in a card's header row.
- **Global_Defaults_Bar**: The `<div class="constants-bar">` element previously rendered inside the header, containing global leverage, position size, and stop-loss inputs.
- **Actual_Position_Field**: The read-only display element inside each card that shows `position_size × leverage`.
- **Simulator**: The "Live PnL simulator" card present in both the Long and Short panels.
- **Slider**: The `<input type="range">` element inside the Simulator card.
- **Liquidation_Marker**: A visual indicator on the Slider track showing the price at which the position would be liquidated.
- **Entry_Price**: The price at which the user opened their position, entered in a card's "Entry price" field.
- **Leverage**: The multiplier applied to the position, entered in a card's "Leverage" field.
- **Position_Size**: The collateral amount in USD entered in a card's "Position size" field.

---

## Requirements

### Requirement 1: Help Button Hover Highlight

**User Story:** As a trader, I want the "?" button to visually respond when I hover over it, so that I know it is interactive before I click.

#### Acceptance Criteria

1. WHEN the user hovers the pointer over a Help_Button, THE Calculator SHALL apply a distinct highlight style (e.g. increased brightness or border color change) to that Help_Button.
2. WHEN the pointer leaves the Help_Button without clicking, THE Calculator SHALL restore the Help_Button to its default style.
3. THE Help_Button SHALL NOT open any dialog or tooltip on hover alone.

---

### Requirement 2: Help Modal on Click

**User Story:** As a trader, I want to click the "?" button on any card and read a description of what that tool does, so that I can understand how to use it without leaving the page.

#### Acceptance Criteria

1. WHEN the user clicks a Help_Button, THE Calculator SHALL display the Help_Modal with a title and description specific to that card.
2. WHEN the Help_Modal is open, THE Calculator SHALL render a close button ("✕") inside the modal.
3. WHEN the user clicks the close button, THE Calculator SHALL hide the Help_Modal.
4. WHEN the user clicks the overlay area outside the Help_Modal content, THE Calculator SHALL hide the Help_Modal.
5. WHEN the Help_Modal is open, THE Calculator SHALL prevent interaction with the page content behind the overlay.
6. THE Help_Modal SHALL contain a non-empty title and a non-empty description for every Help_Button in the application (stop-long, stop-short, pnl-long, pnl-short, mvm, range, slider-long, slider-short).

---

### Requirement 3: Remove Global Defaults Bar

**User Story:** As a trader, I want the header to be clean and uncluttered, so that I can focus on the per-tool inputs without being confused by redundant global fields.

#### Acceptance Criteria

1. THE Calculator SHALL NOT render the Global_Defaults_Bar in the header or anywhere else in the UI.
2. THE Calculator SHALL NOT reference the removed global input elements (`g-leverage`, `g-stoploss`, `g-possize`) in any active code path.
3. WHEN a card's leverage or position size field is empty, THE Calculator SHALL use a hard-coded fallback value (leverage: 10, position size: $4,000) rather than reading from a removed global element.

---

### Requirement 4: Actual Position Size — Live Display

**User Story:** As a trader, I want to see the actual leveraged position size update instantly as I type, so that I always know my real market exposure without pressing a button.

#### Acceptance Criteria

1. WHEN the user changes the value of the "Position size" or "Leverage" field in any card, THE Calculator SHALL immediately update that card's Actual_Position_Field to display `position_size × leverage` formatted as a USD dollar amount.
2. WHILE both "Position size" and "Leverage" fields in a card contain valid positive numbers, THE Calculator SHALL keep the Actual_Position_Field current with every keystroke.
3. IF either "Position size" or "Leverage" is empty or non-positive in a card, THEN THE Calculator SHALL display "—" in that card's Actual_Position_Field.
4. THE Actual_Position_Field SHALL be read-only and SHALL NOT accept direct user input.

---

### Requirement 5: Live PnL Simulator — Slider Range

**User Story:** As a trader, I want the simulator slider to cover a meaningful price range around my entry, so that I can explore realistic scenarios without the range being too wide or too narrow.

#### Acceptance Criteria

1. WHEN the user provides a valid Entry_Price in the Simulator card, THE Calculator SHALL set the Slider minimum to `entry_price × 0.80` and the Slider maximum to `entry_price × 1.20`.
2. WHEN the Slider range is initialised or reset, THE Calculator SHALL position the Slider thumb at the midpoint corresponding to Entry_Price.
3. WHEN the user changes Entry_Price or Leverage in the Simulator card, THE Calculator SHALL recalculate and reapply the Slider range and reset the thumb to the entry midpoint.

---

### Requirement 6: Live PnL Simulator — Liquidation Marker

**User Story:** As a trader, I want to see the liquidation price marked on the slider track, so that I can immediately see how close a simulated price is to liquidation.

#### Acceptance Criteria

1. WHEN the Simulator card has a valid Entry_Price and Leverage, THE Calculator SHALL compute the liquidation price as:
   - Long: `entry_price × (1 − 1 / leverage)`
   - Short: `entry_price × (1 + 1 / leverage)`
2. WHEN the computed liquidation price falls within the current Slider range, THE Calculator SHALL render the Liquidation_Marker on the Slider track at the proportional position corresponding to that price.
3. WHEN the computed liquidation price falls outside the current Slider range, THE Calculator SHALL hide the Liquidation_Marker.
4. THE Liquidation_Marker SHALL be visually distinct from the entry-price tick already present on the track (e.g. different color or label).
5. WHEN Entry_Price or Leverage changes, THE Calculator SHALL update the Liquidation_Marker position in real time.

---

### Requirement 7: Live PnL Simulator — Simultaneous $ and % PnL

**User Story:** As a trader, I want to see both the dollar PnL and the percentage PnL at the same time while dragging the slider, so that I can assess both absolute and relative impact instantly.

#### Acceptance Criteria

1. WHEN the user drags the Slider, THE Calculator SHALL display the PnL in USD (e.g. `+$1,234.56` or `−$500.00`) and the PnL as a percentage of Position_Size (e.g. `+30.86%`) simultaneously in the simulator readout area.
2. WHILE the Slider is being dragged, THE Calculator SHALL update both the USD PnL and the percentage PnL values with every slider movement event.
3. IF the simulated price equals Entry_Price, THEN THE Calculator SHALL display `$0.00` and `0.00%`.
4. THE Calculator SHALL colour the PnL display green when PnL is positive and red when PnL is negative, for both the USD and percentage values.
5. WHEN Entry_Price, Leverage, or Position_Size changes in the Simulator card, THE Calculator SHALL recalculate and refresh the PnL display for the current Slider position.
