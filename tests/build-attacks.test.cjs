const test=require('node:test'),assert=require('node:assert/strict');const {boot}=require('./helpers.cjs');
test('frost orbit roots normal enemies with a cooldown while bosses remain mobile',()=>{
 const {G}=boot();const g=G.start('quick');g.levels={frost:1,orbit:1};G.rebuild();
 const e=G.enemy('ghost',65,0);G.update(.001);assert.equal(e.frozen,.45);const x=e.x;G.update(.04);assert.equal(e.x,x);assert(e.freezeCooldown>2.9);
 e.orbitHit=0;e.frozen=0;e.x=65;e.y=0;G.update(.001);assert.equal(e.frozen,0);
 g.enemies=[];const boss=G.enemy('boss',65,0);G.update(.001);assert.equal(boss.frozen,0);assert(boss.slow>0);
});
test('ember lantern leaves a fixed damaging field that expires and clears between stations',()=>{
 const {G}=boot();const g=G.start('quick');g.levels={ember:1,lantern:2};G.rebuild();g.pulseClock=4;G.update(.01);
 assert.equal(g.flames.length,1);const f=g.flames[0];assert.equal(f.life,2);
 g.p.x=300;const e=G.enemy('ghost',f.x,f.y);e.speed=0;const hp=e.hp;G.update(.04);assert(e.hp<hp);assert.equal(f.x,0);
 G.pause();const life=f.life;G.update(.04);assert.equal(f.life,life);G.resume();
 for(let i=0;i<51;i++)G.update(.04);assert.equal(g.flames.length,0);
 assert.equal(G.initialize('quick',1,{...g,hp:80}).flames.length,0);
});
test('a boss defeated by lingering flame clears immediately and non-synergy lantern creates no field',()=>{
 const {G}=boot();let g=G.start('quick');g.levels={lantern:2};G.rebuild();g.pulseClock=4;G.update(.01);assert.equal(g.flames.length,0);
 g=G.start('quick');g.flames=[{x:200,y:0,r:50,life:1}];const boss=G.enemy('boss',200,0);boss.hp=.01;G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,true);
});
