'use strict';
(()=>{
const V=TG.view={width:390,height:844};let canvas,ctx;const images={};const TAU=Math.PI*2;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
V.init=function(el){canvas=el;ctx=canvas.getContext('2d',{alpha:false});for(const [key,url]of Object.entries({hero:'assets/rize-walk-v09.webp',enemy:'assets/enemies-v09.webp',floor:'assets/platform-stone-v03.webp',fallback:'assets/rize-sd-v03.webp'})){const im=new Image();im.src=url;images[key]=im}V.resize()};
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
function background(g,t,cx,cy){const W=V.width,H=V.height;ctx.fillStyle='#101727';ctx.fillRect(0,0,W,H);const size=560,ox=((-cx+W/2)%size+size)%size,oy=((-cy+H/2)%size+size)%size;if(ready(images.floor))for(let x=ox-size;x<W;x+=size)for(let y=oy-size;y<H;y+=size)ctx.drawImage(images.floor,x,y,size,size);ctx.fillStyle=['#0b102349','#142f4349','#291e334f'][g?.stage||0];ctx.fillRect(0,0,W,H);

 if(g?.stage===1){ctx.fillStyle='#c7d9e51d';for(let i=0;i<8;i++){const wx=Math.floor(cx/470)*470+(i%3)*180-250,wy=Math.floor(cy/430)*430+Math.floor(i/3)*180-250;ctx.beginPath();ctx.ellipse(wx-cx+W/2,wy-cy+H/2,65,22,.3,0,TAU);ctx.fill();}}
 if(g?.stage===2){const clockX=Math.floor(cx/560)*560-cx+W/2+210,clockY=Math.floor(cy/560)*560-cy+H/2+200;ctx.strokeStyle='#b59a6c30';ctx.lineWidth=1.5;circle(clockX,clockY,92,null,'#b59a6c30');circle(clockX,clockY,84,null,'#b59a6c30');for(let k=0;k<12;k++){const a=k*TAU/12;ctx.beginPath();ctx.moveTo(clockX+Math.cos(a)*78,clockY+Math.sin(a)*78);ctx.lineTo(clockX+Math.cos(a)*87,clockY+Math.sin(a)*87);ctx.stroke();}}
 const rail=570;for(let wx=Math.floor((cx-W/2-180)/rail)*rail;wx<cx+W/2+180;wx+=rail){const x=wx-cx+W/2;ctx.fillStyle='#0a111f';ctx.fillRect(x-44,0,88,H);for(let wy=Math.floor((cy-H/2)/70)*70;wy<cy+H/2+70;wy+=70){ctx.fillStyle='#253345';ctx.fillRect(x-49,wy-cy+H/2,98,8)}ctx.fillStyle='#627080';ctx.fillRect(x-38,0,3,H);ctx.fillRect(x+36,0,3,H);ctx.setLineDash([10,12]);ctx.strokeStyle='#b8a27666';ctx.beginPath();ctx.moveTo(x+64,0);ctx.lineTo(x+64,H);ctx.stroke();ctx.setLineDash([]);
 for(let wy=Math.floor((cy-H/2-140)/410)*410;wy<cy+H/2+140;wy+=410){const y=wy-cy+H/2,lx=x+139,ly=y-42;const grad=ctx.createRadialGradient(lx,ly,0,lx,ly,100);grad.addColorStop(0,'#e6aa6440');grad.addColorStop(1,'#e6aa6400');ctx.fillStyle=grad;ctx.fillRect(lx-100,ly-100,200,200);ctx.strokeStyle='#84724f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(lx,y+27);ctx.lineTo(lx,ly-14);ctx.bezierCurveTo(lx,ly-32,lx+27,ly-32,lx+27,ly-16);ctx.stroke();ctx.fillStyle='#101624';ctx.fillRect(lx-10,y+25,20,7);ctx.fillStyle='#f2c68a';ctx.fillRect(lx+20,ly-15,14,21);ctx.strokeStyle='#97805a';ctx.lineWidth=1.5;ctx.strokeRect(lx+19,ly-16,16,23);ctx.fillStyle='#192335';ctx.fillRect(lx-34,y+53,90,21);ctx.strokeStyle='#867451';ctx.strokeRect(lx-34,y+53,90,21);ctx.fillStyle='#c1b7a0';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(['거울 유리역','침묵의 설원역','종착 승강장'][g?.stage||0],lx+11,y+67);}}
 const low=TG.store.data.settings.quality==='low';for(let i=0;i<(low?18:34);i++){const x=((i*193+t*9-cx*.12)%(W+100)+W+100)%(W+100)-50,y=((i*137+t*(10+i%5)-cy*.12)%(H+100)+H+100)%(H+100)-50;ctx.fillStyle='#d5e0ef66';circle(x,y,1+i%2*.4,'#d5e0ef66')}
 const vig=ctx.createRadialGradient(W/2,H/2,80,W/2,H/2,Math.max(W,H)*.7);vig.addColorStop(0,'#07102100');vig.addColorStop(1,'#030812b0');ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
}
function sprite(image,index,cols,size,x,y,w,h){if(!ready(image))return false;const cell=image.naturalWidth/cols;ctx.drawImage(image,(index%cols)*cell,Math.floor(index/cols)*cell,cell,cell,x-w/2,y-h*.77,w,h);return true;}
function enemy(e,g,t){const x=e.x-g.p.x+V.width/2,y=e.y-g.p.y+V.height/2;if(x<-280||x>V.width+280||y<-280||y>V.height+280)return;ctx.save();ctx.translate(x,y);const wind=e.action==='windup';
 if(wind){ctx.lineWidth=1.5;ctx.strokeStyle='#efb8cc';ctx.fillStyle='#d77e9b22';if(e.type==='boss'){if(g.stage===1){ctx.fillRect(-220,-23,440,46);ctx.fillRect(-23,-220,46,440);ctx.strokeRect(-220,-23,440,46);ctx.strokeRect(-23,-220,46,440)}else{circle(0,0,e.pulseRadius,'#ba637c22','#ecadc5');ctx.setLineDash([7,6]);circle(0,0,e.pulseRadius,null,'#f3d6d6');ctx.setLineDash([])}if(g.stage===2){const a=Math.atan2(e.aimY,e.aimX);ctx.strokeStyle='#b9e6df';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,e.pulseRadius,a-Math.PI/4,a+Math.PI/4);ctx.stroke();}ctx.fillStyle='#f9e1dc';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(g.stage===0?'충격파 · 원 밖으로':g.stage===1?'종소리 · 십자 밖으로':'탄막 · 틈으로 피하기',0,-e.pulseRadius-10);
 const maxWarning=[1.35,1.6,1.7][g.stage],progress=clamp(1-e.clock/maxWarning,0,1);
 ctx.strokeStyle='#ffdcaf';ctx.lineWidth=3;ctx.beginPath();
 ctx.arc(0,0,e.r+33,-Math.PI/2,-Math.PI/2+TAU*progress);ctx.stroke();
 }else{ctx.rotate(Math.atan2(e.aimY,e.aimX));ctx.setLineDash([7,6]);ctx.fillRect(0,-14,e.behavior==='charge'?175:230,28);ctx.strokeRect(0,-14,e.behavior==='charge'?175:230,28);ctx.setLineDash([]);ctx.rotate(-Math.atan2(e.aimY,e.aimX))}}
 ctx.fillStyle='#02050d77';ctx.beginPath();ctx.ellipse(0,15,e.r*1.1,7,0,0,TAU);ctx.fill();ctx.globalAlpha=e.hit>0?.65:1;const w=e.type==='boss'?118:e.elite?83:68,h=w;const bob=Math.sin(t*3+e.phase)*1.6;if(!sprite(images.enemy,e.art,3,144,0,bob,w,h))circle(0,0,e.r,e.type==='boss'?'#80536f':'#66879b','#b1d2de');ctx.globalAlpha=1;if(e.frozen>0)circle(0,0,e.r+7,'#8acfe944','#daf4ff');if(e.slow>0)circle(0,0,e.r+3,null,'#abd9ed');if(e.burn>0){ctx.strokeStyle='#e9b36b';ctx.beginPath();ctx.arc(0,0,e.r+5,0,TAU*.7);ctx.stroke()}if(e.type==='boss'||e.elite){ctx.fillStyle='#21182b';ctx.fillRect(-34,-h*.75,68,5);ctx.fillStyle=e.type==='boss'?'#e3b4d2':'#d9c18f';ctx.fillRect(-34,-h*.75,68*clamp(e.hp/e.maxHp,0,1),5)}ctx.restore();}
function hero(g,t){const x=V.width/2,y=V.height/2;ctx.save();ctx.translate(x,y);const grad=ctx.createRadialGradient(-17,14,0,-17,14,90);grad.addColorStop(0,'#f7bc7328');grad.addColorStop(1,'#f7bc7300');ctx.fillStyle=grad;ctx.fillRect(-107,-76,180,180);ctx.fillStyle='#02040c99';ctx.beginPath();ctx.ellipse(0,22,21,6,0,0,TAU);ctx.fill();ctx.strokeStyle='#c8bd9677';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,14,0,TAU);ctx.stroke();
 const frame=g.moving?1+Math.floor(t*8)%2:0,index=frame*4+g.face,w=91,h=91,bob=g.moving&&!TG.store.data.settings.reduceFX?Math.sin(t*16)*1.2:0;const hurt=g.time-g.lastHit<.3;if(g.dash.invulnerable){
  if(!TG.store.data.settings.reduceFX&&TG.store.data.settings.quality!=='low'){
    for(let n=2;n>=1;n--){ctx.globalAlpha=n===2?.10:.23;sprite(images.hero,index,4,144,-g.dash.x*21*n,-g.dash.y*21*n,w,h)}
    ctx.globalAlpha=1;
  }
  circle(0,0,27,null,'#eadbb8');
 }
 if(g.status==='ended'&&g.p.hp<=0){ctx.rotate(-.2);ctx.globalAlpha=.45}else ctx.globalAlpha=hurt?.6:1;
 if(!sprite(images.hero,index,4,144,0,bob,w,h)){if(ready(images.fallback))ctx.drawImage(images.fallback,-35,-62,70,84);else circle(0,0,15,'#c4cfdf','#d1b780')}ctx.globalAlpha=1;
 if(g.p.hp/g.p.maxHp<=.30){ctx.lineWidth=1.8;circle(0,0,23,null,'#ec91b0')}
  if(g.p.shield){ctx.strokeStyle='#afd8f0';ctx.beginPath();ctx.ellipse(0,-12,33,44,0,0,TAU);ctx.stroke()}
 for(let i=0;i<g.p.orbit;i++){const a=t*2.4+i*TAU/g.p.orbit;ctx.save();ctx.translate(Math.cos(a)*65,Math.sin(a)*65);ctx.rotate(a);ctx.fillStyle=g.synergies.frostOrbit?'#aee5fb':'#e8d1a1';ctx.fillRect(-3,-10,6,20);ctx.restore()}ctx.restore();}
V.draw=function(now){if(!ctx)return;const g=TG.engine.g,t=g?.time||now/1000,cx=g?.p.x||0,cy=g?.p.y||0,W=V.width,H=V.height;ctx.save();if(g&&g.shake&&!TG.store.data.settings.reduceFX)ctx.translate(Math.sin(now*.13)*g.shake*.5,Math.cos(now*.19)*g.shake*.5);background(g,t,cx,cy);if(g){const sx=x=>x-cx+W/2,sy=y=>y-cy+H/2;for(const h of g.hazards){ctx.lineWidth=1.5;const warning=h.age<h.warning;ctx.setLineDash(warning?[6,5]:[]);circle(sx(h.x),sy(h.y),h.r,warning?'#ae769422':'#23102a99',warning?'#dd9cba':'#ce7aa2');ctx.setLineDash([]);if(warning){ctx.fillStyle='#f4c7dc';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('소거 예고',sx(h.x),sy(h.y)+3)}}
 if(g.wave){ctx.setLineDash([5,5]);for(const point of g.wave.points){circle(sx(point.x),sy(point.y),22,'#b5759222','#edbdad');}ctx.setLineDash([]);}
 for(const flame of g.flames){circle(sx(flame.x),sy(flame.y),flame.r,'#e4a04722','#efba7799');}
 for(const d of g.drops){const x=sx(d.x),y=sy(d.y);if(x<-10||x>W+10||y<-10||y>H+10)continue;ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle=d.value>1?'#ebd19d':'#b2dfeb';ctx.fillRect(-3,-3,6,6);ctx.restore()}
 for(const link of g.links){ctx.strokeStyle='#d7e9ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx(link.x1),sy(link.y1));ctx.lineTo(sx(link.x2),sy(link.y2));ctx.stroke();}
 for(const e of g.enemies)enemy(e,g,t);for(const b of g.bullets){ctx.strokeStyle=g.levels.ember?'#edd09a':'#c4ecfa';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx(b.x),sy(b.y));ctx.lineTo(sx(b.x)-b.vx*.023,sy(b.y)-b.vy*.023);ctx.stroke()}for(const b of g.hostile){circle(sx(b.x),sy(b.y),6,'#d98e98','#ffe0c3')}
 const low=TG.store.data.settings.quality==='low';if(!low)for(const p of g.particles){ctx.globalAlpha=p.life/p.max;ctx.fillStyle=p.color;ctx.fillRect(sx(p.x),sy(p.y),p.size,p.size)}ctx.globalAlpha=1;for(const r of g.rings){ctx.globalAlpha=r.life/r.max;circle(sx(r.x),sy(r.y),r.r*(1.5-r.life/r.max*.5),null,r.color)}ctx.globalAlpha=1;hero(g,t);
 if(g.flash&&!TG.store.data.settings.reduceFX){ctx.fillStyle=`rgba(180,57,95,${g.flash*.4})`;ctx.fillRect(0,0,W,H)}}ctx.restore();};
})();
