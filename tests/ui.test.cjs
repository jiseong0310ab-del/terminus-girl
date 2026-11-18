const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');const {ROOT}=require('./helpers.cjs');
function bootUI(options={}){const els=new Map();const windowEvents={},documentEvents={};const on=(map,type,fn)=>(map[type]??=[]).push(fn);let document;const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});function el(id){const classes=new Set(),e={id,style:{},dataset:{},attrs:{},children:[],hidden:false,value:'',checked:false,textContent:'',classList:{toggle(n,v){if(v)classes.add(n);else classes.delete(n)},add(n){classes.add(n)},remove(n){classes.delete(n)}},append(...nodes){this.children.push(...nodes)},appendChild(n){this.children.push(n)},replaceChildren(...nodes){this.children=nodes},setAttribute(k,v){this.attrs[k]=v},addEventListener(){},focus(){document.activeElement=this},getContext:()=>ctx,getBoundingClientRect:()=>({left:20,top:600,width:136,height:136}),hasPointerCapture:()=>false,remove(){}};els.set(id,e);return e}for(const m of fs.readFileSync(path.join(ROOT,'index.html'),'utf8').matchAll(/id="([^"]+)"/g))el(m[1]);document={activeElement:null,body:el('body'),hidden:false,getElementById:id=>els.get(id),createElement:tag=>el(Math.random()+tag),createTextNode:s=>({textContent:s}),addEventListener:(t,f)=>on(documentEvents,t,f)};const values=new Map(),c={console,Math,Date,Set,Map,JSON,document,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},Image:class{constructor(){this.complete=false;this.naturalWidth=0}},navigator:options.navigator||{},isSecureContext:!!options.navigator?.serviceWorker,Date:options.Date||Date,innerWidth:390,innerHeight:844,devicePixelRatio:1,requestAnimationFrame:()=>1,setInterval:()=>1,setTimeout:()=>1,addEventListener:(t,f)=>on(windowEvents,t,f),performance:{now:()=>0}};c.window=c;c.TG={};vm.createContext(c);for(const file of ['data','commands','story','store','audio','game','render','input','ui'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),c,{filename:file+'.js'});return{c,TG:c.TG,$:id=>els.get(id),fireWindow:(type,event={})=>(windowEvents[type]||[]).forEach(fn=>fn(event)),fireDocument:type=>(documentEvents[type]||[]).forEach(fn=>fn({}))}}
test('real UI module initializes and routes every gameplay screen without missing bindings',()=>{const{TG,$}=bootUI();assert.equal(TG.ui.screen,'menu');$('enterHub').onclick();assert.equal(TG.ui.screen,'hub');$('chapterStart').onclick();assert.equal(TG.ui.screen,'playing');assert.equal($('hud').style.display,'block');$('pauseBtn').onclick();assert.equal(TG.ui.screen,'paused');$('pauseSettings').onclick();assert.equal(TG.ui.screen,'settings');$('settingsBack').onclick();assert.equal(TG.ui.screen,'paused');$('resumeBtn').onclick();TG.engine.g.xp=99;TG.engine.checkLevel();assert.equal(TG.ui.screen,'cards');assert($('cardList').children.length>0);while(TG.engine.g.status==='cards')$('cardList').children[0].onclick();TG.engine.stageClear();assert.equal(TG.ui.screen,'camp');$('eventChoices').children[0].onclick();assert.equal($('nextStage').disabled,true);$('bossRewardList').children[2].onclick();assert.equal($('nextStage').disabled,false);$('campHub').onclick();assert.equal(TG.ui.screen,'hub');$('continueRun').onclick();assert.equal(TG.ui.screen,'camp');$('nextStage').onclick();assert.equal(TG.engine.g.stage,1);while(TG.engine.g.status==='cards')$('cardList').children[0].onclick();TG.engine.finish(false,'retreat');assert.equal(TG.ui.screen,'ended');assert($('endTitle').textContent);$('backBtn').onclick();$('openArchive').onclick();assert.equal($('memoryList').children.length,6);$('archiveBack').onclick();$('hubSettings').onclick();$('bgmVolume').value=0;$('bgmVolume').oninput();assert.equal(TG.store.data.settings.bgm,0);TG.ui.show('menu');$('menuAbout').onclick();assert.equal(TG.ui.screen,'about')});
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

test('camp reward UI supports choosing a reward and an event before departure',()=>{
 const {TG,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();TG.engine.g.p.hp=40;TG.engine.stageClear();TG.engine.g.event=0;TG.ui.show('camp');
 assert.equal($('bossRewardList').children.length,3);assert.equal($('nextStage').disabled,true);
 const stale=$('bossRewardList').children[2];$('bossRewardList').children[1].onclick();assert.equal(TG.engine.g.p.hp,70);
 assert.equal($('bossRewardList').children.length,0);assert.match($('bossRewardNote').textContent,/선택한 보상/);assert.equal($('nextStage').disabled,true);
 $('eventChoices').children[0].onclick();assert.equal($('nextStage').disabled,false);const shards=TG.engine.g.shards;stale.onclick();assert.equal(TG.engine.g.shards,shards);
 $('nextStage').onclick();assert.equal(TG.engine.g.stage,1);assert.equal(TG.ui.screen,'playing');
});

test('boss and event bonus cards are both chosen before returning to combat',()=>{
 const {TG,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();TG.engine.stageClear();TG.engine.g.event=3;TG.ui.show('camp');
 $('bossRewardList').children[0].onclick();$('eventChoices').children[0].onclick();assert.equal(TG.engine.g.bonusCards,2);$('nextStage').onclick();
 assert.equal(TG.engine.g.stage,1);assert.equal(TG.ui.screen,'cards');$('cardList').children[0].onclick();assert.equal(TG.ui.screen,'cards');$('cardList').children[0].onclick();assert.equal(TG.ui.screen,'playing');
 assert.equal(Object.values(TG.engine.g.levels).reduce((a,b)=>a+b,0),2);assert.equal(TG.engine.g.bonusCards,0);
});

test('journal opens from the hub with six goals and an honest empty state',()=>{
 const {TG,$}=bootUI();$('enterHub').onclick();const wallet=TG.store.data.wallet;$('openJournal').onclick();
 assert.equal(TG.ui.screen,'journal');assert.equal($('challengeList').children.length,6);assert.equal($('challengeCount').textContent,'0 / 6');assert.match($('historyList').children[0].textContent,/아직/);assert.equal(TG.store.data.wallet,wallet);
 $('journalBack').onclick();assert.equal(TG.ui.screen,'hub');
});
test('settlement shows new goals and journal retains the exact card, relic and synergy build',()=>{
 const {TG,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();const g=TG.engine.g;g.levels={blade:2,echo:1,shield:1,clock:2};g.relics=['compass','watch','wick'];g.kills=120;g.shards=45;g.totalTime=65;TG.engine.rebuild();TG.engine.finish(false,'retreat');
 assert.equal(TG.ui.screen,'ended');assert.equal($('newGoalNote').hidden,false);assert.match($('newGoalNote').textContent,/첫 귀환/);assert.equal(g.newGoals.length,4);assert.equal(TG.store.data.wallet,22);
 $('resultJournal').onclick();assert.equal(TG.ui.screen,'journal');assert.equal($('historyList').children.length,1);assert.equal($('challengeCount').textContent,'4 / 6');
 const row=$('historyList').children[0],details=row.children[3];assert.match(row.children[2].textContent,/격파 120/);assert.match(row.children[2].textContent,/지급 조각 22/);assert.match(details.children[1].textContent,/시간 절단 2/);assert.match(details.children[2].textContent,/은빛 나침반/);assert.match(details.children[3].textContent,/잔향 절단/);
 $('journalBack').onclick();assert.equal(TG.ui.screen,'ended');assert.equal(TG.engine.g,g);
});
test('practice results do not add a journal entry or keep an old completion banner',()=>{
 const {TG,$}=bootUI();$('quickStart').onclick();TG.engine.finish(true,'practice');assert.equal($('newGoalNote').hidden,true);assert.equal(TG.store.data.history.length,0);$('resultJournal').onclick();assert.equal(TG.ui.screen,'journal');assert.equal($('challengeCount').textContent,'0 / 6');$('journalBack').onclick();assert.equal(TG.ui.screen,'ended');
});

test('an unsaved journal result immediately explains the storage failure',()=>{
 const {TG,c,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();TG.engine.g.shards=20;c.localStorage.setItem=()=>{throw Error('quota')};TG.engine.finish(false,'retreat');
 assert.equal(TG.ui.screen,'ended');assert.equal(TG.store.data.history.length,1);assert.match($('resultSaveStatus').textContent,/저장소/);assert.equal(TG.store.preview(TG.store.export()).history.length,1);
 $('resultJournal').onclick();assert.match($('journalSaveStatus').textContent,/저장소/);
});

test('route distinguishes this exploration from historically restored stations',()=>{
 const {TG,$}=bootUI();$('enterHub').onclick();const route=$('routeList');
 assert.equal(route.children[0].className,'current');assert.equal(route.children[0].children[1].textContent,'출발');assert(!route.children.some(e=>e.className==='visited'));
 $('chapterStart').onclick();TG.engine.stageClear();$('campHub').onclick();assert.match($('routeCaption').textContent,/복원 1\/3/);assert.equal(route.children[0].children[1].textContent,'이번 탐험 복원');assert.equal(route.children[1].children[1].textContent,'다음 정차');
 $('abandonRun').onclick();$('modalYes').onclick();assert.match($('routeCaption').textContent,/첫 역부터/);assert.equal(route.children[0].children[1].textContent,'복원했던 역');assert.equal(route.children[1].children[1].textContent,'앞으로 복원');
});

test('HUD separates preparation, boss arrival, erasure danger and actual restoration',()=>{
 const {TG,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();const g=TG.engine.g;
 assert.match($('goalLabel').textContent,/관리자 도착 3:01/);assert.match($('phaseLabel').textContent,/복원 0\/3/);assert.match($('eraseLabel').textContent,/소거 위험/);
 g.time=160;TG.ui.refreshHud();assert.match($('goalLabel').textContent,/0:21/);g.bossSpawned=true;TG.ui.refreshHud();assert.match($('goalLabel').textContent,/거울 감시자 처치/);
 TG.engine.pause();assert.match($('pauseObjective').textContent,/소거까지 1:50/);assert.match($('pauseObjective').textContent,/거울 감시자 처치/);
});

test('card goals explain missing named levels without changing the offer or forcing a build',()=>{
 const {TG,$}=bootUI();$('quickStart').onclick();const g=TG.engine.g;g.levels={clock:2};TG.engine.rebuild();g.xp=g.xpNeed;TG.engine.checkLevel();const offered=[...g.offered],token=g.offerToken;
 assert.match($('cardGoalText').textContent,/푸른 귀환/);assert.match($('cardGoalText').textContent,/푸른 수호 0 → 1/);TG.ui.show('cards');assert.deepEqual([...g.offered],offered);assert.equal(g.offerToken,token);
});

test('first-run tips wait for real actions, then leave room for combat warnings',()=>{
 const {TG,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();const g=TG.engine.g;
 g.time=40;g.nextWave=1000;TG.ui.refreshHud();assert.match($('guide').textContent,/조작판/);TG.engine.input.x=1;TG.engine.update(.04);TG.ui.refreshHud();assert.match($('guide').textContent,/경험치를 주우/);
 g.drops.push({x:g.p.x,y:g.p.y,value:1});TG.engine.update(.04);TG.ui.refreshHud();assert.match($('guide').textContent,/첫 카드를/);
 g.xp=g.xpNeed;TG.engine.checkLevel();$('cardList').children[0].onclick();TG.ui.refreshHud();assert.match($('guide').textContent,/대시/);TG.engine.dash();TG.ui.refreshHud();assert.equal($('guide').style.display,'none');
 g.wave={name:'거울의 포위',remaining:2,hint:'틈으로 이동'};TG.ui.refreshHud();assert.match($('guide').textContent,/거울의 포위/);g.wave=null;g.aftershocks=[{age:.2,warning:1,life:1.25}];TG.ui.refreshHud();assert.match($('guide').textContent,/잔진동/);g.aftershocks=[];
 g.bossSpawned=true;g.learned.dashed=false;TG.ui.refreshHud();assert.equal($('guide').style.display,'none');
});

test('result review separates true restoration, why the run ended and retained progression',()=>{
 const {TG,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();const g=TG.engine.g;g.levels={clock:2};TG.engine.rebuild();const boss=TG.engine.enemy('boss',300,0);boss.hp=boss.maxHp*.2;TG.engine.finish(false,'timeout');
 assert.match($('resultProgress').textContent,/0\/3/);assert.match($('resultAdvice').textContent,/체력 20%/);assert.match($('resultAdvice').textContent,/푸른 귀환/);assert.match($('resultGrowth').textContent,/다시 시작/);assert.match($('resultGrowth').textContent,/조각.*남습니다/);
 $('retryBtn').onclick();TG.engine.g.shards=100;TG.engine.finish(false,'retreat');assert.match($('resultAdvice').textContent,/정비할 수/);assert.doesNotMatch($('resultAdvice').textContent,/체력 20%/);
});

test('camp presents reward choices before any help article',()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'),camp=html.split('id="campScreen"')[1].split('</section>')[0],reward=camp.split('bossRewardPanel')[1].split('id="bossRewardList"')[0];
 assert.doesNotMatch(reward,/<p>|<h3>탐험 기록|<h3>기록 붕괴/);assert.match(reward,/관리자의 유산/);assert.match(html.split('id="aboutScreen"')[1],/기록 붕괴와 정예의 불씨/);
});

test('empty retreat gives a first-growth step instead of implying a shard payout',()=>{
 const {TG,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();TG.engine.finish(false,'retreat');assert.match($('resultAdvice').textContent,/지급 조각은 0개/);assert.match($('resultNote').textContent,/보관할 조각은 없습니다/);
});

function storyToBattle(TG,$){let guard=0;while(TG.STORY.nodes[TG.story.state().node].kind==='dialogue'){assert(++guard<30);$('storyAction').onclick();}assert.equal(TG.ui.screen,'story');$('storyAction').onclick();assert.equal(TG.ui.screen,'playing');return TG.engine.g;}
function storyWin(TG){const g=TG.engine.g;g.enemies=[];g.hostile=[];g.hazards=[];g.spawn=-100;g.nextWave=Infinity;g.time=g.duration-.01;TG.engine.update(.04);assert.equal(g.status,'ended');assert.equal(g.won,true);}
test('story UI plays prologue, solo encounter, Mare recruitment, protection and train dialogue',()=>{
 const {TG,$}=bootUI();$('menuStory').onclick();assert.equal(TG.ui.screen,'story');assert.match($('storyText').textContent,/열차를 가르쳐/);assert.match($('storyParty').textContent,/리제/);
 storyToBattle(TG,$);assert.equal($('timerCaption').textContent,'임무 완료까지');assert.match($('goalLabel').textContent,/생존/);assert.doesNotMatch($('phaseLabel').textContent,/연습/);assert.equal($('partyHud').hidden,true);
 storyWin(TG);assert.equal($('resultJournal').hidden,true);assert.equal($('retryBtn').hidden,true);assert.match($('backBtn').textContent,/이야기 계속/);$('backBtn').onclick();assert.equal(TG.story.state().node,'meeting');
 const g=storyToBattle(TG,$);assert(g.mare);assert.equal($('partyHud').hidden,false);assert.match($('partyStatus').textContent,/보호 준비/);TG.engine.damage(20);TG.ui.refreshHud();assert.match($('partyStatus').textContent,/12.0초/);$('pauseBtn').onclick();assert.match($('pauseParty').textContent,/마레/);assert.match($('quitBtn').textContent,/이야기 중단/);assert.match($('pauseBoundaryNote').textContent,/현재 전투 시작/);assert.match($('pauseObjective').textContent,/임무 완료/);$('resumeBtn').onclick();
 storyWin(TG);assert.match($('resultProgress').textContent,/보호 1회/);$('backBtn').onclick();while(TG.story.state().node!=='rest')$('storyAction').onclick();assert.equal(TG.story.state().completed,true);assert.match($('storyPosition').textContent,/지휘 덱/);assert($('storyLog').children.length>10);$('storyAction').onclick();assert.equal(TG.ui.screen,'hub');assert.match($('hubStory').textContent,/후일담/);assert.equal(TG.store.data.stats.runs,0);assert.equal(TG.store.data.wallet,0);
});
test('story defeat retries its battle and leaves a coexisting legacy checkpoint alone',()=>{
 const {TG,$}=bootUI();$('enterHub').onclick();$('chapterStart').onclick();TG.store.snapshot(TG.engine.g);const cp=JSON.stringify(TG.store.data.checkpoint);TG.engine.g=null;TG.ui.show('hub');$('hubStory').onclick();const g=storyToBattle(TG,$),id=g.id;
 TG.engine.finish(false,'death');assert.equal($('retryBtn').hidden,false);assert.match($('endStory').textContent,/시작 지점/);$('retryBtn').onclick();assert.equal(TG.engine.g.id,id);assert.equal(TG.engine.g.time,0);assert.equal(JSON.stringify(TG.store.data.checkpoint),cp);assert.equal(TG.store.data.stats.runs,0);
 $('pauseBtn').onclick();$('quitBtn').onclick();assert.doesNotMatch($('modalText').textContent,/절반/);$('modalYes').onclick();$('backBtn').onclick();$('storyBack').onclick();$('continueRun').onclick();assert.equal(TG.engine.g.mode,'chapter');assert.equal(TG.engine.g.mare,null);
});
test('story scene save failure stays on the same line and allows retry without losing legacy records',()=>{
 const {TG,c,$}=bootUI();$('menuStory').onclick();const state=JSON.stringify(TG.story.state()),write=c.localStorage.setItem;c.localStorage.setItem=()=>{throw Error('quota')};$('storyAction').onclick();assert.equal(JSON.stringify(TG.story.state()),state);assert.match($('storySaveStatus').textContent,/저장소/);c.localStorage.setItem=write;$('storyAction').onclick();assert.equal(TG.story.state().line,1);
});
test('an unsaved story victory cannot skip its scene and can retry storing the completed battle',()=>{
 const {TG,c,$}=bootUI();$('menuStory').onclick();storyToBattle(TG,$);const write=c.localStorage.setItem;c.localStorage.setItem=()=>{throw Error('quota')};storyWin(TG);assert.equal(TG.engine.g.storySaved,false);assert.equal(TG.story.state().node,'approach');assert.match($('backBtn').textContent,/다시 시도/);$('backBtn').onclick();assert.equal(TG.ui.screen,'ended');assert.equal(TG.story.state().node,'approach');c.localStorage.setItem=write;$('backBtn').onclick();assert.equal(TG.ui.screen,'story');assert.equal(TG.story.state().node,'meeting');
});
test('story settings returns to the same scene, and recap does not advance the live scene',()=>{
 const {TG,$}=bootUI();$('menuStory').onclick();$('storyAction').onclick();const state=JSON.stringify(TG.story.state());$('storySettings').onclick();assert.equal(TG.ui.returnTo,'story');$('settingsBack').onclick();assert.equal(TG.ui.screen,'story');assert.equal(JSON.stringify(TG.story.state()),state);$('storyBack').onclick();$('hubStory').onclick();assert.equal(JSON.stringify(TG.story.state()),state);
});

test('a story begin write failure shows an entry error without replacing a legacy checkpoint',()=>{
 const {TG,c,$}=bootUI();c.localStorage.setItem=()=>{throw Error('quota')};$('menuStory').onclick();assert.equal(TG.ui.screen,'menu');assert.equal(TG.story.state().started,false);assert.match($('saveStatus').textContent,/저장소/);assert.match($('toast').textContent,/저장소/);
});
test('an unsaved story win exposes backup settings and cannot apply a waiting update',async()=>{
 let posted=0;const registration={waiting:{postMessage(){posted++}},addEventListener(){}};const h=bootUI({navigator:{serviceWorker:{controller:{},register:async()=>registration,addEventListener(){}}}});await new Promise(setImmediate);
 h.$('menuStory').onclick();storyToBattle(h.TG,h.$);h.c.localStorage.setItem=()=>{throw Error('quota')};storyWin(h.TG);h.$('resultSettings').onclick();assert.equal(h.TG.ui.screen,'settings');assert.equal(h.$('applyUpdate').hidden,true);h.$('applyUpdate').onclick();assert.equal(posted,0);h.$('settingsBack').onclick();assert.equal(h.TG.ui.screen,'ended');assert.equal(h.TG.engine.g.storySaved,false);
});

function joinedStoryUI(TG,$){$('menuStory').onclick();storyToBattle(TG,$);storyWin(TG);$('backBtn').onclick();while(TG.STORY.nodes[TG.story.state().node].kind==='dialogue')$('storyAction').onclick();assert.equal(TG.story.state().node,'escort');}
const childText=e=>[e.textContent,...(e.children||[]).map(childText)].join(' ');
test('boundary deck editing validates ownership, saves a distinct build, and cancelling preserves the saved deck',()=>{
 const {TG,$}=bootUI();joinedStoryUI(TG,$);const before=JSON.stringify(TG.story.state());$('storyDeck').onclick();assert.equal(TG.ui.screen,'deck');assert.equal($('deckList').children.length,12);assert.equal($('deckSave').disabled,false);
 $('deckCounter').onclick();assert.equal(TG.ui.deckDraft.length,8);assert.notEqual(JSON.stringify(TG.ui.deckDraft),JSON.stringify(TG.story.state().commandDeck));$('deckBack').onclick();assert.equal(JSON.stringify(TG.story.state()),before);
 $('storyDeck').onclick();$('deckCounter').onclick();$('deckSave').onclick();assert.equal(TG.ui.screen,'story');assert.deepEqual([...TG.story.state().commandDeck],[...TG.commandDeck.preset('counter',['mare'])]);
 const saved=JSON.stringify(TG.story.state());$('storyDeck').onclick();const selected=$('deckList').children.find(e=>e.attrs['aria-pressed']==='true');selected.onclick();assert.equal($('deckSave').disabled,true);$('deckSave').onclick();assert.equal(TG.ui.screen,'deck');assert.equal(JSON.stringify(TG.story.state()),saved);$('deckBack').onclick();$('storyAction').onclick();assert.equal(TG.ui.screen,'playing');$('storyDeck').onclick();assert.equal(TG.ui.screen,'playing');
});
test('solo deck cannot reveal usable Mare cards and explains the locked role without changing the story',()=>{
 const {TG,$}=bootUI();$('menuStory').onclick();while(TG.STORY.nodes[TG.story.state().node].kind==='dialogue')$('storyAction').onclick();assert.equal($('storyTraining').hidden,true);const saved=JSON.stringify(TG.story.state());$('storyDeck').onclick();assert.equal($('deckList').children.length,8);assert.equal($('deckCounter').hidden,true);$('deckOwnerFilter').value='mare';$('deckOwnerFilter').onchange();assert.match(childText($('deckList')),/마레와 만난 뒤/);assert.equal(JSON.stringify(TG.story.state()),saved);
});
test('command UI freezes combat, keeps the same hand across settings and return, and explains unusable cards',()=>{
 const {TG,$}=bootUI();joinedStoryUI(TG,$);$('storyAction').onclick();const g=TG.engine.g;g.commands.hand=['rize_pulse','shared_heal','mare_counter'];g.commands.energy=2;g.commands.regen=5;g.mare.cooldown=9;g.commandEffects.ward=3;const before=JSON.stringify(g);
 $('commandBtn').onclick();assert.equal(TG.ui.screen,'commands');assert.equal($('commandBtn').hidden,true);assert.match($('commandPower').textContent,/전투 7초 후/);assert.match(childText($('commandList')),/체력이 가득/);assert.match(childText($('commandList')),/범위 안에 적/);assert.match(childText($('commandList')),/피해를 막은 직후/);assert.equal($('commandList').children.length,3);for(let i=0;i<20;i++)TG.engine.update(.04);assert.equal(g.time,0);assert.equal(g.commands.regen,5);assert.equal(g.mare.cooldown,9);assert.equal(g.commandEffects.ward,3);
 $('commandsSettings').onclick();assert.equal(TG.ui.returnTo,'commands');$('settingsBack').onclick();assert.equal(TG.ui.screen,'commands');$('commandsClose').onclick();assert.equal(TG.ui.screen,'playing');assert.equal(JSON.stringify(g),before);assert.equal($('commandBtn').hidden,false);
});
test('a real command card click spends energy once, heals, replaces its hand slot and rejects its stale click',()=>{
 const {TG,$}=bootUI();joinedStoryUI(TG,$);$('storyAction').onclick();const g=TG.engine.g;g.commands.hand=['shared_heal','rize_pulse','mare_counter'];g.p.hp-=30;$('commandBtn').onclick();const oldButton=$('commandList').children[0],token=g.commands.token,hp=g.p.hp;oldButton.onclick();assert.equal(TG.ui.screen,'playing');assert.equal(g.p.hp,hp+18);assert.equal(g.commands.energy,2);assert.equal(g.commands.token,token+1);assert.equal(g.commands.casts,1);$('commandBtn').onclick();const snapshot=JSON.stringify(g);oldButton.onclick();assert.equal(JSON.stringify(g),snapshot);assert.equal(TG.ui.screen,'commands');
});
test('keyboard commands do not escape settings or editable inputs, and backgrounding retains the frozen hand',()=>{
 const {TG,c,$,fireWindow,fireDocument}=bootUI();joinedStoryUI(TG,$);$('storyAction').onclick();const g=TG.engine.g,key=(key,target)=>fireWindow('keydown',{key,code:key==='c'?'KeyC':'Escape',repeat:false,target,preventDefault(){}});key('c');assert.equal(TG.ui.screen,'commands');const hand=JSON.stringify(g.commands);$('commandsSettings').onclick();key('c');key('Escape');assert.equal(TG.ui.screen,'settings');assert.equal(g.status,'command');$('settingsBack').onclick();key('c',{matches:()=>true});assert.equal(TG.ui.screen,'commands');c.document.hidden=true;fireDocument('visibilitychange');c.document.hidden=false;fireDocument('visibilitychange');assert.equal(g.status,'command');assert.equal(JSON.stringify(g.commands),hand);key('Escape');assert.equal(TG.ui.screen,'playing');
});
test('a command storage conflict opens backup settings without paying, redrawing or casting',()=>{
 const {TG,c,$}=bootUI();joinedStoryUI(TG,$);$('storyAction').onclick();const g=TG.engine.g;g.commands.hand=['shared_heal','rize_pulse','mare_guard'];g.p.hp-=20;$('commandBtn').onclick();const before=JSON.stringify(g),data=JSON.parse(JSON.stringify(TG.store.data));data.wallet+=1;c.localStorage.setItem('terminusSaveV1',TG.store.encode(data));$('commandList').children[0].onclick();assert.equal(TG.store.status,'conflict');assert.equal(TG.ui.screen,'settings');assert.equal(TG.ui.returnTo,'commands');assert.equal(JSON.stringify(g),before);assert.match($('settingsStatus').textContent,/他|다른 탭/);
});
test('completed first-companion stories can train and retry with fresh counters without changing story or legacy records',()=>{
 const {TG,$}=bootUI();joinedStoryUI(TG,$);$('storyAction').onclick();storyWin(TG);$('backBtn').onclick();while(TG.story.state().node!=='rest')$('storyAction').onclick();TG.story.state().loadout.kills=99;TG.story.state().loadout.totalTime=120;TG.story.state().loadout.hp=1;TG.store.save();const before=JSON.stringify(TG.store.data);assert.equal($('storyTraining').hidden,false);$('storyTraining').onclick();const g=TG.engine.g;assert.equal(g.storyTraining,true);assert.equal(g.kills,0);assert.equal(g.totalTime,0);assert.equal(g.p.hp,g.p.maxHp);assert.equal(g.duration,90);assert.equal($('timerCaption').textContent,'연습 종료까지');storyWin(TG);assert.equal(JSON.stringify(TG.store.data),before);assert.match($('endOverline').textContent,/연습/);assert.equal($('resultShards').textContent,'0');$('retryBtn').onclick();assert.equal(TG.engine.g.storyTraining,true);assert.equal(TG.engine.g.time,0);TG.engine.finish(false,'retreat');$('backBtn').onclick();assert.equal(TG.ui.screen,'story');assert.equal(TG.story.state().node,'rest');assert.equal(JSON.stringify(TG.store.data),before);$('storyDeck').onclick();assert.equal(TG.ui.screen,'deck');
});
test('a waiting update cannot replace a command hand or its backup settings',async()=>{
 let posted=0;const registration={waiting:{postMessage(){posted++}},addEventListener(){}};const h=bootUI({navigator:{serviceWorker:{controller:{},register:async()=>registration,addEventListener(){}}}});await new Promise(setImmediate);joinedStoryUI(h.TG,h.$);h.$('storyAction').onclick();h.$('commandBtn').onclick();h.$('commandsSettings').onclick();assert.equal(h.$('applyUpdate').hidden,true);h.$('applyUpdate').onclick();assert.equal(posted,0);h.$('settingsBack').onclick();assert.equal(h.TG.ui.screen,'commands');
});


test('deck swapping allows a temporary ninth draft card and only saves a valid eight-card party',()=>{
 const {TG,$}=bootUI();joinedStoryUI(TG,$);const before=JSON.stringify(TG.story.state());$('storyDeck').onclick();$('deckCounter').onclick();$('deckList').children.find(e=>/함께 선 자리/.test(e.attrs['aria-label'])).onclick();assert.equal(TG.ui.deckDraft.length,9);assert.match($('deckCount').textContent,/1장 줄여/);assert.equal($('deckSave').disabled,true);$('deckSave').onclick();assert.equal(TG.ui.screen,'deck');assert.equal(JSON.stringify(TG.story.state()),before);
 $('deckList').children.find(e=>/복원의 파동/.test(e.attrs['aria-label'])).onclick();assert.equal(TG.ui.deckDraft.length,8);assert.equal($('deckSave').disabled,false);$('deckSave').onclick();assert.equal(TG.ui.screen,'story');assert(TG.story.state().commandDeck.includes('mare_shelter'));assert(!TG.story.state().commandDeck.includes('rize_pulse'));
});
test('training pause and exit explain the preserved story rather than promising battle-boundary progress',()=>{
 const {TG,$}=bootUI();joinedStoryUI(TG,$);const before=JSON.stringify(TG.store.data);$('storyTraining').onclick();$('pauseBtn').onclick();assert.match($('quitBtn').textContent,/연습 끝내기/);assert.match($('pauseObjective').textContent,/연습 종료까지/);assert.match($('pauseBoundaryNote').textContent,/이야기 진행과 보상을 변경하지/);assert.doesNotMatch($('pauseBoundaryNote').textContent,/전투 시작/);$('quitBtn').onclick();assert.match($('modalTitle').textContent,/지휘 연습/);assert.match($('modalText').textContent,/기억 조각은 그대로/);$('modalYes').onclick();$('backBtn').onclick();assert.equal(TG.ui.screen,'story');assert.equal(JSON.stringify(TG.store.data),before);
});
