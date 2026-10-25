const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { selectSpektrProducts } = require('../assets/js/products-page');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/products-data.js'), 'utf8'), context);
const tasks = context.window.SPEKTR_PRODUCT_TASKS;
const products = context.window.SPEKTR_PRODUCTS;

test('every task selects existing product cards rather than category or collection cards', () => {
  const html = fs.readFileSync(path.join(root, 'catalog/index.html'), 'utf8');
  assert.equal(tasks.length, 3);
  for (const task of tasks) {
    const matches = selectSpektrProducts(products, { category: task.category, productIds: task.products });
    assert.equal(matches.length, task.products.length, task.id);
    assert.ok(matches.length > 1 && matches.length < products.length);
    assert.ok(matches.every(product => !product.isCollection && !product.isDirection));
    assert.ok(html.includes(`?task=${task.id}#catalog-products`));
  }
});

test('warmth excludes cold glazing, light includes panoramic options, and task search still narrows results', () => {
  const warmth = tasks.find(task => task.id === 'warmth');
  const light = tasks.find(task => task.id === 'light');
  assert.ok(warmth.products.includes('optimal'));
  assert.ok(!warmth.products.includes('cold-balcony'));
  assert.ok(light.products.includes('panoramic'));
  const matches = selectSpektrProducts(products, { category: warmth.category, productIds: warmth.products, query: 'Intelio' });
  assert.ok(matches.length > 0 && matches.length < warmth.products.length);
  assert.ok(matches.every(product => warmth.products.includes(product.id)));
});
