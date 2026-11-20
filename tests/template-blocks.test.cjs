const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');const root=__dirname+'/../dist/';
const products=JSON.parse(fs.readFileSync(root+'products.json','utf8'));
async function setup(file='index',query=''){
 const dom=new JSDOM(fs.readFileSync(root+file+'.html','utf8'),{url:'http://localhost/'+file+'.html'+query,runScripts:'outside-only',virtualConsole:new VirtualConsole()});const w=dom.window;
 w.fetch=async url=>({json:async()=>url.startsWith('products')?products:JSON.parse(fs.readFileSync(root+'publications.json','utf8'))});
 const base=fs.readFileSync(root+'prototype.js','utf8');w.eval('var all=(s,r=document)=>[...r.querySelectorAll(s)];var money=n=>n.toLocaleString("ru-RU")+" ₽";');
 w.eval(base.slice(base.indexOf('function savedElement('),base.indexOf('function savedButton(')));w.eval(base.slice(base.indexOf('function productPath('),base.indexOf('const catalogSorts =')));
 w.eval(fs.readFileSync(root+'template-blocks.js','utf8'));await new Promise(resolve=>setImmediate(resolve));return w;
}
test('recommendations use actual catalog cards and reveal remaining recommendations once',async()=>{
 const w=await setup(),d=w.document,grid=d.querySelector('[data-template-recommendations]');assert.equal(grid.querySelectorAll('.catalog_item').length,8);assert.equal(grid.querySelectorAll('button.to-cart').length,8);
 d.querySelector('[data-recommendations-more]').click();assert.equal(grid.querySelectorAll('.catalog_item').length,12);assert.equal(d.querySelector('[data-recommendations-more]').hidden,true);assert.equal(grid.querySelector('.item-title a').getAttribute('href'),'product.html?sku=DEMO-A2');
});
test('native look changes its title, three linked products and detail route together',async()=>{
 const w=await setup(),d=w.document,look=d.querySelector('[data-template-looks]');assert.equal(look.querySelectorAll('.lookbook__items .block-item').length,3);look.querySelector('[data-look-next]').click();assert.equal(look.querySelector('.lookbook__info-title a').textContent,'Образ №2');assert.ok(look.querySelector('.lookbook__items').textContent.includes('DEMO-A29'));for(const a of look.querySelectorAll('a[href*="looks.html?look="]'))assert.equal(new URL(a.href).searchParams.get('look'),'2');
});
test('gallery has four native albums and selected season leaves one visible',async()=>{
 const w=await setup('gallery'),d=w.document;assert.equal(d.querySelectorAll('.gallery-list__item').length,4);const select=d.querySelector('[data-template-gallery-season]');select.value='Зима';select.dispatchEvent(new w.Event('change'));assert.equal([...d.querySelectorAll('[data-album]')].filter(x=>!x.hidden).length,1);
});
test('publication detail uses the selected real entry and keeps an archive link',async()=>{
 const w=await setup('publications','?article=shipping'),d=w.document;assert.ok(d.querySelector('.aspro-article-detail').textContent.includes('Стоимость и сроки согласуются с менеджером'));assert.equal(d.querySelector('.aspro-article-detail a').getAttribute('href'),'publications.html');
});
