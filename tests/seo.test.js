const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const branches = require('../content/branches.json');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  if (e.name.startsWith('.') || ['node_modules', 'assets', 'tools', 'tests', 'docs', 'content', 'templates'].includes(e.name)) return [];
  const file = path.join(dir, e.name);
  return e.isDirectory() ? walk(file) : e.name === 'index.html' ? [file] : [];
});
const pages = walk(root);
const schemas = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => {
  const data = JSON.parse(m[1]); return data['@graph'] || [data];
});

test('all indexable pages have one self canonical and one unique title and description', () => {
  const titles = new Set(), descriptions = new Set();
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const canonical = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)];
    assert.equal(canonical.length, 1, file);
    assert.ok(!canonical[0][1].includes('#'), 'canonical must not contain a fragment');
    if (html.includes('http-equiv="refresh"')) {
      assert.match(html, /name="robots" content="noindex, follow"/);
      continue;
    }
    assert.equal(canonical[0][1], 'https://spektr-okna.ru/' + path.relative(root, file).split(path.sep).join('/').replace(/index\.html$/, ''));
    assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    const description = html.match(/name="description"\s+content="([^"]+)"/)[1];
    assert.ok(!titles.has(title), 'duplicate title: ' + title);
    assert.ok(!descriptions.has(description), 'duplicate description: ' + description);
    titles.add(title); descriptions.add(description);
    const data = schemas(html);
    assert.ok(data.some(s => s['@type'] === 'WebPage'), file);
    assert.equal((html.match(/property="og:url"/g) || []).length, 1);
  }
});

test('sitemap contains exactly the canonical indexable HTML pages, excluding redirects and filters', () => {
  const urls = [...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  const expected = pages.filter(file => !fs.readFileSync(file, 'utf8').includes('http-equiv="refresh"')).map(file =>
    'https://spektr-okna.ru/' + path.relative(root, file).split(path.sep).join('/').replace(/index\.html$/, ''));
  assert.deepEqual(urls.sort(), expected.sort());
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every(url => !url.includes('?')));
  const robots = read('robots.txt');
  assert.match(robots, /Sitemap: https:\/\/spektr-okna\.ru\/sitemap\.xml/);
  assert.doesNotMatch(robots, /Disallow: \/assets|Disallow: \/$/m);
});

test('six real offices have matching structured addresses, phones and city landing pages', () => {
  const schema = schemas(read('contacts/index.html')).filter(s => s['@type'] === 'HomeAndConstructionBusiness');
  assert.equal(schema.length, 6);
  const home = read('index.html');
  for (const branch of branches) {
    const business = schema.find(s => s['@id'].endsWith('#' + branch.id));
    assert.equal(business.address.streetAddress, branch.street);
    assert.deepEqual(business.telephone, branch.phones.map(p => p.number));
    const local = read(`contacts/${branch.slug}/index.html`);
    assert.ok(local.includes(branch.street));
    assert.ok(local.includes(branch.hours));
    assert.match(home, new RegExp(`href="contacts/${branch.slug}/"`));
    assert.equal(business.address.addressLocality, branch.city);
  }
  assert.ok(!schema.some(s => ['Таганрог', 'Краснодар'].includes(s.address.addressLocality)));
  assert.equal(schema.find(s => s['@id'].endsWith('#rostov-zorge')).address.streetAddress, 'ул. Зорге, 48');
});

test('catalogue directions and window choices exist in HTML without executing client JavaScript', () => {
  const html = read('catalog/index.html');
  const grid = html.match(/<div class="product-grid" id="fullCatalogCards">([\s\S]*?)<button class="product-more"/)[1];
  assert.equal((grid.match(/class="card product-card"/g) || []).length, 8);
  assert.match(grid, /href="okna\/"/);
  for (const text of ['ПВХ конструкции', 'Алюминиевые конструкции', 'Балконная дверь']) assert.ok(grid.includes(text));
  const windows = read('catalog/okna/index.html');
  for (const text of ['REHAU', 'PRO WINS', '6 500', 'без монтажа и доставки']) assert.ok(windows.includes(text));
  assert.match(read('ustanovka-okon/index.html'), /Калькулятор на сайте считает только изделие/);
});

test('Article data has absolute images and canonical page IDs without invented review ratings', () => {
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    for (const article of schemas(html).filter(s => s['@type'] === 'Article')) {
      assert.match(article.image, /^https:\/\/spektr-okna\.ru\//);
      assert.ok(article.mainEntityOfPage['@id'].startsWith(article.url));
    }
  }
  assert.doesNotMatch(read('index.html').match(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/)[0], /AggregateRating|ratingValue|reviewCount/);
});
