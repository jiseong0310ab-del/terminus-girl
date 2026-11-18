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
