import test from 'node:test';
import assert from 'node:assert/strict';
import {DECK, key, expandRange} from '../dist/engine.js';
import {comboScenarios, comboContext, gradeCombos, reasonForCombo, ensureComboProgress, recordComboAttempt, createComboMode} from '../dist/combo-mode.js';

const find=id=>comboScenarios.find(s=>s.id===id);

test('combo mode contains all 18 original exact exercises and independently grades every target',()=>{
  assert.equal(comboScenarios.length,18);
  for(const s of comboScenarios){
    const ctx=comboContext(s),range=new Set(expandRange(s.range).map(key)),expected=[];
    for(let i=0;i<DECK.length;i++)for(let j=i+1;j<DECK.length;j++){
      const c=[DECK[i],DECK[j]],k=key(c);
      if(!range.has(k)||c.some(x=>s.board.includes(x)))continue;
      const held=c.some(x=>s.hero.includes(x));
      if(s.kind==='blocked'?held:!held)expected.push(k);
    }
    assert.deepEqual(new Set(ctx.expected),new Set(expected),s.id);
    assert.equal(gradeCombos(s,expected).score,100,s.id);
    assert.equal(gradeCombos(s,expected).correct,true,s.id);
  }
});

test('remaining candidates retain board and hero collisions; blocked candidates are board legal',()=>{
  const remaining=comboContext(find('top-pair'));
  assert.equal(remaining.candidates.length,16);
  assert.equal(remaining.expected.length,8);
  assert.ok(remaining.byKey.has(key(['Ah','Ks'])));
  assert.ok(remaining.byKey.has(key(['As','Ks'])));
  const blocked=comboContext(find('ace-blocker'));
  assert.equal(blocked.candidates.length,12);
  assert.equal(blocked.expected.length,4);
  assert.ok(!blocked.byKey.has(key(['Ah','Ks'])));
  assert.ok(blocked.byKey.has(key(['As','Ks'])));
});

test('exact suits, omissions, extras, duplicate choices, and an empty target are graded correctly',()=>{
  const s=find('suited'),ctx=comboContext(s);
  assert.equal(ctx.expected.length,2);
  const oneRightOneWrong=[ctx.expected[0],key(['As','Ks'])];
  const result=gradeCombos(s,oneRightOneWrong);
  assert.equal(result.score,33);
  assert.equal(result.missing.length,1);
  assert.equal(result.extra.length,1);
  assert.equal(gradeCombos(s,[...ctx.expected,ctx.expected[0]]).score,100);
  assert.throws(()=>gradeCombos(s,['AKs']));
  assert.throws(()=>gradeCombos(s,[key(['2s','2h'])]));
  assert.throws(()=>gradeCombos(s,'AsKs'));
  assert.equal(gradeCombos(find('nut-flush'),[]).correct,true);
  assert.equal(gradeCombos(find('nut-flush'),[]).score,100);
  assert.equal(gradeCombos(s,[]).score,0);
});

test('reasons distinguish exact card sources and never treat a hero blocker as a board blocker',()=>{
  const s=find('top-pair');
  assert.match(reasonForCombo(s,key(['Ah','Ks'])),/ace of hearts is already on the board/);
  assert.match(reasonForCombo(s,key(['As','Ks'])),/ace of spades is in your hand/);
  assert.match(reasonForCombo(s,key(['Ad','Ks'])),/Neither card appears/);
  const blocked=find('ace-blocker');
  assert.match(reasonForCombo(blocked,key(['As','Ks'])),/possible using the board alone/);
  assert.match(reasonForCombo(blocked,key(['Ad','Ks'])),/neither of your hole cards/);
  assert.throws(()=>reasonForCombo(blocked,key(['Ah','Ks'])));
  const double={range:['AK'],board:[],hero:['As','Kh'],kind:'blocked'};
  assert.match(reasonForCombo(double,key(['As','Kh'])),/Count the combo once, even though both cards collide/);
});

test('unblocker comparisons are exact and leave the stated board unchanged',()=>{
  const s=find('missed-draw'),ctx=comboContext(s);
  assert.equal(ctx.live.length,6);
  assert.equal(ctx.alternative.length,3);
  const switched=comboContext({...s,hero:s.alternative,alternative:s.hero});
  assert.equal(switched.live.length,3);
  assert.equal(switched.alternative.length,6);
});

test('combo attempts preserve other mode data and only clean answers clear review',()=>{
  const p={version:1,attempts:[{id:'old'}],records:{old:{score:100}},chart:{attempts:[{id:'chart'}],records:{}}};
  const before=JSON.stringify(p);
  ensureComboProgress(p);
  const s=find('top-pair'),result=gradeCombos(s,comboContext(s).expected);
  recordComboAttempt(p,{id:s.id,result,hinted:true});
  assert.equal(p.combos.records[s.id].review,true);
  recordComboAttempt(p,{id:s.id,result,revealed:true});
  assert.equal(p.combos.records[s.id].mastered,false);
  assert.equal(p.combos.attempts.at(-1).score,0);
  recordComboAttempt(p,{id:s.id,result});
  assert.equal(p.combos.records[s.id].review,false);
  assert.equal(p.combos.records[s.id].mastered,true);
  assert.equal(p.combos.records[s.id].attempts,3);
  const {combos,...rest}=p;
  assert.equal(JSON.stringify(rest),before);
  const mode=createComboMode({progress:p});
  assert.deepEqual(mode.stats(),{total:3,average:100,mastered:1,review:0,streak:1});
});

test('initial render offers card selection without revealing answer counts or disabled dead combos',()=>{
  const html=createComboMode({progress:{}}).view();
  assert.match(html,/Which exact combos remain/);
  assert.match(html,/No combos remain/);
  assert.doesNotMatch(html,/The answer is|remaining combo|8 combos|cm-missed|cm-extra/);
  const deadCombo=key(['As','Ks']);
  assert.match(html,new RegExp(`data-cm-combo="${deadCombo}"`));
  const comboTag=html.match(new RegExp(`<button[^>]*data-cm-combo="${deadCombo}"[^>]*>`))[0];
  assert.doesNotMatch(comboTag,/disabled|blocked|cannot/);
});

test('coach context exposes only public facts before grading and marks ungraded help as assisted',()=>{
  const progress={},mode=createComboMode({progress}),context=mode.questionContext(),s=find('top-pair');
  assert.equal(context.mode,'combos');
  assert.deepEqual(context.scenario.givenRange,['AK']);
  assert.deepEqual(context.scenario.hero,s.hero);
  assert.deepEqual(context.scenario.history,s.history);
  assert.deepEqual(context.selectedExactCombos,[]);
  assert.equal('result' in context,false);
  assert.equal('targetExactCombos' in context,false);
  assert.doesNotMatch(JSON.stringify(context),/"hint"|"lesson"|"expected"|"answer"/);
  context.scenario.hero[0]='2s';
  assert.equal(mode.questionContext().scenario.hero[0],'As');

  const choices=comboContext(s).expected.map(k=>({dataset:{cmCombo:k}}));
  const check={dataset:{cmAction:'check'}},library={dataset:{cmView:'library'}},progressView={dataset:{cmView:'progress'}};
  const controls={'[data-cm-combo]':choices,'[data-cm-action]':[check],'[data-cm-view]':[library,progressView]};
  const root={querySelector:()=>null,querySelectorAll:selector=>controls[selector]||[]};
  const previous=globalThis.document;
  globalThis.document={querySelector:selector=>selector==='#combo-mode'?root:null};
  try {
    mode.bind();
    mode.markAssisted();
    for(const choice of choices)choice.onclick();
    assert.equal(mode.questionContext().selectedExactCombos.length,8);
    assert.equal('result' in mode.questionContext(),false);
    check.onclick();
    const graded=mode.questionContext();
    assert.equal(graded.result.correct,true);
    assert.equal(graded.result.assisted,true);
    assert.equal(graded.targetExactCombos.length,8);
    assert.equal(progress.combos.records[s.id].review,true);
    library.onclick();
    assert.equal(mode.questionContext(),null);
    progressView.onclick();
    assert.equal(mode.questionContext(),null);
  } finally {
    if(previous===undefined)delete globalThis.document;else globalThis.document=previous;
  }
});
