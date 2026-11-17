'use strict';
(()=>{
const clone=value=>JSON.parse(JSON.stringify(value));
TG.STORY={nodes:{
 departure:{kind:'dialogue',title:'프롤로그 · 운행 허가 없는 열차',lines:[
  {speaker:'리제',portrait:'rize',text:'운행표에서 그 역이 사라졌다. 내게 열차를 가르쳐 준 사람도, 그곳에 남아 있다.'},
  {speaker:'철도국 방송',portrait:null,text:'격리 구간의 운행을 금지합니다. 삭제는 재앙으로부터 현실을 보호하기 위한 조치입니다.'},
  {speaker:'리제',portrait:'rize',text:'이유가 있다는 건 알아. 그래도 살아 있는지조차 묻지 말라는 명령은 따를 수 없어.'},
  {speaker:'리제',portrait:'rize',text:'출발 허가는 받지 못했다. 나는 열차의 제동을 풀었다. 최근에 지워진 역부터, 그 사람이 있는 오래된 역까지 거슬러 가야 한다.'}
 ],next:'arrival'},
 arrival:{kind:'dialogue',title:'거울 유리역 · 늦게 도착한 반사',lines:[
  {speaker:'리제',portrait:'rize',text:'첫 정차역은 거울 유리역. 깨진 안내판이 같은 도착 시각만 되풀이하고 있다.'},
  {speaker:'끊어진 안내 방송',portrait:null,text:'승강장 봉쇄 중…… 안내 회선 복구까지 45초. 선로의 잔향에 접근하지 마십시오.'}
 ],next:'approach'},
 approach:{kind:'battle',title:'거울 유리역 · 안내 회선 복구'},
 meeting:{kind:'dialogue',title:'마레 · 승강장에 남은 사람',lines:[
  {speaker:'마레',portrait:'mare',text:'그 랜턴, 이쪽으로 비춰 줘. 길은 내가 막고 있을게.'},
  {speaker:'리제',portrait:'rize',text:'여기 사람이 있었어…… 나는 리제야. 더 오래전에 지워진 역으로 가야 해. 찾는 사람이 있어.'},
  {speaker:'마레',portrait:'mare',text:'마레야. 나도 이 역에서 확인할 일이 남았어. 격리가 풀린다고 모두 돌아갈 수 있는 건 아니더라.'},
  {speaker:'마레',portrait:'mare',text:'우선 상처부터 묶자. 함께 열차로 돌아가자고. 위험이 닿으면 한 번은 내가 막아 줄게. 그다음 공격은 네가 피해 줘.'}
 ],next:'escort'},
 escort:{kind:'battle',title:'거울 유리역 · 함께 여는 귀환로'},
 debrief:{kind:'dialogue',title:'열차 · 두 사람의 왕복표',lines:[
  {speaker:'마레',portrait:'mare',text:'선로가 잠잠해졌어. 문 닫아도 돼. 네가 앞을 열어 줘서 열차까지 돌아올 수 있었어.'},
  {speaker:'리제',portrait:'rize',text:'줄곧 뒤를 살펴 주고 있었구나. 앞으로도 함께 가 줄래?'},
  {speaker:'마레',portrait:'mare',text:'같이 가자. 하지만 다음에 봉인을 풀 때는, 그 안에 무엇이 묶여 있는지 먼저 알아보자. 사람만 갇혀 있는 건 아닐 수 있어.'},
  {speaker:'리제',portrait:'rize',text:'나는 빈 좌석에 왕복표를 한 장 놓았다. 찾는 사람은 아직 더 오래된 역에 있다. 이제 이 여정을 혼자 결정할 수는 없다.'}
 ],next:'rest'},
 rest:{kind:'rest',title:'이야기 시범 · 첫 동행',lines:[
  {speaker:'마레',portrait:'mare',text:'랜턴은 네가 들어. 네가 앞으로 나아갈 동안, 뒤는 내가 살필게.'}
 ]}
},battles:{
 approach:{stage:0,duration:45,title:'안내 회선 복구',objective:'안내 회선이 복구될 때까지 생존',detail:'45초 동안 이동과 대시로 잔향을 피하세요. 경험치를 모아 기억을 강화할 수 있습니다.',successTitle:'안내 방송이 돌아왔다',successStory:'되풀이되던 도착 시각 사이로, 승강장에 남은 사람의 목소리가 들렸다.',next:'meeting'},
 escort:{stage:0,duration:75,title:'함께 여는 귀환로',objective:'귀환로가 열릴 때까지 마레와 생존',detail:'75초 동안 살아남으세요. 마레는 준비된 보호로 피격 한 번을 막으며, 그 뒤에는 다시 준비할 시간이 필요합니다.',successTitle:'함께 열차에 올랐다',successStory:'리제와 마레는 열린 귀환로를 지나 같은 객실에 들어섰다. 거울역의 진실은 아직 승강장에 남아 있다.',next:'debrief'}
}};
const A=TG.story={};
const isBattle=node=>TG.STORY.nodes[node]?.kind==='battle';
const activeRun=()=>!!TG.engine?.g&&TG.engine.g.status!=='ended';
const newEncounter=()=> 'story-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
A.state=()=>TG.store.data.story;
function transact(change){
 const S=TG.store;if(!S?.canWrite())return false;
 const before=clone(S.data.story),next=clone(before);
 if(change(next)===false)return false;
 S.data.story=next;
 try{if(S.save())return true;}catch{if(S.status!=='conflict')S.status='memory';}
 S.data.story=before;return false;
}
A.begin=()=>transact(state=>{state.started=true;});
A.advance=function(expectedNode,expectedLine){
 return transact(state=>{
  const node=TG.STORY.nodes[state.node];
  if(!state.started||node?.kind!=='dialogue'||expectedNode!==state.node||expectedLine!==state.line)return false;
  if(state.line+1<node.lines.length){state.line++;return;}
  if(!state.seen.includes(state.node))state.seen.push(state.node);
  if(state.node==='meeting'){state.companions=['mare'];state.loadout.hp=Math.min(500,state.loadout.hp+40);state.commandDeck=TG.commandDeck.preset('protect',state.companions);}
  state.node=node.next;state.line=0;
  state.encounterId=isBattle(state.node)?newEncounter():null;
  if(state.encounterId)state.commandSeed=TG.commandDeck.seedFor(state.encounterId);
  state.completed=state.node==='rest';
 });
};
A.prepareBattle=function(){
 const S=TG.store,state=A.state();
 if(!state.started||!isBattle(state.node)||!S.canWrite()||!/^story-[\w-]{1,80}$/.test(state.encounterId||''))return null;
 return {id:state.encounterId,battleId:state.node,loadout:clone(state.loadout),companions:[...state.companions],commandDeck:[...state.commandDeck],commandSeed:state.commandSeed};
};
A.setCommandDeck=function(ids){
 if(activeRun())return false;
 return transact(state=>{
  if(!['battle','rest'].includes(TG.STORY.nodes[state.node]?.kind)||!TG.commandDeck.validate(ids,state.companions))return false;
  state.commandDeck=[...ids];
 });
};
A.prepareTraining=function(){
 const S=TG.store,state=A.state();
 if(!state.companions.includes('mare')||activeRun()||!S.canWrite())return null;
 return {id:'training-'+state.node+'-'+state.commandSeed.toString(36),battleId:'escort',duration:90,loadout:clone(state.loadout),companions:[...state.companions],commandDeck:[...state.commandDeck],commandSeed:state.commandSeed};
};
A.completeBattle=function(run){
 if(!run||run.mode!=='story'||run.storyTraining===true||run.won!==true||!Number.isFinite(run.p?.hp)||run.p.hp<=0)return false;
 return transact(state=>{
  const battle=TG.STORY.battles[state.node];
  if(!state.started||!battle||state.node!==run.storyBattle||state.encounterId!==run.id)return false;
  state.loadout=clone({hp:run.p.hp,levels:run.levels||{},level:run.level,xp:run.xp,kills:run.kills,totalTime:run.totalTime,relics:run.relics||[]});
  state.node=battle.next;state.line=0;state.encounterId=null;
 });
};
})();
