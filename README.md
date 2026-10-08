# Combo Lab

A static no-limit hold’em range-reading trainer for a 50bb, six-handed, no-rake cash-game setting.

## Run

Run `npm run dev` and open `http://localhost:4173/`. There are no dependencies or build step. The deployable application is in `dist/`.

Run `npm test` for chart classification, blocker effects, scenario consistency, scoring, progress migration, and the retained combinatorics checks.

## Practice

Read your cards, the board, positions, the betting line, and fictional villain observations. Select individual hand classes on the standard 13×13 range chart. Pairs occupy the diagonal, suited hands the upper half, and offsuit hands the lower half. No numeric combo answer is required.

Ten exercises cover preflop, flop, turn, and river. Four paired comparisons change only villain tendencies; the fifth changes only the suit of Hero’s ace to demonstrate blockers and unblockers. The declared starting pool is available before answering; the reference betting range stays hidden until the chart is checked or revealed.

Feedback marks matched, missed, and extra hand classes. Clicking a graded cell explains its inclusion or exclusion and shows exact combinations for included cells. Range-match percentage is the intersection divided by the union of selected and target classes. Hints and reveals enter mistake review; only a complete unaided match clears an exercise.

## Accuracy and scope

Observations do not uniquely determine a real opponent’s range. These are illustrative working models, not solver solutions. Each exercise has a declared starting pool and an explicit continuation model; membership is all-or-none at the exact-combination level. Frequency weights are not supported.

The engine expands ranges into unordered two-card combinations, removes board and Hero collisions, and deduplicates overlaps. A chart cell is included when at least one exact model combo remains. A suited class can therefore be represented by just one relevant suit. Feedback distinguishes hands outside the starting pool, hands excluded by the betting line, and combos blocked by known cards.

## Progress and files

Browser-local progress uses `combo-lab-progress-v1`. Chart records live in a separate `chart` field; earlier combo-counting and group-selection records remain intact. Resetting chart progress does not erase earlier history. No account, backend, analytics, or monetary transactions are implemented.

- `dist/chart-scenarios.js` combines the ten chart exercises.
- `dist/chart-extra-scenarios.js` adds flop and flush-blocker comparisons.
- `dist/profiles.js` contains fictional opponent notes.
- `dist/chart-engine.js` classifies, grades, and explains selected hand classes.
- `dist/chart-progress.js` preserves older progress and records chart attempts.
- `dist/engine.js` supplies exact-combination enumeration.
- `dist/app.js` implements the UI, keyboard navigation, and optional feature-detected WebMCP tools.

WebMCP tools mirror visible controls: read_training_state, start_practice, select_range_hands, submit_range_chart, and next_practice_hand. Reading an unanswered exercise does not reveal its target.
