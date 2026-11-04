/* VCC — scrollspy compartido para navegaciones secundarias de guías. */
(function(){
'use strict';
function init(){
 const nav=document.querySelector('.st-tabs, .vcc-nav, .content-nav');
 if(!nav)return;
 const links=Array.from(nav.querySelectorAll('a[href^="#"]'));
 const items=links.map(a=>({a,target:document.getElementById(decodeURIComponent(a.hash.slice(1)))})).filter(x=>x.target);
 if(!items.length)return;
 let current=null,frame=0,clickTarget=null,clickDeadline=0;
 const visible=()=>items.filter(x=>getComputedStyle(x.a).display!=='none');
 const topOffset=()=>{
  const header=document.querySelector('.shared-header, .page-header');
  const navHeight=nav.getBoundingClientRect().height||43;
  const headerHeight=header?Math.max(0,Math.min(header.getBoundingClientRect().bottom,header.getBoundingClientRect().height)):0;
  return headerHeight+navHeight+24;
 };
 function setActive(item){
  if(!item)return;
  current=item;
  for(const x of items){
   const on=x===item;
   x.a.classList.toggle('is-active',on);
   x.a.classList.toggle('active',on);
   if(on)x.a.setAttribute('aria-current','location');
   else x.a.removeAttribute('aria-current');
  }
  const scroller=nav.querySelector('.vcc-nav-inner')||nav;
  if(item.a.offsetParent && scroller.scrollWidth>scroller.clientWidth){
   const left=item.a.getBoundingClientRect().left-scroller.getBoundingClientRect().left;
   const right=left+item.a.getBoundingClientRect().width;
   const margin=16;
   if(left<margin||right>scroller.clientWidth-margin){
    scroller.scrollTo({left:scroller.scrollLeft+(left<margin?left-margin:right-scroller.clientWidth+margin),behavior:'smooth'});
   }
  }
 }
 function sync(){
  frame=0;
  const list=visible();
  if(!list.length)return;
  const threshold=topOffset();
  if(clickTarget){
   const top=clickTarget.target.getBoundingClientRect().top;
   if(Math.abs(top-threshold)<40||performance.now()>clickDeadline)clickTarget=null;
   else {setActive(clickTarget);return;}
  }
  const documentBottom=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-5;
  let selected=list[0];
  for(const x of list){if(x.target.getBoundingClientRect().top<=threshold)selected=x;}
  if(documentBottom)selected=list[list.length-1];
  setActive(selected);
 }
 function request(){if(!frame)frame=requestAnimationFrame(sync);}
 for(const item of items){
  item.a.addEventListener('click',()=>{
   clickTarget=item;clickDeadline=performance.now()+1200;
   setActive(item);
   request();
  });
 }
 window.addEventListener('scroll',request,{passive:true});
 window.addEventListener('resize',request,{passive:true});
 window.addEventListener('hashchange',()=>{
  const item=items.find(x=>x.a.hash===location.hash);
  if(item){clickTarget=item;clickDeadline=performance.now()+850;setActive(item);}
  request();
 });
 const initial=items.find(x=>x.a.hash===location.hash);
 if(initial)setActive(initial);
 request();
 window.addEventListener('load',request,{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();