const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..','dist');
function setup(sku='D-06-64',hash=''){
 const {window}=new JSDOM(fs.readFileSync(path.join(root,'product.html'),'utf8'),{url:'http://localhost/product.html?sku='+sku+hash,runScripts:'outside-only',virtualConsole:new VirtualConsole()});
 window.HTMLElement.prototype.scrollIntoView=function(){};
 const file=path.join(root,'product-tabs.js');if(fs.existsSync(file))window.eval(fs.readFileSync(file,'utf8'));
 assert.ok(window.PolyarikProductTabs,'product tabs module exists');window.PolyarikProductTabs.mount({id:sku});return window;
}
const strips=w=>[...w.document.querySelectorAll('.js-store-scroll > .tabs.arrow_scroll, .product-item-detail-tabs-wrapper')];
test('both product tab strips contain exactly five requested sections',()=>{
 const w=setup();for(const strip of strips(w))assert.deepEqual([...strip.querySelectorAll('ul.nav-tabs > li > a')].map(a=>a.textContent.trim()),['Описание','Отзывы','Как купить','Оплата','Доставка']);
 assert.equal(w.document.querySelector('#stores'),null);assert.equal(w.document.querySelector('#custom_tab'),null);
});
test('every tab switches the local panel without losing the SKU and synchronizes both strips',()=>{
 const w=setup();for(const id of ['reviews','buy','payment','delivery','desc']){
 strips(w)[0].querySelector('a[href="#'+id+'"]').click();assert.equal(w.location.search,'?sku=D-06-64');assert.equal(w.document.querySelector('#'+id).hidden,false);
 for(const strip of strips(w))assert.equal(strip.querySelector('[aria-selected="true"]').getAttribute('href'),'#'+id);
 assert.equal(w.document.querySelectorAll('.js-store-scroll > .tab-content > .tab-pane:not([hidden])').length,1);
 }
});
test('payment and delivery reflect bank transfer and individually agreed carrier terms',()=>{
 const w=setup();assert.match(w.document.querySelector('#payment').textContent,/расчётный счёт/);assert.match(w.document.querySelector('#delivery').textContent,/индивидуально/);assert.match(w.document.querySelector('#buy').textContent,/5\s?000/);
 const shortcut=w.document.querySelector('.calculate-delivery a');assert.ok(shortcut);shortcut.click();assert.equal(w.document.querySelector('#delivery').hidden,false);
});
test('deep links and keyboard navigation select the correct tab',()=>{
 const w=setup('D-06-64','#delivery');assert.equal(w.document.querySelector('#delivery').hidden,false);
 const link=strips(w)[0].querySelector('a[href="#delivery"]');link.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));assert.equal(w.document.querySelector('#desc').hidden,false);
});
test('review form saves escaped demo text per SKU and does not claim publication',()=>{
 const w=setup();w.document.querySelector('[data-review-open]').click();const form=w.document.querySelector('[data-review-form]');assert.equal(form.hidden,false);
 form.elements.author.value='<img src=x onerror=alert(1)>';form.elements.rating.value='4';form.elements.review.value='Тестовый отзыв о товаре';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const cards=w.document.querySelector('[data-review-list]');assert.equal(cards.querySelector('img'),null);assert.match(cards.textContent,/<img src=x/);assert.match(cards.textContent,/Тестовый отзыв/);assert.match(w.document.querySelector('[data-review-status]').textContent,/не опубликован/);
 assert.equal(JSON.parse(w.sessionStorage.getItem('polyarik-reviews-D-06-64')).length,1);assert.equal(w.sessionStorage.getItem('polyarik-reviews-D-06-63'),null);
});
