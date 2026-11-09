const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('window-inside/index.html', 'utf8');
const main = fs.readFileSync('assets/js/window-inside.js', 'utf8');
const gallery = fs.readFileSync('assets/js/window-inside-gallery.js', 'utf8');

test('journey and gallery use real local WebGL models instead of videos', () => {
  assert.match(main, /createInsideExhibit/);
  assert.match(main, /window-inside-3d\.js/);
  assert.match(gallery, /import\('\.\/window-inside-3d\.js/);
  assert.doesNotMatch(html, /<video/);
  assert.equal((html.match(/data-gallery-model=/g) || []).length, 4);
});

test('gallery models initialize lazily and fail independently', () => {
  assert.match(gallery, /new IntersectionObserver/);
  assert.match(gallery, /createInsideExhibit\(card\)/);
  assert.match(gallery, /catch \(error\)/);
  assert.match(gallery, /card\.classList\.add\('is-unavailable'\)/);
});

test('page has chrome, breadcrumbs and two scroll progress segments', () => {
  assert.match(html, /class="site-header"/);
  assert.match(html, /class="site-footer"/);
  assert.match(html, /Главная<\/a>.*Окна изнутри<\/span>/);
  assert.match(html, /class="inside-progress"[^>]*><span><\/span><i><\/i>/);
  assert.match(gallery, /--content-progress/);
});

test('all four model cards have real controls and explanatory content', () => {
  for (const part of ['hardware', 'glass', 'profile', 'frame']) {
    assert.match(html, new RegExp(`data-gallery-model="${part}"[\\s\\S]*?inside-model-tip`));
  }
  assert.equal((html.match(/class="inside-model-fact"/g) || []).length, 4);
  assert.match(html, /data-mode="open"/);
  assert.match(html, /data-detail/);
  assert.match(html, /data-inspect/);
});
