const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('both request blocks use the same inline Bitrix24 form exactly once', () => {
  const embeds = ['index.html', 'request/index.html'].map(file => {
    const html = read(file);
    const scripts = [...html.matchAll(/<script data-b24-form="([^"]+)" data-skip-moving="true">([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 1, file);
    assert.equal(scripts[0][1], 'inline/5/q69y9k');
    assert.ok(scripts[0][2].includes('https://cdn-ru.bitrix24.ru/b32449848/crm/form/loader_5.js'));
    assert.match(scripts[0][2], /s\.async=true/);
    assert.match(html, /class="request-embed"/);
    assert.match(html, /<noscript>[\s\S]*?JavaScript[\s\S]*?<\/noscript>/);
    assert.match(html, /class="request-fallback"[^>]*>[\s\S]*?href="tel:\+79895175699"/);
    return scripts[0][0];
  });
  assert.equal(embeds[0], embeds[1]);
  assert.match(read('index.html'), /href="request\/"/);
  assert.match(read('request/index.html'), /<h1 id="requestTitle">Оставить заявку<\/h1>/);
});
