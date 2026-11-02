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

function story({ reduced = false, observer = true, animation = true, fallback = false, mobile = false, mobilePlayback = false } = {}) {
  const frames=new Map();let frameId=0;
  const pending = [];
  const animations = [];
  const listeners = new Map();
  let trigger;
  let revealTrigger;
  let connected = false;
  const observers = new Map();
  let rendererChanged;
  const media = { matches: reduced, addEventListener: () => {}, removeEventListener: () => {} };
  let layoutChanged;
  const layout = { matches: mobile, addEventListener: (_, fn) => { layoutChanged = fn; } };
  const makeLayers = () => Array.from({ length: 4 }, () => ({ attributes: {}, setAttribute(k,v) {this.attributes[k]=v;}, removeAttribute(k) {delete this.attributes[k];}, style: {removeProperty(k) {delete this[k];}}, getBBox: () => ({x:0,y:0,width:300,height:420}), ...(animation ? {
    animate: (keyframes, options) => {
      const a = { keyframes, options, cancelled: false, finished: new Promise(resolve => pending.push(resolve)), cancel() { this.cancelled = true; } };
      animations.push(a);
      return a;
    },
  } : {}) }));
  const layers = makeLayers();
  const fallbackLayers = makeLayers();
  const viewport = { classList: classList() };
  const fallbackSvg = { querySelector: () => null, querySelectorAll: () => fallbackLayers, closest: () => viewport };
  const svg = { querySelector: () => null, setAttribute() {}, querySelectorAll: () => layers };
  const stage = { replaceChildren() {} };
  const section = { classList: classList(), querySelector: () => stage };
  const document = {
    hidden: false, querySelector: selector => selector === '.window-story' ? section : fallback ? fallbackSvg : null, createElementNS: () => svg,
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name),
  };
  class Observer {
    constructor(callback) { this.callback = callback; }
    observe(target) {
      connected = true;
      observers.set(target, (ratio = 1) => this.callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]));
      if (target === stage) {
        if (!revealTrigger) revealTrigger = observers.get(target);
        trigger = observers.get(target);
      }
    }
    disconnect() { connected = false; }
  }
  vm.runInNewContext(source('window-story.js'), {
    document, window: { ...(mobilePlayback ? {requestAnimationFrame(fn){frames.set(++frameId,fn);return frameId;},cancelAnimationFrame(id){frames.delete(id);}} : {}), matchMedia: query => query.includes('max-width') ? layout : media, MutationObserver: true, ...(observer ? { IntersectionObserver: Observer } : {}) },
    IntersectionObserver: Observer,
    MutationObserver: class { constructor(fn) { rendererChanged = fn; } observe() {} disconnect() {} },
  });
  return { step(time){const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn(time));}, frames, section, layers, animations, pending, listeners, document, trigger, reveal: ratio => revealTrigger(ratio), resize: value => { layout.matches = value; layoutChanged(); }, connected: () => connected,
    viewport, fallbackLayers, enterFallback: ratio => observers.get(viewport)?.(ratio), rendererChanged: () => rendererChanged?.() };
}


test('mobile window separates into four readable panels and reflows during playback', () => {
  const s = story({ mobile: true });
  s.trigger();
  assert.equal(s.animations.length, 0);
  assert.deepEqual(s.layers.map(l => l.attributes.transform), [
    'translate(60, 25) scale(0.6666666666666666)',
    'translate(380, 25) scale(0.6666666666666666)',
    'translate(60, 405) scale(0.6666666666666666)',
    'translate(380, 405) scale(0.6666666666666666)',
  ]);
  assert.ok(s.layers.every(l => !l.style.transform));
  s.resize(false);
  assert.ok(s.animations.every(a => a.cancelled));
  assert.deepEqual(s.layers.map(l => l.style.transform), [-205, -67, 94, 238].map(n => `translateX(${n}px)`));
  s.resize(true);
  assert.match(s.layers[3].attributes.transform, /380, 405/);
  assert.ok(s.layers.every(l => !l.style.transform));
  const reduced = story({ mobile: true, reduced: true });
  assert.equal(reduced.animations.length, 0);
  assert.match(reduced.layers[0].attributes.transform, /60, 25/);
});

test('window illustration plays once and releases completed animations', async () => {
  const s = story();
  assert.equal(s.animations.length, 0);
  s.trigger(); s.trigger();
  assert.equal(s.animations.length, 4);
  assert.equal(s.connected(), true);
  s.pending.forEach(resolve => resolve());
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(s.section.classList.contains('is-complete'));
  assert.ok(s.animations.every(a => a.cancelled));
  assert.equal(s.connected(), false);
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

test('upper fallback and lower SVG start independently with identical timing', async () => {
  const s = story({ fallback: true });
  s.enterFallback(.29);
  assert.equal(s.animations.length, 0);
  s.enterFallback(.3);
  assert.equal(s.animations.length, 4);
  assert.equal(s.section.classList.contains('is-playing'), false);
  assert.equal(s.viewport.classList.contains('is-playing'), true);
  s.pending.forEach(resolve => resolve());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(s.viewport.classList.contains('is-complete'), true);
  assert.equal(s.section.classList.contains('is-complete'), false);
  s.trigger();
  s.enterFallback(1);
  assert.equal(s.animations.length, 8);
  assert.deepEqual(s.animations.slice(0, 4).map(a => a.options), s.animations.slice(4).map(a => a.options));
  assert.equal(s.animations[0].options.duration, 1800);
  assert.equal(s.animations[3].options.delay, 300);
  assert.equal(s.viewport.classList.contains('is-playing'), false);
  assert.deepEqual(s.fallbackLayers.map(l => l.style.transform), [-105, -35, 55, 130].map(n => `translateX(${n}px)`));
});

test('SVG playback stops offscreen, or when the WebGL renderer replaces the fallback', () => {
  const lower = story();
  lower.trigger(); lower.trigger(0);
  assert.ok(lower.animations.every(a => a.cancelled));
  assert.equal(lower.connected(), false);
  for (const replace of [false, true]) {
    const s = story({ fallback: true });
    s.enterFallback(1);
    if (replace) { s.viewport.classList.add('is-rendered'); s.rendererChanged(); }
    else s.enterFallback(0);
    assert.ok(s.animations.every(a => a.cancelled));
    assert.ok(s.viewport.classList.contains('is-complete'));
  }
  const rendered = story({ fallback: true });
  rendered.viewport.classList.add('is-rendered');
  rendered.enterFallback(1);
  assert.equal(rendered.animations.length, 0);
});

test('native reading progress needs no scroll handler or page-height measurement', () => {
  const events = {};
  vm.runInNewContext(source('motion.js'), {
    window: {
      CSS: { supports: () => true },
      matchMedia: () => ({ matches: false, addEventListener() {} }),
      addEventListener: name => { events[name] = true; },
    },
    document: {
      querySelector: s => s === '.reading-progress span' ? { style: {} } : null,
      querySelectorAll: () => [],
      get documentElement() { throw new Error('Native progress must not measure the page'); },
    },
    requestAnimationFrame: () => { throw new Error('Native progress must not schedule scroll frames'); },
  });
  assert.equal(events.scroll, undefined);
  assert.equal(events.resize, undefined);
});

test('reading progress batches scroll events and reuses the measured page height', () => {
  let reads = 0;
  const frames = [];
  const events = {};
  const progress = { style: {} };
  const window = { scrollY: 0, matchMedia: query => ({ matches: query.includes('pointer: fine'), addListener() {} }), addEventListener: (name, fn) => { events[name] = fn; } };
  vm.runInNewContext(source('motion.js'), {
    window, innerHeight: 800,
    document: { hidden: false, documentElement: { get scrollHeight() { reads++; return 4000; } }, addEventListener() {}, querySelector: s => s === '.reading-progress span' ? progress : null, querySelectorAll: () => [] },
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
  });
  frames.shift()();
  const initialReads = reads;
  assert.ok(initialReads > 0);
  for (let i = 1; i <= 5; i++) {
    window.scrollY = i * 100;
    events.scroll(); events.scroll();
    assert.equal(frames.length, 1);
    frames.shift()();
  }
  assert.equal(reads, initialReads);
  window.scrollY = 1500;
  events.scroll(); frames.shift()();
  assert.equal(progress.style.transform, 'scaleX(0.46875)');
});

test('reading progress does no background work in a hidden tab and catches up on return', () => {
  const frames = [], events = {};
  const progress = { style: {} };
  const document = {
    hidden: false, documentElement: { scrollHeight: 1600 },
    addEventListener: (name, fn) => { events[name] = fn; },
    querySelector: selector => selector === '.reading-progress span' ? progress : null,
    querySelectorAll: () => [],
  };
  const window = { scrollY: 0, matchMedia: () => ({ matches: false, addListener() {} }), addEventListener: (name, fn) => { events[name] = fn; } };
  vm.runInNewContext(source('motion.js'), {
    window, document, innerHeight: 800,
    requestAnimationFrame: fn => { frames.push(fn); },
  });
  frames.shift()();
  assert.equal(progress.style.transform, 'scaleX(0)');
  document.hidden = true;
  window.scrollY = 400;
  events.scroll(); events.scroll();
  assert.equal(frames.length, 0);
  document.hidden = false;
  events.visibilitychange();
  frames.shift()();
  assert.equal(progress.style.transform, 'scaleX(0.5)');
});

test('mobile reveal resets offscreen and starts again on reentry', () => {
  const s=story({mobile:true});
  s.reveal(.1);
  assert.equal(s.section.classList.contains('is-mobile-visible'),false);
  s.reveal(.3);s.trigger(.3);
  assert.equal(s.section.classList.contains('is-mobile-visible'),true);
  s.reveal(0);
  assert.equal(s.section.classList.contains('is-mobile-visible'),false);
  s.reveal(.3);
  assert.equal(s.section.classList.contains('is-mobile-visible'),true);
  assert.ok(s.layers.every(layer=>!layer.style.transform));
});

test('mobile assembly moves from a single window to four cells and replays after scrolling',()=>{
  const s=story({mobile:true,mobilePlayback:true});
  s.reveal(.5);s.trigger(.5);s.step(0);
  assert.ok(s.layers.every(l=>l.attributes.transform==='translate(212 209) scale(0.72)'));
  s.step(800);
  assert.notEqual(s.layers[0].attributes.transform,s.layers[3].attributes.transform);
  s.step(1800);
  assert.ok(s.section.classList.contains('is-complete'));
  assert.equal(s.frames.size,0);
  assert.match(s.layers[3].attributes.transform,/380, 405/);
  s.reveal(0);s.trigger(0);s.reveal(.5);s.trigger(.5);s.step(2000);
  assert.ok(s.layers.every(l=>l.attributes.transform==='translate(212 209) scale(0.72)'));
  s.trigger(0);
  assert.equal(s.frames.size,0);
});
