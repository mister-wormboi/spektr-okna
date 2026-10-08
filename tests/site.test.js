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

test('all eight pages have unique IDs and valid local resources and anchors', () => {
  assert.equal(pages.length, 8);
  for (const file of pages) {
    const source = fs.readFileSync(file, 'utf8');
    const pageIds = ids(source);
    assert.equal(new Set(pageIds).size, pageIds.length, `Duplicate IDs: ${file}`);
    for (const tag of source.matchAll(/<[a-z][^>]*>/gi)) {
      const attributes = attrs(tag[0]);
      for (const name of ['href', 'src']) if (attributes[name]) checkLink(file, attributes[name]);
      if (attributes.srcset) for (const candidate of attributes.srcset.split(',')) checkLink(file, candidate.trim().split(/\s+/)[0]);
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
  for (const file of all.filter(f => f.endsWith('.css') && !/[\\/](header-refresh|footer)\.css$/.test(f))) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /\.(?:site-header|site-footer|header-[\w-]+|footer-[\w-]+)\b/);
  }
  for (const file of pages) {
    const links = [...fs.readFileSync(file, 'utf8').matchAll(/<link[^>]+>/g)].map(m => attrs(m[0])).filter(a => a.rel === 'stylesheet');
    assert.ok(links.at(-1).href.endsWith('typography.css'));
  }
});

test('real gallery photos reserve space and use unique lightweight previews', () => {
  for (const page of ['index.html', 'solutions/index.html']) {
    const source = fs.readFileSync(path.join(root, page), 'utf8');
    const images = [...source.matchAll(/<img[^>]+src="[^"]*assets\/solutions\/[^>]+>/g)].map(m => attrs(m[0]));
    assert.equal(images.length, 16);
    assert.equal(new Set(images.map(image => image.src)).size, 16);
    for (const image of images) {
      assert.match(image.src, /\/thumbs\//);
      assert.equal(Number(image.width), 640);
      assert.ok(Number(image.height) > 0);
      assert.equal(image.decoding, 'async');
    }
    assert.ok(images.filter(image => image.loading === 'lazy').length >= 15);
    assert.doesNotMatch(source, /legacy-solutions/);
  }
  const css = fs.readFileSync(path.join(root, 'assets/css/solutions.css'), 'utf8');
  assert.match(css, /column-count: 3; column-gap: 24px/);
  assert.match(css, /\.solutions-page \.solutions-gallery-track img \{ width: 100%; height: auto;/);
  const thumbs = all.filter(file => path.dirname(file) === path.join(root, 'assets/solutions/thumbs') && file.endsWith('.webp'));
  const full = all.filter(file => path.dirname(file) === path.join(root, 'assets/solutions') && file.endsWith('.webp'));
  const size = files => files.reduce((total, file) => total + fs.statSync(file).size, 0);
  assert.equal(thumbs.length, 16);
  assert.ok(size(thumbs) < size(full) * .3);
});

test('all pages declare responsive viewport; mobile assets and controls are linked', () => {
  for (const file of pages) assert.match(fs.readFileSync(file, 'utf8'), /name="viewport" content="width=device-width, initial-scale=1"/);
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const track of ['homeOfficesTrack']) {
    assert.ok(home.includes(`data-strip-controls="${track}"`));
    assert.ok(home.includes(`id="${track}" data-card-strip`));
    assert.equal([...home.matchAll(new RegExp(`aria-controls="${track}"`, 'g'))].length, 2);
  }
  assert.match(home, /home-solutions-marquee/);
  assert.match(home, /src="assets\/js\/home-solutions.js" defer/);
  assert.doesNotMatch(home, /src="assets\/js\/solutions-gallery.js"/);
  assert.match(home, /src="assets\/js\/card-strips.js" defer/);
  const data = fs.readFileSync(path.join(root, 'assets/js/catalog-data.js'), 'utf8');
  for (const match of data.matchAll(/image:\s*'([^']+)'/g)) checkLink(path.join(root, 'index.html'), match[1].replace('.webp', '-small.webp'));
  assert.match(home, /href="assets\/hero-home-window.webp" fetchpriority="high"/);
  assert.match(home, /class="hero-scene" aria-hidden="true"/);
  assert.ok(!home.includes('<video'));
  assert.ok(!home.includes('hero-live'));
});
