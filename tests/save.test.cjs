const test=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers.cjs');
const KEY='terminusSaveV1', BACKUP='terminusSaveV1Backup';

test('damaged primary and backup are never overwritten by automatic saves',()=>{
  const primary='{broken', backup='also broken';
  const {S,values}=boot({[KEY]:primary,[BACKUP]:backup});
  assert.equal(S.status,'corrupt');
  S.data.wallet=42;
  assert.equal(S.save(),false);
  assert.equal(S.status,'corrupt');
  assert.equal(values.get(KEY),primary);
  assert.equal(values.get(BACKUP),backup);
  assert.throws(()=>S.import('not JSON'));
  assert.equal(S.save(),false);
  assert.equal(values.get(KEY),primary);
});

test('a validated import unlocks saving after corruption',()=>{
  const clean=boot();
  clean.S.data.wallet=123;
  const exported=clean.S.export();
  const {S,values}=boot({[KEY]:'damaged',[BACKUP]:'damaged too'});
  S.import(exported);
  assert.equal(S.status,'ready');
  assert.equal(S.data.wallet,123);
  assert.equal(S.decode(values.get(KEY)).wallet,123);
  assert.equal(values.get(BACKUP),'damaged too');
});

test('a valid backup restores a damaged primary without replacing the backup',()=>{
  const clean=boot();
  clean.S.data.wallet=77;
  const exported=clean.S.export();
  const {S,values}=boot({[KEY]:'damaged',[BACKUP]:exported});
  assert.equal(S.status,'recovered');
  assert.equal(S.data.wallet,77);
  assert.equal(S.save(),true);
  assert.equal(S.decode(values.get(KEY)).wallet,77);
  assert.equal(values.get(BACKUP),exported);
});

test('a corrupt backup alone cannot be silently replaced',()=>{
  const {S,values}=boot({[BACKUP]:'damaged'});
  assert.equal(S.status,'corrupt');
  assert.equal(S.save(),false);
  assert.equal(values.has(KEY),false);
  assert.equal(values.get(BACKUP),'damaged');
});

test('an unreadable store at startup cannot be overwritten if access later returns',()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
  const source=boot();
  source.S.data.wallet=99;
  const original=source.S.export();
  let available=false;
  const values=new Map([[KEY,original]]);
  const localStorage={getItem(k){if(!available)throw Error('blocked');return values.has(k)?values.get(k):null},setItem(k,v){values.set(k,String(v))}};
  const c={console,Date,Math,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage,TG:{}};
  c.window=c;
  vm.createContext(c);
  for(const file of ['data.js','store.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js',file),'utf8'),c);
  assert.equal(c.TG.store.status,'memory');
  available=true;
  assert.equal(c.TG.store.save(),false);
  assert.equal(values.get(KEY),original);
});

test('a stale tab cannot overwrite a newer save or spend its shards',()=>{
 const first=boot(),stale=boot({},first.values);
 first.S.data.wallet=132;assert.equal(first.S.save(),true);
 stale.S.data.wallet=444;assert.equal(stale.S.save(),false);
 assert.equal(stale.S.status,'conflict');
 assert.equal(stale.S.buy('heart'),false);
 assert.equal(stale.S.settle({id:'run-other',shards:300,kills:0},true),0);
 assert.equal(stale.S.data.stats.runs,0);
 assert.equal(first.S.decode(first.values.get(KEY)).wallet,132);
 assert.equal(first.S.decode(first.values.get(KEY)).stats.runs,0);
});
test('storage events lock the older tab immediately while preserving its export',()=>{
 const first=boot(),second=boot({},first.values);
 second.S.data.wallet=75;let signals=0;
 second.S.onConflict=()=>{signals++};
 first.S.data.wallet=12;first.S.save();
 second.fireStorage({key:BACKUP,newValue:'unused'});
 assert.notEqual(second.S.status,'conflict');
 second.fireStorage({key:KEY,newValue:first.values.get(KEY)});
 assert.equal(second.S.status,'conflict');
 second.fireStorage({key:KEY,newValue:'other'});
 assert.equal(signals,1);
 assert.equal(second.S.save(),false);
 assert.equal(second.S.preview(second.S.export()).wallet,75);
 assert.equal(first.S.decode(first.values.get(KEY)).wallet,12);
});
test('explicit backup import can replace a conflicted snapshot after confirmation',()=>{
 const a=boot(),b=boot({},a.values);
 a.S.data.wallet=91;a.S.save();
 assert.equal(b.S.save(),false);
 const backup=a.S.export();
 assert.equal(b.S.import(backup).wallet,91);
 assert.equal(b.S.status,'ready');
 b.S.data.wallet+=3;assert.equal(b.S.save(),true);
 assert.equal(a.S.save(),false);
 assert.equal(a.S.status,'conflict');
 assert.equal(a.S.decode(a.values.get(KEY)).wallet,94);
});
test('stale chapter start blocked, while repeated same-tab saves succeed',()=>{
 const a=boot(),b=boot({},a.values);
 a.S.data.wallet=17;assert.equal(a.S.save(),true);
 a.S.data.wallet=18;assert.equal(a.S.save(),true);
 assert.throws(()=>b.G.start('chapter'),/기록 저장/);
 assert.equal(b.S.status,'conflict');
 assert.equal(a.S.decode(a.values.get(KEY)).wallet,18);
});

test('pagehide-style repeated saves do not churn backups or require additional writes',()=>{
 const b=boot();b.S.data.wallet=37;
 assert.equal(b.S.save(),true);
 const primary=b.values.get(KEY);
 assert.equal(b.values.has(BACKUP),false);
 b.storage.fail=true; // A redundant save should not need write access.
 assert.equal(b.S.save(),true);
 assert.equal(b.S.status,'ready');
 assert.equal(b.values.get(KEY),primary);
 assert.equal(b.values.has(BACKUP),false);
 b.S.data.wallet=38;
 assert.equal(b.S.save(),false);
 assert.equal(b.S.status,'memory');
 assert.equal(b.values.get(KEY),primary);
});
