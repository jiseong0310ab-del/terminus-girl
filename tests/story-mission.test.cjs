'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {openObjective,dormantBell}=require('./helpers.cjs');
const ROOT=path.resolve(__dirname,'..'),clone=x=>JSON.parse(JSON.stringify(x));
function boot(){
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem(k,v){values.set(k,String(v))}};
 const c={console,Math,Date,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage,addEventListener(){}};
 c.window=c;c.TG={};vm.createContext(c);
 for(const file of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),c,{filename:file+'.js'});
 return {G:c.TG.engine,A:c.TG.story,S:c.TG.store,TG:c.TG,values};
}
function quiet(g){g.spawn=-10000;g.nextWave=Infinity;g.hazards=[];g.hostile=[];g.wave=null;g.waveRestUntil=Infinity;}
function advance(A){const node=A.state().node;let count=0;while(A.state().node===node){const s=A.state();assert(++count<15);assert.equal(A.advance(s.node,s.line),true);}}
function fakeBattle(A){const spec=A.prepareBattle();assert(spec);return{id:spec.id,mode:'story',storyBattle:spec.battleId,won:true,p:{hp:95},levels:{},level:1,xp:0,kills:0,totalTime:0,relics:[]};}
function approach(b){assert(b.A.begin());advance(b.A);advance(b.A);assert.equal(b.A.state().node,'approach');return b.G.startStory();}
// One engine step that also resolves level-up card offers (first offered card).
function tick(b){const g=b.G.g;if(g.status==='cards'){assert(b.G.choose(g.offered[0],g.offerToken));return;}b.G.update(.04);}
// Play the scripted opening honestly: defeat packs, then the guardian, then hold the switch.
function toPhase(b,phase){const g=b.G.g;let n=0;while(g.script.phase!==phase&&g.status!=='ended'){for(const e of g.enemies.filter(e=>e.script))b.G.hitEnemy(e,9999);g.p.hp=g.p.maxHp;tick(b);assert(++n<3000,'stuck before '+phase);}}
function holdSwitch(b){const g=b.G.g;let n=0;while(g.status!=='ended'){g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;g.p.hp=g.p.maxHp;tick(b);assert(++n<400,'switch hold did not finish');}}
function escort(b){approach(b);const g=b.G.g;quiet(g);toPhase(b,'switch');holdSwitch(b);assert.equal(g.won,true);
 advance(b.A);assert.equal(b.A.state().node,'escort');b.G.g=null;return b.G.startStory();}
function archive(b){assert(b.A.begin());advance(b.A);advance(b.A);assert.equal(b.A.state().node,'approach');assert(b.A.completeBattle(fakeBattle(b.A)));advance(b.A);assert.equal(b.A.state().node,'escort');assert(b.A.completeBattle(fakeBattle(b.A)));advance(b.A);
 assert.equal(b.A.state().node,'rest');assert(b.A.beginR3());advance(b.A);advance(b.A);assert.equal(b.A.state().node,'archive');return openObjective(b.G.startStory());}
function forSnow(b,route){
 const s=b.S.data.story;Object.assign(s,{started:true,node:'snowMission',line:0,encounterId:'story-snow-mission-test',decision:route,recordRecovered:true,
 recruited:['aster','noa'],companions:['mare','aster','noa'],snowParty:['mare','aster','noa'],commandDeck:b.TG.commandDeck.preset('protect',['mare','aster','noa'])});
 assert(b.S.save());return openObjective(b.G.startStory());
}
test('stationary solo battle cannot win, even when the guardian was eliminated',()=>{
 const b=boot(),g=approach(b);quiet(g);const gate=g.storyGate,x=g.p.x,y=g.p.y;
 assert.equal(b.G.objective().kind,'mission');assert.equal(gate.guardIds.length,0);
 assert(Math.hypot(gate.x-g.p.x,gate.y-g.p.y)>gate.r);
 toPhase(b,'switch');g.p.x=x;g.p.y=y;
 assert.equal(gate.guardIds.length,1);assert.equal(gate.defeated.length,1);g.enemies=[];
 for(let i=0;i<100;i++){g.p.hp=g.p.maxHp;tick(b);}
 assert.equal(g.status,'playing');assert.equal(gate.charge,0);
 assert.equal(b.G.objective().cleared,0);
 assert.equal(b.G.finish(true,'story'),true);assert.equal(g.won,false);
 assert.equal(g.reason,'mission');assert.equal(b.A.state().node,'approach');
});
test('approach requires guardian elimination before physically activating switch and saves early victory',()=>{
 const b=boot(),g=approach(b);quiet(g);const gate=g.storyGate;
 g.p.x=gate.x;g.p.y=gate.y;
 for(let i=0;i<30;i++){g.p.hp=g.p.maxHp;tick(b);}
 assert.equal(gate.charge,0);assert.equal(g.status,'playing');assert.equal(g.script.phase,'swarm');
 toPhase(b,'switch');assert.equal(g.status,'playing');assert(gate.charge<gate.needed);
 holdSwitch(b);
 assert.equal(g.status,'ended');assert.equal(g.won,true);assert.equal(g.reason,'objective');
 assert(g.time<g.duration);assert.equal(g.storySaved,true);assert.equal(b.A.state().node,'meeting');
 assert.equal(b.S.data.wallet,0);assert.equal(b.S.data.stats.runs,0);
});
test('opening arc: telegraphed packs in view, a first card, a telegraphed guardian at the switch and a siege on stepping in',()=>{
 const b=boot(),g=approach(b),s=g.script,{G}=b;
 assert.equal(g.duration,60);assert.equal(g.enemies.length,0);assert.equal(s.phase,'swarm');
 // Packs are announced by a visible marker before anything appears, inside the play area.
 for(let i=0;i<10;i++)tick(b);
 assert(s.pending.length>=3);for(const p of s.pending){assert(p.t>0);assert(Math.abs(p.x-g.p.x)<=220&&Math.abs(p.y-g.p.y)<=240);}
 for(let i=0;i<25;i++)tick(b);
 assert(g.enemies.length>=3);assert(g.enemies.every(e=>e.script==='swarm'));
 // A first level-up arrives during the swarm, well before the guardian.
 let offered=false,n=0;
 while(s.phase==='swarm'){if(g.status==='cards')offered=true;for(const e of g.enemies.filter(e=>e.script))G.hitEnemy(e,9999);
  for(const d of g.drops){d.x=g.p.x;d.y=g.p.y;}g.p.hp=g.p.maxHp;tick(b);assert(++n<2000);}
 assert(offered,'first card choice during the swarm');assert(g.level>=2);
 // The guardian is telegraphed on the switch, then joins the gate prerequisite.
 const marker=s.pending.find(p=>p.role==='guardian');assert(marker);assert.equal(marker.x,g.storyGate.x);assert(marker.t>=1);
 assert.match(G.objective().title,/회선 수호자/);
 n=0;while(!s.guardianId){g.p.hp=g.p.maxHp;tick(b);assert(++n<200);}
 const guardian=g.enemies.find(e=>e.id===s.guardianId);assert.equal(guardian.hp,210);assert.equal(guardian.windupTime,1);
 assert.deepEqual([...g.storyGate.guardIds],[guardian.id]);
 G.hitEnemy(guardian,9999);assert.equal(s.phase,'switch');assert.equal(g.storyGate.defeated.length,1);
 assert.equal(g.status==='cards'||g.status==='playing',true);
 // Stepping onto the switch begins a 3 second hold under an encirclement with one gap.
 g.status='playing';g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;tick(b);
 assert.equal(s.siege,true);assert.equal(s.pending.filter(p=>p.role==='siege').length,7);
 assert.match(G.objective().title,/스위치 작동/);
 holdSwitch(b);assert.equal(g.won,true);assert.equal(g.reason,'objective');assert(g.time<g.duration);
});
test('holding the opening switch does not trigger the stationary erosion pulse',()=>{
 const b=boot(),g=approach(b);quiet(g);toPhase(b,'switch');
 const q=g.storyPressure;q.idle=0;q.warning=0;q.pulses=0;q.cooldown=0;
 g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;g.storyGate.needed=99;
 for(let i=0;i<150;i++){g.p.hp=g.p.maxHp;g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;tick(b);}
 assert.equal(g.storyPressure.warning,0);assert.equal(g.storyPressure.pulses,0);
});
test('Mare return corridor requires both volley guardians and physically reaching carriage',()=>{
 const b=boot(),g=escort(b);quiet(g);const s=g.script;
 assert.equal(s.mission,'escort');assert.equal(g.storyGate.kind,'escort');assert.equal(g.storyGate.guardIds.length,0);
 g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;
 for(let i=0;i<23;i++){g.p.hp=g.p.maxHp;tick(b);}
 assert.equal(g.storyGate.charge,0);
 toPhase(b,'guardian');let n=0;
 while(s.guardians.length<2){g.p.hp=g.p.maxHp;tick(b);assert(++n<200);}
 assert.equal(g.storyGate.guardIds.length,2);
 const [a,c]=s.guardians.map(id=>g.enemies.find(e=>e.id===id));
 assert.equal(a.volley,7);assert.equal(a.hp,160);assert.equal(a.label,'사격 잔향');
 b.G.hitEnemy(a,9999);assert.equal(s.phase,'guardian');
 b.G.hitEnemy(c,9999);assert.equal(s.phase,'switch');
 holdSwitch(b);
 assert.equal(g.won,true);assert.equal(g.storySaved,true);assert.equal(b.A.state().node,'debrief');
 assert(g.time<g.duration);
});
test('escort volley fires a seven-shot fan and Mare blocks one hit, opening the counter window',()=>{
 const b=boot(),g=escort(b);quiet(g);const s=g.script;
 toPhase(b,'guardian');let n=0;
 while(s.guardians.length<2){g.p.hp=g.p.maxHp;tick(b);assert(++n<200);}
 const w=g.enemies.find(e=>e.id===s.guardians[0]);
 for(const e of [...g.enemies])if(e!==w)g.enemies.splice(g.enemies.indexOf(e),1);
 g.hostile=[];g.script.pending=[];w.x=g.p.x+200;w.y=g.p.y;w.action='windup';w.clock=.01;w.aimX=-1;w.aimY=0;w.speed=0;
 b.G.update(.04);assert.equal(g.hostile.length,7);
 assert.equal(g.mare.cooldown,0);const hp=g.p.hp;
 for(let i=0;i<60&&g.mare.protected===0;i++)b.G.update(.04);
 assert.equal(g.mare.protected,1);assert.equal(g.p.hp,hp);assert(g.commandEffects.guardWindow>0);
});
test('archive requires obtaining record THEN returning to the train; timer cannot clear it',()=>{
 const b=boot(),g=archive(b);quiet(g);
 assert(g.recordTarget);assert(g.storyGate);assert.equal(g.storyGate.kind,'archive');
 g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;g.enemies=[];
 for(let i=0;i<25;i++)b.G.update(.04);
 assert.equal(g.storyGate.charge,0);
 g.p.x=g.recordTarget.x;g.p.y=g.recordTarget.y;g.sweep={angle:0,reach:0,warmup:Infinity,hits:0};
 for(let i=0;i<80;i++)b.G.update(.04);
 assert.equal(g.recordTarget.recovered,true);assert.equal(g.status,'playing');
 assert.equal(b.G.objective().kind,'mission');
 g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;
 for(let i=0;i<70&&g.status==='playing';i++){g.p.hp=g.p.maxHp;b.G.update(.04);}
 assert.equal(g.status,'ended');assert.equal(g.won,true);assert(g.time<g.duration);
 assert.equal(b.A.state().node,'evidence');assert.equal(b.A.state().recordRecovered,true);
});
test('snow rescue requires both relays, then ends immediately instead of waiting 105 seconds',()=>{
 const b=boot(),g=forSnow(b,'rescue');quiet(g);g.enemies=[];
 assert.equal(g.signalTargets.length,2);assert.equal(g.duration,105);
 assert.equal(b.G.objective().target,2);assert.equal(g.status,'playing');
 g.bell=dormantBell();g.p.x=g.signalTargets[0].x;g.p.y=g.signalTargets[0].y;
 for(let i=0;i<60;i++)b.G.update(.04);
 assert.equal(g.signalTargets[0].recovered,true);assert.equal(g.signalTargets[1].recovered,false);assert.equal(g.status,'playing');
 g.p.x=g.signalTargets[1].x;g.p.y=g.signalTargets[1].y;
 for(let i=0;i<60&&g.status==='playing';i++)b.G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,true);assert(g.time<g.duration);
 assert.equal(g.storySaved,true);assert.equal(b.A.state().node,'snowDebrief');
 assert.equal(b.S.data.stats.runs,0);
});
test('snow containment requires one registry relay, with no time wait',()=>{
 const b=boot(),g=forSnow(b,'contain');quiet(g);g.enemies=[];
 assert.equal(g.signalTargets.length,1);assert.equal(g.duration,95);
 g.bell=dormantBell();g.p.x=g.signalTargets[0].x;g.p.y=g.signalTargets[0].y;
 for(let i=0;i<100&&g.status==='playing';i++)b.G.update(.04);
 assert.equal(g.won,true);assert(g.time<g.duration);assert.equal(b.A.state().node,'snowDebrief');
});
test('story timeout is failure without mission completion; legacy quick and command training stay independent',()=>{
 const b=boot(),g=approach(b);quiet(g);const before=b.S.export();
 g.time=g.duration-.01;b.G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,false);assert.equal(g.reason,'timeout');
 assert.equal(b.S.export(),before);assert.equal(b.A.state().node,'approach');
 b.G.g=null;const training={...b.A.state()}; // Entry still available through its own training boundary.
 b.S.data.story.node='rest';b.S.data.story.completed=true;b.S.data.story.companions=['mare'];b.S.data.story.commandDeck=b.TG.commandDeck.preset('protect',['mare']);assert(b.S.save());
 const drill=b.G.startCommandTraining();assert(drill);assert.equal(drill.storyTraining,true);
 drill.enemies=[];drill.hostile=[];drill.hazards=[];drill.spawn=-1000;drill.nextWave=Infinity;drill.time=drill.duration-.01;b.G.update(.04);
 assert.equal(drill.status,'ended');assert.equal(drill.won,true);
 b.G.g=null;const quick=b.G.start('quick');quick.enemies=[];quick.hostile=[];quick.hazards=[];quick.spawn=-1000;quick.nextWave=Infinity;quick.time=quick.duration-.01;b.G.update(.04);
 assert.equal(quick.status,'ended');assert.equal(quick.won,false);
});

test('archive beams punish standing on the terminal but can be outrun by circling inside the ring',()=>{
 const b=boot(),g=archive(b);quiet(g);g.enemies=[];g.storyPressure=null;const r=g.recordTarget;
 // Standing still on the ring: the beams sweep over you, hurt and drain progress.
 g.p.x=r.x+30;g.p.y=r.y;let hits=0;
 for(let i=0;i<120;i++){g.p.hp=g.p.maxHp;r.charge=0;b.G.update(.04);hits=Math.max(hits,g.sweep?.hits||0);}
 assert(hits>=1,'a stationary player is struck by a sweeping beam');
 // Circling a quarter turn ahead of the beam never touches it and completes the recovery.
 r.charge=0;g.sweep.hits=0;
 for(let i=0;i<120&&!r.recovered;i++){const a=g.sweep.angle+Math.PI/2;g.p.x=r.x+Math.cos(a)*30;g.p.y=r.y+Math.sin(a)*30;g.p.hp=g.p.maxHp;b.G.update(.04);}
 assert.equal(r.recovered,true);assert.equal(g.sweep,null);
});
test('snow relay bell strikes the cross then the diagonal, so the safe spot keeps moving',()=>{
 const b=boot(),g=forSnow(b,'rescue');quiet(g);g.enemies=[];g.storyPressure=null;
 const r=g.signalTargets[0];g.p.x=r.x+30;g.p.y=r.y+30;b.G.update(.04);
 assert(g.bell);assert.equal(g.bell.diagonal,false);
 let n=0;while(g.bell.hits+g.bell.dodged<1){g.p.x=r.x+30;g.p.y=r.y+30;r.charge=0;g.p.hp=g.p.maxHp;b.G.update(.04);assert(++n<200);}
 assert.equal(g.bell.dodged,1,'a quadrant is safe from the cross');assert.equal(g.bell.diagonal,true);
 n=0;while(g.bell.hits+g.bell.dodged<2){g.p.x=r.x+30;g.p.y=r.y+30;r.charge=0;g.p.hp=g.p.maxHp;b.G.update(.04);assert(++n<200);}
 assert.equal(g.bell.hits,1,'the same spot is on the diagonal strike');
});
test('archive and snow objectives stay sealed until their swarm is cleared, then the hazard starts',()=>{
 for(const which of ['archive','snow']){
  const b=boot(),g=which==='archive'?archive(b):forSnow(b,'rescue');quiet(g);
  g.script.phase='swarm';g.script.escortClock=0;g.storyPressure=null;
  const target=which==='archive'?g.recordTarget:g.signalTargets[0];
  for(let i=0;i<60;i++){g.p.x=target.x;g.p.y=target.y;g.p.hp=g.p.maxHp;tick(b);}
  assert.equal(target.charge,0,which+' is sealed during the swarm');assert.equal(g.sweep??null,null);assert.equal(g.bell??null,null);
  toPhase(b,'objective');
  for(let i=0;i<10;i++){g.p.x=target.x+20;g.p.y=target.y+20;g.p.hp=g.p.maxHp;tick(b);}
  assert(target.charge>0||target.recovered,which+' charges once unlocked');
  assert(which==='archive'?g.sweep:g.bell,which+' hazard is active while working the objective');
 }
});
