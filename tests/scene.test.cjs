'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {boot}=require('./helpers.cjs');
function scene(){
 const b=boot(),draws=[],arcs=[];
 const ctx=new Proxy({setTransform(){},createRadialGradient:()=>({addColorStop(){}}),drawImage(...args){draws.push(args)},arc(...args){arcs.push(args)}},{get:(o,k)=>k in o?o[k]:(()=>{})});
 b.c.Image=class{constructor(){this.complete=true;this.naturalWidth=this.naturalHeight=1024}};
 Object.assign(b.c,{innerWidth:390,innerHeight:844,devicePixelRatio:1});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/render.js'),'utf8'),b.c);
 b.TG.view.init({clientWidth:390,clientHeight:844,width:0,height:0,getContext:()=>ctx});
 return {...b,draws,arcs};
}
test('scenery stays anchored in world space as the camera moves, with a clear player area',()=>{
 const {TG}=scene(),V=TG.view;
 const first=V.sceneProps(0,0,0,1200,900),again=V.sceneProps(0,0,0,1200,900);
 assert.equal(JSON.stringify(first),JSON.stringify(again));assert(first.length>0);
 assert(first.every(p=>Math.hypot(p.x,p.y)>=140));
 const shifted=V.sceneProps(0,20,10,1200,900),common=first.filter(p=>shifted.some(q=>q.key===p.key));assert(common.length>0);
 for(const p of common){const q=shifted.find(q=>q.key===p.key);assert.equal(p.x,q.x);assert.equal(p.y,q.y);assert.equal(p.index,q.index)}
});
test('scenery culls outside the viewport, reduces density on low quality, and uses station-specific props',()=>{
 const {TG}=scene(),V=TG.view;
 const full=V.sceneProps(0,2300,-1400,1200,900),low=V.sceneProps(0,2300,-1400,1200,900,true);
 assert(full.length>low.length);assert(low.every(p=>full.some(q=>q.key===p.key)));
 assert(full.every(p=>p.x-2300+600>=-100&&p.x-2300+600<=1300&&p.y+1400+450>=-20&&p.y+1400+450<=1060));
 assert(full.every(p=>p.index!==3));assert(V.sceneProps(2,2300,-1400,1200,900).every(p=>p.index!==0));
});
test('renderer draws atlas props behind enemies and keeps overcharge readable with reduced effects',()=>{
 const {TG,G,draws,arcs}=scene();const g=G.start('quick');G.enemy('ghost',60,0);g.overcharge=6;
 assert.doesNotThrow(()=>TG.view.draw(1000));
 const propIndex=draws.findIndex(args=>args[0].src==='assets/station-props-v010.webp');
 const enemyIndex=draws.findIndex(args=>args[0].src==='assets/enemies-v09.webp');
 assert(propIndex>=0);assert(propIndex<enemyIndex);assert(draws[propIndex].slice(1).every(Number.isFinite));
 TG.store.data.settings.reduceFX=true;arcs.length=0;assert.doesNotThrow(()=>TG.view.draw(2000));
 assert(arcs.some(a=>a[0]===0&&a[1]===-8&&a[2]===39));
});

test('painted memory lantern loads as a real sprite and stays behind enemy threats',()=>{
 const {TG,G,draws}=scene();const g=G.start();g.memoryAnchor={x:100,y:50,r:42,remaining:18,charge:.6,required:1.2,xp:8};G.enemy('ghost',90,50);TG.view.draw(1000);
 const lantern=draws.findIndex(args=>args[0].src==='assets/memory-lantern-v013.webp'),enemy=draws.findIndex(args=>args[0].src==='assets/enemies-v09.webp');assert(lantern>=0);assert(lantern<enemy);assert(draws[lantern].slice(1).every(Number.isFinite));
});

test('Mare atlas shows only for a joined story companion and protection remains visible with reduced FX',()=>{
 const {TG,G,draws}=scene();TG.story.begin();for(let i=0;i<6;i++){const s=TG.story.state();TG.story.advance(s.node,s.line);}G.startStory();G.g.time=G.g.duration;G.update(0);G.g=null;for(let i=0;i<4;i++){const s=TG.story.state();TG.story.advance(s.node,s.line);}G.startStory();TG.store.data.settings.reduceFX=true;G.damage(10);TG.view.draw(1000);
 const mare=draws.find(a=>a[0].src==='assets/mare-walk-v014.webp');assert(mare);assert(mare.slice(1).every(Number.isFinite));assert.equal(mare[7],80);assert.equal(mare[8],80);
 draws.length=0;G.g=null;G.start('quick');TG.view.draw(1100);assert(!draws.some(a=>a[0].src==='assets/mare-walk-v014.webp'));
});

test('command ward remains readable in low/reduced mode and a zero-time paused scene stays frozen',()=>{
 const {TG,G,draws,arcs}=scene();const g=G.start('quick');g.commandEffects={ward:3,guardWindow:0};g.status='command';g.time=0;TG.store.data.settings.reduceFX=true;TG.store.data.settings.quality='low';TG.view.draw(1000);assert(arcs.some(a=>a[0]===0&&a[1]===-10&&a[2]===47));const first=draws.map(a=>a.slice(1));draws.length=0;TG.view.draw(5000);assert.deepEqual(draws.map(a=>a.slice(1)),first);
});
