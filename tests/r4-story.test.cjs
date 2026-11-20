'use strict';
const {openObjective,dormantBell}=require('./helpers.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),clone=x=>JSON.parse(JSON.stringify(x));
function boot(shared){
 const values=shared||new Map(),storage={fail:false,getItem:k=>values.get(k)||null,setItem(k,v){if(this.fail)throw Error('quota');values.set(k,String(v));}};
 const c={console,Date,Math,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage,addEventListener(){}};
 c.window=c;c.TG={};vm.createContext(c);
 for(const name of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',name+'.js'),'utf8'),c,{filename:name+'.js'});
 return {TG:c.TG,A:c.TG.story,S:c.TG.store,G:c.TG.engine,storage,values};
}
function r3Rest(b,route='rescue'){
 const state=b.S.data.story;Object.assign(state,{node:'rest2',started:true,completed:true,decision:route,recordRecovered:true,companions:['mare','aster','noa'],missionParty:['mare','aster','noa'],erosion:route==='rescue'?18:5});
 assert(b.S.save());return b;
}
function dialog(A){const id=A.state().node;let count=0;while(A.state().node===id){const s=A.state();assert(++count<=8);assert(A.advance(s.node,s.line));}}
function recruit(b,id){assert.equal(b.A.state().node,'recruitHub');assert(b.A.openRecruit(id));assert.match(b.A.state().node,/recruit/);dialog(b.A);assert.equal(b.A.state().node,'recruitHub');}
function prepare(b,route='rescue',members=['aster','noa']){
 r3Rest(b,route);assert(b.A.beginR4());dialog(b.A);
 for(const id of members)recruit(b,id);
 assert(b.A.departSnow());dialog(b.A);
 assert.equal(b.A.state().node,'snowMission');
 return b.A.prepareBattle();
}
function clearRun(b,g){
 openObjective(g);g.bell=dormantBell();g.spawn=-1000;g.nextWave=Infinity;g.hazards=[];g.hostile=[];g.enemies=[];
 for(const target of g.signalTargets){
  g.p.x=target.x;g.p.y=target.y;
  for(let n=0;n<Math.ceil(target.needed/.04)+2;n++)b.G.update(.04);
  assert.equal(target.recovered,true);
 }
 g.time=g.duration-.01;b.G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,true);assert.equal(g.storySaved,true);
}
test('R4 chapter starts only after R3 resolution; legacy records remain untouched',()=>{
 const b=boot(),original=clone(b.S.data);assert.equal(b.A.beginR4(),false);
 r3Rest(b,'rescue');const legacy=clone(b.S.data);delete legacy.story;
 assert(b.A.beginR4());assert.equal(b.A.state().node,'snowArrival');
 assert.deepEqual(clone(b.A.state().recruited),[]);
 assert.deepEqual(clone(b.A.state().companions),['mare']);
 assert.equal(b.A.state().decision,'rescue');assert.equal(b.A.beginR4(),false);
 const snapshot=clone(b.S.data);delete snapshot.story;assert.deepEqual(snapshot,legacy);
 assert.equal(b.A.currentLine().speaker,'리제');assert.match(b.A.currentLine().text,/종/);
 const loaded=boot(b.values);assert.equal(loaded.S.status,'ready');assert.equal(loaded.A.state().node,'snowArrival');
 assert.deepEqual(clone(loaded.A.state().recruited),[]);
});
test('each of three recruit stories is unique, one-time, rollback safe and gives a permanent recruit bond',()=>{
 const b=r3Rest(boot());assert(b.A.beginR4());dialog(b.A);
 assert.equal(b.A.state().node,'recruitHub');assert.equal(b.A.departSnow(),false);
 for(const id of ['aster','noa','vela']){
  assert(b.A.openRecruit(id));const active=b.A.state().node;const scene=b.TG.STORY.nodes[active];
  assert.equal(scene.lines.length,5);
  assert.match(scene.title,{aster:/아스터/,noa:/노아/,vela:/벨라/}[id]);
  assert.equal(b.A.currentLine().portrait,id);
  b.storage.fail=true;const state=clone(b.A.state());assert.equal(b.A.advance(active,0),false);
  assert.deepEqual(clone(b.A.state()),state);b.storage.fail=false;
  dialog(b.A);
  assert.equal(b.A.state().node,'recruitHub');assert(b.A.state().recruited.includes(id));
  assert.equal(b.A.state().bonds[id],1);
  assert.equal(b.A.openRecruit(id),false);
 }
 assert.deepEqual(clone(b.A.state().recruited),['aster','noa','vela']);
 assert.equal(b.A.state().companions.length,3);
 assert.equal(b.A.setParty(['aster','noa','vela']),true);
 assert.deepEqual(clone(b.A.state().companions),['aster','noa','vela']);
 const after=boot(b.values);assert.deepEqual(clone(after.A.state().recruited),['aster','noa','vela']);
 assert.deepEqual(clone(after.A.state().companions),['aster','noa','vela']);
 assert(after.A.state().seen.includes('recruitAster'));
 assert(after.A.state().seen.includes('recruitNoa'));
 assert(after.A.state().seen.includes('recruitVela'));
});
test('cannot deploy with only one recruit or inject unrecruited party member',()=>{
 const b=r3Rest(boot(),'contain');assert(b.A.beginR4());dialog(b.A);recruit(b,'aster');
 assert.equal(b.A.departSnow(),false);
 assert.equal(b.A.setParty(['mare','aster','noa']),false);
 assert.equal(b.A.setCommandDeck(['foreign']),false);
 recruit(b,'vela');assert.equal(b.A.state().companions.length,3);
 assert(b.A.departSnow());assert.equal(b.A.state().node,'snowDeparture');
 assert.equal(b.A.departSnow(),false);
 assert.deepEqual(clone(b.A.state().snowParty),['mare','aster','vela']);
});
test('R3 release forces TWO rescue relays, active squad gives record and signal buffs, losing preserves story',()=>{
 const b=boot(),spec=prepare(b,'rescue',['aster','noa']),before=b.S.export();
 assert.equal(spec.route,'rescue');assert.deepEqual(clone(spec.snowParty),['mare','aster','noa']);
 const g=b.G.startStory();assert.equal(g.stage,1);assert.equal(g.duration,105);assert.equal(g.signalTargets.length,2);
 assert.equal(g.signalTargets[0].needed,1.8);assert.equal(g.snowSignalHelp,true);
 assert.match(b.G.objective().title,/습격/);openObjective(g);
 assert.match(b.G.objective().title,/구조 신호/);assert.equal(b.G.objective().target,2);
 g.spawn=-1000;g.nextWave=Infinity;g.hazards=[];g.hostile=[];g.enemies=[];
 g.time=g.duration-.01;b.G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,false);assert.equal(g.reason,'timeout');
 assert.equal(b.A.state().node,'snowMission');assert.equal(b.S.export(),before);
 b.G.g=null;const retry=b.G.startStory();assert.equal(retry.id,spec.id);
 clearRun(b,retry);assert.equal(b.A.state().node,'snowDebrief');assert.equal(b.A.state().snowRecovered,true);
 assert.equal(b.S.data.wallet,0);assert.equal(b.S.data.stats.runs,0);
 dialog(b.A);assert.equal(b.A.state().node,'rest3');
 assert.match(b.A.currentLine().text,/신호는 살아/);
 const loaded=boot(b.values);assert.equal(loaded.A.state().node,'rest3');assert.equal(loaded.A.state().snowRecovered,true);
});
test('R3 containment leads to ONE long record objective and Vela heals active party',()=>{
 const b=boot();const spec=prepare(b,'contain',['noa','vela']);
 assert.equal(spec.route,'contain');assert.deepEqual(clone(spec.snowParty),['mare','noa','vela']);
 const g=b.G.startStory();assert.equal(g.signalTargets.length,1);
 assert.equal(g.signalTargets[0].needed,3.5);
 assert.equal(g.duration,95);assert.equal(g.snowSignalHelp,true);
 assert.equal(g.p.hp,g.p.maxHp);
 assert.match(b.G.objective().title,/습격/);openObjective(g);
 assert.match(b.G.objective().title,/격리 명부/);
 const invalid={id:spec.id,mode:'story',storyBattle:'snowMission',won:true,p:{hp:80},levels:{},level:2,xp:0,kills:0,totalTime:100,relics:[],signalTargets:[]};
 assert.equal(b.A.completeBattle(invalid),false);
 clearRun(b,g);dialog(b.A);assert.equal(b.A.state().node,'rest3');
 assert.match(b.A.currentLine().text,/명부/);
 assert.equal(b.A.beginR4(),false);
});
test('v3 R3 backup safely migrates to v4, future story v5 remains locked',()=>{
 const b=r3Rest(boot(),'contain'),data=clone(b.S.data);
 data.story.version=3;delete data.story.recruited;delete data.story.snowParty;delete data.story.snowRecovered;
 const encoded=b.S.encode(data),restored=boot(new Map([['terminusSaveV1',encoded]]));
 assert.equal(restored.S.status,'ready');
 assert.equal(restored.A.state().version,4);
 assert.equal(restored.A.state().decision,'contain');
 assert.deepEqual(clone(restored.A.state().recruited),[]);
 assert.equal(restored.A.beginR4(),true);
 assert.equal(restored.A.state().decision,'contain');
 const future=b.S.fresh();future.story.version=5;const file=b.S.encode(future);
 const blocked=boot(new Map([['terminusSaveV1',file]]));assert.equal(blocked.S.status,'corrupt');
 assert.equal(blocked.S.save(),false);
});
