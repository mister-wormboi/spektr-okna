const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { selectCatalogItems } = require('../assets/js/catalog-render.js');
const { selectSpektrProducts } = require('../assets/js/products-page.js');
const products = [
  { title: 'Окно под проём', group: 'Окна и балконные блоки', price: 4000 },
  { title: 'Дверь', group: 'Двери', price: null },
  { title: 'Ремонт', group: 'Ремонт окон', price: 700 },
  { title: 'Другая дверь', group: 'Двери', price: null },
];

test('catalogue sorting keeps unknown prices last and preserves source order', () => {
  for (const sort of ['asc', 'desc']) {
    const selected = selectCatalogItems(products, { sort });
    assert.deepEqual(selected.slice(2), [products[1], products[3]]);
    assert.deepEqual(selected.slice(0, 2), sort === 'asc' ? [products[2], products[0]] : [products[0], products[2]]);
  }
  assert.deepEqual(selectCatalogItems(products), products);
  assert.equal(products[0].price, 4000);
});

test('catalogue combines groups and normalizes Russian search', () => {
  assert.equal(selectCatalogItems(products, { group: 'windows-doors' }).length, 3);
  assert.deepEqual(selectCatalogItems(products, { query: ' ПРОЕМ ' }), [products[0]]);
  assert.deepEqual(selectCatalogItems(products, { group: 'Двери', query: 'окно' }), []);
});

function home({ observer = false, reduced = false, sort = true } = {}) {
  const makeElement = () => {
    const classes = new Set();
    return {
      classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: n => classes.delete(n), toggle: (n, on) => on ? classes.add(n) : classes.delete(n), contains: n => classes.has(n) },
      style: { setProperty() {} }, dataset: {}, listeners: {},
      addEventListener(name, handler) { this.listeners[name] = handler; },
      setAttribute() {}, matches() { return false; },
    };
  };
  const grid = makeElement();
  grid.children = [];
  grid.querySelectorAll = () => grid.children.filter(c => c.classList.contains('card'));
  grid.replaceChildren = (...children) => { grid.children = children; };
  grid.append = child => grid.children.push(child);
  const filter = makeElement();
  filter.dataset.homeGroup = 'windows';
  const sortField = makeElement();
  sortField.value = 'default';
  const count = makeElement();
  const fields = { '#cards': grid, '#homeCatalogCount': count, '#homeCatalogSort': sort ? sortField : null };
  const observed = new Set();
  class Observer {
    observe(element) { observed.add(element); }
    unobserve(element) { observed.delete(element); }
  }
  const context = {
    document: {
      querySelector: selector => fields[selector] || null,
      querySelectorAll: selector => selector === '[data-home-group]' ? [filter] : grid.children,
      createElement: makeElement,
    },
    window: {
      SPEKTR_PRODUCTS: products.map(p=>({...p, category:p.group==='Окна и балконные блоки'?'windows':p.group==='Двери'?'doors':'gates',subtitle:'',description:'',features:[]})),
      matchMedia: () => ({ matches: reduced }),
      renderSpektrProductPreview: () => { const el = makeElement(); el.classList.add('card'); return el; },
      ...(observer ? { IntersectionObserver: Observer } : {}),
    },
    IntersectionObserver: Observer,
    selectSpektrProducts,
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/main.js'), 'utf8'), context);
  return { grid, filter, sortField, observed };
}

test('cards stay visible after filtering without IntersectionObserver or with reduced motion', () => {
  for (const settings of [{}, { observer: true, reduced: true }, { sort: false }]) {
    const { grid, filter } = home(settings);
    assert.equal(grid.children.length, 4);
    filter.listeners.click();
    assert.equal(grid.children.length, 1);
    assert.ok(grid.children.every(c => c.classList.contains('is-visible')));
  }
});

test('replacing cards releases old observer targets', () => {
  const { grid, filter, observed } = home({ observer: true });
  const previous = [...grid.children];
  assert.equal(observed.size, 4);
  filter.listeners.click();
  assert.equal(observed.size, 1);
  assert.ok(previous.every(card => !observed.has(card)));
});
