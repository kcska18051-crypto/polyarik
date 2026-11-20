(() => {
  const all=(s,r=document)=>[...r.querySelectorAll(s)];
  const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  const params=new URLSearchParams(location.search);
  const money=n=>Number(n).toLocaleString('ru-RU')+' ₽';
  const productUrl=p=>'product.html?'+new URLSearchParams({sku:p.id});
  function recommendations(products){
    const grid=document.querySelector('[data-template-recommendations]');if(!grid)return;
    const selected=products.map((product,index)=>({product,index})).filter(x=>x.product.promoOffers?.includes('recommendations')).slice(0,15);
    const sample=document.querySelector('#aspro-product-card').content.firstElementChild;
    const more=document.querySelector('[data-recommendations-more]');let count=8;
    const render=()=>{grid.replaceChildren(...selected.slice(0,count).map(x=>window.PolyarikCatalogUI.card(sample,x.product,x.index)));more.hidden=count>=selected.length;};
    more.addEventListener('click',()=>{count=15;render();});render();
  }
  function looks(products){
    for(const block of all('[data-template-looks]')){
      const looks=[['DEMO-A5','DEMO-A4','DEMO-A3'],['DEMO-A29','DEMO-A4','DEMO-A7'],['DEMO-A13','DEMO-A4','DEMO-A3'],['DEMO-A5','DEMO-A8','DEMO-A25'],['DEMO-A29','DEMO-A4','DEMO-A34']];
      let index=Math.max(0,Math.min(4,(Number(params.get('look'))||1)-1));
      const sample=document.querySelector('#aspro-simple-product').content.firstElementChild;
      const render=()=>{
        const card=block.querySelector('[data-look-card]');
        const link=card.querySelector('.lookbook__info-title a');link.textContent='Образ №'+(index+1);link.href='looks.html?look='+(index+1);
        for(const a of all('a',block)){const url=new URL(a.href);if(url.pathname.endsWith('/looks.html')&&url.searchParams.has('look'))a.href=link.href;}
        const items=card.querySelector('.lookbook__items');items.replaceChildren();
        const list=el('div',undefined,'content_wrapper_block catalog_list_simple');const rows=el('div',undefined,'block-items');list.append(rows);
        for(const id of looks[index]){
          const product=products.find(p=>p.id===id);if(!product)continue;
          const row=sample.cloneNode(true);row.dataset.product=products.indexOf(product);all('[id]',row).forEach(e=>e.removeAttribute('id'));
          const image=row.querySelector('.image-wrapper img');image.src=product.photos[0];image.alt=product.name;
          for(const a of all('a',row))a.href=productUrl(product);
          const info=row.querySelector('.block-item__info');info.replaceChildren();
          const title=el('a',product.name,'dark_link font_xs option-font-bold');title.href=productUrl(product);
          const price=el('div',money(product.price*product.n)+' / упак.','price');
          const buy=el('button','В корзину','btn btn-default to-cart proto-catalog-add');buy.type='button';buy.disabled=Boolean(product.unavailable);buy.setAttribute('aria-label','В корзину: '+product.name+', арт. '+product.id);
          info.append(title,el('div','Арт. '+product.id,'muted font_xs'),price,el('small',product.n+' шт. в упаковке'),buy);rows.append(row);
        }
        items.append(list);
        block.querySelector('[data-look-position]').textContent=(index+1)+' / '+looks.length;
      };
      block.querySelector('[data-look-prev]').addEventListener('click',()=>{index=(index+4)%5;render();});block.querySelector('[data-look-next]').addEventListener('click',()=>{index=(index+1)%5;render();});render();
    }
  }
  function gallery(){
    const select=document.querySelector('[data-template-gallery-season]');const block=document.querySelector('[data-template-gallery]');if(!block)return;
    if(select)select.addEventListener('change',()=>all('[data-season]',block).forEach(e=>{e.hidden=select.value!=='all'&&e.dataset.season!==select.value;}));
    const album=Number(params.get('album'));if(!album||!select)return;
    if(album<1||album>4){block.replaceChildren(el('p','Альбом не найден.'));return;}
    select.parentElement.hidden=true;const name=['Весна','Лето','Осень','Зима'][album-1];
    const main=block.querySelector('.maxwidth-theme');main.replaceChildren();main.append(el('h2',name+' — фотосессия'),el('p','Макет альбома. Здесь будут фотографии образов и видео со съёмки.'));
    const photo=el('div',undefined,'aspro-album-photo');const image=el('img');image.src='assets/news/placeholder.svg';image.alt='Место для фотографии '+name.toLowerCase();photo.append(image);main.append(photo);
    const thumbs=el('div',undefined,'aspro-album-thumbs');for(let i=1;i<=4;i++){const b=el('button','Фото '+i,'btn btn-transparent-border-color');b.type='button';b.setAttribute('aria-pressed',String(i===1));b.addEventListener('click',()=>{image.alt='Место для фотографии '+i;all('button',thumbs).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});thumbs.append(b);}main.append(thumbs,el('h3','Видео со съёмки'),el('p','Видео будет добавлено после получения материалов.'));
    const back=el('a','Все альбомы','btn btn-default');back.href='gallery.html';main.append(back);
  }
  const campaign=params.get('campaign');
  if(campaign&&location.pathname.endsWith('/offers.html')){const name=['Промокоды','Подарки и бонусы','Доставка в подарок'][Number(campaign)-1];const main=document.querySelector('main');main.replaceChildren(el('h2',name||'Акция не найдена'),el('p','Макет страницы акции. Условия, сроки и материалы будут опубликованы после согласования.'));const back=el('a','Все акции','btn btn-default');back.href='offers.html';main.append(back);}
  gallery();
  const needProducts=document.querySelector('[data-template-recommendations],[data-template-looks]');
  if(needProducts)fetch('products.json?v=5').then(r=>r.json()).then(products=>{recommendations(products);looks(products);}).catch(()=>{needProducts.replaceChildren(el('p','Не удалось загрузить товары. Обновите страницу.'));});
})();
