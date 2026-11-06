const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadRecords, buildSql } = require('../tools/build-database');
const root = path.resolve(__dirname, '..');
const records = loadRecords();

test('database export includes current pages, real catalog and original article data', () => {
  const articles = require('../content/articles.json').articles;
  const page = route => records.find(row => row.path === route);
  assert.equal(new Set(records.map(row => row.path)).size, records.length);
  assert.equal(records.length, 18 + articles.length + articles.filter(a => a.legacy_slug).length);
  assert.equal(page('/catalog/').content.catalog.products.length, 41);
  assert.deepEqual(JSON.parse(JSON.stringify(page('/contacts/').content.branches)), require('../content/branches.json'));
  assert.deepEqual(JSON.parse(JSON.stringify(page('/reviews/').content.reviews)), require('../content/reviews.json'));
  for (const article of articles) {
    assert.deepEqual(page(`/articles/${article.slug}/`).content.article, article);
    if (article.legacy_slug) assert.equal(page(`/articles/${article.legacy_slug}/`).content.redirect_to, `/articles/${article.slug}/`);
  }
  assert.equal(page('/request/').content.redirect_to, '/#request');
  assert.equal(page('/contacts/rostov-na-donu/').content.branch_ids.length, 2);
  assert.ok(page('/').content.header_html.includes('site-header'));
  assert.ok(page('/').content.footer_html.includes('site-footer'));
});

test('SQL literals preserve Cyrillic, apostrophes, backslashes and JSON controls', () => {
  const row = {
    table: 'page_home', path: '/', title: "Окно O'Brien \\ новое",
    content: { text: "Кавычки: ' и \"; \\n — не перевод;\nа это перевод\tи табуляция. 😀", html: "</main>'); DROP TABLE admins; --" },
    seo_title: 'Спектр', seo_description: '', canonical_url: 'https://spektr-okna.ru/'
  };
  const sql = buildSql([row]);
  const values = sql.match(/VALUES \(([^]*?)\)\nON DUPLICATE KEY UPDATE/)[1];
  // Decode SQL string literals under NO_BACKSLASH_ESCAPES, as used by the import.
  const parsed = [...values.matchAll(/'((?:[^']|'')*)'(?:, |$)/g)].map(match => match[1].replaceAll("''", "'"));
  assert.equal(parsed.length, 6);
  assert.equal(parsed[1], row.title);
  assert.deepEqual(JSON.parse(parsed[2]), row.content);
  assert.ok(sql.includes("SET SESSION sql_mode = @spektr_previous_sql_mode;"));
});

test('checked-in seed matches source files and only adds missing records', () => {
  const sql = fs.readFileSync(path.join(root, 'database/init.sql'), 'utf8');
  assert.equal(sql, buildSql(records), 'Run node tools/build-database.js after changing page sources');
  assert.equal((sql.match(/^CREATE TABLE IF NOT EXISTS /gm) || []).length, 13);
  assert.equal((sql.match(/^ON DUPLICATE KEY UPDATE id = id;/gm) || []).length, records.length);
  assert.doesNotMatch(sql, /^\s*(DROP|TRUNCATE|DELETE|REPLACE)\b/gmi);
  assert.doesNotMatch(sql, /^INSERT INTO [`]?admins/gmi);
});
