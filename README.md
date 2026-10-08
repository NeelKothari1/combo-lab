# Combo Lab

An interactive, static no-limit hold’em practice app for combo counting, blockers, and unblockers. It follows a 50bb, six-handed, no-rake cash-game context.

## Run

Run `npm run dev` and open `http://localhost:4173/`. No dependencies or build step are required. The deployable application is in `dist/`.

Run `npm test` for combinatorics checks and independent full-deck enumeration of all 24 scenarios.

## Learning flow

- Choose a concept and difficulty, or follow the guided ordering.
- Read the board, your hand, action history, and villain profile.
- In **Reading ranges**, select candidate groups using the stated practice model, then count the supplied model range. Both stages must be correct without help for mastery.
- Use **Same cards, different villain** to compare selective/wide 3-bettors, turn give-up/pressure bettors, and value-first/missed-draw river bettors.
- In the original drills, keep counting the explicitly supplied target range; the new profile is context.
- Submit a whole-number count, ask for a hint, or reveal the solution.
- Inspect board-only and hero-adjusted counts, exact remaining hands, and removed combos.
- Revisit mistakes until answered correctly without help.

Progress uses localStorage and stays in the current browser. No accounts, backend, analytics, gambling, or monetary transactions are implemented. A hosted deployment is private by default.

## Accuracy model

Every target is an explicit assumed range/subrange at 100% inclusion; action history is context and does not claim to establish a unique opponent range. The engine enumerates specific unordered two-card combinations, removes board and hero collisions, and deduplicates overlapping ranges. Blocked counts use the board-only range as their baseline. Unblocker comparisons hold the board and target range fixed.

The hand classes support pairs (AA), unqualified rank combinations (AK), suited (AKs), offsuit (AKo), and exact cards (AsKh). Ranges are explicit token lists; shorthand intervals and frequency weights are not supported.

`dist/scenarios.js` contains the curriculum. `dist/engine.js` contains pure count functions. `dist/app.js` contains the UI and browser-local progress. Optional feature-detected WebMCP tools mirror the visible practice controls.

## Villain tendencies

All eight profiles use fictional observations, sample context, range implications, and limits on what the evidence supports. Observations do not establish a unique real opponent range. Six new paired drills use explicit all-or-none frequency assumptions and bounded candidate pools to make selection gradeable. Incorrect selections and correct counts are tracked separately within the completed attempt; an incorrect range still enters review. Existing version-1 browser progress is retained.

`dist/profiles.js` contains the profiles. `dist/tendency-scenarios.js` contains the six drills. `dist/range-reading.js` validates selections. The existing browser tools now include `submit_range_selection` and guard combo submissions until range selection has been checked.
