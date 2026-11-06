/* Plain browser JavaScript: no build step, framework or external requests. */
(() => {
  'use strict';
  const labels = {
    id:'Идентификатор', title:'Название', subtitle:'Подзаголовок', description:'Описание', text:'Текст', category:'Категория',
    image:'Изображение', path:'Путь к файлу', catalogImage:'Фото для каталога', imageAlt:'Описание изображения', alt:'Описание изображения',
    features:'Характеристики', source:'Источник', price:'Цена', priceNote:'Примечание к цене', priceGuide:'Ориентир цены', label:'Подпись',
    author:'Автор', publicId:'Идентификатор отзыва', published:'Дата публикации', rating:'Оценка', topics:'Темы', date:'Дата для отображения',
    city:'Город', slug:'Адресное имя', region:'Регион', street:'Улица и дом', phones:'Телефоны', number:'Номер', display:'Отображение',
    hours:'Часы работы', mapImage:'Изображение карты', openingHoursSpecification:'Расписание', dayOfWeek:'Дни недели', opens:'Открытие', closes:'Закрытие',
    full:'Полное изображение', thumb:'Миниатюра', width:'Ширина', height:'Высота', heading:'Заголовок раздела', paragraphs:'Абзацы', items:'Пункты списка',
    sections:'Разделы статьи', intro:'Вступление', takeaway:'Главная мысль', consultation:'Призыв обратиться', related:'Связанные статьи',
    published_on:'Дата публикации', modified_on:'Дата обновления', content_kind:'Тип материала', legacy_slug:'Старый адрес', caption:'Подпись',
    full_width:'Ширина оригинала', full_height:'Высота оригинала', products:'Товары', product_categories:'Категории товаров',
    product_tasks:'Подборки по задаче', product_subcategories:'Подкатегории', price_guides:'Ориентиры цен', catalog_directions:'Направления каталога',
    window_collections:'Коллекции окон', icon:'Иконка', url:'Адрес сайта', name:'Название', telephone:'Телефон',
    redirect_to:'Переадресация', site:'Общие данные сайта', collections:'Связанные разделы', branch_ids:'Идентификаторы филиалов',
    article_slugs:'Адреса статей в списке', views:'Просмотры', article:'Статья', photos:'Фотографии', reviews:'Отзывы', branches:'Филиалы',
    checked_on:'Дата проверки', default_organization_id:'Основной филиал', tbmReference:'Справочная ссылка', featured:'На главной'
  };
  const templates = {
    products:{id:'',category:'windows',title:'Новый товар',subtitle:'',description:'',features:[],source:'',image:'',catalogImage:'',priceNote:''},
    reviews:{author:'',publicId:'',published:'',rating:5,topics:'',text:'',date:''},
    branches:{id:'',city:'',slug:'',region:'',street:'',phones:[{number:'',display:''}],hours:'',mapImage:'',openingHoursSpecification:[]},
    photos:{id:'',title:'Новое фото',category:'',alt:'',full:'',thumb:'',width:640,height:640},
    sections:{heading:'',paragraphs:[''],items:[]}, phones:{number:'',display:''},
    openingHoursSpecification:{'@type':'OpeningHoursSpecification',dayOfWeek:[],opens:'09:00',closes:'18:00'},
    product_categories:{id:'',title:'',icon:'',caption:''}, catalog_directions:{id:'',title:'',description:'',catalogImage:''},
    window_collections:{id:'',title:'',description:'',products:[]}, product_tasks:{id:'',title:'',category:'windows',description:'',products:[]}
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  function blankValue(value) {
    if (Array.isArray(value)) return [];
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === '@type' ? item : blankValue(item)]));
    return typeof value === 'number' ? 0 : typeof value === 'boolean' ? false : value === null ? null : '';
  }
  function newItem(key, sample) {
    if (sample !== undefined && (sample === null || typeof sample !== 'object')) return blankValue(sample);
    const value = clone(templates[key] ?? (sample === undefined ? '' : blankValue(sample)));
    if (value && typeof value === 'object' && !Array.isArray(value) && 'id' in value) value.id = 'new-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,6);
    return value;
  }
  function newPage(section, pages = []) {
    let route = section.route;
    if (pages.some(page => page.path === route)) {
      let number = 1;
      do { route = section.route + 'novaya-stranitsa' + (number > 1 ? '-' + number : '') + '/'; number++; }
      while (pages.some(page => page.path === route));
    }
    const content = {main_html:'<main><section><h1>Новая страница</h1><p>Добавьте текст страницы.</p></section></main>'};
    if (section.id === 'articles' && route !== section.route) content.article = {
      slug:route.split('/').filter(Boolean).at(-1),title:'Новая статья',category:'',description:'',intro:'',sections:[{heading:'',paragraphs:['']}],
      takeaway:'',consultation:'',related:[],author:'Редакция «Спектра»',published_on:new Date().toISOString().slice(0,10),modified_on:new Date().toISOString().slice(0,10),
      content_kind:'original',image:{path:'',alt:'',caption:'',width:640,height:640}
    };
    if (route === '/catalog/') content.catalog = {products:[],product_categories:[],catalog_directions:[],window_collections:[],product_tasks:[],product_subcategories:{},price_guides:{}};
    if (route === '/reviews/') content.reviews = {reviews:[],branches:{},default_organization_id:'',checked_on:''};
    if (route === '/contacts/') content.branches = [];
    if (route === '/solutions/') content.photos = [];
    if (route === '/articles/') content.article_slugs = [];
    if (route === '/') content.site = {name:'Спектр',url:'https://spektr-okna.ru/',telephone:''};
    return {id:0,path:route,title:content.article ? 'Новая статья' : 'Новая страница',content,seo_title:'',seo_description:'',canonical_url:'',is_published:false,version:null};
  }
  function collectionSpecs(content) {
    const result = [];
    const push = (name, value, key, owner) => { if (value !== undefined) result.push({name,value,key,owner}); };
    if (content.catalog) for (const key of ['products','product_categories','catalog_directions','window_collections','product_tasks','product_subcategories','price_guides']) push(labels[key],content.catalog[key],key,content.catalog);
    if (content.article) push('Содержимое статьи',content.article,'article',content);
    if (content.reviews) {
      push('Отзывы',content.reviews.reviews,'reviews',content.reviews);
      const metadata = Object.fromEntries(Object.entries(content.reviews).filter(([key]) => key !== 'reviews'));
      if (Object.keys(metadata).length) result.push({name:'Источники отзывов',value:metadata,key:'review_sources',owner:content.reviews,proxy:true});
    }
    for (const key of ['branches','photos','site','article_slugs','branch_ids','collections']) push(labels[key],content[key],key,content);
    return result;
  }
  if (typeof module !== 'undefined') module.exports = {blankValue,newItem,newPage,collectionSpecs};
  if (typeof document === 'undefined') return;

  const $ = id => document.getElementById(id);
  const state = {csrf:'',admin:null,sections:[],section:null,pages:[],page:null,dirty:false,view:'main',collection:0,busy:false,request:0};
  let noticeTimer;
  function node(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key,value] of Object.entries(attrs)) {
      if (key.startsWith('on')) element.addEventListener(key.slice(2),value);
      else if (key === 'class') element.className = value;
      else if (key === 'text') element.textContent = value;
      else if (value !== false && value !== null && value !== undefined) element.setAttribute(key,value === true ? '' : String(value));
    }
    for (const child of children) if (child !== null && child !== undefined) element.append(typeof child === 'string' ? document.createTextNode(child) : child);
    return element;
  }
  function notice(message, error = false) {
    clearTimeout(noticeTimer); $('notice').textContent = message; $('notice').className = 'notice' + (error ? ' error' : ''); $('notice').hidden = false;
    noticeTimer = setTimeout(() => {$('notice').hidden = true;},error ? 10000 : 4000);
  }
  async function request(action, data, params = {}) {
    const url = new URL('api.php', location.href);
    url.search = new URLSearchParams({action,...params});
    const response = await fetch(url,{method:data ? 'POST' : 'GET',credentials:'same-origin',headers:data ? {'Content-Type':'application/json','X-CSRF-Token':state.csrf} : {},...(data ? {body:JSON.stringify({action,...data})} : {})});
    let result;
    try {result = await response.json();} catch {throw new Error('PHP не вернул ответ. Убедитесь, что сайт запущен через PHP-сервер.');}
    if (!response.ok) {
      if (response.status === 401 && action !== 'login') {state.admin = null;showLogin();}
      if (response.status === 403) {
        const session = await request('session');state.csrf = session.csrf;
        if (!session.admin) {state.admin = null;showLogin();}
      }
      const error = new Error(result.error || 'Не удалось выполнить действие.'); error.status = response.status; throw error;
    }
    return result;
  }
  async function run(task) {try {return await task();} catch(error) {notice(error.message || 'Не удалось выполнить действие.',true);}}
  function changed() {
    state.dirty = true;
    const message = $('saveState');
    if (message) {message.textContent = 'Есть несохранённые изменения';message.classList.add('dirty');}
    if ($('saveButton')) $('saveButton').textContent = 'Сохранить изменения';
  }
  function confirmAction(title, text, accept = 'Удалить') {
    const dialog = $('confirmDialog');
    if (dialog.open) return Promise.resolve(false);
    $('confirmTitle').textContent = title; $('confirmText').textContent = text; $('confirmAccept').textContent = accept;
    return new Promise(resolve => {
      dialog.returnValue = '';
      dialog.addEventListener('close',() => resolve(dialog.returnValue === 'accept'),{once:true}); dialog.showModal();
    });
  }
  async function canLeave() {return !state.dirty || await confirmAction('Оставить правки?','На этой странице есть несохранённые изменения. При переходе они будут потеряны.','Перейти без сохранения');}
  function showLogin() {$('workspace').hidden = true;$('authScreen').hidden = false;}
  async function showWorkspace() {
    $('authScreen').hidden = true;$('workspace').hidden = false;$('userBadge').textContent = state.admin.login;
    const result = await request('sections');state.sections = result.sections;
    const current = state.sections.find(s => s.id === state.section?.id) || state.sections[0];
    if (state.page && state.dirty) {state.section = current;renderTabs();renderPages();renderEditor();return;}
    await loadSection(current);
  }
  function renderTabs() {
    $('sectionTabs').replaceChildren(...state.sections.map(section => node('button',{class:'section-tab','aria-current':String(state.section?.id === section.id),onclick:() => run(async () => {
      if (state.busy || state.section?.id === section.id || !await canLeave()) return;
      await loadSection(section);
    })},[section.title,node('span',{class:'tab-count',text:section.count})])));
  }
  async function loadSection(section) {
    const generation = ++state.request;
    state.section = section;state.page = null;state.pages = [];state.dirty = false;state.view = 'main';state.collection = 0;$('pageSearch').value = '';
    renderTabs();renderPages();empty('Загружаем страницы…','');
    const result = await request('pages',null,{section:section.id});
    if (generation !== state.request) return;
    state.pages = result.pages;renderPages();
    if (state.pages.length) await selectPage(state.pages[0].id,false);else empty('В этом разделе пока пусто','Нажмите «Добавить страницу», чтобы создать первую запись.');
  }
  function renderPages() {
    $('pageCount').textContent = state.pages.length;
    $('addPageButton').disabled = state.busy || (state.section?.id === 'home' && state.pages.length > 0);
    const query = $('pageSearch').value.toLocaleLowerCase('ru').trim();
    const pages = state.pages.filter(page => (page.title + ' ' + page.path).toLocaleLowerCase('ru').includes(query));
    $('pageList').replaceChildren(...pages.map(page => node('button',{class:'page-item','aria-current':String(state.page?.id === Number(page.id)),onclick:() => run(() => selectPage(Number(page.id)))},[
      node('span',{class:'page-item-title',text:page.title}),node('span',{class:'page-item-path',text:page.path}),node('span',{class:'page-dot' + (Number(page.is_published) ? '' : ' draft'),'aria-label':Number(page.is_published) ? 'Включена' : 'Черновик'})
    ])));
    if (!pages.length) $('pageList').append(node('p',{class:'sidebar-empty',text:query ? 'Ничего не найдено' : 'Нет страниц'}));
  }
  async function selectPage(id, guard = true) {
    if (state.busy || (guard && state.page?.id === id) || (guard && !await canLeave())) return;
    const generation = ++state.request;
    const result = await request('page',null,{section:state.section.id,id});
    if (generation !== state.request) return;
    state.page = result.page;state.dirty = false;state.view = 'main';state.collection = 0;
    renderPages();renderEditor();
  }
  function empty(title, text) {$('editorPanel').replaceChildren(node('div',{class:'empty-state'},[node('span',{class:'empty-mark',text:'↖'}),node('h2',{text:title}),node('p',{text})]));}
  function field(label, value, update, options = {}) {
    const wrapper = node('label',{class:options.full ? 'full' : ''},[node('span',{text:label})]);
    const input = node(options.multiline ? 'textarea' : 'input',{...(options.multiline ? {rows:options.rows || 4} : {type:options.type || 'text'}),...(options.code ? {class:'code-input',spellcheck:'false'} : {}),...(options.maxlength ? {maxlength:options.maxlength} : {}),oninput:event => {update(event.target.value);changed();}});
    input.value = value ?? '';wrapper.append(input);
    if (options.note) wrapper.append(node('span',{class:'field-note',text:options.note}));
    return wrapper;
  }
  function renderEditor() {
    const page = state.page;if (!page) return;
    const fragment = document.createDocumentFragment();
    const actions = node('div',{class:'editor-actions'},[
      ...(page.id ? [node('button',{class:'text-button delete-page',text:'Удалить страницу',onclick:() => run(deletePage)})] : []),
      node('button',{id:'saveButton',class:'button primary',text:state.dirty ? 'Сохранить изменения' : 'Сохранить',onclick:() => run(savePage)})
    ]);
    fragment.append(node('div',{class:'editor-top'},[
      node('div',{},[node('div',{class:'editor-kicker'},[node('span',{text:page.id ? 'СТРАНИЦА / ' + state.section.title.toLocaleUpperCase('ru') : 'НОВАЯ СТРАНИЦА'}),node('span',{class:'status-pill' + (page.is_published ? '' : ' draft'),text:page.is_published ? 'Включена' : 'Черновик'})]),node('h2',{text:page.title}),node('p',{class:'editor-path',text:page.path})]),actions
    ]));
    fragment.append(node('div',{class:'editor-tabs',role:'tablist','aria-label':'Настройки страницы'},[['main','Основное'],['records','Записи'],['seo','SEO']].map(([id,title]) => node('button',{class:'editor-tab',role:'tab','aria-selected':String(state.view === id),onclick:() => {state.view = id;renderEditor();}},[title]))));
    const body = node('div',{class:'editor-body'});fragment.append(body);
    fragment.append(node('p',{class:'save-state' + (state.dirty ? ' dirty' : ''),id:'saveState',text:state.dirty ? 'Есть несохранённые изменения' : page.updated_at ? 'Сохранено · ' + page.updated_at : 'Новая страница ещё не сохранена'}));
    $('editorPanel').replaceChildren(fragment);
    if (state.view === 'main') renderMain(body);
    else if (state.view === 'seo') renderSeo(body);
    else renderRecords(body);
  }
  function renderMain(body) {
    const page = state.page;
    const grid = node('div',{class:'field-grid'},[
      field('Название страницы',page.title,value => {page.title = value;},{full:true,maxlength:255}),
      field('Адрес страницы',page.path,value => {page.path = value;},{full:true,maxlength:255,note:'Например: ' + state.section.route + (state.section.id === 'home' ? '' : 'novaya-stranitsa/')}),
      node('label',{class:'check-label full'},[node('input',{type:'checkbox',...(page.is_published ? {checked:true} : {}),onchange:event => {page.is_published = event.target.checked;changed();}}),'Страница включена'])
    ]);
    if ('redirect_to' in page.content) grid.append(field('Перенаправить на',page.content.redirect_to,value => {page.content.redirect_to = value;},{full:true}));
    if ('main_html' in page.content) {
      let htmlEditor = htmlFields(page.content);
      grid.append(htmlEditor);
      const details = node('details',{class:'record-card full'},[node('summary',{text:'HTML-разметка страницы'})]);
      const source = field('HTML',page.content.main_html,value => {
        page.content.main_html = value;
        const updated = htmlFields(page.content);htmlEditor.replaceWith(updated);htmlEditor = updated;
      },{multiline:true,code:true,rows:12,note:'Расширенный режим редактирования разметки.'});
      source.querySelector('textarea').id = 'mainHtmlSource';
      details.append(node('div',{class:'record-content'},[source]));grid.append(details);
    }
    for (const key of ['header_html','footer_html']) if (key in page.content) {
      const details = node('details',{class:'record-card full'},[node('summary',{text:key === 'header_html' ? 'Общая шапка сайта' : 'Общий подвал сайта'})]);
      details.append(node('div',{class:'record-content'},[field('HTML-разметка',page.content[key],value => {page.content[key] = value;},{multiline:true,code:true,rows:8})]));grid.append(details);
    }
    body.append(grid);
  }
  function htmlFields(content) {
    const wrapper = node('div',{class:'full'});
    const doc = new DOMParser().parseFromString(content.main_html,'text/html');
    const main = doc.querySelector('main');
    if (!main) return node('p',{class:'field-note full',text:'Добавьте основной блок <main> через HTML-разметку или заполните записи страницы.'});
    wrapper.append(node('h3',{class:'nested-heading',text:'Текстовые блоки страницы'}));
    wrapper.append(node('p',{class:'field-note',text:'Откройте нужный блок и измените текст. Товары, статьи и другие списки редактируются во вкладке «Записи».'}));
    const elements = [...main.children].filter(item => !['SCRIPT','STYLE'].includes(item.tagName));
    const save = () => {content.main_html = main.outerHTML;if ($('mainHtmlSource')) $('mainHtmlSource').value = content.main_html;changed();};
    elements.forEach((block,index) => {
      const heading = block.querySelector('h1,h2,h3')?.textContent.trim() || block.getAttribute('aria-label') || 'Блок ' + (index + 1);
      const detail = node('details',{class:'record-card'},[node('summary',{text:heading.slice(0,130)})]);
      let rendered = false;
      detail.addEventListener('toggle',() => {
        if (!detail.open || rendered) return; rendered = true;
        const fields = node('div',{class:'object-fields record-content'});
        const walker = doc.createTreeWalker(block,NodeFilter.SHOW_TEXT,{acceptNode:text => {
          if (!text.textContent.trim() || text.parentElement?.closest('script,style,svg,noscript,[aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }});
        let text;
        while ((text = walker.nextNode())) {
          const target = text;
          const leading = target.textContent.match(/^\s*/)[0];
          const trailing = target.textContent.match(/\s*$/)[0];
          const tag = target.parentElement?.tagName || '';
          const label = /^H[1-6]$/.test(tag) ? 'Заголовок' : tag === 'A' ? 'Текст ссылки' : tag === 'BUTTON' ? 'Подпись кнопки' : 'Текст';
          fields.append(field(label,target.textContent.trim(),value => {target.textContent = leading + value + trailing;save();},{multiline:target.textContent.trim().length > 120,rows:3}));
        }
        for (const image of block.querySelectorAll('img')) fields.append(node('div',{},[
          field('Описание изображения',image.getAttribute('alt') || '',value => {image.setAttribute('alt',value);save();}),
          field('Путь к изображению',image.getAttribute('src') || '',value => {image.setAttribute('src',value);image.removeAttribute('srcset');save();})
        ]));
        if (!fields.children.length) fields.append(node('p',{class:'field-note',text:'В этом блоке нет текстовых полей.'}));
        detail.append(fields);
      });
      wrapper.append(detail);
    });
    return wrapper;
  }
  function renderSeo(body) {
    const page = state.page;
    body.append(node('div',{class:'field-grid'},[
      field('Заголовок для поиска',page.seo_title,value => {page.seo_title = value;},{full:true,maxlength:255,note:'Если оставить пустым, используем название страницы.'}),
      field('Описание для поиска',page.seo_description,value => {page.seo_description = value;},{full:true,multiline:true,maxlength:5000}),
      field('Основной адрес страницы (canonical)',page.canonical_url,value => {page.canonical_url = value;},{full:true,maxlength:512,note:'Можно оставить пустым — адрес сформируется автоматически.'})
    ]));
  }
  function primitive(key, value, update) {
    const label = labels[key] || key;
    if (typeof value === 'boolean') return node('label',{class:'check-label'},[node('input',{type:'checkbox',...(value ? {checked:true} : {}),onchange:event => {update(event.target.checked);changed();}}),label]);
    const numeric = typeof value === 'number';
    return field(label,value,newValue => update(numeric ? (newValue === '' ? 0 : Number(newValue)) : value === null && newValue === '' ? null : newValue),{
      type:numeric ? 'number' : 'text',multiline:!numeric && (/^(description|text|intro|takeaway|consultation|caption|hours|paragraphs|items)$/.test(key) || String(value ?? '').length > 150),rows:3
    });
  }
  function objectFields(value, onChange = () => {}) {
    const result = node('div',{class:'object-fields'});
    for (const [key,item] of Object.entries(value)) {
      const update = newValue => {value[key] = newValue;onChange(key,newValue);};
      if (Array.isArray(item)) result.append(arrayFields(key,item));
      else if (item && typeof item === 'object') result.append(node('div',{},[node('h3',{class:'nested-heading',text:labels[key] || key}),objectFields(item)]));
      else result.append(primitive(key,item,update));
    }
    if (!Object.keys(value).length) result.append(node('p',{class:'field-note',text:'В этом блоке пока нет дополнительных полей.'}));
    return result;
  }
  function arrayFields(key, array) {
    const wrapper = node('div');
    const paint = () => {
      wrapper.replaceChildren(node('h3',{class:'nested-heading',text:(labels[key] || key) + ' · ' + array.length}));
      array.forEach((item,index) => {
        const valueEditor = item && typeof item === 'object' && !Array.isArray(item) ? objectFields(item) : Array.isArray(item) ? arrayFields(key,item) : primitive(key,item,value => {array[index] = value;});
        wrapper.append(node('div',{class:'array-item'},[valueEditor,node('button',{class:'small-button array-remove',type:'button','aria-label':'Удалить пункт ' + (index + 1),text:'×',onclick:async () => {
          if (!await confirmAction('Удалить пункт?','Пункт будет удалён после сохранения страницы.')) return;
          array.splice(index,1);changed();paint();
        }})]));
      });
      // Nested `products` arrays contain product IDs; top-level product objects
      // are inserted by the collection editor, not this nested field editor.
      wrapper.append(node('button',{class:'small-button',type:'button',text:'＋ Добавить пункт',onclick:() => {array.push(key === 'products' ? '' : newItem(key,array[0]));changed();paint();}}));
    };
    paint();return wrapper;
  }
  function renderRecords(body) {
    const specs = collectionSpecs(state.page.content);
    if (!specs.length) {body.append(node('div',{class:'blank-collection'},['На этой странице нет отдельных записей. Текст страницы находится во вкладке «Основное».']));return;}
    state.collection = Math.min(state.collection,specs.length - 1);
    if (specs.length > 1) body.append(node('div',{class:'collection-nav'},specs.map((spec,index) => node('button',{class:'collection-choice','aria-pressed':String(index === state.collection),text:spec.name,onclick:() => {state.collection = index;renderEditor();}}))));
    const spec = specs[state.collection];
    if (!Array.isArray(spec.value)) {
      body.append(objectFields(spec.value,spec.proxy ? (key,value) => {spec.owner[key] = value;} : undefined));return;
    }
    const array = spec.value;
    const search = node('input',{type:'search',class:'record-search',placeholder:'Поиск записи…','aria-label':'Поиск записи'});
    const cards = node('div');
    body.append(node('div',{class:'record-toolbar'},[node('div',{},[node('h3',{text:spec.name}),node('p',{class:'record-counter',text:'Всего записей: ' + array.length})]),search]));
    const add = node('button',{class:'button collection-add',text:'＋ Добавить запись',onclick:() => {
      array.push(newItem(spec.key,array[0]));changed();renderEditor();
      const last = $('editorPanel').querySelector('.record-list>.record-card:last-child');
      if (last) {last.open = true;last.scrollIntoView({behavior:'smooth',block:'nearest'});}
    }});
    const paint = () => {
      cards.className = 'record-list';cards.replaceChildren();
      const query = search.value.trim().toLocaleLowerCase('ru');
      array.forEach((item,index) => {
        if (query && !JSON.stringify(item).toLocaleLowerCase('ru').includes(query)) return;
        const title = typeof item === 'object' && item ? item.title || item.author || item.city && (item.city + ', ' + item.street) || item.heading || item.id || 'Запись ' + (index + 1) : String(item);
        const summaryTitle = node('span',{class:'record-title',text:title});
        const detail = node('details',{class:'record-card'},[node('summary',{},[node('span',{class:'record-number',text:String(index+1).padStart(2,'0')}),summaryTitle,node('span',{class:'record-summary-meta',text:'Редактировать ↗'})])]);
        let rendered = false;
        detail.addEventListener('toggle',() => {
          if (!detail.open || rendered) return;rendered = true;
          const editor = item && typeof item === 'object' ? objectFields(item) : primitive(spec.key,item,value => {array[index] = value;summaryTitle.textContent = value;});
          detail.append(node('div',{class:'record-content'},[editor,node('div',{class:'record-delete'},[node('button',{class:'text-button',text:'Удалить запись',onclick:() => run(async () => {
            if (!await confirmAction('Удалить запись?',String(title) + '. Изменение вступит в силу после сохранения страницы.')) return;
            array.splice(index,1);changed();renderEditor();
          })})])]));
        });
        cards.append(detail);
      });
      if (!cards.children.length) cards.append(node('div',{class:'blank-collection',text:query ? 'По вашему запросу ничего не найдено.' : 'Здесь пока нет записей. Добавьте первую.'}));
    };
    search.addEventListener('input',paint);paint();body.append(cards,add);
  }
  async function savePage() {
    if (state.busy || !state.page) return;
    const page = state.page;
    if (!page.title.trim() || !page.path.trim()) {notice('Укажите название и адрес страницы.',true);return;}
    if (page.content.article) page.content.article.slug = page.path.split('/').filter(Boolean).at(-1);
    state.busy = true;$('saveButton').disabled = true;$('saveButton').textContent = 'Сохраняем…';$('workspace').classList.add('loading');
    try {
      const result = await request('save',{section:state.section.id,id:page.id,version:page.version,page});
      state.page = result.page;state.dirty = false;
      state.pages = (await request('pages',null,{section:state.section.id})).pages;
      state.section.count = state.pages.length;
      renderTabs();renderPages();renderEditor();notice('Изменения сохранены в базе данных.');
    } finally {state.busy = false;$('workspace').classList.remove('loading');if ($('saveButton')) {$('saveButton').disabled = false;$('saveButton').textContent = state.dirty ? 'Сохранить изменения' : 'Сохранить';}renderPages();}
  }
  async function deletePage() {
    if (state.busy || !state.page?.id) return;
    const page = state.page;
    if (!await confirmAction('Удалить страницу?',page.title + ' (' + page.path + '). Страница и все её записи будут удалены из базы. Это действие нельзя отменить.')) return;
    state.busy = true;$('workspace').classList.add('loading');
    try {
      await request('delete',{section:state.section.id,id:page.id,version:page.version});
      state.page = null;state.dirty = false;
    } finally {state.busy = false;$('workspace').classList.remove('loading');}
    state.section.count--;await loadSection(state.section);notice('Страница удалена из базы данных.');
  }
  $('pageSearch').addEventListener('input',renderPages);
  $('addPageButton').addEventListener('click',() => run(async () => {
    if (state.busy || !state.section || !await canLeave()) return;
    state.page = newPage(state.section,state.pages);state.dirty = true;state.view = 'main';state.collection = 0;renderPages();renderEditor();
    $('editorPanel').querySelector('input')?.focus();
  }));
  $('loginForm').addEventListener('submit',event => {
    event.preventDefault();run(async () => {
      $('loginButton').disabled = true;$('loginError').hidden = true;
      try {
        if (!state.csrf) state.csrf = (await request('session')).csrf;
        const values = new FormData(event.target);
        const result = await request('login',{login:values.get('login'),password:values.get('password')});
        state.admin = result.admin;state.csrf = result.csrf;event.target.elements.password.value = '';
        await showWorkspace();
      } catch(error) {$('loginError').textContent = error.message;$('loginError').hidden = false;}
      finally {$('loginButton').disabled = false;}
    });
  });
  $('logoutButton').addEventListener('click',() => run(async () => {
    if (state.busy || !await canLeave()) return;
    await request('logout',{});state.admin = null;state.page = null;state.pages = [];state.dirty = false;state.csrf = '';showLogin();
  }));
  window.addEventListener('beforeunload',event => {if (state.dirty) {event.preventDefault();event.returnValue = '';}});
  run(async () => {
    const session = await request('session');state.csrf = session.csrf;state.admin = session.admin;
    if (state.admin) await showWorkspace();else showLogin();
  });
})();
