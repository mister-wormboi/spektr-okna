/* Lazy 3D exhibit; no intermediate illustration. */
(() => {
  const host = document.querySelector('#inside-panels');
  if (!host) return;
  const parts = [
    ['frame','Рама','Прочность в разрезе.','Снаружи — гладкий профиль. Внутри — камеры, сталь и уплотнение. Разберите конструкцию и рассмотрите каждую деталь.'],
    ['profile','Профиль','На своём месте.','Окно становится частью дома. Посмотрите, как рама соединяется со стеной, подоконником и отливом.'],
    ['glass','Стеклопакет','Три стекла. Две камеры.','Тепло и тишина складываются из слоёв. Раздвиньте их, чтобы увидеть, что находится между стёклами.'],
    ['hardware','Фурнитура','Одно движение. Три режима.','Поверните ручку прямо на модели — или выберите режим внизу. Рассмотрите движение створки с любого ракурса.']
  ];
  const controls = {
    frame:'<button type="button" data-detail aria-pressed="false" data-on="Собрать раму" data-off="Разобрать конструкцию">Разобрать конструкцию</button><span class="hint">Камеры · усиление · уплотнение</span>',
    profile:'<button type="button" data-detail aria-pressed="false" data-on="Вернуть окно" data-off="Показать в проёме">Показать в проёме</button><span class="hint">Рама · створка · монтажный шов</span>',
    glass:'<button type="button" data-detail aria-pressed="false" data-on="Собрать стеклопакет" data-off="Разделить слои">Разделить слои</button><span class="hint">Двухкамерная конструкция</span>',
    hardware:'<button type="button" data-mode="closed" aria-pressed="true">Закрыто</button><button type="button" data-mode="open" aria-pressed="false">Открыто</button><button type="button" data-mode="tilt" aria-pressed="false">Проветривание</button><button type="button" data-detail aria-pressed="false" data-on="Скрыть механизм" data-off="Показать механизм">Показать механизм</button>'
  };
  host.innerHTML = parts.map(([key,name,title,copy],i)=>`<section class="inside-panel" id="panel-${key}" role="tabpanel" aria-labelledby="tab-${key}" ${i?'hidden':''} tabindex="0" data-mode="closed"><div class="inside-copy"><small>${name}</small><h3>${title}</h3><p>${copy}</p></div><div class="inside-scene"></div><div class="inside-controls">${controls[key]}</div></section>`).join('');
  const notes = {
    frame: ['ПВХ-оболочка', 'Воздушные камеры', 'Стальное усиление', 'Уплотнитель'],
    profile: ['Стена и проём', 'Рама и створка', 'Монтажный шов', 'Подоконник'],
    glass: ['Наружное стекло', 'Первая камера и рамка', 'Среднее стекло', 'Вторая камера и рамка', 'Внутреннее стекло'],
    hardware: []
  };
  Object.entries(notes).forEach(([key, items]) => {
    const panel = document.getElementById(`panel-${key}`);
    panel.dataset.part = key;
    panel.querySelector('.inside-scene').insertAdjacentHTML('beforeend', `<div class="inside-scene-caption" aria-hidden="true"><span>${key==='profile'?'Вид со стороны комнаты':'Рассмотрите ближе'}</span><span>${Object.keys(notes).indexOf(key)+1} / ${Object.keys(notes).length}</span></div>`);
    panel.querySelector('.inside-controls').insertAdjacentHTML('beforebegin', `<div class="inside-legend" aria-label="Элементы конструкции">${items.map((item,i)=>`<button type="button" data-inspect="${i}" aria-pressed="false">${item}</button>`).join('')}</div><p class="inside-status" role="status" aria-live="polite"></p>`);
  });
  // Reveal each scene only once it reaches the viewport, not during lazy preload.
  if ('IntersectionObserver' in window) {
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    },{threshold:.15});
    host.querySelectorAll('.inside-scene').forEach(scene=>revealObserver.observe(scene));
  } else host.querySelectorAll('.inside-scene').forEach(scene=>scene.classList.add('is-revealed'));
  let exhibit;
  let loading;
  async function enhance() {
    if (loading) return loading;
    loading = import('./window-inside-3d.js?v=20261103-only-3d-v6').then(module => {
      exhibit = module.createInsideExhibit(host);
      exhibit.update();
    }).catch(error => { host.querySelectorAll('.inside-scene').forEach(scene=>scene.classList.add('is-unavailable')); console.warn('Inside exhibit:', error.message); });
    return loading;
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); enhance(); }
    }, {rootMargin:'200px'});
    observer.observe(host);
  } else enhance();
  const tabs = [...document.querySelectorAll('.inside-tabs [data-part]')];
  const select = tab => {
    tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',active);t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;});
    const panel=document.getElementById(tab.getAttribute('aria-controls'));
    exhibit?.update();
    if (!matchMedia('(max-width: 700px), (prefers-reduced-motion: reduce)').matches && panel.animate) panel.animate([{opacity:.3},{opacity:1}],{duration:350});
  };
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>select(tab));
    tab.addEventListener('keydown',event=>{
      const next={ArrowRight:(i+1)%4,ArrowLeft:(i+3)%4,Home:0,End:3}[event.key];
      if(next===undefined)return;event.preventDefault();tabs[next].focus();select(tabs[next]);
    });
  });
  host.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button || (!button.hasAttribute('data-detail') && !button.dataset.mode))return;
    const panel=button.closest('.inside-panel');
    if(button.hasAttribute('data-detail')){
      const active=panel.classList.toggle('is-detail');button.setAttribute('aria-pressed',active);button.textContent=active?button.dataset.on:button.dataset.off;
    } else if(button.dataset.mode){
      panel.dataset.mode=button.dataset.mode;panel.querySelectorAll('button[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b===button));
    }
    exhibit?.update();
  });
})();
