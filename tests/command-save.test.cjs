'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),KEY='terminusSaveV1',BACKUP='terminusSaveV1Backup',plain=value=>JSON.parse(JSON.stringify(value));
function boot(seed={},shared){
 const values=shared||new Map(Object.entries(seed)),storage={fail:false,getItem:k=>values.get(k)||null,setItem(k,v){if(this.fail)throw Error('quota');values.set(k,String(v));}},math=Object.create(Math);let randomCalls=0;
 math.random=()=>{randomCalls++;return .42;};
 const c={console,Date,Math:math,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage,addEventListener(){}};c.window=c;c.TG={};vm.createContext(c);
 for(const name of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',name+'.js'),'utf8'),c,{filename:name+'.js'});
 return {c,TG:c.TG,A:c.TG.story,S:c.TG.store,G:c.TG.engine,storage,values,randomCalls:()=>randomCalls};
}
function finishScene(A){const id=A.state().node;while(A.state().node===id){const s=A.state();assert(A.advance(s.node,s.line));}}
function approach(b){assert(b.A.begin());finishScene(b.A);finishScene(b.A);return b.A.prepareBattle();}
function win(spec,extra={}){return {id:spec.id,mode:'story',storyBattle:spec.battleId,won:true,p:{hp:55},levels:{blade:1},level:2,xp:3,kills:10,totalTime:45,relics:[],...extra};}
function escort(b){const first=approach(b);assert(b.A.completeBattle(win(first)));finishScene(b.A);return b.A.prepareBattle();}
function rest(b){const second=escort(b);assert(b.A.completeBattle(win(second)));finishScene(b.A);assert.equal(b.A.state().node,'rest');}
function oldSave(S,data,schema){const raw=plain(data);if(raw.story){delete raw.story.commandDeck;delete raw.story.commandSeed;}const env=JSON.parse(S.encode(raw));env.schema=schema;return JSON.stringify(env);}

test('command deck defaults, ownership and presets survive story normalization',()=>{
 const b=boot(),D=b.TG.commandDeck,initial=b.A.state();assert(D.validate(initial.commandDeck,[]));assert.deepEqual(plain(initial.commandDeck),plain(D.preset('solo',[])));assert.equal(initial.commandSeed,D.seedFor('departure'));assert.equal(b.randomCalls(),0);
 const invalid=[null,[],initial.commandDeck.slice(1),[...initial.commandDeck,initial.commandDeck[0]],initial.commandDeck.map((id,i)=>i===0?'foreign':id),initial.commandDeck.map((id,i)=>i===0?'mare_guard':id)];
 for(const ids of invalid){const data=b.S.fresh();data.story.commandDeck=ids;data.story.companions=['mare'];assert.deepEqual(plain(b.S.normal(data).story.commandDeck),plain(D.preset('solo',[])));}
 const data=b.S.fresh();data.story.node='escort';data.story.encounterId='story-derived';data.story.companions=[];delete data.story.commandDeck;delete data.story.commandSeed;
 const joined=b.S.normal(data).story;assert.deepEqual(plain(joined.companions),['mare']);assert.deepEqual(plain(joined.commandDeck),plain(D.preset('protect',['mare'])));assert.equal(joined.commandSeed,D.seedFor('story-derived'));
 data.story.commandDeck=D.preset('counter',['mare']);data.story.commandSeed=0;const counter=b.S.normal(data).story;assert.deepEqual(plain(counter.commandDeck),plain(data.story.commandDeck));assert.notEqual(counter.commandDeck,data.story.commandDeck);assert.equal(counter.commandSeed,0);
 for(const seed of [-1,1.5,Infinity,0x100000000,'42',null]){data.story.commandSeed=seed;assert.equal(b.S.normal(data).story.commandSeed,D.seedFor('story-derived'));}
});

test('joining Mare selects the protection deck once and creates the encounter seed once',()=>{
 const b=boot(),first=approach(b),D=b.TG.commandDeck;assert.equal(first.commandSeed,D.seedFor(first.id));assert.deepEqual(plain(first.commandDeck),plain(D.preset('solo',[])));assert(b.A.completeBattle(win(first)));
 assert.equal(b.A.setCommandDeck(D.preset('solo',[])),false);finishScene(b.A);const second=b.A.prepareBattle();assert.equal(second.commandSeed,D.seedFor(second.id));assert.deepEqual(plain(second.commandDeck),plain(D.preset('protect',['mare'])));
 assert(b.A.setCommandDeck(D.preset('counter',['mare'])));const saved=b.S.export(),calls=b.randomCalls();assert.equal(b.A.advance('meeting',3),false);for(let i=0;i<4;i++)assert.equal(b.A.prepareBattle().commandSeed,second.commandSeed);assert.equal(b.S.export(),saved);assert.equal(b.randomCalls(),calls);
});

test('deck editing at battle and rest is transactional and preserves every other saved field',()=>{
 const b=boot(),D=b.TG.commandDeck;assert.equal(b.A.setCommandDeck(D.preset('solo',[])),false);escort(b);b.S.data.wallet=42;b.S.data.stats.runs=7;b.S.data.memories=['arrival'];assert(b.S.save());
 const before=plain(b.S.data),deck=D.preset('counter',['mare']);assert(b.A.setCommandDeck(deck));deck[0]='foreign';const expected=plain(before);expected.story.commandDeck=plain(D.preset('counter',['mare']));assert.deepEqual(plain(b.S.data),expected);
 const second=b.A.prepareBattle();assert(b.A.completeBattle(win(second)));assert.equal(b.A.setCommandDeck(D.preset('protect',['mare'])),false);finishScene(b.A);assert(b.A.setCommandDeck(D.preset('protect',['mare'])));assert.equal(b.A.state().node,'rest');assert.equal(b.A.state().completed,true);
});

test('invalid, duplicate, foreign and locked companion cards never replace a saved deck',()=>{
 const b=boot(),D=b.TG.commandDeck;approach(b);let snapshot=b.S.export(),solo=D.preset('solo',[]);
 for(const ids of [null,[],solo.slice(1),[...solo,solo[0]],solo.map((id,i)=>i===1?solo[0]:id),solo.map((id,i)=>i===0?'foreign':id),solo.map((id,i)=>i===0?'mare_guard':id)]){assert.equal(b.A.setCommandDeck(ids),false);assert.equal(b.S.export(),snapshot);}
 assert(b.A.completeBattle(win(b.A.prepareBattle())));finishScene(b.A);snapshot=b.S.export();assert.equal(b.A.setCommandDeck(solo),false);assert.equal(b.S.export(),snapshot);
});

test('active fights and overlays cannot edit decks or prepare training; ended fights can',()=>{
 const b=boot(),D=b.TG.commandDeck;escort(b);const before=b.S.export();
 for(const status of ['playing','cards','paused','command','camp']){b.G.g={status};assert.equal(b.A.setCommandDeck(D.preset('counter',['mare'])),false);assert.equal(b.A.prepareTraining(),null);assert.equal(b.S.export(),before);}
 b.G.g={status:'ended'};assert(b.A.setCommandDeck(D.preset('counter',['mare'])));assert(b.A.prepareTraining());
});

test('failed writes and stale tabs roll back a deck edit without touching the story boundary',()=>{
 const b=boot(),D=b.TG.commandDeck;escort(b);const before=plain(b.S.data),raw=b.values.get(KEY);b.storage.fail=true;assert.equal(b.A.setCommandDeck(D.preset('counter',['mare'])),false);assert.deepEqual(plain(b.S.data),before);assert.equal(b.values.get(KEY),raw);b.storage.fail=false;
 const other=boot({},b.values);assert(b.A.setCommandDeck(D.preset('counter',['mare'])));const persisted=b.values.get(KEY),stale=plain(other.S.data);assert.equal(other.A.setCommandDeck(D.preset('counter',['mare'])),false);assert.equal(other.S.status,'conflict');assert.deepEqual(plain(other.S.data),stale);assert.equal(b.values.get(KEY),persisted);assert.equal(other.A.prepareTraining(),null);
});

test('battle copies, import and reopening preserve a custom deck and deterministic retry seed',()=>{
 const b=boot(),D=b.TG.commandDeck;escort(b);assert(b.A.setCommandDeck(D.preset('counter',['mare'])));const original=b.A.prepareBattle(),saved=b.S.export(),calls=b.randomCalls();
 const copy=b.A.prepareBattle();copy.commandDeck.reverse();copy.companions.length=0;copy.loadout.hp=1;copy.loadout.levels.blade=6;assert.deepEqual(plain(b.A.prepareBattle()),plain(original));assert.equal(b.S.export(),saved);assert.equal(b.randomCalls(),calls);
 const imported=boot();imported.S.import(saved);const reopened=boot(Object.fromEntries(imported.values));assert.deepEqual(plain(reopened.A.prepareBattle()),plain(original));assert.equal(reopened.randomCalls(),0);assert.equal(JSON.parse(reopened.S.export()).schema,3);
});

test('training prepares read-only copies and cannot advance even with a forged encounter token',()=>{
 const b=boot();assert.equal(b.A.prepareTraining(),null);escort(b);const before=b.S.export(),calls=b.randomCalls(),spec=b.A.prepareTraining();assert.equal(spec.battleId,'escort');assert.equal(spec.duration,90);assert.match(spec.id,/^training-/);assert.deepEqual(plain(spec.commandDeck),plain(b.A.state().commandDeck));assert.equal(spec.commandSeed,b.A.state().commandSeed);
 spec.commandDeck.reverse();spec.loadout.hp=1;spec.companions.length=0;const again=b.A.prepareTraining();assert.notEqual(again.loadout.hp,1);assert.deepEqual(plain(again.companions),['mare']);assert.deepEqual(plain(again.commandDeck),plain(b.A.state().commandDeck));assert.equal(b.A.completeBattle(win(b.A.prepareBattle(),{storyTraining:true})),false);assert.equal(b.S.export(),before);assert.equal(b.randomCalls(),calls);
 const reopened=boot(Object.fromEntries(b.values));assert.deepEqual(plain(reopened.A.prepareTraining()),plain(again));
});

for(const schema of [1,2])test('actual schema '+schema+' story migrates decks and seeds while securing both schema 3 snapshots',()=>{
 const source=boot();source.G.start();source.G.g.status='ended';escort(source);source.S.data.wallet=42;source.S.data.stats.runs=7;assert(source.S.save());const data=plain(source.S.data),old=oldSave(source.S,data,schema),b=boot({[KEY]:old,[BACKUP]:old}),writes=[],write=b.storage.setItem.bind(b.storage);
 assert.equal(b.S.status,'ready');assert.equal(b.randomCalls(),0);assert.equal(b.A.state().commandSeed,b.TG.commandDeck.seedFor(data.story.encounterId));assert.deepEqual(plain(b.A.state().commandDeck),plain(b.TG.commandDeck.preset('protect',['mare'])));assert.deepEqual(plain(b.S.data.checkpoint),plain(data.checkpoint));
 b.storage.setItem=(key,value)=>{writes.push(key);write(key,value);};assert(b.A.setCommandDeck(b.TG.commandDeck.preset('counter',['mare'])));assert.deepEqual(writes,[BACKUP,KEY]);
 for(const key of [KEY,BACKUP]){assert.equal(JSON.parse(b.values.get(key)).schema,3);const saved=b.S.decode(b.values.get(key));assert.equal(saved.wallet,42);assert.equal(saved.stats.runs,7);assert.deepEqual(plain(saved.checkpoint),plain(data.checkpoint));assert.equal(saved.story.commandSeed,b.TG.commandDeck.seedFor(data.story.encounterId));}
 assert.deepEqual(plain(b.S.decode(b.values.get(BACKUP)).story.commandDeck),plain(b.TG.commandDeck.preset('protect',['mare'])));assert.deepEqual(plain(b.S.decode(b.values.get(KEY)).story.commandDeck),plain(b.TG.commandDeck.preset('counter',['mare'])));
});

test('failed schema 2 backup upgrade blocks the schema 3 primary and rolls back the deck',()=>{
 const source=boot();escort(source);const old=oldSave(source.S,source.S.data,2),b=boot({[KEY]:old,[BACKUP]:old}),before=plain(b.S.data),write=b.storage.setItem.bind(b.storage),writes=[];
 b.storage.setItem=(key,value)=>{writes.push(key);if(key===BACKUP)throw Error('quota');write(key,value);};assert.equal(b.A.setCommandDeck(b.TG.commandDeck.preset('counter',['mare'])),false);assert.deepEqual(plain(b.S.data),before);assert.equal(b.values.get(KEY),old);assert.equal(b.values.get(BACKUP),old);assert.deepEqual(writes,[BACKUP]);
 b.storage.setItem=write;assert(b.A.setCommandDeck(b.TG.commandDeck.preset('counter',['mare'])));assert.equal(JSON.parse(b.values.get(KEY)).schema,3);assert.equal(JSON.parse(b.values.get(BACKUP)).schema,3);
});

test('unchanged schema 3 upgrades a schema 2 backup once and rejects future envelopes',()=>{
 const source=boot();rest(source);const primary=source.S.export(),old=oldSave(source.S,source.S.data,2),b=boot({[KEY]:primary,[BACKUP]:old}),writes=[],write=b.storage.setItem.bind(b.storage);b.storage.setItem=(key,value)=>{writes.push(key);write(key,value);};
 assert(b.S.save());assert.deepEqual(writes,[BACKUP]);assert.equal(b.values.get(KEY),primary);assert.equal(JSON.parse(b.values.get(BACKUP)).schema,3);writes.length=0;b.storage.fail=true;assert(b.S.save());assert.deepEqual(writes,[]);
 const future=JSON.parse(primary);future.schema=4;assert.throws(()=>b.S.preview(JSON.stringify(future)),/저장 버전/);const raw=JSON.stringify(future),blocked=boot({[KEY]:raw,[BACKUP]:raw});assert.equal(blocked.S.status,'corrupt');assert.equal(blocked.S.save(),false);assert.equal(blocked.values.get(KEY),raw);
});
