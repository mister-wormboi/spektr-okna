const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/window-motion.js'), 'utf8');

function setup({ reduced = false, hidden = false } = {}) {
  const targets = [{}, {}];
  let enter;
  const document = { hidden, timeline: { currentTime: 1000 }, querySelectorAll: () => targets };
  const window = { IntersectionObserver: true };
  vm.runInNewContext(source, {
    document, window, matchMedia: () => ({ matches: reduced }),
    IntersectionObserver: class {
      constructor(callback) { enter = callback; }
      observe() {} unobserve() {} disconnect() {}
    },
  });
  return { sync: window.SpektrWindowMotion, document, enter: (index, ratio) => enter([{ target: targets[index], isIntersecting: ratio > 0, intersectionRatio: ratio }]) };
}

test('either window starts one shared run; late subscribers receive the same timestamp', () => {
  const s = setup();
  const first = [], second = [];
  s.sync.subscribe(timing => first.push(timing.startTime));
  s.enter(0, .2);
  assert.equal(first.length, 0);
  s.enter(0, .3);
  s.enter(0, .5);
  s.sync.subscribe(timing => second.push(timing.startTime));
  assert.deepEqual(first, [1000]);
  assert.deepEqual(second, [1000]);
  s.document.timeline.currentTime = 1700;
  s.enter(1, .3);
  assert.deepEqual(first, [1000, 1700]);
  assert.deepEqual(second, [1000, 1700]);
});

test('hidden pages and reduced motion do not start coordinated runs', () => {
  for (const options of [{ hidden: true }, { reduced: true }]) {
    const s = setup(options);
    let called = false;
    s.sync.subscribe(() => { called = true; });
    s.enter(0, .5);
    assert.equal(called, false);
  }
});
