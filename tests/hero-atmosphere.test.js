const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/hero-atmosphere.js'), 'utf8');

function mount({ reducedMotion = false, saveData = false, observer = true, legacyMedia = false } = {}) {
  const events = {}, classes = new Set();
  let onIntersection, observing = false;
  const hero = {
    classList: { toggle: (name, active) => active ? classes.add(name) : classes.delete(name) },
  };
  const media = {
    matches: reducedMotion,
    ...(legacyMedia
      ? { addListener: callback => { events.motion = callback; } }
      : { addEventListener: (_, callback) => { events.motion = callback; } }),
  };
  const connection = { saveData, addEventListener: (_, callback) => { events.connection = callback; } };
  class Observer {
    constructor(callback) { onIntersection = callback; }
    observe(target) { assert.equal(target, hero); observing = true; }
    disconnect() { observing = false; }
  }
  const document = {
    hidden: false,
    querySelector: () => hero,
    addEventListener: (name, callback) => { events[name] = callback; },
  };
  const window = {
    matchMedia: () => media,
    addEventListener: (name, callback) => { events[name] = callback; },
    ...(observer ? { IntersectionObserver: Observer } : {}),
  };
  // No requestAnimationFrame, timers or geometry APIs: this controller must be event-driven.
  vm.runInNewContext(source, { document, window, navigator: { connection } });
  return {
    events, document, media, connection,
    active: () => classes.has('is-atmosphere-active'),
    observing: () => observing,
    visible: (value, ratio = value ? 1 : 0) => onIntersection([{ target: hero, isIntersecting: value, intersectionRatio: ratio }]),
  };
}

test('hero atmosphere runs only while visible and stops in hidden tabs', () => {
  const scene = mount();
  assert.equal(scene.active(), false);
  assert.equal(scene.observing(), true);
  scene.visible(true, 0);
  assert.equal(scene.active(), false);
  scene.visible(true);
  assert.equal(scene.active(), true);
  scene.document.hidden = true;
  scene.events.visibilitychange();
  assert.equal(scene.active(), false);
  scene.document.hidden = false;
  scene.events.visibilitychange();
  assert.equal(scene.active(), true);
  scene.visible(false);
  assert.equal(scene.active(), false);
});

test('reduced motion and data saving disable atmosphere, including live changes', () => {
  for (const options of [{ reducedMotion: true }, { saveData: true }]) {
    const scene = mount(options);
    scene.visible(true);
    assert.equal(scene.active(), false);
  }
  const scene = mount({ legacyMedia: true });
  scene.visible(true);
  scene.media.matches = true;
  scene.events.motion();
  assert.equal(scene.active(), false);
  scene.media.matches = false;
  scene.events.motion();
  assert.equal(scene.active(), true);
  scene.connection.saveData = true;
  scene.events.connection();
  assert.equal(scene.active(), false);
  scene.connection.saveData = false;
  scene.events.connection();
  assert.equal(scene.active(), true);
});

test('page restoration waits for fresh intersection', () => {
  const scene = mount();
  scene.visible(true);
  scene.events.pagehide();
  assert.equal(scene.active(), false);
  assert.equal(scene.observing(), false);
  scene.events.pageshow();
  assert.equal(scene.active(), false);
  assert.equal(scene.observing(), true);
  scene.visible(true);
  assert.equal(scene.active(), true);

});

test('unsupported visibility observation keeps a static scene', () => {
  const scene = mount({ observer: false });
  assert.equal(scene.active(), false);
  scene.events.pageshow();
  scene.events.visibilitychange();
  assert.equal(scene.active(), false);
});
