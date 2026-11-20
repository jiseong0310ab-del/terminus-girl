'use strict';
(() => {
  const A = (TG.audio = {});
  let ctx = null,
    bgmGain = null,
    sfxGain = null,
    timer = null,
    beat = 0,
    active = false,
    scene = 'hub',
    lastShot = 0;
  function node(freq, time, duration, volume, type = 'sine', gain = sfxGain) {
    if (!ctx || !gain) return;
    const osc = ctx.createOscillator(),
      env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freq), time);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(volume, time + 0.025);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(env);
    env.connect(gain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }
  A.unlock = function () {
    try {
      if (!ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        ctx = new Audio();
        bgmGain = ctx.createGain();
        sfxGain = ctx.createGain();
        bgmGain.connect(ctx.destination);
        sfxGain.connect(ctx.destination);
        A.sync();
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (!timer) timer = setInterval(schedule, 700);
      active = true;
    } catch {}
  };
  function schedule() {
    if (!ctx || ctx.state !== 'running' || !active) return;
    const patterns = {
      hub: [196, 246.94, 293.66, 220, 174.61, 220, 261.63, 196],
      mirror: [146.83, 174.61, 220, 164.81, 146.83, 196, 220, 174.61],
      snow: [130.81, 155.56, 196, 174.61, 130.81, 164.81, 196, 155.56],
      terminus: [146.83, 220, 174.61, 246.94, 146.83, 196, 233.08, 220],
      boss: [110, 146.83, 130.81, 164.81, 110, 155.56, 146.83, 130.81]
    };
    const pat = patterns[scene] || patterns.hub,
      f = pat[beat++ % pat.length],
      t = ctx.currentTime;
    node(f, t, 1.8, 0.055, 'sine', bgmGain);
    if (beat % 2 === 0) node(f * 2, t + 0.16, 1.5, 0.025, 'triangle', bgmGain);
  }
  A.scene = function (name) {
    if (scene !== name) {
      scene = name;
      beat = 0;
    }
  };
  A.sync = function () {
    if (!ctx) return;
    const s = TG.store.data.settings;
    bgmGain.gain.setTargetAtTime(s.bgm, ctx.currentTime, 0.1);
    sfxGain.gain.setTargetAtTime(s.sfx, ctx.currentTime, 0.05);
  };
  A.suspend = function () {
    active = false;
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  };
  A.play = function (name) {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    if (name === 'shot') {
      if (t - lastShot < 0.16) return;
      lastShot = t;
      node(700, t, 0.07, 0.06, 'triangle');
    } else if (name === 'dash') {
      node(300, t, 0.16, 0.12, 'sine');
      node(600, t + 0.03, 0.12, 0.06, 'sine');
    } else if (name === 'hurt') {
      node(92, t, 0.18, 0.16, 'triangle');
    } else if (name === 'card') {
      [440, 554, 659].forEach((f, i) => node(f, t + i * 0.08, 0.25, 0.1, 'sine'));
    } else if (name === 'clear') {
      [294, 370, 440, 587].forEach((f, i) => node(f, t + i * 0.13, 0.65, 0.09, 'triangle'));
    } else if (name === 'boss') {
      [110, 116, 220].forEach((f, i) => node(f, t + i * 0.1, 0.8, 0.08, 'triangle'));
    } else if (name === 'start') {
      node(392, t, 0.4, 0.08);
      node(587, t + 0.15, 0.5, 0.07);
    }
  };
})();
