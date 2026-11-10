/* Tarjetas de viaje | VCC: carrusel y calculadora sin dependencias. */
(() => {
  const track=document.querySelector('[data-tv-carousel]');
  if(track){
    const previous=document.querySelector('[data-tv-prev]');
    const next=document.querySelector('[data-tv-next]');
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
    const refresh=()=>{
      const end=Math.max(0,track.scrollWidth-track.clientWidth);
      previous.disabled=track.scrollLeft<4;
      next.disabled=track.scrollLeft>=end-4;
    };
    const advance=(direction)=>{
      const first=track.querySelector('.tv-card');
      if(!first)return;
      const gap=Number.parseFloat(getComputedStyle(track).gap)||0;
      track.scrollBy({left:direction*(first.getBoundingClientRect().width+gap),behavior:motion});
    };
    previous.addEventListener('click',()=>advance(-1));
    next.addEventListener('click',()=>advance(1));
    track.addEventListener('scroll',refresh,{passive:true});
    window.addEventListener('resize',refresh,{passive:true});
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
      const bank=purchases*(1+(percentage('bank')+percentage('markup'))/100)+cash*(1+percentage('atmBank')/100);
      const traveler=purchases*(1+percentage('travel')/100)+cash*(1+percentage('atmTravel')/100);
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

  const links=[...document.querySelectorAll('.tv-tabs a[href^="#"]')];
  links.forEach(link=>link.addEventListener('click',()=>{
    links.forEach(item=>{const active=item===link;item.classList.toggle('active',active);if(active)item.setAttribute('aria-current','location');else item.removeAttribute('aria-current')});
  }));
})();
