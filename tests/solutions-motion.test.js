const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/home-solutions.js'), 'utf8');

function element() {
  const classes = new Set();
  return {
    dataset: {}, events: {}, attrs: {}, children: [], props: {},
    classList: { toggle: (name, on) => on ? classes.add(name) : classes.delete(name), contains: name => classes.has(name) },
    setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, fn) { this.events[name] = fn; },
    append(child) { this.children.push(child); },
  };
}
function setup({ reduced = false, observer = true } = {}) {
  const track = element(), marquee = element(), document = element(), media = element();
  let intersection;
  let decodes = 0;
  track.style = { setProperty: (key, value) => { track.props[key] = value; } };
  track.children = Array.from({ length: 16 }, (_, i) => {
    const link = element();
    const image = { loading: 'lazy', decode: async () => { decodes++; } };
    link.querySelector = () => image;
    link.getBoundingClientRect = () => ({ left: i * 116 });
    link.cloneNode = () => Object.assign(element(), { getBoundingClientRect: () => ({ left: (i + 16) * 116 }) });
    return link;
  });
  track.querySelector = () => track.children.find(child => child.dataset.clone);
  marquee.querySelector = () => track;
  document.querySelector = () => marquee;
  document.hidden = false;
  let button;
  document.createElement = () => (button = element());
  media.matches = reduced;
  class Observer {
    constructor(fn) { intersection = fn; }
    observe() {}
  }
  vm.runInNewContext(source, { document, matchMedia: () => media, window: observer ? { IntersectionObserver: Observer } : {}, IntersectionObserver: Observer });
  return { track, marquee, document, media, button, decodes: () => decodes, intersect: visible => intersection?.([{ isIntersecting: visible }]) };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('marquee decodes and duplicates only once, after entering view; loop includes gaps', async () => {
  const s = setup();
  assert.equal(s.decodes(), 0);
  s.intersect(true);
  await settle();
  assert.equal(s.decodes(), 16);
  assert.equal(s.track.children.length, 32);
  assert.equal(s.track.props['--loop-distance'], '1856px');
  assert.ok(s.track.classList.contains('is-running'));
  assert.ok(s.track.children.slice(16).every(clone => clone.tabIndex === -1 && clone.attrs['aria-hidden'] === 'true'));
  s.intersect(false); s.intersect(true);
  await settle();
  assert.equal(s.track.children.length, 32);
});

test('marquee pauses offscreen and in hidden tabs without adding a play/pause button', async () => {
  const s = setup(); s.intersect(true); await settle();
  s.intersect(false);
  assert.ok(!s.track.classList.contains('is-running'));
  s.intersect(true);
  s.document.hidden = true; s.document.events.visibilitychange();
  assert.ok(!s.track.classList.contains('is-running'));
  s.document.hidden = false; s.document.events.visibilitychange();
  assert.ok(s.track.classList.contains('is-running'));
  assert.equal(s.button, undefined);
});

test('reduced motion and unsupported observers keep a static, uncloned fallback', async () => {
  for (const options of [{ reduced: true }, { observer: false }]) {
    const s = setup(options); s.intersect(true); await settle();
    assert.equal(s.decodes(), 0);
    assert.equal(s.track.children.length, 16);
    assert.ok(!s.track.classList.contains('is-running'));
  }
  const s = setup(); s.intersect(true); await settle();
  s.media.matches = true; s.media.events.change();
  assert.ok(!s.marquee.classList.contains('is-animated'));
  s.media.matches = false; s.media.events.change();
  assert.ok(s.track.classList.contains('is-running'));
});

test('gallery reveal waits for intersection and releases revealed targets', () => {
  const links = [element(), element()];
  links.forEach(link => {
    link.classList.add = name => link.classList.toggle(name, true);
    link.classList.remove = name => link.classList.toggle(name, false);
  });
  let reveal;
  const watched = new Set();
  class Observer {
    constructor(fn) { reveal = fn; }
    observe(link) { watched.add(link); }
    unobserve(link) { watched.delete(link); }
    disconnect() { watched.clear(); }
  }
  const media = element(); media.matches = false;
  const document = { querySelector: () => ({ querySelectorAll: () => links }), createElement: () => ({}) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/solutions-gallery.js'), 'utf8'), {
    document, window: { IntersectionObserver: Observer }, IntersectionObserver: Observer, matchMedia: () => media,
  });
  assert.equal(watched.size, 2);
  assert.ok(links.every(link => link.classList.contains('is-awaiting-reveal')));
  reveal([{ target: links[0], isIntersecting: false }]);
  assert.equal(watched.size, 2);
  reveal([{ target: links[0], isIntersecting: true }]);
  assert.equal(watched.size, 1);
  assert.ok(!links[0].classList.contains('is-awaiting-reveal'));
  media.matches = true; media.events.change();
  assert.equal(watched.size, 0);
  assert.ok(links.every(link => !link.classList.contains('is-awaiting-reveal')));
});
