const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers.cjs');

test('frost slows enemies by the amount granted by each card level',()=>{
  for(const level of [1,2,3]){
    const {G}=boot(),g=G.start('quick');
    g.levels.frost=level;G.rebuild();
    const e=G.enemy('ghost',300,0);e.slow=1;e.wait=10;
    const speed=e.speed;G.update(.04);
    assert(Math.abs(e.x-(300-speed*(1-g.p.slow)*.04))<1e-9);
  }
});

test('lantern boss kill clears immediately without an extra damage frame',()=>{
  const {G}=boot(),g=G.start('quick');
  g.levels.lantern=1;G.rebuild();g.pulseClock=4;
  const boss=G.enemy('boss',100,0);boss.hp=1;boss.wait=10;
  G.update(.04);
  assert.equal(g.bossDefeated,true);
  assert.equal(g.status,'ended');
  assert.equal(g.won,true);
});
