const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers.cjs');
for(const [name,level,before,after] of [['relic shield is preserved',1,2,2],['spent card shield regenerates',2,0,1],['recharge stays within the card cap',1,1,1]])test(name,()=>{const {G}=boot();const g=G.start('quick');g.levels.shield=level;g.relics.push('bell');G.rebuild();g.p.shield=before;g.time=18;g.lastShield=0;G.update(.04);assert.equal(g.p.shield,after);G.update(.04);assert.equal(g.p.shield,after);});
