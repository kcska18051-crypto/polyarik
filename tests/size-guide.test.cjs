const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..','dist');
function setup(){
 const {window}=new JSDOM('<main><div id="detail"><div class="properties__item"><div class="properties__title">Размер</div><div class="properties__value">42–44</div></div></div></main>',{runScripts:'outside-only',virtualConsole:new VirtualConsole()});
 const source=path.join(root,'size-guide.js');
 if(fs.existsSync(source))window.eval(fs.readFileSync(source,'utf8'));
 return window;
}
test('headwear guide keeps all ten exact age and size correspondences',()=>{
 const window=setup();assert.ok(window.PolyarikSizeGuide);const detail=window.document.querySelector('#detail');
 window.PolyarikSizeGuide.mount(detail,{catalogSection:'shapki_s_sinteponom',size:'42–44'});
 const rows=[...window.document.querySelectorAll('[data-size-guide] tbody tr')].map(row=>[...row.cells].map(cell=>cell.textContent));
 assert.deepEqual(rows,[['36–38','0–1 мес.'],['38–40','1–3 мес.'],['40–42','3–6 мес.'],['42–44','6–9 мес.'],['44–46','9–12 мес.'],['46–48','1–2 года'],['48–50','2–3 года'],['50–52','3–5 лет'],['52–54','5–7 лет'],['54–56','7–10 лет']]);
});
test('guide opens beside the size and closes with focus returned to the trigger',()=>{
 const window=setup();assert.ok(window.PolyarikSizeGuide);const detail=window.document.querySelector('#detail');
 window.PolyarikSizeGuide.mount(detail,{catalogSection:'shapki_s_sinteponom',size:'42-44'});
 const dialog=window.document.querySelector('[data-size-guide]');dialog.showModal=function(){this.open=true;};dialog.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
 const trigger=detail.querySelector('[data-size-guide-open]');assert.ok(trigger.closest('.properties__item'));trigger.click();assert.equal(dialog.open,true);
 dialog.querySelector('button').click();assert.equal(dialog.open,false);assert.equal(window.document.activeElement,trigger);
});
test('headwear sizing is not displayed for gloves, scarves or teenager-only categories',()=>{
 for(const catalogSection of ['perchatki','sharfy_i_manishki','golovnye_ubory_muzhskie_zhenskie_1']){
 const window=setup();assert.ok(window.PolyarikSizeGuide);window.PolyarikSizeGuide.mount(window.document.querySelector('#detail'),{catalogSection});assert.equal(window.document.querySelector('[data-size-guide-open]'),null);
 }
});
test('mounting twice does not duplicate the guide, and hats without a size can still show it',()=>{
 const window=setup();assert.ok(window.PolyarikSizeGuide);const detail=window.document.querySelector('#detail');detail.replaceChildren();
 for(let n=0;n<2;n++)window.PolyarikSizeGuide.mount(detail,{catalogSection:'shapki_odinarnye'});
 assert.equal(detail.querySelectorAll('[data-size-guide-open]').length,1);assert.equal(window.document.querySelectorAll('[data-size-guide]').length,1);
});
