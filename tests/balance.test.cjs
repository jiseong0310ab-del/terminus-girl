'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers.cjs');
const OFFENSE=new Set(['blade','echo','orbit','lantern']);

test('the first three level-ups always present an offensive option',()=>{
 const {G}=boot(),g=G.start('quick');
 for(const level of [2,3,4]){
  g.level=level;g.levels={};G.rebuild();
  for(let i=0;i<100;i++){
   const cards=G.options();
   assert.equal(cards.length,3);
   assert.equal(new Set(cards).size,3);
   assert(cards.some(id=>OFFENSE.has(id)),'no offensive option at level '+level);
  }
 }
});

test('an immediately completable synergy is offered without removing other choices',()=>{
 const {G}=boot(),g=G.start('quick');
 g.level=6;g.levels={shield:1,clock:1};G.rebuild();
 assert.equal(g.synergies.safeDash,false);
 for(let i=0;i<100;i++){
  const cards=G.options();
  assert(cards.includes('clock'),'a ready synergy was missed');
  assert.equal(cards.length,3);
  assert.equal(new Set(cards).size,3);
 }
 g.levels.clock=2;G.rebuild();
 assert.equal(g.synergies.safeDash,true);
});

test('card caps and exhausted pools remain respected',()=>{
 const {TG,G}=boot(),g=G.start('quick');
 g.level=2;
 for(const card of TG.CARDS)g.levels[card.id]=card.cap;
 g.levels.mend=1;g.levels.ward=1;
 G.rebuild();
 for(let i=0;i<10;i++){
  const offered=G.options();
  assert.equal(offered.length,2);
  assert(offered.every(id=>id==='mend'||id==='ward'));
 }
 g.levels.mend=TG.CARDS.find(c=>c.id==='mend').cap;
 g.levels.ward=TG.CARDS.find(c=>c.id==='ward').cap;
 G.rebuild();
 assert.equal(G.options().length,0);
 g.xp=g.xpNeed;
 assert.equal(G.checkLevel(),true);
 assert.equal(g.offered[0],'rest');
});

test('echo projectiles deal 70 percent auxiliary damage, with full main blade and central synergy',()=>{
 const {G}=boot(),g=G.start('quick');
 const e=G.enemy('ghost',300,0);e.hp=e.maxHp=1000;
 g.levels.echo=1;G.rebuild();
 g.lastFire=g.p.interval;
 G.update(.04);
 assert.equal(g.bullets.length,2);
 let damages=g.bullets.map(b=>b.damage).sort((a,b)=>a-b);
 assert(Math.abs(damages[0]-g.p.attack*.7)<1e-6);
 assert(Math.abs(damages[1]-g.p.attack)<1e-6);
 g.bullets=[];
 g.levels.blade=2;G.rebuild();
 assert.equal(g.synergies.echoBlade,true);
 g.lastFire=g.p.interval;
 G.update(.04);
 assert.equal(g.bullets.length,2);
 damages=g.bullets.map(b=>b.damage).sort((a,b)=>a-b);
 assert(Math.abs(damages[0]-g.p.attack*.7)<1e-6);
 assert(Math.abs(damages[1]-g.p.attack*1.3)<1e-6);
});

test('event shard descriptions match the actual pre-settlement shards',()=>{
 const {TG,G}=boot();
 for(const event of TG.EVENTS){
  for(const choice of event.choices){
   if(choice.shards)assert(choice.desc.includes('탐험 기억 조각 +'+choice.shards),
     event.id+': misleading payout description');
  }
 }
 const g=G.start('chapter');
 G.stageClear();
 g.event=0;const before=g.shards;
 assert(G.eventChoice(1));
 assert.equal(g.shards-before,16);
 G.finish(false,'retreat');
 assert.equal(G.g.reward,Math.floor(g.shards/2));
});
