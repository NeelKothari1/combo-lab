# Combo Lab

A static no-limit hold’em range-reading trainer for 50–100bb, six-handed, no-rake cash-game spots.

## Run

Run `npm run dev` and open `http://localhost:4173/`. There are no dependencies or build step. The deployable application is in `dist/`.

Run `npm test` for chart classification, blocker effects, scenario consistency, scoring, progress migration, and the retained combinatorics checks.

## Practice

Read your cards, the board, positions, the betting line, and fictional villain observations. Select individual hand classes on the standard 13×13 range chart. Pairs occupy the diagonal, suited hands the upper half, and offsuit hands the lower half. No numeric combo answer is required.

The library contains 5,536 spots across preflop, flop, turn, and river: ten original guided exercises and 5,526 generated spots. The ten guided exercises retain four tendency comparisons and one blocker comparison. The expanded library adds 54 situation/style recipes across 24 distinct board runouts, with 882 board-specific templates and legal hero-card variations. The declared starting pool is available before answering; the reference betting range stays hidden until the chart is checked or revealed.

Feedback marks matched, missed, and extra hand classes. Clicking a graded cell explains its inclusion or exclusion and shows exact combinations for included cells. Range-match percentage is the intersection divided by the union of selected and target classes. Hints and reveals enter mistake review; only a complete unaided match clears an exercise.

## Accuracy and scope

Observations do not uniquely determine a real opponent’s range. These are illustrative working models, not solver solutions. Each exercise has a declared starting pool and an explicit continuation model; membership is all-or-none at the exact-combination level. Frequency weights are not supported.

The engine expands ranges into unordered two-card combinations, removes board and Hero collisions, and deduplicates overlaps. A chart cell is included when at least one exact model combo remains. A suited class can therefore be represented by just one relevant suit. Feedback distinguishes hands outside the starting pool, hands excluded by the betting line, and combos blocked by known cards.

## Progress and files

Browser-local progress uses `combo-lab-progress-v1`. Chart records live in a separate `chart` field; earlier combo-counting and group-selection records remain intact. Resetting chart progress does not erase earlier history. No account, backend, analytics, or monetary transactions are implemented.

- `dist/chart-scenarios.js` combines guided exercises with the generated catalog.
- `dist/chart-extra-scenarios.js` adds flop and flush-blocker comparisons.
- `dist/profiles.js` contains fictional opponent notes.
- `dist/chart-engine.js` classifies, grades, and explains selected hand classes.
- `dist/chart-progress.js` preserves older progress and records chart attempts.
- `dist/engine.js` supplies exact-combination enumeration.
- `dist/app.js` implements the UI, keyboard navigation, and optional feature-detected WebMCP tools.

WebMCP tools mirror visible controls: read_training_state, start_practice, select_range_hands, submit_range_chart, and next_practice_hand. Reading an unanswered exercise does not reveal its target.

## Explanations and Ask Codex

After checking, incorrect selections are explained automatically, with a profile clue and a specific reasoning adjustment. Card-removal explanations name the blocking cards and the exact removed combinations. Selections outside the starting pool are identified as an exercise assumption rather than a deduction from the bet. Extra selections appear first; missed-hand explanations can also be expanded.

Ask Codex opens a question panel for the whole spot or an individual hand. Its documented `codex://new?prompt=` handoff opens a new local draft with the complete context; the user sends it in Codex. Replies appear in Codex, not in the website. Copy question + spot supports continuing an existing chat and has a manual-copy fallback. This is not an embedded inference service and requires no API credential.

Before grading, the draft includes only the visible spot, starting pool, observations, and selection; it omits hidden answers. After grading, it includes the reference assumptions and feedback. Opening/copying a draft before checking marks the chart assisted. `read_spot_question` exposes the prepared draft to a browser agent only while the panel is open.

- `dist/hand-explanations.js` separates modeled action exclusions from exact card removal.
- `dist/spot-question.js` prepares context and encodes the Codex draft URL.
- Official handoff contract: https://learn.chatgpt.com/docs/reference/commands#deep-links

## Expanded library

The 5,526 generated spots include 342 preflop, 1,728 flop, 1,728 turn, and 1,728 river spots. The retained ten guided exercises bring the total to 5,536. “Spots” count changed board/context/tendency/hole-card states, not independently authored lessons or solver solutions. No suit-permutation multiplier is used.

Practice filters include street, collection, tendency, difficulty, situation, and unpracticed status. Searchable stable IDs make a spot easy to revisit. Shuffled 20-hand sessions contain unique IDs and stop at a summary rather than silently looping. Existing attempt and review records are retained.

Generation lives in `scripts/generate-library.mjs`; run `node scripts/generate-library.mjs` after editing a model, then `npm test`. The deterministic output is `dist/library-data.js`. `scripts/poker-model.mjs` classifies hole-driven made hands, flush/straight draws, and unpaired missed turn draws. Earlier villain bets apply the same rule and can only narrow later ranges. Check-raise exercises explicitly do not add a filtering rule to earlier calls. Board-pair plus pocket-underpair is not treated as strong two pair. Betting ledgers and effective stacks are validated.

Ranges are generated before hero-card removal, allowing exact blocked combinations to be explained. Category groups partition the declared pool. A chart cell can contain multiple suit-specific categories; feedback prioritizes the surviving modeled combinations. The app caches only recent card contexts and renders at most 24 library search results at a time.

The scale target was informed by official product descriptions, not a claimed industry average: [PokerCoaching describes over 2,000 hand quizzes](https://pokercoaching.com/blog/the-best-poker-habits-of-winning-poker-players/), while [GTO Wizard describes millions of solver spots](https://gtowizard.com/) and [PokerSnowie allows configurable scenarios](https://www.pokersnowie.com/online-manual/scenarios). These products count different things. This app provides a substantial generated range-reading library without claiming their solver breadth or authored curriculum size.
