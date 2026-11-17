const test=require('node:test'),assert=require('node:assert/strict');const {boot}=require('./helpers.cjs');
test('echo central projectile chains to two nearest enemies only on its first impact',()=>{
 const {G}=boot();const g=G.start('quick');g.levels={blade:2,echo:1,pierce:1};G.rebuild();
 const target=G.enemy('ghost',100,0);target.hp=500;target.speed=0;g.lastFire=g.p.interval;G.update(.001);
 const b=g.bullets.find(b=>b.echo);assert(b);assert.equal(g.bullets.filter(b=>b.echo).length,1);g.bullets=[b];b.x=100;b.y=0;b.vx=b.vy=0;
 const nearby=[150,180,300].map(x=>{const e=G.enemy('ghost',x,0);e.hp=500;e.speed=0;return e});
 G.update(.001);assert.equal(target.hp,500-b.damage);assert.equal(nearby[0].hp,500-b.damage*.35);assert.equal(nearby[1].hp,500-b.damage*.35);assert.equal(nearby[2].hp,500);assert.equal(g.links.length,2);
 b.x=150;G.update(.001);assert.equal(nearby[0].hp,500-b.damage*.35-b.damage);assert.equal(nearby[1].hp,500-b.damage*.35);
});
test('normal projectiles never create chain damage',()=>{
 const {G}=boot();const g=G.start('quick');const a=G.enemy('ghost',100,0),b=G.enemy('ghost',150,0);a.hp=b.hp=500;a.speed=b.speed=0;g.lastFire=g.p.interval;G.update(.001);
 const bullet=g.bullets[0];bullet.x=100;bullet.y=0;bullet.vx=bullet.vy=0;G.update(.001);assert.equal(b.hp,500);assert.equal(g.links.length,0);
});
for(const enabled of [false,true])test('dash clears nearby hostile bullets at its endpoint only with safe dash: '+enabled,()=>{
 const {G}=boot();const g=G.start('quick');if(enabled){g.levels={shield:1,clock:2};G.rebuild()}
 G.dash();g.dash.x=g.dash.y=0;
 g.hostile=[{x:70,y:0,vx:0,vy:0,life:4,r:5,damage:12},{x:180,y:0,vx:0,vy:0,life:4,r:5,damage:12}];
 G.update(.01);assert.equal(g.hostile.length,2);g.dash.active=.001;G.update(.01);assert.equal(g.hostile.length,enabled?1:2);assert.equal(g.p.hp,100);
});
