/* VCC · Alojamientos. Carruseles nativos de plataformas y consejos.
   Sin dependencias ni datos externos. */
(() => {
  'use strict';
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function activateCarousel(trackSelector, itemSelector, prevSelector, nextSelector) {
    const track = document.querySelector(trackSelector);
    const items = track && Array.from(track.querySelectorAll(itemSelector));
    const prev = document.querySelector(prevSelector);
    const next = document.querySelector(nextSelector);
    if (!track || !items.length || !prev || !next) return;

    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const positions = () => items.map(item => item.offsetLeft - items[0].offsetLeft);
    const currentIndex = () => {
      const offsets = positions();
      let nearest = 0, distance = Infinity;
      offsets.forEach((x, i) => {
        const d = Math.abs(x - track.scrollLeft);
        if (d < distance) { distance = d; nearest = i; }
      });
      return nearest;
    };
    const update = () => {
      prev.disabled = track.scrollLeft <= 3;
      next.disabled = track.scrollLeft >= maxScroll() - 3;
    };
    const scrollStep = direction => {
      const x = positions();
      const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex() + direction));
      const target = direction > 0 && nextIndex === items.length - 1 ? maxScroll() : Math.min(maxScroll(), x[nextIndex]);
      track.scrollTo({ left: target, behavior: reducedMotion() ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => scrollStep(-1));
    next.addEventListener('click', () => scrollStep(1));
    track.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      scrollStep(event.key === 'ArrowRight' ? 1 : -1);
    });
    let scheduled = false;
    track.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  const boot = () => {
    activateCarousel('[data-al-track]', '.al-card', '[data-al-prev]', '[data-al-next]');
    activateCarousel('[data-al-tips-track]', '.al-tip', '[data-al-tips-prev]', '[data-al-tips-next]');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();

/* Comparación de alojamiento: importes de estancia completa, hasta cinco opciones. */
(function(){
'use strict';
const root=document.querySelector('.al-compare');if(!root)return;
const head=root.querySelector('[data-al-calc-head]'),body=root.querySelector('[data-al-calc-body]');
const scroll=root.querySelector('[data-al-calc-scroll]'),add=root.querySelector('[data-al-add]');
const status=root.querySelector('[data-al-status]'), euro=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
const letters=['A','B','C','D','E'];
const iconRoot='/configuracion/imagenes/iconos/paginas/planifica-alojamientos-comparador-iconos.svg#';
const rows=[
 ['name','Alojamiento','text','hotel'],
 ['base','Dormir / reserva (€)','number','cama'],
 ['breakfast','Desayuno (€)','number','desayuno','breakfastIncluded'],
 ['meals','Otras comidas (€)','number','comida','mealsIncluded'],
 ['taxes','Impuestos y tasas (€)','number','impuestos','taxesIncluded'],
 ['transport','Transporte (€)','number','transporte'],
 ['parking','Parking (€)','number','parking','parkingIncluded'],
 ['other','Otros gastos (€)','number','otros']
];
const monetary=['base','breakfast','meals','taxes','transport','parking','other'];
const blank=()=>({name:'',base:'',breakfastIncluded:false,breakfast:'',mealsIncluded:false,meals:'',taxes:'',transport:'',parkingIncluded:false,parking:'',taxesIncluded:false,other:''});
let offers=[blank(),blank(),blank()];
const fmt=v=>euro.format(v);
const num=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?Math.min(n,1e7):0};
const total=o=>Math.round(monetary.reduce((s,k)=>s+((k==='breakfast'&&o.breakfastIncluded)||(k==='meals'&&o.mealsIncluded)||(k==='parking'&&o.parkingIncluded)||(k==='taxes'&&o.taxesIncluded)?0:num(o[k])),0)*100)/100;
const filled=o=>o.base!==''&&Number.isFinite(Number(o.base))&&Number(o.base)>=0;
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function draw(){
 const oldLeft=scroll.scrollLeft;
 const tr=el('tr');tr.appendChild(el('th',null,'Concepto'));
 offers.forEach((o,i)=>{const th=el('th');th.scope='col';th.appendChild(el('span','al-option-title','Opción '+letters[i]));if(offers.length>1){const b=el('button','al-remove','×');b.type='button';b.dataset.remove=i;b.setAttribute('aria-label','Eliminar opción '+letters[i]);th.appendChild(b)}tr.appendChild(th)});
 head.replaceChildren(tr);body.replaceChildren();scroll.style.setProperty('--al-options',offers.length);
 for(const [key,label,kind,icon,flag] of rows){
  const line=el('tr'),th=el('th');th.scope='row';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','al-compare-icon');svg.setAttribute('aria-hidden','true');
  const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',iconRoot+icon);svg.appendChild(use);th.append(svg,el('span',null,label));line.appendChild(th);
  offers.forEach((o,i)=>{
   const td=el('td'),wrapper=el('div','al-amount-wrap'),input=el('input');
   input.type=kind==='number'?'number':'text';input.value=o[key];
   if(kind==='number'){input.min='0';input.max='10000000';input.step='0.01';input.inputMode='decimal';input.placeholder='0,00'}
   else{input.maxLength=75;input.placeholder='Hotel / apartamento'}
   input.dataset.index=i;input.dataset.key=key;input.setAttribute('aria-label',label+' opción '+letters[i]);
   wrapper.appendChild(input);
   if(flag){
    const included=!!o[flag],labelEl=el('label','al-inline-check'),check=el('input');
    check.type='checkbox';check.checked=included;check.dataset.index=i;check.dataset.key=flag;
    check.setAttribute('aria-label',label+' incluido en la reserva, opción '+letters[i]);
    labelEl.title='Marcar si está incluido en el precio de la reserva';labelEl.append(check,el('span',null,'Incl.'));
    wrapper.classList.toggle('is-included',included);input.disabled=included;
    input.title=included?'Incluido en la reserva: coste adicional 0 €':'Introduce el coste para toda la estancia';
    wrapper.appendChild(labelEl);
   }
   td.appendChild(wrapper);line.appendChild(td);
  });body.appendChild(line);
 }
 const totalRow=el('tr','al-calc-total');const th=el('th');th.scope='row';const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('class','al-compare-icon');icon.setAttribute('aria-hidden','true');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',iconRoot+'total');icon.appendChild(use);th.append(icon,el('span',null,'TOTAL POR OPCIÓN'));totalRow.appendChild(th);
 offers.forEach(o=>{const td=el('td');const pill=el('span','al-total-pill');pill.appendChild(el('strong',null,filled(o)?fmt(total(o)):'—'));td.appendChild(pill);totalRow.appendChild(td)});
 body.appendChild(totalRow);scroll.scrollLeft=oldLeft;
 root.querySelector('[data-al-count]').textContent=offers.length+' de 5 opciones';add.disabled=offers.length>=5;update();
}
function update(){
 const valid=offers.map((o,i)=>({o,i,t:total(o)})).filter(x=>filled(x.o));
 const sorted=valid.sort((a,b)=>a.t-b.t);const best=sorted[0];
 const empty=root.querySelector('[data-al-advice-empty]'),result=root.querySelector('[data-al-advice-result]'),savings=root.querySelector('[data-al-savings]');
 empty.hidden=sorted.length>=2;result.hidden=sorted.length<2;savings.hidden=sorted.length<2;
 if(sorted.length>=2){
 root.querySelector('[data-al-winner]').textContent=(best.o.name.trim()||'Opción '+letters[best.i]);root.querySelector('[data-al-price]').textContent=fmt(best.t);
 const rest=sorted.slice(1).map(x=>'Ahorras '+fmt(x.t-best.t)+' frente a '+(x.o.name.trim()||'opción '+letters[x.i]));
 savings.replaceChildren(el('strong',null,'LO QUE TE AHORRAS'),...rest.map(t=>el('div',null,t)));
 }
 body.querySelectorAll('.al-calc-total td').forEach((td,i)=>{const isBest=sorted.length>=2&&best.i===i;td.dataset.alBest=String(isBest);td.querySelector('strong').textContent=filled(offers[i])?fmt(total(offers[i])):'—'});
 head.querySelectorAll('th').forEach((th,i)=>{if(i>0)th.dataset.alBest=String(sorted.length>=2&&best.i===i-1)});
}
body.addEventListener('input',ev=>{const e=ev.target;if(!e.dataset.key||e.type==='checkbox')return;const i=Number(e.dataset.index);offers[i][e.dataset.key]=e.value;update()});
body.addEventListener('change',ev=>{const e=ev.target;if(e.type!=='checkbox'||!e.dataset.key)return;const i=Number(e.dataset.index);offers[i][e.dataset.key]=e.checked;draw()});
head.addEventListener('click',ev=>{const b=ev.target.closest('[data-remove]');if(!b)return;offers.splice(Number(b.dataset.remove),1);draw()});
add.addEventListener('click',()=>{if(offers.length<5){offers.push(blank());draw();scroll.scrollLeft=scroll.scrollWidth}});
root.querySelector('[data-al-clear]').addEventListener('click',()=>{offers=[blank(),blank(),blank()];draw();status.textContent='Comparación limpiada.'});
function printable(){
 const people=Math.max(1,Math.round(num(root.querySelector('[data-al-personas]').value)||1));
 const nights=Math.max(1,Math.round(num(root.querySelector('[data-al-noches]').value)||1));
 const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const names=offers.map((o,i)=>esc(o.name||'Opción '+letters[i]));
 const tr=(label,values)=>'<tr><th>'+esc(label)+'</th>'+values.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>';
 const lines=rows.filter(r=>r[2]==='number').map(([key,label,,,flag])=>tr(label,offers.map(o=>flag&&o[flag]?'Incluido':fmt(num(o[key])))));
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>VCC · Comparación de alojamientos</title><style>body{font-family:Arial,sans-serif;color:#302720;margin:38px}h1{font-size:30px;margin:5px 0;color:#2b2621}small,.eyebrow{color:#be5b2d}table{border-collapse:collapse;width:100%;font-size:11px;margin-top:24px}td,th{border:1px solid #eaded3;padding:9px;text-align:right}th:first-child{text-align:left}thead{background:#fae8d8}tfoot{background:#fbe0c8;font-weight:bold}p{font-size:12px}.note{margin-top:20px;color:#675e55}@page{size:A4 landscape;margin:12mm}</style></head><body><div class="eyebrow">VIAJANDO CON CABEZA · PLANIFICA TU VIAJE</div><h1>COMPARA EL PRECIO REAL</h1><p>'+people+' personas · '+nights+' noches · Costes totales para toda la estancia</p><table><thead><tr><th>Concepto</th>'+names.map(n=>'<th>'+n+'</th>').join('')+'</tr></thead><tbody>'+lines.join('')+'</tbody><tfoot>'+tr('TOTAL POR OPCIÓN',offers.map(o=>filled(o)?fmt(total(o)):'Sin precio'))+'</tfoot></table><p class="note">Los importes son estimaciones introducidas por el viajero, no tarifas consultadas por VCC. Verifica condiciones, ubicación y cancelación antes de reservar.</p></body></html>';
}
root.querySelector('[data-al-pdf]').addEventListener('click',()=>{
 if(!offers.some(filled)){status.textContent='Introduce al menos un precio de reserva para guardar la comparación.';return}
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;width:0;height:0;border:0;opacity:0';frame.title='Documento para guardar en PDF';document.body.appendChild(frame);
 const doc=frame.contentDocument;doc.open();doc.write(printable());doc.close();
 frame.onload=()=>{try{frame.contentWindow.focus();frame.contentWindow.print();status.textContent='En la ventana de impresión, selecciona «Guardar como PDF».'}catch(e){status.textContent='No se pudo abrir la impresión.'}setTimeout(()=>frame.remove(),90000)};
});
draw();
})();
