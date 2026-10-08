import {libraryTemplates} from './library-data.js';

export const situationNames={
 'utg-open':'UTG open','co-open':'CO open','btn-open':'BTN steal','btn-3bet':'BTN 3-bet','bb-3bet':'BB 3-bet / barrel','co-4bet':'CO 4-bet',
 'btn-cbet':'BTN continuation bet','co-cbet':'CO out of position','bb-checkraise':'BB check-raise'
};
export const styleNames={cautious:'Selective',active:'Draw-driven / active',broad:'Broad pressure'};
const templates=new Map(libraryTemplates.map(t=>[t.id,t]));
const ranges=new Map();
export const expandedScenarios=libraryTemplates.flatMap(t=>t.heroChoices.map((hero,i)=>({
 ...t,heroChoices:undefined,groups:t.groups,hero,collection:'expanded',id:t.id+'-h'+i,templateId:t.id,
 get range(){if(!ranges.has(t.id))ranges.set(t.id,t.groups.filter(g=>g.include).flatMap(g=>g.tokens));return ranges.get(t.id)},
 counterpart:null,comparisonLabel:'Same cards, different tendency'
})));
const byId=new Map(expandedScenarios.map(s=>[s.id,s]));
for(const s of expandedScenarios){
 const otherStyle=s.style==='cautious'?'active':'cautious';
 const templateId=s.templateId.slice(0,-s.style.length)+otherStyle;
 const t=templates.get(templateId),i=t?.heroChoices.findIndex(h=>h.join('')===s.hero.join(''));
 if(i>=0&&byId.has(templateId+'-h'+i))s.counterpart=templateId+'-h'+i;
}
export const libraryInfo={generated:expandedScenarios.length,templates:libraryTemplates.length,recipes:54,runouts:24};

export function filterScenarios(scenarios,{street='all',collection='all',style='all',difficulty='all',situation='all',unseen=false}={},records={}){
 return scenarios.filter(s=>(street==='all'||s.street===street)&&(collection==='all'||s.collection===collection)&&(style==='all'||s.style===style)&&(difficulty==='all'||s.difficulty===difficulty)&&(situation==='all'||s.situation===situation)&&(!unseen||!records[s.id]?.attempts));
}
// Seeded shuffle gives replayable, mixed-street sessions without duplicate IDs.
export function sessionOrder(scenarios,seed){
 const ids=scenarios.map(s=>s.id);let x=seed>>>0;
 for(let i=ids.length-1;i>0;i--){x=(Math.imul(1664525,x)+1013904223)>>>0;const j=x%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]]}return ids;
}
