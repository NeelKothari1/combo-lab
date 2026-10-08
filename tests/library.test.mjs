import test from 'node:test';
import assert from 'node:assert/strict';
import {chartScenarios,guidedScenarios} from '../dist/chart-scenarios.js';
import {libraryTemplates} from '../dist/library-data.js';
import {expandedScenarios,libraryInfo,filterScenarios,sessionOrder} from '../dist/scenario-library.js';
import {expandRange,remaining,key,DECK} from '../dist/engine.js';
import {features,classifyAction} from '../scripts/poker-model.mjs';
import {chartContext,gradeChart} from '../dist/chart-engine.js';
import {buildSpotQuestion} from '../dist/spot-question.js';

test('library size represents unique real scenario states and keeps original IDs',()=>{
 assert.ok(expandedScenarios.length>=5000);assert.equal(guidedScenarios.length,10);
 assert.equal(new Set(chartScenarios.map(s=>s.id)).size,chartScenarios.length);
 const signatures=new Set(expandedScenarios.map(s=>JSON.stringify([s.street,s.board,s.hero,s.heroPosition,s.villainPosition,s.history,s.style])));
 assert.equal(signatures.size,expandedScenarios.length);
 assert.equal(libraryInfo.templates,libraryTemplates.length);
 assert.equal(new Set(expandedScenarios.map(s=>[s.street,s.situation,s.style].join('|'))).size,54);
 for(const s of expandedScenarios){const known=[...s.board,...s.hero];assert.equal(new Set(known).size,known.length,s.id);assert.ok(known.every(c=>DECK.includes(c)),s.id);assert.equal(s.board.length,{preflop:0,flop:3,turn:4,river:5}[s.street]);}
});
test('every board template partitions its pool and each hero variant has a nonempty legal target',()=>{
 for(const t of libraryTemplates){
  const pool=new Set(remaining(t.startingRange,t.board).map(key));
  const all=t.groups.flatMap(g=>expandRange(g.tokens));
  assert.equal(new Set(all.map(key)).size,all.length,t.id+' duplicate category membership');
  assert.deepEqual(new Set(all.map(key)),pool,t.id+' pool partition');
  const target=t.groups.filter(g=>g.include).flatMap(g=>g.tokens);
  for(const hero of t.heroChoices)assert.ok(remaining(target,[...hero,...t.board]).length>0,t.id+' impossible betting range');
 }
});
test('betting ledgers reconcile pots, stacks, and legal out-of-position action order',()=>{
 for(const t of libraryTemplates){
  if(!t.ledger.length)continue;
  let committed=t.potType==='3-bet pot'?9:2.5;
  for(let i=0;i<t.ledger.length;i++){
   const l=t.ledger[i];committed+=l.villainBet;
   const increment=l.called?2*l.villainBet:l.heroBet+l.villainBet;
   const resulting=Math.round((l.potBefore+increment)*10)/10;
   assert.equal(resulting,t.ledger[i+1]?.potBefore??t.potAfterBet,t.id+' pot');
   assert.ok(committed<=t.effectiveStackBB,t.id+' stack');
  }
  if(t.situation==='bb-3bet')for(const [,line] of t.history.slice(1)){assert.match(line,/^BB bets/);assert.doesNotMatch(line,/You check/)}
  if(t.situation==='bb-checkraise')assert.match(t.history.at(-1)[1],/^BB checks\. You bet .* BB raises to/);
 }
});
test('hand features handle paired boards, wheel straights, draw contribution, and river misses',()=>{
 assert.equal(features(['Qh','Qd'],['Ks','Kh','4d']).strong,false);
 assert.equal(features(['Qs','5d'],['Qh','9c','2s','9d','5c']).twoPair,false);
 assert.equal(features(['Ks','4c'],['Kh','Kd','4d']).fullHouse,true);
 assert.equal(features(['3h','4c'],['Ah','5d','2c']).straight,true);
 assert.equal(features(['Ah','Kc'],['6s','7h','8d','9c']).straightDraw,false);
 assert.equal(features(['5h','4h'],['Ah','7h','2c']).flushDraw,true);
 const missedBoard=['Ah','9h','5c','2d','6s'];
 assert.equal(classifyAction(['Kh','Qh'],missedBoard,'cautious').include,false);
 assert.equal(classifyAction(['Kh','Qh'],missedBoard,'active').include,true);
 assert.equal(classifyAction(['Kh','Qh'],['Ah','9h','5c','2d','Ks'],'active').category==='missed-draw',false);
});
test('earlier villain betting filters never regain combos on a later street',()=>{
 const byId=new Map(libraryTemplates.map(t=>[t.id,t]));
 for(const t of libraryTemplates.filter(t=>t.street!=='preflop'&&t.street!=='flop'&&t.situation!=='bb-checkraise')){
  const priorId=t.id.replace('-'+t.street+'-','-'+(t.street==='river'?'turn':'flop')+'-');
  const prior=byId.get(priorId);assert.ok(prior,t.id);
  const earlier=new Set(prior.groups.filter(g=>g.include).flatMap(g=>g.tokens).map(x=>key([x.slice(0,2),x.slice(2)])));
  for(const c of t.groups.filter(g=>g.include).flatMap(g=>g.tokens))assert.ok(earlier.has(key([c.slice(0,2),c.slice(2)])),t.id+' regained combo');
 }
});
test('filters and seeded sessions retain unique IDs and exclude practiced spots',()=>{
 const records=Object.fromEntries(chartScenarios.slice(0,12).map(s=>[s.id,{attempts:1}]));
 const selected=filterScenarios(chartScenarios,{street:'river',collection:'expanded',style:'cautious',situation:'bb-checkraise'},records);
 assert.ok(selected.length>100);assert.ok(selected.every(s=>s.street==='river'&&s.style==='cautious'&&s.situation==='bb-checkraise'));
 const unseen=filterScenarios(chartScenarios,{unseen:true},records);assert.equal(unseen.length,chartScenarios.length-12);
 const first=sessionOrder(selected,42).slice(0,20);assert.deepEqual(first,sessionOrder(selected,42).slice(0,20));assert.equal(new Set(first).size,20);assert.notDeepEqual(first,sessionOrder(selected,43).slice(0,20));
 assert.equal(filterScenarios(chartScenarios,{collection:'guided',situation:'bb-checkraise'}).length,0);
});
test('representative generated ranges grade exactly and attach the right stack to Codex',()=>{
 for(const s of expandedScenarios.filter((_,i)=>i%107===0))assert.equal(gradeChart(s,chartContext(s).expected).score,100);
 const deep=expandedScenarios.find(s=>s.effectiveStackBB===100);assert.ok(deep);assert.match(buildSpotQuestion({scenario:deep}),/100bb effective stacks/);
});
