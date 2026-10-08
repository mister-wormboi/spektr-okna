// Static HTML for article listings and summaries; no browser-side rendering.
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
  slugs.add(article.slug);
}

function render(values) {
  return shell.replace(/\{\{([a-z_]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing template value: ${key}`);
    return values[key];
  });
}

function card(article, index, prefix, linkPrefix, eager = false) {
  return `<article class="article-card">
    <a class="article-card-link" href="${linkPrefix}${article.slug}/" aria-label="${escape(article.title)}">
      <div class="article-image"><img src="${prefix}${article.image.path}" alt="" width="${article.image.width}" height="${article.image.height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"><span class="article-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span></div>
      <div class="article-copy"><div class="article-meta"><span>${escape(article.category)}</span><time datetime="${article.source.published_on}" title="Дата публикации оригинала">${date(article.source.published_on)}</time></div><h2>${escape(article.title)}</h2><p>${escape(article.description)}</p><span class="article-read">Читать статью <span aria-hidden="true">↗</span></span></div>
    </a>
  </article>`;
}

function help(prefix) {
  return `<section class="articles-help" aria-labelledby="articles-help-title"><div><span class="eyebrow">От чтения — к решению</span><h2 id="articles-help-title">Подберём окна<br><em>для вашего дома.</em></h2></div><a href="${prefix}calculator/">Рассчитать стоимость <span aria-hidden="true">↗</span></a></section>`;
}

const listing = `<main id="content" class="articles-main wrap">
  <section class="articles-intro" aria-labelledby="articles-title"><div><span class="eyebrow">Журнал / полезное об окнах</span><h1 id="articles-title">Об окнах —<br><em>по делу.</em></h1></div><div class="articles-intro-note"><p>Как выбрать, на чём сэкономить<br>и что сделать, чтобы дома было комфортнее.</p><a href="#articles-list">Смотреть ${articles.length} статей <span aria-hidden="true">↓</span></a></div></section>
  <div class="articles-section-label" id="articles-list"><span>Выбор, уход и детали</span><span>${articles.length} материалов</span></div>
  <section class="articles-grid" aria-label="Превью статей">${articles.map((a, i) => card(a, i, '../', './', i === 0)).join('\n')}</section>
  <p class="articles-source">Краткие разборы по материалам <a href="https://www.mosokna.ru/stati" target="_blank" rel="noopener noreferrer">«Московских окон» ↗</a>. Даты и иллюстрации — из оригиналов.</p>
  ${help('../')}
</main>`;

fs.writeFileSync(path.join(root, 'articles/index.html'), render({
  title: 'Статьи об окнах — Спектр', description: 'Выбор окон, защита от шума и жары, уход и монтаж: полезные разборы и советы для вашего дома.',
  prefix: '../', articles_href: './', nav_current: 'page', body_class: '', og_type: 'website', detail_css: '', structured_data: '', main: listing,
}));

articles.forEach((article, index) => {
  const source = article.source;
  const contents = article.sections.map((s, i) => `<li><a href="#section-${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span>${escape(s.heading)}</a></li>`).join('');
  const sections = article.sections.map((s, i) => `<section id="section-${i + 1}"><h2>${escape(s.heading)}</h2><p>${escape(s.text)}</p></section>`).join('\n');
  const related = [articles[(index + 1) % articles.length], articles[(index + 2) % articles.length]];
  const main = `<main id="content" class="article-detail wrap">
    <nav class="article-breadcrumbs" aria-label="Хлебные крошки"><a href="../../">Главная</a><span aria-hidden="true">/</span><a href="../">Статьи</a><span aria-hidden="true">/</span><span aria-current="page">${escape(article.category)}</span></nav>
    <article>
      <header class="article-heading"><span class="eyebrow">${escape(article.category)} / краткий разбор</span><h1>${escape(article.title)}</h1><p class="article-lead">${escape(article.intro)}</p><div class="article-heading-meta"><span>Оригинал от <time datetime="${source.published_on}">${date(source.published_on)}</time></span><a href="#article-source">Источник: ${escape(source.name)} <span aria-hidden="true">↓</span></a></div></header>
      <figure class="article-cover"><img src="../../${article.image.path}" alt="Иллюстрация к статье «${escape(article.title)}»" width="${article.image.width}" height="${article.image.height}" fetchpriority="high" decoding="async"><figcaption>Иллюстрация: «${escape(source.name)}»</figcaption></figure>
      <div class="article-reading-layout"><aside class="article-sidebar"><nav aria-label="Содержание статьи"><span class="eyebrow">В этом разборе</span><ol>${contents}</ol></nav><a class="article-back" href="../">← Все статьи</a></aside>
        <div class="article-body">${sections}<aside class="article-takeaway"><span class="eyebrow">Главная мысль</span><p>${escape(article.takeaway)}</p></aside>
          <footer class="article-source-box" id="article-source"><span class="eyebrow">О материале</span><p>Краткий пересказ статьи «${escape(source.name)}». Полный материал и подробности доступны у автора.</p><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">Читать оригинал <span aria-hidden="true">↗</span></a></footer>
        </div>
      </div>
    </article>
    <section class="article-related" aria-labelledby="related-title"><div class="article-related-heading"><h2 id="related-title">Читайте также</h2><a href="../">Все статьи ↗</a></div><div class="articles-grid">${related.map(a => card(a, articles.indexOf(a), '../../', '../')).join('\n')}</div></section>
    ${help('../../')}
  </main>`;
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.description,
    inLanguage: 'ru', isBasedOn: source.url, abstract: article.intro, genre: 'Краткий пересказ',
    publisher: { '@type': 'Organization', name: 'Спектр' } };
  const dir = path.join(root, 'articles', article.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), render({
    title: escape(article.title + ' — Спектр'), description: escape(article.description), prefix: '../../', articles_href: '../',
    nav_current: 'location', body_class: 'article-detail-page', og_type: 'article',
    detail_css: '<link rel="stylesheet" href="../../assets/css/article-detail.css">', structured_data: jsonLd(schema), main,
  }));
});
console.log(`Built article listing and ${articles.length} article pages.`);
