'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/render.js'),'utf8');

function boot(width,height,dpr=3,quality='auto'){
 let writes=0,transforms=0;
 const context={setTransform(){transforms++}};
 const canvas={
  clientWidth:width,clientHeight:height,
  _width:0,_height:0,
  get width(){return this._width;},set width(v){this._width=v;writes++;},
  get height(){return this._height;},set height(v){this._height=v;writes++;},
  getContext(){return context;}
 };
 const sandbox={
  Math,Image:class{constructor(){this.complete=false;this.naturalWidth=0;}},
  TG:{store:{data:{settings:{quality}}}},
  innerWidth:200,innerHeight:200,devicePixelRatio:dpr
 };
 vm.runInNewContext(source,sandbox,{filename:'render.js'});
 sandbox.TG.view.init(canvas);
 return {canvas,TG:sandbox.TG,get writes(){return writes;},get transforms(){return transforms;}};
}

test('Canvas uses visual CSS dimensions for Safari toolbar changes and avoids identical reallocations',()=>{
 const h=boot(390,844,3);
 assert.equal(h.TG.view.width,390);
 assert.equal(h.TG.view.height,844);
 assert.equal(h.canvas.width,780);
 assert.equal(h.canvas.height,1688);
 const writes=h.writes,transforms=h.transforms;
 h.TG.view.resize();
 assert.equal(h.writes,writes);
 assert.equal(h.transforms,transforms);
 h.canvas.clientHeight=720;
 h.TG.view.resize();
 assert.equal(h.TG.view.height,720);
 assert(h.writes>writes);
});

test('high DPR display respects backing pixel budget and low-quality mode stays predictable',()=>{
 const h=boot(1600,1000,3);
 assert(h.canvas.width*h.canvas.height<=2104000);
 assert(h.canvas.width>1600);
 h.TG.store.data.settings.quality='low';
 h.TG.view.resize();
 assert.equal(h.canvas.width,1600);
 assert.equal(h.canvas.height,1000);
 assert.equal(h.TG.view.width,1600);
});
