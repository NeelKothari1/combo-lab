export const tendencyScenarios = [
  {
    "id": "read-selective-3bet",
    "title": "A selective 3-bettor",
    "level": "Applied",
    "street": "preflop",
    "hero": [
      "As",
      "Qd"
    ],
    "board": [],
    "heroPosition": "CO",
    "villainPosition": "BTN",
    "potAfterBet": 12,
    "history": [
      [
        "Preflop",
        "You open to 2.5bb in the CO. BTN 3-bets to 8bb. Both blinds fold. Action is on you."
      ]
    ],
    "range": [
      "AA",
      "KK",
      "QQ",
      "AK"
    ],
    "question": "How many combos remain in the selected training range?",
    "profileId": "selective3bet",
    "kind": "remaining",
    "topic": "tendencies",
    "potType": "3-bet pot",
    "lesson": "A low observed 3-bet rate and strong shown 3-bets support starting narrower. Your ace and queen remove premium combinations. A few strong showdowns do not prove that this player never 3-bets JJ or a bluff. This exact cutoff belongs to the practice model.",
    "hint": "Count each retained hand class separately. Remove both board and hole cards before adding the unique combinations.",
    "rangeTask": {
      "model": "For this simplified response to a CO open, Villain 3-bets QQ, KK, AA, and every AK. The other offered groups call or fold instead.",
      "groups": [
        {
          "id": "premiums",
          "label": "Premium pairs and AK",
          "tokens": [
            "AA",
            "KK",
            "QQ",
            "AK"
          ],
          "include": true,
          "reason": "Both models include these premium hands as 3-bets. Known cards still remove individual combinations."
        },
        {
          "id": "medium-pairs",
          "label": "Medium pocket pairs",
          "tokens": [
            "JJ",
            "TT"
          ],
          "include": false,
          "reason": "The selective model puts these pairs in its calling or folding range, not this 3-bet range."
        },
        {
          "id": "suited-broadways",
          "label": "Suited broadways",
          "tokens": [
            "AQs",
            "AJs",
            "KQs"
          ],
          "include": false,
          "reason": "In this selective model, these hands call or fold instead of reraising."
        },
        {
          "id": "wheel-aces",
          "label": "Suited wheel aces",
          "tokens": [
            "A5s",
            "A4s"
          ],
          "include": false,
          "reason": "The selective model does not use these light 3-bets in this exercise."
        },
        {
          "id": "connectors",
          "label": "Low suited connectors",
          "tokens": [
            "76s",
            "65s"
          ],
          "include": false,
          "reason": "Even this exercise’s wide 3-bet model excludes the offered low connectors. Wide does not mean every hand."
        }
      ],
      "hint": "Separate the hands this model bets or raises from the hands it checks, calls, or folds. Choose whole groups now; apply exact card removal in step 2.",
      "counterpart": "read-wide-3bet"
    }
  },
  {
    "id": "read-wide-3bet",
    "title": "Pressure against a late opener",
    "level": "Applied",
    "street": "preflop",
    "hero": [
      "As",
      "Qd"
    ],
    "board": [],
    "heroPosition": "CO",
    "villainPosition": "BTN",
    "potAfterBet": 12,
    "history": [
      [
        "Preflop",
        "You open to 2.5bb in the CO. BTN 3-bets to 8bb. Both blinds fold. Action is on you."
      ]
    ],
    "range": [
      "AA",
      "KK",
      "QQ",
      "AK",
      "JJ",
      "TT",
      "AQs",
      "AJs",
      "KQs",
      "A5s",
      "A4s"
    ],
    "question": "How many combos remain in the selected training range?",
    "profileId": "wide3bet",
    "kind": "remaining",
    "topic": "tendencies",
    "potType": "3-bet pot",
    "lesson": "Shown light 3-bets make a premium-only model too narrow. More candidate groups survive, but known cards still remove specific combos. A wide 3-bet tendency does not mean every speculative hand is a 3-bet; real strategies also mix frequencies.",
    "hint": "Count each retained hand class separately. Remove both board and hole cards before adding the unique combinations.",
    "rangeTask": {
      "model": "Against this CO open, the practice model 3-bets every offered premium, TT/JJ, suited broadway, and suited wheel ace. It excludes the offered low connectors.",
      "groups": [
        {
          "id": "premiums",
          "label": "Premium pairs and AK",
          "tokens": [
            "AA",
            "KK",
            "QQ",
            "AK"
          ],
          "include": true,
          "reason": "Both models include these premium hands as 3-bets. Known cards still remove individual combinations."
        },
        {
          "id": "medium-pairs",
          "label": "Medium pocket pairs",
          "tokens": [
            "JJ",
            "TT"
          ],
          "include": true,
          "reason": "This wider model reraises JJ and TT rather than assigning them only to calls."
        },
        {
          "id": "suited-broadways",
          "label": "Suited broadways",
          "tokens": [
            "AQs",
            "AJs",
            "KQs"
          ],
          "include": true,
          "reason": "The wider model includes these suited broadways in its 3-betting range."
        },
        {
          "id": "wheel-aces",
          "label": "Suited wheel aces",
          "tokens": [
            "A5s",
            "A4s"
          ],
          "include": true,
          "reason": "The wider model includes the offered suited wheel aces as light 3-bets."
        },
        {
          "id": "connectors",
          "label": "Low suited connectors",
          "tokens": [
            "76s",
            "65s"
          ],
          "include": false,
          "reason": "Even this exercise’s wide 3-bet model excludes the offered low connectors. Wide does not mean every hand."
        }
      ],
      "hint": "Separate the hands this model bets or raises from the hands it checks, calls, or folds. Choose whole groups now; apply exact card removal in step 2.",
      "counterpart": "read-selective-3bet"
    }
  },
  {
    "id": "read-giveup-turn",
    "title": "The second barrel means more",
    "level": "Applied",
    "street": "turn",
    "hero": [
      "Ac",
      "Qd"
    ],
    "board": [
      "Ah",
      "9h",
      "5c",
      "2d"
    ],
    "heroPosition": "BB",
    "villainPosition": "BTN",
    "potAfterBet": 14.5,
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
        "You check. BTN bets 5bb into 9.5bb."
      ]
    ],
    "range": [
      "AA",
      "99",
      "55",
      "A9s",
      "A5s",
      "A2s",
      "AK"
    ],
    "question": "How many combos remain in the selected training range?",
    "profileId": "giveup",
    "kind": "remaining",
    "topic": "tendencies",
    "potType": "Single-raised pot",
    "lesson": "This opponent often gives up after small flop bets. In the stated model, the second barrel removes weak made hands and draws from the betting range. The sample supports a stronger working range, not zero real-world semibluffs. Exclusions here are explicit teaching assumptions.",
    "hint": "Count each retained hand class separately. Remove both board and hole cards before adding the unique combinations.",
    "rangeTask": {
      "model": "For this turn bet, include the offered top-pair/top-kicker-or-better group. Check back the weaker top pairs, all listed unmade draws, underpairs, and undrawn high cards.",
      "groups": [
        {
          "id": "strong-value",
          "label": "Top pair/top kicker or better",
          "tokens": [
            "AA",
            "99",
            "55",
            "A9s",
            "A5s",
            "A2s",
            "AK"
          ],
          "include": true,
          "reason": "The model keeps this offered value group, including AK as its strongest one-pair hand."
        },
        {
          "id": "thin-top-pair",
          "label": "Thinner top pairs",
          "tokens": [
            "AQ",
            "AJ",
            "AT"
          ],
          "include": false,
          "reason": "The model checks these weaker top pairs instead of taking the current betting action."
        },
        {
          "id": "draws",
          "label": "Two-heart flush draws",
          "tokens": [
            "KhQh",
            "KhJh",
            "KhTh",
            "QhJh",
            "QhTh",
            "JhTh",
            "8h7h"
          ],
          "include": false,
          "reason": "The give-up model takes the free card with these draws instead of betting this turn."
        },
        {
          "id": "underpairs",
          "label": "Underpairs to the ace",
          "tokens": [
            "KK",
            "QQ",
            "JJ",
            "TT"
          ],
          "include": false,
          "reason": "The model checks these pairs below the ace; they are not part of its current betting range."
        },
        {
          "id": "undrawn-air",
          "label": "Offsuit high cards without a flush draw",
          "tokens": [
            "KQo",
            "KJo"
          ],
          "include": false,
          "reason": "The model excludes these offsuit high-card hands from this bet. They do not have the specified flush draw."
        }
      ],
      "hint": "Separate the hands this model bets or raises from the hands it checks, calls, or folds. Choose whole groups now; apply exact card removal in step 2.",
      "counterpart": "read-pressure-turn"
    }
  },
  {
    "id": "read-pressure-turn",
    "title": "Draws keep betting",
    "level": "Applied",
    "street": "turn",
    "hero": [
      "Ac",
      "Qd"
    ],
    "board": [
      "Ah",
      "9h",
      "5c",
      "2d"
    ],
    "heroPosition": "BB",
    "villainPosition": "BTN",
    "potAfterBet": 14.5,
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
        "You check. BTN bets 5bb into 9.5bb."
      ]
    ],
    "range": [
      "AA",
      "99",
      "55",
      "A9s",
      "A5s",
      "A2s",
      "AK",
      "AQ",
      "AJ",
      "AT",
      "KhQh",
      "KhJh",
      "KhTh",
      "QhJh",
      "QhTh",
      "JhTh",
      "8h7h"
    ],
    "question": "How many combos remain in the selected training range?",
    "profileId": "pressure",
    "kind": "remaining",
    "topic": "tendencies",
    "potType": "Single-raised pot",
    "lesson": "This model bets thinly with AJ/AT and applies pressure with draws, so a second barrel is not restricted to top-pair/top-kicker or better. Do not carry this turn model to the river automatically: an unmade draw can be bet now and checked when it misses.",
    "hint": "Count each retained hand class separately. Remove both board and hole cards before adding the unique combinations.",
    "rangeTask": {
      "model": "For this turn bet, include all offered top-pair-or-better hands and every listed two-heart draw. Check the listed underpairs and offsuit high cards without a flush draw.",
      "groups": [
        {
          "id": "strong-value",
          "label": "Top pair/top kicker or better",
          "tokens": [
            "AA",
            "99",
            "55",
            "A9s",
            "A5s",
            "A2s",
            "AK"
          ],
          "include": true,
          "reason": "The model keeps this offered value group, including AK as its strongest one-pair hand."
        },
        {
          "id": "thin-top-pair",
          "label": "Thinner top pairs",
          "tokens": [
            "AQ",
            "AJ",
            "AT"
          ],
          "include": true,
          "reason": "This turn model also bets the offered weaker top pairs for thin value."
        },
        {
          "id": "draws",
          "label": "Two-heart flush draws",
          "tokens": [
            "KhQh",
            "KhJh",
            "KhTh",
            "QhJh",
            "QhTh",
            "JhTh",
            "8h7h"
          ],
          "include": true,
          "reason": "The pressure model continues with these unmade flush draws as semi-bluffs."
        },
        {
          "id": "underpairs",
          "label": "Underpairs to the ace",
          "tokens": [
            "KK",
            "QQ",
            "JJ",
            "TT"
          ],
          "include": false,
          "reason": "The model checks these pairs below the ace; they are not part of its current betting range."
        },
        {
          "id": "undrawn-air",
          "label": "Offsuit high cards without a flush draw",
          "tokens": [
            "KQo",
            "KJo"
          ],
          "include": false,
          "reason": "The model excludes these offsuit high-card hands from this bet. They do not have the specified flush draw."
        }
      ],
      "hint": "Separate the hands this model bets or raises from the hands it checks, calls, or folds. Choose whole groups now; apply exact card removal in step 2.",
      "counterpart": "read-giveup-turn"
    }
  },
  {
    "id": "read-value-river",
    "title": "A value-heavy river bet",
    "level": "Applied",
    "street": "river",
    "hero": [
      "Ac",
      "Qd"
    ],
    "board": [
      "Ah",
      "9h",
      "5c",
      "2d",
      "7s"
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
    "range": [
      "AA",
      "99",
      "55",
      "A9s",
      "A5s",
      "A2s",
      "AK"
    ],
    "question": "How many combos remain in the selected training range?",
    "profileId": "value",
    "kind": "remaining",
    "topic": "tendencies",
    "potType": "Single-raised pot",
    "lesson": "Repeated missed-draw check-backs justify removing those candidates in the exercise model. AK remains as the explicit strongest-one-pair exception. Excluding all bluffs is a simplification for this comparison, not a claim that the observed opponent literally never bluffs.",
    "hint": "Count each retained hand class separately. Remove both board and hole cards before adding the unique combinations.",
    "rangeTask": {
      "model": "In this river model, bet the offered top-pair/top-kicker-or-better group. Check all weaker one-pair hands, missed draws, and undrawn high cards.",
      "groups": [
        {
          "id": "strong-value",
          "label": "Top pair/top kicker or better",
          "tokens": [
            "AA",
            "99",
            "55",
            "A9s",
            "A5s",
            "A2s",
            "AK"
          ],
          "include": true,
          "reason": "The model keeps this offered value group, including AK as its strongest one-pair hand."
        },
        {
          "id": "thin-top-pair",
          "label": "Thinner top pairs",
          "tokens": [
            "AQ",
            "AJ",
            "AT"
          ],
          "include": false,
          "reason": "The model checks these weaker top pairs instead of taking the current betting action."
        },
        {
          "id": "missed-draws",
          "label": "Missed high-card flush draws",
          "tokens": [
            "KhQh",
            "KhJh",
            "KhTh",
            "QhJh",
            "QhTh",
            "JhTh"
          ],
          "include": false,
          "reason": "The value-first model gives up these missed draws on the river."
        },
        {
          "id": "underpairs",
          "label": "Underpairs to the ace",
          "tokens": [
            "KK",
            "QQ",
            "JJ",
            "TT"
          ],
          "include": false,
          "reason": "The model checks these pairs below the ace; they are not part of its current betting range."
        },
        {
          "id": "undrawn-air",
          "label": "Offsuit high cards without the missed flush draw",
          "tokens": [
            "KQo",
            "KJo"
          ],
          "include": false,
          "reason": "The model excludes these offsuit high-card hands from this bet. They do not have the specified flush draw."
        }
      ],
      "hint": "Separate the hands this model bets or raises from the hands it checks, calls, or folds. Choose whole groups now; apply exact card removal in step 2.",
      "counterpart": "read-bluffer-river"
    }
  },
  {
    "id": "read-bluffer-river",
    "title": "The same river, more bluffs",
    "level": "Applied",
    "street": "river",
    "hero": [
      "Ac",
      "Qd"
    ],
    "board": [
      "Ah",
      "9h",
      "5c",
      "2d",
      "7s"
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
    "range": [
      "AA",
      "99",
      "55",
      "A9s",
      "A5s",
      "A2s",
      "AK",
      "KhQh",
      "KhJh",
      "KhTh",
      "QhJh",
      "QhTh",
      "JhTh"
    ],
    "question": "How many combos remain in the selected training range?",
    "profileId": "bluffer",
    "kind": "remaining",
    "topic": "tendencies",
    "potType": "Single-raised pot",
    "lesson": "Compared with the value-first model, six specified missed draws survive. Your queen of diamonds leaves all six available. Shown missed draws support including bluffs, not a known 100% bluffing frequency. Every listed bluff is full-frequency only in this exercise.",
    "hint": "Count each retained hand class separately. Remove both board and hole cards before adding the unique combinations.",
    "rangeTask": {
      "model": "Use the same offered value group as the comparison hand, plus every listed missed high-card flush draw as a bluff. Check the weaker one-pair hands and undrawn high cards.",
      "groups": [
        {
          "id": "strong-value",
          "label": "Top pair/top kicker or better",
          "tokens": [
            "AA",
            "99",
            "55",
            "A9s",
            "A5s",
            "A2s",
            "AK"
          ],
          "include": true,
          "reason": "The model keeps this offered value group, including AK as its strongest one-pair hand."
        },
        {
          "id": "thin-top-pair",
          "label": "Thinner top pairs",
          "tokens": [
            "AQ",
            "AJ",
            "AT"
          ],
          "include": false,
          "reason": "The model checks these weaker top pairs instead of taking the current betting action."
        },
        {
          "id": "missed-draws",
          "label": "Missed high-card flush draws",
          "tokens": [
            "KhQh",
            "KhJh",
            "KhTh",
            "QhJh",
            "QhTh",
            "JhTh"
          ],
          "include": true,
          "reason": "This river model turns these exact missed flush draws into bluffs."
        },
        {
          "id": "underpairs",
          "label": "Underpairs to the ace",
          "tokens": [
            "KK",
            "QQ",
            "JJ",
            "TT"
          ],
          "include": false,
          "reason": "The model checks these pairs below the ace; they are not part of its current betting range."
        },
        {
          "id": "undrawn-air",
          "label": "Offsuit high cards without the missed flush draw",
          "tokens": [
            "KQo",
            "KJo"
          ],
          "include": false,
          "reason": "The model excludes these offsuit high-card hands from this bet. They do not have the specified flush draw."
        }
      ],
      "hint": "Separate the hands this model bets or raises from the hands it checks, calls, or folds. Choose whole groups now; apply exact card removal in step 2.",
      "counterpart": "read-value-river"
    },
    "alternative": [
      "Ac",
      "Qh"
    ],
    "comparison": "Changing only the queen removes three missed-draw bluffs while leaving the twenty value combos available."
  }
];
