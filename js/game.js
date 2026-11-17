'use strict';
(()=>{
const G=TG.engine={g:null};const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),len=Math.hypot,advance=(position,step)=>Number.isFinite(position+step)?position+step:0,rand=(a,b)=>a+Math.random()*(b-a),TAU=Math.PI*2;let seq=0;
G.onChange=()=>{};G.onSound=()=>{};G.input={x:0,y:0};G.notify=(text)=>{if(G.g)G.g.toast={text,life:3};};
function makeId(){return 'run-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)}
function player(){return{x:0,y:0,hp:100,maxHp:100,speed:225,attack:17,interval:.52,projectiles:1,pierce:0,shield:0,orbit:0,magnet:105,slow:0,crit:0};}
G.rebuild=function(){const g=G.g,p=g.p,l=g.levels,u=TG.store.data.upgrades,has=id=>g.relics.includes(id),lv=id=>l[id]||0;g.synergies=Object.fromEntries(TG.SYNERGIES.map(s=>[s.id,Object.entries(s.needs).every(([id,n])=>lv(id)>=n)]));const sy=g.synergies;p.maxHp=100+u.heart*8+lv('magnet')*10+lv('vital')*20;p.hp=clamp(p.hp,0,p.maxHp);p.speed=Math.min(350,225*(1+.10*lv('speed')));p.attack=17*(1+u.lamp*.05)*Math.pow(1.25,lv('blade'));p.interval=Math.max(.18,.52*Math.pow(.94,lv('blade')));p.projectiles=1+lv('echo');p.pierce=lv('pierce');p.orbit=lv('orbit');p.magnet=(105+u.map*12+has('compass')*40)*(1+.30*lv('magnet'))*(sy.starCompass?1.5:1);p.slow=Math.min(.75,.25*lv('frost'));p.crit=Math.min(.6,lv('focus')*.08+has('lens')*.1);g.dash.maxCooldown=Math.max(1.5,3-lv('clock')*.3-has('watch')*.3);};
function initialize(mode,stage,carry,resuming=false,prepareOnly=false){
 const old=carry||{};const g=G.g={id:old.id||makeId(),mode,stage,duration:mode==='quick'?90:mode==='single'?300:TG.STAGES[stage].duration,status:'playing',time:0,totalTime:old.totalTime||0,level:old.level||1,xp:old.xp||0,xpNeed:0,levels:{...(old.levels||{})},relics:[...(old.relics||[])],shards:old.shards||0,kills:old.kills||0,erase:old.erase||0,bossSpawned:false,bossDefeated:false,spawn:.4,eliteCount:0,enemySeq:0,lastFire:0,lastHit:-9,lastShield:0,regenClock:0,pulseClock:0,hazardClock:0,bonusCards:old.bonusCards||0,event:old.event||0,eventDone:false,bossOffers:resuming&&old.phase==='camp'?[...(old.bossOffers||[])]:[],bossReward:resuming&&old.phase==='camp'?(old.bossReward||null):null,p:player(),dash:{active:0,cooldown:0,invulnerable:false,x:0,y:1,lastX:0,lastY:1,maxCooldown:3},enemies:[],bullets:[],hostile:[],drops:[],particles:[],rings:[],hazards:[],links:[],flames:[],aftershocks:[],eliteDrops:[],offered:[],offerToken:0,shake:0,flash:0,face:0,moving:false,toast:null,chain:0,chainTime:0,overcharge:0,nextWave:25,waveIndex:0,wave:null,waveRestUntil:0};
 g.xpNeed=12+Math.max(0,g.level-1)*7;G.input.x=G.input.y=0;G.rebuild();g.p.hp=old.hp?Math.min(g.p.maxHp,old.hp):g.p.maxHp;g.p.shield=Math.min(3,(g.levels.shield||0)+(g.relics.includes('bell')?1:0));
 if(prepareOnly)return g;
 if(mode==='chapter'){TG.store.remember('arrival');if(stage===1)TG.store.remember('snow');if(stage===2)TG.store.remember('order');if(!resuming)TG.store.snapshot(g);}
 G.notify(TG.STAGES[stage].intro);G.onChange('playing');G.onSound('start');if(!(resuming&&old.phase==='camp'))G.checkLevel();return g;
}
G.start=(mode='chapter')=>{if(mode==='chapter'&&!TG.store.canWrite())throw Error('기록 저장을 확인할 수 없습니다. 다른 탭을 닫고 새로고침하거나 백업을 확인하세요.');if(TG.store.data.checkpoint)throw Error('진행 중인 탐험을 먼저 이어가거나 정산해 주세요.');return initialize(mode,0,null)};
G.continue=function(){const c=TG.store.data.checkpoint;if(!c||!TG.store.canWrite())return false;initialize(c.mode,c.stage,c,true);if(c.phase==='camp'){G.g.status='camp';G.g.event=c.event;G.g.eventDone=c.eventDone;G.onChange('camp')}TG.store.snapshot(G.g,c.phase);return true;};
G.pause=function(){if(G.g?.status!=='playing')return;G.g.status='paused';G.input.x=G.input.y=0;G.onChange('paused');};
G.resume=function(){if(G.g?.status!=='paused'||(G.g.mode==='chapter'&&!TG.store.canWrite()))return;if(G.g.p.hp<=0){G.finish(false,'death');return;}G.g.status='playing';G.onChange('playing');};
G.dash=function(){const g=G.g;if(!g||g.status!=='playing'||g.dash.cooldown>0)return false;const d=g.dash,m=len(G.input.x,G.input.y);if(m>.1){d.lastX=G.input.x/m;d.lastY=G.input.y/m}d.x=d.lastX;d.y=d.lastY;d.active=.18;d.invulnerable=true;d.cooldown=d.maxCooldown;g.rings.push({x:g.p.x,y:g.p.y,r:25,life:.3,max:.3,color:'#ead8ae'});G.onSound('dash');return true;};
// Every early offer has a usable offensive choice; a nearly completed
// synergy is not hidden behind pure randomness. The other slots stay random.
G.options=function(){
 const g=G.g,eligible=TG.CARDS.filter(c=>(g.levels[c.id]||0)<c.cap),chosen=[];
 const offensive=new Set(['blade','echo','orbit','lantern']);
 function pick(pool){
  const remaining=pool.filter(c=>!chosen.includes(c.id));
  if(remaining.length)chosen.push(remaining[Math.floor(Math.random()*remaining.length)].id);
 }
 const finishers=eligible.filter(c=>TG.SYNERGIES.some(s=>
  !g.synergies[s.id]&&Object.prototype.hasOwnProperty.call(s.needs,c.id)&&
  Object.entries(s.needs).every(([id,n])=>(g.levels[id]||0)+(id===c.id?1:0)>=n)
 ));
 pick(finishers);
 if(g.level<=4&&!chosen.some(id=>offensive.has(id)))pick(eligible.filter(c=>offensive.has(c.id)));
 const rest=eligible.filter(c=>!chosen.includes(c.id));
 for(let i=rest.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
 chosen.push(...rest.slice(0,Math.max(0,3-chosen.length)).map(c=>c.id));
 for(let i=chosen.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[chosen[i],chosen[j]]=[chosen[j],chosen[i]];}
 return chosen;
};
G.checkLevel=function(){const g=G.g;if(!g||g.status!=='playing')return false;if(g.bonusCards>0){g.bonusCards--;}else if(g.xp>=g.xpNeed){g.xp-=g.xpNeed;g.level++;g.xpNeed=12+(g.level-1)*7;}else return false;g.offered=G.options();if(!g.offered.length)g.offered=['rest'];g.offerToken=++seq;g.status='cards';G.input.x=G.input.y=0;G.onChange('cards');G.onSound('card');return true;};
G.choose=function(id,token){const g=G.g;if(!g||g.status!=='cards'||token!==g.offerToken||!g.offered.includes(id)||(g.mode==='chapter'&&!TG.store.canWrite()))return false;const p=g.p;if(id==='rest'){p.hp=Math.min(p.maxHp,p.hp+25)}else{const c=TG.CARDS.find(c=>c.id===id);if(!c||(g.levels[id]||0)>=c.cap)return false;g.levels[id]=(g.levels[id]||0)+1;const before=p.maxHp;G.rebuild();if(p.maxHp>before)p.hp=Math.min(p.maxHp,p.hp+p.maxHp-before);if(id==='speed')p.hp=Math.min(p.maxHp,p.hp+8);if(id==='shield'){p.shield=Math.min(3,p.shield+1);g.lastShield=g.time;}}
 g.offered=[];g.status='playing';G.onChange('playing');G.checkLevel();return true;};
function spark(x,y,color,count=6){const g=G.g;for(let i=0;i<count&&g.particles.length<130;i++)g.particles.push({x,y,vx:rand(-80,80),vy:rand(-80,80),life:rand(.2,.5),max:.5,color,size:rand(1,3)})}
function ring(x,y,r,color){G.g.rings.push({x,y,r,color,life:.5,max:.5})}
G.enemy=function(type,x,y){const g=G.g;const b=type==='boss',def=b?{hp:[1000,1650,2400][g.stage],speed:42,r:27,art:[2,5,8][g.stage],behavior:'boss'}:TG.ENEMY_DEFS[type];if(!def)throw Error('Unknown enemy');const e={...def,type,id:++g.enemySeq,x,y,maxHp:def.hp,hp:def.hp,hit:0,slow:0,burn:0,burnPower:0,orbitHit:0,frozen:0,freezeCooldown:0,action:'approach',clock:0,wait:b?2:rand(.7,1.8),aimX:0,aimY:1,pulseRadius:[145,220,180][g.stage],phase:rand(0,TAU),bossPhase:1,attackPhase:1,attackCount:0,attackVariant:'axis'};g.enemies.push(e);return e;};
function spawn(){const g=G.g;const w=TG.view?.width||390,h=TG.view?.height||844,a=rand(0,TAU),radius=Math.hypot(w,h)*.52+50;const pool=TG.STAGES[g.stage].enemies;G.enemy(pool[Math.random()<.28?1:0],g.p.x+Math.cos(a)*radius,g.p.y+Math.sin(a)*radius)}
function waveTick(dt){
 const g=G.g;if(g.bossSpawned||g.time>=g.duration*.60){g.wave=null;return;}
 if(g.wave){g.wave.remaining-=dt;if(g.wave.remaining>0)return;
  for(const point of g.wave.points)if(g.enemies.length<65&&len(point.x-g.p.x,point.y-g.p.y)>=80)G.enemy(point.type,point.x,point.y);
  g.wave=null;g.nextWave=g.time+38;g.waveRestUntil=g.time+2;g.waveIndex++;return;
 }
 if(g.time<g.nextWave||g.enemies.length>56)return;
 const radius=clamp(Math.min(TG.view?.width||390,TG.view?.height||844)*.38,140,240),points=[];
 const rotation=g.waveIndex*Math.PI/2,add=(type,x,y)=>{points.push({type,x:g.p.x+x*Math.cos(rotation)-y*Math.sin(rotation),y:g.p.y+x*Math.sin(rotation)+y*Math.cos(rotation)})};
 let name,hint;
 if(g.stage===0){name='거울의 포위';hint='열린 틈으로 이동하거나 망령을 이어서 격파';for(let k=1;k<=6;k++){const a=k*TAU/8;add('ghost',Math.cos(a)*radius,Math.sin(a)*radius)}}
 else if(g.stage===1){name='설원의 협공';hint='양옆의 돌격을 피해 빈 통로로 이동';for(const side of [-1,1])for(const offset of [-55,55])add('wolf',side*radius,offset)}
 else{name='종착의 사격선';hint='원거리 적을 먼저 끊거나 측면으로 이탈';for(const offset of [-90,0,90])add('lost',offset,-radius);add('conductor',0,radius)}
 g.wave={name,hint,points,remaining:2};G.notify(name+' · '+hint);
}
function refreshBossPhase(e){if(e.type==='boss'&&e.hp>0&&e.hp<=e.maxHp*.5&&e.bossPhase!==2){e.bossPhase=2;G.notify(TG.STAGES[G.g.stage].boss+' · 기록 붕괴 · 두 번째 패턴');ring(e.x,e.y,70,'#edb893');}}
function kill(e){const g=G.g;const i=g.enemies.indexOf(e);if(i<0)return;g.enemies.splice(i,1);g.kills++;if(e.elite&&g.eliteDrops.length<4)g.eliteDrops.push({id:e.id,x:e.x,y:e.y,life:18});
 if(e.type!=='boss'&&g.status==='playing'&&g.overcharge<=0){g.chain=(g.chainTime>0?g.chain:0)+(e.elite?2:1);g.chainTime=3;if(g.chain>=8){g.chain=0;g.chainTime=0;g.overcharge=6;ring(g.p.x,g.p.y,105,'#f3d285');G.notify('랜턴 과충전 · 6초 동안 공격 간격 25% 감소 · 수집 범위 50% 증가');G.onSound('card');}}
if(e.type==='boss')g.bossDefeated=true;const n=e.type==='boss'?12:e.elite?5:1;g.shards+=e.type==='boss'?20:e.elite?5:1;for(let j=0;j<n&&g.drops.length<180;j++)g.drops.push({x:e.x+rand(-20,20),y:e.y+rand(-20,20),value:e.type==='boss'?3:1});spark(e.x,e.y,e.type==='boss'?'#e5c68f':'#a7cfdf',e.type==='boss'?22:5);if(e.type==='boss')G.onSound('boss');}
G.hitEnemy=function(e,amount,burn=false){if(!G.g.enemies.includes(e))return;e.hp-=amount;e.hit=.12;if(burn){e.burn=2;e.burnPower=3*(G.g.levels.ember||1);}if(e.hp<=0)kill(e);else refreshBossPhase(e);};
G.damage=function(amount){const g=G.g,p=g.p;if(g.status!=='playing'||g.dash.invulnerable||g.time-g.lastHit<.78)return false;g.lastHit=g.time;g.shake=TG.store.data.settings.reduceFX?0:5;if(p.shield){p.shield--;spark(p.x,p.y,'#a5e2ed',12)}else{const reduction=1-(1-.07*(g.levels.ward||0))*(g.synergies.warmHeart?.9:1);p.hp=Math.max(0,p.hp-amount*(1-reduction));g.flash=TG.store.data.settings.reduceFX?0:.18;spark(p.x,p.y,'#db98ac',8)}G.onSound('hurt');if(p.hp<=0)G.finish(false,'death');return true;};
function shot(e,a,speed=125){const g=G.g;if(g.hostile.length>=70)return;g.hostile.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:4,r:5,damage:12})}
function enemyTick(dt){const g=G.g,p=g.p;for(const e of [...g.enemies]){if(g.status!=='playing')return;e.hit=Math.max(0,e.hit-dt);e.slow=Math.max(0,e.slow-dt);e.wait-=dt;e.orbitHit-=dt;if(e.burn>0){e.burn-=dt;G.hitEnemy(e,e.burnPower*dt);if(!g.enemies.includes(e))continue;}e.freezeCooldown=Math.max(0,e.freezeCooldown-dt);if(e.frozen>0){e.frozen=Math.max(0,e.frozen-dt);continue;}refreshBossPhase(e);let dx=p.x-e.x,dy=p.y-e.y,d=len(dx,dy)||1,vx=dx/d,vy=dy/d,speed=e.speed;
 if(e.action==='windup'){speed=0;e.clock-=dt;if(e.clock<=0){if(e.behavior==='charge'){e.action='charge';e.clock=.52;}else if(e.behavior==='ranged'){shot(e,Math.atan2(e.aimY,e.aimX));if(e.elite){shot(e,Math.atan2(e.aimY,e.aimX)+.25);shot(e,Math.atan2(e.aimY,e.aimX)-.25)}e.action='recover';e.clock=.7;}else{if(g.stage===0){if(d<e.pulseRadius+15)G.damage(18);ring(e.x,e.y,e.pulseRadius,'#e1a0c2');if(e.attackPhase===2&&g.aftershocks.length<3)g.aftershocks.push({x:e.x,y:e.y,r:e.pulseRadius*.75,age:0,warning:1,life:1.25,damage:18,triggered:false})}else if(g.stage===1){const rx=e.attackVariant==='diagonal'?(dx+dy)/Math.SQRT2:dx,ry=e.attackVariant==='diagonal'?(dy-dx)/Math.SQRT2:dy;if((Math.abs(rx)<23&&Math.abs(ry)<220)||(Math.abs(ry)<23&&Math.abs(rx)<220))G.damage(21);ring(e.x,e.y,65,'#d6eaf1')}else{const aim=Math.atan2(e.aimY,e.aimX);const count=e.attackPhase===2?16:12;for(let k=0;k<count;k++)if(k!==0&&k!==1&&k!==count-1)shot(e,aim+k*TAU/count,e.attackPhase===2?150:135);ring(e.x,e.y,180,'#dcc28e')}e.action='recover';e.clock=1;}}}
 else if(e.action==='charge'){vx=e.aimX;vy=e.aimY;speed=e.elite?270:330;e.clock-=dt;if(e.clock<=0){e.action='recover';e.clock=.9;speed=0}}
 else if(e.action==='recover'){speed=0;e.clock-=dt;if(e.clock<=0){e.action='approach';e.wait=e.behavior==='boss'?(e.bossPhase===2?2.2:2.8):1.7}}
 else{if(e.behavior==='ranged'&&d<200)speed=-15;if(e.wait<=0&&((e.behavior==='charge'&&d<260)||(e.behavior==='ranged'&&d<350)||(e.behavior==='boss'&&d<250))){e.action='windup';if(e.type==='boss'){e.attackPhase=e.bossPhase;e.attackCount++;e.attackVariant=g.stage===1&&e.attackPhase===2&&e.attackCount%2?'diagonal':'axis';}e.clock=e.behavior==='boss'?[1.35,1.6,1.7][g.stage]:e.behavior==='charge'?.75:1;e.aimX=vx;e.aimY=vy;speed=0;}}
 const slow=e.slow>0?1-(p.slow||.35):1;e.x+=vx*speed*slow*dt;e.y+=vy*speed*slow*dt;if(len(p.x-e.x,p.y-e.y)<e.r+14)G.damage(e.type==='boss'?18:e.action==='charge'?14:9);if(g.status!=='playing')return;
 if(p.orbit>0&&e.orbitHit<=0)for(let k=0;k<p.orbit;k++){const a=g.time*2.4+k*TAU/p.orbit;if(len(e.x-p.x-Math.cos(a)*65,e.y-p.y-Math.sin(a)*65)<e.r+14){G.hitEnemy(e,14*(g.synergies.frostOrbit&&e.slow>0?1.3:1));if(g.synergies.frostOrbit){e.slow=1.5;if(e.type!=='boss'&&e.freezeCooldown<=0){e.frozen=.45;e.freezeCooldown=3;ring(e.x,e.y,25,'#aee5fb');}}e.orbitHit=.4;break}}
 }}
function fire(){const g=G.g,p=g.p;let e=null,best=650;for(const v of g.enemies){const d=len(v.x-p.x,v.y-p.y);if(d<best){best=d;e=v}}if(!e)return;const angle=Math.atan2(e.y-p.y,e.x-p.x);for(let i=0;i<p.projectiles&&g.bullets.length<100;i++){const a=angle+(i-Math.floor(p.projectiles/2))*.15;g.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*500,vy:Math.sin(a)*500,life:1.4,damage:p.attack*(i===Math.floor(p.projectiles/2)?1:.7)*(g.synergies.echoBlade&&i===Math.floor(p.projectiles/2)?1.3:1)*(Math.random()<p.crit?1.7:1),pierce:p.pierce,echo:g.synergies.echoBlade&&i===Math.floor(p.projectiles/2),echoSpent:false,hit:new Set()})}G.onSound('shot');}
function hazardTick(dt){const g=G.g;g.hazardClock+=dt;if(g.time>35){g.erase=clamp(g.erase+dt*(.12+g.stage*.035),0,100)}if(g.erase>=15&&g.hazardClock>Math.max(5,12-g.erase*.06)){g.hazardClock=0;const a=rand(0,TAU),d=rand(40,155);if(g.hazards.length<2)g.hazards.push({x:g.p.x+Math.cos(a)*d,y:g.p.y+Math.sin(a)*d,r:58,age:0,warning:2,life:5})}for(const h of g.hazards){h.age+=dt;if(h.age>=h.warning&&len(g.p.x-h.x,g.p.y-h.y)<h.r+12)G.damage(10)}g.hazards=g.hazards.filter(h=>h.age<h.life);}
function encounterTick(dt){const g=G.g,p=g.p;
 for(let i=g.eliteDrops.length-1;i>=0;i--){const item=g.eliteDrops[i];item.life-=dt;if(item.life<=0){g.eliteDrops.splice(i,1);continue;}if(len(p.x-item.x,p.y-item.y)<24){g.eliteDrops.splice(i,1);p.hp=Math.min(p.maxHp,p.hp+12);g.overcharge=Math.max(g.overcharge,3);g.chain=0;g.chainTime=0;ring(p.x,p.y,70,'#f3d285');G.notify('정예의 불씨 · 체력 최대 12 회복 · 3초 과충전');G.onSound('card');}}
 for(const shock of g.aftershocks){shock.age+=dt;if(!shock.triggered&&shock.age>=shock.warning){shock.triggered=true;if(len(p.x-shock.x,p.y-shock.y)<shock.r+14)G.damage(shock.damage);if(g.status!=='playing')break;}}
 g.aftershocks=g.aftershocks.filter(s=>s.age<s.life);
}
G.update=function(delta){const g=G.g;if(!g||g.status!=='playing')return;const dt=clamp(delta,0,.04),p=g.p;g.overcharge=Math.max(0,g.overcharge-dt);g.chainTime=Math.max(0,g.chainTime-dt);if(g.chainTime===0)g.chain=0;g.time+=dt;g.totalTime+=dt;g.flash=Math.max(0,g.flash-dt);g.shake=Math.max(0,g.shake-25*dt);if(g.toast)g.toast.life-=dt;
 const d=g.dash,m=len(G.input.x,G.input.y);if(m>.1){d.lastX=G.input.x/m;d.lastY=G.input.y/m;g.face=Math.abs(G.input.x)>Math.abs(G.input.y)?(G.input.x>0?1:3):(G.input.y>0?0:2)}d.cooldown=Math.max(0,d.cooldown-dt);const active=d.active>0;d.invulnerable=active;d.active=Math.max(0,d.active-dt);g.moving=active||m>.1;p.x=advance(p.x,(active?d.x:G.input.x)*p.speed*(active?3.4:1)*dt);p.y=advance(p.y,(active?d.y:G.input.y)*p.speed*(active?3.4:1)*dt);
 if(active&&d.active===0&&g.synergies.safeDash){for(const e of g.enemies){const dx=e.x-p.x,dy=e.y-p.y,l=len(dx,dy)||1;if(l<110){e.x+=dx/l*55;e.y+=dy/l*55}}g.hostile=g.hostile.filter(b=>len(b.x-p.x,b.y-p.y)>110);ring(p.x,p.y,110,'#a7d4f0')}
 encounterTick(dt);if(g.status!=='playing')return;hazardTick(dt);if(g.status!=='playing')return;enemyTick(dt);if(g.status!=='playing')return;
 const bossBeforeFlames=g.bossDefeated;for(const flame of g.flames){const active=Math.min(dt,flame.life);flame.life-=dt;for(const e of [...g.enemies])if(len(e.x-flame.x,e.y-flame.y)<flame.r+e.r)G.hitEnemy(e,6*active);}g.flames=g.flames.filter(f=>f.life>0);if(!bossBeforeFlames&&g.bossDefeated){G.stageClear();return;}
 waveTick(dt);g.spawn+=dt;const interval=Math.max(.42,1.3-g.time/g.duration*.7-g.stage*.09);while(g.spawn>=interval){g.spawn-=interval;if(g.enemies.length<65&&!g.wave&&g.time>=g.waveRestUntil)spawn()}
 if(g.time>75+g.eliteCount*100&&g.eliteCount<2){G.enemy(g.eliteCount%2?'witch':'warden',p.x+250,p.y-350);g.eliteCount++}
 if(!g.bossSpawned&&g.time>=g.duration*.67){g.bossSpawned=true;G.enemy('boss',p.x,p.y-310);G.notify(TG.STAGES[g.stage].boss+' · 공격 예고를 피하세요');G.onSound('boss')}
 g.lastFire+=dt;if(g.lastFire>=p.interval*(g.overcharge>0?.75:1)){g.lastFire=0;fire()}
 for(let i=g.bullets.length-1;i>=0;i--){const b=g.bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let remove=b.life<=0;for(const e of [...g.enemies]){if(remove)break;if(!b.hit.has(e.id)&&len(e.x-b.x,e.y-b.y)<e.r+6){b.hit.add(e.id);if(p.slow)e.slow=1.5;G.hitEnemy(e,b.damage,!!g.levels.ember);if(b.echo&&!b.echoSpent){b.echoSpent=true;const neighbors=g.enemies.filter(v=>v!==e&&!b.hit.has(v.id)&&len(v.x-e.x,v.y-e.y)<=110).sort((a,c)=>len(a.x-e.x,a.y-e.y)-len(c.x-e.x,c.y-e.y)).slice(0,2);for(const v of neighbors){G.hitEnemy(v,b.damage*.35);if(g.links.length<24)g.links.push({x1:e.x,y1:e.y,x2:v.x,y2:v.y,life:.18});}}spark(e.x,e.y,'#cae7f1',2);if(b.pierce--<=0)remove=true}}if(remove)g.bullets.splice(i,1)}
 for(let i=g.hostile.length-1;i>=0;i--){const b=g.hostile[i];b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(len(p.x-b.x,p.y-b.y)<b.r+13){G.damage(b.damage);b.life=0}if(b.life<=0)g.hostile.splice(i,1);if(g.status!=='playing')return;}
 if(g.bossDefeated){G.stageClear();return;}if(g.time>=g.duration){G.finish(false,'timeout');return;}
 g.regenClock+=dt;g.pulseClock+=dt;if(g.regenClock>=10){g.regenClock=0;if(g.levels.mend)p.hp=Math.min(p.maxHp,p.hp+2*g.levels.mend*(g.synergies.warmHeart?2:1))}if(g.pulseClock>=4&&g.levels.lantern){g.pulseClock=0;const radius=100+15*g.levels.lantern;ring(p.x,p.y,radius,'#e9c891');if(g.synergies.emberLantern&&g.flames.length<3)g.flames.push({x:p.x,y:p.y,r:radius*.65,life:2});for(const e of [...g.enemies])if(len(e.x-p.x,e.y-p.y)<radius+e.r)G.hitEnemy(e,(14+g.levels.lantern*7)*(g.relics.includes('wick')?1.35:1),g.synergies.emberLantern);if(g.bossDefeated){G.stageClear();return;}}
 if(g.levels.shield&&g.time-g.lastShield>=18){p.shield=Math.max(p.shield,Math.min(g.levels.shield,p.shield+1));g.lastShield=g.time}
 for(let i=g.drops.length-1;i>=0;i--){const drop=g.drops[i],dx=p.x-drop.x,dy=p.y-drop.y,dd=len(dx,dy)||1;const magnet=p.magnet*(g.overcharge>0?1.5:1);if(dd<magnet){const v=Math.max(150,550*(1-dd/magnet));drop.x+=dx/dd*v*dt;drop.y+=dy/dd*v*dt}if(dd<20){g.xp+=drop.value*(1+.15*(g.levels.wisdom||0));g.drops.splice(i,1)}}
 for(const link of g.links)link.life-=dt;g.links=g.links.filter(link=>link.life>0);
 for(const v of g.particles){v.life-=dt;v.x+=v.vx*dt;v.y+=v.vy*dt}g.particles=g.particles.filter(v=>v.life>0);for(const r of g.rings)r.life-=dt;g.rings=g.rings.filter(r=>r.life>0);G.checkLevel();
};
G.stageClear=function(){const g=G.g;if(!g||g.status!=='playing'||g.p.hp<=0||(g.mode==='chapter'&&!TG.store.canWrite()))return;g.status='camp';G.input.x=G.input.y=0;if(g.mode!=='chapter'){G.finish(true,'practice');return;}TG.store.data.unlocked=Math.max(TG.store.data.unlocked,Math.min(2,g.stage+1));TG.store.remember(['mirror','bell','ending'][g.stage]);if(g.stage===2){G.finish(true,'ending');return;}g.event=Math.floor(Math.random()*TG.EVENTS.length);g.eventDone=false;g.bossOffers=TG.BOSS_REWARDS.map(r=>r.id);g.bossReward=null;TG.store.snapshot(g,'camp');G.onChange('camp');G.onSound('clear');};
G.eventChoice=function(index){const g=G.g;if(!g||g.status!=='camp'||g.eventDone||!Number.isInteger(index)||!TG.store.canWrite())return false;const event=TG.EVENTS[g.event],c=event?.choices[index];if(!c||c.damage&&g.p.hp<=c.damage)return false;g.eventDone=true;g.p.hp=Math.min(g.p.maxHp,g.p.hp+(c.heal||0));g.p.hp-=c.damage||0;g.shards+=c.shards||0;g.erase=clamp(g.erase+(c.erase||0),0,100);g.bonusCards+=c.card||0;let reward='';if(c.relic){const pool=TG.RELICS.filter(r=>!g.relics.includes(r.id));if(pool.length){const item=pool[Math.floor(Math.random()*pool.length)];g.relics.push(item.id);reward=item.name;}else{g.shards+=12;reward='모든 유물을 보유해 기억 조각 12개를 얻었습니다.'}G.rebuild()}TG.store.snapshot(g,'camp');G.onChange('camp');G.onSound('card');return reward||true;};
G.chooseBossReward=function(id,stage=G.g?.stage){const g=G.g;if(!g||g.status!=='camp'||g.mode!=='chapter'||g.stage>=2||stage!==g.stage||g.bossReward||!g.bossOffers.includes(id)||!TG.store.canWrite())return false;const reward=TG.BOSS_REWARDS.find(r=>r.id===id);if(!reward)return false;g.bossReward=id;g.bonusCards+=reward.card||0;g.p.hp=Math.min(g.p.maxHp,g.p.hp+(reward.heal||0));g.erase=clamp(g.erase+(reward.erase||0),0,100);g.shards+=reward.shards||0;TG.store.snapshot(g,'camp');G.onChange('camp');G.onSound('card');return true;};
G.nextStage=function(){const g=G.g;if(!g||g.status!=='camp'||!g.eventDone||!g.bossReward||g.stage>=2||!TG.store.canWrite())return false;
 if(!TG.store.snapshot(g,'camp')){G.onChange('camp');return false;}
 const checkpoint=TG.store.data.checkpoint,carry={...g,hp:Math.min(g.p.maxHp,g.p.hp+20+(g.relics.includes('ticket')?20:0))};
 const candidate=initialize(g.mode,g.stage+1,carry,false,true);
 if(!TG.store.snapshot(candidate)){G.g=g;TG.store.data.checkpoint=checkpoint;G.onChange('camp');return false;}
 TG.store.remember(candidate.stage===1?'snow':'order');
 G.notify(TG.STAGES[candidate.stage].intro);G.onChange('playing');G.onSound('start');G.checkLevel();return true;
};
G.finish=function(won,reason){const g=G.g;if(!g||g.status==='ended')return false;if(g.mode==='chapter'&&!TG.store.canWrite()){G.pause();G.notify('기록 저장을 확인할 수 없어 멈췄습니다. 저장소 접근을 확인한 뒤 계속하거나 설정에서 백업하세요.');return false;}g.status='ended';G.input.x=G.input.y=0;g.won=won;g.reason=reason;if(g.mode==='chapter'){g.reward=TG.store.settle(g,won);g.newGoals=[...(TG.store.lastUnlocked||[])];if(won){for(const m of TG.MEMORIES)TG.store.remember(m.id)}}else{g.reward=0;g.practice=true;}G.onChange('ended');G.onSound(won?'clear':'hurt');return true;};
G.abandon=function(){const g=G.g;if(g&&g.status!=='ended')return G.finish(false,'retreat');const c=TG.store.data.checkpoint;if(c){if(!TG.store.canWrite())return false;TG.store.settle(c,false);G.g=null;G.onChange('hub');return true}return false;};
G.hub=function(){if(G.g?.status==='playing')G.pause();G.onChange('hub');};
G.particle=spark;G.kill=kill;G.initialize=initialize;
})();
