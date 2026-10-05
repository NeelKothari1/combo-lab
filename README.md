# Combo Lab

An interactive, static no-limit hold’em practice app for combo counting, blockers, and unblockers. It follows a 50bb, six-handed, no-rake cash-game context.

## Run

Run `npm run dev` and open `http://localhost:4173/`. No dependencies or build step are required. The deployable application is in `dist/`.

Run `npm test` for combinatorics checks and independent full-deck enumeration of all 18 scenarios.

## Learning flow

- Choose a concept and difficulty, or follow the guided ordering.
- Read the board, your hand, action history, and explicitly assumed villain target range.
- Submit a whole-number count, ask for a hint, or reveal the solution.
- Inspect board-only and hero-adjusted counts, exact remaining hands, and removed combos.
- Revisit mistakes until answered correctly without help.

Progress uses localStorage and stays in the current browser. No accounts, backend, analytics, gambling, or monetary transactions are implemented. A hosted deployment is private by default.

## Accuracy model

Every target is an explicit assumed range/subrange at 100% inclusion; action history is context and does not claim to establish a unique opponent range. The engine enumerates specific unordered two-card combinations, removes board and hero collisions, and deduplicates overlapping ranges. Blocked counts use the board-only range as their baseline. Unblocker comparisons hold the board and target range fixed.

The hand classes support pairs (AA), unqualified rank combinations (AK), suited (AKs), offsuit (AKo), and exact cards (AsKh). Ranges are explicit token lists; shorthand intervals and frequency weights are not supported.

`dist/scenarios.js` contains the curriculum. `dist/engine.js` contains pure count functions. `dist/app.js` contains the UI and browser-local progress. Optional feature-detected WebMCP tools mirror the visible practice controls.
