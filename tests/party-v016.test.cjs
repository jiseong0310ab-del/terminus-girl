'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),plain=x=>JSON.parse(JSON.stringify(x));
function boot(values=new Map()){
 const c={console,Math,Date,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,
 localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v))},
 addEventListener(){},TG:{}};c.window=c;vm.createContext(c);
 for(const file of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),c);
 return {TG:c.TG,S:c.TG.store,A:c.TG.story,G:c.TG.engine,D:c.TG.commandDeck,values};
}
test('six companion roles, four available in first trial, three active with valid 10 card deck',()=>{
 const {TG,S,A,G,D,values}=boot();
 assert.equal(TG.PARTY.length,6);
 assert.equal(TG.PARTY.filter(c=>c.trial).length,4);
 assert.equal(TG.COMMANDS.length,32);
 assert.equal(D.size(['mare']),8);
 assert.equal(D.size(['mare','aster','noa']),10);
 const deck=D.preset('protect',['mare','aster','noa']);
 assert(D.validate(deck,['mare','aster','noa']));
 assert.equal(D.create(deck,123).hand.length,4);
 S.data.story.started=true;S.data.story.node='rest';assert(S.save());
 assert.equal(A.setParty(['mare','mare','noa']),false);
 assert.equal(A.setParty(['mare','iris','noa']),false);
 assert(A.setParty(['mare','aster','noa']));
 assert.deepEqual(plain(A.state().companions),['mare','aster','noa']);
 assert.equal(A.state().version,2);
 assert.equal(A.state().commandDeck.length,10);
 const saved=boot(new Map(values));assert.deepEqual(plain(saved.A.state().companions),['mare','aster','noa']);
 const g=G.startCommandTraining();
 assert(g&&g.mode==='story'&&g.storyTraining);
 assert.equal(g.allies.length,2);assert(g.mare);
 assert.equal(g.commands.hand.length,4);
 G.finish(false,'retreat');
 assert.deepEqual(plain(A.state().companions),['mare','aster','noa']);
});
test('party selections are isolated to the completed story boundary and can exclude Mare',()=>{
 const b=boot();
 assert.equal(b.A.setParty(['aster','noa','vela']),false);
 b.S.data.story.started=true;b.S.data.story.node='rest';assert(b.S.save());
 assert(b.A.setParty(['aster','noa','vela']));
 assert.equal(b.A.state().commandDeck.length,10);
 assert(b.D.validate(b.A.state().commandDeck,['aster','noa','vela']));
 const g=b.G.startCommandTraining();
 assert(g);assert.equal(g.mare,null);assert.equal(g.allies.length,3);
});
