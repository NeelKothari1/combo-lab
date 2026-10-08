import test from 'node:test';
import assert from 'node:assert/strict';
import {expandRange,remaining,evaluate,key,DECK} from '../dist/engine.js';
import {scenarios} from '../dist/scenarios.js';
test('standard hand counts and order-independent range union',()=>{
 assert.equal(expandRange(['AA']).length,6);
 assert.equal(expandRange(['AKs']).length,4);
 assert.equal(expandRange(['AKo']).length,12);
 assert.equal(expandRange(['AK']).length,16);
 assert.equal(expandRange(['AK','AKs','KA','AsKh','KhAs']).length,16);
 assert.equal(expandRange(['AsAs']).length,0);
});
test('dead cards, double collisions and suit-sensitive blockers',()=>{
 assert.equal(remaining(['AA'],['As']).length,3);
 assert.equal(remaining(['AA'],['As','Ah']).length,1);
 assert.equal(remaining(['AA'],['As','Ah','Ac']).length,0);
 assert.equal(remaining(['AKs'],['As','Ks']).length,3);
 assert.equal(remaining(['AKs'],['As','Kh']).length,2);
 assert.equal(remaining(['AKo'],['As','Ks']).length,6);
 assert.equal(remaining(['AKo'],['As','Kh']).length,7);
 const r=evaluate({range:['AK'],board:[],hero:['As','Kh']});assert.equal(r.blocked.length,7);
});
test('all curated answers match independently computed reference counts',()=>{
 assert.deepEqual(scenarios.map(s=>evaluate(s).answer),[8,3,2,6,7,6,7,10,4,5,0,3,6,3,16,40,4,13,24,50,20,49,20,26]);
});
test('scenario invariants and independent 52-card enumeration',()=>{
 for(const s of scenarios){
 const visible=[...s.board,...s.hero];assert.equal(new Set(visible).size,visible.length,s.id);
 assert.equal(s.board.length,{preflop:0,flop:3,turn:4,river:5}[s.street]);
 const allowed=new Set(expandRange(s.range).map(key));let count=0;
 for(let i=0;i<DECK.length;i++)for(let j=i+1;j<DECK.length;j++)if(!visible.includes(DECK[i])&&!visible.includes(DECK[j])&&allowed.has(key([DECK[i],DECK[j]])))count++;
 const e=evaluate(s);assert.equal(e.live.length,count,s.id);assert.equal(e.board.length,e.live.length+e.blocked.length,s.id);
 if(s.alternative){assert.equal(new Set([...s.board,...s.alternative]).size,s.board.length+2,s.id);}
 }
});
test('unblocker comparison counts',()=>{
 assert.equal(evaluate(scenarios.find(s=>s.id==='missed-draw')).alternative.length,3);
 assert.equal(evaluate(scenarios.find(s=>s.id==='block-bluffs')).alternative.length,6);
 assert.equal(evaluate(scenarios.find(s=>s.id==='unblock-straights')).alternative.length,48);
});
