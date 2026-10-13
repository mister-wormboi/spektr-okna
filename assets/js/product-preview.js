/* Both catalogue pages render cards from the same product data and markup. */
function renderSpektrProductCard(product, { dialog = false } = {}) {
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const card = el('article', 'card product-card');
  card.dataset.category = product.category;
  if (['econom','optimal','comfort','energy','elite'].includes(product.id)) card.classList.add('product-ready');
  if (product.catalogImage) {
    const visual=el('div','product-studio-photo');
    const image=el('img');
    const prefix=window.location.pathname.includes('/catalog')?'../':'';
    image.src=prefix+product.catalogImage;
    image.srcset=prefix+product.catalogImage.replace('.webp','-small.webp')+' 480w, '+prefix+product.catalogImage+' 960w';
    image.sizes='(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw';
    image.alt=product.title+' — иллюстрация на белом фоне';
    image.width=960;image.height=640;image.loading='lazy';image.decoding='async';
    visual.append(image);card.append(visual);
  }
  const body = el('div', 'product-body');
  const title = el('h3', '', product.title);
  const details = el(dialog ? 'button' : 'a', 'product-details', 'Подробнее ↗');
  details.setAttribute('aria-label', 'Подробнее: ' + product.title);
  if (dialog) {
    details.type = 'button';
    details.dataset.product = product.id;
    details.setAttribute('aria-haspopup', 'dialog');
  } else {
    details.href = 'catalog/?category=' + product.category + '&product=' + product.id;
    const link = el('a', '', product.title);
    link.href = details.href;
    title.replaceChildren(link);
  }
  const features = el('ul', 'product-feature-chips');
  product.features.slice(0,2).forEach(text => features.append(el('li', '', text)));
  const price = el('span', 'product-price', product.priceLabel);
  price.title = product.priceNote;
  const bottom = el('div', 'product-bottom');
  bottom.append(price, details);
  body.append(el('p', 'product-subtitle', product.subtitle), title,
    el('p', 'product-description', product.description), features, bottom);
  card.append(body);
  return card;
}
function renderSpektrProductPreview(product) {
  return renderSpektrProductCard(product);
}
