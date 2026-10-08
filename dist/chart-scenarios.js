import {tendencyScenarios} from './tendency-scenarios.js';
import {extraChartScenarios} from './chart-extra-scenarios.js';
import {expandedScenarios} from './scenario-library.js';
const hints={
 'read-selective-3bet':'Separate hands this opponent has shown reraising from the hands they have shown calling. A suited and an offsuit version occupy separate cells.',
 'read-wide-3bet':'This player has shown light 3-bets, but a wide range still needs a cutoff. Consider premiums, medium pairs, suited broadways, and low suited aces.',
 'read-giveup-turn':'A small flop bet was common for this player. The second barrel is less common. Which made hands are strong enough to keep betting?',
 'read-pressure-turn':'This player can barrel an unmade draw. Consider top pairs as well as two-heart draws; a suited cell can represent only one relevant suit.',
 'read-value-river':'This opponent often takes a showdown with weaker one-pair hands and gives up missed draws. Keep their strongest top-pair hands in mind too.',
 'read-bluffer-river':'Do not build a value-only range for a player observed bluffing missed draws. The missed draws and the strong value hands both matter.'
};
const baseChartScenarios=tendencyScenarios.map(s=>({
 id:'chart-'+s.id,title:s.title,street:s.street,hero:s.hero,board:s.board,
 heroPosition:s.heroPosition,villainPosition:s.villainPosition,potAfterBet:s.potAfterBet,history:s.history,profileId:s.profileId,potType:s.potType,
 range:s.range,startingRange:s.rangeTask.groups.flatMap(g=>g.tokens),groups:s.rangeTask.groups,
 model:s.rangeTask.model.replaceAll('offered','starting-range'),lesson:s.lesson,hint:hints[s.id],
 counterpart:'chart-'+s.rangeTask.counterpart,
 scope:s.street==='preflop'?'Use the starting pool below as the hands this player may consider against the raise. Decide which ones take the 3-bet line.':'Assume the starting range below can reach this street. Decide which hands take the current bet.',
 alternative:s.alternative,comparison:s.comparison
}));
const streetOrder=['preflop','flop','turn','river'];
export const guidedScenarios=[...baseChartScenarios,...extraChartScenarios].sort((a,b)=>streetOrder.indexOf(a.street)-streetOrder.indexOf(b.street)).map(s=>({...s,collection:'guided',difficulty:s.street==='preflop'?'Foundation':'Applied',style:s.profileId==='wide3bet'||s.profileId==='flopFrequent'?'broad':['pressure','bluffer'].includes(s.profileId)?'active':'cautious',situation:'guided',effectiveStackBB:50}));
export const chartScenarios=[...guidedScenarios,...expandedScenarios];
export const streets={all:'All streets',preflop:'Preflop',flop:'Flop',turn:'Turn',river:'River'};
