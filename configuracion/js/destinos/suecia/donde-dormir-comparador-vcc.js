/* VCC · Suecia · Dónde dormir. Los importes son para toda la estancia
   y todo el grupo. Sin tarifas inventadas ni precios de reserva ficticios. */
(() => {
  "use strict";
  const root=document.querySelector("[data-dv-compare]");
  if(!root)return;
  const q=sel=>root.querySelector(sel);
  const head=q("[data-dv-compare-head]"),body=q("[data-dv-compare-body]");
  const count=q("[data-dv-counter]"),add=q("[data-dv-add]");
  const reset=q("[data-dv-reset]"),save=q("[data-dv-export]");
  const people=q("[data-dv-personas]"),nights=q("[data-dv-noches]");
  const empty=q("[data-dv-result-empty]"),ready=q("[data-dv-result-ready]");
  const winner=q("[data-dv-winner]"),winnerPrice=q("[data-dv-winner-price]");
  const savings=q("[data-dv-savings]");
  if(!head||!body||!add||!count||!people||!nights)return;
  const types=[["hoteles","Hotel"],["apartamentos","Apartamento"],["cabanas","Cabaña · stuga"],["hostales","Hostal / albergue"],["camping","Camping"],["glamping","Glamping"],["singulares","Alojamiento singular"],["otro","Otro"]];
  const costs=[
    {key:"base",label:"Precio de la reserva",icon:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'},
    {key:"limpieza",label:"Limpieza",icon:'<path d="m13 3 8 8M5 21l5-5M16 8l-8 8-3 5 5-3 8-8"/>'},
    {key:"tasas",label:"Tasas y cargos",icon:'<circle cx="12" cy="12" r="9"/><path d="M15 8H9.7a2 2 0 0 0 0 4h4.6a2 2 0 0 1 0 4H9M12 6v12"/>'},
    {key:"desayuno",label:"Desayuno",icon:'<path d="M4 8h14v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM18 10h2a3 3 0 0 1 0 6h-2M4 3v2M10 3v2"/>'},
    {key:"traslados",label:"Traslados extra",icon:'<rect x="4" y="5" width="16" height="13" rx="2"/><path d="M4 10h16M8 18v2M16 18v2M8 14h.01M16 14h.01"/>'},
    {key:"otros",label:"Otros gastos",icon:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>'}
  ];
  const create=(id,type)=>({id,name:"Alojamiento "+id,type,base:null,limpieza:0,tasas:0,desayuno:0,traslados:0,otros:0});
  const defaults=()=>[create(1,"hoteles"),create(2,"apartamentos"),create(3,"cabanas")];
  let options=defaults(),nextId=4;
  const money=value=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
  const esc=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const svg=path=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg>';
  const nameOf=(item,index)=>item.name.trim()||"Alojamiento "+(index+1);
  const byId=id=>options.find(item=>item.id===Number(id));
  const total=item=>item.base===null?null:costs.reduce((sum,c)=>sum+(Number(item[c.key])||0),0);
  const number=value=>value===""?null:(Number.isFinite(Number(value))&&Number(value)>=0?Math.min(100000000,Number(value)):null);
  const numPeople=()=>Math.max(1,Math.min(20,Number(people.value)||2));
  const numNights=()=>Math.max(1,Math.min(90,Number(nights.value)||3));
  function draw(){
    head.innerHTML="<tr><th scope='col'>CONCEPTO</th>"+options.map((item,index)=>
      '<th scope="col"><div class="dv-option-head"><label for="dv-option-name-'+item.id+'">OPCIÓN '+(index+1)+'</label>'+
      '<input type="text" maxlength="70" id="dv-option-name-'+item.id+'" value="'+esc(item.name)+'" data-dv-option="'+item.id+'" data-dv-name aria-label="Nombre del alojamiento '+(index+1)+'">'+
      '<button type="button" class="dv-option-remove" data-dv-remove="'+item.id+'" aria-label="Eliminar opción '+(index+1)+'" '+(options.length<=2?"disabled":"")+'>×</button></div></th>'
    ).join("")+"</tr>";
    const rows=[
      '<tr><th scope="row"><span class="dv-row-heading">'+svg('<path d="m3 11 9-8 9 8v10H3zM9 21v-7h6v7"/>')+'<span>Tipo de alojamiento</span></span></th>'+
      options.map(item=>'<td><select data-dv-option="'+item.id+'" data-dv-type aria-label="Tipo de alojamiento">'+
        types.map(pair=>'<option value="'+pair[0]+'" '+(item.type===pair[0]?"selected":"")+'>'+esc(pair[1])+'</option>').join("")+
      '</select></td>').join("")+'</tr>'
    ];
    costs.forEach(cost=>{
      rows.push('<tr><th scope="row"><span class="dv-row-heading">'+svg(cost.icon)+'<span>'+cost.label+'</span></span></th>'+
        options.map((item,index)=>'<td><input type="number" min="0" max="100000000" step="0.01" inputmode="decimal" placeholder="—" '+
          'data-dv-option="'+item.id+'" data-dv-cost="'+cost.key+'" aria-label="'+esc(cost.label)+', opción '+(index+1)+'" '+
          'value="'+(item[cost.key]===null?"":(item[cost.key]||""))+'"></td>').join("")+'</tr>');
    });
    rows.push('<tr class="dv-calc-total"><th scope="row">COSTE FINAL</th>'+
      options.map(item=>'<td data-dv-result-column="'+item.id+'"><span class="dv-compare-pill" data-dv-total="'+item.id+'">—</span></td>').join("")+'</tr>');
    rows.push('<tr class="dv-calc-summary"><th scope="row">Por persona</th>'+
      options.map(item=>'<td><output data-dv-per-person="'+item.id+'"></output></td>').join("")+'</tr>');
    rows.push('<tr class="dv-calc-summary"><th scope="row">Por persona / noche</th>'+
      options.map(item=>'<td><output data-dv-per-night="'+item.id+'"></output></td>').join("")+'</tr>');
    body.innerHTML=rows.join("");
    root.style.setProperty("--dv-options",String(options.length));
    count.textContent=options.length+" de 5 opciones";
    add.disabled=options.length>=5;
    update();
  }
  function update(){
    const priced=options.map((item,index)=>({item,index,total:total(item)}))
      .filter(entry=>entry.total!==null).sort((a,b)=>a.total-b.total);
    const comparing=priced.length>=2;
    const lowest=comparing?priced[0].total:null;
    const tied=comparing?priced.filter(x=>Math.abs(x.total-lowest)<.005):[];
    options.forEach(item=>{
      const amount=total(item);
      const out=q('[data-dv-total="'+item.id+'"]'),pax=q('[data-dv-per-person="'+item.id+'"]');
      const night=q('[data-dv-per-night="'+item.id+'"]'),cell=q('[data-dv-result-column="'+item.id+'"]');
      if(out)out.textContent=amount===null?"—":money(amount);
      if(pax)pax.textContent=amount===null?"":money(amount/numPeople());
      if(night)night.textContent=amount===null?"":money(amount/numPeople()/numNights());
      if(cell){
        if(comparing&&amount!==null&&Math.abs(amount-lowest)<.005)cell.dataset.dvBest="true";
        else delete cell.dataset.dvBest;
      }
    });
    empty.hidden=comparing;ready.hidden=!comparing;
    if(comparing){
      winner.textContent=tied.length>1?"Empate: "+tied.map(x=>nameOf(x.item,x.index)).join(" y "):nameOf(priced[0].item,priced[0].index);
      winnerPrice.textContent=money(priced[0].total);
      const next=priced.find(x=>x.total>lowest+.005);
      savings.hidden=!next;
      if(next)savings.textContent="Ahorras "+money(next.total-lowest)+" frente a la siguiente alternativa de mayor coste.";
    }else{
      empty.textContent=priced.length===1?"Añade el precio de otra opción para compararlas.":"Introduce el precio de al menos dos alternativas para compararlas.";
      savings.hidden=true;
    }
    save.disabled=priced.length===0;
  }
  root.addEventListener("input",event=>{
    const input=event.target,option=input.dataset?.dvOption&&byId(input.dataset.dvOption);
    if(input.matches("[data-dv-name]")&&option){option.name=input.value;update();}
    if(input.matches("[data-dv-cost]")&&option){
      const amount=number(input.value);
      option[input.dataset.dvCost]=input.dataset.dvCost==="base"?amount:(amount??0);
      update();
    }
    if(input.matches("[data-dv-personas],[data-dv-noches]"))update();
  });
  root.addEventListener("change",event=>{
    const input=event.target,option=input.dataset?.dvOption&&byId(input.dataset.dvOption);
    if(input.matches("[data-dv-type]")&&option){option.type=input.value;update();}
    if(input.matches("[data-dv-personas],[data-dv-noches]")){
      const max=input.matches("[data-dv-personas]")?20:90;
      input.value=String(Math.max(1,Math.min(max,Math.round(Number(input.value)||1))));
      update();
    }
  });
  root.addEventListener("click",event=>{
    const button=event.target.closest("[data-dv-remove]");
    if(!button||options.length<=2)return;
    options=options.filter(item=>item.id!==Number(button.dataset.dvRemove));
    draw();add.focus({preventScroll:true});
  });
  add.addEventListener("click",()=>{
    if(options.length>=5)return;
    const id=nextId++;
    options.push(create(id,"hoteles"));
    draw();
    const input=q("#dv-option-name-"+id);
    if(input){input.focus({preventScroll:true});input.select();}
    const scroller=q(".dv-compare-table-scroll");
    if(scroller)scroller.scrollLeft=scroller.scrollWidth;
  });
  reset.addEventListener("click",()=>{
    options=defaults();nextId=4;people.value="2";nights.value="3";draw();
  });
  save.addEventListener("click",()=>{
    const valid=options.filter(item=>total(item)!==null);
    if(!valid.length)return;
    const lines=[
      ["Comparador de alojamientos - Suecia VCC"],["Viajeros",String(numPeople())],
      ["Noches",String(numNights())],["Importes para la estancia completa y todos los viajeros"],
      ["Concepto",...valid.map((item,index)=>nameOf(item,index))],
      ["Tipo",...valid.map(item=>types.find(pair=>pair[0]===item.type)?.[1]||"Otro")],
      ...costs.map(cost=>[cost.label,...valid.map(item=>String(item[cost.key]||0))]),
      ["Coste final",...valid.map(item=>String(total(item)))],
      ["Por persona",...valid.map(item=>(total(item)/numPeople()).toFixed(2))],
      ["Por persona y noche",...valid.map(item=>(total(item)/numPeople()/numNights()).toFixed(2))]
    ];
    const text=lines.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(";")).join("\r\n");
    const blob=new Blob(["\uFEFF"+text],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob),anchor=document.createElement("a");
    anchor.href=url;anchor.download="comparador-alojamientos-suecia-vcc.csv";
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1500);
  });
  draw();
})();