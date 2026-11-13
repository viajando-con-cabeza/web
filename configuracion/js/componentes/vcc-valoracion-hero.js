/* VCC · Control compartit de valoracions (guies i itineraris).
   Desplegar, tancar al clicar fora i Escape; accessible i independent per instància. */
(()=>{
  function init(){
    const controls=[...document.querySelectorAll('[data-vcc-rating]')].map(root=>{
      const trigger=root.querySelector('.vcc-unified-rating__toggle');
      const panel=root.querySelector('.vcc-unified-rating__panel');
      if(!trigger||!panel)return null;
      function setOpen(open){panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));}
      trigger.addEventListener('click',()=>setOpen(panel.hidden));
      return {root,trigger,panel,setOpen};
    }).filter(Boolean);
    if(!controls.length)return;
    document.addEventListener('pointerdown',event=>{
      controls.forEach(item=>{if(!item.root.contains(event.target))item.setOpen(false)});
    });
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape')return;
      controls.forEach(item=>{if(!item.panel.hidden){item.setOpen(false);item.trigger.focus()}});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
