(()=>{
const content=document.getElementById('content');
const all=(selector,root=content)=>Array.from(root.querySelectorAll(selector));
all('.swiper').forEach(slider=>{
 const track=slider.querySelector(':scope > .swiper-wrapper');if(!track)return;
 const slides=all(':scope > .swiper-slide',track);if(!slides.length)return;
 let opts={};try{opts=JSON.parse(slider.dataset.pluginOptions||'{}')}catch{}
 const main=slider.classList.contains('main-slider');
 let index=main?Number(slider.dataset.index||0):0;
 let step=0,visible=1;
 function layout(){
  const w=slider.clientWidth;if(!w)return;
  let conf={...opts};for(const bp of Object.keys(opts.breakpoints||{}).sort((a,b)=>a-b))if(innerWidth>=Number(bp))Object.assign(conf,opts.breakpoints[bp]);
  let count=main?1:Number(conf.slidesPerView);
  if(!Number.isFinite(count)||!count)count=innerWidth>=1200?3:innerWidth>=768?2:1;
  visible=count;const gap=Number(conf.spaceBetween||0);step=(w-gap*(count-1))/count+gap;
  slides.forEach(s=>{s.style.width=`${step-gap}px`;s.style.marginRight=`${gap}px`;s.style.flexShrink='0'});
  move(index);
 }
 function move(n){index=Math.max(0,Math.min(n,Math.max(0,slides.length-Math.floor(visible))));track.style.transform=`translate3d(${-index*step}px,0,0)`;slides.forEach((s,i)=>{s.classList.toggle('swiper-slide-active',i===index);s.setAttribute('aria-hidden',String(i<index||i>=index+visible))});all('.swiper-pagination-bullet',slider).forEach((b,i)=>{b.classList.toggle('swiper-pagination-bullet-active',i===index);b.setAttribute('aria-label',`Слайд ${i+1}`);b.setAttribute('aria-current',i===index?'true':'false')});}
 const controls=slider.closest('.relative')||slider;
 all('.swiper-button-next',controls).forEach(b=>b.addEventListener('click',()=>move(index>=slides.length-Math.floor(visible)?0:index+1)));
 all('.swiper-button-prev',controls).forEach(b=>b.addEventListener('click',()=>move(index<=0?slides.length-Math.floor(visible):index-1)));
 all('.swiper-pagination-bullet',slider).forEach((b,i)=>{b.tabIndex=0;b.setAttribute('role','button');b.addEventListener('click',()=>move(i));b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')move(i)})});
 let start;slider.addEventListener('touchstart',e=>{start=e.touches[0].clientX},{passive:true});slider.addEventListener('touchend',e=>{if(start!==undefined&&Math.abs(e.changedTouches[0].clientX-start)>50)move(index+(e.changedTouches[0].clientX<start?1:-1))},{passive:true});
 new ResizeObserver(layout).observe(slider);layout();
});

// Original catalog tab lists and panes remain intact.
all('.tabs li').forEach(li=>li.addEventListener('click',()=>{
 const list=li.parentElement;const i=[...list.children].indexOf(li);const block=li.closest('.tab_slider_wrapp,.tabs_slider,.CATALOG_TAB,.item-views')||list.parentElement;
 const panes=all('.tabs_content > li,.tab-content > .tab-pane',block);if(!panes.length)return;
 if(panes[i]&&!panes[i].querySelector('.catalog_item')){panes[i].innerHTML=panes[0].innerHTML;all('[id]',panes[i]).forEach(x=>x.removeAttribute('id'));}
 [...list.children].forEach(x=>{x.classList.toggle('active',x===li);x.classList.toggle('cur',x===li)});panes.forEach((p,j)=>{p.classList.toggle('active',i===j);p.classList.toggle('cur',i===j);p.classList.toggle('opacity1',i===j);p.style.display=i===j?'block':'none'});
}));

})();
