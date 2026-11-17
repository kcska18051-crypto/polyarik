const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {setup}=require('./cart-fixture.cjs');
test('first-order 5% offer is prominent in guest cart and checkout without changing arithmetic',()=>{
 const app=setup();app.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':10}));vm.runInContext('renderCart()',app.context);
 const banner=app.savedPage.querySelector('[data-welcome-offer]');assert.ok(banner);assert.match(banner.textContent,/Дополнительная скидка/);assert.match(banner.textContent,/5%/);assert.match(banner.textContent,/первый заказ/);
 vm.runInContext("openCheckout('Оформление заказа')",app.context);assert.ok(app.document.querySelector('#proto-checkout [data-welcome-offer]'));
 assert.equal(vm.runInContext('cartPricing().total',app.context),5000);
});
test('returning customer does not receive a misleading first-order offer',()=>{
 const app=setup();app.window.localStorage.setItem('polyarik-demo-account','1');vm.runInContext('renderCart()',app.context);assert.equal(app.savedPage.querySelector('[data-welcome-offer]'),null);
});
