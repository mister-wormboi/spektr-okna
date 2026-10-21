const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'reviews/index.html'), 'utf8');

test('reviews hero shows the unweighted mean of all six sales offices', () => {
  const card = html.match(/<aside class="selection-rating"[\s\S]*?<\/aside>/)[0];
  const ratings = [...card.matchAll(/data-branch-rating="([\d.]+)"/g)].map(m => Number(m[1]));
  assert.equal(ratings.length, 6);
  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const displayed = Number(card.match(/class="selection-score"[^>]*>([\d,]+)/)[1].replace(',', '.'));
  assert.equal(displayed, Math.round(average * 10) / 10);
  assert.equal(displayed, 4.5);
  const sources = [...card.matchAll(/href="(https:\/\/yandex\.com\/maps\/org\/spektr\/\d+\/)"/g)].map(m => m[1]);
  assert.equal(new Set(sources).size, 6);
  assert.match(card, /не отдельный рейтинг сети/);
  assert.match(card, /<time datetime="2026-10-21">/);
  assert.match(card, /<details class="rating-details">/);
});

test('rating layout has a right-hand desktop column and stacks on phones without extra scripts', () => {
  const css = fs.readFileSync(path.join(root, 'assets/css/reviews-page.css'), 'utf8');
  assert.match(css, /\.reviews-hero-grid\s*\{[^}]*grid-template-columns: minmax\(0, 1\.4fr\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 800px\)\s*\{\s*\.reviews-hero-grid\s*\{ grid-template-columns: 1fr;/);
  assert.doesNotMatch(html, /<iframe|api-maps\.yandex|rating-widget/i);
});
