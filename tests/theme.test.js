const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/theme.js'), 'utf8');

function page({ saved = null, blocked = false, ready = false } = {}) {
  const attributes = {};
  const labels = {};
  const documentEvents = {};
  const windowEvents = {};
  let click;
  let mounted = ready;
  const storage = new Map(saved === null ? [] : [['spektr-theme', saved]]);
  const button = {
    hidden: true,
    setAttribute: (name, value) => { labels[name] = value; },
    addEventListener: (name, callback) => { if (name === 'click') click = callback; },
  };
  const document = {
    readyState: ready ? 'complete' : 'loading',
    documentElement: { setAttribute: (name, value) => { attributes[name] = value; } },
    querySelectorAll: () => mounted ? [button] : [],
    addEventListener: (name, callback) => { documentEvents[name] = callback; },
  };
  const window = {
    get localStorage() {
      if (blocked) throw new Error('Storage denied');
      return { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
    },
    addEventListener: (name, callback) => { windowEvents[name] = callback; },
  };
  vm.runInNewContext(source, { document, window });
  return {
    attributes, labels, button, storage,
    mount() { mounted = true; documentEvents.DOMContentLoaded?.(); },
    click() { click(); },
    storageEvent(event) { windowEvents.storage(event); },
  };
}

test('saved theme is applied before controls exist and survives navigation', () => {
  const first = page({ saved: 'dark' });
  assert.equal(first.attributes['data-theme'], 'dark');
  assert.equal(first.button.hidden, true);
  first.mount();
  assert.equal(first.button.hidden, false);
  assert.equal(first.labels['aria-pressed'], 'true');
  assert.equal(first.labels['aria-label'], 'Включить светлую тему');
  first.click();
  assert.equal(first.attributes['data-theme'], 'light');
  assert.equal(first.labels['aria-pressed'], 'false');
  assert.equal(first.storage.get('spektr-theme'), 'light');
  const next = page({ saved: first.storage.get('spektr-theme'), ready: true });
  assert.equal(next.attributes['data-theme'], 'light');
  next.click();
  assert.equal(next.storage.get('spektr-theme'), 'dark');
});

test('invalid preferences and blocked storage do not prevent switching', () => {
  for (const options of [{ saved: 'invalid' }, { blocked: true }]) {
    const p = page(options);
    assert.equal(p.attributes['data-theme'], 'light');
    p.mount();
    p.click();
    assert.equal(p.attributes['data-theme'], 'dark');
    p.click();
    assert.equal(p.attributes['data-theme'], 'light');
  }
});

test('other tabs sync valid preferences and ignore unrelated storage', () => {
  const p = page({ ready: true });
  p.storageEvent({ key: 'spektr-theme', newValue: 'dark' });
  assert.equal(p.attributes['data-theme'], 'dark');
  assert.equal(p.labels['aria-pressed'], 'true');
  p.storageEvent({ key: 'unrelated', newValue: 'light' });
  p.storageEvent({ key: 'spektr-theme', newValue: 'invalid' });
  assert.equal(p.attributes['data-theme'], 'dark');
  p.storageEvent({ key: null, newValue: null });
  assert.equal(p.attributes['data-theme'], 'light');
});

test('every page loads the early initializer and shared palette and exposes one accessible control', () => {
  const root = path.join(__dirname, '..');
  const pages = ['index.html', ...['about', 'calculator', 'catalog', 'contacts', 'information', 'reviews', 'solutions'].map(dir => `${dir}/index.html`)];
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const script = html.match(/<script src="[^"]*assets\/js\/theme\.js"><\/script>/);
    assert.ok(script, file);
    assert.ok(script.index < html.indexOf('assets/css/'), `Theme must load before styles: ${file}`);
    assert.equal((html.match(/data-theme-toggle/g) || []).length, 1, file);
    assert.match(html, /<button[^>]+type="button"[^>]+data-theme-toggle[^>]+aria-label="[^"]+"[^>]+aria-pressed="false"/);
    assert.ok(html.indexOf('assets/css/theme.css') < html.indexOf('assets/css/typography.css'), file);
  }
});
