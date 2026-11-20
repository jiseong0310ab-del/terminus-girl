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
  {speaker:'끊어진 안내 방송',portrait:null,text:'승강장 봉쇄 중…… 안내 회선 복구까지 60초. 선로의 잔향에 접근하지 마십시오.'}
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
  {speaker:'마레',portrait:'mare',text:'장치 근처에서 잠시 머물러야 기록을 읽을 수 있대. 확보한 뒤에는 열차 문으로 돌아와. 내가 뒤를 지킬게.'},
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
 ]},
 snowArrival:{kind:'dialogue',title:'제2장 · 침묵의 설원역',lines:[
  {speaker:'리제',portrait:'rize',text:'거울역의 기록이 가리킨 다음 역. 눈 속에 사람의 발자국이 아직 남아 있어.'},
  {speaker:'마레',portrait:'mare',text:'그동안 임시로 도왔던 세 사람도 여기서 제 일을 하고 있어. 함께 여행할 사람인지 직접 만나 보자.'},
  {speaker:'차내 방송',portrait:null,text:'침묵의 설원역. 기록실, 신호탑, 구호실에서 긴급 지원 요청이 들어왔습니다.'},
  {speaker:'리제',portrait:'rize',text:'동료들의 이유를 듣고 함께 갈 길을 정하겠어.'}
 ],next:'recruitHub'},
 recruitHub:{kind:'recruit',title:'설원역 · 세 개의 요청',lines:[
  {speaker:'차내 단말기',portrait:null,text:'기록실·신호탑·구호실 가운데 지원할 현장을 고르세요. 정식 동료 두 명 이상과 함께 설원역 임무를 시작할 수 있습니다.'}
 ]},
 recruitAster:{kind:'dialogue',title:'아스터 · 이름이 잘린 명부',lines:[
  {speaker:'아스터',portrait:'aster',text:'장부의 마지막 장이 찢어졌어요. 사람은 있는데 이름만 지워졌죠. 기록실은 그래서 문을 열지 않아요.'},
  {speaker:'리제',portrait:'rize',text:'함께 원본을 읽자. 누가 이름을 잘랐는지 알 수 있겠지?'},
  {speaker:'아스터',portrait:'aster',text:'그냥 가져가면 명부도 사라져요. 제가 원본을 복사할 동안, 밖의 감시 기록을 대신 살펴 주세요.'},
  {speaker:'리제',portrait:'rize',text:'그렇게 하자. 이제 혼자 기록을 지키지 않아도 돼. 우리 열차에 타 줄래?'},
  {speaker:'아스터',portrait:'aster',text:'좋아요. 누군가 기억해 주는 한, 기록은 사라지지 않으니까요. 함께 가겠습니다.'}
 ],next:'recruitHub'},
 recruitNoa:{kind:'dialogue',title:'노아 · 울리지 않는 신호탑',lines:[
  {speaker:'노아',portrait:'noa',text:'신호탑이 한 번 더 울리면 승강장이 무너져요. 하지만 완전히 끊으면 여기 있는 사람의 목소리도 사라져요.'},
  {speaker:'리제',portrait:'rize',text:'신호를 끊지 말고 돌아갈 길을 만들자. 랜턴으로 회선 위치를 밝혀 줄게.'},
  {speaker:'노아',portrait:'noa',text:'이 회선은 돌아오는 열차만 통과시킬 수 있어요. 망가진 신호를 고치려면 직접 운행을 이어가야 해요.'},
  {speaker:'리제',portrait:'rize',text:'내가 열차를 몰게. 노아, 우리와 함께 길을 만들어 줄래?'},
  {speaker:'노아',portrait:'noa',text:'좋아요. 신호는 받는 사람이 있을 때 의미가 있으니까요. 제가 길을 맡을게요.'}
 ],next:'recruitHub'},
 recruitVela:{kind:'dialogue',title:'벨라 · 빈 병실의 체온',lines:[
  {speaker:'벨라',portrait:'vela',text:'기억을 잃은 환자가 있어요. 자신의 이름은 모르지만 누군가를 기다린다는 말만 반복해요.'},
  {speaker:'리제',portrait:'rize',text:'나도 기억이 흐려지고 있어. 그 사람의 이름을 같이 찾아 보자.'},
  {speaker:'벨라',portrait:'vela',text:'환자를 옮겨야 하지만 제가 떠나면 의무실이 비어요. 아무도 두고 갈 수는 없어요.'},
  {speaker:'리제',portrait:'rize',text:'열차의 빈 침상과 의료 도구를 내줄게. 함께 옮기자. 앞으로도 우리를 도와줄래?'},
  {speaker:'벨라',portrait:'vela',text:'그럼 저도 타겠습니다. 아픈 사람을 남겨 두지 않는 열차를 만들어요.'}
 ],next:'recruitHub'},
 snowDeparture:{kind:'dialogue',title:'설원역 · 갈라진 구조 경로',lines:[
  {speaker:'리제',portrait:'rize',text:'이제 정식으로 함께 여행할 동료가 생겼어. 거울역에서 내린 결정이 여기에도 영향을 미친다는데.'},
  {speaker:'차내 기록',portrait:null,text:'거울역에서 내린 선택에 따라 설원역의 구조 목표가 바뀝니다.'},
  {speaker:'동료',portrait:null,text:'함께 준비했어요. 누가 출전하느냐에 따라 회수 속도와 방어가 달라질 거예요.'},
  {speaker:'리제',portrait:'rize',text:'시작하자. 구조 신호든 명부든, 우리가 보고 결정할 거야.'}
 ],next:'snowMission'},
 snowMission:{kind:'battle',title:'설원역 · 구조 신호와 지워진 명부'},
 snowDebrief:{kind:'dialogue',title:'열차 · 설원역의 귀환 기록',lines:[
  {speaker:'마레',portrait:'mare',text:'돌아왔구나. 동료들이 이제 이 열차를 자기 집이라고 부르더라.'},
  {speaker:'리제',portrait:'rize',text:'거울역에서 내린 선택이 설원역을 바꿨어. 내가 혼자였으면 감당하지 못했을 거야.'},
  {speaker:'동료 기록',portrait:null,text:'설원역의 임무 결과가 열차에 보존되었습니다.'},
  {speaker:'리제',portrait:'rize',text:'기억은 조금 흐려졌지만 함께 가는 사람들의 이름은 더 선명해졌어.'}
 ],next:'rest3'},
 rest3:{kind:'rest',title:'열차 · 설원역의 승차권',lines:[
  {speaker:'리제',portrait:'rize',text:'다음 역으로 갈 준비를 해야겠어.'}
 ]},
 patientBrief:{kind:'dialogue',title:'벨라의 부탁 · 마지막 체온',lines:[
  {speaker:'벨라',portrait:'vela',text:'환자를 열차로 데려가겠다고 약속했죠. 하지만 돌아가는 복도에 망령들이 모였어요. 아직 걸을 힘도 없어요.'},
  {speaker:'리제',portrait:'rize',text:'벨라가 곁에서 처치하는 동안 내가 통로를 열게. 마레, 방어를 맡아 줘.'},
  {speaker:'마레',portrait:'mare',text:'내 방패로 환자에게 날아오는 공격을 막을 수 있어. 벨라가 안정시키면 환자가 스스로 걸을 수 있을 거야.'},
  {speaker:'벨라',portrait:'vela',text:'먼저 환자 가까이 와 주세요. 제 “온기 처치” 카드를 쓰면 안정이 빨라져요. 그 다음은 함께 객차 문으로 돌아가요.'},
  {speaker:'리제',portrait:'rize',text:'알겠어. 적을 얼마나 많이 쓰러뜨렸는지가 아니라, 이 사람을 열차에 태우는 순간에야 우리가 이기는 거야.'}
 ],next:'velaEscort'},
 velaEscort:{kind:'battle',title:'설원역 · 벨라와 환자 호위'},
 patientDebrief:{kind:'dialogue',title:'구조 성공 · 다시 따뜻해지는 객차',lines:[
  {speaker:'벨라',portrait:'vela',text:'환자가 이제 혼자 앉을 수 있어요. 그 손이 아직 따뜻하네요. 약속을 지켰어요.'},
  {speaker:'환자',portrait:null,text:'...열차 소리가 들려요. 저를 두고 가지 않았군요.'},
  {speaker:'리제',portrait:'rize',text:'우리가 해낸 거야. 환자가 걸을 수 있게 도운 사람도, 길을 지킨 사람도 여기 있어.'},
  {speaker:'벨라',portrait:'vela',text:'앞으로도 누군가 기억을 잃어가면 함께 손을 잡아 주세요. 저는 이 열차에서 치료를 이어 갈게요.'}
 ],next:'recruitHub'}

},battles:{
 approach:{stage:0,duration:60,title:'안내 회선 복구',objective:'잔향을 물리치고 회선 수호자를 쓰러뜨린 뒤 스위치를 사수',detail:'① 몰려오는 잔향을 쓰러뜨리며 강해지세요. ② 회선 수호자의 돌진을 피하며 처치하세요. ③ 금빛 스위치 원 안에서 3초 버티면 전원이 복구됩니다.',successTitle:'안내 방송이 돌아왔다',successStory:'되풀이되던 도착 시각 사이로, 승강장에 남은 사람의 목소리가 들렸다.',next:'meeting'},
 escort:{stage:0,duration:75,title:'함께 여는 귀환로',objective:'마레와 함께 적을 막고 객차 문까지 이동',detail:'귀환로를 막는 두 수호 잔향을 물리치고 금빛 열차 문에 도착하세요. 방어와 대시를 활용하면 75초를 기다리지 않고 끝납니다. 제자리에 오래 서 있으면 침식 파동이 발생합니다.',successTitle:'함께 열차에 올랐다',successStory:'리제와 마레는 열린 귀환로를 지나 같은 객실에 들어섰다. 거울역의 진실은 아직 승강장에 남아 있다.',next:'debrief'},
 archive:{stage:0,duration:95,title:'기억 기록장치 회수',objective:'기록장치를 확보한 뒤 열차 문으로 직접 귀환',detail:'금빛 신호기(기록 장치)에 다가가 1.25초 머무른 뒤 금빛 열차 문으로 돌아가세요. 귀환하면 즉시 승리하며 95초는 실패 제한입니다. 붉은 침식 파동은 바깥으로 이동해 피하세요.',successTitle:'지워진 이름의 기록 확보',successStory:'거울역 봉인 당시 남겨진 승객 명단과 구조 신호가 열차로 전송되었다.',next:'evidence'},
 snowMission:{stage:1,duration:105,title:'설원역 구조 신호 안정화',objective:'구조 중계기를 직접 안정화하면 즉시 임무 완료',detail:'구조 신호를 열었다면 2개 중계기를, 봉인을 유지했다면 1개 명부 장치를 회수하세요. 목표를 달성하면 시간을 기다리지 않고 성공합니다. 붉은 침식 예고를 보고 이동하세요.',successTitle:'설원역 기록 확보',successStory:'신호와 명부 중 선택에 맞는 기록을 열차로 회수했다.',next:'snowDebrief'},
 velaEscort:{stage:1,duration:100,title:'벨라와 환자 · 객차까지 호위',objective:'환자를 안정화하고 객차로 데려가기',detail:'환자에게 접근하여 안정시키세요. 벨라의 온기 처치는 안정화를 돕고, 마레의 방패는 환자 공격을 막습니다. 환자가 객차 문 안에 들어와야 성공합니다.',successTitle:'환자가 마지막 객차에 탑승했다',successStory:'벨라의 치료로 환자가 일어났고, 출전 동료가 길을 지킨 사이 두 발로 객차에 올라탔다.',next:'patientDebrief'}
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
  if(state.node==='snowArrival'&&state.line===0)return state.decision==='rescue'?
 {speaker:'리제',portrait:'rize',text:'거울역에서 구조 신호를 열자 설원역의 종도 울리기 시작했어. 도움을 청하는 목소리와 위험 경보가 동시에 들려.'}:
 {speaker:'리제',portrait:'rize',text:'거울역의 봉인은 유지했지만 확보한 기록에 설원역의 비밀 명부가 적혀 있어. 누가 지웠는지 찾아야 해.'};
 if(state.node==='snowDeparture'&&state.line===1)return state.decision==='rescue'?
 {speaker:'차내 기록',portrait:null,text:'구조 신호가 설원역에 번지고 있습니다. 서로 다른 두 중계기를 직접 안정화해 확산을 막으세요.'}:
 {speaker:'차내 기록',portrait:null,text:'봉인된 원본 명부가 기록실에 있습니다. 중앙 보존 장치 하나를 충분히 안정화해 증거를 회수하세요.'};
 if(state.node==='snowDeparture'&&state.line===2){
   const id=['noa','aster','vela','mare'].find(x=>state.companions.includes(x))||'mare';
   const lines={noa:{speaker:'노아',portrait:'noa',text:'제가 신호를 붙잡아 둘게요. 수신이 안정되면 적의 움직임도 덜 위험할 거예요.'},aster:{speaker:'아스터',portrait:'aster',text:'기록의 위치를 찾았어요. 제가 읽어 드릴 테니 회수 장치 가까이에 잠시 머물러 주세요.'},vela:{speaker:'벨라',portrait:'vela',text:'의료 물자를 실어 두었어요. 부상을 입기 전에 언제든 제 쪽으로 돌아와요.'},mare:{speaker:'마레',portrait:'mare',text:'내가 뒤를 지킬게. 누군가 놓치지 않도록 우리 함께 움직이자.'}};
   return lines[id];
 }
 if(state.node==='snowDebrief'&&state.line===2)return state.decision==='rescue'?
 {speaker:'동료 기록',portrait:null,text:'두 구조 중계기를 안정화했습니다. 더는 신호가 아무 곳으로나 번지지 않고, 돌아올 통로는 남았습니다.'}:
 {speaker:'동료 기록',portrait:null,text:'격리 명부의 원본을 열차에 실었습니다. 누가 이름을 지웠는지 알려 줄 운행 명령서도 발견했습니다.'};
 if(state.node==='patientDebrief'&&state.line===2){
  const c=state.patientCare||{};
  return {speaker:'리제',portrait:'rize',text:'벨라의 처치 '+(c.treatments||0)+'번, 마레의 보호 '+(c.mareBlocks||0)+'번. 실제로 이 사람을 살린 건 우리가 함께 한 행동들이었어.'};
 }
 if(state.node==='rest3')return state.decision==='rescue'?
 {speaker:'리제',portrait:'rize',text:'신호는 살아 있고 설원역의 사람들이 돌아올 통로도 생겼어. 침식은 남았지만 포기하지 않았어.'}:
 {speaker:'리제',portrait:'rize',text:'설원역의 명부를 실었어. 서둘러 봉인을 열지 않았기에 지켜낸 것도 있어. 다음 역에서 이 진실을 밝혀야 해.'};
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
  if(['recruitAster','recruitNoa','recruitVela'].includes(state.node)){
   const id={recruitAster:'aster',recruitNoa:'noa',recruitVela:'vela'}[state.node];
   if(state.recruited.includes(id))return false;
   state.recruited.push(id);state.bonds[id]=Math.min(3,(state.bonds[id]||0)+1);
   state.companions=['mare',...state.recruited.slice(0,2)];
   state.commandDeck=TG.commandDeck.preset('protect',state.companions);
  }
  state.node=state.node==='patientDebrief'?(state.patientReturn==='rest3'?'rest3':'recruitHub'):node.next;state.line=0;
  state.encounterId=isBattle(state.node)?newEncounter():null;
  if(state.encounterId)state.commandSeed=TG.commandDeck.seedFor(state.encounterId);
  state.completed=['rest','rest2','rest3'].includes(state.node);
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
A.beginR4=function(){
 if(activeRun())return false;
 return transact(state=>{
  if(state.node!=='rest2'||!state.completed||!state.decision||!state.recordRecovered)return false;
  state.node='snowArrival';state.line=0;state.completed=false;state.recruited=[];state.snowParty=[];
  state.companions=['mare'];state.commandDeck=TG.commandDeck.preset('protect',['mare']);
  state.loadout.hp=Math.max(80,state.loadout.hp);
 });
};
A.openRecruit=function(id){
 if(activeRun()||!['aster','noa','vela'].includes(id))return false;
 return transact(state=>{
  if(state.node!=='recruitHub'||state.recruited.includes(id))return false;
  state.node={aster:'recruitAster',noa:'recruitNoa',vela:'recruitVela'}[id];state.line=0;
 });
};
A.beginVelaPatient=function(){
 if(activeRun())return false;
 return transact(state=>{
  if(!['recruitHub','rest3'].includes(state.node)||!state.recruited.includes('vela')||state.patientRescued)return false;
  state.patientReturn=state.node;state.node='patientBrief';state.line=0;state.completed=false;
  state.loadout.hp=Math.max(80,state.loadout.hp);
 });
};
A.departSnow=function(){
 if(activeRun())return false;
 return transact(state=>{
  if(state.node!=='recruitHub'||state.recruited.length<2||state.companions.length!==3||state.companions.some(id=>id!=='mare'&&!state.recruited.includes(id)))return false;
  state.snowParty=[...state.companions];state.node='snowDeparture';state.line=0;
  state.loadout.hp=Math.max(80,state.loadout.hp);
 });
};
A.setParty=function(ids){
 if(activeRun()||!Array.isArray(ids)||ids.length!==3||new Set(ids).size!==3||ids.some(id=>!TG.PARTY.some(x=>x.id===id&&x.trial)))return false;
 return transact(state=>{
  if(!['rest','rest2','recruitHub','rest3'].includes(state.node))return false;
  if(['recruitHub','rest3'].includes(state.node)&&ids.some(id=>id!=='mare'&&!state.recruited.includes(id)))return false;
  state.companions=[...ids];
  state.commandDeck=TG.commandDeck.preset('protect',ids);
 });
};
A.prepareBattle=function(){
 const S=TG.store,state=A.state();
 if(!state.started||!isBattle(state.node)||!S.canWrite()||!/^story-[\w-]{1,80}$/.test(state.encounterId||''))return null;
 const companions=state.node==='velaEscort'?['mare','vela',...state.recruited.filter(id=>id!=='vela').slice(0,1)]:[...state.companions];
  const deck=state.node==='velaEscort'?TG.commandDeck.preset('protect',companions):[...state.commandDeck];
  return {id:state.encounterId,battleId:state.node,loadout:clone(state.loadout),companions,commandDeck:deck,commandSeed:state.commandSeed,route:state.decision,snowParty:[...state.snowParty]};
};
A.setCommandDeck=function(ids){
 if(activeRun())return false;
 return transact(state=>{
  if(!['battle','rest','recruit'].includes(TG.STORY.nodes[state.node]?.kind)||!TG.commandDeck.validate(ids,state.companions))return false;
  state.commandDeck=[...ids];
 });
};
A.prepareTraining=function(){
 const S=TG.store,state=A.state();
 if(!state.companions.length||activeRun()||!S.canWrite()||!['rest','rest2','rest3','recruitHub','approach','escort','archive','snowMission'].includes(state.node))return null;
 return {id:'training-'+state.node+'-'+state.commandSeed.toString(36),battleId:'escort',duration:90,loadout:clone(state.loadout),companions:[...state.companions],commandDeck:[...state.commandDeck],commandSeed:state.commandSeed};
};
A.completeBattle=function(run){
 if(!run||run.mode!=='story'||run.storyTraining===true||run.won!==true||!Number.isFinite(run.p?.hp)||run.p.hp<=0)return false;
 return transact(state=>{
  const battle=TG.STORY.battles[state.node];
  if(!state.started||!battle||state.node!==run.storyBattle||state.encounterId!==run.id||state.node==='archive'&&run.recordTarget?.recovered!==true||state.node==='snowMission'&&(!Array.isArray(run.signalTargets)||run.signalTargets.length!==(state.decision==='rescue'?2:1)||run.signalTargets.some(t=>t.recovered!==true))||state.node==='velaEscort'&&(!run.patient||run.patient.phase!=='boarded'||run.patient.hp<=0||run.patient.saved!==true))return false;
  state.loadout=clone({hp:run.p.hp,levels:run.levels||{},level:run.level,xp:run.xp,kills:run.kills,totalTime:run.totalTime,relics:run.relics||[]});
  if(state.node==='archive')state.recordRecovered=true;
  if(state.node==='snowMission')state.snowRecovered=true;
  if(state.node==='velaEscort'){
   state.patientRescued=true;
   state.patientCare={treatments:Math.min(999,run.patient.treatments||0),mareBlocks:Math.min(999,run.patient.mareBlocks||0),hp:Math.ceil(run.patient.hp)};
   state.bonds.vela=Math.min(3,(state.bonds.vela||0)+1);
   if(run.patient.mareBlocks>0)state.bonds.mare=Math.min(3,(state.bonds.mare||0)+1);
  }
  state.node=battle.next;state.line=0;state.encounterId=null;
 });
};
})();
