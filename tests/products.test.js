const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { selectSpektrProducts } = require('../assets/js/products-page.js');
const root = path.resolve(__dirname,'..');
const context = { window:{} };
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/products-data.js'),'utf8'),context);
const products = Array.from(context.window.SPEKTR_PRODUCTS);
const categories = Array.from(context.window.SPEKTR_PRODUCT_CATEGORIES);

test('new assortment links to Spektr and has complete categories, details and local images',()=>{
  assert.equal(new Set(products.map(item=>item.id)).size,products.length);
  for(const category of categories) assert.ok(products.some(item=>item.category===category.id));
  for(const product of products){
    assert.ok(categories.some(item=>item.id===product.category));
    assert.equal(new URL(product.source).hostname,'spektr-okna.ru');
    assert.ok(product.title && product.description && product.features.length);
    for(const image of product.image ? [product.image,product.image.replace('.webp','-small.webp')] : []) assert.ok(fs.existsSync(path.join(root,image)));
  }
});

test('product search combines category, words, characteristics and Russian brand spelling',()=>{
  assert.deepEqual(selectSpektrProducts(products,{category:'doors',query:'балконные'}).map(item=>item.id),['balcony-door']);
  assert.deepEqual(selectSpektrProducts(products,{query:'  ТЕПЛОЕ  балкона '}).map(item=>item.id),['warm-balcony']);
  assert.deepEqual(selectSpektrProducts(products,{query:'рехау'}).map(item=>item.id),selectSpektrProducts(products,{query:'REHAU'}).map(item=>item.id));
  assert.ok(selectSpektrProducts(products,{query:'Siegenia'}).some(item=>item.id==='comfort'));
  assert.equal(selectSpektrProducts(products,{category:'ceilings',query:'REHAU'}).length,0);
  assert.equal(selectSpektrProducts(products,{query:'несуществующий товар'}).length,0);
});

test('alphabetical sort preserves data and categories can be reset to all',()=>{
  const original=products.map(item=>item.id);
  const asc=selectSpektrProducts(products,{category:'aluminium',sort:'az'});
  const desc=selectSpektrProducts(products,{category:'aluminium',sort:'za'});
  assert.deepEqual(asc.map(item=>item.id),desc.map(item=>item.id).reverse());
  assert.deepEqual(products.map(item=>item.id),original);
  assert.equal(selectSpektrProducts(products).length,products.length);
});
