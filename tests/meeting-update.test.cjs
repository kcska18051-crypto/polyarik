const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=__dirname+'/../dist/';
function doc(file){return new JSDOM(fs.readFileSync(root+file+'.html','utf8'),{url:'http://localhost/'+file+'.html',runScripts:'outside-only',virtualConsole:new VirtualConsole()});}
test('shared desktop navigation has eight agreed sections and no comparison links on every page',()=>{
 for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){const d=doc(file.replace('.html','')).window.document;const nav=d.querySelector('#header .menu-row .table-menu > table > tbody > tr');assert.equal(nav.children.length,8,file);assert.equal(d.querySelector('a[href="compare.html"]'),null,file);assert.ok(nav.textContent.includes('Спецпредложения'));assert.ok(nav.textContent.includes('Галерея'));assert.equal(d.querySelector('.proto-header-search input').placeholder,'Поиск по каталогу');assert.ok(d.querySelector('#header a[href="tel:+79250645525"]'));}
});
test('specials are four separate selections and hats contain helmets and knit hats',()=>{
 const d=doc('specials').window.document;assert.deepEqual([...d.querySelectorAll('.polyarik-offers-list a')].map(a=>new URL(a.href).searchParams.get('offer')),['new','50','100','150']);
 const tree=JSON.parse(fs.readFileSync(root+'catalog-tree.json'));const hats=tree[0].children.find(n=>n.name==='Шапки');assert.ok(hats.children.some(n=>n.slug==='shlemy'));assert.ok(hats.children.some(n=>n.slug==='shapki_trikotazhnye'));const summer=tree[0].children.find(n=>n.name==='Летние головные уборы');assert.equal(summer.children.some(n=>n.slug==='shlemy'),false);
});
test('profile delivery preference validates custom carrier and keeps optional tariff',()=>{
 const dom=doc('account'),w=dom.window;w.eval(fs.readFileSync(root+'loyalty.js','utf8'));w.eval(fs.readFileSync(root+'site-update.js','utf8'));
 const f=w.document.querySelector('[data-delivery-preferences]');assert.ok(f);assert.equal(f.elements.tariff.required,false);f.elements.carrier.value='other';f.elements.carrier.dispatchEvent(new w.Event('change'));assert.equal(f.elements.carrierOther.required,true);f.elements.carrierOther.value='Моя ТК';f.elements.tariff.value='Нужный тариф';f.dispatchEvent(new w.Event('submit',{cancelable:true}));assert.deepEqual(JSON.parse(w.sessionStorage.getItem('polyarik-delivery-preferences')),{carrier:'other',carrierOther:'Моя ТК',tariff:'Нужный тариф'});
});
test('local moderation approves, edits back to pending and deletes a review',()=>{
 const dom=doc('moderation'),w=dom.window,key='polyarik-reviews-DEMO-A1';w.sessionStorage.setItem(key,JSON.stringify([{author:'Покупатель',review:'Отзыв',rating:5,approved:false}]));w.eval(fs.readFileSync(root+'site-update.js','utf8'));const click=text=>[...w.document.querySelectorAll('[data-moderation] button')].find(x=>x.textContent===text).click();
 click('Опубликовать');assert.equal(JSON.parse(w.sessionStorage.getItem(key))[0].approved,true);w.document.querySelector('textarea').value='Исправленный отзыв';click('Сохранить правки');assert.equal(JSON.parse(w.sessionStorage.getItem(key))[0].approved,false);assert.equal(JSON.parse(w.sessionStorage.getItem(key))[0].review,'Исправленный отзыв');click('Удалить');assert.deepEqual(JSON.parse(w.sessionStorage.getItem(key)),[]);
});
test('all local HTML routes resolve to existing pages',()=>{
 const errors=[];for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){const d=doc(file.replace('.html','')).window.document;for(const a of d.querySelectorAll('a[href]')){const path=a.getAttribute('href').split(/[?#]/)[0];if(path.endsWith('.html')&&!path.includes('://')&&!fs.existsSync(root+path))errors.push(file+': '+path);}}assert.deepEqual(errors,[]);
});
