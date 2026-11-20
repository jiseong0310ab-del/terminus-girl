'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {unlockStoryGate}=require('./helpers.cjs');
const ROOT=path.resolve(__dirname,'..'),plain=value=>JSON.parse(JSON.stringify(value));
function boot(shared){
 const values=shared||new Map(),storage={fail:false,getItem:key=>values.get(key)||null,setItem(key,value){if(this.fail)throw Error('quota');values.set(key,String(value));}};
 const c={console,Math:Object.create(Math),Date,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage,addEventListener(){},TG:{}};c.window=c;vm.createContext(c);
 for(const file of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),c,{filename:file+'.js'});
 return {c,TG:c.TG,G:c.TG.engine,S:c.TG.store,A:c.TG.story,D:c.TG.commandDeck,values,storage};
}
function toBattle(b){assert(b.A.begin());let limit=30;while(b.TG.STORY.nodes[b.A.state().node].kind==='dialogue'){const {node,line}=b.A.state();assert(b.A.advance(node,line));assert(limit-->0);}return b;}
function quiet(g){g.spawn=-1e6;g.nextWave=Infinity;g.hazardClock=-1e6;g.enemies=[];g.hostile=[];g.lastFire=g.time;}
function completeStoryObjective(b){
 const g=b.G.g,gate=g.storyGate;assert(g&&gate&&g.status==='playing');
 unlockStoryGate(g); // Combat test helper: the prerequisite was already resolved.
 g.enemies=[];g.hostile=[];g.hazards=[];g.spawn=-1e6;g.nextWave=Infinity;
 g.p.x=gate.x;g.p.y=gate.y;
 for(let n=0;n<100&&g.status==='playing';n++)b.G.update(.04);
 assert.equal(g.status,'ended');assert.equal(g.won,true);
}
function battle(mare=true){const b=toBattle(boot());assert(b.G.startStory());if(mare){completeStoryObjective(b);toBattle(b);assert(b.G.startStory());}quiet(b.G.g);return b;}
function command(b,id){
 const g=b.G.g,ids=[...new Set([id,...b.D.preset('counter',['mare']),...b.D.available(['mare']).map(card=>card.id)])].slice(0,8);
 assert(b.D.validate(ids,['mare']));g.commands=b.D.create(ids,123);g.commands.hand=[id,...ids.filter(card=>card!==id).slice(0,2)];g.commands.draw=ids.filter(card=>!g.commands.hand.includes(card));g.commands.discard=[];g.commands.energy=3;
 if(g.status==='playing')assert(b.G.openCommands());else g.status='command';return g;
}
function cast(b,id){return b.G.castCommand(id,b.G.g.commands.token);}
function enemy(b,x,y=0,type='ghost'){const e=b.G.enemy(type,x,y);e.hp=e.maxHp=1000;e.speed=0;return e;}
function bullet(g,x,y=0){const b={x,y,vx:0,vy:0,life:10,r:5,damage:10};g.hostile.push(b);return b;}
function partition(runtime){const ids=[...runtime.hand,...runtime.draw,...runtime.discard];assert.equal(ids.length,8);assert.equal(new Set(ids).size,8);assert.deepEqual([...ids].sort(),[...runtime.deck].sort());assert.equal(runtime.hand.length,3);}

test('command catalogue has twelve unique cards and the agreed owners and costs',()=>{
 const {TG}=boot();assert.equal(TG.COMMANDS.length,32);assert.equal(new Set(TG.COMMANDS.map(card=>card.id)).size,32);
 assert.deepEqual(plain(TG.COMMANDS.slice(0,12).map(card=>card.owner)),['rize','rize','rize','rize','mare','mare','mare','mare','shared','shared','shared','shared']);
 for(const card of TG.COMMANDS.slice(0,12)){assert(card.name&&card.desc);assert.equal(card.cost,['rize_cut','mare_shelter','mare_counter'].includes(card.id)?2:1);}
});

test('deck validation enforces eight unique available cards and party ownership',()=>{
 const {D}=boot(),solo=D.preset('solo',[]),protect=D.preset('protect',['mare']),counter=D.preset('counter',['mare']);
 assert.equal(D.available([]).length,8);assert.equal(D.available(['mare']).length,12);assert(D.validate(solo,[]));assert(D.validate(protect,['mare']));assert(D.validate(counter,['mare']));
 assert.equal(D.validate(protect,[]),false);assert.equal(D.validate(solo,['mare']),false);assert.equal(D.validate(solo.slice(1),[]),false);assert.equal(D.validate([...solo.slice(0,7),solo[0]],[]),false);assert.equal(D.validate([...solo.slice(0,7),'unknown'],[]),false);
 assert.deepEqual(plain(D.normalize(null,[])),plain(solo));assert.deepEqual(plain(D.normalize(solo,['mare'])),plain(protect));const copy=D.normalize(counter,['mare']);copy.pop();assert.equal(counter.length,8);
});

test('seeded hand and recycling ignore all global combat randomness and conserve the deck',()=>{
 const {D,c}=boot(),ids=D.preset('counter',['mare']),seed=D.seedFor('story-command-test');assert.equal(seed,D.seedFor('story-command-test'));assert.notEqual(seed,D.seedFor('story-command-test2'));assert(seed>0&&seed<=0xffffffff);
 const a=D.create(ids,seed);for(let i=0;i<100;i++)c.Math.random();const b=D.create(ids,seed);assert.deepEqual(plain(a),plain(b));
 c.Math.random=()=>{throw Error('command RNG leaked');};
 for(let i=0;i<160;i++){a.energy=b.energy=3;const id=a.hand[i%3];assert(D.spend(a,id));assert(D.spend(b,id));partition(a);assert.deepEqual(plain(a),plain(b));}
 assert.equal(a.casts,160);assert.equal(a.token,160);assert.equal(ids.length,8);
});

test('deck runtime refuses invalid spending without mutation and energy never banks while full',()=>{
 const {D}=boot(),run=D.create(D.preset('solo',[]),0);partition(run);assert(run.seed>0);
 for(const id of ['unknown',run.draw[0]]){const before=JSON.stringify(run);assert.equal(D.spend(run,id),false);assert.equal(JSON.stringify(run),before);}
 run.energy=0;const before=JSON.stringify(run);assert.equal(D.spend(run,run.hand[0]),false);assert.equal(JSON.stringify(run),before);
 D.tick(run,11.9);assert.equal(run.energy,0);D.tick(run,.1);assert.equal(run.energy,1);D.tick(run,30);assert.equal(run.energy,3);assert.equal(run.regen,0);D.tick(run,100);assert.equal(run.regen,0);
 run.energy=2;D.tick(run,11);assert.equal(run.energy,2);D.tick(run,1);assert.equal(run.energy,3);assert.equal(run.regen,0);
 run.energy=0;for(let i=0;i<300;i++)D.tick(run,.04);assert.equal(run.energy,1);assert.equal(run.regen,0);
 for(const dt of [0,-1,NaN,Infinity]){const snapshot=JSON.stringify(run);D.tick(run,dt);assert.equal(JSON.stringify(run),snapshot);}
});

test('all story encounters initialize a copied command deck while legacy modes stay unchanged',()=>{
 const b=battle(false),g=b.G.g,spec=b.A.prepareBattle();assert.equal(g.mare,null);assert.equal(g.commands.hand.length,3);assert.deepEqual(plain(g.commands.deck),plain(spec.commandDeck));assert(!g.commands.deck.some(id=>id.startsWith('mare_')));assert.deepEqual(plain(g.commandEffects),{guardWindow:0,ward:0});
 g.commands.deck.reverse();assert.deepEqual(plain(b.A.state().commandDeck),plain(spec.commandDeck));
 b.G.finish(false,'retreat');for(const mode of ['chapter','quick','single']){b.G.g=null;const run=b.G.start(mode);assert.equal(run.commands,undefined);assert.equal(run.commandEffects,undefined);assert.equal(b.G.openCommands(),false);b.G.finish(false,'retreat');}
});

test('opening and closing commands clears input and preserves the exact hand without writing progress',()=>{
 const b=battle(),g=b.G.g,before=b.S.export(),hand=JSON.stringify(g.commands);let screen='';b.G.onChange=name=>screen=name;b.G.input.x=1;b.G.input.y=-1;
 assert(b.G.openCommands());assert.equal(screen,'commands');assert.equal(g.status,'command');assert.deepEqual(plain(b.G.input),{x:0,y:0});assert.equal(b.G.openCommands(),false);assert(b.G.closeCommands());assert.equal(screen,'playing');assert.equal(JSON.stringify(g.commands),hand);assert.equal(b.S.export(),before);
 for(const status of ['paused','cards','ended']){g.status=status;assert.equal(b.G.openCommands(),false);assert.equal(b.G.closeCommands(),false);}g.status='playing';g.p.hp=0;assert.equal(b.G.openCommands(),false);
});

test('command previews and invalid casts are read-only, including insufficient cost and stale tokens',()=>{
 const b=battle(),g=command(b,'rize_cut');enemy(b,451);let snapshot=JSON.stringify(g),save=b.S.export();const oldWrite=b.S.canWrite;b.S.canWrite=()=>{throw Error('preview or invalid command touched storage');};
 for(let i=0;i<10;i++){assert.equal(b.G.commandInfo('rize_cut').enabled,false);assert.equal(cast(b,'rize_cut'),false);}assert.equal(JSON.stringify(g),snapshot);assert.equal(b.S.export(),save);
 g.enemies[0].x=450;g.commands.energy=1;snapshot=JSON.stringify(g);assert.equal(cast(b,'rize_cut'),false);assert.equal(JSON.stringify(g),snapshot);
 g.commands.energy=3;snapshot=JSON.stringify(g);assert.equal(b.G.castCommand('rize_cut',g.commands.token+1),false);assert.equal(JSON.stringify(g),snapshot);assert.equal(b.G.commandInfo('unknown').card,null);
 b.S.canWrite=oldWrite;const token=g.commands.token,states=[];b.G.hitEnemy=(target,amount)=>states.push({energy:g.commands.energy,token:g.commands.token,hand:[...g.commands.hand],amount});assert(cast(b,'rize_cut'));assert.equal(states.length,1);assert.equal(states[0].energy,1);assert.equal(states[0].token,token+1);assert.equal(g.status,'playing');g.status='command';snapshot=JSON.stringify(g);assert.equal(b.G.castCommand('rize_cut',token),false);assert.equal(JSON.stringify(g),snapshot);partition(g.commands);
});

test('storage conflicts reject open, close and cast without changing combat state',()=>{
 const b=battle(),g=command(b,'shared_heal');g.p.hp=50;const other=boot(b.values);other.S.data.wallet=10;assert(other.S.save());const before=JSON.stringify(g);
 assert.equal(cast(b,'shared_heal'),false);assert.equal(JSON.stringify(g),before);assert.equal(b.S.status,'conflict');assert.equal(b.G.closeCommands(),false);g.status='playing';assert.equal(b.G.openCommands(),false);
});

test('pulse damages only the inclusive 155 radius and cut selects the nearest inclusive 450 target',()=>{
 let b=battle(),g=command(b,'rize_pulse'),inside=enemy(b,155),outside=enemy(b,155.01);assert(cast(b,'rize_pulse'));assert.equal(inside.hp,1000-g.p.attack*1.5);assert.equal(outside.hp,1000);assert.equal(g.commands.energy,2);
 b=battle();g=command(b,'rize_cut');const near=enemy(b,450),far=enemy(b,450.01);assert(cast(b,'rize_cut'));assert.equal(near.hp,1000-g.p.attack*2.4);assert.equal(far.hp,1000);assert.equal(g.commands.energy,1);
 b=battle();g=command(b,'rize_cut');const farther=enemy(b,300),closer=enemy(b,-30);assert(cast(b,'rize_cut'));assert.equal(farther.hp,1000);assert.equal(closer.hp,1000-g.p.attack*2.4);
});

test('frost freezes normal enemies and only slows a boss inside 180',()=>{
 const b=battle(),g=command(b,'rize_frost'),normal=enemy(b,180),boss=enemy(b,170,0,'boss'),outside=enemy(b,180.01);assert(cast(b,'rize_frost'));assert.equal(normal.frozen,.7);assert.equal(boss.frozen,0);assert.equal(boss.slow,.8);assert.equal(outside.frozen,0);assert.equal(normal.hp,1000);assert.equal(boss.hp,1000);
});

test('flame is stationary for three seconds, deals existing six damage per second and respects the cap',()=>{
 const b=battle(),g=command(b,'rize_flame');assert(cast(b,'rize_flame'));assert.deepEqual(plain(g.flames[0]),{x:0,y:0,r:95,life:3});const e=enemy(b,90);g.lastFire=1e6;b.G.update(.04);assert(Math.abs(e.hp-(1000-.24))<1e-9);b.G.input.x=1;b.G.update(.04);assert.equal(g.flames[0].x,0);assert.equal(g.flames[0].y,0);
 g.flames=[{x:0,y:0,r:95,life:1},{x:0,y:0,r:95,life:2},{x:0,y:0,r:95,life:3}];command(b,'rize_flame');const before=JSON.stringify(g);assert.equal(cast(b,'rize_flame'),false);assert.equal(JSON.stringify(g),before);g.flames[0].life=0;assert(cast(b,'rize_flame'));
});

test('guard adds one capped shield without opening a counter window until an actual block',()=>{
 const b=battle(),g=command(b,'mare_guard');g.p.shield=2;assert(cast(b,'mare_guard'));assert.equal(g.p.shield,3);assert.equal(g.commandEffects.guardWindow,0);command(b,'mare_guard');const before=JSON.stringify(g);assert.equal(cast(b,'mare_guard'),false);assert.equal(JSON.stringify(g),before);
});

test('shelter halves only HP damage after ordinary reduction and respects ready Mare and shields',()=>{
 const b=battle(),g=command(b,'mare_shelter');assert(cast(b,'mare_shelter'));assert.equal(g.commands.energy,1);assert.equal(g.commandEffects.ward,4);assert(b.G.damage(20));assert.equal(g.p.hp,100);assert.equal(g.mare.protected,1);
 g.time+=1;g.p.shield=1;assert(b.G.damage(20));assert.equal(g.p.hp,100);assert.equal(g.p.shield,0);g.time+=1;g.levels.ward=2;assert(b.G.damage(20));assert(Math.abs(g.p.hp-91.4)<1e-9);
 command(b,'mare_shelter');const before=JSON.stringify(g);assert.equal(cast(b,'mare_shelter'),false);assert.equal(JSON.stringify(g),before);g.commandEffects.ward=3.99;assert(cast(b,'mare_shelter'));assert.equal(g.commandEffects.ward,4);
});

test('counter requires a real protection window and an in-range enemy or projectile',()=>{
 const b=battle(),g=command(b,'mare_counter'),e=enemy(b,180),outside=enemy(b,180.01);bullet(g,180);const far=bullet(g,180.01);const before=JSON.stringify(g);assert.equal(cast(b,'mare_counter'),false);assert.equal(JSON.stringify(g),before);
 g.commandEffects.guardWindow=4;assert(cast(b,'mare_counter'));assert.equal(e.hp,1000-g.p.attack*2.2);assert.equal(outside.hp,1000);assert.deepEqual(g.hostile,[far]);assert.equal(g.commandEffects.guardWindow,0);assert.equal(g.commands.energy,1);
 command(b,'mare_counter');g.enemies=[];g.hostile=[];g.commandEffects.guardWindow=4;assert.equal(cast(b,'mare_counter'),false);bullet(g,100);assert(cast(b,'mare_counter'));assert.equal(g.hostile.length,0);
});

test('rally heals at most twelve and reduces Mare cooldown by six with usable-only guards',()=>{
 const b=battle(),g=command(b,'mare_rally');assert.equal(cast(b,'mare_rally'),false);g.mare.cooldown=9;assert(cast(b,'mare_rally'));assert.equal(g.p.hp,100);assert.equal(g.mare.cooldown,3);
 command(b,'mare_rally');g.p.hp=95;assert(cast(b,'mare_rally'));assert.equal(g.p.hp,100);assert.equal(g.mare.cooldown,0);command(b,'mare_rally');g.p.hp=30;assert(cast(b,'mare_rally'));assert.equal(g.p.hp,42);
});

test('magnet collects only existing experience through radius300 with wisdom and normal memory level queue',()=>{
 const b=battle(),g=command(b,'shared_magnet');assert.equal(cast(b,'shared_magnet'),false);g.levels.wisdom=2;g.xp=0;g.drops=[{x:300,y:0,value:10},{x:30,y:0,value:20},{x:300.01,y:0,value:99}];const screens=[];b.G.onChange=name=>screens.push(name);assert(cast(b,'shared_magnet'));assert.equal(g.drops.length,1);assert.equal(g.drops[0].value,99);assert.equal(g.level,2);assert.equal(g.xp,27);assert.equal(g.learned.collected,true);assert.equal(g.status,'cards');assert.deepEqual(screens,['playing','cards']);partition(g.commands);assert.equal(g.commands.casts,1);
 assert(b.G.choose(g.offered[0],g.offerToken));assert.equal(g.level,3);assert.equal(g.status,'cards');assert(b.G.choose(g.offered[0],g.offerToken));assert.equal(g.status,'playing');assert.equal(g.xp,8);assert.equal(g.commands.casts,1);
});

test('heal restores eighteen at most and cannot spend a card at full HP',()=>{
 const b=battle(),g=command(b,'shared_heal'),before=JSON.stringify(g);assert.equal(cast(b,'shared_heal'),false);assert.equal(JSON.stringify(g),before);g.p.hp=50;assert(cast(b,'shared_heal'));assert.equal(g.p.hp,68);command(b,'shared_heal');g.p.hp=99;assert(cast(b,'shared_heal'));assert.equal(g.p.hp,100);
});

test('push displaces enemies ninety within160 and clears only projectiles within110',()=>{
 const b=battle(),g=command(b,'shared_push');assert.equal(cast(b,'shared_push'),false);const edge=enemy(b,160),outside=enemy(b,160.01),overlap=enemy(b,0);bullet(g,110);const far=bullet(g,110.01);assert(cast(b,'shared_push'));assert.equal(edge.x,250);assert.equal(outside.x,160.01);assert.equal(overlap.x,90);assert.equal(overlap.y,0);assert.deepEqual(g.hostile,[far]);assert.equal(edge.hp,1000);
 command(b,'shared_push');g.enemies=[];bullet(g,50);assert(cast(b,'shared_push'));assert.equal(g.hostile.length,1);
});

test('dash command resets only a spent cooldown and does not itself dash or activate guard combo',()=>{
 const b=battle(),g=command(b,'shared_dash');assert.equal(cast(b,'shared_dash'),false);g.dash.cooldown=2;assert(cast(b,'shared_dash'));assert.equal(g.dash.cooldown,0);assert.equal(g.dash.active,0);assert.equal(g.dash.invulnerable,false);assert.equal(g.commandEffects.guardWindow,0);
});

test('Mare and shield actual blocks open a four-second combo, dash and ignored hits do not',()=>{
 const b=battle(),g=b.G.g;assert(b.G.dash());assert.equal(b.G.damage(10),false);assert.equal(g.commandEffects.guardWindow,0);g.dash.invulnerable=false;g.lastHit=g.time;assert.equal(b.G.damage(10),false);assert.equal(g.commandEffects.guardWindow,0);g.lastHit=-9;assert(b.G.damage(10));assert.equal(g.commandEffects.guardWindow,4);assert.equal(g.p.hp,100);
 g.commandEffects.guardWindow=0;g.time+=1;g.p.shield=1;assert(b.G.damage(10));assert.equal(g.commandEffects.guardWindow,4);assert.equal(g.p.shield,0);g.commandEffects.guardWindow=0;g.time+=1;assert(b.G.damage(10));assert.equal(g.commandEffects.guardWindow,0);assert.equal(g.p.hp,90);
 const solo=battle(false);solo.G.g.p.shield=1;assert(solo.G.damage(10));assert.equal(solo.G.g.commandEffects.guardWindow,0);
});

test('pulse and cut consume the protection bonus once, while invalid targets keep the window',()=>{
 for(const id of ['rize_pulse','rize_cut']){const b=battle(),g=command(b,id);g.commandEffects.guardWindow=4;const snapshot=JSON.stringify(g);assert.equal(cast(b,id),false);assert.equal(JSON.stringify(g),snapshot);const e=enemy(b,100);assert(cast(b,id));assert.equal(e.hp,1000-g.p.attack*(id==='rize_pulse'?1.5:2.4)*1.5);assert.equal(g.commandEffects.guardWindow,0);command(b,id);const hp=e.hp;assert(cast(b,id));assert.equal(e.hp,hp-g.p.attack*(id==='rize_pulse'?1.5:2.4));}
});

test('all command clocks and effects freeze in command/cards/pause and regenerate only in real combat',()=>{
 const b=battle(),g=b.G.g;g.commands.energy=1;g.commands.regen=11.98;g.commandEffects.guardWindow=4;g.commandEffects.ward=4;g.mare.cooldown=12;g.dash.cooldown=2;g.flames=[{x:0,y:0,r:95,life:3}];
 for(const status of ['command','cards','paused']){g.status=status;const before=JSON.stringify(g);for(let i=0;i<100;i++)b.G.update(.04);assert.equal(JSON.stringify(g),before);assert.equal(b.G.damage(10),false);}
 g.status='playing';b.G.update(.04);assert.equal(g.commands.energy,2);assert(Math.abs(g.commands.regen-.04)<1e-9);assert.equal(g.commandEffects.guardWindow,3.96);assert.equal(g.commandEffects.ward,3.96);assert.equal(g.mare.cooldown,11.96);assert.equal(g.dash.cooldown,1.96);assert.equal(g.flames[0].life,2.96);
 g.commands.energy=3;g.commands.regen=11;b.G.update(.04);assert.equal(g.commands.regen,0);assert.equal(g.status,'playing');
});

test('Mare cards cannot be cast in a solo encounter even if injected into a hand',()=>{
 const b=battle(false),g=b.G.g;g.commands.hand[0]='mare_guard';assert(b.G.openCommands());const before=JSON.stringify(g);assert.equal(b.G.commandInfo('mare_guard').enabled,false);assert.equal(cast(b,'mare_guard'),false);assert.equal(JSON.stringify(g),before);
});

test('successful command emits one notification even when a boss enters its second phase',()=>{
 const b=battle(),g=command(b,'rize_cut'),e=enemy(b,100,0,'boss');e.maxHp=1000;e.hp=510;let notifications=0;const notify=b.G.notify;b.G.notify=text=>{notifications++;notify(text);};assert(cast(b,'rize_cut'));assert.equal(e.bossPhase,2);assert.equal(notifications,1);assert.match(g.toast.text,/차장의 절단/);
});

test('command kills keep the ordinary chain reward while paused enemies cannot receive damage',()=>{
 const b=battle(),g=command(b,'rize_pulse'),e=enemy(b,100);e.hp=1;g.chain=7;g.chainTime=3;let notifications=0;const notify=b.G.notify;b.G.notify=text=>{notifications++;notify(text);};
 const hp=e.hp;b.G.hitEnemy(e,100);assert.equal(e.hp,hp);assert.equal(g.kills,0);assert(cast(b,'rize_pulse'));assert.equal(g.kills,1);assert.equal(g.overcharge,6);assert.equal(g.chain,0);assert.equal(g.shards,0);assert.equal(g.drops.length,1);assert.equal(notifications,1);
 const waiting=enemy(b,100);for(const status of ['paused','cards','command','ended']){g.status=status;b.G.hitEnemy(waiting,10,true);assert.equal(waiting.hp,1000);assert.equal(waiting.burn,0);}
});

test('training requires Mare, lasts ninety seconds and never writes progress, legacy rewards or checkpoints',()=>{
 const solo=battle(false);solo.G.finish(false,'retreat');assert.equal(solo.G.startCommandTraining(),false);
 const b=battle();completeStoryObjective(b);toBattle(b);assert.equal(b.A.state().node,'rest');const before=b.S.export(),state=JSON.stringify(b.A.state());let completed=0,settled=0;b.A.completeBattle=()=>{completed++;return true;};b.S.settle=()=>{settled++;return 999;};
 const g=b.G.startCommandTraining();assert(g);assert.equal(g.mode,'story');assert.equal(g.storyTraining,true);assert.equal(g.duration,90);assert(g.mare);assert.equal(g.commands.hand.length,3);assert.equal(b.S.export(),before);assert.match(b.G.objective().title,/90초/);quiet(g);g.time=89.99;b.G.update(.04);assert.equal(g.status,'ended');assert.equal(g.won,true);assert.equal(g.storySaved,true);assert.equal(g.reward,0);assert.equal(completed,0);assert.equal(settled,0);assert.equal(b.S.export(),before);assert.equal(JSON.stringify(b.A.state()),state);assert(b.G.saveStoryResult());assert.equal(completed,0);assert(b.G.startCommandTraining());b.G.finish(false,'retreat');assert.equal(b.S.export(),before);assert.equal(completed,0);
});

test('training drills telegraph varied threats, freeze in commands, skip occupied markers and respect the enemy cap',()=>{
 const b=battle();b.G.finish(false,'retreat');const g=b.G.startCommandTraining();quiet(g);g.time=12;g.nextWave=12;b.G.update(0);assert.match(g.wave.name,/돌격 포위/);assert(g.wave.points.some(p=>p.type==='wolf'));assert.equal(g.wave.remaining,2);
 assert(b.G.openCommands());const frozen=JSON.stringify(g.wave);b.G.update(.04);assert.equal(JSON.stringify(g.wave),frozen);assert(b.G.closeCommands());g.p.x=g.wave.points[0].x;g.p.y=g.wave.points[0].y;g.wave.remaining=0;b.G.update(0);assert.equal(g.wave,null);assert.equal(g.enemies.length,5);assert(g.nextWave>=30);
 g.enemies=[];g.waveRestUntil=0;g.time=g.nextWave;b.G.update(0);assert.match(g.wave.name,/사격과 추격/);assert.equal(g.wave.points.filter(p=>p.type==='lost').length,3);g.wave.remaining=0;b.G.update(0);g.enemies=[];g.time=g.nextWave;b.G.update(0);assert.match(g.wave.name,/방패 뒤/);assert(g.wave.points.some(p=>p.type==='warden'));
 while(g.enemies.length<64)b.G.enemy('ghost',-1000,-1000);g.wave.remaining=0;b.G.update(0);assert.equal(g.enemies.length,65);g.enemies=[];g.time=g.duration-5;g.nextWave=g.time;b.G.update(0);assert.equal(g.wave,null);
});

test('quick cast from the combat tray spends one card without stopping time or releasing the joystick',()=>{
 const b=battle();const g=b.G.g;g.script=null;quiet(g);
 const ids=b.D.preset('protect',['mare']);g.commands=b.D.create(ids,77);g.commands.hand=['shared_heal','rize_pulse','mare_guard'];
 g.commands.draw=ids.filter(id=>!g.commands.hand.includes(id));g.commands.discard=[];g.commands.energy=3;g.p.hp=50;
 const seen=[],route=b.G.onChange;b.G.onChange=state=>seen.push(state);
 assert.equal(b.G.quickCast('shared_heal'),true);
 assert.equal(g.status,'playing');assert.equal(g.p.hp,68);assert.equal(g.commands.energy,2);assert.equal(g.commands.quick,1);
 assert(!g.commands.hand.includes('shared_heal'));partition(g.commands);
 assert(!seen.includes('playing'),'quick cast must not route back to the playing screen (that resets input)');
 // Unusable or out-of-state casts are refused without spending anything.
 assert.equal(b.G.quickCast('rize_pulse'),false);assert.equal(g.commands.energy,2);
 g.status='paused';assert.equal(b.G.quickCast('mare_guard'),false);g.status='playing';
 b.G.onChange=route;
});

test('a card that stays unusable for six seconds is swapped, while energy waits and the counter card never cycle',()=>{
 const b=battle();const g=b.G.g;g.script=null;quiet(g);g.storyPressure=null;
 const ids=b.D.preset('protect',['mare']);g.commands=b.D.create(ids,91);g.commands.hand=['shared_heal','mare_counter','rize_pulse'];
 g.commands.draw=ids.filter(id=>!g.commands.hand.includes(id));g.commands.discard=[];g.commands.energy=3;g.p.hp=g.p.maxHp;
 for(let i=0;i<170;i++){g.p.hp=g.p.maxHp;g.enemies=[];b.G.update(.04);}
 assert(!g.commands.hand.includes('shared_heal'),'full-HP heal was swapped');assert.equal(g.commands.hand[1],'mare_counter');
 assert(g.commands.cycled>=1);assert.equal(g.commands.casts,0);partition(g.commands);
 // With no energy, nothing is "dead": the hand waits for regeneration.
 const before=[...g.commands.hand];g.commands.energy=0;g.commands.regen=-1000;
 for(let i=0;i<200;i++){g.p.hp=g.p.maxHp;g.enemies=[];b.G.update(.04);}
 assert.deepEqual([...g.commands.hand],before);
});
