const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers.cjs');
function kill(G,type='ghost'){const e=G.enemy(type,200,0);G.hitEnemy(e,1e6);return e;}
test('eight chained kills activate overcharge once, with elites worth two',()=>{
 const {G}=boot();const g=G.start('quick');for(let i=0;i<6;i++)kill(G);assert.equal(g.chain,6);
 kill(G,'warden');assert.equal(g.overcharge,6);assert.equal(g.chain,0);
 const kills=g.kills;const e=kill(G);G.hitEnemy(e,1e6);assert.equal(g.overcharge,6);assert.equal(g.chain,0);assert.equal(g.kills,kills+1);
});
test('chain expires, overcharge freezes while paused and cannot carry to another station',()=>{
 const {G}=boot();let g=G.start('quick');kill(G);g.chainTime=.01;G.update(.04);assert.equal(g.chain,0);
 for(let i=0;i<8;i++)kill(G);G.pause();const remaining=g.overcharge;G.update(.04);assert.equal(g.overcharge,remaining);
 G.resume();g.overcharge=.01;G.update(.04);assert.equal(g.overcharge,0);kill(G);assert.equal(g.chain,1);
 g=G.initialize('quick',1,{...g,hp:70});assert.equal(g.overcharge,0);assert.equal(g.chain,0);
});
test('overcharge speeds up attacks and attracts farther experience without mutating base stats',()=>{
 const {G}=boot();const g=G.start('quick');g.overcharge=6;g.lastFire=g.p.interval*.75;G.enemy('boss',400,0);
 const interval=g.p.interval,magnet=g.p.magnet;g.drops.push({x:magnet*1.3,y:0,value:1});
 const x=g.drops[0].x;G.update(.001);assert(g.bullets.length>0);assert(g.drops[0].x<x);assert.equal(g.p.interval,interval);assert.equal(g.p.magnet,magnet);
 g.overcharge=0;g.bullets=[];g.lastFire=interval*.75;g.drops=[{x:magnet*1.3,y:0,value:1}];G.update(.001);assert.equal(g.bullets.length,0);assert.equal(g.drops[0].x,magnet*1.3);
});
