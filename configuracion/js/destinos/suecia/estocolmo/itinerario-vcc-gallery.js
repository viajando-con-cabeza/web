/* VCC · Resum de l'itinerari d'Estocolm.
   El visor reutilitzable viu a /configuracion/js/componentes/vcc-gallery-booking.js. */
(() => {
'use strict';
const overview=document.querySelector('.overview-list');
if(overview && overview.querySelectorAll('.overview-card').length > 3){
 const cards=[...overview.querySelectorAll('.overview-card')];
 const pages=Math.ceil(cards.length/3),controls=document.createElement('div');controls.className='vcc-overview-controls';controls.setAttribute('aria-label','Páginas del resumen');
 const previous=document.createElement('button');previous.type='button';previous.textContent='‹';previous.setAttribute('aria-label','Grupo anterior de días');
 const dots=document.createElement('div');dots.className='vcc-overview-dots';const next=document.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label','Grupo siguiente de días');
 controls.append(previous,dots,next);overview.append(controls);let page=0,gestureX=null,gestureY=null;
 const render=(p)=>{page=Math.max(0,Math.min(pages-1,p));cards.forEach((card,i)=>{card.hidden=Math.floor(i/3)!==page;card.style.display=card.hidden?'none':'';});previous.disabled=page===0;next.disabled=page===pages-1;[...dots.children].forEach((dot,i)=>dot.setAttribute('aria-current',String(i===page)));};
 for(let i=0;i<pages;i++){const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label',`Mostrar días ${i*3+1} a ${Math.min((i+1)*3,cards.length)}`);dot.addEventListener('click',()=>render(i));dots.append(dot);}
 previous.addEventListener('click',()=>render(page-1));next.addEventListener('click',()=>render(page+1));overview.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;gestureX=e.clientX;gestureY=e.clientY;});overview.addEventListener('pointerup',e=>{if(gestureX===null)return;const dx=e.clientX-gestureX,dy=e.clientY-gestureY;gestureX=gestureY=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2){e.preventDefault();render(page+(dx<0?1:-1));}});overview.addEventListener('pointercancel',()=>{gestureX=gestureY=null;});controls.hidden=pages<=1;render(0);
}
})();
