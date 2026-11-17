const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const {setup}=require('./cart-fixture.cjs');
function app(){const a=setup('order');a.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':10}));vm.runInContext("openCheckout('Оформление заказа')",a.context);return a;}
function change(a,input,value){input.value=value;input.dispatchEvent(new a.window.Event('change',{bubbles:true}));}
test('carrier dropdown exposes the requested carriers and a conditional other field',()=>{
 const a=app();const f=a.document.querySelector('form[data-checkout-form]');assert.equal(f.elements.carrier.tagName,'SELECT');
 for(const name of ['СДЭК','ПЭК','Деловые линии','Ozon','Другой способ'])assert.ok([...f.elements.carrier.options].some(o=>o.textContent===name));
 assert.equal(f.elements.carrierOther.disabled,true);change(a,f.elements.carrier,'other');assert.equal(f.elements.carrierOther.disabled,false);assert.equal(f.elements.carrierOther.required,true);
 change(a,f.elements.carrier,'ПЭК');assert.equal(f.elements.carrierOther.disabled,true);
});
test('insurance requires an explicit yes or no, and alternate recipient fields are conditional',()=>{
 const a=app();const f=a.document.querySelector('[data-checkout-form]');assert.equal(f.elements.insurance.required,true);assert.equal(f.elements.insurance.value,'');
 assert.equal(f.elements.receiverSurname.disabled,true);change(a,f.elements.recipientType,'other');for(const name of ['receiverSurname','receiverName','receiverPhone']){assert.equal(f.elements[name].required,true);assert.equal(f.elements[name].disabled,false);}
 change(a,f.elements.recipientType,'contact');assert.equal(f.elements.receiverPhone.disabled,true);
});
test('confirmation preserves custom carrier, insurance and other recipient',()=>{
 const a=app();const f=a.document.querySelector('[data-checkout-form]');change(a,f.elements.carrier,'other');change(a,f.elements.recipientType,'other');
 for(const [key,value]of Object.entries({company:'ООО Тест',taxId:'1234567890',legalAddress:'Тестовый адрес',contact:'Заказчик',phone:'+79991234567',email:'test@example.test',city:'Москва',carrierOther:'Моя ТК',insurance:'yes',receiverSurname:'Иванов',receiverName:'Иван',receiverPatronymic:'Иванович',receiverPhone:'+79997654321'}))f.elements[key].value=value;
 f.elements.correctDetails.checked=true;f.dispatchEvent(new a.window.Event('submit',{bubbles:true,cancelable:true}));const order=JSON.parse(a.window.sessionStorage.getItem('polyarik-last-order'));assert.ok(order);assert.equal(order.customer.carrierName,'Моя ТК');assert.equal(order.customer.insurance,'yes');assert.equal(order.customer.recipientName,'Иванов Иван Иванович');assert.equal(order.customer.recipientPhone,'+79997654321');
 assert.match(a.document.querySelector('.proto-checkout-receipt').textContent,/СтраховкаНужна/);
});
test('header reports minimum and current payable cart value, including empty basket',()=>{
 const a=setup();a.context.cartLinks.push(...a.document.querySelectorAll('#header [data-cart-link]'));vm.runInContext('renderCart()',a.context);
 const summary=a.document.querySelector('.proto-header-cart-summary');assert.ok(summary);assert.match(summary.textContent,/5\s?000/);assert.match(summary.textContent,/500 ₽/);
 a.window.localStorage.setItem('polyarik-cart','{}');vm.runInContext('renderCart()',a.context);assert.match(summary.textContent,/0 ₽/);
});
