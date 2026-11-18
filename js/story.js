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
 ]},

 briefing:{kind:'dialogue',title:'제1장 · 돌아오지 않는 구조 신호',lines:[
  {speaker:'리제',portrait:'rize',text:'거울역이 비어 있는데 구조 신호가 잡혀. 누군가 계속 기다리고 있어.'},
  {speaker:'마레',portrait:'mare',text:'격리된 이유가 있을 거야. 문을 열기 전에 먼저 원본 기록을 확인하자.'},
  {speaker:'동료',portrait:'mare',text:'장치를 찾아 기록을 확보하면 그 이유를 알 수 있어요.'},
  {speaker:'리제',portrait:'rize',text:'기록 장치를 되찾고, 사람들을 어떻게 구할지 결정하겠어.'},
  {speaker:'차내 안내 방송',portrait:null,text:'미승인 회송 기록 발견. 거울역 중앙 보존 장치에서 수동 회수가 가능합니다.'}
 ],next:'trace'},
 trace:{kind:'dialogue',title:'거울 유리역 · 잔향의 보관실',lines:[
  {speaker:'리제',portrait:'rize',text:'안내판의 글씨가 거꾸로 흐르고 있어. 역 안쪽의 시간만 멈춘 것 같아.'},
  {speaker:'마레',portrait:'mare',text:'장치 근처에서 잠시 머물러야 기록을 읽을 수 있대. 적들이 모이면 내가 막을게.'},
  {speaker:'통신 기록',portrait:null,text:'경고. 구조 신호는 실재합니다. 봉인을 풀면 잔향이 인근 지역에 전파될 수 있습니다.'},
  {speaker:'리제',portrait:'rize',text:'기록부터 확보하자. 추측만으로 기다리는 사람을 포기할 순 없어.'}
 ],next:'archive'},
 archive:{kind:'battle',title:'거울 유리역 · 기억 기록장치 회수'},
 evidence:{kind:'dialogue',title:'회수 기록 · 지워진 사람들의 이름',lines:[
  {speaker:'기록 장치',portrait:null,text:'격리 첫날, 승강장에 남겨진 승객 열일곱 명. 구조 신호 송신 중.'},
  {speaker:'기록 장치',portrait:null,text:'관리 보고: 잔향이 역을 넘어가면 인근 지역에도 위험. 봉인 해제 전 안정화가 필요.'},
  {speaker:'마레',portrait:'mare',text:'살아 있을 가능성이 있어. 하지만 밖의 사람들까지 위험하게 해서는 안 돼.'},
  {speaker:'리제',portrait:'rize',text:'누군가 이들의 이름을 지운 건 분명해. 이제 우리가 선택해야 해.'}
 ],next:'decision'},
 decision:{kind:'choice',title:'거울 유리역 · 열리지 않은 문',lines:[
  {speaker:'리제',portrait:'rize',text:'지금 구조 신호를 열면 내 기억이 침식될 수 있어. 봉인을 유지하면 구조 요청이 언제 끊길지 몰라. 어떤 길을 택하지?'}
 ]},
 release:{kind:'dialogue',title:'선택 · 구조 신호를 열다',lines:[
  {speaker:'리제',portrait:'rize',text:'봉인을 열겠어. 돌아올 길이 있다면 포기하지 않을 거야.'},
  {speaker:'마레',portrait:'mare',text:'통로는 내가 지킬게. 리제, 기억이 흐려져도 내 이름은 잊지 마.'},
  {speaker:'구조 방송',portrait:null,text:'잠겨 있던 신호가 되살아난다. 누군가 자기 이름을 말한다. 통로가 완전히 안전한지는 아직 모른다.'},
  {speaker:'리제',portrait:'rize',text:'열차의 불빛은 누군가에게 닿았다. 대신 내가 떠올리던 얼굴 하나가 희미해졌다.'}
 ],next:'rest2'},
 contain:{kind:'dialogue',title:'선택 · 역의 봉인을 유지하다',lines:[
  {speaker:'리제',portrait:'rize',text:'증거를 먼저 가져가자. 다른 역까지 위험하게 만들 수는 없어. 구조 신호는 끊지 마.'},
  {speaker:'마레',portrait:'mare',text:'쉬운 결정은 아니야. 기록 속 이름들은 이제 우리 손에 있어. 다음에는 안전한 방법을 찾자.'},
  {speaker:'차내 기록 장치',portrait:null,text:'봉인은 유지되었다. 열일곱 명의 구조 기록과 격리 지침이 열차에 보존되었다.'},
  {speaker:'리제',portrait:'rize',text:'당장 문은 열지 못했다. 하지만 돌아올 사람들의 이름을 되찾았고, 다음 역에 갈 이유도 생겼어.'}
 ],next:'rest2'},
 rest2:{kind:'rest',title:'열차 · 지워진 이름의 무게',lines:[
  {speaker:'마레',portrait:'mare',text:'오늘의 선택은 끝이 아니야. 다음 역에서 무슨 일이 벌어질지도 달라졌으니까.'}
 ]}

},battles:{
 approach:{stage:0,duration:45,title:'안내 회선 복구',objective:'안내 회선이 복구될 때까지 생존',detail:'45초 동안 이동과 대시로 잔향을 피하세요. 경험치를 모아 기억을 강화할 수 있습니다.',successTitle:'안내 방송이 돌아왔다',successStory:'되풀이되던 도착 시각 사이로, 승강장에 남은 사람의 목소리가 들렸다.',next:'meeting'},
 escort:{stage:0,duration:75,title:'함께 여는 귀환로',objective:'귀환로가 열릴 때까지 마레와 생존',detail:'75초 동안 살아남으세요. 마레는 준비된 보호로 피격 한 번을 막으며, 그 뒤에는 다시 준비할 시간이 필요합니다.',successTitle:'함께 열차에 올랐다',successStory:'리제와 마레는 열린 귀환로를 지나 같은 객실에 들어섰다. 거울역의 진실은 아직 승강장에 남아 있다.',next:'debrief'},
 archive:{stage:0,duration:95,title:'기억 기록장치 회수',objective:'기록장치에 다가가 1.25초 회수한 뒤 제한시간까지 생존',detail:'파란빛 기록 장치 가까이에 서서 1.25초 머무르세요. 기록을 확보하지 못하면 임무는 실패합니다. 이후 95초까지 생존하세요.',successTitle:'지워진 이름의 기록 확보',successStory:'거울역 봉인 당시 남겨진 승객 명단과 구조 신호가 열차로 전송되었다.',next:'evidence'}
}};
const A=TG.story={};
const isBattle=node=>TG.STORY.nodes[node]?.kind==='battle';
const activeRun=()=>!!TG.engine?.g&&TG.engine.g.status!=='ended';
const newEncounter=()=> 'story-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
A.state=()=>TG.store.data.story;
A.currentLine=function(state=A.state()){
 const line=TG.STORY.nodes[state.node]?.lines?.[state.line];
 if(!line)return null;
 if(state.node==='briefing'&&state.line===2){
  const party=state.missionParty||state.companions;
  const voices={
   aster:{speaker:'아스터',portrait:'aster',text:'기록이 없어진 게 아니라 누군가 가린 것 같아요. 보존 장치의 원본을 확인하죠.'},
   noa:{speaker:'노아',portrait:'noa',text:'신호선을 열 수 있어요. 하지만 역의 봉인을 건드리지 않고 기록만 가져오는 게 먼저예요.'},
   vela:{speaker:'벨라',portrait:'vela',text:'구조를 기다리는 사람이 있다면 시간이 많지 않겠죠. 그래도 모두의 안전을 확인해요.'},
   mare:{speaker:'마레',portrait:'mare',text:'그 신호를 보낸 사람도, 역 밖의 사람도 지켜야 해. 기록부터 확인하자.'}
  };
  return voices[['aster','noa','vela','mare'].find(id=>party.includes(id))||'mare'];
 }
 if(state.node==='trace'&&state.line===1&&!state.missionParty.includes('mare')){
  const id=['noa','aster','vela'].find(id=>state.missionParty.includes(id))||'noa';
  const voices={noa:{speaker:'노아',portrait:'noa',text:'기록 장치의 신호선을 제가 안정화할게요. 적은 지휘 카드로 견제해요.'},aster:{speaker:'아스터',portrait:'aster',text:'기록이 흔들리지 않게 시간을 맞출게요. 장치 앞에서 잠시 머물러야 해요.'},vela:{speaker:'벨라',portrait:'vela',text:'회수가 끝날 때까지 버텨요. 부상이 생기면 제가 돌볼게요.'}};
  return voices[id];
 }
 if(state.node==='release'&&state.line===1&&!state.missionParty.includes('mare')){
  return state.missionParty.includes('vela')?{speaker:'벨라',portrait:'vela',text:'구조 통로를 열어요. 리제, 잃어버리는 기억을 제가 기록할게요.'}:{speaker:'노아',portrait:'noa',text:'신호를 붙잡을게요. 리제는 제 목소리를 따라와요.'};
 }
  if(state.node==='rest2')return state.decision==='rescue'?
  {speaker:'마레',portrait:'mare',text:'신호는 열렸어. 하지만 리제의 기억도 흐려졌지. 다음 역에서는 더 안전한 방법을 찾자.'}:
  {speaker:'마레',portrait:'mare',text:'오늘은 봉인을 지켰어. 구조 기록은 남았으니 다음 역에서 되돌아올 방법을 찾자.'};
 return line;
};
A.summary=function(state=A.state()){
 return state.decision?(state.decision==='rescue'?'구조 신호 개방':'격리 유지 · 증거 확보')+' · 침식 '+state.erosion+' / 100':'선택 대기 · 침식 '+state.erosion+' / 100';
};
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
  state.completed=state.node==='rest'||state.node==='rest2';
 });
};
A.beginR3=function(){
 if(activeRun())return false;
 return transact(state=>{
  if(state.node!=='rest'||!state.completed||!state.companions.length)return false;
  state.missionParty=[...state.companions];state.loadout.hp=Math.max(75,state.loadout.hp);state.node='briefing';state.line=0;state.completed=false;
 });
};
A.choose=function(id,expectedNode='decision'){
 if(activeRun()||!['rescue','contain'].includes(id))return false;
 return transact(state=>{
  if(state.node!=='decision'||expectedNode!==state.node||!state.recordRecovered||state.decision)return false;
  state.decision=id;state.erosion=Math.min(100,state.erosion+(id==='rescue'?18:5));
  const party=state.missionParty||state.companions;
  for(const ally of (id==='rescue'?['mare','vela']:['aster','noa']))if(party.includes(ally))state.bonds[ally]=Math.min(3,(state.bonds[ally]||0)+1);
  if(!state.seen.includes('decision'))state.seen.push('decision');
  state.node=id==='rescue'?'release':'contain';state.line=0;state.completed=false;
 });
};
A.setParty=function(ids){
 if(activeRun()||!Array.isArray(ids)||ids.length!==3||new Set(ids).size!==3||ids.some(id=>!TG.PARTY.some(x=>x.id===id&&x.trial)))return false;
 return transact(state=>{
  if(!['rest','rest2'].includes(state.node))return false;
  state.companions=[...ids];
  state.commandDeck=TG.commandDeck.preset('protect',ids);
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
 if(!state.companions.length||activeRun()||!S.canWrite()||!['rest','rest2','approach','escort','archive'].includes(state.node))return null;
 return {id:'training-'+state.node+'-'+state.commandSeed.toString(36),battleId:'escort',duration:90,loadout:clone(state.loadout),companions:[...state.companions],commandDeck:[...state.commandDeck],commandSeed:state.commandSeed};
};
A.completeBattle=function(run){
 if(!run||run.mode!=='story'||run.storyTraining===true||run.won!==true||!Number.isFinite(run.p?.hp)||run.p.hp<=0)return false;
 return transact(state=>{
  const battle=TG.STORY.battles[state.node];
  if(!state.started||!battle||state.node!==run.storyBattle||state.encounterId!==run.id||state.node==='archive'&&run.recordTarget?.recovered!==true)return false;
  state.loadout=clone({hp:run.p.hp,levels:run.levels||{},level:run.level,xp:run.xp,kills:run.kills,totalTime:run.totalTime,relics:run.relics||[]});
  if(state.node==='archive')state.recordRecovered=true;
  state.node=battle.next;state.line=0;state.encounterId=null;
 });
};
})();
