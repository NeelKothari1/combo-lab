import {profileFor} from './profiles.js';
import {explainHand} from './hand-explanations.js';

export function buildSpotQuestion({scenario:s,selected=[],result=null,hand='',question=''}){
 const p=profileFor(s);
 const lines=[
  'Help me understand this poker training spot from Combo Lab. Explain the reasoning in plain language. Treat the exercise range as an illustrative assumption, not a solved range. Do not change the app.',
  `My question: ${question.trim()||'Help me understand which hands fit this opponent’s betting range and why.'}`,
  ...(hand?[`Hand I want to discuss: ${hand}`]:[]),
  `Spot: ${s.title} (${s.id})`,
  `Game: 6-max no-limit hold’em, ${s.effectiveStackBB||50}bb effective stacks, no rake. Street: ${s.street}.`,
  `Hero: ${s.hero.join(' ')} in ${s.heroPosition}. Villain: ${s.villainPosition}. Board: ${s.board.join(' ')||'No board yet'}. Pot after villain’s bet: ${s.potAfterBet}bb.`,
  'Action history:',...s.history.map(([street,line])=>`${street}: ${line}`),
  `Villain: ${p.name} — ${p.style}. ${p.sample}.`,
  ...p.observations.map(note=>`Observation: ${note}`),`Read limits: ${p.caution}`,
  `Declared starting pool: ${s.startingRange.join(', ')}`,
  `My selected range: ${selected.join(', ')||'(none selected)'}`,
  'Chart convention: a hand type is included if at least one exact legal combination is in the betting range; suited does not mean every suit.'
 ];
 if(result){
  lines.push(`Reference betting range before card removal: ${s.range.join(', ')}`,`Exercise assumptions: ${s.model}`,`Feedback: ${result.revealed?'working range revealed':result.score+'% range match'}. Matched: ${result.matched.join(', ')||'none'}. Missed: ${result.missing.join(', ')||'none'}. Outside model: ${result.extra.join(', ')||'none'}.`, `Lesson: ${s.lesson}`);
  if(hand){const e=explainHand(s,hand);lines.push(`Feedback on ${hand}: ${e.title}. ${e.reason}`,`Exact surviving model combos for ${hand}: ${e.live.map(c=>c.join('')).join(', ')||'none'}`)}
 }else lines.push('This chart has not been checked. Start with guiding questions; do not treat an inferred range as the app’s hidden answer.');
 lines.push('Distinguish certain card removal from assumptions about tendencies. Explain what evidence would justify a different range.');
 return lines.join('\n\n');
}
export const codexDraftUrl=prompt=>'codex://new?prompt='+encodeURIComponent(prompt);
