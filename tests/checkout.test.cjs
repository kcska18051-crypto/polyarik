const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {setup}=require('./cart-fixture.cjs');
function open(app){
 app.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':10}));
 vm.runInContext("renderCart();openCheckout('Оформление заказа')",app.context);
 return app.document.querySelector('[data-checkout-form]');
}
function fill(app,form){
 assert.ok(form,'checkout has a real company form');
 for(const [name,value] of Object.entries({company:'ООО «Тест»',taxId:'7707083893',legalAddress:'Москва, ул. Тестовая, 1',contact:'Тестовый менеджер',phone:'+7 (999) 123-45-67',email:'test@example.test',carrier:'Деловые линии',city:'Москва',insurance:'no'}))form.elements.namedItem(name).value=value;
 form.elements.namedItem('correctDetails').checked=true;
}
function submit(app,form){form.dispatchEvent(new app.window.Event('submit',{bubbles:true,cancelable:true}));}
test('checkout requires company, contacts and transport information',()=>{
 const app=setup();const form=open(app);assert.ok(form);
 for(const field of ['company','taxId','legalAddress','contact','phone','email','carrier','city','correctDetails'])assert.equal(form.elements.namedItem(field).required,true,field);
 submit(app,form);assert.equal(app.window.sessionStorage.getItem('polyarik-last-order'),null);
});
test('valid checkout confirms a snapshot and blocks duplicate submissions',()=>{
 const app=setup();const form=open(app);fill(app,form);submit(app,form);
 const order=JSON.parse(app.window.sessionStorage.getItem('polyarik-last-order'));assert.ok(order);assert.match(order.number,/^ДЕМО-/);
 assert.equal(order.customer.company,'ООО «Тест»');assert.equal(order.items[0].quantity,10);assert.equal(order.pricing.total,5000);
 assert.deepEqual(JSON.parse(app.window.localStorage.getItem('polyarik-cart')),{});
 assert.match(app.document.querySelector('#proto-checkout').textContent,/не отправлен/i);
 submit(app,form);assert.equal(JSON.parse(app.window.sessionStorage.getItem('polyarik-last-order')).number,order.number);
 assert.ok(app.savedPage.querySelector('[data-last-order]'));
});
test('Russia accepts 10 or 12 digits and optional KPP while rejecting malformed tax IDs',()=>{
 const app=setup();const form=open(app);fill(app,form);form.elements.taxId.value='123';submit(app,form);
 assert.equal(app.window.sessionStorage.getItem('polyarik-last-order'),null);assert.equal(form.elements.taxId.validity.valid,false);
});
test('Belarus checkout uses UNP and does not submit a stale Russian KPP',()=>{
 const app=setup();const form=open(app);fill(app,form);form.elements.kpp.value='123456789';form.elements.country.value='BY';form.elements.country.dispatchEvent(new app.window.Event('change'));
 form.elements.taxId.value='190000001';form.elements.phone.value='+375 29 123 45 67';submit(app,form);
 const order=JSON.parse(app.window.sessionStorage.getItem('polyarik-last-order'));assert.equal(order.customer.country,'BY');assert.equal(order.customer.taxId,'190000001');assert.equal(order.customer.kpp,'');
});
test('invalid email and short phone cannot create a confirmation',()=>{
 const app=setup();const form=open(app);fill(app,form);form.elements.phone.value='123';form.elements.email.value='invalid';submit(app,form);
 assert.equal(app.window.sessionStorage.getItem('polyarik-last-order'),null);
});
test('a changed basket refreshes totals and requires another confirmation',()=>{
 const app=setup();const form=open(app);fill(app,form);app.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':20}));submit(app,form);
 assert.equal(app.window.sessionStorage.getItem('polyarik-last-order'),null);assert.match(form.querySelector('[role="status"]').textContent,/изменил/i);
 submit(app,form);assert.equal(JSON.parse(app.window.sessionStorage.getItem('polyarik-last-order')).pricing.total,10000);
});
test('checkout cannot be confirmed after cart falls below minimum',()=>{
 const app=setup();const form=open(app);fill(app,form);app.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':9}));submit(app,form);
 assert.equal(app.window.sessionStorage.getItem('polyarik-last-order'),null);
});
test('confirmed demo order spends bonuses once and ends first-order eligibility',()=>{
 const app=setup();app.window.localStorage.setItem('polyarik-demo-account','1');app.window.localStorage.setItem('polyarik-loyalty-identity','new');
 app.window.localStorage.setItem('polyarik-loyalty-new',JSON.stringify({newCustomer:true,balance:2000,history:[]}));app.window.sessionStorage.setItem('polyarik-bonus-requested','500');
 const form=open(app);fill(app,form);submit(app,form);submit(app,form);
 const profile=JSON.parse(app.window.localStorage.getItem('polyarik-loyalty-new'));assert.equal(profile.balance,1500);assert.equal(profile.newCustomer,false);assert.equal(profile.history.length,1);assert.equal(profile.history[0].amount,-500);
 const order=JSON.parse(app.window.sessionStorage.getItem('polyarik-last-order'));assert.equal(order.pricing.welcomeRate,0);assert.equal(order.pricing.total,4500);
});
test('closing and reopening retains the draft without creating an order',()=>{
 const app=setup();const form=open(app);fill(app,form);form.elements.company.dispatchEvent(new app.window.Event('input',{bubbles:true}));
 vm.runInContext("openCheckout('Оформление заказа')",app.context);
 assert.equal(app.document.querySelector('[data-checkout-form]').elements.company.value,'ООО «Тест»');assert.equal(app.window.sessionStorage.getItem('polyarik-last-order'),null);
});
test('company and comments render as text, and delivery is not assigned a fake price',()=>{
 const app=setup();const form=open(app);fill(app,form);form.elements.company.value='<img src=x onerror="alert(1)">';submit(app,form);
 const dialog=app.document.querySelector('#proto-checkout');assert.equal(dialog.querySelector('img'),null);assert.match(dialog.textContent,/<img src=x/);assert.match(dialog.textContent,/Доставка: согласуется индивидуально/);
});
test('failed storage rolls back bonus debit and preserves the basket and previous receipt',()=>{
 const app=setup();app.window.localStorage.setItem('polyarik-demo-account','1');app.window.localStorage.setItem('polyarik-loyalty-identity','new');
 app.window.localStorage.setItem('polyarik-loyalty-new',JSON.stringify({newCustomer:true,balance:2000,history:[]}));app.window.sessionStorage.setItem('polyarik-bonus-requested','500');
 const form=open(app);fill(app,form);app.window.sessionStorage.setItem('polyarik-last-order','{"number":"previous"}');
 const proto=Object.getPrototypeOf(app.window.localStorage);const original=proto.setItem;
 proto.setItem=function(key,value){if(key==='polyarik-cart' && value==='{}')throw new Error('storage unavailable');return original.call(this,key,value);};
 try {submit(app,form);} finally {proto.setItem=original;}
 const profile=JSON.parse(app.window.localStorage.getItem('polyarik-loyalty-new'));assert.equal(profile.balance,2000);assert.equal(profile.newCustomer,true);
 assert.equal(JSON.parse(app.window.localStorage.getItem('polyarik-cart'))['DEMO-A1'],10);assert.equal(JSON.parse(app.window.sessionStorage.getItem('polyarik-last-order')).number,'previous');
 assert.match(form.querySelector('[role="status"]').textContent,/Не удалось/);
});
