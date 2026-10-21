const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
  if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : /\.(html|tpl)$/.test(file) ? [file] : [];
});

test('every heading accent has the same shared class, including article templates', () => {
  let total = 0;
  for (const file of walk(root)) {
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('assets/css/typography.css')) continue;
    assert.match(html, /typography\.css\?v=20261022-shared-theme/);
    for (const heading of html.matchAll(/<h([12])\b[^>]*>[\s\S]*?<\/h\1>/g)) {
      for (const em of heading[0].matchAll(/<em\b[^>]*>/g)) {
        assert.equal(em[0], '<em class="heading-accent">', file);
        total++;
      }
    }
  }
  assert.ok(total > 20);
});

test('paragraphs have no decorative accents while heading and video contrast are shared', () => {
  const css = read('assets/css/typography.css');
  assert.match(css, /html\[data-theme\] body main :is\(h1, h2\) > \.heading-accent\s*\{[^}]*color: var\(--green\);[^}]*font-style: italic/);
  assert.match(css, /\.hero-cinema :is\(h1, h2\) > \.heading-accent \{ color: #f0f1e9;/);
  assert.match(css, /p :is\(strong, b, em\) \{[^}]*color: inherit;[^}]*font-weight: inherit; font-style: normal;/);
  assert.doesNotMatch(read('assets/css/home-refresh.css'), /home-heading-accent|> p strong/);
  assert.doesNotMatch(read('assets/css/theme.css'), /html\[data-theme="dark"\] body main :is\(h1,h2\) em/);
});
