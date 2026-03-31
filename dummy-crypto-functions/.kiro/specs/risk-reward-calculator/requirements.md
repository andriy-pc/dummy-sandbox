# Requirements Document

## Introduction

A Risk/Reward Ratio Calculator tool for the browser-based trading calculator app. The tool helps traders evaluate whether a potential trade is worth opening by comparing the expected profit (reward) against the maximum acceptable loss (risk). Given an entry price, a take-profit price, and a stop-loss price, the calculator computes the risk amount, the reward amount, and the resulting ratio — then gives a plain-language verdict so a trader new to the concept can immediately understand the result.

The tool follows the same card-based layout as all existing tools and appears in both the Long and Short tab panels.

## Glossary

- **Calculator**: The browser-based trading calculator application (`app.html` + `calc.js`).
- **Risk**: The dollar distance between the entry price and the stop-loss price, multiplied by the leveraged position size. Represents the maximum loss if the stop is hit.
- **Reward**: The dollar distance between the entry price and the take-profit price, multiplied by the leveraged position size. Represents the expected profit if the target is hit.
- **Risk/Reward Ratio (RR Ratio)**: The ratio of Reward to Risk, expressed as `1:N` where N = Reward ÷ Risk. A ratio of `1:2` means the potential reward is twice the potential risk.
- **Entry_Price**: The price at which the trader opens the position.
- **Take_Profit_Price**: The target price at which the trader intends to close the position for a profit.
- **Stop_Loss_Price**: The price at which the trader will exit the position to limit losses.
- **Position_Size**: The collateral amount in USD the trader allocates to the position.
- **Leverage**: The multiplier applied to the position size to determine the actual market exposure.
- **Verdict**: A plain-language assessment of the ratio quality shown alongside the numeric result.

---

## Requirements

### Requirement 1: Core Risk/Reward Ratio Calculation

**User Story:** As a trader, I want to enter my entry price, take-profit price, and stop-loss price so that I can see the risk/reward ratio and decide whether the trade is worth opening.

#### Acceptance Criteria

1. WHEN the user provides a valid Entry_Price, Take_Profit_Price, and Stop_Loss_Price, THE Calculator SHALL compute the Risk as the absolute distance between Entry_Price and Stop_Loss_Price.
2. WHEN the user provides a valid Entry_Price, Take_Profit_Price, and Stop_Loss_Price, THE Calculator SHALL compute the Reward as the absolute distance between Entry_Price and Take_Profit_Price.
3. WHEN Risk is greater than zero, THE Calculator SHALL compute the RR Ratio as Reward divided by Risk, rounded to two decimal places.
4. THE Calculator SHALL display the RR Ratio in the format `1 : N` where N is the computed ratio value.
5. WHEN Risk equals zero (Entry_Price equals Stop_Loss_Price), THE Calculator SHALL display an error message instead of computing the ratio.

---

### Requirement 2: Direction-Aware Validation (Long / Short)

**User Story:** As a trader, I want the calculator to validate that my prices make sense for my chosen direction so that I don't get a misleading ratio from incorrectly entered prices.

#### Acceptance Criteria

1. WHEN the position type is Long and Take_Profit_Price is not greater than Entry_Price, THE Calculator SHALL display a validation error indicating the take-profit must be above the entry for a long position.
2. WHEN the position type is Long and Stop_Loss_Price is not less than Entry_Price, THE Calculator SHALL display a validation error indicating the stop-loss must be below the entry for a long position.
3. WHEN the position type is Short and Take_Profit_Price is not less than Entry_Price, THE Calculator SHALL display a validation error indicating the take-profit must be below the entry for a short position.
4. WHEN the position type is Short and Stop_Loss_Price is not greater than Entry_Price, THE Calculator SHALL display a validation error indicating the stop-loss must be above the entry for a short position.
5. IF any required input field is empty or non-numeric, THEN THE Calculator SHALL display a validation error prompting the user to enter valid prices.

---

### Requirement 3: Verdict Label

**User Story:** As a trader who is new to risk/reward ratios, I want a plain-language verdict alongside the numeric ratio so that I can immediately understand whether the trade setup is good or not.

#### Acceptance Criteria

1. WHEN the RR Ratio is less than 1.0, THE Calculator SHALL display the verdict "Poor — risk outweighs reward".
2. WHEN the RR Ratio is greater than or equal to 1.0 and less than 1.5, THE Calculator SHALL display the verdict "Acceptable".
3. WHEN the RR Ratio is greater than or equal to 1.5 and less than 2.0, THE Calculator SHALL display the verdict "Good".
4. WHEN the RR Ratio is greater than or equal to 2.0, THE Calculator SHALL display the verdict "Excellent".
5. THE Calculator SHALL colour the verdict using the existing profit/loss colour scheme: red for "Poor", neutral (blue) for "Acceptable", and green for "Good" and "Excellent".

---

### Requirement 4: Dollar Amounts Display

**User Story:** As a trader, I want to see the actual dollar risk and reward amounts alongside the ratio so that I understand the real monetary impact, not just the abstract ratio.

#### Acceptance Criteria

1. WHEN the Calculator displays the RR Ratio, THE Calculator SHALL also display the Risk amount in USD, computed as `(|Entry_Price − Stop_Loss_Price| / Entry_Price) × Position_Size × Leverage`.
2. WHEN the Calculator displays the RR Ratio, THE Calculator SHALL also display the Reward amount in USD, computed as `(|Entry_Price − Take_Profit_Price| / Entry_Price) × Position_Size × Leverage`.
3. THE Calculator SHALL format all USD output values using the existing `fmt()` helper (comma-separated, two decimal places, dollar sign).
4. THE Calculator SHALL display Position_Size and Leverage inputs with a live read-only "Actual position size" field, consistent with all other tools.

---

### Requirement 5: Card Layout and Integration

**User Story:** As a trader, I want the risk/reward tool to look and behave like the other calculator cards so that the app feels consistent and familiar.

#### Acceptance Criteria

1. THE Calculator SHALL render the Risk/Reward Ratio Calculator as a `<div class="card">` inside both `#panel-long` and `#panel-short`.
2. THE Calculator SHALL include a card header with a title, a directional badge (`card-badge--long` / `card-badge--short`), and a help button that opens a help modal.
3. THE Calculator SHALL include a help modal entry in the `HELP_CONTENT` object in `calc.js` for both `rr-long` and `rr-short` keys.
4. THE Calculator SHALL use element IDs following the existing naming convention: `l-rr-{field}` for the long panel and `s-rr-{field}` for the short panel.
5. WHEN the Calculate button is clicked, THE Calculator SHALL call `calcRR('long')` or `calcRR('short')` respectively, consistent with the `calcStop`, `calcPnl` pattern.

---

### Requirement 6: Pure Calculation Helpers and Unit Tests

**User Story:** As a developer, I want the ratio logic extracted into pure functions so that it can be unit-tested independently of the DOM.

#### Acceptance Criteria

1. THE Calculator SHALL expose a pure function `rrRisk(entryPrice, stopPrice, positionSize, leverage)` that returns the dollar risk amount.
2. THE Calculator SHALL expose a pure function `rrReward(entryPrice, takeProfitPrice, positionSize, leverage)` that returns the dollar reward amount.
3. THE Calculator SHALL expose a pure function `rrRatio(reward, risk)` that returns the ratio as a number, or `null` when risk is zero.
4. THE Calculator SHALL expose a pure function `rrVerdict(ratio)` that returns the verdict string for a given ratio value.
5. FOR ALL positive reward and risk values where `ratio = rrRatio(reward, risk)`, calling `rrRatio(reward * k, risk * k)` for any positive scalar `k` SHALL return the same ratio (scale-invariance property).
6. THE Calculator SHALL include unit tests for `rrRisk`, `rrReward`, `rrRatio`, and `rrVerdict` in `tests.js`, covering typical inputs, boundary values, and the scale-invariance property.
