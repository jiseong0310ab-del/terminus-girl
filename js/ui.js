'use strict';
(()=>{
const $=id=>document.getElementById(id),G=TG.engine,S=TG.store,U=TG.ui={screen:'menu',returnTo:'menu'};let hudClock=0,last=0,lastDraw=0,modalAction=null,lastFocus=null,registration=null,updating=false,dismissedWorker=null,lastUpdateCheck=0;
const screenIds={menu:'menuScreen',hub:'hubScreen',cards:'levelScreen',paused:'pauseScreen',camp:'campScreen',ended:'endScreen',archive:'archiveScreen',settings:'settingsScreen',about:'aboutScreen',journal:'journalScreen',story:'storyScreen',commands:'commandsScreen',deck:'deckScreen',party:'partyScreen'};
const fmt=t=>`${Math.floor(Math.max(0,t)/60)}:${String(Math.floor(Math.max(0,t))%60).padStart(2,'0')}`;
function text(id,value){$(id).textContent=value}function button(label,onClick,cls='btn alt'){const b=document.createElement('button');b.className=cls;b.textContent=label;b.onclick=onClick;return b}
function clear(id){$(id).replaceChildren();return $(id)}
function status(){return S.status==='conflict'?'다른 탭에서 기록이 변경되어 이 탭의 저장을 중지했습니다. 현재 진행을 백업하고 새로고침해 최신 기록을 확인하세요.':S.status==='memory'?'기기 저장소에 접근하지 못했습니다. 백업을 내려받고 페이지를 다시 열어 주세요.':S.status==='corrupt'?'기록을 읽지 못해 자동 저장을 중지했습니다. 설정에서 정상 백업을 복원해 주세요.':S.status==='recovered'?'이전 정상 기록에서 복구했습니다. 새 백업을 받아 주세요.':S.status==='migrated'?'이전 버전의 탐험 통계를 가져왔습니다. 새 탐험부터 기억 조각을 모아 성장할 수 있어요.':''}
function notify(msg){text('toast',msg);$('toast').classList.add('active');setTimeout(()=>{if(!G.g?.toast||G.g.toast.life<=0)$('toast').classList.remove('active')},3200)}
U.show=function(name){TG.input.reset();U.screen=name;for(const [key,id]of Object.entries(screenIds)){$(id).classList.toggle('on',key===name);$(id).setAttribute('aria-hidden',key===name?'false':'true');}const playing=name==='playing';$('hud').style.display=playing?'block':'none';$('bossHud').hidden=!playing;$('partyHud').hidden=!playing||!(G.g?.mare||G.g?.allies?.length);$('commandBtn').hidden=!playing||!G.g?.commands;$('guide').classList.toggle('commandGuide',!!G.g?.commands);$('pauseBtn').style.display=playing?'block':'none';$('controls').style.display=playing?'block':'none';$('guide').style.display='none';$('toast').classList.remove('active');text('toast','');if(!playing){TG.audio.scene('hub');if(screenIds[name])$(screenIds[name]).scrollTop=0;}if(name==='menu')renderMenu();if(name==='hub')renderHub();if(name==='cards')renderCards();if(name==='paused')renderBuild();if(name==='camp')renderCamp();if(name==='ended')renderResult();if(name==='archive')renderArchive();if(name==='journal')renderJournal();if(name==='settings')renderSettings();if(name==='story')renderStory();if(name==='commands')renderCommands();if(name==='deck')renderDeck();if(name==='party')renderParty();if(name==='playing'){hud();TG.audio.scene(TG.STAGES[G.g.stage].id)}updateNotice();};
G.onChange=U.show;G.onSound=TG.audio.play;
S.onConflict=()=>{
 if(G.g?.status==='playing')G.pause();
 if(['cards','command'].includes(G.g?.status)){U.returnTo=G.g.status==='command'?'commands':'cards';U.show('settings');}
 notify('다른 탭에서 기록이 바뀌어 저장을 중지했습니다. 설정에서 백업 후 새로고침하세요.');
 for(const id of ['saveStatus','hubSaveStatus','settingsStatus','campSaveStatus','journalSaveStatus','resultSaveStatus','storySaveStatus','commandStatus','deckStatus'])if($(id))text(id,status());
};
function renderMenu(){storyEntryLabels();const r=S.data.stats;text('archiveText',`탐험 ${r.runs}회 · 1장 복원 ${r.wins}회 · 최고 격파 ${r.bestKills}`);text('saveStatus',status());text('enterHub',S.data.checkpoint?'생존 탐험 이어가기 · 열차로':'생존 탐험 · 열차로');$('quickStart').disabled=!!S.data.checkpoint;}
function renderHub(){storyEntryLabels();text('walletLabel',`기억 조각 ${S.data.wallet}개`);const cp=S.data.checkpoint;text('checkpointNote',cp?`${TG.STAGES[cp.stage].name} ${cp.phase==='camp'?'복원 직후':'시작 지점'}부터 이어갑니다. 카드·유물은 유지됩니다.`:'첫 번째 장 · 세 개의 역을 복원하세요. 역 경계에서 진행이 저장됩니다.');$('chapterStart').hidden=!!cp;$('continueRun').hidden=!cp;$('abandonRun').hidden=!cp;$('singleStart').disabled=!!cp;
 const cleared=cp?cp.stage+(cp.phase==='camp'?1:0):0;
 $('chapterSteps').hidden=!!cp||S.data.stats.runs>0;$('chapterBrief').classList.toggle('compact',!!cp||S.data.stats.runs>0);text('chapterMeta',cp?'이번 탐험의 카드·유물을 이어서 다음 기록을 복원하세요.':'귀환 후에는 보관한 기억 조각으로 열차를 정비합니다.');
 text('routeCaption',cp?'이번 탐험 · 복원 '+cleared+'/3':'새 탐험은 첫 역부터 시작합니다. 복원했던 기록과 정비는 남습니다.');
 const route=clear('routeList');TG.STAGES.forEach((s,i)=>{const e=document.createElement('div'),done=cp?i<cleared:i<S.data.unlocked||S.data.stats.wins>0,current=cp?i===cp.stage&&cp.phase!=='camp'||i===cp.stage+1&&cp.phase==='camp':i===0;
 e.className=done?'visited':current?'current':'';const name=document.createElement('strong'),state=document.createElement('small');name.textContent=`0${i+1} · ${s.name}`;state.textContent=cp?done?'이번 탐험 복원':current?cp.phase==='camp'?'다음 정차':'이어갈 역':'미도달':done?'복원했던 역':i===0?'출발':'앞으로 복원';e.append(name,state);route.appendChild(e)});
 text('mareText',S.data.memories.includes('ending')?'“기억이 아파도 괜찮아. 함께 타고 가면 되니까.” 랜턴 옆에 작은 불빛이 흔들린다.':S.data.memories.includes('bell')?'“네가 기억하는 한, 나는 여기 있어.” 안내 장치 너머로 익숙한 목소리가 흐른다.':S.data.memories.includes('mirror')?'“왕복표는 한 장 더 남겨 뒀어.” 지워진 이름이 마음속에서 천천히 선명해진다.':'“랜턴을 내려놓지 마.” 낡은 차내 방송에서 낯익은 목소리가 새어 나온다.');
 const list=clear('upgradeList');for(const u of TG.UPGRADES){const lv=S.data.upgrades[u.id],cost=u.base*(lv+1),row=document.createElement('div');row.className='upgradeBuy';const content=document.createElement('div'),title=document.createElement('b'),desc=document.createElement('small');title.textContent=`${u.name} · ${lv}/${u.cap}`;desc.textContent=u.desc;content.append(title,desc);const buy=button(lv>=u.cap?'정비 완료':`${cost}개 · 정비`,()=>{if(S.buy(u.id)){TG.audio.play('card');renderHub()}},'textbtn');buy.disabled=!!cp||lv>=u.cap||S.data.wallet<cost;row.append(content,buy);list.appendChild(row)}text('hubSaveStatus',status());const nextGoal=S.challengeProgress().find(goal=>!goal.complete);text('nextGoalText',nextGoal?'다음 도전 · '+nextGoal.name+' — '+nextGoal.desc+' ('+nextGoal.current+'/'+nextGoal.target+')':'여섯 개의 도전 기록을 모두 채웠습니다. 새로운 기억 조합으로 다음 여정을 시작해 보세요.');}
function storyEntryLabels(){const state=TG.story.state(),label=state.node==='rest3'?'제2장 · 설원역 임무 완료 · '+(state.decision==='rescue'?'구조 통로 안정화':'명부 확보'):state.node==='rest2'?'제1장 · 기록 회수 완료 · '+(state.decision==='rescue'?'구조 신호 개방':'봉인 유지'):state.node==='rest'?'첫 동행 후일담 · 다음 임무를 시작하세요':state.started?'이야기 이어가기 · '+TG.STORY.nodes[state.node].title:'이야기 · 리제와 마레의 첫 동행';text('menuStory',label);text('hubStory',label);}
function openStory(){TG.audio.unlock();if(G.g&&G.g.status!=='ended')return;if(!TG.story.begin()){if(U.screen==='hub')renderHub();else renderMenu();notify(status()||'이야기를 저장하지 못했습니다.');return;}G.g=null;U.show('story');}
function renderStory(){
 const state=TG.story.state(),node=TG.STORY.nodes[state.node],line=TG.story.currentLine(state),battle=TG.STORY.battles[state.node];
 const boundary=['battle','rest','recruit'].includes(node.kind),atRest=['rest','rest2','recruitHub','rest3'].includes(state.node),choice=node.kind==='choice',recruit=node.kind==='recruit';
 $('storyDeck').hidden=!boundary;
 $('storyPartySelect').hidden=!atRest||state.node==='recruitHub'&&state.recruited.length<2;
 $('storyTraining').hidden=!boundary||!state.companions.length;
 $('storyNextMission').hidden=!['rest','rest2'].includes(state.node);
 text('storyNextMission',state.node==='rest2'?'제2장 시작 · 침묵의 설원역':'다음 이야기 시작 · 지워진 기록 회수');
 $('storyRecruitPanel').hidden=!recruit;
 const patientVisible=['recruitHub','rest3'].includes(state.node)&&state.recruited.includes('vela');
 $('storyPatientMission').hidden=!patientVisible||state.patientRescued;
 $('storyPatientMission').onclick=()=>{TG.audio.unlock();if(TG.story.beginVelaPatient())renderStory();else{renderStory();notify(status()||'벨라의 환자 구조 임무를 시작할 수 없습니다.');}};
 $('storyPatientCabin').hidden=!patientVisible||!state.patientRescued;
 if(state.patientRescued)text('storyPatientText','환자 체력 '+(state.patientCare?.hp||0)+' · 벨라 처치 '+(state.patientCare?.treatments||0)+'회 · 마레 보호 '+(state.patientCare?.mareBlocks||0)+'회. 벨라가 객차에서 회복을 돕고 있습니다.');
 if(recruit){
  text('storyRecruitCount',state.recruited.length+' / 3명 정식 영입');
  for(const id of ['aster','noa','vela']){
   const member=TG.PARTY.find(x=>x.id===id),btn=$('storyRecruit'+id[0].toUpperCase()+id.slice(1)),done=state.recruited.includes(id);
   btn.disabled=done;btn.classList.toggle('done',done);
   btn.setAttribute('aria-label',member.name+(done?' 정식 영입 완료':'의 영입 사건 보기'));
   btn.onclick=()=>{TG.audio.unlock();if(TG.story.openRecruit(id))renderStory();else{renderStory();notify(status()||'영입 대화를 시작할 수 없습니다.');}};
  }
  const available=state.recruited.length>=2&&state.companions.length===3;
  $('storySnowLaunch').hidden=!available;
  $('storySnowLaunch').disabled=!available;
  $('storySnowLaunch').onclick=()=>{TG.audio.unlock();if(TG.story.departSnow())renderStory();else{renderStory();notify(status()||'출전할 동료 3명을 편성해 주세요.');}};
 }
 $('storyChoicePanel').hidden=!choice;
 $('storyAction').hidden=choice||recruit;
 text('storyTraining',state.companions.length>=2?'출전 동료와 90초 전술 연습':'마레와 지휘 연습 · 90초');
 text('storyTitle',node.title);text('storySaveStatus',status());
 text('storySpeaker',line?.speaker||(battle?'현재 임무':'열차의 기록'));
 text('storyText',line?.text||(battle?battle.detail:'열차의 창밖으로 다음 역의 불빛이 흔들린다.'));
 text('storyPosition',node.kind==='dialogue'?(state.line+1)+' / '+node.lines.length:node.kind==='battle'?'임무 · '+battle.duration+'초 내 목표 달성 · 즉시 완료':recruit?'기록실·신호탑·구호실 · 원하는 순서로 영입':choice?'중요한 선택 · 기록에 영구 보존':state.node==='rest2'?'제1장 기록 확보 완료':state.node==='rest3'?'제2장 설원역 귀환 완료':'첫 동행 완료 · 지휘 덱 편성 및 다음 임무 출발 가능');
 $('storyPortrait').className='storyPortrait '+(line?.portrait||(state.companions.includes('mare')?'mare':'rize'));
 const names=state.companions.map(id=>TG.PARTY.find(x=>x.id===id)?.name||id);
 text('storyParty',state.companions.length?'출전 · 리제 + '+names.join(' · '):state.node==='meeting'?'이 대화 후 마레 합류 · 체력 최대 40 회복':'일행 · 리제');
 const hasOutcome=!!state.decision||state.erosion>0;
 $('storyConsequence').hidden=!hasOutcome;
 text('storyErosion',TG.story.summary(state));
 const bonded=Object.entries(state.bonds||{}).filter(([,value])=>value>0).map(([id,value])=>(TG.PARTY.find(a=>a.id===id)?.name||id)+' 유대 +'+value);
 text('storyBonds',bonded.length?bonded.join(' · '):'동료와의 유대는 이야기를 통해 쌓입니다.');
 text('storyBoundaryNote',state.node==='velaEscort'?'환자를 안정화하고 함께 객차 문까지 돌아오면 즉시 승리합니다. 벨라 온기 처치와 마레의 방패는 환자에게도 영향을 줍니다.':recruit?'동료 두 명 이상을 정식 영입하고 출전 셋을 편성하세요. 누구를 데려가느냐에 따라 설원역 장치 회수 시간·적 출현·회복 지원이 달라집니다.':choice?'기록의 진실을 확인했습니다. 결정은 저장되며 다시 고를 수 없습니다.':node.kind==='battle'?'전투에 실패하면 이 전투 시작점에서 재도전합니다. 생존 탐험의 조각·기록은 변경되지 않습니다.':'읽은 대사와 선택은 자동 저장됩니다. 재접속해도 이어집니다.');
 text('storyAction',node.kind==='dialogue'?(state.line+1<node.lines.length?'다음':state.node==='meeting'?'마레와 함께 출발':'이어서'):node.kind==='battle'?'임무 시작 · '+battle.duration+'초':'열차로 돌아가기');
 const expectedNode=state.node,expectedLine=state.line;
 $('storyAction').onclick=()=>{
  TG.audio.unlock();
  if(node.kind==='dialogue'){TG.story.advance(expectedNode,expectedLine);renderStory();}
  else if(node.kind==='battle'){if(G.g&&G.g.status!=='ended')return;G.g=null;if(!G.startStory())renderStory();}
  else{G.g=null;U.show('hub');}
 };
 $('storyNextMission').onclick=()=>{TG.audio.unlock();if((state.node==='rest2'?TG.story.beginR4():TG.story.beginR3()))renderStory();else{renderStory();notify(status()||'다음 임무를 시작할 수 없습니다.');}};
 $('storyRescue').onclick=()=>{TG.audio.unlock();if(TG.story.choose('rescue',expectedNode))renderStory();else{renderStory();notify(status()||'이미 선택했거나 진행을 저장하지 못했습니다.');}};
 $('storyContain').onclick=()=>{TG.audio.unlock();if(TG.story.choose('contain',expectedNode))renderStory();else{renderStory();notify(status()||'이미 선택했거나 진행을 저장하지 못했습니다.');}};
 const log=clear('storyLog');
 for(const id of state.seen){
  const scene=TG.STORY.nodes[id];
  if(!scene)continue;
  const title=document.createElement('h3');title.textContent=scene.title;log.appendChild(title);
  for(let n=0;n<(scene.lines||[]).length;n++){
   const l=TG.story.currentLine({...state,node:id,line:n})||scene.lines[n],p=document.createElement('p');
   p.textContent=l.speaker+' · '+l.text;log.appendChild(p);
  }
  if(id==='decision'){const p=document.createElement('p');p.textContent='선택 결과 · '+TG.story.summary(state);log.appendChild(p);}
 }
 if(!state.seen.length){const p=document.createElement('p');p.textContent='마친 대화는 여기에 남습니다.';log.appendChild(p);}
}
function renderStoryResult(g){
 if(g.storyTraining){renderTrainingResult(g);return;}
 const battle=TG.STORY.battles[g.storyBattle];text('resultSaveStatus',status());$('newGoalNote').hidden=true;text('newGoalNote','');$('resultJournal').hidden=true;$('retryBtn').hidden=g.won;
 text('backBtn',g.won&&!g.storySaved?'진행 저장 다시 시도':g.won?'이야기 계속':'이야기로 돌아가기');text('retryBtn','현재 전투 다시 도전');text('endOrnament',g.won?'✦':'◷');text('endOverline',['snowMission','velaEscort'].includes(g.storyBattle)?'이야기 · 침묵의 설원역':'이야기 · 거울 유리역');
 text('endTitle',g.won?(g.storySaved?battle.successTitle:'전투 완료 · 진행 저장 대기'):g.reason==='retreat'?'열차에서 다시 준비':'다시 열어야 할 길');text('endStory',g.won?battle.successStory:g.reason==='timeout'?'제한시간 안에 목표를 달성하지 못했습니다. 이동과 조작이 필요하며 가만히 서 있어도 자동으로 성공하지 않습니다.':g.storyBattle==='velaEscort'?'환자를 객차까지 데려가지 못했습니다. 구조 직전 상황부터 다시 도전할 수 있습니다.':g.storyBattle==='snowMission'&&g.reason==='signal'?'설원역 목표 장치를 모두 회수하지 못했습니다. 동료를 다시 편성해 도전해 보세요.':g.storyBattle==='archive'&&g.reason==='record'?'시간이 끝날 때까지 기록장치를 회수하지 못했습니다. 임무 시작 지점에서 다시 도전하세요.':'리제는 전투 시작 지점으로 돌아갑니다. 이미 읽은 대화와 합류한 동료는 남습니다.');
 const currentParty='리제'+(g.party?.length?' + '+g.party.map(id=>commandOwner[id]||id).join(' · '):'');
 const impact=g.storyBattle==='velaEscort'&&g.patient?' · 벨라의 처치 '+g.patient.treatments+'회 · 환자 보호 '+g.patient.mareBlocks+'회 · 환자 HP '+Math.ceil(g.patient.hp):'';
 text('resultProgress','일행 · '+currentParty+' / 보호 '+(g.mare?.protected||0)+'회 · 지휘 '+(g.commands?.casts||0)+'회'+impact+(g.storyPressure?' · 침식 회피 '+g.storyPressure.dodges+'회':''));text('resultAdvice',g.won?(g.storySaved?'다음 대화에서 이번 만남을 이어가세요.':'설정에서 백업을 확인하거나 저장을 다시 시도하세요. 아직 다음 장면으로 진행하지 않았습니다.'):g.mare?'마레의 보호가 소모되면 12초의 준비 시간이 필요합니다. 공격 예고는 이동과 대시로 피하세요.':'공격은 자동입니다. 적이 남긴 경험치를 모으고 위험할 때 대시로 벗어나세요.');
 if(g.storyBattle==='velaEscort'){
  text('resultAdvice',g.won?'환자가 마지막 객차에 올라탔습니다. 출전 동료들이 어떤 역할을 했는지 기록으로 확인하세요.':'벨라의 치료와 마레의 보호를 환자 가까이에서 활용하세요. 경고가 뜨면 환자 곁을 지키세요.');
 }
 text('resultGrowth','이야기는 전투 시작과 완료 경계에서 저장합니다. 전투 중 얻은 기억 강화는 성공했을 때 다음 장면으로 이어집니다.');text('resultTime',fmt(g.totalTime));text('resultKills',g.kills);text('resultShards','0');text('resultNote','이야기 시범은 생존 조각·도전·첫 장 완주 기록을 정산하지 않습니다. 기존 생존 진행은 그대로 보관됩니다.');
}
const commandOwner={rize:'리제',mare:'마레',shared:'공용',...Object.fromEntries(TG.PARTY.map(x=>[x.id,x.name]))};
function openParty(){if(!['rest','rest2','recruitHub','rest3'].includes(TG.story.state().node)||G.g&&G.g.status!=='ended')return;U.partyDraft=[...TG.story.state().companions];U.show('party');}
function renderParty(){
 const state=TG.story.state(),official=['recruitHub','rest3'].includes(state.node),draft=U.partyDraft||[...state.companions],list=clear('partyList');
 U.partyDraft=draft;
 text('partyCount',draft.length+' / 3');
 text('partySelection',draft.length===3?'출전 준비 완료 · 다른 동료를 고르려면 기존 선택을 해제하세요.':'동료 '+(3-draft.length)+'명을 더 선택하세요.');
 $('partySave').disabled=draft.length!==3||!S.canWrite();
 for(const ally of TG.PARTY){
  const selected=draft.includes(ally.id),available=ally.trial&&(!official||ally.id==='mare'||state.recruited.includes(ally.id));
  const b=button('',()=>{
   if(!available)return;
   const idx=draft.indexOf(ally.id);
   if(idx>=0)draft.splice(idx,1);
   else if(draft.length<3)draft.push(ally.id);
   renderParty();
  },'partyMember char-'+ally.id+(selected?' selected':'')+(!available?' locked':''));
  b.disabled=!available;
  b.setAttribute('aria-pressed',String(selected));
  b.setAttribute('aria-label',ally.name+' · '+ally.role+' · '+ally.desc+(selected?' · 출전 중':available?' · 편성 가능':' · 아직 합류하지 않음'));
  const art=document.createElement('span'),fade=document.createElement('span'),body=document.createElement('span'),name=document.createElement('strong'),role=document.createElement('small'),flag=document.createElement('span');
  art.className='partyArt char-'+ally.id;art.setAttribute('aria-hidden','true');
  fade.className='partyFade';fade.setAttribute('aria-hidden','true');
  body.className='partyMemberText';name.textContent=ally.name;role.textContent=ally.role+' · '+(available?ally.desc.split(' · ')[0]:'미합류');
  flag.className='partyFlag';flag.textContent=!available?'잠금':selected?'✓':'＋';
  body.append(name,role);b.append(art,fade,body,flag);list.appendChild(b);
 }
}
function openDeck(){const s=TG.story.state();if(!['battle','rest','recruit'].includes(TG.STORY.nodes[s.node].kind)||G.g&&G.g.status!=='ended')return;U.deckDraft=[...s.commandDeck];$('deckOwnerFilter').value='all';U.show('deck');}
function renderDeck(){
 const s=TG.story.state(),list=clear('deckList'),draft=U.deckDraft||[...s.commandDeck],available=TG.commandDeck.available(s.companions),filter=$('deckOwnerFilter').value||'all';U.deckDraft=draft;
 const needed=TG.commandDeck.size(s.companions);
 $('deckCounter').hidden=!s.companions.includes('mare');text('deckProtect',needed===10?'지원 중심 추천':s.companions.includes('mare')?'보호 중심 추천':'단독 운행 기본 편성');text('deckCount',draft.length+' / '+needed+'장 선택'+(draft.length>needed?' · '+(draft.length-needed)+'장 줄여 주세요':draft.length<needed?' · '+(needed-draft.length)+'장 더 골라 주세요':''));$('deckCount').classList.toggle('invalid',!TG.commandDeck.validate(draft,s.companions));text('deckStatus',status());text('deckHint',needed===10?'리제 2장 이상 · 출전 동료 각 1장 이상 · 4장 손패':s.companions.includes('mare')?'리제·마레 각 2장 이상 · 3장 손패':'리제·공용 8장을 편성합니다.');text('deckSave',needed+'장 편성 저장');$('deckSave').disabled=!TG.commandDeck.validate(draft,s.companions);
 const visible=available.filter(c=>filter==='all'||c.owner===filter);if(!visible.length){const note=document.createElement('p');note.className='note';note.textContent='마레와 만난 뒤 전용 지휘를 편성할 수 있습니다.';list.appendChild(note);}
 for(const card of visible){
  const selected=draft.includes(card.id),b=button('',()=>{const at=U.deckDraft.indexOf(card.id);if(at>=0)U.deckDraft.splice(at,1);else U.deckDraft.push(card.id);renderDeck();},'upgrade deckChoice'+(selected?' selected':''));b.setAttribute('aria-pressed',String(selected));b.setAttribute('aria-label',(selected?'편성됨 · ':'')+card.name+' · '+commandOwner[card.owner]+' · 지휘력 '+card.cost);
  const content=document.createElement('span'),tag=document.createElement('small'),title=document.createElement('strong'),desc=document.createElement('span'),art=document.createElement('span'),cost=document.createElement('span');
  art.className='deckPortrait character-'+card.owner;art.setAttribute('aria-hidden','true');
  cost.className='deckCost';cost.textContent=card.cost;
  tag.className='commandOwner';tag.textContent=commandOwner[card.owner]+' · '+(card.action?'합동 지휘':'전술 지휘');
  title.className='cardtitle';title.textContent=(selected?'✓ ':'')+card.name;
  desc.className='carddesc';desc.textContent=card.desc;
  content.className='deckText';content.append(tag,title,desc);b.append(art,cost,content);list.appendChild(b);
 }
}
function renderCommands(){
 const g=G.g;if(!g?.commands)return;const c=g.commands;const remaining=Math.max(0,Math.ceil(g.duration-g.time));text('commandPower','지휘력 '+c.energy+' / 3'+(c.energy<3?' · 전투 '+Math.ceil(12-c.regen)+'초 후 +1':''));text('commandCombo',[g.commandEffects.guardWindow>0?'보호 연계 준비 · 파동·절단 위력 50% 증가 또는 반격 사용':g.mare?'마레나 보호막이 피해를 막으면 4초 동안 보호 연계 가능':'마레 합류 후 보호 연계를 사용할 수 있습니다.',g.commandEffects.ward>0?'보호 장막 '+g.commandEffects.ward.toFixed(1)+'초':''].filter(Boolean).join(' · '));text('commandPiles','손패 '+c.hand.length+' · 뽑기 '+c.draw.length+' · 버림 '+c.discard.length);text('commandObjective',G.objective().title+' · 실패까지 '+fmt(remaining));text('commandStatus',status());
 const list=clear('commandList'),token=c.token,details=clear('commandDetailsList');
 for(const id of c.hand){const info=G.commandInfo(id),card=info.card;if(!card)continue;const b=button('',()=>{TG.audio.unlock();if(!G.castCommand(id,token))renderCommands();},'upgrade commandCard '+card.owner);b.disabled=!info.enabled;
  const cost=document.createElement('span'),body=document.createElement('span'),owner=document.createElement('small'),title=document.createElement('strong'),desc=document.createElement('span');cost.className='commandCost';cost.textContent=card.cost;owner.className='commandOwner';owner.textContent=commandOwner[card.owner];title.className='cardtitle';title.textContent=card.name;desc.className='carddesc';desc.textContent=card.desc;const art=document.createElement('span');art.className='commandArt character-'+card.owner;art.setAttribute('aria-hidden','true');body.append(art,owner,title,desc);
  const nearPatient=g.storyBattle==='velaEscort'&&g.patient&&g.patient.phase!=='boarded'&&Math.hypot(g.p.x-g.patient.x,g.p.y-g.patient.y)<155;
  if(nearPatient&&(['vela_heal','vela_guard','mare_guard'].includes(card.id))){const target=document.createElement('span');target.className='commandTarget';target.textContent='대상 · 환자';body.appendChild(target);b.classList.add('patientTarget');}
  const more=document.createElement('p');more.textContent=commandOwner[card.owner]+' · 지휘력 '+card.cost+' · '+card.desc+(nearPatient&&['vela_heal','mare_guard'].includes(card.id)?' · 환자에게도 적용 가능':'');
  details.appendChild(more);
  if(!info.enabled){const reason=document.createElement('span');reason.className='commandReason';reason.textContent=info.reason;body.appendChild(reason);}b.append(cost,body);b.setAttribute('aria-label',card.name+' · 지휘력 '+card.cost+' · '+card.desc+(!info.enabled?' · '+info.reason:''));list.appendChild(b);
 }
}
function startTraining(){TG.audio.unlock();if(G.g&&G.g.status!=='ended')return;G.g=null;if(!G.startCommandTraining()){text('storySaveStatus',status()||'마레 합류 후 지휘 연습을 시작할 수 있습니다.');}}
function renderTrainingResult(g){
 $('newGoalNote').hidden=true;$('resultJournal').hidden=true;$('retryBtn').hidden=false;text('resultSaveStatus',status());text('backBtn','이야기·덱 편성으로');text('retryBtn','지휘 연습 다시 하기');text('endOrnament',g.won?'✦':'◷');text('endOverline','지휘 연습 · 이야기 진행/보상 없음');text('endTitle',g.won?'함께 싸우는 방법':'다른 지휘를 준비하며');text('endStory','돌격·사격 훈련에서 선택한 동료들과 전술 지휘를 시험했습니다. 원래 이야기 진행과 기억 조각은 그대로입니다.');text('resultProgress','리제 + '+(g.party||[]).map(id=>commandOwner[id]||id).join(' · ')+' / 지휘 '+(g.commands?.casts||0)+'회 · 마레 보호 '+(g.mare?.protected||0)+'회');text('resultAdvice',g.mare?'보호 중심과 반격 중심 덱을 비교해 보세요. 마레의 보호가 발동하면 4초 안에 강화 공격이나 반격을 사용할 수 있습니다.':'동료별 카드 조합을 비교하고 위험한 적의 공격 예고를 회피하며 지휘를 사용해 보세요.');text('resultGrowth','연습은 체력을 회복하고 시작합니다. 연습에서 얻은 전투 레벨·기억 강화는 이야기로 가져가지 않습니다. 저장한 덱 편성은 다음 전투에도 적용됩니다.');text('resultTime',fmt(g.time));text('resultKills',g.kills);text('resultShards','0');text('resultNote','연습은 생존 조각·도전·첫 장 승리로 정산하지 않습니다.');
}
function renderCards(){
 const g=G.g,list=clear('cardList'),token=g.offerToken;
 text('cardGoalText',buildGoalText(g));
 for(const id of g.offered){
  const c=id==='rest'?{id,name:'잠시 숨 고르기',icon:'♡',desc:'모든 기억을 복원했습니다. 체력 25를 회복합니다.'}:TG.CARDS.find(c=>c.id===id);
  const preview=synergyPreview(id),unlocks=preview.filter(p=>p.unlocks);
  const b=document.createElement('button');b.className='upgrade'+(unlocks.length?' synergyReady':'');
  const icon=document.createElement('span');icon.className='cardIcon';icon.textContent=c.icon;
  const content=document.createElement('span');content.className='cardContent';
  if(unlocks.length){const badge=document.createElement('span');badge.className='cardBadge';badge.textContent='✦ 시너지 완성';content.appendChild(badge);}
  for(const [cls,value] of [
   ['cardtitle',c.name],['carddesc',c.desc],
   ['cardlevel',c.cap?`현재 ${g.levels[id]||0} → 선택 후 ${(g.levels[id]||0)+1} / ${c.cap}단계`:''],
   ['cardhint',cardHint(preview)]
  ]){if(!value)continue;const e=document.createElement('span');e.className=cls;e.textContent=value;content.appendChild(e)}
  b.append(icon,content);b.setAttribute('aria-label',[c.name,c.desc,cardHint(preview)].filter(Boolean).join(' · '));
  b.onclick=()=>{TG.audio.unlock();G.choose(id,token)};list.appendChild(b);
 }
}
function synergyPreview(id){
 if(id==='rest')return [];
 const g=G.g;
 return TG.SYNERGIES.filter(s=>Object.prototype.hasOwnProperty.call(s.needs,id)).map(s=>{
  const entries=Object.entries(s.needs);
  const active=entries.every(([key,n])=>(g.levels[key]||0)>=n);
  const after=entries.every(([key,n])=>(g.levels[key]||0)+(key===id?1:0)>=n);
  const progress=entries.map(([key,n])=>`${TG.CARDS.find(c=>c.id===key).name} ${Math.min(n,(g.levels[key]||0)+(key===id?1:0))}/${n}`).join(' + ');
  return {name:s.name,active,unlocks:after&&!active,progress};
 });
}
function cardHint(preview){
 return preview.map(s=>`${s.unlocks?'선택 즉시 발동':s.active?'이미 발동 중':'선택 후 연계'} · ${s.name}: ${s.progress}`).join(' / ');
}
function renderBuild(){const g=G.g,o=G.objective(g);text('quitBtn',g.storyTraining?'지휘 연습 끝내기':g.mode==='story'?'이야기 중단 · 귀환':'탐험 정산 후 귀환');text('pauseBoundaryNote',g.storyTraining?'연습은 이야기 진행과 보상을 변경하지 않습니다. 열차에서 덱을 바꾸고 다시 연습할 수 있습니다.':g.mode==='story'?'대화와 동료 합류는 유지됩니다. 앱을 종료하면 현재 전투 시작 상태에서 이어갑니다.':'앱을 종료하면 마지막 역 시작 지점부터 이어갑니다.');$('pauseParty').hidden=!g.mare;text('pauseParty',g.mare?'동료 마레 · '+(g.mare.cooldown>0?g.mare.cooldown.toFixed(1)+'초 뒤 보호 준비':'다음 피격 보호 준비'): '');text('pauseObjective',g.mode==='story'?o.title+(g.storyTraining?' · 연습 종료까지 ':' · 임무 완료까지 ')+fmt(Math.ceil(o.remaining)):o.title+' · '+(o.kind==='prepare'?'관리자 도착 '+fmt(Math.ceil(o.bossIn))+' 후 / ':'')+'역 소거까지 '+fmt(Math.ceil(o.remaining))); text('buildSummary',TG.CARDS.filter(c=>g.levels[c.id]).map(c=>`${c.name} ${g.levels[c.id]}`).join(' · ')||'아직 복원한 카드가 없습니다. 빛나는 경험치를 모아 보세요.');text('buildSynergies',TG.SYNERGIES.filter(s=>g.synergies[s.id]).map(s=>s.name+' · '+s.desc).join(' / ')||'함께 어울리는 기억을 모으면 시너지가 발동합니다.');const list=clear('relicList');for(const id of g.relics){const r=TG.RELICS.find(r=>r.id===id),e=document.createElement('span');e.className='chip';e.textContent=`${r.icon} ${r.name}`;e.title=r.desc;list.appendChild(e)}}
function renderCamp(){text('campSaveStatus',status());const g=G.g,s=TG.STAGES[g.stage],ev=TG.EVENTS[g.event];renderBossRewards(g);text('campTitle',s.name+' 복원');text('campStory',s.clear);text('eventTitle',ev.title);text('eventText',ev.text);const list=clear('eventChoices');if(g.eventDone){text('eventReward','선택한 기억이 적용되었습니다. 다음 역으로 갈 준비가 됐습니다.')}else{for(let i=0;i<ev.choices.length;i++){const c=ev.choices[i],b=button(c.label+' · '+c.desc,()=>{TG.audio.unlock();const reward=G.eventChoice(i);if(typeof reward==='string')text('eventReward','획득 · '+reward)});b.disabled=!!c.damage&&g.p.hp<=c.damage;list.appendChild(b)}text('eventReward','선택은 한 번만 적용됩니다.')}text('nextStage',!g.bossReward?'관리자 보상을 선택해 주세요':!g.eventDone?'역 사건을 선택해 주세요':TG.STAGES[g.stage+1].name+'으로 · 체력 20 회복');$('nextStage').disabled=!g.eventDone||!g.bossReward;}
function renderBossRewards(g){const list=clear('bossRewardList');
 if(g.bossReward){const reward=TG.BOSS_REWARDS.find(r=>r.id===g.bossReward);text('bossRewardNote',reward?'선택한 보상 · '+reward.name+' · '+reward.desc:'이전 탐험의 관리자 보상은 이미 처리되었습니다.');return;}
 text('bossRewardNote','한 가지를 선택하세요. 보상과 아래 역 사건은 각각 한 번 적용됩니다.');const stage=g.stage;
 for(const id of g.bossOffers){const reward=TG.BOSS_REWARDS.find(r=>r.id===id);if(!reward)continue;const b=button('',()=>{TG.audio.unlock();G.chooseBossReward(id,stage)},'upgrade bossReward');
 const icon=document.createElement('span'),body=document.createElement('span'),name=document.createElement('strong'),desc=document.createElement('span');icon.className='cardIcon';icon.textContent=reward.icon;name.className='cardtitle';name.textContent=reward.name;desc.className='carddesc';desc.textContent=reward.desc;body.append(name,desc);b.append(icon,body);list.appendChild(b);}}
function renderResult(){const g=G.g;if(g.mode==='story'){renderStoryResult(g);return;}$('resultJournal').hidden=false;$('retryBtn').hidden=false;text('backBtn','열차로 귀환');text('retryBtn','다시 도전');text('resultSaveStatus',status());renderReview(g);const completed=(g.newGoals||[]).map(id=>TG.CHALLENGES.find(c=>c.id===id)?.name).filter(Boolean);$('newGoalNote').hidden=!completed.length;text('newGoalNote',completed.length?'새로운 도전 달성 · '+completed.join(' · '):'');text('endOrnament',g.won?'✦ ◈ ✦':'◷');text('endOverline',g.practice?'전투 연습 종료':g.won?'CHAPTER 01 · 복원 완료':'열차로 귀환');text('endTitle',g.won?(g.practice?'관리자의 기록 복원':'두 개의 불빛'):g.reason==='timeout'?'정차 시간이 끝났다':g.reason==='retreat'?'기억을 안고 귀환':'다음 기회를 기다리며');text('endStory',g.won?(g.practice?'전투 연습을 마쳤습니다. 열차에서 첫 번째 장을 시작해 리제와 마레의 기억을 되찾아 보세요.':TG.STAGES[2].clear):g.reason==='timeout'?'역이 다시 안개 속으로 잠겼다. 다음에는 기억을 더 빠르게 모으고, 관리자가 나타나면 먼저 쓰러뜨려 보자.':'랜턴은 아직 꺼지지 않았다. 열차에서 숨을 고르고, 다른 기억의 조합으로 다시 출발하자.');text('resultTime',fmt(g.totalTime));text('resultKills',g.kills);text('resultShards',g.reward);text('resultNote',g.practice?'전투 연습은 조각 보상을 지급하지 않습니다.':g.won?'모은 조각과 복원 보너스 25개를 지급했습니다. 기억 보관소에서 결말 기록을 읽어 보세요.':`${TG.STAGES[g.stage].name}에서 귀환 · ${g.reward>0?'모은 조각의 절반을 보관했습니다.':'이번 탐험에서 보관할 조각은 없습니다.'} 영구 성장과 복원한 기록은 남습니다.`);}
function buildGoalText(g){const goal=G.buildGoal(g);return goal?'조합 후보 · '+goal.name+' — '+goal.missing.map(c=>c.name+' '+c.current+' → '+c.target).join(' + ')+' 필요. 다른 조합을 선택해도 좋습니다.':'같은 카드를 강화하거나 어울리는 기억을 모으세요. 선택지 아래에서 연계 조건을 확인할 수 있습니다.';}
function renderReview(g){
 const o=G.objective(g),goal=G.buildGoal(g),boss=g.enemies.find(e=>e.type==='boss'&&e.hp>0);
 text('resultProgress',g.practice?'전투 연습 · 정식 탐험 보상 없음':'이번 탐험 · 역 복원 '+o.cleared+'/3');
 let advice;
 if(g.practice)advice='열차에서 첫 번째 장을 시작하면 복원 기록과 기억 조각을 남길 수 있습니다.';
 else if(g.won){const next=S.challengeProgress().find(c=>!c.complete);advice=next?'첫 번째 장을 완주했습니다. 다음 도전: '+next.name+' — '+next.desc:'첫 번째 장과 여섯 도전 기록을 모두 채웠습니다. 탐험 일지에서 이전 조합과 다른 빌드를 비교해 보세요.';}
 else if(g.reason==='retreat'){
  const upgrade=TG.UPGRADES.find(u=>S.data.upgrades[u.id]<u.cap&&S.data.wallet>=u.base*(S.data.upgrades[u.id]+1));
  advice=upgrade?'보관한 조각으로 '+upgrade.name+'을 정비할 수 있습니다. 열차에서 준비한 뒤 새 탐험을 시작하세요.':g.reward===0?'이번 귀환의 지급 조각은 0개입니다. 다음 탐험에서는 적이 남긴 경험치를 회수하고 첫 카드부터 성장시켜 보세요.':'보관한 조각은 다음 정비에 쓸 수 있습니다. 탐험 일지에서 이번 카드 조합을 확인하고 새 여정을 준비하세요.';
 }else if(g.reason==='timeout')advice=(boss?'관리자 체력 '+Math.ceil(boss.hp/boss.maxHp*100)+'%가 남았습니다. ':'')+'다음에는 관리자 도착 전에 경험치를 모아 공격 연계를 완성하고, 등장 후에는 처치에 집중하세요.';
 else advice='다음에는 공격 예고 밖으로 이동하고, 포위되면 대시로 빠져나오세요.';
 if(!g.won&&!g.practice&&g.reason!=='retreat'&&goal)advice+=' 조합 후보: '+goal.name+' ('+goal.missing.map(c=>c.name+' '+c.target+'단계').join(' + ')+').';
 text('resultAdvice',advice);
 text('resultGrowth',g.practice?'연습의 카드·유물은 종료됩니다. 정식 탐험 기록에는 포함되지 않습니다.':'다음 새 탐험에서 카드·유물·전투 레벨은 다시 시작합니다. 지급된 조각·복원한 이야기·열차 정비·도전 기록은 남습니다.');
}
function guideMessage(g){
 if(g.wave)return g.wave.name+' · '+g.wave.remaining.toFixed(1)+'초 · '+g.wave.hint;
 if((g.aftershocks||[]).some(a=>a.age<a.warning))return '거울의 잔진동 · 충격파가 지난 자리에서 벗어나세요';
 if(g.memoryAnchor){const a=g.memoryAnchor,near=Math.hypot(a.x-g.p.x,a.y-g.p.y)<=a.r;return '선택 · 기억 등불 '+Math.ceil(a.remaining)+'초 — '+(near?'잠시 머물러 복원 '+Math.floor(a.charge/a.required*100)+'%':'등불 원 안에서 1.2초 머물기')+' · 경험치 '+a.xp+' / 소거 위험 최대 -10';}
 if((g.eliteDrops||[]).some(drop=>Math.hypot(drop.x-g.p.x,drop.y-g.p.y)<300))return '정예의 불씨 · 주우면 체력 최대 12 회복 · 과충전 최소 3초';
 if(g.mode==='story'){if(g.commandEffects?.guardWindow>0)return '보호 연계 준비 · 지휘를 열어 파동·절단을 강화하거나 반격하세요';if(g.commands?.casts===0&&g.time>=10&&g.time<24)return '오른쪽 지휘 버튼 · 시간이 멈추면 손패 '+g.commands.hand.length+'장 중 선택 · 지휘력은 전투 중 회복';if(g.time<10)return g.mare?'마레가 동행합니다 · 보호 후에는 재준비 12초 · 직접 회피도 잊지 마세요':'공격은 자동 · 이동과 대시로 버티며 경험치를 모으세요';return '';}
 if(g.mode!=='chapter'||g.stage!==0||g.bossSpawned||S.data.stats.runs>0)return '';
 const learned=g.learned||{};
 if(!learned.moved)return '왼쪽 조작판을 밀어 이동 · 공격은 자동으로 발사됩니다';
 if(!learned.collected)return '적이 남긴 빛나는 경험치를 주우세요 · 조각은 격파 때 자동 적립';
 if(!learned.chosen)return '경험치 막대를 채워 첫 카드를 선택하세요 · 카드 조합으로 성장';
 if(!learned.dashed)return '공격 예고가 보이면 오른쪽 대시 · 사용 중 잠시 무적';
 return '';
}
function renderArchive(){text('memoryCount',`${S.data.memories.length} / ${TG.MEMORIES.length}개의 기록 복원`);const list=clear('memoryList');for(const m of TG.MEMORIES){const unlocked=S.data.memories.includes(m.id),e=document.createElement('article');e.className='memoryItem'+(unlocked?'':' locked');const title=document.createElement('h3'),body=document.createElement('p');title.textContent=unlocked?m.title:'아직 돌아오지 않은 기억';body.textContent=unlocked?m.text:'열차와 역을 탐험하면 기록이 조금씩 되돌아옵니다.';e.append(title,body);list.appendChild(e)}}
function renderSettings(){const s=S.data.settings;$('bgmVolume').value=Math.round(s.bgm*100);$('sfxVolume').value=Math.round(s.sfx*100);text('bgmValue',`${Math.round(s.bgm*100)}%`);text('sfxValue',`${Math.round(s.sfx*100)}%`);$('reduceFX').checked=s.reduceFX;$('quality').value=s.quality;text('settingsStatus',status());}
function renderJournal(){
 const goals=S.challengeProgress();text('challengeCount',goals.filter(c=>c.complete).length+' / '+goals.length);text('journalTotals','탐험 '+S.data.stats.runs+'회 · 첫 장 복원 '+S.data.stats.wins+'회 · 최고 격파 '+S.data.stats.bestKills);text('journalSaveStatus',status());
 const list=clear('challengeList');for(const goal of goals){const item=document.createElement('article');item.className='challengeItem'+(goal.complete?' complete':'');const title=document.createElement('h4'),desc=document.createElement('p'),progress=document.createElement('progress'),note=document.createElement('span');title.textContent=goal.icon+' '+goal.name;desc.textContent=goal.desc;progress.max=goal.target;progress.value=goal.current;progress.setAttribute('aria-label',goal.name+' '+goal.current+' / '+goal.target);note.className='cardhint';note.textContent=goal.complete?'달성':goal.current+' / '+goal.target;item.append(title,desc,progress,note);list.appendChild(item)}
 const history=clear('historyList');if(!S.data.history.length){const empty=document.createElement('p');empty.className='journalEmpty';empty.textContent='아직 남겨진 여정이 없습니다. 첫 번째 장을 탐험하고 열차로 돌아오면 기록이 여기에 남습니다.';history.appendChild(empty);return;}
 for(const run of S.data.history){const item=document.createElement('article');item.className='journalItem';const title=document.createElement('h4'),outcome=document.createElement('span'),stats=document.createElement('p'),details=document.createElement('details'),summary=document.createElement('summary'),build=document.createElement('p'),relics=document.createElement('p'),synergies=document.createElement('p');title.textContent=TG.STAGES[run.stage].name+' · LV '+run.level;outcome.className='journalOutcome'+(run.won?' victory':'');outcome.textContent=run.won?'첫 장 복원':run.reason==='timeout'?'정차 시간 종료':run.reason==='retreat'?'조각을 안고 귀환':'전투 중 쓰러짐';stats.className='journalStats';stats.textContent=fmt(run.totalTime)+' · 격파 '+run.kills+' · 복원 '+run.clearedStages+'/3 · 지급 조각 '+run.reward;summary.textContent='카드 · 유물 · 연계 보기';build.textContent='카드 · '+(TG.CARDS.filter(c=>run.levels[c.id]>0).map(c=>c.name+' '+run.levels[c.id]).join(' / ')||'기본 랜턴');relics.textContent='유물 · '+(run.relics.map(id=>TG.RELICS.find(r=>r.id===id)?.name).filter(Boolean).join(' / ')||'없음');synergies.textContent='연계 · '+(run.synergies.map(id=>TG.SYNERGIES.find(r=>r.id===id)?.name).filter(Boolean).join(' / ')||'아직 완성하지 못한 기억');details.append(summary,build,relics,synergies);const stamp=document.createElement('time');stamp.className='journalDate';stamp.textContent=run.at>0?new Date(run.at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'저장 시각 정보 없음';item.append(outcome,title,stats,details,stamp);history.appendChild(item)}
}
function settings(from){U.returnTo=from;U.show('settings')}
function confirm(title,message,callback){lastFocus=document.activeElement;text('modalTitle',title);text('modalText',message);$('modal').style.display='block';modalAction=callback;$('modalNo').focus()}
function closeModal(){modalAction=null;$('modal').style.display='none';lastFocus?.focus?.()}
$('modalYes').onclick=()=>{const fn=modalAction;closeModal();fn?.()};$('modalNo').onclick=closeModal;
$('modal').addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeModal()}if(e.key==='Tab'){e.preventDefault();(document.activeElement===$('modalNo')?$('modalYes'):$('modalNo')).focus()}});
function start(mode){TG.audio.unlock();try{G.g=null;if(mode==='story')G.startStory();else G.start(mode)}catch(e){notify(e.message)}}
$('menuStory').onclick=openStory;$('hubStory').onclick=openStory;$('storyBack').onclick=()=>{G.g=null;U.show('hub')};$('storySettings').onclick=()=>settings('story');$('storyDeck').onclick=openDeck;$('storyTraining').onclick=startTraining;
$('storyPartySelect').onclick=openParty;$('partyBack').onclick=()=>U.show('story');$('partySave').onclick=()=>{if(TG.story.setParty([...U.partyDraft]))U.show('story');else renderParty()};$('deckBack').onclick=()=>U.show('story');$('deckOwnerFilter').onchange=renderDeck;$('deckProtect').onclick=()=>{U.deckDraft=TG.commandDeck.preset('protect',TG.story.state().companions);renderDeck()};$('deckCounter').onclick=()=>{U.deckDraft=TG.commandDeck.preset('counter',TG.story.state().companions);renderDeck()};$('deckSave').onclick=()=>{if(TG.story.setCommandDeck([...U.deckDraft]))U.show('story');else renderDeck()};$('commandBtn').onclick=()=>{TG.audio.unlock();G.openCommands()};$('commandsClose').onclick=()=>{TG.audio.unlock();if(!G.closeCommands())renderCommands()};$('commandsSettings').onclick=()=>settings('commands');$('resultSettings').onclick=()=>settings('ended');
$('enterHub').onclick=()=>{TG.audio.unlock();U.show('hub')};$('chapterStart').onclick=()=>start('chapter');$('quickStart').onclick=()=>start('quick');$('singleStart').onclick=()=>start('single');$('continueRun').onclick=()=>{TG.audio.unlock();G.continue()};$('abandonRun').onclick=()=>confirm('이번 탐험을 마칠까요?','진행 중 탐험을 정산하고 열차로 돌아갑니다. 모은 조각의 절반을 보관하며 이 탐험의 이어하기는 종료됩니다.',()=>{G.g=null;G.abandon();U.show('hub')});$('hubMenu').onclick=()=>U.show('menu');$('pauseBtn').onclick=()=>G.pause();$('resumeBtn').onclick=()=>{TG.audio.unlock();G.resume()};$('quitBtn').onclick=()=>confirm(G.g?.storyTraining?'지휘 연습을 마칠까요?':'열차로 귀환할까요?',G.g?.storyTraining?'이번 연습을 종료하고 열차로 돌아갑니다. 저장된 이야기 진행·지휘 덱·기억 조각은 그대로입니다.':G.g?.mode==='story'?'이야기를 중단하고 현재 전투 시작 상태로 돌아갑니다. 이미 읽은 대사와 동료 합류는 유지됩니다.':'이번 탐험을 종료하고 모은 조각의 절반을 보관합니다. 현재 역은 이어갈 수 없습니다.',()=>G.abandon());$('campHub').onclick=()=>{if(!S.snapshot(G.g,'camp')){renderCamp();return;}G.g=null;U.show('hub')};$('campSettings').onclick=()=>settings('camp');$('nextStage').onclick=()=>{TG.audio.unlock();G.nextStage()};$('backBtn').onclick=()=>{if(G.g?.mode==='story'){if(G.g.won&&!G.g.storySaved&&!G.saveStoryResult()){renderResult();return;}G.g=null;U.show('story');return;}G.g=null;U.show('hub')};$('retryBtn').onclick=()=>{if(G.g?.storyTraining)startTraining();else start(G.g?.mode||'chapter')};$('openArchive').onclick=()=>U.show('archive');$('archiveBack').onclick=()=>U.show('hub');$('openJournal').onclick=()=>{U.journalFrom='hub';U.show('journal')};$('resultJournal').onclick=()=>{U.journalFrom='ended';U.show('journal')};$('journalBack').onclick=()=>U.show(U.journalFrom||'hub');$('menuSettings').onclick=()=>settings('menu');$('hubSettings').onclick=()=>settings('hub');$('pauseSettings').onclick=()=>settings('paused');$('settingsBack').onclick=()=>U.show(U.returnTo);$('menuAbout').onclick=()=>U.show('about');$('aboutBack').onclick=()=>U.show('menu');
for(const [id,key]of [['bgmVolume','bgm'],['sfxVolume','sfx']])$(id).oninput=()=>{S.data.settings[key]=Number($(id).value)/100;TG.audio.unlock();TG.audio.sync();text(key+'Value',$(id).value+'%');S.save()};$('reduceFX').onchange=()=>{S.data.settings.reduceFX=$('reduceFX').checked;S.save()};$('quality').onchange=()=>{S.data.settings.quality=$('quality').value;S.save();TG.view.resize()};
$('exportSave').onclick=()=>{const data=S.export();$('backupText').value=data;$('backupText').hidden=false;const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='terminus-girl-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);text('backupNote','파일을 저장하기 어렵다면 위 백업 내용을 길게 눌러 복사해 보관하세요.')};
$('importFile').onchange=async()=>{const file=$('importFile').files?.[0];if(!file)return;if(file.size>256000){text('importNote','256KB보다 작은 게임 백업만 불러올 수 있습니다.');return}try{const content=await file.text(),preview=S.preview(content);confirm('백업으로 기록을 복원할까요?',`기억 조각 ${preview.wallet}개 · 탐험 ${preview.stats.runs}회 · 기억 ${preview.memories.length}개\n현재 기록과 진행 중 탐험이 이 백업으로 바뀝니다. 먼저 현재 백업을 내보내는 것을 권장합니다.`,()=>{try{S.import(content)}catch(e){renderSettings();text('importNote',e.message);return;}G.g=null;U.returnTo='hub';TG.audio.sync();renderSettings();text('importNote',S.status!=='ready'?'백업을 불러왔지만 기기에 저장하지 못했습니다. 백업 파일을 보관하고 저장소 설정을 확인해 주세요.':'백업을 복원했습니다. 열차에서 확인해 주세요.');TG.view.resize()})}catch(e){text('importNote',e.message)}finally{$('importFile').value=''}};
function hud(){const g=G.g;if(!g||U.screen!=='playing')return;const p=g.p;const remaining=Math.max(0,Math.ceil(g.duration-g.time));text('timer',`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`);text('timerCaption',g.storyTraining?'연습 종료까지':g.storyBattle==='velaEscort'?'구조 제한시간':g.mode==='story'?'임무 제한시간':'역 소거까지');text('stageLabel',g.storyTraining?'거울역 · 합동 지휘 연습':g.mode==='story'?TG.STORY.battles[g.storyBattle].title:TG.STAGES[g.stage].name+' — 리제');$('partyHud').hidden=!(g.mare||g.allies?.length);
 if(g.mare||g.allies?.length){
  const ids=g.party||['mare'],minis=$('partyMiniList'),key=ids.join(',');
  if(minis.dataset.key!==key){
   minis.dataset.key=key;minis.replaceChildren();
   for(const id of ids){const icon=document.createElement('span');icon.className='partyMiniIcon char-'+id;icon.setAttribute('title',commandOwner[id]||id);minis.appendChild(icon);}
  }
  const available=(g.allies||[]).filter(a=>a.cooldown<=0).length;
  text('partyHudTitle',ids.length>1?'동료 '+ids.length+'명 · 합동 지원':'마레 · 보호 지원');
  text('partyStatus',(g.mare?'마레 보호 '+(g.mare.cooldown>0?g.mare.cooldown.toFixed(1)+'초':'준비'):'')+(g.allies?.length?' · 지원 '+available+'/'+g.allies.length+' 준비':''));
  $('partyHud').classList.toggle('guarding',!!g.mare&&g.mare.pulse>0||!!g.allies?.some(a=>a.pulse>0));
 }if(g.commands){text('commandEnergy',g.commands.energy+' / 3');$('commandBtn').setAttribute('aria-label','전술 지휘 · 지휘력 '+g.commands.energy+' / 3');}text('phaseLabel',g.storyTraining?'지휘 연습 · 보상 없음':g.mode==='story'?'이야기 시범 · 리제 + '+(g.party?.length||0)+'명':g.mode==='chapter'?`역 0${g.stage+1} / 03 · 복원 ${G.objective(g).cleared}/3`:'전투 연습 · 보상 없음');text('healthLabel',`HP ${Math.ceil(p.hp)} / ${p.maxHp}${p.shield?' · 보호막 '+p.shield:''}`);$('hud').classList.toggle('critical',p.hp/p.maxHp<=.30);text('levelLabel','LV '+g.level);text('killed',g.mode==='story'?`격파 ${g.kills} · 기억 LV ${g.level}`:`격파 ${g.kills} · 조각 ${g.shards}`);$('hpFill').style.width=100*p.hp/p.maxHp+'%';$('xpFill').style.width=Math.min(100,100*g.xp/g.xpNeed)+'%';$('eraseFill').style.width=g.erase+'%';text('eraseLabel','소거 위험 '+Math.floor(g.erase)+'%');const o=G.objective(g);text('goalLabel',o.kind==='prepare'?'관리자 도착 '+fmt(Math.ceil(o.bossIn))+' · 성장 준비':o.title);$('goalLabel').title=o.detail;text('synergyText',[g.commandEffects?.guardWindow>0?'보호 연계 '+g.commandEffects.guardWindow.toFixed(1)+'초':'',g.commandEffects?.ward>0?'보호 장막 '+g.commandEffects.ward.toFixed(1)+'초':'',g.overcharge>0?'✦ 랜턴 과충전 '+g.overcharge.toFixed(1)+'초':g.chain>0?'공명 '+g.chain+'/8 · '+g.chainTime.toFixed(1)+'초 안에 다음 격파':'',...TG.SYNERGIES.filter(s=>g.synergies[s.id]).map(s=>s.name)].filter(Boolean).join(' · '));const rem=g.dash.cooldown,label=rem>0?rem.toFixed(1)+'초':'대시';if($('dashBtn').dataset.state!==label){$('dashBtn').dataset.state=label;$('dashBtn').replaceChildren(document.createTextNode('✦'),document.createElement('br'),document.createTextNode(label));$('dashBtn').classList.toggle('cooling',rem>0);$('dashBtn').setAttribute('aria-label','시간 대시 · '+(rem>0?label+' 후 사용 가능':'준비 완료'));}if(g.toast?.life>0){text('toast',g.toast.text);$('toast').classList.add('active')}else $('toast').classList.remove('active');const guide=guideMessage(g);$('guide').style.display=guide?'block':'none';text('guide',guide);const boss=g.enemies.find(e=>e.type==='boss'&&e.hp>0);
 $('bossHud').hidden=!boss;
 if(boss){
  const percent=Math.max(0,Math.min(100,Math.ceil(100*boss.hp/boss.maxHp)));
  text('bossName',TG.STAGES[g.stage].boss+(boss.bossPhase===2?' · 2단계':''));
  text('bossStatus',boss.action==='windup'?(g.stage===1&&boss.attackVariant==='diagonal'?'대각선 공격 예고 · 회피 준비':g.stage===0&&boss.attackPhase===2?'충격파 후 잔진동 주의':'공격 예고 · 회피 준비'):boss.action==='recover'?'반격 기회':boss.bossPhase===2?'2단계 · 강화된 공격 주의':'관리자 교전');
  $('bossHud').classList.toggle('warning',boss.action==='windup');
  $('bossHpFill').style.width=percent+'%';
  $('bossTrack').setAttribute('aria-valuenow',String(percent));
 }
 TG.audio.scene(g.bossSpawned?'boss':TG.STAGES[g.stage].id);
}
U.refreshHud=hud;
function canApplyUpdate(){if(G.g?.mode==='story'&&G.g.won&&!G.g.storySaved)return false;return ['menu','hub','settings','about','archive','ended','journal','story'].includes(U.screen)&&(!G.g||G.g.status==='ended');}
function updateNotice(){
 if(!registration?.waiting||registration.waiting===dismissedWorker)return;
 $('updateBanner').style.display='block';const canUpdate=canApplyUpdate();text('updateText',canUpdate?'새로운 열차 기록이 준비됐습니다.':'새 버전이 준비됐습니다. 탐험 후 열차에서 업데이트하세요.');$('applyUpdate').hidden=!canUpdate;}
$('applyUpdate').onclick=()=>{
 if(!registration?.waiting||!canApplyUpdate())return;
 updating=true;registration.waiting.postMessage({type:'SKIP_WAITING'});
};
$('dismissUpdate').onclick=()=>{
 dismissedWorker=registration?.waiting||null;
 $('updateBanner').style.display='none';
};
function checkUpdates(){
 if(!registration||document.hidden||Date.now()-lastUpdateCheck<60000)return;
 lastUpdateCheck=Date.now();
 registration.update?.().catch(()=>{});
}
addEventListener('pageshow',checkUpdates);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkUpdates()});
async function offline(){if(!('serviceWorker'in navigator)||!window.isSecureContext)return;try{registration=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});lastUpdateCheck=Date.now();updateNotice();registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){if(navigator.serviceWorker.controller)updateNotice();else{text('updateText','오프라인 준비가 완료되었습니다. 홈 화면에 추가해도 좋아요.');$('updateBanner').style.display='block'}}})});navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updating)location.reload()});}catch{notify('오프라인 준비를 마치지 못했습니다. 인터넷 연결 상태에서 다시 열어 주세요.')}}
TG.view.init($('field'));TG.input.init();addEventListener('resize',TG.view.resize);window.visualViewport?.addEventListener?.('resize',TG.view.resize);TG.audio.scene('hub');text('buildVersion',TG.VERSION+' · 파티 지휘 덱 / 생존 탐험');U.show('menu');
function loop(now){const delta=last?Math.min(.04,(now-last)/1000):0;last=now;if(G.g?.status==='playing'){TG.input.poll();G.update(delta);hudClock+=delta;if(hudClock>.08){hud();hudClock=0}}if(G.g?.status==='playing'||now-lastDraw>100){TG.view.draw(now);lastDraw=now}requestAnimationFrame(loop)}requestAnimationFrame(loop);offline();
})();
