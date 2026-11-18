'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),plain=x=>JSON.parse(JSON.stringify(x)),KEY='terminusSaveV1';
function boot(existing){
 const values=existing||new Map(),storage={fail:false,getItem:k=>values.get(k)||null,setItem(k,v){if(this.fail)throw Error('quota');values.set(k,String(v));}};
 const c={console,Date,Math,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage,addEventListener(){}};
 c.window=c;c.TG={};vm.createContext(c);
 for(const name of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',name+'.js'),'utf8'),c,{filename:name+'.js'});
 return {TG:c.TG,A:c.TG.story,S:c.TG.store,G:c.TG.engine,storage,values};
}
function dialog(A){const id=A.state().node;let count=0;while(A.state().node===id){const s=A.state();assert(++count<20);assert.equal(A.advance(s.node,s.line),true);}}
function success(spec,extra={}){return{id:spec.id,mode:'story',storyBattle:spec.battleId,won:true,p:{hp:75},levels:{blade:1},level:2,xp:0,kills:4,totalTime:120,relics:[],...extra};}
function firstRest(b){
 const {A}=b;assert(A.begin());dialog(A);dialog(A);
 let spec=A.prepareBattle();assert.equal(spec.battleId,'approach');assert(A.completeBattle(success(spec)));
 dialog(A);spec=A.prepareBattle();assert.equal(spec.battleId,'escort');assert(A.completeBattle(success(spec)));dialog(A);
 assert.equal(A.state().node,'rest');return b;
}
function archiveBoundary(b){
 firstRest(b);assert(b.A.beginR3());dialog(b.A);dialog(b.A);
 assert.equal(b.A.state().node,'archive');return b.A.prepareBattle();
}
test('v3 R3 chain starts after R1 rest and preserves companion selection and voiced reaction',()=>{
 const b=firstRest(boot());assert(b.A.setParty(['mare','aster','vela']));
 const legacy=plain(b.S.data);delete legacy.story;
 assert(b.A.beginR3());assert.equal(b.A.state().node,'briefing');assert.equal(b.A.state().completed,false);
 assert.deepEqual(plain(b.A.state().missionParty),['mare','aster','vela']);
 assert.equal(b.A.beginR3(),false);
 assert(b.A.advance('briefing',0));assert(b.A.advance('briefing',1));
 assert.equal(b.A.currentLine().speaker,'아스터');
 dialog(b.A);dialog(b.A);assert.equal(b.A.state().node,'archive');assert.equal(b.A.prepareBattle().commandDeck.length,10);
 assert.deepEqual((()=>{const v=plain(b.S.data);delete v.story;return v;})(),legacy);
});
test('archive objective requires in-world 1.25s retrieval and does not reward idle survival',()=>{
 const b=boot(),spec=archiveBoundary(b),initial=b.S.export(),g=b.G.startStory();
 assert(g.recordTarget);assert.equal(g.recordTarget.needed,1.25);assert.equal(g.duration,95);
 assert.match(b.G.objective().title,/회수/);
 const checkpoint=plain(g.recordTarget);
 g.spawn=-1000;g.nextWave=Infinity;g.hazardClock=-1000;g.lastFire=-1000;
 g.time=g.duration-.01;b.G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,false);assert.equal(g.reason,'record');
 assert.equal(b.A.state().node,'archive');assert.equal(b.A.state().recordRecovered,false);assert.equal(b.S.export(),initial);
 b.G.g=null;const retry=b.G.startStory();
 assert.equal(retry.id,spec.id);assert.deepEqual(plain(retry.recordTarget),checkpoint);
 retry.spawn=-1000;retry.nextWave=Infinity;retry.hazardClock=-1000;retry.lastFire=-1000;
 retry.p.x=retry.recordTarget.x;retry.p.y=retry.recordTarget.y;
 for(let n=0;n<32;n++)b.G.update(.04);
 assert.equal(retry.recordTarget.recovered,true);
 assert.equal(b.G.objective().cleared,1);
 retry.time=retry.duration-.01;b.G.update(.04);
 assert.equal(retry.status,'ended');assert.equal(retry.won,true);assert.equal(retry.storySaved,true);
 assert.equal(b.A.state().node,'evidence');assert.equal(b.A.state().recordRecovered,true);
 assert.equal(b.S.data.stats.runs,0);assert.equal(b.S.data.wallet,0);
});
test('R3 has two exclusive persisted outcomes, different erosion and bond consequences',()=>{
 for(const decision of ['rescue','contain']){
  const b=boot(),spec=archiveBoundary(b);
  assert.equal(b.A.completeBattle(success(spec)),false);
  assert.equal(b.A.state().node,'archive');
  assert(b.A.completeBattle(success(spec,{recordTarget:{recovered:true}})));
  dialog(b.A);assert.equal(b.A.state().node,'decision');
  const before=b.S.export();assert.equal(b.A.advance('decision',0),false);
  b.storage.fail=true;assert.equal(b.A.choose(decision),false);assert.equal(b.S.export(),before);
  b.storage.fail=false;assert(b.A.choose(decision));
  assert.equal(b.A.state().erosion,decision==='rescue'?18:5);
  assert.equal(b.A.state().decision,decision);
  assert.equal(b.A.state().node,decision==='rescue'?'release':'contain');
  assert.equal(b.A.choose(decision==='rescue'?'contain':'rescue'),false);
  dialog(b.A);
  assert.equal(b.A.state().node,'rest2');assert.equal(b.A.state().completed,true);
  assert.match(b.A.currentLine().text,decision==='rescue'?/신호는 열렸어/:/봉인을 지켰어/);
  const again=boot(b.values);assert.equal(again.S.status,'ready');
  assert.equal(again.A.state().node,'rest2');assert.equal(again.A.state().decision,decision);
  assert.equal(again.A.state().erosion,decision==='rescue'?18:5);
  assert.equal(again.A.beginR3(),false);
 }
});
test('chosen party earns relationship response and story snapshots migrate safely',()=>{
 const b=firstRest(boot());assert(b.A.setParty(['mare','aster','vela']));assert(b.A.beginR3());dialog(b.A);dialog(b.A);
 const spec=b.A.prepareBattle();assert(b.A.completeBattle(success(spec,{recordTarget:{recovered:true}})));
 dialog(b.A);assert(b.A.choose('rescue'));assert.equal(b.A.state().bonds.mare,1);assert.equal(b.A.state().bonds.vela,1);
 assert.equal(b.A.state().bonds.aster,0);
 const saved=b.S.export(),loaded=boot(b.values);
 assert.equal(loaded.S.export(),saved);
 assert.deepEqual(plain(loaded.A.state().missionParty),['mare','aster','vela']);
 assert.equal(loaded.A.state().bonds.vela,1);
 const old=b.S.fresh();old.story.version=2;old.story.node='rest';old.story.started=true;old.story.completed=true;old.story.companions=['mare'];
 const upgraded=b.S.normal(old).story;assert.equal(upgraded.version,4);assert.equal(upgraded.node,'rest');assert.equal(upgraded.erosion,0);
 assert.deepEqual(plain(upgraded.bonds),{mare:0,aster:0,noa:0,vela:0,iris:0,crow:0});
 old.story.version=5;assert.throws(()=>b.S.normal(old),/이야기/);
});

test('R3 works for a three-person party without Mare and recovers health at train',()=>{
 const b=firstRest(boot());
 b.S.data.story.loadout.hp=12;assert(b.S.save());
 assert(b.A.setParty(['aster','noa','vela']));
 assert.equal(b.A.beginR3(),true);
 assert.deepEqual(plain(b.A.state().missionParty),['aster','noa','vela']);
 assert.equal(b.A.state().loadout.hp,75);
 dialog(b.A);const state=b.A.state();assert.equal(state.node,'trace');
 assert.equal(b.A.currentLine({...state,node:'trace',line:1}).speaker,'노아');
 dialog(b.A);const spec=b.A.prepareBattle();
 assert.deepEqual(plain(spec.companions),['aster','noa','vela']);assert.equal(spec.commandDeck.length,10);
});
