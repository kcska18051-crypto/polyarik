(() => {
  // Production uses Aspro's section-level UF_TABLE_SIZES setting, not a new sizing engine.
  const sections = new Set([
    'golovnye_ubory_dlya_detey', 'komplekty_s_sharfami', 'komplekty_s_sinteponom',
    'komplekty_s_flisovym_podkladom', 'komplekty_s_kh_b_podkladom', 'komplekty_trikotazhnye',
    'shapki_vyazannye', 'shapki_s_flisovym_podkladom', 'shapki_s_sinteponom',
    'shapki_s_kh_b_podkladom', 'shapki_odinarnye', 'shlemy', 'shapki_trikotazhnye',
    'beysbolki', 'panamy_kepki_kosynki_bandany', 'povyazki'
  ]);
  const rows = [
    ['36–38', '0–1 мес.'], ['38–40', '1–3 мес.'], ['40–42', '3–6 мес.'],
    ['42–44', '6–9 мес.'], ['44–46', '9–12 мес.'], ['46–48', '1–2 года'],
    ['48–50', '2–3 года'], ['50–52', '3–5 лет'], ['52–54', '5–7 лет'], ['54–56', '7–10 лет']
  ];
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function mount(detail, product) {
    if (!sections.has(product.catalogSection) || detail.querySelector('[data-size-guide-open]')) return;
    const trigger = element('button', 'Таблица размеров', 'proto-size-guide-trigger');
    trigger.type = 'button'; trigger.dataset.sizeGuideOpen = '';
    trigger.setAttribute('aria-haspopup', 'dialog'); trigger.setAttribute('aria-controls', 'headwear-size-guide');
    const sizeRow = [...detail.querySelectorAll('.properties__item')].find(row => row.querySelector('.properties__title')?.textContent.trim() === 'Размер');
    (sizeRow?.querySelector('.properties__value') || detail.querySelector('.properties') || detail).append(trigger);
    const dialog = element('dialog', '', 'proto-size-guide'); dialog.id = 'headwear-size-guide'; dialog.dataset.sizeGuide = '';
    dialog.setAttribute('aria-labelledby', 'size-guide-title');
    const header = element('div', '', 'proto-size-guide-heading');
    const title = element('h2', 'Таблица размеров'); title.id = 'size-guide-title';
    const close = element('button', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Закрыть таблицу размеров');
    close.addEventListener('click', () => dialog.close()); header.append(title, close);
    const table = element('table');
    table.append(element('caption', 'Соответствие возрастов и размеров'));
    const head = element('thead'); const headingRow = element('tr');
    for (const label of ['Размер', 'Возраст']) { const th = element('th', label); th.scope = 'col'; headingRow.append(th); }
    head.append(headingRow); table.append(head);
    const body = element('tbody');
    const normalize = value => String(value || '').replace(/[\s–—-]/g, '');
    for (const [size, age] of rows) {
      const row = element('tr'); const th = element('th', size); th.scope = 'row'; row.append(th, element('td', age));
      if (product.size && normalize(product.size) === normalize(size)) row.className = 'proto-size-guide-current';
      body.append(row);
    }
    table.append(body); dialog.append(header);
    if (product.size) dialog.append(element('p', 'Размер этого товара: ' + product.size + '.'));
    dialog.append(table);
    document.body.append(dialog);
    trigger.addEventListener('click', () => { if (!dialog.open) dialog.showModal(); });
    dialog.addEventListener('close', () => trigger.focus({preventScroll:true}));
  }
  window.PolyarikSizeGuide = {mount};
})();
