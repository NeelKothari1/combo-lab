import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {solverScenarios,solverLibraryMeta} from '../dist/solver-data.js';
import {expandHand,key} from '../dist/engine.js';
import {handClass} from '../dist/chart-engine.js';

const inputsBytes=readFileSync(new URL('../scripts/solver-library/inputs.json',import.meta.url));
const inputs=JSON.parse(inputsBytes);
const weightedRange=(text,dead)=>new Map(text.split(',').flatMap(token=>{
  const [hand,weight='1']=token.split(':');
  return expandHand(hand).filter(cards=>cards.every(c=>!dead.includes(c))).map(cards=>[key(cards),Number(weight)]);
}));
const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);

test('solver library pins its engine and exactly matches checked-in source inputs',()=>{
  const manifest=readFileSync(new URL('../scripts/solver-library/Cargo.toml',import.meta.url),'utf8');
  const lock=readFileSync(new URL('../scripts/solver-library/Cargo.lock',import.meta.url),'utf8');
  assert.ok(manifest.includes(`rev = "${solverLibraryMeta.engineCommit}"`));
  assert.ok(lock.includes(`#${solverLibraryMeta.engineCommit}`));
  assert.equal(solverLibraryMeta.inputsSha256,createHash('sha256').update(inputsBytes).digest('hex'));
  assert.equal(solverLibraryMeta.gameCount,inputs.length);
  assert.equal(solverScenarios.length,inputs.length*2);
  assert.equal(new Set(solverScenarios.map(s=>s.id)).size,solverScenarios.length);
  assert.equal(new Set(solverScenarios.map(s=>s.board.join(''))).size,inputs.length);
  assert.match(solverLibraryMeta.scope,/conditional solver exercises/);
  assert.match(solverLibraryMeta.validation,/not yet been performed/);
});

test('every configured game actually met its stated root convergence bound',()=>{
  for(const s of solverScenarios){
    const meta=s.solver;
    assert.equal(meta.commit,solverLibraryMeta.engineCommit);
    assert.ok(Number.isFinite(meta.exploitability)&&meta.exploitability>=0,s.id);
    assert.ok(meta.exploitabilityPotPercent<=meta.targetExploitabilityPotPercent+1e-6,s.id);
    assert.ok(meta.targetExploitabilityPotPercent<=0.010001,s.id);
    assert.equal(meta.targetExploitabilityPotPercent,solverLibraryMeta.targetExploitabilityPotPercent);
    near(meta.exploitabilityPotPercent,100*meta.exploitability/s.pot);
    assert.ok(Number.isInteger(meta.iterations)&&meta.iterations>0&&meta.iterations<=meta.maxIterations,s.id);
    assert.ok(meta.maxIterations<=10000,s.id);
    assert.equal(meta.tree.initialStreet,'river');
    assert.deepEqual(meta.tree.board,s.board);
    assert.equal(meta.tree.startingPot,s.pot);
    assert.equal(meta.tree.effectiveStack,s.stack);
    assert.equal(meta.tree.oopRange,s.startingRanges.OOP);
    assert.equal(meta.tree.ipRange,s.startingRanges.IP);
    assert.deepEqual(meta.tree.raiseSizes,['2.5x','all-in']);
    assert.equal(meta.tree.rakeRate,0);
    assert.equal(meta.tree.rakeCap,0);
    assert.equal(meta.tree.compression,false);
  }
});

test('export retains every legal exact combo and preserves supplied range weights',()=>{
  for(const s of solverScenarios){
    const dead=[...s.board,...s.hero];
    assert.equal(new Set(dead).size,7,s.id);
    assert.ok(dead.every(c=>/^[2-9TJQKA][cdhs]$/.test(c)));
    const expected=weightedRange(s.startingRanges[s.villainPosition],dead);
    assert.deepEqual(new Set(s.combos.map(c=>key(c.cards))),new Set(expected.keys()),s.id);
    assert.equal(s.combos.length,expected.size,s.id);
    for(const combo of s.combos){
      assert.equal(combo.cards.length,2);
      assert.equal(new Set([...dead,...combo.cards]).size,9,s.id);
      assert.equal(combo.hand,handClass(combo.cards));
      near(combo.priorWeight,expected.get(key(combo.cards)));
      for(const field of ['priorWeight','actionProbability','reachWeight','targetWeight']){
        assert.ok(Number.isFinite(combo[field])&&combo[field]>=0&&combo[field]<=1,`${s.id} ${field}`);
      }
      near(combo.reachWeight,combo.priorWeight*combo.actionProbability);
      near(combo.targetWeight,combo.reachWeight);
      assert.equal(combo.actionProbabilities.length,s.actions.length);
      assert.ok(combo.actionProbabilities.every(p=>Number.isFinite(p)&&p>=0&&p<=1));
      near(combo.actionProbabilities.reduce((a,b)=>a+b,0),1);
      near(combo.actionProbability,combo.actionProbabilities[s.selectedActionIndex]);
    }
    assert.ok(s.combos.reduce((sum,c)=>sum+c.targetWeight,0)>1,'Weights must not be normalized to a single probability distribution');
  }
});

test('history begins at the declared river and hero is reachable without being revealed in the solve',()=>{
  for(const s of solverScenarios){
    const input=inputs.find(x=>s.id===`solver-${x.id}-${s.villainPosition.toLowerCase()}`);
    assert.ok(input,s.id);
    assert.deepEqual(s.board,input.board);
    assert.equal(s.startingRanges.OOP,input.oopRange);
    assert.equal(s.startingRanges.IP,input.ipRange);
    assert.notEqual(s.villainPosition,s.heroPosition);
    assert.ok(s.heroNodeReachWeight>0);
    assert.ok(weightedRange(s.startingRanges[s.heroPosition],s.board).has(key(s.hero)));
    assert.ok(s.history.every(a=>a.street==='river'&&a.potBefore===s.pot));
    if(s.villainPosition==='IP'){
      assert.equal(s.history.length,2);
      assert.deepEqual(s.history[0],{street:'river',actor:'OOP',action:'check',amount:0,potBefore:s.pot});
    }else assert.equal(s.history.length,1);
    const bet=s.history.at(-1);
    assert.equal(bet.actor,s.villainPosition);
    assert.equal(bet.action,'bet');
    assert.equal(bet.amount,s.betAmount);
    assert.equal(s.potAfterBet,s.pot+s.betAmount);
    assert.deepEqual(s.selectedAction,s.actions[s.selectedActionIndex]);
    assert.equal(s.selectedAction.amount,s.betAmount);
  }
});

test('suit-specific solver outputs are not collapsed to one strategy per hand class',()=>{
  const suitSensitive=solverScenarios.filter(s=>s.id.includes('fourth-diamond')||s.id.includes('third-spade'));
  for(const s of suitSensitive){
    const groups=new Map();
    for(const c of s.combos){if(!groups.has(c.hand))groups.set(c.hand,[]);groups.get(c.hand).push(c.actionProbability)}
    assert.ok([...groups.values()].some(weights=>Math.max(...weights)-Math.min(...weights)>0.25),s.id);
    assert.ok(s.combos.some(c=>c.actionProbability>0.05&&c.actionProbability<0.95),`${s.id}: mixed frequencies preserved`);
  }
});
