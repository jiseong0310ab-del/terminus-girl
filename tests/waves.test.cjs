const test=require('node:test'),assert=require('node:assert/strict');const {boot}=require('./helpers.cjs');
test('stations warn about distinct fixed formations before spawning, and pause freezes warnings',()=>{
 for(const [stage,types,count] of [[0,['ghost'],6],[1,['wolf'],4],[2,['lost','conductor'],4]]){
  const {G}=boot();const g=G.initialize('quick',stage,null);g.time=25;G.update(.04);assert(g.wave);assert.equal(g.wave.points.length,count);assert.equal(g.enemies.length,0);
  const points=g.wave.points.map(p=>({...p}));assert.deepEqual([...new Set(points.map(p=>p.type))],types);
  assert(points.every(p=>Math.hypot(p.x-g.p.x,p.y-g.p.y)>=140));
  G.pause();const remaining=g.wave.remaining;G.update(.04);assert.equal(g.wave.remaining,remaining);G.resume();
  g.p.x+=10;assert.equal(g.wave.points[0].x,points[0].x);
  for(let i=0;i<51;i++)G.update(.04);assert.equal(g.wave,null);assert.equal(g.waveIndex,1);assert.equal(g.enemies.length,count);
 }
});
test('waves skip occupied warning markers and cancel before the boss phase',()=>{
 const {G}=boot();let g=G.start('quick');g.time=25;G.update(.04);const point=g.wave.points[0];g.p.x=point.x;g.p.y=point.y;g.wave.remaining=.01;G.update(.04);assert.equal(g.enemies.length,5);
 g=G.start('quick');g.time=25;G.update(.04);assert(g.wave);g.time=g.duration*.60;G.update(.04);assert.equal(g.wave,null);assert.equal(g.waveIndex,0);
});
test('crowded combat defers waves and wave spawning respects the enemy cap',()=>{
 const {G}=boot();const g=G.start('quick');g.time=25;for(let i=0;i<57;i++)G.enemy('ghost',1000+i,1000);G.update(.04);assert.equal(g.wave,null);
 g.enemies=[];G.update(.04);assert(g.wave);for(let i=0;i<64;i++)G.enemy('ghost',1000+i,1000);g.wave.remaining=.01;G.update(.04);assert.equal(g.enemies.length,65);
});
