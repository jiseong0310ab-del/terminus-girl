const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers.cjs');
const plain=value=>JSON.parse(JSON.stringify(value));

test('objective follows preparation, boss, camp and the completed chapter',()=>{
 const {G,TG}=boot();assert.equal(G.objective(),null);assert.equal(G.objective(null),null);
 const g=G.start();let goal=G.objective();
 assert.equal(goal.kind,'prepare');assert.equal(goal.stage,0);assert.equal(goal.cleared,0);assert.equal(goal.target,3);assert.equal(goal.bossIn,270*.67);assert.equal(goal.remaining,270);assert.match(goal.detail,/카드/);assert.match(goal.detail,/관리자를 처치/);
 g.time=100;g.status='cards';goal=G.objective();assert.equal(goal.kind,'prepare');assert.equal(goal.bossIn,270*.67-100);
 g.status='paused';assert.equal(G.objective().kind,'prepare');g.status='playing';g.bossSpawned=true;g.time=200;
 goal=G.objective();assert.equal(goal.kind,'boss');assert.equal(goal.title,TG.STAGES[0].boss+' 처치');assert.equal(goal.bossIn,0);assert.equal(goal.remaining,70);assert.match(goal.detail,/제한시간/);
 G.stageClear();goal=G.objective();assert.equal(goal.kind,'camp');assert.equal(goal.cleared,1);assert.match(goal.detail,/보상과 역의 사건/);
 G.chooseBossReward('shelter');assert.match(G.objective().detail,/역의 사건/);G.g.event=0;G.eventChoice(0);assert.match(G.objective().detail,/침묵의 설원역/);
 assert(G.nextStage());assert.equal(G.objective().cleared,1);G.stageClear();G.chooseBossReward('shelter');G.g.event=0;G.eventChoice(0);assert(G.nextStage());G.stageClear();
 goal=G.objective();assert.equal(goal.kind,'ended');assert.equal(goal.cleared,3);assert.match(goal.title,/세 역/);
});

test('ended objectives report the actual result and timers never go negative',()=>{
 const {G}=boot();const g=G.start();g.time=g.duration+10;g.bossSpawned=true;G.finish(false,'timeout');
 const goal=G.objective();assert.equal(goal.kind,'ended');assert.equal(goal.cleared,0);assert.equal(goal.remaining,0);assert.equal(goal.bossIn,0);assert.match(goal.title,/0\/3/);assert.match(goal.detail,/소거/);
 assert.equal(G.objective({stage:2,phase:'camp'}).cleared,3);
 assert.equal(G.objective({stage:1,status:'paused',time:-20,duration:NaN}).remaining,270);
 assert.equal(G.objective(false),null);
});

test('build guidance uses started synergies, missing levels and stable catalogue tie breaks',()=>{
 const {G}=boot();assert.equal(G.buildGoal(),null);const g=G.start('quick');assert.equal(G.buildGoal(),null);
 g.levels={blade:1};let goal=G.buildGoal();assert.equal(goal.id,'echoBlade');assert.equal(goal.activeCount,0);
 assert.deepEqual(plain(goal.missing),[{id:'blade',name:'시간 절단',current:1,target:2},{id:'echo',name:'잔향의 분열',current:0,target:1}]);
 g.levels={blade:1,frost:1,shield:1,clock:1};goal=G.buildGoal();assert.equal(goal.id,'frostOrbit');assert.deepEqual(plain(goal.missing),[{id:'orbit',name:'시계의 파편',current:0,target:1}]);
 g.levels={blade:2,echo:1,shield:1,clock:1};g.synergies={echoBlade:false,safeDash:true};goal=G.buildGoal();assert.equal(goal.id,'safeDash');assert.equal(goal.activeCount,1);assert.equal(goal.missing[0].current,1);assert.equal(goal.missing[0].target,2);
 g.levels={blade:1,ember:1};assert.equal(G.buildGoal().id,'echoBlade');
 g.levels={blade:2,echo:1};assert.equal(G.buildGoal(),null);
 assert.equal(G.buildGoal({levels:{blade:NaN,echo:-1}}),null);
});

test('objective and build guidance do not mutate the run, RNG, offers, input or callbacks',()=>{
 const {G,c}=boot();const g=G.start('quick');g.levels={blade:1,frost:1};g.status='cards';g.offered=['blade','shield','frost'];G.input.x=.6;
 const before=JSON.stringify(g),input=JSON.stringify(G.input);let changes=0,sounds=0;
 G.onChange=()=>changes++;G.onSound=()=>sounds++;
 c.Math=Object.create(Math);c.Math.random=()=>{throw Error('guidance consumed RNG')};
 for(let i=0;i<20;i++){const objective=G.objective(),build=G.buildGoal();objective.title='changed';build.missing[0].current=100;}
 assert.equal(JSON.stringify(g),before);assert.equal(JSON.stringify(G.input),input);assert.equal(changes,0);assert.equal(sounds,0);
});

test('cleared station count survives camp reload and stage carry without a new save field',()=>{
 let b=boot();b.G.start();assert.equal(b.G.g.clearedStages,0);b.G.stageClear();assert.equal(b.G.g.clearedStages,1);
 assert.equal(Object.hasOwn(b.S.data.checkpoint,'clearedStages'),false);
 b=boot(Object.fromEntries(b.values));assert(b.G.continue());assert.equal(b.G.g.clearedStages,1);assert.equal(b.G.objective().kind,'camp');
 b.G.chooseBossReward('shelter');b.G.g.event=0;b.G.eventChoice(0);assert(b.G.nextStage());assert.equal(b.G.g.clearedStages,1);b.G.stageClear();assert.equal(b.G.g.clearedStages,2);
 b=boot(Object.fromEntries(b.values));assert(b.G.continue());assert.equal(b.G.g.clearedStages,2);b.G.chooseBossReward('shelter');b.G.g.event=0;b.G.eventChoice(0);assert(b.G.nextStage());assert.equal(b.G.g.clearedStages,2);b.G.stageClear();assert.equal(b.G.g.clearedStages,3);
 const {G}=boot();assert.equal(G.initialize('quick',1,null).clearedStages,1);assert.equal(G.initialize('quick',1,{clearedStages:2}).clearedStages,2);
});

test('simultaneous boss death and player death does not restore an uncleared station',()=>{
 const {G,S}=boot();const g=G.start();g.p.hp=1;g.bossSpawned=true;
 const boss=G.enemy('boss',1500,0);boss.hp=1;
 g.bullets.push({x:1500,y:0,vx:0,vy:0,life:1,damage:10,pierce:0,hit:new Set()});
 g.hostile.push({x:0,y:0,vx:0,vy:0,life:1,r:5,damage:20});
 G.update(.04);assert.equal(g.bossDefeated,true);assert.equal(g.status,'ended');assert.equal(g.won,false);assert.equal(g.reason,'death');assert.equal(g.clearedStages,0);assert.equal(G.objective().cleared,0);assert.equal(S.data.history[0].clearedStages,0);assert.equal(S.challengeProgress().find(c=>c.id==='mirrorClear').complete,false);
});

test('stage-clear guards reject dead, paused and write-blocked runs before counting restoration',()=>{
 for(const blocked of ['dead','paused','storage']){
  const {G,S}=boot(),g=G.start();g.bossDefeated=true;
  if(blocked==='dead')g.p.hp=0;if(blocked==='paused')g.status='paused';if(blocked==='storage')S.canWrite=()=>false;
  G.stageClear();assert.equal(g.clearedStages,0,blocked);
 }
});


test('first-run guidance only acknowledges successful movement, collection, card selection and dash',()=>{
 const {G}=boot();const g=G.start();assert.equal(g.learned.moved,false);G.update(.04);assert.equal(g.learned.moved,false);
 G.input.x=1;G.update(0);assert.equal(g.learned.moved,false);G.update(.04);assert.equal(g.learned.moved,true);
 assert.equal(g.learned.collected,false);g.drops.push({x:g.p.x,y:g.p.y,value:1});G.update(.04);assert.equal(g.learned.collected,true);
 assert.equal(g.learned.chosen,false);g.xp=g.xpNeed;G.checkLevel();assert.equal(G.choose('foreign',g.offerToken),false);assert.equal(g.learned.chosen,false);G.choose(g.offered[0],g.offerToken);assert.equal(g.learned.chosen,true);
 g.dash.cooldown=1;assert.equal(G.dash(),false);assert.equal(g.learned.dashed,false);g.dash.cooldown=0;assert(G.dash());assert.equal(g.learned.dashed,true);
});
