'use strict';
// Deterministic input policies, real engine effects and normal story boundaries.
// This measures mechanics, not player enjoyment or phone performance.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {boot,dialogues,drive,choose}=require('./story-play-sim.cjs'),ROOT=path.resolve(__dirname,'..'),H=Math.hypot;
function step(TG,policy){const g=TG.engine.g;if(g.status==='cards')TG.engine.choose(choose(g),g.offerToken);else{drive(TG,policy);TG.engine.update(.04);}}
function firstCompanion(seed){const TG=boot(seed),G=TG.engine;dialogues(TG);const g=G.startStory();let n=0;while(g.status!=='ended'&&++n<2000)step(TG,'kite');assert(g.won);dialogues(TG);assert.equal(TG.story.state().node,'escort');assert(TG.story.state().companions.includes('mare'));return TG.store.export();}
function command(TG){const G=TG.engine,g=G.g,p=g.p,near=r=>g.enemies.filter(e=>H(e.x-p.x,e.y-p.y)<=r).length,bullets=r=>g.hostile.some(b=>H(b.x-p.x,b.y-p.y)<=r),combo=g.commandEffects.guardWindow>0;
 const priorities={mare_counter:combo?120:0,rize_pulse:combo?115:near(155)>1?90:0,rize_cut:combo?110:near(450)>0?55:0,shared_heal:p.hp<p.maxHp*.72?100:0,mare_rally:p.hp<p.maxHp*.8||g.mare.cooldown>=6?95:0,mare_guard:near(155)&&p.shield<2?75:0,mare_shelter:near(140)&&g.mare.cooldown>0?65:0,rize_frost:near(100)?80:0,rize_flame:near(125)?70:0,shared_magnet:g.drops.filter(d=>H(d.x-p.x,d.y-p.y)<=300).reduce((n,d)=>n+d.value,0)>=4?85:0,shared_push:near(65)||bullets(110)?105:0,shared_dash:g.dash.cooldown>1&&near(120)?60:0};
 const id=[...g.commands.hand].filter(id=>priorities[id]>0&&G.commandInfo(id).enabled).sort((a,b)=>priorities[b]-priorities[a])[0];if(!id||!G.openCommands())return null;assert(G.castCommand(id,g.commands.token));return{id,combo:combo&&['rize_pulse','rize_cut','mare_counter'].includes(id)};
}
function run(seed,checkpoint,policy,deck){const TG=boot(seed+9000),G=TG.engine;TG.store.import(checkpoint);if(deck!=='none')assert(TG.story.setCommandDeck(TG.commandDeck.preset(deck,['mare'])));const before=TG.store.export(),g=G.startCommandTraining();assert(g);let frames=0,nextCommand=0,hits=0,hpDamage=0,combos=0,casts={};const damage=G.damage;G.damage=amount=>{const hp=g.p.hp,hit=damage(amount);if(hit){hits++;hpDamage+=Math.max(0,hp-g.p.hp);}return hit;};
 while(g.status!=='ended'&&++frames<5000){if(deck!=='none'&&g.status==='playing'&&g.time>=nextCommand){nextCommand=g.time+.8;const used=command(TG);if(used){casts[used.id]=(casts[used.id]||0)+1;if(used.combo)combos++;}}step(TG,policy);}
 assert.equal(g.status,'ended');assert.equal(TG.store.export(),before,'training changed progress');return{seed,policy,deck,won:g.won,time:+g.time.toFixed(2),hp:+g.p.hp.toFixed(1),maxHp:g.p.maxHp,kills:g.kills,level:g.level,hits,hpDamage:+hpDamage.toFixed(1),protected:g.mare.protected,commandCasts:g.commands.casts,combos,casts};
}
const rows=[];for(let seed=1;seed<=30;seed++){const checkpoint=firstCompanion(seed);for(const policy of ['kite','novice','idle'])for(const deck of ['none','protect','counter'])rows.push(run(seed,checkpoint,policy,deck));}
fs.mkdirSync(path.join(ROOT,'output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'output','command-play-sim-results.json'),JSON.stringify(rows,null,2));
for(const policy of ['kite','novice','idle'])for(const deck of ['none','protect','counter']){const subset=rows.filter(r=>r.policy===policy&&r.deck===deck),avg=key=>+(subset.reduce((n,r)=>n+r[key],0)/subset.length).toFixed(2);console.log(JSON.stringify({policy,deck,won:subset.filter(r=>r.won).length,total:subset.length,avgHP:avg('hp'),avgHPDamage:avg('hpDamage'),avgKills:avg('kills'),avgCasts:avg('commandCasts'),avgCombos:avg('combos')}));}
console.log('All 270 training runs preserved exact pre-training saves.');
