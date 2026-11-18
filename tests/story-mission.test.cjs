'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
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
function escort(b){approach(b);const g=b.G.g;quiet(g);for(const id of [...g.storyGate.guardIds])b.G.hitEnemy(g.enemies.find(e=>e.id===id),10000);g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;for(let n=0;n<35&&g.status==='playing';n++)b.G.update(.04);assert.equal(g.won,true);
 advance(b.A);assert.equal(b.A.state().node,'escort');b.G.g=null;return b.G.startStory();}
function archive(b){approach(b);assert(b.A.completeBattle(fakeBattle(b.A)));advance(b.A);assert.equal(b.A.state().node,'escort');assert(b.A.completeBattle(fakeBattle(b.A)));advance(b.A);
 assert.equal(b.A.state().node,'rest');assert(b.A.beginR3());advance(b.A);advance(b.A);assert.equal(b.A.state().node,'archive');return b.G.startStory();}
function forSnow(b,route){
 const s=b.S.data.story;Object.assign(s,{started:true,node:'snowMission',line:0,encounterId:'story-snow-mission-test',decision:route,recordRecovered:true,
 recruited:['aster','noa'],companions:['mare','aster','noa'],snowParty:['mare','aster','noa'],commandDeck:b.TG.commandDeck.preset('protect',['mare','aster','noa'])});
 assert(b.S.save());return b.G.startStory();
}
test('stationary solo battle cannot win, even when all guardians were eliminated',()=>{
 const b=boot(),g=approach(b);quiet(g);const gate=g.storyGate;
 assert.equal(b.G.objective().kind,'mission');assert.equal(gate.guardIds.length,1);
 assert(Math.hypot(gate.x-g.p.x,gate.y-g.p.y)>gate.r);
 for(const id of [...gate.guardIds]){const e=g.enemies.find(e=>e.id===id);assert(e);b.G.hitEnemy(e,99999);}
 assert.equal(gate.defeated.length,1);g.enemies=[];
 for(let i=0;i<100;i++)b.G.update(.04);
 assert.equal(g.status,'playing');assert.equal(gate.charge,0);
 assert.equal(b.G.objective().cleared,0);
 assert.equal(b.G.finish(true,'story'),true);assert.equal(g.won,false);
 assert.equal(g.reason,'mission');assert.equal(b.A.state().node,'approach');
});
test('approach requires guardian elimination before physically activating switch and saves early victory',()=>{
 const b=boot(),g=approach(b);quiet(g);const gate=g.storyGate;
 g.spawn=-1000;g.p.x=gate.x;g.p.y=gate.y;
 for(let i=0;i<30;i++)b.G.update(.04);
 assert.equal(gate.charge,0);assert.equal(g.status,'playing');
 for(const id of [...gate.guardIds])b.G.hitEnemy(g.enemies.find(e=>e.id===id),99999);
 g.enemies=[];
 for(let i=0;i<31&&g.status==='playing';i++)b.G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,true);assert.equal(g.reason,'objective');
 assert(g.time<g.duration);assert.equal(g.storySaved,true);assert.equal(b.A.state().node,'meeting');
 assert.equal(b.S.data.wallet,0);assert.equal(b.S.data.stats.runs,0);
});
test('Mare return corridor requires two fallen guardians and physically reaching carriage',()=>{
 const b=boot(),g=escort(b);quiet(g);
 assert.equal(g.storyGate.guardIds.length,2);assert.equal(g.storyGate.kind,'escort');
 g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;
 for(let i=0;i<23;i++)b.G.update(.04);
 assert.equal(g.storyGate.charge,0);
 for(const id of [...g.storyGate.guardIds])b.G.hitEnemy(g.enemies.find(e=>e.id===id),99999);
 g.enemies=[];
 for(let i=0;i<24&&g.status==='playing';i++)b.G.update(.04);
 assert.equal(g.won,true);assert.equal(g.storySaved,true);assert.equal(b.A.state().node,'debrief');
 assert(g.time<g.duration);
});
test('archive requires obtaining record THEN returning to the train; timer cannot clear it',()=>{
 const b=boot(),g=archive(b);quiet(g);
 assert(g.recordTarget);assert(g.storyGate);assert.equal(g.storyGate.kind,'archive');
 g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;g.enemies=[];
 for(let i=0;i<25;i++)b.G.update(.04);
 assert.equal(g.storyGate.charge,0);
 g.p.x=g.recordTarget.x;g.p.y=g.recordTarget.y;
 for(let i=0;i<34;i++)b.G.update(.04);
 assert.equal(g.recordTarget.recovered,true);assert.equal(g.status,'playing');
 assert.equal(b.G.objective().kind,'mission');
 g.p.x=g.storyGate.x;g.p.y=g.storyGate.y;
 for(let i=0;i<23&&g.status==='playing';i++)b.G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,true);assert(g.time<g.duration);
 assert.equal(b.A.state().node,'evidence');assert.equal(b.A.state().recordRecovered,true);
});
test('snow rescue requires both relays, then ends immediately instead of waiting 105 seconds',()=>{
 const b=boot(),g=forSnow(b,'rescue');quiet(g);g.enemies=[];
 assert.equal(g.signalTargets.length,2);assert.equal(g.duration,105);
 assert.equal(b.G.objective().target,2);assert.equal(g.status,'playing');
 g.p.x=g.signalTargets[0].x;g.p.y=g.signalTargets[0].y;
 for(let i=0;i<30;i++)b.G.update(.04);
 assert.equal(g.signalTargets[0].recovered,true);assert.equal(g.signalTargets[1].recovered,false);assert.equal(g.status,'playing');
 g.p.x=g.signalTargets[1].x;g.p.y=g.signalTargets[1].y;
 for(let i=0;i<30&&g.status==='playing';i++)b.G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,true);assert(g.time<g.duration);
 assert.equal(g.storySaved,true);assert.equal(b.A.state().node,'snowDebrief');
 assert.equal(b.S.data.stats.runs,0);
});
test('snow containment requires one registry relay, with no time wait',()=>{
 const b=boot(),g=forSnow(b,'contain');quiet(g);g.enemies=[];
 assert.equal(g.signalTargets.length,1);assert.equal(g.duration,95);
 g.p.x=g.signalTargets[0].x;g.p.y=g.signalTargets[0].y;
 for(let i=0;i<55&&g.status==='playing';i++)b.G.update(.04);
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
