const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers.cjs');
const KEY='terminusSaveV1';
function camp(b){b.G.start();b.G.stageClear();return b.G.g;}
test('chapter boss offers three distinct rewards and requires both reward and event choices',()=>{
 const b=boot(),g=camp(b);g.p.hp=40;g.erase=25;
 assert.equal(new Set(g.bossOffers).size,3);assert.equal(g.bossReward,null);
 assert.equal(b.G.chooseBossReward('unknown'),false);assert.equal(b.G.chooseBossReward('shelter',1),false);
 assert.equal(b.G.nextStage(),false);g.event=0;b.G.eventChoice(1);assert.equal(b.G.nextStage(),false);
 assert.equal(b.G.chooseBossReward('shelter',0),true);assert.equal(g.p.hp,70);assert.equal(g.erase,13);
 assert.equal(b.G.chooseBossReward('shelter',0),false);assert.equal(g.p.hp,70);assert.equal(b.G.nextStage(),true);
 assert.equal(b.G.g.stage,1);assert.equal(b.G.g.bossReward,null);assert.deepEqual([...b.G.g.bossOffers],[]);
});
test('pending choices and a selected bonus card survive repeated reopening without duplication',()=>{
 let b=boot();camp(b);const offers=[...b.G.g.bossOffers];b=boot(Object.fromEntries(b.values));assert(b.G.continue());
 assert.deepEqual([...b.G.g.bossOffers],offers);assert.equal(b.G.g.bossReward,null);
 assert(b.G.chooseBossReward('insight'));b.G.g.event=0;b.G.eventChoice(1);
 for(let i=0;i<3;i++){b=boot(Object.fromEntries(b.values));b.G.continue();assert.equal(b.G.g.bossReward,'insight');assert.equal(b.G.g.bonusCards,1);assert.equal(b.G.chooseBossReward('insight'),false);}
 assert(b.G.nextStage());assert.equal(b.G.g.status,'cards');b.G.choose(b.G.g.offered[0],b.G.g.offerToken);assert.equal(b.G.g.status,'playing');
});
test('spoils use exploration shards and obey half-reward settlement, not an immediate wallet grant',()=>{
 const b=boot(),g=camp(b);g.shards=40;assert(b.G.chooseBossReward('spoils'));assert.equal(g.shards,64);assert.equal(b.S.data.wallet,0);
 b.G.abandon();assert.equal(b.S.data.wallet,32);assert.equal(b.S.data.stats.runs,1);assert.equal(b.G.chooseBossReward('spoils'),false);b.G.abandon();assert.equal(b.S.data.wallet,32);
});
test('a failed reward write remains once-only in memory and can be saved before continuing',()=>{
 const b=boot(),g=camp(b);g.event=0;b.G.eventChoice(1);const before=g.shards;b.storage.fail=true;
 assert(b.G.chooseBossReward('spoils'));assert.equal(b.S.status,'memory');assert.equal(g.shards,before+24);assert.equal(b.G.chooseBossReward('spoils'),false);
 assert.equal(b.G.nextStage(),false);assert.equal(b.G.g,g);assert.equal(b.S.preview(b.S.export()).checkpoint.bossReward,'spoils');
 b.storage.fail=false;assert(b.S.snapshot(g,'camp'));const restored=boot(Object.fromEntries(b.values));restored.G.continue();
 assert.equal(restored.G.g.shards,before+24);assert.equal(restored.G.chooseBossReward('spoils'),false);assert(restored.G.nextStage());
});
test('old camp checkpoints do not gain a retroactive reward or become blocked',()=>{
 const old=boot(),g=camp(old);g.event=0;old.G.eventChoice(1);const data=old.S.preview(old.S.export());
 delete data.checkpoint.bossOffers;delete data.checkpoint.bossReward;
 const b=boot({[KEY]:old.S.encode(data)});assert(b.G.continue());assert.equal(b.G.g.bossReward,'legacy');assert.deepEqual([...b.G.g.bossOffers],[]);
 assert.equal(b.G.chooseBossReward('insight'),false);assert(b.G.nextStage());
});
test('malformed reward IDs cannot create an unfinishable or foreign reward checkpoint',()=>{
 const b=boot();camp(b);const data=b.S.preview(b.S.export());data.checkpoint.bossReward='foreign';assert.throws(()=>b.S.normal(data),/보상/);
 data.checkpoint.bossReward=null;data.checkpoint.bossOffers=['insight','insight','foreign'];assert.throws(()=>b.S.normal(data),/보상/);
});
