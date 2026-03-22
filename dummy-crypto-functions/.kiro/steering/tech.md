# Technology Stack

## Core

- **HTML5** — single page (`index.html`), no templating engine
- **CSS3** — single stylesheet (`style.css`), custom properties (CSS variables) for theming
- **JavaScript (ES6+)** — single script (`calc.js`), `'use strict'` mode, no modules, no bundler

## Constraints

- **No build tooling** — no webpack, vite, rollup, or any bundler; files are served directly
- **No frameworks** — no React, Vue, Angular, or any component library
- **No npm / package.json** — zero dependencies installed locally
- **No TypeScript** — plain JS only
- **Browser-only runtime** — all code must run in a modern browser without a server

## External Resources (CDN only, load-time only)

- **Google Fonts** — IBM Plex Mono loaded via `@import` in CSS
- Any future testing library (e.g. fast-check for property-based tests) must be loaded via CDN `<script>` tag, not installed

## Coding Style

Follow [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html):

- `const` by default; `let` only when reassignment is required; never `var`
- 2-space indentation
- Single quotes for strings
- Semicolons required
- `camelCase` for variables and functions
- `UPPER_SNAKE_CASE` for module-level constants (e.g. `HELP_CONTENT`)
- Arrow functions for callbacks; named `function` declarations for top-level functions
- No trailing commas in function parameters

## CSS Conventions

- All colours and radii defined as CSS custom properties in `:root`
- BEM-lite class naming: block (`card`), element (`card-header`, `card-title`), modifier (`card-badge--long`)
- No inline styles except for dynamic values set by JS (e.g. `element.style.left`, `element.style.width`)
