'use strict';
(()=>{
const definitions=[
 ['rize_pulse','rize','복원의 파동',1,'주변 155 안의 적에게 공격력 150% 피해. 마레나 보호막으로 피해를 막은 직후 위력 50% 증가.'],
 ['rize_cut','rize','차장의 절단',2,'450 안의 가장 가까운 적에게 공격력 240% 피해. 마레나 보호막으로 피해를 막은 직후 위력 50% 증가.'],
 ['rize_frost','rize','유리 서리',1,'주변 180 안의 적을 0.7초 빙결. 관리자는 0.8초 둔화.'],
 ['rize_flame','rize','남겨진 등불',1,'현재 위치에 반경 95의 등불을 3초 설치해 초당 6 피해. 최대 3개.'],
 ['mare_guard','mare','마레의 방패',1,'피해를 한 번 막는 보호막 1개 획득. 최대 3개.'],
 ['mare_shelter','mare','함께 선 자리',2,'4초 동안 보호막 이후에 받는 체력 피해를 절반으로 감소.'],
 ['mare_counter','mare','보호의 반격',2,'보호 직후 사용. 주변 180 안의 적에게 공격력 220% 피해를 주고 적탄 제거.'],
 ['mare_rally','mare','다시 일어서',1,'체력 최대 12 회복. 마레의 자동 보호 대기시간 6초 감소.'],
 ['shared_magnet','shared','기억 회수',1,'주변 300 안에 남아 있는 경험치 기억을 즉시 회수.'],
 ['shared_heal','shared','여행자의 약',1,'체력을 최대 18 회복.'],
 ['shared_push','shared','통로 확보',1,'주변 160 안의 적을 90 밀어내고 110 안의 적탄 제거.'],
 ['shared_dash','shared','비상 운행',1,'대시 대기시간을 즉시 초기화.']
];
const cards=TG.COMMANDS=Object.freeze(definitions.map(([id,owner,name,cost,desc])=>Object.freeze({id,owner,name,cost,desc})));
const byId=new Map(cards.map(card=>[card.id,card])),hasMare=companions=>Array.isArray(companions)&&companions.includes('mare');
const D=TG.commandDeck={};
D.available=companions=>cards.filter(card=>card.owner!=='mare'||hasMare(companions));
D.validate=function(ids,companions){
 if(!Array.isArray(ids)||ids.length!==8||new Set(ids).size!==8)return false;
 const allowed=new Set(D.available(companions).map(card=>card.id));
 if(ids.some(id=>!allowed.has(id)))return false;
 const owners=ids.map(id=>byId.get(id).owner);
 return owners.filter(owner=>owner==='rize').length>=2&&(hasMare(companions)?owners.filter(owner=>owner==='mare').length>=2:!owners.includes('mare'));
};
D.preset=function(kind='protect',companions=[]){
 if(!hasMare(companions)||kind==='solo')return cards.filter(card=>card.owner!=='mare').map(card=>card.id);
 if(kind==='counter')return ['rize_pulse','rize_cut','rize_frost','mare_guard','mare_counter','shared_push','shared_magnet','shared_dash'];
 return ['rize_pulse','rize_flame','mare_guard','mare_shelter','mare_counter','mare_rally','shared_heal','shared_magnet'];
};
D.normalize=(ids,companions)=>D.validate(ids,companions)?[...ids]:D.preset('protect',companions);
D.seedFor=function(id){let hash=2166136261;for(const char of String(id))hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;return hash||0x9e3779b9;};
// This RNG belongs to the command deck. Enemy/particle randomness cannot change a hand.
function next(runtime){let x=runtime.seed;x^=x<<13;x^=x>>>17;x^=x<<5;runtime.seed=x>>>0;return runtime.seed/4294967296;}
function shuffle(values,runtime){for(let i=values.length-1;i>0;i--){const j=Math.floor(next(runtime)*(i+1));[values[i],values[j]]=[values[j],values[i]];}return values;}
D.create=function(ids,seed){
 if(!Array.isArray(ids)||ids.length!==8||new Set(ids).size!==8||ids.some(id=>!byId.has(id)))throw Error('유효한 8장 지휘 덱이 필요합니다.');
 const runtime={deck:[...ids],draw:[...ids],hand:[],discard:[],energy:3,regen:0,seed:(Number.isFinite(seed)?seed>>>0:0)||0x9e3779b9,casts:0,token:0};
 shuffle(runtime.draw,runtime);for(let i=0;i<3;i++)runtime.hand.push(runtime.draw.pop());return runtime;
};
D.spend=function(runtime,id){
 const card=byId.get(id),slot=runtime?.hand?.indexOf(id);
 if(!card||!Number.isInteger(slot)||slot<0||runtime.energy<card.cost)return false;
 runtime.energy-=card.cost;runtime.discard.push(id);
 if(!runtime.draw.length){runtime.draw=shuffle(runtime.discard,runtime);runtime.discard=[];}
 runtime.hand[slot]=runtime.draw.pop();runtime.casts++;runtime.token++;return true;
};
D.tick=function(runtime,dt){
 if(!runtime||!Number.isFinite(dt)||dt<=0)return;
 if(runtime.energy>=3){runtime.energy=3;runtime.regen=0;return;}
 runtime.regen+=dt;
 while(runtime.regen+1e-9>=12&&runtime.energy<3){runtime.regen=Math.max(0,runtime.regen-12);runtime.energy++;}
 if(runtime.energy>=3)runtime.regen=0;
};
})();
