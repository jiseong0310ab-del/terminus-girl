const test=require('node:test'),assert=require('node:assert/strict');const {boot}=require('./helpers.cjs');
test('movement remains continuous beyond the previous invisible world edges',()=>{
 const {G}=boot();const g=G.start('quick');g.p.x=4999;g.p.y=-4999;G.input.x=1;G.input.y=-1;G.update(.04);
 assert(g.p.x>5000);assert(g.p.y< -5000);const x=g.p.x;G.update(.04);assert(g.p.x>x);assert.equal(g.status,'playing');
});
test('a long straight retreat cannot get stuck at an unmarked world edge',()=>{
 const {G}=boot();const g=G.start('quick');g.p.hp=1e6;g.lastFire=-1e6;G.input.x=1;
 for(let i=0;i<750;i++)G.update(.04);assert(g.p.x>6700);assert.equal(g.status,'playing');assert(Number.isFinite(g.p.x));
});
for(const echo of [0,1,2,3,4])test('main blade hits a distant stationary target with echo level '+echo,()=>{
 const {G}=boot();const g=G.start('quick');g.levels.echo=echo;G.rebuild();g.p.crit=0;const e=G.enemy('ghost',350,0);e.hp=1000;e.speed=0;
 g.lastFire=g.p.interval;G.update(.001);const main=g.bullets[Math.floor(g.bullets.length/2)];assert(Math.abs(main.vy)<1e-9);
 g.lastFire=-100;for(let i=0;i<25;i++)G.update(.04);assert(e.hp<=1000-g.p.attack);assert.equal(g.status,'playing');
});
