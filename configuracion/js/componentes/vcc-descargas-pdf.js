/* VCC · Exportación PDF compartida sin dependencias externas.
 * Resumen descargable con texto seleccionable, saltos de página y caracteres españoles. */
(function(){
"use strict";
if(window.VCCPDF)return;
const PAGE_W=595.28,PAGE_H=841.89,MARGIN=49,MAX_W=PAGE_W-MARGIN*2;
const FONT_NORMAL="/F1",FONT_BOLD="/F2";
const DARK=[.13,.14,.14],MUTED=[.43,.43,.43],ACCENT=[.77,.37,.30];
const cp1252={"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,"Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,"˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159};
function escapePDF(input){
 return Array.from(String(input)).map(ch=>{
  let n=Object.prototype.hasOwnProperty.call(cp1252,ch)?cp1252[ch]:ch.codePointAt(0);
  if(n>255)return "?";
  if(ch==="("||ch===")"||ch==="\\")return "\\"+ch;
  if(n<32||n>=127)return "\\"+n.toString(8).padStart(3,"0");
  return ch;
 }).join("");
}
const measure=document.createElement("canvas").getContext("2d");
function width(value,size=10,bold=false){
 if(!measure)return Array.from(value).length*size*.55;
 measure.font=(bold?"bold ":"")+size+"px Arial";
 return measure.measureText(value).width;
}
function wrap(value,maxWidth,size=10,bold=false){
 const output=[];
 for(const paragraph of String(value).split("\n")){
  const words=paragraph.trim().split(/\s+/).filter(Boolean);
  if(!words.length){output.push("");continue;}
  let line="";
  for(const word of words){
   const candidate=line?line+" "+word:word;
   if(width(candidate,size,bold)<=maxWidth){line=candidate;continue;}
   if(line){output.push(line);line="";}
   if(width(word,size,bold)<=maxWidth){line=word;continue;}
   let fragment="";
   for(const ch of Array.from(word)){
    if(fragment&&width(fragment+ch,size,bold)>maxWidth){output.push(fragment);fragment=ch;}
    else fragment+=ch;
   }
   line=fragment;
  }
  if(line)output.push(line);
 }
 return output;
}
function rgb(color){return color.map(x=>Number(x).toFixed(3)).join(" ");}
function generate(options){
 if(!options||!options.title||!Array.isArray(options.sections))throw Error("Faltan datos del PDF");
 const pages=[];let ops=[],y=108;
 function text(value,x,top,size=10,bold=false,color=DARK){
  ops.push("BT "+(bold?FONT_BOLD:FONT_NORMAL)+" "+size.toFixed(2)+" Tf "+rgb(color)+" rg 1 0 0 1 "+x.toFixed(2)+" "+(PAGE_H-top).toFixed(2)+" Tm ("+escapePDF(value)+") Tj ET");
 }
 function rule(top){ops.push("0.88 0.85 0.82 RG 0.65 w "+MARGIN+" "+(PAGE_H-top).toFixed(2)+" m "+(PAGE_W-MARGIN).toFixed(2)+" "+(PAGE_H-top).toFixed(2)+" l S");}
 function finish(){pages.push(ops.join("\n")+"\n");}
 function startPage(){
  ops=[];y=107;
  ops.push(rgb(ACCENT)+" RG 2 w "+MARGIN+" "+(PAGE_H-65).toFixed(2)+" m "+(PAGE_W-MARGIN).toFixed(2)+" "+(PAGE_H-65).toFixed(2)+" l S");
  text("VIAJANDO CON CABEZA",MARGIN,51,12.5,true,DARK);
  text("VCC · GUIA DE VIAJE",PAGE_W-MARGIN-113,51,8,false,MUTED);
 }
 function space(height){
  if(y+height>PAGE_H-78){finish();startPage();}
 }
 function lines(values,{size=10,bold=false,color=DARK,indent=0}={}){
  const available=MAX_W-indent;
  for(const value of values){
   for(const line of wrap(value,available,size,bold)){
    space(16);
    text(line,MARGIN+indent,y,size,bold,color);
    y+=15.5;
   }
  }
 }
 startPage();
 const titleLines=wrap(options.title,MAX_W,22,true);
 for(const titleLine of titleLines){space(30);text(titleLine,MARGIN,y,22,true,DARK);y+=27;}
 if(options.subtitle){y+=4;lines([options.subtitle],{size:10.5,color:MUTED});}
 if(options.meta&&options.meta.length){y+=4;lines(options.meta,{size:10,color:MUTED});}
 y+=17;rule(y);y+=24;
 for(const sec of options.sections){
  if(!sec)continue;
  const entries=Array.isArray(sec.lines)?sec.lines:[];
  space(46);
  if(sec.heading){text(sec.heading.toLocaleUpperCase("es-ES"),MARGIN,y,12.5,true,ACCENT);y+=24;}
  lines(entries,{size:10.25});
  if(sec.note){y+=5;lines([sec.note],{size:9,color:MUTED});}
  y+=16;
 }
 if(options.note){space(44);rule(y);y+=18;lines([options.note],{size:9,color:MUTED});}
 finish();
 const totalPages=pages.length;
 for(let i=0;i<totalPages;i++){
  const footer=["BT /F1 8 Tf "+rgb(MUTED)+" rg 1 0 0 1 "+MARGIN+" 37 Tm (www.viajandoconcabeza.com) Tj ET",
   "BT /F1 8 Tf "+rgb(MUTED)+" rg 1 0 0 1 "+(PAGE_W-MARGIN-44).toFixed(2)+" 37 Tm (Pagina "+(i+1)+"/"+totalPages+") Tj ET"];
  pages[i]+="\n"+footer.join("\n")+"\n";
 }
 const objects=[];
 objects[1]="<< /Type /Catalog /Pages 2 0 R >>";
 objects[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
 objects[4]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
 const refs=[];
 for(let i=0;i<totalPages;i++){
  const id=5+i*2,contentId=id+1,content=pages[i];
  refs.push(id+" 0 R");
  objects[id]="<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+PAGE_W+" "+PAGE_H+"] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents "+contentId+" 0 R >>";
  objects[contentId]="<< /Length "+content.length+" >>\nstream\n"+content+"endstream";
 }
 objects[2]="<< /Type /Pages /Kids ["+refs.join(" ")+"] /Count "+totalPages+" >>";
 let result="%PDF-1.4\n% VCC\n";const positions=[0];
 for(let i=1;i<objects.length;i++){
  if(!objects[i])throw Error("Objeto PDF sin construir: "+i);
  positions[i]=result.length;result+=i+" 0 obj\n"+objects[i]+"\nendobj\n";
 }
 const xref=result.length;
 result+="xref\n0 "+objects.length+"\n0000000000 65535 f \n";
 for(let i=1;i<objects.length;i++)result+=String(positions[i]).padStart(10,"0")+" 00000 n \n";
 result+="trailer\n<< /Size "+objects.length+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF";
 return new Blob([result],{type:"application/pdf"});
}
function download(options){
 const blob=generate(options),url=URL.createObjectURL(blob);
 const anchor=document.createElement("a");anchor.href=url;
 anchor.download=options.filename||"guia-vcc.pdf";
 document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 return blob;
}
window.VCCPDF=Object.freeze({generate,download});
})();
