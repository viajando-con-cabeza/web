/* VCC | Calculadora local y orientativa de entradas y pases (SEK / adulto).
   Datos de referencia: fuentes oficiales consultadas el 07-11-2026.
   No hace llamadas externas ni promete precios/aforo en tiempo real. */
(function(){
  'use strict';
  const root=document.querySelector('.ep-page');
  if(!root)return;
  const data={
    vasa:{name:'Museo Vasa',low:195,high:240,group:'principal'},
    skansen:{name:'Skansen',low:240,high:240,group:'principal'},
    palacio:{name:'Palacio Real',low:220,high:240,group:'principal'},
    foto:{name:'Fotografiska',low:230,high:230,group:'extra'},
    barco:{name:'Crucero por Estocolmo',low:385,high:385,group:'extra'},
    nobel:{name:'Museo Nobel',low:160,high:160,group:'extra'},
    abba:{name:'ABBA The Museum',low:269,high:349,group:'fuera'}
  };
  const passPrice={1:949,2:1349,3:1699,4:1949,5:1999};
  const checks=Array.from(root.querySelectorAll('[data-ep-attraction]'));
  const dayButtons=Array.from(root.querySelectorAll('[data-ep-days]'));
  const season=root.querySelector('#ep-season');
  const ui={
    single:root.querySelector('#ep-price-single'),
    ess:root.querySelector('#ep-price-essentials'),
    all:root.querySelector('#ep-price-all'),
    essDetail:root.querySelector('#ep-ess-detail'),
    allDetail:root.querySelector('#ep-all-detail'),
    title:root.querySelector('#ep-best-title'),
    message:root.querySelector('#ep-best-copy'),
    saving:root.querySelector('#ep-saving')
  };
  let days=2;
  const money=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(n)+' SEK';
  const price=id=>data[id][season.value==='high'?'high':'low'];
  function update(){
    const selected=checks.filter(input=>input.checked).map(input=>input.dataset.epAttraction);
    checks.forEach(input=>{
      const label=root.querySelector('[data-ep-price-for="'+input.dataset.epAttraction+'"]');
      if(label)label.textContent='≈'+price(input.dataset.epAttraction)+' kr';
    });
    if(!selected.length){
      ui.single.textContent='—';ui.ess.textContent='—';ui.all.textContent='—';
      ui.essDetail.textContent='Elige atracciones';ui.allDetail.textContent='Elige atracciones';
      ui.title.textContent='ELIGE TUS VISITAS';ui.message.textContent='Marca los lugares que te interesan para comparar el coste estimado de cada opción.';
      ui.saving.textContent='';return;
    }
    const single=selected.reduce((sum,id)=>sum+price(id),0);
    const mains=selected.filter(id=>data[id].group==='principal').sort((a,b)=>price(b)-price(a));
    const extras=selected.filter(id=>data[id].group==='extra').sort((a,b)=>price(b)-price(a));
    const essentialsCovered=mains.length?[mains[0],...extras.slice(0,2)]:[];
    const essentials=mains.length?649+selected.filter(id=>!essentialsCovered.includes(id)).reduce((sum,id)=>sum+price(id),0):Infinity;
    const outside=selected.filter(id=>data[id].group==='fuera');
    const inclusive=passPrice[days]+outside.reduce((sum,id)=>sum+price(id),0);
    ui.single.textContent=money(single);
    ui.ess.textContent=Number.isFinite(essentials)?money(essentials):'—';
    ui.all.textContent=money(inclusive);
    ui.essDetail.textContent=mains.length?'Cubre '+essentialsCovered.length+' visita'+(essentialsCovered.length===1?'':'s')+' seleccionada'+(essentialsCovered.length===1?'':'s'):'Necesitas elegir Vasa, Skansen o Palacio Real';
    ui.allDetail.textContent=days+' día'+(days===1?'':'s')+' de pase, más las entradas no incluidas';
    const options=[{id:'single',name:'ENTRADAS SUELTAS',value:single},
      {id:'essentials',name:'GO CITY ESSENTIALS',value:essentials},
      {id:'inclusive',name:'GO CITY ALL-INCLUSIVE',value:inclusive}];
    const best=options.reduce((a,b)=>b.value<a.value?b:a);
    const saved=single-best.value;
    ui.title.textContent=best.name;
    if(best.id==='single'){
      ui.message.textContent='Para esta selección y estas tarifas, comprar las entradas por separado parece la opción más económica. No compres un pase solo por comodidad.';
    }else if(best.id==='essentials'){
      ui.message.textContent='Essentials puede compensarte: cubre un gran imprescindible y hasta dos atracciones adicionales elegibles. El resto se paga por separado.';
    }else{
      ui.message.textContent='All-Inclusive puede compensarte si concentras las visitas incluidas en '+days+' día'+(days===1?'':'s')+' consecutivo'+(days===1?'':'s')+'. Confirma horarios, reservas y ritmo realista.';
    }
    ui.saving.textContent=saved>0?'Ahorro estimado frente a entradas sueltas: '+money(saved):'Sin ahorro estimado con los pases seleccionados';
  }
  dayButtons.forEach(button=>button.addEventListener('click',()=>{
    days=Number(button.dataset.epDays);
    dayButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    update();
  }));
  checks.forEach(input=>input.addEventListener('change',update));
  if(season)season.addEventListener('change',update);
  update();
})();
