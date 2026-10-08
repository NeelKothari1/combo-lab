import test from 'node:test';
import assert from 'node:assert/strict';
import {HAND_CELLS,handClass,chartContext,gradeChart,validateSelection,reasonForHand} from '../dist/chart-engine.js';
import {expandRange,remaining,key} from '../dist/engine.js';
import {chartScenarios} from '../dist/chart-scenarios.js';
import {profileFor} from '../dist/profiles.js';
import {ensureChartProgress,recordChartAttempt} from '../dist/chart-progress.js';
const find=id=>chartScenarios.find(s=>s.id===id);
test('standard chart partitions the complete deck into 169 distinct hand classes',()=>{
 assert.equal(HAND_CELLS.length,169);assert.equal(new Set(HAND_CELLS.map(c=>c.hand)).size,169);
 assert.equal(HAND_CELLS[0].hand,'AA');assert.equal(HAND_CELLS[1].hand,'AKs');assert.equal(HAND_CELLS[13].hand,'AKo');assert.equal(HAND_CELLS[168].hand,'22');
 const cards=[...'AKQJT98765432'].flatMap(r=>[...'shdc'].map(s=>r+s));
 const counts=new Map();for(let i=0;i<52;i++)for(let j=i+1;j<52;j++){const h=handClass([cards[i],cards[j]]);counts.set(h,(counts.get(h)||0)+1)}
 assert.equal(counts.size,169);
 for(const c of HAND_CELLS)assert.equal(counts.get(c.hand),c.kind==='pair'?6:c.kind==='suited'?4:12,c.hand);
 assert.equal(expandRange(HAND_CELLS.map(c=>c.hand)).length,1326);
});
test('every chart scenario has a coherent target inside its declared starting pool',()=>{
 assert.equal(chartScenarios.length,10);assert.equal(new Set(chartScenarios.map(s=>s.id)).size,10);
 assert.deepEqual([...new Set(chartScenarios.map(s=>s.street))],['preflop','flop','turn','river']);
 for(const s of chartScenarios){
  const ctx=chartContext(s),known=[...s.board,...s.hero],start=new Set(remaining(s.startingRange,known).map(key));
  assert.equal(new Set(known).size,known.length,s.id);assert.ok(profileFor(s),s.id);assert.ok(find(s.counterpart),s.id);
  assert.ok(ctx.expected.length>0,s.id);assert.ok(gradeChart(s,ctx.expected).correct,s.id);
  for(const c of remaining(s.range,known))assert.ok(start.has(key(c)),s.id+' target outside starting pool');
  const included=s.groups.filter(g=>g.include).flatMap(g=>g.tokens);
  assert.deepEqual(new Set(remaining(included,known).map(key)),new Set(remaining(s.range,known).map(key)),s.id);
 }
});
test('paired flop tendencies change the betting range while keeping the cards and actions fixed',()=>{
 const a=find('chart-selective-flop'),b=find('chart-frequent-flop');
 assert.deepEqual(a.hero,b.hero);assert.deepEqual(a.board,b.board);assert.deepEqual(a.history,b.history);
 assert.equal(chartContext(a).expected.length,22);assert.equal(remaining(a.range,[...a.hero,...a.board]).length,63);
 assert.equal(chartContext(b).expected.length,43);assert.equal(remaining(b.range,[...b.hero,...b.board]).length,159);
 assert.ok(!chartContext(a).expected.includes('KK'));assert.ok(chartContext(b).expected.includes('KK'));
});
test('one ace suit removes seven suited hand classes from the modeled flush range',()=>{
 const blocked=find('chart-nut-flush-blocked'),open=find('chart-nut-flush-unblocked');
 assert.deepEqual(blocked.board,open.board);assert.deepEqual(blocked.range,open.range);assert.deepEqual(blocked.history,open.history);assert.equal(blocked.profileId,open.profileId);
 assert.deepEqual(chartContext(blocked).expected,['QJs','QTs','JTs','86s']);assert.equal(chartContext(open).expected.length,11);
 assert.equal(chartContext(open).target.get('AQs').length,1);assert.ok(chartContext(blocked).legal.has('AQs'));assert.ok(!chartContext(blocked).target.has('AQs'));
 assert.match(reasonForHand(blocked,'AQs'),/block every exact combo/);assert.match(reasonForHand(blocked,'QJs'),/spade-spade/);
 assert.match(reasonForHand(blocked,'72o'),/outside the stated starting range/);
 const allAcesDead={hero:['As','Ah'],board:['Ad','Ac','Ks'],range:['AA'],startingRange:['AA'],groups:[]};
 assert.ok(!chartContext(allAcesDead).legal.has('AA'));assert.match(reasonForHand(allAcesDead,'AA'),/cannot hold/);
});
test('grading penalizes both omissions and extras without credit for unselected cells',()=>{
 const s=chartScenarios[0],target=['AA','AKs','AKo','KK','QQ'];
 assert.deepEqual(new Set(chartContext(s).expected),new Set(target));
 assert.equal(gradeChart(s,[]).score,0);
 const wrong=gradeChart(s,['AA','AKs','AKo','KK','JJ']);assert.equal(wrong.score,67);assert.deepEqual(wrong.missing,['QQ']);assert.deepEqual(wrong.extra,['JJ']);assert.equal(wrong.correct,false);
 assert.equal(gradeChart(s,HAND_CELLS.map(c=>c.hand)).score,3);
 assert.equal(gradeChart(s,target.concat('AA')).score,100);
 assert.throws(()=>validateSelection(['AK']));assert.throws(()=>validateSelection(['AsKs']));assert.throws(()=>validateSelection('AA'));
});
test('chart progress preserves original records and only unaided completed charts clear review',()=>{
 const p={version:1,records:{old:{mastered:true}},attempts:[{id:'old',correct:true}]};const old=JSON.stringify(p);
 ensureChartProgress(p);const result=gradeChart(chartScenarios[0],chartContext(chartScenarios[0]).expected);
 for(const extra of [{hinted:true},{revealed:true}]){recordChartAttempt(p,{id:'chart',result,...extra});assert.equal(p.chart.records.chart.review,true);assert.equal(p.chart.records.chart.mastered,false)}
 recordChartAttempt(p,{id:'chart',result});assert.equal(p.chart.records.chart.review,false);assert.equal(p.chart.records.chart.mastered,true);
 assert.equal(p.chart.attempts.length,3);assert.equal(p.chart.attempts[1].score,0);
 const {chart,...legacy}=p;assert.equal(JSON.stringify(legacy),old);
});
