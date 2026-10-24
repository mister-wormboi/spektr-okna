const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('about/index.html');
const css=read('assets/css/about.css');

test('About tasks are six readable list rows, not a grid of cards',()=>{
  const list=html.match(/<ol class="about-task-list"[^>]*>([\s\S]*?)<\/ol>/)[1];
  assert.equal((list.match(/<li>/g)||[]).length,6);
  assert.equal((list.match(/<h3>/g)||[]).length,6);
  assert.doesNotMatch(html,/about-task-grid/);
  assert.match(css,/\.about-task-list li \{[^}]*grid-template-columns:28px minmax\(200px,\.85fr\) minmax\(0,1\.25fr\)/);
  assert.match(css,/@media \(max-width:900px\)[\s\S]*?\.about-task-list p \{ grid-column:2;/);
});

test('company list uses existing, specific facts rather than unverifiable promises',()=>{
  const list=html.match(/<ol class="principles"[^>]*>([\s\S]*?)<\/ol>/)[1];
  assert.equal((list.match(/<li>/g)||[]).length,6);
  for(const text of ['с 2004 года','Шесть офисов в двух регионах','Ростов-на-Дону, Азов, Батайск, Кулешовка и Ейск','после замера','От замера до установки'])assert.ok(list.includes(text),text);
  assert.doesNotMatch(list,/лучшие|№\s*1|самые низкие|бесплатн|100%/i);
});

test('light shares the dark layout and makes only the existing panels translucent',()=>{
  assert.match(css,/\.about-cinema-shade \{[^}]*var\(--about-film-surface\) 94%/);
  assert.match(css,/html\[data-theme="light"\] \.about-page :is\(\.about-facts,\.approach-grid,\.solution-card,\.about-invitation\),\s*html\[data-theme="light"\] \.about-page \.about-work\.about-section \{ background:var\(--header-surface\);/);
  assert.doesNotMatch(css,/--header-surface\s*:/);
  assert.match(read('assets/css/theme.css'),/--header-surface:\s*#fafbf7ef;/);
  const lightRules=[...css.matchAll(/html\[data-theme="light"\][^{]+\{([^}]+)\}/g)].map(m=>m[1]).join('\n');
  assert.doesNotMatch(lightRules,/padding:|margin:|margin-block:|max-width:|width:|grid-template/);
  assert.match(lightRules,/color:var\(--about-film-ink\)/);
  assert.doesNotMatch(lightRules,/opacity:/);
  assert.doesNotMatch(css,/--ink:\s*#|--muted:\s*#|text-shadow:|\.about-intro[^}]*color:\s*#fff/i);
  assert.match(css,/\.about-hero \{ display:grid; grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/@media \(max-width:760px\)[\s\S]*?\.about-page \.invitation-actions \{ flex-basis:auto; width:100%;/);
});

test('heading accents follow each logo while ordinary panel text stays neutral',()=>{
  assert.match(css,/--about-film-accent:var\(--brand\)/);
  assert.match(css,/html\[data-theme\] \.about-page main :is\(h1,h2\) > \.heading-accent \{ color:var\(--brand\);/);
  assert.doesNotMatch(css,/:is\(\.solution-index,\.solution-link,\.secondary-link,\.heading-accent\)/);
});

test('scroll video, real photos and existing contact paths are preserved',()=>{
  assert.match(html,/class="about-video"[^>]*data-video-src="\.\.\/assets\/about-window-scroll\.mp4"/);
  for(const match of html.matchAll(/<img[^>]+src="([^\"]+)"/g))assert.ok(fs.existsSync(path.resolve(root,'about',match[1].split('?')[0])),match[1]);
  assert.match(html,/href="tel:\+79895175699"/);
  assert.match(html,/href="\.\.\/contacts\/"/);
  assert.doesNotMatch(css,/assembly-|line-art|process-steps|about-task-grid/);
});
