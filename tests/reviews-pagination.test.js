const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('reviews open ten at a time, keep a plain button label and reset the limit on filtering', () => {
  const element = () => ({ hidden:false, textContent:'', events:{}, addEventListener(name, fn) { this.events[name] = fn; }, setAttribute() {}, focus() {}, scrollIntoView() {} });
  const cards = Array.from({length:20}, (_, i) => Object.assign(element(), {dataset:{topics:i < 12 ? 'quality' : 'service'}}));
  const filters = ['all','quality'].map(topic => Object.assign(element(), {dataset:{topic}}));
  const elements = Object.fromEntries(['.review-tools','#reviewStatus','.review-pagination','#loadMoreReviews','.review-empty','#resetReviews'].map(selector => [selector,element()]));
  elements['#reviewGrid'] = {querySelectorAll:() => cards};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/reviews-page.js'),'utf8'), {
    document:{querySelector:selector => elements[selector], querySelectorAll:() => filters},
    matchMedia:() => ({matches:true})
  });
  const count = () => cards.filter(card => !card.hidden).length;
  const more = elements['#loadMoreReviews'];
  assert.equal(count(),10);
  assert.equal(more.textContent,'Показать ещё');
  more.events.click();
  assert.equal(count(),20);
  assert.equal(elements['.review-pagination'].hidden,true);
  filters[1].events.click();
  assert.equal(count(),10);
  assert.equal(elements['.review-pagination'].hidden,false);
  assert.equal(more.textContent,'Показать ещё');
  more.events.click();
  assert.equal(count(),12);
  assert.equal(elements['.review-pagination'].hidden,true);
});
