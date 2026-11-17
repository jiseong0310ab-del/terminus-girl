'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function surface(){
 const root=path.resolve(__dirname,'..'),elements=new Map(),trace={arcs:[],rotations:[],texts:[],rects:[]};let document,seq=0;
 const ctx=new Proxy({arc(...a){trace.arcs.push(a)},rotate(a){trace.rotations.push(a)},fillText(...a){trace.texts.push(a)},strokeRect(...a){trace.rects.push(a)},createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 function element(id){const e={id,style:{},dataset:{},attrs:{},children:[],hidden:false,value:'',checked:false,textContent:'',classList:{toggle(){},add(){},remove(){}},append(...n){this.children.push(...n)},appendChild(n){this.children.push(n)},replaceChildren(...n){this.children=n},setAttribute(k,v){this.attrs[k]=v},addEventListener(){},focus(){document.activeElement=this},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:136,height:136}),hasPointerCapture:()=>false,remove(){}};elements.set(id,e);return e}
 for(const m of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/id="([^"]+)"/g))element(m[1]);
 document={activeElement:null,hidden:false,body:element('body'),getElementById:id=>elements.get(id),createElement:tag=>element(tag+seq++),createTextNode:text=>({textContent:text}),addEventListener(){}};
 const values=new Map(),c={console,Math,Date,Set,Map,JSON,document,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},Image:class{constructor(){this.complete=false;this.naturalWidth=0}},navigator:{},innerWidth:390,innerHeight:844,devicePixelRatio:1,requestAnimationFrame:()=>1,setInterval:()=>1,setTimeout:()=>1,addEventListener(){},performance:{now:()=>0},TG:{}};c.window=c;vm.createContext(c);
 for(const file of ['data','store','audio','game','render','input','ui'])vm.runInContext(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'),c);
 const reset=()=>{for(const list of Object.values(trace))list.length=0};
 return {TG:c.TG,$:id=>elements.get(id),trace,reset};
}
test('boss HUD names the second phase and explains the currently locked attack',()=>{
 const {TG,$}=surface();$('quickStart').onclick();const g=TG.engine.g;g.stage=1;const e=TG.engine.enemy('boss',120,0);e.bossPhase=2;e.attackPhase=2;e.attackVariant='diagonal';e.action='windup';
 TG.ui.refreshHud();assert.match($('bossName').textContent,/2단계/);assert.match($('bossStatus').textContent,/대각선/);
 g.stage=0;e.attackPhase=1;TG.ui.refreshHud();assert.doesNotMatch($('bossStatus').textContent,/잔진동/);
 e.attackPhase=2;TG.ui.refreshHud();assert.match($('bossStatus').textContent,/잔진동/);
});
test('warning geometry follows the locked phase and rotates only diagonal snow attacks',()=>{
 const {TG,$,trace,reset}=surface();$('quickStart').onclick();const g=TG.engine.g;g.stage=2;const e=TG.engine.enemy('boss',120,0);Object.assign(e,{bossPhase:2,attackPhase:1,action:'windup',clock:.8,aimX:1,aimY:0});
 reset();TG.view.draw(1000);let gap=trace.arcs.find(a=>a[2]===180&&a[4]-a[3]<Math.PI);assert(gap);assert(Math.abs(gap[3]+Math.PI/4)<1e-10);assert(Math.abs(gap[4]-Math.PI/4)<1e-10);
 e.attackPhase=2;reset();TG.view.draw(1000);gap=trace.arcs.find(a=>a[2]===180&&a[4]-a[3]<Math.PI);assert(Math.abs(gap[3]+3*Math.PI/16)<1e-10);assert(Math.abs(gap[4]-3*Math.PI/16)<1e-10);
 g.stage=1;e.attackVariant='diagonal';reset();TG.view.draw(1000);assert(trace.rotations.includes(Math.PI/4));assert(trace.rects.some(r=>r[0]===-220&&r[2]===440));
 e.attackVariant='cross';reset();TG.view.draw(1000);assert.equal(trace.rotations.includes(Math.PI/4),false);
});
test('aftershock boundary is anchored to its world location and survives reduced effects',()=>{
 const {TG,$,trace,reset}=surface();$('quickStart').onclick();const g=TG.engine.g;g.p.x=40;g.p.y=50;g.aftershocks=[{x:100,y:140,r:70,age:.5,warning:1,life:1.25}];
 reset();TG.view.draw(1000);let ring=trace.arcs.find(a=>a[2]===70);assert.equal(ring[0],255);assert.equal(ring[1],512);assert(trace.texts.some(a=>a[0]==='잔진동 예고'));
 TG.store.data.settings.reduceFX=true;g.p.x=60;g.aftershocks[0].age=1.1;reset();TG.view.draw(2000);ring=trace.arcs.find(a=>a[2]===70);assert.equal(ring[0],235);assert.equal(ring[1],512);assert(trace.texts.some(a=>a[0]==='잔진동'));
 g.aftershocks[0].x=10000;reset();TG.view.draw(3000);assert.equal(trace.arcs.some(a=>a[2]===70),false);
});
test('elite ember marker culls distant drops and the guide prioritizes a wave warning',()=>{
 const {TG,$,trace,reset}=surface();$('quickStart').onclick();const g=TG.engine.g;g.time=30;g.eliteDrops=[{id:1,x:100,y:0,life:4},{id:2,x:10000,y:0,life:18}];TG.store.data.settings.reduceFX=true;
 TG.ui.refreshHud();assert.match($('guide').textContent,/정예의 불씨/);assert.equal($('guide').style.display,'block');
 reset();TG.view.draw(1000);assert.equal(trace.texts.filter(a=>a[0]==='4초').length,1);assert.equal(trace.texts.some(a=>a[0]==='정예의 불씨'),false);assert(trace.arcs.some(a=>a[2]===17));
 g.wave={name:'설원의 협공',remaining:1.2,hint:'빈 통로로 이동',points:[]};TG.ui.refreshHud();assert.match($('guide').textContent,/설원의 협공/);assert.doesNotMatch($('guide').textContent,/정예의 불씨/);
 g.wave=null;g.eliteDrops=[];TG.ui.refreshHud();assert.equal($('guide').style.display,'none');
});
