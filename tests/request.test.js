const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('home request follows the calculator with text on the left and the form on the right', () => {
  const html = read('index.html');
  const sections = [...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].map(match => match[0]);
  const calculator = sections.findIndex(section => section.includes('id="calculator"'));
  const request = sections[calculator + 1];
  assert.match(request, /id="request"/);
  assert.match(request, /data-b24-form="inline\/5\/q69y9k"/);
  assert.match(request, /class="request-copy(?: [^"]+)?"[\s\S]*class="request-panel"/);
  assert.doesNotMatch(request, /window-3d-viewport|window-3d-fallback/);
  assert.doesNotMatch(html, /window-showroom|window3dTitle/);
  assert.match(html, /id="window-details"/);
});

test('home uses forms 5 and 9; the request page uses forms 3 and 7 for light and dark themes', () => {
  for (const [file, form, loader] of [['index.html', 'inline/5/q69y9k', 5], ['index.html', 'inline/9/h54l7f', 9], ['request/index.html', 'inline/3/gmh4uz', 3], ['request/index.html', 'inline/7/key9wr', 7]]) {
    const html = read(file);
    const scripts = [...html.matchAll(/<script data-b24-form="([^"]+)"([^>]*)>([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 2, file);
    const script = scripts.find(script => script[1] === form);
    assert.ok(script, form);
    assert.match(script[2], /data-skip-moving="true"/);
    if (loader === 3) assert.ok(script[2].includes('data-b24-form-telemetry-sign="v1:3:site.d16f9e5703acbc330fa8bd03b9313497a79eac46fbb07c58599a2c6842541f1c"'));
    if (loader === 7) assert.ok(script[2].includes('data-b24-form-telemetry-sign="v1:7:site.a11dee4f71c619bb6f66a63b3757fbfa55b32e9cb81a2e9e733c7a17f20ee4e1"'));
    if (loader === 9) assert.ok(script[2].includes('data-b24-form-telemetry-sign="v1:9:site.8a81d6d9a1b2d648461160a6bb870cdd7b254669bde630868b6fdbaed6c7767b"'));
    assert.match(html, /assets\/js\/request-theme\.js" defer/);
    const variant = html.match(new RegExp(`<div data-request-theme="${loader === 7 || loader === 9 ? 'dark' : 'light'}" hidden>([\\s\\S]*?)<\\/div>`));
    assert.ok(variant?.[1].includes(`data-b24-form="${form}"`));
    assert.match(variant[1], /<template><script/);
    assert.ok(script[3].includes(`https://cdn-ru.bitrix24.ru/b32449848/crm/form/loader_${loader}.js`));
    assert.match(script[3], /s\.async=true/);
    assert.match(html, /class="request-embed"/);
    assert.match(html, /<noscript>[\s\S]*?JavaScript[\s\S]*?<\/noscript>/);
    assert.match(html, /class="request-fallback"[^>]*>[\s\S]*?href="tel:\+79895175699"/);
  }
  assert.match(read('index.html'), /href="request\/"/);
  const heading = read('request/index.html').match(/<h1 id="requestTitle">([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '');
  assert.equal(heading, 'Оставить заявку.');
});

test('every shared header links to the request page, including nested articles', () => {
  const root = path.resolve(__dirname, '..');
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
  });
  for (const file of walk(root)) {
    const html = fs.readFileSync(file, 'utf8');
    const nav = html.match(/<nav class="header-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    if (!nav) continue;
    const links = [...nav.matchAll(/<a class="header-request-link" href="([^"]+)"[^>]*>Оставить заявку<\/a>/g)];
    assert.equal(links.length, 1, file);
    assert.equal(path.resolve(path.dirname(file), links[0][1]), path.join(root, 'request'), file);
  }
  assert.match(read('templates/articles-shell.tpl'), /class="header-request-link" href="\{\{prefix\}\}request\/"/);
  assert.match(read('request/index.html'), /class="header-request-link"[^>]*aria-current="page"/);
});
