import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGtoContext, quantizeFrequency, gradeGtoRange, ensureGtoProgress, recordGtoAttempt, createGtoMode} from '../dist/gto-mode.js';
import {solverScenarios} from '../dist/solver-data.js';

const fixture = {
  id:'gto-fixture', board:['2s','3h','4d','5c','9s'], hero:['Ac','Kd'],
  combos:[
    {cards:['As','Ks'], priorWeight:1, actionProbability:.8, targetWeight:.8},
    {cards:['Ah','Kh'], priorWeight:.5, actionProbability:.4, targetWeight:.2},
    {cards:['Qs','Qh'], priorWeight:1, actionProbability:.8, targetWeight:.8},
    {cards:['Qs','Qd'], priorWeight:1, actionProbability:.8, targetWeight:.8},
    {cards:['Qs','Qc'], priorWeight:1, actionProbability:.8, targetWeight:.8},
    {cards:['Qh','Qd'], priorWeight:1, actionProbability:.8, targetWeight:.8},
    {cards:['Qh','Qc'], priorWeight:1, actionProbability:.8, targetWeight:.8},
    {cards:['Qd','Qc'], priorWeight:1, actionProbability:.8, targetWeight:.8},
  ]
};

test('GTO chart uses all legal exact combos as denominator and preserves suit differences', () => {
  const {classes} = buildGtoContext(fixture);
  assert.equal(classes.get('AKs').count, 2);
  assert.equal(classes.get('AKs').raw, .5);
  assert.equal(classes.get('AKs').practice, .5);
  assert.deepEqual(classes.get('AKs').combos.map(combo => combo.targetWeight), [.8,.2]);
  assert.ok(Math.abs(classes.get('QQ').raw - .8) < 1e-12);
  assert.equal(classes.get('QQ').practice, .75);
  assert.equal(classes.get('JJ').count, 6);
  assert.equal(classes.get('JJ').raw, 0);
  const missingCombo = buildGtoContext({...fixture,combos:fixture.combos.slice(0,1)}).classes.get('AKs');
  assert.equal(missingCombo.count, 2);
  assert.equal(missingCombo.raw, .4);
  assert.equal(missingCombo.combos[1].priorWeight, 0);
});

test('GTO practice steps allow an exact clean match without pretending rounded frequencies are exact', () => {
  assert.equal(quantizeFrequency(.1249), 0);
  assert.equal(quantizeFrequency(.125), .25);
  assert.equal(quantizeFrequency(.87), .75);
  assert.equal(quantizeFrequency(.875), 1);
  assert.throws(() => quantizeFrequency(1.01));
  const result = gradeGtoRange(fixture, {AKs:.5,QQ:.75});
  assert.equal(result.correct, true);
  assert.equal(result.score, 100);
  assert.throws(() => gradeGtoRange(fixture, {AKs:.8}));
  assert.throws(() => gradeGtoRange(fixture, {AsKs:1}));
});

test('GTO range match weights classes by legal combos and penalizes extras and omissions', () => {
  const result = gradeGtoRange(fixture, {AKs:.25,QQ:.75,JJ:.5});
  // Overlap: 2*.25 + 6*.75 = 5; union: 2*.5 + 6*.75 + 6*.5 = 8.5.
  assert.equal(result.score, 59);
  assert.equal(result.correct, false);
  assert.deepEqual(result.missing, ['AKs']);
  assert.deepEqual(result.extra, ['JJ']);
  assert.equal(gradeGtoRange(fixture, {}).score, 0);
  assert.equal(gradeGtoRange({...fixture,combos:[]}, {}).correct, true);
});

test('GTO exact combo context removes known cards and rejects duplicate entries', () => {
  const context = buildGtoContext({...fixture,combos:[...fixture.combos,{cards:['Ac','Kc'],priorWeight:1,actionProbability:1,targetWeight:1}]});
  assert.equal(context.classes.get('AKs').raw, .5);
  assert.throws(() => buildGtoContext({...fixture,hero:['2s','Kd']}), /distinct/);
  assert.throws(() => buildGtoContext({...fixture,combos:[fixture.combos[0],fixture.combos[0]]}), /Duplicate/);
});

test('GTO progress is isolated and reveals cannot establish mastery', () => {
  const progress = {version:1,attempts:[{id:'legacy'}],records:{legacy:{mastered:true}},chart:{attempts:[{id:'chart'}],records:{chart:{mastered:true}}},combos:{attempts:[{id:'combo'}],records:{combo:{mastered:true}}}};
  const original = structuredClone(progress);
  ensureGtoProgress(progress);
  const result = gradeGtoRange(fixture, {AKs:.5,QQ:.75});
  recordGtoAttempt(progress, {id:fixture.id,result,revealed:true});
  assert.equal(progress.gto.records[fixture.id].mastered, false);
  assert.equal(progress.gto.records[fixture.id].review, true);
  recordGtoAttempt(progress, {id:fixture.id,result});
  assert.equal(progress.gto.records[fixture.id].mastered, true);
  assert.equal(progress.gto.records[fixture.id].review, false);
  const {gto,...other} = progress;
  assert.deepEqual(other, original);
  assert.equal(gto.attempts.length, 2);
  recordGtoAttempt(progress, {id:fixture.id,result,hinted:true});
  assert.equal(progress.gto.records[fixture.id].mastered, false);
  assert.equal(progress.gto.records[fixture.id].review, true);
  assert.equal(progress.gto.attempts.at(-1).hinted, true);
});

test('every real solver exercise has a reachable clean practice target', () => {
  for (const scenario of solverScenarios) {
    const context = buildGtoContext(scenario);
    const target = Object.fromEntries([...context.classes].map(([hand, data]) => [hand,data.practice]));
    const result = gradeGtoRange(scenario, target, context);
    assert.equal(result.correct, true, scenario.id);
    assert.equal(result.score, 100, scenario.id);
  }
});

test('GTO coach context exposes public inputs but no solver answers before submission', () => {
  const mode = createGtoMode({progress:{},save(){},render(){}});
  const context = mode.questionContext();
  assert.equal(context.mode, 'gto');
  assert.equal(context.result, null);
  assert.equal(context.reference, undefined);
  assert.equal(context.exercise.combos, undefined);
  assert.equal(context.exercise.heroNodeReachWeight, undefined);
  assert.deepEqual(context.selectedFrequencies, {});
  assert.deepEqual(context.exercise.selectedAction, solverScenarios[0].selectedAction);
  mode.markAssisted();
  assert.equal(mode.questionContext().assisted, true);
  assert.match(mode.view(), /Practice steps: 25%; exact solver frequencies in feedback/);
  assert.match(mode.view(), /Independent solver cross-validation has not yet been performed/);
  assert.ok(mode.view().includes(solverScenarios[0].selectedAction.label));
});
