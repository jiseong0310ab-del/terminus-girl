'use strict';
(() => {
  const V = (TG.view = { width: 390, height: 844 });
  let canvas, ctx;
  const images = {};
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  V.init = function (el) {
    canvas = el;
    ctx = canvas.getContext('2d', { alpha: false });
    for (const [key, url] of Object.entries({
      hero: 'assets/rize-walk-v09.webp',
      mare: 'assets/mare-walk-v014.webp',
      portraits: 'assets/party-portraits-v017.webp',
      allies: 'assets/companions-sd-v019.avif',
      enemy: 'assets/enemies-v09.webp',
      floor: 'assets/platform-stone-v03.webp',
      props: 'assets/station-props-v010.webp',
      anchor: 'assets/memory-lantern-v013.webp',
      fallback: 'assets/rize-sd-v03.webp'
    })) {
      const im = new Image();
      if (key === 'allies')
        im.onerror = () => {
          im.onerror = null;
          im.src = 'assets/companions-sd-v018.webp';
        };
      im.src = url;
      images[key] = im;
    }
    V.resize();
  };
  V.resize = function () {
    if (!ctx) return;
    V.width = canvas.clientWidth > 0 ? canvas.clientWidth : innerWidth;
    V.height = canvas.clientHeight > 0 ? canvas.clientHeight : innerHeight;
    // Mobile web views can resize frequently as browser chrome moves.
    // Avoid reallocating an unchanged canvas and cap its backing-buffer memory.
    const quality = TG.store.data.settings.quality === 'low' ? 1 : 2;
    const ratio = Math.min(
      quality,
      devicePixelRatio || 1,
      Math.sqrt(2100000 / Math.max(1, V.width * V.height))
    );
    const width = Math.max(1, Math.round(V.width * ratio)),
      height = Math.max(1, Math.round(V.height * ratio));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const ready = im => im?.complete && im.naturalWidth > 0;
  // One colour language for every mode: rose = hostile/danger, gold = objective/destination,
  // teal = ally/protection, ice-white = memory (experience). Nothing else borrows these roles.
  const PAL = (V.palette = {
    hostile: '#e8789a',
    hostileFill: '#d8587e2e',
    hostileText: '#ffdbe4',
    goal: '#f0d49c',
    goalFill: '#e7cd7d26',
    goalText: '#fff0cf',
    locked: '#8c97aa',
    lockedFill: '#717b8c1f',
    ally: '#8fdfe0',
    memory: '#d8f1fb'
  });
  // Edge arrow for an off-screen destination; locked goals stay grey, live goals are gold.
  function edgeArrow(angle, live, label) {
    circle(0, 0, 19, '#141c2ef0', live ? PAL.goal : PAL.locked);
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = live ? PAL.goal : PAL.locked;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -8);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (label) {
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = live ? PAL.goalText : '#c1cddd';
      ctx.fillText(label, 0, 33);
    }
  }
  // Every stand-in-the-circle objective is the same painted signal post from the station
  // atlas (kept out of ambient scenery), lit gold when usable and dark while locked.
  function objectiveProp(r, live, progress, title, hint, t) {
    const reduced = TG.store.data.settings.reduceFX;
    if (live && !reduced) {
      const pulse = 1 + Math.sin(t * 3) * 0.06,
        grad = ctx.createRadialGradient(0, -20, 4, 0, -20, 90 * pulse);
      grad.addColorStop(0, '#f2cf7d55');
      grad.addColorStop(1, '#f2cf7d00');
      ctx.fillStyle = grad;
      ctx.fillRect(-95, -115, 190, 190);
    }
    ctx.lineWidth = 2;
    ctx.setLineDash(live ? [] : [6, 6]);
    circle(0, 0, r, live ? PAL.goalFill : PAL.lockedFill, live ? PAL.goal : PAL.locked);
    ctx.setLineDash([]);
    if (live && progress > 0) {
      ctx.strokeStyle = '#fff1c4';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(progress, 0, 1));
      ctx.stroke();
    }
    if (ready(images.props)) {
      const cw = images.props.naturalWidth / 2,
        ch = (images.props.naturalHeight || images.props.naturalWidth) / 2,
        h = 104,
        w = h;
      ctx.save();
      if (!live) ctx.globalAlpha = 0.62;
      ctx.drawImage(images.props, cw, ch, cw, ch, -w / 2, -h * 0.86, w, h);
      ctx.restore();
      // Signal lamp: gold when the objective is usable, unlit while locked.
      circle(9, -h * 0.6, live ? 6 : 4, live ? '#ffe3a0' : '#3c4656', live ? '#fff4cf' : '#596476');
    } else {
      ctx.fillStyle = '#19283a';
      ctx.fillRect(-12, -40, 24, 52);
      circle(0, -30, 7, live ? '#ffe3a0' : '#3c4656');
    }
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = live ? PAL.goalText : '#c1cddd';
    ctx.shadowColor = '#050913';
    ctx.shadowBlur = reduced ? 0 : 4;
    ctx.fillText(title, 0, -r - 22);
    ctx.font = '10px sans-serif';
    ctx.fillText(hint, 0, r + 16);
    ctx.shadowBlur = 0;
  }
  // A painted carriage door: arched frame, brass trim, warm window glow.
  function carriageDoor(live, label, t) {
    const reduced = TG.store.data.settings.reduceFX;
    if (live && !reduced) {
      const grad = ctx.createRadialGradient(0, -25, 4, 0, -25, 85);
      grad.addColorStop(0, '#f2cf7d44');
      grad.addColorStop(1, '#f2cf7d00');
      ctx.fillStyle = grad;
      ctx.fillRect(-90, -110, 180, 180);
    }
    ctx.fillStyle = '#1b273b';
    ctx.beginPath();
    ctx.moveTo(-32, 16);
    ctx.lineTo(-32, -44);
    ctx.quadraticCurveTo(0, -74, 32, -44);
    ctx.lineTo(32, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = live ? '#d8b56f' : '#6f7d8d';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -58);
    ctx.lineTo(0, 16);
    ctx.stroke();
    const win = live ? '#f6d796' : '#3d4a5c';
    for (const sx of [-1, 1]) {
      ctx.fillStyle = win;
      ctx.beginPath();
      ctx.moveTo(sx * 5, -14);
      ctx.lineTo(sx * 5, -44);
      ctx.quadraticCurveTo(sx * 14, -54, sx * 24, -44);
      ctx.lineTo(sx * 24, -14);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#d8b56f';
    ctx.fillRect(-8, -2, 4, 7);
    ctx.fillRect(4, -2, 4, 7);
    ctx.fillStyle = '#8a734d';
    ctx.fillRect(-38, 14, 76, 5);
    if (label) {
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = live ? PAL.goalText : '#c1cddd';
      ctx.fillText(label, 0, -82);
    }
  }
  function circle(x, y, r, fill, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, r), 0, TAU);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }
  // World-space scenery is stable across frames and does not participate in collision.
  // Background placement and foreground threat rendering stay separate.
  V.sceneProps = function (stage, cx, cy, width = V.width, height = V.height, low = false) {
    const props = [],
      stepX = 460,
      stepY = 360;
    // Index 3 (signal post) is reserved for mission objectives, so it never appears as scenery.
    const types = [
      [0, 1, 2],
      [2, 0, 2, 1],
      [1, 1, 2]
    ][clamp(stage | 0, 0, 2)];
    for (
      let row = Math.floor((cy - height / 2 - 180) / stepY);
      row <= Math.ceil((cy + height / 2 + 180) / stepY);
      row++
    ) {
      for (
        let col = Math.floor((cx - width / 2 - 180) / stepX);
        col <= Math.ceil((cx + width / 2 + 180) / stepX);
        col++
      ) {
        const hash = (Math.imul(col + 117, 374761393) ^ Math.imul(row + 239, 668265263)) >>> 0;
        if (low && hash % 2) continue;
        const x = col * stepX + 100 + (hash % 180),
          y = row * stepY + 100 + ((hash >>> 9) % 140);
        const sx = x - cx + width / 2,
          sy = y - cy + height / 2;
        if (
          sx < -100 ||
          sx > width + 100 ||
          sy < -20 ||
          sy > height + 160 ||
          Math.hypot(x - cx, y - cy) < 140
        )
          continue;
        props.push({
          key: col + ':' + row,
          x,
          y,
          index: types[(hash >>> 17) % types.length],
          scale: 0.9 + (hash % 20) / 100
        });
      }
    }
    return props;
  };
  function scenery(g, cx, cy) {
    if (!ready(images.props)) return;
    const low = TG.store.data.settings.quality === 'low',
      stage = g?.stage || 0;
    const cellW = images.props.naturalWidth / 2,
      cellH = (images.props.naturalHeight || images.props.naturalWidth) / 2;
    for (const prop of V.sceneProps(stage, cx, cy, V.width, V.height, low)) {
      const x = prop.x - cx + V.width / 2,
        y = prop.y - cy + V.height / 2,
        w = 145 * prop.scale,
        h = w;
      ctx.globalAlpha = stage === 1 ? 0.84 : 0.78;
      ctx.drawImage(
        images.props,
        (prop.index % 2) * cellW,
        Math.floor(prop.index / 2) * cellH,
        cellW,
        cellH,
        x - w / 2,
        y - h * 0.82,
        w,
        h
      );
    }
    ctx.globalAlpha = 1;
  }
  // Platform lamp + station nameplate. The lamp is the painted clock lamp from the station
  // atlas; the plate is an enamel sign with brass trim and serif type so it reads as part of
  // the world, never as a tappable UI button.
  // Decorative lamps step aside for mission objectives so a goal is never doubled by scenery.
  function clearOfGoals(g, x, y) {
    if (!g) return true;
    const goals = [g.storyGate, g.recordTarget, g.trainExit, g.patient, ...(g.signalTargets || [])].filter(
      Boolean
    );
    return goals.every(q => Math.hypot(q.x - x, q.y - y) > 150);
  }
  function stationLamp(lx, y, stage) {
    const size = 150,
      dx = lx - size * 0.45,
      dy = y + 30 - size * 0.96;
    const gx = dx + size * 0.67,
      gy = dy + size * 0.38,
      grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 105);
    grad.addColorStop(0, '#e6aa6448');
    grad.addColorStop(1, '#e6aa6400');
    ctx.fillStyle = grad;
    ctx.fillRect(gx - 105, gy - 105, 210, 210);
    if (ready(images.props)) {
      const cw = images.props.naturalWidth / 2,
        ch = (images.props.naturalHeight || images.props.naturalWidth) / 2;
      ctx.drawImage(images.props, cw, 0, cw, ch, dx, dy, size, size);
    } else {
      ctx.strokeStyle = '#84724f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx, y + 27);
      ctx.lineTo(lx, y - 56);
      ctx.stroke();
      ctx.fillStyle = '#f2c68a';
      ctx.fillRect(lx + 20, y - 57, 14, 21);
    }
    const name = ['거울 유리역', '침묵의 설원역', '종착 승강장'][stage] || '',
      px = lx,
      py = y + 48,
      w = 92,
      h = 24;
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = '#02050c88';
    ctx.fillRect(-w / 2 + 3, h / 2, w - 6, 4);
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 8, -h / 2);
    ctx.lineTo(w / 2 - 8, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 8);
    ctx.lineTo(w / 2, h / 2 - 8);
    ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - 8, h / 2);
    ctx.lineTo(-w / 2 + 8, h / 2);
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 8);
    ctx.lineTo(-w / 2, -h / 2 + 8);
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 8, -h / 2);
    ctx.closePath();
    ctx.fillStyle = '#1a2e40';
    ctx.fill();
    ctx.strokeStyle = '#9c8355';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#cdb27a55';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2 + 5, -h / 2 + 4, w - 10, h - 8);
    for (const sx of [-1, 1]) circle(sx * (w / 2 - 6), 0, 1.6, '#c9ad73');
    ctx.font = 'bold 10px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ead9b2';
    ctx.fillText(name, 0, 1);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
  function background(g, t, cx, cy) {
    const W = V.width,
      H = V.height;
    ctx.fillStyle = '#101727';
    ctx.fillRect(0, 0, W, H);
    const size = 560,
      ox = (((-cx + W / 2) % size) + size) % size,
      oy = (((-cy + H / 2) % size) + size) % size;
    if (ready(images.floor))
      for (let x = ox - size; x < W; x += size)
        for (let y = oy - size; y < H; y += size) ctx.drawImage(images.floor, x, y, size, size);
    ctx.fillStyle = ['#0b102349', '#142f4349', '#291e334f'][g?.stage || 0];
    ctx.fillRect(0, 0, W, H);

    if (g?.stage === 1) {
      ctx.fillStyle = '#c7d9e51d';
      for (let i = 0; i < 8; i++) {
        const wx = Math.floor(cx / 470) * 470 + (i % 3) * 180 - 250,
          wy = Math.floor(cy / 430) * 430 + Math.floor(i / 3) * 180 - 250;
        ctx.beginPath();
        ctx.ellipse(wx - cx + W / 2, wy - cy + H / 2, 65, 22, 0.3, 0, TAU);
        ctx.fill();
      }
    }
    if (g?.stage === 2) {
      const clockX = Math.floor(cx / 560) * 560 - cx + W / 2 + 210,
        clockY = Math.floor(cy / 560) * 560 - cy + H / 2 + 200;
      ctx.strokeStyle = '#b59a6c30';
      ctx.lineWidth = 1.5;
      circle(clockX, clockY, 92, null, '#b59a6c30');
      circle(clockX, clockY, 84, null, '#b59a6c30');
      for (let k = 0; k < 12; k++) {
        const a = (k * TAU) / 12;
        ctx.beginPath();
        ctx.moveTo(clockX + Math.cos(a) * 78, clockY + Math.sin(a) * 78);
        ctx.lineTo(clockX + Math.cos(a) * 87, clockY + Math.sin(a) * 87);
        ctx.stroke();
      }
    }
    const rail = 570;
    for (let wx = Math.floor((cx - W / 2 - 180) / rail) * rail; wx < cx + W / 2 + 180; wx += rail) {
      const x = wx - cx + W / 2;
      ctx.fillStyle = '#0a111f';
      ctx.fillRect(x - 44, 0, 88, H);
      for (let wy = Math.floor((cy - H / 2) / 70) * 70; wy < cy + H / 2 + 70; wy += 70) {
        ctx.fillStyle = '#253345';
        ctx.fillRect(x - 49, wy - cy + H / 2, 98, 8);
      }
      ctx.fillStyle = '#627080';
      ctx.fillRect(x - 38, 0, 3, H);
      ctx.fillRect(x + 36, 0, 3, H);
      ctx.setLineDash([10, 12]);
      ctx.strokeStyle = '#b8a27666';
      ctx.beginPath();
      ctx.moveTo(x + 64, 0);
      ctx.lineTo(x + 64, H);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let wy = Math.floor((cy - H / 2 - 140) / 410) * 410; wy < cy + H / 2 + 140; wy += 410) {
        const y = wy - cy + H / 2,
          lx = x + 139;
        if (!clearOfGoals(g, wx + 139, wy)) continue;
        stationLamp(lx, y, g?.stage || 0);
      }
    }
    scenery(g, cx, cy);
    const low = TG.store.data.settings.quality === 'low',
      reduced = TG.store.data.settings.reduceFX,
      ambientTime = reduced ? 0 : t;
    const snowColor = ['#c2d9f066', '#e7f4ff88', '#e6bf7c66'][g?.stage || 0];
    for (let i = 0; i < (reduced ? 8 : low ? 18 : 34); i++) {
      const x = ((((i * 193 + ambientTime * 9 - cx * 0.12) % (W + 100)) + W + 100) % (W + 100)) - 50,
        y = ((((i * 137 + ambientTime * (10 + (i % 5)) - cy * 0.12) % (H + 100)) + H + 100) % (H + 100)) - 50;
      ctx.fillStyle = snowColor;
      circle(x, y, 1 + (i % 2) * 0.4, snowColor);
    }
    const vig = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, Math.max(W, H) * 0.7);
    vig.addColorStop(0, '#07102100');
    vig.addColorStop(1, '#030812b0');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }
  function sprite(image, index, cols, size, x, y, w, h) {
    if (!ready(image)) return false;
    const cell = image.naturalWidth / cols;
    ctx.drawImage(
      image,
      (index % cols) * cell,
      Math.floor(index / cols) * cell,
      cell,
      cell,
      x - w / 2,
      y - h * 0.77,
      w,
      h
    );
    return true;
  }
  function enemy(e, g, t) {
    const x = e.x - g.p.x + V.width / 2,
      y = e.y - g.p.y + V.height / 2;
    if (x < -280 || x > V.width + 280 || y < -280 || y > V.height + 280) return;
    ctx.save();
    ctx.translate(x, y);
    const wind = e.action === 'windup',
      enraged = e.type === 'boss' && e.bossPhase === 2;
    if (enraged) {
      const radius = e.r + 13 + (TG.store.data.settings.reduceFX ? 0 : Math.sin(t * 3) * 2);
      ctx.lineWidth = 2;
      circle(0, 0, radius, '#713b541c', '#df96b499');
    }
    if (wind) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = PAL.hostile;
      ctx.fillStyle = PAL.hostileFill;
      if (e.type === 'boss') {
        const diagonal = g.stage === 1 && e.attackVariant === 'diagonal';
        if (g.stage === 1) {
          ctx.save();
          if (diagonal) ctx.rotate(Math.PI / 4);
          ctx.fillRect(-220, -23, 440, 46);
          ctx.fillRect(-23, -220, 46, 440);
          ctx.strokeRect(-220, -23, 440, 46);
          ctx.strokeRect(-23, -220, 46, 440);
          ctx.restore();
        } else {
          circle(0, 0, e.pulseRadius, PAL.hostileFill, PAL.hostile);
          ctx.setLineDash([7, 6]);
          circle(0, 0, e.pulseRadius, null, '#f3d6d6');
          ctx.setLineDash([]);
        }
        if (g.stage === 2) {
          const a = Math.atan2(e.aimY, e.aimX),
            half = e.attackPhase === 2 ? (3 * Math.PI) / 16 : Math.PI / 4;
          ctx.strokeStyle = '#b9e6df';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(0, 0, e.pulseRadius, a - half, a + half);
          ctx.stroke();
        }
        ctx.fillStyle = '#f9e1dc';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        const hint =
          g.stage === 0
            ? e.attackPhase === 2
              ? '충격파 · 뒤따르는 잔진동 주의'
              : '충격파 · 원 밖으로'
            : g.stage === 1
              ? diagonal
                ? '종소리 · 대각선 밖으로'
                : '종소리 · 십자 밖으로'
              : '탄막 · 푸른 틈으로 피하기';
        ctx.fillText(hint, 0, -e.pulseRadius - 10);
        const maxWarning = [1.35, 1.6, 1.7][g.stage],
          progress = clamp(1 - e.clock / maxWarning, 0, 1);
        ctx.strokeStyle = '#ffdcaf';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, e.r + 33, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
        ctx.stroke();
      } else {
        const reach =
            e.behavior === 'charge'
              ? Math.max(175, (e.elite ? 270 : 330) * (e.chargeTime || 0.52) + e.r)
              : 230,
          progress = clamp(1 - e.clock / (e.windupTime || (e.behavior === 'charge' ? 0.75 : 1)), 0, 1);
        ctx.rotate(Math.atan2(e.aimY, e.aimX));
        ctx.setLineDash([7, 6]);
        ctx.fillRect(0, -14, reach, 28);
        ctx.strokeRect(0, -14, reach, 28);
        ctx.setLineDash([]);
        if (e.behavior === 'charge') {
          ctx.fillStyle = '#e8829c55';
          ctx.fillRect(0, -14, reach * progress, 28);
        }
        ctx.rotate(-Math.atan2(e.aimY, e.aimX));
      }
    }
    ctx.fillStyle = '#02050d77';
    ctx.beginPath();
    ctx.ellipse(0, 15, e.r * 1.1, 7, 0, 0, TAU);
    ctx.fill();
    // A warm hostile ring under every foe keeps pale sprites readable on the night platform.
    if (e.type !== 'boss') {
      ctx.lineWidth = e.elite ? 2.5 : 1.75;
      ctx.strokeStyle = e.elite ? '#f0a2b8dd' : '#e0748fb0';
      ctx.beginPath();
      ctx.ellipse(0, 15, e.r * 1.25, e.r * 0.5, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = e.hit > 0 ? 0.65 : 1;
    const w = e.type === 'boss' ? 118 : e.elite ? 83 : 68,
      h = w,
      bob = Math.sin(t * 3 + e.phase) * 1.6;
    if (!sprite(images.enemy, e.art, 3, 144, 0, bob, w, h))
      circle(0, 0, e.r, e.type === 'boss' ? '#80536f' : '#66879b', '#b1d2de');
    ctx.globalAlpha = 1;
    if (e.frozen > 0) circle(0, 0, e.r + 7, '#8acfe944', '#daf4ff');
    if (e.slow > 0) circle(0, 0, e.r + 3, null, '#abd9ed');
    if (e.burn > 0) {
      ctx.strokeStyle = '#e9b36b';
      ctx.beginPath();
      ctx.arc(0, 0, e.r + 5, 0, TAU * 0.7);
      ctx.stroke();
    }
    if (e.type === 'boss' || e.elite) {
      ctx.fillStyle = '#21182b';
      ctx.fillRect(-34, -h * 0.75, 68, 5);
      ctx.fillStyle = e.type === 'boss' ? '#e3b4d2' : '#d9c18f';
      ctx.fillRect(-34, -h * 0.75, 68 * clamp(e.hp / e.maxHp, 0, 1), 5);
    }
    if (e.label) {
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f6d9c9';
      ctx.shadowColor = '#14091a';
      ctx.shadowBlur = 4;
      ctx.fillText(e.label, 0, -h * 0.75 - 6);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  // Keep an optional field goal findable without covering the HUD or touch controls.
  V.anchorMarker = function (anchor, p, width = V.width, height = V.height) {
    if (!anchor) return null;
    const worldX = anchor.x - p.x + width / 2,
      worldY = anchor.y - p.y + height / 2,
      top = Math.min(175, Math.max(130, height * 0.2)),
      bottom = Math.max(top + 30, height - Math.min(285, height * 0.4));
    const x = clamp(worldX, 32, width - 32),
      y = clamp(worldY, top, bottom);
    return {
      x,
      y,
      worldX,
      worldY,
      edge: x !== worldX || y !== worldY,
      angle: Math.atan2(worldY - y, worldX - x)
    };
  };
  function memoryAnchor(g, t) {
    const a = g.memoryAnchor;
    if (!a) return;
    const marker = V.anchorMarker(a, g.p),
      reduced = TG.store.data.settings.reduceFX,
      low = TG.store.data.settings.quality === 'low';
    ctx.save();
    ctx.translate(marker.x, marker.y);
    ctx.lineWidth = 2;
    if (marker.edge) {
      circle(0, 0, 17, '#102b32ef', '#e9d39a');
      ctx.save();
      ctx.rotate(marker.angle);
      ctx.fillStyle = '#f2d48e';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-5, -6);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f6e6c4';
      ctx.fillText(Math.ceil(a.remaining) + '초', 0, 32);
    } else {
      if (!low && !reduced) {
        const light = ctx.createRadialGradient(0, -12, 1, 0, -12, 75);
        light.addColorStop(0, '#f3d58c55');
        light.addColorStop(1, '#e9bb5b00');
        ctx.fillStyle = light;
        ctx.fillRect(-75, -87, 150, 150);
      }
      circle(0, 0, a.r, '#d8c07b16', '#e5c888aa');
      ctx.strokeStyle = '#fff0b9';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(a.charge / a.required, 0, 1));
      ctx.stroke();
      // A small railway lantern with a glass pane, distinct from damage circles.
      const bob = reduced ? 0 : Math.sin(t * 3) * 2;
      if (ready(images.anchor)) ctx.drawImage(images.anchor, -40, -66 + bob, 80, 88);
      else {
        ctx.save();
        ctx.translate(0, bob - 7);
        ctx.strokeStyle = '#e6c994';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -13, 6, Math.PI, TAU);
        ctx.stroke();
        ctx.fillStyle = '#142837';
        ctx.fillRect(-10, -13, 20, 27);
        ctx.strokeRect(-10, -13, 20, 27);
        ctx.fillStyle = '#ffe6a2';
        ctx.fillRect(-6, -9, 12, 18);
        ctx.strokeStyle = '#9e7846';
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(0, 13);
        ctx.stroke();
        ctx.fillStyle = '#e6c994';
        ctx.fillRect(-13, 14, 26, 3);
        ctx.restore();
      }
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff0c9';
      ctx.fillText('기억 등불 · ' + Math.ceil(a.remaining) + '초', 0, -a.r - 34);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#e8d8b7';
      ctx.fillText(
        a.charge > 0 ? '복원 ' + Math.floor((a.charge / a.required) * 100) + '%' : '원 안에 잠시 머물기',
        0,
        a.r + 16
      );
    }
    ctx.restore();
  }
  function recordBeacon(g, t) {
    const r = g.recordTarget;
    if (g.mode !== 'story' || !r || r.recovered) return;
    const m = V.anchorMarker(r, g.p);
    ctx.save();
    ctx.translate(m.x, m.y);
    if (m.edge) edgeArrow(m.angle, true);
    else
      objectiveProp(
        r.r,
        true,
        r.charge / r.needed,
        '기록 장치 · 회수 ' + Math.floor(clamp(r.charge / r.needed, 0, 1) * 100) + '%',
        '범위 안에서 1.25초 대기',
        t
      );
    ctx.restore();
  }
  function storyPressureWarning(g, t) {
    const q = g.storyPressure;
    if (g.mode !== 'story' || !q || q.warning <= 0) return;
    const x = q.x - g.p.x + V.width / 2,
      y = q.y - g.p.y + V.height / 2;
    ctx.save();
    const reduced = TG.store.data.settings.reduceFX;
    if (!reduced) {
      ctx.fillStyle = PAL.hostileFill;
      ctx.beginPath();
      ctx.arc(x, y, q.r, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = PAL.hostile;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(x, y, q.r, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#ffe3bc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, q.r - 7, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - q.warning / 1.4));
    ctx.stroke();
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#fff0cf';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#201523';
    ctx.shadowBlur = reduced ? 0 : 5;
    ctx.fillText('침식 경고 · 이동!', x, y - q.r - 18);
    ctx.restore();
  }
  function storyGateMarker(g, t) {
    const q = g.storyGate;
    if (g.mode !== 'story' || g.storyTraining || !q || q.done) return;
    const ready =
      q.kind === 'archive'
        ? g.recordTarget?.recovered === true
        : q.guardIds.length > 0 && q.defeated.length === q.guardIds.length;
    const m = V.anchorMarker(q, g.p);
    ctx.save();
    ctx.translate(m.x, m.y);
    if (m.edge) edgeArrow(m.angle, ready);
    else if (q.kind === 'approach') {
      const lock = '잠김 · 회선 수호자 처치 후 작동',
        progress = q.charge / q.needed;
      objectiveProp(
        q.r,
        ready,
        progress,
        '안내 스위치',
        ready
          ? q.charge > 0
            ? '작동 ' + Math.floor(clamp(progress, 0, 1) * 100) + '% · 원 안에서 버티기'
            : '원 안에 머물러 작동'
          : lock,
        t
      );
    } else {
      ctx.lineWidth = 2;
      ctx.setLineDash(ready ? [] : [6, 6]);
      circle(0, 0, q.r, ready ? PAL.goalFill : PAL.lockedFill, ready ? PAL.goal : PAL.locked);
      ctx.setLineDash([]);
      if (ready && q.charge > 0) {
        ctx.strokeStyle = '#fff1c4';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, q.r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(q.charge / q.needed, 0, 1));
        ctx.stroke();
      }
      carriageDoor(ready, q.kind === 'escort' ? '귀환로 · 열차 문' : '기록 귀환 · 열차 문', t);
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ready ? PAL.goalText : '#c1cddd';
      ctx.fillText(
        ready
          ? '원 안에 머물러 탑승'
          : q.kind === 'archive'
            ? '기록장치를 먼저 회수'
            : '수호 잔향을 먼저 제거',
        0,
        q.r + 16
      );
    }
    ctx.restore();
  }
  function snowBeacons(g, t) {
    if (g.mode !== 'story' || g.storyBattle !== 'snowMission') return;
    for (const r of g.signalTargets || []) {
      if (r.recovered) continue;
      const m = V.anchorMarker(r, g.p);
      ctx.save();
      ctx.translate(m.x, m.y);
      if (m.edge) edgeArrow(m.angle, true);
      else
        objectiveProp(
          r.r,
          true,
          r.charge / r.needed,
          r.name + ' · ' + Math.floor(clamp(r.charge / r.needed, 0, 1) * 100) + '%',
          '반경 안에서 회수',
          t
        );
      ctx.restore();
    }
  }
  function companion(g, t) {
    const m = g.mare;
    if (g.mode !== 'story' || !m) return;
    const x = m.x - g.p.x + V.width / 2,
      y = m.y - g.p.y + V.height / 2;
    if (x < -100 || x > V.width + 100 || y < -100 || y > V.height + 100) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#02040c88';
    ctx.beginPath();
    ctx.ellipse(0, 18, 17, 5, 0, 0, TAU);
    ctx.fill();
    const frame = m.moving ? 1 + (Math.floor(t * 8) % 2) : 0,
      face = clamp(m.face | 0, 0, 3),
      w = 80,
      h = 80,
      bob = m.moving && !TG.store.data.settings.reduceFX ? Math.sin(t * 16) * 1 : 0;
    if (ready(images.mare)) {
      const cw = images.mare.naturalWidth / 4,
        ch = (images.mare.naturalHeight || images.mare.naturalWidth * 0.75) / 3;
      ctx.drawImage(images.mare, face * cw, frame * ch, cw, ch, -w / 2, -h * 0.77 + bob, w, h);
    } else circle(0, -8, 15, '#95bcd6', '#e1e8ed');
    ctx.lineWidth = 1.5;
    circle(0, 0, 21, null, m.cooldown <= 0 ? '#a8dce6aa' : '#7990a044');
    if ((g.party || []).length <= 1) {
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c8e5ee';
      ctx.fillText('마레', 0, -h * 0.77 - 7);
    }
    ctx.restore();
    if (m.pulse > 0) {
      const px = V.width / 2,
        py = V.height / 2;
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#c0ebff';
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(px, py - 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(px, py - 12, 34, 43, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#e1f5ff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('마레의 보호', px, py - 63);
      ctx.restore();
    }
  }
  function patientScene(g, t) {
    const pt = g.patient,
      gate = g.trainExit;
    if (g.storyBattle !== 'velaEscort' || !pt || !gate) return;
    const drawAt = pos => ({ x: pos.x - g.p.x + V.width / 2, y: pos.y - g.p.y + V.height / 2 });
    const door = drawAt(gate);
    ctx.save();
    ctx.translate(door.x, door.y);
    if (door.x > -100 && door.x < V.width + 100 && door.y > -100 && door.y < V.height + 100) {
      ctx.lineWidth = 2;
      circle(0, 0, gate.r, PAL.goalFill, PAL.goal);
      carriageDoor(true, '객차 문', t);
    }
    ctx.restore();
    const p = drawAt(pt);
    if (p.x < -95 || p.x > V.width + 95 || p.y < -110 || p.y > V.height + 95) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#030a1588';
    ctx.beginPath();
    ctx.ellipse(0, 18, 16, 5, 0, 0, TAU);
    ctx.fill();
    if (pt.phase === 'stabilize') {
      ctx.save();
      ctx.rotate(-0.28);
      ctx.fillStyle = '#ded2c3';
      ctx.beginPath();
      ctx.ellipse(0, -5, 23, 12, 0, 0, TAU);
      ctx.fill();
      circle(-14, -12, 11, '#e2bfae', '#e3d8d5');
      ctx.fillStyle = '#59616f';
      ctx.beginPath();
      ctx.arc(-14, -18, 11, Math.PI, TAU);
      ctx.fill();
      ctx.strokeStyle = '#3d4355';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-18, -12);
      ctx.lineTo(-15, -12);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = '#abb4c8';
      ctx.beginPath();
      ctx.moveTo(-13, 13);
      ctx.lineTo(-15, -11);
      ctx.lineTo(12, -11);
      ctx.lineTo(15, 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e9d4c2';
      ctx.fillRect(-8, -17, 16, 11);
      circle(0, -28, 13, '#e0b9a4', '#e6d5c4');
      ctx.fillStyle = '#5f6878';
      ctx.beginPath();
      ctx.arc(0, -34, 13, Math.PI, TAU);
      ctx.fill();
      ctx.fillStyle = '#f3e6ce';
      ctx.fillRect(-7, 1, 14, 4);
      if (pt.pose > 0 && pt.phase === 'escort') {
        ctx.fillStyle = '#f6e4ce';
        ctx.fillRect(-7, 12, 4, 5);
        ctx.fillRect(4, 12, 4, 5);
      }
    }
    if (pt.shield > 0) {
      ctx.strokeStyle = '#e9cb89';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -13, 29, 39, 0, 0, TAU);
      ctx.stroke();
    }
    const hp = clamp(pt.hp / pt.maxHp, 0, 1);
    ctx.fillStyle = '#141e30';
    ctx.fillRect(-26, -67, 52, 7);
    ctx.fillStyle = hp > 0.45 ? '#9dd0ba' : '#e59a9f';
    ctx.fillRect(-25, -66, 50 * hp, 5);
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#faf0d8';
    ctx.fillText(pt.phase === 'stabilize' ? '구조 대상 · 처치 중' : '구조 대상 · 호위 중', 0, -77);
    ctx.restore();
  }
  function patientWarning(g, t) {
    const pt = g.patient;
    if (g.storyBattle !== 'velaEscort' || !pt || pt.warning <= 0) return;
    const x = pt.x - g.p.x + V.width / 2,
      y = pt.y - g.p.y + V.height / 2,
      progress = 1 - pt.warning / 1.6;
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = PAL.hostile;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(x - 155, y - 92);
    ctx.lineTo(x, y - 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = PAL.hostileText;
    ctx.beginPath();
    ctx.arc(x, y - 15, 40, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
    ctx.stroke();
    ctx.fillStyle = PAL.hostileText;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('위험! 환자를 노리는 공격', x, y - 105);
    ctx.restore();
  }
  function otherCompanions(g, t) {
    if (g.mode !== 'story') return;
    const spriteRows = { aster: 0, noa: 1, vela: 2 };
    const reduced = TG.store.data.settings.reduceFX;
    for (const a of g.allies || []) {
      const def = TG.PARTY.find(x => x.id === a.id),
        x = a.x - g.p.x + V.width / 2,
        y = a.y - g.p.y + V.height / 2;
      if (x < -90 || x > V.width + 90 || y < -90 || y > V.height + 90) continue;
      const color = def?.color || '#b5b8c7',
        moving = !!a.moving;
      const bob = moving && !reduced ? Math.sin(t * 14) * 1.3 : 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#02040c88';
      ctx.beginPath();
      ctx.ellipse(0, 18, 17, 5, 0, 0, TAU);
      ctx.fill();
      // Draw the support aura behind the sprite so it cannot wash out faces or outlines.
      if (a.pulse > 0) {
        ctx.lineWidth = 2;
        circle(0, -12, 30, reduced ? null : color + '16', color + 'bb');
      }
      // Three original full-body chibi frames per ally; mirror for left-facing travel.
      if (ready(images.allies) && spriteRows[a.id] !== undefined) {
        const frame = moving ? 1 + (Math.floor(t * 8) % 2) : 0;
        const cw = images.allies.naturalWidth / 3,
          ch = images.allies.naturalHeight / 3;
        ctx.save();
        if (a.face === 3) {
          ctx.scale(-1, 1);
        }
        if (a.id === 'vela' && a.carePose > 0) {
          ctx.translate(0, 9);
          ctx.scale(1, 0.82);
        }
        ctx.drawImage(images.allies, frame * cw, spriteRows[a.id] * ch, cw, ch, -37, -62 + bob, 74, 83);
        ctx.restore();
      } else if (ready(images.portraits)) {
        const order = ['mare', 'aster', 'noa', 'vela', 'iris', 'crow'],
          idx = order.indexOf(a.id);
        if (idx >= 0) {
          const cw = images.portraits.naturalWidth / 3,
            ch = images.portraits.naturalHeight / 2;
          ctx.fillStyle = '#16253d';
          ctx.beginPath();
          ctx.moveTo(0, -33 + bob);
          ctx.lineTo(19, 13 + bob);
          ctx.lineTo(-19, 13 + bob);
          ctx.closePath();
          ctx.fill();
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, -23 + bob, 18, 0, TAU);
          ctx.clip();
          ctx.drawImage(
            images.portraits,
            (idx % 3) * cw,
            Math.floor(idx / 3) * ch,
            cw,
            ch,
            -18,
            -41 + bob,
            36,
            36
          );
          ctx.restore();
        }
      } else {
        circle(0, -18 + bob, 15, color, '#e1e8ed');
      }
      if (a.pulse > 0 && !reduced) {
        const label =
          { aster: '기록 표식', noa: '신호 차단', vela: '응급 회복', iris: '서리 추적', crow: '침식 공격' }[
            a.id
          ] || '지원';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f9efd6';
        ctx.fillText(label, 0, -79);
      }
      // With a full party, HUD portrait/name labels replace overlapping floating name tags.
      if ((g.party || []).length <= 1) {
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e9eff6';
        ctx.fillText(def?.name || a.id, 0, -65);
      }
      ctx.restore();
    }
  }
  function hero(g, t) {
    const x = V.width / 2,
      y = V.height / 2;
    ctx.save();
    ctx.translate(x, y);
    const grad = ctx.createRadialGradient(-17, 14, 0, -17, 14, 90);
    grad.addColorStop(0, '#f7bc7328');
    grad.addColorStop(1, '#f7bc7300');
    ctx.fillStyle = grad;
    ctx.fillRect(-107, -76, 180, 180);
    ctx.fillStyle = '#02040c99';
    ctx.beginPath();
    ctx.ellipse(0, 22, 21, 6, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#c8bd9677';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, TAU);
    ctx.stroke();
    const frame = g.moving ? 1 + (Math.floor(t * 8) % 2) : 0,
      index = frame * 4 + g.face,
      w = 91,
      h = 91,
      bob = g.moving && !TG.store.data.settings.reduceFX ? Math.sin(t * 16) * 1.2 : 0;
    const hurt = g.time - g.lastHit < 0.3;
    if (g.overcharge > 0) {
      const reduced = TG.store.data.settings.reduceFX;
      ctx.lineWidth = 2;
      circle(0, -8, reduced ? 39 : 39 + Math.sin(t * 5) * 2, '#f3cc7c0d', '#efd18b99');
    }
    if (g.dash.invulnerable) {
      if (!TG.store.data.settings.reduceFX && TG.store.data.settings.quality !== 'low') {
        for (let n = 2; n >= 1; n--) {
          ctx.globalAlpha = n === 2 ? 0.1 : 0.23;
          sprite(images.hero, index, 4, 144, -g.dash.x * 21 * n, -g.dash.y * 21 * n, w, h);
        }
        ctx.globalAlpha = 1;
      }
      circle(0, 0, 27, null, '#eadbb8');
    }
    if (g.status === 'ended' && g.p.hp <= 0) {
      ctx.rotate(-0.2);
      ctx.globalAlpha = 0.45;
    } else ctx.globalAlpha = hurt ? 0.6 : 1;
    if (!sprite(images.hero, index, 4, 144, 0, bob, w, h)) {
      if (ready(images.fallback)) ctx.drawImage(images.fallback, -35, -62, 70, 84);
      else circle(0, 0, 15, '#c4cfdf', '#d1b780');
    }
    ctx.globalAlpha = 1;
    if (g.p.hp / g.p.maxHp <= 0.3) {
      ctx.lineWidth = 1.8;
      circle(0, 0, 23, null, '#ec91b0');
    }
    if (g.commandEffects?.ward > 0) {
      ctx.lineWidth = 2;
      circle(0, -10, 47, '#83c4e919', '#91d9ef');
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c9edff';
      ctx.fillText('지휘 장막', 0, -62);
    }
    if (g.p.shield) {
      ctx.strokeStyle = '#afd8f0';
      ctx.beginPath();
      ctx.ellipse(0, -12, 33, 44, 0, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < g.p.orbit; i++) {
      const a = t * 2.4 + (i * TAU) / g.p.orbit;
      ctx.save();
      ctx.translate(Math.cos(a) * 65, Math.sin(a) * 65);
      ctx.rotate(a);
      ctx.fillStyle = g.synergies.frostOrbit ? '#aee5fb' : '#e8d1a1';
      ctx.fillRect(-3, -10, 6, 20);
      ctx.restore();
    }
    ctx.restore();
  }
  V.draw = function (now) {
    if (!ctx) return;
    const g = TG.engine.g,
      t = g ? g.time : now / 1000,
      cx = g?.p.x || 0,
      cy = g?.p.y || 0,
      W = V.width,
      H = V.height;
    ctx.save();
    if (g && g.shake && !TG.store.data.settings.reduceFX)
      ctx.translate(Math.sin(t * 130) * g.shake * 0.5, Math.cos(t * 190) * g.shake * 0.5);
    background(g, t, cx, cy);
    if (g) {
      memoryAnchor(g, t);
      recordBeacon(g, t);
      storyGateMarker(g, t);
      snowBeacons(g, t);
      patientScene(g, t);
      const sx = x => x - cx + W / 2,
        sy = y => y - cy + H / 2;
      for (const h of g.hazards) {
        ctx.lineWidth = 1.5;
        const warning = h.age < h.warning;
        ctx.setLineDash(warning ? [6, 5] : []);
        circle(sx(h.x), sy(h.y), h.r, warning ? PAL.hostileFill : '#23102a99', PAL.hostile);
        ctx.setLineDash([]);
        if (warning) {
          ctx.fillStyle = '#f4c7dc';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('소거 예고', sx(h.x), sy(h.y) + 3);
        }
      }
      for (const shock of g.aftershocks || []) {
        const x = sx(shock.x),
          y = sy(shock.y);
        if (x + shock.r < 0 || x - shock.r > W || y + shock.r < 0 || y - shock.r > H) continue;
        const warning = shock.age < shock.warning;
        ctx.lineWidth = 2;
        ctx.setLineDash(warning ? [6, 5] : []);
        circle(
          x,
          y,
          shock.r,
          warning ? PAL.hostileFill : TG.store.data.settings.reduceFX ? null : '#e8789a22',
          warning ? PAL.hostile : '#ffc2d2'
        );
        ctx.setLineDash([]);
        if (warning && !TG.store.data.settings.reduceFX) {
          ctx.beginPath();
          ctx.arc(
            x,
            y,
            shock.r + 4,
            -Math.PI / 2,
            -Math.PI / 2 + TAU * clamp(shock.age / shock.warning, 0, 1)
          );
          ctx.stroke();
        }
        ctx.fillStyle = '#f6d4df';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(warning ? '잔진동 예고' : '잔진동', x, y + 3);
      }
      if (g.wave) {
        ctx.setLineDash([5, 5]);
        for (const point of g.wave.points) {
          circle(sx(point.x), sy(point.y), 22, '#b5759222', '#edbdad');
        }
        ctx.setLineDash([]);
      }
      // Scripted arrivals: a shrinking crimson marker shows exactly where and when a foe appears.
      for (const point of g.script?.pending || []) {
        const x = sx(point.x),
          y = sy(point.y),
          k = clamp(point.t / point.max, 0, 1),
          big = point.role === 'guardian',
          r = big ? 46 : 22;
        ctx.lineWidth = big ? 2.5 : 1.75;
        ctx.setLineDash([5, 5]);
        circle(x, y, r, PAL.hostileFill, PAL.hostile);
        ctx.setLineDash([]);
        circle(x, y, r * (1 - k) + 3, '#e8829c55', null);
        if (big) {
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffd9e2';
          ctx.fillText('회선 수호자 출현', x, y - r - 10);
        }
      }
      for (const flame of g.flames) {
        circle(sx(flame.x), sy(flame.y), flame.r, '#e4a04722', '#efba7799');
      }
      for (const drop of g.eliteDrops || []) {
        const x = sx(drop.x),
          y = sy(drop.y);
        if (x < -30 || x > W + 30 || y < -35 || y > H + 35) continue;
        ctx.save();
        ctx.translate(x, y);
        const reduced = TG.store.data.settings.reduceFX;
        ctx.lineWidth = 1.5;
        circle(0, 0, reduced ? 17 : 17 + Math.sin(t * 4) * 1.5, '#edc47722', '#f1cf8c');
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#f4d49b';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();
        ctx.fillStyle = '#fff2d5';
        ctx.fillRect(-1, -5, 2, 10);
        ctx.fillRect(-4, -1, 8, 2);
        ctx.fillStyle = '#f3d9ab';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(drop.life <= 5 ? Math.ceil(Math.max(0, drop.life)) + '초' : '정예의 불씨', 0, -23);
        ctx.restore();
      }
      for (const d of g.drops) {
        const x = sx(d.x),
          y = sy(d.y);
        if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        const big = d.value > 1;
        ctx.fillStyle = big ? '#ffffff' : PAL.memory;
        ctx.fillRect(big ? -4 : -3, big ? -4 : -3, big ? 8 : 6, big ? 8 : 6);
        ctx.restore();
      }
      for (const link of g.links) {
        ctx.strokeStyle = '#d7e9ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx(link.x1), sy(link.y1));
        ctx.lineTo(sx(link.x2), sy(link.y2));
        ctx.stroke();
      }
      for (const e of g.enemies) enemy(e, g, t);
      for (const b of g.bullets) {
        ctx.strokeStyle = g.levels.ember ? '#edd09a' : '#c4ecfa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx(b.x), sy(b.y));
        ctx.lineTo(sx(b.x) - b.vx * 0.023, sy(b.y) - b.vy * 0.023);
        ctx.stroke();
      }
      for (const b of g.hostile) {
        circle(sx(b.x), sy(b.y), 6.5, PAL.hostile, '#ffe9ef');
        circle(sx(b.x), sy(b.y), 2.3, '#fff4f6');
      }
      const low = TG.store.data.settings.quality === 'low';
      if (!low)
        for (const p of g.particles) {
          ctx.globalAlpha = p.life / p.max;
          ctx.fillStyle = p.color;
          ctx.fillRect(sx(p.x), sy(p.y), p.size, p.size);
        }
      ctx.globalAlpha = 1;
      for (const r of g.rings) {
        ctx.globalAlpha = r.life / r.max;
        circle(sx(r.x), sy(r.y), r.r * (1.5 - (r.life / r.max) * 0.5), null, r.color);
      }
      ctx.globalAlpha = 1;
      companion(g, t);
      otherCompanions(g, t);
      hero(g, t);
      patientWarning(g, t);
      storyPressureWarning(g, t);
      if (g.flash && !TG.store.data.settings.reduceFX) {
        ctx.fillStyle = `rgba(180,57,95,${g.flash * 0.4})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
    ctx.restore();
  };
})();
