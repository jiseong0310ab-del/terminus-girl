'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function boot(seed={},shared){
 const values=shared||new Map(Object.entries(seed)),storage={fail:false,getItem:key=>values.get(key)||null,setItem(key,value){if(this.fail)throw Error('quota');values.set(key,String(value));}};
 const c={console,Math:Object.create(Math),Date,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage,addEventListener(){},TG:{}};c.window=c;vm.createContext(c);
 for(const file of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),c,{filename:file+'.js'});
 return {TG:c.TG,G:c.TG.engine,S:c.TG.store,A:c.TG.story,storage,values,c};
}
const plain=value=>JSON.parse(JSON.stringify(value));
function advanceToBattle(b){assert(b.A.begin());let guard=0;while(b.TG.STORY.nodes[b.A.state().node].kind==='dialogue'){const state=b.A.state();assert(b.A.advance(state.node,state.line));assert(++guard<30);}return b.A.state().node;}
function quiet(g){g.spawn=-1e6;g.nextWave=Infinity;g.eliteCount=2;g.hazardClock=-1e6;g.enemies=[];g.hostile=[];}
function finishBattle(b){
 const g=b.G.g;quiet(g);
 if(g.storyGate){
  g.storyGate.defeated=[...g.storyGate.guardIds];
  if(g.recordTarget)g.recordTarget.recovered=true;
  g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;
 }
 let guard=0;while(g.status==='playing'){b.G.update(.04);assert(++guard<3000);}
 assert.equal(g.status,'ended');assert.equal(g.won,true);return g;
}
function atBattle(which='approach',b=boot()){
 assert.equal(advanceToBattle(b),'approach');assert(b.G.startStory());
 if(which==='escort'){finishBattle(b);assert.equal(advanceToBattle(b),'escort');b.G.g=null;assert(b.G.startStory());}
 quiet(b.G.g);return b;
}
function legacy(S){const data=plain(S.data);delete data.story;return JSON.stringify(data);}

test('story entry uses the stored battle contract and refuses bypass or replacing active combat',()=>{
 const b=boot(),{G,A,S}=b;assert.equal(G.startStory(),false);assert.throws(()=>G.start('story'),/지원하지/);
 advanceToBattle(b);const spec=A.prepareBattle(),before=S.export(),g=G.startStory();assert(g);assert.equal(g.id,spec.id);assert.equal(g.mode,'story');assert.equal(g.storyBattle,'approach');assert.equal(g.duration,45);assert.equal(g.mare,null);assert.equal(g.practice,false);assert.equal(S.export(),before);
 for(const status of ['playing','paused','cards','camp']){g.status=status;assert.equal(G.startStory(),false);assert.equal(G.g,g);}
});

test('the first and companion encounters finish upon reaching their objectives, with no manager spawn or legacy clear',()=>{
 const b=atBattle(),{G,S}=b;let g=G.g;const before=legacy(S);
 G.stageClear();assert.equal(g.status,'playing');assert.equal(g.clearedStages,0);
 let goal=G.objective();assert.equal(goal.kind,'mission');assert.match(goal.title,/안내 회선/);assert.doesNotMatch(goal.title,/관리자/);assert.equal(goal.remaining,45);assert.equal(goal.bossIn,0);assert.equal(goal.target,1);
 finishBattle(b);assert(g.time<45);assert.equal(g.bossSpawned,false);assert(!g.enemies.some(e=>e.type==='boss'));assert.equal(g.storySaved,true);assert.equal(g.reason,'objective');assert.equal(g.practice,false);assert.equal(g.reward,0);assert.equal(G.objective().kind,'ended');assert.equal(legacy(S),before);assert.equal(b.A.state().node,'meeting');
 assert.equal(advanceToBattle(b),'escort');G.g=null;g=G.startStory();quiet(g);assert(g.mare);assert.equal(g.duration,75);goal=G.objective();assert.match(goal.title,/마레와 귀환/);finishBattle(b);assert(g.time<75);assert.equal(g.bossSpawned,false);assert.equal(g.storySaved,true);assert.equal(b.A.state().node,'debrief');assert.equal(legacy(S),before);
});

test('Mare absorbs exactly one eligible hit, keeps existing shields and does not heal or hurt enemies',()=>{
 const {G}=atBattle('escort'),g=G.g,m=g.mare;g.p.hp=70;g.p.shield=1;const enemy=G.enemy('ghost',150,0),hp=enemy.hp;
 assert(G.damage(40));assert.equal(g.p.hp,70);assert.equal(g.p.shield,1);assert.equal(m.protected,1);assert.equal(m.cooldown,12);assert.equal(m.pulse,.7);assert.equal(enemy.hp,hp);assert.match(g.toast.text,/마레의 보호/);assert(g.rings.length>=2);
 assert.equal(G.damage(40),false);assert.equal(m.protected,1);g.time+=.8;assert(G.damage(40));assert.equal(g.p.shield,0);assert.equal(g.p.hp,70);g.time+=.8;assert(G.damage(10));assert.equal(g.p.hp,60);assert.equal(m.protected,1);
});

test('dash and hit immunity do not consume ready support, and dead/invalid damage cannot trigger it',()=>{
 const {G}=atBattle('escort'),g=G.g,m=g.mare;
 G.dash();assert.equal(G.damage(10),false);assert.equal(m.cooldown,0);assert.equal(m.protected,0);g.dash.invulnerable=false;g.lastHit=g.time;assert.equal(G.damage(10),false);assert.equal(m.protected,0);g.lastHit=-9;
 for(const amount of [0,-1,NaN,Infinity])assert.equal(G.damage(amount),false);assert.equal(m.protected,0);
 g.p.hp=0;assert.equal(G.damage(10),false);assert.equal(g.status,'ended');assert.equal(g.won,false);assert.equal(m.protected,0);assert.equal(m.cooldown,0);
});

test('Mare follows without player collision, contact damage or collecting drops for the party',()=>{
 const {G}=atBattle('escort'),g=G.g,m=g.mare,initialX=m.x;G.input.x=1;G.update(.04);assert.equal(g.p.x,9);assert(m.x>initialX);assert(m.x<g.p.x-45);assert.equal(m.moving,true);assert.equal(m.face,1);
 G.input.x=0;m.x=g.p.x;m.y=g.p.y;G.input.y=1;G.update(.04);assert.equal(g.p.y,9);assert(g.p.hp>0);
 G.input.y=0;G.enemy('ghost',m.x,m.y+80);g.drops.push({x:m.x-50,y:m.y+40,value:1});const xp=g.xp;G.update(.04);assert.equal(g.xp,xp);assert.equal(m.protected,0);
});

test('support cooldown and following freeze in pause/cards and recover only during active combat',()=>{
 const {G}=atBattle('escort'),g=G.g,m=g.mare;G.damage(10);G.input.x=1;G.update(.04);const state=JSON.stringify(m),time=g.time;
 G.pause();for(let i=0;i<20;i++)G.update(.04);assert.equal(JSON.stringify(m),state);assert.equal(g.time,time);G.resume();g.xp=g.xpNeed;assert(G.checkLevel());const cardsState=JSON.stringify(m);for(let i=0;i<20;i++)G.update(.04);assert.equal(JSON.stringify(m),cardsState);assert.equal(G.damage(10),false);
 assert(G.choose(g.offered[0],g.offerToken));for(let i=0;i<301;i++)G.update(.04);assert.equal(m.cooldown,0);assert.equal(m.pulse,0);assert(G.damage(10));assert.equal(m.protected,2);
});

test('Mare cannot leak into the legacy chapter or either practice mode',()=>{
 const b=atBattle('escort'),{G,S}=b;G.abandon();assert.equal(S.data.story.companions[0],'mare');
 for(const mode of ['chapter','quick','single']){G.g=null;const g=G.start(mode);assert.equal(g.mare,null);assert(G.damage(10));assert.equal(g.p.hp,90);G.finish(false,'retreat');}
});

test('story kills give experience drops but never permanent or exploration shards',()=>{
 const {G,S}=atBattle('escort'),g=G.g,before=legacy(S),e=G.enemy('ghost',g.p.x,g.p.y);G.hitEnemy(e,1000);
 assert.equal(g.kills,1);assert.equal(g.shards,0);assert.equal(g.drops.length,1);g.drops[0].x=g.p.x;g.drops[0].y=g.p.y;G.update(.04);assert(g.xp>0);assert.equal(legacy(S),before);G.abandon();assert.equal(g.reward,0);assert.equal(g.practice,false);assert.equal(legacy(S),before);
});

test('death on the completion frame wins over survival and preserves the retry boundary',()=>{
 const b=atBattle(),{G,A}=b,g=G.g,before=JSON.stringify(A.state());g.p.hp=1;g.time=g.duration-.01;g.hostile.push({x:0,y:0,vx:0,vy:0,r:5,life:1,damage:20});G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,false);assert.equal(g.reason,'death');assert.equal(g.storySaved,false);assert.equal(JSON.stringify(A.state()),before);assert.equal(G.saveStoryResult(),false);
 G.g=null;assert(G.startStory());assert.equal(G.g.time,0);assert.equal(G.g.p.hp,100);assert.equal(G.g.xp,0);
});

test('a failed success save stays on its boundary and can be saved once storage recovers',()=>{
 const b=atBattle(),{G,S,A,storage}=b,g=G.g,before=JSON.stringify(A.state()),old=legacy(S);storage.fail=true;g.storyGate.defeated=[...g.storyGate.guardIds];g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;for(let n=0;n<32;n++)G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,true);assert.equal(g.storySaved,false);assert.equal(S.status,'memory');assert.equal(JSON.stringify(A.state()),before);assert.equal(legacy(S),old);assert.equal(G.saveStoryResult(),false);storage.fail=false;
 assert(G.saveStoryResult());assert.equal(g.storySaved,true);assert.equal(A.state().node,'meeting');const after=S.export();assert(G.saveStoryResult());assert.equal(S.export(),after);assert.equal(G.finish(true,'again'),false);assert.equal(S.export(),after);
});

test('legacy checkpoint coexists through story victory, retreat, reload and an ended abandon click',()=>{
 let b=boot();const chapter=b.G.start();chapter.levels={blade:2};chapter.kills=17;chapter.shards=33;b.S.snapshot(chapter);const old=legacy(b.S),cp=JSON.stringify(b.S.data.checkpoint);b.G.g=null;
 atBattle('escort',b);assert.equal(legacy(b.S),old);assert.equal(JSON.stringify(b.S.data.checkpoint),cp);b.G.abandon();assert.equal(b.G.g.reason,'retreat');assert.equal(b.G.abandon(),false);assert.equal(legacy(b.S),old);
 b=boot(Object.fromEntries(b.values));assert.equal(JSON.stringify(b.S.data.checkpoint),cp);const spec=b.A.prepareBattle();assert.equal(spec.battleId,'escort');assert(spec.companions.includes('mare'));const g=b.G.startStory();assert(g.mare);assert.equal(g.mare.cooldown,0);assert.equal(g.time,0);assert.equal(legacy(b.S),old);
});

test('a paused or card-choice story cannot resume against a newer tab snapshot',()=>{
 const b=atBattle('escort'),g=b.G.g;b.G.pause();
 const other=boot({},b.values);other.S.data.wallet=30;other.S.save();b.G.resume();assert.equal(g.status,'paused');assert.equal(b.S.status,'conflict');g.status='playing';g.xp=g.xpNeed;b.G.checkLevel();const levels=JSON.stringify(g.levels);assert.equal(b.G.choose(g.offered[0],g.offerToken),false);assert.equal(JSON.stringify(g.levels),levels);
});

test('story survival retains the fixed wave warning and cancels it only near its own finish',()=>{
 const {G}=atBattle(),g=G.g;g.nextWave=25;g.time=24.99;G.update(.04);assert(g.wave);assert.equal(g.wave.points.length,6);assert.match(g.wave.hint,/틈/);assert.equal(g.enemies.length,0);g.time=26.99;g.wave.remaining=.02;G.update(.04);assert.equal(g.wave,null);assert.equal(g.enemies.length,6);assert.equal(g.bossSpawned,false);
 g.time=40;g.wave={points:[],remaining:2};G.update(.04);assert.equal(g.wave,null);assert.equal(g.status,'playing');
});
