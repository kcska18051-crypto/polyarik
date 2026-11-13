const {test}=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./cart-fixture.cjs');
function cart(app,quantity,promo=false){
 app.context.localStorage.setItem('polyarik-cart',JSON.stringify({'DEMO-A1':quantity}));
 if(promo)app.context.sessionStorage.setItem('polyarik-cart-promo','DEMO10');
 else app.context.sessionStorage.removeItem('polyarik-cart-promo');
 require('node:vm').runInContext('renderCart()',app.context);
}
const text=n=>n.textContent.replace(/\u00a0/g,' ');
for(const [quantity,expected] of [[59,29500],[60,29400],[99,48510],[100,48500],[199,96515],[200,93000],[299,139035],[300,132000]]){
 test('volume discount boundary at '+quantity*500+' rubles',()=>{
  const app=setup();cart(app,quantity);
  const actual=Number(text(app.document.querySelector('.proto-saved-total')).replace(/[^\d.,]/g,'').replace(',','.'));
  assert.equal(actual,expected);
  assert.equal(text(app.document.querySelector('.proto-cart-amount strong')),text(app.document.querySelector('.proto-saved-total')));
 });
}
test('volume discount and promo are added on the original subtotal',()=>{
 const app=setup();cart(app,200,true);
 assert.equal(text(app.document.querySelector('.proto-saved-total')),'83 000 ₽');
 assert.equal(text(app.document.querySelector('.proto-cart-quantity .muted')),'415 ₽ / упак.');
 assert.match(app.savedPage.textContent,/7%/);assert.match(app.savedPage.textContent,/10%/);
});
test('both checkout paths are blocked below 5000 before discounts',()=>{
 const app=setup();cart(app,9);
 const buttons=[...app.document.querySelectorAll('.proto-cart-summary button')].filter(b=>/оформлению|1 клик/i.test(b.textContent));
 assert.equal(buttons.length,2);assert.ok(buttons.every(b=>b.disabled));
 assert.match(text(app.savedPage),/500 ₽/);
 require('node:vm').runInContext("openCheckout('Оформление заказа', 999999)",app.context);
 assert.equal(app.document.querySelector('#proto-checkout').open,false);
});
test('5000 before discounts permits checkout even if discounted total is 4500',()=>{
 const app=setup();cart(app,10,true);
 const button=[...app.document.querySelectorAll('.proto-cart-summary button')].find(b=>/оформлению/i.test(b.textContent));
 assert.equal(button.disabled,false);button.click();
 const dialog=app.document.querySelector('#proto-checkout');
 assert.equal(dialog.open,true);assert.match(text(dialog),/4 500 ₽/);
 assert.equal(dialog.querySelectorAll('.proto-discount-scale li').length,4);
 assert.match(text(dialog),/расчётный счёт/);assert.match(text(dialog),/индивидуально/);
});
test('discount scale marks the current tier in cart and checkout',()=>{
 const app=setup();cart(app,100);
 const selected=app.document.querySelector('.proto-discount-scale [aria-current="step"]');
 assert.match(text(selected),/3%/);
 [...app.document.querySelectorAll('.proto-cart-summary button')].find(b=>/оформлению/i.test(b.textContent)).click();
 assert.match(text(app.document.querySelector('#proto-checkout [aria-current="step"]')),/3%/);
});

test('removing a promo preserves the volume discount and lowering quantity resets its tier',()=>{
 const app=setup();cart(app,100,true);
 app.document.querySelector('[data-cart-promo-button]').click();
 assert.equal(text(app.document.querySelector('.proto-saved-total')),'48 500 ₽');
 const input=app.document.querySelector('.proto-cart-row input');
 input.value='9';input.dispatchEvent(new app.window.Event('change'));
 assert.equal(text(app.document.querySelector('.proto-saved-total')),'4 500 ₽');
 assert.equal(app.document.querySelector('.proto-discount-scale [aria-current]'),null);
 const button=[...app.document.querySelectorAll('.proto-cart-summary button')].find(b=>/оформлению/i.test(b.textContent));
 assert.equal(button.disabled,true);
});
