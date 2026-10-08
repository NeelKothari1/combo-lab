import {expandRange,remaining,key} from './engine.js';
export const CHART_RANKS=[...'AKQJT98765432'];
export const HAND_CELLS=CHART_RANKS.flatMap((rank,row)=>CHART_RANKS.map((other,col)=>({
 hand:row===col?rank+other:row<col?rank+other+'s':other+rank+'o',row,col,kind:row===col?'pair':row<col?'suited':'offsuit'
})));
const validHands=new Set(HAND_CELLS.map(c=>c.hand));
export function handClass(cards){
 const [a,b]=[...cards].sort((a,b)=>CHART_RANKS.indexOf(a[0])-CHART_RANKS.indexOf(b[0]));
 return a[0]===b[0]?a[0]+b[0]:a[0]+b[0]+(a[1]===b[1]?'s':'o');
}
export function groupCombos(combos){const groups=new Map();for(const combo of combos){const h=handClass(combo);if(!groups.has(h))groups.set(h,[]);groups.get(h).push(combo)}return groups}
const contextCache=new Map();
export function chartContext(s){
 if(contextCache.has(s))return contextCache.get(s);
 const dead=[...s.board,...s.hero];
 const legal=groupCombos(remaining(HAND_CELLS.map(c=>c.hand),dead));
 const target=groupCombos(remaining(s.range,dead));
 const start=groupCombos(remaining(s.startingRange,dead));
 const beforeRemoval=groupCombos(expandRange(s.startingRange));
 const expected=HAND_CELLS.filter(c=>target.has(c.hand)).map(c=>c.hand);
 const beforeTarget=groupCombos(expandRange(s.range)),groupCandidates=new Map();
 for(const group of s.groups||[]){for(const [hand,combos] of groupCombos(expandRange(group.tokens))){if(!groupCandidates.has(hand))groupCandidates.set(hand,[]);groupCandidates.get(hand).push({group,combos})}}
 const result={legal,target,start,beforeRemoval,beforeTarget,groupCandidates,expected};
 contextCache.set(s,result);if(contextCache.size>60)contextCache.delete(contextCache.keys().next().value);return result;
}
export function validateSelection(hands){
 if(!Array.isArray(hands)||hands.some(h=>typeof h!=='string'||!validHands.has(h)))throw new Error('Use valid chart hands such as AA, AKs, or AKo.');
 return HAND_CELLS.filter(c=>hands.includes(c.hand)).map(c=>c.hand);
}
export function gradeChart(s,hands){
 const selected=validateSelection(hands),ctx=chartContext(s),expected=ctx.expected;
 const matched=selected.filter(h=>expected.includes(h)),missing=expected.filter(h=>!selected.includes(h)),extra=selected.filter(h=>!expected.includes(h));
 const union=new Set([...selected,...expected]).size;
 return {selected,expected,matched,missing,extra,correct:missing.length===0&&extra.length===0,score:union?Math.round(matched.length/union*100):100};
}
export function reasonForHand(s,hand,ctx=chartContext(s)){
 if(!ctx.legal.has(hand))return 'The board and your cards remove every possible combination of this hand. Villain cannot hold it.';
 if(ctx.beforeRemoval.has(hand)&&!ctx.start.has(hand))return 'Every combination of this hand in the stated starting range is blocked by known cards. Other suits are outside that starting range.';
 if(!ctx.beforeRemoval.has(hand))return 'This hand is outside the stated starting range for this exercise. It was excluded before this decision, not ruled out by the bet alone.';
 if(!ctx.target.has(hand)&&ctx.beforeTarget.has(hand))return 'Known cards block every exact combo of this hand that takes the betting line in this model. Other suits are physically possible, but they do not take this action in the reference range.';
 const expectedKeys=new Set((ctx.target.get(hand)||[]).map(key));
 const candidates=(ctx.groupCandidates.get(hand)||[]).filter(({combos})=>combos.some(c=>expectedKeys.size===0||expectedKeys.has(key(c))));
 if(s.collection==='expanded'&&candidates.length)return [...new Set(candidates.map(x=>x.group.reason))].slice(0,3).join(' ');
 const group=candidates[0]?.group;
 return group?.reason||(expectedKeys.size?'This hand remains in the working model after the action and card removal.':'This model checks, calls, or folds this hand instead of taking villain’s current betting action.');
}
