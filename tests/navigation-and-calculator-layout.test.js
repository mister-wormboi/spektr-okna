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

test('shared call buttons have neutral ink on labels, number and arrow in both palettes',()=>{
  const css=read('assets/css/page-end-actions.css');
  assert.match(css,/a\.page-end-action\[href\^="tel:"\]:any-link\s*\{[^}]*color:var\(--ink\); border-color:var\(--line\);/);
  assert.match(css,/\[href\^="tel:"\] \.page-end-action-copy > span \{ color:inherit;/);
  assert.match(css,/\[href\^="tel:"\]:hover \.page-end-action-arrow \{ color:inherit; background:transparent;/);
  for(const file of pages(root)){
    const html=fs.readFileSync(file,'utf8');
    if(html.includes('class="page-end-action')||html.includes(' page-end-action"'))assert.match(html,/page-end-actions\.css\?v=20261022-monochrome/);
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
  for(const [file,section] of [['reviews/index.html','reviews-hero'],['catalog/index.html','catalog-page-hero'],['solutions/index.html','solutions-intro'],['contacts/index.html','hero'],['request/index.html','request-section'],['about/index.html','about-hero wrap']]){
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
  for(const id of ['widthInput','heightInput','sashesInput','openingInput','chambersInput','profileInput','profileWidthInput'])assert.ok(calc.includes(`id="${id}"`));
  assert.match(read('assets/js/calculator.js'),/previewKey!==lastPreviewKey/);
});
