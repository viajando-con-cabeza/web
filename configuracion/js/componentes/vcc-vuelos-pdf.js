/* VCC · PDF corporatiu de la comparativa de vols.
 * El motor jsPDF es descarrega només quan l'usuari prem GUARDAR EN PDF.
 * Les dades no s'envien a cap servidor: el document es crea al navegador.
 */
const ENGINE='https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js';
const LOGO='/configuracion/imagenes/marca/logo-vcc.svg';
const fields=['base','baggage','seat','food','transfer'];
const euros=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
let enginePromise;

function loadEngine(){
  if(window.jspdf?.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
  if(enginePromise)return enginePromise;
  enginePromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=ENGINE;script.async=true;
    script.crossOrigin='anonymous';
    script.onload=()=>window.jspdf?.jsPDF?resolve(window.jspdf.jsPDF):reject(new Error('No se pudo iniciar el generador PDF'));
    script.onerror=()=>reject(new Error('No se pudo cargar el generador PDF. Revisa tu conexión.'));
    document.head.appendChild(script);
  }).catch(error=>{enginePromise=null;throw error;});
  return enginePromise;
}

async function logoPng(){
  try{
    const img=new Image();
    img.src=LOGO;
    await img.decode();
    const canvas=document.createElement('canvas');
    canvas.width=240;canvas.height=240;
    const ctx=canvas.getContext('2d');
    if(!ctx)return null;
    ctx.clearRect(0,0,240,240);
    ctx.drawImage(img,0,0,240,240);
    return canvas.toDataURL('image/png');
  }catch{return null;}
}

function amount(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>=0?Math.min(n,10000000):0;
}
const priced=flight=>String(flight.base??'').trim()!==''&&
  Number.isFinite(Number(flight.base))&&Number(flight.base)>=0&&Number(flight.base)<=10000000;
const sum=flight=>Math.round(fields.reduce((n,key)=>n+amount(flight[key]),0)*100)/100;

/** Matemàtica reutilitzable i comprovable sense navegador. */
export function resumirComparacion(flights){
  const items=flights.map((flight,index)=>({flight,index,total:sum(flight),valid:priced(flight)}));
  const valid=items.filter(item=>item.valid);
  const lowest=valid.length>=2?Math.min(...valid.map(item=>item.total)):null;
  const winners=lowest===null?[]:valid.filter(item=>Math.abs(item.total-lowest)<0.005);
  return {items,valid,lowest,winners};
}

function cellText(pdf,value,x,y,width,maxLines=1,fontsize=8){
  pdf.setFontSize(fontsize);
  const clean=String(value??'').replace(/\s+/g,' ').trim()||'—';
  let lines=pdf.splitTextToSize(clean,Math.max(5,width));
  if(lines.length>maxLines){
    lines=lines.slice(0,maxLines);
    let last=lines[maxLines-1];
    while(last.length>1&&pdf.getTextWidth(last+'...')>width)last=last.slice(0,-1);
    lines[maxLines-1]=last+'...';
  }
  pdf.text(lines,x,y,{baseline:'alphabetic'});
}

const PALETTE={
  ink:[31,29,27],muted:[102,94,88],orange:[231,100,29],light:[255,246,239],
  cream:[250,247,243],border:[233,222,211],white:[255,255,255],green:[30,122,77]
};
const color=(pdf,kind,type='text')=>{
  const c=PALETTE[kind];
  if(type==='fill')pdf.setFillColor(...c);
  else if(type==='draw')pdf.setDrawColor(...c);
  else pdf.setTextColor(...c);
};
const label=(flight,names)=>names[flight.airline]||'Sin elegir';


/* Reprodueix les mateixes proporcions que el comparador de la web:
 * taula a l'esquerra, consell VCC a la dreta, fons blanc, gris crema i taronja.
 * Coordenades en mm, A4 horitzontal; amb 1–5 columnes sense desbordaments.
 */
export const PDF_LAYOUT_VCC=Object.freeze({
  pageWidth:297,pageHeight:210,
  tableX:15,tableY:65,tableWidth:193,labelWidth:46,
  adviceX:213,adviceY:78,adviceWidth:69,adviceHeight:107,
  headHeight:11,
  rows:[
    {key:'airline',name:'Aerolínea',icon:'avion',height:13},
    {key:'route',name:'Trayecto / aeropuerto',icon:'ruta',height:14},
    {key:'base',name:'Billete',icon:'billete',height:13},
    {key:'baggage',name:'Equipaje',icon:'equipaje',height:13},
    {key:'seat',name:'Asiento',icon:'asiento',height:13},
    {key:'food',name:'Comida y bebida',icon:'comida',height:13},
    {key:'transfer',name:'Traslado aeropuerto',icon:'traslado',height:13},
    {key:'total',name:'TOTAL POR OPCIÓN',icon:'total',height:15}
  ]
});
const ICON_SPRITE='/configuracion/imagenes/iconos/paginas/planifica-vuelos-comparador-iconos.svg';
const BRAND={
  header:[250,240,231],paper:[250,247,243],orange:[233,101,27],
  orangeDark:[171,82,31],winner:[251,225,203],pale:[255,248,242],
  total:[255,240,223],line:[232,222,212],input:[221,214,208],
  white:[255,255,255],text:[38,34,32],secondary:[109,97,89],
  hint:[163,154,147],green:[19,125,73]
};
function paint(pdf,kind,mode='text'){
  const rgb=BRAND[kind];
  if(mode==='fill')pdf.setFillColor(...rgb);
  else if(mode==='stroke')pdf.setDrawColor(...rgb);
  else pdf.setTextColor(...rgb);
}
function lineText(pdf,text,x,y,maxWidth,initialSize=8,alignment='left',minSize=5.5){
  const value=String(text??'').replace(/\s+/g,' ').trim()||'—';
  let size=initialSize;
  pdf.setFontSize(size);
  while(size>minSize&&pdf.getTextWidth(value)>maxWidth){
    size=Math.max(minSize,size-.3);
    pdf.setFontSize(size);
  }
  if(pdf.getTextWidth(value)<=maxWidth){
    pdf.text(value,x,y,{align:alignment});return;
  }
  let truncated=value;
  while(truncated.length>1&&pdf.getTextWidth(truncated+'…')>maxWidth)
    truncated=truncated.slice(0,-1);
  pdf.text(truncated+'…',x,y,{align:alignment});
}
function compactPrice(value){
  const n=Number(value);
  if(!Number.isFinite(n)||n<0)return '0,00';
  return new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(n);
}
/* Per als titulars s'aprofiten les tipografies de la web, sense incrustar
 * fonts alienes. El cos de la taula continua sent text seleccionable al PDF.
 */
async function brandedText(pdf,text,x,top,height,kind='text',family='Oswald',maxWidth=100){
  const raw=String(text),px=56;
  try{
    await document.fonts?.load('600 '+px+'px "'+family+'"');
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('canvas');
    const font='600 '+px+'px "'+family+'",sans-serif';
    ctx.font=font;
    const measure=Math.max(20,Math.ceil(ctx.measureText(raw).width)+14);
    const line=Math.ceil(px*1.28);
    canvas.width=measure*2;canvas.height=line*2;
    ctx.scale(2,2);ctx.font=font;
    ctx.textBaseline='alphabetic';
    ctx.fillStyle='rgb('+BRAND[kind].join(',')+')';
    ctx.fillText(raw,6,px*1.07);
    const width=Math.min(maxWidth,measure/line*height);
    pdf.addImage(canvas.toDataURL('image/png'),'PNG',x,top,width,height);
    return width;
  }catch{
    pdf.setFont('helvetica','bold');paint(pdf,kind);
    pdf.setFontSize(height*2.6);
    lineText(pdf,raw,x,top+height*.8,maxWidth,height*2.6);
    return Math.min(maxWidth,pdf.getTextWidth(raw));
  }
}
/* Les icones es llegeixen del mateix sprite SVG que utilitza el comparador.
 * Cap traçat ni estil d'icona es duplica al codi del PDF.
 */
async function sharedIcons(){
  try{
    const response=await fetch(ICON_SPRITE);
    if(!response.ok)throw new Error('Sprite SVG no disponible');
    const xml=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
    const outputs={};
    const NS='http://www.w3.org/2000/svg';
    for(const name of PDF_LAYOUT_VCC.rows.map(row=>row.icon)){
      const symbol=xml.getElementById(name);
      if(!symbol)continue;
      const svg=document.createElementNS(NS,'svg');
      svg.setAttribute('xmlns',NS);
      svg.setAttribute('viewBox',symbol.getAttribute('viewBox')||'0 0 24 24');
      svg.setAttribute('width','80');svg.setAttribute('height','80');
      svg.setAttribute('fill','none');svg.setAttribute('stroke','#e9651b');
      svg.setAttribute('stroke-width','1.9');
      svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
      [...symbol.childNodes].forEach(node=>svg.appendChild(node.cloneNode(true)));
      const img=new Image();
      img.src='data:image/svg+xml;charset=utf-8,'+
        encodeURIComponent(new XMLSerializer().serializeToString(svg));
      await img.decode();
      const canvas=document.createElement('canvas');
      canvas.width=80;canvas.height=80;
      const ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0,80,80);
      outputs[name]=canvas.toDataURL('image/png');
    }
    return outputs;
  }catch{return {};}
}

export async function exportarComparacionPDF(flights,airlines){
  if(!Array.isArray(flights)||flights.length<1||flights.length>5)throw new Error('La comparación admite entre una y cinco opciones.');
  const {items,valid,lowest,winners}=resumirComparacion(flights);
  if(!valid.length)throw new Error('Introduce al menos el precio del billete de una opción para crear el PDF.');
  const Pdf=await loadEngine();
  const pdf=new Pdf({orientation:'landscape',unit:'mm',format:'a4',compress:true});
  pdf.setProperties({
    title:'VCC · Comparativa del precio real de vuelos',
    subject:'Comparación de billete, equipaje, asiento, comida y traslado',
    author:'Viajando con Cabeza',creator:'Viajando con Cabeza',
    keywords:'vuelos, comparativa, VCC, presupuesto, viaje'
  });
  const L=PDF_LAYOUT_VCC;
  const pageW=L.pageWidth, pageH=L.pageHeight,margin=15;
  const now=new Date();
  const stamp=now.toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'});
  const names=Object.fromEntries(airlines);
  const [logo,icons]=await Promise.all([logoPng(),sharedIcons()]);
  const winning=new Set(winners.map(item=>item.index));
  const colW=(L.tableWidth-L.labelWidth)/items.length;
  const isWinning=index=>winning.has(index);
  pdf.setLineWidth(.3);

  // Fons editorial VCC i capçalera amb el logo real.
  paint(pdf,'paper','fill');pdf.rect(0,0,pageW,pageH,'F');
  paint(pdf,'orange','fill');pdf.rect(0,0,pageW,2.8,'F');
  if(logo)pdf.addImage(logo,'PNG',margin,7.5,25,25);
  else{
    paint(pdf,'orange','stroke');pdf.setLineWidth(1);pdf.circle(margin+12.5,20,11,'S');
    paint(pdf,'orange');pdf.setFont('helvetica','bold');pdf.setFontSize(15);
    pdf.text('VCC',margin+12.5,22,{align:'center'});
  }
  paint(pdf,'text');pdf.setFont('helvetica','bold');pdf.setFontSize(11);
  pdf.text('VIAJANDO CON CABEZA',45,17);
  paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(8);
  pdf.text('PLANIFICA TU VIAJE  /  VUELOS',45,24);
  pdf.text('Generado el '+stamp,pageW-margin,17,{align:'right'});
  pdf.text('Datos introducidos por el viajero',pageW-margin,24,{align:'right'});
  paint(pdf,'line','stroke');pdf.setLineWidth(.45);pdf.line(margin,36,pageW-margin,36);

  paint(pdf,'orange');pdf.setFont('helvetica','bold');pdf.setFontSize(7.6);
  pdf.text('COMPARA ANTES DE RESERVAR',margin,44);
  const firstWidth=await brandedText(pdf,'COMPARA EL',margin,47,9,'text','Oswald',61);
  await brandedText(pdf,'PRECIO REAL',margin+firstWidth+3,47,9,'orange','Oswald',67);
  paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(8);
  pdf.text('Cada columna es un vuelo; cada fila, un gasto.',pageW-margin,49,{align:'right'});
  pdf.text('Hasta cinco opciones con el mismo criterio.',pageW-margin,55,{align:'right'});

  // Comparador: exactament la mateixa estructura que a la captura.
  const tx=L.tableX,ty=L.tableY,tw=L.tableWidth,labelW=L.labelWidth;
  const tableH=L.headHeight+L.rows.reduce((n,row)=>n+row.height,0);
  paint(pdf,'white','fill');pdf.roundedRect(tx,ty,tw,tableH,3,3,'F');
  paint(pdf,'line','stroke');pdf.setLineWidth(.35);pdf.roundedRect(tx,ty,tw,tableH,3,3,'S');
  paint(pdf,'header','fill');pdf.rect(tx+.25,ty+.25,tw-.5,L.headHeight-.25,'F');
  paint(pdf,'text');pdf.setFont('helvetica','bold');pdf.setFontSize(9.2);
  pdf.text('Concepto',tx+3,ty+7);
  for(const [i,item] of items.entries()){
    const xx=tx+labelW+i*colW;
    paint(pdf,isWinning(item.index)?'winner':'header','fill');
    pdf.rect(xx,ty,colW,L.headHeight,'F');
    await brandedText(pdf,'Opción '+String.fromCharCode(65+item.index),
      xx+colW*.12,ty+2.2,6.5,isWinning(item.index)?'orangeDark':'text','Oswald',colW*.76);
  }

  let cy=ty+L.headHeight;
  for(const [rowIndex,row] of L.rows.entries()){
    const totalRow=row.key==='total',h=row.height;
    paint(pdf,'white','fill');pdf.rect(tx,cy,tw,h,'F');
    if(totalRow){paint(pdf,'line','stroke');pdf.setLineWidth(.48);pdf.line(tx,cy,tx+tw,cy);}
    else{paint(pdf,'line','stroke');pdf.setLineWidth(.23);pdf.line(tx,cy+h,tx+tw,cy+h);}
    if(icons[row.icon]){
      pdf.addImage(icons[row.icon],'PNG',tx+3,cy+(h-5.2)/2,5.2,5.2);
    }else{
      paint(pdf,'orange','fill');pdf.circle(tx+5.5,cy+h/2,1.6,'F');
    }
    paint(pdf,totalRow?'orangeDark':'text');
    pdf.setFont('helvetica','bold');pdf.setFontSize(totalRow?8.2:8);
    lineText(pdf,row.name,tx+10,cy+h/2+2.7,labelW-12,totalRow?8.2:8,'left',7);
    for(const [i,item] of items.entries()){
      const xx=tx+labelW+i*colW,innerX=xx+1.5,innerW=colW-3;
      if(!totalRow&&isWinning(item.index)){
        paint(pdf,'pale','fill');pdf.rect(xx,cy,colW,h,'F');
      }
      if(totalRow){
        paint(pdf,isWinning(item.index)?'orange':'total','fill');
        pdf.roundedRect(innerX,cy+2,innerW,h-4,1.6,1.6,'F');
        if(!isWinning(item.index)){
          paint(pdf,'winner','stroke');pdf.setLineWidth(.22);
          pdf.roundedRect(innerX,cy+2,innerW,h-4,1.6,1.6,'S');
        }
        const value=item.valid?euros.format(item.total):'—';
        await brandedText(pdf,value,innerX+1.7,cy+3,9,
          isWinning(item.index)?'white':'orangeDark','Oswald',innerW-3.4);
        continue;
      }
      // Camp amb contorn suau, com els controls de la taula HTML.
      paint(pdf,'white','fill');pdf.roundedRect(innerX,cy+1.6,innerW,h-3.2,1.45,1.45,'F');
      paint(pdf,'input','stroke');pdf.setLineWidth(.25);
      pdf.roundedRect(innerX,cy+1.6,innerW,h-3.2,1.45,1.45,'S');
      const val=item.flight[row.key];
      if(row.key==='airline'){
        const text=val?label(item.flight,names):'Elige aerolínea';
        paint(pdf,val?'text':'hint');pdf.setFont('helvetica','normal');
        lineText(pdf,text,innerX+2.5,cy+h/2+2.5,innerW-6,7.7,'left',6.4);
        // desplegable: fletxa discreta de les targetes originals
        paint(pdf,'secondary','stroke');pdf.setLineWidth(.35);
        const ax=innerX+innerW-3.7,ay=cy+h/2;
        pdf.line(ax-1.05,ay-.6,ax,ay+.4);pdf.line(ax,ay+.4,ax+1.05,ay-.6);
      }else if(row.key==='route'){
        const text=String(val||'').trim()||'Ej. BCN → ARN';
        paint(pdf,val?'text':'hint');pdf.setFont('helvetica','normal');
        const chunks=pdf.splitTextToSize(text,Math.max(10,innerW-5));
        pdf.setFontSize(7.1);
        if(chunks.length>1){
          pdf.text(chunks.slice(0,2),innerX+2.5,cy+5.6);
        }else lineText(pdf,text,innerX+2.5,cy+h/2+2.2,innerW-5,7.1);
      }else{
        const hasValue=val!==null&&val!==undefined&&String(val).trim()!=='';
        paint(pdf,hasValue?'text':'hint');pdf.setFont('helvetica','normal');
        lineText(pdf,hasValue?compactPrice(val):'0,00',
          innerX+innerW-2,cy+h/2+2.5,innerW-4,8,'right',6);
      }
    }
    cy+=h;
  }
  paint(pdf,'line','stroke');pdf.setLineWidth(.35);
  pdf.roundedRect(tx,ty,tw,tableH,3,3,'S');

  // La recomanació queda a la DRETA, a la mateixa altura que el primer camp.
  const sx=L.adviceX,sy=L.adviceY,sw=L.adviceWidth,sh=L.adviceHeight;
  paint(pdf,'white','fill');pdf.roundedRect(sx,sy,sw,sh,3,3,'F');
  paint(pdf,'winner','stroke');pdf.setLineWidth(.48);pdf.roundedRect(sx,sy,sw,sh,3,3,'S');
  await brandedText(pdf,'Nuestro consejo',sx+4,sy+4,7,'orange','Caveat',sw-8);
  await brandedText(pdf,'MEJOR OPCIÓN VCC',sx+4,sy+12,8,'text','Oswald',sw-8);

  if(logo)pdf.addImage(logo,'PNG',sx+5,sy+27,19,19);
  else{paint(pdf,'orange','stroke');pdf.circle(sx+14.5,sy+36.5,9,'S');}
  paint(pdf,'orangeDark');pdf.setFont('helvetica','bold');pdf.setFontSize(7);
  pdf.text('Consejo VCC',sx+14.5,sy+49.3,{align:'center'});

  const detailX=sx+27,detailW=sw-31;
  paint(pdf,'text');pdf.setFont('helvetica','bold');
  const winnerText=lowest!==null
    ?(winners.length>1?'Empate: ':'')+
      winners.map(item=>'Opción '+String.fromCharCode(65+item.index)).join(' y ')+
      (winners.length===1?' · '+label(winners[0].flight,names):'')
    :'Introduce más vuelos';
  const winnerLines=pdf.splitTextToSize(winnerText,detailW);
  pdf.setFontSize(8.2);
  pdf.text(winnerLines.slice(0,2),detailX,sy+30.3);
  if(lowest!==null)
    await brandedText(pdf,euros.format(lowest),detailX,sy+37,10.4,'orangeDark','Oswald',detailW);
  else{
    paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(8);
    pdf.text('—',detailX,sy+45);
  }
  paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(7.1);
  pdf.text('Coste total de esta opción',detailX,sy+49.7);

  paint(pdf,'line','stroke');pdf.setLineWidth(.4);
  pdf.line(sx+4,sy+58,sx+sw-4,sy+58);
  paint(pdf,'orangeDark');pdf.setFont('helvetica','bold');pdf.setFontSize(8.5);
  pdf.text('LO QUE TE AHORRAS',sx+4,sy+65);
  if(lowest!==null){
    const savings=valid.filter(item=>item.total>lowest+.005);
    if(savings.length){
      for(const [i,item] of savings.entries()){
        const y=sy+73+i*6.4;
        paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(7);
        const initial='Te ahorras ';
        pdf.text(initial,sx+4,y);
        const offset=pdf.getTextWidth(initial);
        paint(pdf,'green');pdf.setFont('helvetica','bold');pdf.setFontSize(9.5);
        const eurosSaved=euros.format(item.total-lowest);
        const amountWidth=pdf.getTextWidth(eurosSaved);
        pdf.text(eurosSaved,sx+4+offset,y);
        paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(6.9);
        const remainder=' frente a opción '+String.fromCharCode(65+item.index);
        if(offset+amountWidth+pdf.getTextWidth(remainder)>sw-8){
          pdf.text('Frente a opción '+String.fromCharCode(65+item.index),
            sx+sw-4,y+3.4,{align:'right'});
        }else pdf.text(remainder,sx+4+offset+amountWidth,y);
      }
    }else{
      paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(7.3);
      pdf.text('Todas las opciones tienen el mismo',sx+4,sy+74);
      pdf.text('precio total.',sx+4,sy+79);
    }
  }else{
    paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(7.2);
    pdf.text('Introduce dos billetes para ver',sx+4,sy+74);
    pdf.text('cuánto puedes ahorrar.',sx+4,sy+79);
  }
  if(valid.length<=3){
    paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(7.2);
    pdf.text('Compara importes finales y ten en cuenta',sx+4,sy+96);
    pdf.text('también aeropuertos y horarios.',sx+4,sy+101);
  }

  // Nota editorial i peu comú en el mateix estil del blog.
  paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(7.2);
  pdf.text('Importes introducidos por ti. No son tarifas consultadas ni precios garantizados.',margin,190.5);
  pdf.text('Comprueba el equipaje, la tarifa, los horarios y el aeropuerto antes de reservar.',margin,194.7);
  paint(pdf,'line','stroke');pdf.setLineWidth(.4);pdf.line(margin,198,pageW-margin,198);
  paint(pdf,'orangeDark');pdf.setFont('helvetica','bold');pdf.setFontSize(9);
  pdf.text('VCC',margin,204);
  paint(pdf,'secondary');pdf.setFont('helvetica','normal');pdf.setFontSize(8);
  pdf.text('viajandoconcabeza.com',margin+13,204);
  pdf.text('COMPARATIVA DE VUELOS  ·  1/1',pageW-margin,204,{align:'right'});

  // Rutes excepcionalment llargues no es perden: detall textual en la segona pàgina.
  const longRoutes=items.filter(item=>String(item.flight.route||'').length>55);
  if(longRoutes.length){
    pdf.addPage('a4','landscape');
    color(pdf,'orange','fill');pdf.rect(0,0,pageW,4,'F');
    color(pdf,'ink');pdf.setFont('helvetica','bold');pdf.setFontSize(20);
    pdf.text('DETALLE DE LOS TRAYECTOS',margin,25);
    color(pdf,'muted');pdf.setFontSize(9);pdf.setFont('helvetica','normal');
    pdf.text('Información completa introducida en el comparador VCC.',margin,33);
    let py=47;
    items.forEach(({flight,index,total,valid:isValid})=>{
      color(pdf,'cream','fill');pdf.roundedRect(margin,py,pageW-2*margin,22,2,2,'F');
      color(pdf,'orange');pdf.setFont('helvetica','bold');pdf.setFontSize(10);
      pdf.text('OPCIÓN '+String.fromCharCode(65+index)+' · '+label(flight,names),margin+5,py+8);
      color(pdf,'ink');pdf.setFont('helvetica','normal');pdf.setFontSize(9);
      const lines=pdf.splitTextToSize(flight.route||'Trayecto no indicado',195);
      pdf.text(lines.slice(0,2),margin+5,py+15);
      pdf.setFont('helvetica','bold');
      pdf.text(isValid?euros.format(total):'Sin precio de billete',pageW-margin-5,py+12,{align:'right'});
      py+=27;
    });
    color(pdf,'muted');pdf.setFont('helvetica','normal');pdf.setFontSize(8);
    pdf.text('VIAJANDO CON CABEZA · viajandoconcabeza.com',margin,201);
    pdf.text('2/2',pageW-margin,201,{align:'right'});
    pdf.setPage(1);
    pdf.setTextColor(...PALETTE.muted);pdf.setFontSize(8);
    pdf.text('Trayectos completos en la página 2',pageW-margin,192,{align:'right'});
  }
  const name='VCC-comparativa-vuelos-'+now.toISOString().slice(0,10)+'.pdf';
  pdf.save(name);
  return name;
}
