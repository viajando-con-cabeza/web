/* VCC · PDF de ahorro en comisiones. Misma identidad que el PDF de Vuelos.
 * Generación en el navegador, sin enviar importes ni preferencias a un servidor.
 * jsPDF se carga solo si el lector pulsa GUARDAR EN PDF.
 */
const ENGINE='https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js';
const LOGO='/configuracion/imagenes/marca/logo-vcc.svg';
const euro=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
let pdfPromise;
function engine(){
 if(window.jspdf?.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
 if(pdfPromise)return pdfPromise;
 pdfPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=ENGINE;script.async=true;script.crossOrigin='anonymous';
  script.onload=()=>window.jspdf?.jsPDF?resolve(window.jspdf.jsPDF):reject(new Error('No se pudo iniciar el generador PDF.'));
  script.onerror=()=>reject(new Error('No se pudo cargar el generador PDF. Comprueba tu conexión.'));
  document.head.appendChild(script);
 }).catch(error=>{pdfPromise=null;throw error;});
 return pdfPromise;
}
async function logoPng(){
 try{
  const img=new Image();img.src=LOGO;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=240;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.drawImage(img,0,0,240,240);return canvas.toDataURL('image/png');
 }catch{return null}
}
const BRAND={paper:[250,247,243],white:[255,255,255],header:[250,240,231],line:[229,216,204],ink:[38,34,32],muted:[105,93,83],orange:[233,101,27],orangeDark:[172,81,31],green:[24,128,57],red:[176,47,47],neutral:[113,103,94],paleGreen:[241,249,238],paleRed:[254,242,239]};
function color(pdf,type,mode='text'){const rgb=BRAND[type];if(mode==='fill')pdf.setFillColor(...rgb);else if(mode==='stroke')pdf.setDrawColor(...rgb);else pdf.setTextColor(...rgb)}
function write(pdf,value,x,y,maxWidth,size=9,align='left'){
 const val=String(value||'—');pdf.setFontSize(size);
 let text=val;
 while(pdf.getTextWidth(text)>maxWidth&&text.length>2)text=text.slice(0,-2)+'…';
 pdf.text(text,x,y,{align});
}
async function heading(pdf,value,x,y,w){
 try{
  await document.fonts?.load('600 42px "Oswald"');
  const c=document.createElement('canvas');const cx=c.getContext('2d');
  cx.font='600 42px "Oswald",sans-serif';
  c.width=Math.ceil(cx.measureText(value).width+12)*2;c.height=58*2;
  cx.scale(2,2);cx.font='600 42px "Oswald",sans-serif';cx.textBaseline='alphabetic';cx.fillStyle='#262220';cx.fillText(value,6,43);
  pdf.addImage(c.toDataURL('image/png'),'PNG',x,y,Math.min(w,c.width/2*.195),12);
 }catch{color(pdf,'ink');pdf.setFont('helvetica','bold');write(pdf,value,x,y+10,w,20)}
}
function fmt(n,unit){
 const value=Number(n);
 const val=Number.isFinite(value)?Math.max(0,Math.min(value,100000000)):0;
 return unit==='%'?new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(val)+' %':euro.format(val);
}
function drawRounded(pdf,x,y,w,h,fill,stroke='line'){
 color(pdf,fill,'fill');color(pdf,stroke,'stroke');pdf.setLineWidth(.3);pdf.roundedRect(x,y,w,h,3,3,'FD');
}
export async function exportarAhorroTarjetasPDF({inputs,bankText,travelText,difference,createdAt}){
 if(!inputs||!bankText||!travelText||!Number.isFinite(Number(difference)))throw new Error('No se pudo preparar la comparación.');
 const Pdf=await engine();const pdf=new Pdf({orientation:'landscape',unit:'mm',format:'a4',compress:true});
 pdf.setProperties({title:'VCC · Calcula tu ahorro en tarjetas de viaje',subject:'Comparador de comisiones para pagos en otra divisa',author:'Viajando con Cabeza',creator:'Viajando con Cabeza'});
 const W=297,H=210,x=15;
 const [logo]=await Promise.all([logoPng()]);
 color(pdf,'paper','fill');pdf.rect(0,0,W,H,'F');color(pdf,'orange','fill');pdf.rect(0,0,W,2.8,'F');
 if(logo)pdf.addImage(logo,'PNG',x,8,25,25);
 else{color(pdf,'orange','stroke');pdf.circle(27,20,11,'S');color(pdf,'orange');pdf.setFont('helvetica','bold');pdf.setFontSize(14);pdf.text('VCC',27,22,{align:'center'})}
 pdf.setFont('helvetica','bold');color(pdf,'ink');pdf.setFontSize(11);pdf.text('VIAJANDO CON CABEZA',45,17);
 pdf.setFont('helvetica','normal');color(pdf,'muted');pdf.setFontSize(8);
 pdf.text('PLANIFICA TU VIAJE  /  TARJETAS DE VIAJE',45,24);
 const date=createdAt||new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'});
 pdf.text('Generado el '+date,W-x,17,{align:'right'});
 pdf.text('Importes aportados por el viajero',W-x,24,{align:'right'});
 color(pdf,'line','stroke');pdf.line(x,36,W-x,36);
 color(pdf,'orange');pdf.setFont('helvetica','bold');pdf.setFontSize(7.7);pdf.text('COMPARA ANTES DE PAGAR',x,44);
 await heading(pdf,'CALCULA TU AHORRO',x,47,135);
 color(pdf,'muted');pdf.setFont('helvetica','normal');pdf.setFontSize(8);
 pdf.text('Comisiones y gasto en euros equivalentes · sin cambio en tiempo real',x,65);
 const rows=[
  ['Gasto en otra divisa', 'purchases','€'],
  ['Comisión de tu banco','bank','%'],
  ['Recargo de cambio','markup','%'],
  ['Comisión tarjeta de viaje','travel','%'],
  ['Efectivo retirado','cash','€'],
  ['Comisión retirada banco','atmBank','%'],
  ['Comisión retirada viaje','atmTravel','%']
 ];
 const tx=15,ty=73,tw=173,rh=12.9;
 drawRounded(pdf,tx,ty,tw,103,'white');
 color(pdf,'header','fill');pdf.rect(tx+.3,ty+.3,tw-.6,11,'F');
 color(pdf,'ink');pdf.setFont('helvetica','bold');pdf.setFontSize(9.3);pdf.text('CONCEPTO',tx+6,ty+7.3);pdf.text('IMPORTE',tx+tw-6,ty+7.3,{align:'right'});
 let yy=ty+11;
 for(const [i,[label,key,unit]] of rows.entries()){
  if(i%2){color(pdf,'paper','fill');pdf.rect(tx+.3,yy,tw-.6,rh,'F')}
  color(pdf,'line','stroke');pdf.setLineWidth(.2);pdf.line(tx+3,yy+rh,tx+tw-3,yy+rh);
  color(pdf,'orange','fill');pdf.circle(tx+6,yy+rh/2,.9,'F');
  color(pdf,'ink');pdf.setFont('helvetica','normal');write(pdf,label,tx+11,yy+8.2,118,9);
  pdf.setFont('helvetica','bold');write(pdf,fmt(inputs[key],unit),tx+tw-6,yy+8.2,42,9,'right');
  yy+=rh;
 }
 const dx=199,dy=73,dw=83,dh=93;
 drawRounded(pdf,dx,dy,dw,dh,'white');
 color(pdf,'orange');pdf.setFont('helvetica','bold');pdf.setFontSize(8);
 pdf.text('COMPARACIÓN DE COSTES',dx+5,dy+9);
 color(pdf,'line','stroke');pdf.line(dx+5,dy+13,dx+dw-5,dy+13);
 color(pdf,'muted');pdf.setFont('helvetica','normal');pdf.setFontSize(8);
 pdf.text('Tu banco',dx+6,dy+22);pdf.text('Tarjeta de viaje',dx+6,dy+42);
 color(pdf,'ink');pdf.setFont('helvetica','bold');pdf.setFontSize(15);
 write(pdf,bankText,dx+6,dy+31,dw-12,15);
 write(pdf,travelText,dx+6,dy+51,dw-12,15);
 const positive=difference>.005,negative=difference<-.005;
 const tone=positive?'green':negative?'red':'neutral';
 drawRounded(pdf,dx+5,dy+58,dw-10,29,positive?'paleGreen':negative?'paleRed':'paper');
 color(pdf,'muted');pdf.setFont('helvetica','bold');pdf.setFontSize(7.7);
 pdf.text(positive?'AHORRO ESTIMADO':negative?'COSTE ADICIONAL':'MISMO COSTE ESTIMADO',dx+9,dy+67);
 color(pdf,tone);pdf.setFont('helvetica','bold');pdf.setFontSize(20);
 write(pdf,euro.format(Math.abs(difference)),dx+9,dy+79,dw-18,20);
 color(pdf,'muted');pdf.setFont('helvetica','normal');pdf.setFontSize(7.8);
 pdf.text('Importes orientativos. No se consultan cotizaciones ni tarifas en tiempo real.',x,181);
 pdf.text('No se incluyen cuotas fijas ni posibles cargos propios del cajero. Verifica las condiciones.',x,187);
 color(pdf,'line','stroke');pdf.line(x,193,W-x,193);
 color(pdf,'orangeDark');pdf.setFont('helvetica','bold');pdf.setFontSize(8);
 pdf.text('VIAJANDO CON CABEZA  ·  PLANIFICA TU VIAJE',x,200);
 color(pdf,'muted');pdf.setFont('helvetica','normal');pdf.setFontSize(7);
 pdf.text('viajandoconcabeza.com',W-x,200,{align:'right'});
 const filename='VCC-comparativa-tarjetas-viaje.pdf';pdf.save(filename);
 return filename;
}
