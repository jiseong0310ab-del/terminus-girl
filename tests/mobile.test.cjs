const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function setup(captureThrows=false,releaseThrows=false){
 const windowEvents={},documentEvents={},events={};let dashes=0,pauses=0,suspends=0,saves=0;
 const on=(map,type,fn)=>(map[type]??=[]).push(fn);
 const joy={addEventListener:(t,f)=>on(events,t,f),getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),setPointerCapture(){if(captureThrows)throw Error('capture unavailable')},hasPointerCapture:()=>releaseThrows,releasePointerCapture(){if(releaseThrows)throw Error('release failed')}};
 const stick={style:{}},dash={addEventListener:(t,f)=>on(events,'dash:'+t,f)};
 const document={getElementById:id=>({joystick:joy,stick,dashBtn:dash}[id]),addEventListener:(t,f)=>on(documentEvents,t,f),hidden:false};
 const TG={engine:{input:{x:0,y:0},g:{status:'playing'},dash(){dashes++},pause(){if(this.g.status==='playing'){pauses++;this.g.status='paused'}},resume(){}},audio:{unlock(){},suspend(){suspends++}},store:{save(){saves++}}};
 const context={TG,document,Math,Object,addEventListener:(t,f)=>on(windowEvents,t,f)};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/input.js'),'utf8'),context);TG.input.init();
 const fire=(map,t,values={})=>{const e={preventDefault(){this.prevented=true},...values};for(const f of map[t]||[])f(e);return e};
 return {TG,stick,fireWindow:(t,e)=>fire(windowEvents,t,e),fireDocument:(t,e)=>fire(documentEvents,t,e),setHidden:v=>document.hidden=v,fireJoy:(t,e)=>fire(events,t,e),fireDash:(t,e)=>fire(events,'dash:'+t,e),dashes:()=>dashes,pauses:()=>pauses,suspends:()=>suspends,saves:()=>saves};
}
test('joystick tracks a finger outside its bounds and releases even when pointer capture fails',()=>{const h=setup(true);h.fireJoy('pointerdown',{pointerId:4,clientX:95,clientY:50});assert.equal(h.TG.engine.input.x,1);h.fireWindow('pointermove',{pointerId:4,clientX:50,clientY:5});assert.equal(h.TG.engine.input.y,-1);h.fireWindow('pointerup',{pointerId:7});assert.equal(h.TG.engine.input.y,-1);h.fireWindow('pointercancel',{pointerId:4});assert.equal(h.TG.engine.input.x,0);assert.equal(h.TG.engine.input.y,0);assert.equal(h.stick.style.transform,'translate3d(0,0,0)')});
test('joystick and dash can be used simultaneously with separate fingers',()=>{const h=setup();h.fireJoy('pointerdown',{pointerId:1,clientX:95,clientY:50});h.fireDash('pointerdown',{pointerId:2});assert.equal(h.dashes(),1);assert.equal(h.TG.engine.input.x,1);h.fireWindow('pointerup',{pointerId:2});assert.equal(h.TG.engine.input.x,1);h.fireWindow('pointerup',{pointerId:1});assert.equal(h.TG.engine.input.x,0)});
test('space activates focused controls without also triggering gameplay dash',()=>{const h=setup();const button={matches:()=>false,closest:()=>({})};const e=h.fireWindow('keydown',{key:' ',code:'Space',target:button});assert.equal(e.prevented,undefined);assert.equal(h.dashes(),0);h.fireDash('click',{detail:0});assert.equal(h.dashes(),1);const surface={matches:()=>false,closest:()=>null};h.fireWindow('keydown',{key:' ',code:'Space',target:surface});assert.equal(h.dashes(),2)});
test('editable content does not trigger gameplay keyboard shortcuts',()=>{const h=setup();h.fireWindow('keydown',{key:' ',code:'Space',target:{matches:()=>true}});assert.equal(h.dashes(),0);h.fireWindow('keydown',{key:'Escape',code:'Escape',target:{matches:()=>true}});assert.equal(h.pauses(),0)});

test('phone background and page restoration release controls without automatically resuming',()=>{
 const h=setup();
 h.fireJoy('pointerdown',{pointerId:8,clientX:95,clientY:50});
 assert.equal(h.TG.engine.input.x,1);
 h.setHidden(true);h.fireDocument('visibilitychange');
 assert.equal(h.TG.engine.input.x,0);
 assert.equal(h.TG.engine.g.status,'paused');
 assert.equal(h.pauses(),1);
 assert.equal(h.suspends(),1);
 h.setHidden(false);h.fireDocument('visibilitychange');
 h.fireWindow('pageshow',{persisted:true});
 assert.equal(h.TG.engine.g.status,'paused');
 assert.equal(h.TG.engine.input.x,0);
 h.fireWindow('pagehide',{persisted:true});
 assert.equal(h.saves(),1);
 assert.equal(h.pauses(),1);
});

test('a thrown pointer capture release does not break pause or pagehide',()=>{
 const h=setup(false,true);
 h.fireJoy('pointerdown',{pointerId:9,clientX:95,clientY:50});
 assert.equal(h.TG.engine.input.x,1);
 assert.doesNotThrow(()=>h.fireWindow('pagehide'));
 assert.equal(h.TG.engine.input.x,0);
 assert.equal(h.saves(),1);
 assert.equal(h.TG.engine.g.status,'paused');
});

test('repeated visible focus changes never pause combat or drop an active touch',()=>{
 const h=setup();h.fireJoy('pointerdown',{pointerId:11,clientX:95,clientY:50});
 for(let i=0;i<6;i++){h.fireWindow('blur');h.fireWindow('focus')}
 assert.equal(h.TG.engine.g.status,'playing');assert.equal(h.pauses(),0);assert.equal(h.suspends(),0);assert.equal(h.TG.engine.input.x,1);
 h.fireWindow('pointerup',{pointerId:11});assert.equal(h.TG.engine.input.x,0);
 h.setHidden(true);h.fireWindow('blur');assert.equal(h.TG.engine.g.status,'paused');assert.equal(h.pauses(),1);
});
test('long presses on movement and dash suppress the native context menu',()=>{
 const h=setup();assert.equal(h.fireJoy('contextmenu').prevented,true);assert.equal(h.fireDash('contextmenu').prevented,true);
});
