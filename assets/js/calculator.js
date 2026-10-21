/* Prices apply to the whole window; dimensions are millimetres. */
function calculateWindow({ width, height, sashes, opening, chambers, profile, profileWidth }) {
  if (![width, height, sashes, chambers].every(n => Number.isSafeInteger(n) && n > 0)
      || !Number.isSafeInteger(opening) || opening < 0 || opening > sashes
      || chambers > 4 || !['Elex', 'Prowins'].includes(profile) || ![58, 70].includes(profileWidth)) return null;
  const area = width * height / 1000000;
  const standard = ((sashes === 2 && width >= 1200 && width <= 1500)
    || (sashes === 3 && width >= 1800 && width <= 2200))
    && height >= 1200 && height <= 1400 && opening >= 1 && chambers <= 2;
  const rate = standard ? (sashes === 2 ? 10000 : 8000)
    + (profile === 'Elex' ? 1000 : 0) + (profileWidth === 70 ? 500 : 0) : 14000;
  const surcharge = standard ? (opening - 1) * 2700 : 0;
  const multiplier = standard && chambers === 2 ? 1.15 : 1;
  const price = Math.round((area * rate + surcharge) * multiplier * 100) / 100;
  if (!Number.isSafeInteger(Math.round(price * 100))) return null;
  return { area, standard, rate, surcharge, multiplier, price };
}

function getWindowPreviewLayout({ width, height, sashes, opening }) {
  if (![width,height,sashes].every(value=>Number.isSafeInteger(value)&&value>0)
    || !Number.isSafeInteger(opening)||opening<0||opening>sashes) return null;
  const columns=Math.min(sashes,10);
  const scale=Math.min(320/width,210/height);
  const frameWidth=Math.max(columns*22+12,80,width*scale);
  const frameHeight=Math.max(80,height*scale);
  const x=(400-frameWidth)/2,y=(280-frameHeight)/2;
  const paneWidth=(frameWidth-12)/columns;
  return {x,y,width:frameWidth,height:frameHeight,shown:columns,
    panes:Array.from({length:columns},(_,index)=>({x:x+6+index*paneWidth,y:y+6,width:paneWidth,height:frameHeight-12,opens:index<opening}))};
}

if (typeof module !== 'undefined') module.exports = { calculateWindow, getWindowPreviewLayout };

if (typeof document !== 'undefined') (() => {
  const root = document.querySelector('.calculator');
  if (!root) return;
  const byId = id => root.querySelector('#' + id);
  const count = byId('sashesInput');
  const openingSelect = byId('openingInput');
  const openingCustom = byId('customOpeningInput');
  const manualOpening = openingSelect.tagName === 'INPUT';
  const money = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
  const areaFormat = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 6 }).format(value);
  let lastCount = 2;
  let opening = 1;
  let lastPreviewKey = '';
  const transferFields = ['widthInput', 'heightInput', 'sashesInput', 'chambersInput', 'profileInput', 'profileWidthInput'];
  const params = new URLSearchParams(window.location.search);
  transferFields.forEach(id => {
    const field = byId(id);
    const value = params.get(id);
    if (value !== null && (field.tagName !== 'SELECT' || [...field.options].some(option => option.value === value))) field.value = value;
  });

  function update() {
    const sashes = Number(count.value);
    const validCount = Number.isSafeInteger(sashes) && sashes > 0;
    if (manualOpening && validCount) openingSelect.max = String(sashes);
    if (!manualOpening && validCount && sashes !== lastCount) {
      opening = Math.min(sashes, Number.isSafeInteger(opening) && opening >= 0 ? opening : 1);
      // Large custom counts use a numeric control instead of creating thousands of options.
      const custom = sashes > 10;
      openingSelect.hidden = custom;
      openingSelect.disabled = custom;
      openingCustom.hidden = !custom;
      openingCustom.disabled = !custom;
      root.querySelector('label[for="openingInput"], label[for="customOpeningInput"]').htmlFor = custom ? 'customOpeningInput' : 'openingInput';
      if (!custom) {
        openingSelect.replaceChildren(...Array.from({ length: sashes + 1 }, (_, i) => {
          const option = document.createElement('option');
          option.value = i;
          option.textContent = root.classList.contains('calculator-compact') ? String(i)
            : i === 0 ? '0 — все глухие' : i === sashes ? `${i} — все поворотно-откидные` : String(i);
          return option;
        }));
        openingSelect.value = String(opening);
      }
      openingCustom.max = String(sashes);
      openingCustom.value = String(opening);
      lastCount = sashes;
    }
    const openingControl = openingSelect.hidden ? openingCustom : openingSelect;
    opening = openingControl.value === '' ? NaN : Number(openingControl.value);
    const validOpening = validCount && Number.isSafeInteger(opening) && opening >= 0 && opening <= sashes;
    if (byId('sashSummary')) byId('sashSummary').textContent = validOpening ? `Поворотно-откидных: ${opening}. Глухих: ${sashes - opening}.` : 'Укажите, сколько створок должно открываться.';
    root.querySelectorAll('[data-sashes]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.sashes) === sashes)));
    const fields = ['widthInput', 'heightInput', 'sashesInput'];
    let validFields = true;
    fields.forEach(id => {
      const field = byId(id);
      const invalid = !Number.isSafeInteger(Number(field.value)) || Number(field.value) < Number(field.min)
        || (field.max !== '' && Number(field.value) > Number(field.max));
      field.setAttribute('aria-invalid', String(invalid));
      if (invalid) validFields = false;
    });
    openingControl.setAttribute('aria-invalid', String(!validOpening));
    const result = validFields && validOpening ? calculateWindow({ width: Number(byId('widthInput').value), height: Number(byId('heightInput').value),
      sashes, opening, chambers: Number(byId('chambersInput').value), profile: byId('profileInput').value,
      profileWidth: Number(byId('profileWidthInput').value) }) : null;
    byId('calcError').hidden = Boolean(result);
    byId('calcError').textContent = result ? '' : manualOpening
      ? 'Введите целые числа: высота и ширина — от 140 до 9 999 999 мм, количество створок — от 1, поворотно-откидных — от 0 до общего количества створок.'
      : 'Введите размеры и количество створок целыми положительными числами. Количество открывающихся створок — от 0 до общего количества. Слишком большие значения не поддерживаются.';
    byId('calcPrice').textContent = result ? money(result.price) + ' ₽' : '—';
    const preview=byId('calcWindowPreview');
    if(preview){
      const width=Number(byId('widthInput').value),height=Number(byId('heightInput').value);
      const layout=getWindowPreviewLayout({width,height,sashes,opening});
      const previewKey=layout?`${width}/${height}/${sashes}/${opening}`:'invalid';
      preview.toggleAttribute('hidden',!layout);
      byId('calcPreviewSize').textContent=layout?`${width} × ${height} мм`:'Укажите размеры';
      if(layout && previewKey!==lastPreviewKey){
        const shape=(tag,attributes)=>{const node=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attributes).forEach(([name,value])=>node.setAttribute(name,String(value)));return node;};
        const pieces=[shape('rect',{x:layout.x,y:layout.y,width:layout.width,height:layout.height,fill:'none',stroke:'currentColor','stroke-width':5})];
        layout.panes.forEach(pane=>{
          const x=pane.x+3,y=pane.y+3,w=pane.width-6,h=pane.height-6;
          pieces.push(shape('rect',{x,y,width:w,height:h,fill:'currentColor','fill-opacity':'.035',stroke:'currentColor','stroke-width':1.5}));
          if(pane.opens){
            pieces.push(shape('path',{d:`M${x+w} ${y} L${x} ${y+h/2} L${x+w} ${y+h} M${x} ${y+h} L${x+w/2} ${y} L${x+w} ${y+h}`,fill:'none',stroke:'currentColor','stroke-width':1,'stroke-opacity':'.65'}));
            pieces.push(shape('path',{d:`M${x+4} ${y+h/2-6}v12`,fill:'none',stroke:'currentColor','stroke-width':3}));
          }
        });
        preview.replaceChildren(...pieces);
        preview.setAttribute('aria-label',`Условная схема окна ${width} на ${height} мм. Створок: ${sashes}, открывающихся: ${opening}.`);
        byId('calcPreviewNote').textContent=layout.shown<sashes?`Условная схема: показаны первые ${layout.shown} из ${sashes} створок.`:'Условная схема. Расположение створок уточним при заказе.';
      }
      lastPreviewKey=previewKey;
    }
    if (byId('calcTariff')) byId('calcTariff').textContent = result ? `${result.standard ? 'Стандарт' : 'Нестандарт'} · ${money(result.rate)} ₽/м²` : '';
    if (byId('calcBreakdown')) byId('calcBreakdown').textContent = result ? `${areaFormat(result.area)} м² × ${money(result.rate)} ₽/м²`
      + (result.surcharge ? ` + ${money(result.surcharge)} ₽ за дополнительные открывающиеся створки` : '')
      + (result.multiplier > 1 ? '. Затем +15% за двухкамерный стеклопакет.' : '.')
      + (!result.standard ? ' Единый тариф без надбавок за профиль, створки и камеры.' : '') : '';
    document.querySelectorAll('[data-calculator-link]').forEach(link => {
      const url = new URL(link.href);
      transferFields.forEach(id => url.searchParams.set(id, byId(id).value));
      url.searchParams.set('opening', openingControl.value);
      link.href = url.href;
    });
  }
  root.addEventListener('input', update);
  root.querySelectorAll('[data-sashes]').forEach(button => button.addEventListener('click', () => {
    count.value = button.dataset.sashes;
    update();
  }));
  update();
  if (params.has('opening')) {
    const control = openingSelect.hidden ? openingCustom : openingSelect;
    control.value = params.get('opening');
    update();
  }
})();
