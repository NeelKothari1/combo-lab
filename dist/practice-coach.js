import {codexDraftUrl} from './spot-question.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function buildPracticeQuestion(context,question='') {
  const scope=context.mode==='gto'
    ? 'This is a heads-up river exercise from a configured solver game. Explain unnormalized reach weights, action frequencies, and card removal distinctly. The chart grades the nearest 25% step. Do not invent EVs, earlier-street solutions, or a universal GTO answer. Root exploitability describes the configured game, not a per-hand accuracy guarantee.'
    : 'This is an exact card-removal exercise with a supplied candidate range. Explain which specific cards remove combinations. Do not treat the given range as a solved strategy.';
  return `Help me understand this Combo Lab poker exercise.\n${scope}\n${context.result?'Reference feedback is included below.':'The answer has not been revealed. Coach my reasoning without claiming a hidden reference answer.'}\n\nMy question: ${question.trim()||'Walk me through this spot and help me understand my selection.'}\n\nSpot and my current selection:\n${JSON.stringify(context,null,2)}`;
}
export function createPracticeCoach({getController,render}) {
  let open=false,question='',status='',key=null;
  const context=()=>getController()?.questionContext();
  const prompt=()=>buildPracticeQuestion(context(),question);
  function view() {
    const ctx=context(),nextKey=ctx&&(ctx.scenario?.id||ctx.exercise?.id);
    if(nextKey!==key){key=nextKey;open=false;question='';status='';}
    if(!nextKey)return '';
    if(!open)return '<div class="practice-coach-entry"><button class="outline-button" data-practice-coach="open">Ask Codex about this spot ↗</button></div>';
    const draft=prompt(),large=codexDraftUrl(draft).length>12000;
    return `<section class="coach-panel" id="practice-coach" aria-labelledby="practice-coach-heading"><div class="section-row"><div><span class="eyebrow">Discuss this spot</span><h2 id="practice-coach-heading">Ask Codex</h2></div><button class="text-button" data-practice-coach="close" aria-label="Close Ask Codex">Close ×</button></div><p>Your cards, betting history, assumptions, and selection are attached. Replies appear in Codex.</p><label for="practice-coach-question">Your question</label><textarea id="practice-coach-question" maxlength="1200" rows="3" placeholder="Why does this hand belong in the range?">${esc(question)}</textarea><div class="coach-actions">${large?'':`<a class="primary" id="practice-coach-link" href="${esc(codexDraftUrl(draft))}">Open draft in Codex ↗</a>`}<button class="outline-button" data-practice-coach="copy">Copy question + spot</button></div><p class="coach-note">${large?'This spot includes detailed solver feedback. Copy it into your Codex chat.':'Open the draft and send it in Codex, or copy it into an existing chat.'} ${!ctx.result?'Getting help before checking marks this attempt as assisted.':''}</p><p class="coach-status" role="status">${esc(status)}</p><details id="practice-coach-preview"><summary>Review or manually copy the attached spot</summary><textarea id="practice-coach-prompt" rows="12" readonly aria-label="Question and full spot for Codex">${esc(draft)}</textarea></details></section>`;
  }
  function update(){const draft=prompt();document.querySelector('#practice-coach-prompt').value=draft;const link=document.querySelector('#practice-coach-link');if(link){link.href=codexDraftUrl(draft);link.hidden=link.href.length>12000;}}
  function bind(){
    document.querySelector('#practice-coach-question')?.addEventListener('input',event=>{question=event.target.value;update();});
    document.querySelector('#practice-coach-link')?.addEventListener('click',()=>{getController().markAssisted();update();});
    document.querySelectorAll('[data-practice-coach]').forEach(button=>button.onclick=async()=>{
      if(button.dataset.practiceCoach==='open'){open=true;render();document.querySelector('#practice-coach-question')?.focus();return;}
      if(button.dataset.practiceCoach==='close'){open=false;render();return;}
      const copyKey=key;getController().markAssisted();update();
      try{await navigator.clipboard.writeText(prompt());if(copyKey===key)status='Copied. Paste into Codex and send your question.';}
      catch{if(copyKey===key){status='Clipboard unavailable. Select and copy the attached spot below.';const details=document.querySelector('#practice-coach-preview');if(details)details.open=true;document.querySelector('#practice-coach-prompt')?.select();}}
      if(copyKey===key){const target=document.querySelector('#practice-coach .coach-status');if(target)target.textContent=status;}
    });
  }
  return {view,bind,readPrompt(){if(!open||!context())throw new Error('Open Ask Codex for a spot first.');return prompt();}};
}
