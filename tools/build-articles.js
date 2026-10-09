// Static HTML for the Spektr editorial articles; no browser-side rendering.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { articles } = JSON.parse(fs.readFileSync(path.join(root, 'content/articles.json'), 'utf8'));
const shell = fs.readFileSync(path.join(root, 'templates/articles-shell.tpl'), 'utf8');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const date = value => value.split('-').reverse().join('.');
const jsonLd = value => `<script type="application/ld+json">${JSON.stringify(value).replaceAll('<', '\\u003c')}</script>`;

const slugs = new Set();
for (const article of articles) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) || slugs.has(article.slug)) throw new Error('Invalid or duplicate article slug');
  if (!article.sections.length || !fs.existsSync(path.join(root, article.image.path))) throw new Error('Missing article content or image');
  if (article.content_kind !== 'original' || !article.author || !article.published_on) throw new Error('Missing editorial metadata');
  slugs.add(article.slug);
}
for (const article of articles) {
  if (article.legacy_slug && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.legacy_slug) || slugs.has(article.legacy_slug))) throw new Error('Invalid or duplicate legacy slug');
  if (article.legacy_slug) slugs.add(article.legacy_slug);
}
const readingMinutes = article => Math.max(1, Math.ceil([...article.sections.flatMap(s => [...s.paragraphs, ...(s.items || [])]), article.takeaway].join(' ').trim().split(/\s+/).length / 180));

function render(values) {
  values = { head_extra: '', ...values };
  return shell.replace(/\{\{([a-z_]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing template value: ${key}`);
    return values[key];
  });
}

function viewCounter(slug, live = false) {
  return `<span class="article-view-count" data-article-views="${slug}" aria-label="Число просмотров пока недоступно" title="Число просмотров пока недоступно"${live ? ' aria-live="polite"' : ''}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true" focusable="false"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg><span data-view-count>—</span></span>`;
}

function card(article, prefix, linkPrefix, eager = false) {
  return `<article class="article-card">
    <a class="article-card-link" href="${linkPrefix}${article.slug}/" aria-label="${escape(article.title)}">
      <div class="article-image"><img src="${prefix}${article.image.path}" alt="" width="${article.image.width}" height="${article.image.height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div>
      <div class="article-copy"><div class="article-meta"><time datetime="${article.published_on}">${date(article.published_on)}</time>${viewCounter(article.slug)}</div><h2>${escape(article.title)}</h2><p>${escape(article.description)}</p></div>
    </a>
  </article>`;
}

function help(prefix) {
  return `<section class="articles-help" aria-labelledby="articles-help-title"><div><span class="eyebrow">От чтения — к решению</span><h2 id="articles-help-title">Подберём окна<br><em>для вашего дома.</em></h2></div><a href="${prefix}calculator/">Рассчитать стоимость <span aria-hidden="true">↗</span></a></section>`;
}

const listing = `<main id="content" class="articles-main wrap">
  <section class="articles-intro" aria-labelledby="articles-title">
    <div><span class="eyebrow">Журнал / полезное об окнах</span><h1 id="articles-title">Об окнах —<br><em>по делу.</em></h1></div>
    <div class="articles-intro-visual">
      <svg viewBox="0 0 360 140" fill="none" aria-hidden="true" focusable="false">
        <g stroke="currentColor" stroke-width="1.2">
          <path opacity=".3" d="M8 124h344M120 16v108M240 16v108"/>
          <path d="M32 28h56v88H32zM38 34h44v76H38zM60 34v76M76 74h3"/>
          <circle cx="60" cy="56" r="9"/><path d="M60 41v-4m0 38v-4M45 56h-4m38 0h-4M49 45l-3-3m28 28-3-3M49 67l-3 3m28-28-3 3"/>
          <path d="M152 28h56v88h-56zM158 34h44v76h-44zM180 34v76M196 74h3"/>
          <path opacity=".65" d="M165 53q12 19 0 38m-4-31q7 12 0 24m34-31q-12 19 0 38m4-31q-7 12 0 24"/>
          <path d="M272 28h56v88h-56zM278 34h44v76h-44zM300 34v76M316 74h3"/>
          <path opacity=".65" d="M286 95c-10-15 10-24 0-39m14 39c-10-15 10-24 0-39m14 39c-10-15 10-24 0-39"/>
        </g>
      </svg>
      <p>Свет.<span>Тишина.</span>Тепло.</p>
    </div>
  </section>
  <section class="articles-grid" aria-label="Превью статей">${articles.map((a, i) => card(a, '../', './', i === 0)).join('\n')}</section>
  ${help('../')}
</main>`;

fs.writeFileSync(path.join(root, 'articles/index.html'), render({
  title: 'Статьи об окнах — Спектр', description: 'Выбор окон, защита от шума и жары, уход и монтаж: полезные разборы и советы для вашего дома.',
  prefix: '../', articles_href: './', nav_current: 'page', body_class: '', og_type: 'website', detail_css: '', structured_data: '', main: listing,
}));

articles.forEach(article => {
  const sections = article.sections.map((s, i) => `<section id="section-${i + 1}"><h2>${escape(s.heading)}</h2>${s.paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}${s.items ? `<ul>${s.items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : ''}</section>`).join('\n');
  const main = `<main id="content" class="article-detail wrap">
    <nav class="article-breadcrumbs" aria-label="Хлебные крошки"><a href="../../">Главная</a><span aria-hidden="true">/</span><a href="../">Статьи</a><span aria-hidden="true">/</span><span aria-current="page">${escape(article.category)}</span></nav>
    <article data-article-view="${article.slug}">
      <header class="article-heading"><h1>${escape(article.title)}</h1><div class="article-heading-meta"><span><time datetime="${article.published_on}">${date(article.published_on)}</time></span><span>Чтение: около ${readingMinutes(article)} мин</span>${viewCounter(article.slug, true)}</div></header>
      <figure class="article-cover"><img src="../../${article.image.path}" alt="${escape(article.image.alt)}" width="${article.image.width}" height="${article.image.height}" fetchpriority="high" decoding="async"><figcaption>Фото из галереи «Спектра»</figcaption></figure>
      <div class="article-body">${sections}<aside class="article-takeaway"><span class="eyebrow">Главная мысль</span><p>${escape(article.takeaway)}</p></aside>
      </div>
    </article>
    ${help('../../')}
  </main>`;
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.description,
    inLanguage: 'ru', genre: 'Практическое руководство', datePublished: article.published_on,
    dateModified: article.modified_on, author: { '@type': 'Organization', name: article.author },
    publisher: { '@type': 'Organization', name: 'Спектр' } };
  const dir = path.join(root, 'articles', article.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), render({
    title: escape(article.title + ' — Спектр'), description: escape(article.description), prefix: '../../', articles_href: '../',
    nav_current: 'location', body_class: 'article-detail-page', og_type: 'article',
    detail_css: '<link rel="stylesheet" href="../../assets/css/article-detail.css">', structured_data: jsonLd(schema), main,
  }));
  if (article.legacy_slug) {
    const legacyDir = path.join(root, 'articles', article.legacy_slug);
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, 'index.html'), render({
      title: escape(article.title + ' — Спектр'), description: escape(article.description), prefix: '../../', articles_href: '../',
      nav_current: 'location', body_class: 'article-detail-page', og_type: 'website', detail_css: '', structured_data: '',
      head_extra: `<meta name="robots" content="noindex, follow"><meta http-equiv="refresh" content="0; url=../${article.slug}/">`,
      main: `<main id="content" class="articles-main wrap"><section class="articles-intro"><div><span class="eyebrow">Журнал «Спектра»</span><h1>Статья обновлена</h1><p><a href="../${article.slug}/">${escape(article.title)}</a></p></div></section></main>`,
    }));
  }
});
console.log(`Built article listing and ${articles.length} article pages.`);
