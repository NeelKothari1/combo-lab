import {HAND_CELLS, groupCombos} from './chart-engine.js';
import {remaining, key} from './engine.js';
import {solverScenarios, solverLibraryMeta} from './solver-data.js';

const STEPS = [0, .25, .5, .75, 1];
const handNames = new Set(HAND_CELLS.map(cell => cell.hand));
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const percentage = (weight, digits = 0) => `${(weight * 100).toFixed(digits)}%`;
const numeric = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, {maximumFractionDigits: 3}) : '—';
const convergenceNumber = value => Number(value).toLocaleString(undefined, {maximumFractionDigits: 6});
const suitSymbols = {s:'♠', h:'♥', d:'♦', c:'♣'};
const suitNames = {s:'spades', h:'hearts', d:'diamonds', c:'clubs'};
const card = value => `<span class="gto-card ${/[hd]/.test(value[1]) ? 'red' : ''}" aria-label="${escape(value[0])} of ${suitNames[value[1]]}">${escape(value[0])}${suitSymbols[value[1]]}</span>`;
const comboLabel = cards => cards.map(card).join('');

export function quantizeFrequency(weight) {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new Error('Range weights must be between 0 and 1.');
  return Math.round(weight * 4) / 4;
}

// The solver keeps exact combinations. Only the practice interface aggregates suits.
export function buildGtoContext(scenario) {
  const dead = [...scenario.board, ...scenario.hero];
  if (new Set(dead).size !== dead.length) throw new Error('Known cards must be distinct.');
  const legal = groupCombos(remaining(HAND_CELLS.map(cell => cell.hand), dead));
  const supplied = new Map();
  for (const entry of scenario.combos) {
    const comboKey = key(entry.cards);
    if (supplied.has(comboKey)) throw new Error('Duplicate solver combination.');
    if (entry.cards.some(value => dead.includes(value))) continue;
    const targetWeight = entry.targetWeight;
    quantizeFrequency(targetWeight);
    supplied.set(comboKey, entry);
  }
  const classes = new Map(HAND_CELLS.map(({hand}) => {
    const combos = (legal.get(hand) || []).map(cards => {
      const entry = supplied.get(key(cards));
      return {cards, priorWeight: entry?.priorWeight ?? 0, actionProbability: entry?.actionProbability ?? 0, targetWeight: entry?.targetWeight ?? 0};
    });
    const raw = combos.length ? combos.reduce((sum, entry) => sum + entry.targetWeight, 0) / combos.length : 0;
    return [hand, {hand, combos, count: combos.length, raw, practice: quantizeFrequency(raw)}];
  }));
  return {classes};
}

export function gradeGtoRange(scenario, selected = {}, context = buildGtoContext(scenario)) {
  for (const [hand, weight] of Object.entries(selected)) {
    if (!handNames.has(hand) || !STEPS.includes(weight)) throw new Error('Choose chart hands with 0%, 25%, 50%, 75%, or 100% weights.');
  }
  let intersection = 0, union = 0;
  const missing = [], extra = [], matched = [];
  for (const [hand, target] of context.classes) {
    const chosen = selected[hand] || 0;
    intersection += target.count * Math.min(chosen, target.practice);
    union += target.count * Math.max(chosen, target.practice);
    if (chosen < target.practice) missing.push(hand);
    else if (chosen > target.practice) extra.push(hand);
    else if (chosen > 0) matched.push(hand);
  }
  return {score: union ? Math.round(intersection / union * 100) : 100, correct: !missing.length && !extra.length, missing, extra, matched};
}

export function ensureGtoProgress(progress) {
  if (!progress.gto || !Array.isArray(progress.gto.attempts) || !progress.gto.records || typeof progress.gto.records !== 'object') progress.gto = {attempts: [], records: {}};
  return progress;
}

export function recordGtoAttempt(progress, {id, result, revealed = false, hinted = false, at = new Date().toISOString()}) {
  ensureGtoProgress(progress);
  const clean = result.correct && !revealed && !hinted;
  const old = progress.gto.records[id] || {};
  progress.gto.records[id] = {attempts: (old.attempts || 0) + 1, review: !clean, mastered: clean, score: revealed ? 0 : result.score};
  progress.gto.attempts.push({id, correct: result.correct && !revealed, score: revealed ? 0 : result.score, revealed, hinted, at});
  progress.gto.attempts = progress.gto.attempts.slice(-2000);
  return progress;
}

export function createGtoMode({progress, save, render}) {
  ensureGtoProgress(progress);
  let index = 0, brush = 1, selected = {}, result = null, inspected = null, undo = [], reviewing = false, confirmReset = false, assisted = false;
  const contexts = new Map();
  const current = () => solverScenarios[index];
  const context = scenario => {
    if (!contexts.has(scenario.id)) contexts.set(scenario.id, buildGtoContext(scenario));
    return contexts.get(scenario.id);
  };
  const reviewSpots = () => solverScenarios.filter(scenario => progress.gto.records[scenario.id]?.review);
  const stats = () => {
    ensureGtoProgress(progress);
    const attempts = progress.gto.attempts, completed = attempts.filter(attempt => !attempt.revealed);
    let streak = 0;
    for (let i = attempts.length - 1; i >= 0 && attempts[i].correct && !attempts[i].revealed && !attempts[i].hinted; i--) streak++;
    return {total: attempts.length, average: completed.length ? Math.round(completed.reduce((sum, attempt) => sum + attempt.score, 0) / completed.length) : null, mastered: solverScenarios.filter(scenario => progress.gto.records[scenario.id]?.mastered).length, review: reviewSpots().length, streak};
  };
  const open = nextIndex => {
    index = Math.max(0, nextIndex); selected = {}; result = null; inspected = null; undo = []; confirmReset = false; assisted = false;
    render();
  };
  const observedAction = scenario => scenario.selectedAction?.label || scenario.observedAction?.label || scenario.actionLabel || 'the observed action';
  const resetProgress = () => {progress.gto = {attempts: [], records: {}}; confirmReset = false; save(); render();};

  function provenance(scenario) {
    const solver = scenario.solver || {}, engine = solver.engine || solverLibraryMeta?.engine || 'Postflop solver';
    const accuracy = Number.isFinite(solver.exploitabilityPotPercent) ? `${convergenceNumber(solver.exploitabilityPotPercent)}% of pot` : 'Not reported';
    const tree = solver.tree ? JSON.stringify(solver.tree, null, 2) : 'See the supplied action history.';
    const sourceUrl = solver.source || solver.sourceUrl || solverLibraryMeta?.solverSource;
    const source = typeof sourceUrl === 'string' && /^https:\/\/github\.com\//.test(sourceUrl) ? `<a href="${escape(sourceUrl)}" target="_blank" rel="noopener noreferrer">Engine source ↗</a>` : '';
    return `<details class="gto-provenance"><summary>Solver assumptions and provenance</summary><dl><dt>Engine</dt><dd>${escape(engine)}</dd><dt>Commit</dt><dd><code>${escape(solver.commit || solverLibraryMeta?.engineCommit || 'Not provided')}</code></dd><dt>Algorithm</dt><dd>${escape(solver.algorithm || 'Not provided')}</dd><dt>Iterations</dt><dd>${numeric(solver.iterations)} / ${numeric(solver.maxIterations)}</dd><dt>Achieved exploitability</dt><dd>${accuracy}</dd><dt>Target exploitability</dt><dd>${numeric(solver.targetExploitabilityPotPercent)}% of pot</dd></dl><p>These results apply to the supplied river starting ranges, pot, stack, rake, and available actions. They do not establish a real opponent’s range. The reported convergence measure describes this configured game; it is not a claim of universal validation. Independent solver cross-validation has not yet been performed.</p><p>${source}</p><details><summary>Available betting tree</summary><pre>${escape(tree)}</pre></details></details>`;
  }

  function facts(scenario) {
    const history = (scenario.history || []).map(step => `<li><span>${escape(step.street || 'River')}</span><div><b>${escape(step.actor)}</b> ${escape(step.action)}${Number.isFinite(step.amount) && step.amount > 0 ? ` ${numeric(step.amount)}bb` : ''}${Number.isFinite(step.potBefore) ? `<small>Pot before action: ${numeric(step.potBefore)}bb</small>` : ''}</div></li>`).join('');
    const rakeRate = typeof scenario.rake === 'object' ? scenario.rake.rate ?? (scenario.rake.percent || 0) / 100 : Number(scenario.rake || 0);
    const rake = rakeRate ? `${percentage(rakeRate, 1)}${scenario.rake?.cap !== undefined ? ` · cap ${numeric(scenario.rake.cap)}bb` : ''}` : 'No rake';
    const convergence = scenario.solver?.exploitabilityPotPercent;
    return `<section class="gto-facts"><div class="section-row"><span class="eyebrow">River subgame</span><span class="small-pill">Spot ${index + 1} / ${solverScenarios.length}</span></div><h2>${escape(scenario.title)}</h2><div class="gto-board" aria-label="Board">${scenario.board.map(card).join('')}</div><div class="gto-hero"><span>Your hand</span>${comboLabel(scenario.hero)}<span>You: ${escape(scenario.heroPosition)} · Villain: ${escape(scenario.villainPosition)}</span></div><div class="gto-fact-grid"><div><span>Starting pot</span><b>${numeric(scenario.pot)}bb</b></div><div><span>River-start stack</span><b>${numeric(scenario.stack)}bb</b></div><div><span>Rake</span><b>${escape(rake)}</b></div></div><p class="gto-position-key">IP acts after the opponent; OOP acts first. This exercise starts on the river with the ranges below.</p><ol class="gto-history">${history}</ol><p class="gto-observed"><b>Build villain’s range after:</b> ${escape(observedAction(scenario))}${Number.isFinite(scenario.potAfterBet) ? `<br>Current pot: ${numeric(scenario.potAfterBet)}bb.` : ''}</p><p class="gto-accuracy"><span title="A measure of how much a best-response opponent could gain against the computed strategies in this configured game. Smaller is closer to equilibrium; it is reported relative to the starting pot.">Achieved exploitability ⓘ</span><b>${Number.isFinite(convergence) ? convergenceNumber(convergence) + '% of pot' : 'Not reported'}</b></p><details class="gto-starting" open><summary>Declared river starting ranges</summary><p>These are inputs to the solve, before the action above. A weight of 1 means a combo enters this river game fully; a smaller weight means it enters less often.</p><dl><dt>OOP</dt><dd>${escape(scenario.startingRanges?.OOP || '')}</dd><dt>IP</dt><dd>${escape(scenario.startingRanges?.IP || '')}</dd></dl></details>${provenance(scenario)}</section>`;
  }

  function inspector(scenario, ctx) {
    if (!inspected) return '<p class="gto-inspector-placeholder">Use arrow keys to move through the chart. Press Space to paint a hand with the selected frequency.</p>';
    const hand = ctx.classes.get(inspected);
    if (!result) return `<div class="gto-inspector"><h3>${inspected}</h3><p>${hand.count} legal exact combinations after removing the board and your cards. Your current weight: ${percentage(selected[inspected] || 0)}.</p><p>The chart weight is a fraction of all legal combinations in this hand class. The solver answer appears after you check.</p></div>`;
    const rows = hand.combos.map(entry => `<tr><td>${comboLabel(entry.cards)}</td><td>${percentage(entry.priorWeight, 1)}</td><td>${entry.priorWeight ? percentage(entry.actionProbability, 1) : '—'}</td><td>${percentage(entry.targetWeight, 1)}</td></tr>`).join('');
    return `<div class="gto-inspector" aria-live="polite"><h3>${inspected}: ${percentage(hand.raw, 1)} exact average → ${percentage(hand.practice)} practice step</h3><p>You chose ${percentage(selected[inspected] || 0)}. ${hand.count ? 'The exact average is the sum of each legal combo’s reach weight divided by every legal combo in this class, including combos outside the starting pool as zero.' : 'Known cards remove every exact combination of this hand.'}</p><p>This chart averages suits for the exercise. The engine solved each exact combination separately; it did not merge these hands into a strength bucket.</p>${rows ? `<div class="gto-table-scroll"><table class="range-table gto-combo-table"><thead><tr><th>Exact combo</th><th>Starting weight</th><th>Action frequency</th><th>Reach weight</th></tr></thead><tbody>${rows}</tbody></table></div><p>Reach weight = starting weight × frequency of taking the observed action. “—” means the combo was outside the starting range. These weights are not normalized to sum to 100% across the range.</p>` : ''}</div>`;
  }

  function chart(scenario) {
    const ctx = context(scenario);
    const cells = HAND_CELLS.map(({hand, kind}, cellIndex) => {
      const chosen = selected[hand] || 0, target = ctx.classes.get(hand), dead = !target.count;
      const status = result ? chosen < target.practice ? 'gto-under' : chosen > target.practice ? 'gto-over' : chosen > 0 ? 'gto-match' : '' : '';
      return `<button type="button" class="range-cell gto-cell ${kind} ${dead ? 'blocked' : ''} ${status}" style="--gto-fill:${chosen * 100}%" data-gto-hand="${hand}" data-gto-index="${cellIndex}" tabindex="${cellIndex === 0 ? 0 : -1}" aria-label="${hand}, selected ${percentage(chosen)}${dead ? ', no legal combinations' : ''}${result ? ', practice target ' + percentage(target.practice) : ''}" aria-pressed="${chosen > 0}" ${dead ? 'aria-disabled="true"' : ''}><span>${hand}</span><small>${percentage(chosen)}</small>${result && chosen !== target.practice ? `<i aria-hidden="true">${chosen < target.practice ? '+' : '−'}</i>` : ''}</button>`;
    }).join('');
    const painted = Object.values(selected).filter(weight => weight > 0).length;
    return `<section class="chart-panel gto-chart"><div class="answer-kicker"><span class="eyebrow">Solver range practice</span><span>Weighted hand chart</span></div><h2>How often does each hand reach this action?</h2><p class="question-sub">Choose a frequency brush, then click hands to paint villain’s range. Weights describe how much of each legal hand class remains after the action.</p><p class="gto-step-note"><b>Practice steps: 25%; exact solver frequencies in feedback.</b> Each target class is rounded to the nearest step for grading. A mixed strategy can be correct.</p>${!result ? `<div class="gto-brush" role="group" aria-label="Range frequency brush">${STEPS.map(weight => `<button class="${brush === weight ? 'active' : ''}" data-gto-brush="${weight}" aria-pressed="${brush === weight}">${percentage(weight)}${weight === 0 ? '<span>Erase</span>' : ''}</button>`).join('')}</div>` : '<p class="gto-chart-key"><span class="good">✓ Matching step</span><span class="missing">+ Increase weight</span><span class="too-wide">− Reduce weight</span></p>'}<p class="mobile-chart-tip">Swipe the chart sideways to reach every hand.</p><div class="range-chart-scroll" tabindex="0" aria-label="Scrollable GTO range chart"><div class="range-matrix" role="group" aria-label="13 by 13 weighted starting-hand chart">${cells}</div></div>${!result ? `<div class="chart-toolbar"><span>${painted} hand classes painted</span><div><button class="text-button" data-gto-action="undo" ${undo.length ? '' : 'disabled'}>Undo</button><button class="text-button" data-gto-action="clear" ${painted ? '' : 'disabled'}>Clear</button></div></div>` : ''}<div id="gto-inspector">${inspector(scenario, ctx)}</div>${result ? feedback(scenario, ctx) : `<button class="primary" data-gto-action="check">Check my weighted range</button><div class="answer-actions"><span class="formula-note">An empty chart submits every hand at 0%.</span><button class="text-button" data-gto-action="reveal">Reveal reference</button></div>`}</section>`;
  }

  function feedback(scenario, ctx) {
    const wrong = [...result.missing, ...result.extra];
    const referenceCombos = [...ctx.classes.values()].reduce((sum, hand) => sum + hand.raw * hand.count, 0);
    return `<section class="gto-feedback ${result.correct && !result.revealed ? 'correct' : ''}" id="gto-feedback" tabindex="-1"><div class="range-score"><b>${result.revealed ? 'Reference' : result.score + '%'}</b><span>${result.revealed ? 'Revealed · saved for review' : assisted ? 'Assisted · saved for review' : 'range match at 25% practice steps'}</span></div><p>${result.correct && !result.revealed ? 'Every hand class matches the rounded practice target.' : 'Inspect a hand below to compare your weight with the exact solver frequencies and the rounded practice target.'}</p><p>The exact reference contains ${numeric(referenceCombos)} weighted combinations after known-card removal. These are solver results for the provided river starting ranges.</p>${wrong.length ? `<div class="hand-tags">${wrong.map(hand => `<button class="outline-button" data-gto-inspect="${hand}">${hand}: ${percentage(selected[hand] || 0)} → ${percentage(ctx.classes.get(hand).practice)}</button>`).join('')}</div>` : ''}<details><summary>How this range match is calculated</summary><p>For each class, multiply its number of legal combinations by the smaller of your weight and the rounded target. Add these overlaps and divide by the corresponding total using the larger weights. Correctly leaving unrelated hands at zero adds no free points. This measures range reconstruction, not expected-value loss or action quality.</p></details><button class="primary" data-gto-action="next">${reviewing ? 'Next review spot' : 'Next solver spot'} →</button></section>`;
  }

  function library() {
    return `<details class="gto-library"><summary>Browse ${solverScenarios.length} solver exercises</summary><p class="formula-note">Each exercise declares its starting ranges and solving assumptions. Your tendencies and combo practice histories are separate.</p><div class="spot-grid">${solverScenarios.map((scenario, spotIndex) => `<button class="spot-card" data-gto-spot="${spotIndex}"><span class="eyebrow">River · ${escape(scenario.villainPosition)} villain</span><strong>${escape(scenario.title)}</strong><span>${scenario.board.map(card).join('')}</span><span>${progress.gto.records[scenario.id]?.mastered ? '✓ Practice steps matched' : progress.gto.records[scenario.id]?.review ? 'Needs review' : 'Not completed'} →</span></button>`).join('')}</div></details>`;
  }

  function view() {
    if (!solverScenarios.length) return '<section class="empty-state"><h1>GTO solver practice</h1><p>No solver exercises are connected yet. This section requires exact-combo solver results with declared ranges, game settings, and convergence data.</p><p>Your villain-tendency and combo exercises remain available in their own sections.</p></section>';
    const scenario = current(), summary = stats();
    return `<div class="gto-mode"><div class="title-row"><div><h1>Reconstruct a solver range.</h1><p class="subtitle">Practice weighted ranges against a solver strategy in a declared river game.</p></div></div><div class="gto-progress-strip"><span><b>${summary.total}</b> attempt${summary.total===1?'':'s'}</span><span><b>${summary.average === null ? '—' : summary.average + '%'}</b> average match</span><span><b>${summary.mastered}/${solverScenarios.length}</b> matched</span><button class="outline-button" data-gto-action="review" ${summary.review ? '' : 'disabled'}>${reviewing ? 'Reviewing' : 'Review'} ${summary.review} spot${summary.review===1?'':'s'}</button>${reviewing ? '<button class="text-button" data-gto-action="all">All solver spots</button>' : ''}</div><div class="range-workspace gto-workspace">${facts(scenario)}${chart(scenario)}</div>${library()}<details class="gto-progress-details"><summary>Solver practice progress</summary><p>${summary.total} attempts are saved in this browser. Reveals enter review and do not count toward the average. Codex help marks an attempt as assisted and keeps it in review. A complete unaided match of the 25% steps clears a spot. This score is kept separate from tendencies and exact-combo training.</p><button class="text-button" data-gto-action="reset-confirm">Reset solver progress</button>${confirmReset ? '<div class="reset-confirm"><span>Clear only solver attempts and review?</span><button class="outline-button" data-gto-action="reset">Clear solver progress</button><button class="text-button" data-gto-action="reset-cancel">Cancel</button></div>' : ''}</details></div>`;
  }

  function bind() {
    if (!current()) return;
    const host = document.querySelector('.gto-mode');
    if (!host) return;
    host.querySelectorAll('[data-gto-brush]').forEach(button => button.onclick = () => {brush = Number(button.dataset.gtoBrush); render();});
    host.querySelectorAll('[data-gto-hand]').forEach(button => {
      button.onclick = () => {
        const hand = button.dataset.gtoHand;
        inspected = hand;
        if (!result && context(current()).classes.get(hand).count) {undo.push({...selected}); if (undo.length > 100) undo.shift(); selected[hand] = brush;}
        render();
        const focused = document.querySelector(`[data-gto-hand="${hand}"]`);
        focused?.focus({preventScroll:true});
      };
      button.onkeydown = event => {
        const i = Number(button.dataset.gtoIndex), row = Math.floor(i / 13), col = i % 13;
        let next = i;
        if (event.key === 'ArrowRight') next = row * 13 + Math.min(12, col + 1);
        else if (event.key === 'ArrowLeft') next = row * 13 + Math.max(0, col - 1);
        else if (event.key === 'ArrowDown') next = Math.min(12, row + 1) * 13 + col;
        else if (event.key === 'ArrowUp') next = Math.max(0, row - 1) * 13 + col;
        else if (event.key === 'Home') next = event.ctrlKey ? 0 : row * 13;
        else if (event.key === 'End') next = event.ctrlKey ? 168 : row * 13 + 12;
        else return;
        event.preventDefault();
        host.querySelectorAll('[data-gto-index]').forEach(cell => cell.tabIndex = Number(cell.dataset.gtoIndex) === next ? 0 : -1);
        host.querySelector(`[data-gto-index="${next}"]`)?.focus();
      };
    });
    host.querySelectorAll('[data-gto-inspect]').forEach(button => button.onclick = () => {inspected = button.dataset.gtoInspect; render(); document.querySelector('#gto-inspector')?.scrollIntoView({behavior:'smooth', block:'center'});});
    host.querySelectorAll('[data-gto-spot]').forEach(button => button.onclick = () => {reviewing = false; open(Number(button.dataset.gtoSpot)); document.querySelector('.gto-mode')?.scrollIntoView({block:'start'});});
    host.querySelectorAll('[data-gto-action]').forEach(button => button.onclick = () => {
      switch (button.dataset.gtoAction) {
        case 'undo': if (!result && undo.length) {selected = undo.pop(); render();} break;
        case 'clear': if (!result) {undo.push({...selected}); selected = {}; render();} break;
        case 'check': case 'reveal': {
          if (result) break;
          const revealed = button.dataset.gtoAction === 'reveal';
          result = {...gradeGtoRange(current(), selected, context(current())), revealed};
          inspected = result.missing[0] || result.extra[0] || result.matched[0] || 'AA';
          recordGtoAttempt(progress, {id:current().id, result, revealed, hinted:assisted}); save(); render();
          document.querySelector('#gto-feedback')?.focus({preventScroll:false});
          break;
        }
        case 'next': {
          const queue = reviewSpots();
          if (reviewing && queue.length) {const found = queue.findIndex(scenario => scenario.id === current().id); open(solverScenarios.indexOf(queue[(found + 1) % queue.length]));}
          else {reviewing = false; open((index + 1) % solverScenarios.length);}
          document.querySelector('.gto-mode')?.scrollIntoView({block:'start'}); break;
        }
        case 'review': {const first = reviewSpots()[0]; if (first) {reviewing = true; open(solverScenarios.indexOf(first));} break;}
        case 'all': reviewing = false; open(index); break;
        case 'reset-confirm': confirmReset = true; render(); break;
        case 'reset-cancel': confirmReset = false; render(); break;
        case 'reset': resetProgress(); break;
      }
    });
  }
  function questionContext() {
    const scenario = current();
    if (!scenario) return {mode:'gto', exercise:null};
    const {id, title, board, hero, heroPosition, villainPosition, pot, potAfterBet, stack, rake, history, startingRange, startingRanges, rangeScope, selectedAction, actions, solver, combos} = scenario;
    const publicSpot = {id, title, board, hero, heroPosition, villainPosition, pot, potAfterBet, stack, rake, history, startingRange, startingRanges, rangeScope, selectedAction, actions, solver};
    return {mode:'gto', exercise:publicSpot, selectedFrequencies:{...selected}, practiceStep:0.25, weightSemantics:'Unnormalized reach weight = prior weight × action frequency; class average includes every legal combo, with combos outside the declared starting range weighted zero.', assisted, result:result ? {...result} : null,
      ...(result ? {reference:{combos, classes:[...context(scenario).classes.values()].filter(hand => hand.raw > 0).map(hand => ({hand:hand.hand,legalCombos:hand.count,exactAverage:hand.raw,practiceStep:hand.practice}))}} : {})};
  }
  const markAssisted = () => {if (!result) assisted = true;};
  return {view, bind, stats, questionContext, markAssisted};
}
