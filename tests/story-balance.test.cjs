'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function boot(seed=17){
 let x=seed>>>0;const math=Object.create(Math);math.random=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem(k,v){values.set(k,String(v))}};
 const c={console,Math:math,Date,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage,addEventListener(){}};
 c.window=c;c.TG={};vm.createContext(c);
 for(const file of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),c,{filename:file+'.js'});
 return {G:c.TG.engine,A:c.TG.story,S:c.TG.store,TG:c.TG};
}
function first(b){assert(b.A.begin());let count=0;while(b.TG.STORY.nodes[b.A.state().node].kind==='dialogue'){const s=b.A.state();assert(b.A.advance(s.node,s.line));assert(++count<30);}assert.equal(b.A.state().node,'approach');return b.G.startStory();}
// Silence every arrival source, including the opening mission's scripted packs.
function empty(g){g.script=null;g.spawn=-1000;g.nextWave=Infinity;g.wave=null;g.waveRestUntil=Infinity;g.enemies=[];g.hostile=[];g.hazards=[];g.aftershocks=[];}
function step(G,n){for(let i=0;i<n;i++){if(G.g.status!=='playing')break;G.update(.04)}}
test('first battle shows its locked switch nearby and starts with a telegraphed swarm, not pre-placed guards',()=>{
 const b=boot(),g=first(b),gate=g.storyGate;
 assert.equal(gate.kind,'approach');assert.equal(gate.x-g.p.x,180);assert.equal(gate.y-g.p.y,-70);
 assert.equal(gate.r,70);assert.equal(gate.needed,3.5);
 assert.equal(gate.guardIds.length,0);assert(g.enemies.length>0&&g.enemies.every(e=>e.type==='mimic'&&e.dormant),'only disguised luggage at the start');
 assert.equal(g.script.phase,'swarm');assert.equal(g.xpNeed,6);
 assert.equal(b.G.objective().kind,'mission');
 assert.equal(g.storyPressure.warning,0);
});
test('stationary player sees a 1.4s warning, then suffers a dodgeable story-only hit',()=>{
 const b=boot(),g=first(b);empty(g);const save=b.S.export(),hp=g.p.hp;
 step(b.G,90);
 assert(g.storyPressure.warning>0);assert(g.storyPressure.warning<=1.4);
 assert.equal(g.storyPressure.hits,0);assert.equal(g.status,'playing');
 step(b.G,37);
 assert.equal(g.storyPressure.warning,0);assert.equal(g.storyPressure.pulses,1);
 assert.equal(g.storyPressure.hits,1);assert.equal(g.p.hp,hp-14);
 assert.equal(g.storyGate.done,false);assert.equal(b.A.state().node,'approach');assert.equal(b.S.export(),save);
});
test('walking out of the warned circle avoids damage, while pausing freezes its clock',()=>{
 const b=boot(27),g=first(b);empty(g);step(b.G,89);
 assert(g.storyPressure.warning>0);const hp=g.p.hp,remaining=g.storyPressure.warning;
 b.G.pause();step(b.G,20);assert.equal(g.storyPressure.warning,remaining);b.G.resume();
 b.G.input.x=1;step(b.G,10);b.G.input.x=0;step(b.G,29);
 assert.equal(g.storyPressure.pulses,1);assert.equal(g.storyPressure.hits,0);assert.equal(g.storyPressure.dodges,1);assert.equal(g.p.hp,hp);
});
test('story-only spawn radius is close enough to threaten before the final ten seconds and has a mobile enemy cap',()=>{
 // The opening mission is scripted; this checks ambient spawning used by later story missions.
 const b=boot(55),g=first(b);empty(g);g.script=null;g.time=8;g.spawn=200;g.waveRestUntil=0;const x=g.p.x,y=g.p.y;
 b.G.update(.04);
 assert(g.enemies.length>2);assert(g.enemies.length<=20);
 for(const e of g.enemies){
  const d=Math.hypot(e.x-x,e.y-y);
  assert(d>=238&&d<=320,'story foe radius '+d);
  assert(e.hp>0);
 }
 b.G.g=null;const quick=b.G.start('quick');empty(quick);quick.spawn=200;quick.waveRestUntil=0;
 b.G.update(.04);assert(quick.enemies.length>0);assert(quick.enemies.length<=65);
 assert(quick.enemies.some(e=>Math.hypot(e.x-quick.p.x,e.y-quick.p.y)>390));
 assert.equal(quick.storyPressure,undefined);
});
test('patient rescue and command training do not inherit the new stationary-pulse hazard',()=>{
 const b=boot();first(b);
 const s=b.S.data.story;Object.assign(s,{node:'recruitHub',started:true,completed:false,recruited:['vela','aster'],companions:['mare','vela','aster'],decision:'rescue',recordRecovered:true,
 commandDeck:b.TG.commandDeck.preset('protect',['mare','vela','aster'])});assert(b.S.save());
 b.G.g=null;assert(b.A.beginVelaPatient());
 for(let k=0;k<10&&b.TG.STORY.nodes[b.A.state().node].kind==='dialogue';k++){const st=b.A.state();assert(b.A.advance(st.node,st.line));}
 assert.equal(b.A.state().node,'velaEscort');
 const pt=b.G.startStory();assert(pt.patient);assert.equal(pt.storyPressure,null);
 const b2=boot(76),s2=b2.S.data.story;
 Object.assign(s2,{node:'rest',started:true,completed:true,companions:['mare'],commandDeck:b2.TG.commandDeck.preset('protect',['mare'])});assert(b2.S.save());
 const drill=b2.G.startCommandTraining();assert(drill.storyTraining);assert.equal(drill.storyPressure,null);
});
