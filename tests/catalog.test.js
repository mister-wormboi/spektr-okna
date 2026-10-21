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

function home({observer=false,reduced=false}={}) {
  const observed=new Set();let intersect;
  const items=Array.from({length:8},()=>{const names=new Set();return {style:{setProperty(){}},classList:{add:n=>names.add(n),contains:n=>names.has(n)},matches:selector=>selector.includes('.home-category-card')};});
  items.forEach(item=>item.parentElement={children:items});
  class Observer { constructor(fn){intersect=fn;} observe(item){observed.add(item);} unobserve(item){observed.delete(item);} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/main.js'),'utf8'),{
    document:{querySelectorAll:()=>items},window:{matchMedia:()=>({matches:reduced}),...(observer?{IntersectionObserver:Observer}:{})},IntersectionObserver:Observer
  });
  return {items,observed,intersect};
}

test('category links stay visible without IntersectionObserver or with reduced motion',()=>{
  for(const settings of [{},{observer:true,reduced:true}]){
    const {items,observed}=home(settings);
    assert.equal(items.length,8);assert.equal(observed.size,0);
    assert.ok(items.every(item=>item.classList.contains('is-visible')));
  }
});

test('category reveal releases a target after it appears',()=>{
  const {items,observed,intersect}=home({observer:true});
  assert.equal(observed.size,8);
  intersect([{target:items[0],isIntersecting:true}],{unobserve:item=>observed.delete(item)});
  assert.equal(observed.size,7);assert.ok(items[0].classList.contains('is-visible'));
});

test('home offers every category as a direct schematic link, without product controls or photos',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const catalog=html.match(/<section class="catalog home-catalog"[\s\S]*?<\/section>/)[0];
  const links=[...catalog.matchAll(/<a class="home-category-card" href="catalog\/\?category=([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.deepEqual(links.map(item=>item[1]).sort(),['windows','balconies','doors','gates','ceilings','blinds','aluminium','components'].sort());
  links.forEach(item=>{assert.match(item[2],/<svg[^>]+aria-hidden="true"/);assert.match(item[2],/<h3>/);});
  assert.doesNotMatch(catalog,/<img|homeCatalogSearch|homeCatalogSort|Подробнее|product-price/);
  assert.doesNotMatch(html,/src="assets\/js\/(?:products-data|products-page|product-preview)\.js/);
});
