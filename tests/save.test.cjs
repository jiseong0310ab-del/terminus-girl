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
