const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const pages=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.name.startsWith('.')?[]:entry.isDirectory()?pages(path.join(dir,entry.name)):entry.name==='index.html'?[path.join(dir,entry.name)]:[]);

test('every internal page has exactly one static breadcrumb, while home has none',()=>{
  for(const file of pages(root)){
    const html=fs.readFileSync(file,'utf8');
    const trails=[...html.matchAll(/<nav[^>]+aria-label="Хлебные крошки"[^>]*>[\s\S]*?<\/nav>/g)];
    if(file===path.join(root,'index.html')){assert.equal(trails.length,0);continue;}
    assert.equal(trails.length,1,file);
    assert.match(trails[0][0],/>Главная<\/a>/);
    assert.match(trails[0][0],/aria-current="page"/);
    assert.match(trails[0][0],/aria-hidden="true">\//);
    assert.doesNotMatch(html,/>← (?:На главную|Вернуться на главную)<\/a>/);
  }
});

test('call buttons share a solid theme accent without changing the homepage hero',()=>{
  const css=read('assets/css/page-end-actions.css');
  assert.doesNotMatch(css,/hero-cinema-call/);
  assert.match(css,/:is\(\.page-end-action,\.catalog-help-phone,\.product-dialog-call,\.calculator-manager\)\[href\^="tel:"\]:any-link:is\(:hover,:focus-visible,:active\)\s*\{[^}]*color:var\(--on-accent\);[^}]*background:var\(--green\);[^}]*box-shadow:none;[^}]*transform:none;[^}]*transition:none;/);
  assert.match(css,/\[href\^="tel:"\] :is\(span,small,strong,svg\)\s*\{[^}]*color:inherit;[^}]*opacity:1;/);
  assert.match(css,/\[href\^="tel:"\]:hover \.page-end-action-arrow\s*\{[^}]*color:inherit;[^}]*background:transparent;[^}]*border:0;/);
  for(const file of pages(root)){
    const html=fs.readFileSync(file,'utf8');
    if(html.includes('class="page-end-action')||html.includes(' page-end-action"'))assert.match(html,/page-end-actions\.css\?v=20261023-solid-call/);
  }
});

test('full calculator keeps all five steps and options visible rather than shortening the form',()=>{
  const html=read('calculator/index.html');
  const fields=html.match(/<div class="calculator-fields">([\s\S]*?)<aside class="calculator-summary"/)[1];
  assert.equal((fields.match(/<fieldset/g)||[]).length,5);
  assert.doesNotMatch(fields,/<details|<summary/);
  for(const id of ['widthInput','heightInput','sashesInput','openingInput','customOpeningInput','chambersInput','profileInput','profileWidthInput'])assert.ok(fields.includes(`id="${id}"`),id);
  assert.equal((fields.match(/data-sashes="\d+"/g)||[]).length,10);
  assert.match(fields,/sashesInput"[^>]*min="1"[^>]*step="1"/);
  assert.doesNotMatch(fields,/sashesInput"[^>]*max=/);
  for(const option of ['value="Prowins"','value="Elex"','value="58"','value="70"','value="4"'])assert.ok(fields.includes(option));
  assert.match(html,/id="calcWindowPreview"[^>]*role="img"[^>]*aria-label=/);
  assert.match(html,/class="calculator-price-details"><summary>Как получилась сумма/);
  assert.match(html,/data-calculator-link/);
  assert.match(html,/Итоговую стоимость согласуем после замера/);
  const css=read('assets/css/calculator-page.css');
  assert.match(css,/\.calculator-detailed \.calculator-summary \{ position:static;/);
  assert.doesNotMatch(css,/position:sticky/);
  assert.match(css,/body\.calculator-page main h1,[\s\S]*?animation:none; transition:none; transform:none;/);
  assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.calculator-detailed \.calculator-summary \{ position:static;/);
});

test('breadcrumbs belong to the introduction surface, not a separate colour strip',()=>{
  for(const [file,section] of [['reviews/index.html','reviews-hero'],['catalog/index.html','catalog-page-hero'],['solutions/index.html','solutions-intro'],['contacts/index.html','hero contacts-hero hero-cinema'],['request/index.html','request-section'],['about/index.html','about-hero wrap']]){
    const html=read(file);
    assert.doesNotMatch(html,/<main[^>]*>\s*<nav class="breadcrumbs/);
    assert.match(html,new RegExp(`<section class="${section}"[^>]*>[\\s\\S]*?<nav class="breadcrumbs`));
  }
});

test('home calculator has a shared live diagram and its heading before the complete field grid',()=>{
  const html=read('index.html');
  const calc=html.match(/<section class="calculator-section"[\s\S]*?<\/section>/)[0];
  assert.ok(calc.indexOf('id="calculatorTitle"')<calc.indexOf('class="calculator calculator-compact"'));
  assert.match(calc,/id="calcWindowPreview"/);
  assert.match(calc,/id="calcPreviewSize"/);
  assert.match(calc,/id="calcPreviewNote"/);
  const fields=calc.match(/<div class="calculator-fields">([\s\S]*?)<div class="calculator-summary">/)[1];
  assert.match(fields, /class="calc-exclusions calc-wide" id="compactExclusions"/);
  assert.match(fields, /В расчёт не входят монтаж, подоконник, отлив, москитная сетка и дополнительные услуги\./);
  assert.match(calc, /aria-describedby="compactExclusions compactPriceNote"/);
  assert.match(calc, /id="compactPriceNote">Полную стоимость уточните у менеджера\./);
  for(const id of ['widthInput','heightInput','sashesInput','openingInput','chambersInput','profileInput','profileWidthInput'])assert.ok(calc.includes(`id="${id}"`));
  assert.match(read('assets/js/calculator.js'),/previewKey!==lastPreviewKey/);
});
