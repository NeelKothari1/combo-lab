export const SUITS=['s','h','d','c'];
export const RANKS='23456789TJQKA';
export const DECK=[...RANKS].flatMap(r=>SUITS.map(s=>r+s));
export function expandHand(token){
  if(/^[2-9TJQKA][shdc][2-9TJQKA][shdc]$/.test(token))return token.slice(0,2)===token.slice(2)?[]:[[token.slice(0,2),token.slice(2)]];
  if(!/^[2-9TJQKA]{2}[so]?$/.test(token))throw new Error('Unsupported hand: '+token);
  const [a,b,kind]=token;const combos=[];
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){
    if(a===b&&j<=i)continue;
    if(kind==='s'&&i!==j)continue;
    if(kind==='o'&&i===j)continue;
    combos.push([a+SUITS[i],b+SUITS[j]]);
  }return combos;
}
export const key=c=>[...c].sort().join('');
export function expandRange(range){return [...new Map(range.flatMap(expandHand).map(c=>[key(c),c])).values()];}
export function remaining(range,dead=[]){const d=new Set(dead);return expandRange(range).filter(c=>!c.some(x=>d.has(x)));}
export function evaluate(s){
 const all=expandRange(s.range),board=remaining(s.range,s.board),live=remaining(s.range,[...s.board,...s.hero]);
 const blocked=board.filter(c=>c.some(x=>s.hero.includes(x)));
 const alternative=s.alternative?remaining(s.range,[...s.board,...s.alternative]):null;
 const answer=s.kind==='blocked'?blocked.length:live.length;
 return {all,board,live,blocked,alternative,answer};
}
