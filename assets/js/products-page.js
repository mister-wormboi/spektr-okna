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
  const search=document.querySelector('#catalogSearch');
  const sort=document.querySelector('#catalogSort');
  const reset=document.querySelector('#catalogReset');
  const more=document.querySelector('#catalogMore');
  const nav=document.querySelector('#productCategories');
  const dialog=document.querySelector('#productDialog');
  const params = new URLSearchParams(window.location.search);
  let category=categories.some(item=>item.id===params.get('category')) ? params.get('category') : 'all';
  let subcategory=null;
  search.value=params.get('q') || '';
  sort.value=['az','za'].includes(params.get('sort')) ? params.get('sort') : 'default';
  let limit=9;let opener=null;
  const buttons=[];
  const menus=[];
  function closeMenus(){menus.forEach(({button,menu,wrapper})=>{menu.hidden=true;button.setAttribute('aria-expanded','false');wrapper.classList.remove('is-open');});}
  function openMenu(entry){closeMenus();entry.menu.hidden=false;entry.button.setAttribute('aria-expanded','true');entry.wrapper.classList.add('is-open');const width=entry.menu.getBoundingClientRect().width;const left=entry.wrapper.getBoundingClientRect().left;entry.menu.style.left=Math.min(0,window.innerWidth-width-16-left)+'px';}
  function showResults(){const results=document.querySelector('.product-results-heading');if(results.getBoundingClientRect().top>window.innerHeight*.8)results.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
  [{id:'all',title:'Вся продукция',icon:'all'},...categories].forEach(item => {
    const wrapper=el('div','product-category-item');
    const button=el('button','product-category');button.type='button';button.dataset.category=item.id;
    button.setAttribute('aria-pressed',String(item.id === category));button.setAttribute('aria-controls','fullCatalogCards');
    button.append(el('span','product-category-name',item.title),el('span','product-category-arrow',item.id==='all'?'':'⌄'));
    wrapper.append(button);
    let entry=null;
    if(subcategories[item.id]?.length){
      const menu=el('div','product-subcategories');menu.id='subcategories-'+item.id;menu.hidden=true;
      menu.setAttribute('role','group');menu.setAttribute('aria-label',item.title+' — подкатегории');
      button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',menu.id);
      entry={button,menu,wrapper};menus.push(entry);
      [{id:null,title:'Все: '+item.title},...subcategories[item.id]].forEach(sub=>{
        const choice=el('button','product-subcategory',sub.title);choice.type='button';choice.dataset.subcategory=sub.id || 'all';choice.setAttribute('aria-pressed','false');
        choice.addEventListener('click',()=>{category=item.id;subcategory=sub.id;limit=9;render();closeMenus();button.focus();showResults();});menu.append(choice);
      });
      wrapper.append(menu);
      wrapper.addEventListener('pointerenter',()=>{if(window.matchMedia('(hover: hover)').matches&&(!document.activeElement?.matches('.product-subcategory')||wrapper.contains(document.activeElement)))openMenu(entry);});
      wrapper.addEventListener('pointerleave',()=>{if(!menu.hidden&&window.matchMedia('(hover: hover)').matches&&!wrapper.contains(document.activeElement))closeMenus();});
      wrapper.addEventListener('focusout',event=>{if(!wrapper.contains(event.relatedTarget))closeMenus();});
      button.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();openMenu(entry);menu.querySelector('button').focus();}});
    }
    button.addEventListener('click',()=>{
      const wasOpen=entry&&!entry.menu.hidden;category=item.id;subcategory=null;limit=9;render();
      closeMenus();if(entry&&!wasOpen)openMenu(entry);if(!entry)showResults();
    });buttons.push(button);nav.append(wrapper);
  });
  document.addEventListener('click',event=>{if(!nav.contains(event.target))closeMenus();});
  window.addEventListener('resize',closeMenus);
  nav.addEventListener('keydown',event=>{if(event.key==='Escape'){const active=menus.find(entry=>!entry.menu.hidden);closeMenus();active?.button.focus();}});
  function render() {
    const selected=categories.find(item=>item.id===category);
    const selectedSub=(subcategories[category] || []).find(item=>item.id===subcategory);
    document.querySelector('#fullCatalogTitle').textContent=selectedSub?.title || selected?.title || 'Вся продукция';
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
    menus.forEach(entry=>entry.menu.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(entry.button.dataset.category===category&&button.dataset.subcategory===(subcategory || 'all')))));
    const matches=selectSpektrProducts(products,{category,productIds:selectedSub?.products,query:search.value,sort:sort.value});
    const shown=matches.slice(0,limit);
    grid.replaceChildren(...shown.map(product=>renderSpektrProductCard(product,{dialog:true})));
    if(!matches.length){const empty=el('div','product-empty');const clear=el('button','','Сбросить выбор');clear.type='button';clear.addEventListener('click',resetAll);empty.append(el('h3','','Ничего не найдено'),el('p','','Попробуйте другое название или выберите другую категорию.'),clear);grid.append(empty);}
    document.querySelector('#catalogCount').textContent=`Показано ${shown.length} из ${matches.length}${search.value.trim()?' по вашему запросу':''}`;
    more.hidden=limit>=matches.length;more.textContent=`Показать ещё (${Math.min(9,Math.max(0,matches.length-limit))})`;
    reset.hidden=category==='all'&&!search.value&&sort.value==='default';
  }
  function resetAll(){category='all';subcategory=null;closeMenus();search.value='';sort.value='default';limit=9;render();}
  search.addEventListener('input',()=>{limit=9;render();});sort.addEventListener('change',()=>{limit=9;render();});
  reset.addEventListener('click',resetAll);
  more.addEventListener('click',()=>{limit+=9;render();});
  grid.addEventListener('click',event=>{
    const button=event.target.closest('[data-product]');if(!button)return;
    const product=products.find(item=>item.id===button.dataset.product);if(!product)return;
    openProduct(product,button);
  });
  function openProduct(product,button) {
    opener=button;
    const photo=document.querySelector('#productDialogPhoto');photo.src='../'+product.catalogImage;photo.alt=product.title+' — визуализация в обстановке';
    document.querySelector('#productDialogCategory').textContent=categoryFor(product).title+' / '+product.subtitle;
    document.querySelector('#productDialogTitle').textContent=product.title;
    document.querySelector('#productDialogDescription').textContent=product.description;
    document.querySelector('#productDialogFeatures').replaceChildren(...product.features.map(text=>el('li','',text)));
    document.querySelector('#productDialogPrice').textContent=product.priceLabel;
    document.querySelector('#productDialogPriceNote').textContent=product.priceNote;
    document.querySelector('#productDialogCall').setAttribute('aria-label',`Обсудить заказ: ${product.title}`);
    dialog.showModal();
  }
  dialog.addEventListener('close',()=>{opener?.focus();});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
  render();
  const linkedProduct=products.find(item=>item.id===params.get('product'));
  if(linkedProduct) openProduct(linkedProduct,document.querySelector('#catalogSearch'));
})();
