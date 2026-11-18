'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),clone=x=>JSON.parse(JSON.stringify(x));
function boot(shared){
 const values=shared||new Map(),storage={fail:false,getItem:k=>values.get(k)||null,setItem(k,v){if(this.fail)throw Error('quota');values.set(k,String(v));}};
 const c={console,Math,Date,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage,addEventListener(){}};c.window=c;c.TG={};vm.createContext(c);
 for(const f of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8'),c,{filename:f+'.js'});
 return {TG:c.TG,A:c.TG.story,S:c.TG.store,G:c.TG.engine,storage,values};
}
function ready(b,origin='recruitHub'){
 const s=b.S.data.story;Object.assign(s,{
  started:true,node:origin,line:0,completed:origin==='rest3',recordRecovered:true,decision:'rescue',erosion:18,
  recruited:['vela','aster'],companions:['mare','vela','aster'],snowParty:origin==='rest3'?['mare','vela','aster']:[],snowRecovered:origin==='rest3',
  commandDeck:b.TG.commandDeck.preset('protect',['mare','vela','aster'])
 });assert(b.S.save());return b;
}
function dialogue(A){const id=A.state().node;let n=0;while(A.state().node===id){const s=A.state();assert(++n<10);assert(A.advance(s.node,s.line));}}
function mission(b){
 assert(b.A.beginVelaPatient());assert.equal(b.A.state().node,'patientBrief');dialogue(b.A);assert.equal(b.A.state().node,'velaEscort');
 const spec=b.A.prepareBattle();assert.deepEqual(clone(spec.companions),['mare','vela','aster']);assert(spec.commandDeck.includes('vela_heal'));return spec;
}
function quiet(g){g.spawn=-1000;g.nextWave=Infinity;g.hazards=[];g.hostile=[];g.enemies=[];g.waveRestUntil=Infinity;}
function step(G,n){for(let i=0;i<n;i++){if(G.g.status!=='playing')break;G.update(.04)}}
function board(b,g){
 const pt=g.patient;assert.equal(pt.phase,'escort');const gate=g.trainExit;
 for(let n=0;n<150;n++){
  if(g.status!=='playing')break;
  const d=Math.hypot(gate.x-pt.x,gate.y-pt.y)||1;
  g.p.x=pt.x+(gate.x-pt.x)/d*78;g.p.y=pt.y+(gate.y-pt.y)/d*78;
  b.G.update(.04);
 }
 assert.equal(pt.phase,'boarded');assert.equal(pt.saved,true);assert.equal(g.status,'ended');assert.equal(g.won,true);
}
test('Vela mission starts after recruitment, honors previous R3 decision and survives reloading a battle checkpoint',()=>{
 const b=ready(boot());const spec=mission(b);assert.match(spec.id,/^story-/);
 assert.equal(b.A.beginVelaPatient(),false);
 const loaded=boot(b.values);assert.equal(loaded.S.status,'ready');assert.equal(loaded.A.state().node,'velaEscort');
 assert.deepEqual(clone(loaded.A.prepareBattle().companions),['mare','vela','aster']);
 const g=b.G.startStory();assert(g.patient);assert.equal(g.stage,1);assert.equal(g.patient.phase,'stabilize');
 assert.equal(g.duration,100);assert.equal(g.trainExit.r,52);
 assert(g.commands.hand.includes('vela_heal'));assert(g.commands.hand.includes('mare_guard'));
 assert.equal(b.G.objective().kind,'patient');assert.match(b.G.objective().title,/환자에게 접근/);
 assert.equal(b.A.completeBattle({...g,won:true}),false);
});
test('Vela healing card stabilizes a real patient instead of only healing Rize',()=>{
 const b=ready(boot());mission(b);const g=b.G.startStory();quiet(g);
 g.p.x=g.patient.x;g.p.y=g.patient.y;g.patient.hp=38;
 assert(b.G.openCommands());assert.equal(b.G.commandInfo('vela_heal').enabled,true);
 assert(b.G.castCommand('vela_heal',g.commands.token));assert.equal(g.patient.treatments,1);
 assert.equal(g.patient.hp,62);assert(g.patient.charge>=1.65);
 step(b.G,42);assert.equal(g.patient.phase,'escort');assert.match(b.G.objective().title,/객차까지 호위/);
 const medic=g.allies.find(a=>a.id==='vela');assert(medic);assert(medic.carePose>0);
});
test('Mare blocks patient-directed threat with shield, and an unguarded patient can be hurt',()=>{
 const b=ready(boot());mission(b);const g=b.G.startStory();quiet(g);
 g.p.x=g.patient.x;g.p.y=g.patient.y;
 assert(b.G.openCommands());assert(b.G.castCommand('mare_guard',g.commands.token));
 assert.equal(g.patient.shield,1);
 const hp=g.patient.hp;g.patient.warning=.01;b.G.update(.04);
 assert.equal(g.patient.shield,0);assert.equal(g.patient.hp,hp);assert.equal(g.patient.mareBlocks,1);
 g.mare.cooldown=10;g.patient.warning=.01;b.G.update(.04);
 assert.equal(g.patient.hp,hp-20);
 g.mare.cooldown=0;g.mare.x=g.patient.x-26;g.mare.y=g.patient.y-8;g.patient.warning=.01;b.G.update(.04);
 assert.equal(g.patient.mareBlocks,2);assert.equal(g.patient.hp,hp-20);
});
test('patient boarding ends the mission immediately, saves contribution and shows train passenger',()=>{
 const b=ready(boot());const legacy=clone(b.S.data);delete legacy.story;mission(b);const g=b.G.startStory();quiet(g);
 g.p.x=g.patient.x;g.p.y=g.patient.y;g.patient.hp=58;
 assert(b.G.openCommands());assert(b.G.castCommand('vela_heal',g.commands.token));g.patient.warning=.01;b.G.update(.04);
 assert(g.patient.mareBlocks>=1);step(b.G,42);assert.equal(g.patient.phase,'escort');
 board(b,g);assert(g.time<g.duration);assert.equal(g.storySaved,true);
 assert.equal(b.A.state().node,'patientDebrief');assert.equal(b.A.state().patientRescued,true);
 assert.equal(b.A.state().patientCare.treatments,1);assert(b.A.state().patientCare.mareBlocks>=1);
 const reloaded=boot(b.values);assert.equal(reloaded.S.status,'ready');assert.equal(reloaded.A.state().node,'patientDebrief');
 assert.match(reloaded.A.currentLine({...reloaded.A.state(),line:2}).text,/벨라의 처치/);
 dialogue(b.A);assert.equal(b.A.state().node,'recruitHub');assert.equal(b.A.beginVelaPatient(),false);
 assert.equal(boot(b.values).A.state().patientRescued,true);
 assert(boot(b.values).A.state().seen.includes('patientBrief'));
 const after=clone(b.S.data);delete after.story;assert.deepEqual(after,legacy);
});
test('unboarded timer or patient loss is a failure; record, party and memory are not silently modified',()=>{
 const b=ready(boot());const spec=mission(b);const before=b.S.export();const g=b.G.startStory();quiet(g);
 g.time=g.duration-.01;b.G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,false);assert.equal(b.A.state().node,'velaEscort');assert.equal(b.S.export(),before);
 b.G.g=null;const retry=b.G.startStory();assert.equal(retry.id,spec.id);quiet(retry);
 retry.mareBlocks=0;retry.patient.hp=12;retry.mare.cooldown=9;retry.patient.warning=.01;b.G.update(.04);
 assert.equal(retry.status,'ended');assert.equal(retry.won,false);assert.equal(retry.patient.hp,0);
 assert.equal(b.A.state().patientRescued,false);assert.equal(b.S.export(),before);
});
test('patient rescue remains accessible after the snow ending and old v4 backups load safely',()=>{
 const b=ready(boot(),'rest3');const old=clone(b.S.data);delete old.story.patientRescued;delete old.story.patientReturn;delete old.story.patientCare;
 const persisted=boot(new Map([['terminusSaveV1',b.S.encode(old)]]));assert.equal(persisted.S.status,'ready');
 assert.equal(persisted.A.state().patientRescued,false);assert(persisted.A.beginVelaPatient());
 dialogue(persisted.A);const g=persisted.G.startStory();quiet(g);
 g.p.x=g.patient.x;g.p.y=g.patient.y;step(persisted.G,81);assert.equal(g.patient.phase,'escort');
 board(persisted,g);dialogue(persisted.A);assert.equal(persisted.A.state().node,'rest3');
 assert.equal(persisted.A.state().completed,true);assert.equal(persisted.A.state().patientRescued,true);
 const check=boot(persisted.values);assert.equal(check.A.state().node,'rest3');assert.equal(check.A.state().patientRescued,true);
});

test('Vela and Mare patient cards are guaranteed across a hundred shuffled battle hands',()=>{
 const b=ready(boot());mission(b);
 for(let seed=0;seed<100;seed++){
  b.G.g=null;b.S.data.story.commandSeed=seed;assert(b.S.save());
  const g=b.G.startStory();assert(g);
  assert(g.commands.hand.includes('vela_heal'),'missing Vela treatment at seed '+seed);
  assert(g.commands.hand.includes('mare_guard'),'missing Mare protection at seed '+seed);
  assert.equal(b.TG.commandDeck.validate(g.commands.deck,g.party),true);
  assert.equal(b.S.data.story.commandDeck.includes('vela_heal'),false);
 }
});
