function selectSpektrProducts(products, { category = 'all', productIds = null, query = '', sort = 'default' } = {}) {
  const normalize = value => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').replaceAll('рехау','rehau').replaceAll('провин','pro wins').trim();
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const result = products.filter(product => {
    const text = normalize([product.title,product.subtitle,product.description,...product.features].join(' '));
    return (category === 'all' || product.category === category) && (!productIds || productIds.includes(product.id)) && words.every(word => text.includes(word));
  });
  if (sort === 'az' || sort === 'za') result.sort((a,b) => (sort === 'az' ? 1 : -1)*a.title.localeCompare(b.title,'ru'));
  return result;
}
if (typeof module !== 'undefined') module.exports = { selectSpektrProducts };

if (typeof document !== 'undefined') (() => {
  const products = window.SPEKTR_PRODUCTS || [];
  const categories = window.SPEKTR_PRODUCT_CATEGORIES || [];
  const subcategories = window.SPEKTR_PRODUCT_SUBCATEGORIES || {};
  const directions = window.SPEKTR_CATALOG_DIRECTIONS || [];
  const collections = window.SPEKTR_WINDOW_COLLECTIONS || [];
  const grid = document.querySelector('#fullCatalogCards');
  if (!grid) return;
  const el = (tag, cls, text) => { const node=document.createElement(tag); if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node; };
  const search = document.querySelector('#catalogSearch');
  const sort = document.querySelector('#catalogSort');
  const reset = document.querySelector('#catalogReset');
  const more = document.querySelector('#catalogMore');
  const nav = document.querySelector('#productCategories');
  const collectionNav = document.querySelector('#catalogCollections');
  const priceGuide = document.querySelector('#catalogPriceGuide');
  const dialog = document.querySelector('#productDialog');
  const params = new URLSearchParams(window.location.search);
  let category = categories.some(item=>item.id===params.get('category')) ? params.get('category') : 'all';
  let collection = collections.some(item=>item.id===params.get('collection')) && category==='windows' ? params.get('collection') : null;
  let limit = 9;
  let opener = null;
  search.value=params.get('q') || '';
  sort.value=['az','za'].includes(params.get('sort')) ? params.get('sort') : 'default';
  categories.forEach(item => {
    const button=el('button','product-category',item.title);
    button.type='button';button.dataset.category=item.id;
    button.setAttribute('aria-controls','fullCatalogCards');
    button.addEventListener('click',()=>selectDirection(item.id));nav.append(button);
  });
  collections.forEach(item => {
    const button=el('button','catalog-collection',item.title);button.type='button';button.dataset.collection=item.id;
    button.setAttribute('aria-controls','fullCatalogCards');
    button.addEventListener('click',()=>{collection=item.id;limit=9;render();});collectionNav.append(button);
  });
  function selectDirection(id) { category=id;collection=null;limit=9;search.value='';render(); }
  function render() {
    const selected=categories.find(item=>item.id===category);
    const selectedCollection=(subcategories[category] || []).find(item=>item.id===collection);
    const title=document.querySelector('#fullCatalogTitle');
    title.replaceChildren(document.createTextNode(selectedCollection ? collections.find(item=>item.id===collection).title : selected?.title || 'Каталог продукции.'));
    document.querySelector('#catalogDescription').textContent=selectedCollection
      ? collections.find(item=>item.id===collection).description
      : selected?.caption || 'От готовых окон до остекления по индивидуальному проекту.';
    nav.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
    collectionNav.hidden=category!=='windows'||!collection;
    collectionNav.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.collection===collection)));
    const guide=window.SPEKTR_PRICE_GUIDES[category];
    priceGuide.hidden=!guide;
    if(guide){
      document.querySelector('#catalogPriceTitle').textContent=guide.title;
      document.querySelector('#catalogPriceValue').textContent=guide.label;
      const link=priceGuide.querySelector('a');
      link.href=category==='windows'?'../calculator/':'../request/';
      link.replaceChildren(document.createTextNode(category==='windows'?'Рассчитать своё окно ':'Получить расчёт '),el('span','','↗'));
      link.querySelector('span').setAttribute('aria-hidden','true');
    }
    const query=search.value.trim();
    const source=query ? products : category==='all' ? directions : category==='windows'&&!collection ? collections : products;
    grid.classList.toggle('is-collections',!query&&category==='windows'&&!collection);
    const matches=selectSpektrProducts(source,{category,productIds:selectedCollection?.products,query,sort:sort.value});
    const shown=matches.slice(0,limit);
    grid.replaceChildren(...shown.map(product=>renderSpektrProductCard(product,{dialog:true})));
    if(!matches.length){const empty=el('div','product-empty');const clear=el('button','','Сбросить поиск');clear.type='button';clear.addEventListener('click',resetAll);empty.append(el('h3','','Ничего не найдено'),el('p','','Попробуйте другое название или выберите направление.'),clear);grid.append(empty);}
    document.querySelector('#catalogCount').textContent=query ? `Найдено: ${matches.length}. Показано: ${shown.length}.` : '';
    more.hidden=limit>=matches.length;more.textContent='Показать ещё';
    reset.hidden=category==='all'&&!query&&sort.value==='default';
  }
  function resetAll(){category='all';collection=null;search.value='';sort.value='default';limit=9;render();}
  search.addEventListener('input',()=>{limit=9;render();});
  sort.addEventListener('change',()=>{limit=9;render();});
  reset.addEventListener('click',resetAll);
  more.addEventListener('click',()=>{limit+=9;render();});
  grid.addEventListener('click',event=>{
    const direction=event.target.closest('[data-direction]');
    if(direction){selectDirection(direction.dataset.direction);document.querySelector('#fullCatalogTitle').focus();return;}
    const group=event.target.closest('[data-collection]');
    if(group){collection=group.dataset.collection;limit=9;render();document.querySelector('#fullCatalogTitle').focus();return;}
    const button=event.target.closest('[data-product]');if(!button)return;
    const product=products.find(item=>item.id===button.dataset.product);if(product)openProduct(product,button);
  });
  function openProduct(product,button) {
    opener=button;
    const photo=document.querySelector('#productDialogPhoto');photo.src='../'+product.catalogImage;photo.alt=product.title+' — визуализация в обстановке';
    document.querySelector('#productDialogTitle').textContent=product.title;
    document.querySelector('#productDialogDescription').textContent=product.description;
    document.querySelector('#productDialogFeatures').replaceChildren(...product.features.map(text=>el('li','',text)));
    document.querySelector('#productDialogPriceNote').textContent=product.priceNote;
    document.querySelector('#productDialogCall').setAttribute('aria-label',`Обсудить заказ: ${product.title}`);
    dialog.showModal();
  }
  dialog.addEventListener('close',()=>{opener?.focus();});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
  render();
  const linkedProduct=products.find(item=>item.id===params.get('product'));
  if(linkedProduct)openProduct(linkedProduct,search);
})();
