const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.join(__dirname, '..', 'dist');
const source = fs.readFileSync(path.join(root, 'prototype.js'), 'utf8');
function setup() {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => { if (error.type !== 'css-parsing') throw error; });
  const {window} = new JSDOM(fs.readFileSync(path.join(root, 'cart.html'), 'utf8'), {url:'http://localhost/cart.html', virtualConsole});
  const {document, localStorage, sessionStorage} = window;
  const products = JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8'));
  const savedPage = document.querySelector('[data-saved-page]');
  const context = vm.createContext({document, localStorage, sessionStorage, URLSearchParams, products, savedPage, cartLinks:[]});
  vm.runInContext('const all=(s,r=document)=>Array.from(r.querySelectorAll(s));', context);
  vm.runInContext(source.slice(source.indexOf('function readCart('), source.indexOf('function renderPack(')), context);
  vm.runInContext(source.slice(source.indexOf("const cartPromoCode ="), source.indexOf('function openCheckout(')), context);
  localStorage.setItem('polyarik-cart', JSON.stringify({'DEMO-A1':1}));
  vm.runInContext('renderCart()', context);
  return {window, document, savedPage, context};
}
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
