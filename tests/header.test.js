const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/header.js'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '../assets/css/header-refresh.css'), 'utf8');

test('folding keeps square corners and only keyboard focus can hold the second row open', () => {
  assert.doesNotMatch(styles, /:focus-within/);
  assert.match(styles, /:has\(:focus-visible\)/);
  assert.doesNotMatch(styles, /border-radius:\s*[1-9]/);
  assert.match(styles, /contain:\s*layout style/);
  assert.doesNotMatch(source, /requestAnimationFrame|setInterval|addEventListener\(['"]scroll/);
});

function setup({ mobile = true, observer = true } = {}) {
  const classes = new Set(), attributes = {}, events = {}, menuEvents = {}, documentEvents = {};
  let mediaChange, intersection, focused = false;
  const menuItem = {};
  const menu = { inert: false, addEventListener: (type, fn) => { menuEvents[type] = fn; }, contains: el => el === menuItem };
  const toggle = { hidden: true, focus: () => { focused = true; }, setAttribute: (key, value) => { attributes[key] = value; }, addEventListener: (type, fn) => { events[type] = fn; } };
  const header = {
    querySelector: selector => selector === '#headerMenu' ? menu : toggle,
    classList: { add: name => classes.add(name), toggle: (name, on) => on ? classes.add(name) : classes.delete(name) },
    contains: target => target === menuItem || target === toggle,
    before() {},
  };
  const media = { matches: mobile, addEventListener: (_, fn) => { mediaChange = fn; } };
  const document = { activeElement: null, querySelector: () => header, createElement: () => ({ setAttribute() {} }), addEventListener: (type, fn) => { documentEvents[type] = fn; } };
  vm.runInNewContext(source, {
    document, window: { matchMedia: () => media, ...(observer ? { IntersectionObserver: true } : {}) },
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} },
  });
  return { menu, toggle, classes, attributes, document, documentEvents, menuEvents, menuItem,
    click: () => events.click(), focused: () => focused,
    resize(value) { media.matches = value; mediaChange(); },
    intersect(value, top = -1) { intersection([{ isIntersecting: value, boundingClientRect: { top } }]); },
  };
}

test('mobile menu starts inaccessible while closed and supports toggle and Escape', () => {
  const s = setup();
  assert.equal(s.toggle.hidden, false);
  assert.equal(s.menu.inert, true);
  assert.equal(s.attributes['aria-expanded'], 'false');
  s.click();
  assert.equal(s.menu.inert, false);
  assert.equal(s.attributes['aria-expanded'], 'true');
  assert.ok(s.classes.has('is-menu-open'));
  let prevented = false;
  s.documentEvents.keydown({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(s.menu.inert, true);
  assert.ok(s.focused());
  assert.ok(prevented);
  s.click(); s.click();
  assert.equal(s.attributes['aria-expanded'], 'false');
});

test('mobile menu closes for outside clicks, focus departure and links, not theme controls', () => {
  const s = setup();
  s.click();
  s.menuEvents.click({ target: { closest: () => null } });
  assert.equal(s.menu.inert, false);
  s.documentEvents.pointerdown({ target: {} });
  assert.equal(s.menu.inert, true);
  s.click(); s.menuEvents.click({ target: { closest: () => ({}) } });
  assert.equal(s.menu.inert, true);
  s.click(); s.documentEvents.focusin({ target: {} });
  assert.equal(s.menu.inert, true);
});

test('desktop navigation stays accessible across breakpoints; sticky shadow needs no scroll loop', () => {
  const s = setup({ mobile: false });
  assert.equal(s.menu.inert, false);
  s.document.activeElement = s.menuItem;
  s.resize(true);
  assert.equal(s.menu.inert, true);
  assert.ok(s.focused());
  s.click(); s.resize(false);
  assert.equal(s.menu.inert, false);
  assert.equal(s.attributes['aria-expanded'], 'false');
  s.intersect(false); assert.ok(s.classes.has('is-scrolled'));
  s.intersect(true); assert.ok(!s.classes.has('is-scrolled'));
  s.intersect(false, 160); assert.ok(!s.classes.has('is-scrolled'), 'a sentinel below the viewport must not fold the header');
  assert.ok(!('scroll' in s.documentEvents));
  assert.equal(setup({ observer: false }).menu.inert, true);
});

test('shared headers have the requested row order, a labelled disclosure and deferred controller', () => {
  const root = path.join(__dirname, '..');
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.name.startsWith('.') || e.name === 'node_modules' ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  for (const file of walk(root).filter(f => f.endsWith('.html') || f.endsWith('articles-shell.tpl'))) {
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('<header class="site-header">')) continue;
    const actions = html.match(/<div class="header-actions">([\s\S]*?)<\/div>/)[1];
    assert.match(actions, /Оставить заявку[\s\S]*?tel:\+79895175699[\s\S]*?>Калькулятор<\/a>[\s\S]*?>Филиалы<\/a>/);
    const links = html.match(/<div class="header-links">([\s\S]*?)<\/div>/)[1];
    assert.deepEqual([...links.matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map(m => m[1]), ['Каталог', 'Примеры работ', 'О нас', 'Отзывы', 'Полезная информация', 'Статьи']);
    assert.match(html, /class="header-menu-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="headerMenu"/);
    assert.equal((html.match(/id="headerMenu"/g) || []).length, 1);
    assert.equal((html.match(/assets\/js\/header\.js" defer/g) || []).length, 1);
    assert.match(html, /class="header-mobile-call" href="tel:\+79895175699"/);
    assert.match(html, /class="header-mobile-call"[^>]*><span>8 989 517 56 99<\/span><\/a>/);
    assert.doesNotMatch(html.match(/<nav class="header-nav"[\s\S]*?<\/nav>/)[0], /data-theme-toggle/);
    assert.equal((html.match(/data-theme-toggle/g) || []).length, 1);
  }
});
