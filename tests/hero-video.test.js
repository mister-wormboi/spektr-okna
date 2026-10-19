const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function mount({ reduced = false, saveData = false } = {}) {
  const element = () => {
    const classes = new Set(), events = {};
    return {
      events, classList: { add: c => classes.add(c), remove: c => classes.delete(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c), contains: c => classes.has(c) },
      addEventListener: (name, fn) => { events[name] = fn; }, setAttribute() {},
    };
  };
  const video = { ...element(), paused: true, plays: 0, src: '', dataset: { src: 'curtains.mp4' },
    hasAttribute() { return Boolean(this.src); },
    pause() { this.paused = true; },
    play() { this.plays++; this.paused = false; return Promise.resolve(); },
  };
  const toggle = element(), header = element(), hero = element();
  hero.querySelector = selector => selector === 'video' ? video : toggle;
  const motion = { matches: reduced, addEventListener: (_, fn) => { motion.change = fn; } };
  const connection = { saveData, addEventListener() {} };
  const events = {};
  const document = { readyState: 'loading', hidden: false, querySelector: s => s === '.hero-cinema' ? hero : header, addEventListener: (name, fn) => { events[name] = fn; } };
  let intersection;
  const window = { IntersectionObserver: true, addEventListener: (name, fn) => { events[name] = fn; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/hero-video.js'), 'utf8'), {
    document, window, navigator: { connection }, matchMedia: () => motion,
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} },
  });
  return { video, toggle, hero, header, document, motion, events, enter: visible => intersection([{ isIntersecting: visible }]) };
}

test('hero waits for page load and visibility before requesting the video', () => {
  const page = mount();
  page.enter(true);
  assert.equal(page.video.src, '');
  page.events.load();
  assert.equal(page.video.src, 'curtains.mp4');
  assert.equal(page.video.plays, 1);
  page.video.events.playing();
  assert.ok(page.hero.classList.contains('is-video-ready'));
  assert.ok(page.header.classList.contains('is-over-hero'));
  page.enter(false);
  assert.equal(page.video.paused, true);
  assert.equal(page.header.classList.contains('is-over-hero'), false);
});

test('economy modes keep the poster until the visitor explicitly starts playback', () => {
  for (const settings of [{ reduced: true }, { saveData: true }]) {
    const page = mount(settings);
    page.enter(true); page.events.load();
    assert.equal(page.video.src, '');
    page.toggle.events.click();
    assert.equal(page.video.src, 'curtains.mp4');
    assert.equal(page.video.paused, false);
    page.toggle.events.click();
    assert.equal(page.video.paused, true);
  }
});

test('hidden tabs pause playback and media errors preserve the poster', () => {
  const page = mount();
  page.enter(true); page.events.load(); page.video.events.playing();
  page.document.hidden = true; page.events.visibilitychange();
  assert.equal(page.video.paused, true);
  page.document.hidden = false; page.events.visibilitychange();
  assert.equal(page.video.paused, false);
  page.video.events.error();
  assert.equal(page.hero.classList.contains('is-video-ready'), false);
  assert.equal(page.toggle.hidden, true);
});
