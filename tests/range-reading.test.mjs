import test from 'node:test';
import assert from 'node:assert/strict';
import {scenarios} from '../dist/scenarios.js';
import {profileFor} from '../dist/profiles.js';
import {gradeRangeSelection} from '../dist/range-reading.js';
import {expandRange, key, evaluate} from '../dist/engine.js';
const drills=scenarios.filter(s=>s.rangeTask);
test('every drill has contextual opponent notes without replacing its count range',()=>{
 for(const s of scenarios){const p=profileFor(s);assert.ok(p?.observations.length>=3,s.id);assert.ok(p.caution&&p.sample&&p.implication,s.id)}
});
test('selected model groups produce exactly the counted range',()=>{
 for(const s of drills){
 const selected=s.rangeTask.groups.filter(g=>g.include);
 const tokens=selected.flatMap(g=>g.tokens);
 assert.deepEqual(expandRange(tokens).map(key).sort(),expandRange(s.range).map(key).sort(),s.id);
 assert.equal(gradeRangeSelection(s,selected.map(g=>g.id)).correct,true,s.id);
 assert.equal(gradeRangeSelection(s,[]).correct,false,s.id);
 const excluded=s.rangeTask.groups.find(g=>!g.include);
 assert.equal(gradeRangeSelection(s,[...selected.map(g=>g.id),excluded.id]).correct,false,s.id);
 const candidateTokens=s.rangeTask.groups.flatMap(g=>g.tokens);
 assert.equal(expandRange(candidateTokens).length,candidateTokens.reduce((sum,t)=>sum+expandRange([t]).length,0),'candidate groups must not overlap');
 }
});
test('bad range input fails intentionally',()=>{
 assert.throws(()=>gradeRangeSelection(drills[0],['not-a-hand-group']),/Unknown/);
 assert.throws(()=>gradeRangeSelection(drills[0],null),/Select/);
 assert.throws(()=>gradeRangeSelection(scenarios[0],[]),/Select/);
});
test('paired drills isolate player model with identical cards and actions',()=>{
 for(const s of drills){const other=drills.find(d=>d.id===s.rangeTask.counterpart);assert.ok(other);assert.equal(other.rangeTask.counterpart,s.id);for(const property of ['hero','board','history','street','potAfterBet','heroPosition','villainPosition'])assert.deepEqual(s[property],other[property]);assert.notDeepEqual(s.range,other.range);}
 assert.deepEqual(drills.map(s=>evaluate(s).answer),[24,50,20,49,20,26]);
 assert.equal(evaluate(drills.at(-1)).alternative.length,23);
});
