import {scenarios} from './scenarios.js';
import {evaluate, key} from './engine.js';
import {HAND_CELLS, groupCombos} from './chart-engine.js';

export const comboScenarios = scenarios.filter(s => s.topic !== 'tendencies');
const byId = new Map(comboScenarios.map(s => [s.id, s]));
const topics = {all:'All concepts', counting:'Combo counting', blockers:'Blockers', unblockers:'Unblockers'};
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const suits = {s:'♠', h:'♥', d:'♦', c:'♣'};
const suitNames = {s:'spades', h:'hearts', d:'diamonds', c:'clubs'};
const cardName = c => `${({T:'10', J:'jack', Q:'queen', K:'king', A:'ace'})[c[0]] || c[0]} of ${suitNames[c[1]]}`;
const cardsText = cards => cards.map(cardName).join(' and ');
const cardHTML = c => `<span class="cm-card ${'hd'.includes(c[1])?'cm-red':''}" aria-label="${cardName(c)}">${c[0]==='T'?'10':c[0]}${suits[c[1]]}</span>`;
const comboHTML = cards => cards.map(cardHTML).join('');

// Remaining drills keep board collisions selectable. Blocker drills start from
// the board-legal pool so "blocked" always means removal by the hero's cards.
export function comboContext(s) {
  const evaluated = evaluate(s);
  const candidates = s.kind === 'blocked' ? evaluated.board : evaluated.all;
  const expected = (s.kind === 'blocked' ? evaluated.blocked : evaluated.live).map(key);
  return {...evaluated, candidates, expected, groups:groupCombos(candidates), byKey:new Map(candidates.map(c => [key(c), c]))};
}

export function gradeCombos(s, selected) {
  const ctx = comboContext(s);
  if (!Array.isArray(selected) || selected.some(k => typeof k !== 'string' || !ctx.byKey.has(k))) throw new Error('Select exact combos from this exercise.');
  const choice = [...new Set(selected)];
  const matched = choice.filter(k => ctx.expected.includes(k));
  const extra = choice.filter(k => !ctx.expected.includes(k));
  const missing = ctx.expected.filter(k => !choice.includes(k));
  const union = new Set([...choice, ...ctx.expected]).size;
  return {selected:choice, expected:ctx.expected, matched, missing, extra, correct:!missing.length && !extra.length, score:union ? Math.round(matched.length / union * 100) : 100};
}

export function reasonForCombo(s, comboKey) {
  const c = comboContext(s).byKey.get(comboKey);
  if (!c) throw new Error('Combo is outside this exercise.');
  const board = c.filter(card => s.board.includes(card));
  const hero = c.filter(card => s.hero.includes(card));
  if (board.length) return `This combo cannot remain: ${cardsText(board)} ${board.length===1?'is':'are'} already on the board.${hero.length ? ` ${cardsText(hero)} ${hero.length===1?'is':'are'} also in your hand.` : ''}`;
  if (hero.length) return s.kind === 'blocked'
    ? `Select this combo. It is possible using the board alone, but ${cardsText(hero)} ${hero.length===1?'is':'are'} in your hand. Count the combo once${hero.length > 1 ? ', even though both cards collide' : ''}.`
    : `This combo cannot remain: ${cardsText(hero)} ${hero.length===1?'is':'are'} in your hand, so villain cannot hold ${hero.length===1?'that card':'those cards'}.`;
  return s.kind === 'blocked'
    ? 'Do not select this combo: neither of your hole cards appears in it. It stays available to villain on this board.'
    : 'Select this combo. Neither card appears on the board or in your hand, so it remains in the stated range.';
}

export function ensureComboProgress(progress) {
  if (!progress.combos || !Array.isArray(progress.combos.attempts) || !progress.combos.records || typeof progress.combos.records !== 'object' || Array.isArray(progress.combos.records)) progress.combos = {attempts:[], records:{}};
  return progress;
}

export function recordComboAttempt(progress, {id, result, hinted=false, revealed=false, at=new Date().toISOString()}) {
  ensureComboProgress(progress);
  const clean = result.correct && !hinted && !revealed;
  const old = progress.combos.records[id] || {};
  progress.combos.records[id] = {attempts:(old.attempts || 0) + 1, mastered:clean, review:!clean, score:revealed ? 0 : result.score};
  progress.combos.attempts.push({id, correct:result.correct && !revealed, score:revealed ? 0 : result.score, hinted, revealed, at});
  progress.combos.attempts = progress.combos.attempts.slice(-2000);
  return progress;
}

export function createComboMode({progress, save=()=>{}, render=()=>{}}) {
  ensureComboProgress(progress);
  const state = {view:'train', topic:'all', id:null, activeHand:null, selected:[], none:false, result:null, revealed:false, hinted:false, hint:false, inspected:null};
  const filtered = () => comboScenarios.filter(s => state.topic === 'all' || s.topic === state.topic);
  const reviewQueue = () => comboScenarios.filter(s => progress.combos.records[s.id]?.review);
  const current = () => byId.get(state.id) || (state.view === 'review' ? reviewQueue()[0] : filtered()[0]);
  const reset = id => Object.assign(state, {id:id || null, activeHand:null, selected:[], none:false, result:null, revealed:false, hinted:false, hint:false, inspected:null});
  const refresh = focus => {
    render();
    if (focus && typeof document !== 'undefined') document.querySelector(`#combo-mode [data-cm-focus="${focus}"]`)?.focus({preventScroll:true});
  };
  function stats() {
    ensureComboProgress(progress);
    const attempts = progress.combos.attempts;
    const graded = attempts.filter(a => !a.revealed);
    let streak = 0;
    for (let i=attempts.length-1; i>=0; i--) {if (attempts[i].correct && !attempts[i].hinted && !attempts[i].revealed) streak++; else break;}
    return {total:attempts.length, average:graded.length ? Math.round(graded.reduce((n,a) => n+a.score,0)/graded.length) : null, mastered:comboScenarios.filter(s => progress.combos.records[s.id]?.mastered).length, review:reviewQueue().length, streak};
  }
  function topicFilter() {
    return `<label class="cm-topic">Concept <select data-cm-topic data-cm-focus="topic">${Object.entries(topics).map(([value,label]) => `<option value="${value}" ${state.topic===value?'selected':''}>${label}</option>`).join('')}</select></label>`;
  }
  function handView(s) {
    return `<section class="cm-hand" aria-label="Hand and action"><div class="cm-hand-top"><span class="eyebrow">${s.street}</span><span class="small-pill">${escape(s.level)}</span></div><div class="cm-felt"><div class="cm-seat">Villain <b>${escape(s.villainPosition)}</b></div><div class="cm-board"><span>Board</span><div>${s.board.length ? s.board.map(cardHTML).join('') : '<span class="muted">No community cards yet</span>'}</div></div><div class="cm-hole"><span>You · ${escape(s.heroPosition)}</span><div>${s.hero.map(cardHTML).join('')}</div></div></div><div class="cm-action"><h3>Action leading here</h3><ol>${s.history.map(([street,text]) => `<li><b>${escape(street)}</b><span>${escape(text)}</span></li>`).join('')}</ol></div><div class="cm-stated"><span class="eyebrow">Given range</span><p>${s.range.map(t => `<span class="cm-range-token">${t.length===4 ? comboHTML([t.slice(0,2),t.slice(2)]) : escape(t)}</span>`).join('')}</p><small>Use this explicit range for card removal. The betting line is context; this exercise does not claim these are the hands villain always plays.</small></div></section>`;
  }
  function chartView(s, ctx) {
    const active = ctx.groups.has(state.activeHand) ? state.activeHand : [...ctx.groups.keys()][0];
    state.activeHand = active;
    return `<div class="range-chart-scroll cm-chart-scroll" tabindex="0" aria-label="Scrollable hand-class chart"><div class="range-matrix" role="group" aria-label="Choose a hand class to inspect its exact suit combinations">${HAND_CELLS.map(({hand,kind}) => {
      const available = ctx.groups.has(hand), selected = (ctx.groups.get(hand)||[]).some(c => state.selected.includes(key(c)));
      return `<button type="button" class="range-cell ${kind} ${available?'cm-in-range':'cm-outside'} ${hand===active?'cm-active-hand':''} ${selected?'cm-has-selection':''}" data-cm-hand="${hand}" data-cm-focus="hand-${hand}" ${available?'':'disabled'} tabindex="${hand===active?0:-1}" aria-pressed="${hand===active}" aria-label="${hand}${available?', inspect exact combos':', outside the exercise pool'}${selected?', has selected combos':''}">${hand}</button>`;
    }).join('')}</div></div><p class="cm-help">Choose a highlighted hand type, then click its exact suit combos below. Arrow keys move between the highlighted hands.</p><div class="cm-exact" aria-label="Exact combinations of ${active}"><div class="cm-exact-title"><h3>${active || 'No candidate hands'}</h3>${state.result?`<span>${(ctx.groups.get(active)||[]).length} candidates in this class</span>`:''}</div><div class="cm-combos">${(ctx.groups.get(active)||[]).map(c => {
      const k=key(c), selected=state.selected.includes(k), status=state.result ? (state.result.matched.includes(k)?'matched':state.result.missing.includes(k)?'missed':state.result.extra.includes(k)?'extra':'excluded') : '';
      const statusText={matched:'Correctly selected', missed:'Missed combo', extra:'Incorrectly selected', excluded:'Correctly left out'}[status];
      return `<button type="button" class="cm-combo ${selected?'cm-selected':''} ${status?`cm-${status}`:''}" data-cm-combo="${k}" data-cm-focus="combo-${k}" ${state.result?`aria-expanded="${state.inspected===k}"`:`aria-pressed="${selected}"`} aria-label="${cardsText(c)}${statusText?`, ${statusText}. Show reason.`:''}">${comboHTML(c)}${status?`<span class="cm-combo-status">${{matched:'✓',missed:'+',extra:'×',excluded:'−'}[status]}</span>`:''}</button>`;
    }).join('')}</div>${state.result?'<p class="cm-help">✓ Correct selection · + Missed · × Extra · − Correctly left out. Click any combo for its card-removal reason.</p>':''}${state.inspected&&state.result?`<p class="cm-combo-reason" role="status">${escape(reasonForCombo(s,state.inspected))}</p>`:''}</div>`;
  }
  function feedback(s,ctx) {
    const r=state.result;
    const mistakes=[...r.extra.map(k => [k,'Remove this selection']), ...r.missing.map(k => [k,'Add this combo'])];
    return `<section class="cm-feedback ${r.correct&&!state.revealed?'cm-success':''}" aria-label="Answer feedback"><div role="status"><h3 tabindex="-1" data-cm-focus="result">${state.revealed?'Answer revealed':r.correct?'Every combo accounted for.':'A few cards to revisit.'}</h3>${!state.revealed?`<p class="cm-score"><b>${r.score}%</b> exact combo match</p>`:''}<p>The answer is <strong>${r.expected.length} ${s.kind==='blocked'?'hero-blocked':'remaining'} combo${r.expected.length===1?'':'s'}</strong>. ${ctx.board.length} are possible using only the board; your hand removes ${ctx.blocked.length}, leaving ${ctx.live.length}.</p>${state.revealed||state.hinted?'<p class="cm-help">Assisted attempt · revisit this spot without help to clear it from review.</p>':''}</div><p>${escape(s.lesson)}</p>${mistakes.length?`<details class="cm-mistakes" open><summary>${mistakes.length} selection${mistakes.length===1?'':'s'} to change</summary><ul>${mistakes.map(([k,label]) => `<li><div>${comboHTML(ctx.byKey.get(k))}<strong>${label}</strong></div><p>${escape(reasonForCombo(s,k))}</p></li>`).join('')}</ul></details>`:''}${s.alternative?`<div class="cm-comparison"><h3>Change one card. What changes?</h3><div class="cm-compare-row"><span>Your hand ${comboHTML(s.hero)}</span><b>${ctx.live.length} remain</b></div><div class="cm-compare-row"><span>Compare with ${comboHTML(s.alternative)}</span><b>${ctx.alternative.length} remain</b></div><p>${escape(s.comparison)} The board and stated range stay the same.</p></div>`:''}<button class="primary" data-cm-action="next" data-cm-focus="next">${state.view==='review'?'Next review spot':'Next exercise'} →</button></section>`;
  }
  function trainingView() {
    const s=current();
    if (!s) return `<section class="cm-empty"><h2>Your combo review is clear.</h2><p>Missed, hinted, or revealed exercises appear here until you solve them without help.</p><button class="primary" data-cm-view="train">Practice combos</button></section>`;
    state.id=s.id;
    const ctx=comboContext(s);
    return `${state.view==='review'?`<p class="review-callout">${reviewQueue().length} exercise${reviewQueue().length===1?'':'s'} waiting for an unaided answer.</p>`:topicFilter()}<div class="cm-workspace">${handView(s)}<section class="cm-answer"><div class="eyebrow">${escape(topics[s.topic])} · ${escape(s.title)}</div><h2 tabindex="-1" data-cm-focus="question">${s.kind==='blocked'?'Which combos does your hand block?':'Which exact combos remain?'}</h2><p>${s.kind==='blocked'?'Select every board-legal combo removed by either of your hole cards.':'Select every combo in the given range that villain can still hold after removing the board and your cards.'}</p>${chartView(s,ctx)}${state.result?feedback(s,ctx):`<div class="cm-selection-tools"><button class="outline-button ${state.none?'cm-none-selected':''}" data-cm-action="none" data-cm-focus="none" aria-pressed="${state.none}">${s.kind==='blocked'?'My hand blocks none':'No combos remain'}</button><button class="text-button" data-cm-action="clear" data-cm-focus="clear" ${state.selected.length||state.none?'':'disabled'}>Clear selections</button></div><button class="primary" data-cm-action="check" data-cm-focus="check" ${state.selected.length||state.none?'':'disabled'}>Check my combos</button><div class="answer-actions"><button class="text-button" data-cm-action="hint" data-cm-focus="hint" aria-expanded="${state.hint}">${state.hint?'Hide hint':'Give me a hint'}</button><button class="text-button" data-cm-action="reveal">Reveal answer</button></div>${state.hint?`<p class="hint" role="status">${escape(s.hint)}</p>`:''}<p class="cm-help">Select combos across every highlighted hand class. Nothing is crossed out for you before you answer.</p>`}</section></div>`;
  }
  function libraryView() {
    return `${topicFilter()}<p class="cm-help">${filtered().length} exact card-removal exercises. Choose a concept or revisit a particular board.</p><div class="spot-grid">${filtered().map(s => `<button class="spot-card" data-cm-open="${s.id}"><span class="eyebrow">${escape(topics[s.topic])} · ${s.street}</span><strong>${escape(s.title)}</strong><span>${s.level} · ${s.heroPosition} vs ${s.villainPosition}</span><span>${progress.combos.records[s.id]?.mastered?'✓ Solved without help':progress.combos.records[s.id]?.review?'↻ Needs review':'Unpracticed'} →</span></button>`).join('')}</div>`;
  }
  function progressView() {
    const st=stats();
    return `<div class="library-stats"><div><b>${st.total}</b><span>Attempts</span></div><div><b>${st.average===null?'—':st.average+'%'}</b><span>Average submitted combo match</span></div><div><b>${st.mastered}/${comboScenarios.length}</b><span>Solved without help</span></div><div><b>${st.review}</b><span>Exercises to review</span></div></div><p class="cm-help">Only these exact combo exercises count here. Reveals are excluded from the average; hints and reveals never count toward mastery or the ${st.streak}-answer current streak.</p><div class="cm-topic-progress">${Object.entries(topics).filter(([k])=>k!=='all').map(([topic,label]) => {const items=comboScenarios.filter(s=>s.topic===topic),done=items.filter(s=>progress.combos.records[s.id]?.mastered).length;return `<div><span>${label}</span><progress value="${done}" max="${items.length}" aria-label="${label}: ${done} of ${items.length} solved without help"></progress><b>${done} / ${items.length}</b></div>`}).join('')}</div><button class="outline-button" data-cm-view="review">Review missed or assisted exercises</button>`;
  }
  function view() {
    ensureComboProgress(progress);
    const labels={train:'Count the cards that matter.', library:'The combo exercise library.', review:'Revisit your card removal.', progress:'Your combo progress.'};
    return `<section id="combo-mode" class="combo-mode"><div class="title-row"><div><span class="eyebrow">Exact card mathematics</span><h1>${labels[state.view]}</h1><p class="subtitle">Practice combinations, blockers, and unblockers by selecting the actual cards.</p></div></div><nav class="cm-nav" aria-label="Combo trainer navigation">${[['train','Practice'],['library','Library'],['review',`Review${reviewQueue().length?' · '+reviewQueue().length:''}`],['progress','Progress']].map(([v,label]) => `<button class="outline-button ${state.view===v?'active':''}" data-cm-view="${v}" data-cm-focus="view-${v}" ${state.view===v?'aria-current="page"':''}>${label}</button>`).join('')}</nav>${state.view==='library'?libraryView():state.view==='progress'?progressView():trainingView()}</section>`;
  }
  function bind() {
    const root=document.querySelector('#combo-mode');
    if(!root)return;
    root.querySelectorAll('[data-cm-view]').forEach(el => el.onclick=()=>{state.view=el.dataset.cmView;reset();refresh(`view-${state.view}`)});
    root.querySelector('[data-cm-topic]')?.addEventListener('change',event=>{state.topic=event.target.value;reset();refresh('topic')});
    root.querySelectorAll('[data-cm-open]').forEach(el=>el.onclick=()=>{state.view='train';reset(el.dataset.cmOpen);refresh('question')});
    root.querySelectorAll('[data-cm-hand]').forEach(el=>{
      el.onclick=()=>{state.activeHand=el.dataset.cmHand;state.inspected=null;refresh(`hand-${state.activeHand}`)};
      el.onkeydown=event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
        event.preventDefault();
        const cells=[...root.querySelectorAll('[data-cm-hand]')], index=cells.indexOf(el);
        const available=cells.map((cell,i)=>({cell,i})).filter(({cell})=>!cell.disabled);
        let next;
        if(event.key==='Home')next=available[0];
        else if(event.key==='End')next=available.at(-1);
        else if(event.key==='ArrowLeft')next=available.filter(x=>x.i<index).at(-1);
        else if(event.key==='ArrowRight')next=available.find(x=>x.i>index);
        else {
          const row=Math.floor(index/13),col=index%13,down=event.key==='ArrowDown';
          next=available.filter(x=>down?Math.floor(x.i/13)>row:Math.floor(x.i/13)<row).sort((a,b)=>(Math.abs(Math.floor(a.i/13)-row)*13+Math.abs(a.i%13-col))-(Math.abs(Math.floor(b.i/13)-row)*13+Math.abs(b.i%13-col)))[0];
        }
        if(next){el.tabIndex=-1;next.cell.tabIndex=0;next.cell.focus()}
      };
    });
    root.querySelectorAll('[data-cm-combo]').forEach(el=>el.onclick=()=>{
      const k=el.dataset.cmCombo;
      if(state.result)state.inspected=state.inspected===k?null:k;
      else {state.none=false;state.selected=state.selected.includes(k)?state.selected.filter(x=>x!==k):[...state.selected,k]}
      refresh(`combo-${k}`);
    });
    root.querySelectorAll('[data-cm-action]').forEach(el=>el.onclick=()=>{
      const action=el.dataset.cmAction,s=current();
      if(action==='next'){
        const pool=state.view==='review'?reviewQueue():filtered(),index=pool.findIndex(x=>x.id===s.id);
        reset(pool.length?pool[(index+1)%pool.length].id:null);refresh('question');return;
      }
      if(action==='hint'){state.hinted=true;state.hint=!state.hint;refresh('hint');return}
      if(action==='none'){state.none=!state.none;state.selected=[];refresh('none');return}
      if(action==='clear'){state.none=false;state.selected=[];refresh();return}
      if((action==='check'||action==='reveal')&&!state.result){
        if(action==='check'&&!state.selected.length&&!state.none)return;
        state.result=gradeCombos(s,state.selected);state.revealed=action==='reveal';
        recordComboAttempt(progress,{id:s.id,result:state.result,hinted:state.hinted,revealed:state.revealed});
        save();refresh('result');
      }
    });
  }
  function questionContext() {
    if (!['train','review'].includes(state.view)) return null;
    const s=current();
    if (!s) return null;
    const result = state.result;
    return {
      mode:'combos',
      scenario:{id:s.id, title:s.title, topic:s.topic, street:s.street, hero:[...s.hero], board:[...s.board], givenRange:[...s.range], heroPosition:s.heroPosition, villainPosition:s.villainPosition, history:s.history.map(step=>[...step]), kind:s.kind},
      selectedExactCombos:state.selected.map(k=>[k.slice(0,2),k.slice(2)]),
      noneSelected:state.none,
      ...(result ? {
        targetExactCombos:result.expected.map(k=>[k.slice(0,2),k.slice(2)]),
        result:{...result, selected:[...result.selected], expected:[...result.expected], matched:[...result.matched], missing:[...result.missing], extra:[...result.extra], revealed:state.revealed, assisted:state.hinted||state.revealed}
      } : {})
    };
  }
  function markAssisted() {
    if (!state.result && questionContext()) state.hinted=true;
  }
  return {view,bind,stats,questionContext,markAssisted};
}
