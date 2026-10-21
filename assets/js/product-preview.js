/* A card has one action, on its title; the hit area covers the whole card. */
function renderSpektrProductCard(product) {
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const card = el('article', 'card product-card');
  card.dataset.category = product.category;
  if (product.catalogImage) {
    const visual=el('div','product-studio-photo');
    const image=el('img');
    const prefix=window.location.pathname.includes('/catalog')?'../':'';
    image.src=prefix+product.catalogImage;
    image.srcset=prefix+product.catalogImage.replace('.webp','-small.webp')+' 480w, '+prefix+product.catalogImage+' 960w';
    image.sizes='(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw';
    image.alt=product.title+' — визуализация в обстановке';
    image.width=960;image.height=640;image.loading='lazy';image.decoding='async';
    visual.append(image);card.append(visual);
  }
  const body = el('div', 'product-body');
  const title = el('h3');
  const browsing = product.isDirection || product.isCollection;
  const action = el('button', 'product-title-action', product.title);
  action.type='button';
  action.setAttribute('aria-label',(browsing?'Открыть раздел: ':'Открыть карточку товара: ')+product.title);
  if(product.isDirection)action.dataset.direction=product.category;
  else if(product.isCollection)action.dataset.collection=product.id;
  else {action.dataset.product=product.id;action.setAttribute('aria-haspopup','dialog');}
  title.append(action);
  const features = el('ul', 'product-feature-chips');
  product.features.slice(0,2).forEach(text => features.append(el('li', '', text)));
  body.append(title,el('p', 'product-description', product.description),features);
  if (product.priceGuide) {
    const bottom = el('div', 'product-bottom');
    const price = el('div', 'product-price');
    price.append(el('span','product-price-example',product.priceGuide.title),el('strong','',product.priceGuide.label),el('small','','Ориентировочно'));
    bottom.append(price);
    body.append(bottom);
  }
  card.append(body);
  return card;
}
