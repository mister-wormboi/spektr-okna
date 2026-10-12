const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/window-motion.js'), 'utf8');

test('window timing configuration has no subscriptions or shared playback state', () => {
  const window = {};
  vm.runInNewContext(source, { window });
  const timing = window.SpektrWindowMotion;
  assert.equal(timing.duration, 1800);
  assert.equal(timing.stagger, 100);
  assert.equal(timing.easing, 'cubic-bezier(.22, 1, .36, 1)');
  assert.ok(Object.isFrozen(timing));
  assert.deepEqual(Object.keys(timing).sort(), ['duration', 'easing', 'stagger']);
});
