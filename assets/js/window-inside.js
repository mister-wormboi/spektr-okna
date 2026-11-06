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
  const hardwareIcons = [
    '<path d="M4 3h16v18H4zM7 6h10v12H7zM14 11v3"/>',
    '<path d="M4 3h16v18H4zM7 6l10-3v18L7 18zM9 11v3"/>',
    '<path d="M4 3h16v18H4zM7 8h10l2 10H5zM10 15h4"/>',
    '<path d="M5 3h14v18H5zM8 6h8v12H8zM3 7h4M17 7h4M3 17h4M17 17h4M11 10h3v4h-3z"/>'
  ];
  host.querySelectorAll('#panel-hardware .inside-controls button').forEach((button, i) => {
    const label = button.textContent;
    button.innerHTML = `<svg class="inside-part-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${hardwareIcons[i]}</svg><span class="inside-part-name">${label}</span>`;
  });
  const notes = {
    frame: ['ПВХ-оболочка', 'Воздушные камеры', 'Стальное усиление', 'Уплотнитель'],
    profile: ['Стена и проём', 'Рама и створка', 'Монтажный шов', 'Подоконник'],
    glass: ['Наружное стекло', 'Первая камера и рамка', 'Среднее стекло', 'Вторая камера и рамка', 'Внутреннее стекло'],
    hardware: []
  };
  const partIcons = {
    frame: [
      '<path d="M4 4h16v16H4zM8 8h8v8H8z"/>',
      '<path d="M3 5h18v14H3zM9 5v14M15 5v14M3 12h18"/>',
      '<path d="M5 4h14v4h-4v8h4v4H5v-4h4V8H5z"/>',
      '<path d="M5 20V8a4 4 0 0 1 4-4h10v4H9v12M13 12h6v8h-6z"/>'
    ],
    profile: [
      '<path d="M3 21V3h18v18M8 21V8h8v13M3 8h5M16 8h5M3 14h5M16 14h5"/>',
      '<path d="M4 3h16v18H4zM7 6h10v12H7zM14 11v3"/>',
      '<path d="M4 3v18M20 3v18M9 3l6 3-6 3 6 3-6 3 6 3-6 3"/>',
      '<path d="M6 3h12v13H6zM3 16h18v4H3zM12 3v13"/>'
    ],
    glass: Array.from({length:5}, (_,i) => `<path d="m5 7 8-4 6 3v12l-8 4-6-3zM5 7l6 3 8-4M11 10v12"/><path d="M${7+i} 9v8"/>`)
  };
  Object.entries(notes).forEach(([key, items]) => {
    const panel = document.getElementById(`panel-${key}`);
    panel.dataset.part = key;
    panel.querySelector('.inside-scene').insertAdjacentHTML('beforeend', `<div class="inside-scene-caption" aria-hidden="true"><span>${key==='profile'?'Вид со стороны комнаты':'Рассмотрите ближе'}</span></div>`);
    panel.querySelector('.inside-controls').insertAdjacentHTML('beforebegin', `<div class="inside-legend" aria-label="Элементы конструкции">${items.map((item,i)=>`<button type="button" data-inspect="${i}" aria-pressed="false">${`<svg class="inside-part-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${partIcons[key][i]}</svg><span class="inside-part-name">${item}</span>`}</button>`).join('')}</div><p class="inside-status" role="status" aria-live="polite"></p>`);
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
      const active=panel.classList.toggle('is-detail');button.setAttribute('aria-pressed',active);(button.querySelector('.inside-part-name') || button).textContent=active?button.dataset.on:button.dataset.off;
    } else if(button.dataset.mode){
      panel.dataset.mode=button.dataset.mode;panel.querySelectorAll('button[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b===button));
    }
    exhibit?.update(panel);
  });
})();
