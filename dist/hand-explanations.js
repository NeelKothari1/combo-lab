import {expandRange} from './engine.js';
import {chartContext,handClass,reasonForHand} from './chart-engine.js';
import {profileFor} from './profiles.js';

const coaching={
 selective3bet:{
  'medium-pairs':['JJ and TT can be strong enough to continue against an open without being reraises. This opponent has shown JJ in calls and rarely 3-bets, so the exercise puts these pairs in calls or folds and starts the pair 3-bets at QQ.',2],
  'suited-broadways':['Suited broadways can call an open without taking this player’s rare 3-bet line. The observed AQs call supports that distinction; the exact cutoff for AJs and KQs is a teaching assumption.',2],
  'wheel-aces':['A small suited ace can serve as a light 3-bet for some players, but this opponent’s observed reraises are scarce and strong. The exercise does not assign them these bluff 3-bets.',0],
  connectors:['Suited connectivity gives a hand potential; it does not establish that this player reraises it. This narrow model keeps low suited connectors out of the 3-bet range.',0]
 },
 wide3bet:{
  connectors:['A wider 3-bet range still has a boundary. Showing A5s and AJs supports some light reraises, but does not show that every suited connector is reraised. The exercise excludes these low connectors.',1]
 },
 giveup:{
  'thin-top-pair':['Top pair can call or check without being strong enough for this player’s second barrel. Their shown second barrels are stronger than their flop bets; this model checks AQ, AJ, and AT and uses AK as its one-pair value cutoff.',2],
  draws:['These hands have a two-heart flush draw, but a draw does not have to bet. This opponent often stops after the flop, so the model takes a free turn card with them instead of semi-bluffing.',1],
  underpairs:['On this ace-high board these pairs have showdown value but are behind any ace. This opponent’s stronger second-barrel pattern makes a check more consistent with the reference model.',2],
  'undrawn-air':['These offsuit high cards have neither a pair nor the modeled two-heart flush draw. Continuing them would require an additional bluffing assumption that this give-up profile does not support.',1]
 },
 pressure:{
  underpairs:['Aggression does not mean betting every hand. These pairs are below the ace and can take a showdown; this player is observed checking medium-strength pairs. The model uses stronger made hands and draws for pressure.',2],
  'undrawn-air':['The observed pressure comes from made hands and unmade draws. These offsuit high cards lack the two-heart draw used as the model’s semi-bluff, so they are checked.',0]
 },
 value:{
  'thin-top-pair':['Being top pair is not enough for this modeled third barrel. This value-first player often checks one-pair hands; the exercise makes AK the one-pair exception and checks AQ, AJ, and AT.',2],
  'missed-draws':['The heart draw did not complete. Betting it now would be a bluff rather than a semi-bluff. This opponent has checked back missed draws, so the reference range gives up these hands.',0],
  underpairs:['These pocket pairs remain below the ace. Betting them would need thin-value or bluff assumptions absent from this value-heavy river model; they check instead.',2],
  'undrawn-air':['These unpaired offsuit hands would need to bluff this river. The value-first model does not include those bluffs, and they are not the missed heart draws used in the comparison exercise.',0]
 },
 bluffer:{
  'thin-top-pair':['A player who bluffs missed draws can still check medium-strength made hands. The model checks AQ, AJ, and AT for showdown and bets its stronger value hands alongside selected missed draws.',2],
  underpairs:['These pairs have showdown value. The observed bluffing tendency concerns missed draws, not every weak hand; this reference range checks underpairs instead of turning them into bluffs.',2],
  'undrawn-air':['A bluffing tendency needs specific bluff candidates. These offsuit hands are outside the modeled missed heart draws. The exercise includes those exact failed draws, not every unpaired hand.',0]
 },
 flopSelective:{
  underpairs:['A small bet can still be selective. These pairs are below the ace, and this player has shown underpairs after checking back. The model keeps them in the check range.',1],
  'middle-pairs':['A pair of sevens has some showdown value but is below the ace. For this low-frequency bettor the exercise checks those medium hands and bets stronger value plus selected wheel draws.',0],
  unpaired:['Missing an ace-high flop does not force a bet. This selective model uses wheel gutshots as its draw bets and checks these other unpaired hands; the exact draw cutoff is an exercise assumption.',2]
 },
 flushValue:{
  sets:['A set is strong, but this board allows a flush. This cautious opponent has shown sets after checking back; the reference river model therefore checks sets and bets only made flushes.',1],
  'one-pair':['One pair has showdown value but does not make a flush. This player has checked back one-pair hands after betting earlier streets, so the reference model checks these hands on the river.',2]
 }
};

export function explainHand(s,hand,ctx=chartContext(s)){
 const p=profileFor(s),known=[...s.board,...s.hero];
 const modelBefore=ctx.beforeTarget.get(hand)||[];
 const removed=modelBefore.filter(c=>c.some(card=>known.includes(card)));
 const live=ctx.target.get(hand)||[];
 const group=ctx.groupCandidates.get(hand)?.[0]?.group;
 const coachingNote=coaching[s.profileId]?.[group?.id];
 let kind='action',title='Does not take this betting line',reason=coachingNote?.[0]||reasonForHand(s,hand,ctx);
 if(live.length){kind='included';title='Fits the working betting range';reason=reasonForHand(s,hand,ctx)}
 else if(!ctx.legal.has(hand)){kind='impossible';title='Ruled out by visible cards';reason=reasonForHand(s,hand,ctx)}
 else if(modelBefore.length){kind='blocked';title='The relevant suit is blocked';reason=reasonForHand(s,hand,ctx)}
 else if(!ctx.beforeRemoval.has(hand)){kind='starting-pool';title='Outside the starting pool';reason=`${hand} was not in the declared starting range for this exercise. This is a limit of the starting assumption, not something the current bet proves. To include it, you would first need a wider starting range.`}
 else if(!ctx.start.has(hand)){kind='blocked';title='Blocked out of the starting pool';reason=reasonForHand(s,hand,ctx)}
 const blockers=[...new Set(removed.flat().filter(c=>known.includes(c)))].map(card=>({card,source:s.hero.includes(card)?'your hand':'the board'}));
 const evidence=kind==='action'||kind==='included'?p.observations[coachingNote?.[1]??0]:null;
 let takeaway=kind==='included'?'Keep this hand type because at least one relevant combination survives.':kind==='starting-pool'?'Separate the assumed starting range from what you infer from the current bet.':kind==='blocked'||kind==='impossible'?'Remove exact blocked combinations before deciding whether a hand type survives.':'Build the range for this action, not every hand the opponent could have reached the street with.';
 return {hand,kind,title,reason,evidence,takeaway,blockers,removed,live,physicalCount:(ctx.legal.get(hand)||[]).length,action:s.history.at(-1)[1]};
}
