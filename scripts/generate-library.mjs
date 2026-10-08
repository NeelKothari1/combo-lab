import {writeFileSync} from 'node:fs';
import {expandRange,remaining,key,DECK} from '../dist/engine.js';
import {classifyAction} from './poker-model.mjs';
const ranks=[...'AKQJT98765432'];
const pairs=ranks.map(r=>r+r);
const broad=['AK','AQ','AJ','AT','KQ','KJ','KT','QJ','QT','JT'];
const suitedAces=['A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s'];
const connectors=['T9s','98s','87s','76s','65s','54s','43s'];
const wide=[...pairs,...broad,...suitedAces,...connectors,'K9s','K8s','Q9s','J9s','T8s','97s','86s','75s','64s','53s'];
const medium=[...pairs,'AK','AQ','AJ','ATs','KQ','KJs','KTs','QJs','QTs','JTs',...suitedAces,...connectors,'T8s','97s','86s'];
const tight=['AA','KK','QQ','JJ','TT','99','88','77','66','55','AK','AQ','AJs','ATs','KQs','KJs','QJs','JTs','T9s','98s','A5s','A4s'];
const styles=['cautious','active','broad'];
const profile=(style,street,isRaise=false)=>({
 name:{cautious:'Selective value player',active:'Draw-driven aggressor',broad:'Broad pressure player'}[style],
 style:{cautious:'Rarely bets weak hands',active:'Mixes value and draws',broad:'Adds thin value'}[style],
 sample:'Fictional training read · 40 comparable opportunities; 12 hands shown',
 observations:style==='cautious'?['Took the aggressive action in 8 of the 40 tracked opportunities.','Shown aggressive hands were mostly strong made hands; often checked weaker pairs.','Has checked unmade draws and given up missed river draws.']:style==='active'?['Has taken this line with strong made hands and unmade draws.','Several shown river bluffs began as draws on the turn.','Often takes a showdown with medium-strength pairs.']:['Took the aggressive action in 27 of the 40 tracked opportunities.','Has shown thin value bets as well as strong made hands and draw bluffs.',isRaise?'Raises have been stronger than ordinary bets, with draws alongside the made hands.':'Uses the small betting size with a broad collection of made hands.'],
 caution:'These fictional observations suggest a tendency, not an exact range or frequency. Precise boundaries are disclosed after checking.'
});
// Each row changes ranks or runout, not just suit labels. Prefixes are street boards.
const runouts=[
 ['a72','Ace-high dry','Ah 7d 2c 9s 4h'],['a83','Ace-high dry','As 8c 3d 6h Tc'],['a94','Ace-high two-tone','Ad 9d 4c 2h 7s'],
 ['k83','King-high dry','Kh 8c 3d 5s 2h'],['k94','King-high two-tone','Ks 9s 4d 6h 2c'],['kt5','Broadway draw','Kd Td 5c 3h 8s'],
 ['q74','Queen-high dry','Qh 7c 4d 2s 9h'],['q95','Queen-high two-tone','Qs 9s 5c 2d 8h'],['qj3','Broadway draw','Qd Jd 3c 6h 2s'],
 ['jt4','Broadway draw','Jh Tc 4d 8s 2c'],['t96','Connected two-tone','Ts 9s 6d 7c 3h'],['987','Connected two-tone','9h 8h 7c 2d Ks'],
 ['876','Low connected','8s 7d 6c 2h Qs'],['765','Low connected','7h 6h 5d Tc 2s'],['654','Low connected','6s 5c 4d Jh 9s'],
 ['kk4','Paired board','Ks Kh 4d 8c 2s'],['qq6','Paired board','Qh Qd 6s 9c 3h'],['882','Paired board','8s 8d 2h Kc 5s'],
 ['aq7m','Monotone / four-flush','As Qs 7s 3d 5s'],['kj5m','Monotone / four-flush','Kh Jh 5h 8d 2h'],['t64m','Monotone / four-flush','Td 6d 4d Qc 8d'],
 ['a85f','Flush completes','Ah 8h 5c 2h Kd'],['kt6f','Flush completes','Ks Ts 6d 3s 9h'],['q92p','Board pairs','Qh 9c 2s 9d 5c']
];
const contexts=[
 {id:'btn-cbet',label:'BTN continuation bet',hero:'BB',villain:'BTN',prior:wide,kind:'Single-raised pot',base:5.5,pre:'Folds to BTN, who opens to 2.5bb. SB folds. You call in the BB.',raise:false},
 {id:'co-cbet',label:'CO bets out of position',hero:'BTN',villain:'CO',prior:medium,kind:'Single-raised pot',base:6.5,pre:'Folds to CO, who opens to 2.5bb. You call on the BTN. Both blinds fold.',raise:false},
 {id:'bb-checkraise',label:'BB check-raise',hero:'BTN',villain:'BB',prior:wide,kind:'Single-raised pot',base:5.5,pre:'You open BTN to 2.5bb. SB folds. BB calls.',raise:true},
 {id:'bb-3bet',label:'BB 3-bet pot barrel',hero:'CO',villain:'BB',prior:tight,kind:'3-bet pot',base:18.5,pre:'You open CO to 2.5bb. BTN and SB fold. BB 3-bets to 9bb. You call.',raise:false}
];
const round=x=>Math.round(x*10)/10;
function line(context,street,style){
 let pot=context.base,committed=context.id==='bb-3bet'?9:2.5;const history=[['Preflop',context.pre]],ledger=[];
 const steps=['flop','turn','river'];
 for(let i=0;i<=steps.indexOf(street);i++){
  const st=steps[i],last=st===street,caption=st[0].toUpperCase()+st.slice(1);
  if(context.raise&&last){
   const bet=round(pot*.33),total=round(bet*3.2);history.push([caption,`BB checks. You bet ${bet}bb into ${pot}bb. BB raises to ${total}bb. Action is on you.`]);ledger.push({street:st,potBefore:pot,heroBet:bet,villainBet:total,called:false});pot=round(pot+bet+total);committed+=total;
  }else{
   const frac=style==='broad'?.33:style==='cautious'?.6:.5,bet=round(pot*frac);
   let text=context.raise?`BB checks. You bet ${bet}bb into ${pot}bb. BB calls.`:(context.hero==='BTN'||context.hero==='CO')?`${context.villain} bets ${bet}bb into ${pot}bb.${last?' Action is on you.':' You call.'}`:`You check. ${context.villain} bets ${bet}bb into ${pot}bb.${last?'':' You call.'}`;
   history.push([caption,text]);ledger.push({street:st,potBefore:pot,heroBet:context.raise?bet:0,villainBet:bet,called:!last||context.raise});pot=round(pot+bet*(last?1:2));committed+=bet;
  }
 }
 return {history,potAfterBet:pot,ledger,effectiveStackBB:committed>50?100:50};
}
function heroChoices(board,count=6){
 const candidates=['AsKh','AhQc','KsQh','QhJc','JhTh','Ts9s','9h8h','8c7c','6s5s','4h4c','2d2c','AdAc','KdKc','QsQd','JsJd','As5s','Ah5h','Ad5d','Ac5c'];
 const available=candidates.map(t=>[t.slice(0,2),t.slice(2)]).filter(c=>c.every(x=>!board.includes(x)));
 // Rotate through candidates by board ranks so not every board uses identical hole hands.
 const offset=board.reduce((n,c)=>n+ranks.indexOf(c[0]),0)%Math.max(1,available.length);
 return [...available.slice(offset),...available.slice(0,offset)].slice(0,count);
}
const templates=[];
for(const [boardId,texture,runout] of runouts)for(const street of ['flop','turn','river'])for(const context of contexts)for(const style of styles){
 const board=runout.split(' ').slice(0,{flop:3,turn:4,river:5}[street]);const buckets=new Map();
 const suitCount=Math.max(...'shdc'.split('').map(s=>board.filter(c=>c[1]===s).length));
 const paired=new Set(board.map(c=>c[0])).size<board.length;
 const currentTexture=paired?'Paired board':suitCount===4?'Four-flush board':suitCount>=3?(street==='flop'?'Monotone':'Three-flush board'):texture==='Flush completes'?(board[0][0]==='A'?'Ace-high two-tone':'King-high two-tone'):texture==='Board pairs'?'Queen-high dry':texture;
 for(const combo of remaining(context.prior,board)){
  let d=classifyAction(combo,board,style,context.raise);
  if(!context.raise){for(let n=3;n<board.length;n++){if(!classifyAction(combo,board.slice(0,n),style,false).include){d={include:false,category:'earlier-action',reason:`This combination is removed by the earlier ${n===3?'flop':'turn'} bet in this reference model. Apply the opponent’s betting filter street by street; improving later does not restore a hand already excluded from that line.`};break}}}
  const id=(d.include?'keep-':'exclude-')+d.category+'-'+[...d.reason].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0).toString(36);
  if(!buckets.has(id))buckets.set(id,{id,label:d.category.replaceAll('-',' '),include:d.include,reason:d.reason,tokens:[]});buckets.get(id).tokens.push(combo.join(''));
 }
 const groups=[...buckets.values()],target=groups.filter(g=>g.include).flatMap(g=>g.tokens);if(!target.length)continue;
 const hands=heroChoices(board,6).filter(hero=>remaining(target,hero).length);if(hands.length<1)continue;
 const id=`lib1-${street}-${boardId}-${context.id}-${style}`;
 const rules=context.raise?'Raises keep hole-driven two pair or better, trips, straights, flushes, full houses and quads. '+(style==='broad'?'This broader raising model also includes overpairs and top pair with a queen-or-better kicker.':'Overpairs and single pairs are excluded from this raising model.'):`Bets keep strong made hands and overpairs. ${style==='broad'?'All top pairs are included; weaker pairs also bet on flop/turn.':'Top pair needs a queen-or-better kicker.'}`;
 const draws=style==='cautious'?'Draws and missed draws check.':'On flop/turn, flush and straight draws that use a hole card are semi-bluffs. On the river, only turn draws that missed and have no pair become bluffs.';
 templates.push({id,street,board,texture:currentTexture,situation:context.id,style,difficulty:context.raise||suitCount>=3||paired?'Advanced':'Applied',title:`${currentTexture} · ${context.label}`,heroPosition:context.hero,villainPosition:context.villain,potType:context.kind,...line(context,street,style),profile:profile(style,street,context.raise),startingRange:context.prior,groups,heroChoices:hands,model:`Within the declared starting pool: ${rules} ${draws} ${context.raise?'Earlier villain calls do not add a separate cutoff in this exercise.':'Apply this same betting rule to each earlier villain bet as well; the range cannot regain combos eliminated on an earlier street.'} On paired boards, the board pair alone does not qualify as hole-driven two pair.`,lesson:`First separate the ${context.label.toLowerCase()} range from the hands that could reach this street. The ${style} opponent model and this ${currentTexture.toLowerCase()} board determine which exact combinations continue. Change the read and the same line can contain different hands; known-card removal is certain while the tendency cutoff is an assumption.`,hint:'Separate strong value, thinner made hands, active draws, and missed draws. Consider this player’s tendency and the action, then apply your blockers.',scope:context.raise?'Use this declared preflop pool. Earlier villain calls impose no additional filter in this exercise; infer the range for the current raise.':'Use this declared preflop pool, then narrow it after every villain bet in the history. A later card cannot restore hands already excluded by an earlier action.'});
}
// Preflop decisions use explicit position/action priors and three different working ranges.
const pf=[
 {id:'utg-open',label:'UTG opens',hero:'BB',villain:'UTG',prior:medium,history:'UTG opens to 2.5bb. HJ, CO, BTN and SB fold. Action is on you in the BB.',pot:4,target:[['AA','KK','QQ','JJ','TT','99','AK','AQs'],['AA','KK','QQ','JJ','TT','99','88','77','AK','AQ','AJs','ATs','KQs','QJs','JTs'],medium]},
 {id:'co-open',label:'CO opens',hero:'BB',villain:'CO',prior:wide,history:'UTG and HJ fold. CO opens to 2.5bb. BTN and SB fold. Action is on you in the BB.',pot:4,target:[tight,medium,wide]},
 {id:'btn-open',label:'BTN steals',hero:'BB',villain:'BTN',prior:wide,history:'UTG, HJ and CO fold. BTN opens to 2.5bb. SB folds. Action is on you in the BB.',pot:4,target:[medium,wide,[...wide,'A9o','A8o','A7o','K9o','Q9o','J9o','T8o','98o']]},
 {id:'btn-3bet',label:'BTN 3-bets CO',hero:'CO',villain:'BTN',prior:medium,history:'UTG and HJ fold. You open CO to 2.5bb. BTN 3-bets to 8bb. Both blinds fold. Action is on you.',pot:12,target:[['AA','KK','QQ','AK'],tight,medium]},
 {id:'bb-3bet',label:'BB 3-bets BTN',hero:'BTN',villain:'BB',prior:wide,history:'Folds to you on BTN. You open to 2.5bb. SB folds. BB 3-bets to 10bb. Action is on you.',pot:13,target:[['AA','KK','QQ','JJ','AK','AQs'],tight,medium]},
 {id:'co-4bet',label:'CO 4-bets',hero:'BTN',villain:'CO',prior:tight,history:'CO opens to 2.5bb. You 3-bet BTN to 8bb. Both blinds fold. CO 4-bets to 20bb. Action is on you.',pot:29.5,target:[['AA','KK','AKs'],['AA','KK','QQ','AK','A5s'],['AA','KK','QQ','JJ','AK','AQs','A5s','A4s']]}
];
for(const c of pf)for(let i=0;i<styles.length;i++){
 const style=styles[i],included=c.target[i],prior=[...new Set([...c.prior,...included])],targetKeys=new Set(expandRange(included).map(key));
 const pool=expandRange(prior),kept=pool.filter(x=>targetKeys.has(key(x))).map(c=>c.join('')),excluded=pool.filter(x=>!targetKeys.has(key(x))).map(c=>c.join(''));
 const action=c.id.includes('4bet')?'4-bet':c.id.includes('3bet')?'3-bet':'open';
 const p={name:{cautious:'Tight preflop regular',active:'Active preflop regular',broad:'Loose preflop aggressor'}[style],style:{cautious:'Selective preflop',active:'Adds some light actions',broad:'Wide preflop pressure'}[style],sample:'Fictional training read · 50 comparable positional opportunities',observations:[`Took this ${action} action in ${[7,15,25][i]} of the 50 tracked opportunities.`,i===0?'Shown aggressive hands were concentrated in the strongest part of the pool.':i===1?'Has shown strong value hands and some speculative hands taking this line.':'Has shown light actions as well as premiums in these positions.','Other hands have called or folded; the same sizing does not uniquely identify strength.'],caution:'The exact range boundaries are exercise assumptions. These observations are incomplete and do not establish a solved chart.'};
 const id=`lib1-preflop-${c.id}-${style}`;
 const reasons=i===0?'This selective player’s modeled aggressive range is narrow; this hand belongs to its retained strong group.':i===1?'This active player’s reference range includes this hand alongside its strongest holdings.':'This wide preflop model includes this hand as part of the larger positional aggression range.';
 templates.push({id,street:'preflop',board:[],texture:'Preflop',situation:c.id,style,difficulty:c.id.includes('4bet')?'Advanced':'Foundation',title:c.label,heroPosition:c.hero,villainPosition:c.villain,potType:action==='4-bet'?'4-bet pot':action==='3-bet'?'3-bet pot':'Single-raised pot',effectiveStackBB:50,potAfterBet:c.pot,history:[['Preflop',c.history]],ledger:[],profile:p,startingRange:prior,groups:[{id:'keep-preflop',label:'Modeled '+action+' hands',include:true,reason:reasons,tokens:kept},{id:'exclude-preflop',label:'Other starting hands',include:false,reason:`This hand is in the starting pool but outside the ${style} player’s modeled ${action} range in these positions. Reaching this decision does not mean every hand takes the aggressive action; these hands call or fold instead.`,tokens:excluded}],heroChoices:heroChoices([],19),model:`For this positional ${action}, include ${included.join(', ')} at full frequency; the rest of the stated starting pool does not take this action.`,lesson:'Position and the exact preflop action matter. Opening, reraising, and reraising again are different filters. The assumed cutoff becomes wider as the opponent model becomes more active, while your cards remove exact combinations.',hint:'Identify the action first: opening, 3-betting, or 4-betting. Use the positional read before deciding how much of the starting pool survives.',scope:'This is the declared pool considered before the current preflop action. Select the portion that takes villain’s shown action.'});
}
writeFileSync(new URL('../dist/library-data.js',import.meta.url),'// Generated by scripts/generate-library.mjs. Teaching models, not solver solutions.\nexport const libraryTemplates='+JSON.stringify(templates)+';\n');
console.log(JSON.stringify({templates:templates.length,spots:templates.reduce((n,t)=>n+t.heroChoices.length,0),byStreet:Object.fromEntries(['preflop','flop','turn','river'].map(st=>[st,templates.filter(t=>t.street===st).reduce((n,t)=>n+t.heroChoices.length,0)]))}));
