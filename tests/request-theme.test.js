const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/request-theme.js'), 'utf8');

function setup(theme) {
  let update, observerOptions;
  const root = { dataset: { theme } };
  const events = {}, note = { hidden: true };
  const variants = ['light', 'dark'].map(theme => ({
    dataset: { requestTheme: theme }, hidden: true, scripts: [],
    querySelector: () => ({ content: { querySelector: () => ({ attributes: [{ name: 'data-b24-form', value: theme }], textContent: theme }) } }),
    append(script) { this.scripts.push(script); },
    contains(target) { return target === this; },
  }));
  const host = { querySelectorAll: () => variants, querySelector: () => note, addEventListener: (type, handler) => { events[type] = handler; } };
  vm.runInNewContext(source, {
    document: { documentElement: root, querySelector: () => host, createElement: () => ({ setAttribute(name, value) { this[name] = value; } }) },
    MutationObserver: class { constructor(fn) { update = fn; } observe(_, options) { observerOptions = options; } },
  });
  return { variants, note, events, root, observerOptions, theme(value) { root.dataset.theme = value; update(); } };
}

test('loads only the active form and reuses it across repeated palette changes', () => {
  for (const initial of ['dark', 'light']) {
    const s = setup(initial);
    assert.equal(s.variants.filter(v => !v.hidden)[0].dataset.requestTheme, initial);
    assert.equal(s.variants.reduce((sum, v) => sum + v.scripts.length, 0), 1);
    s.theme('light'); s.theme('dark'); s.theme('light');
    assert.deepEqual(s.variants.map(v => v.scripts.length), [1, 1]);
    assert.equal(s.variants[0].scripts[0]['data-b24-form'], 'light');
    assert.deepEqual([...s.observerOptions.attributeFilter], ['data-theme']);
  }
});

test('typing or changing a field preserves the mounted form and explains the retained palette', () => {
  for (const type of ['input', 'change']) {
    const s = setup('dark');
    s.events[type]({ isTrusted: true, target: s.variants[1] });
    s.theme('light');
    assert.equal(s.variants[1].hidden, false);
    assert.equal(s.variants[0].scripts.length, 0);
    assert.equal(s.note.hidden, false);
    s.theme('dark'); assert.equal(s.note.hidden, true);
  }
});

test('widget initialization events do not lock the form palette', () => {
  const s = setup('dark');
  s.events.change({ isTrusted: false, target: s.variants[1] });
  s.theme('light');
  assert.equal(s.variants[0].hidden, false);
});
