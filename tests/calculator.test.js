const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateWindow } = require('../assets/js/calculator.js');
const base = { width: 1300, height: 1400, sashes: 2, opening: 1, chambers: 1, profile: 'Elex', profileWidth: 70 };
const calc = changes => calculateWindow({ ...base, ...changes });

test('agreed examples and final 15% surcharge', () => {
  assert.equal(calc({ width: 1350, height: 1300, profileWidth: 58 }).price, 19305);
  assert.equal(calc({ width: 1350, height: 1300 }).price, 20182.5);
  assert.equal(calc({}).price, 20930);
  assert.equal(calc({ width: 1400, height: 1300, profile: 'Prowins', profileWidth: 58, opening: 2, chambers: 2 }).price, 24035);
});
test('all standard profiles, opening counts and glass options', () => {
  for (const sashes of [2, 3]) for (const profile of ['Prowins', 'Elex']) for (const profileWidth of [58, 70]) {
    for (let opening = 1; opening <= sashes; opening++) for (const chambers of [1, 2]) {
      const width = sashes === 2 ? 1500 : 2000;
      const rate = (sashes === 2 ? 10000 : 8000) + (profile === 'Elex' ? 1000 : 0) + (profileWidth === 70 ? 500 : 0);
      const result = calc({ sashes, width, profile, profileWidth, opening, chambers });
      assert.equal(result.standard, true);
      assert.equal(result.rate, rate);
      assert.equal(result.surcharge, (opening - 1) * 2700);
      assert.equal(result.price, Math.round((width * 1400 / 1e6 * rate + (opening - 1) * 2700) * (chambers === 2 ? 1.15 : 1) * 100) / 100);
    }
  }
});
test('inclusive boundaries and mismatched sash counts', () => {
  for (const [sashes, low, high] of [[2, 1200, 1500], [3, 1800, 2200]]) {
    for (const width of [low, high]) for (const height of [1200, 1400]) assert.equal(calc({ sashes, width, height }).standard, true);
    for (const width of [low - 1, high + 1, 1768]) assert.equal(calc({ sashes, width }).standard, false);
    for (const height of [1199, 1401]) assert.equal(calc({ sashes, width: low, height }).standard, false);
  }
  assert.equal(calc({ sashes: 3, width: 1500 }).standard, false);
  assert.equal(calc({ sashes: 2, width: 1800 }).standard, false);
});
test('nonstandard ignores all surcharges', () => {
  for (const change of [{ sashes: 1 }, { sashes: 4, opening: 4 }, { sashes: 10 }, { sashes: 25 }, { opening: 0 }, { chambers: 3 }, { chambers: 4 }, { width: 1501 }, { height: 1100 }]) {
    const input = { ...base, opening: 1, chambers: 2, ...change };
    const result = calculateWindow(input);
    assert.equal(result.standard, false);
    assert.equal(result.surcharge, 0);
    assert.equal(result.multiplier, 1);
    assert.equal(result.price, Math.round(input.width * input.height / 1e6 * 14000 * 100) / 100);
  }
});
test('invalid or incomplete inputs never produce a price', () => {
  for (const change of [{ width: 0 }, { height: -1 }, { width: 1.5 }, { sashes: 0 }, { sashes: 2.5 }, { opening: NaN }, { opening: -1 }, { opening: 3 }, { chambers: 5 }, { profile: 'Other' }, { profileWidth: 60 }, { width: Infinity }, { width: Number.MAX_SAFE_INTEGER }]) assert.equal(calc(change), null);
});
