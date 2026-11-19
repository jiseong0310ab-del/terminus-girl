'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),plain=x=>JSON.parse(JSON.stringify(x));
function boot(){
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem(k,v){values.set(k,String(v))}};
 const c={console,Date,Math,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage,addEventListener(){}};
 c.window=c;c.TG={};vm.createContext(c);
 for(const file of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),c,{filename:file+'.js'});
 return {TG:c.TG,A:c.TG.story,S:c.TG.store,G:c.TG.engine};
}
function first(b){
 assert(b.A.begin());
 let n=0;
 while(b.TG.STORY.nodes[b.A.state().node].kind==='dialogue'){
  const {node,line}=b.A.state();assert(b.A.advance(node,line));assert(++n<30);
 }
 assert.equal(b.A.state().node,'approach');return b.G.startStory();
}
function snow(b,party=['mare','aster','noa']){
 const s=b.S.data.story;
 Object.assign(s,{node:'snowMission',started:true,decision:'rescue',recordRecovered:true,
  recruited:party.filter(id=>id!=='mare'),companions:[...party],snowParty:[...party],
  encounterId:'story-snow-tests',commandDeck:b.TG.commandDeck.preset('protect',party)});
 assert(b.S.save());return b.G.startStory();
}
function setHand(b,ids){
 const g=b.G.g;g.commands.hand=[...ids];
 const remaining=g.commands.deck.filter(id=>!ids.includes(id));
 g.commands.draw=[...remaining];g.commands.discard=[];g.commands.energy=3;return g;
}
function cast(b,id){
 const g=b.G.g;if(g.status==='playing')assert(b.G.openCommands());
 assert.equal(g.status,'command');const token=g.commands.token;
 assert.equal(b.G.castCommand(id,token),true,'casting '+id);
 assert.equal(g.status,'playing');return g;
}
function still(g){g.spawn=-1e6;g.nextWave=Infinity;g.enemies=[];g.hostile=[];g.hazards=[];g.waveRestUntil=Infinity;}
function step(G,n){for(let i=0;i<n;i++){if(G.g.status!=='playing')break;G.update(.04)}}
test('initial hand offers Rize and every active party member in 80 seeded snow runs without changing the saved deck',()=>{
 const b=boot(),g=snow(b,['mare','aster','noa']),deck=plain(b.S.data.story.commandDeck);
 assert(g);
 const owner=id=>b.TG.COMMANDS.find(c=>c.id===id)?.owner;
 for(let seed=1;seed<=80;seed++){
  b.G.g=null;b.S.data.story.commandSeed=seed;assert(b.S.save());
  const next=b.G.startStory();
  assert.equal(next.commands.hand.length,4);
  assert.deepEqual([...new Set(next.commands.hand.map(owner))].sort(),['aster','mare','noa','rize'].sort());
  assert.deepEqual(plain(b.S.data.story.commandDeck),deck);
  assert.equal(b.TG.commandDeck.validate(next.commands.deck,next.party),true);
 }
});
test('two different owners within six seconds trigger one visible tactical burst and refund one energy',()=>{
 const b=boot(),g=first(b);g.enemies=[];g.hostile=[];
 const e=b.G.enemy('ghost',95,0);e.hp=e.maxHp=400;e.speed=0;e.frozen=100;
 setHand(b,['rize_flame','shared_push','shared_heal']);
 cast(b,'rize_flame');assert.equal(g.commands.energy,2);assert.equal(g.teamwork.owner,'rize');
 // shared_push displaces enemy from 95 to 185, still inside the 210 burst.
 const before=e.hp;cast(b,'shared_push');
 assert.equal(g.teamwork.count,1);
 assert.equal(g.teamwork.lastPair,'리제 × 공용');
 assert.equal(g.commands.energy,2);assert(e.hp<before);
 assert.match(g.toast.text,/합동 지휘/);
 assert.equal(g.teamwork.cooldown,5.5);
 assert(g.rings.some(r=>r.r===210));
 assert.equal(b.G.castCommand('shared_push',g.commands.token-1),false);
});
test('repeating the same owner, waiting too long, or being on cooldown prevents free combo rewards',()=>{
 const b=boot(),g=first(b);g.enemies=[];g.hostile=[];
 setHand(b,['rize_flame','rize_frost','shared_heal']);
 cast(b,'rize_flame');const before=plain(g.teamwork);
 // Same-owner card is legal with an enemy nearby, but cannot trigger a team skill.
 const enemy=b.G.enemy('ghost',120,0);enemy.hp=500;enemy.speed=0;enemy.frozen=100;
 cast(b,'rize_frost');assert.equal(g.teamwork.count,0);assert.equal(g.teamwork.owner,'rize');
 g.teamwork.window=0;g.p.hp=70;cast(b,'shared_heal');
 assert.equal(g.teamwork.count,0);assert.equal(g.teamwork.owner,'shared');
 assert.equal(g.teamwork.window,6);
});
test('Mare support chain grants one extra shield; Aster chain adds a marked strike',()=>{
 const b=boot(),g=snow(b);
 setHand(b,['mare_guard','rize_flame','aster_mark','noa_dash']);
 g.p.shield=0;g.enemies=[];const e=b.G.enemy('ghost',90,0);e.hp=e.maxHp=500;e.speed=0;e.frozen=100;
 cast(b,'mare_guard');assert.equal(g.p.shield,1);
 const hp=e.hp;cast(b,'rize_flame');
 assert.equal(g.teamwork.count,1);assert.equal(g.p.shield,2);assert(e.hp<hp);
 // Put the third card inside the combo cooldown: no immediate second proc.
 cast(b,'aster_mark');assert.equal(g.teamwork.count,1);
 // Cooldown elapsed and the next distinct owner can start a new pair.
 g.teamwork.cooldown=0;g.teamwork.window=6;g.teamwork.owner='rize';
 setHand(b,['aster_mark','rize_flame','mare_guard','noa_dash']);
 const next=e.hp;cast(b,'aster_mark');assert.equal(g.teamwork.count,2);assert(e.hp<next-g.p.attack*1.8);
});
test('Vela and Noa chains have distinct practical effects',()=>{
 const b=boot(),g=snow(b,['mare','noa','vela']);
 setHand(b,['rize_flame','vela_heal','noa_clear','mare_guard']);
 g.p.hp=50;g.enemies=[];g.hostile=[];
 cast(b,'rize_flame');cast(b,'vela_heal');assert.equal(g.teamwork.count,1);
 assert.equal(g.p.hp,80); // heal 20 + combo 10
 g.teamwork.cooldown=0;g.teamwork.window=6;g.teamwork.owner='rize';
 g.dash.cooldown=2.7;
 g.hostile.push({x:15,y:0,vx:0,vy:0,life:3,r:5,damage:10});
 cast(b,'noa_clear');assert.equal(g.teamwork.count,2);
 assert(Math.abs(g.dash.cooldown-1.2)<1e-9);assert.equal(g.hostile.length,0);
});
test('a directed dash during genuine windup restores energy, but no arbitrary or repeat reward',()=>{
 const b=boot(),g=first(b);g.commands.energy=0;
 g.enemies=[];assert.equal(b.G.dash(),true);assert.equal(g.commands.energy,0);assert.equal(g.teamwork.evades,0);
 g.dash.active=0;g.dash.cooldown=0;const e=b.G.enemy('passenger',95,0);e.action='windup';e.clock=1;e.speed=0;e.hp=999;
 b.G.input.x=1;b.G.input.y=0;
 assert(b.G.dash());assert.equal(g.commands.energy,1);assert.equal(g.teamwork.evades,1);
 assert.equal(g.teamwork.evadeCooldown,5);assert.match(g.toast.text,/위험 회피/);
 g.dash.active=0;g.dash.cooldown=0;
 assert(b.G.dash());assert.equal(g.commands.energy,1);assert.equal(g.teamwork.evades,1);
});
test('ordinary story missions recharge at eight seconds, training maintains original twelve-second rhythm',()=>{
 const b=boot(),g=first(b);still(g);g.commands.energy=0;g.commands.regen=0;
 step(b.G,199);assert.equal(g.commands.energy,0);
 step(b.G,1);assert.equal(g.commands.energy,1);
 assert.equal(b.TG.commandDeck.preset('solo',[]).length,8);
 // Legacy command-deck tick utility still uses a 12-second unit of energy.
 const c=b.TG.commandDeck.create(b.TG.commandDeck.preset('solo',[]),1);
 c.energy=0;b.TG.commandDeck.tick(c,8);assert.equal(c.energy,0);
 b.TG.commandDeck.tick(c,4);assert.equal(c.energy,1);
});
