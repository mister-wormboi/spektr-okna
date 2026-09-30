/* Shared catalogue selection keeps both pages in the same order. */
function selectCatalogItems(products, { group = 'all', query = '', sort = 'default' } = {}) {
  const normalize = value => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();
  const search = normalize(query);
  const matching = products.filter(item => {
    const matchesGroup = group === 'all' || item.group === group
      || (group === 'windows-doors' && ['Окна и балконные блоки', 'Двери'].includes(item.group));
    return matchesGroup && (!search || normalize(`${item.title} ${item.group}`).includes(search));
  });
  if (sort === 'asc' || sort === 'desc') {
    const direction = sort === 'asc' ? 1 : -1;
    matching.sort((a, b) => {
      if (a.price === null && b.price === null) return 0;
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return direction * (a.price - b.price);
    });
  }
  return matching;
}

const catalogPriceFormat = new Intl.NumberFormat('ru-RU');

function renderSpektrCatalogCard(product, index, assetPrefix = '') {
  const card = document.createElement('article');
  card.className = 'card card-enter';
  card.style.setProperty('--card-delay', `${Math.min(index, 5) * 35}ms`);

  if (product.image) {
    const photo = document.createElement('div');
    photo.className = 'catalog-photo';
    const image = document.createElement('img');
    image.src = `${assetPrefix}${product.image}`;
    image.alt = product.title;
    image.width = 1536;
    image.height = 1024;
    image.loading = 'lazy';
    image.decoding = 'async';
    photo.append(image);
    card.append(photo);
  } else {
    const icon = document.createElement('div');
    icon.className = 'catalog-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="8" y="5" width="32" height="38" rx="2"/><path d="M24 5v38M8 24h32M12 10h8v10h-8zM28 10h8v10h-8zM12 28h8v10h-8zM28 28h8v10h-8z"/></svg>';
    card.append(icon);
  }

  const body = document.createElement('div');
  body.className = 'card-body';
  const category = document.createElement('small');
  category.textContent = `${product.group} · ${product.sourceCategory}`;
  const title = document.createElement('h3');
  title.textContent = product.title;
  const bottom = document.createElement('div');
  bottom.className = 'card-bottom';
  const price = document.createElement('span');
  if (product.price === null) {
    const amount = document.createElement('b');
    amount.textContent = 'По запросу';
    price.append(amount);
  } else {
    price.append(document.createTextNode('от '));
    const amount = document.createElement('b');
    amount.textContent = `${catalogPriceFormat.format(product.price)} ₽${product.unit ? ` / ${product.unit}` : ''}`;
    price.append(amount);
  }
  const contact = document.createElement('a');
  contact.href = 'tel:+79895175699';
  contact.textContent = 'Уточнить цену ↗';
  contact.setAttribute('aria-label', `Уточнить стоимость: ${product.title}`);
  bottom.append(price, contact);
  body.append(category, title, bottom);
  card.append(body);
  return card;
}

if (typeof window !== 'undefined') {
  window.selectCatalogItems = selectCatalogItems;
  window.renderSpektrCatalogCard = renderSpektrCatalogCard;
}
if (typeof module !== 'undefined') module.exports = { selectCatalogItems };
