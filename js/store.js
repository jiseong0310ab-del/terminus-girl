'use strict';
(()=>{
const KEY='terminusSaveV1',BACKUP='terminusSaveV1Backup',S=TG.store={status:'ready'};
const integer=(v,max=1e7)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
const arr=(v,allowed,max=64)=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'&&(!allowed||allowed.includes(x))))].slice(-max):[];
const clone=o=>JSON.parse(JSON.stringify(o));
function fresh(){return{wallet:0,upgrades:{heart:0,lamp:0,map:0},stats:{runs:0,wins:0,bestKills:0,totalShards:0},memories:[],unlocked:0,settled:[],history:[],journalBest:{maxSynergies:0,maxRelics:0,farthestStage:0},checkpoint:null,settings:{bgm:.18,sfx:.35,reduceFX:false,quality:'auto'}};}
const validRunId=id=>typeof id==='string'&&/^run-[\w-]{1,80}$/.test(id);
function buildLevels(raw){const levels={};for(const card of TG.CARDS)levels[card.id]=integer(raw?.[card.id],card.cap);return levels;}
function buildSynergies(levels){return TG.SYNERGIES.filter(s=>Object.entries(s.needs).every(([id,n])=>levels[id]>=n)).map(s=>s.id);}
function journalEntry(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!validRunId(raw.id))return null;
 const levels=buildLevels(raw.levels),won=raw.won===true,stage=integer(raw.stage,2),reason=won?'ending':['death','timeout','retreat'].includes(raw.reason)?raw.reason:'retreat';
 return{id:raw.id,stage,clearedStages:won?3:Math.max(stage,integer(raw.clearedStages,Math.min(3,stage+1))),reason,won,kills:integer(raw.kills,1e5),totalTime:Number.isFinite(raw.totalTime)?Math.max(0,Math.min(1e6,raw.totalTime)):0,reward:integer(raw.reward),level:Math.max(1,integer(raw.level,80)),levels,relics:arr(raw.relics,TG.RELICS.map(r=>r.id),6),synergies:buildSynergies(levels),at:integer(raw.at,4102444800000)};
}
function progress(data){const best=data.journalBest,values={firstReturn:data.stats.runs,mirrorClear:best.farthestStage,dualSynergy:best.maxSynergies,relicCollector:best.maxRelics,hundredKills:data.stats.bestKills,chapterClear:data.stats.wins};return TG.CHALLENGES.map(goal=>({...goal,current:Math.min(goal.target,values[goal.id]||0),complete:(values[goal.id]||0)>=goal.target}));}
function normal(raw){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('저장 형식이 올바르지 않습니다.');let out=fresh();out.wallet=integer(raw.wallet);for(const k of Object.keys(out.upgrades))out.upgrades[k]=integer(raw.upgrades?.[k],5);for(const k of Object.keys(out.stats))out.stats[k]=integer(raw.stats?.[k]);out.memories=arr(raw.memories,TG.MEMORIES.map(m=>m.id),6);out.unlocked=integer(raw.unlocked,2);out.settled=arr(raw.settled,null,64).filter(x=>/^[\w-]{1,100}$/.test(x));for(const k of ['bgm','sfx'])if(Number.isFinite(raw.settings?.[k]))out.settings[k]=Math.max(0,Math.min(1,raw.settings[k]));out.settings.reduceFX=raw.settings?.reduceFX===true;out.settings.quality=raw.settings?.quality==='low'?'low':'auto';
 const ids=new Set();for(const rawEntry of (Array.isArray(raw.history)?raw.history.slice(0,10):[])){const entry=journalEntry(rawEntry);if(entry&&!ids.has(entry.id)){out.history.push(entry);ids.add(entry.id);}}
 out.journalBest={maxSynergies:integer(raw.journalBest?.maxSynergies,TG.SYNERGIES.length),maxRelics:integer(raw.journalBest?.maxRelics,TG.RELICS.length),farthestStage:Math.max(integer(raw.journalBest?.farthestStage,3),out.unlocked,out.stats.wins>0?3:0)};
 for(const entry of out.history){out.journalBest.maxSynergies=Math.max(out.journalBest.maxSynergies,entry.synergies.length);out.journalBest.maxRelics=Math.max(out.journalBest.maxRelics,entry.relics.length);out.journalBest.farthestStage=Math.max(out.journalBest.farthestStage,entry.clearedStages);}
 if(raw.checkpoint){const c=raw.checkpoint;if(typeof c!=='object'||!/^run-[\w-]{1,80}$/.test(c.id||'')||!['stage','camp'].includes(c.phase)||!Number.isInteger(c.stage)||c.stage<0||c.stage>2)throw Error('진행 중 탐험 데이터가 올바르지 않습니다.');if(!out.settled.includes(c.id)){const levels={};for(const card of TG.CARDS)levels[card.id]=integer(c.levels?.[card.id],card.cap);out.checkpoint={id:c.id,phase:c.phase,stage:c.stage,mode:c.mode==='quick'?'quick':c.mode==='single'?'single':'chapter',duration:c.mode==='quick'?90:c.mode==='single'?300:TG.STAGES[c.stage].duration,hp:Number.isFinite(c.hp)?Math.max(0.01,Math.min(500,c.hp)):1,levels,relics:arr(c.relics,TG.RELICS.map(r=>r.id),6),xp:Number.isFinite(c.xp)?Math.max(0,Math.min(1e5,c.xp)):0,level:Math.max(1,integer(c.level,80)),shards:integer(c.shards,1e5),kills:integer(c.kills,1e5),totalTime:integer(c.totalTime,1e6),erase:integer(c.erase,100),event:integer(c.event,5),eventDone:c.eventDone===true,bonusCards:integer(c.bonusCards,5),bossOffers:[],bossReward:'legacy'};
 const cp=out.checkpoint;if(Object.prototype.hasOwnProperty.call(c,'bossOffers')||Object.prototype.hasOwnProperty.call(c,'bossReward')){
  cp.bossOffers=arr(c.bossOffers,TG.BOSS_REWARDS.map(r=>r.id),3);
  if(c.phase==='camp'&&c.stage<2){if(c.bossReward==='legacy'&&cp.bossOffers.length===0)cp.bossReward='legacy';else{if(cp.bossOffers.length!==TG.BOSS_REWARDS.length||!(c.bossReward===null||cp.bossOffers.includes(c.bossReward)))throw Error('관리자 보상 기록이 올바르지 않습니다.');cp.bossReward=c.bossReward;}}
  else{cp.bossOffers=[];cp.bossReward=null;}
 }}}
 return out;
}
function checksum(s){let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619)}return(n>>>0).toString(16);}
function encode(data){const body=JSON.stringify(data);return JSON.stringify({schema:1,checksum:checksum(body),data});}
function decode(text){if(typeof text!=='string'||text.length>256000)throw Error('백업 파일이 너무 크거나 읽을 수 없습니다.');let env;try{env=JSON.parse(text)}catch{throw Error('백업 JSON을 읽을 수 없습니다.')}if(!env||typeof env!=='object'||Array.isArray(env))throw Error('백업 형식이 올바르지 않습니다.');if(env.schema!==1)throw Error('지원하지 않는 저장 버전입니다.');if(!env.data||typeof env.data!=='object'||Array.isArray(env.data))throw Error('백업 내용이 올바르지 않습니다.');if(checksum(JSON.stringify(env.data))!==env.checksum)throw Error('저장 데이터가 손상되었습니다.');return normal(env.data);}
S.data=fresh();
let existing=false,writeLocked=false,seenRaw=null;
function markConflict(){
 if(S.status==='conflict')return;
 writeLocked=true;S.status='conflict';S.onConflict?.();
}
S.canWrite=function(){
 if(writeLocked)return false;
 try{if(localStorage.getItem(KEY)!==seenRaw){markConflict();return false;}return true;}
 catch{S.status='memory';return false;}
};
if(typeof addEventListener==='function')addEventListener('storage',event=>{
 if(event.storageArea&&event.storageArea!==localStorage)return;
 if(event.key===null||(event.key===KEY&&event.newValue!==seenRaw))markConflict();
});
try{for(const key of [KEY,BACKUP]){const raw=localStorage.getItem(key);if(key===KEY)seenRaw=raw;if(raw===null)continue;existing=true;try{S.data=decode(raw);S.status=key===BACKUP?'recovered':'ready';break}catch{S.status='corrupt'}}if(!existing){let old,legacy=localStorage.getItem('terminusRecords');try{old=JSON.parse(legacy||'{}')}catch{old={}}for(const k of Object.keys(S.data.stats))S.data.stats[k]=integer(old?.[k]);S.status=legacy?'migrated':'ready';}writeLocked=S.status==='corrupt';}catch{S.status='memory';writeLocked=true;}
S.save=function(){
 if(!S.canWrite())return false;
 const data=normal(S.data),encoded=encode(data);
 try{
  const prev=localStorage.getItem(KEY);
  if(prev!==seenRaw){markConflict();return false;}
  if(prev===encoded){S.data=data;S.status='ready';return true;} // No write or backup churn for an unchanged checkpoint.
  if(prev){try{decode(prev);localStorage.setItem(BACKUP,prev)}catch{}}
  localStorage.setItem(KEY,encoded);
  seenRaw=encoded;S.data=data;S.status='ready';return true;
 }catch{S.status='memory';return false}
};
S.export=()=>encode(normal(S.data));S.preview=text=>decode(text);
S.import=function(text){
 const next=decode(text);let current;
 try{current=localStorage.getItem(KEY);}
 catch{if(S.status!=='conflict')S.status='memory';throw Error('기기 저장소를 읽지 못해 복원하지 않았습니다. 저장소 접근을 확인한 뒤 다시 시도해 주세요.');}
 seenRaw=current;writeLocked=false;S.data=next;
 S.save();return next;
};
S.buy=function(id){const def=TG.UPGRADES.find(u=>u.id===id);if(!def||!S.canWrite())return false;const lv=S.data.upgrades[id],cost=def.base*(lv+1);if(lv>=def.cap||S.data.wallet<cost)return false;S.data.wallet-=cost;S.data.upgrades[id]++;S.save();return true;};
S.remember=function(id){if(!TG.MEMORIES.some(m=>m.id===id)||S.data.memories.includes(id)||!S.canWrite())return false;S.data.memories.push(id);S.save();return true;};
S.lastUnlocked=[];
S.challengeProgress=()=>progress(S.data);
S.settle=function(run,won){
 S.lastUnlocked=[];
 if(!run||!validRunId(run.id)||run.practice===true||(run.mode&&run.mode!=='chapter')||!S.canWrite()||S.data.settled.includes(run.id)||S.data.history.some(entry=>entry.id===run.id))return 0;
 const completed=new Set(progress(S.data).filter(goal=>goal.complete).map(goal=>goal.id)),success=won===true,shards=Number.isFinite(run.shards)?Math.max(0,run.shards):0;
 const amount=Math.max(0,Math.floor(shards*(success?1:.5)))+(success?25:0);
 S.data.wallet=Math.min(1e7,S.data.wallet+amount);S.data.stats.runs++;S.data.stats.wins+=success?1:0;S.data.stats.bestKills=Math.max(S.data.stats.bestKills,integer(run.kills,1e5));S.data.stats.totalShards+=amount;
 const clearedStages=success?3:Number.isInteger(run.clearedStages)?Math.min(3,Math.max(integer(run.stage,2),run.clearedStages)):Math.min(3,integer(run.stage,2)+(run.phase==='camp'?1:0));
 const entry=journalEntry({...run,won:success,reason:run.reason||'retreat',clearedStages,reward:amount,at:Date.now()});
 S.data.history.unshift(entry);S.data.history=S.data.history.slice(0,10);
 const best=S.data.journalBest;best.maxSynergies=Math.max(best.maxSynergies,entry.synergies.length);best.maxRelics=Math.max(best.maxRelics,entry.relics.length);best.farthestStage=Math.max(best.farthestStage,entry.clearedStages,S.data.unlocked,success?3:0);
 S.lastUnlocked=progress(S.data).filter(goal=>goal.complete&&!completed.has(goal.id)).map(goal=>goal.id);
 S.data.settled.push(run.id);S.data.checkpoint=null;S.save();return amount;
};
S.snapshot=function(g,phase='stage'){if(g.mode!=='chapter'||!S.canWrite())return false;S.data.checkpoint={id:g.id,phase,stage:g.stage,mode:g.mode,duration:g.duration,hp:g.p.hp,levels:clone(g.levels),relics:[...g.relics],xp:g.xp,level:g.level,shards:g.shards,kills:g.kills,totalTime:g.totalTime,erase:g.erase,event:g.event,eventDone:g.eventDone,bonusCards:(g.bonusCards||0)+(g.status==='cards'?1:0),bossOffers:[...(g.bossOffers||[])],bossReward:g.bossReward||null};return S.save();};
S.clearPractice=function(){if(S.data.checkpoint?.mode!=='chapter')S.data.checkpoint=null;};
S.fresh=fresh;S.normal=normal;S.decode=decode;S.encode=encode;
})();
