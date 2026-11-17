const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {setup}=require('./cart-fixture.cjs');
test('first-order 5% is not advertised or applied in cart or checkout',()=>{
 const app=setup();app.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':10}));vm.runInContext('renderCart()',app.context);
 assert.equal(app.savedPage.querySelector('[data-welcome-offer]'),null);assert.doesNotMatch(app.savedPage.textContent,/первый заказ/i);
 assert.equal(app.savedPage.querySelector('.proto-cart-summary [data-welcome-offer]'),null);
 vm.runInContext("openCheckout('Оформление заказа')",app.context);assert.equal(app.document.querySelector('#proto-checkout [data-welcome-offer]'),null);
 assert.equal(vm.runInContext('cartPricing().total',app.context),5000);
});
test('returning customer does not receive a misleading first-order offer',()=>{
 const app=setup();app.window.localStorage.setItem('polyarik-demo-account','1');vm.runInContext('renderCart()',app.context);assert.equal(app.savedPage.querySelector('[data-welcome-offer]'),null);
});
