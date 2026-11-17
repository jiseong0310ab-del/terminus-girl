'use strict';
(()=>{
const V=TG.view={width:390,height:844};let canvas,ctx;const images={};const TAU=Math.PI*2;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
V.init=function(el){canvas=el;ctx=canvas.getContext('2d',{alpha:false});for(const [key,url]of Object.entries({hero:'assets/rize-walk-v09.webp',mare:'assets/mare-walk-v014.webp',enemy:'assets/enemies-v09.webp',floor:'assets/platform-stone-v03.webp',props:'assets/station-props-v010.webp',anchor:'assets/memory-lantern-v013.webp',fallback:'assets/rize-sd-v03.webp'})){const im=new Image();im.src=url;images[key]=im}V.resize()};
V.resize=function(){
 if(!ctx)return;
 V.width=canvas.clientWidth>0?canvas.clientWidth:innerWidth;
 V.height=canvas.clientHeight>0?canvas.clientHeight:innerHeight;
 // Mobile web views can resize frequently as browser chrome moves.
 // Avoid reallocating an unchanged canvas and cap its backing-buffer memory.
 const quality=TG.store.data.settings.quality==='low'?1:2;
 const ratio=Math.min(quality,devicePixelRatio||1,Math.sqrt(2100000/Math.max(1,V.width*V.height)));
 const width=Math.max(1,Math.round(V.width*ratio)),height=Math.max(1,Math.round(V.height*ratio));
 if(canvas.width===width&&canvas.height===height)return;
 canvas.width=width;canvas.height=height;
 ctx.setTransform(ratio,0,0,ratio,0,0);
};
const ready=im=>im?.complete&&im.naturalWidth>0;
function circle(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
// World-space scenery is stable across frames and does not participate in collision.
// Background placement and foreground threat rendering stay separate.
V.sceneProps=function(stage,cx,cy,width=V.width,height=V.height,low=false){
 const props=[],stepX=460,stepY=360;
 const types=[[0,1,2],[2,0,2,3],[3,1,2]][clamp(stage|0,0,2)];
 for(let row=Math.floor((cy-height/2-180)/stepY);row<=Math.ceil((cy+height/2+180)/stepY);row++){
  for(let col=Math.floor((cx-width/2-180)/stepX);col<=Math.ceil((cx+width/2+180)/stepX);col++){
   const hash=(Math.imul(col+117,374761393)^Math.imul(row+239,668265263))>>>0;
   if(low&&hash%2)continue;
   const x=col*stepX+100+hash%180,y=row*stepY+100+(hash>>>9)%140;
   const sx=x-cx+width/2,sy=y-cy+height/2;
   if(sx< -100||sx>width+100||sy< -20||sy>height+160||Math.hypot(x-cx,y-cy)<140)continue;
   props.push({key:col+':'+row,x,y,index:types[(hash>>>17)%types.length],scale:.9+(hash%20)/100});
  }
 }
 return props;
};
function scenery(g,cx,cy){
 if(!ready(images.props))return;
 const low=TG.store.data.settings.quality==='low',stage=g?.stage||0;
 const cellW=images.props.naturalWidth/2,cellH=(images.props.naturalHeight||images.props.naturalWidth)/2;
 for(const prop of V.sceneProps(stage,cx,cy,V.width,V.height,low)){
  const x=prop.x-cx+V.width/2,y=prop.y-cy+V.height/2,w=145*prop.scale,h=w;
  ctx.globalAlpha=stage===1?.84:.78;
  ctx.drawImage(images.props,(prop.index%2)*cellW,Math.floor(prop.index/2)*cellH,cellW,cellH,x-w/2,y-h*.82,w,h);
 }
 ctx.globalAlpha=1;
}
function background(g,t,cx,cy){const W=V.width,H=V.height;ctx.fillStyle='#101727';ctx.fillRect(0,0,W,H);const size=560,ox=((-cx+W/2)%size+size)%size,oy=((-cy+H/2)%size+size)%size;if(ready(images.floor))for(let x=ox-size;x<W;x+=size)for(let y=oy-size;y<H;y+=size)ctx.drawImage(images.floor,x,y,size,size);ctx.fillStyle=['#0b102349','#142f4349','#291e334f'][g?.stage||0];ctx.fillRect(0,0,W,H);

 if(g?.stage===1){ctx.fillStyle='#c7d9e51d';for(let i=0;i<8;i++){const wx=Math.floor(cx/470)*470+(i%3)*180-250,wy=Math.floor(cy/430)*430+Math.floor(i/3)*180-250;ctx.beginPath();ctx.ellipse(wx-cx+W/2,wy-cy+H/2,65,22,.3,0,TAU);ctx.fill();}}
 if(g?.stage===2){const clockX=Math.floor(cx/560)*560-cx+W/2+210,clockY=Math.floor(cy/560)*560-cy+H/2+200;ctx.strokeStyle='#b59a6c30';ctx.lineWidth=1.5;circle(clockX,clockY,92,null,'#b59a6c30');circle(clockX,clockY,84,null,'#b59a6c30');for(let k=0;k<12;k++){const a=k*TAU/12;ctx.beginPath();ctx.moveTo(clockX+Math.cos(a)*78,clockY+Math.sin(a)*78);ctx.lineTo(clockX+Math.cos(a)*87,clockY+Math.sin(a)*87);ctx.stroke();}}
 const rail=570;for(let wx=Math.floor((cx-W/2-180)/rail)*rail;wx<cx+W/2+180;wx+=rail){const x=wx-cx+W/2;ctx.fillStyle='#0a111f';ctx.fillRect(x-44,0,88,H);for(let wy=Math.floor((cy-H/2)/70)*70;wy<cy+H/2+70;wy+=70){ctx.fillStyle='#253345';ctx.fillRect(x-49,wy-cy+H/2,98,8)}ctx.fillStyle='#627080';ctx.fillRect(x-38,0,3,H);ctx.fillRect(x+36,0,3,H);ctx.setLineDash([10,12]);ctx.strokeStyle='#b8a27666';ctx.beginPath();ctx.moveTo(x+64,0);ctx.lineTo(x+64,H);ctx.stroke();ctx.setLineDash([]);
 for(let wy=Math.floor((cy-H/2-140)/410)*410;wy<cy+H/2+140;wy+=410){const y=wy-cy+H/2,lx=x+139,ly=y-42;const grad=ctx.createRadialGradient(lx,ly,0,lx,ly,100);grad.addColorStop(0,'#e6aa6440');grad.addColorStop(1,'#e6aa6400');ctx.fillStyle=grad;ctx.fillRect(lx-100,ly-100,200,200);ctx.strokeStyle='#84724f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(lx,y+27);ctx.lineTo(lx,ly-14);ctx.bezierCurveTo(lx,ly-32,lx+27,ly-32,lx+27,ly-16);ctx.stroke();ctx.fillStyle='#101624';ctx.fillRect(lx-10,y+25,20,7);ctx.fillStyle='#f2c68a';ctx.fillRect(lx+20,ly-15,14,21);ctx.strokeStyle='#97805a';ctx.lineWidth=1.5;ctx.strokeRect(lx+19,ly-16,16,23);ctx.fillStyle='#192335';ctx.fillRect(lx-34,y+53,90,21);ctx.strokeStyle='#867451';ctx.strokeRect(lx-34,y+53,90,21);ctx.fillStyle='#c1b7a0';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(['거울 유리역','침묵의 설원역','종착 승강장'][g?.stage||0],lx+11,y+67);}}
 scenery(g,cx,cy);
 const low=TG.store.data.settings.quality==='low',reduced=TG.store.data.settings.reduceFX,ambientTime=reduced?0:t;const snowColor=['#c2d9f066','#e7f4ff88','#e6bf7c66'][g?.stage||0];for(let i=0;i<(reduced?8:low?18:34);i++){const x=((i*193+ambientTime*9-cx*.12)%(W+100)+W+100)%(W+100)-50,y=((i*137+ambientTime*(10+i%5)-cy*.12)%(H+100)+H+100)%(H+100)-50;ctx.fillStyle=snowColor;circle(x,y,1+i%2*.4,snowColor)}
 const vig=ctx.createRadialGradient(W/2,H/2,80,W/2,H/2,Math.max(W,H)*.7);vig.addColorStop(0,'#07102100');vig.addColorStop(1,'#030812b0');ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
}
function sprite(image,index,cols,size,x,y,w,h){if(!ready(image))return false;const cell=image.naturalWidth/cols;ctx.drawImage(image,(index%cols)*cell,Math.floor(index/cols)*cell,cell,cell,x-w/2,y-h*.77,w,h);return true;}
function enemy(e,g,t){
 const x=e.x-g.p.x+V.width/2,y=e.y-g.p.y+V.height/2;if(x<-280||x>V.width+280||y<-280||y>V.height+280)return;
 ctx.save();ctx.translate(x,y);const wind=e.action==='windup',enraged=e.type==='boss'&&e.bossPhase===2;
 if(enraged){const radius=e.r+13+(TG.store.data.settings.reduceFX?0:Math.sin(t*3)*2);ctx.lineWidth=2;circle(0,0,radius,'#713b541c','#df96b499')}
 if(wind){
  ctx.lineWidth=1.5;ctx.strokeStyle='#efb8cc';ctx.fillStyle='#d77e9b22';
  if(e.type==='boss'){
   const diagonal=g.stage===1&&e.attackVariant==='diagonal';
   if(g.stage===1){ctx.save();if(diagonal)ctx.rotate(Math.PI/4);ctx.fillRect(-220,-23,440,46);ctx.fillRect(-23,-220,46,440);ctx.strokeRect(-220,-23,440,46);ctx.strokeRect(-23,-220,46,440);ctx.restore()}
   else{circle(0,0,e.pulseRadius,'#ba637c22','#ecadc5');ctx.setLineDash([7,6]);circle(0,0,e.pulseRadius,null,'#f3d6d6');ctx.setLineDash([])}
   if(g.stage===2){const a=Math.atan2(e.aimY,e.aimX),half=e.attackPhase===2?3*Math.PI/16:Math.PI/4;ctx.strokeStyle='#b9e6df';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,e.pulseRadius,a-half,a+half);ctx.stroke()}
   ctx.fillStyle='#f9e1dc';ctx.font='11px sans-serif';ctx.textAlign='center';
   const hint=g.stage===0?(e.attackPhase===2?'충격파 · 뒤따르는 잔진동 주의':'충격파 · 원 밖으로'):g.stage===1?(diagonal?'종소리 · 대각선 밖으로':'종소리 · 십자 밖으로'):'탄막 · 푸른 틈으로 피하기';
   ctx.fillText(hint,0,-e.pulseRadius-10);
   const maxWarning=[1.35,1.6,1.7][g.stage],progress=clamp(1-e.clock/maxWarning,0,1);
   ctx.strokeStyle='#ffdcaf';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r+33,-Math.PI/2,-Math.PI/2+TAU*progress);ctx.stroke();
  }else{ctx.rotate(Math.atan2(e.aimY,e.aimX));ctx.setLineDash([7,6]);ctx.fillRect(0,-14,e.behavior==='charge'?175:230,28);ctx.strokeRect(0,-14,e.behavior==='charge'?175:230,28);ctx.setLineDash([]);ctx.rotate(-Math.atan2(e.aimY,e.aimX))}
 }
 ctx.fillStyle='#02050d77';ctx.beginPath();ctx.ellipse(0,15,e.r*1.1,7,0,0,TAU);ctx.fill();ctx.globalAlpha=e.hit>0?.65:1;
 const w=e.type==='boss'?118:e.elite?83:68,h=w,bob=Math.sin(t*3+e.phase)*1.6;
 if(!sprite(images.enemy,e.art,3,144,0,bob,w,h))circle(0,0,e.r,e.type==='boss'?'#80536f':'#66879b','#b1d2de');
 ctx.globalAlpha=1;if(e.frozen>0)circle(0,0,e.r+7,'#8acfe944','#daf4ff');if(e.slow>0)circle(0,0,e.r+3,null,'#abd9ed');
 if(e.burn>0){ctx.strokeStyle='#e9b36b';ctx.beginPath();ctx.arc(0,0,e.r+5,0,TAU*.7);ctx.stroke()}
 if(e.type==='boss'||e.elite){ctx.fillStyle='#21182b';ctx.fillRect(-34,-h*.75,68,5);ctx.fillStyle=e.type==='boss'?'#e3b4d2':'#d9c18f';ctx.fillRect(-34,-h*.75,68*clamp(e.hp/e.maxHp,0,1),5)}ctx.restore();
}
// Keep an optional field goal findable without covering the HUD or touch controls.
V.anchorMarker=function(anchor,p,width=V.width,height=V.height){
 if(!anchor)return null;
 const worldX=anchor.x-p.x+width/2,worldY=anchor.y-p.y+height/2,top=Math.min(205,Math.max(160,height*.29)),bottom=Math.max(top+30,height-Math.min(205,height*.28));
 const x=clamp(worldX,32,width-32),y=clamp(worldY,top,bottom);
 return {x,y,worldX,worldY,edge:x!==worldX||y!==worldY,angle:Math.atan2(worldY-y,worldX-x)};
};
function memoryAnchor(g,t){
 const a=g.memoryAnchor;if(!a)return;const marker=V.anchorMarker(a,g.p),reduced=TG.store.data.settings.reduceFX,low=TG.store.data.settings.quality==='low';
 ctx.save();ctx.translate(marker.x,marker.y);ctx.lineWidth=2;
 if(marker.edge){
  circle(0,0,17,'#102b32ef','#e9d39a');ctx.save();ctx.rotate(marker.angle);ctx.fillStyle='#f2d48e';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-5,-6);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();ctx.restore();
  ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f6e6c4';ctx.fillText(Math.ceil(a.remaining)+'초',0,32);
 }else{
  if(!low&&!reduced){const light=ctx.createRadialGradient(0,-12,1,0,-12,75);light.addColorStop(0,'#f3d58c55');light.addColorStop(1,'#e9bb5b00');ctx.fillStyle=light;ctx.fillRect(-75,-87,150,150);}
  circle(0,0,a.r,'#d8c07b16','#e5c888aa');ctx.strokeStyle='#fff0b9';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,a.r,-Math.PI/2,-Math.PI/2+TAU*clamp(a.charge/a.required,0,1));ctx.stroke();
  // A small railway lantern with a glass pane, distinct from damage circles.
  const bob=reduced?0:Math.sin(t*3)*2;
  if(ready(images.anchor))ctx.drawImage(images.anchor,-40,-66+bob,80,88);
  else{ctx.save();ctx.translate(0,bob-7);ctx.strokeStyle='#e6c994';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-13,6,Math.PI,TAU);ctx.stroke();ctx.fillStyle='#142837';ctx.fillRect(-10,-13,20,27);ctx.strokeRect(-10,-13,20,27);ctx.fillStyle='#ffe6a2';ctx.fillRect(-6,-9,12,18);ctx.strokeStyle='#9e7846';ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(0,13);ctx.stroke();ctx.fillStyle='#e6c994';ctx.fillRect(-13,14,26,3);ctx.restore();}
  ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff0c9';ctx.fillText('기억 등불 · '+Math.ceil(a.remaining)+'초',0,-a.r-34);
  ctx.font='10px sans-serif';ctx.fillStyle='#e8d8b7';ctx.fillText(a.charge>0?'복원 '+Math.floor(a.charge/a.required*100)+'%':'원 안에 잠시 머물기',0,a.r+16);
 }
 ctx.restore();
}
function companion(g,t){
 const m=g.mare;if(g.mode!=='story'||!m)return;
 const x=m.x-g.p.x+V.width/2,y=m.y-g.p.y+V.height/2;if(x< -100||x>V.width+100||y< -100||y>V.height+100)return;
 ctx.save();ctx.translate(x,y);ctx.fillStyle='#02040c88';ctx.beginPath();ctx.ellipse(0,18,17,5,0,0,TAU);ctx.fill();
 const frame=m.moving?1+Math.floor(t*8)%2:0,face=clamp(m.face|0,0,3),w=80,h=80,bob=m.moving&&!TG.store.data.settings.reduceFX?Math.sin(t*16)*1:0;
 if(ready(images.mare)){const cw=images.mare.naturalWidth/4,ch=(images.mare.naturalHeight||images.mare.naturalWidth*.75)/3;ctx.drawImage(images.mare,face*cw,frame*ch,cw,ch,-w/2,-h*.77+bob,w,h);}else circle(0,-8,15,'#95bcd6','#e1e8ed');
 ctx.lineWidth=1.5;circle(0,0,21,null,m.cooldown<=0?'#a8dce6aa':'#7990a044');
 ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#c8e5ee';ctx.fillText('마레',0,-h*.77-7);ctx.restore();
 if(m.pulse>0){const px=V.width/2,py=V.height/2;ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#c0ebff';ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(px,py-12);ctx.stroke();ctx.beginPath();ctx.ellipse(px,py-12,34,43,0,0,TAU);ctx.stroke();ctx.fillStyle='#e1f5ff';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText('마레의 보호',px,py-63);ctx.restore();}
}
function hero(g,t){const x=V.width/2,y=V.height/2;ctx.save();ctx.translate(x,y);const grad=ctx.createRadialGradient(-17,14,0,-17,14,90);grad.addColorStop(0,'#f7bc7328');grad.addColorStop(1,'#f7bc7300');ctx.fillStyle=grad;ctx.fillRect(-107,-76,180,180);ctx.fillStyle='#02040c99';ctx.beginPath();ctx.ellipse(0,22,21,6,0,0,TAU);ctx.fill();ctx.strokeStyle='#c8bd9677';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,14,0,TAU);ctx.stroke();
 const frame=g.moving?1+Math.floor(t*8)%2:0,index=frame*4+g.face,w=91,h=91,bob=g.moving&&!TG.store.data.settings.reduceFX?Math.sin(t*16)*1.2:0;const hurt=g.time-g.lastHit<.3;if(g.overcharge>0){const reduced=TG.store.data.settings.reduceFX;ctx.lineWidth=2;circle(0,-8,reduced?39:39+Math.sin(t*5)*2,'#f3cc7c0d','#efd18b99');}if(g.dash.invulnerable){
  if(!TG.store.data.settings.reduceFX&&TG.store.data.settings.quality!=='low'){
    for(let n=2;n>=1;n--){ctx.globalAlpha=n===2?.10:.23;sprite(images.hero,index,4,144,-g.dash.x*21*n,-g.dash.y*21*n,w,h)}
    ctx.globalAlpha=1;
  }
  circle(0,0,27,null,'#eadbb8');
 }
 if(g.status==='ended'&&g.p.hp<=0){ctx.rotate(-.2);ctx.globalAlpha=.45}else ctx.globalAlpha=hurt?.6:1;
 if(!sprite(images.hero,index,4,144,0,bob,w,h)){if(ready(images.fallback))ctx.drawImage(images.fallback,-35,-62,70,84);else circle(0,0,15,'#c4cfdf','#d1b780')}ctx.globalAlpha=1;
 if(g.p.hp/g.p.maxHp<=.30){ctx.lineWidth=1.8;circle(0,0,23,null,'#ec91b0')}
  if(g.commandEffects?.ward>0){ctx.lineWidth=2;circle(0,-10,47,'#83c4e919','#91d9ef');ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#c9edff';ctx.fillText('지휘 장막',0,-62);}
  if(g.p.shield){ctx.strokeStyle='#afd8f0';ctx.beginPath();ctx.ellipse(0,-12,33,44,0,0,TAU);ctx.stroke()}
 for(let i=0;i<g.p.orbit;i++){const a=t*2.4+i*TAU/g.p.orbit;ctx.save();ctx.translate(Math.cos(a)*65,Math.sin(a)*65);ctx.rotate(a);ctx.fillStyle=g.synergies.frostOrbit?'#aee5fb':'#e8d1a1';ctx.fillRect(-3,-10,6,20);ctx.restore()}ctx.restore();}
V.draw=function(now){if(!ctx)return;const g=TG.engine.g,t=g?g.time:now/1000,cx=g?.p.x||0,cy=g?.p.y||0,W=V.width,H=V.height;ctx.save();if(g&&g.shake&&!TG.store.data.settings.reduceFX)ctx.translate(Math.sin(t*130)*g.shake*.5,Math.cos(t*190)*g.shake*.5);background(g,t,cx,cy);if(g){memoryAnchor(g,t);const sx=x=>x-cx+W/2,sy=y=>y-cy+H/2;for(const h of g.hazards){ctx.lineWidth=1.5;const warning=h.age<h.warning;ctx.setLineDash(warning?[6,5]:[]);circle(sx(h.x),sy(h.y),h.r,warning?'#ae769422':'#23102a99',warning?'#dd9cba':'#ce7aa2');ctx.setLineDash([]);if(warning){ctx.fillStyle='#f4c7dc';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('소거 예고',sx(h.x),sy(h.y)+3)}}
 for(const shock of g.aftershocks||[]){
  const x=sx(shock.x),y=sy(shock.y);if(x+shock.r<0||x-shock.r>W||y+shock.r<0||y-shock.r>H)continue;
  const warning=shock.age<shock.warning;ctx.lineWidth=2;ctx.setLineDash(warning?[6,5]:[]);
  circle(x,y,shock.r,warning?'#ce6b8722':TG.store.data.settings.reduceFX?null:'#e8b58722',warning?'#f1adc8':'#ffe0b0');ctx.setLineDash([]);
  if(warning&&!TG.store.data.settings.reduceFX){ctx.beginPath();ctx.arc(x,y,shock.r+4,-Math.PI/2,-Math.PI/2+TAU*clamp(shock.age/shock.warning,0,1));ctx.stroke()}
  ctx.fillStyle='#f6d4df';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(warning?'잔진동 예고':'잔진동',x,y+3);
 }
 if(g.wave){ctx.setLineDash([5,5]);for(const point of g.wave.points){circle(sx(point.x),sy(point.y),22,'#b5759222','#edbdad');}ctx.setLineDash([]);}
 for(const flame of g.flames){circle(sx(flame.x),sy(flame.y),flame.r,'#e4a04722','#efba7799');}
 for(const drop of g.eliteDrops||[]){
  const x=sx(drop.x),y=sy(drop.y);if(x< -30||x>W+30||y< -35||y>H+35)continue;
  ctx.save();ctx.translate(x,y);const reduced=TG.store.data.settings.reduceFX;ctx.lineWidth=1.5;
  circle(0,0,reduced?17:17+Math.sin(t*4)*1.5,'#edc47722','#f1cf8c');
  ctx.save();ctx.rotate(Math.PI/4);ctx.fillStyle='#f4d49b';ctx.fillRect(-6,-6,12,12);ctx.restore();
  ctx.fillStyle='#fff2d5';ctx.fillRect(-1,-5,2,10);ctx.fillRect(-4,-1,8,2);
  ctx.fillStyle='#f3d9ab';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(drop.life<=5?Math.ceil(Math.max(0,drop.life))+'초':'정예의 불씨',0,-23);ctx.restore();
 }
 for(const d of g.drops){const x=sx(d.x),y=sy(d.y);if(x<-10||x>W+10||y<-10||y>H+10)continue;ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle=d.value>1?'#ebd19d':'#b2dfeb';ctx.fillRect(-3,-3,6,6);ctx.restore()}
 for(const link of g.links){ctx.strokeStyle='#d7e9ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx(link.x1),sy(link.y1));ctx.lineTo(sx(link.x2),sy(link.y2));ctx.stroke();}
 for(const e of g.enemies)enemy(e,g,t);for(const b of g.bullets){ctx.strokeStyle=g.levels.ember?'#edd09a':'#c4ecfa';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx(b.x),sy(b.y));ctx.lineTo(sx(b.x)-b.vx*.023,sy(b.y)-b.vy*.023);ctx.stroke()}for(const b of g.hostile){circle(sx(b.x),sy(b.y),6,'#d98e98','#ffe0c3')}
 const low=TG.store.data.settings.quality==='low';if(!low)for(const p of g.particles){ctx.globalAlpha=p.life/p.max;ctx.fillStyle=p.color;ctx.fillRect(sx(p.x),sy(p.y),p.size,p.size)}ctx.globalAlpha=1;for(const r of g.rings){ctx.globalAlpha=r.life/r.max;circle(sx(r.x),sy(r.y),r.r*(1.5-r.life/r.max*.5),null,r.color)}ctx.globalAlpha=1;companion(g,t);hero(g,t);
 if(g.flash&&!TG.store.data.settings.reduceFX){ctx.fillStyle=`rgba(180,57,95,${g.flash*.4})`;ctx.fillRect(0,0,W,H)}}ctx.restore();};
})();
