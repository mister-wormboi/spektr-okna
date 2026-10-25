const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const main = read('index.html').match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];

test('home leads from products and evidence to calculation, request and practical questions',()=>{
  const order=[...main.matchAll(/<section\b[^>]*class="([^"]+)"[^>]*>/g)].map(match=>match[1]);
  assert.deepEqual(order,['hero-cinema','catalog home-catalog','project-examples','reviews','before-after-section','window-story','inside-home','calculator-section','request-section','guides','home-contact']);
  assert.equal((main.match(/<section\b/g)||[]).length,11);
  assert.equal((main.match(/data-themed-request/g)||[]).length,1);
});

test('home groups related sections on two shared theme surfaces without new palette colours',()=>{
  const css=read('assets/css/home-refresh.css');
  assert.match(css,/main > :is\(\.home-catalog,\.project-examples,\.reviews,\.guides,\.home-contact\) \{ background:var\(--paper\); \}/);
  assert.match(css,/main > :is\(\.window-story,\.before-after-section,\.calculator-section,\.request-section\) \{ background:var\(--surface\); \}/);
  assert.match(css,/\.window-story-content \{ background:radial-gradient\([^;]*var\(--ink\) 4%[^;]*var\(--surface\);/);
  assert.match(css,/\.wrap:first-child::before \{[^}]*inset-inline:0;[^}]*height:1px; background:var\(--line\)/);
});

test('hero call button keeps its original quiet outline and accessible number', () => {
  const call = main.match(/<a class="hero-cinema-call"[\s\S]*?<\/a>/)[0];
  assert.match(call, /href="tel:\+79895175699"/);
  assert.match(call, /aria-label="Позвонить в Спектр: 8 989 517 56 99"/);
  assert.match(call, /<strong>8 989 517 56 99<\/strong>/);
  assert.match(call, /class="hero-cinema-call-arrow" aria-hidden="true">↗/);
  const css = read('assets/css/hero-atmosphere.css');
  assert.match(css, /\.hero-cinema-call svg \{ width: 26px; height: 26px; \}/);
  assert.match(css, /\.hero-cinema-call \{[^}]*background: #ffffff09;/);
  assert.doesNotMatch(css, /\.hero-cinema-call::after|background: #b4cfaa/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.hero-cinema-call \{ transition: none;/);
  assert.doesNotMatch(css, /animation:|backdrop-filter|will-change/);
});

test('hero title and call to action are centered while the facts keep their own grid', () => {
  const hero = read('assets/css/hero-atmosphere.css');
  assert.match(hero, /\.hero-cinema-heading \{ align-self: center; text-align: center;/);
  assert.match(hero, /\.hero-cinema-call \{[^}]*text-align: left;/);
  const css = read('assets/css/home-refresh.css');
  assert.match(css, /\.hero-cinema h1 \{[^}]*margin: 0 auto 20px;/);
  assert.match(css, /\.home-hero-lead \{[^}]*margin: 0 auto 26px;/);
});

test('hero contains three company facts and no former lower toolbar or separate strip', () => {
  const hero = main.match(/<section class="hero-cinema"[\s\S]*?<\/section>/)[0];
  const facts = hero.match(/<div class="hero-cinema-facts"[\s\S]*?<\/section>/)?.[0];
  assert.ok(facts);
  assert.equal((facts.match(/<strong>/g) || []).length, 3);
  assert.match(facts, /С 2004 года/);
  assert.match(facts, /6 офисов продаж<\/strong><span>Ростовская область и Краснодарский край/);
  assert.match(facts, /По вашим размерам<\/strong><span>для квартиры, дома или балкона/);
  assert.doesNotMatch(facts, /<a\b/);
  assert.doesNotMatch(main, /benefits-strip|hero-cinema-bottom|hero-cinema-controls/);
  assert.doesNotMatch(hero, /hero-video-toggle|href="#calculator"/);
  const css = read('assets/css/hero-atmosphere.css');
  assert.match(css, /\.hero-cinema-facts\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)[^}]*border-top: 1px solid/);
  assert.match(css, /\.hero-cinema-facts > div \+ div \{ border-left: 1px solid/);
});

test('window part numbers sit beside the titles at every viewport size', () => {
  const css = read('assets/css/window-story.css');
  const item = css.match(/\.window-part-labels > li\s*\{([^}]+)\}/)[1];
  assert.match(item, /display: grid/);
  assert.match(item, /grid-template-columns: auto minmax\(0, 1fr\)/);
  assert.match(item, /align-items: baseline/);
  assert.match(css, /\.window-part-labels h3 \{ margin: 0;/);
  assert.match(css, /\.window-part-labels p \{ grid-column: 2;/);
});

test('home action links use northeast arrows without changing directional controls', () => {
  for (const link of main.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) {
    assert.doesNotMatch(link[1], /[←→↑↓↘↙↖]/);
  }
  for (const selector of ['window-story-skip', 'secondary-link', 'home-contact-all']) {
    assert.match(main, new RegExp(`class="${selector}"[^>]*>[\\s\\S]*?<span aria-hidden="true">↗<\\/span><\\/a>`));
  }
  assert.match(main, /data-strip-step="-1"[^>]*>←<\/button>/);
  assert.match(main, /data-strip-step="1"[^>]*>→<\/button>/);
});

test('home has concrete section headings with an explanation directly underneath', () => {
  const headings = {
    windowStoryTitle: 'Из чего состоит окно?',
    calculatorTitle: 'Рассчитайте стоимость окна.',
    requestTitle: 'Поможем выбрать окна.',
    catalogTitle: 'Окна, двери и остекление.',
    beforeAfterTitle: 'Как может измениться балкон?',
    projectExamplesTitle: 'Наши работы.',
    reviewsTitle: 'Отзывы клиентов.',
    guidesTitle: 'Вопросы перед заказом.',
    homeContactTitle: 'Обсудим ваши окна.',
  };
  for (const [id, title] of Object.entries(headings)) {
    const heading = main.match(new RegExp(`class="[^"]*home-section-heading[^"]*">\\s*<h2 id="${id}">([\\s\\S]*?)<\\/h2>\\s*<p(?: [^>]*)?>`));
    assert.ok(heading, id);
    assert.equal(heading[1].replace(/<[^>]+>/g, ''), title);
  }
  assert.doesNotMatch(main, /class="eyebrow"|class="hero-cinema-kicker"|>FAQ</);
  assert.equal((main.match(/<h1\b/g) || []).length, 1);
  assert.match(main, /<h1 id="heroTitle">Окна и остекление<br><em class="heading-accent">для вашего дома\.<\/em><\/h1>\s*<p class="home-hero-lead">/);
});

test('home accents stay selective and use the existing theme and fonts', () => {
  assert.equal((main.match(/<h2[^>]*>[^<]*<em class="heading-accent">/g) || []).length, 5);
  assert.doesNotMatch(main, /<strong>предварительный расчёт<\/strong>|<strong>имя и телефон<\/strong>/);
  const css = read('assets/css/typography.css');
  assert.match(css, /> \.heading-accent\s*\{[^}]*color: var\(--green\);[^}]*font-style: italic/);
});

test('home copy keeps functional labels, disclosures and existing real content', () => {
  assert.match(main, /href="#request">Получить помощь с расчётом/);
  assert.match(main, /id="compactExclusions"[\s\S]*?В расчёт не входят монтаж/);
  assert.match(main, /alt="Визуализация балкона после обновления:/);
  assert.match(main, /alt="Визуализация того же балкона до обновления:/);
  assert.match(main, /id="homeOfficesTrack" data-card-strip/);
  assert.equal((main.match(/class="home-office-card"/g) || []).length, 6);
  assert.equal((main.match(/<article class="review-card/g) || []).length, 10);
  assert.doesNotMatch(main, /Кол-во|home-contact-guide|Хороший вид|Новое ощущение/);
});

test('home keeps its reading rhythm and uses the shared body size', () => {
  const css = read('assets/css/home-refresh.css');
  assert.match(read('assets/css/typography.css'), /body main \{ --font-size-body: 16px;/);
  assert.match(css, /\.home-page \.home-section-heading\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.home-page \.home-section-heading > p\s*\{[^}]*max-width: 60ch/);
});
