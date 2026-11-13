const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.join(__dirname, '..', 'dist');
const source = fs.readFileSync(path.join(root, 'prototype.js'), 'utf8');
function setup() {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => { if (error.type !== 'css-parsing') throw error; });
  const {window} = new JSDOM(fs.readFileSync(path.join(root, 'cart.html'), 'utf8'), {url:'http://localhost/cart.html', virtualConsole});
  const {document, localStorage, sessionStorage} = window;
  const products = JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8'));
  const savedPage = document.querySelector('[data-saved-page]');
  const context = vm.createContext({document, localStorage, sessionStorage, URLSearchParams, products, savedPage, cartLinks:[]});
  vm.runInContext('const all=(s,r=document)=>Array.from(r.querySelectorAll(s));', context);
  vm.runInContext(source.slice(source.indexOf('function readCart('), source.indexOf('function renderPack(')), context);
  vm.runInContext(source.slice(source.indexOf("const cartPromoCode ="), source.indexOf("addEventListener('storage'")), context);
  localStorage.setItem('polyarik-cart', JSON.stringify({'DEMO-A1':1}));
  vm.runInContext('renderCart()', context);
  document.querySelector('#proto-checkout').showModal = function() { this.setAttribute('open', ''); };
  return {window, document, savedPage, context};
}

module.exports = {setup};
