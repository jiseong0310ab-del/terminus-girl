const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers.cjs');
test('failed next-station save keeps camp, health and pending card until retry succeeds',()=>{
 const b=boot(),{G,S,storage}=b;G.start();G.stageClear();G.g.event=1;G.eventChoice(1);G.g.p.hp=40;S.snapshot(G.g,'camp');
 const camp=G.g;const write=storage.setItem.bind(storage);
 storage.setItem=(k,v)=>{if(k==='terminusSaveV1'&&JSON.parse(v).data.checkpoint?.stage===1)throw Error('quota');write(k,v)};
 assert.equal(G.nextStage(),false);assert.equal(G.g,camp);assert.equal(camp.p.hp,40);assert.equal(camp.bonusCards,1);assert.equal(S.data.checkpoint.phase,'camp');assert.equal(S.data.checkpoint.stage,0);
 const reopened=boot(Object.fromEntries(b.values));reopened.G.continue();assert.equal(reopened.G.g.status,'camp');assert.equal(reopened.G.g.bonusCards,1);
 storage.setItem=write;assert.equal(G.nextStage(),true);assert.equal(G.g.stage,1);assert.equal(G.g.p.hp,60);assert.equal(G.g.status,'cards');
 G.choose(G.g.offered[0],G.g.offerToken);assert.equal(G.g.status,'playing');
});
