const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers.cjs');
function quiet(g){g.spawn=-1000;g.nextWave=Infinity;g.eliteCount=2;g.lastFire=-1000;g.hazardClock=-1000;}
function setup(){const b=boot();b.G.start();quiet(b.G.g);return b;}
function appear(b){b.G.g.time=45;b.G.update(.04);assert(b.G.g.memoryAnchor);return b.G.g.memoryAnchor;}
function close(a,b){assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);}

test('one memory anchor appears after 45 seconds and stays at its world position',()=>{
 const b=setup(),{G,TG,c}=b,g=G.g;TG.view={width:320,height:568};c.Math=Object.create(Math);c.Math.random=()=>.25;
 g.p.x=1200;g.p.y=-800;g.time=44.94;G.update(.04);assert.equal(g.memoryAnchor,null);assert.equal(g.anchorSeen,false);
 G.update(.04);const anchor=g.memoryAnchor;assert(anchor);assert.equal(g.anchorSeen,true);close(anchor.x,1200);close(anchor.y,-800+568*.2);
 assert.equal(anchor.remaining,18);assert.equal(anchor.charge,0);assert.equal(anchor.required,1.2);assert.equal(anchor.r,42);assert.equal(anchor.xp,8);
 G.input.x=1;for(let i=0;i<5;i++)G.update(.04);assert(g.p.x>1200);close(anchor.x,1200);close(anchor.y,-800+568*.2);
 G.input.x=0;g.memoryAnchor.remaining=.01;G.update(.04);assert.equal(g.memoryAnchor,null);
 for(let i=0;i<20;i++)G.update(.04);assert.equal(g.memoryAnchor,null);assert.equal(g.anchorSeen,true);
});

test('anchor charge requires staying inside its radius and decays outside',()=>{
 const b=setup(),{G}=b,g=G.g,anchor=appear(b);g.p.x=anchor.x+anchor.r;g.p.y=anchor.y;
 for(let i=0;i<10;i++)G.update(.04);close(anchor.charge,.4);
 g.p.x=anchor.x+anchor.r+.01;for(let i=0;i<5;i++)G.update(.04);close(anchor.charge,.3);
 for(let i=0;i<20;i++)G.update(.04);assert.equal(anchor.charge,0);assert(g.memoryAnchor);
});

test('collecting an anchor awards fixed experience once and uses the normal card pause',()=>{
 const b=setup(),{G,S}=b,g=G.g,anchor=appear(b);g.p.x=anchor.x;g.p.y=anchor.y;g.xp=4;g.erase=20;
 let cardChanges=0;G.onChange=type=>{if(type==='cards')cardChanges++};
 const xp=anchor.xp,erase=g.erase;for(let i=0;i<30;i++)G.update(.04);
 assert.equal(g.memoryAnchor,null);assert.equal(g.status,'cards');assert.equal(g.level,2);assert.equal(g.xp,4+xp-12);assert.equal(cardChanges,1);close(g.erase,erase+.12*1.2-10);assert.equal(g.learned.collected,true);
 assert.match(g.toast.text,/기억 등불 회수/);assert.match(g.toast.text,/경험치 \+8/);assert(g.rings.some(r=>r.x===anchor.x&&r.y===anchor.y));
 const frozenTime=g.time;G.update(.04);assert.equal(g.time,frozenTime);assert.equal(cardChanges,1);
 assert(G.choose(g.offered[0],g.offerToken));G.update(.04);assert.equal(g.memoryAnchor,null);assert.equal(g.level,2);assert.equal(g.xp,0);
 assert.equal(S.data.wallet,0);assert.equal(g.shards,0);assert.equal(S.data.history.length,0);assert.equal(S.data.stats.runs,0);assert(S.challengeProgress().every(goal=>!goal.complete));
});

test('anchor reward is bounded at creation and is not multiplied by wisdom',()=>{
 for(const [need,expected] of [[12,8],[25,13],[100,24]]){
  const b=setup(),{G}=b,g=G.g;g.xpNeed=need;g.levels.wisdom=4;G.rebuild();const anchor=appear(b);assert.equal(anchor.xp,expected);
  g.xpNeed=5000;g.p.x=anchor.x;g.p.y=anchor.y;g.erase=0;anchor.charge=1.18;G.update(.04);
  assert.equal(g.xp,expected);assert.equal(g.erase,0);assert.equal(g.memoryAnchor,null);G.update(.04);assert.equal(g.xp,expected);
 }
});

test('anchor lifetime and charge freeze during pause and card selection; expiration pays nothing',()=>{
 const b=setup(),{G}=b,g=G.g,anchor=appear(b);g.p.x=anchor.x;g.p.y=anchor.y;G.update(.04);const state=JSON.stringify(anchor);
 G.pause();for(let i=0;i<50;i++)G.update(.04);assert.equal(JSON.stringify(anchor),state);G.resume();
 g.xp=g.xpNeed;G.checkLevel();assert.equal(g.status,'cards');for(let i=0;i<50;i++)G.update(.04);assert.equal(JSON.stringify(anchor),state);
 assert(G.choose(g.offered[0],g.offerToken));g.p.x=anchor.x+100;anchor.remaining=.03;const xp=g.xp;G.update(.04);assert.equal(g.memoryAnchor,null);assert.equal(g.xp,xp);
 const b2=setup(),a2=appear(b2);b2.G.g.p.x=a2.x;b2.G.g.p.y=a2.y;a2.charge=1.19;a2.remaining=.01;b2.G.update(.04);assert.equal(b2.G.g.memoryAnchor,null);assert.equal(b2.G.g.xp,0);
});

test('anchor resets with next station and checkpoint resume without changing the save format',()=>{
 let b=setup();appear(b);b.S.snapshot(b.G.g);assert.equal(Object.hasOwn(b.S.data.checkpoint,'memoryAnchor'),false);assert.equal(Object.hasOwn(b.S.data.checkpoint,'anchorSeen'),false);
 b=boot(Object.fromEntries(b.values));assert(b.G.continue());assert.equal(b.G.g.time,0);assert.equal(b.G.g.anchorSeen,false);assert.equal(b.G.g.memoryAnchor,null);quiet(b.G.g);appear(b);
 b.G.stageClear();assert.equal(b.G.g.memoryAnchor,null);b=boot(Object.fromEntries(b.values));assert(b.G.continue());assert.equal(b.G.g.status,'camp');assert.equal(b.G.g.memoryAnchor,null);assert.equal(b.G.g.anchorSeen,false);b.G.update(.04);assert.equal(b.G.g.memoryAnchor,null);
 b.G.chooseBossReward('shelter');b.G.g.event=0;b.G.eventChoice(0);assert(b.G.nextStage());assert.equal(b.G.g.stage,1);assert.equal(b.G.g.anchorSeen,false);assert.equal(b.G.g.memoryAnchor,null);quiet(b.G.g);appear(b);
});

test('boss preparation cancels the anchor and prevents late generation',()=>{
 for(const trigger of ['deadline','spawned','unseen']){
  const b=setup(),{G}=b,g=G.g;let anchor=null;if(trigger!=='unseen'){anchor=appear(b);g.p.x=anchor.x;g.p.y=anchor.y;anchor.charge=1.19;}
  if(trigger==='spawned')g.bossSpawned=true;else g.time=g.duration*.60-.01;
  G.update(.04);assert.equal(g.memoryAnchor,null);assert.equal(g.anchorSeen,true);assert.equal(g.xp,0);
  g.time=50;g.bossSpawned=false;G.update(.04);assert.equal(g.memoryAnchor,null);
 }
});

test('practice never generates anchors and death or retreat clears them before reward',()=>{
 for(const mode of ['quick','single']){const {G}=boot();G.start(mode);quiet(G.g);G.g.time=45;G.update(.04);assert.equal(G.g.memoryAnchor,null);assert.equal(G.g.xp,0);}
 for(const cause of ['death','retreat']){
  const b=setup(),{G}=b,g=G.g,anchor=appear(b);g.p.x=anchor.x;g.p.y=anchor.y;anchor.charge=1.19;
  if(cause==='death'){g.p.hp=1;G.enemy('ghost',g.p.x,g.p.y);G.update(.04);}else G.abandon();
  assert.equal(g.status,'ended');assert.equal(g.reason,cause);assert.equal(g.memoryAnchor,null);assert.equal(g.xp,0);assert.equal(g.shards,0);
 }
});
