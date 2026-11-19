/* Viajando con Cabeza · Calidad: calculadora SL y galería de fotografías verificadas.
   Sin dependencias ni llamadas de red. Tarifas declaradas en la página para 2026. */
(() => {
 'use strict';
 const root=document.getElementById('mv-vcc-ticket-calculator');
 if(root){
   const days=root.querySelector('#mv-vcc-days');
   const people=root.querySelector('#mv-vcc-people');
   const category=root.querySelector('#mv-vcc-fare');
   const dayInputs=root.querySelector('#mv-vcc-day-inputs');
   const cost=root.querySelector('#mv-vcc-optimal');
   const group=root.querySelector('#mv-vcc-group');
   const option=root.querySelector('#mv-vcc-recommend');
   const singles=root.querySelector('#mv-vcc-singles');
   const pass72=root.querySelector('#mv-vcc-72');
   const pass72row=root.querySelector('#mv-vcc-72-row');
   const planEl=root.querySelector('#mv-vcc-plan');
   const counts=[2,3,2,0,0,0,0];
   const tariffs={adult:{single:43,h24:180,h72:360},reduced:{single:26,h24:110,h72:220}};
   const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
   const money=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(n)+' SEK';
   const readDays=()=>clamp(Number(days.value),1,7);
   const renderDayInputs=()=>{
     const total=readDays();
     dayInputs.replaceChildren();
     for(let i=0;i<total;i++){
       const field=document.createElement('label');
       field.className='mv-vcc-field';
       const title=document.createElement('span');
       title.textContent='Día '+(i+1);
       const input=document.createElement('input');
       input.type='number';input.min='0';input.max='20';input.step='1';
       input.inputMode='numeric';input.value=String(counts[i]);input.dataset.day=String(i);
       input.setAttribute('aria-label','Billetes de 75 minutos por persona el día '+(i+1));
       field.append(title,input);
       dayInputs.append(field);
     }
     calculate();
   };
   const findBest=(arr,t)=>{
     const n=arr.length,dp=new Array(n+1);
     dp[n]={cost:0,step:1,type:'end'};
     for(let i=n-1;i>=0;i--){
       let best={cost:arr[i]*t.single+dp[i+1].cost,step:1,type:'single'};
       const day={cost:t.h24+dp[i+1].cost,step:1,type:'24'};
       const end=Math.min(n,i+3);
       const period={cost:t.h72+dp[end].cost,step:end-i,type:'72'};
       if(day.cost<best.cost)best=day;
       if(period.cost<best.cost)best=period;
       dp[i]=best;
     }
     const parts=[];
     for(let i=0;i<n;){
       const v=dp[i],end=i+v.step;
       const prefix=v.step>1?'Días '+(i+1)+'–'+end:'Día '+(i+1);
       let label;
       if(v.type==='single')label=arr[i]+' '+(arr[i]===1?'billete sencillo':'billetes sencillos');
       else if(v.type==='24')label='abono de 24 h';
       else label='abono de 72 h';
       parts.push(prefix+': '+label);
       i=end;
     }
     return {cost:dp[0].cost,parts};
   };
   function calculate(){
     const n=readDays();
     const p=clamp(Number(people.value),1,10);
     const fare=tariffs[category.value]||tariffs.adult;
     const arr=counts.slice(0,n).map(v=>clamp(v,0,20));
     const best=findBest(arr,fare);
     const alone=arr.reduce((s,v)=>s+v*fare.single,0);
     cost.textContent=money(best.cost);
     group.textContent=money(best.cost*p)+' en total · '+p+(p===1?' viajero':' viajeros');
     singles.textContent=money(alone);
     pass72row.hidden=n>3;
     pass72.textContent=money(fare.h72);
     const diff=alone-best.cost;
     const periodDiff=fare.h72-best.cost;
     if(best.cost===0){
       option.textContent='No necesitas billetes con esta selección.';
     }else if(n===3&&periodDiff>0){
       option.textContent='Ahorras '+money(periodDiff)+' por persona frente al abono de 72 h.';
     }else if(diff>0){
       option.textContent='La combinación más económica ahorra '+money(diff)+' por persona frente a todos los billetes sueltos.';
     }else{
       option.textContent='Los billetes sueltos son la opción más económica para estos desplazamientos.';
     }
     planEl.replaceChildren();
     best.parts.forEach(part=>{const li=document.createElement('li');li.textContent=part;planEl.append(li)});
   }
   days.addEventListener('change',renderDayInputs);
   people.addEventListener('input',calculate);
   people.addEventListener('change',()=>{
     people.value=String(clamp(Number(people.value),1,10));
     calculate();
   });
   category.addEventListener('change',calculate);
   dayInputs.addEventListener('input',e=>{
     const i=Number(e.target.dataset.day);
     if(!Number.isInteger(i)||i<0||i>=7)return;
     counts[i]=clamp(Number(e.target.value),0,20);
     calculate();
   });
   dayInputs.addEventListener('change',e=>{
     const i=Number(e.target.dataset.day);
     if(!Number.isInteger(i)||i<0||i>=7)return;
     e.target.value=String(counts[i]);
     calculate();
   });
   root.querySelector('#mv-vcc-reset').addEventListener('click',()=>{
     days.value='3';people.value='2';category.value='adult';
     [2,3,2,0,0,0,0].forEach((v,i)=>{counts[i]=v});
     renderDayInputs();
   });
   renderDayInputs();
 }
 const gallery=document.getElementById('mv-vcc-gallery');
 if(gallery){
   const track=gallery.querySelector('.mv-vcc-gallery-track');
   const slides=Array.from(track.querySelectorAll('.mv-vcc-gallery-card'));
   const prev=gallery.querySelector('[data-vcc-photo-prev]');
   const next=gallery.querySelector('[data-vcc-photo-next]');
   const counter=gallery.querySelector('.mv-vcc-gallery-counter');
   const visible=()=>window.matchMedia('(max-width:650px)').matches?1:window.matchMedia('(max-width:900px)').matches?2:3;
   const current=()=>{
     if(!slides.length)return 0;
     const start=slides[0].offsetLeft;
     let idx=0;
     for(let i=0;i<slides.length;i++){
       if(slides[i].offsetLeft-start<=track.scrollLeft+8)idx=i;
       else break;
     }
     return idx;
   };
   const loadNearby=()=>{
     const idx=current(),limit=Math.min(slides.length,idx+visible()+3);
     for(let i=Math.max(0,idx-1);i<limit;i++){
       const img=slides[i].querySelector('img[data-src]');
       if(!img)continue;
       img.src=img.dataset.src;
       img.removeAttribute('data-src');
     }
   };
   const refresh=()=>{
     const idx=current(),v=visible();
     if(counter)counter.textContent=(idx+1)+'–'+Math.min(slides.length,idx+v)+' / '+slides.length;
     prev.disabled=track.scrollLeft<4;
     next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-4;
     loadNearby();
   };
   const go=direction=>{
     const idx=clamp(current()+direction*visible(),0,slides.length-visible());
     const left=slides[idx].offsetLeft-slides[0].offsetLeft;
     track.scrollTo({left,behavior:'smooth'});
     loadNearby();
   };
   prev.addEventListener('click',()=>go(-1));
   next.addEventListener('click',()=>go(1));
   track.addEventListener('scroll',refresh,{passive:true});
   window.addEventListener('resize',refresh,{passive:true});
   if('IntersectionObserver' in window){
     const obs=new IntersectionObserver(entries=>{
       if(entries.some(e=>e.isIntersecting)){loadNearby();obs.disconnect()}
     },{rootMargin:'350px 0px'});
     obs.observe(track);
   }else loadNearby();
   refresh();
 }
})();