const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const {articles}=JSON.parse(read('content/articles.json'));

test('article cards have inset copy and place the date above the heading',()=>{
  const cards=[...read('articles/index.html').matchAll(/<div class="article-copy">([\s\S]*?)<\/a>/g)];
  assert.equal(cards.length,articles.length);
  for(const [,copy] of cards){
    assert.ok(copy.indexOf('<time ')<copy.indexOf('<h2>'));
    assert.ok(copy.indexOf('<h2>')<copy.indexOf('<p>'));
  }
  const css=read('assets/css/articles.css');
  assert.match(css,/\.article-copy \{[^}]*gap:14px; padding:28px;/);
  assert.match(css,/@media \(max-width: 620px\)[\s\S]*?\.article-copy \{ padding:20px; gap:12px;/);
});

test('article listing and every article omit counters, scripts and the closing calculator banner',()=>{
  const pages=['articles/index.html',...articles.flatMap(a=>[`articles/${a.slug}/index.html`,...(a.legacy_slug?[`articles/${a.legacy_slug}/index.html`]:[])])];
  for(const file of pages)assert.doesNotMatch(read(file),/article-view-count|data-article-view|article-views\.js|articles-help|Подберём окна/,file);
  assert.doesNotMatch(read('templates/articles-shell.tpl'),/article-views\.js/);
  assert.doesNotMatch(read('tools/build-articles.js'),/viewCounter|function help\(/);
});

test('all article covers precede full-width text and preserve all editorial sections',()=>{
  for(const article of articles){
    const html=read(`articles/${article.slug}/index.html`);
    assert.ok(html.indexOf('class="article-cover"')<html.indexOf('class="article-body"'),article.slug);
    assert.doesNotMatch(html,/article-content--portrait/);
    assert.equal((html.match(/<section id="section-/g)||[]).length,article.sections.length,article.slug);
    for(const section of article.sections)for(const paragraph of section.paragraphs)assert.ok(html.includes(paragraph.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')),article.slug);
  }
  const css=read('assets/css/article-detail.css');
  assert.doesNotMatch(css,/position:\s*sticky|article-content--portrait/);
  assert.match(css,/\.article-detail \.article-body \{[^}]*--font-size-body:20px;[^}]*width:100%; max-width:none;/);
  assert.match(css,/@media \(max-width: 760px\)[^\n]*--font-size-body:18px/);
  assert.match(read('assets/css/articles.css'),/padding-bottom:clamp\(56px,7vw,96px\)/);
});
