// Static metadata: crawlers get the same title, addresses and content as visitors.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const config = require('../content/seo.json');
const branches = require('../content/branches.json');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const plain = value => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().replaceAll('&amp;', '&');
const absolute = value => new URL(value, config.siteUrl).href;
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
function pages(dir = root) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || ['node_modules', 'assets', 'tools', 'tests', 'docs', 'content', 'templates'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? pages(file) : entry.name === 'index.html' ? [file] : [];
  });
}
function branchSchema(branch) {
  return {
    '@type': 'HomeAndConstructionBusiness', '@id': absolute(`contacts/${branch.slug}/#${branch.id}`),
    name: `Спектр — ${branch.city}, ${branch.street}`, url: absolute(`contacts/${branch.slug}/`),
    image: absolute(branch.mapImage), telephone: branch.phones.map(p => p.number),
    parentOrganization: { '@id': absolute('#organization') },
    openingHoursSpecification: branch.openingHoursSpecification,
    address: { '@type': 'PostalAddress', addressCountry: 'RU', addressRegion: branch.region, addressLocality: branch.city, streetAddress: branch.street },
    hasMap: `https://yandex.ru/maps/?text=${encodeURIComponent(branch.city + ', ' + branch.street)}`
  };
}
function applySeo() {
  const indexable = [];
  const articleData = require('../content/articles.json').articles;
  for (const file of pages()) {
    let html = fs.readFileSync(file, 'utf8');
    const relative = path.relative(root, file).split(path.sep).join('/').replace(/index\.html$/, '');
    const route = '/' + relative;
    const url = absolute(relative);
    const redirect = html.match(/http-equiv="refresh"\s+content="[^;]+;\s*url=([^"]+)"/i);
    const canonical = (redirect ? new URL(redirect[1], url).href : url).split('#')[0];
    const metadata = config.pages[route];
    if (metadata) {
      html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(metadata.title)}</title>`);
      html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?\s*>/, `<meta name="description" content="${escape(metadata.description)}">`);
    }
    const title = plain(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || 'Спектр');
    const description = html.match(/name="description"\s+content="([^"]*)"/)?.[1] || '';
    html = html.replace(/\s*<!-- seo:start -->[\s\S]*?<!-- seo:end -->/g, '');
    html = html.replace(/\s*<link[^>]+rel="canonical"[^>]*>/g, '');
    html = html.replace(/\s*<meta\s+(?:property|name)="(?:og:[^"]+|twitter:[^"]+)"[^>]*>/g, '');
    // Enrich the existing Article object rather than creating another Article.
    const article = articleData.find(a => route === `/articles/${a.slug}/`);
    if (article) html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (tag, source) => {
      const data = JSON.parse(source);
      if (data['@type'] !== 'Article') return tag;
      Object.assign(data, { '@id': url + '#article', url, mainEntityOfPage: { '@id': url + '#webpage' }, image: absolute(article.image.path), publisher: { '@id': absolute('#organization'), '@type': 'Organization', name: config.name, logo: { '@type': 'ImageObject', url: absolute('assets/logo-light.webp') } } });
      return `<script type="application/ld+json">${json(data)}</script>`;
    });
    const graph = [];
    if (!redirect) {
      indexable.push(url);
      graph.push({ '@type': 'WebPage', '@id': url + '#webpage', url, name: title, description: plain(description), inLanguage: 'ru-RU', isPartOf: { '@id': absolute('#website') }, about: { '@id': absolute('#organization') } });
      if (route === '/' || route === '/about/') {
        graph.push({ '@type': 'Organization', '@id': absolute('#organization'), name: config.name, url: config.siteUrl, logo: absolute('assets/logo-light.webp'), telephone: config.telephone, foundingDate: '2004', areaServed: [...new Set(branches.map(b => b.city))] });
      }
      if (route === '/') graph.push({ '@type': 'WebSite', '@id': absolute('#website'), name: config.name, url: config.siteUrl, inLanguage: 'ru-RU', publisher: { '@id': absolute('#organization') } });
      if (route === '/contacts/') graph.push(...branches.map(branchSchema));
      const localBranches = branches.filter(b => route === `/contacts/${b.slug}/`);
      graph.push(...localBranches.map(branchSchema));
      // Breadcrumbs reflect the actual visible navigation.
      const crumb = html.match(/<nav[^>]+(?:class="[^"]*breadcrumbs[^"]*"|aria-label="Хлебные крошки")[^>]*>([\s\S]*?)<\/nav>/);
      if (crumb) {
        const links = [...crumb[1].matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m => ({ name: plain(m[2]), item: new URL(m[1], url).href }));
        const current = crumb[1].match(/<span[^>]*aria-current="page"[^>]*>([\s\S]*?)<\/span>/);
        if (current) links.push({ name: plain(current[1]), item: url });
        if (links.length > 1) graph.push({ '@type': 'BreadcrumbList', itemListElement: links.map((item, i) => ({ '@type': 'ListItem', position: i + 1, ...item })) });
      }
    } else if (!/name="robots"[^>]*noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, follow">\n</head>');
    const image = absolute('assets/solutions/thumbs/brick-building-glazing.webp');
    const tags = `\n  <!-- seo:start -->\n  <link rel="canonical" href="${escape(canonical)}">\n  <meta property="og:locale" content="ru_RU">\n  <meta property="og:site_name" content="Спектр">\n  <meta property="og:title" content="${escape(title)}">\n  <meta property="og:description" content="${description}">\n  <meta property="og:type" content="${article ? 'article' : 'website'}">\n  <meta property="og:url" content="${escape(canonical)}">\n  <meta property="og:image" content="${image}">\n  <meta property="og:image:alt" content="Остекление на объекте «Спектр»">\n  <meta name="twitter:card" content="summary_large_image">\n  ${graph.length ? `<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': graph })}</script>` : ''}\n  <!-- seo:end -->\n`;
    html = html.replace(/\s*<\/head>/, tags + '</head>');
    fs.writeFileSync(file, html.split('\n').map(line => line.trimEnd()).join('\n'));
  }
  fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.sort().map(url => `  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /tools/\nDisallow: /tests/\nDisallow: /templates/\nDisallow: /content/\nDisallow: /docs/\n\nSitemap: ${absolute('sitemap.xml')}\n`);
  return indexable.length;
}
module.exports = { applySeo, branchSchema };
if (require.main === module) console.log(`SEO updated: ${applySeo()} indexable pages.`);
