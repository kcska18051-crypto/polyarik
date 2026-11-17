(() => {
  const draftKey = 'polyarik-checkout-draft';
  const lastOrderKey = 'polyarik-last-order';
  const money = value => Number(value).toLocaleString('ru-RU') + ' ₽';
  const read = key => { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } };
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function content(dialog) {
    let box = dialog.querySelector('[data-checkout-details]');
    if (!box) { box = element('div'); box.dataset.checkoutDetails = ''; dialog.append(box); }
    return box;
  }
  function itemsList(items) {
    const list = element('ul', undefined, 'proto-checkout-items');
    for (const item of items) list.append(element('li', item.name + ' · арт. ' + item.id + ' · ' + item.quantity + ' упак. × ' + item.packSize + ' шт. — ' + money(item.quantity * item.packSize * item.unitPrice) + ' до скидок'));
    return list;
  }
  function showConfirmation(dialog, order) {
    dialog.querySelector('h2').textContent = 'Заказ ' + order.number + ' сформирован';
    dialog.querySelector('[data-checkout-summary]').textContent = 'Товары к оплате: ' + money(order.pricing.total);
    const box = content(dialog);
    const notice = element('p', 'Демонстрационный заказ сохранён только в этой вкладке браузера и не отправлен менеджеру. Письмо и счёт не отправляются.', 'proto-checkout-notice');
    const details = element('dl', undefined, 'proto-checkout-receipt');
    const c = order.customer;
    for (const [label, value] of [
      ['Компания', c.company], [c.country === 'BY' ? 'УНП' : 'ИНН', c.taxId], ['КПП', c.kpp],
      ['Юридический адрес', c.legalAddress], ['Контактное лицо', c.contact], ['Телефон', c.phone], ['Email', c.email],
      ['Транспортная компания', c.carrier], ['Город доставки', c.city], ['Адрес / терминал', c.deliveryAddress], ['Комментарий', c.comment]
    ]) {
      if (!value) continue;
      const row = element('div'); row.append(element('dt', label), element('dd', value)); details.append(row);
    }
    const totals = element('div', undefined, 'proto-checkout-receipt-totals');
    totals.append(element('p', 'Товары до скидок: ' + money(order.pricing.subtotal)));
    for (const [rate, label] of [[order.pricing.welcomeRate, 'Скидка на первый заказ'], [order.pricing.volumeRate, 'Скидка за объём'], [order.pricing.promoRate, 'Промокод']]) {
      if (rate) totals.append(element('p', label + ' ' + rate + '%: −' + money(Math.round(order.pricing.subtotal * rate) / 100)));
    }
    if (order.pricing.bonusSpent) totals.append(element('p', 'Списание бонусов: −' + money(order.pricing.bonusSpent)));
    totals.append(element('strong', 'Товары к оплате: ' + money(order.pricing.total)), element('p', 'Доставка: согласуется индивидуально. В сумму товаров не включена.'));
    const steps = element('ol', undefined, 'proto-checkout-next');
    for (const step of ['Менеджер согласует состав заказа и условия доставки транспортной компанией.', 'После согласования выставляется счёт на оплату.', 'Оплата производится на расчётный счёт поставщика.']) steps.append(element('li', step));
    const back = element('a', 'Продолжить покупки', 'btn btn-default'); back.href = 'catalog.html';
    box.replaceChildren(notice, element('h3', 'Данные заказа'), details, element('h3', 'Состав заказа'), itemsList(order.items), totals, element('h3', 'Следующие шаги'), steps, back);
    dialog.scrollTop = 0;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('h2').tabIndex = -1; dialog.querySelector('h2').focus();
  }
  function open({dialog, getOrder, onConfirmed, renderBreakdown, renderScale, renderTerms}) {
    let snapshot = getOrder();
    if (!snapshot) return;
    const box = content(dialog);
    const form = element('form', undefined, 'proto-checkout-form'); form.dataset.checkoutForm = ''; form.noValidate = true;
    const draft = read(draftKey) || {};
    const status = element('p', '', 'proto-checkout-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const field = (group, name, label, {required = true, type = 'text', maxLength = 200, autocomplete = '', hint = ''} = {}) => {
      const wrap = element('div', undefined, 'proto-checkout-field');
      const id = 'checkout-' + name;
      const title = element('label', label + (required ? ' *' : '')); title.htmlFor = id;
      const input = element(type === 'textarea' ? 'textarea' : 'input');
      if (type !== 'textarea') input.type = type;
      input.id = id; input.name = name; input.required = required; input.maxLength = maxLength;
      if (autocomplete) input.autocomplete = autocomplete;
      input.value = typeof draft[name] === 'string' ? draft[name] : '';
      wrap.append(title, input);
      if (hint) { const help = element('small', hint); help.id = id + '-hint'; input.setAttribute('aria-describedby', help.id); wrap.append(help); }
      group.append(wrap); return input;
    };
    const group = title => { const section = element('fieldset'); section.append(element('legend', title)); form.append(section); return section; };
    const company = group('1. Реквизиты компании');
    const countryWrap = element('div', undefined, 'proto-checkout-field');
    const countryLabel = element('label', 'Страна регистрации компании *'); countryLabel.htmlFor = 'checkout-country';
    const country = element('select'); country.id = 'checkout-country'; country.name = 'country'; country.required = true;
    for (const [value, label] of [['RU', 'Россия'], ['BY', 'Беларусь']]) { const option = element('option', label); option.value = value; country.append(option); }
    country.value = draft.country === 'BY' ? 'BY' : 'RU'; countryWrap.append(countryLabel, country); company.append(countryWrap);
    field(company, 'company', 'Название компании', {autocomplete:'organization'});
    const tax = field(company, 'taxId', 'ИНН', {maxLength:12}); tax.inputMode = 'numeric';
    const kpp = field(company, 'kpp', 'КПП', {required:false, maxLength:9, hint:'Если присвоен организации.'}); kpp.inputMode = 'numeric';
    field(company, 'legalAddress', 'Юридический адрес', {maxLength:500});
    function updateCountry() {
      const belarus = country.value === 'BY';
      tax.previousElementSibling.textContent = (belarus ? 'УНП' : 'ИНН') + ' *';
      tax.pattern = belarus ? '[0-9]{9}' : '(?:[0-9]{10}|[0-9]{12})'; tax.maxLength = belarus ? 9 : 12;
      kpp.disabled = belarus; kpp.closest('.proto-checkout-field').hidden = belarus;
      if (belarus) kpp.value = '';
      tax.setCustomValidity(''); kpp.setCustomValidity('');
    }
    updateCountry(); country.addEventListener('change', updateCountry);
    const contact = group('2. Контактные данные');
    field(contact, 'contact', 'Контактное лицо', {autocomplete:'name'});
    field(contact, 'phone', 'Телефон', {type:'tel', autocomplete:'tel', maxLength:40, hint:'С кодом страны, например +7 или +375.'});
    field(contact, 'email', 'Email', {type:'email', autocomplete:'email', maxLength:254});
    const shipping = group('3. Доставка транспортной компанией');
    field(shipping, 'carrier', 'Транспортная компания', {maxLength:120, hint:'Укажите удобную вам ТК. Условия согласуем индивидуально.'});
    field(shipping, 'city', 'Город доставки', {maxLength:120, autocomplete:'address-level2'});
    field(shipping, 'deliveryAddress', 'Адрес или терминал ТК', {required:false, maxLength:500});
    field(shipping, 'comment', 'Комментарий к заказу', {required:false, type:'textarea', maxLength:1500});
    const overview = element('section', undefined, 'proto-checkout-overview');
    function refreshOverview() {
      dialog.querySelector('[data-checkout-summary]').textContent = 'Товары к оплате: ' + money(snapshot.pricing.total);
      overview.replaceChildren(element('h3', '4. Проверьте заказ'), itemsList(snapshot.items), renderBreakdown(snapshot.pricing), element('strong', 'Товары к оплате: ' + money(snapshot.pricing.total)), element('p', 'Доставка: согласуется индивидуально. В сумму товаров не включена.'), renderTerms(), renderScale(snapshot.pricing.subtotal));
    }
    refreshOverview(); form.append(overview);
    const confirmation = element('label', undefined, 'proto-checkout-correct');
    const correct = element('input'); correct.name = 'correctDetails'; correct.type = 'checkbox'; correct.required = true;
    confirmation.append(correct, element('span', 'Подтверждаю корректность реквизитов и контактных данных.'));
    const submit = element('button', 'Подтвердить заказ', 'btn btn-default'); submit.type = 'submit';
    form.append(confirmation, element('p', 'Это интерактивный прототип. Данные сохраняются только в текущей вкладке браузера. Заказ не отправляется менеджеру; письмо и счёт не формируются.', 'proto-checkout-notice'), status, submit);
    const customerData = () => {
      const data = {};
      for (const input of form.elements) if (input.name && input.name !== 'correctDetails' && !input.disabled) data[input.name] = input.value.trim();
      data.kpp ||= ''; return data;
    };
    const saveDraft = () => { try { sessionStorage.setItem(draftKey, JSON.stringify(customerData())); } catch { status.textContent = 'Не удалось сохранить черновик в браузере.'; } };
    form.addEventListener('input', event => { if (event.target.setCustomValidity) event.target.setCustomValidity(''); status.textContent = ''; saveDraft(); });
    form.addEventListener('change', saveDraft);
    let submitted = false;
    form.addEventListener('submit', event => {
      event.preventDefault(); if (submitted) return;
      const data = customerData();
      for (const input of form.elements) if (input.setCustomValidity) input.setCustomValidity('');
      for (const input of form.elements) if (input.required && input.type !== 'checkbox' && !input.value.trim()) input.setCustomValidity('Заполните это поле.');
      if (!(country.value === 'BY' ? /^\d{9}$/ : /^(\d{10}|\d{12})$/).test(data.taxId)) tax.setCustomValidity(country.value === 'BY' ? 'Укажите УНП из 9 цифр.' : 'Укажите ИНН из 10 или 12 цифр.');
      if (!kpp.disabled && data.kpp && !/^\d{9}$/.test(data.kpp)) kpp.setCustomValidity('КПП должен содержать 9 цифр.');
      const phoneDigits = data.phone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15 || !/^[+\d\s()\-]+$/.test(data.phone)) form.elements.phone.setCustomValidity('Укажите телефон с кодом страны.');
      if (!form.reportValidity()) { status.textContent = 'Проверьте обязательные поля и формат данных.'; return; }
      const latest = getOrder();
      if (!latest) { status.textContent = 'Оформление недоступно: проверьте наличие товаров и минимум 5 000 ₽ до скидок.'; return; }
      if (JSON.stringify(latest) !== JSON.stringify(snapshot)) {
        snapshot = latest; refreshOverview(); status.textContent = 'Состав или стоимость заказа изменились. Проверьте обновлённые итоги и подтвердите заказ ещё раз.'; return;
      }
      submitted = true; submit.disabled = true;
      const order = {...snapshot, customer:data, number:'ДЕМО-' + Date.now().toString(36).toUpperCase(), createdAt:new Date().toISOString()};
      const previousOrder = sessionStorage.getItem(lastOrderKey);
      try {
        sessionStorage.setItem(lastOrderKey, JSON.stringify(order));
        onConfirmed(order);
        sessionStorage.removeItem(draftKey);
      } catch {
        submitted = false; submit.disabled = false;
        try { if (previousOrder === null) sessionStorage.removeItem(lastOrderKey); else sessionStorage.setItem(lastOrderKey, previousOrder); } catch {}
        status.textContent = 'Не удалось сохранить заказ в браузере. Проверьте доступность хранилища и повторите попытку.'; return;
      }
      showConfirmation(dialog, order);
    });
    box.replaceChildren(form);
  }
  function appendLastOrderLink(container) {
    const order = read(lastOrderKey);
    if (!order?.number || !order.customer || !order.pricing || !Array.isArray(order.items)) return;
    const button = element('button', 'Посмотреть заказ ' + order.number, 'btn btn-transparent-border-color');
    button.type = 'button'; button.dataset.lastOrder = '';
    button.addEventListener('click', () => showConfirmation(document.querySelector('#proto-checkout'), order));
    container.append(button);
  }
  window.PolyarikCheckout = {open, appendLastOrderLink};
})();
