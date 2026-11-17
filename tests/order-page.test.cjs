const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {setup}=require('./cart-fixture.cjs');
test('primary checkout navigates to a separate page and has no modal click handler',()=>{
 const app=setup();app.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':10}));vm.runInContext('renderCart()',app.context);
 const link=app.savedPage.querySelector('[data-checkout-link]');assert.ok(link);assert.equal(link.tagName,'A');assert.equal(link.getAttribute('href'),'order.html');assert.equal(app.document.querySelector('#proto-checkout').open,false);
});
test('checkout link cannot bypass the original-price minimum',()=>{
 const app=setup();const link=app.savedPage.querySelector('[data-checkout-link]');assert.ok(link);assert.equal(link.hasAttribute('href'),false);assert.equal(link.getAttribute('aria-disabled'),'true');
});
test('separate checkout page reuses the actual form with a right-hand summary',()=>{
 assert.ok(fs.existsSync(path.join(__dirname,'..','dist','order.html')));
 const app=setup('order');app.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':10}));vm.runInContext("openCheckout('Оформление заказа')",app.context);
 assert.equal(app.document.querySelector('#proto-checkout').tagName,'MAIN');assert.ok(app.document.querySelector('[data-checkout-form]'));
 assert.ok(app.document.querySelector('.proto-order-summary'));assert.ok(app.document.querySelector('#order-delivery'));assert.ok(app.document.querySelector('#order-payment'));
 assert.equal(app.document.querySelector('.proto-order-summary button[type="submit"]').textContent,'Оформить заказ');assert.match(app.document.querySelector('[data-checkout-summary]').textContent,/5\s?000/);
 assert.equal(app.document.querySelector('dialog[open]'),null);
});
test('direct checkout page is blocked for an empty or subminimum cart',()=>{
 assert.ok(fs.existsSync(path.join(__dirname,'..','dist','order.html')));const app=setup('order');
 vm.runInContext("openCheckout('Оформление заказа')",app.context);assert.equal(app.document.querySelector('[data-checkout-form]'),null);assert.match(app.document.querySelector('[data-checkout-page]').textContent,/5\s?000/);
});
test('page submission confirms on the page and the receipt can be reopened without a dialog',()=>{
 const app=setup('order');app.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':10}));vm.runInContext("openCheckout('Оформление заказа')",app.context);
 const form=app.document.querySelector('[data-checkout-form]');
 for(const [name,value]of Object.entries({company:'ООО Тест',taxId:'1234567890',legalAddress:'Тестовый адрес',contact:'Контакт',phone:'+79991234567',email:'test@example.test',carrier:'ТК',city:'Москва'}))form.elements[name].value=value;
 form.elements.correctDetails.checked=true;form.dispatchEvent(new app.window.Event('submit',{bubbles:true,cancelable:true}));
 assert.match(app.document.querySelector('#pagetitle').textContent,/ДЕМО-/);assert.equal(app.document.querySelector('[data-checkout-form]'),null);assert.equal(app.document.querySelector('dialog[open]'),null);
 assert.equal(app.window.PolyarikCheckout.showLastOrder(app.document.querySelector('[data-checkout-page]')),true);assert.match(app.document.querySelector('[data-checkout-summary]').textContent,/5\s?000/);
});
