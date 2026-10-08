export function ensureChartProgress(progress){
 if(!progress.chart||!Array.isArray(progress.chart.attempts)||!progress.chart.records||typeof progress.chart.records!=='object')progress.chart={attempts:[],records:{}};
 return progress;
}
export function recordChartAttempt(progress,{id,result,hinted=false,revealed=false,at=new Date().toISOString()}){
 ensureChartProgress(progress);
 const correct=result.correct&&!revealed,clean=correct&&!hinted;
 const old=progress.chart.records[id]||{};
 progress.chart.records[id]={attempts:(old.attempts||0)+1,review:!clean,mastered:clean,score:revealed?0:result.score};
 progress.chart.attempts.push({id,correct,hinted,revealed,score:revealed?0:result.score,matched:result.matched.length,missing:result.missing.length,extra:result.extra.length,at});
 progress.chart.attempts=progress.chart.attempts.slice(-2000);
 return progress;
}
