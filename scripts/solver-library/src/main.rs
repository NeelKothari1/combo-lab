// SPDX-License-Identifier: AGPL-3.0-or-later
// Offline numerical-data adapter; no solver implementation is bundled in the website.
#![recursion_limit = "256"]
use postflop_solver::*;
use serde::Deserialize;
use serde_json::{json, Value};

const COMMIT: &str = "9d1509fe5077d019825f833eed04b16d342dfda1";
const MAX_ITERATIONS: u32 = 10_000;
const TARGET_POT_PERCENT: f32 = 0.01;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Input {
    id: String,
    title: String,
    board: [String; 5],
    pot: i32,
    stack: i32,
    oop_range: String,
    ip_range: String,
    hero_oop: [String; 2],
    hero_ip: [String; 2],
    bet_size: String,
}

fn hand_class(a: &str, b: &str) -> String {
    let ranks = "23456789TJQKA";
    let rank_a = a.chars().next().unwrap();
    let rank_b = b.chars().next().unwrap();
    if rank_a == rank_b {
        return format!("{rank_a}{rank_b}");
    }
    let (high, low) = if ranks.find(rank_a) > ranks.find(rank_b) {
        (rank_a, rank_b)
    } else {
        (rank_b, rank_a)
    };
    let suited = if a.as_bytes()[1] == b.as_bytes()[1] {
        's'
    } else {
        'o'
    };
    format!("{high}{low}{suited}")
}

fn action_json(action: Action) -> Value {
    match action {
        Action::Check => json!({"label":"Check","kind":"check","amount":0}),
        Action::Fold => json!({"label":"Fold","kind":"fold","amount":0}),
        Action::Call => json!({"label":"Call","kind":"call"}),
        Action::Bet(n) => json!({"label":format!("Bet {n} bb"),"kind":"bet","amount":n}),
        Action::Raise(n) => json!({"label":format!("Raise to {n} bb"),"kind":"raise","amount":n}),
        Action::AllIn(n) => json!({"label":format!("All-in {n} bb"),"kind":"all-in","amount":n}),
        _ => panic!("Unexpected river action"),
    }
}

fn generate(input: &Input) -> Vec<Value> {
    let card_config = CardConfig {
        range: [
            input.oop_range.parse().unwrap(),
            input.ip_range.parse().unwrap(),
        ],
        flop: flop_from_str(&input.board[..3].join("")).unwrap(),
        turn: card_from_str(&input.board[3]).unwrap(),
        river: card_from_str(&input.board[4]).unwrap(),
    };
    let sizes =
        BetSizeOptions::try_from((format!("{}, a", input.bet_size).as_str(), "2.5x, a")).unwrap();
    let tree_config = TreeConfig {
        initial_state: BoardState::River,
        starting_pot: input.pot,
        effective_stack: input.stack,
        rake_rate: 0.0,
        rake_cap: 0.0,
        river_bet_sizes: [sizes.clone(), sizes],
        add_allin_threshold: 0.0,
        force_allin_threshold: 0.0,
        merging_threshold: 0.0,
        ..Default::default()
    };
    let tree = ActionTree::new(tree_config).unwrap();
    let mut game = PostFlopGame::with_config(card_config, tree).unwrap();
    game.allocate_memory(false);
    let target = input.pot as f32 * TARGET_POT_PERCENT / 100.0;
    let mut exploitability = compute_exploitability(&game);
    let mut iterations = 0;
    while iterations < MAX_ITERATIONS && exploitability > target {
        solve_step(&game, iterations);
        iterations += 1;
        if iterations % 10 == 0 || iterations == MAX_ITERATIONS {
            exploitability = compute_exploitability(&game);
        }
    }
    assert!(
        exploitability.is_finite() && exploitability >= -0.0001 && exploitability <= target,
        "{} did not converge: {} bb after {} iterations",
        input.id,
        exploitability,
        iterations
    );
    finalize(&mut game);
    eprintln!(
        "{}: {} iterations; exploitability {:.6} bb ({:.6}% pot)",
        input.id,
        iterations,
        exploitability,
        100.0 * exploitability / input.pot as f32
    );

    let mut spots = Vec::new();
    for villain in 0..2 {
        game.back_to_root();
        let mut history = Vec::new();
        if villain == 1 {
            let check = game
                .available_actions()
                .iter()
                .position(|a| *a == Action::Check)
                .unwrap();
            game.play(check);
            history.push(json!({"street":"river","actor":"OOP","action":"check","amount":0,"potBefore":input.pot}));
        }
        assert_eq!(game.current_player(), villain);
        let actions = game.available_actions();
        let action_index = actions
            .iter()
            .position(|a| matches!(a, Action::Bet(_)))
            .unwrap();
        let bet_amount = match actions[action_index] {
            Action::Bet(n) => n,
            _ => unreachable!(),
        };
        let hero = if villain == 0 {
            &input.hero_ip
        } else {
            &input.hero_oop
        };
        let hero_cards = [
            card_from_str(&hero[0]).unwrap(),
            card_from_str(&hero[1]).unwrap(),
        ];
        let hero_index = game
            .private_cards(villain ^ 1)
            .iter()
            .position(|&(a, b)| {
                (a == hero_cards[0] && b == hero_cards[1])
                    || (a == hero_cards[1] && b == hero_cards[0])
            })
            .expect("Hero must be in the supplied range");
        assert!(
            game.weights(villain ^ 1)[hero_index] > 0.000001,
            "Hero must reach this node"
        );
        let strategy = game.strategy();
        let priors = game.weights(villain).to_vec();
        let private_cards = game.private_cards(villain);
        let num_hands = private_cards.len();
        let combos: Vec<Value> = private_cards.iter().enumerate().filter_map(|(index, &(a,b))| {
            // Hero is never exposed to the solver. Remove their cards only when exporting
            // villain's range as observed by this particular hero.
            if hero_cards.contains(&a) || hero_cards.contains(&b) { return None; }
            let card_a = card_to_string(a).unwrap();
            let card_b = card_to_string(b).unwrap();
            let prior = priors[index];
            let probability = strategy[action_index * num_hands + index];
            let weight = prior * probability;
            assert!((0.0..=1.0).contains(&prior) && (0.0..=1.000001).contains(&probability));
            Some(json!({
                "cards":[card_a,card_b],"hand":hand_class(&card_a,&card_b),
                "priorWeight":prior,"actionProbability":probability,"reachWeight":weight,"targetWeight":weight,
                "actionProbabilities":actions.iter().enumerate().map(|(action,_)| strategy[action * num_hands + index]).collect::<Vec<_>>()
            }))
        }).collect();
        assert!(
            combos
                .iter()
                .map(|c| c["targetWeight"].as_f64().unwrap())
                .sum::<f64>()
                > 1.0
        );
        let villain_position = if villain == 0 { "OOP" } else { "IP" };
        let hero_position = if villain == 0 { "IP" } else { "OOP" };
        history.push(json!({"street":"river","actor":villain_position,"action":"bet","amount":bet_amount,"potBefore":input.pot}));
        let range = if villain == 0 {
            &input.oop_range
        } else {
            &input.ip_range
        };
        spots.push(json!({
            "id":format!("solver-{}-{}",input.id,villain_position.to_lowercase()),
            "title":format!("{} · {} bets",input.title,villain_position),
            "mode":"gto","street":"river","board":input.board,"hero":hero,
            "heroPosition":hero_position,"villainPosition":villain_position,
            "pot":input.pot,"stack":input.stack,"potAfterBet":input.pot+bet_amount,
            "betAmount":bet_amount,"rake":{"rate":0,"cap":0},"history":history,
            "startingRange":range.split(',').map(|token| token.split(':').next().unwrap()).collect::<Vec<_>>(),
            "startingRanges":{"OOP":input.oop_range,"IP":input.ip_range},
            "rangeScope":"Supplied river-start ranges. Earlier streets are not solved or inferred.",
            "heroNodeReachWeight":game.weights(villain ^ 1)[hero_index],
            "actions":actions.iter().map(|a|action_json(*a)).collect::<Vec<_>>(),
            "selectedActionIndex":action_index,"selectedAction":action_json(actions[action_index]),
            "combos":combos,
            "solver":{
                "engine":"b-inary/postflop-solver","commit":COMMIT,
                "source":"https://github.com/b-inary/postflop-solver",
                "algorithm":"Discounted CFR","abstraction":"No card abstraction; exact private-card combinations",
                "iterations":iterations,"maxIterations":MAX_ITERATIONS,
                "targetExploitabilityPotPercent":TARGET_POT_PERCENT,
                "exploitability":exploitability,"exploitabilityPotPercent":100.0*exploitability/input.pot as f32,
                "exploitabilityUnit":"bb","convergenceScope":"Root of this configured river game; not a guarantee for every individual hand or later node",
                "tree":{
                    "initialStreet":"river","startingPot":input.pot,"effectiveStack":input.stack,
                    "oopRange":input.oop_range,"ipRange":input.ip_range,"board":input.board,
                    "betSizes":[input.bet_size,"all-in"],"raiseSizes":["2.5x","all-in"],
                    "rakeRate":0,"rakeCap":0,"addAllinThreshold":0,"forceAllinThreshold":0,"mergingThreshold":0,
                    "compression":false,"bunching":false
                }
            }
        }));
    }
    spots
}

fn main() {
    let inputs: Vec<Input> = serde_json::from_str(include_str!("../inputs.json")).unwrap();
    let scenarios: Vec<Value> = inputs.iter().flat_map(generate).collect();
    let result = json!({
        "meta":{
            "schemaVersion":1,"engine":"b-inary/postflop-solver","engineCommit":COMMIT,
            "engineLicense":"AGPL-3.0-or-later","solverSource":"https://github.com/b-inary/postflop-solver",
            "frontendSource":"https://github.com/b-inary/wasm-postflop",
            "scope":"Heads-up river subgames with explicitly supplied starting ranges, zero rake, and a restricted betting tree. These are conditional solver exercises, not solved preflop-to-river strategies.",
            "weightSemantics":"targetWeight = priorWeight × actionProbability; unnormalized weighted combinations, not probabilities that sum to one. Hero card removal happens after range-versus-range solving.",
            "validation":"Native solver convergence checked for each configured root. Independent solver cross-validation has not yet been performed.",
            "targetExploitabilityPotPercent":TARGET_POT_PERCENT,"maxIterations":MAX_ITERATIONS,
            "gameCount":inputs.len(),"scenarioCount":scenarios.len()
        },
        "scenarios":scenarios
    });
    println!("{}", serde_json::to_string(&result).unwrap());
}
