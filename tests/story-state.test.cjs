'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),KEY='terminusSaveV1',BACKUP='terminusSaveV1Backup',plain=value=>JSON.parse(JSON.stringify(value));
function asSchema1(encoded){const env=JSON.parse(encoded);env.schema=1;return JSON.stringify(env);}
function boot(seed={},shared){
 const values=shared||new Map(Object.entries(seed)),storage={fail:false,getItem:k=>values.get(k)||null,setItem(k,v){if(this.fail)throw Error('quota');values.set(k,String(v));}};
 const c={console,Date,Math,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:storage,addEventListener(){}};c.window=c;c.TG={};vm.createContext(c);
 for(const name of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',name+'.js'),'utf8'),c,{filename:name+'.js'});
 return {c,TG:c.TG,A:c.TG.story,S:c.TG.store,G:c.TG.engine,storage,values};
}
function finishScene(A){const id=A.state().node;while(A.state().node===id){const s=A.state();assert(A.advance(s.node,s.line));}}
function approach(b){assert(b.A.begin());finishScene(b.A);finishScene(b.A);assert.equal(b.A.state().node,'approach');return b.A.prepareBattle();}
function win(spec,extra={}){return {id:spec.id,mode:'story',storyBattle:spec.battleId,won:true,p:{hp:55},levels:{blade:1},level:2,xp:3,kills:10,totalTime:45,relics:[],...extra};}
function legacy(data){const out=plain(data);delete out.story;return out;}

test('old saves add an untouched story while preserving legacy wallet, checkpoint and records',()=>{
 const source=boot();source.G.start();const old=plain(source.S.data);old.wallet=42;old.stats.runs=7;old.memories=['arrival','mirror'];delete old.story;
 const b=boot({[KEY]:asSchema1(source.S.encode(old))});assert.equal(b.S.status,'ready');assert.deepEqual(legacy(b.S.data),legacy(old));assert.equal(b.A.state().started,false);assert.equal(b.A.state().node,'departure');assert.deepEqual(plain(b.A.state().companions),[]);
 assert(b.A.begin());assert.equal(b.S.data.checkpoint.id,old.checkpoint.id);assert.equal(b.S.data.wallet,42);assert.equal(b.S.data.stats.runs,7);
});

test('the R1 story reaches two battles, one companion and the train without legacy rewards',()=>{
 const b=boot(),before=legacy(b.S.data),first=approach(b);assert.equal(first.battleId,'approach');assert.deepEqual(plain(first.companions),[]);assert.equal(b.TG.STORY.battles.approach.duration,60);
 assert(b.A.completeBattle(win(first)));assert.equal(b.A.state().node,'meeting');assert.deepEqual(plain(b.A.state().seen),['departure','arrival']);finishScene(b.A);
 const second=b.A.prepareBattle();assert.equal(second.battleId,'escort');assert.deepEqual(plain(second.companions),['mare']);assert.equal(second.loadout.hp,95);assert.equal(second.loadout.levels.blade,1);assert.equal(b.TG.STORY.battles.escort.duration,75);
 assert(b.A.completeBattle(win(second,{p:{hp:77},totalTime:120})));assert.equal(b.A.state().node,'debrief');finishScene(b.A);assert.equal(b.A.state().node,'rest');assert.equal(b.A.state().completed,true);assert.equal(b.A.prepareBattle(),null);assert.deepEqual(legacy(b.S.data),before);
});

test('dialogue advances are token-checked and current line persists after reopening',()=>{
 let b=boot();assert.equal(b.A.advance('departure',0),false);assert(b.A.begin());assert(b.A.advance('departure',0));const after=b.S.export();assert.equal(b.A.advance('departure',0),false);assert.equal(b.A.advance('arrival',1),false);assert.equal(b.S.export(),after);
 b=boot(Object.fromEntries(b.values));assert.equal(b.A.state().node,'departure');assert.equal(b.A.state().line,1);assert(b.A.advance('departure',1));assert.equal(b.A.state().line,2);
});

test('battle preparation is read-only, returns copies and retries reuse the boundary loadout',()=>{
 const b=boot(),first=approach(b),before=b.S.export();first.loadout.hp=1;first.loadout.levels.blade=6;first.companions.push('mare');
 for(let i=0;i<3;i++){const retry=b.A.prepareBattle();assert.equal(retry.id,first.id);assert.equal(retry.loadout.hp,100);assert.equal(retry.loadout.levels.blade,undefined);assert.deepEqual(plain(retry.companions),[]);}
 assert.equal(b.S.export(),before);assert.equal(b.A.completeBattle(win(first,{won:false})),false);assert.equal(b.S.export(),before);
});

test('wrong, stale, dead, practice and duplicate battle completions cannot advance or pay',()=>{
 const b=boot(),first=approach(b),before=b.S.export();
 for(const extra of [{id:'story-foreign'},{mode:'quick'},{storyBattle:'escort'},{won:false},{p:{hp:0}},{p:{hp:Infinity}}])assert.equal(b.A.completeBattle(win(first,extra)),false);
 assert.equal(b.A.completeBattle(null),false);assert.equal(b.S.export(),before);assert(b.A.completeBattle(win(first)));const after=b.S.export();assert.equal(b.A.completeBattle(win(first)),false);assert.equal(b.S.export(),after);assert.equal(b.S.data.wallet,0);assert.equal(b.S.data.history.length,0);assert.equal(b.S.data.stats.runs,0);assert.equal(b.S.data.memories.length,0);
});

test('quota failure rolls back line, battle completion, companion and one-time joining recovery',()=>{
 const b=boot();b.storage.fail=true;const initial=plain(b.A.state());assert.equal(b.A.begin(),false);assert.deepEqual(plain(b.A.state()),initial);assert.equal(b.S.status,'memory');b.storage.fail=false;
 const first=approach(b),before=plain(b.A.state());b.storage.fail=true;assert.equal(b.A.completeBattle(win(first)),false);assert.deepEqual(plain(b.A.state()),before);assert.equal(b.A.prepareBattle().id,first.id);b.storage.fail=false;assert(b.A.completeBattle(win(first,{p:{hp:10}})));
 for(let i=0;i<3;i++){const s=b.A.state();assert(b.A.advance(s.node,s.line));}assert.equal(b.A.state().line,3);const meeting=plain(b.A.state());b.storage.fail=true;assert.equal(b.A.advance('meeting',3),false);assert.deepEqual(plain(b.A.state()),meeting);assert.equal(b.A.state().loadout.hp,10);b.storage.fail=false;
 assert(b.A.advance('meeting',3));assert.equal(b.A.state().loadout.hp,50);assert.deepEqual(plain(b.A.state().companions),['mare']);const after=b.S.export();assert.equal(b.A.advance('meeting',3),false);assert.equal(b.S.export(),after);assert.equal(b.A.state().loadout.hp,50);
});

test('story backup and battle checkpoint survive import and reopening alongside a legacy camp',()=>{
 const b=boot();b.G.start();b.G.stageClear();const cp=plain(b.S.data.checkpoint),first=approach(b);assert(b.A.completeBattle(win(first)));finishScene(b.A);const spec=b.A.prepareBattle(),exported=b.S.export();
 const restored=boot();restored.S.import(exported);const reopened=boot(Object.fromEntries(restored.values));assert.deepEqual(plain(reopened.S.data.checkpoint),cp);assert.equal(reopened.A.prepareBattle().id,spec.id);assert.equal(reopened.A.state().loadout.hp,95);assert.deepEqual(plain(reopened.A.state().companions),['mare']);assert.equal(reopened.S.data.wallet,b.S.data.wallet);
});

test('normalization validates the story version and position, filters loadout and derives ownership',()=>{
 const b=boot();let data=b.S.fresh();data.story.node='departure';data.story.line=999;data.story.companions=['mare','foreign'];data.story.seen=['debrief'];data.story.completed=true;data.story.loadout={hp:999,level:999,xp:-2,kills:Infinity,totalTime:-20,levels:{blade:999,foreign:1},relics:['bell','bell','foreign']};
 let next=b.S.normal(data).story;assert.equal(next.line,3);assert.equal(next.loadout.hp,500);assert.equal(next.loadout.level,80);assert.equal(next.loadout.levels.blade,6);assert.equal(next.loadout.levels.foreign,undefined);assert.equal(next.loadout.xp,0);assert.equal(next.loadout.kills,0);assert.equal(next.loadout.totalTime,0);assert.deepEqual(plain(next.loadout.relics),['bell']);assert.deepEqual(plain(next.companions),[]);assert.deepEqual(plain(next.seen),[]);assert.equal(next.completed,false);
 data.story.node='escort';data.story.encounterId='story-normal';data.story.companions=[];next=b.S.normal(data).story;assert.deepEqual(plain(next.companions),['mare']);assert.equal(next.line,0);assert.equal(next.completed,false);
 for(const bad of [null,[],{version:5,node:'departure'},{version:1,node:'foreign'},{version:1,node:'approach',encounterId:'run-wrong'}]){data=b.S.fresh();data.story=bad;assert.throws(()=>b.S.normal(data),/이야기/);}
});

test('a future story primary is preserved and blocked rather than silently reset',()=>{
 const b=boot(),data=b.S.fresh();data.story.version=5;const raw=b.S.encode(data),loaded=boot({[KEY]:raw});assert.equal(loaded.S.status,'corrupt');assert.equal(loaded.S.save(),false);assert.equal(loaded.values.get(KEY),raw);assert.equal(loaded.A.begin(),false);
});

test('a stale tab cannot advance a scene over another tab or replace its legacy progress',()=>{
 const a=boot(),b=boot({},a.values);assert(a.A.begin());assert(a.A.advance('departure',0));const actual=a.values.get(KEY);assert.equal(b.A.begin(),false);assert.equal(b.S.status,'conflict');assert.equal(b.A.state().started,false);assert.equal(b.A.advance('departure',0),false);assert.equal(a.values.get(KEY),actual);
});

test('schema 1 imports stay readable while all new exports use schema 3 and schema 4 is rejected',()=>{
 const source=boot(),data=source.S.fresh();data.wallet=42;delete data.story;const old=asSchema1(source.S.encode(data)),b=boot();
 assert.equal(b.S.preview(old).wallet,42);b.S.import(old);assert.equal(b.S.data.wallet,42);assert.equal(JSON.parse(b.S.export()).schema,3);assert.equal(JSON.parse(b.values.get(KEY)).schema,3);assert.equal(JSON.parse(b.values.get(BACKUP)).schema,3);
 const future=JSON.parse(b.S.export());future.schema=4;assert.throws(()=>b.S.preview(JSON.stringify(future)),/저장 버전/);
});

test('schema migration writes an upgraded last-good backup before the story primary',()=>{
 const source=boot(),data=source.S.fresh();data.wallet=42;delete data.story;const original=asSchema1(source.S.encode(data)),b=boot({[KEY]:original,[BACKUP]:original}),writes=[],write=b.storage.setItem.bind(b.storage);
 b.storage.setItem=(key,value)=>{writes.push(key);write(key,value);};assert(b.A.begin());assert.deepEqual(writes,[BACKUP,KEY]);assert.equal(JSON.parse(b.values.get(KEY)).schema,3);assert.equal(JSON.parse(b.values.get(BACKUP)).schema,3);assert.equal(b.S.decode(b.values.get(BACKUP)).wallet,42);assert.equal(b.S.decode(b.values.get(BACKUP)).story.started,false);assert.equal(b.S.decode(b.values.get(KEY)).story.started,true);
 const legacyReader=raw=>{const env=JSON.parse(raw);if(env.schema!==1)throw Error('unsupported');return env.data;};assert.throws(()=>legacyReader(b.values.get(KEY)),/unsupported/);assert.throws(()=>legacyReader(b.values.get(BACKUP)),/unsupported/);
});

test('failed migration backup cannot change the primary or advance the story in memory',()=>{
 const source=boot(),data=source.S.fresh();delete data.story;const original=asSchema1(source.S.encode(data)),b=boot({[KEY]:original,[BACKUP]:original}),write=b.storage.setItem.bind(b.storage),writes=[];
 b.storage.setItem=(key,value)=>{writes.push(key);if(key===BACKUP)throw Error('backup quota');write(key,value);};assert.equal(b.A.begin(),false);assert.equal(b.A.state().started,false);assert.equal(b.S.status,'memory');assert.equal(b.values.get(KEY),original);assert.equal(b.values.get(BACKUP),original);assert.deepEqual(writes,[BACKUP]);
 b.storage.setItem=write;assert(b.A.begin());assert.equal(JSON.parse(b.values.get(KEY)).schema,3);assert.equal(JSON.parse(b.values.get(BACKUP)).schema,3);
});

test('unchanged schema 3 primary upgrades schema 1 backup once without churning snapshots',()=>{
 const source=boot(),current=source.S.fresh(),previous=source.S.fresh();current.wallet=42;previous.wallet=31;const primary=source.S.encode(current),backup=asSchema1(source.S.encode(previous)),b=boot({[KEY]:primary,[BACKUP]:backup}),writes=[],write=b.storage.setItem.bind(b.storage);
 b.storage.setItem=(key,value)=>{writes.push(key);write(key,value);};assert(b.S.save());assert.deepEqual(writes,[BACKUP]);assert.equal(b.values.get(KEY),primary);assert.equal(JSON.parse(b.values.get(BACKUP)).schema,3);assert.equal(b.S.decode(b.values.get(BACKUP)).wallet,31);
 const safe=b.values.get(BACKUP);b.storage.fail=true;writes.length=0;assert(b.S.save());assert.deepEqual(writes,[]);assert.equal(b.values.get(BACKUP),safe);
});

test('missing backup is secured even for an unchanged schema 3 primary',()=>{
 const source=boot(),primary=source.S.export(),b=boot({[KEY]:primary}),writes=[],write=b.storage.setItem.bind(b.storage);b.storage.setItem=(key,value)=>{writes.push(key);write(key,value);};assert(b.S.save());assert.deepEqual(writes,[BACKUP]);assert.equal(b.values.get(KEY),primary);assert.equal(b.values.get(BACKUP),primary);
});

test('primary failure after backup migration keeps the old primary and rolls back story progress',()=>{
 const source=boot(),data=source.S.fresh();delete data.story;const original=asSchema1(source.S.encode(data)),b=boot({[KEY]:original,[BACKUP]:original}),write=b.storage.setItem.bind(b.storage);
 b.storage.setItem=(key,value)=>{if(key===KEY)throw Error('primary quota');write(key,value);};assert.equal(b.A.begin(),false);assert.equal(b.A.state().started,false);assert.equal(b.values.get(KEY),original);assert.equal(JSON.parse(b.values.get(BACKUP)).schema,3);assert.equal(b.S.decode(b.values.get(BACKUP)).story.started,false);
 b.storage.setItem=write;assert(b.A.begin());assert.equal(b.S.decode(b.values.get(KEY)).story.started,true);assert.equal(b.S.decode(b.values.get(BACKUP)).story.started,false);
});

test('a changed primary during backup securing is detected before any overwrite',()=>{
 const source=boot(),primary=source.S.export(),foreign=source.S.fresh();foreign.wallet=71;const changed=source.S.encode(foreign),b=boot({[KEY]:primary}),write=b.storage.setItem.bind(b.storage);
 b.storage.setItem=(key,value)=>{write(key,value);if(key===BACKUP)b.values.set(KEY,changed);};assert.equal(b.A.begin(),false);assert.equal(b.S.status,'conflict');assert.equal(b.A.state().started,false);assert.equal(b.values.get(KEY),changed);assert.equal(b.S.decode(b.values.get(KEY)).wallet,71);
});
