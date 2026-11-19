'use strict';
window.TG=window.TG||{};
TG.VERSION='0.26.0-opening1';
TG.CARDS=[
{id:'blade',icon:'✧',name:'시간 절단',desc:'칼날 피해 +25% · 공격 간격 -6%',cap:6},
{id:'pierce',icon:'↟',name:'관통하는 기억',desc:'칼날 관통 +1',cap:3},
{id:'echo',icon:'◈',name:'잔향의 분열',desc:'부가 칼날 +1 · 부가 칼날 피해 70%',cap:4},
{id:'shield',icon:'◇',name:'푸른 수호',desc:'보호막 +1 · 18초마다 재충전',cap:3},
{id:'speed',icon:'ϟ',name:'기관 가속',desc:'이동 속도 +10% · 체력 8 회복',cap:4},
{id:'magnet',icon:'✦',name:'기억의 인력',desc:'획득 범위 +30% · 최대 체력 +10',cap:4},
{id:'orbit',icon:'◷',name:'시계의 파편',desc:'회전하는 파편 +1',cap:4},
{id:'frost',icon:'❄',name:'정지된 초침',desc:'칼날 적중 시 1.5초간 둔화',cap:3},
{id:'lantern',icon:'☼',name:'꺼지지 않는 불',desc:'랜턴 충격파 · 단계마다 피해 증가',cap:4},
{id:'focus',icon:'⌖',name:'차장의 조준',desc:'치명타 확률 +8% · 치명타 피해 170%',cap:4},
{id:'vital',icon:'♡',name:'온기의 맥박',desc:'최대 체력 +20 · 체력 20 회복',cap:4},
{id:'mend',icon:'♧',name:'귀환의 약속',desc:'10초마다 체력 2 회복',cap:3},
{id:'clock',icon:'◴',name:'되감는 시계',desc:'대시 재사용 시간 -0.3초',cap:4},
{id:'ember',icon:'♨',name:'남겨진 불씨',desc:'칼날 적중 시 2초간 화상',cap:3},
{id:'ward',icon:'⌘',name:'오래된 승차권',desc:'받는 피해 7% 감소',cap:4},
{id:'wisdom',icon:'✎',name:'기억의 해독',desc:'획득 경험치 +15%',cap:4}
];
TG.SYNERGIES=[
{id:'echoBlade',name:'잔향 절단',needs:{blade:2,echo:1},desc:'중앙 칼날 피해 +30% · 첫 적중 시 주변 2명에게 35% 연쇄 피해'},
{id:'frostOrbit',name:'빙결 시계',needs:{frost:1,orbit:1},desc:'파편 둔화 · 둔화 적 피해 +30% · 일반 적을 3초마다 0.45초 빙결'},
{id:'emberLantern',name:'불멸의 랜턴',needs:{ember:1,lantern:2},desc:'랜턴 충격파가 화상 부여 · 2초간 초당 피해 6의 잔불 생성'},
{id:'safeDash',name:'푸른 귀환',needs:{shield:1,clock:2},desc:'대시 종료 때 가까운 적을 밀쳐내고 반경 110의 적 탄환 제거'},
{id:'starCompass',name:'별의 나침반',needs:{magnet:2,wisdom:1},desc:'기억 획득 범위 추가 +50%'},
{id:'warmHeart',name:'설원의 온기',needs:{vital:1,mend:2},desc:'재생량 2배 · 받는 피해 추가 10% 감소'}
];
TG.BOSS_REWARDS=[
{id:'insight',name:'이어지는 기억',icon:'✧',desc:'다음 역에서 카드 1장 추가 선택',card:1},
{id:'shelter',name:'등불 아래의 쉼',icon:'♡',desc:'체력 30 회복 · 소거율 12 감소',heal:30,erase:-12},
{id:'spoils',name:'관리자의 유산',icon:'◈',desc:'탐험 기억 조각 +24 · 귀환 시 정산',shards:24}
];
TG.RELICS=[
{id:'bell',name:'작은 귀환종',desc:'첫 보호막 1개를 얻는다',icon:'♧'},
{id:'compass',name:'은빛 나침반',desc:'기억 획득 범위 +40',icon:'✦'},
{id:'watch',name:'멈춘 회중시계',desc:'대시 재사용 -0.3초',icon:'◷'},
{id:'wick',name:'마레의 심지',desc:'랜턴 충격파 피해 +35%',icon:'☼'},
{id:'ticket',name:'찢어진 왕복표',desc:'역 이동 시 체력 20 추가 회복',icon:'⌘'},
{id:'lens',name:'거울 렌즈',desc:'치명타 확률 +10%',icon:'◇'}
];
TG.STAGES=[
{id:'mirror',name:'거울 유리역',sub:'거울에 비친 시간은 한 박자 늦다',boss:'거울 감시자',bossKind:0,duration:270,color:'#8db8db',enemies:['ghost','hound'],intro:'리제는 정차 기록에 없는 승강장에 내렸다. 거울 속 랜턴만 홀로 흔들리고 있었다.',clear:'거울의 금이 걷히자, 오래된 왕복표에 이름 하나가 떠올랐다. 마레. 누군가는 이 역에서 리제를 기다렸다.'},
{id:'snow',name:'침묵의 설원역',sub:'종소리가 사라진 눈의 승강장',boss:'침묵의 종지기',bossKind:1,duration:270,color:'#b9dce8',enemies:['passenger','wolf'],intro:'차창 너머, 소리 없는 눈이 쌓인다. 마레의 목소리가 낡은 안내 장치에서 새어 나왔다. “랜턴을 내려놓지 마.”',clear:'멈췄던 종이 울렸다. 리제는 깨닫는다. 이 열차는 버려진 기억을 싣는 마지막 피난처였다.'},
{id:'terminus',name:'종착 승강장',sub:'끝을 지우는 마지막 차장',boss:'종착의 기록관',bossKind:2,duration:300,color:'#d5b889',enemies:['conductor','lost'],intro:'마지막 선로에서 리제는 자기 이름이 적힌 소거 명령서를 발견했다. 기억을 버려야만 달리던 열차. 오늘은 다른 길을 선택한다.',clear:'리제는 소거 명령서 대신 빈 승차권을 내밀었다. “돌아갈 곳이 없는 기억도, 여기 타면 돼.” 꺼질 듯하던 랜턴 옆에 작은 불빛 하나가 켜졌다.'}
];
TG.EVENTS=[
{id:'bench',title:'눈 위의 긴 의자',text:'아직 온기가 남은 자리와 작은 조각 주머니가 있다.',choices:[{label:'잠시 쉬어 간다',desc:'체력 35 회복',heal:35},{label:'남겨진 조각을 챙긴다',desc:'탐험 기억 조각 +16',shards:16}]},
{id:'radio',title:'끊어진 안내 방송',text:'마레의 목소리가 잡음 사이로 들린다. “어느 쪽을 기억할래?”',choices:[{label:'돌아가는 길',desc:'소거율 15 감소',erase:-15},{label:'아직 오지 않은 시간',desc:'다음 역에서 카드 1장 추가 선택',card:1}]},
{id:'luggage',title:'주인 없는 여행 가방',text:'열차 문 옆에 낡은 가방이 놓여 있다.',choices:[{label:'조심스럽게 열어 본다',desc:'무작위 미보유 유물 1개',relic:true},{label:'주인을 기다리며 남겨 둔다',desc:'체력 20 회복 · 탐험 기억 조각 +8',heal:20,shards:8}]},
{id:'mirror',title:'이름을 묻는 거울',text:'거울은 얼굴 대신 지워진 이름을 비춘다.',choices:[{label:'내 이름을 말한다',desc:'체력 15 소모 · 카드 1장 추가 선택',damage:15,card:1},{label:'마레의 이름을 부른다',desc:'소거율 12 감소 · 체력 10 회복',erase:-12,heal:10}]},
{id:'signal',title:'마지막 신호등',text:'멈춘 신호등 아래 낡은 표가 빛난다.',choices:[{label:'푸른 불을 기다린다',desc:'체력 25 회복 · 소거율 8 감소',heal:25,erase:-8},{label:'신호의 기억을 되찾는다',desc:'탐험 기억 조각 +20',shards:20}]},
{id:'letter',title:'보내지 못한 편지',text:'“이 기차가 멈추면, 함께 내려 줄래?” 발신인은 지워져 있다.',choices:[{label:'편지를 품에 넣는다',desc:'무작위 미보유 유물 1개',relic:true},{label:'편지를 소리 내어 읽는다',desc:'체력 30 회복 · 다음 역 소거율 10 감소',heal:30,erase:-10}]}
];
TG.MEMORIES=[
{id:'arrival',title:'기록 01 · 정차하지 않는 역',text:'리제의 주머니에는 목적지가 없는 승차권이 한 장 남아 있었다. 열차는 기억이 있는 곳에서만 멈춘다.'},
{id:'mirror',title:'기록 02 · 이름이 남은 표',text:'왕복표의 뒷면에 마레의 이름이 남아 있었다. 돌아올 사람을 위해 남겨 둔 한 자리.'},
{id:'snow',title:'기록 03 · 소리 없는 눈',text:'설원에서는 이름을 부르는 소리도 지워졌다. 마레는 종소리에 서로의 이름을 묶어 두었다.'},
{id:'bell',title:'기록 04 · 기억을 싣는 열차',text:'열차는 버려진 기억을 싣고 달렸다. 리제는 잊는 사람이 아니라, 끝까지 기억하는 차장이었다.'},
{id:'order',title:'기록 05 · 소거 명령서',text:'리제의 이름이 적힌 명령서는 오래된 자신의 선택이었다. 아픈 기억을 지우려던 손이 열차를 움직였던 것이다.'},
{id:'ending',title:'기록 06 · 두 개의 불빛',text:'마레의 기억은 랜턴의 심지에 남아 있었다. 사라지지 않기 위해서가 아니라, 리제가 다시 누군가를 맞이할 때까지.'}
];
TG.UPGRADES=[
{id:'heart',name:'객실의 온기',desc:'시작 최대 체력 +8',base:22,cap:5},
{id:'lamp',name:'랜턴 정비',desc:'기본 공격력 +5%',base:25,cap:5},
{id:'map',name:'기억의 노선도',desc:'시작 획득 범위 +12',base:18,cap:5}
];
TG.ENEMY_DEFS={ghost:{hp:28,speed:62,r:14,art:0,behavior:'chase'},hound:{hp:24,speed:94,r:12,art:1,behavior:'charge'},passenger:{hp:43,speed:65,r:15,art:3,behavior:'ranged'},wolf:{hp:36,speed:105,r:13,art:4,behavior:'charge'},conductor:{hp:58,speed:70,r:16,art:6,behavior:'chase'},lost:{hp:42,speed:64,r:15,art:7,behavior:'ranged'},warden:{hp:135,speed:52,r:21,art:9,behavior:'charge',elite:true},witch:{hp:110,speed:58,r:19,art:10,behavior:'ranged',elite:true}};

TG.CHALLENGES=[
{id:'firstReturn',name:'첫 귀환',desc:'첫 번째 장 탐험을 한 번 정산하세요.',icon:'◷',target:1},
{id:'mirrorClear',name:'거울 너머로',desc:'거울 유리역을 복원하세요.',icon:'◇',target:1},
{id:'dualSynergy',name:'겹쳐진 기억',desc:'한 탐험에서 시너지 2개를 완성한 채 귀환하세요.',icon:'◈',target:2},
{id:'relicCollector',name:'잃어버린 짐의 주인',desc:'한 탐험에서 유물 3개를 모은 채 귀환하세요.',icon:'⌘',target:3},
{id:'hundredKills',name:'백 개의 잔향',desc:'한 탐험에서 적 100명을 격파하세요.',icon:'✧',target:100},
{id:'chapterClear',name:'두 개의 불빛',desc:'첫 번째 장을 끝까지 복원하세요.',icon:'✦',target:1}
];
