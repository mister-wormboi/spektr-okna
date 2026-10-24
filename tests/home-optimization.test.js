const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('home includes ten complete branch reviews with unique authors and no photo count', () => {
  const home = read('index.html');
  const cards = [...home.matchAll(/<article class="review-card[^\"]*"[^>]*>[\s\S]*?<\/article>/g)].map(m => m[0]);
  assert.equal(cards.length, 10);
  const ids = cards.map(card => card.match(/<h3>(.*?)<\/h3>/)[1]);
  assert.equal(new Set(ids).size, 10);
  for (const card of cards) {
    assert.ok(read('reviews/index.html').includes(card.match(/<h3>(.*?)<\/h3>/)[0]));
    assert.ok(read('reviews/index.html').includes(card.match(/<p>[\s\S]*?<\/p>/)[0]));
  }
  assert.match(home, /class="catalog-more solutions-more"[^>]*>Все фото <span aria-hidden="true">↗<\/span>/);
  assert.doesNotMatch(home, /\d+ фото ↗/);
});

test('Three.js is imported once near the window, never on initial load or in economy modes', async () => {
  for (const mode of ['normal', 'reduced', 'saveData', 'failure']) {
    let intersection, imports = 0, disconnected = false;
    const source = read('assets/js/window-3d.js').replace("await import('./scene-runtime.js')", 'await loadRuntime()');
    assert.doesNotMatch(source, /^import .*from/m);
    vm.runInNewContext(source, {
      document: { querySelector: () => ({}) },
      window: { IntersectionObserver: true, matchMedia: () => ({ matches: mode === 'reduced' }) },
      navigator: { connection: { saveData: mode === 'saveData' } },
      IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} disconnect() { disconnected = true; } },
      console: { warn() {} },
      loadRuntime: async () => { imports++; if (mode === 'failure') throw new Error('offline'); return {}; },
    });
    assert.equal(imports, 0);
    intersection([{ isIntersecting: false }]); assert.equal(imports, 0);
    intersection([{ isIntersecting: true }]); intersection([{ isIntersecting: true }]);
    await Promise.resolve();
    assert.equal(imports, mode === 'normal' || mode === 'failure' ? 1 : 0);
    assert.ok(disconnected);
  }
});
