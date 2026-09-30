const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}
const all = files(root);
const pages = all.filter(file => file.endsWith('.html'));
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m => [m[1], m[2]]));
const ids = source => [...source.matchAll(/\bid\s*=\s*"([^"]+)"/g)].map(m => m[1]);
function checkLink(file, value) {
  if (!value || /^(?:[a-z]+:|\/\/)/i.test(value)) return;
  const [pathname, hash] = value.split('#');
  let target = path.resolve(path.dirname(file), decodeURIComponent(pathname.split('?')[0]) || '.');
  if (!pathname) target = file;
  assert.ok(fs.existsSync(target), `${path.relative(root, file)}: missing ${value}`);
  if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  assert.ok(fs.existsSync(target), `Missing page: ${target}`);
  if (hash && target.endsWith('.html')) assert.ok(ids(fs.readFileSync(target, 'utf8')).includes(decodeURIComponent(hash)), `Missing anchor: ${value} in ${file}`);
}

test('all seven pages have unique IDs and valid local resources and anchors', () => {
  assert.equal(pages.length, 7);
  for (const file of pages) {
    const source = fs.readFileSync(file, 'utf8');
    const pageIds = ids(source);
    assert.equal(new Set(pageIds).size, pageIds.length, `Duplicate IDs: ${file}`);
    for (const tag of source.matchAll(/<[a-z][^>]*>/gi)) {
      const attributes = attrs(tag[0]);
      for (const name of ['href', 'src']) if (attributes[name]) checkLink(file, attributes[name]);
      if (tag[0].startsWith('<img ')) assert.ok('alt' in attributes, `Missing alt: ${file}`);
    }
  }
});

test('CSS resources and catalogue images exist', () => {
  for (const file of all.filter(f => f.endsWith('.css'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) checkLink(file, match[1]);
    const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
    let depth = 0;
    for (const char of stripped) {
      if (char === '{') depth++;
      if (char === '}') depth--;
      assert.ok(depth >= 0, `Unbalanced CSS: ${file}`);
    }
    assert.equal(depth, 0, `Unbalanced CSS: ${file}`);
  }
  const data = fs.readFileSync(path.join(root, 'assets/js/catalog-data.js'), 'utf8');
  for (const match of data.matchAll(/image:\s*'([^']+)'/g)) checkLink(path.join(root, 'index.html'), match[1]);
});

test('header and footer styles have a single owner; type scale is loaded last', () => {
  for (const file of all.filter(f => f.endsWith('.css') && !/\/(header-refresh|footer)\.css$/.test(f))) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /\.(?:site-header|site-footer|header-[\w-]+|footer-[\w-]+)\b/);
  }
  for (const file of pages) {
    const links = [...fs.readFileSync(file, 'utf8').matchAll(/<link[^>]+>/g)].map(m => attrs(m[0])).filter(a => a.rel === 'stylesheet');
    assert.ok(links.at(-1).href.endsWith('typography.css'));
  }
});
