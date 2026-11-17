const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {setup}=require('./cart-fixture.cjs');
test('first-order 5% is a compact footnote below the scale, not a sidebar banner',()=>{
 const app=setup();app.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':10}));vm.runInContext('renderCart()',app.context);
 const banner=app.savedPage.querySelector('[data-welcome-offer]');assert.ok(banner);assert.equal(banner.tagName,'P');assert.ok(banner.closest('.proto-discount-scale'));assert.match(banner.textContent,/дополнительная скидка/);assert.match(banner.textContent,/5%/);assert.match(banner.textContent,/первый заказ/);
 assert.equal(app.savedPage.querySelector('.proto-cart-summary [data-welcome-offer]'),null);
 vm.runInContext("openCheckout('Оформление заказа')",app.context);assert.ok(app.document.querySelector('#proto-checkout [data-welcome-offer]'));
 assert.equal(app.document.querySelectorAll('#proto-checkout [data-welcome-offer]').length,1);
 assert.equal(vm.runInContext('cartPricing().total',app.context),5000);
});
test('returning customer does not receive a misleading first-order offer',()=>{
 const app=setup();app.window.localStorage.setItem('polyarik-demo-account','1');vm.runInContext('renderCart()',app.context);assert.equal(app.savedPage.querySelector('[data-welcome-offer]'),null);
});
