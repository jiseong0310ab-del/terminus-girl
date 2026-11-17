const test=require('node:test'),assert=require('node:assert/strict');const {boot}=require('./helpers.cjs');const KEY='terminusSaveV1';
function summary(id,extra={}){return {id:'run-'+id,mode:'chapter',stage:0,reason:'retreat',shards:20,kills:3,totalTime:24.5,level:2,levels:{blade:1},relics:[],...extra};}
function goal(S,id){return S.challengeProgress().find(g=>g.id===id)}
test('chapter settlement records the final build and unlocks cosmetic goals without extra currency',()=>{
 const {G,S}=boot();const g=G.start();g.stage=1;g.levels={blade:2,echo:1,shield:1,clock:2};g.relics=['bell','compass','watch'];g.kills=120;g.shards=45;g.totalTime=203.5;G.rebuild();G.finish(false,'death');
 assert.equal(S.data.wallet,22);assert.equal(S.data.stats.runs,1);assert.equal(S.data.history.length,1);const h=S.data.history[0];
 assert.equal(h.id,g.id);assert.equal(h.reason,'death');assert.equal(h.stage,1);assert.equal(h.reward,22);assert.equal(h.totalTime,203.5);assert.equal(h.levels.blade,2);assert.deepEqual([...h.synergies],['echoBlade','safeDash']);assert.equal(h.relics.length,3);assert(h.at>0);
 assert.deepEqual([...S.lastUnlocked],['firstReturn','mirrorClear','dualSynergy','relicCollector','hundredKills']);assert.equal(goal(S,'chapterClear').complete,false);
});
test('duplicate settlement cannot add another history row, goal notification, or payment',()=>{
 const {S}=boot();const run=summary('once');assert.equal(S.settle(run,false),10);assert.deepEqual([...S.lastUnlocked],['firstReturn']);
 const before=S.export();assert.equal(S.settle(run,false),0);assert.equal(S.export(),before);assert.deepEqual([...S.lastUnlocked],[]);
});
test('practice finish and explicit practice settlement do not affect the journal or milestones',()=>{
 const {G,S}=boot();const g=G.start('quick');g.kills=200;g.shards=200;G.finish(true,'practice');
 assert.equal(S.data.history.length,0);assert.equal(S.data.stats.runs,0);assert(S.challengeProgress().every(g=>!g.complete));assert.equal(S.settle(summary('practice',{mode:'single'}),true),0);assert.equal(S.data.history.length,0);
});
test('history retains the ten newest explorations and best build goals survive eviction',()=>{
 const {S}=boot();S.settle(summary('best',{stage:2,kills:150,levels:{blade:2,echo:1,shield:1,clock:2},relics:['bell','watch','lens']}),false);
 for(let i=0;i<12;i++)S.settle(summary('later-'+i),false);
 assert.equal(S.data.history.length,10);assert.equal(S.data.history[0].id,'run-later-11');assert.equal(S.data.history[9].id,'run-later-2');assert(!S.data.history.some(h=>h.id==='run-best'));
 assert.equal(goal(S,'dualSynergy').complete,true);assert.equal(goal(S,'relicCollector').complete,true);assert.equal(S.data.journalBest.maxSynergies,2);assert.equal(S.data.stats.runs,13);
});
test('old saves keep their wallet and provable milestones without inventing past builds or rows',()=>{
 const old=boot(),data=old.S.fresh();delete data.history;delete data.journalBest;data.wallet=99;data.unlocked=2;data.stats={runs:7,wins:1,bestKills:105,totalShards:300};
 const {S}=boot({[KEY]:old.S.encode(data)});assert.equal(S.data.wallet,99);assert.equal(S.data.history.length,0);assert.equal(S.data.stats.runs,7);
 for(const id of ['firstReturn','mirrorClear','hundredKills','chapterClear'])assert.equal(goal(S,id).complete,true);
 assert.equal(goal(S,'dualSynergy').current,0);assert.equal(goal(S,'relicCollector').current,0);assert.deepEqual([...S.lastUnlocked],[]);
});
test('backup import and reopening preserve history and achievements after a chapter win',()=>{
 const source=boot();source.S.settle(summary('win',{stage:2,levels:{frost:1,orbit:1},relics:['bell']}),true);const backup=source.S.export();
 assert.equal(source.S.data.wallet,45);assert.equal(source.S.data.history[0].reason,'ending');assert.equal(source.S.data.history[0].clearedStages,3);
 const restored=boot();restored.S.import(backup);const reopened=boot(Object.fromEntries(restored.values));assert.equal(reopened.S.export(),restored.S.export());assert.equal(goal(reopened.S,'chapterClear').complete,true);assert.equal(reopened.S.data.history[0].synergies[0],'frostOrbit');
});
test('quota failure keeps one exportable history entry and can be saved after access recovers',()=>{
 const b=boot();b.storage.fail=true;const run=summary('quota');assert.equal(b.S.settle(run,false),10);assert.equal(b.S.status,'memory');assert.equal(b.S.data.history.length,1);assert.equal(b.S.settle(run,false),0);
 assert.equal(b.S.preview(b.S.export()).history.length,1);b.storage.fail=false;assert.equal(b.S.save(),true);const after=boot(Object.fromEntries(b.values));assert.equal(after.S.data.history.length,1);assert.equal(after.S.data.wallet,10);assert.equal(goal(after.S,'firstReturn').complete,true);
});
test('stale tab settlement cannot create a history record or overwrite the newer profile',()=>{
 const a=boot(),b=boot({},a.values);a.S.settle(summary('newer'),false);assert.equal(b.S.settle(summary('stale'),true),0);assert.equal(b.S.status,'conflict');assert.equal(b.S.data.history.length,0);assert.equal(b.S.data.stats.runs,0);assert.equal(a.S.preview(a.values.get(KEY)).history[0].id,'run-newer');
});
test('history normalizes foreign and duplicate records, validates builds and caps data size',()=>{
 const {S}=boot(),data=S.fresh();data.history=[{id:'<script>'},summary('valid',{won:false,stage:99,reason:'<b>',levels:{blade:999,echo:1,foreign:99},relics:['lens','lens','foreign'],synergies:['frostOrbit'],kills:Infinity,totalTime:-3,at:Infinity,reward:-1}),summary('valid'),...Array.from({length:20},(_,i)=>summary('bulk-'+i))];
 const next=S.normal(data);assert.equal(next.history.length,8);const h=next.history[0];assert.equal(h.stage,2);assert.equal(h.reason,'retreat');assert.equal(h.levels.blade,6);assert.equal(h.levels.foreign,undefined);assert.deepEqual([...h.synergies],['echoBlade']);assert.deepEqual([...h.relics],['lens']);assert.equal(h.kills,0);assert.equal(h.totalTime,0);assert.equal(h.at,0);assert.equal(h.reward,0);assert(S.encode(next).length<256000);
 assert.equal(S.settle(summary('<bad>'),false),0);assert.equal(S.data.history.length,0);
});
test('settling an abandoned camp checkpoint records retreat and its restored stage',()=>{
 const {G,S}=boot();G.start();G.stageClear();G.g.shards=44;S.snapshot(G.g,'camp');G.g=null;assert.equal(G.abandon(),true);
 assert.equal(S.data.history[0].reason,'retreat');assert.equal(S.data.history[0].clearedStages,1);assert.equal(S.data.history[0].reward,22);assert.equal(goal(S,'mirrorClear').complete,true);
});
