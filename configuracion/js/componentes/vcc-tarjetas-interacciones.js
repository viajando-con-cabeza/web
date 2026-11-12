/* VCC · Tarjetas de viaje: controles del carrusel editorial y exportación PDF.
 * No duplica el controlador de tarjetas existente.
 */
(() => {
 'use strict';
 const track=document.querySelector('[data-tv-errors-track]');
 const previous=document.querySelector('[data-tv-errors-prev]');
 const next=document.querySelector('[data-tv-errors-next]');
 if(track&&previous&&next){
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  const metrics=()=>{
   const card=track.querySelector('.tv-error-card');
   const gap=Number.parseFloat(getComputedStyle(track).columnGap)||0;
   const step=card?card.getBoundingClientRect().width+gap:track.clientWidth;
   const end=Math.max(0,track.scrollWidth-track.clientWidth);
   return {step,end,index:Math.round(track.scrollLeft/Math.max(1,step))};
  };
  const refresh=()=>{
   const {end}=metrics();
   previous.disabled=track.scrollLeft<=3;
   next.disabled=track.scrollLeft>=end-3;
  };
  const advance=direction=>{
   const {step,end,index}=metrics();
   track.scrollTo({left:Math.max(0,Math.min(end,(index+direction)*step)),behavior:motion});
  };
  previous.addEventListener('click',()=>advance(-1));
  next.addEventListener('click',()=>advance(1));
  track.addEventListener('keydown',event=>{
   if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
    event.preventDefault();advance(event.key==='ArrowLeft'?-1:1);
   }
  });
  track.addEventListener('scroll',refresh,{passive:true});
  window.addEventListener('resize',refresh,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(refresh).observe(track);
  refresh();
 }
 const button=document.querySelector('[data-tv-export-pdf]');
 const status=document.getElementById('tv-pdf-status');
 const values=['purchases','bank','travel','markup','travelMarkup','cash','atmBank','atmTravel'];
 const value=key=>{
  const input=document.querySelector('[data-tv-cost="'+key+'"]');
  const number=Number(input?.value);
  return Number.isFinite(number)?Math.max(0,Math.min(number,100000000)):0;
 };
 const eurosFromText=text=>{
  const normalized=String(text||'').replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.');
  const amount=Number(normalized);
  return Number.isFinite(amount)?amount:NaN;
 };
 button?.addEventListener('click',async()=>{
  if(button.disabled)return;
  const bankText=document.getElementById('tv-bank-total')?.textContent?.trim();
  const travelText=document.getElementById('tv-travel-total')?.textContent?.trim();
  const difference=eurosFromText(bankText)-eurosFromText(travelText);
  if(!bankText||!travelText||!Number.isFinite(difference)){
   if(status)status.textContent='Introduce los importes de la calculadora antes de guardar el PDF.';
   return;
  }
  button.disabled=true;
  if(status)status.textContent='Preparando tu PDF de VCC...';
  try{
   const inputs=Object.fromEntries(values.map(key=>[key,value(key)]));
   const {exportarAhorroTarjetasPDF}=await import('/configuracion/js/componentes/vcc-tarjetas-pdf.js?v=20261112-dos-columnas-v2');
   const file=await exportarAhorroTarjetasPDF({inputs,bankText,travelText,difference});
   if(status)status.textContent='PDF descargado: '+file;
  }catch(error){
   if(status)status.textContent=error?.message||'No se pudo generar el PDF. Inténtalo otra vez.';
  }finally{button.disabled=false}
 });
})();
