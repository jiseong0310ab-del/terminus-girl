'use strict';
(()=>{
const I=TG.input={};const keys={};let pointer=null,sx=0,sy=0;
I.reset=function(){const joy=document.getElementById('joystick');const old=pointer;pointer=null;sx=sy=0;for(const k of Object.keys(keys))delete keys[k];if(old!==null){try{if(joy?.hasPointerCapture?.(old))joy.releasePointerCapture(old)}catch{}}TG.engine.input.x=TG.engine.input.y=0;const stick=document.getElementById('stick');if(stick)stick.style.transform='translate3d(0,0,0)';};
I.poll=function(){let x=sx+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=sy+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}TG.engine.input.x=x;TG.engine.input.y=y;};
I.init=function(){const joy=document.getElementById('joystick'),stick=document.getElementById('stick');function pos(e){const r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,d=Math.hypot(dx,dy);sx=d>6?dx/d*Math.min(1,d/45):0;sy=d>6?dy/d*Math.min(1,d/45):0;stick.style.transform=`translate3d(${sx*33}px,${sy*33}px,0)`;I.poll()}
 joy.addEventListener('pointerdown',e=>{if(TG.engine.g?.status!=='playing'||pointer!==null)return;pointer=e.pointerId;try{joy.setPointerCapture?.(pointer)}catch{}TG.audio.unlock?.();pos(e);e.preventDefault()});addEventListener('pointermove',e=>{if(e.pointerId===pointer){pos(e);e.preventDefault()}});function release(e){if(e.pointerId===pointer){pointer=null;sx=sy=0;stick.style.transform='translate3d(0,0,0)';I.poll()}}for(const event of ['pointerup','pointercancel'])addEventListener(event,release);joy.addEventListener('lostpointercapture',release);
 const dash=document.getElementById('dashBtn');for(const control of [joy,dash])control.addEventListener('contextmenu',e=>e.preventDefault());dash.addEventListener('pointerdown',e=>{e.preventDefault();I.poll();TG.audio.unlock?.();TG.engine.dash()});dash.addEventListener('click',e=>{if(e.detail===0)TG.engine.dash()});
 addEventListener('keydown',e=>{if(e.target?.matches?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;if(e.code==='Space'&&e.target?.closest?.('button,a,[role="button"]'))return;if(TG.engine.g?.status==='playing'&&(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)))e.preventDefault();keys[e.key.toLowerCase()]=true;I.poll();if(e.code==='Space'&&!e.repeat){TG.audio.unlock?.();TG.engine.dash()}if(e.key.toLowerCase()==='c'&&!e.repeat&&(!TG.ui||['playing','commands'].includes(TG.ui.screen))){TG.audio.unlock?.();if(TG.engine.g?.status==='playing')TG.engine.openCommands?.();else if(TG.engine.g?.status==='command')TG.engine.closeCommands?.();}if(e.key==='Escape'&&(!TG.ui||['playing','commands','paused'].includes(TG.ui.screen))){TG.audio.unlock?.();if(TG.engine.g?.status==='command')TG.engine.closeCommands?.();else if(TG.engine.g?.status==='playing')TG.engine.pause();else if(TG.engine.g?.status==='paused')TG.engine.resume()}});addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;I.poll()});
 function background(){
  I.reset();
  TG.engine.pause();
  TG.audio.suspend();
 }
 addEventListener('blur',()=>{
  if(document.hidden){background();return;}
  // Browser chrome and native focus changes are not an app switch.
  // Release keyboard keys while preserving a finger held on the joystick.
  for(const key of Object.keys(keys))delete keys[key];I.poll();
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)background();
  else I.reset(); // Never auto-resume a game after a phone call or lock screen.
 });
 addEventListener('pagehide',()=>{
  background();
  TG.store.save(); // Preserve the last station-boundary checkpoint and settings.
 });
 addEventListener('pageshow',()=>I.reset());
 };
})();
