const fs = require('node:fs');
const path = require('node:path');
const version = '20261024-optimized';
function versionWorkPhotos(html) {
  return html.replace(/\b(?:src|href|srcset)="[^"]*"/g, attribute => attribute.replace(
    /(?:\.\.\/)*assets\/solutions\/[^",]*?\.webp(?:\?[^"\s,]*)?/g,
    url => url.split('?')[0] + '?v=' + version
  ));
}
module.exports = { versionWorkPhotos };
if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || ['assets', 'node_modules'].includes(entry.name)) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (file.endsWith('.html')) {
        const before = fs.readFileSync(file, 'utf8');
        const after = versionWorkPhotos(before);
        if (before !== after) fs.writeFileSync(file, after);
      }
    }
  }
  walk(root);
}
