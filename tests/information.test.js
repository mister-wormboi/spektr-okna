const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'information/index.html'), 'utf8');

test('the film is deferred, has a poster and a pause control, and preserves all 20 answers', () => {
  assert.match(html, /class="information-cinema hero-cinema wrap"/);
  assert.match(html, /<video muted loop playsinline preload="none"[^>]*data-src="\.\.\/assets\/information-fresh-air\.mp4"/);
  assert.match(html, /class="hero-video-toggle"[^>]*aria-label=/);
  assert.match(html, /assets\/js\/hero-video\.js[^\"]*" defer/);
  assert.equal((html.match(/<details\b/g) || []).length, 20);
  for (const link of html.matchAll(/href="#([^\"]+)" data-faq-link/g)) {
    assert.ok(html.includes(`id="${link[1]}"`));
  }
  const optimized = fs.statSync(path.join(root, 'assets/information-fresh-air.mp4')).size;
  const original = fs.statSync(path.join(root, 'assets/4932224_Person_People_1280x720.mp4')).size;
  assert.ok(optimized < original * .25);
});

function mount(hash = '') {
  const element = () => {
    const classes = new Set();
    return { open: false, tagName: 'DETAILS', classList: { add: cls => classes.add(cls), contains: cls => classes.has(cls) } };
  };
  const answers = { 'faq-moisture': element(), 'faq-glazing': element(), 'faq-care': element() };
  const links = Object.keys(answers).map(id => ({ hash: '#' + id, addEventListener(_, callback) { this.click = callback; } }));
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/information.js'), 'utf8'), {
    window: { location: { hash }, matchMedia: () => ({ matches: true }) },
    document: {
      getElementById: id => answers[id] || null,
      querySelectorAll: selector => selector === '[data-faq-link]' ? links : Object.values(answers),
    },
  });
  return { answers, links };
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
