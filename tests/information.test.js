const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'information/index.html'), 'utf8');

test('the film is deferred, has a poster and a pause control, and preserves all 20 answers', () => {
  assert.match(html, /class="information-cinema hero-cinema wrap"/);
  assert.match(html, /<video muted loop playsinline preload="none"[^>]*poster="\.\.\/assets\/information-open-window-poster\.webp"[^>]*data-src="\.\.\/assets\/information-open-window\.mp4"/);
  assert.match(html, /class="hero-video-toggle"[^>]*aria-label=/);
  assert.match(html, /assets\/js\/hero-video\.js[^\"]*" defer/);
  assert.equal((html.match(/<details\b/g) || []).length, 20);
  for (const link of html.matchAll(/href="#([^\"]+)" data-faq-link/g)) {
    assert.ok(html.includes(`id="${link[1]}"`));
  }
  assert.match(html, /rel="preload" as="image" href="\.\.\/assets\/information-open-window-poster\.webp"/);
  const optimized = fs.statSync(path.join(root, 'assets/information-open-window.mp4')).size;
  // The unused source clip is not shipped; the playable web version stays small.
  assert.ok(optimized < 4 * 1024 * 1024);
});

function mount(hash = '') {
  const element = () => {
    const classes = new Set();
    return { open: false, tagName: 'DETAILS', classList: { add: cls => classes.add(cls), contains: cls => classes.has(cls) } };
  };
  const answers = { 'faq-moisture': element(), 'faq-glazing': element(), 'faq-care': element(), 'faq-ventilation': element() };
  const links = Object.keys(answers).map(id => ({ hash: '#' + id, addEventListener(_, callback) { this.click = callback; } }));
  const events = {};
  const window = { location: { hash }, matchMedia: () => ({ matches: true }), addEventListener: (name, callback) => { events[name] = callback; } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/information.js'), 'utf8'), {
    window,
    document: {
      getElementById: id => answers[id] || null,
      querySelectorAll: selector => selector === '[data-faq-link]' ? links : Object.values(answers),
    },
  });
  return { answers, links, window, events };
}

test('quick topics open their matching answer, including with reduced motion', () => {
  const page = mount();
  page.links[1].click();
  assert.equal(page.answers['faq-glazing'].open, true);
  assert.equal(page.answers['faq-moisture'].open, false);
  assert.ok(page.answers['faq-glazing'].classList.contains('is-visible'));
});

test('a direct answer link opens on arrival and unrelated hashes are harmless', () => {
  assert.equal(mount('#faq-care').answers['faq-care'].open, true);
  assert.ok(Object.values(mount('#questions').answers).every(answer => !answer.open));
});


test('changing the answer hash opens the requested answer after navigation', () => {
  const page = mount();
  page.window.location.hash = '#faq-care';
  page.events.hashchange();
  assert.equal(page.answers['faq-care'].open, true);
  assert.ok(page.answers['faq-care'].classList.contains('is-visible'));
});

test('hero has a right-hand topic list and goes straight to answers without the removed blocks', () => {
  const css = fs.readFileSync(path.join(root, 'assets/css/information.css'), 'utf8');
  for (const source of [html, css]) assert.doesNotMatch(source, /^(?:<{7}|={7}|>{7})/m);
  assert.doesNotMatch(html, /information-preflight|information-checklist|information-topics|preflight-title|checklist-title/);
  assert.doesNotMatch(css, /information-preflight|information-checklist|information-topics|information-down/);
  const index=html.match(/<nav class="information-hero-index"[\s\S]*?<\/nav>/)[0];
  assert.equal((index.match(/<li>/g)||[]).length,4);
  assert.equal((index.match(/data-faq-link/g)||[]).length,4);
  assert.match(css, /grid-template-columns: minmax\(0, 1\.2fr\) minmax\(0, \.8fr\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
  assert.match(html, /<\/nav>\s*<\/section>\s*<section class="information-faq"/);
});

test('the new ventilation topic opens its answer', () => {
  const page=mount('#faq-ventilation');
  assert.equal(page.answers['faq-ventilation'].open,true);
});
