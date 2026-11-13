(()=>{
const all=(s,r=document)=>Array.from(r.querySelectorAll(s));
const params = new URLSearchParams(location.search);
const sharedRainSection = 'perchatki_i_varezhki_iz_plashchevki';
const rainMittens = 'varezhki_iz_plashchevki';
function updateRainMittensSection(query) {
  if (query.get('section') === sharedRainSection && query.get('title') === 'Варежки из плащевки') {
    query.set('section', rainMittens);
    return true;
  }
  return false;
}
const isCategoryPage = /\/category(?:\.html)?$/.test(location.pathname);
const catalogRoot = document.querySelector('.proto-products-page .catalog_block.items');
const needsCatalogTree = catalogRoot || isCategoryPage || document.querySelector('a[href^="category.html?section="]');
const catalogTree = needsCatalogTree
  ? fetch('catalog-tree.json').then(response => response.json())
  : Promise.resolve([]);

function findCatalogSection(nodes, slug) {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const child = findCatalogSection(node.children, slug);
    if (child) return child;
  }
}

function usesProductListing(section) {
  return !section.children.length || section.slug === 'shapki_vyazannye';
}

function sectionRoute(section, query) {
  return (usesProductListing(section) ? 'products.html' : 'category.html') + '?' + query;
}

function normalizeCatalogRoutes(tree) {
  for (const link of all('a[href^="category.html?section="], a[href^="products.html?section="]')) {
    const query = new URL(link.href).searchParams;
    const updated = updateRainMittensSection(query);
    const section = findCatalogSection(tree, query.get('section'));
    if (updated || (section && usesProductListing(section))) link.href = 'products.html?' + query;
  }
  if (updateRainMittensSection(params)) history.replaceState(null, '', '?' + params + location.hash);
  if (!isCategoryPage) return;
  const section = params.has('section') ? findCatalogSection(tree, params.get('section')) : tree[0];
  if (!section) return;
  if (usesProductListing(section)) {
    location.replace(sectionRoute(section, params) + location.hash);
    return;
  }
  const row = document.querySelector('.proto-category-row');
  const sample = row?.querySelector('.section-compact-list__item');
  if (!sample) return;
  row.replaceChildren(...section.children.map(child => {
    const item = sample.cloneNode(true);
    item.querySelector('.section-compact-list__link').textContent = child.name;
    const query = new URLSearchParams({section: child.slug, title: child.name});
    const href = 'products.html?' + query;
    all('a', item).forEach(link => { link.href = href; });
    return item;
  }));
  document.querySelector('#pagetitle').textContent = section.name;
  document.title = section.name + ' — Полярик';
  const crumb = all('#navigation .breadcrumbs > .breadcrumbs__item').at(-1)?.querySelector('.breadcrumbs__item-name');
  if (crumb) crumb.textContent = section.name;
}

catalogTree.then(normalizeCatalogRoutes);
const productDetail = document.querySelector('.product-container');

let products = [];
const catalogSection = params.get('section');
const catalogQuery = params.get('q')?.trim() || '';
fetch('products.json?v=5').then(response => response.json()).then(data => {
  products = data;
  renderCart();
  renderSavedList();
  if (catalogRoot) {
    catalogTree.then(renderCatalog);
  }
  if (productDetail) {
    const sku = params.get('sku');
    const requested = Number(params.get('item'));
    const index = sku !== null
      ? products.findIndex(product => product.id === sku)
      : Number.isInteger(requested) && requested >= 0 && requested < 4 ? requested : 0;
    if (products[index]) {
      productDetail.dataset.product = index;
      renderProductDetails(productDetail, products[index]);
      catalogTree.then(tree => renderProductBreadcrumbs(tree, products[index]));
    } else {
      const heading = 'Товар не найден';
      document.querySelector('#pagetitle').textContent = heading;
      document.title = heading + ' — Полярик';
      const link = savedElement('a', '', 'Перейти в каталог');
      link.href = 'catalog.html';
      productDetail.closest('.wide_page').replaceChildren(link);
      document.querySelector('#navigation').hidden = true;
      document.querySelector('#headerfixed .ajax-head-row')?.remove();
      document.querySelector('.product-item-detail-tabs-container-fixed')?.remove();
    }
  }
  renderRelated();
  renderOffer();
});

function renderProductBreadcrumbs(tree, product) {
  const section = findCatalogSection(tree, product.catalogSection);
  const crumbs = document.querySelector('#navigation .breadcrumbs');
  const items = all('.breadcrumbs__item', crumbs);
  const current = items.at(-1);
  current.querySelector('.breadcrumbs__item-name').textContent = product.name;
  for (const item of items.slice(2, -1)) item.remove();
  if (!section) return;
  const item = items[2];
  const link = savedElement('a', 'breadcrumbs__link font_xs', section.name);
  link.href = 'products.html?' + new URLSearchParams({section: section.slug, title: section.name});
  item.replaceChildren(link);
  current.before(item);
}

function renderProductGallery(gallery, product) {
  const photos = product.photos.length ? product.photos : ['assets/news/placeholder.svg'];
  const image = gallery.querySelector('.proto-detail-image');
  const thumbnails = gallery.querySelector('.proto-detail-thumbnails');
  image.src = photos[0];
  image.alt = product.name;
  if (photos.length < 2) return;
  photos.forEach((src, index) => {
    const thumb = savedElement('img');
    thumb.src = src;
    thumb.alt = '';
    const button = savedButton('', '', () => {
      image.src = src;
      for (const item of thumbnails.children) item.setAttribute('aria-pressed', String(item === button));
    }, 'Фото ' + (index + 1));
    button.type = 'button';
    button.setAttribute('aria-pressed', String(index === 0));
    button.append(thumb);
    thumbnails.append(button);
  });
  thumbnails.hidden = false;
}

function renderProductDetails(detail, product) {
  document.querySelector('#pagetitle').textContent = product.name;
  document.title = product.name + ' — Полярик';
  renderProductGallery(detail.querySelector('.product-detail-gallery'), product);
  const properties = {
    Артикул: product.id,
    Пол: product.sex,
    Состав: product.material,
    Подклад: product.lining,
    Сезон: product.season,
    Размер: product.size,
    Возраст: product.age,
  };
  for (const row of all('.properties__item', detail)) {
    const title = row.querySelector('.properties__title')?.textContent.trim();
    const value = row.querySelector('.properties__value');
    if (!value || !Object.hasOwn(properties, title)) continue;
    if (properties[title]) value.textContent = properties[title];
    else row.remove();
  }
  const fixed = document.querySelector('#headerfixed .ajax-head-row');
  const availability = product.unavailable ? 'Нет в наличии' : 'В наличии';
  for (const container of [detail, fixed].filter(Boolean)) {
    for (const price of all('.price_value', container)) price.textContent = product.price.toLocaleString('ru-RU');
    for (const pack of all('.bonus-system-block', container)) renderPack(pack, product);
    for (const stock of all('.item-stock .value', container)) stock.textContent = availability;
  }
  if (fixed) {
    fixed.dataset.product = detail.dataset.product;
    fixed.querySelector('.item-title').textContent = product.name;
    fixed.querySelector('.item-foto img').src = product.photos[0] || 'assets/news/placeholder.svg';
    fixed.querySelector('.item-sku')?.remove();
    const buy = fixed.querySelector('.item-buttons');
    const target = detail.querySelector('.to-cart');
    if (product.unavailable || !target) buy?.remove();
    else if (buy) {
      const link = savedElement('a', 'btn btn-default btn-sm', 'К покупке');
      target.id = 'product-buy';
      link.href = '#product-buy';
      buy.replaceChildren(link);
    }
  }
  const metadata = {name: product.name, sku: product.id, price: product.price};
  for (const [key, value] of Object.entries(metadata)) {
    const meta = detail.querySelector('meta[itemprop="' + key + '"]');
    if (meta) meta.content = value;
  }
  if (product.unavailable) {
    for (const control of all('.counter_wrapp :is(button, input)', detail)) control.disabled = true;
  }

  const description = document.querySelector('#desc');
  if (description) {
    const attributes = [product.sex, product.season && 'Сезон: ' + product.season, product.size && 'Размер: ' + product.size, product.age && 'Возраст: ' + product.age].filter(Boolean);
    description.replaceChildren(
      savedElement('p', '', product.name + '. Артикул ' + product.id + '.'),
      ...(attributes.length ? [savedElement('p', '', attributes.join(' · '))] : []),
      savedElement('p', '', `В упаковке ${product.n} шт. Цена за штуку — ${money(product.price)}, за упаковку — ${money(product.price * product.n)}.`)
    );
  }
  const stores = document.querySelector('#stores');
  stores?.replaceChildren(savedElement('p', '', availability));
  const reviews = document.querySelector('#reviews');
  reviews?.replaceChildren(savedElement('p', '', 'У товара пока нет отзывов.'));
  const panels = new Map([['Описание', 'desc'], ['Наличие', 'stores'], ['Отзывы', 'reviews']]);
  const strips = all('.js-store-scroll > .tabs.arrow_scroll, .product-item-detail-tabs-wrapper');
  const sectionLinks = [];
  for (const strip of strips) {
    for (const link of all('ul.nav-tabs > li > a', strip)) {
      const label = link.textContent.trim();
      if (panels.has(label)) {
        link.href = '#' + panels.get(label);
        sectionLinks.push(link);
      } else if (label === 'Как купить') {
        link.href = 'buy.html';
      } else if (link.getAttribute('href') === 'product.html') {
        link.closest('li').remove();
      }
    }
  }
  function showPanel(scroll) {
    const hash = location.hash.slice(1);
    const id = [...panels.values()].includes(hash) ? hash : 'desc';
    for (const panel of all('.js-store-scroll > .tab-content > .tab-pane')) {
      const active = panel.id === id;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    }
    for (const link of sectionLinks) {
      const active = link.hash === '#' + id;
      link.closest('li').classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    if (scroll && hash === id) document.getElementById(id)?.scrollIntoView();
  }
  addEventListener('hashchange', () => showPanel(true));
  showPanel(Boolean(location.hash));
}

function setPromoPrices(card, product) {
  card.querySelector('.promo-unit-price').textContent = product.price.toLocaleString('ru-RU') + ' ₽ / шт.';
  card.querySelector('.promo-pack-price').textContent =
    (product.price * product.n).toLocaleString('ru-RU') + ' ₽ / упак. · ' + product.n + ' шт.';
}

const savedPage = document.querySelector('[data-saved-page]');
const cartLinks = all('[data-cart-link]');
const mobileRoutes = new Map([
  ['Каталог', 'catalog.html'], ['Сравнение', 'compare.html'], ['Избранные', 'favorite.html'],
  ['Корзина', 'cart.html'], ['Кабинет', 'account.html'],
]);
const mobileLinks = new Map();
for (const link of all('.bottom-icons-panel__content > a')) {
  const label = link.textContent.trim().replace(/^\d+\s*/, '');
  const route = mobileRoutes.get(label);
  if (!route) {
    link.remove();
    continue;
  }
  link.href = route;
  const current = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  const active = current === route.replace(/\.html$/, '') ||
    (label === 'Каталог' && ['category', 'products', 'product'].includes(current));
  link.classList.toggle('bottom-icons-panel__content-link--active', active);
  if (active) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
  mobileLinks.set(label, link);
}
const mobilePanel = document.querySelector('.bottom-icons-panel__content');
if (mobilePanel) {
  for (const label of mobileRoutes.keys()) {
    const link = mobileLinks.get(label);
    if (link) mobilePanel.append(link);
  }
}

function readCart() {
  try { return JSON.parse(localStorage.getItem('polyarik-cart') || '{}') || {}; }
  catch { return {}; }
}

function money(amount) {
  return amount.toLocaleString('ru-RU') + ' ₽';
}

function setCartQuantity(id, quantity, control) {
  const cart = readCart();
  if (quantity > 0) cart[id] = quantity;
  else delete cart[id];
  localStorage.setItem('polyarik-cart', JSON.stringify(cart));
  renderCart(control ? {id, control} : undefined);
}

function savedElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function savedButton(text, className, action, label) {
  const button = savedElement('button', className, text);
  button.type = 'button';
  if (label) button.setAttribute('aria-label', label);
  button.addEventListener('click', action);
  return button;
}

function cartEntries() {
  return Object.entries(readCart()).filter(([, quantity]) => Number.isFinite(quantity) && quantity > 0);
}

function productPath(product) {
  return 'product.html?' + new URLSearchParams({sku: product.id});
}

function renderPack(element, product) {
  element.replaceChildren(
    savedElement('span', '', money(product.price * product.n) + ' / упак.'),
    savedElement('span', '', ' ' + product.n + ' шт.')
  );
}

function catalogCard(sample, product, index) {
  const row = sample.cloneNode(true);
  const card = row.querySelector('.catalog_item');
  card.dataset.product = index;
  all('[id]', row).forEach(element => element.removeAttribute('id'));
  const title = card.querySelector('.item-title a');
  title.textContent = product.name;
  title.title = product.name;
  const href = productPath(product);
  all('.item-title a, a.thumb, a.read_more', card).forEach(link => {
    link.href = href;
  });
  const image = card.querySelector('.image_wrapper_block .thumb img');
  image.src = product.photos[0] || 'assets/news/placeholder.svg';
  image.alt = product.name;
  card.querySelector('.article_block').textContent = 'Арт. ' + product.id;
  card.querySelector('.price_value').textContent = product.price.toLocaleString('ru-RU');
  renderPack(card.querySelector('.bonus-system-block'), product);
  card.querySelector('.item-stock').textContent = product.unavailable ? 'Нет в наличии' : 'В наличии';
  const buy = savedElement('button', 'btn btn-default to-cart proto-catalog-add', 'В корзину');
  buy.type = 'button';
  buy.disabled = Boolean(product.unavailable);
  buy.setAttribute('aria-label', 'В корзину: ' + product.name + ', арт. ' + product.id);
  card.querySelector('.item_info--bottom_block').append(buy);
  return row;
}

const catalogSorts = {
  popular: () => 0,
  'popular-desc': (a, b) => b.index - a.index,
  'name-asc': (a, b) => a.product.name.localeCompare(b.product.name, 'ru'),
  'name-desc': (a, b) => b.product.name.localeCompare(a.product.name, 'ru'),
  available: (a, b) => Number(Boolean(a.product.unavailable)) - Number(Boolean(b.product.unavailable)),
  'price-asc': (a, b) => a.product.price - b.product.price,
  'price-desc': (a, b) => b.product.price - a.product.price,
};
let updateCatalog;

function renderCatalog(tree) {
  const collect = nodes => nodes.flatMap(node => [node.slug, ...collect(node.children)]);
  const matching = nodes => nodes.flatMap(node => node.slug === catalogSection ? collect([node]) : matching(node.children));
  const sections = new Set(matching(tree));
  const sectionPath = (nodes, parents = []) => {
    for (const node of nodes) {
      const path = [...parents, node];
      const match = node.slug === catalogSection ? path : sectionPath(node.children, path);
      if (match) return match;
    }
  };
  const path = sectionPath(tree) || [];
  const section = path.at(-1);
  const heading = catalogQuery ? 'Результаты поиска' : section?.name || (catalogSection ? 'Раздел каталога' : 'Каталог');
  document.querySelector('#pagetitle').textContent = heading;
  document.title = heading + ' — Полярик';
  const crumbs = all('#navigation .breadcrumbs > .breadcrumbs__item');
  const parentCrumb = crumbs.at(-2);
  const parent = path.length > 1 ? path[0] : null;
  if (parent && parentCrumb) {
    const link = parentCrumb.querySelector('a');
    link.href = 'category.html?' + new URLSearchParams({section: parent.slug, title: parent.name});
    link.textContent = parent.name;
  } else {
    parentCrumb?.remove();
  }
  const currentCrumb = crumbs.at(-1)?.querySelector('.breadcrumbs__item-name');
  if (currentCrumb) currentCrumb.textContent = heading;
  const rows = products.map((product, index) => ({product, index})).filter(({product}) =>
    product.catalogSection && (!catalogSection || sections.has(product.catalogSection)) &&
    (!catalogQuery || matchesCatalogQuery(product, catalogQuery)));
  if (catalogQuery) {
    const note = savedElement('p', 'proto-search-query', 'Запрос: «' + catalogQuery + '»');
    catalogRoot.closest('.right_block1').prepend(note);
    all('form input[name="q"]').forEach(input => { input.value = catalogQuery; });
  }
  const sample = catalogRoot.querySelector(':scope > .item-parent');
  const sampleCard = sample.querySelector('.catalog_item');
  for (const element of all('.stickers, .rating, .js-item-gallery, .fast_view_button, .footer_button, [itemprop="aggregateRating"], meta[itemprop]', sampleCard)) element.remove();
  const gallery = sampleCard.querySelector('.image_wrapper_block .section-gallery-wrapper');
  for (const slide of [...gallery.children].slice(1)) slide.remove();
  gallery.querySelector('.section-gallery-wrapper__item-nav')?.remove();
  for (const row of rows) row.element = catalogCard(sample, row.product, row.index);
  const form = document.querySelector('.bx_filter form');
  for (const [field, key] of [['protoSex', 'sex'], ['protoSize', 'size']]) {
    const group = form?.querySelector('[name=' + field + ']')?.closest('.bx_filter_block');
    if (!group) continue;
    const values = [...new Set(rows.map(({product}) => product[key]).filter(Boolean))];
    group.replaceChildren(...values.map(value => {
      const label = savedElement('label', 'proto-check');
      const input = document.createElement('input');
      Object.assign(input, {type: 'checkbox', name: field, value});
      label.append(input, ' ' + value);
      return label;
    }));
    if (!values.length) group.closest('.bx_filter_parameters_box').hidden = true;
  }

  const filterParams = ['protoMin', 'protoMax', 'protoSex', 'protoSize'];
  for (const field of form.elements) {
    if (!filterParams.includes(field.name)) continue;
    if (field.type === 'checkbox') field.checked = params.getAll(field.name).includes(field.value);
    else field.value = params.get(field.name) || '';
  }
  const toolbar = document.querySelector('.sort_header');
  const sortMenu = toolbar.querySelector('.dropdown-select');
  const sortTitle = sortMenu.querySelector('.dropdown-select__title');
  const sortOptions = all('.dropdown-select__list-item', sortMenu);
  const sortKeys = ['popular-desc', 'popular', 'name-desc', 'name-asc', 'available', 'price-desc', 'price-asc'];
  const views = toolbar.querySelector('.controls-view');
  const lineCounts = toolbar.querySelector('.controls-linecount');
  const viewKeys = ['tiles', 'list', 'table'];
  const columnKeys = ['3', '4'];
  const empty = savedElement('p', 'proto-catalog-empty');
  empty.setAttribute('role', 'status');
  catalogRoot.after(empty);
  const headingCount = document.querySelector('.page-top .element-count');

  const sortControls = sortOptions.map((option, i) => {
    let link = option.querySelector('a');
    if (!link) {
      link = savedElement('a', 'dropdown-select__list-link darken', option.textContent.trim());
      option.replaceChildren(link);
    }
    return [sortKeys[i], link];
  });
  function displayControls(container, keys, labels) {
    return all('.controls-view__link', container).map((element, i) => {
      const link = savedElement('a', element.className.replace('js-load-link', ''));
      link.append(...element.childNodes);
      link.setAttribute('aria-label', labels[i]);
      link.title = labels[i];
      element.replaceWith(link);
      return [keys[i], link];
    });
  }
  const controls = [
    ['sort', sortControls, 'popular'],
    ['view', displayControls(views, viewKeys, ['Плитка', 'Список', 'Таблица']), 'tiles'],
    ['columns', displayControls(lineCounts, columnKeys, ['Три колонки', 'Четыре колонки']), '4'],
  ];
  for (const [key, links] of controls) {
    for (const [value, link] of links) {
      link.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        params.set(key, value);
        history.replaceState(null, '', link.href);
        updateCatalog();
        if (key === 'sort') sortTitle.focus();
      });
    }
  }
  sortTitle.tabIndex = 0;
  updateCatalog = (saveFilters = false) => {
    const fields = new FormData(form);
    if (saveFilters) {
      for (const name of filterParams) {
        params.delete(name);
        for (const value of fields.getAll(name)) if (value) params.append(name, value);
      }
      history.replaceState(null, '', location.pathname + (params.size ? '?' + params : '') + location.hash);
    }
    const min = fields.get('protoMin');
    const max = fields.get('protoMax');
    const sexes = fields.getAll('protoSex');
    const sizes = fields.getAll('protoSize');
    const state = {};
    for (const [key, links, fallback] of controls) {
      const value = params.get(key);
      state[key] = links.some(([id]) => id === value) ? value : fallback;
      for (const [id, link] of links) {
        const query = new URLSearchParams(params);
        query.set(key, id);
        link.href = '?' + query;
        link.classList.toggle('controls-view__link--current', key !== 'sort' && id === state[key]);
        if (id === state[key]) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }
    const sortLabel = sortControls.find(([key]) => key === state.sort)[1].textContent.trim();
    sortTitle.querySelector('span').textContent = sortLabel;
    catalogRoot.dataset.view = state.view;
    catalogRoot.dataset.columns = state.columns;
    toolbar.dataset.view = state.view;
    const visible = rows.filter(({product}) =>
      (!min || product.price >= Number(min)) && (!max || product.price <= Number(max)) &&
      (!sexes.length || sexes.includes(product.sex)) && (!sizes.length || sizes.includes(product.size)));
    visible.sort(catalogSorts[state.sort]);
    catalogRoot.replaceChildren(...visible.map(row => row.element));
    if (headingCount) headingCount.textContent = visible.length;
    empty.hidden = visible.length > 0;
    empty.textContent = rows.length ? 'Ничего не найдено. Измените или сбросьте фильтры.' : catalogQuery ? 'По запросу ничего не найдено. Попробуйте другое название или артикул.' : 'В этом разделе пока нет товаров.';
  };
  updateCatalog();
}

const cartPromoCode = 'DEMO10';
const cartPromoKey = 'polyarik-cart-promo';

function cartPromoApplied() {
  return sessionStorage.getItem(cartPromoKey) === cartPromoCode;
}

function discountedCartTotal(subtotal) {
  const discount = cartPromoApplied() ? Math.round(subtotal * 10) / 100 : 0;
  return {discount, total: Math.round((subtotal - discount) * 100) / 100};
}

function renderCartPromo(applied) {
  const form = savedElement('form', 'proto-cart-promo');
  const label = savedElement('label', '', 'Промокод');
  label.htmlFor = 'cart-promo-code';
  const controls = savedElement('div', 'proto-cart-promo-controls');
  const input = savedElement('input');
  input.id = 'cart-promo-code';
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.maxLength = 32;
  input.placeholder = 'Введите код';
  input.required = true;
  input.readOnly = applied;
  if (applied) input.value = cartPromoCode;

  const button = savedElement('button', 'btn btn-transparent-border-color', applied ? 'Убрать' : 'Применить');
  button.type = applied ? 'button' : 'submit';
  button.dataset.cartPromoButton = '';
  const status = savedElement('p', 'proto-cart-promo-status muted', applied ? 'Промокод применён.' : 'Тестовый код DEMO10 даёт скидку 10%.');
  status.id = 'cart-promo-status';
  status.setAttribute('role', 'status');
  input.setAttribute('aria-describedby', status.id);
  controls.append(input, button);
  form.append(label, controls, status);

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (applied) return;
    if (input.value.trim().toUpperCase() !== cartPromoCode) {
      input.setAttribute('aria-invalid', 'true');
      status.textContent = 'Промокод не найден.';
      return;
    }
    sessionStorage.setItem(cartPromoKey, cartPromoCode);
    renderCart();
    savedPage.querySelector('[data-cart-promo-button]').focus();
  });
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    status.textContent = 'Тестовый код DEMO10 даёт скидку 10%.';
  });
  if (applied) button.addEventListener('click', () => {
    sessionStorage.removeItem(cartPromoKey);
    renderCart();
    savedPage.querySelector('#cart-promo-code').focus();
  });
  return form;
}

function renderCart(focus) {
  const entries = cartEntries();
  const count = entries.reduce((total, [, quantity]) => total + quantity, 0);
  for (const link of cartLinks) {
    const badge = link.querySelector('.polyarik-cart-count, .js-count');
    if (badge) badge.textContent = count;
    link.setAttribute('aria-label', count ? 'Корзина, упаковок: ' + count : 'Корзина');
  }
  if (savedPage?.dataset.savedPage !== 'cart') return;
  document.querySelector('[data-saved-tools]').hidden = !entries.length;
  if (!entries.length) {
    sessionStorage.removeItem(cartPromoKey);
    savedPage.replaceChildren(savedElement('p', 'proto-saved-empty', 'Корзина пуста.'));
    if (focus) savedPage.nextElementSibling.focus();
    return;
  }
  if (!products.length) return;

  const layout = savedElement('div', 'proto-cart-layout');
  const items = savedElement('section', 'proto-cart-items');
  items.setAttribute('aria-label', 'Товары в корзине');
  const header = savedElement('div', 'proto-cart-toolbar');
  header.append(savedElement('h2', '', 'Товары в корзине'), savedButton('Очистить', 'proto-saved-clear', () => {
    localStorage.setItem('polyarik-cart', '{}');
    renderCart({id: ''});
  }));
  items.append(header);
  let total = 0;
  let hasUnavailableProduct = false;

  for (const [id, quantity] of entries) {
    const index = products.findIndex(item => item.id === id);
    const product = products[index];
    const row = savedElement('article', 'proto-cart-row');
    row.dataset.cartSku = id;
    const picture = savedElement('a', 'proto-cart-picture');
    if (product) {
      const photo = savedElement('img');
      photo.src = product.photos[0];
      photo.alt = '';
      picture.href = productPath(product);
      picture.tabIndex = -1;
      picture.setAttribute('aria-hidden', 'true');
      picture.append(photo);
    }

    const description = savedElement('div', 'proto-cart-description');
    const title = savedElement(product ? 'a' : 'strong', '', product?.name || id);
    if (product) title.href = productPath(product);
    description.append(title, savedElement('span', 'muted', 'Арт. ' + id));
    if (product) description.append(savedElement('span', 'muted', 'В упаковке ' + product.n + ' шт.'));
    if (product?.unavailable) {
      description.append(savedElement('span', 'muted', 'Нет в наличии'));
      hasUnavailableProduct = true;
    }

    const quantityColumn = savedElement('div', 'proto-cart-quantity');
    const stepper = savedElement('div', 'proto-cart-stepper');
    const input = savedElement('input');
    input.type = 'number';
    input.min = '1';
    input.step = '1';
    input.value = quantity;
    input.disabled = Boolean(product?.unavailable);
    input.setAttribute('aria-label', 'Упаковок для товара ' + id);
    input.addEventListener('change', () => {
      setCartQuantity(id, Math.max(1, Number.parseInt(input.value, 10) || 1), 'input');
    });
    const minus = savedButton('−', '', () => setCartQuantity(id, quantity - 1, 'minus'), 'Уменьшить количество ' + id);
    minus.disabled = input.disabled || quantity <= 1;
    minus.dataset.cartAction = 'minus';
    const plus = savedButton('+', '', () => setCartQuantity(id, quantity + 1, 'plus'), 'Увеличить количество ' + id);
    plus.disabled = input.disabled;
    plus.dataset.cartAction = 'plus';
    stepper.append(minus, input, plus);
    quantityColumn.append(stepper);
    if (product) quantityColumn.append(savedElement('span', 'muted', money(product.price * product.n) + ' / упак.'));

    const amount = savedElement('strong', 'proto-cart-amount');
    if (product) {
      const subtotal = product.price * product.n * quantity;
      amount.textContent = money(subtotal);
      total += subtotal;
    }
    const remove = savedButton('×', 'proto-saved-remove', () => setCartQuantity(id, 0, 'remove'), 'Удалить товар ' + id);
    row.append(picture, description, quantityColumn, amount, remove);
    items.append(row);
  }

  const totals = savedElement('aside', 'proto-cart-summary');
  const payable = discountedCartTotal(total);
  totals.append(savedElement('div', 'proto-cart-total-label', 'Итого:'), savedElement('strong', 'proto-saved-total', money(payable.total)), savedElement('p', 'muted', 'Упаковок: ' + count));
  if (total > 0) {
    if (payable.discount) {
      totals.append(savedElement('p', 'proto-cart-discount muted', 'Товары: ' + money(total) + ' · Скидка: ' + money(payable.discount)));
    }
    const quickBuy = savedButton('Купить в 1 клик', 'btn btn-transparent-border-color', () => openCheckout('Купить в 1 клик', payable.total));
    const checkout = savedButton('Перейти к оформлению', 'btn btn-default', () => openCheckout('Оформление заказа', payable.total));
    quickBuy.disabled = checkout.disabled = hasUnavailableProduct;
    totals.append(renderCartPromo(cartPromoApplied()), quickBuy, checkout);
    if (hasUnavailableProduct) totals.append(savedElement('p', 'muted', 'Удалите товары, которых нет в наличии, чтобы оформить заказ.'));
  }
  layout.append(items, totals);
  savedPage.replaceChildren(layout);
  if (focus) {
    const row = all('[data-cart-sku]', savedPage).find(item => item.dataset.cartSku === focus.id);
    const target = focus.control === 'input' ? row?.querySelector('input') : row?.querySelector('[data-cart-action="' + focus.control + '"]:enabled');
    (target || row?.querySelector('input') || savedPage.querySelector('button')).focus();
  }
}

function openCheckout(title, total) {
  const dialog = document.querySelector('#proto-checkout');
  dialog.querySelector('h2').textContent = title;
  dialog.querySelector('[data-checkout-summary]').textContent = 'Итого: ' + money(total);
  dialog.showModal();
}

addEventListener('storage', event => {
  if (!event.key || event.key === 'polyarik-cart') renderCart();
  if (!event.key || event.key === 'polyarik-compare' || event.key === 'polyarik-favorite') renderSavedList();
});
renderCart();

const offerNames = {
  new:'Новинки', bestseller:'Хит продаж', recommendations:'Полярик рекомендует',
  value:'Выгодная цена', 50:'Всё за 50', 100:'Всё за 100', 150:'Всё за 150'
};
const offer = new URLSearchParams(location.search).get('offer');
const related = document.querySelector('.proto-related');
function storedList(kind) {
  try {
    const ids = JSON.parse(localStorage.getItem('polyarik-' + kind) || '[]');
    return Array.isArray(ids) ? ids : [];
  } catch { return []; }
}
function productCard(product) {
  const card = document.createElement('a');
  card.className = 'proto-related-card';
  card.href = productPath(product);
  const image = document.createElement('img');
  image.src = product.photos[0];
  image.alt = '';
  const title = document.createElement('strong');
  title.textContent = product.name;
  const details = document.createElement('span');
  details.textContent = 'Арт. ' + product.id;
  const price = document.createElement('span');
  price.textContent = (product.price * product.n).toLocaleString('ru-RU') + ' ₽ / упак. · ' + product.n + ' шт.';
  const marking = document.createElement('img');
  marking.className = 'proto-marking-badge';
  marking.src = 'assets/chestny-znak-detail.svg';
  marking.alt = 'Честный знак';
  card.append(image, marking, title, details, price);
  return card;
}
function renderRelated(kind = related?.querySelector('[data-related][aria-pressed=true]')?.dataset.related || 'similar') {
  if (!related) return;
  const current = Number(document.querySelector('.product-container')?.dataset.product) || 0;
  const product = products[current];
  if (!product || !related.isConnected) return;
  const matches = products.filter(item => item !== product);
  matches.sort((a, b) => Number(b.catalogSection === product.catalogSection) - Number(a.catalogSection === product.catalogSection));
  const selection = kind === 'together' ? matches.slice(2, 4) : matches.slice(0, 2);
  related.querySelector('.proto-product-grid').replaceChildren(...selection.map(productCard));
  for (const tab of all('[data-related]', related)) tab.setAttribute('aria-pressed', String(tab.dataset.related === kind));
}
function renderOffer() {
  if (!Object.hasOwn(offerNames, offer)) return;
  const results = document.querySelector('[data-offer-results]');
  if (results) {
    renderPromotionProducts(results);
    return;
  }
  const container = document.querySelector('.catalog_section_list');
  if (!container) return;
  document.querySelector('h1').textContent = offerNames[offer];
  document.title = offerNames[offer] + ' — Полярик';
  const intro = document.createElement('p');
  const grid = document.createElement('div');
  grid.className = 'proto-product-grid';
 const items = products.map((product,index) => ({product,index})).filter(({product,index}) => index < 4 && (!Number(offer) || product.price === Number(offer)));
  intro.textContent = items.length ? 'Демонстрационные товары из каталога прототипа.' : 'В этой подборке пока нет демонстрационных товаров.';
  if (items.length) grid.append(...items.map(({product,index}) => productCard(product)));
  container.className = 'proto-offer-results';
  container.replaceChildren(intro);
  if (items.length) container.append(grid);
}

function renderPromotionProducts(results) {
  const items = products.map((product, index) => ({ product, index }))
    .filter(({ product }) => product.promoGroup &&
      (Number(offer) ? product.price === Number(offer) : product.promoOffers.includes(offer)));
  const filters = results.querySelector('.section-detail-list');
  const grid = results.querySelector('.promo-goods-grid');
  const navigation = results.querySelector('.promo-goods-nav');
  const more = navigation.querySelector('.promo-load-more');
  const pages = navigation.querySelector('.promo-pages');
  const template = document.querySelector('#promo-product-card');
  const groups = new Map([['Все', items.length]]);
  for (const { product, index } of items) {
    groups.set(product.promoGroup, (groups.get(product.promoGroup) || 0) + 1);
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.product = index;
    card.dataset.group = product.promoGroup;
    const href = productPath(product);
    const name = card.querySelector('.promo-product-name');
    name.href = href;
    name.textContent = product.name;
    card.querySelector('.promo-product-image').href = href;
    card.querySelector('.promo-product-image img').src = product.photos[0];
    card.querySelector('.article_block').textContent = 'Арт. ' + product.id;
    setPromoPrices(card, product);
    card.querySelector('.to-cart').setAttribute('aria-label', 'В корзину: ' + product.name);
    grid.append(card);
  }

  const pageSize = 8;
  let group = 'Все';
  let page = 1;
  let visibleThrough = 1;
  function updateProducts() {
    const matching = Array.from(grid.children).filter(card => group === 'Все' || card.dataset.group === group);
    const pageCount = Math.ceil(matching.length / pageSize);
    const visible = new Set(matching.slice((page - 1) * pageSize, visibleThrough * pageSize));
    for (const card of grid.children) card.hidden = !visible.has(card);
    navigation.hidden = pageCount <= 1;
    more.hidden = visibleThrough >= pageCount;
    pages.replaceChildren();
    for (let number = 1; number <= pageCount; number++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = number;
      button.setAttribute('aria-label', 'Страница ' + number);
      if (number === page) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => {
        page = visibleThrough = number;
        updateProducts();
        pages.children[number - 1].focus();
      });
      pages.append(button);
    }
  }
  more.addEventListener('click', () => {
    visibleThrough++;
    updateProducts();
    if (more.hidden) pages.querySelector('[aria-current="page"]')?.focus();
  });

  const buttons = [];
  for (const [name, count] of groups) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'section-detail-list__info bordered rounded3 font_xs';
    button.textContent = name;
    const counter = document.createElement('span');
    counter.className = 'element-count-section';
    counter.textContent = count;
    button.append(counter);
    button.setAttribute('aria-pressed', String(name === 'Все'));
    button.addEventListener('click', () => {
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      group = name;
      page = visibleThrough = 1;
      updateProducts();
    });
    buttons.push(button);
  }
  filters.replaceChildren(...buttons);
  updateProducts();
}

for (const strip of all('.js-store-scroll > .tabs.arrow_scroll, .product-item-detail-tabs-wrapper')) {
  const track = strip.querySelector('ul.nav-tabs');
  if (!track) continue;
  strip.querySelector('.arrows_wrapper')?.remove();
  strip.classList.add('proto-scroll-tabs');
  const controls = document.createElement('div');
  controls.className = 'proto-tab-controls';
  function createArrow(label, text, direction) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.textContent = text;
    button.addEventListener('click', () => track.scrollBy({left:direction * Math.max(100, track.clientWidth * .65), behavior:'smooth'}));
    controls.append(button);
    return button;
  }
  const prev = createArrow('Предыдущие вкладки', '‹', -1);
  const next = createArrow('Следующие вкладки', '›', 1);
  strip.append(controls);
  function updateArrows() {
    controls.hidden = true;
    const needsScroll = track.scrollWidth > track.clientWidth + 1;
    controls.hidden = !needsScroll;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  }
  track.addEventListener('scroll', () => {
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  }, {passive:true});
  new ResizeObserver(updateArrows).observe(strip);
  updateArrows();
}

for (const tab of all('[data-related]')) tab.addEventListener('click', () => renderRelated(tab.dataset.related));
function savedProducts(kind) {
  const ids = storedList(kind);
  return products.map((product, index) => ({product, index})).filter(({product}) => ids.includes(product.id));
}

function savedProduct(product, index, kind) {
  const entry = savedElement('article', 'proto-saved-entry');
  entry.dataset.product = index;
  const href = productPath(product);
  const picture = savedElement('a', 'proto-saved-photo');
  picture.href = href;
  picture.tabIndex = -1;
  picture.setAttribute('aria-hidden', 'true');
  const img = savedElement('img');
  img.src = product.photos[0];
  img.alt = '';
  picture.append(img);
  const title = savedElement('a', 'proto-saved-name', product.name);
  title.href = href;
  const details = savedElement('div', 'proto-saved-entry-info');
  const status = savedElement('p', 'muted', product.unavailable ? 'Нет в наличии' : 'В наличии');
  details.append(title, status, savedElement('p', 'muted', 'Арт. ' + product.id), savedElement('strong', '', money(product.price) + ' / шт.'),
    savedElement('p', 'muted', money(product.price * product.n) + ' / упак. · ' + product.n + ' шт.'));
  const buy = savedElement('button', 'btn btn-default to-cart', 'В корзину');
  buy.type = 'button';
  buy.disabled = Boolean(product.unavailable);
  const remove = savedButton('×', 'proto-saved-remove', () => {
    localStorage.setItem('polyarik-' + kind, JSON.stringify(storedList(kind).filter(id => id !== product.id)));
    renderSavedList();
    (savedPage.querySelector('button') || savedPage.nextElementSibling).focus();
  }, 'Удалить товар ' + product.id);
  entry.append(picture, details, buy, remove);
  return entry;
}

function renderSavedList() {
  const kind = savedPage?.dataset.savedPage;
  if (kind !== 'compare' && kind !== 'favorite') return;
  const matches = savedProducts(kind);
  for (const element of all('[data-saved-tools], [data-compare-toolbar], .topic__heading [data-saved-clear]')) {
    element.hidden = !matches.length;
  }
  if (!matches.length) {
    savedPage.replaceChildren(savedElement('p', 'proto-saved-empty',
      kind === 'compare' ? 'Нет товаров для сравнения.' : 'В избранном пока нет товаров.'));
    return;
  }

  if (kind === 'favorite') {
    const grid = savedElement('div', 'proto-saved-grid');
    grid.append(...matches.map(({product, index}) => savedProduct(product, index, kind)));
    savedPage.replaceChildren(grid);
    return;
  }

  const scroll = savedElement('div', 'proto-saved-compare');
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-label', 'Карточки товаров и характеристики');
  const table = savedElement('table');
  const headings = table.createTHead().insertRow();
  for (const {product, index} of matches) {
    const cell = savedElement('th');
    cell.scope = 'col';
    cell.append(savedProduct(product, index, kind));
    headings.append(cell);
  }

  const details = [
    ['Артикул', product => product.id],
    ['Цена за штуку', product => money(product.price)],
    ['В упаковке', product => product.n + ' шт.'],
    ['Размер', product => product.size],
    ['Сезон', product => product.season],
    ['Пол', product => product.sex]
  ];
  const onlyDifferences = document.querySelector('[data-compare-diff]').checked;
  const fields = details.map(([name, value]) => [name, matches.map(({product}) => value(product) || '—')])
    .filter(([, values]) => !onlyDifferences || new Set(values).size > 1);
  const body = table.createTBody();
  const group = savedElement('th', 'proto-compare-group', fields.length ? 'Общие характеристики' : 'Отличий по характеристикам нет.');
  group.colSpan = matches.length;
  body.insertRow().append(group);
  for (const [name, values] of fields) {
    const row = body.insertRow();
    values.forEach((value, i) => {
      const cell = row.insertCell();
      cell.append(savedElement('span', 'muted', name), savedElement('span', '', value));
    });
  }
  scroll.append(table);
  savedPage.replaceChildren(scroll);
}

document.querySelector('[data-compare-diff]')?.addEventListener('change', renderSavedList);
document.querySelector('[data-saved-clear]')?.addEventListener('click', () => {
  localStorage.setItem('polyarik-' + savedPage.dataset.savedPage, '[]');
  renderSavedList();
  savedPage.nextElementSibling.focus();
});

document.querySelector('[data-close-checkout]')?.addEventListener('click', event => event.currentTarget.closest('dialog').close());
document.querySelector('[data-cart-print]')?.addEventListener('click', () => window.print());
document.querySelector('[data-cart-download]')?.addEventListener('click', () => {
  const rows = cartEntries().map(([id, quantity]) => {
    const product = products.find(item => item.id === id);
    return [id, product?.name || '', quantity, product ? product.price * product.n * quantity : ''];
  });
  const subtotal = rows.reduce((sum, row) => sum + (Number(row[3]) || 0), 0);
  const {discount, total} = discountedCartTotal(subtotal);
  if (discount) rows.push(['', 'Скидка по промокоду', '', -discount]);
  rows.push(['', 'Итого', '', total]);
  const csv = [['Артикул', 'Товар', 'Упаковок', 'Сумма, ₽'], ...rows]
    .map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(';')).join(String.fromCharCode(13, 10));
  const url = URL.createObjectURL(new Blob(['﻿', csv], {type: 'text/csv;charset=utf-8'}));
  const link = savedElement('a');
  link.href = url;
  link.download = 'polyarik-cart.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.querySelector('[data-saved-share]')?.addEventListener('click', async () => {
  const kind = savedPage.dataset.savedPage;
  const lines = kind === 'cart'
    ? cartEntries().map(([id, quantity]) => {
        const product = products.find(item => item.id === id);
        return (product ? product.name + ', ' + id : id) + ' — ' + quantity + ' упак.';
      })
    : savedProducts(kind).map(({product}) => product.name + ' · ' + new URL(productPath(product), location.href).href);
  try {
    await navigator.clipboard.writeText(lines.join(String.fromCharCode(10)));
    notice('Список скопирован');
  } catch {
    notice('Не удалось скопировать список');
  }
});

function notice(text){document.querySelector('.prototype-toast')?.remove();const el=document.createElement('div');el.className='prototype-toast';el.setAttribute('role','status');el.textContent=text;document.body.append(el);setTimeout(()=>el.remove(),3500);}
const mobileFilter = matchMedia('(max-width: 991px)');
const filterTrigger = document.querySelector('.filter-panel__filter .filter_title');
const filterSidebar = document.querySelector('.proto-products-page .left_block');
let filterClose;
const filterPlaceholder = document.createComment('Catalog sidebar');
if (filterTrigger && filterSidebar) {
  filterSidebar.before(filterPlaceholder);
  filterTrigger.setAttribute('aria-expanded', 'false');
  filterTrigger.setAttribute('aria-controls', filterSidebar.id = 'catalog-filters');
  filterClose = savedButton('Закрыть фильтр ×', 'proto-filter-close', () => setFilterOpen(false, true));
  filterClose.type = 'button';
  filterSidebar.querySelector('.sticky-sidebar__inner')?.prepend(filterClose);
  mobileFilter.addEventListener('change', () => setFilterOpen(false));
}
function setFilterOpen(open, restoreFocus = false) {
  if (!filterTrigger || !filterSidebar) return;
  const wasOpen = document.body.classList.contains('proto-filter-open');
  if (open && filterSidebar.parentElement !== document.body) document.body.append(filterSidebar);
  if (!open && !mobileFilter.matches && filterSidebar.parentElement === document.body) filterPlaceholder.after(filterSidebar);
  if (open && !mobileFilter.matches) return;
  document.body.classList.toggle('proto-filter-open', open);
  filterTrigger.setAttribute('aria-expanded', String(open));
  if (open) filterClose?.focus();
  else if (wasOpen && restoreFocus) filterTrigger.focus();
}

function matchesCatalogQuery(product, query) {
  const normalize = text => text.toLocaleLowerCase('ru').replaceAll('ё', 'е');
  const haystack = normalize([product.name, product.id, product.promoGroup].filter(Boolean).join(' '));
  return normalize(query).split(/\s+/).every(word => haystack.includes(word));
}

const inlineSearch = document.querySelector('.inline-search-block');
const inlineInput = inlineSearch?.querySelector('input[name="q"]');
let searchTrigger;
function setInlineSearch(open, trigger) {
  if (!inlineSearch) return;
  if (trigger) searchTrigger = trigger;
  inlineSearch.classList.toggle('proto-search-open', open);
  searchTrigger?.setAttribute('aria-expanded', String(open));
  if (open) inlineInput?.focus();
  else searchTrigger?.focus();
}
for (const button of all('.inline-search-show')) {
  button.setAttribute('aria-label', 'Поиск по каталогу');
  button.setAttribute('aria-expanded', 'false');
}
if (inlineInput) {
  inlineInput.type = 'search';
  inlineInput.setAttribute('aria-label', 'Поиск по каталогу');
  inlineSearch.querySelector('.searchtype')?.remove();
  const close = inlineSearch.querySelector('.inline-search-hide');
  if (close) {
    const button = savedButton('×', 'close-block inline-search-hide proto-search-close', () => setInlineSearch(false), 'Закрыть поиск');
    button.type = 'button';
    close.replaceWith(button);
  }
}
for (const form of all('form:has(input[name="q"])')) {
  form.action = 'products.html';
  form.method = 'get';
}

document.addEventListener('click',e=>{
 if(e.target.closest('.filter-panel__filter .filter_title')) {
   setFilterOpen(!document.body.classList.contains('proto-filter-open'), true);
   return;
 }
 const searchButton = e.target.closest('.inline-search-show');
 if (searchButton) { setInlineSearch(true, searchButton); return; }
 const filterHead=e.target.closest('.bx_filter_parameters_box_title');if(filterHead){const block=filterHead.nextElementSibling;block.hidden=!block.hidden;block.style.display=block.hidden?'none':'block';return;}
 const count=e.target.closest('.counter_block .plus,.counter_block .minus');
 if(count){const box=count.closest('.counter_block');const input=box.querySelector('input');input.value=Math.max(1,(parseInt(input.value)||1)+(count.classList.contains('plus')?1:-1));input.dispatchEvent(new Event('change',{bubbles:true}));return;}
 const buy=e.target.closest('.to-cart,.to_cart,.add-to-cart');
 if (buy) {
   e.preventDefault();
   const card = buy.closest('[data-product]');
   const product = card ? products[Number(card.dataset.product)] : null;
   if (!product) return;
   if (product.unavailable) {
     notice('Товар отсутствует');
     return;
   }
   const input = buy.classList.contains('proto-catalog-add') ? null : card.querySelector('.counter_block input');
   const amount = Math.max(1, Number.parseInt(input?.value, 10) || 1);
   setCartQuantity(product.id, (readCart()[product.id] || 0) + amount);
   notice('Добавлено ' + amount + ' упак. — ' + product.name);
   return;
 }
 if(e.target.closest('.burger,.mobilemenu-button'))document.body.classList.toggle('prototype-menu-open');
 if(e.target.closest('#mobilemenu-overlay'))document.body.classList.remove('prototype-menu-open');
 const fav=e.target.closest('.wish_item_button,.wish_item,.compare_item_button');if(fav){e.preventDefault();const kind=fav.closest('.compare_item_button')?'compare':'favorite';const product=products[Number(fav.closest('[data-product]')?.dataset.product)||0];if(!product)return;const ids=storedList(kind);const added=!ids.includes(product.id);localStorage.setItem('polyarik-'+kind,JSON.stringify(added?[...ids,product.id]:ids.filter(id=>id!==product.id)));fav.classList.toggle('active',added);notice(added?'Добавлено в список':'Удалено из списка');}
 const tab=e.target.closest('.tabs li:not(.proto-scroll-tabs li)');if(tab){const list=tab.parentElement;all('li',list).forEach(x=>x.classList.toggle('active',x===tab));const href=tab.querySelector('a')?.getAttribute('href');if(href?.startsWith('#'))document.querySelector(href)?.scrollIntoView({behavior:'smooth'});}
});
document.addEventListener('reset', event => {
  if (event.target.matches('[data-proto-filter]')) setTimeout(() => updateCatalog?.(true), 0);
});
document.addEventListener('submit', event => {
  if (event.target.matches('[data-proto-filter]')) {
    event.preventDefault();
    updateCatalog?.(true);
    setFilterOpen(false, true);
  } else if (event.target.matches('.proto-footer-subscribe-form')) {
    event.preventDefault();
    notice('Подписка недоступна в прототипе');
  } else if (event.target.matches('form:has(input[name="q"])')) {
    event.preventDefault();
    const query = event.target.querySelector('input[name="q"]').value.trim();
    if (query) location.href = 'products.html?' + new URLSearchParams({q: query});
  }
});
document.addEventListener('change',e=>{if(!e.target.matches('.counter_block input'))return;e.target.value=Math.max(1,parseInt(e.target.value)||1);const card=e.target.closest('[data-product]');const p=products[Number(card?.dataset.product)||0];if(!p)return;let total=card.querySelector('.proto-total');if(!total){total=document.createElement('div');total.className='proto-total';e.target.closest('.counter_block').after(total);}total.textContent=`${Number(e.target.value)*p.n} шт. · Итого ${(Number(e.target.value)*p.n*p.price).toLocaleString('ru-RU')} ₽`;});

function connectViewedCarousel(slider, track) {
  const previous = slider.parentElement.querySelector('.navigation .swiper-button-prev');
  const next = slider.parentElement.querySelector('.navigation .swiper-button-next');
  const slides = all(':scope > .swiper-slide', track);
  if (!previous || !next || !slides.length) return;
  let index = 0;
  function update() {
    const maximum = Math.max(0, track.scrollWidth - slider.clientWidth);
    const offset = Math.min(maximum, slides[index].offsetLeft - slides[0].offsetLeft);
    track.style.transform = 'translateX(-' + offset + 'px)';
    previous.disabled = offset === 0;
    next.disabled = offset >= maximum - 1 || index === slides.length - 1;
  }
  previous.addEventListener('click', () => { index = Math.max(0, index - 1); update(); });
  next.addEventListener('click', () => { index = Math.min(slides.length - 1, index + 1); update(); });
  new ResizeObserver(update).observe(slider);
  update();
}
all('.swiper').forEach(slider=>{if(slider.closest('.proto-b2b-home #content'))return;const track=slider.querySelector('.swiper-wrapper');if(!track)return;if(slider.closest('.viewed-wrapper')){connectViewedCarousel(slider,track);return;}const slides=all(':scope > .swiper-slide',track);let index=0;const move=n=>{index=Math.max(0,Math.min(n,slides.length-1));track.style.transform=`translateX(-${index*slider.clientWidth}px)`;};const scope=slider.parentElement;all('.swiper-button-next',scope).forEach(b=>b.addEventListener('click',()=>move(index+1)));all('.swiper-button-prev',scope).forEach(b=>b.addEventListener('click',()=>move(index-1)));});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (inlineSearch?.classList.contains('proto-search-open')) setInlineSearch(false);
  else if (document.body.classList.contains('proto-filter-open')) setFilterOpen(false, true);
  else document.body.classList.remove('prototype-menu-open');
});
})();

document.querySelectorAll('[data-catalog-tab]').forEach(tab=>{
 const activate=()=>{const nav=tab.closest('.menu-navigation');nav.querySelectorAll('[data-catalog-tab]').forEach(t=>t.classList.toggle('active',t===tab));nav.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==tab.dataset.catalogTab);};
 tab.addEventListener('mouseenter',activate);tab.addEventListener('focusin',activate);
});
