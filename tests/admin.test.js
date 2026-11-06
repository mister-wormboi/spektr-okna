const test = require('node:test');
const assert = require('node:assert/strict');
const {newPage,newItem,collectionSpecs} = require('../admin/admin.js');
const {loadRecords} = require('../tools/build-database');
const {createServer} = require('../tools/preview-server');

test('static preview refuses administrative files and PHP source without executing it', () => {
  const server = createServer({views:{}});
  for (const url of ['/admin/', '/admin/api.php', '/ad%6din/lib/app.php', '/database/init.sql', '/tools/php-router.php']) {
    let status = 0;
    const response = {writeHead(code) {status = code;return this;},end() {}};
    server.emit('request',{url,method:'GET',headers:{}},response);
    assert.equal(status,404,url);
  }
});

test('new pages use unused paths and new articles have their own editable content', () => {
  const section = {id:'articles',route:'/articles/'};
  const pages = [{path:'/articles/'},{path:'/articles/novaya-stranitsa/'}];
  const page = newPage(section,pages);
  assert.equal(page.path,'/articles/novaya-stranitsa-2/');
  assert.equal(page.content.article.slug,'novaya-stranitsa-2');
  assert.equal(page.is_published,false);
  assert.equal(page.id,0);
  const next = newPage(section,pages);
  page.content.article.sections[0].heading = 'Changed';
  assert.equal(next.content.article.sections[0].heading,'');
});

test('collection insertions are editable independent records with unique identifiers', () => {
  const first = newItem('products');
  const second = newItem('products');
  assert.notEqual(first.id,second.id);
  first.features.push('Новая характеристика');
  assert.deepEqual(second.features,[]);
  const section = newItem('sections');
  assert.deepEqual(section.paragraphs,['']);
  const hours = newItem('openingHoursSpecification');
  assert.equal(hours['@type'],'OpeningHoursSpecification');
  assert.equal(newItem('products','econom'),'');
});

test('collection editing changes the page payload while preserving unedited source fields', () => {
  const records = loadRecords();
  const catalog = records.find(page => page.path === '/catalog/');
  const collection = collectionSpecs(catalog.content).find(spec => spec.key === 'products');
  const original = JSON.stringify(collection.value[0]);
  const count = collection.value.length;
  collection.value.push(newItem('products'));
  collection.value.at(-1).title = 'Новый товар';
  assert.equal(catalog.content.catalog.products.length,count + 1);
  assert.equal(catalog.content.catalog.products.at(-1).title,'Новый товар');
  collection.value.splice(count,1);
  assert.equal(catalog.content.catalog.products.length,count);
  assert.equal(JSON.stringify(collection.value[0]),original);
  const reviews = records.find(page => page.path === '/reviews/');
  const metadata = collectionSpecs(reviews.content).find(spec => spec.proxy);
  assert.ok(!('reviews' in metadata.value));
  assert.equal(metadata.owner,reviews.content.reviews);
});
