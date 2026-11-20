'use strict';
(() => {
  const G = (TG.engine = { g: null });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
    len = Math.hypot,
    advance = (position, step) => (Number.isFinite(position + step) ? position + step : 0),
    rand = (a, b) => a + Math.random() * (b - a),
    TAU = Math.PI * 2;
  let seq = 0,
    castingCommand = false;
  G.onChange = () => {};
  G.onSound = () => {};
  G.input = { x: 0, y: 0 };
  G.notify = text => {
    if (G.g) G.g.toast = { text, life: 3 };
  };
  function makeId() {
    return 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function player() {
    return {
      x: 0,
      y: 0,
      hp: 100,
      maxHp: 100,
      speed: 225,
      attack: 17,
      interval: 0.52,
      projectiles: 1,
      pierce: 0,
      shield: 0,
      orbit: 0,
      magnet: 105,
      slow: 0,
      crit: 0
    };
  }
  // Read-only guidance: checking a goal must never advance combat or roll cards.
  G.objective = function (run = G.g) {
    if (!run || typeof run !== 'object') return null;
    const stage = Number.isInteger(run.stage) ? clamp(run.stage, 0, 2) : 0,
      station = TG.STAGES[stage];
    const duration = Number.isFinite(run.duration) && run.duration > 0 ? run.duration : station.duration,
      time = Number.isFinite(run.time) ? Math.max(0, run.time) : 0;
    if (run.mode === 'story') {
      const battle = TG.STORY?.battles?.[run.storyBattle],
        ended = run.status === 'ended';
      if (run.storyTraining)
        return {
          kind: ended ? 'ended' : 'survive',
          stage,
          cleared: 0,
          target: 0,
          bossIn: 0,
          remaining: Math.max(0, duration - time),
          title: ended ? (run.won ? '합동 훈련 완료' : '열차에서 다시 준비') : '90초 합동 지휘 훈련',
          detail: ended
            ? '이야기 진행과 보상은 변경되지 않습니다. 덱을 조정해 다시 연습할 수 있습니다.'
            : '지휘를 열어 카드를 사용하세요. 마레가 피해를 막으면 파동·절단·반격을 연계할 수 있습니다.'
        };
      const sealedObjective = run.script && MISSIONS[run.storyBattle]?.objective && run.script.phase !== 'swarm';
      if (run.script && MISSIONS[run.storyBattle] && !ended && !sealedObjective) {
        const s = run.script,
          cfg = MISSIONS[run.storyBattle],
          gate = run.storyGate,
          progress = Math.floor(100 * clamp((gate?.charge || 0) / (gate?.needed || 1), 0, 1));
        const base = {
          kind: 'mission',
          stage,
          cleared: 0,
          target: 1,
          bossIn: 0,
          remaining: Math.max(0, duration - time)
        };
        const escort = run.storyBattle === 'escort',
          kills = Math.min(s.kills, cfg.swarm.goal) + '/' + cfg.swarm.goal;
        if (s.phase === 'swarm' && cfg.objective)
          return {
            ...base,
            title:
              (run.storyBattle === 'archive' ? '기록 보관실 잔향 ' : '설원 습격 · 늑대와 승객 ') + kills,
            detail:
              run.storyBattle === 'archive'
                ? '기록장치가 잠겨 있습니다. 붉은 원에서 나타나는 잔향을 물리치면 장치가 열립니다.'
                : '중계기가 얼어붙어 있습니다. 습격을 물리치면 중계기가 열립니다. 늑대는 돌진, 승객은 사격합니다.'
          };
        if (s.phase === 'swarm')
          return {
            ...base,
            title: escort ? '마레와 귀환 · 길목 잔향 ' + kills : '잔향 습격 · ' + kills,
            detail: escort
              ? '마레가 곁을 지킵니다. 붉은 원에서 나타나는 잔향을 쓰러뜨리며 열차 쪽 길을 여세요.'
              : '붉은 원에서 잔향이 나타납니다. 공격은 자동이니 움직이며 푸른 기억을 모으세요. 돌진형은 붉은 예고선을 옆으로 피하세요.'
          };
        if (s.phase === 'guardian') {
          const total = cfg.guardians.list.length,
            beaten = gate?.defeated?.length || 0;
          return {
            ...base,
            title: escort ? '마레와 귀환 · 사격 잔향 ' + beaten + '/' + total : '회선 수호자 처치',
            detail: escort
              ? '부채꼴 사격은 다 피하기 어렵습니다. 마레가 한 번 막아 주며, 막은 직후 4초 동안 반격·파동·절단이 강해집니다.'
              : '돌진 직전 붉은 예고선이 나타납니다. 옆으로 피하거나 대시로 통과하면 지휘력 +1. 지휘 카드로 큰 피해를 주세요.'
          };
        }
        return {
          ...base,
          title: s.siege
            ? (escort ? '열차 문 사수 · ' : '안내 스위치 작동 · ') + progress + '%'
            : escort
              ? '금빛 열차 문으로 이동'
              : '금빛 안내 스위치로 이동',
          detail:
            '금빛 원 안에 ' +
            cfg.hold +
            (escort
              ? '초 머물면 열차에 오릅니다. 문이 열리는 동안 뒤쪽에서 추격 무리가 옵니다.'
              : '초 머물면 전원이 복구됩니다. 작동이 시작되면 잔향이 몰려오니 원 안에서 버티세요.')
        };
      }
      if (['approach', 'escort', 'archive'].includes(run.storyBattle) && !run.storyTraining) {
        const gate = run.storyGate,
          done = gate?.done === true,
          guards = gate?.guardIds?.length || 0,
          beaten = gate?.defeated?.length || 0;
        const needed = gate?.needed || 1,
          progress = Math.floor(100 * Math.max(0, Math.min(1, (gate?.charge || 0) / needed)));
        const prep =
          run.storyBattle === 'approach'
            ? '전원 복구'
            : run.storyBattle === 'escort'
              ? '마레와 귀환'
              : '기록 회수 후 귀환';
        const ready =
          run.storyBattle === 'archive'
            ? run.recordTarget?.recovered === true
            : guards > 0 && beaten === guards;
        const title = ended
          ? run.won
            ? prep + ' 완료'
            : '임무 실패'
          : !ready
            ? run.storyBattle === 'archive'
              ? '기록장치 회수 · 금빛 원으로 이동'
              : prep + ' · 방해 잔향 ' + beaten + '/' + guards
            : done
              ? prep + ' · 목표 달성'
              : (run.storyBattle === 'approach' ? '안내 스위치' : '열차 문') + '로 이동 · ' + progress + '%';
        return {
          kind: ended ? 'ended' : 'mission',
          stage,
          cleared: done ? 1 : 0,
          target: 1,
          bossIn: 0,
          remaining: Math.max(0, duration - time),
          title,
          detail: ended
            ? run.won
              ? '목표를 직접 달성해 임무가 완료되었습니다.'
              : '목표를 완료하기 전에 부상하거나 제한시간이 지나 임무가 실패했습니다.'
            : !ready
              ? run.storyBattle === 'archive'
                ? '기록장치의 원 안에서 머물러 회수하세요. 회수 후 열차 문이 열립니다.'
                : '표시된 수호 잔향을 쓰러뜨려 회선을 확보하세요. 가만히 서 있으면 임무가 완료되지 않습니다.'
              : '금빛 표식까지 직접 이동한 뒤 원 안에서 잠시 머무르세요. 시간 경과만으로는 성공하지 않습니다.'
        };
      }
      if (run.storyBattle === 'velaEscort') {
        const pt = run.patient,
          remaining = Math.max(0, duration - time),
          atCar = pt?.phase === 'boarded';
        const phase = pt?.phase || 'stabilize';
        return {
          kind: ended ? 'ended' : 'patient',
          stage,
          cleared: atCar ? 1 : 0,
          target: 1,
          bossIn: 0,
          remaining,
          title: ended
            ? run.won
              ? '환자 탑승 · 구조 성공'
              : '환자 구조 실패'
            : phase === 'stabilize'
              ? '환자에게 접근 · 안정화 ' +
                Math.floor(Math.min(100, ((pt?.charge || 0) / (pt?.needed || 3.2)) * 100)) +
                '%'
              : phase === 'escort'
                ? '객차까지 호위 · 환자 체력 ' + Math.ceil(pt?.hp || 0)
                : '환자가 객차에 탑승했습니다',
          detail: ended
            ? '출전 동료의 구조 행동과 환자의 상태를 결과 화면에서 확인하세요.'
            : phase === 'stabilize'
              ? '환자 가까이에서 기다리거나 벨라의 온기 처치를 사용하세요.'
              : '금빛 객차 문으로 돌아가세요. 마레의 보호로 환자 공격을 막고 뒤처지지 않게 이동하세요.'
        };
      }
      if (run.storyBattle === 'snowMission') {
        const nodes = run.signalTargets || [],
          done = nodes.filter(x => x.recovered).length;
        const route = run.route === 'rescue' ? '구조 신호' : '격리 명부',
          active = nodes.find(x => !x.recovered);
        return {
          kind: ended ? 'ended' : 'record',
          stage,
          cleared: done,
          target: nodes.length,
          bossIn: 0,
          remaining: Math.max(0, duration - time),
          title: ended
            ? run.won
              ? route + ' 확보'
              : '회수 임무 실패'
            : done === nodes.length
              ? route + ' 확보 · 귀환까지 생존'
              : route +
                ' ' +
                done +
                '/' +
                nodes.length +
                ' · ' +
                Math.floor(((active?.charge || 0) / (active?.needed || 1)) * 100) +
                '%',
          detail: ended
            ? '임무 목표를 마치지 못했거나 체력이 모두 소진되면 경계부터 재시도합니다.'
            : done === nodes.length
              ? '목표를 모두 완료했습니다. 제한시간까지 살아남으세요.'
              : '빛나는 목표 원 안에서 충전이 끝날 때까지 버티세요. 방 밖으로 나가면 진도가 감소합니다.'
        };
      }
      if (run.storyBattle === 'archive') {
        const beacon = run.recordTarget,
          recovered = beacon?.recovered === true,
          progress = Math.floor(
            Math.max(0, Math.min(100, ((beacon?.charge || 0) / (beacon?.needed || 1.25)) * 100))
          );
        return {
          kind: ended ? 'ended' : 'record',
          stage,
          cleared: recovered ? 1 : 0,
          target: 1,
          bossIn: 0,
          remaining: Math.max(0, duration - time),
          title: ended
            ? run.won
              ? '기록 회수 완료'
              : '기록 회수 실패'
            : recovered
              ? '기록 확보 · 귀환까지 생존'
              : '기록장치 회수 ' + progress + '% · 금빛 원 안에 머무르기',
          detail: ended
            ? recovered
              ? '기록 회수 경계에서 저장을 확인하세요.'
              : '기록을 확보하지 못했습니다. 이 임무를 다시 시작할 수 있습니다.'
            : recovered
              ? '기록을 확보했습니다. 제한시간까지 살아남으세요.'
              : '기록장치 원 안에서 3초 회수하세요. 둘레를 도는 붉은 광선에 맞으면 피해를 입고 진도가 줄어듭니다.'
        };
      }
      return {
        kind: ended ? 'ended' : 'survive',
        stage,
        cleared: 0,
        target: 0,
        bossIn: 0,
        remaining: Math.max(0, duration - time),
        title: ended
          ? run.won
            ? battle?.successTitle || '통로 확보'
            : run.reason === 'retreat'
              ? '열차에서 다시 준비'
              : '전투를 다시 준비하세요'
          : battle?.objective || '안내 방송이 돌아올 때까지 생존',
        detail: ended
          ? run.won
            ? battle?.successStory || '다음 이야기로 이어집니다.'
            : '이 전투의 시작 지점에서 다시 도전할 수 있습니다. 확정한 이야기와 동료는 유지됩니다.'
          : battle?.detail || '이동과 대시로 위험을 피하세요. 제한시간까지 살아남으면 이야기가 이어집니다.'
      };
    }
    const camp = run.status === 'camp' || run.phase === 'camp',
      ended = run.status === 'ended';
    const historical = Number.isFinite(run.clearedStages)
      ? clamp(Math.floor(run.clearedStages), 0, 3)
      : stage + (camp ? 1 : 0);
    const cleared = run.mode === 'chapter' && ended && run.won ? 3 : historical;
    const result = {
      kind: ended ? 'ended' : camp ? 'camp' : run.bossSpawned ? 'boss' : 'prepare',
      stage,
      cleared,
      target: 3,
      bossIn: run.bossSpawned ? 0 : Math.max(0, duration * 0.67 - time),
      remaining: Math.max(0, duration - time),
      title: '',
      detail: ''
    };
    if (result.kind === 'prepare') {
      result.title = '기억을 모아 관리자에 대비';
      result.detail = '적을 쓰러뜨리고 경험치를 모아 카드를 조합하세요. 관리자를 처치해야 역이 복원됩니다.';
    } else if (result.kind === 'boss') {
      result.title = station.boss + ' 처치';
      result.detail = '소거 제한시간 안에 관리자를 쓰러뜨려 ' + station.name + '을 복원하세요.';
    } else if (result.kind === 'camp') {
      result.title = station.name + ' 복원 완료';
      result.detail =
        !run.bossReward && !run.eventDone
          ? '관리자 보상과 역의 사건을 선택한 뒤 다음 역으로 출발하세요.'
          : !run.bossReward
            ? '관리자 보상을 선택한 뒤 다음 역으로 출발하세요.'
            : !run.eventDone
              ? '역의 사건을 선택한 뒤 다음 역으로 출발하세요.'
              : stage < 2
                ? TG.STAGES[stage + 1].name + '으로 출발해 다음 기억을 복원하세요.'
                : '세 역의 기억을 모두 복원했습니다.';
    } else if (run.won) {
      result.title = run.mode === 'chapter' ? '세 역의 기억 복원' : '연습 전투 완료';
      result.detail =
        run.mode === 'chapter'
          ? '리제와 마레의 첫 번째 장을 마쳤습니다.'
          : '첫 번째 장에서 세 역의 복원에 도전하세요.';
    } else {
      result.title = '복원 ' + cleared + '/3 · 열차로 귀환';
      result.detail =
        run.reason === 'timeout'
          ? '시간이 다해 역이 소거되었습니다. 다음 탐험에서는 관리자 처치에 집중하세요.'
          : run.reason === 'retreat'
            ? '탐험을 마치고 귀환했습니다. 기억 조각으로 열차를 정비해 다시 출발하세요.'
            : '불빛이 꺼졌습니다. 기억 조각으로 열차를 정비하고 다시 복원에 도전하세요.';
    }
    return result;
  };
  G.buildGoal = function (run = G.g) {
    if (!run || typeof run !== 'object') return null;
    const levels = run.levels && typeof run.levels === 'object' ? run.levels : {},
      level = id => (Number.isFinite(levels[id]) ? Math.max(0, Math.floor(levels[id])) : 0);
    let goal = null,
      distance = Infinity,
      activeCount = 0;
    for (const synergy of TG.SYNERGIES) {
      const needs = Object.entries(synergy.needs),
        missing = needs
          .filter(([id, target]) => level(id) < target)
          .map(([id, target]) => ({
            id,
            name: TG.CARDS.find(card => card.id === id)?.name || id,
            current: level(id),
            target
          }));
      if (!missing.length) {
        activeCount++;
        continue;
      }
      if (!needs.some(([id]) => level(id) > 0)) continue;
      const remaining = missing.reduce((sum, card) => sum + card.target - card.current, 0);
      if (remaining < distance) {
        distance = remaining;
        goal = { id: synergy.id, name: synergy.name, missing, activeCount: 0 };
      }
    }
    if (goal) goal.activeCount = activeCount;
    return goal;
  };
  G.rebuild = function () {
    const g = G.g,
      p = g.p,
      l = g.levels,
      u = TG.store.data.upgrades,
      has = id => g.relics.includes(id),
      lv = id => l[id] || 0;
    g.synergies = Object.fromEntries(
      TG.SYNERGIES.map(s => [s.id, Object.entries(s.needs).every(([id, n]) => lv(id) >= n)])
    );
    const sy = g.synergies;
    p.maxHp = 100 + u.heart * 8 + lv('magnet') * 10 + lv('vital') * 20;
    p.hp = clamp(p.hp, 0, p.maxHp);
    p.speed = Math.min(350, 225 * (1 + 0.1 * lv('speed')));
    p.attack = 17 * (1 + u.lamp * 0.05) * Math.pow(1.25, lv('blade'));
    p.interval = Math.max(0.18, 0.52 * Math.pow(0.94, lv('blade')));
    p.projectiles = 1 + lv('echo');
    p.pierce = lv('pierce');
    p.orbit = lv('orbit');
    p.magnet =
      (105 + u.map * 12 + has('compass') * 40) * (1 + 0.3 * lv('magnet')) * (sy.starCompass ? 1.5 : 1);
    p.slow = Math.min(0.75, 0.25 * lv('frost'));
    p.crit = Math.min(0.6, lv('focus') * 0.08 + has('lens') * 0.1);
    g.dash.maxCooldown = Math.max(1.5, 3 - lv('clock') * 0.3 - has('watch') * 0.3);
  };
  function initialize(mode, stage, carry, resuming = false, prepareOnly = false) {
    const old = carry || {};
    const g = (G.g = {
      id: old.id || makeId(),
      mode,
      stage,
      duration: mode === 'quick' ? 90 : mode === 'single' ? 300 : TG.STAGES[stage].duration,
      status: 'playing',
      time: 0,
      totalTime: old.totalTime || 0,
      level: old.level || 1,
      xp: old.xp || 0,
      xpNeed: 0,
      levels: { ...(old.levels || {}) },
      relics: [...(old.relics || [])],
      shards: old.shards || 0,
      kills: old.kills || 0,
      erase: old.erase || 0,
      bossSpawned: false,
      bossDefeated: false,
      spawn: 0.4,
      eliteCount: 0,
      enemySeq: 0,
      lastFire: 0,
      lastHit: -9,
      lastShield: 0,
      regenClock: 0,
      pulseClock: 0,
      hazardClock: 0,
      bonusCards: old.bonusCards || 0,
      event: old.event || 0,
      eventDone: false,
      bossOffers: resuming && old.phase === 'camp' ? [...(old.bossOffers || [])] : [],
      bossReward: resuming && old.phase === 'camp' ? old.bossReward || null : null,
      p: player(),
      dash: { active: 0, cooldown: 0, invulnerable: false, x: 0, y: 1, lastX: 0, lastY: 1, maxCooldown: 3 },
      enemies: [],
      bullets: [],
      hostile: [],
      drops: [],
      particles: [],
      rings: [],
      hazards: [],
      links: [],
      flames: [],
      aftershocks: [],
      eliteDrops: [],
      offered: [],
      offerToken: 0,
      shake: 0,
      flash: 0,
      face: 0,
      moving: false,
      toast: null,
      chain: 0,
      chainTime: 0,
      overcharge: 0,
      nextWave: 25,
      waveIndex: 0,
      wave: null,
      waveRestUntil: 0
    });
    g.clearedStages = clamp(
      Math.max(
        stage,
        Number.isFinite(old.clearedStages) ? Math.floor(old.clearedStages) : 0,
        resuming && old.phase === 'camp' ? stage + 1 : 0
      ),
      0,
      3
    );
    g.learned = {
      moved: stage > 0 || old.learned?.moved === true,
      dashed: old.learned?.dashed === true,
      collected: old.learned?.collected === true || g.xp > 0 || g.level > 1,
      chosen: old.learned?.chosen === true || Object.values(g.levels).some(lv => lv > 0)
    };
    g.anchorSeen = false;
    g.memoryAnchor = null;
    g.mare = null;
    g.allies = [];
    g.xpNeed = 12 + Math.max(0, g.level - 1) * 7;
    G.input.x = G.input.y = 0;
    G.rebuild();
    g.p.hp = old.hp ? Math.min(g.p.maxHp, old.hp) : g.p.maxHp;
    g.p.shield = Math.min(3, (g.levels.shield || 0) + (g.relics.includes('bell') ? 1 : 0));
    if (prepareOnly) return g;
    if (mode === 'chapter') {
      TG.store.remember('arrival');
      if (stage === 1) TG.store.remember('snow');
      if (stage === 2) TG.store.remember('order');
      if (!resuming) TG.store.snapshot(g);
    }
    G.notify(TG.STAGES[stage].intro);
    G.onChange('playing');
    G.onSound('start');
    if (!(resuming && old.phase === 'camp')) G.checkLevel();
    return g;
  }
  G.start = (mode = 'chapter') => {
    if (!['chapter', 'quick', 'single'].includes(mode)) throw Error('지원하지 않는 탐험 방식입니다.');
    if (mode === 'chapter' && !TG.store.canWrite())
      throw Error('기록 저장을 확인할 수 없습니다. 다른 탭을 닫고 새로고침하거나 백업을 확인하세요.');
    if (TG.store.data.checkpoint) throw Error('진행 중인 탐험을 먼저 이어가거나 정산해 주세요.');
    return initialize(mode, 0, null);
  };
  // Story uses its own boundary checkpoint and never replaces a legacy exploration.
  function startStoryBattle(spec, training = false) {
    const battle = spec && TG.STORY?.battles?.[spec.battleId];
    if (!spec || !battle) return false;
    const g = initialize('story', battle.stage, { ...spec.loadout, id: spec.id }, false, true);
    if (training) {
      g.p.hp = g.p.maxHp;
      g.kills = 0;
      g.totalTime = 0;
      g.shards = 0;
      g.nextWave = 12;
    }
    g.storyBattle = spec.battleId;
    g.duration = training
      ? 90
      : spec.battleId === 'snowMission' && spec.route === 'contain'
        ? 95
        : battle.duration;
    g.storyTraining = training;
    g.storySaved = false;
    g.practice = false;
    g.reward = 0;
    g.newGoals = [];
    const missionDeck = TG.commandDeck.normalize(spec.commandDeck, spec.companions);
    if (!training && spec.battleId === 'velaEscort') {
      // Use role-compatible cards only in this mission's transient deck, not the saved deck.
      for (const id of ['vela_heal', 'mare_guard']) {
        if (missionDeck.includes(id)) continue;
        const owner = id.split('_')[0],
          slot = missionDeck.findIndex(card => card.startsWith(owner + '_'));
        if (slot >= 0) missionDeck[slot] = id;
      }
    }
    g.commands = TG.commandDeck.create(missionDeck, spec.commandSeed ?? TG.commandDeck.seedFor(spec.id));
    if (!training && spec.battleId === 'velaEscort') {
      const required = ['vela_heal', 'mare_guard'];
      for (const id of required) {
        if (g.commands.hand.includes(id)) continue;
        const i = g.commands.draw.indexOf(id),
          slot = g.commands.hand.findIndex(card => !required.includes(card));
        if (i >= 0 && slot >= 0) {
          const previous = g.commands.hand[slot];
          g.commands.hand[slot] = id;
          g.commands.draw[i] = previous;
        }
      }
    }
    // Ensure the opening hand contains at least one card from Rize and each deployed ally.
    // The order is seeded, and the user's saved deck is never replaced.
    if (!training) {
      const ownerOf = id => TG.COMMANDS.find(card => card.id === id)?.owner;
      const needed = ['rize', ...spec.companions];
      for (const owner of needed) {
        if (g.commands.hand.some(id => ownerOf(id) === owner)) continue;
        const found = g.commands.draw.findIndex(id => ownerOf(id) === owner);
        const victim = g.commands.hand.findIndex(id => {
          // A guaranteed patient-treatment card must never be exchanged for another ally.
          if (spec.battleId === 'velaEscort' && ['vela_heal', 'mare_guard'].includes(id)) return false;
          const present = ownerOf(id);
          return !needed.includes(present) || g.commands.hand.filter(x => ownerOf(x) === present).length > 1;
        });
        if (found >= 0 && victim >= 0) {
          const old = g.commands.hand[victim];
          g.commands.hand[victim] = g.commands.draw[found];
          g.commands.draw[found] = old;
        }
      }
    }
    g.teamwork = { owner: null, window: 0, cooldown: 0, count: 0, evades: 0, evadeCooldown: 0, lastPair: '' };
    g.commandEffects = { guardWindow: 0, ward: 0 };
    if (spec.companions.includes('mare'))
      g.mare = {
        x: g.p.x - 45,
        y: g.p.y + 30,
        cooldown: 0,
        maxCooldown: 12,
        pulse: 0,
        protected: 0,
        face: 0,
        moving: false
      };
    g.party = [...spec.companions];
    g.allies = spec.companions
      .filter(id => id !== 'mare')
      .map((id, i) => ({
        id,
        x: g.p.x + 45 + i * 20,
        y: g.p.y + 40 + i * 20,
        cooldown: 3 + i * 2,
        pulse: 0,
        moving: false,
        face: 0
      }));
    g.recordTarget =
      !training && spec.battleId === 'archive'
        ? { x: g.p.x + 125, y: g.p.y - 75, r: 55, charge: 0, needed: RECORD_TIME, recovered: false }
        : null;
    g.storyGate = null;
    g.script = null;
    if (!training && ['approach', 'escort', 'archive'].includes(spec.battleId)) {
      const mission = spec.battleId;
      const cfg = MISSIONS[mission] || null;
      g.storyGate = {
        x: g.p.x + (cfg ? cfg.gate[0] : -195),
        y: g.p.y + (cfg ? cfg.gate[1] : 90),
        r: cfg ? cfg.radius : 51,
        needed: cfg ? cfg.hold : 0.7,
        charge: 0,
        done: false,
        guardIds: [],
        defeated: [],
        kind: mission
      };
      // Scripted missions are authored arcs; their guardians arrive later.
      if (cfg) {
        g.script = missionScript(mission);
        g.storyGate.decay = cfg.decay;
        if (cfg.firstXp) g.xpNeed = cfg.firstXp;
      }
    }
    g.route = spec.battleId === 'snowMission' ? (spec.route === 'rescue' ? 'rescue' : 'contain') : null;
    g.snowParty = spec.battleId === 'snowMission' ? [...spec.snowParty] : [];
    const aster = g.snowParty.includes('aster'),
      noa = g.snowParty.includes('noa'),
      vela = g.snowParty.includes('vela');
    g.signalTargets =
      !training && spec.battleId === 'snowMission'
        ? (g.route === 'rescue'
            ? [
                { x: g.p.x + 120, y: g.p.y - 90, r: 52, needed: aster ? 1.8 : 2.2, name: '구조 중계기 A' },
                { x: g.p.x - 130, y: g.p.y + 75, r: 52, needed: aster ? 1.8 : 2.2, name: '구조 중계기 B' }
              ]
            : [{ x: g.p.x + 125, y: g.p.y - 75, r: 52, needed: aster ? 2.9 : 3.5, name: '봉인된 명부' }]
          ).map(a => ({ ...a, charge: 0, recovered: false }))
        : [];
    if (vela) g.p.hp = Math.min(g.p.maxHp, g.p.hp + 25);
    g.snowSignalHelp = noa;
    if (!training && spec.battleId === 'snowMission') g.script = missionScript('snowMission');
    g.patient =
      !training && spec.battleId === 'velaEscort'
        ? {
            x: g.p.x + 112,
            y: g.p.y - 65,
            hp: 66,
            maxHp: 100,
            phase: 'stabilize',
            charge: 0,
            needed: 3.2,
            shield: 0,
            warning: 0,
            threatClock: 0,
            treatments: 0,
            mareBlocks: 0,
            saved: false,
            pose: 0
          }
        : null;
    g.trainExit = g.patient ? { x: g.p.x - 225, y: g.p.y + 125, r: 52 } : null;
    if (g.patient) g.p.hp = Math.max(80, g.p.hp);
    // Only story missions use a readable, dodgeable stationary-pressure hazard.
    // Survival, command training and the patient escort keep their existing balance.
    g.storyPressure =
      !training && ['approach', 'escort', 'archive', 'snowMission'].includes(spec.battleId)
        ? { idle: 0, x: g.p.x, y: g.p.y, r: 66, warning: 0, cooldown: 0, pulses: 0, hits: 0, dodges: 0 }
        : null;
    G.notify(training ? '90초 합동 지휘 훈련 · 지휘 카드를 시험하세요' : battle.objective);
    G.onChange('playing');
    G.onSound('start');
    G.checkLevel();
    return g;
  }
  G.startStory = function () {
    if (G.g && G.g.status !== 'ended') return false;
    return startStoryBattle(TG.story?.prepareBattle?.());
  };
  G.startCommandTraining = function () {
    if (G.g && G.g.status !== 'ended') return false;
    const spec = TG.story?.prepareTraining?.();
    if (!spec?.companions?.length || !TG.store.canWrite()) return false;
    return startStoryBattle(spec, true);
  };
  G.continue = function () {
    const c = TG.store.data.checkpoint;
    if (!c || !TG.store.canWrite()) return false;
    initialize(c.mode, c.stage, c, true);
    if (c.phase === 'camp') {
      G.g.status = 'camp';
      G.g.event = c.event;
      G.g.eventDone = c.eventDone;
      G.onChange('camp');
    }
    TG.store.snapshot(G.g, c.phase);
    return true;
  };
  G.pause = function () {
    if (G.g?.status !== 'playing') return;
    G.g.status = 'paused';
    G.input.x = G.input.y = 0;
    G.onChange('paused');
  };
  G.resume = function () {
    if (G.g?.status !== 'paused' || (['chapter', 'story'].includes(G.g.mode) && !TG.store.canWrite())) return;
    if (G.g.p.hp <= 0) {
      G.finish(false, 'death');
      return;
    }
    G.g.status = 'playing';
    G.onChange('playing');
  };
  G.dash = function () {
    const g = G.g;
    if (!g || g.status !== 'playing' || g.dash.cooldown > 0) return false;
    const d = g.dash,
      m = len(G.input.x, G.input.y),
      p = g.p,
      t = g.teamwork;
    // Directed evasions during an attack warning restore one tactical resource.
    const warned =
      g.storyPressure?.warning > 0 &&
      len(p.x - g.storyPressure.x, p.y - g.storyPressure.y) < g.storyPressure.r + 32;
    const danger =
      g.enemies.some(e => e.action === 'windup' && len(p.x - e.x, p.y - e.y) < 210) ||
      g.hostile.some(b => len(p.x - b.x, p.y - b.y) < 105);
    const rewarded = g.mode === 'story' && t && m > 0.1 && t.evadeCooldown <= 0 && (warned || danger);
    if (m > 0.1) {
      d.lastX = G.input.x / m;
      d.lastY = G.input.y / m;
    }
    d.x = d.lastX;
    d.y = d.lastY;
    g.learned.dashed = true;
    d.active = 0.18;
    d.invulnerable = true;
    d.cooldown = d.maxCooldown;
    g.rings.push({ x: p.x, y: p.y, r: 25, life: 0.3, max: 0.3, color: '#ead8ae' });
    if (rewarded) {
      t.evades++;
      t.evadeCooldown = 5;
      g.commands.energy = Math.min(3, g.commands.energy + 1);
      ring(p.x, p.y, 52, '#e9d494');
      G.notify('위험 회피 성공 · 지휘력 +1');
    }
    G.onSound('dash');
    return true;
  };
  G.openCommands = function () {
    const g = G.g;
    if (
      !g ||
      g.mode !== 'story' ||
      !g.commands ||
      g.status !== 'playing' ||
      g.p.hp <= 0 ||
      !TG.store.canWrite()
    )
      return false;
    g.status = 'command';
    G.input.x = G.input.y = 0;
    G.onChange('commands');
    return true;
  };
  G.closeCommands = function () {
    const g = G.g;
    if (
      !g ||
      g.mode !== 'story' ||
      !g.commands ||
      g.status !== 'command' ||
      g.p.hp <= 0 ||
      !TG.store.canWrite()
    )
      return false;
    g.status = 'playing';
    G.input.x = G.input.y = 0;
    G.onChange('playing');
    G.checkLevel();
    return true;
  };
  function nearPlayer(item, radius) {
    return len(item.x - G.g.p.x, item.y - G.g.p.y) <= radius;
  }
  // Previewing a command never rolls a card, mutates a run, or touches storage.
  G.commandInfo = function (id) {
    const card = TG.COMMANDS.find(item => item.id === id) || null,
      g = G.g;
    const no = reason => ({ card, enabled: false, reason });
    if (!card) return no('알 수 없는 지휘입니다.');
    if (!g || g.mode !== 'story' || !g.commands || !['playing', 'command'].includes(g.status) || g.p.hp <= 0)
      return no('진행 중인 이야기 전투에서 사용할 수 있습니다.');
    if (!g.commands.hand.includes(id)) return no('현재 손패에 없는 카드입니다.');
    if (card.owner === 'mare' && !g.mare) return no('마레가 파티에 필요합니다.');
    if (!['rize', 'shared', 'mare'].includes(card.owner) && !g.party?.includes(card.owner))
      return no('해당 동료가 출전하지 않았습니다.');
    if (g.commands.energy < card.cost) return no('지휘력이 부족합니다.');
    const enemies = radius => g.enemies.some(enemy => nearPlayer(enemy, radius)),
      hostile = radius => g.hostile.some(bullet => nearPlayer(bullet, radius));
    if (
      (id === 'rize_pulse' && !enemies(155)) ||
      (id === 'rize_cut' && !enemies(450)) ||
      (id === 'rize_frost' && !enemies(180))
    )
      return no('범위 안에 적이 없습니다.');
    if (id === 'rize_flame' && g.flames.filter(flame => flame.life > 0).length >= 3)
      return no('등불은 동시에 3개까지 설치할 수 있습니다.');
    const patientNear =
      g.storyBattle === 'velaEscort' &&
      g.patient &&
      g.patient.phase !== 'boarded' &&
      len(g.p.x - g.patient.x, g.p.y - g.patient.y) < 155;
    if (id === 'mare_guard' && g.p.shield >= 3 && !(patientNear && g.patient.shield < 2))
      return no('보호막이 이미 3개입니다.');
    if (id === 'mare_shelter' && g.commandEffects.ward >= 4) return no('합동 보호가 이미 유지되고 있습니다.');
    if (id === 'mare_counter' && !(g.commandEffects.guardWindow > 0))
      return no('마레나 보호막이 피해를 막은 직후 사용하세요.');
    if (id === 'mare_counter' && !enemies(180) && !hostile(180))
      return no('반격 범위 안에 적이나 적탄이 없습니다.');
    if (id === 'mare_rally' && g.p.hp >= g.p.maxHp && g.mare.cooldown <= 0)
      return no('체력과 자동 보호가 모두 준비되어 있습니다.');
    if (id === 'shared_magnet' && !g.drops.some(drop => nearPlayer(drop, 300)))
      return no('회수할 경험치 기억이 없습니다.');
    if (id === 'shared_heal' && g.p.hp >= g.p.maxHp) return no('체력이 가득 찼습니다.');
    if (id === 'shared_push' && !enemies(160) && !hostile(110))
      return no('밀어낼 적이나 제거할 적탄이 없습니다.');
    if (id === 'shared_dash' && g.dash.cooldown <= 0) return no('대시가 이미 준비되어 있습니다.');
    if (['strike', 'burst', 'freeze'].includes(card.action) && !enemies(card.action === 'strike' ? 450 : 180))
      return no('범위 안에 적이 없습니다.');
    if (card.action === 'magnet' && !g.drops.some(d => nearPlayer(d, 300)))
      return no('회수할 기억이 없습니다.');
    if (card.action === 'heal' && g.p.hp >= g.p.maxHp && !patientNear) return no('체력이 가득 찼습니다.');
    if (card.action === 'guard' && g.p.shield >= 3 && !(patientNear && g.patient.shield < 2))
      return no('보호막이 가득 찼습니다.');
    if (card.action === 'ward' && g.commandEffects.ward >= 4) return no('보호 장막이 활성화되어 있습니다.');
    if (
      (card.action === 'push' && !enemies(160) && !hostile(110)) ||
      (card.action === 'clear' && !hostile(180))
    )
      return no('범위 안에 대상이 없습니다.');
    if (card.action === 'dash' && g.dash.cooldown <= 0) return no('대시가 준비되어 있습니다.');
    if (card.action === 'flame' && g.flames.filter(f => f.life > 0).length >= 3)
      return no('등불은 최대 3개입니다.');
    return { card, enabled: true, reason: '' };
  };
  // A card that the situation makes unusable for a while (full-HP heal, nothing to collect)
  // is swapped for the next draw, so a hand never stays dead. Waiting on energy or on a
  // protection window (반격) is a timing choice, not a dead card, and never cycles.
  const STALE_CARD_SECONDS = 6;
  function cycleStaleCards(g, dt) {
    const c = g.commands;
    if (!c || dt <= 0) return;
    if (!Array.isArray(c.stale) || c.stale.length !== c.hand.length) c.stale = c.hand.map(() => 0);
    for (let slot = 0; slot < c.hand.length; slot++) {
      const id = c.hand[slot],
        card = TG.COMMANDS.find(item => item.id === id);
      const waiting = !card || c.energy < card.cost || id === 'mare_counter' || G.commandInfo(id).enabled;
      c.stale[slot] = waiting ? 0 : c.stale[slot] + dt;
      if (c.stale[slot] >= STALE_CARD_SECONDS && TG.commandDeck.cycle(c, slot)) {
        c.stale[slot] = 0;
        G.notify((card?.name || '지휘') + ' 교체 · 지금 쓸 수 없는 카드를 다음 카드로 바꿨습니다');
      }
    }
  }
  // Quick cast from the in-combat card tray: same rules and costs as the command screen,
  // but combat keeps running and the joystick is not released.
  G.quickCast = function (id) {
    const g = G.g;
    if (!g || g.mode !== 'story' || !g.commands || g.status !== 'playing' || g.p.hp <= 0) return false;
    if (!G.commandInfo(id).enabled || !TG.store.canWrite()) return false;
    const route = G.onChange;
    G.onChange = state => {
      if (state !== 'playing') route(state);
    };
    let ok = false;
    try {
      g.status = 'command';
      ok = G.castCommand(id, g.commands.token);
    } finally {
      G.onChange = route;
      if (!ok && g.status === 'command') g.status = 'playing';
    }
    if (ok) g.commands.quick = (g.commands.quick || 0) + 1;
    return ok;
  };
  G.castCommand = function (id, token) {
    const g = G.g;
    if (
      !g ||
      g.mode !== 'story' ||
      g.status !== 'command' ||
      !g.commands ||
      token !== g.commands.token ||
      g.p.hp <= 0
    )
      return false;
    const info = G.commandInfo(id);
    if (!info.enabled || !TG.store.canWrite()) return false;
    if (!TG.commandDeck.spend(g.commands, id)) return false;
    // Commit the hand before effects: a double tap can never apply an effect twice.
    const p = g.p,
      effects = g.commandEffects,
      enemies = radius => g.enemies.filter(enemy => nearPlayer(enemy, radius));
    const clearHostile = radius => {
      g.hostile = g.hostile.filter(bullet => !nearPlayer(bullet, radius));
    };
    let color = '#d7c391',
      radius = 65,
      teamNote = '';
    castingCommand = true;
    try {
      if (id === 'rize_pulse' || id === 'rize_cut') {
        const combo = effects.guardWindow > 0 ? 1.5 : 1;
        if (combo > 1) effects.guardWindow = 0;
        if (id === 'rize_pulse') {
          radius = 155;
          for (const enemy of enemies(radius)) G.hitEnemy(enemy, p.attack * 1.5 * combo);
        } else {
          radius = 45;
          const target = enemies(450).sort(
            (a, b) => len(a.x - p.x, a.y - p.y) - len(b.x - p.x, b.y - p.y)
          )[0];
          G.hitEnemy(target, p.attack * 2.4 * combo);
          ring(target.x, target.y, 40, color);
        }
      } else if (id === 'rize_frost') {
        color = '#aee5fb';
        radius = 180;
        for (const enemy of enemies(radius)) {
          if (enemy.type === 'boss') enemy.slow = Math.max(enemy.slow, 0.8);
          else enemy.frozen = Math.max(enemy.frozen, 0.7);
        }
      } else if (id === 'rize_flame') {
        color = '#e9ac75';
        radius = 95;
        g.flames.push({ x: p.x, y: p.y, r: 95, life: 3 });
      } else if (id === 'mare_guard') {
        color = '#a5e2ed';
        p.shield = Math.min(3, p.shield + 1);
        g.lastShield = g.time;
        if (g.patient && g.patient.phase !== 'boarded' && len(p.x - g.patient.x, p.y - g.patient.y) < 155) {
          g.patient.shield = Math.min(2, g.patient.shield + 1);
          ring(g.patient.x, g.patient.y, 43, '#d7b27d');
        }
      } else if (id === 'mare_shelter') {
        color = '#a5e2ed';
        effects.ward = 4;
      } else if (id === 'mare_counter') {
        color = '#a5e2ed';
        radius = 180;
        effects.guardWindow = 0;
        for (const enemy of enemies(radius)) G.hitEnemy(enemy, p.attack * 2.2);
        clearHostile(radius);
      } else if (id === 'mare_rally') {
        color = '#b7d9bd';
        p.hp = Math.min(p.maxHp, p.hp + 12);
        g.mare.cooldown = Math.max(0, g.mare.cooldown - 6);
      } else if (id === 'shared_magnet') {
        radius = 300;
        const collected = g.drops.filter(drop => nearPlayer(drop, radius));
        g.xp += collected.reduce((sum, drop) => sum + drop.value * (1 + 0.15 * (g.levels.wisdom || 0)), 0);
        g.drops = g.drops.filter(drop => !nearPlayer(drop, radius));
        g.learned.collected = true;
      } else if (id === 'shared_heal') {
        color = '#b7d9bd';
        p.hp = Math.min(p.maxHp, p.hp + 18);
      } else if (id === 'shared_push') {
        color = '#a7d4f0';
        radius = 160;
        for (const enemy of enemies(radius)) {
          const dx = enemy.x - p.x,
            dy = enemy.y - p.y,
            distance = len(dx, dy);
          enemy.x += distance ? (dx / distance) * 90 : 90;
          enemy.y += distance ? (dy / distance) * 90 : 0;
        }
        clearHostile(110);
      } else if (id === 'shared_dash') {
        color = '#ead8ae';
        g.dash.cooldown = 0;
      } else if (info.card.action) {
        color = TG.PARTY.find(x => x.id === info.card.owner)?.color || '#d7c391';
        const action = info.card.action;
        if (action === 'strike') {
          const target = enemies(450).sort(
            (a, b) => len(a.x - p.x, a.y - p.y) - len(b.x - p.x, b.y - p.y)
          )[0];
          G.hitEnemy(target, p.attack * 1.8);
          radius = 90;
        }
        if (action === 'burst') {
          radius = 180;
          for (const target of enemies(180)) G.hitEnemy(target, p.attack * 1.3);
        }
        if (action === 'freeze') {
          radius = 180;
          for (const target of enemies(180))
            if (target.type === 'boss') target.slow = Math.max(target.slow, 0.8);
            else target.frozen = Math.max(target.frozen, 0.7);
        }
        if (action === 'magnet') {
          radius = 300;
          const found = g.drops.filter(d => nearPlayer(d, 300));
          g.xp += found.reduce((sum, d) => sum + d.value * (1 + 0.15 * (g.levels.wisdom || 0)), 0);
          g.drops = g.drops.filter(d => !nearPlayer(d, 300));
          g.learned.collected = true;
        }
        if (action === 'heal') {
          p.hp = Math.min(p.maxHp, p.hp + 20);
          const pt = g.patient;
          if (
            info.card.owner === 'vela' &&
            pt &&
            pt.phase !== 'boarded' &&
            len(p.x - pt.x, p.y - pt.y) < 155
          ) {
            pt.hp = Math.min(pt.maxHp, pt.hp + 24);
            pt.charge = Math.min(pt.needed, pt.charge + 1.65);
            pt.treatments++;
            const medic = g.allies.find(a => a.id === 'vela');
            if (medic) {
              medic.x = pt.x + 26;
              medic.y = pt.y + 5;
              medic.pulse = 1.2;
              medic.carePose = 1.2;
            }
            ring(pt.x, pt.y, 50, '#9fdbb5');
            spark(pt.x, pt.y, '#d3f4d9', 6);
            if (pt.phase === 'stabilize' && pt.charge >= pt.needed) {
              pt.phase = 'escort';
              G.notify('벨라의 처치 완료 · 환자가 일어섰습니다. 객차까지 호위하세요.');
            }
          }
        }
        if (action === 'guard') {
          p.shield = Math.min(3, p.shield + 1);
          g.lastShield = g.time;
          if (g.patient && g.patient.phase !== 'boarded' && len(p.x - g.patient.x, p.y - g.patient.y) < 155)
            g.patient.shield = Math.min(2, g.patient.shield + 1);
        }
        if (action === 'ward') effects.ward = 4;
        if (action === 'push') {
          radius = 160;
          for (const e of enemies(160)) {
            const dx = e.x - p.x,
              dy = e.y - p.y,
              d = len(dx, dy) || 1;
            e.x += (dx / d) * 90;
            e.y += (dy / d) * 90;
          }
          clearHostile(110);
        }
        if (action === 'clear') {
          radius = 180;
          clearHostile(180);
        }
        if (action === 'dash') g.dash.cooldown = 0;
        if (action === 'flame') {
          radius = 95;
          g.flames.push({ x: p.x, y: p.y, r: 95, life: 3 });
        }
      }
      effects.title = info.card.name;
      ring(p.x, p.y, radius, color);
      spark(p.x, p.y, color, 8);
      const t = g.teamwork,
        owner = info.card.owner;
      if (t && t.window > 0 && t.cooldown <= 0 && t.owner !== owner) {
        const pair = [t.owner, owner],
          names = {
            rize: '리제',
            mare: '마레',
            aster: '아스터',
            noa: '노아',
            vela: '벨라',
            shared: '공용',
            iris: '이리스',
            crow: '크로우'
          };
        t.count++;
        t.lastPair = pair.map(x => names[x] || x).join(' × ');
        t.cooldown = 5.5;
        t.window = 0;
        t.owner = null;
        const reach = 210;
        for (const e of enemies(reach)) G.hitEnemy(e, p.attack * 1.3);
        clearHostile(reach);
        g.commands.energy = Math.min(3, g.commands.energy + 1);
        if (pair.includes('mare')) p.shield = Math.min(3, p.shield + 1);
        if (pair.includes('vela')) {
          p.hp = Math.min(p.maxHp, p.hp + 10);
          if (g.patient && len(p.x - g.patient.x, p.y - g.patient.y) < 155 && g.patient.phase !== 'boarded')
            g.patient.hp = Math.min(g.patient.maxHp, g.patient.hp + 10);
        }
        if (pair.includes('noa')) g.dash.cooldown = Math.max(0, g.dash.cooldown - 1.5);
        if (pair.includes('aster')) {
          const mark = enemies(320).sort((a, b) => len(a.x - p.x, a.y - p.y) - len(b.x - p.x, b.y - p.y))[0];
          if (mark) {
            G.hitEnemy(mark, p.attack * 1.6);
            ring(mark.x, mark.y, 37, '#e5c788');
          }
        }
        ring(p.x, p.y, 210, '#f2d597');
        spark(p.x, p.y, '#ffe0a0', 14);
        teamNote = '합동 지휘! ' + t.lastPair + ' · 광역 공격 · 지휘력 +1';
      } else if (t) {
        t.owner = owner;
        t.window = 6;
      }
    } finally {
      castingCommand = false;
    }
    g.status = 'playing';
    G.input.x = G.input.y = 0;
    G.notify(teamNote || info.card.name + ' · 지휘력 −' + info.card.cost);
    G.onSound('card');
    G.onChange('playing');
    G.checkLevel();
    return true;
  };
  // Every early offer has a usable offensive choice; a nearly completed
  // synergy is not hidden behind pure randomness. The other slots stay random.
  G.options = function () {
    const g = G.g,
      eligible = TG.CARDS.filter(c => (g.levels[c.id] || 0) < c.cap),
      chosen = [];
    const offensive = new Set(['blade', 'echo', 'orbit', 'lantern']);
    function pick(pool) {
      const remaining = pool.filter(c => !chosen.includes(c.id));
      if (remaining.length) chosen.push(remaining[Math.floor(Math.random() * remaining.length)].id);
    }
    const finishers = eligible.filter(c =>
      TG.SYNERGIES.some(
        s =>
          !g.synergies[s.id] &&
          Object.prototype.hasOwnProperty.call(s.needs, c.id) &&
          Object.entries(s.needs).every(([id, n]) => (g.levels[id] || 0) + (id === c.id ? 1 : 0) >= n)
      )
    );
    pick(finishers);
    if (g.level <= 4 && !chosen.some(id => offensive.has(id)))
      pick(eligible.filter(c => offensive.has(c.id)));
    const rest = eligible.filter(c => !chosen.includes(c.id));
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    chosen.push(...rest.slice(0, Math.max(0, 3 - chosen.length)).map(c => c.id));
    for (let i = chosen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
    }
    return chosen;
  };
  G.checkLevel = function () {
    const g = G.g;
    if (!g || g.status !== 'playing') return false;
    if (g.bonusCards > 0) {
      g.bonusCards--;
    } else if (g.xp >= g.xpNeed) {
      g.xp -= g.xpNeed;
      g.level++;
      g.xpNeed = 12 + (g.level - 1) * 7;
    } else return false;
    g.offered = G.options();
    if (!g.offered.length) g.offered = ['rest'];
    g.offerToken = ++seq;
    g.status = 'cards';
    G.input.x = G.input.y = 0;
    G.onChange('cards');
    G.onSound('card');
    return true;
  };
  G.choose = function (id, token) {
    const g = G.g;
    if (
      !g ||
      g.status !== 'cards' ||
      token !== g.offerToken ||
      !g.offered.includes(id) ||
      (['chapter', 'story'].includes(g.mode) && !TG.store.canWrite())
    )
      return false;
    const p = g.p;
    if (id === 'rest') {
      p.hp = Math.min(p.maxHp, p.hp + 25);
    } else {
      const c = TG.CARDS.find(c => c.id === id);
      if (!c || (g.levels[id] || 0) >= c.cap) return false;
      g.levels[id] = (g.levels[id] || 0) + 1;
      const before = p.maxHp;
      G.rebuild();
      if (p.maxHp > before) p.hp = Math.min(p.maxHp, p.hp + p.maxHp - before);
      if (id === 'speed') p.hp = Math.min(p.maxHp, p.hp + 8);
      if (id === 'shield') {
        p.shield = Math.min(3, p.shield + 1);
        g.lastShield = g.time;
      }
    }
    g.learned.chosen = true;
    g.offered = [];
    g.status = 'playing';
    G.onChange('playing');
    G.checkLevel();
    return true;
  };
  function spark(x, y, color, count = 6) {
    const g = G.g;
    for (let i = 0; i < count && g.particles.length < 130; i++)
      g.particles.push({
        x,
        y,
        vx: rand(-80, 80),
        vy: rand(-80, 80),
        life: rand(0.2, 0.5),
        max: 0.5,
        color,
        size: rand(1, 3)
      });
  }
  function ring(x, y, r, color) {
    G.g.rings.push({ x, y, r, color, life: 0.5, max: 0.5 });
  }
  G.enemy = function (type, x, y) {
    const g = G.g;
    const b = type === 'boss',
      def = b
        ? { hp: [1000, 1650, 2400][g.stage], speed: 42, r: 27, art: [2, 5, 8][g.stage], behavior: 'boss' }
        : TG.ENEMY_DEFS[type];
    if (!def) throw Error('Unknown enemy');
    const e = {
      ...def,
      type,
      id: ++g.enemySeq,
      x,
      y,
      maxHp: def.hp,
      hp: def.hp,
      hit: 0,
      slow: 0,
      burn: 0,
      burnPower: 0,
      orbitHit: 0,
      frozen: 0,
      freezeCooldown: 0,
      action: 'approach',
      clock: 0,
      wait: b ? 2 : rand(0.7, 1.8),
      aimX: 0,
      aimY: 1,
      pulseRadius: [145, 220, 180][g.stage],
      phase: rand(0, TAU),
      bossPhase: 1,
      attackPhase: 1,
      attackCount: 0,
      attackVariant: 'axis'
    };
    if (g.storyTraining) {
      e.hp *= 1.4;
      e.maxHp = e.hp;
    }
    g.enemies.push(e);
    return e;
  };
  function spawn() {
    const g = G.g,
      w = TG.view?.width || 390,
      h = TG.view?.height || 844,
      a = rand(0, TAU);
    const mission = g.mode === 'story' && !g.storyTraining && g.storyBattle !== 'velaEscort';
    const radius = g.storyTraining
      ? Math.max(220, Math.min(w, h) * 0.58)
      : mission
        ? clamp(Math.min(w, h) * 0.72, 245, 310)
        : Math.hypot(w, h) * 0.52 + 50;
    const pool = g.storyTraining
      ? g.time < 30
        ? ['ghost', 'lost']
        : g.time < 60
          ? ['wolf', 'lost']
          : ['conductor', 'lost']
      : TG.STAGES[g.stage].enemies;
    const e = G.enemy(
      pool[Math.random() < 0.28 ? 1 : 0],
      g.p.x + Math.cos(a) * radius,
      g.p.y + Math.sin(a) * radius
    );
    if (mission) {
      e.hp = Math.ceil(e.hp * 1.12);
      e.maxHp = e.hp;
    }
    return e;
  }
  // ── Scripted story missions: swarm → guardians → hold the goal ──────────────
  // A short authored arc per mission. Each teaches one idea on top of the shared loop:
  //  · approach (첫 임무): dodge a leading charge, then hold a switch under encirclement.
  //  · escort (마레 동행): fan volleys you cannot fully dodge, so Mare's block and the
  //    4 s counter window after it become the answer; then hold the door against a chase.
  const MISSIONS = {
    approach: {
      gate: [180, -70],
      radius: 70,
      hold: 3.5,
      decay: 0.3,
      firstXp: 6,
      telegraph: 0.9,
      ghostSpeed: 1.25,
      houndHp: 52,
      swarm: {
        goal: 8,
        forceAt: 18,
        packs: [
          { kinds: ['ghost', 'ghost', 'ghost'] },
          { kinds: ['ghost', 'hound', 'ghost'] },
          // Later packs split to opposite sides so the player has to pick a lane, not just walk away.
          { kinds: ['ghost', 'ghost', 'ghost', 'ghost'], pincer: true },
          { kinds: ['hound', 'ghost', 'ghost', 'hound'], pincer: true }
        ]
      },
      guardians: {
        telegraph: 1.4,
        list: [
          {
            type: 'warden',
            at: [0, 0],
            hp: 210,
            label: '회선 수호자',
            tune: { windupTime: 1, chargeTime: 0.7, recoverWait: 1.1, lead: 0.55, chargeRange: 200 }
          }
        ],
        notice: '회선 수호자 출현 · 붉은 돌진선을 옆으로 피하거나 대시로 통과'
      },
      escort: { every: 5, kinds: ['ghost', 'ghost'] },
      siege: { kind: 'ring', radius: 170, trickle: 1.2, houndChance: 0.15 },
      siegeNotice: '스위치 작동 시작 · 잔향이 몰려옵니다 · 원 안에서 버티세요'
    },
    escort: {
      gate: [-175, 80],
      radius: 70,
      hold: 3,
      decay: 0.3,
      firstXp: null,
      telegraph: 0.9,
      ghostSpeed: 1.25,
      houndHp: 52,
      swarm: {
        goal: 6,
        forceAt: 14,
        packs: [
          { kinds: ['ghost', 'ghost', 'hound'] },
          { kinds: ['ghost', 'ghost', 'ghost', 'ghost'], pincer: true },
          { kinds: ['hound', 'ghost', 'ghost', 'hound'], pincer: true }
        ]
      },
      guardians: {
        telegraph: 1.4,
        list: [
          { type: 'witch', at: [-70, -55], hp: 160, label: '사격 잔향', tune: { volley: 7, spread: 0.15, shotSpeed: 175, holdRange: 120, recoverWait: 1.4 } },
          { type: 'witch', at: [70, 55], hp: 160, label: '사격 잔향', tune: { volley: 7, spread: 0.15, shotSpeed: 175, holdRange: 120, recoverWait: 1.4 } }
        ],
        notice: '사격 잔향 출현 · 부채꼴 사격은 마레가 한 번 막아 줍니다 · 막은 직후 반격하세요'
      },
      escort: { every: 4.5, kinds: ['ghost', 'hound'] },
      siege: { kind: 'chase', radius: 165, trickle: 1.1, houndChance: 0.25 },
      siegeNotice: '열차 문 개방 중 · 뒤쪽에서 추격 무리가 옵니다 · 문 앞에서 버티세요'
    },
    // Objective missions: the swarm guards a locked objective; clearing it unlocks the
    // terminal / relays, which carry their own hazard (beams / bell) while you work them.
    archive: {
      gate: [-195, 90],
      radius: 62,
      hold: 2,
      decay: 0.3,
      firstXp: null,
      telegraph: 0.9,
      ghostSpeed: 1.25,
      houndHp: 52,
      swarm: {
        goal: 7,
        forceAt: 16,
        packs: [
          { kinds: ['ghost', 'ghost', 'hound'] },
          { kinds: ['ghost', 'ghost', 'ghost', 'ghost'], pincer: true },
          { kinds: ['hound', 'ghost', 'ghost', 'hound'], pincer: true }
        ]
      },
      objective: 'record',
      objectiveNotice: '기록장치 개방 · 원 안에서 회전 광선을 피하며 3초 회수',
      escort: { every: 5, kinds: ['ghost', 'hound'] },
      siege: { kind: 'chase', radius: 170, trickle: 1.2, houndChance: 0.25 },
      siegeNotice: '기록을 노리는 추격 무리 · 열차 문 앞에서 버티세요'
    },
    snowMission: {
      gate: null,
      telegraph: 0.9,
      ghostSpeed: 1.2,
      houndHp: 60,
      swarm: {
        goal: 7,
        forceAt: 16,
        packs: [
          { kinds: ['wolf', 'passenger', 'wolf'] },
          { kinds: ['passenger', 'wolf', 'wolf', 'passenger'], pincer: true },
          { kinds: ['wolf', 'wolf', 'wolf'], pincer: false }
        ]
      },
      objective: 'relays',
      objectiveNotice: '중계기 개방 · 종소리 십자선을 피해 사분면에서 안정화하세요',
      escort: { every: 4.5, kinds: ['wolf', 'passenger'] }
    }
  };
  G.MISSIONS = MISSIONS;
  function missionScript(id) {
    return {
      mission: id,
      phase: 'swarm',
      packs: 0,
      kills: 0,
      pending: [],
      packClock: 0.8,
      escortClock: 0,
      guardianId: null,
      guardians: [],
      siege: false,
      siegeAngle: 0,
      trickle: 0
    };
  }
  function scriptReach() {
    const W = TG.view?.width || 390,
      H = TG.view?.height || 844;
    // Keep spawn points inside the visible play area (below the HUD, above the thumbs).
    return { rx: clamp(W / 2 - 40, 130, 220), ry: clamp(H / 2 - 190, 140, 230) };
  }
  function queueScript(s, type, x, y, time = 0.9, role = 'swarm', extra = null) {
    s.pending.push({ type, x, y, t: time, max: time, role, ...(extra || {}) });
  }
  function queuePack(g, s, cfg) {
    const { rx, ry } = scriptReach(),
      pack = cfg.swarm.packs[s.packs % cfg.swarm.packs.length],
      kinds = pack.kinds,
      base = rand(0, TAU);
    kinds.forEach((type, i) => {
      const a = pack.pincer
        ? base + (i % 2) * Math.PI + (i < 2 ? -0.25 : 0.25)
        : base + (i - (kinds.length - 1) / 2) * 0.5;
      queueScript(s, type, g.p.x + Math.cos(a) * rx, g.p.y + Math.sin(a) * ry, cfg.telegraph);
    });
    s.packs++;
    s.packClock = 0;
  }
  function scriptSpawn(g, s, point) {
    const cfg = MISSIONS[s.mission];
    // Never drop an enemy on top of the player: push the point outward instead.
    let dx = point.x - g.p.x,
      dy = point.y - g.p.y,
      d = len(dx, dy);
    if (d < 90) {
      const a = d > 1 ? Math.atan2(dy, dx) : rand(0, TAU);
      point.x = g.p.x + Math.cos(a) * 90;
      point.y = g.p.y + Math.sin(a) * 90;
    }
    const e = G.enemy(point.type, point.x, point.y);
    e.script = point.role;
    if (point.type === 'ghost') e.speed *= cfg.ghostSpeed;
    // Chargers live long enough to show (and use) their telegraphed charge.
    if ((point.type === 'hound' || point.type === 'wolf') && point.role !== 'guardian') {
      e.hp = e.maxHp = cfg.houndHp;
      e.windupTime = 0.95;
      e.wait = 0.4;
    }
    if (point.role === 'guardian') {
      const def = cfg.guardians.list[point.index];
      e.hp = e.maxHp = def.hp;
      Object.assign(e, def.tune);
      e.label = def.label;
      if (s.guardianId === null) s.guardianId = e.id;
      s.guardians.push(e.id);
      g.storyGate.guardIds.push(e.id);
      ring(e.x, e.y, 70, '#e7a2b6');
      G.onSound('boss');
    }
    spark(e.x, e.y, '#e7a2b6', 6);
    return e;
  }
  function scriptTick(dt) {
    const g = G.g,
      s = g.script;
    if (!s || g.status !== 'playing') return;
    const cfg = MISSIONS[s.mission];
    for (const point of s.pending) point.t -= dt;
    const ready = s.pending.filter(point => point.t <= 0);
    if (ready.length) {
      s.pending = s.pending.filter(point => point.t > 0);
      for (const point of ready)
        if (g.enemies.length < 24 || point.role === 'guardian') scriptSpawn(g, s, point);
    }
    const alive = role =>
      g.enemies.filter(e => e.script === role).length + s.pending.filter(p => p.role === role).length;
    if (s.phase === 'swarm') {
      s.packClock += dt;
      if ((s.kills >= cfg.swarm.goal || g.time >= cfg.swarm.forceAt) && !cfg.guardians) {
        // Objective missions: the cleared swarm unlocks the terminal / relays.
        s.phase = 'objective';
        s.escortClock = 0;
        G.notify(cfg.objectiveNotice);
      } else if (s.kills >= cfg.swarm.goal || g.time >= cfg.swarm.forceAt) {
        s.phase = 'guardian';
        s.escortClock = 0;
        cfg.guardians.list.forEach((def, index) =>
          queueScript(
            s,
            def.type,
            g.storyGate.x + def.at[0],
            g.storyGate.y + def.at[1],
            cfg.guardians.telegraph,
            'guardian',
            { index, label: def.label }
          )
        );
        G.notify(cfg.guardians.notice);
      } else if (s.packClock >= 4 || (s.packClock >= 0.8 && alive('swarm') <= 1)) queuePack(g, s, cfg);
    } else if (s.phase === 'guardian' || s.phase === 'objective') {
      s.escortClock += dt;
      // Noa's signal work in the snow mission spaces out the pressure while relays charge.
      const every = cfg.escort.every * (g.storyBattle === 'snowMission' && g.snowSignalHelp ? 1.25 : 1);
      if (s.escortClock >= every && alive('swarm') < 4) {
        s.escortClock = 0;
        const { rx, ry } = scriptReach(),
          a = rand(0, TAU);
        const kinds = cfg.escort.kinds;
        kinds.forEach((type, i) =>
          queueScript(
            s,
            type,
            g.p.x + Math.cos(a + (i ? 0.4 : -0.4)) * rx,
            g.p.y + Math.sin(a + (i ? 0.4 : -0.4)) * ry,
            cfg.telegraph
          )
        );
      }
    } else if (s.phase === 'switch') {
      const gate = g.storyGate,
        near = len(g.p.x - gate.x, g.p.y - gate.y) <= gate.r,
        siege = cfg.siege;
      if (near && !s.siege) {
        s.siege = true;
        s.trickle = 0;
        if (siege.kind === 'ring') {
          // Stepping onto the goal starts the climax: an encirclement with one open gap.
          const gap = Math.floor(rand(0, 8));
          for (let k = 0; k < 8; k++) {
            if (k === gap) continue;
            const a = (k * TAU) / 8;
            queueScript(
              s,
              k === (gap + 4) % 8 ? 'hound' : 'ghost',
              gate.x + Math.cos(a) * siege.radius,
              gate.y + Math.sin(a) * siege.radius,
              1,
              'siege'
            );
          }
        } else {
          // A chase: the pack comes up the corridor the player just walked, so they turn to face it.
          s.siegeAngle = Math.atan2(g.p.y - gate.y, g.p.x - gate.x);
          if (!Number.isFinite(s.siegeAngle)) s.siegeAngle = 0;
          for (let k = 0; k < 6; k++) {
            const a = s.siegeAngle + (k - 2.5) * 0.32;
            queueScript(
              s,
              k === 2 || k === 3 ? 'hound' : 'ghost',
              gate.x + Math.cos(a) * siege.radius,
              gate.y + Math.sin(a) * siege.radius,
              1,
              'siege'
            );
          }
        }
        G.notify(cfg.siegeNotice);
      }
      if (s.siege) {
        s.trickle += dt;
        if (s.trickle >= siege.trickle && alive('siege') < 9) {
          s.trickle = 0;
          const a = siege.kind === 'ring' ? rand(0, TAU) : s.siegeAngle + rand(-0.9, 0.9),
            reach = siege.kind === 'ring' ? 230 : siege.radius + 20;
          queueScript(
            s,
            Math.random() < siege.houndChance ? 'hound' : 'ghost',
            gate.x + Math.cos(a) * reach,
            gate.y + Math.sin(a) * reach,
            0.8,
            'siege'
          );
        }
      }
    }
  }
  function scriptKill(g, e) {
    const s = g.script;
    if (!s || !e.script) return;
    if (e.script === 'swarm' && s.phase === 'swarm') s.kills++;
    if (e.script === 'guardian' && s.phase === 'guardian') {
      const remaining = g.enemies.some(other => other !== e && other.script === 'guardian');
      if (remaining || s.pending.some(p => p.role === 'guardian')) return;
      s.phase = 'switch';
      // A short breather: escorts scatter so the walk to the goal is a reward, not a slog.
      for (const other of [...g.enemies])
        if (other.script === 'swarm' && len(other.x - e.x, other.y - e.y) < 260) {
          other.hp = 0;
          kill(other);
        }
      s.pending = s.pending.filter(p => p.role !== 'swarm');
      ring(e.x, e.y, 120, '#f0d49c');
    }
  }
  function waveTick(dt) {
    const g = G.g;
    if (g.script) {
      g.wave = null;
      return;
    }
    if (g.bossSpawned || g.time >= (g.mode === 'story' ? g.duration - 5 : g.duration * 0.6)) {
      g.wave = null;
      return;
    }
    if (g.wave) {
      g.wave.remaining -= dt;
      if (g.wave.remaining > 0) return;
      for (const point of g.wave.points)
        if (g.enemies.length < 65 && len(point.x - g.p.x, point.y - g.p.y) >= 80)
          G.enemy(point.type, point.x, point.y);
      g.wave = null;
      g.nextWave = g.time + (g.storyTraining ? 18 : 38);
      g.waveRestUntil = g.time + 2;
      g.waveIndex++;
      return;
    }
    if (g.time < g.nextWave || g.enemies.length > 56) return;
    const radius = clamp(Math.min(TG.view?.width || 390, TG.view?.height || 844) * 0.38, 140, 240),
      points = [];
    const rotation = (g.waveIndex * Math.PI) / 2,
      add = (type, x, y) => {
        points.push({
          type,
          x: g.p.x + x * Math.cos(rotation) - y * Math.sin(rotation),
          y: g.p.y + x * Math.sin(rotation) + y * Math.cos(rotation)
        });
      };
    let name, hint;
    if (g.storyTraining) {
      const drill = g.waveIndex % 3;
      if (drill === 0) {
        name = '지휘 연습 · 돌격 포위';
        hint = '열린 틈으로 이동 · 방패나 서리로 돌격 대비';
        for (let k = 1; k <= 6; k++) {
          const a = (k * TAU) / 8;
          add(k % 3 === 0 ? 'wolf' : 'ghost', Math.cos(a) * radius, Math.sin(a) * radius);
        }
      } else if (drill === 1) {
        name = '지휘 연습 · 사격과 추격';
        hint = '사격 예고를 보고 측면 이동 · 밀어내기와 반격 활용';
        for (const offset of [-85, 0, 85]) add('lost', offset, -radius);
        add('wolf', 0, radius);
      } else {
        name = '지휘 연습 · 방패 뒤의 통로';
        hint = '수호자를 피해 경험치 회수 · 보호 직후 공격 연계';
        add('warden', 0, -radius);
        for (const side of [-1, 1]) {
          add('ghost', side * radius, 40);
          add('wolf', side * radius, -65);
        }
      }
    } else if (g.stage === 0) {
      name = '거울의 포위';
      hint = '열린 틈으로 이동하거나 망령을 이어서 격파';
      for (let k = 1; k <= 6; k++) {
        const a = (k * TAU) / 8;
        add('ghost', Math.cos(a) * radius, Math.sin(a) * radius);
      }
    } else if (g.stage === 1) {
      name = '설원의 협공';
      hint = '양옆의 돌격을 피해 빈 통로로 이동';
      for (const side of [-1, 1]) for (const offset of [-55, 55]) add('wolf', side * radius, offset);
    } else {
      name = '종착의 사격선';
      hint = '원거리 적을 먼저 끊거나 측면으로 이탈';
      for (const offset of [-90, 0, 90]) add('lost', offset, -radius);
      add('conductor', 0, radius);
    }
    g.wave = { name, hint, points, remaining: 2 };
    G.notify(name + ' · ' + hint);
  }
  function refreshBossPhase(e) {
    if (e.type === 'boss' && e.hp > 0 && e.hp <= e.maxHp * 0.5 && e.bossPhase !== 2) {
      e.bossPhase = 2;
      if (G.g.status !== 'command') G.notify(TG.STAGES[G.g.stage].boss + ' · 기록 붕괴 · 두 번째 패턴');
      ring(e.x, e.y, 70, '#edb893');
    }
  }
  function kill(e) {
    const g = G.g;
    const i = g.enemies.indexOf(e);
    if (i < 0) return;
    g.enemies.splice(i, 1);
    g.kills++;
    if (g.mode === 'story' && g.storyGate?.guardIds.includes(e.id) && !g.storyGate.defeated.includes(e.id)) {
      g.storyGate.defeated.push(e.id);
      if (g.storyGate.defeated.length === g.storyGate.guardIds.length)
        G.notify(
          g.storyGate.kind === 'approach'
            ? '회선 수호자 격파 · 금빛 스위치로 이동'
            : '귀환로 확보 · 열차 문으로 이동'
        );
    }
    scriptKill(g, e);
    if (e.elite && g.eliteDrops.length < 4) g.eliteDrops.push({ id: e.id, x: e.x, y: e.y, life: 18 });
    if (
      e.type !== 'boss' &&
      (g.status === 'playing' || (castingCommand && g.status === 'command')) &&
      g.overcharge <= 0
    ) {
      g.chain = (g.chainTime > 0 ? g.chain : 0) + (e.elite ? 2 : 1);
      g.chainTime = 3;
      if (g.chain >= 8) {
        g.chain = 0;
        g.chainTime = 0;
        g.overcharge = 6;
        ring(g.p.x, g.p.y, 105, '#f3d285');
        if (!castingCommand) G.notify('랜턴 과충전 · 6초 동안 공격 간격 25% 감소 · 수집 범위 50% 증가');
        G.onSound('card');
      }
    }
    if (e.type === 'boss') g.bossDefeated = true;
    const n = e.type === 'boss' ? 12 : e.elite ? 5 : 1;
    if (g.mode !== 'story') g.shards += e.type === 'boss' ? 20 : e.elite ? 5 : 1;
    for (let j = 0; j < n && g.drops.length < 180; j++)
      g.drops.push({ x: e.x + rand(-20, 20), y: e.y + rand(-20, 20), value: e.type === 'boss' ? 3 : 1 });
    spark(e.x, e.y, e.type === 'boss' ? '#e5c68f' : '#a7cfdf', e.type === 'boss' ? 22 : 5);
    if (e.type === 'boss') G.onSound('boss');
  }
  G.hitEnemy = function (e, amount, burn = false) {
    const g = G.g;
    if (
      !g ||
      !(g.status === 'playing' || (castingCommand && g.status === 'command')) ||
      !g.enemies.includes(e)
    )
      return;
    e.hp -= amount;
    e.hit = 0.12;
    if (burn) {
      e.burn = 2;
      e.burnPower = 3 * (g.levels.ember || 1);
    }
    if (e.hp <= 0) kill(e);
    else refreshBossPhase(e);
  };
  G.damage = function (amount) {
    const g = G.g;
    if (
      !g ||
      g.status !== 'playing' ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      g.dash.invulnerable ||
      g.time - g.lastHit < 0.78
    )
      return false;
    const p = g.p;
    if (p.hp <= 0) {
      G.finish(false, 'death');
      return false;
    }
    g.lastHit = g.time;
    if (g.mode === 'story' && g.mare && g.mare.cooldown <= 0) {
      const m = g.mare;
      m.cooldown = m.maxCooldown;
      m.pulse = 0.7;
      m.protected++;
      if (g.commands && g.commandEffects) g.commandEffects.guardWindow = 4;
      ring(p.x, p.y, 44, '#a5e2ed');
      ring(m.x, m.y, 30, '#a5e2ed');
      G.notify('마레의 보호 · 피해 1회 차단');
      G.onSound('card');
      return true;
    }
    g.shake = TG.store.data.settings.reduceFX ? 0 : 5;
    if (p.shield) {
      p.shield--;
      if (g.mode === 'story' && g.mare && g.commands && g.commandEffects) g.commandEffects.guardWindow = 4;
      spark(p.x, p.y, '#a5e2ed', 12);
    } else {
      const reduction = 1 - (1 - 0.07 * (g.levels.ward || 0)) * (g.synergies.warmHeart ? 0.9 : 1),
        ward = g.mode === 'story' && g.commands && g.commandEffects?.ward > 0 ? 0.5 : 1;
      p.hp = Math.max(0, p.hp - amount * (1 - reduction) * ward);
      g.flash = TG.store.data.settings.reduceFX ? 0 : 0.18;
      spark(p.x, p.y, '#db98ac', 8);
    }
    G.onSound('hurt');
    if (p.hp <= 0) G.finish(false, 'death');
    return true;
  };
  function shot(e, a, speed = 125) {
    const g = G.g;
    if (g.hostile.length >= 70) return;
    g.hostile.push({
      x: e.x,
      y: e.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 4,
      r: 5,
      damage: 12
    });
  }
  function enemyTick(dt) {
    const g = G.g,
      p = g.p;
    for (const e of [...g.enemies]) {
      if (g.status !== 'playing') return;
      e.hit = Math.max(0, e.hit - dt);
      e.slow = Math.max(0, e.slow - dt);
      e.wait -= dt;
      e.orbitHit -= dt;
      if (e.burn > 0) {
        e.burn -= dt;
        G.hitEnemy(e, e.burnPower * dt);
        if (!g.enemies.includes(e)) continue;
      }
      e.freezeCooldown = Math.max(0, e.freezeCooldown - dt);
      if (e.frozen > 0) {
        e.frozen = Math.max(0, e.frozen - dt);
        continue;
      }
      refreshBossPhase(e);
      let dx = p.x - e.x,
        dy = p.y - e.y,
        d = len(dx, dy) || 1,
        vx = dx / d,
        vy = dy / d,
        speed = e.speed;
      if (e.action === 'windup') {
        speed = 0;
        e.clock -= dt;
        if (e.clock <= 0) {
          if (e.behavior === 'charge') {
            e.action = 'charge';
            e.clock = e.chargeTime || 0.52;
          } else if (e.behavior === 'ranged') {
            const aim = Math.atan2(e.aimY, e.aimX);
            if (e.volley) {
              // Scripted fan volley: too wide to fully sidestep, so protection matters.
              for (let k = 0; k < e.volley; k++)
                shot(e, aim + (k - (e.volley - 1) / 2) * (e.spread || 0.2), e.shotSpeed || 125);
            } else {
              shot(e, aim);
              if (e.elite) {
                shot(e, aim + 0.25);
                shot(e, aim - 0.25);
              }
            }
            e.action = 'recover';
            e.clock = 0.7;
          } else {
            if (g.stage === 0) {
              if (d < e.pulseRadius + 15) G.damage(18);
              ring(e.x, e.y, e.pulseRadius, '#e1a0c2');
              if (e.attackPhase === 2 && g.aftershocks.length < 3)
                g.aftershocks.push({
                  x: e.x,
                  y: e.y,
                  r: e.pulseRadius * 0.75,
                  age: 0,
                  warning: 1,
                  life: 1.25,
                  damage: 18,
                  triggered: false
                });
            } else if (g.stage === 1) {
              const rx = e.attackVariant === 'diagonal' ? (dx + dy) / Math.SQRT2 : dx,
                ry = e.attackVariant === 'diagonal' ? (dy - dx) / Math.SQRT2 : dy;
              if ((Math.abs(rx) < 23 && Math.abs(ry) < 220) || (Math.abs(ry) < 23 && Math.abs(rx) < 220))
                G.damage(21);
              ring(e.x, e.y, 65, '#d6eaf1');
            } else {
              const aim = Math.atan2(e.aimY, e.aimX);
              const count = e.attackPhase === 2 ? 16 : 12;
              for (let k = 0; k < count; k++)
                if (k !== 0 && k !== 1 && k !== count - 1)
                  shot(e, aim + (k * TAU) / count, e.attackPhase === 2 ? 150 : 135);
              ring(e.x, e.y, 180, '#dcc28e');
            }
            e.action = 'recover';
            e.clock = 1;
          }
        }
      } else if (e.action === 'charge') {
        vx = e.aimX;
        vy = e.aimY;
        speed = e.elite ? 270 : 330;
        e.clock -= dt;
        if (e.clock <= 0) {
          e.action = 'recover';
          e.clock = 0.9;
          speed = 0;
        }
      } else if (e.action === 'recover') {
        speed = 0;
        e.clock -= dt;
        if (e.clock <= 0) {
          e.action = 'approach';
          e.wait = e.behavior === 'boss' ? (e.bossPhase === 2 ? 2.2 : 2.8) : e.recoverWait || 1.7;
        }
      } else {
        if (e.behavior === 'ranged' && d < (e.holdRange ?? 200)) speed = -15;
        if (
          e.wait <= 0 &&
          ((e.behavior === 'charge' && d < (e.chargeRange || 260)) ||
            (e.behavior === 'ranged' && d < 350) ||
            (e.behavior === 'boss' && d < 250))
        ) {
          e.action = 'windup';
          if (e.type === 'boss') {
            e.attackPhase = e.bossPhase;
            e.attackCount++;
            e.attackVariant = g.stage === 1 && e.attackPhase === 2 && e.attackCount % 2 ? 'diagonal' : 'axis';
          }
          e.clock =
            e.behavior === 'boss'
              ? [1.35, 1.6, 1.7][g.stage]
              : e.behavior === 'charge'
                ? e.windupTime || 0.75
                : 1;
          e.aimX = vx;
          e.aimY = vy;
          speed = 0;
          if (e.lead) {
            const tx = dx + G.input.x * p.speed * e.lead,
              ty = dy + G.input.y * p.speed * e.lead,
              tl = len(tx, ty) || 1;
            e.aimX = tx / tl;
            e.aimY = ty / tl;
          }
        }
      }
      const slow = e.slow > 0 ? 1 - (p.slow || 0.35) : 1;
      e.x += vx * speed * slow * dt;
      e.y += vy * speed * slow * dt;
      if (len(p.x - e.x, p.y - e.y) < e.r + 14)
        G.damage(
          e.type === 'boss'
            ? 18
            : e.action === 'charge'
              ? 14
              : g.mode === 'story' && !g.storyTraining && g.storyBattle !== 'velaEscort'
                ? 6
                : 9
        );
      if (g.status !== 'playing') return;
      if (p.orbit > 0 && e.orbitHit <= 0)
        for (let k = 0; k < p.orbit; k++) {
          const a = g.time * 2.4 + (k * TAU) / p.orbit;
          if (len(e.x - p.x - Math.cos(a) * 65, e.y - p.y - Math.sin(a) * 65) < e.r + 14) {
            G.hitEnemy(e, 14 * (g.synergies.frostOrbit && e.slow > 0 ? 1.3 : 1));
            if (g.synergies.frostOrbit) {
              e.slow = 1.5;
              if (e.type !== 'boss' && e.freezeCooldown <= 0) {
                e.frozen = 0.45;
                e.freezeCooldown = 3;
                ring(e.x, e.y, 25, '#aee5fb');
              }
            }
            e.orbitHit = 0.4;
            break;
          }
        }
    }
  }
  function fire() {
    const g = G.g,
      p = g.p;
    let e = null,
      best = 650;
    for (const v of g.enemies) {
      const d = len(v.x - p.x, v.y - p.y);
      if (d < best) {
        best = d;
        e = v;
      }
    }
    if (!e) return;
    const angle = Math.atan2(e.y - p.y, e.x - p.x);
    for (let i = 0; i < p.projectiles && g.bullets.length < 100; i++) {
      const a = angle + (i - Math.floor(p.projectiles / 2)) * 0.15;
      g.bullets.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * 500,
        vy: Math.sin(a) * 500,
        life: 1.4,
        damage:
          p.attack *
          (i === Math.floor(p.projectiles / 2) ? 1 : 0.7) *
          (g.synergies.echoBlade && i === Math.floor(p.projectiles / 2) ? 1.3 : 1) *
          (Math.random() < p.crit ? 1.7 : 1),
        pierce: p.pierce,
        echo: g.synergies.echoBlade && i === Math.floor(p.projectiles / 2),
        echoSpent: false,
        hit: new Set()
      });
    }
    G.onSound('shot');
  }
  function hazardTick(dt) {
    const g = G.g;
    g.hazardClock += dt;
    if (g.time > 35) {
      g.erase = clamp(g.erase + dt * (0.12 + g.stage * 0.035), 0, 100);
    }
    if (g.erase >= 15 && g.hazardClock > Math.max(5, 12 - g.erase * 0.06)) {
      g.hazardClock = 0;
      const a = rand(0, TAU),
        d = rand(40, 155);
      if (g.hazards.length < 2)
        g.hazards.push({
          x: g.p.x + Math.cos(a) * d,
          y: g.p.y + Math.sin(a) * d,
          r: 58,
          age: 0,
          warning: 2,
          life: 5
        });
    }
    for (const h of g.hazards) {
      h.age += dt;
      if (h.age >= h.warning && len(g.p.x - h.x, g.p.y - h.y) < h.r + 12) G.damage(10);
    }
    g.hazards = g.hazards.filter(h => h.age < h.life);
  }
  function encounterTick(dt) {
    const g = G.g,
      p = g.p;
    for (let i = g.eliteDrops.length - 1; i >= 0; i--) {
      const item = g.eliteDrops[i];
      item.life -= dt;
      if (item.life <= 0) {
        g.eliteDrops.splice(i, 1);
        continue;
      }
      if (len(p.x - item.x, p.y - item.y) < 24) {
        g.eliteDrops.splice(i, 1);
        p.hp = Math.min(p.maxHp, p.hp + 12);
        g.overcharge = Math.max(g.overcharge, 3);
        g.chain = 0;
        g.chainTime = 0;
        ring(p.x, p.y, 70, '#f3d285');
        G.notify('정예의 불씨 · 체력 최대 12 회복 · 3초 과충전');
        G.onSound('card');
      }
    }
    for (const shock of g.aftershocks) {
      shock.age += dt;
      if (!shock.triggered && shock.age >= shock.warning) {
        shock.triggered = true;
        if (len(p.x - shock.x, p.y - shock.y) < shock.r + 14) G.damage(shock.damage);
        if (g.status !== 'playing') break;
      }
    }
    g.aftershocks = g.aftershocks.filter(s => s.age < s.life);
  }
  // An optional, stationary risk/reward detour before the manager arrives.
  // Experience joins the normal level queue at the end of this update.
  function anchorTick(dt) {
    const g = G.g;
    if (g.mode !== 'chapter') {
      g.memoryAnchor = null;
      return;
    }
    if (g.bossSpawned || g.time >= g.duration * 0.6) {
      g.memoryAnchor = null;
      g.anchorSeen = true;
      return;
    }
    if (!g.anchorSeen && g.time >= 45) {
      const angle = rand(0, TAU),
        radiusX = Math.min(145, (TG.view?.width || 390) * 0.32),
        radiusY = Math.min(165, (TG.view?.height || 844) * 0.2);
      g.anchorSeen = true;
      g.memoryAnchor = {
        x: g.p.x + Math.cos(angle) * radiusX,
        y: g.p.y + Math.sin(angle) * radiusY,
        remaining: 18,
        charge: 0,
        required: 1.2,
        r: 42,
        xp: clamp(Math.ceil(g.xpNeed * 0.5), 8, 24)
      };
      G.notify('기억 등불 발견 · 원 안에서 1.2초 머물러 회수하세요');
      return;
    }
    const anchor = g.memoryAnchor;
    if (!anchor) return;
    anchor.remaining = Math.max(0, anchor.remaining - dt);
    if (anchor.remaining <= 0) {
      g.memoryAnchor = null;
      return;
    }
    anchor.charge = clamp(
      anchor.charge + (len(g.p.x - anchor.x, g.p.y - anchor.y) <= anchor.r ? dt : -dt * 0.5),
      0,
      anchor.required
    );
    if (anchor.charge < anchor.required) return;
    g.xp += anchor.xp;
    g.erase = Math.max(0, g.erase - 10);
    g.learned.collected = true;
    g.memoryAnchor = null;
    ring(anchor.x, anchor.y, 75, '#f3d285');
    G.notify('기억 등불 회수 · 경험치 +' + anchor.xp + ' · 소거 위험 최대 10 감소');
    G.onSound('card');
  }
  // ── Station hazards for the later story missions ───────────────────────────
  // Each mission adds one readable, dodgeable threat tied to its objective:
  //  · archive: two beams rotate around the record terminal while you recover it,
  //    so you circle inside the ring instead of standing on the terminal.
  //  · snow relays: a bell strikes in a cross (then a diagonal) centred on the relay,
  //    so the safe place is a quadrant, never the middle.
  const RECORD_TIME = 3;
  const SWEEP = { speed: 1.35, width: 0.36, extra: 45, warmup: 1, damage: 12, drain: 0.6 };
  const BELL = { idle: 2.6, warning: 1.2, reach: 170, half: 24, damage: 16, drain: 0.5 };
  G.SWEEP = SWEEP;
  G.BELL = BELL;
  function sweepTick(dt) {
    const g = G.g,
      r = g.recordTarget;
    if (g.mode !== 'story' || g.storyTraining || !r || r.recovered || sealed(g)) {
      g.sweep = null;
      return;
    }
    const d = len(g.p.x - r.x, g.p.y - r.y);
    if (!g.sweep) {
      if (d > 170) return;
      g.sweep = { x: r.x, y: r.y, angle: rand(0, TAU), reach: r.r + SWEEP.extra, warmup: SWEEP.warmup, hits: 0 };
      G.notify('기록장치 방어 광선 · 원 안에서 붉은 광선을 피해 도세요');
    }
    const s = g.sweep;
    s.angle = (s.angle + SWEEP.speed * dt) % TAU;
    if (s.warmup > 0) {
      s.warmup -= dt;
      return;
    }
    if (d > s.reach || g.dash.invulnerable) return;
    const a = Math.atan2(g.p.y - s.y, g.p.x - s.x);
    for (const beam of [s.angle, s.angle + Math.PI]) {
      const diff = Math.abs((((a - beam) % TAU) + TAU * 1.5) % TAU - Math.PI);
      if (diff >= SWEEP.width / 2) continue;
      if (G.damage(SWEEP.damage)) {
        s.hits++;
        r.charge = Math.max(0, r.charge - SWEEP.drain);
      }
      break;
    }
  }
  function bellTick(dt) {
    const g = G.g;
    if (g.mode !== 'story' || g.storyTraining || g.storyBattle !== 'snowMission') {
      g.bell = null;
      return;
    }
    const r = (g.signalTargets || []).find(x => !x.recovered);
    if (!r || sealed(g)) {
      g.bell = null;
      return;
    }
    if (!g.bell) {
      if (len(g.p.x - r.x, g.p.y - r.y) > 160) return;
      g.bell = { x: r.x, y: r.y, clock: 1.2, warning: 0, diagonal: false, hits: 0, dodged: 0 };
      G.notify('종소리 예고 · 중계기 십자선 밖 사분면으로 비켜서세요');
    }
    const b = g.bell;
    b.x = r.x;
    b.y = r.y;
    if (b.warning > 0) {
      b.warning = Math.max(0, b.warning - dt);
      if (b.warning > 0) return;
      let rx = g.p.x - b.x,
        ry = g.p.y - b.y;
      if (b.diagonal) [rx, ry] = [(rx + ry) / Math.SQRT2, (ry - rx) / Math.SQRT2];
      const struck =
        len(rx, ry) < BELL.reach && (Math.abs(rx) < BELL.half || Math.abs(ry) < BELL.half) && !g.dash.invulnerable;
      if (struck && G.damage(BELL.damage)) {
        b.hits++;
        r.charge = Math.max(0, r.charge - BELL.drain);
      } else if (!struck) b.dodged++;
      ring(b.x, b.y, 70, '#e8789a');
      b.diagonal = !b.diagonal;
      b.clock = BELL.idle;
      return;
    }
    b.clock -= dt;
    if (b.clock <= 0) b.warning = BELL.warning;
  }
  // A scripted objective stays sealed while its swarm is still on the platform.
  const sealed = g => g.script?.phase === 'swarm';
  function recordTick(dt) {
    const g = G.g,
      r = g.recordTarget;
    if (g.mode !== 'story' || g.storyTraining || !r || r.recovered) return;
    if (sealed(g)) {
      r.charge = 0;
      return;
    }
    const close = len(g.p.x - r.x, g.p.y - r.y) <= r.r;
    r.charge = clamp(r.charge + (close ? dt : -dt * 0.55), 0, r.needed);
    if (r.charge >= r.needed) {
      r.recovered = true;
      if (g.script) g.script.phase = 'switch';
      ring(r.x, r.y, 76, '#9ae1f5');
      G.notify('기록 확보 · 금빛 열차 문으로 귀환하세요');
      G.onSound('card');
    }
  }
  function storyGateTick(dt) {
    const g = G.g,
      gate = g.storyGate;
    if (g.mode !== 'story' || g.storyTraining || !gate || gate.done || g.status !== 'playing') return;
    const ready =
      gate.kind === 'archive'
        ? g.recordTarget?.recovered === true
        : gate.guardIds.length > 0 && gate.defeated.length === gate.guardIds.length;
    if (!ready) {
      gate.charge = 0;
      return;
    }
    const near = len(g.p.x - gate.x, g.p.y - gate.y) <= gate.r;
    gate.charge = clamp(gate.charge + (near ? dt : -dt * (gate.decay || 0.55)), 0, gate.needed);
    if (gate.charge >= gate.needed) {
      gate.done = true;
      ring(gate.x, gate.y, 75, '#f0d49c');
      G.notify(
        gate.kind === 'approach'
          ? '안내 회선 복구 완료'
          : gate.kind === 'escort'
            ? '열차 통로 확보 완료'
            : '기록과 함께 귀환 완료'
      );
      G.finish(true, 'objective');
    }
  }
  function snowTargetTick(dt) {
    const g = G.g;
    if (g.mode !== 'story' || g.storyTraining || g.storyBattle !== 'snowMission') return;
    for (const r of g.signalTargets) {
      if (r.recovered) continue;
      if (sealed(g)) {
        r.charge = 0;
        continue;
      }
      const near = len(g.p.x - r.x, g.p.y - r.y) <= r.r;
      r.charge = clamp(r.charge + (near ? dt : -dt * 0.55), 0, r.needed);
      if (r.charge >= r.needed) {
        r.recovered = true;
        ring(r.x, r.y, 72, '#a1edf3');
        G.notify(r.name + ' 회수 완료');
        G.onSound('card');
      }
    }
    if (g.signalTargets.length && g.signalTargets.every(a => a.recovered)) {
      G.notify('설원역 목표 완료');
      G.finish(true, 'objective');
    }
  }
  function storyPressureTick(dt) {
    const g = G.g,
      q = g.storyPressure;
    if (g.mode !== 'story' || g.storyTraining || !q || g.status !== 'playing') return;
    q.cooldown = Math.max(0, q.cooldown - dt);
    if (q.warning > 0) {
      q.warning = Math.max(0, q.warning - dt);
      if (q.warning === 0) {
        q.pulses++;
        if (len(g.p.x - q.x, g.p.y - q.y) < q.r && !g.dash.invulnerable) {
          const hp = g.p.hp,
            shield = g.p.shield,
            protectedCount = g.mare?.protected || 0;
          G.damage(14);
          if (g.p.hp < hp || g.p.shield < shield || (g.mare?.protected || 0) > protectedCount) q.hits++;
        } else {
          q.dodges++;
          G.notify('침식 파동 회피 · 계속 이동하세요');
        }
        ring(q.x, q.y, q.r, '#d8a0af');
        q.cooldown = 6;
        q.idle = 0;
      }
      return;
    }
    // Holding a scripted goal is deliberate standing, not idling.
    const holding =
      g.script?.phase === 'switch' && len(g.p.x - g.storyGate.x, g.p.y - g.storyGate.y) <= g.storyGate.r;
    if (g.moving || q.cooldown > 0 || holding) {
      q.idle = 0;
      return;
    }
    q.idle += dt;
    if (q.idle >= 3.5) {
      q.x = g.p.x;
      q.y = g.p.y;
      q.idle = 0;
      q.warning = 1.4;
      G.notify('침식 파동 예고 · 붉은 원 밖으로 이동하세요');
    }
  }
  function patientTick(dt) {
    const g = G.g,
      pt = g.patient;
    if (
      g.mode !== 'story' ||
      g.storyTraining ||
      g.storyBattle !== 'velaEscort' ||
      !pt ||
      g.status !== 'playing'
    )
      return;
    const dx = g.p.x - pt.x,
      dy = g.p.y - pt.y,
      distance = len(dx, dy);
    if (pt.phase === 'stabilize') {
      if (distance < 85) {
        pt.charge = Math.min(pt.needed, pt.charge + dt);
        const medic = g.allies.find(a => a.id === 'vela');
        if (medic) {
          medic.carePose = 0.4;
          medic.x = pt.x + 24;
          medic.y = pt.y + 5;
        }
      } else pt.charge = Math.max(0, pt.charge - dt * 0.25);
      if (pt.charge >= pt.needed) {
        pt.phase = 'escort';
        ring(pt.x, pt.y, 55, '#99dab1');
        G.notify('환자가 스스로 일어섰습니다 · 객차까지 호위하세요');
      }
    } else if (pt.phase === 'escort') {
      if (distance < 175 && distance > 37) {
        const step = Math.min(135 * dt, distance - 37);
        pt.x = advance(pt.x, (dx / distance) * step);
        pt.y = advance(pt.y, (dy / distance) * step);
        pt.pose = 0.4;
      } else pt.pose = 0;
      if (
        len(pt.x - g.trainExit.x, pt.y - g.trainExit.y) < g.trainExit.r &&
        len(g.p.x - g.trainExit.x, g.p.y - g.trainExit.y) < 125
      ) {
        pt.phase = 'boarded';
        pt.saved = true;
        ring(g.trainExit.x, g.trainExit.y, 75, '#f2da97');
        G.notify('구조 성공 · 환자가 객차에 탑승했습니다');
        G.finish(true, 'patient');
        return;
      }
    }
    // A visible warning precedes every patient-directed attack. Protection has priority over damage.
    if (pt.warning > 0) {
      pt.warning = Math.max(0, pt.warning - dt);
      if (pt.warning === 0) {
        const m = g.mare;
        if (pt.shield > 0) {
          pt.shield--;
          pt.mareBlocks++;
          ring(pt.x, pt.y, 52, '#d9ba80');
          G.notify('마레의 방패 · 환자를 향한 공격 차단');
        } else if (m && m.cooldown <= 0 && len(m.x - pt.x, m.y - pt.y) < 160) {
          m.cooldown = m.maxCooldown;
          m.pulse = 0.8;
          m.protected++;
          m.x = pt.x - 26;
          m.y = pt.y - 8;
          pt.mareBlocks++;
          ring(pt.x, pt.y, 58, '#e8c48e');
          spark(pt.x - 15, pt.y - 10, '#f4d39b', 8);
          G.notify('마레가 몸으로 공격을 가로막았습니다');
        } else {
          pt.hp = Math.max(0, pt.hp - 20);
          pt.pose = 1;
          ring(pt.x, pt.y, 38, '#d58f9b');
          G.notify('환자가 공격당했습니다 · 벨라의 치료가 필요합니다');
          if (pt.hp <= 0) {
            G.finish(false, 'patient');
            return;
          }
        }
      }
    } else {
      pt.threatClock += dt;
      if (pt.threatClock >= 4.2) {
        pt.threatClock = 0;
        pt.warning = 1.6;
        G.notify('위험 · 환자를 향한 공격이 예고됩니다');
      }
    }
  }
  function allyTick(dt) {
    const g = G.g;
    if (g.mode !== 'story' || !g.allies?.length) return;
    for (let i = 0; i < g.allies.length; i++) {
      const a = g.allies[i],
        angle = ((i + 0.7) * Math.PI * 2) / 3,
        dx = g.p.x + Math.cos(angle) * 65 - a.x,
        dy = g.p.y + Math.sin(angle) * 65 - a.y,
        step = 1 - Math.exp(-6 * dt);
      a.moving = Math.hypot(dx, dy) > 2 && dt > 0;
      if (a.moving) {
        a.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 0 : 2;
        a.x = advance(a.x, dx * step);
        a.y = advance(a.y, dy * step);
      }
      a.pulse = Math.max(0, a.pulse - dt);
      a.cooldown = Math.max(0, a.cooldown - dt);
      if (a.cooldown > 0 || dt <= 0) continue;
      const target = g.enemies
        .filter(e => Math.hypot(e.x - a.x, e.y - a.y) < 270)
        .sort((x, y) => Math.hypot(x.x - a.x, x.y - a.y) - Math.hypot(y.x - a.x, y.y - a.y))[0];
      let used = false;
      if (a.id === 'aster' && target) {
        G.hitEnemy(target, Math.max(4, g.p.attack * 0.6));
        used = true;
      }
      if (a.id === 'noa' && g.hostile.some(b => Math.hypot(b.x - g.p.x, b.y - g.p.y) < 140)) {
        g.hostile = g.hostile.filter(b => Math.hypot(b.x - g.p.x, b.y - g.p.y) >= 140);
        used = true;
      }
      if (a.id === 'vela' && g.p.hp < g.p.maxHp) {
        g.p.hp = Math.min(g.p.maxHp, g.p.hp + 5);
        used = true;
      }
      if (a.id === 'iris' && target) {
        target.slow = Math.max(target.slow, 1.5);
        used = true;
      }
      if (a.id === 'crow' && target) {
        G.hitEnemy(target, Math.max(4, g.p.attack * 0.5), true);
        used = true;
      }
      if (used) {
        a.cooldown = a.id === 'vela' ? 12 : 9;
        a.pulse = 0.55;
        ring(a.x, a.y, 35, TG.PARTY.find(x => x.id === a.id)?.color || '#b6d2e0');
      }
    }
  }
  function mareTick(dt) {
    const g = G.g,
      m = g.mare;
    if (!m) return;
    m.cooldown = Math.max(0, m.cooldown - dt);
    m.pulse = Math.max(0, m.pulse - dt);
    const dx = g.p.x - 45 - m.x,
      dy = g.p.y + 30 - m.y,
      distance = len(dx, dy),
      step = 1 - Math.exp(-8 * dt);
    m.moving = distance > 2 && dt > 0;
    if (m.moving) {
      m.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 0 : 2;
      m.x = advance(m.x, dx * step);
      m.y = advance(m.y, dy * step);
    }
  }
  G.update = function (delta) {
    const g = G.g;
    if (!g || g.status !== 'playing') return;
    const dt = clamp(delta, 0, 0.04),
      p = g.p;
    g.overcharge = Math.max(0, g.overcharge - dt);
    g.chainTime = Math.max(0, g.chainTime - dt);
    if (g.chainTime === 0) g.chain = 0;
    g.time += dt;
    g.totalTime += dt;
    g.flash = Math.max(0, g.flash - dt);
    g.shake = Math.max(0, g.shake - 25 * dt);
    if (g.toast) g.toast.life -= dt;
    if (g.mode === 'story' && g.commands) {
      TG.commandDeck.tick(g.commands, dt * (g.storyTraining ? 1 : 1.5));
      cycleStaleCards(g, dt);
      g.commandEffects.guardWindow = Math.max(0, g.commandEffects.guardWindow - dt);
      g.commandEffects.ward = Math.max(0, g.commandEffects.ward - dt);
      if (g.teamwork) {
        g.teamwork.window = Math.max(0, g.teamwork.window - dt);
        g.teamwork.cooldown = Math.max(0, g.teamwork.cooldown - dt);
        g.teamwork.evadeCooldown = Math.max(0, g.teamwork.evadeCooldown - dt);
        if (g.teamwork.window === 0) g.teamwork.owner = null;
      }
    }
    const d = g.dash,
      m = len(G.input.x, G.input.y);
    if (m > 0.1) {
      d.lastX = G.input.x / m;
      d.lastY = G.input.y / m;
      g.face = Math.abs(G.input.x) > Math.abs(G.input.y) ? (G.input.x > 0 ? 1 : 3) : G.input.y > 0 ? 0 : 2;
    }
    d.cooldown = Math.max(0, d.cooldown - dt);
    const active = d.active > 0;
    d.invulnerable = active;
    d.active = Math.max(0, d.active - dt);
    g.moving = active || m > 0.1;
    if (g.moving && dt > 0) g.learned.moved = true;
    p.x = advance(p.x, (active ? d.x : G.input.x) * p.speed * (active ? 3.4 : 1) * dt);
    p.y = advance(p.y, (active ? d.y : G.input.y) * p.speed * (active ? 3.4 : 1) * dt);
    if (active && d.active === 0 && g.synergies.safeDash) {
      for (const e of g.enemies) {
        const dx = e.x - p.x,
          dy = e.y - p.y,
          l = len(dx, dy) || 1;
        if (l < 110) {
          e.x += (dx / l) * 55;
          e.y += (dy / l) * 55;
        }
      }
      g.hostile = g.hostile.filter(b => len(b.x - p.x, b.y - p.y) > 110);
      ring(p.x, p.y, 110, '#a7d4f0');
    }
    mareTick(dt);
    allyTick(dt);
    scriptTick(dt);
    recordTick(dt);
    storyGateTick(dt);
    if (g.status !== 'playing') return;
    snowTargetTick(dt);
    if (g.status !== 'playing') return;
    patientTick(dt);
    if (g.status !== 'playing') return;
    sweepTick(dt);
    if (g.status !== 'playing') return;
    bellTick(dt);
    if (g.status !== 'playing') return;
    storyPressureTick(dt);
    if (g.status !== 'playing') return;
    encounterTick(dt);
    if (g.status !== 'playing') return;
    hazardTick(dt);
    if (g.status !== 'playing') return;
    enemyTick(dt);
    if (g.status !== 'playing') return;
    const bossBeforeFlames = g.bossDefeated;
    for (const flame of g.flames) {
      const active = Math.min(dt, flame.life);
      flame.life -= dt;
      for (const e of [...g.enemies])
        if (len(e.x - flame.x, e.y - flame.y) < flame.r + e.r) G.hitEnemy(e, 6 * active);
    }
    g.flames = g.flames.filter(f => f.life > 0);
    if (g.mode !== 'story' && !bossBeforeFlames && g.bossDefeated) {
      G.stageClear();
      return;
    }
    waveTick(dt);
    g.spawn += dt;
    const baseInterval = g.storyTraining
      ? Math.max(0.35, 0.8 - (g.time / g.duration) * 0.45)
      : Math.max(0.42, 1.3 - (g.time / g.duration) * 0.7 - g.stage * 0.09);
    const interval = g.storyBattle === 'snowMission' && g.snowSignalHelp ? baseInterval * 1.13 : baseInterval;
    while (g.spawn >= interval) {
      g.spawn -= interval;
      if (
        !g.script &&
        g.enemies.length < (g.mode === 'story' && !g.storyTraining ? 20 : 65) &&
        !g.wave &&
        g.time >= g.waveRestUntil
      )
        spawn();
    }
    if (g.mode !== 'story' && g.time > 75 + g.eliteCount * 100 && g.eliteCount < 2) {
      G.enemy(g.eliteCount % 2 ? 'witch' : 'warden', p.x + 250, p.y - 350);
      g.eliteCount++;
    }
    if (g.mode !== 'story' && !g.bossSpawned && g.time >= g.duration * 0.67) {
      g.bossSpawned = true;
      G.enemy('boss', p.x, p.y - 310);
      G.notify(TG.STAGES[g.stage].boss + ' · 공격 예고를 피하세요');
      G.onSound('boss');
    }
    g.lastFire += dt;
    if (g.lastFire >= p.interval * (g.overcharge > 0 ? 0.75 : 1)) {
      g.lastFire = 0;
      fire();
    }
    for (let i = g.bullets.length - 1; i >= 0; i--) {
      const b = g.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      let remove = b.life <= 0;
      for (const e of [...g.enemies]) {
        if (remove) break;
        if (!b.hit.has(e.id) && len(e.x - b.x, e.y - b.y) < e.r + 6) {
          b.hit.add(e.id);
          if (p.slow) e.slow = 1.5;
          G.hitEnemy(e, b.damage, !!g.levels.ember);
          if (b.echo && !b.echoSpent) {
            b.echoSpent = true;
            const neighbors = g.enemies
              .filter(v => v !== e && !b.hit.has(v.id) && len(v.x - e.x, v.y - e.y) <= 110)
              .sort((a, c) => len(a.x - e.x, a.y - e.y) - len(c.x - e.x, c.y - e.y))
              .slice(0, 2);
            for (const v of neighbors) {
              G.hitEnemy(v, b.damage * 0.35);
              if (g.links.length < 24) g.links.push({ x1: e.x, y1: e.y, x2: v.x, y2: v.y, life: 0.18 });
            }
          }
          spark(e.x, e.y, '#cae7f1', 2);
          if (b.pierce-- <= 0) remove = true;
        }
      }
      if (remove) g.bullets.splice(i, 1);
    }
    for (let i = g.hostile.length - 1; i >= 0; i--) {
      const b = g.hostile[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (len(p.x - b.x, p.y - b.y) < b.r + 13) {
        G.damage(b.damage);
        b.life = 0;
      }
      if (b.life <= 0) g.hostile.splice(i, 1);
      if (g.status !== 'playing') return;
    }
    if (g.mode !== 'story' && g.bossDefeated) {
      G.stageClear();
      return;
    }
    if (g.time >= g.duration) {
      G.finish(
        g.mode === 'story' && g.storyTraining,
        g.mode === 'story' && !g.storyTraining ? 'timeout' : g.mode === 'story' ? 'training' : 'timeout'
      );
      return;
    }
    g.regenClock += dt;
    g.pulseClock += dt;
    if (g.regenClock >= 10) {
      g.regenClock = 0;
      if (g.levels.mend) p.hp = Math.min(p.maxHp, p.hp + 2 * g.levels.mend * (g.synergies.warmHeart ? 2 : 1));
    }
    if (g.pulseClock >= 4 && g.levels.lantern) {
      g.pulseClock = 0;
      const radius = 100 + 15 * g.levels.lantern;
      ring(p.x, p.y, radius, '#e9c891');
      if (g.synergies.emberLantern && g.flames.length < 3)
        g.flames.push({ x: p.x, y: p.y, r: radius * 0.65, life: 2 });
      for (const e of [...g.enemies])
        if (len(e.x - p.x, e.y - p.y) < radius + e.r)
          G.hitEnemy(
            e,
            (14 + g.levels.lantern * 7) * (g.relics.includes('wick') ? 1.35 : 1),
            g.synergies.emberLantern
          );
      if (g.mode !== 'story' && g.bossDefeated) {
        G.stageClear();
        return;
      }
    }
    if (g.levels.shield && g.time - g.lastShield >= 18) {
      p.shield = Math.max(p.shield, Math.min(g.levels.shield, p.shield + 1));
      g.lastShield = g.time;
    }
    for (let i = g.drops.length - 1; i >= 0; i--) {
      const drop = g.drops[i],
        dx = p.x - drop.x,
        dy = p.y - drop.y,
        dd = len(dx, dy) || 1;
      const magnet = p.magnet * (g.overcharge > 0 ? 1.5 : 1);
      if (dd < magnet) {
        const v = Math.max(150, 550 * (1 - dd / magnet));
        drop.x += (dx / dd) * v * dt;
        drop.y += (dy / dd) * v * dt;
      }
      if (dd < 20) {
        g.learned.collected = true;
        g.xp += drop.value * (1 + 0.15 * (g.levels.wisdom || 0));
        g.drops.splice(i, 1);
      }
    }
    anchorTick(dt);
    for (const link of g.links) link.life -= dt;
    g.links = g.links.filter(link => link.life > 0);
    for (const v of g.particles) {
      v.life -= dt;
      v.x += v.vx * dt;
      v.y += v.vy * dt;
    }
    g.particles = g.particles.filter(v => v.life > 0);
    for (const r of g.rings) r.life -= dt;
    g.rings = g.rings.filter(r => r.life > 0);
    G.checkLevel();
  };
  G.stageClear = function () {
    const g = G.g;
    if (
      !g ||
      g.mode === 'story' ||
      g.status !== 'playing' ||
      g.p.hp <= 0 ||
      (g.mode === 'chapter' && !TG.store.canWrite())
    )
      return;
    g.memoryAnchor = null;
    g.clearedStages = g.stage + 1;
    g.status = 'camp';
    G.input.x = G.input.y = 0;
    if (g.mode !== 'chapter') {
      G.finish(true, 'practice');
      return;
    }
    TG.store.data.unlocked = Math.max(TG.store.data.unlocked, Math.min(2, g.stage + 1));
    TG.store.remember(['mirror', 'bell', 'ending'][g.stage]);
    if (g.stage === 2) {
      G.finish(true, 'ending');
      return;
    }
    g.event = Math.floor(Math.random() * TG.EVENTS.length);
    g.eventDone = false;
    g.bossOffers = TG.BOSS_REWARDS.map(r => r.id);
    g.bossReward = null;
    TG.store.snapshot(g, 'camp');
    G.onChange('camp');
    G.onSound('clear');
  };
  G.eventChoice = function (index) {
    const g = G.g;
    if (!g || g.status !== 'camp' || g.eventDone || !Number.isInteger(index) || !TG.store.canWrite())
      return false;
    const event = TG.EVENTS[g.event],
      c = event?.choices[index];
    if (!c || (c.damage && g.p.hp <= c.damage)) return false;
    g.eventDone = true;
    g.p.hp = Math.min(g.p.maxHp, g.p.hp + (c.heal || 0));
    g.p.hp -= c.damage || 0;
    g.shards += c.shards || 0;
    g.erase = clamp(g.erase + (c.erase || 0), 0, 100);
    g.bonusCards += c.card || 0;
    let reward = '';
    if (c.relic) {
      const pool = TG.RELICS.filter(r => !g.relics.includes(r.id));
      if (pool.length) {
        const item = pool[Math.floor(Math.random() * pool.length)];
        g.relics.push(item.id);
        reward = item.name;
      } else {
        g.shards += 12;
        reward = '모든 유물을 보유해 기억 조각 12개를 얻었습니다.';
      }
      G.rebuild();
    }
    TG.store.snapshot(g, 'camp');
    G.onChange('camp');
    G.onSound('card');
    return reward || true;
  };
  G.chooseBossReward = function (id, stage = G.g?.stage) {
    const g = G.g;
    if (
      !g ||
      g.status !== 'camp' ||
      g.mode !== 'chapter' ||
      g.stage >= 2 ||
      stage !== g.stage ||
      g.bossReward ||
      !g.bossOffers.includes(id) ||
      !TG.store.canWrite()
    )
      return false;
    const reward = TG.BOSS_REWARDS.find(r => r.id === id);
    if (!reward) return false;
    g.bossReward = id;
    g.bonusCards += reward.card || 0;
    g.p.hp = Math.min(g.p.maxHp, g.p.hp + (reward.heal || 0));
    g.erase = clamp(g.erase + (reward.erase || 0), 0, 100);
    g.shards += reward.shards || 0;
    TG.store.snapshot(g, 'camp');
    G.onChange('camp');
    G.onSound('card');
    return true;
  };
  G.nextStage = function () {
    const g = G.g;
    if (!g || g.status !== 'camp' || !g.eventDone || !g.bossReward || g.stage >= 2 || !TG.store.canWrite())
      return false;
    if (!TG.store.snapshot(g, 'camp')) {
      G.onChange('camp');
      return false;
    }
    const checkpoint = TG.store.data.checkpoint,
      carry = { ...g, hp: Math.min(g.p.maxHp, g.p.hp + 20 + (g.relics.includes('ticket') ? 20 : 0)) };
    const candidate = initialize(g.mode, g.stage + 1, carry, false, true);
    if (!TG.store.snapshot(candidate)) {
      G.g = g;
      TG.store.data.checkpoint = checkpoint;
      G.onChange('camp');
      return false;
    }
    TG.store.remember(candidate.stage === 1 ? 'snow' : 'order');
    G.notify(TG.STAGES[candidate.stage].intro);
    G.onChange('playing');
    G.onSound('start');
    G.checkLevel();
    return true;
  };
  G.saveStoryResult = function () {
    const g = G.g;
    if (!g || g.mode !== 'story' || g.status !== 'ended' || !g.won) return false;
    if (g.storyTraining) {
      g.storySaved = true;
      return true;
    }
    if (g.storySaved) return true;
    g.storySaved = TG.story?.completeBattle?.(g) === true;
    return g.storySaved;
  };
  G.finish = function (won, reason) {
    const g = G.g;
    if (!g || g.status === 'ended') return false;
    if (g.mode === 'chapter' && !TG.store.canWrite()) {
      G.pause();
      G.notify(
        '기록 저장을 확인할 수 없어 멈췄습니다. 저장소 접근을 확인한 뒤 계속하거나 설정에서 백업하세요.'
      );
      return false;
    }
    if (g.mode === 'story' && g.p.hp <= 0) {
      won = false;
      reason = 'death';
    }
    if (
      g.mode === 'story' &&
      !g.storyTraining &&
      ['approach', 'escort', 'archive'].includes(g.storyBattle) &&
      g.storyGate?.done !== true &&
      won
    ) {
      won = false;
      reason = 'mission';
    }
    if (
      g.mode === 'story' &&
      !g.storyTraining &&
      g.storyBattle === 'archive' &&
      g.recordTarget?.recovered !== true &&
      won
    ) {
      won = false;
      reason = 'record';
    }
    if (
      g.mode === 'story' &&
      !g.storyTraining &&
      g.storyBattle === 'snowMission' &&
      g.signalTargets?.some(r => !r.recovered) &&
      won
    ) {
      won = false;
      reason = 'signal';
    }
    if (
      g.mode === 'story' &&
      !g.storyTraining &&
      g.storyBattle === 'velaEscort' &&
      (!g.patient || g.patient.phase !== 'boarded' || !g.patient.saved || g.patient.hp <= 0) &&
      won
    ) {
      won = false;
      reason = 'patient';
    }
    g.memoryAnchor = null;
    g.status = 'ended';
    G.input.x = G.input.y = 0;
    g.won = won;
    g.reason = reason;
    if (g.mode === 'chapter') {
      g.reward = TG.store.settle(g, won);
      g.newGoals = [...(TG.store.lastUnlocked || [])];
      if (won) {
        for (const m of TG.MEMORIES) TG.store.remember(m.id);
      }
    } else if (g.mode === 'story') {
      g.reward = 0;
      g.newGoals = [];
      g.practice = false;
      g.storySaved = false;
      if (won) G.saveStoryResult();
    } else {
      g.reward = 0;
      g.practice = true;
    }
    G.onChange('ended');
    G.onSound(won ? 'clear' : 'hurt');
    return true;
  };
  G.abandon = function () {
    const g = G.g;
    if (g?.mode === 'story') return g.status === 'ended' ? false : G.finish(false, 'retreat');
    if (g && g.status !== 'ended') return G.finish(false, 'retreat');
    const c = TG.store.data.checkpoint;
    if (c) {
      if (!TG.store.canWrite()) return false;
      TG.store.settle(c, false);
      G.g = null;
      G.onChange('hub');
      return true;
    }
    return false;
  };
  G.hub = function () {
    if (G.g?.status === 'playing') G.pause();
    G.onChange('hub');
  };
  G.particle = spark;
  G.kill = kill;
  G.initialize = initialize;
})();
