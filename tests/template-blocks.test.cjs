const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');const root=__dirname+'/../dist/';
const products=JSON.parse(fs.readFileSync(root+'products.json','utf8'));
async function setup(file='index',query=''){
 const dom=new JSDOM(fs.readFileSync(root+file+'.html','utf8'),{url:'http://localhost/'+file+'.html'+query,runScripts:'outside-only',virtualConsole:new VirtualConsole()});const w=dom.window;
 w.fetch=async ()=>({json:async()=>products});
 const base=fs.readFileSync(root+'prototype.js','utf8');w.eval('var all=(s,r=document)=>[...r.querySelectorAll(s)];var money=n=>n.toLocaleString("ru-RU")+" ₽";');
 w.eval(base.slice(base.indexOf('function savedElement('),base.indexOf('function savedButton(')));w.eval(base.slice(base.indexOf('function productPath('),base.indexOf('const catalogSorts =')));
 w.eval(fs.readFileSync(root+'template-blocks.js','utf8'));await new Promise(resolve=>setImmediate(resolve));return w;
}
test('recommendations use actual catalog cards and reveal remaining recommendations once',async()=>{
 const w=await setup(),d=w.document,grid=d.querySelector('[data-template-recommendations]');assert.equal(grid.querySelectorAll('.catalog_item').length,7);assert.equal(grid.querySelectorAll('button.to-cart').length,7);
 assert.equal(d.querySelector('[data-recommendations-section]').hidden,true);
 d.querySelector('[data-recommendations-more]').click();assert.equal(d.querySelector('[data-recommendations-section]').hidden,false);assert.equal(grid.querySelectorAll('.catalog_item').length,15);assert.equal(d.querySelector('[data-recommendations-more]').hidden,true);assert.equal(grid.querySelector('.item-title a').getAttribute('href'),'product.html?sku=DEMO-A2');
});
test('native look changes its title, three linked products and detail route together',async()=>{
 const w=await setup(),d=w.document,look=d.querySelector('[data-template-looks]');assert.equal(look.querySelectorAll('.lookbook__items .block-item').length,3);look.querySelector('[data-look-next]').click();assert.equal(look.querySelector('.lookbook__info-title a').textContent,'Образ №2');assert.ok(look.querySelector('.lookbook__items').textContent.includes('DEMO-A29'));for(const a of look.querySelectorAll('a[href*="looks.html?look="]'))assert.equal(new URL(a.href).searchParams.get('look'),'2');
});
test('gallery lists four albums without a season filter and uses the album title as the page heading', async () => {
 const list = (await setup('gallery')).document;
 assert.equal(list.querySelectorAll('.gallery-list__item').length, 4);
 assert.equal(list.querySelector('[data-template-gallery-season]'), null);
 const detail = (await setup('gallery', '?album=4')).document;
 assert.equal(detail.querySelector('#pagetitle').textContent, 'Зима — фотосессия');
 assert.equal(detail.querySelectorAll('.aspro-album-thumbs button').length, 4);
 assert.ok(detail.querySelector('#navigation a[href="gallery.html"]'));
});
