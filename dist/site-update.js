(() => {
  const all=(s,r=document)=>[...r.querySelectorAll(s)];
  const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  const money=n=>Number(n||0).toLocaleString('ru-RU')+' ₽';
  const read=key=>{try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}};
  const header = document.querySelector('#header');
  const fixedHeader = document.querySelector('#headerfixed');
  if (header && fixedHeader && typeof matchMedia === 'function') {
    const desktop = matchMedia('(min-width: 992px)');
    function updateFixedHeader() {
      const visible = desktop.matches && header.getBoundingClientRect().bottom <= 0;
      fixedHeader.classList.toggle('fixed', visible);
      fixedHeader.inert = !visible;
    }
    updateFixedHeader();
    addEventListener('scroll', updateFixedHeader, { passive: true });
    addEventListener('resize', updateFixedHeader);
    addEventListener('pageshow', updateFixedHeader);
    if (typeof ResizeObserver === 'function') new ResizeObserver(updateFixedHeader).observe(header);
  }

  const callbackTriggers = all('span.callback-block');
  if (callbackTriggers.length) {
    const dialog = el('dialog', undefined, 'proto-callback-dialog');
    dialog.setAttribute('aria-labelledby', 'callback-heading');
    dialog.innerHTML = `<button class="proto-callback-close" type="button" data-close-callback aria-label="Закрыть">×</button>
      <form>
        <h2 id="callback-heading">Заказать звонок</h2>
        <div class="proto-callback-field">
          <label for="callback-name">Ваше имя <span aria-hidden="true">*</span></label>
          <input class="form-control" id="callback-name" name="name" autocomplete="name" maxlength="120" required autofocus>
        </div>
        <div class="proto-callback-field">
          <label for="callback-phone">Телефон <span aria-hidden="true">*</span></label>
          <div class="proto-callback-phone">
            <select name="country" aria-label="Страна телефона">
              <option value="RU" data-prefix="7" data-length="10" data-example="+7 912 345-67-89">🇷🇺 +7</option>
              <option value="BY" data-prefix="375" data-length="9" data-example="+375 29 123-45-67">🇧🇾 +375</option>
              <option value="KZ" data-prefix="7" data-length="10" data-example="+7 701 123-45-67">🇰🇿 +7</option>
            </select>
            <input class="form-control" id="callback-phone" name="phone" type="tel" autocomplete="tel" placeholder="+7 912 345-67-89" maxlength="32" required>
          </div>
        </div>
        <label class="proto-callback-captcha">
          <input type="checkbox" name="demoVerification" required>
          <span><strong>Я не робот</strong><span>Нажмите, чтобы продолжить</span><small>Демонстрационная проверка</small></span>
        </label>
        <label class="proto-callback-consent">
          <input type="checkbox" name="consent" role="switch" required>
          <span>Даю согласие на обработку персональных данных</span>
        </label>
        <label class="proto-callback-consent">
          <input type="checkbox" name="agreement" role="switch" required>
          <span>Принимаю пользовательское соглашение</span>
        </label>
        <div class="proto-callback-actions">
          <button class="btn btn-default" type="submit">Отправить</button>
          <span>* — обязательные поля</span>
        </div>
        <p role="status" class="proto-callback-status"></p>
      </form>`;
    const form = dialog.querySelector('form');
    const name = form.elements.namedItem('name');
    const phone = form.elements.namedItem('phone');
    const status = form.querySelector('[role="status"]');
    const country = form.elements.namedItem('country');
    function updatePhoneExample() {
      phone.placeholder = country.selectedOptions[0].dataset.example;
    }
    country.addEventListener('change', () => {
      updatePhoneExample();
      validate();
      status.textContent = '';
    });
    form.addEventListener('reset', () => queueMicrotask(updatePhoneExample));
    function validate() {
      name.setCustomValidity(name.value.trim() ? '' : 'Укажите ваше имя.');
      const value = phone.value.trim();
      const digits = value.replace(/\D/g, '');
      const { prefix, length } = country.selectedOptions[0].dataset;
      const nationalLength = Number(length);
      const international = digits.startsWith(prefix) && digits.length === prefix.length + nationalLength;
      const national = digits.length === nationalLength || (prefix === '7' && /^8\d{10}$/.test(digits));
      const validPhone = /^\+?[\d\s().-]+$/.test(value) && (international || (!value.startsWith('+') && national));
      phone.setCustomValidity(validPhone ? '' : 'Введите телефон с кодом региона или страны.');
    }
    form.addEventListener('input', () => {
      validate();
      status.textContent = '';
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      validate();
      if (!form.reportValidity()) return;
      form.reset();
      status.textContent = 'Форма заполнена корректно. Заявка не отправлена: это демонстрационный сайт.';
    });
    dialog.querySelector('[data-close-callback]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      form.reset();
      name.setCustomValidity('');
      phone.setCustomValidity('');
      status.textContent = '';
    });
    document.body.append(dialog);
    for (const trigger of callbackTriggers) {
      const button = el('button', trigger.textContent, trigger.className);
      button.type = 'button';
      button.setAttribute('aria-haspopup', 'dialog');
      button.style.cssText = 'border:0;background:none;padding:0;text-align:inherit';
      button.addEventListener('click', () => dialog.showModal());
      trigger.replaceWith(button);
    }
  }
  // Header balance reflects the existing account, with no new bonus grants.
  function balance(){
    const customer=window.PolyarikLoyalty?.profile();
    all('[data-header-bonuses]').forEach(e=>e.remove());
    if(!customer)return;
    const a=el('a','Ваши бонусы: '+money(customer.balance),'meeting-header-bonuses');a.href='account.html?view=bonuses';a.dataset.headerBonuses='';
    document.querySelector('#header .right-icons > .line-block')?.prepend(a);
    const mobile=a.cloneNode(true);document.querySelector('#mobilemenu .meeting-mobile-nav, #mobilemenu .proto-mobile-primary')?.prepend(mobile);
  }
  balance();addEventListener('pageshow',balance);addEventListener('storage',balance);
  all('a[href="compare.html"],.compare_item_button').forEach(e=>e.remove());
  all('#mobilemenu a').forEach(a=>{if(a.querySelector('span')?.textContent.trim()==='Красногорск') (a.closest('li')||a.parentElement).remove();});
  // The mobile menu has a direct, visible route to the same navigation.
  const menu=document.querySelector('#mobilemenu');
  if(menu&&!menu.querySelector('.meeting-mobile-nav')){
    const nav=el('nav',undefined,'meeting-mobile-nav');nav.setAttribute('aria-label','Основные разделы');
    for(const [title,href]of [['Каталог','catalog.html'],['Акции','offers.html'],['Спецпредложения','specials.html'],['Оптовикам','wholesale.html'],['Условия работы','buy.html'],['Производство','services.html'],['О компании','about.html'],['Контакты','contacts.html'],['Новости','news.html'],['Галерея','gallery.html']]){
      if(['Контакты','Новости'].includes(title))continue;
      if(title==='О компании'||title==='Условия работы'){
        const details=el('details',undefined,'meeting-menu');details.append(el('summary',title));const links=el('div');
        const items=title==='О компании'?[['О компании','about.html'],['Контакты','contacts.html'],['Новости','news.html']]:[['Оплата','payment.html'],['Доставка','delivery.html']];
        for(const [label,url]of items){const a=el('a',label);a.href=url;links.append(a);}details.append(links);nav.append(details);
      }else{const a=el('a',title);a.href=href;nav.append(a);}
    }
    const primary=menu.querySelector('.proto-mobile-primary');if(primary)primary.replaceWith(nav);else menu.prepend(nav);
  }
  balance();
  const carriers=[['','Выберите транспортную компанию'],['СДЭК','СДЭК'],['ПЭК','ПЭК'],['Деловые линии','Деловые линии'],['Ozon','Ozon'],['other','Ваша транспортная компания']];
  const profile=document.querySelector('[data-account-panel="profile"]');
  if(profile){
    const form=el('form',undefined,'meeting-delivery-form');form.dataset.deliveryPreferences='';form.append(el('h2','Предпочтения по доставке'));
    const values=read('polyarik-delivery-preferences')||{};
    function field(name,title,type='text',required=false){const label=el('label',title);const input=el(type==='select'?'select':'input');input.id='profile-'+name;input.name=name;input.required=required;input.maxLength=120;label.htmlFor=input.id;if(type==='select')for(const [v,t]of carriers){const o=el('option',t);o.value=v;input.append(o);}else input.type='text';input.value=values[name]||'';const wrap=el('div');wrap.append(label,input);form.append(wrap);return input;}
    const carrier=field('carrier','Транспортная компания *','select',true);
    const tariff=field('tariff','Тариф (необязательно)');
    const other=field('carrierOther','Ваша транспортная компания *','text',true);
    function update(){other.parentElement.hidden=carrier.value!=='other';other.disabled=carrier.value!=='other';other.required=carrier.value==='other';}
    carrier.addEventListener('change',update);update();
    const save=el('button','Сохранить','btn btn-default');save.type='submit';const status=el('p');status.setAttribute('role','status');form.append(save,status,el('p','Предпочтения сохраняются в этой вкладке и подставляются в новое оформление заказа.','muted'));
    form.addEventListener('submit',e=>{e.preventDefault();other.setCustomValidity(other.disabled||other.value.trim()?'':'Укажите название компании.');if(!form.reportValidity())return;try{sessionStorage.setItem('polyarik-delivery-preferences',JSON.stringify({carrier:carrier.value,carrierOther:other.disabled?'':other.value.trim(),tariff:tariff.value.trim()}));status.textContent='Предпочтения сохранены.';}catch{status.textContent='Не удалось сохранить предпочтения.';}});other.addEventListener('input',()=>other.setCustomValidity(''));profile.append(form);
  }
  const moderation=document.querySelector('[data-moderation]');
  if(moderation){
    function render(){moderation.replaceChildren();let count=0;
      for(let i=0;i<sessionStorage.length;i++){const key=sessionStorage.key(i);if(!key.startsWith('polyarik-reviews-'))continue;const entries=read(key);if(!Array.isArray(entries))continue;
        entries.forEach((entry,index)=>{count++;const card=el('article',undefined,'meeting-tile');card.append(el('h2',entry.author+' · '+key.replace('polyarik-reviews-','')),el('p',entry.approved?'Опубликован':'Ожидает модерации'));
          const text=el('textarea');text.value=entry.review;text.maxLength=2000;text.setAttribute('aria-label','Текст отзыва');card.append(text);
          for(const [label,action]of [['Сохранить правки',()=>{if(!text.value.trim())return;entry.review=text.value.trim();entry.approved=false;}],['Опубликовать',()=>{entry.approved=true;}],['Снять с публикации',()=>{entry.approved=false;}],['Удалить',()=>{entries.splice(index,1);}]]){const button=el('button',label,'btn btn-transparent-border-color');button.type='button';button.addEventListener('click',()=>{action();sessionStorage.setItem(key,JSON.stringify(entries));render();});card.append(button);}const link=el('a','Открыть товар');link.href='product.html?sku='+encodeURIComponent(key.replace('polyarik-reviews-',''))+'#reviews';card.append(link);moderation.append(card);
        });
      }if(!count)moderation.append(el('p','Нет отзывов на модерации. Отправьте демо-отзыв из карточки товара в этой вкладке.'));
    }render();
  }
})();
