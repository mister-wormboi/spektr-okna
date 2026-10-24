// Conservative audit: include builders/tests and evaluate dynamically named catalog images.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root);
const source = files.filter(file => !file.startsWith(path.join(root, 'docs') + path.sep) && /\.(?:html|css|js|json|tpl|py)$/.test(file))
  .map(file => fs.readFileSync(file, 'utf8')).join('\n');
const dynamic = new Set();
const window = {};
for (const file of ['assets/js/products-data.js', 'assets/js/catalog-data.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), { window });
}
for (const item of [...window.SPEKTR_PRODUCTS, ...window.SPEKTR_CATALOG]) {
  for (const file of [item.image, item.catalogImage].filter(Boolean)) {
    dynamic.add(file);
    dynamic.add(file.replace('.webp', '-small.webp'));
  }
}
const candidates = files.filter(file => path.relative(root, file).startsWith('assets' + path.sep)).filter(file => {
  const relative = path.relative(root, file);
  const name = path.basename(file);
  if (/\.(?:ttf|txt|md)$/.test(file) || name === 'LICENSE') return false;
  if (dynamic.has(relative)) return false;
  return !source.includes(name) && !source.includes(encodeURI(name));
}).map(file => ({ file: path.relative(root, file), bytes: fs.statSync(file).size }));
console.log(JSON.stringify({ candidates, totalBytes: candidates.reduce((sum, file) => sum + file.bytes, 0) }, null, 2));
