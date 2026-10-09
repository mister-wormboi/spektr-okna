const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createArticleViewStore } = require('../tools/article-view-store');
const { createServer } = require('../tools/preview-server');

function storage(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spektr-views-'));
  const file = path.join(dir, 'views.json');
  t.after(() => {
    for (const name of ['views.json', 'views.json.tmp']) {
      const target = path.join(dir, name);
      if (fs.existsSync(target)) fs.unlinkSync(target);
    }
    fs.rmdirSync(dir);
  });
  return file;
}

test('view totals survive a fresh store instance and damaged data is never reset', t => {
  const file = storage(t);
  const store = createArticleViewStore(file, ['first', 'second']);
  assert.deepEqual(store.all(), { first: 0, second: 0 });
  assert.equal(store.increment('first'), 1);
  assert.equal(store.increment('first'), 2);
  const restarted = createArticleViewStore(file, ['first', 'second']);
  assert.equal(restarted.increment('second'), 1);
  assert.deepEqual(restarted.all(), { first: 2, second: 1 });
  assert.throws(() => restarted.increment('../bad'));
  fs.writeFileSync(file, '{damaged');
  assert.throws(() => restarted.increment('first'));
  assert.equal(fs.readFileSync(file, 'utf8'), '{damaged');
});

test('API preserves concurrent increments and persisted counts after server restart', async t => {
  const file = storage(t);
  const makeServer = async () => {
    const server = createServer({ views: createArticleViewStore(file, ['first', 'second']) });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return server;
  };
  let server = await makeServer();
  t.after(() => new Promise(resolve => server.close(resolve)));
  let base = `http://127.0.0.1:${server.address().port}`;
  const responses = await Promise.all(Array.from({ length: 20 }, () => fetch(base + '/api/article-views/first', { method: 'POST' })));
  assert.ok(responses.every(r => r.status === 200));
  assert.deepEqual((await (await fetch(base + '/api/article-views')).json()).views, { first: 20, second: 0 });
  assert.equal((await fetch(base + '/api/article-views/unknown', { method: 'POST' })).status, 404);
  assert.equal((await fetch(base + '/api/article-views/first')).status, 405);
  assert.equal((await fetch(base + '/api/article-views/first', { method: 'POST', headers: { Origin: 'https://other.example' } })).status, 403);
  assert.equal((await fetch(base + '/.data/article-views.json')).status, 403);
  await new Promise(resolve => server.close(resolve));
  server = await makeServer();
  base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base + '/api/article-views');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).views.first, 20);
  fs.writeFileSync(file, 'broken');
  assert.equal((await fetch(base + '/api/article-views/first', { method: 'POST' })).status, 503);
  assert.equal(fs.readFileSync(file, 'utf8'), 'broken');
});

const script = fs.readFileSync(path.join(__dirname, '../assets/js/article-views.js'), 'utf8');
function browser({ article = true, visible = true, available = true } = {}) {
  const nodes = ['first', 'second'].map(slug => {
    const count = { textContent: '' };
    return { dataset: { articleViews: slug }, hidden: true, attributes: {},
      get textContent() { return count.textContent; },
      querySelector: () => count,
      setAttribute(name, value) { this.attributes[name] = value; },
    };
  });
  const calls = [];
  const listeners = new Map();
  const document = {
    visibilityState: visible ? 'visible' : 'hidden',
    querySelectorAll: () => nodes,
    querySelector: () => article ? { dataset: { articleView: 'first' } } : null,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
  };
  vm.runInNewContext(script, { document, Intl, fetch: async (url, options) => {
    calls.push({ url, ...options });
    if (!available) throw new Error('Offline');
    return { ok: true, json: async () => options.method === 'POST' ? { slug: 'first', views: 3 } : { views: { first: 3, second: 7 } } };
  } });
  return { document, nodes, calls, listeners };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('article opening increments once; listings only read totals', async () => {
  const article = browser();
  await settle();
  assert.equal(article.calls.filter(call => call.method === 'POST').length, 1);
  assert.equal(article.nodes[0].textContent, '3');
  assert.equal(article.nodes[1].textContent, '7');
  assert.equal(article.nodes[0].attributes['aria-label'], 'Просмотры: 3');
  assert.equal(article.nodes[0].hidden, false);
  const listing = browser({ article: false });
  await settle();
  assert.equal(listing.calls.length, 1);
  assert.equal(listing.calls[0].url, '/api/article-views');
});

test('background articles count after becoming visible, without repeated increments', async () => {
  const page = browser({ visible: false });
  assert.equal(page.calls.length, 0);
  const onVisible = page.listeners.get('visibilitychange');
  onVisible();
  assert.equal(page.calls.length, 0);
  page.document.visibilityState = 'visible';
  onVisible();
  await settle();
  assert.equal(page.calls.filter(call => call.method === 'POST').length, 1);
  assert.equal(page.listeners.size, 0);
});

test('unavailable backend leaves counters hidden instead of inventing totals', async () => {
  const page = browser({ available: false });
  await settle();
  assert.ok(page.nodes.every(node => node.hidden && node.textContent === ''));
});
