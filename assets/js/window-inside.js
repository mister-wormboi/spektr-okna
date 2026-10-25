/* Lightweight vector exhibit: no continuous rendering or scroll interception. */
(() => {
  const host = document.querySelector('#inside-panels');
  if (!host) return;
  const parts = [
    ['frame','Рама','Основа вашего окна.','Рама закрепляется в проёме и держит конструкцию. Рассмотрите соединение в углу.'],
    ['profile','Профиль','Главное — внутри.','Внутренние камеры и усиление помогают сохранять тепло и жёсткость конструкции.'],
    ['glass','Стеклопакет','Больше, чем стекло.','Стёкла и камеры между ними работают вместе. Посмотрите, как собран двухкамерный стеклопакет.'],
    ['hardware','Фурнитура','Удобство в движении.','Одна ручка управляет створкой. Выберите режим и посмотрите, как меняется её положение.']
  ];
  function ring(x,y,w,h,b) {
    return `<path d="M${x} ${y}h${w}v${h}h-${w}Z M${x+b} ${y+b}v${h-2*b}h${w-2*b}v-${h-2*b}Z" fill="url(#pvc)" fill-rule="evenodd" stroke="#9ba89f"/><path d="M${x+w} ${y}l14 -10v${h}l-14 10" fill="#aebbb0" stroke="#8f9e94"/><path d="M${x} ${y}l14 -10h${w}l-14 10" fill="#fafbf7"/>`;
  }
  const defs = `<defs><linearGradient id="pvc" x2=".8" y2="1"><stop stop-color="#fff"/><stop offset=".5" stop-color="#e4e9e0"/><stop offset="1" stop-color="#bac7bd"/></linearGradient><linearGradient id="glass" x2="1" y2="1"><stop stop-color="#d7f0e9" stop-opacity=".5"/><stop offset=".5" stop-color="#8dbaae" stop-opacity=".1"/><stop offset="1" stop-color="#8eb4ae" stop-opacity=".5"/></linearGradient><linearGradient id="metal"><stop stop-color="#687b72"/><stop offset=".4" stop-color="#edf3ef"/><stop offset="1" stop-color="#798d82"/></linearGradient><radialGradient id="shadow"><stop stop-color="#071a10" stop-opacity=".3"/><stop offset="1" stop-color="#071a10" stop-opacity="0"/></radialGradient></defs>`;
  const pane = `<rect x="310" y="105" width="235" height="320" fill="url(#glass)" stroke="#9bb7ac"/><path d="M315 290L540 140v25L315 315Z" fill="#fff" opacity=".14"/>`;
  const frame = `<g class="object frame-object">${ring(260,55,320,415,28)}<path d="M290 85H550V440H290Z" fill="none" stroke="#536d60" stroke-width="5"/>${pane}<path d="M260 55l28 28m292-28l-28 28M260 470l28-28m292 28l-28-28" stroke="#9ba89f"/><path class="guide" d="M280 452H180v-40"/><text class="label" x="130" y="395">Соединение рамы</text></g>`;
  const chambers = Array.from({length:5},(_,i)=>`<rect x="${272+i*43}" y="280" width="34" height="69" fill="#3c5548" stroke="#d9e3d9" stroke-width="5"/>`).join('');
  const profile = `<g class="object profile-object"><path d="M260 260l110-120h250l-110 120Z" fill="#f5f7ef" stroke="#adb9ad"/><path d="M510 260l110-120v120L510 380Z" fill="#99aa9e" stroke="#788e80"/><path d="M260 260h250v120H260Z" fill="url(#pvc)" stroke="#8f9f93"/>${chambers}<path d="M365 286v56h29v-56" fill="none" stroke="url(#metal)" stroke-width="9"/><path class="profile-shell" d="M260 260l110-120h250l-110 120Z" fill="url(#pvc)" stroke="#abb9ad"/><path class="guide" d="M290 352v65h-90M382 310h175v95"/><text class="label" x="150" y="442">Внутренние камеры</text><text class="label" x="515" y="430">Усиление</text></g>`;
  const glass = `<g class="object">${[0,1,2].map(i=>`<g class="glass-layer"><g transform="translate(${i*22} ${-i*8})"><path d="M290 125L475 80v310L290 435Z" fill="url(#glass)" stroke="#a4c6bc" stroke-width="3"/><path d="M294 128L470 85M294 128v300" fill="none" stroke="#eefcf6" stroke-width="2"/><path d="M310 200l140-35v25l-140 35Z" fill="#fff" opacity=".25"/></g></g>`).join('')}<path class="guide" d="M320 450v25h175"/><text class="label" x="330" y="505">Три стекла · две камеры</text></g>`;
  const hardware = `${ring(270,55,310,415,24)}<g class="sash">${ring(295,80,260,365,20)}${pane}<path class="mechanism" d="M304 95H545V432H304Z" fill="none" stroke="url(#metal)" stroke-width="7"/><g class="mechanism" fill="var(--green)">${[150,350].map(y=>`<circle cx="304" cy="${y}" r="7"/>`).join('')}</g><rect x="318" y="246" width="16" height="45" rx="7" fill="url(#pvc)" stroke="#97a99c"/><g class="handle"><path d="M326 268v49" stroke="#71877b" stroke-width="13" stroke-linecap="round"/><path d="M326 268v47" stroke="#f6f8f0" stroke-width="9" stroke-linecap="round"/></g></g><path class="guide" d="M570 195h55"/><text class="label" x="600" y="180">Петли</text>`;
  const art = {frame,profile,glass,hardware};
  const controls = {
    frame:'<button type="button" data-detail aria-pressed="false" data-on="Общий вид" data-off="Показать угол">Показать угол</button><span class="hint">Рассмотрите деталь ближе</span>',
    profile:'<button type="button" data-detail aria-pressed="false" data-on="Собрать профиль" data-off="Открыть срез">Открыть срез</button><label>Ракурс <input type="range" min="-25" max="25" value="0" aria-label="Ракурс профиля"></label>',
    glass:'<button type="button" data-detail aria-pressed="false" data-on="Собрать стеклопакет" data-off="Разделить слои">Разделить слои</button><span class="hint">Двухкамерная конструкция</span>',
    hardware:'<button type="button" data-mode="closed" aria-pressed="true">Закрыто</button><button type="button" data-mode="open" aria-pressed="false">Открыто</button><button type="button" data-mode="tilt" aria-pressed="false">Проветривание</button><button type="button" data-detail aria-pressed="false" data-on="Скрыть механизм" data-off="Показать механизм">Показать механизм</button>'
  };
  // IDs are scoped per illustration to avoid duplicate gradient IDs in hidden panels.
  host.innerHTML = parts.map(([key,name,title,copy],i)=>`<section class="inside-panel" id="panel-${key}" role="tabpanel" aria-labelledby="tab-${key}" ${i?'hidden':''} tabindex="0" data-mode="closed"><div class="inside-copy"><small>0${i+1} / ${name}</small><h3>${title}</h3><p>${copy}</p></div><div class="inside-scene"><svg viewBox="0 0 800 550" role="img" aria-label="${name}: схематичный вид конструкции">${(defs+`<ellipse cx="440" cy="490" rx="235" ry="28" fill="url(#shadow)"/>`+art[key]).replace(/id="(pvc|glass|metal|shadow)"/g,`id="$1-${key}"`).replace(/url\(#(pvc|glass|metal|shadow)\)/g,`url(#$1-${key})`)}</svg></div><div class="inside-controls">${controls[key]}</div></section>`).join('');
  const tabs = [...document.querySelectorAll('[data-part]')];
  const select = tab => {
    tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',active);t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;});
    const panel=document.getElementById(tab.getAttribute('aria-controls'));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && panel.animate) panel.animate([{opacity:.3},{opacity:1}],{duration:350});
  };
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>select(tab));
    tab.addEventListener('keydown',event=>{
      const next={ArrowRight:(i+1)%4,ArrowLeft:(i+3)%4,Home:0,End:3}[event.key];
      if(next===undefined)return;event.preventDefault();tabs[next].focus();select(tabs[next]);
    });
  });
  host.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    const panel=button.closest('.inside-panel');
    if(button.hasAttribute('data-detail')){
      const active=panel.classList.toggle('is-detail');button.setAttribute('aria-pressed',active);button.textContent=active?button.dataset.on:button.dataset.off;
    } else if(button.dataset.mode){
      panel.dataset.mode=button.dataset.mode;panel.querySelectorAll('button[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b===button));
    }
  });
  host.addEventListener('input',event=>{if(event.target.type==='range')host.querySelector('.profile-object').style.transform=`translateX(${Number(event.target.value)*.5}px) skewY(${Number(event.target.value)*.2}deg)`;});
})();
