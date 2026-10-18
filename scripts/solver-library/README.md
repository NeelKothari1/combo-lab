# Offline river solver library

This directory generates the numerical examples used by Combo Lab's GTO range trainer. It uses the same Rust engine that underlies [WASM Postflop](https://github.com/b-inary/wasm-postflop): [b-inary/postflop-solver](https://github.com/b-inary/postflop-solver), pinned to commit `9d1509fe5077d019825f833eed04b16d342dfda1`.

The generator is an offline program. The browser receives numerical results in `dist/solver-data.js`, not a compiled solver, live solver service, or the WASM Postflop application. The engine is not required to run the site.

## Reproduce

With Node.js, Cargo and a Rust toolchain installed, run from the repository root:

```sh
node scripts/solver-library/build.mjs
node --test tests/solver-data.test.mjs
```

The checked-in Cargo lockfile pins dependency versions. Generation fetches and compiles the pinned Rust dependency, solves the six games in `inputs.json`, and replaces `dist/solver-data.js` only after every game meets the convergence target. The source inputs' SHA-256 digest is stored with the library. Builds and dependencies remain in Cargo's normal caches and this directory's ignored `target` directory; nothing is installed globally.

Rust 1.96 promotes `dangerous_implicit_autorefs` to a compilation error in this older upstream source. The build wrapper uses the local compile flag `-A dangerous_implicit_autorefs` for compatibility; it does not patch the pinned dependency. The `bincode` and `rayon` default features are disabled; this generator does not use serialization or multi-threading, avoiding incompatibilities with later bincode 2 APIs. The upstream solver uses unsafe Rust internally. This compatibility flag is not an independent safety audit.

## What these exercises establish

- Six distinct river boards produce twelve exercises: OOP's bet and IP's bet after an OOP check.
- Every game is heads-up, zero rake, with supplied river-start ranges and remaining effective stacks. **The ranges are exercise assumptions, not solver-derived preflop-to-river ranges.** No earlier betting history is implied.
- Each player may check, use the stated percentage bet, or go all-in. Facing a bet, the tree includes fold, call, a 2.5× raise when legal, and all-in. Automatic all-in insertion, forced all-in rounding, and size merging are disabled. The engine applies legal stack limits.
- The engine solves exact private-card combinations with no card bucketing. River-only solving requires no future-card abstraction.
- Discounted CFR runs until root exploitability is at most **0.01% of the starting pot**, checked every ten iterations, with a ceiling of 10,000 iterations. Generation fails if the target is not reached. Actual iterations and exploitability are recorded for each game. This root convergence measure is not a guarantee of identical accuracy at every hand or infrequently reached node.
- Independent cross-validation against another solver has not yet been performed. These are numerically converged conditional exercises, not a claim that unrestricted no-limit hold'em has been solved.

## Range weights and private information

The game is solved range against range without revealing the selected hero hand to the opponent. Only when exporting a training question are villain combinations conflicting with that hero hand removed. The hero hand is checked to have positive reach at the selected node.

Each exported villain combination contains:

| Field | Meaning |
| --- | --- |
| `cards` | The two exact cards, retaining their suits. |
| `hand` | The chart class, such as `AKs`; used only for presentation. |
| `priorWeight` | Villain's unnormalized range weight before the observed action. |
| `actionProbability` | Frequency with which the solver takes the observed action with those exact cards. |
| `targetWeight`, `reachWeight` | `priorWeight × actionProbability`. Summing these gives weighted combinations, not 100%. |
| `actionProbabilities` | Frequencies in the order of the scenario's `actions` array. |

All positive-prior, physically available villain combinations are included, including those taking the observed action at 0%. Omitted combinations have target weight 0. The displayed villain starting-range tokens omit weights for chart compatibility; `startingRanges` and `solver.tree` preserve the complete weighted inputs.

On an IP betting exercise, the preceding OOP check changes OOP's range and IP's strategy. It does not directly multiply IP's own range weights. The engine accounts for that opponent action when solving and evaluating the IP node. We do not substitute normalized opponent-compatible weights for raw range inclusion weights.

## Attribution and license

The underlying solver is copyright © 2022 Wataru Inariba and contributors, licensed **AGPL-3.0-or-later**. Its pinned source is available at:

https://github.com/b-inary/postflop-solver/tree/9d1509fe5077d019825f833eed04b16d342dfda1

This directory's adapter source is also provided under AGPL-3.0-or-later; see `LICENSE`. No upstream solver implementation has been copied into the website. This statement describes the delivered architecture, not a legal conclusion about other integrations; directly embedding or serving the solver would require reviewing the applicable AGPL obligations.
