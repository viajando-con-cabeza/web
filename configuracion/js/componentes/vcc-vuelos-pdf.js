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
  const pageW=297,pageH=210, margin=17;
  const now=new Date();
  const stamp=now.toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'});
  const names=Object.fromEntries(airlines);
  const logo=await logoPng();

  // Cabecera editorial: naranja, blanco, negro y sello SVG corporativo.
  color(pdf,'orange','fill');pdf.rect(0,0,pageW,4,'F');
  if(logo)pdf.addImage(logo,'PNG',margin,10,26,26);
  else{
    color(pdf,'ink','draw');pdf.setLineWidth(.8);pdf.circle(margin+13,23,12,'S');
    color(pdf,'orange');pdf.setFont('helvetica','bold');pdf.setFontSize(12);
    pdf.text('VCC',margin+13,25.5,{align:'center'});
  }
  color(pdf,'ink');pdf.setFont('helvetica','bold');pdf.setFontSize(11);
  pdf.text('VIAJANDO CON CABEZA',49,19);
  pdf.setFontSize(21);pdf.text('COMPARATIVA DE VUELOS',49,30);
  pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);color(pdf,'muted');
  pdf.text('Precio real: billete + equipaje + asiento + comida + traslado',49,36);
  pdf.text('Generado el '+stamp,pageW-margin,22,{align:'right'});
  pdf.text('Datos introducidos por el viajero',pageW-margin,29,{align:'right'});
  color(pdf,'border','draw');pdf.setLineWidth(.45);pdf.line(margin,41,pageW-margin,41);

  const summaryX=margin,summaryY=48,summaryW=pageW-2*margin,summaryH=33;
  color(pdf,'light','fill');pdf.roundedRect(summaryX,summaryY,summaryW,summaryH,3,3,'F');
  color(pdf,'orange','fill');pdf.roundedRect(summaryX,summaryY,4,summaryH,1,1,'F');
  color(pdf,'orange');pdf.setFont('helvetica','bold');pdf.setFontSize(10);
  pdf.text('NUESTRO CONSEJO VCC',summaryX+10,summaryY+8);
  color(pdf,'ink');pdf.setFont('helvetica','bold');pdf.setFontSize(12);
  if(lowest!==null){
    const winnerText=winners.map(item=>'Opción '+String.fromCharCode(65+item.index)+' · '+label(item.flight,names)).join(' / ');
    cellText(pdf,winnerText,summaryX+10,summaryY+18,summaryW-95,1,12);
    color(pdf,'orange');pdf.setFontSize(20);
    pdf.text(euros.format(lowest),summaryX+summaryW-10,summaryY+20,{align:'right'});
    color(pdf,'muted');pdf.setFont('helvetica','normal');pdf.setFontSize(7.5);
    const saves=valid.filter(item=>item.total>lowest+.005).map(item=>
      euros.format(item.total-lowest)+' frente a opción '+String.fromCharCode(65+item.index));
    const note=saves.length?'Ahorro: '+saves.join('  ·  '):
      'Las opciones con precio tienen el mismo coste total.';
    cellText(pdf,note,summaryX+10,summaryY+28,summaryW-20,1,7.5);
  }else{
    pdf.text('Ya puedes guardar la opción introducida',summaryX+10,summaryY+19);
    color(pdf,'muted');pdf.setFont('helvetica','normal');pdf.setFontSize(8);
    pdf.text('Añade otro billete para calcular el ahorro comparado.',summaryX+10,summaryY+27);
  }

  // Tabla apaisada: hasta cinco columnas; sin valores inventados.
  const x=margin,y=88,w=pageW-2*margin,labelW=53,colW=(w-labelW)/items.length;
  const rows=[
    {label:'AEROLÍNEA',field:'airline',height:13},
    {label:'TRAYECTO / AEROPUERTO',field:'route',height:16},
    {label:'BILLETE',field:'base',height:9},
    {label:'EQUIPAJE',field:'baggage',height:9},
    {label:'ASIENTO',field:'seat',height:9},
    {label:'COMIDA Y BEBIDA',field:'food',height:9},
    {label:'TRASLADO AEROPUERTO',field:'transfer',height:9},
    {label:'TOTAL POR OPCIÓN',field:'total',height:13}
  ];
  let cy=y;
  color(pdf,'ink','fill');pdf.roundedRect(x,cy,w,10,2,2,'F');
  color(pdf,'white');pdf.setFont('helvetica','bold');pdf.setFontSize(8.5);
  pdf.text('CONCEPTO',x+4,cy+6.7);
  items.forEach(({index},i)=>pdf.text('OPCIÓN '+String.fromCharCode(65+index),x+labelW+i*colW+colW/2,cy+6.7,{align:'center'}));
  cy+=10;
  for(const [ri,row] of rows.entries()){
    const totalRow=row.field==='total';
    color(pdf,totalRow?'light':ri%2?'cream':'white','fill');
    pdf.rect(x,cy,w,row.height,'F');
    color(pdf,'border','draw');pdf.setLineWidth(.26);pdf.line(x,cy+row.height,x+w,cy+row.height);
    color(pdf,totalRow?'orange':'ink');pdf.setFont('helvetica','bold');
    pdf.setFontSize(totalRow?9:8);
    pdf.text(row.label,x+4,cy+row.height/2+2.5);
    items.forEach(({flight,index,total,valid:isValid},i)=>{
      const cellX=x+labelW+i*colW, cx=cellX+colW/2;
      const winner=winners.some(item=>item.index===index);
      if(totalRow&&winner){
        color(pdf,'orange','fill');pdf.rect(cellX,cy,colW,row.height,'F');
      }
      color(pdf,totalRow&&winner?'white':totalRow?'ink':'muted');
      pdf.setFont('helvetica',totalRow?'bold':'normal');
      if(row.field==='airline'){
        cellText(pdf,label(flight,names),cellX+3,cy+6,Math.max(5,colW-6),2,8);
      }else if(row.field==='route'){
        cellText(pdf,flight.route||'—',cellX+3,cy+6,Math.max(5,colW-6),2,7.5);
      }else{
        const value=totalRow?(isValid?euros.format(total):'—'):
          (String(flight[row.field]??'').trim()!==''?euros.format(amount(flight[row.field])):'—');
        pdf.setFontSize(totalRow?10:8.5);
        pdf.text(value,cx,cy+row.height/2+2.5,{align:'center'});
      }
    });
    cy+=row.height;
  }

  color(pdf,'muted');pdf.setFont('helvetica','normal');pdf.setFontSize(7.7);
  pdf.text('Importes facilitados por ti. VCC no consulta tarifas en directo ni garantiza precios o disponibilidad.',margin,187);
  pdf.text('Comprueba equipaje, condiciones de cambio y aeropuerto antes de reservar.',margin,192);
  color(pdf,'border','draw');pdf.line(margin,198,pageW-margin,198);
  color(pdf,'orange');pdf.setFont('helvetica','bold');pdf.setFontSize(9);
  pdf.text('VCC',margin,204);
  color(pdf,'muted');pdf.setFont('helvetica','normal');pdf.setFontSize(8.2);
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
