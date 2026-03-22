# Product Overview

## Purpose

A browser-based trading calculator for leveraged positions. It helps traders quickly compute stop-loss prices, profit/loss, price movement percentages, price ranges, and simulate live PnL across a slider range — all without leaving the page or pressing a server-side button.

The tool is asset-agnostic (works for any tradable instrument).

## Target Users

Solo traders who use leverage and need fast, reliable in-browser calculations during active trading sessions. No account, no backend, no latency.

## Key Features

- **Stop-loss calculator** — computes stop price, distance, loss per unit, and total loss for long and short positions
- **PnL calculator** — computes leveraged profit/loss in USD and as a percentage of collateral
- **Movement % calculator** — shows how much price has moved from entry and whether the position is profitable
- **Price range calculator** — derives upper/lower price targets from an entry price and a move percentage
- **Live PnL simulator** — drag a slider across a ±20% range around entry to simulate PnL in real time, with a liquidation price marker on the track
- **Help modals** — each card has a "?" button that opens a description of the tool
- **Actual position size** — every card shows a live read-only `position size × leverage` field

## Business Objectives

- Zero friction: open the page, start calculating — no login, no install, no build step required
- Works offline (no external API calls for calculations)
- Fast iteration: single developer, plain files, no CI pipeline needed
