(() => {
  const sections = [['Описание','desc'], ['Отзывы','reviews'], ['Как купить','buy'], ['Оплата','payment'], ['Доставка','delivery']];
  const element = (tag, text, className) => {
    const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node;
  };
  function reviews(panel, product) {
    const key = 'polyarik-reviews-' + product.id;
    let entries;
    try { entries = JSON.parse(sessionStorage.getItem(key) || '[]'); } catch {}
    if (!Array.isArray(entries)) entries = [];
    entries = entries.filter(e=>e && typeof e.author==='string' && typeof e.review==='string' && /^[1-5]$/.test(String(e.rating))).slice(0,50);
    const empty = element('p','У этого товара пока нет отзывов.');
    const list = element('div',undefined,'proto-review-list'); list.dataset.reviewList='';
    const open = element('button','Написать отзыв','btn btn-default'); open.type='button'; open.dataset.reviewOpen=''; open.setAttribute('aria-expanded','false'); open.setAttribute('aria-controls','product-review-form');
    const form = element('form',undefined,'proto-review-form'); form.id='product-review-form'; form.dataset.reviewForm=''; form.hidden=true;
    const heading = element('h3','Ваш отзыв о товаре');
    function field(name,title,type) {
      const label=element('label',title); const input=element(type==='textarea'?'textarea':'input'); if(type!=='textarea')input.type='text';
      input.name=name;input.id='review-'+name;input.required=true;input.maxLength=name==='author'?80:2000;label.htmlFor=input.id;form.append(label,input);return input;
    }
    form.append(heading);
    const author=field('author','Ваше имя *','text'); author.autocomplete='name';
    const ratingLabel=element('label','Оценка *');ratingLabel.htmlFor='review-rating';
    const rating=element('select');rating.name='rating';rating.id='review-rating';rating.required=true;
    for(const value of [5,4,3,2,1]){const option=element('option',value+' из 5');option.value=String(value);rating.append(option);}form.append(ratingLabel,rating);
    const review=field('review','Текст отзыва *','textarea');
    const note=element('p','Демонстрационная форма: отзыв сохраняется только в этой вкладке браузера, не отправляется и не публикуется.','muted');
    const submit=element('button','Сохранить демо-отзыв','btn btn-default');submit.type='submit';
    const cancel=element('button','Отмена','btn btn-transparent-border-color');cancel.type='button';
    const actions=element('div',undefined,'proto-review-actions');actions.append(submit,cancel);form.append(note,actions);
    const status=element('p');status.dataset.reviewStatus='';status.setAttribute('role','status');
    function showForm(visible){form.hidden=!visible;open.setAttribute('aria-expanded',String(visible));if(visible)author.focus();else open.focus();}
    function render(){
      empty.hidden=entries.length>0;list.replaceChildren();
      for(const entry of entries){const card=element('article',undefined,'proto-review-card');card.append(element('strong',entry.author),element('p','Оценка: '+entry.rating+' из 5'),element('p',entry.review),element('small','Демонстрационный отзыв · '+(entry.date||'')));list.append(card);}
    }
    open.addEventListener('click',()=>showForm(form.hidden));cancel.addEventListener('click',()=>{form.reset();showForm(false);});
    form.addEventListener('input',event=>event.target.setCustomValidity?.(''));
    form.addEventListener('submit',event=>{
      event.preventDefault();author.setCustomValidity(author.value.trim()?'':'Введите имя.');review.setCustomValidity(review.value.trim()?'':'Напишите отзыв.');
      if(!form.reportValidity() || !/^[1-5]$/.test(rating.value))return;
      const next=[{author:author.value.trim(),rating:Number(rating.value),review:review.value.trim(),date:new Date().toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'})},...entries].slice(0,50);
      try {sessionStorage.setItem(key,JSON.stringify(next));} catch {status.textContent='Не удалось сохранить отзыв в браузере. Попробуйте ещё раз.';return;}
      entries=next;render();form.reset();showForm(false);status.textContent='Демо-отзыв сохранён в этой вкладке. Он не опубликован и не отправлен на сайт.';
    });
    panel.replaceChildren(element('h2','Отзывы о товаре'),empty,open,form,list,status);render();
  }
  function mount(product) {
    const content=document.querySelector('.js-store-scroll > .tab-content');if(!content || content.dataset.productTabsReady)return;content.dataset.productTabsReady='true';
    for(const panel of [...content.children])if(!sections.some(([,id])=>id===panel.id))panel.remove();
    const panels=new Map();for(const [label,id]of sections){let panel=content.querySelector('#'+id);if(!panel){panel=element('section');panel.id=id;panel.className='tab-pane';content.append(panel);}panel.setAttribute('role','tabpanel');panel.setAttribute('aria-label',label);panel.tabIndex=0;panels.set(id,panel);}
    const copy=(id,title,paragraphs)=>{panels.get(id).replaceChildren(element('h2',title),...paragraphs.map(text=>element('p',text)));};
    copy('buy','Как купить',[
      'Продажи осуществляются оптом для компаний. Товары добавляются в корзину упаковками; количество изделий и цена за упаковку указаны в карточке.',
      'Минимальная стоимость товаров в заказе — 5 000 ₽ до скидок. Выберите нужное количество упаковок и перейдите в корзину.',
      'При оформлении укажите реквизиты компании, контактное лицо, телефон, email, транспортную компанию и город доставки.',
      'После оформления менеджер согласует состав заказа, оплату и условия доставки. После согласования выставляется счёт на оплату.'
    ]);
    copy('payment','Оплата',[
      'Оплата производится по счёту на расчётный счёт поставщика.',
      'Состав заказа и условия оплаты согласуются с менеджером индивидуально. Счёт выставляется после согласования заказа.',
      'В прототипе онлайн-оплата и формирование счёта не выполняются.'
    ]);
    copy('delivery','Доставка',[
      'Доставка осуществляется транспортной компанией. Укажите удобную ТК и город доставки при оформлении заказа; при необходимости добавьте адрес или терминал и комментарий.',
      'Стоимость, сроки и другие условия доставки согласуются индивидуально с менеджером. Автоматического расчёта тарифа на сайте нет.',
      'Стоимость доставки не включена в отображаемую сумму товаров.'
    ]);
    reviews(panels.get('reviews'),product);
    const strips=[...document.querySelectorAll('.js-store-scroll > .tabs.arrow_scroll, .product-item-detail-tabs-wrapper')];
    const links=[];
    function select(id,scroll=false){
      if(!panels.has(id))id='desc';
      for(const [key,panel]of panels){panel.hidden=key!==id;panel.classList.toggle('active',key===id);}
      for(const link of links){const active=link.hash==='#'+id;link.setAttribute('aria-selected',String(active));link.tabIndex=active?0:-1;link.closest('li').classList.toggle('active',active);}
      if(scroll)panels.get(id).scrollIntoView({block:'start',behavior:'smooth'});
    }
    function activate(id){if(location.hash!=='#'+id)history.pushState(null,'','#'+id);select(id,true);}
    const deliveryShortcut=document.querySelector('.product-container .calculate-delivery');
    if(deliveryShortcut){const link=element('a','Доставка — по индивидуальному согласованию');link.href='#delivery';link.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();activate('delivery');});deliveryShortcut.replaceChildren(link);}
    strips.forEach((strip,index)=>{
      const track=strip.querySelector('ul.nav-tabs');if(!track)return;track.setAttribute('role','tablist');track.setAttribute('aria-label','Информация о товаре');track.replaceChildren();
      const local=[];
      for(const [label,id]of sections){const li=element('li',undefined,'bordered rounded3');li.setAttribute('role','presentation');const link=element('a',label);link.href='#'+id;link.id='product-tab-'+index+'-'+id;link.setAttribute('role','tab');link.setAttribute('aria-controls',id);
        link.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();activate(id);});
        li.append(link);track.append(li);links.push(link);local.push(link);
      }
      track.addEventListener('keydown',event=>{const at=local.indexOf(event.target);if(at<0)return;let next;
        if(event.key==='ArrowRight')next=(at+1)%local.length;else if(event.key==='ArrowLeft')next=(at+local.length-1)%local.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=local.length-1;else return;
        event.preventDefault();local[next].focus();activate(local[next].hash.slice(1));
      });
    });
    const fromHash=()=>select(location.hash.slice(1));window.addEventListener('hashchange',fromHash);window.addEventListener('popstate',fromHash);fromHash();
  }
  window.PolyarikProductTabs={mount};
})();
