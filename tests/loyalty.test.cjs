const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {setup}=require('./cart-fixture.cjs');
function price(app,qty,{fresh=true,balance=0,promo=false,requested=0}={}){
 app.window.localStorage.setItem('polyarik-demo-account','1');
 app.window.localStorage.setItem('polyarik-loyalty-identity','new');
 app.window.localStorage.setItem('polyarik-loyalty-new',JSON.stringify({newCustomer:fresh,balance,history:[]}));
 app.window.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':qty}));
 app.window.sessionStorage.setItem('polyarik-bonus-requested',String(requested));
 if(promo)app.window.sessionStorage.setItem('polyarik-cart-promo','DEMO10');
 vm.runInContext('renderCart()',app.context);
 return vm.runInContext('cartPricing()',app.context);
}
test('new customer receives 5%, with the better of welcome and volume plus coupon',()=>{
 const app=setup();let p=price(app,10);assert.equal(p.rate,5);assert.equal(p.total,4750);
 p=price(app,60);assert.equal(p.rate,5);assert.equal(p.volumeRate,0);assert.equal(p.welcomeRate,5);
 p=price(app,200);assert.equal(p.rate,7);assert.equal(p.welcomeRate,0);
 p=price(app,60,{promo:true});assert.equal(p.rate,12);assert.equal(p.total,26400);
});
test('returning customers do not receive the first-order discount',()=>{
 const app=setup();const p=price(app,10,{fresh:false});assert.equal(p.rate,0);assert.equal(p.total,5000);
});
test('bonus spend is capped at 30% of discounted goods and available balance',()=>{
 const app=setup();let p=price(app,10,{balance:5000,requested:5000});assert.equal(p.bonusSpent,1425);assert.equal(p.total,3325);
 p=price(app,10,{balance:700,requested:5000});assert.equal(p.bonusSpent,700);assert.equal(p.total,4050);
 assert.match(app.savedPage.textContent,/бонус/i);
});
test('bonus request is recalculated after reducing quantity and cannot bypass the minimum',()=>{
 const app=setup();price(app,20,{balance:5000,requested:5000});
 const p=price(app,9,{balance:5000,requested:5000});assert.equal(p.bonusSpent,1282);assert.equal(p.total,2993);
 const checkout=app.document.querySelector('[data-checkout-link]');assert.equal(checkout.getAttribute('aria-disabled'),'true');assert.equal(checkout.hasAttribute('href'),false);
});
test('invalid bonus requests do not increase the total or spend fractional rubles',()=>{
 for(const requested of [-20,'oops',Infinity]){const app=setup();assert.equal(price(app,10,{balance:2000,requested}).bonusSpent,0);}
 const app=setup();assert.equal(price(app,10,{balance:2000,requested:100.9}).bonusSpent,100);
});
test('checkout shows welcome and bonus breakdown without consuming first-order status or balance',()=>{
 const app=setup();price(app,10,{balance:5000,requested:5000});
 [...app.document.querySelectorAll('.proto-cart-summary button')].find(x=>/1 клик/.test(x.textContent)).click();
 const dialog=app.document.querySelector('#proto-checkout');assert.match(dialog.textContent,/первый заказ/i);assert.match(dialog.textContent,/1\s?425/);
 const profile=JSON.parse(app.window.localStorage.getItem('polyarik-loyalty-new'));assert.equal(profile.balance,5000);assert.equal(profile.newCustomer,true);
});
