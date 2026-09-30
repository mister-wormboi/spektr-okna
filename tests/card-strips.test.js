const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup({ reduced = false, width = 366 } = {}) {
  const frames = [];
  const media = [];
  const strips = [4, 6].map((count, n) => {
    const events = {};
    const button = () => ({ disabled: false, addEventListener(name, fn) { this[name] = fn; } });
    const previous = button(), next = button(), position = {};
    const controls = { hidden: true, querySelector: s => s.includes('-1') ? previous : s.includes('step') ? next : position };
    const track = {
      id: `track${n}`, children: Array.from({ length: count }, (_, i) => ({ offsetLeft: i * 336 })),
      scrollWidth: count * 336 - 16, clientWidth: width, scrollLeft: 0,
      addEventListener: (name, fn) => { events[name] = fn; },
      scrollTo(options) { this.lastScroll = options; this.scrollLeft = options.left; events.scroll(); },
      removeAttribute(name) { if (name === 'tabindex') delete this.tabIndex; },
    };
    return { track, controls, previous, next, position, events };
  });
  const context = {
    document: { querySelectorAll: () => strips.map(s => s.track), querySelector: selector => strips.find(s => selector.includes(s.track.id)).controls },
    matchMedia(query) {
      const m = { matches: query.includes('reduced') ? reduced : true, addListener(fn) { this.change = fn; } };
      if (!query.includes('reduced')) media.push(m);
      return m;
    },
    window: { addEventListener() {} },
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/card-strips.js'), 'utf8'), context);
  const flush = () => { while (frames.length) frames.shift()(); };
  return { strips, media, flush, frames };
}

test('independent mobile strips support arrows, swipe, keyboard, and end buttons', () => {
  const { strips: [examples, offices], flush } = setup();
  assert.equal(examples.controls.hidden, false);
  assert.equal(examples.previous.disabled, true);
  examples.next.click(); flush();
  assert.equal(examples.position.textContent, '2 / 4');
  assert.equal(offices.position.textContent, '1 / 6');
  examples.track.scrollLeft = 672; examples.events.scroll(); flush();
  assert.equal(examples.position.textContent, '3 / 4');
  let prevented = false;
  examples.events.keydown({ key: 'End', target: examples.track, preventDefault() { prevented = true; } }); flush();
  assert.ok(prevented);
  assert.equal(examples.position.textContent, '4 / 4');
  assert.equal(examples.next.disabled, true);
  examples.previous.click(); flush();
  assert.equal(examples.position.textContent, '3 / 4');
  offices.next.click(); flush();
  assert.equal(offices.position.textContent, '2 / 6');
});

test('strips use reduced motion, handle wider mobile tracks, and reset on desktop', () => {
  const { strips: [s], media, flush } = setup({ reduced: true, width: 700 });
  s.next.click(); flush();
  assert.equal(s.track.lastScroll.behavior, 'auto');
  s.next.click(); flush();
  assert.equal(s.position.textContent, '4 / 4');
  assert.equal(s.next.disabled, true);
  s.previous.click(); flush();
  assert.equal(s.position.textContent, '2 / 4');
  media[0].matches = false; media[0].change();
  assert.equal(s.controls.hidden, true);
  assert.equal(s.track.scrollLeft, 0);
  assert.equal(s.track.tabIndex, undefined);
  media[0].matches = true; media[0].change();
  assert.equal(s.track.tabIndex, 0);
  assert.equal(s.position.textContent, '1 / 4');
});
