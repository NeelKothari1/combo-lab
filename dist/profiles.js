export const profiles = {
  careful: {
    name: 'Selective opener', style: 'Tight preflop', sample: '240 simulated hands · 36 button opportunities',
    observations: ['Opened in 9 of the 36 tracked button opportunities.', 'Shown opening hands have mostly been pairs and strong broadways.', 'Uses the same opening size with different hand strengths.'],
    implication: 'Start with a narrower opening range, but do not identify one exact hand from the raise size.',
    caution: 'Most opening hands never reached showdown. These notes cannot prove a precise opening chart.'
  },
  wide: {
    name: 'Wide opener', style: 'Loose preflop', sample: '220 simulated hands · 34 button opportunities',
    observations: ['Has opened weak offsuit aces from the button.', 'Has shown suited connectors after opening late position.', 'Uses 2.5bb for both strong and speculative opening hands.'],
    implication: 'Keep more weak aces and speculative hands in a late-position opening range.',
    caution: 'A wide opening range can still become narrow after several betting streets.'
  },
  giveup: {
    name: 'One-and-done bettor', style: 'Gives up on turns', sample: '310 simulated hands · 22 observed flop-to-turn lines',
    observations: ['Often makes a small flop continuation bet with weak hands.', 'Usually checks the turn when those hands do not improve.', 'Shown second barrels have mostly been top pair with a strong kicker or better.'],
    implication: 'A second barrel carries more information than the small flop bet. Reduce weak hands in the turn model.',
    caution: 'An occasional draw or bluff can still appear; a tendency is not a rule that a real player must follow.'
  },
  pressure: {
    name: 'Draw barreler', style: 'Keeps applying pressure', sample: '300 simulated hands · 24 observed flop-to-turn lines',
    observations: ['Has bet both flop and turn with unmade draws.', 'Uses the same turn sizing for strong made hands and draws.', 'Often takes a free showdown with medium-strength pairs.'],
    implication: 'Do not narrow a turn betting range to made hands alone. Some draws can continue alongside value.',
    caution: 'Turn aggression does not establish how often missed draws will bluff the river.'
  },
  value: {
    name: 'Value-first bettor', style: 'Rarely bluffs the river', sample: '280 simulated hands · 9 river-bet showdowns',
    observations: ['Checked back missed draws in several visible river spots.', 'Shown river bets have mainly been two pair or better.', 'Often checks one-pair hands after betting earlier streets.'],
    implication: 'Use a value-heavy river model and reduce missed draws as bluff candidates.',
    caution: 'Only nine river bets reached showdown. A missing bluff in the sample is not proof that bluffs never occur.'
  },
  bluffer: {
    name: 'Persistent bluffer', style: 'Bluffs missed draws', sample: '270 simulated hands · 11 river-bet showdowns',
    observations: ['Has shown missed flush draws after betting three streets.', 'Has also taken this line with sets and two pair.', 'Often checks one-pair hands rather than betting them again.'],
    implication: 'Leave some missed draws in the river betting range alongside strong value hands.',
    caution: 'Seeing a few bluffs does not mean every missed draw is always bet. The drill supplies a simplified model.'
  }
};
const assignments={
 'top-pair':'wide','pocket-pairs':'careful','suited':'careful','offsuit':'wide','sets':'wide','two-pair':'wide',
 'pocket-street':'giveup','range-union':'giveup','ace-blocker':'wide','king-blocker':'wide','nut-flush':'value',
 'flush-removal':'value','missed-draw':'bluffer','block-bluffs':'bluffer','straight-blocker':'value',
 'unblock-straights':'bluffer','turn-flushdraw':'pressure','full-house':'value'
};
export function profileFor(scenario){return scenario.profile||profiles[scenario.profileId||assignments[scenario.id]];}

Object.assign(profiles, {
  "selective3bet": {
    "name": "Selective 3-bettor",
    "style": "Tight versus late opens",
    "sample": "250 fictional hands · 30 opportunities to 3-bet a late-position open",
    "observations": [
      "3-bet in 2 of the 30 tracked opportunities.",
      "The two 3-bets that later showed cards were AA and AK.",
      "Has also called with JJ and AQs in comparable positions."
    ],
    "implication": "Start with a narrow 3-bet working range and keep calls separate from raises.",
    "caution": "These small, selected showdowns cannot establish an exact 3-bet chart."
  },
  "wide3bet": {
    "name": "Wide 3-bettor",
    "style": "Pressures late-position opens",
    "sample": "250 fictional hands · 28 opportunities to 3-bet a late-position open",
    "observations": [
      "3-bet in 8 of the 28 tracked opportunities.",
      "Has shown A5s and AJs after 3-betting a CO open.",
      "Uses the same 8bb size with speculative hands and premiums."
    ],
    "implication": "Keep some non-premium hands in the 3-bet working range; the raise size does not identify strength.",
    "caution": "The exact hand classes and 100% frequencies are specified by the exercise, not inferred from these observations."
  }
});

Object.assign(profiles, {
  "flopSelective": {
    "name": "Selective flop bettor",
    "style": "Checks many flop hands",
    "sample": "Fictional observations · 24 similar ace-high flop opportunities",
    "observations": [
      "Made the small continuation bet in 8 of the 24 tracked spots.",
      "Several checked-back hands later shown were pocket pairs below the ace.",
      "Has shown ace-pair value hands and a wheel gutshot after making this small bet."
    ],
    "implication": "A small bet from this player can remove more weak hands from a working range than the same bet from a frequent bettor.",
    "caution": "Observed showdowns are incomplete. They suggest a selective betting pattern, not an exact boundary between every hand class."
  },
  "flopFrequent": {
    "name": "Frequent flop bettor",
    "style": "Uses small bets broadly",
    "sample": "Fictional observations · 24 similar ace-high flop opportunities",
    "observations": [
      "Made a small continuation bet in 21 of the 24 tracked spots.",
      "Hands later shown after these small bets include underpairs and unpaired high cards.",
      "Uses the same small size with strong made hands."
    ],
    "implication": "Avoid narrowing the range too sharply merely because this player made the expected small flop bet.",
    "caution": "A high observed betting rate is not proof that every hand bets. Small samples leave uncertainty about the weakest hands in the range."
  },
  "flushValue": {
    "name": "Cautious on flush boards",
    "style": "Strong river value",
    "sample": "Fictional observations · 8 comparable three-suit river showdowns",
    "observations": [
      "The four observed river bets in this sample showed made flushes.",
      "In two checked-back pots, the player showed sets.",
      "Has checked back one-pair hands after betting the flop and turn."
    ],
    "implication": "Start with a very strong working model for this third barrel, then check which flushes your cards rule out.",
    "caution": "Four shown bets cannot establish a literal no-bluff or flush-only strategy. Unseen hands could include other value bets or bluffs."
  }
});
