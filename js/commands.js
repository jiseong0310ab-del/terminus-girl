'use strict';
(() => {
  const definitions = [
    [
      'rize_pulse',
      'rize',
      '복원의 파동',
      1,
      '주변 155 안의 적에게 공격력 150% 피해. 마레나 보호막으로 피해를 막은 직후 위력 50% 증가.'
    ],
    [
      'rize_cut',
      'rize',
      '차장의 절단',
      2,
      '450 안의 가장 가까운 적에게 공격력 240% 피해. 마레나 보호막으로 피해를 막은 직후 위력 50% 증가.'
    ],
    ['rize_frost', 'rize', '유리 서리', 1, '주변 180 안의 적을 0.7초 빙결. 관리자는 0.8초 둔화.'],
    [
      'rize_flame',
      'rize',
      '남겨진 등불',
      1,
      '현재 위치에 반경 95의 등불을 3초 설치해 초당 6 피해. 최대 3개.'
    ],
    ['mare_guard', 'mare', '마레의 방패', 1, '피해를 한 번 막는 보호막 1개 획득. 최대 3개.'],
    ['mare_shelter', 'mare', '함께 선 자리', 2, '4초 동안 보호막 이후에 받는 체력 피해를 절반으로 감소.'],
    [
      'mare_counter',
      'mare',
      '보호의 반격',
      2,
      '보호 직후 사용. 주변 180 안의 적에게 공격력 220% 피해를 주고 적탄 제거.'
    ],
    ['mare_rally', 'mare', '다시 일어서', 1, '체력 최대 12 회복. 마레의 자동 보호 대기시간 6초 감소.'],
    ['shared_magnet', 'shared', '기억 회수', 1, '주변 300 안에 남아 있는 경험치 기억을 즉시 회수.'],
    ['shared_heal', 'shared', '여행자의 약', 1, '체력을 최대 18 회복.'],
    ['shared_push', 'shared', '통로 확보', 1, '주변 160 안의 적을 90 밀어내고 110 안의 적탄 제거.'],
    ['shared_dash', 'shared', '비상 운행', 1, '대시 대기시간을 즉시 초기화.']
  ];
  TG.PARTY = Object.freeze(
    [
      { id: 'mare', name: '마레', role: '수호', color: '#9ccedb', desc: '피해 차단 · 반격', trial: true },
      {
        id: 'aster',
        name: '아스터',
        role: '기록',
        color: '#d6b77d',
        desc: '단서 조사 · 표식 공격',
        trial: true
      },
      {
        id: 'noa',
        name: '노아',
        role: '신호',
        color: '#8bc4b6',
        desc: '투사체 제거 · 통로 확보',
        trial: true
      },
      { id: 'vela', name: '벨라', role: '의무', color: '#d6a8c5', desc: '회복 · 지원', trial: true },
      { id: 'iris', name: '이리스', role: '추적', color: '#abc8ee', desc: '빙결 · 적 추적', trial: false },
      {
        id: 'crow',
        name: '크로우',
        role: '침식',
        color: '#c9a0b3',
        desc: '침식 화염 · 고위력 공격',
        trial: false
      }
    ].map(x => Object.freeze(x))
  );
  const extra = [
    ['aster_mark', 'aster', '지워진 표식', 1, '가까운 적에게 공격력 180% 피해', 'strike'],
    ['aster_collect', 'aster', '증언 수집', 1, '주변 경험치 기억 회수', 'magnet'],
    ['aster_frost', 'aster', '기록의 정지', 1, '근처 적 빙결·둔화', 'freeze'],
    ['aster_burst', 'aster', '조사의 결론', 2, '주변 공격력 130% 피해', 'burst'],
    ['noa_pulse', 'noa', '신호 개방', 1, '적 밀어내기 · 적탄 제거', 'push'],
    ['noa_clear', 'noa', '푸른 신호', 1, '주변 적탄 제거', 'clear'],
    ['noa_dash', 'noa', '급행 허가', 1, '대시 대기 초기화', 'dash'],
    ['noa_burst', 'noa', '선로 공명', 2, '주변 공격력 130% 피해', 'burst'],
    ['vela_heal', 'vela', '온기 처치', 1, '체력 최대 20 회복', 'heal'],
    ['vela_guard', 'vela', '의무실 방패', 1, '보호막 1개 획득', 'guard'],
    ['vela_ward', 'vela', '응급 차단막', 2, '4초간 체력 피해 50% 감소', 'ward'],
    ['vela_collect', 'vela', '안전한 회수', 1, '주변 경험치 회수', 'magnet'],
    ['iris_strike', 'iris', '추적의 일격', 1, '가까운 적 공격력 180% 피해', 'strike'],
    ['iris_frost', 'iris', '빙설의 숨', 1, '주변 빙결·둔화', 'freeze'],
    ['iris_burst', 'iris', '눈꽃 파열', 2, '주변 공격력 130% 피해', 'burst'],
    ['iris_dash', 'iris', '눈길 통과', 1, '대시 대기 초기화', 'dash'],
    ['crow_strike', 'crow', '어둠의 눈금', 1, '가까운 적 공격력 180% 피해', 'strike'],
    ['crow_flame', 'crow', '지워진 등불', 1, '3초 피해 등불 설치', 'flame'],
    ['crow_burst', 'crow', '침식의 파동', 2, '주변 공격력 130% 피해', 'burst'],
    ['crow_ward', 'crow', '검은 차단막', 2, '4초간 체력 피해 50% 감소', 'ward']
  ];
  const cards = (TG.COMMANDS = Object.freeze([
    ...definitions.map(([id, owner, name, cost, desc]) => Object.freeze({ id, owner, name, cost, desc })),
    ...extra.map(([id, owner, name, cost, desc, action]) =>
      Object.freeze({ id, owner, name, cost, desc, action })
    )
  ]));
  const byId = new Map(cards.map(card => [card.id, card])),
    hasMare = companions => Array.isArray(companions) && companions.includes('mare');
  const D = (TG.commandDeck = {});
  D.available = companions =>
    cards.filter(card => ['rize', 'shared'].includes(card.owner) || (companions || []).includes(card.owner));
  D.size = companions => ((companions || []).length >= 2 ? 10 : 8);
  D.validate = function (ids, companions) {
    if (!Array.isArray(ids) || ids.length !== D.size(companions) || new Set(ids).size !== ids.length)
      return false;
    const allowed = new Set(D.available(companions).map(card => card.id));
    if (ids.some(id => !allowed.has(id))) return false;
    const owners = ids.map(id => byId.get(id).owner);
    if (owners.filter(owner => owner === 'rize').length < 2) return false;
    if ((companions || []).length >= 2) return companions.every(id => owners.includes(id));
    return hasMare(companions)
      ? owners.filter(owner => owner === 'mare').length >= 2
      : owners.every(x => x === 'rize' || x === 'shared');
  };
  D.preset = function (kind = 'protect', companions = []) {
    if ((companions || []).length >= 2) {
      const available = D.available(companions).map(c => c.id),
        prefer =
          kind === 'counter'
            ? ['rize_cut', 'rize_frost', 'mare_counter', 'shared_push', 'shared_dash']
            : ['rize_pulse', 'rize_flame', 'mare_guard', 'shared_heal', 'shared_magnet'];
      const list = prefer.filter(x => available.includes(x));
      for (const id of companions) {
        const c = available.find(x => byId.get(x).owner === id && !list.includes(x));
        if (c) list.push(c);
      }
      for (const id of ['rize_pulse', 'rize_cut', ...available])
        if (available.includes(id) && !list.includes(id) && list.length < 10) list.push(id);
      return list.slice(0, 10);
    }
    if (!hasMare(companions) || kind === 'solo')
      return cards.filter(card => card.owner === 'rize' || card.owner === 'shared').map(card => card.id);
    if (kind === 'counter')
      return [
        'rize_pulse',
        'rize_cut',
        'rize_frost',
        'mare_guard',
        'mare_counter',
        'shared_push',
        'shared_magnet',
        'shared_dash'
      ];
    return [
      'rize_pulse',
      'rize_flame',
      'mare_guard',
      'mare_shelter',
      'mare_counter',
      'mare_rally',
      'shared_heal',
      'shared_magnet'
    ];
  };
  D.normalize = (ids, companions) =>
    D.validate(ids, companions) ? [...ids] : D.preset('protect', companions);
  D.seedFor = function (id) {
    let hash = 2166136261;
    for (const char of String(id)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    return hash || 0x9e3779b9;
  };
  // This RNG belongs to the command deck. Enemy/particle randomness cannot change a hand.
  function next(runtime) {
    let x = runtime.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    runtime.seed = x >>> 0;
    return runtime.seed / 4294967296;
  }
  function shuffle(values, runtime) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(next(runtime) * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }
  D.create = function (ids, seed) {
    if (
      !Array.isArray(ids) ||
      ![8, 10].includes(ids.length) ||
      new Set(ids).size !== ids.length ||
      ids.some(id => !byId.has(id))
    )
      throw Error('유효한 8장 지휘 덱이 필요합니다.');
    const runtime = {
      deck: [...ids],
      draw: [...ids],
      hand: [],
      discard: [],
      energy: 3,
      regen: 0,
      seed: (Number.isFinite(seed) ? seed >>> 0 : 0) || 0x9e3779b9,
      casts: 0,
      token: 0
    };
    shuffle(runtime.draw, runtime);
    for (let i = 0; i < (ids.length === 10 ? 4 : 3); i++) runtime.hand.push(runtime.draw.pop());
    return runtime;
  };
  D.spend = function (runtime, id) {
    const card = byId.get(id),
      slot = runtime?.hand?.indexOf(id);
    if (!card || !Number.isInteger(slot) || slot < 0 || runtime.energy < card.cost) return false;
    runtime.energy -= card.cost;
    runtime.discard.push(id);
    if (!runtime.draw.length) {
      runtime.draw = shuffle(runtime.discard, runtime);
      runtime.discard = [];
    }
    runtime.hand[slot] = runtime.draw.pop();
    runtime.casts++;
    runtime.token++;
    return true;
  };
  D.tick = function (runtime, dt) {
    if (!runtime || !Number.isFinite(dt) || dt <= 0) return;
    if (runtime.energy >= 3) {
      runtime.energy = 3;
      runtime.regen = 0;
      return;
    }
    runtime.regen += dt;
    while (runtime.regen + 1e-9 >= 12 && runtime.energy < 3) {
      runtime.regen = Math.max(0, runtime.regen - 12);
      runtime.energy++;
    }
    if (runtime.energy >= 3) runtime.regen = 0;
  };
})();
