const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const data = JSON.parse(read('content/reviews.json'));
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

test('the home selection and full reviews page preserve complete original text and branch sources', () => {
  for (const file of ['index.html', 'reviews/index.html']) {
    const html = read(file);
    const cards = [...html.matchAll(/<article class="review-card[^\"]*"[^>]*>[\s\S]*?<\/article>/g)].map(match => match[0]);
    assert.equal(cards.length, file === 'index.html' ? 10 : data.reviews.length);
    cards.forEach(card => {
      const review = data.reviews.find(review => card.includes(`publicId%5D=${review.publicId}&`));
      assert.ok(review);
      const id = review.organization_id || data.default_organization_id;
      assert.ok(card.includes(`<p>${escape(review.text).replaceAll('\n', '<br>')}</p>`));
      assert.ok(card.includes(`<h3>${review.author}</h3>`));
      assert.ok(card.includes(`/${id}/reviews?reviews%5BpublicId%5D=${review.publicId}`));
      assert.ok(card.includes(data.branches[id]));
      assert.ok(card.includes(`datetime="${review.published}"`));
    });
    assert.doesNotMatch(html, /1211069508|краткий пересказ/);
  }
});

test('the home carousel mixes branches without adjacent cards from the same office', () => {
  const branches = [...read('index.html').matchAll(/data-branch="(\d+)"/g)].map(match => match[1]);
  assert.equal(branches.length, 10);
  assert.equal(new Set(branches).size, 6);
  assert.equal(branches.filter(id => id === data.default_organization_id).length, 5);
  branches.slice(1).forEach((id, i) => assert.notEqual(id, branches[i]));
});

test('home uses the shortest available originals while keeping every office represented', () => {
  const home = read('index.html');
  const selected = data.reviews.filter(review => home.includes(`publicId%5D=${review.publicId}&`));
  for (const id of Object.keys(data.branches)) {
    const originals = data.reviews.filter(review => (review.organization_id || data.default_organization_id) === id);
    const shortest = Math.min(...originals.map(review => review.text.length));
    assert.ok(selected.some(review => (review.organization_id || data.default_organization_id) === id && review.text.length === shortest));
  }
});

test('Zorge office address and navigation use house 48 on both pages', () => {
  for (const file of ['index.html', 'contacts/index.html']) {
    const html = read(file);
    assert.match(html, /Зорге, 48/);
    assert.match(html, /Зорге%2C%2048/);
    assert.doesNotMatch(html, /Зорге, 56|Зорге%2C%2056|Медтехника/);
  }
});
