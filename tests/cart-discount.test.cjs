const {test} = require('node:test');
const assert = require('node:assert/strict');
const {setup} = require('./cart-fixture.cjs');
const text = (element) => element.textContent.replace(/\u00a0/g, ' ');
function applyPromo(app) {
  app.document.querySelector('#cart-promo-code').value = 'DEMO10';
  app.document.querySelector('.proto-cart-promo').dispatchEvent(new app.window.Event('submit', {cancelable:true}));
}
test('promo discount appears on the item amount and package price, and follows quantity changes', () => {
  const app = setup();
  applyPromo(app);
  let row = app.document.querySelector('.proto-cart-row');
  assert.equal(text(row.querySelector('.proto-cart-amount strong, strong.proto-cart-amount')), '450 ₽');
  assert.equal(text(row.querySelector('.proto-cart-quantity .muted')), '450 ₽ / упак.');
  assert.equal(text(row.querySelector('del')), '500 ₽');
  row.querySelector('[data-cart-action="plus"]').click();
  row = app.document.querySelector('.proto-cart-row');
  assert.equal(text(row.querySelector('.proto-cart-amount strong, strong.proto-cart-amount')), '900 ₽');
  assert.equal(text(row.querySelector('del')), '1 000 ₽');
  assert.equal(text(app.document.querySelector('.proto-saved-total')), '900 ₽');
});
test('removing the promo restores original item and package prices', () => {
  const app = setup();
  applyPromo(app);
  app.document.querySelector('[data-cart-promo-button]').click();
  const row = app.document.querySelector('.proto-cart-row');
  assert.equal(text(row.querySelector('.proto-cart-amount strong, strong.proto-cart-amount')), '500 ₽');
  assert.equal(row.querySelector('del'), null);
  assert.equal(text(row.querySelector('.proto-cart-quantity .muted')), '500 ₽ / упак.');
  assert.equal(text(app.document.querySelector('.proto-saved-total')), '500 ₽');
});
