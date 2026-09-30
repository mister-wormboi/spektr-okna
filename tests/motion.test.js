const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = name => fs.readFileSync(path.join(__dirname, '../assets/js/', name), 'utf8');
const classList = () => {
  const values = new Set();
  return { add: v => values.add(v), remove: v => values.delete(v), contains: v => values.has(v), toggle: (v, on) => on ? values.add(v) : values.delete(v) };
};

function story({ reduced = false, observer = true, animation = true } = {}) {
  const pending = [];
  const animations = [];
  const listeners = new Map();
  let trigger;
  let connected = false;
  const media = { matches: reduced, addEventListener: () => {}, removeEventListener: () => {} };
  const layers = Array.from({ length: 4 }, () => ({ style: {}, ...(animation ? {
    animate: () => {
      const a = { cancelled: false, finished: new Promise(resolve => pending.push(resolve)), cancel() { this.cancelled = true; } };
      animations.push(a);
      return a;
    },
  } : {}) }));
  const svg = { setAttribute() {}, querySelectorAll: () => layers };
  const stage = { replaceChildren() {} };
  const section = { classList: classList(), querySelector: () => stage };
  const document = {
    hidden: false, querySelector: () => section, createElementNS: () => svg,
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name),
  };
  class Observer {
    constructor(callback) { trigger = () => callback([{ isIntersecting: true, intersectionRatio: 1 }]); }
    observe() { connected = true; }
    disconnect() { connected = false; }
  }
  vm.runInNewContext(source('window-story.js'), {
    document, window: { matchMedia: () => media, ...(observer ? { IntersectionObserver: Observer } : {}) },
    IntersectionObserver: Observer,
  });
  return { section, layers, animations, pending, listeners, document, trigger, connected: () => connected };
}

test('window illustration plays once and releases completed animations', async () => {
  const s = story();
  assert.equal(s.animations.length, 0);
  s.trigger(); s.trigger();
  assert.equal(s.animations.length, 4);
  assert.equal(s.connected(), false);
  s.pending.forEach(resolve => resolve());
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(s.section.classList.contains('is-complete'));
  assert.ok(s.animations.every(a => a.cancelled));
  assert.equal(s.listeners.size, 0);
  assert.deepEqual(s.layers.map(l => l.style.transform), [-205, -67, 94, 238].map(n => `translateX(${n}px)`));
  s.trigger();
  assert.equal(s.animations.length, 4);
});

test('window illustration has static fallbacks and stops in hidden tabs', () => {
  for (const options of [{ reduced: true }, { observer: false }, { animation: false }]) {
    const s = story(options);
    s.trigger?.();
    assert.ok(s.section.classList.contains('is-complete'));
    assert.equal(s.animations.length, 0);
  }
  const s = story();
  s.trigger();
  s.document.hidden = true;
  s.listeners.get('visibilitychange')();
  assert.ok(s.section.classList.contains('is-complete'));
  assert.ok(s.animations.every(a => a.cancelled));
});

test('scroll frames reuse hero measurements instead of forcing layout reads', () => {
  let reads = 0;
  const frames = [];
  const events = {};
  const hero = { classList: classList(), style: { setProperty() {}, removeProperty() {} }, getBoundingClientRect() { reads++; return { top: 100, height: 700 }; } };
  const progress = { style: {} };
  const window = { scrollY: 0, matchMedia: () => ({ matches: false, addListener() {} }), addEventListener: (name, fn) => { events[name] = fn; } };
  vm.runInNewContext(source('motion.js'), {
    window, innerHeight: 800,
    document: { hidden: false, documentElement: { scrollHeight: 4000 }, addEventListener() {}, querySelector: s => s === '.hero' ? hero : s === '.reading-progress span' ? progress : null, querySelectorAll: () => [] },
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
  });
  frames.shift()();
  const initialReads = reads;
  for (let i = 1; i <= 5; i++) {
    window.scrollY = i * 100;
    events.scroll(); events.scroll();
    assert.equal(frames.length, 1);
    frames.shift()();
  }
  assert.equal(reads, initialReads);
  window.scrollY = 1500;
  events.scroll(); frames.shift()();
  assert.equal(hero.classList.contains('is-in-view'), false);
});
