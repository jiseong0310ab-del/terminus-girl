const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');const {ROOT}=require('./helpers.cjs');
function bootUI(options={}){const els=new Map();const windowEvents={},documentEvents={};const on=(map,type,fn)=>(map[type]??=[]).push(fn);let document;const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});function el(id){const classes=new Set(),e={id,style:{},dataset:{},attrs:{},children:[],hidden:false,value:'',checked:false,textContent:'',classList:{toggle(n,v){if(v)classes.add(n);else classes.delete(n)},add(n){classes.add(n)},remove(n){classes.delete(n)}},append(...nodes){this.children.push(...nodes)},appendChild(n){this.children.push(n)},replaceChildren(...nodes){this.children=nodes},setAttribute(k,v){this.attrs[k]=v},addEventListener(){},focus(){document.activeElement=this},getContext:()=>ctx,getBoundingClientRect:()=>({left:20,top:600,width:136,height:136}),hasPointerCapture:()=>false,remove(){}};els.set(id,e);return e}for(const m of fs.readFileSync(path.join(ROOT,'index.html'),'utf8').matchAll(/id="([^"]+)"/g))el(m[1]);document={activeElement:null,body:el('body'),hidden:false,getElementById:id=>els.get(id),createElement:tag=>el(Math.random()+tag),createTextNode:s=>({textContent:s}),addEventListener:(t,f)=>on(documentEvents,t,f)};const values=new Map(),c={console,Math,Date,Set,Map,JSON,document,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},Image:class{constructor(){this.complete=false;this.naturalWidth=0}},navigator:options.navigator||{},isSecureContext:!!options.navigator?.serviceWorker,Date:options.Date||Date,innerWidth:390,innerHeight:844,devicePixelRatio:1,requestAnimationFrame:()=>1,setInterval:()=>1,setTimeout:()=>1,addEventListener:(t,f)=>on(windowEvents,t,f),performance:{now:()=>0}};c.window=c;c.TG={};vm.createContext(c);for(const file of ['data','store','audio','game','render','input','ui'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),c,{filename:file+'.js'});return{c,TG:c.TG,$:id=>els.get(id),fireWindow:type=>(windowEvents[type]||[]).forEach(fn=>fn({})),fireDocument:type=>(documentEvents[type]||[]).forEach(fn=>fn({}))}}
test('real UI module initializes and routes every gameplay screen without missing bindings',()=>{const{TG,$}=bootUI();assert.equal(TG.ui.screen,'menu');$('enterHub').onclick();assert.equal(TG.ui.screen,'hub');$('chapterStart').onclick();assert.equal(TG.ui.screen,'playing');assert.equal($('hud').style.display,'block');$('pauseBtn').onclick();assert.equal(TG.ui.screen,'paused');$('pauseSettings').onclick();assert.equal(TG.ui.screen,'settings');$('settingsBack').onclick();assert.equal(TG.ui.screen,'paused');$('resumeBtn').onclick();TG.engine.g.xp=99;TG.engine.checkLevel();assert.equal(TG.ui.screen,'cards');assert($('cardList').children.length>0);while(TG.engine.g.status==='cards')$('cardList').children[0].onclick();TG.engine.stageClear();assert.equal(TG.ui.screen,'camp');$('eventChoices').children[0].onclick();assert.equal($('nextStage').disabled,false);$('campHub').onclick();assert.equal(TG.ui.screen,'hub');$('continueRun').onclick();assert.equal(TG.ui.screen,'camp');$('nextStage').onclick();assert.equal(TG.engine.g.stage,1);while(TG.engine.g.status==='cards')$('cardList').children[0].onclick();TG.engine.finish(false,'retreat');assert.equal(TG.ui.screen,'ended');assert($('endTitle').textContent);$('backBtn').onclick();$('openArchive').onclick();assert.equal($('memoryList').children.length,6);$('archiveBack').onclick();$('hubSettings').onclick();$('bgmVolume').value=0;$('bgmVolume').oninput();assert.equal(TG.store.data.settings.bgm,0);TG.ui.show('menu');$('menuAbout').onclick();assert.equal(TG.ui.screen,'about')});
module.exports={bootUI};

test('boss HUD shows current health and readable attack cues, then hides when over',()=>{
 const {TG,$}=bootUI();$('quickStart').onclick();
 assert.equal($('bossHud').hidden,true);
 const boss=TG.engine.enemy('boss',120,0);boss.hp=boss.maxHp/2;boss.action='windup';
 TG.engine.g.p.hp=20;TG.ui.refreshHud();
 assert.equal($('bossHud').hidden,false);
 assert.equal($('bossName').textContent,TG.STAGES[0].boss);
 assert.equal($('bossTrack').attrs['aria-valuenow'],'50');
 assert.equal($('bossHpFill').style.width,'50%');
 assert.match($('bossStatus').textContent,/공격 예고/);
 boss.action='recover';TG.ui.refreshHud();
 assert.match($('bossStatus').textContent,/반격/);
 TG.engine.g.enemies=[];TG.ui.refreshHud();
 assert.equal($('bossHud').hidden,true);
 TG.engine.pause();assert.equal($('bossHud').hidden,true);
});

test('level-up cards preview the synergy unlocked by choosing them',()=>{
 const {TG,$}=bootUI();$('quickStart').onclick();
 const g=TG.engine.g;g.levels.clock=2;TG.engine.rebuild();
 g.offered=['shield','magnet','blade'];g.offerToken=42;g.status='cards';TG.ui.show('cards');
 const options=$('cardList').children;
 assert.equal(options.length,3);
 const shield=options[0],description=shield.children[1].children.map(e=>e.textContent).join(' ');
 assert.match(shield.className,/synergyReady/);
 assert.match(description,/선택 즉시 발동/);
 assert.match(description,/푸른 귀환/);
 assert.doesNotMatch(options[1].className,/synergyReady/);
 assert.equal($('bossHud').hidden,true);
 shield.onclick();
 assert.equal(TG.engine.g.synergies.safeDash,true);
 assert.equal(TG.ui.screen,'playing');
});

test('visual feedback has mobile-safe boss layout and readable card hints',()=>{
 const css=fs.readFileSync(path.join(ROOT,'style.css'),'utf8');
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 assert.match(css,/\.bossHud\.warning/);
 assert.match(css,/@media \(orientation:landscape\) and \(max-height:500px\)/);
 assert.match(css,/#levelScreen \.carddesc\{font-size:13px/);
 assert.match(html,/id="bossTrack"[^>]*role="progressbar"/);
 assert.match(html,/class="cardLegend"/);
});

test('a card selection after audio suspension explicitly unlocks audio before combat resumes',()=>{
 const {TG,$}=bootUI();let unlocks=0;
 TG.audio.unlock=()=>{unlocks++};
 $('quickStart').onclick();
 const g=TG.engine.g;
 g.xp=g.xpNeed;TG.engine.checkLevel();
 assert.equal(TG.ui.screen,'cards');
 const before=unlocks;
 $('cardList').children[0].onclick();
 assert.equal(unlocks,before+1);
 assert.equal(TG.ui.screen,'playing');
});

test('a station event choice after returning from background unlocks audio',()=>{
 const {TG,$}=bootUI();let unlocks=0;
 TG.audio.unlock=()=>{unlocks++};
 $('enterHub').onclick();$('chapterStart').onclick();
 TG.engine.stageClear();
 assert.equal(TG.ui.screen,'camp');
 const before=unlocks;
 $('eventChoices').children[0].onclick();
 assert.equal(unlocks,before+1);
 assert.equal(TG.engine.g.eventDone,true);
});

test('a dismissed waiting update stays dismissed and never activates while fighting',async()=>{
 let posted=0,updates=0;
 const waiting={postMessage(){posted++}};
 const registration={waiting,update:async()=>{updates++},addEventListener(){}};
 const sw={controller:{},register:async()=>registration,addEventListener(){}};
 const h=bootUI({navigator:{serviceWorker:sw}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.$('updateBanner').style.display,'block');
 h.$('dismissUpdate').onclick();
 assert.equal(h.$('updateBanner').style.display,'none');
 h.$('enterHub').onclick();
 assert.equal(h.$('updateBanner').style.display,'none');
 h.$('quickStart').onclick();
 h.$('applyUpdate').onclick();
 assert.equal(posted,0,'an active run cannot be replaced by an update');
});

test('returning to the foreground checks for updates no more than once per minute',async()=>{
 let now=1000000,updates=0;
 class Clock extends Date{static now(){return now}}
 const registration={waiting:null,update:async()=>{updates++},addEventListener(){}};
 const sw={controller:{},register:async()=>registration,addEventListener(){}};
 const h=bootUI({navigator:{serviceWorker:sw},Date:Clock});
 await new Promise(resolve=>setImmediate(resolve));
 now+=61000;h.fireWindow('pageshow');
 assert.equal(updates,1);
 h.fireWindow('pageshow');
 assert.equal(updates,1);
 now+=61000;h.fireDocument('visibilitychange');
 assert.equal(updates,2);
});

test('failed camp save cannot leave for the hub or claim the event is saved',()=>{
 const {TG,c,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();TG.engine.stageClear();
 const camp=TG.engine.g,write=c.localStorage.setItem;
 c.localStorage.setItem=()=>{throw Error('quota')};camp.shards+=3;$('campHub').onclick();
 assert.equal(TG.engine.g,camp);assert.equal(TG.ui.screen,'camp');assert.match($('campSaveStatus').textContent,/저장/);
 $('campSettings').onclick();assert.equal(TG.ui.screen,'settings');$('settingsBack').onclick();assert.equal(TG.ui.screen,'camp');
 c.localStorage.setItem=write;$('campHub').onclick();assert.equal(TG.ui.screen,'hub');assert.equal(TG.engine.g,null);
});

test('settings cannot activate an update while a paused fight or camp is still active',async()=>{
 let posted=0;const registration={waiting:{postMessage(){posted++}},addEventListener(){}};
 const h=bootUI({navigator:{serviceWorker:{controller:{},register:async()=>registration,addEventListener(){}}}});
 await new Promise(setImmediate);
 h.$('enterHub').onclick();h.$('chapterStart').onclick();h.$('pauseBtn').onclick();h.$('pauseSettings').onclick();
 assert.equal(h.$('applyUpdate').hidden,true);h.$('applyUpdate').onclick();assert.equal(posted,0);
 h.$('settingsBack').onclick();h.$('resumeBtn').onclick();h.TG.engine.stageClear();h.$('campSettings').onclick();
 assert.equal(h.$('applyUpdate').hidden,true);h.$('applyUpdate').onclick();assert.equal(posted,0);
 h.$('settingsBack').onclick();h.$('campHub').onclick();assert.equal(h.$('applyUpdate').hidden,false);h.$('applyUpdate').onclick();assert.equal(posted,1);
});

test('a conflict during card choice opens backup settings without consuming a card',()=>{
 const {TG,c,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();
 const g=TG.engine.g;g.xp=g.xpNeed;TG.engine.checkLevel();const offered=[...g.offered],token=g.offerToken;
 const changed=TG.store.fresh();changed.wallet=71;c.localStorage.setItem('terminusSaveV1',TG.store.encode(changed));
 assert.equal(TG.store.canWrite(),false);assert.equal(TG.ui.screen,'settings');assert.equal(TG.ui.returnTo,'cards');
 assert.equal(g.status,'cards');assert.deepEqual([...g.offered],offered);assert.equal(g.offerToken,token);
 assert.match($('settingsStatus').textContent,/다른 탭/);
 assert.equal(TG.engine.choose(offered[0],token),false);
});
test('an import read error is shown without discarding the active run',async()=>{
 const {TG,c,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();$('pauseBtn').onclick();$('pauseSettings').onclick();
 const g=TG.engine.g,backup=TG.store.export(),before=backup;
 $('importFile').files=[{size:backup.length,text:async()=>backup}];await $('importFile').onchange();
 c.localStorage.getItem=()=>{throw Error('blocked')};
 assert.doesNotThrow(()=>$('modalYes').onclick());assert.equal(TG.engine.g,g);assert.equal(TG.store.export(),before);
 assert.match($('importNote').textContent,/복원/);
});

test('wave warning shows a countdown and hint, renders markers and disappears after spawning',()=>{
 const {TG,$}=bootUI();$('quickStart').onclick();const g=TG.engine.g;g.time=25;TG.engine.update(.04);TG.ui.refreshHud();
 assert.equal($('guide').style.display,'block');assert.match($('guide').textContent,/거울의 포위/);assert.match($('guide').textContent,/초/);
 assert.doesNotThrow(()=>TG.view.draw(1000));g.wave.remaining=.01;TG.engine.update(.04);TG.ui.refreshHud();assert.equal($('guide').style.display,'none');
});

test('visible browser blur does not open the real pause screen, while app hiding still does',()=>{
 const h=bootUI();h.$('quickStart').onclick();
 for(let i=0;i<6;i++){h.TG.engine.g.time+=10;h.fireWindow('blur');assert.equal(h.TG.ui.screen,'playing');assert.equal(h.TG.engine.g.status,'playing')}
 h.c.document.hidden=true;h.fireDocument('visibilitychange');assert.equal(h.TG.ui.screen,'paused');
 h.c.document.hidden=false;h.fireDocument('visibilitychange');assert.equal(h.TG.ui.screen,'paused');
});
