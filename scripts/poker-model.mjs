// Exact-card features for teaching models. This is not a solver or equity engine.
const rank=c=>'23456789TJQKA'.indexOf(c[0])+2;
const rankSet=cards=>new Set(cards.map(rank));
const straightHigh=values=>{const v=new Set(values);if(v.has(14))v.add(1);for(let h=14;h>=5;h--)if([0,1,2,3,4].every(d=>v.has(h-d)))return h;return 0};
export function features(hole,board){
 const cards=[...hole,...board],counts=new Map(),suits=new Map();
 for(const c of cards){const r=rank(c);counts.set(r,(counts.get(r)||0)+1);suits.set(c[1],(suits.get(c[1])||0)+1)}
 const hc=hole.map(rank),bc=rankSet(board),top=Math.max(...bc),pocket=hc[0]===hc[1];
 const trips=[...counts].filter(([,n])=>n>=3).map(([r])=>r),pairs=[...counts].filter(([,n])=>n>=2).map(([r])=>r);
 const quads=[...counts].some(([r,n])=>n===4&&hc.includes(r));
 const fullHouse=trips.some(t=>pairs.some(p=>p!==t));
 const flushSuit=[...suits].find(([,n])=>n>=5)?.[0];
 const flush=!!flushSuit&&hole.some(c=>c[1]===flushSuit);
 const straight=straightHigh(counts.keys())>straightHigh(bc);
 const madeTrips=trips.some(r=>hc.includes(r));
 // Board-pair + pocket underpair is not treated as hole-driven two pair.
 const pairedBoardRanks=[...bc].filter(r=>board.filter(c=>rank(c)===r).length>=2);
 const twoPair=!pocket&&hc.every(r=>bc.has(r)&&r>Math.max(0,...pairedBoardRanks))&&hc[0]!==hc[1];
 const overpair=pocket&&hc[0]>top;
 const topPair=!pocket&&hc.includes(top);
 const kicker=topPair?Math.max(...hc.filter(r=>r!==top)):0;
 const pair=pocket||hc.some(r=>bc.has(r));
 let flushDraw=false,straightDraw=false,drawOutRanks=[];
 if(board.length<5&&!flush){flushDraw=[...suits].some(([s,n])=>n===4&&hole.some(c=>c[1]===s))}
 if(board.length<5&&!straight){
  const values=new Set(counts.keys());if(values.has(14))values.add(1);
  const boardValues=new Set(bc);if(boardValues.has(14))boardValues.add(1);
  for(let h=5;h<=14;h++){
   const run=Array.from({length:5},(_,i)=>h-i),missing=run.filter(r=>!values.has(r));
   const holeContributes=run.some(r=>values.has(r)&&!boardValues.has(r));
   if(missing.length===1&&holeContributes)drawOutRanks.push(missing[0]===1?14:missing[0]);
  }
  drawOutRanks=[...new Set(drawOutRanks)];straightDraw=drawOutRanks.length>0;
 }
 const strong=quads||fullHouse||flush||straight||madeTrips||twoPair;
 const category=quads?'quads':fullHouse?'full-house':flush?'flush':straight?'straight':madeTrips?'trips':twoPair?'two-pair':overpair?'overpair':topPair?'top-pair':pair?'other-pair':flushDraw?'flush-draw':straightDraw?'straight-draw':'air';
 return {strong,quads,fullHouse,flush,straight,madeTrips,twoPair,overpair,topPair,kicker,pair,flushDraw,straightDraw,drawOutRanks,category};
}
export function classifyAction(hole,board,style,isRaise=false){
 const f=features(hole,board),river=board.length===5;
 const strong=f.strong||(f.overpair&&(!isRaise||style==='broad'));
 const top=f.topPair&&(!isRaise||style==='broad')&&((style==='broad'&&!isRaise)||f.kicker>=12);
 const turn=river?features(hole,board.slice(0,4)):null;
 const missed=river&&(turn.flushDraw||turn.straightDraw)&&!f.pair&&!f.strong;
 let include=false,reason='';
 if(strong){include=true;reason='This combination makes '+f.category.replaceAll('-',' ')+'. The reference model keeps these strong made hands in this betting line.'}
 else if(top){include=true;reason=style==='broad'&&!isRaise?'This top pair is included for thinner value by the broad bettor. Weaker kickers can still bet in this reference range.':'This top pair has a queen-or-better kicker and meets the reference model’s one-pair value cutoff.'}
 else if(!river&&(f.flushDraw||f.straightDraw)&&style!=='cautious'){
  include=true;reason='This exact combination has '+(f.flushDraw?'a flush draw':'a straight draw')+'. The active model uses these draws as semi-bluffs, alongside its value hands.';
 }else if(missed&&style!=='cautious'){
  include=true;reason='This combination had a flush or straight draw on the turn, missed the river, and has no pair. The model uses it as a river bluff; the draw no longer has another card to come.';
 }else if(!river&&style==='broad'&&!isRaise&&f.pair){
  include=true;reason='This broad bettor also bets weaker pairs at the small size. The reference model retains these thin bets rather than restricting the range to top pair or better.';
 }else if(f.pair){reason=isRaise?'This made hand has showdown value, but it falls below the stronger made-hand cutoff for this raise. The model takes a less aggressive line with it.':'This pair falls below this opponent’s value-betting cutoff. Having a pair can justify reaching the street without justifying another bet.'}
 else if(missed){reason='This hand was a draw on the turn but missed the river. Betting it would now be a bluff. The cautious reference model checks these misses.'}
 else if(f.flushDraw||f.straightDraw){reason='This hand has a draw, but a draw need not bet. The cautious reference model takes a free card instead of semi-bluffing it.'}
 else {reason='This combination has no qualifying made hand or active draw for this line. Aggression with other parts of the range does not make every unpaired hand a bluff.'}
 return {include,category:missed?'missed-draw':f.category,reason};
}
