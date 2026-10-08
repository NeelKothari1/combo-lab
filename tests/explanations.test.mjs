import test from 'node:test';
import assert from 'node:assert/strict';
import {chartScenarios,guidedScenarios} from '../dist/chart-scenarios.js';
import {HAND_CELLS,chartContext,gradeChart} from '../dist/chart-engine.js';
import {explainHand} from '../dist/hand-explanations.js';
import {buildSpotQuestion,codexDraftUrl} from '../dist/spot-question.js';
const find=id=>chartScenarios.find(s=>s.id===id);
test('every chart hand has a reason consistent with legal cards, pool and model',()=>{
 for(const s of [...guidedScenarios,...chartScenarios.filter((s,i)=>s.collection==='expanded'&&i%211===0)]){const ctx=chartContext(s);for(const {hand} of HAND_CELLS){const e=explainHand(s,hand,ctx);assert.ok(e.reason.length>40,s.id+' '+hand);assert.equal(e.kind==='included',ctx.target.has(hand),s.id+' '+hand);for(const b of e.blockers)assert.ok([...s.hero,...s.board].includes(b.card));}}
});
test('explanations distinguish range assumptions, action filtering and exact blocker evidence',()=>{
 const pre=find('chart-read-selective-3bet'),block=find('chart-nut-flush-blocked');
 const jj=explainHand(pre,'JJ');assert.equal(jj.kind,'action');assert.match(jj.reason,/calls.*QQ/);assert.match(jj.evidence,/called with JJ/);
 const out=explainHand(pre,'72o');assert.equal(out.kind,'starting-pool');assert.match(out.reason,/not something the current bet proves/);
 const aq=explainHand(block,'AQs');assert.equal(aq.kind,'blocked');assert.deepEqual(aq.blockers,[{card:'As',source:'your hand'}]);assert.deepEqual(aq.removed,[['As','Qs']]);assert.equal(aq.live.length,0);assert.ok(aq.physicalCount>0);
 assert.match(explainHand(find('chart-read-value-river'),'KQs').reason,/bluff rather than a semi-bluff/);
 assert.match(explainHand(find('chart-read-bluffer-river'),'AQs').reason,/check medium-strength/);
});
test('Codex question preserves spot context and does not expose hidden solution before grading',()=>{
 const s=chartScenarios[0],question='Why JJ? & what about A5s? #test\nAnother question';
 const before=buildSpotQuestion({scenario:s,selected:['JJ'],hand:'JJ',question});
 for(const part of [question,s.history[0][1],'Hero: As Qd','Villain: BTN','My selected range: JJ','This chart has not been checked'])assert.ok(before.includes(part));
 assert.ok(!before.includes(s.model));assert.ok(!before.includes(s.lesson));assert.ok(!before.includes('Feedback on JJ'));
 const result=gradeChart(s,['JJ']),after=buildSpotQuestion({scenario:s,selected:['JJ'],result,hand:'JJ',question});
 assert.ok(after.includes(s.model));assert.ok(after.includes('Outside model: JJ'));assert.ok(after.includes('Feedback on JJ:'));
 const url=new URL(codexDraftUrl(after));assert.equal(url.protocol,'codex:');assert.equal(url.hostname,'new');assert.equal(url.searchParams.get('prompt'),after);assert.deepEqual([...url.searchParams.keys()],['prompt']);
});
