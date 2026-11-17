const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers.cjs');
test('storage read failure on lethal damage pauses and settles once after recovery',()=>{
 const {G,S,storage}=boot();const g=G.start();g.shards=45;g.p.hp=1;
 const read=storage.getItem;storage.getItem=()=>{throw Error('temporarily blocked')};
 G.damage(100);assert.equal(g.status,'paused');assert.equal(g.p.hp,0);
 const time=g.time;G.update(.04);assert.equal(g.time,time);assert.equal(S.data.stats.runs,0);
 storage.getItem=read;G.resume();assert.equal(g.status,'ended');assert.equal(g.reason,'death');
 assert.equal(S.data.wallet,22);assert.equal(S.data.stats.runs,1);G.resume();G.finish(false,'death');assert.equal(S.data.wallet,22);
});
test('event health cost and bonus survive camp reload without being charged twice',()=>{
 let b=boot();b.G.start();b.G.stageClear();b.G.g.event=3;b.G.g.p.hp=40;b.S.snapshot(b.G.g,'camp');
 assert(b.G.eventChoice(0));assert.equal(b.G.g.p.hp,25);
 b=boot(Object.fromEntries(b.values));b.G.continue();assert.equal(b.G.g.p.hp,25);assert.equal(b.G.g.bonusCards,1);
 assert.equal(b.G.eventChoice(0),false);assert.equal(b.G.g.p.hp,25);b.G.chooseBossReward('spoils');b.G.nextStage();assert.equal(b.G.g.p.hp,45);assert.equal(b.G.g.status,'cards');
 b.G.choose(b.G.g.offered[0],b.G.g.offerToken);assert.equal(b.G.g.status,'playing');
});
