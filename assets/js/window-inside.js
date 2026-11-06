/* Lazy 3D exhibit; no intermediate illustration. */
(() => {
  const host = document.querySelector('#inside-panels');
  if (!host) return;
  const controls = {
    frame:'<button type="button" data-detail aria-pressed="false" data-on="Собрать раму" data-off="Разобрать конструкцию">Разобрать конструкцию</button><span class="hint">Камеры · усиление · уплотнение</span>',
    profile:'<button type="button" data-detail aria-pressed="false" data-on="Вернуть окно" data-off="Показать в проёме">Показать в проёме</button><span class="hint">Рама · створка · монтажный шов</span>',
    glass:'<button type="button" data-detail aria-pressed="false" data-on="Собрать стеклопакет" data-off="Разделить слои">Разделить слои</button><span class="hint">Двухкамерная конструкция</span>',
    hardware:'<button type="button" data-mode="closed" aria-pressed="true">Закрыто</button><button type="button" data-mode="open" aria-pressed="false">Открыто</button><button type="button" data-mode="tilt" aria-pressed="false">Проветривание</button><button type="button" data-detail aria-pressed="false" data-on="Скрыть механизм" data-off="Показать механизм">Показать механизм</button>'
  };
  Object.entries(controls).forEach(([key, html]) => {
    document.getElementById(`panel-${key}`).querySelector('.inside-controls').innerHTML = html;
  });
  const notes = {
    frame: ['ПВХ-оболочка', 'Воздушные камеры', 'Стальное усиление', 'Уплотнитель'],
    profile: ['Стена и проём', 'Рама и створка', 'Монтажный шов', 'Подоконник'],
    glass: ['Наружное стекло', 'Первая камера и рамка', 'Среднее стекло', 'Вторая камера и рамка', 'Внутреннее стекло'],
    hardware: []
  };
  Object.entries(notes).forEach(([key, items]) => {
    const panel = document.getElementById(`panel-${key}`);
    panel.dataset.part = key;
    panel.querySelector('.inside-scene').insertAdjacentHTML('beforeend', `<div class="inside-scene-caption" aria-hidden="true"><span>${key==='profile'?'Вид со стороны комнаты':'Рассмотрите ближе'}</span></div>`);
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
    loading = import('./window-inside-3d.js?v=20261105-realism').then(module => {
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
  // Select the study before its own controls handle a pointer or keyboard action.
  // All four blocks stay in the document; a single renderer follows the reader.
  const activate = event => {
    const panel = event.target.closest('.inside-panel');
    if (panel) exhibit?.update(panel);
  };
  host.addEventListener('pointerdown', activate, true);
  host.addEventListener('focusin', activate);
  host.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button || (!button.hasAttribute('data-detail') && !button.dataset.mode))return;
    const panel=button.closest('.inside-panel');
    if(button.hasAttribute('data-detail')){
      const active=panel.classList.toggle('is-detail');button.setAttribute('aria-pressed',active);button.textContent=active?button.dataset.on:button.dataset.off;
    } else if(button.dataset.mode){
      panel.dataset.mode=button.dataset.mode;panel.querySelectorAll('button[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b===button));
    }
    exhibit?.update(panel);
  });
})();
