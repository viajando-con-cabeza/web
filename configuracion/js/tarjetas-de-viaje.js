/* Tarjetas de viaje | VCC: carrusel y calculadora sin dependencias. */
(() => {
  // Carrusel de tarjetas: una posición por tarjeta, con controles a ambos lados.
  const track=document.querySelector('[data-tv-carousel]');
  if(track){
    const previous=document.querySelector('[data-tv-prev]');
    const next=document.querySelector('[data-tv-next]');
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
    const metrics=()=>{
      const first=track.querySelector('.tv-card');
      const gap=Number.parseFloat(getComputedStyle(track).columnGap)||0;
      const step=first?first.getBoundingClientRect().width+gap:track.clientWidth;
      const end=Math.max(0,track.scrollWidth-track.clientWidth);
      const index=Math.round(track.scrollLeft/Math.max(1,step));
      return {step,end,index};
    };
    const refresh=()=>{
      const {end}=metrics();
      previous.disabled=track.scrollLeft<=3;
      next.disabled=track.scrollLeft>=end-3;
    };
    const advance=(direction)=>{
      const {step,end,index}=metrics();
      track.scrollTo({left:Math.min(end,Math.max(0,(index+direction)*step)),behavior:motion});
    };
    previous.addEventListener('click',()=>advance(-1));
    next.addEventListener('click',()=>advance(1));
    track.addEventListener('keydown',(event)=>{
      if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
        event.preventDefault();
        advance(event.key==='ArrowRight'?1:-1);
      }
    });
    track.addEventListener('scroll',refresh,{passive:true});
    window.addEventListener('resize',refresh,{passive:true});
    if('ResizeObserver' in window)new ResizeObserver(refresh).observe(track);
    refresh();
  }

  const inputs=[...document.querySelectorAll('[data-tv-cost]')];
  const bankTotal=document.getElementById('tv-bank-total');
  const travelTotal=document.getElementById('tv-travel-total');
  const saving=document.getElementById('tv-saving');
  const savingText=document.getElementById('tv-saving-label');
  const savingBox=document.getElementById('tv-saving-box');
  if(inputs.length && bankTotal && travelTotal && saving && savingText && savingBox){
    const euro=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
    const amount=(name)=>{
      const input=document.querySelector('[data-tv-cost="'+name+'"]');
      return Math.min(100000000,Math.max(0,Number(input?.value)||0));
    };
    const percentage=(name)=>Math.min(100,amount(name));
    const update=()=>{
      const purchases=amount('purchases');
      const cash=amount('cash');
      const foreignSpending=purchases+cash;
      // El tipo de cambio/comisión de divisa también afecta al efectivo.
      // La comisión específica del cajero solo se aplica a la retirada.
      const bank=foreignSpending*(1+(percentage('bank')+percentage('markup'))/100)+cash*percentage('atmBank')/100;
      const traveler=foreignSpending*(1+percentage('travel')/100)+cash*percentage('atmTravel')/100;
      const diff=bank-traveler;
      bankTotal.textContent=euro.format(bank);
      travelTotal.textContent=euro.format(traveler);
      savingText.textContent=diff>=0?'Ahorro estimado':'Coste adicional estimado';
      saving.textContent=euro.format(Math.abs(diff));
      savingBox.classList.toggle('negative',diff<0);
    };
    inputs.forEach(input=>input.addEventListener('input',update));
    update();
  }

  // El subheader se gestiona desde la configuración global de VCC.
})();
