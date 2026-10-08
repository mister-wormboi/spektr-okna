function selectSpektrProducts(products, { category = 'all', query = '', sort = 'default' } = {}) {
  const normalize = value => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').replaceAll('рехау','rehau').replaceAll('провин','pro wins').trim();
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const result = products.filter(product => {
    const text = normalize([product.title,product.subtitle,product.description,...product.features].join(' '));
    return (category === 'all' || product.category === category) && words.every(word => text.includes(word));
  });
  if (sort === 'az' || sort === 'za') result.sort((a,b) => (sort === 'az' ? 1 : -1)*a.title.localeCompare(b.title,'ru'));
  return result;
}
if (typeof module !== 'undefined') module.exports = { selectSpektrProducts };

if (typeof document !== 'undefined') (() => {
  const products = window.SPEKTR_PRODUCTS || [];
  const categories = window.SPEKTR_PRODUCT_CATEGORIES || [];
  const grid = document.querySelector('#fullCatalogCards');
  if (!grid) return;
  const icons = {
    all: '<rect x="8" y="8" width="12" height="12"/><rect x="28" y="8" width="12" height="12"/><rect x="8" y="28" width="12" height="12"/><rect x="28" y="28" width="12" height="12"/>',
    window:'<rect x="8" y="5" width="32" height="38"/><path d="M24 5v38M12 9h8v30h-8zM28 9h8v30h-8zM28 23v5"/>',
    balcony:'<path d="M5 7h38v25H5zM17 7v25M31 7v25M3 43h42M6 43V30m9 13V30m9 13V30m9 13V30m9 13V30M3 30h42"/>',
    door:'<path d="M10 43V5h28v38M6 43h36M15 10h18v27H15zM29 24v4"/>',
    gate:'<path d="M4 43V7h40v36M9 43V12h30v31M9 18h30M9 24h30M9 30h30M9 36h30M21 40h6"/>',
    ceiling:'<path d="m5 12 19-7 19 7-19 8-19-8Zm0 0v24l19 7 19-7V12M24 20v23M10 14l14 5 14-5M24 19v8m-5 4h10l-5-4-5 4Z"/>',
    blind:'<path d="M8 6h32v5H8zM10 11v24h28V11M10 17h28M10 23h28M10 29h28M24 35v7M20 42h8M42 10v24"/>',
    aluminium:'<path d="M4 6h40v36H4zM17 6v36M31 6v36M7 9h7v30H7zM20 9h8v30h-8zM34 9h7v30h-7zM22 23l4 3-4 3"/>'
  };
  const el = (tag, cls, text) => { const node=document.createElement(tag); if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node; };
  function icon(name) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 48 48');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.innerHTML=icons[name];return svg;
  }
  const categoryFor = product => categories.find(item => item.id === product.category);
  function visual(product) {
    const frame=el('div','product-visual');
    if(product.image){
      const image=el('img');image.src='../'+product.image;
      image.srcset=`../${product.image.replace('.webp','-small.webp')} 768w, ../${product.image} 1536w`;
      image.sizes='(max-width:600px) calc(100vw - 40px), (max-width:1000px) 45vw, 420px';
      image.alt='';image.width=1536;image.height=1024;image.loading='lazy';image.decoding='async';frame.append(image);
    } else { frame.classList.add('product-illustration');frame.append(icon(categoryFor(product).icon)); }
    return frame;
  }
  const search=document.querySelector('#catalogSearch');
  const sort=document.querySelector('#catalogSort');
  const reset=document.querySelector('#catalogReset');
  const more=document.querySelector('#catalogMore');
  const nav=document.querySelector('#productCategories');
  const dialog=document.querySelector('#productDialog');
  const params = new URLSearchParams(window.location.search);
  let category=categories.some(item=>item.id===params.get('category')) ? params.get('category') : 'all';
  search.value=params.get('q') || '';
  sort.value=['az','za'].includes(params.get('sort')) ? params.get('sort') : 'default';
  let limit=9;let opener=null;
  const buttons=[];
  [{id:'all',title:'Вся продукция',icon:'all'},...categories].forEach(item => {
    const button=el('button','product-category');button.type='button';button.dataset.category=item.id;
    button.setAttribute('aria-pressed',String(item.id === category));button.setAttribute('aria-controls','fullCatalogCards');
    const total=item.id==='all'?products.length:products.filter(product=>product.category===item.id).length;
    const forms=item.id==='all'?{one:'решение',few:'решения',many:'решений'}:{one:'позиция',few:'позиции',many:'позиций'};
    const noun=forms[new Intl.PluralRules('ru').select(total)] || forms.many;
    button.append(icon(item.icon),el('span','product-category-name',item.title),el('span','product-category-count',`${total} ${noun}`),el('span','product-category-arrow','↗'));
    button.addEventListener('click',()=>{
      category=item.id;limit=9;render();
      const results=document.querySelector('.product-results-heading');
      if(results.getBoundingClientRect().top>window.innerHeight*.8) results.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    });buttons.push(button);nav.append(button);
  });
  function render() {
    const selected=categories.find(item=>item.id===category);
    document.querySelector('#fullCatalogTitle').textContent=selected?.title || 'Вся продукция';
    document.querySelector('#categoryDescription').textContent=selected?.caption || 'Выберите категорию или найдите нужное по названию и характеристикам.';
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
    const matches=selectSpektrProducts(products,{category,query:search.value,sort:sort.value});
    const shown=matches.slice(0,limit);
    grid.replaceChildren(...shown.map(product=>{
      const card=el('article','product-card');card.dataset.category=product.category;const body=el('div','product-body');
      const ready=['econom','optimal','comfort','energy','elite'].includes(product.id);
      if(ready)card.classList.add('product-ready');
      const tags=el('p','product-subtitle',product.subtitle);
      const title=el('h3','',product.title);
      const desc=el('p','product-description',product.description);
      const footer=el('div','product-bottom');
      const details=el('button','product-details','Подробнее ↗');details.type='button';details.dataset.product=product.id;details.setAttribute('aria-label',`Подробнее: ${product.title}`);details.setAttribute('aria-haspopup','dialog');
      footer.append(el('span','','Индивидуальный расчёт'),details);
      const features=el('ul','product-feature-chips');
      product.features.slice(0,2).forEach(text=>features.append(el('li','',text)));
      const picture=visual(product);
      const badge=el('span','product-visual-badge',ready?'Коллекция «Спектр»':categoryFor(product).title);picture.append(badge);
      body.append(tags,title,desc,features,footer);card.append(picture,body);return card;
    }));
    if(!matches.length){const empty=el('div','product-empty');const clear=el('button','','Сбросить выбор');clear.type='button';clear.addEventListener('click',resetAll);empty.append(el('h3','','Ничего не найдено'),el('p','','Попробуйте другое название или выберите другую категорию.'),clear);grid.append(empty);}
    document.querySelector('#catalogCount').textContent=`Показано ${shown.length} из ${matches.length}${search.value.trim()?' по вашему запросу':''}`;
    more.hidden=limit>=matches.length;more.textContent=`Показать ещё (${Math.min(9,Math.max(0,matches.length-limit))})`;
    reset.hidden=category==='all'&&!search.value&&sort.value==='default';
  }
  function resetAll(){category='all';search.value='';sort.value='default';limit=9;render();}
  search.addEventListener('input',()=>{limit=9;render();});sort.addEventListener('change',()=>{limit=9;render();});
  document.querySelectorAll('[data-catalog-query]').forEach(button=>button.addEventListener('click',()=>{
    category='all';search.value=button.dataset.catalogQuery;limit=9;render();
    document.querySelector('.product-results-heading').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }));
  reset.addEventListener('click',resetAll);
  more.addEventListener('click',()=>{limit+=9;render();});
  grid.addEventListener('click',event=>{
    const button=event.target.closest('[data-product]');if(!button)return;
    const product=products.find(item=>item.id===button.dataset.product);if(!product)return;
    openProduct(product,button);
  });
  function openProduct(product,button) {
    opener=button;
    document.querySelector('#productDialogVisual').replaceChildren(visual(product));
    document.querySelector('#productDialogCategory').textContent=categoryFor(product).title+' / '+product.subtitle;
    document.querySelector('#productDialogTitle').textContent=product.title;
    document.querySelector('#productDialogDescription').textContent=product.description;
    document.querySelector('#productDialogFeatures').replaceChildren(...product.features.map(text=>el('li','',text)));
    document.querySelector('#productDialogCall').setAttribute('aria-label',`Обсудить заказ: ${product.title}`);
    dialog.showModal();
  }
  dialog.addEventListener('close',()=>{opener?.focus();});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
  render();
  const linkedProduct=products.find(item=>item.id===params.get('product'));
  if(linkedProduct) openProduct(linkedProduct,document.querySelector('#catalogSearch'));
})();
