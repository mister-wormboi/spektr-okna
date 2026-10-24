// Publish all originals on /reviews/ and a shorter, mixed selection on the home page.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'content/reviews.json'), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const organization = review => review.organization_id || data.default_organization_id;
// Alternate offices deterministically; preserve the original order within each office.
function mixReviews(reviews) {
  const queues = new Map();
  reviews.forEach(review => {
    const id = organization(review);
    if (!data.branches[id]) throw new Error(`Unknown branch: ${id}`);
    if (!queues.has(id)) queues.set(id, []);
    queues.get(id).push(review);
  });
  const mixed = [];
  let previous;
  while (mixed.length < reviews.length) {
    const available = [...queues].filter(([, queue]) => queue.length).sort((a, b) => b[1].length - a[1].length);
    const [id, queue] = available.find(([id]) => id !== previous) || available[0];
    mixed.push(queue.shift());
    previous = id;
  }
  return mixed;
}
function homeSelection(reviews) {
  const shortest = [...reviews].sort((a, b) => a.text.length - b.text.length);
  const selected = [];
  const represented = new Set();
  for (const review of shortest) {
    const id = organization(review);
    if (represented.has(id)) continue;
    selected.push(review);
    represented.add(id);
  }
  for (const review of shortest) {
    if (selected.length >= 10) break;
    if (!selected.includes(review)) selected.push(review);
  }
  return mixReviews(selected.slice(0, 10));
}
function card(review) {
  const initials = review.author.split(/\s+/).slice(0, 2).map(word => [...word][0]).join('');
  const id = organization(review);
  const href = `https://yandex.ru/maps/org/${id}/reviews?reviews%5BpublicId%5D=${encodeURIComponent(review.publicId)}&utm_source=review`;
  return `<article class="review-card" data-rating="${review.rating}" data-topics="${escape(review.topics)}" data-branch="${id}">
            <div class="review-top"><div class="review-avatar" aria-hidden="true">${escape(initials)}</div><div><h3>${escape(review.author)}</h3><span>Яндекс Карты · ${escape(data.branches[id])}</span></div><span class="review-quote" aria-hidden="true">“</span></div>
            <div class="review-stars" aria-label="Оценка ${review.rating} из 5">${'★'.repeat(review.rating)}</div>
            <p>${escape(review.text).replaceAll('\n', '<br>')}</p>
            <footer><time datetime="${review.published}">${escape(date.format(new Date(review.published)))}</time><a class="review-verified" href="${escape(href)}" target="_blank" rel="noopener noreferrer">Оригинал на Яндекс Картах ↗</a></footer>
          </article>`;
}
if (new Set(data.reviews.map(review => review.publicId)).size !== data.reviews.length) throw new Error('Duplicate review');
for (const file of ['index.html', 'reviews/index.html']) {
  const reviews = file === 'index.html' ? homeSelection(data.reviews) : mixReviews(data.reviews);
  const cards = reviews.map(card).join('\n          ');
  const filename = path.join(root, file);
  let html = fs.readFileSync(filename, 'utf8');
  const pattern = /<article class="review-card[^\"]*"[^>]*>[\s\S]*?<\/article>/g;
  const oldCards = [...html.matchAll(pattern)];
  if (!oldCards.length) throw new Error(`Review cards missing: ${file}`);
  const first = oldCards[0], last = oldCards.at(-1);
  html = html.slice(0, first.index) + cards + html.slice(last.index + last[0].length);
  fs.writeFileSync(filename, html);
}
console.log(`Published 10 shorter originals on the home page and ${data.reviews.length} on /reviews/.`);
