const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('component styles do not redefine the shared root palette', () => {
  for (const file of fs.readdirSync(path.join(root, 'assets/css')).filter(file => file.endsWith('.css') && file !== 'theme.css')) {
    for (const block of read('assets/css/' + file).matchAll(/:root\s*\{([^}]+)\}/g)) {
      assert.doesNotMatch(block[1], /--(?:brand|green|green-dark|ink|muted|paper|surface|line|shadow)\s*:/, file);
    }
  }
});

test('both palettes keep body text, secondary text and action labels readable', () => {
  const luminance = hex => {
    const values = hex.slice(1).match(/../g).map(n => parseInt(n, 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  };
  const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
  for (const theme of ['light', 'dark']) {
    const block = read('assets/css/theme.css').match(new RegExp(`html\\[data-theme="${theme}"\\]\\s*\\{([^}]+)\\}`))[1];
    const colors = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/g)].map(m => [m[1], m[2]]));
    for (const background of ['paper', 'surface']) for (const text of ['ink', 'muted', 'green']) {
      assert.ok(contrast(colors[text], colors[background]) >= 4.5, `${theme}: ${text} on ${background}`);
    }
    assert.ok(contrast(colors['on-accent'], colors.green) >= 4.5, theme + ': action label');
  }
});

test('local webfonts use WOFF2 and are substantially smaller than the preserved originals', () => {
  const css = read('assets/css/fonts.css');
  assert.doesNotMatch(css, /url\([^)]*\.ttf/);
  const fonts = [...css.matchAll(/url\('\.\.\/([^']+\.woff2)'\)/g)].map(m => m[1]);
  assert.equal(fonts.length, 4);
  let original = 0, compressed = 0;
  for (const file of fonts) {
    const bytes = fs.readFileSync(path.join(root, 'assets', file));
    assert.equal(bytes.subarray(0, 4).toString(), 'wOF2');
    compressed += bytes.length;
    original += fs.statSync(path.join(root, 'assets', file.replace('.woff2', '.ttf'))).size;
  }
  assert.ok(compressed < original * .4);
});
