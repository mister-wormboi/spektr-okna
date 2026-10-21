const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('section labels and hero kicker use the body font without all-caps or wide tracking', () => {
  const css = read('assets/css/typography.css');
  const labels = css.match(/body main \.eyebrow,\s*body main \.reviews \.eyebrow,\s*body main \.hero-cinema-kicker\s*\{([^}]+)\}/)[1];
  assert.match(labels, /font: 500 var\(--font-size-body\)\/1\.5 var\(--sans\)/);
  assert.match(labels, /letter-spacing: normal/);
  assert.match(labels, /text-transform: none/);
});

test('home contact heading stays in normal flow and outside the reveal animation', () => {
  const css = read('assets/css/home-refresh.css');
  const copy = css.match(/\.home-contact-copy\s*\{([^}]+)\}/)[1];
  assert.match(copy, /position: static/);
  assert.doesNotMatch(css, /\.home-contact-copy\s*\{[^}]*position: sticky/);
  const html = read('index.html');
  const title = html.match(/<h2 id="homeContactTitle">([\s\S]*?)<\/h2>/)[1].replace(/<[^>]+>/g, '');
  assert.equal(title, 'Обсудим ваши окна.');
  assert.doesNotMatch(read('assets/js/main.js'), /['"]\.home-contact(?:-copy|\s)/);
});
