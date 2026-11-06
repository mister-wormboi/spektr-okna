// The first catalogue screen is readable without waiting for JavaScript.
// The interactive renderer replaces this with the same eight directions.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/products-data.js'), 'utf8'), { window, Intl });
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const cards = window.SPEKTR_CATALOG_DIRECTIONS.map(product => {
  const image = product.catalogImage;
  const price = product.priceGuide;
  const target = product.id === 'windows' ? 'okna/' : `?category=${product.id}`;
  return `<article class="card product-card" data-category="${product.category}">${image ? `<div class="product-studio-photo"><img src="../${escape(image)}" srcset="../${escape(image.replace('.webp', '-small.webp'))} 480w, ../${escape(image)} 960w" sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw" alt="${escape(product.title)} — визуализация в обстановке" width="960" height="640" loading="lazy" decoding="async"></div>` : ''}<div class="product-body"><h3><a class="product-title-action" href="${target}">${escape(product.title)}</a></h3><p class="product-description">${escape(product.description)}</p>${price ? `<div class="product-bottom"><div class="product-price"><span class="product-price-example">${escape(price.title)}</span><strong>${escape(price.label)}</strong><small>Ориентировочно, без монтажа и доставки</small></div></div>` : ''}</div></article>`;
}).join('\n');
const file = path.join(root, 'catalog/index.html');
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/<div class="product-grid" id="fullCatalogCards">[\s\S]*?<\/div>\s*(?=<button class="product-more")/, `<div class="product-grid" id="fullCatalogCards">${cards}</div>\n      `);
html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, '<noscript><p>Каталог направлений доступен выше. Для поиска и сравнения отдельных комплектаций включите JavaScript или <a href="tel:+79895175699">позвоните 8 (989) 517-56-99</a>.</p></noscript>');
fs.writeFileSync(file, html);
console.log('Built eight static catalogue directions.');
