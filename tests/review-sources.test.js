const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const data = JSON.parse(read('content/reviews.json'));
const selected = data.displayed_authors.map(author => data.reviews.find(review => review.author === author));
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

test('the home selection and full reviews page preserve complete original text and branch sources', () => {
  for (const file of ['index.html', 'reviews/index.html']) {
    const html = read(file);
    const cards = [...html.matchAll(/<article class="review-card[^\"]*"[^>]*>[\s\S]*?<\/article>/g)].map(match => match[0]);
    assert.equal(cards.length, selected.length);
    cards.forEach(card => {
      const review = selected.find(review => card.includes(`<h3>${review.author}</h3>`));
      assert.ok(review);
      const id = review.organization_id || data.default_organization_id;
      assert.ok(card.includes(`<p>${escape(review.text).replaceAll('\n', '<br>')}</p>`));
      assert.ok(card.includes(`<h3>${review.author}</h3>`));
      assert.ok(card.includes(review.publicId ? `/${id}/reviews?reviews%5BpublicId%5D=${review.publicId}` : `/spektr/${id}/reviews/`));
      assert.ok(card.includes(data.branches[id]));
      assert.ok(card.includes(review.date ? `<span>${review.date}</span>` : `datetime="${review.published}"`));
    });
    assert.doesNotMatch(html, /1211069508|краткий пересказ/);
  }
});

test('only the requested Lenina branch is published on both pages', () => {
  for (const file of ['index.html', 'reviews/index.html']) {
    const branches = [...read(file).matchAll(/data-branch="(\d+)"/g)].map(match => match[1]);
    assert.equal(branches.length, 10);
    assert.ok(branches.every(id => id === data.default_organization_id));
  }
});

test('the selection preserves the local authors while retaining remote review records', () => {
  assert.equal(new Set(data.displayed_authors).size, 10);
  assert.ok(selected.every(review => review && (review.organization_id || data.default_organization_id) === '1016878662'));
  assert.ok(data.reviews.some(review => review.organization_id && review.organization_id !== data.default_organization_id));
});

test('Zorge office address and navigation use house 48 on both pages', () => {
  for (const file of ['index.html', 'contacts/index.html']) {
    const html = read(file);
    assert.match(html, /Зорге, 48/);
    assert.match(html, /Зорге%2C%2048/);
    assert.doesNotMatch(html, /Зорге, 56|Зорге%2C%2056|Медтехника/);
  }
});
