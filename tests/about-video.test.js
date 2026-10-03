const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/about.js'), 'utf8').split('/* Page scroll controls real footage; the video never plays on its own. */')[1];
function mount({ reducedMotion = false, saveData = false } = {}) {
  const listeners = {}, events = {}, frames = new Map(), classes = new Set();
  let nextFrame = 0, layoutReads = 0, time = 0;
  const seeks = [];
  const reduced = { matches: reducedMotion, addEventListener: (_, callback) => { reduced.change = callback; } };
  const video = {
    seeking: false, readyState: 2, duration: 12, dataset: { videoSrc: 'forest.mp4' }, src: '', loads: 0,
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) },
    pause() {}, load() { this.loads++; },
    getAttribute(name) { return this[name]; },
    addEventListener(name, callback) { events[name] = callback; },
    get currentTime() { return time; },
    set currentTime(value) { time = value; seeks.push(value); this.seeking = true; }
  };
  const window = { scrollY: 0, innerHeight: 800, addEventListener: (name, cb) => { listeners[name] = cb; }, removeEventListener: name => { delete listeners[name]; } };
  const root = { get scrollHeight() { layoutReads++; return 3200; } };
  const document = { hidden: false, body: {}, documentElement: root, querySelector: () => video, addEventListener: (name, cb) => { listeners[name] = cb; } };
  const context = { window, document, navigator: { connection: { saveData } }, matchMedia: () => reduced,
    requestAnimationFrame: cb => { frames.set(++nextFrame, cb); return nextFrame; }, cancelAnimationFrame: id => frames.delete(id) };
  vm.runInNewContext(source, context);
  const flush = () => { const current = [...frames.values()]; frames.clear(); current.forEach(cb => cb()); };
  events.loadedmetadata(); events.loadeddata(); flush();
  const seekDone = () => { video.seeking = false; events.seeked(); flush(); };
  return { video, listeners, events, window, document, reduced, seeks, classes, flush, seekDone, layoutReads: () => layoutReads };
}
test('real video follows scroll in both directions, without scroll geometry reads', () => {
  const page = mount(), reads = page.layoutReads();
  page.window.scrollY = 1200; page.listeners.scroll(); page.listeners.scroll(); page.flush();
  assert.equal(page.video.currentTime, 6);
  page.seekDone();
  page.window.scrollY = 600; page.listeners.scroll(); page.flush();
  assert.equal(page.video.currentTime, 3);
  assert.equal(page.layoutReads(), reads);
});
test('video waits for decoder and seeks to the latest scroll position after completion', () => {
  const page = mount();
  page.window.scrollY = 600; page.listeners.scroll(); page.flush();
  page.window.scrollY = 2000; page.listeners.scroll(); page.flush();
  assert.deepEqual(page.seeks, [3]);
  page.seekDone();
  assert.deepEqual(page.seeks, [3, 10]);
  page.seekDone();
  assert.deepEqual(page.seeks, [3, 10]);
});
test('video poster remains with reduced motion or save data; restoring motion reveals loaded video', () => {
  for (const options of [{ reducedMotion: true }, { saveData: true }]) {
    const page = mount(options);
    assert.equal(page.video.src, '');
    assert.equal(page.listeners.scroll, undefined);
    assert.equal(page.classes.has('is-ready'), false);
  }
  const page = mount();
  page.reduced.matches = true; page.reduced.change();
  assert.equal(page.listeners.scroll, undefined);
  assert.equal(page.classes.has('is-ready'), false);
  page.reduced.matches = false; page.reduced.change();
  assert.equal(page.classes.has('is-ready'), true);
  assert.equal(page.video.loads, 1);
});
test('hidden tabs stop seeking and an error restores the poster', () => {
  const page = mount();
  page.window.scrollY = 1200; page.document.hidden = true;
  page.listeners.scroll(); page.flush();
  assert.deepEqual(page.seeks, []);
  page.document.hidden = false; page.listeners.visibilitychange(); page.flush();
  assert.equal(page.video.currentTime, 6);
  page.events.error();
  assert.equal(page.classes.has('is-ready'), false);
  assert.equal(page.listeners.scroll, undefined);
});
