'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');const ROOT=path.resolve(__dirname,'..');
function boot(seed){let state=seed>>>0;const math=Object.create(Math);math.random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};class Clock extends Date{static now(){return 1794873600000;}}const values=new Map(),c={console,Math:math,Date:Clock,Set,Map,JSON,Number,String,Object,Array,Boolean,Error,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v))},addEventListener(){},TG:{}};c.window=c;vm.createContext(c);for(const file of ['data','commands','story','store','game'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),c);return c.TG;}
function dialogues(TG){TG.story.begin();let guard=0;while(TG.STORY.nodes[TG.story.state().node].kind==='dialogue'){const s=TG.story.state();if(!TG.story.advance(s.node,s.line))throw Error('advance blocked');if(++guard>30)throw Error('dialogue loop');}}
const H=Math.hypot;
function choose(g){const priority={blade:100,echo:90,orbit:85,vital:g.p.hp<g.p.maxHp*.65?110:65,shield:80,speed:g.p.hp<g.p.maxHp*.75?95:55,magnet:70,mend:60,lantern:75,frost:50,ward:45,focus:40,ember:35,wisdom:30,pierce:25,clock:20,rest:0};return [...g.offered].sort((a,b)=>(priority[b]||0)-(priority[a]||0))[0];}
function drive(TG,policy){const G=TG.engine,g=G.g,p=g.p,t=g.time;
 if(policy==='idle'){G.input.x=0;G.input.y=0;return;}
 // Story QA must attempt the actual world objective; do not assume surviving the timer is success.
 // Only the destination is shared: each policy keeps its own way of moving, dodging and dashing.
 let goal=null,stop=0;const gate=g.storyGate;
 if(gate){
  const ready=gate.kind==='archive'?g.recordTarget?.recovered===true:gate.guardIds.length>0&&gate.defeated.length===gate.guardIds.length;
  if(ready){goal=gate;stop=Math.min(14,gate.r*.22);}
  else if(gate.kind==='archive'){goal=g.recordTarget;stop=Math.min(17,goal.r*.3);}
  else if(policy==='straight'){goal=g.enemies.find(e=>gate.guardIds.includes(e.id));stop=108;}
 }
 if(!goal&&g.storyBattle==='snowMission'){goal=g.signalTargets?.find(r=>!r.recovered);stop=15;}
 const visible=g.enemies.filter(e=>Math.abs(e.x-p.x)<245&&Math.abs(e.y-p.y)<470),nearest=visible.slice().sort((a,b)=>H(a.x-p.x,a.y-p.y)-H(b.x-p.x,b.y-p.y))[0];
 const nd=nearest?H(nearest.x-p.x,nearest.y-p.y):Infinity;
 const drops=g.drops.filter(d=>Math.abs(d.x-p.x)<235&&Math.abs(d.y-p.y)<455).sort((a,b)=>H(a.x-p.x,a.y-p.y)-H(b.x-p.x,b.y-p.y));
 let x=0,y=0;
 if(goal){const dx=goal.x-p.x,dy=goal.y-p.y,d=H(dx,dy)||1;if(d>stop){x=dx/d;y=dy/d;}}
 else if(policy==='straight'){const length=Math.hypot(1,.2);x=1/length;y=.2/length;}
 else if(policy==='kite'){
  if(drops[0]&&nd>65){const d=drops[0],dist=H(d.x-p.x,d.y-p.y)||1;x=(d.x-p.x)/dist;y=(d.y-p.y)/dist;}
  else {const a=t*.45;x=Math.cos(a)*.65;y=Math.sin(a)*.65;}
 }else if(policy==='cautious'){
  if(nd<130){x=(p.x-nearest.x)/(nd||1);y=(p.y-nearest.y)/(nd||1);}
  else if(drops[0]){const d=drops[0],dist=H(d.x-p.x,d.y-p.y)||1;x=(d.x-p.x)/dist;y=(d.y-p.y)/dist;}
 }else if(policy==='novice'){
  // A simple player changes direction every two seconds and only dashes when crowded.
  const a=Math.floor(t/2)*1.3;x=Math.cos(a)*.65;y=Math.sin(a)*.65;
 }
 // Skilled policies step away from close enemies (inside a goal circle only weakly, to keep holding it).
 const holding=goal&&H(goal.x-p.x,goal.y-p.y)<(goal.r||40)*.7;
 if(policy==='kite'||policy==='cautious'){for(const e of visible){const dx=p.x-e.x,dy=p.y-e.y,d=H(dx,dy)||1,reach=goal?60:135;if(d<reach){const force=(reach-d)/65;x+=dx/d*force;y+=dy/d*force;}}}
 let threat=false;if(policy!=='straight')for(const b of g.hostile){const dx=p.x-b.x,dy=p.y-b.y,d=H(dx,dy)||1;if(d<85){const w=holding?.5:1.5;x+=dx/d*w;y+=dy/d*w;if(d<50)threat=true;}}
 // Charge telegraphs: skilled policies sidestep the warned line.
 if(policy==='kite'||policy==='cautious')for(const e of visible)if(e.action==='windup'&&e.behavior==='charge'){const ax=e.aimX,ay=e.aimY,rx=p.x-e.x,ry=p.y-e.y,along=rx*ax+ry*ay,side=rx*-ay+ry*ax;if(along>0&&along<200&&Math.abs(side)<30){const s=side>=0?1:-1;x+=-ay*s*1.6;y+=ax*s*1.6;}}
 const length=H(x,y);G.input.x=length>1?x/length:x;G.input.y=length>1?y/length:y;
 const charging=visible.some(e=>(e.action==='charge'||e.action==='windup'&&e.behavior==='charge')&&H(e.x-p.x,e.y-p.y)<150);
 if(policy==='novice'){if(nd<35)G.dash();}
 else if(policy==='straight'){if(nd<40)G.dash();}
 // While holding an objective circle, skilled policies only dash away from a charge.
 else if(holding?charging:(nd<65||threat||charging))G.dash();
}
function run(seed,policy){const TG=boot(seed),G=TG.engine;dialogues(TG);const results=[];let totalHits=0,healthDamage=0,dashes=0;
 const damage=G.damage;G.damage=amount=>{const hp=G.g.p.hp,result=damage(amount);if(result){totalHits++;healthDamage+=Math.max(0,hp-G.g.p.hp);}return result;};
 const dash=G.dash;G.dash=()=>{const result=dash();if(result)dashes++;return result;};
 for(const id of ['approach','escort']){
  G.g=null;const g=G.startStory();if(!g||g.storyBattle!==id)throw Error('bad flow');let frames=0,choices=0;const initialHits=totalHits,initialDamage=healthDamage,initialDashes=dashes,initialKills=g.kills;
  while(g.status!=='ended'&&++frames<5000){if(g.status==='cards'){G.choose(choose(g),g.offerToken);choices++;continue;}drive(TG,policy);G.update(.04);}
  results.push({id,won:g.won===true,reason:g.reason||'',objective:TG.engine.objective(g)?.title||'',time:Number(g.time.toFixed(2)),hp:Number(g.p.hp.toFixed(1)),maxHp:g.p.maxHp,level:g.level,kills:g.kills-initialKills,totalKills:g.kills,cards:choices,hits:totalHits-initialHits,hpDamage:healthDamage-initialDamage,protected:g.mare?.protected||0,dashes:dashes-initialDashes,levels:g.levels});
  if(!g.won)break;dialogues(TG);
 }
 return{seed,policy,complete:results.length===2&&results[1].won,results,wallet:TG.store.data.wallet,legacyRuns:TG.store.data.stats.runs,storyNode:TG.story.state().node};
}
if(require.main===module){
const rows=[];for(const policy of ['straight','cautious','kite','novice','idle'])for(let seed=1;seed<=30;seed++)rows.push(run(seed,policy));
fs.mkdirSync(path.join(ROOT,'output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'output','story-play-sim-results.json'),JSON.stringify(rows,null,2));
for(const policy of ['straight','cautious','kite','novice','idle']){const list=rows.filter(r=>r.policy===policy),summary={policy,complete:list.filter(r=>r.complete).length,total:list.length};for(const id of ['approach','escort']){const battles=list.flatMap(r=>r.results).filter(b=>b.id===id),avg=k=>Number((battles.reduce((sum,b)=>sum+b[k],0)/battles.length).toFixed(2));summary[id]={n:battles.length,won:battles.filter(b=>b.won).length,avgLevel:avg('level'),avgHP:avg('hp'),minHP:Math.min(...battles.map(b=>b.hp)),avgKills:avg('kills'),avgHits:avg('hits'),avgHPDamage:avg('hpDamage'),avgProtected:avg('protected'),avgDashes:avg('dashes')};}console.log(JSON.stringify(summary));}
console.log('No profile currency or legacy run mutation:',rows.every(r=>r.wallet===0&&r.legacyRuns===0));

}
module.exports={boot,dialogues,drive,choose,run};
