// Publish the explicitly selected originals, or the default mixed selection.
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
  const href = review.publicId
    ? `https://yandex.ru/maps/org/${id}/reviews?reviews%5BpublicId%5D=${encodeURIComponent(review.publicId)}&utm_source=review`
    : `https://yandex.ru/maps/org/spektr/${id}/reviews/`;
  const displayedDate = review.date ? `<span>${escape(review.date)}</span>` : `<time datetime="${review.published}">${escape(date.format(new Date(review.published)))}</time>`;
  return `<article class="review-card" data-rating="${review.rating}" data-topics="${escape(review.topics)}" data-branch="${id}">
            <div class="review-top"><div class="review-avatar" aria-hidden="true">${escape(initials)}</div><div><h3>${escape(review.author)}</h3><span>Яндекс Карты · ${escape(data.branches[id])}</span></div><span class="review-quote" aria-hidden="true">“</span></div>
            <div class="review-stars" aria-label="Оценка ${review.rating} из 5">${'★'.repeat(review.rating)}</div>
            <p>${escape(review.text).replaceAll('\n', '<br>')}</p>
            <footer>${displayedDate}<a class="review-verified" href="${escape(href)}" target="_blank" rel="noopener noreferrer">${review.publicId ? 'Оригинал на Яндекс Картах ↗' : 'Отзывы филиала на Яндекс Картах ↗'}</a></footer>
          </article>`;
}
const ids = data.reviews.filter(review => review.publicId).map(review => review.publicId);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate review');
const selected = data.displayed_authors?.map(author => {
  const review = data.reviews.find(review => review.author === author);
  if (!review) throw new Error(`Unknown selected author: ${author}`);
  return review;
});
const pageSelected = data.review_page_authors?.map(author => {
  const review = data.reviews.find(review => review.author === author);
  if (!review) throw new Error(`Unknown reviews-page author: ${author}`);
  return review;
});
const requestedPage = process.argv.find(argument => argument.startsWith('--page='))?.slice(7);
if (requestedPage && !['home', 'reviews'].includes(requestedPage)) throw new Error('Use --page=home or --page=reviews');
const files = requestedPage ? [requestedPage === 'home' ? 'index.html' : 'reviews/index.html'] : ['index.html', 'reviews/index.html'];
for (const file of files) {
  const reviews = file === 'index.html' ? (selected || homeSelection(data.reviews)) : (pageSelected || selected || mixReviews(data.reviews));
  const cards = reviews.map(card).join('\n          ');
  const filename = path.join(root, file);
  let html = fs.readFileSync(filename, 'utf8');
  const pattern = /<article class="review-card[^\"]*"[^>]*>[\s\S]*?<\/article>/g;
  const oldCards = [...html.matchAll(pattern)];
  if (!oldCards.length) throw new Error(`Review cards missing: ${file}`);
  const first = oldCards[0], last = oldCards.at(-1);
  html = html.slice(0, first.index) + cards + html.slice(last.index + last[0].length);
  fs.writeFileSync(filename, html);
  console.log(`Published ${reviews.length} complete originals in ${file}.`);
}
