/* Home previews read the same assortment as the full catalogue. */
function renderSpektrProductPreview(product) {
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const category = window.SPEKTR_PRODUCT_CATEGORIES.find(item => item.id === product.category);
  const card = el('article', 'card');
  const photo = el('a', 'catalog-photo');
  photo.href = `catalog/?category=${product.category}&product=${product.id}`;
  photo.setAttribute('aria-label', `Подробнее: ${product.title}`);
  if (product.image) {
    const image = el('img');
    image.src = product.image;
    image.srcset = `${product.image.replace('.webp', '-small.webp')} 768w, ${product.image} 1536w`;
    image.sizes = '(max-width: 600px) 86vw, (max-width: 1100px) 45vw, 320px';
    image.alt = '';
    image.width = 1536;
    image.height = 1024;
    image.loading = 'lazy';
    image.decoding = 'async';
    photo.append(image);
  } else {
    photo.classList.add('catalog-category-visual');
    photo.append(el('span', '', category.title));
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 48 48');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.5');
    icon.setAttribute('aria-hidden', 'true');
    const paths = {
      windows: 'M8 5h32v38H8zM24 5v38',
      balconies: 'M5 7h38v25H5zM17 7v25M31 7v25M3 43h42M6 43V30m12 13V30m12 13V30m12 13V30M3 30h42',
      doors: 'M10 43V5h28v38M6 43h36M29 24v4',
      gates: 'M4 43V7h40v36M9 43V12h30v31M9 18h30M9 24h30M9 30h30M9 36h30',
      ceilings: 'm5 12 19-7 19 7-19 8-19-8Zm0 0v24l19 7 19-7V12M24 20v23',
      blinds: 'M8 6h32v5H8zM10 11v24h28V11M10 17h28M10 23h28M10 29h28M24 35v7M20 42h8',
      aluminium: 'M4 6h40v36H4zM17 6v36M31 6v36'
    };
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', paths[product.category]);
    icon.append(path);
    photo.append(icon);
  }
  const body = el('div', 'card-body');
  const title = el('h3');
  const link = el('a', '', product.title);
  link.href = photo.href;
  title.append(link);
  const bottom = el('div', 'card-bottom');
  const details = el('a', '', 'Подробнее ↗');
  details.href = photo.href;
  details.setAttribute('aria-label', `Подробнее: ${product.title}`);
  bottom.append(el('span', '', 'Индивидуальный расчёт'), details);
  body.append(el('small', '', category.title + ' · ' + product.subtitle), title,
    el('p', 'home-product-description', product.description), bottom);
  card.append(photo, body);
  return card;
}
