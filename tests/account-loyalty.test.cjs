const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..','dist');
function account(identity,{signedIn=true}={}){
 const console=new VirtualConsole();
 const {window}=new JSDOM(fs.readFileSync(path.join(root,'account.html'),'utf8'),{url:'http://localhost/account.html?view=bonuses',runScripts:'outside-only',virtualConsole:console});
 if(signedIn)window.localStorage.setItem('polyarik-demo-account','1');
 window.localStorage.setItem('polyarik-loyalty-identity',identity);
 window.eval(fs.readFileSync(path.join(root,'loyalty.js'),'utf8'));
 window.eval(fs.readFileSync(path.join(root,'account.js'),'utf8'));
 return window;
}
test('bonus account uses the same demo balance and marks its history as test data',()=>{
 const window=account('demo');const panel=window.document.querySelector('[data-account-panel="bonuses"]');
 assert.equal(panel.hidden,false);assert.match(panel.querySelector('[data-bonus-balance]').textContent,/1\s?500/);
 assert.equal(panel.querySelector('[data-bonus-demo]').hidden,false);assert.match(panel.querySelector('[data-bonus-history]').textContent,/Тестовое/);
 assert.equal(window.document.querySelector('[data-account-view="bonuses"]').getAttribute('aria-current'),'page');
});
test('presentation sign-in opens the account in one click with no credential dialog',()=>{
 const window=account('demo',{signedIn:false});assert.equal(window.document.querySelector('[data-account-guest]').hidden,false);
 window.document.querySelector('[data-account-open]').click();
 assert.equal(window.sessionStorage.getItem('polyarik-demo-account'),'1');assert.equal(window.document.querySelector('[data-account-layout]').hidden,false);
 assert.equal(window.document.querySelector('[data-demo-login]'),null);assert.equal(window.document.querySelector('#auth-login'),null);assert.equal(window.document.querySelector('#auth-password'),null);
 assert.equal(window.document.querySelector('[data-account-guest]').hidden,true);
 assert.equal(window.PolyarikLoyalty.profile().newCustomer,true);
 assert.equal(window.PolyarikLoyalty.pricing(5000,0,0).total,4750);
 assert.equal(window.document.querySelector('[data-current-order]').hidden,true);
});
test('signing in again does not restore an already used first-order discount',()=>{
 const window=account('new');window.PolyarikLoyalty.completeOrder({bonusSpent:0},'ДЕМО-TEST');
 window.localStorage.removeItem('polyarik-demo-account');window.sessionStorage.removeItem('polyarik-demo-account');
 window.document.querySelector('[data-account-open]').click();assert.equal(window.PolyarikLoyalty.profile().newCustomer,false);
 assert.equal(window.localStorage.getItem('polyarik-loyalty-identity'),'new');
});
test('new profile starts with zero balance and no fictitious cashback credit',()=>{
 const window=account('new');const panel=window.document.querySelector('[data-account-panel="bonuses"]');
 assert.equal(panel.querySelector('[data-bonus-balance]').textContent,'0 ₽');assert.equal(panel.querySelector('[data-bonus-history]').children.length,0);
 assert.match(panel.querySelector('[data-welcome-status]').textContent,/5%/);
});
test('compact account navigation expands and collapses accessibly',()=>{
 const window=account('demo');const button=window.document.querySelector('[data-account-menu-toggle]');const nav=window.document.querySelector('#account-navigation');
 button.click();assert.equal(button.getAttribute('aria-expanded'),'true');assert.equal(nav.classList.contains('proto-account-nav-open'),true);
 button.click();assert.equal(button.getAttribute('aria-expanded'),'false');assert.equal(nav.classList.contains('proto-account-nav-open'),false);
});
