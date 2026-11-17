const test=require('node:test'),assert=require('node:assert/strict');const {boot}=require('./helpers.cjs');
test('crossing half health changes boss phase once without changing a warning already shown',()=>{
 const {G}=boot();const g=G.initialize('quick',1,null),e=G.enemy('boss',0,0);g.p.x=150;e.action='windup';e.clock=.8;e.attackPhase=1;e.attackVariant='axis';
 G.hitEnemy(e,e.maxHp*.5);assert.equal(e.bossPhase,2);assert.equal(e.attackPhase,1);assert.equal(e.attackVariant,'axis');const rings=g.rings.length;G.hitEnemy(e,1);assert.equal(g.rings.length,rings);
 G.update(.04);assert.equal(e.attackPhase,1);e.action='approach';e.wait=0;G.update(.04);assert.equal(e.attackPhase,2);assert.equal(e.attackVariant,'diagonal');assert.equal(e.clock,1.6);
 e.action='approach';e.wait=0;G.update(.04);assert.equal(e.attackVariant,'axis');
});
test('mirror aftershock is fixed, warned for one second, hits once and pauses with combat',()=>{
 const {G}=boot();const g=G.start('quick'),e=G.enemy('boss',0,0);g.p.x=300;e.action='windup';e.clock=.01;e.bossPhase=e.attackPhase=2;
 G.update(.04);assert.equal(g.aftershocks.length,1);const s=g.aftershocks[0];assert.equal(s.x,0);assert.equal(s.age,0);assert.equal(g.p.hp,100);g.enemies=[];g.p.x=50;
 G.pause();G.update(.04);assert.equal(s.age,0);G.resume();for(let i=0;i<24;i++)G.update(.04);assert.equal(g.p.hp,100);
 G.update(.04);assert.equal(g.p.hp,82);assert.equal(s.triggered,true);g.lastHit=-9;for(let i=0;i<8;i++)G.update(.04);assert.equal(g.p.hp,82);assert.equal(g.aftershocks.length,0);
});
for(const [variant,x,y,hit]of [['axis',100,0,true],['axis',100,100,false],['diagonal',100,0,false],['diagonal',100,100,true]])test('snow '+variant+' warning matches the damage region at '+x+','+y,()=>{
 const {G}=boot();const g=G.initialize('quick',1,null),e=G.enemy('boss',0,0);g.p.x=x;g.p.y=y;e.action='windup';e.clock=.01;e.bossPhase=e.attackPhase=2;e.attackVariant=variant;
 G.update(.04);assert.equal(g.p.hp,hit?79:100);
});
for(const phase of [1,2])test('terminus phase '+phase+' keeps the locked gap and limits its volley',()=>{
 const {G}=boot();const g=G.initialize('quick',2,null),e=G.enemy('boss',0,0);g.p.x=150;e.action='windup';e.clock=.01;e.bossPhase=e.attackPhase=phase;e.aimX=0;e.aimY=1;
 G.update(.04);assert.equal(g.hostile.length,phase===2?13:9);const speed=phase===2?150:135,gap=phase===2?3*Math.PI/16:Math.PI/4;
 assert(g.hostile.every(b=>Math.abs(Math.hypot(b.vx,b.vy)-speed)<1e-8&&Math.acos(b.vy/speed)>gap));
});
test('elite ember drops once, heals only on collection and never shortens an existing overcharge',()=>{
 const {G,S}=boot();const g=G.start('quick');g.p.hp=55;const e=G.enemy('warden',120,0);G.hitEnemy(e,1e6);G.hitEnemy(e,1e6);
 assert.equal(g.eliteDrops.length,1);assert.equal(g.p.hp,55);assert.equal(S.data.wallet,0);g.p.x=120;g.overcharge=6;G.update(.04);
 assert.equal(g.p.hp,67);assert.equal(g.eliteDrops.length,0);assert(g.overcharge>5.9);G.update(.04);assert.equal(g.p.hp,67);
});
test('elite ember expires, is paused correctly and does not carry into the next station',()=>{
 const {G}=boot();const g=G.start('quick');g.p.hp=95;const e=G.enemy('witch',100,0);G.hitEnemy(e,1e6);G.pause();const item=g.eliteDrops[0];G.update(.04);assert.equal(item.life,18);G.resume();
 g.p.x=100;G.update(.04);assert.equal(g.p.hp,100);assert.equal(g.overcharge,3);
 G.hitEnemy(G.enemy('warden',200,0),1e6);g.eliteDrops[0].life=.01;G.update(.04);assert.equal(g.eliteDrops.length,0);
 g.eliteDrops.push({id:999,x:500,y:0,life:18});assert.equal(G.initialize('quick',1,{...g,hp:80}).eliteDrops.length,0);
});
