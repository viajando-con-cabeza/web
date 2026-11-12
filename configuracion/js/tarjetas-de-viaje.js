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
    const euroEntero=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:0,maximumFractionDigits:0});
    const amount=(name)=>{
      const input=document.querySelector('[data-tv-cost="'+name+'"]');
      return Math.min(100000000,Math.max(0,Number(input?.value)||0));
    };
    const percentage=(name)=>Math.min(100,amount(name));
    const cashIncluded=document.getElementById('tv-cash-included');
    const update=()=>{
      const purchases=Math.round(amount('purchases'));
      const cash=amount('cash');
      // El gasto de referencia se convierte con el markup de CADA entidad.
      // La comisión de compra se aplica solo a pagos, no a retiradas.
      const bankFx=1+percentage('markup')/100;
      const travelFx=1+percentage('travelMarkup')/100;
      const bank=purchases*bankFx*(1+percentage('bank')/100)+cash*bankFx*(1+percentage('atmBank')/100);
      const traveler=purchases*travelFx*(1+percentage('travel')/100)+cash*travelFx*(1+percentage('atmTravel')/100);
      const diff=bank-traveler;
      if(cashIncluded){
        cashIncluded.hidden=cash<=0;
        cashIncluded.textContent=cash>0?'· Incluye '+euro.format(cash)+' en efectivo':'';
      }
      // Solo cambia la presentacion: guardamos los totales exactos para el PDF.
      bankTotal.dataset.rawValue=String(bank);
      travelTotal.dataset.rawValue=String(traveler);
      bankTotal.textContent=euroEntero.format(bank);
      travelTotal.textContent=euroEntero.format(traveler);
      // Se compara lo que el lector ve: importe de cada tarjeta redondeado a euros.
      // Esto evita diferencias aparentes de 1 EUR entre las cifras publicadas.
      const diferenciaVisible=Math.round(bank)-Math.round(traveler);
      const ahorroRedondeado=Math.abs(diferenciaVisible);
      const positive=diferenciaVisible>0;
      const negative=diferenciaVisible<0;
      savingText.textContent=positive?'Ahorro estimado':negative?'Coste adicional estimado':'Diferencia estimada';
      saving.textContent=euroEntero.format(ahorroRedondeado);
      savingBox.classList.toggle('negative',negative);
      savingBox.classList.toggle('neutral',!positive&&!negative);
    };
    inputs.forEach(input=>input.addEventListener('input',update));
    // El gasto en divisa admite solamente euros enteros, incluidos los valores escritos.
    const purchasesInput=document.querySelector('[data-tv-cost="purchases"]');
    purchasesInput?.addEventListener('change',()=>{
      purchasesInput.value=String(Math.round(amount('purchases')));
      update();
    });
    update();
  }

  // El subheader se gestiona desde la configuración global de VCC.
})();
