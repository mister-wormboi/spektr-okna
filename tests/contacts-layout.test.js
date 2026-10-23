const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('contacts/index.html');
const css=read('assets/css/contacts.css');

test('contacts combines office information, facts and call action in the film hero',()=>{
  const hero=html.match(/<section class="hero contacts-hero hero-cinema"[\s\S]*?<\/section>/)[0];
  for(const text of ['Наши офисы.','Поможем выбрать удобный офис.','Позвоните по единому номеру','офисов продаж','региона присутствия','единый стандарт качества','class="page-end-action"'])assert.ok(hero.includes(text),text);
  assert.equal((html.match(/Поможем выбрать удобный офис/g)||[]).length,1);
  assert.doesNotMatch(html,/<section class="contact-banner"/);
  assert.equal((html.match(/class="office-card"/g)||[]).length,6);
});

test('contacts reuses visibility, economy mode and accessible playback controls',()=>{
  assert.match(html,/hero-video\.js/);
  assert.match(html,/<video muted loop playsinline preload="none" data-src="\.\.\/assets\/contacts-window-rain\.mp4"/);
  assert.match(html,/class="hero-video-toggle"[^>]*hidden[^>]*aria-label="Приостановить видео"/);
  for(const file of ['contacts-window-rain.mp4','contacts-window-rain-poster.webp'])assert.ok(fs.existsSync(path.join(root,'assets',file)));
  assert.match(css,/contacts-hero-media::after[^}]*linear-gradient/);
  assert.match(css,/@media\(max-width:900px\)[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
});

test('branch labels use normal case and body face instead of a third display style',()=>{
  assert.match(css,/:is\(\.office-body header small,\.work-status\)[^}]*font:400 14px\/1\.6 var\(--sans\);[^}]*letter-spacing:normal; text-transform:none;/);
  assert.match(css,/\.contacts-page \.office-body dd \{ font-weight:400;/);
  assert.match(css,/\.contacts-page \.contacts-hero \.hero-copy > \*,[\s\S]*?animation:none;/);
});
