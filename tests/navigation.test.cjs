const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM, VirtualConsole} = require('jsdom');
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => { if (error.type !== 'css-parsing') throw error; });
const root = path.join(__dirname, '..', 'dist');
const source = fs.readFileSync(path.join(root, 'prototype.js'), 'utf8');

test('viewed product images and names open the same product on every page', () => {
  const errors = [];
  for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
    const document = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'), {virtualConsole}).window.document;
    for (const card of document.querySelectorAll('.viewed-wrapper .swiper-slide')) {
      const title = card.querySelector('.block-item__title a');
      const image = card.querySelector('a.thumb');
      if (title && image && image.getAttribute('href') !== title.getAttribute('href')) {
        errors.push(file + ': ' + image.getAttribute('href') + ' != ' + title.getAttribute('href'));
      }
    }
  }
  assert.deepEqual(errors, []);
});

test('product breadcrumb separators alternate with items and schema positions are sequential', () => {
  const document = new JSDOM(fs.readFileSync(path.join(root, 'product.html'), 'utf8'), {virtualConsole}).window.document;
  const context = vm.createContext({document, URLSearchParams});
  // Run the actual navigation functions against the original page DOM.
  vm.runInContext(source.slice(source.indexOf('function findCatalogSection('), source.indexOf('function usesProductListing(')), context);
  vm.runInContext(source.slice(source.indexOf('function renderProductBreadcrumbs('), source.indexOf('function renderProductGallery(')), context);
  vm.runInContext(source.slice(source.indexOf('function savedElement('), source.indexOf('function savedButton(')), context);
  vm.runInContext('const all=(s,r=document)=>Array.from(r.querySelectorAll(s));', context);
  context.tree = JSON.parse(fs.readFileSync(path.join(root, 'catalog-tree.json'), 'utf8'));
  context.product = JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8'))[0];
  vm.runInContext('renderProductBreadcrumbs(tree, product)', context);
  const crumbs = [...document.querySelector('#navigation .breadcrumbs').children];
  assert.equal(crumbs.filter(node => node.classList.contains('breadcrumbs__separator')).length,
    crumbs.filter(node => node.classList.contains('breadcrumbs__item')).length - 1);
  assert.ok(crumbs.every((node, i) => node.classList.contains(i % 2 ? 'breadcrumbs__separator' : 'breadcrumbs__item')));
  const items = crumbs.filter(node => node.classList.contains('breadcrumbs__item'));
  assert.deepEqual(items.map(node => node.querySelector('meta[itemprop="position"]')?.content), items.map((_, i) => String(i + 1)));
});
