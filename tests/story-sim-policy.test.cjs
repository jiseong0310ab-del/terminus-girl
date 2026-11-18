'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {run}=require('../scripts/story-play-sim.cjs');
test('idle QA policy never wins passive story missions or creates legacy rewards',()=>{
 for(const seed of [1,2,3]){
  const r=run(seed,'idle');assert.equal(r.complete,false);
  assert.equal(r.results[0].won,false);assert.notEqual(r.results[0].reason,'objective');
  assert.equal(r.wallet,0);assert.equal(r.legacyRuns,0);
 }
});
test('objective-seeking QA policies can activate real world mission goals',()=>{
 const rows=['kite','cautious','novice'].flatMap(policy=>[1,2,3].map(seed=>run(seed,policy)));
 assert(rows.some(r=>r.results[0]?.won), 'at least one action-seeking policy must solve the first station');
 for(const r of rows){
  assert.equal(r.wallet,0);assert.equal(r.legacyRuns,0);
  if(r.results[0]?.won)assert.equal(r.results[0]?.reason,'objective');
 }
});

test('report deterministic eight-seed mission balance by simulated input policy (not human success rates)',()=>{
 const benchmark={};
 for(const policy of ['idle','novice','straight','cautious','kite']){
  const rows=Array.from({length:8},(_,index)=>run(index+1,policy));
  const first=rows.map(r=>r.results.find(x=>x.id==='approach')).filter(Boolean);
  const wins=first.filter(x=>x.won);
  const completed=rows.filter(r=>r.complete),second=rows.map(r=>r.results.find(x=>x.id==='escort')).filter(Boolean);
  const mean=(items,key)=>items.length?Number((items.reduce((sum,x)=>sum+x[key],0)/items.length).toFixed(1)):null;
  benchmark[policy]={firstWins:wins.length,outOf:rows.length,firstWinSeconds:mean(wins,'time'),
   firstWinHP:mean(wins,'hp'),twoChaptersCompleted:completed.length,secondReached:second.length,secondAvgSeconds:mean(second,'time'),secondAvgHP:mean(second,'hp'),secondReasons:second.slice(0,3).map(x=>x.reason),secondKills:mean(second,'kills')};
  assert(rows.every(r=>r.wallet===0&&r.legacyRuns===0));
 }
 assert.equal(benchmark.idle.firstWins,0);
 assert(['novice','straight','cautious','kite'].some(p=>benchmark[p].firstWins>0));
 console.log('STORY_BALANCE_POLICY_SAMPLE '+JSON.stringify(benchmark));
});
