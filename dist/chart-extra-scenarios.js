export const extraChartScenarios=[
  {
    "id": "chart-selective-flop",
    "title": "When a small bet is selective",
    "street": "flop",
    "hero": [
      "As",
      "Qc"
    ],
    "board": [
      "Ah",
      "7d",
      "2c"
    ],
    "heroPosition": "BB",
    "villainPosition": "BTN",
    "potAfterBet": 7.5,
    "history": [
      [
        "Preflop",
        "BTN opens to 2.5bb. SB folds. You call in the BB."
      ],
      [
        "Flop",
        "You check. BTN bets 2bb into 5.5bb."
      ]
    ],
    "profileId": "flopSelective",
    "potType": "Single-raised pot",
    "range": [
      "AK",
      "AQ",
      "AJ",
      "AT",
      "A9s",
      "A8s",
      "A7s",
      "A6s",
      "A5s",
      "A4s",
      "A3s",
      "A2s",
      "AA",
      "77",
      "22",
      "54s",
      "53s",
      "43s"
    ],
    "startingRange": [
      "AA",
      "AKo",
      "AKs",
      "AQo",
      "AQs",
      "AJo",
      "AJs",
      "ATo",
      "ATs",
      "A9s",
      "A8s",
      "A7s",
      "A6s",
      "A5s",
      "A4s",
      "A3s",
      "A2s",
      "KK",
      "KQs",
      "KJs",
      "KTs",
      "QQ",
      "QJs",
      "QTs",
      "JJ",
      "JTs",
      "TT",
      "T9s",
      "99",
      "98s",
      "88",
      "87s",
      "77",
      "76s",
      "66",
      "65s",
      "55",
      "54s",
      "53s",
      "44",
      "43s",
      "33",
      "22"
    ],
    "lesson": "The same small sizing can carry different information against different players. This reference model retains ace-based value, sets, and wheel gutshots. The exact cutoff is an exercise assumption; small observation samples do not uniquely determine it.",
    "groups": [
      {
        "id": "ace-pair",
        "label": "Ace pairs and ace-based two pair",
        "tokens": [
          "AK",
          "AQ",
          "AJ",
          "AT",
          "A9s",
          "A8s",
          "A7s",
          "A6s",
          "A5s",
          "A4s",
          "A3s",
          "A2s"
        ],
        "include": true,
        "reason": "Ace pairs and ace-based two pair supply value in this selective bettor’s working range. The strong ace-high board fits the value hands observed after this bet."
      },
      {
        "id": "sets",
        "label": "Sets",
        "tokens": [
          "AA",
          "77",
          "22"
        ],
        "include": true,
        "reason": "Sets are strong value bets in this model, even for a player who checks many other hands."
      },
      {
        "id": "wheel-draws",
        "label": "Wheel gutshots",
        "tokens": [
          "54s",
          "53s",
          "43s"
        ],
        "include": true,
        "reason": "These wheel gutshots supply the model’s semi-bluffs. The profile has shown a wheel draw after this small bet, so the range is not value-only."
      },
      {
        "id": "underpairs",
        "label": "Pocket pairs below the ace",
        "tokens": [
          "KK",
          "QQ",
          "JJ",
          "TT",
          "99",
          "88",
          "66",
          "55",
          "44",
          "33"
        ],
        "include": false,
        "reason": "This selective bettor checks pocket pairs below the ace in the reference model. The observed low betting rate supports a narrower betting range, though the precise cutoff is a practice assumption."
      },
      {
        "id": "middle-pairs",
        "label": "Sevens with a suited connector",
        "tokens": [
          "87s",
          "76s"
        ],
        "include": false,
        "reason": "This selective bettor checks sevens with a suited connector in the reference model. The observed low betting rate supports a narrower betting range, though the precise cutoff is a practice assumption."
      },
      {
        "id": "unpaired",
        "label": "Other suited unpaired hands",
        "tokens": [
          "KQs",
          "KJs",
          "KTs",
          "QJs",
          "QTs",
          "JTs",
          "T9s",
          "98s",
          "65s"
        ],
        "include": false,
        "reason": "This selective bettor checks other suited unpaired hands in the reference model. The observed low betting rate supports a narrower betting range, though the precise cutoff is a practice assumption."
      }
    ],
    "model": "Within the declared starting pool, this simplified flop model bets every ace-pair-or-better hand and every listed wheel gutshot. It checks the pocket underpairs, non-ace pairs, and other unpaired hands.",
    "hint": "Separate the declared starting pool from the hands this player is likely to bet. Then check whether the remaining exact combinations collide with the visible cards.",
    "counterpart": "chart-frequent-flop",
    "scope": "Assume this illustrative starting pool can reach the current street. Use the opponent’s observations and betting line to decide which hands continue betting."
  },
  {
    "id": "chart-frequent-flop",
    "title": "When a small bet reveals little",
    "street": "flop",
    "hero": [
      "As",
      "Qc"
    ],
    "board": [
      "Ah",
      "7d",
      "2c"
    ],
    "heroPosition": "BB",
    "villainPosition": "BTN",
    "potAfterBet": 7.5,
    "history": [
      [
        "Preflop",
        "BTN opens to 2.5bb. SB folds. You call in the BB."
      ],
      [
        "Flop",
        "You check. BTN bets 2bb into 5.5bb."
      ]
    ],
    "profileId": "flopFrequent",
    "potType": "Single-raised pot",
    "range": [
      "AK",
      "AQ",
      "AJ",
      "AT",
      "A9s",
      "A8s",
      "A7s",
      "A6s",
      "A5s",
      "A4s",
      "A3s",
      "A2s",
      "AA",
      "77",
      "22",
      "54s",
      "53s",
      "43s",
      "KK",
      "QQ",
      "JJ",
      "TT",
      "99",
      "88",
      "66",
      "55",
      "44",
      "33",
      "87s",
      "76s",
      "KQs",
      "KJs",
      "KTs",
      "QJs",
      "QTs",
      "JTs",
      "T9s",
      "98s",
      "65s"
    ],
    "startingRange": [
      "AA",
      "AKo",
      "AKs",
      "AQo",
      "AQs",
      "AJo",
      "AJs",
      "ATo",
      "ATs",
      "A9s",
      "A8s",
      "A7s",
      "A6s",
      "A5s",
      "A4s",
      "A3s",
      "A2s",
      "KK",
      "KQs",
      "KJs",
      "KTs",
      "QQ",
      "QJs",
      "QTs",
      "JJ",
      "JTs",
      "TT",
      "T9s",
      "99",
      "98s",
      "88",
      "87s",
      "77",
      "76s",
      "66",
      "65s",
      "55",
      "54s",
      "53s",
      "44",
      "43s",
      "33",
      "22"
    ],
    "lesson": "A frequent small continuation bet can leave the original working range almost intact. Here the reference model bets its entire declared pool; known cards still remove exact combinations. Frequent betting is not a guarantee of literal 100% betting outside this controlled example.",
    "groups": [
      {
        "id": "ace-pair",
        "label": "Ace pairs and ace-based two pair",
        "tokens": [
          "AK",
          "AQ",
          "AJ",
          "AT",
          "A9s",
          "A8s",
          "A7s",
          "A6s",
          "A5s",
          "A4s",
          "A3s",
          "A2s"
        ],
        "include": true,
        "reason": "This frequent small bettor keeps ace pairs and ace-based two pair in the reference betting range. The same sizing appears with strong and weak hands; this exercise models a bet with the entire stated pool."
      },
      {
        "id": "sets",
        "label": "Sets",
        "tokens": [
          "AA",
          "77",
          "22"
        ],
        "include": true,
        "reason": "This frequent small bettor keeps sets in the reference betting range. The same sizing appears with strong and weak hands; this exercise models a bet with the entire stated pool."
      },
      {
        "id": "wheel-draws",
        "label": "Wheel gutshots",
        "tokens": [
          "54s",
          "53s",
          "43s"
        ],
        "include": true,
        "reason": "This frequent small bettor keeps wheel gutshots in the reference betting range. The same sizing appears with strong and weak hands; this exercise models a bet with the entire stated pool."
      },
      {
        "id": "underpairs",
        "label": "Pocket pairs below the ace",
        "tokens": [
          "KK",
          "QQ",
          "JJ",
          "TT",
          "99",
          "88",
          "66",
          "55",
          "44",
          "33"
        ],
        "include": true,
        "reason": "This frequent small bettor keeps pocket pairs below the ace in the reference betting range. The same sizing appears with strong and weak hands; this exercise models a bet with the entire stated pool."
      },
      {
        "id": "middle-pairs",
        "label": "Sevens with a suited connector",
        "tokens": [
          "87s",
          "76s"
        ],
        "include": true,
        "reason": "This frequent small bettor keeps sevens with a suited connector in the reference betting range. The same sizing appears with strong and weak hands; this exercise models a bet with the entire stated pool."
      },
      {
        "id": "unpaired",
        "label": "Other suited unpaired hands",
        "tokens": [
          "KQs",
          "KJs",
          "KTs",
          "QJs",
          "QTs",
          "JTs",
          "T9s",
          "98s",
          "65s"
        ],
        "include": true,
        "reason": "This frequent small bettor keeps other suited unpaired hands in the reference betting range. The same sizing appears with strong and weak hands; this exercise models a bet with the entire stated pool."
      }
    ],
    "model": "This comparison uses a range-bet model: every physically legal hand in the declared starting pool makes the small flop bet. Do not remove a class merely because it missed the flop.",
    "hint": "Separate the declared starting pool from the hands this player is likely to bet. Then check whether the remaining exact combinations collide with the visible cards.",
    "counterpart": "chart-selective-flop",
    "scope": "Assume this illustrative starting pool can reach the current street. Use the opponent’s observations and betting line to decide which hands continue betting."
  },
  {
    "id": "chart-nut-flush-blocked",
    "title": "The flush range with the ace blocked",
    "street": "river",
    "hero": [
      "As",
      "Kh"
    ],
    "board": [
      "Ks",
      "9s",
      "2s",
      "7h",
      "3c"
    ],
    "heroPosition": "BB",
    "villainPosition": "BTN",
    "potAfterBet": 31.5,
    "history": [
      [
        "Preflop",
        "BTN opens to 2.5bb. SB folds. You call in the BB."
      ],
      [
        "Flop",
        "You check. BTN bets 2bb into 5.5bb. You call."
      ],
      [
        "Turn",
        "You check. BTN bets 5bb into 9.5bb. You call."
      ],
      [
        "River",
        "You check. BTN bets 12bb into 19.5bb."
      ]
    ],
    "profileId": "flushValue",
    "potType": "Single-raised pot",
    "range": [
      "AsQs",
      "AsJs",
      "AsTs",
      "As8s",
      "As6s",
      "As5s",
      "As4s",
      "QsJs",
      "QsTs",
      "JsTs",
      "8s6s"
    ],
    "startingRange": [
      "AA",
      "AKo",
      "AKs",
      "AQs",
      "AJs",
      "ATs",
      "A8s",
      "A6s",
      "A5s",
      "A4s",
      "KK",
      "KQo",
      "KQs",
      "KJo",
      "KJs",
      "KTo",
      "KTs",
      "QJs",
      "QTs",
      "JTs",
      "99",
      "86s",
      "22"
    ],
    "lesson": "This exercise combines range filtering with certain card removal. A suited cell stays selected only when its exact spade flush remains possible. A non-spade version of the same class can still be physically legal but checks in this reference model. The paired hand changes only the suit of your ace. Real river ranges can contain other value bets and bluffs.",
    "groups": [
      {
        "id": "flushes",
        "label": "Flushes from the declared suited hands",
        "tokens": [
          "AsQs",
          "AsJs",
          "AsTs",
          "As8s",
          "As6s",
          "As5s",
          "As4s",
          "QsJs",
          "QsTs",
          "JsTs",
          "8s6s"
        ],
        "include": true,
        "reason": "Only the spade-spade version makes a flush on this board. This cautious player’s river reference range bets those flushes; other suits of the same hand check."
      },
      {
        "id": "sets",
        "label": "Sets",
        "tokens": [
          "KK",
          "99",
          "22"
        ],
        "include": false,
        "reason": "This model checks sets on the three-spade board. The observed river bets showed flushes, and the player has checked back weaker made hands."
      },
      {
        "id": "one-pair",
        "label": "One-pair hands",
        "tokens": [
          "AA",
          "AK",
          "KQ",
          "KJ",
          "KT"
        ],
        "include": false,
        "reason": "This model checks one-pair hands on the three-spade board. The observed river bets showed flushes, and the player has checked back weaker made hands."
      }
    ],
    "model": "Within this declared pool, the river reference model bets only its made flushes. Sets and one-pair hands check. Each flush requires the two spade cards belonging to its suited class; discard a class if its only continuing combo is blocked.",
    "hint": "Separate the declared starting pool from the hands this player is likely to bet. Then check whether the remaining exact combinations collide with the visible cards.",
    "counterpart": "chart-nut-flush-unblocked",
    "scope": "Assume this illustrative starting pool can reach the current street. Use the opponent’s observations and betting line to decide which hands continue betting.",
    "comparisonLabel": "Same villain, different blocker"
  },
  {
    "id": "chart-nut-flush-unblocked",
    "title": "Same ranks, different suit",
    "street": "river",
    "hero": [
      "Ah",
      "Kh"
    ],
    "board": [
      "Ks",
      "9s",
      "2s",
      "7h",
      "3c"
    ],
    "heroPosition": "BB",
    "villainPosition": "BTN",
    "potAfterBet": 31.5,
    "history": [
      [
        "Preflop",
        "BTN opens to 2.5bb. SB folds. You call in the BB."
      ],
      [
        "Flop",
        "You check. BTN bets 2bb into 5.5bb. You call."
      ],
      [
        "Turn",
        "You check. BTN bets 5bb into 9.5bb. You call."
      ],
      [
        "River",
        "You check. BTN bets 12bb into 19.5bb."
      ]
    ],
    "profileId": "flushValue",
    "potType": "Single-raised pot",
    "range": [
      "AsQs",
      "AsJs",
      "AsTs",
      "As8s",
      "As6s",
      "As5s",
      "As4s",
      "QsJs",
      "QsTs",
      "JsTs",
      "8s6s"
    ],
    "startingRange": [
      "AA",
      "AKo",
      "AKs",
      "AQs",
      "AJs",
      "ATs",
      "A8s",
      "A6s",
      "A5s",
      "A4s",
      "KK",
      "KQo",
      "KQs",
      "KJo",
      "KJs",
      "KTo",
      "KTs",
      "QJs",
      "QTs",
      "JTs",
      "99",
      "86s",
      "22"
    ],
    "lesson": "This exercise combines range filtering with certain card removal. A suited cell stays selected only when its exact spade flush remains possible. A non-spade version of the same class can still be physically legal but checks in this reference model. The paired hand changes only the suit of your ace. Real river ranges can contain other value bets and bluffs.",
    "groups": [
      {
        "id": "flushes",
        "label": "Flushes from the declared suited hands",
        "tokens": [
          "AsQs",
          "AsJs",
          "AsTs",
          "As8s",
          "As6s",
          "As5s",
          "As4s",
          "QsJs",
          "QsTs",
          "JsTs",
          "8s6s"
        ],
        "include": true,
        "reason": "Only the spade-spade version makes a flush on this board. This cautious player’s river reference range bets those flushes; other suits of the same hand check."
      },
      {
        "id": "sets",
        "label": "Sets",
        "tokens": [
          "KK",
          "99",
          "22"
        ],
        "include": false,
        "reason": "This model checks sets on the three-spade board. The observed river bets showed flushes, and the player has checked back weaker made hands."
      },
      {
        "id": "one-pair",
        "label": "One-pair hands",
        "tokens": [
          "AA",
          "AK",
          "KQ",
          "KJ",
          "KT"
        ],
        "include": false,
        "reason": "This model checks one-pair hands on the three-spade board. The observed river bets showed flushes, and the player has checked back weaker made hands."
      }
    ],
    "model": "Within this declared pool, the river reference model bets only its made flushes. Sets and one-pair hands check. Each flush requires the two spade cards belonging to its suited class; discard a class if its only continuing combo is blocked.",
    "hint": "Separate the declared starting pool from the hands this player is likely to bet. Then check whether the remaining exact combinations collide with the visible cards.",
    "counterpart": "chart-nut-flush-blocked",
    "scope": "Assume this illustrative starting pool can reach the current street. Use the opponent’s observations and betting line to decide which hands continue betting.",
    "comparisonLabel": "Same villain, different blocker"
  }
];
