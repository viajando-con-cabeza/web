/** Les fotos de les guies i de Qué llevar sempre provenen de les pàgines originals. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
function guidePhoto(html,kind){
 const tags=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
 const tag=kind==="pack"?tags.find(t=>/\bclass="[^"]*\bql-hero-photo\b/.test(t)):tags.find(t=>/fetchpriority="high"/i.test(t)&&/src="https:\/\/img\.viajandoconcabeza\.com\//.test(t));
 const url=tag?.match(/\bsrc="([^"]+)"/)?.[1];
 if(!url||!url.startsWith("https://img.viajandoconcabeza.com/__vcc_preview/visor/"))throw Error("No matching source hero photo: "+kind);
 return url;
}
function targetCover(src,oldImg,hub){
 const alt=oldImg.match(/\balt="([^"]*)"/)?.[1]||"";
 const mini=src.replace("/__vcc_preview/visor/","/__vcc_preview/mini/");
 const sizes=hub?"(max-width: 520px) 100vw, (max-width: 850px) 50vw, 300px":"(max-width: 767px) 50vw, 300px";
 const w=hub?640:300,h=hub?380:180;
 return '<img class="vcc-card-cover-photo" src="'+src+'" srcset="'+mini+' 480w, '+src+' 1800w" sizes="'+sizes+'" alt="'+alt+'" width="'+w+'" height="'+h+'" loading="lazy" decoding="async">';
}
function synchronizedGuidePhotos(plan,packingHub,queVer,seeSrc,packSrc){
 const routes={"/destinos/suecia/estocolmo/imprescindibles":seeSrc,"/destinos/suecia/estocolmo/que-ver":seeSrc,"/destinos/suecia/estocolmo/que-llevar":packSrc};
 let guideCount=0;
 const newPlan=plan.replace(/<a\b[^>]*\bdi-guide-card\b[^>]*>[\s\S]*?<\/a>/gi,card=>{
  const href=card.match(/\bhref="([^"]+)"/)?.[1];
  if(!routes[href])return card;
  const img=card.match(/<img\b[^>]*>/i)?.[0];
  if(!img)throw Error("Missing photo of guide "+href);
  guideCount++;
  return card.replace(img,targetCover(routes[href],img,false));
 });
 if(guideCount!==3)throw Error("Expected three matching guide cards, found "+guideCount);
 let packCards=0;
 const newHub=packingHub.replace(/<article\b[^>]*\bpacking-card\b[^>]*>[\s\S]*?<\/article>/gi,card=>{
  if(!card.includes('href="/destinos/suecia/estocolmo/que-llevar"'))return card;
  const img=card.match(/<img\b[^>]*>/i)?.[0];
  if(!img)throw Error("Missing image in packing hub");
  packCards++;
  return card.replace(img,targetCover(packSrc,img,true));
 });
 if(packCards!==1)throw Error("Expected one packing hub card, got "+packCards);
 const og=queVer.match(/<meta\b[^>]*property="og:image"[^>]*>/i)?.[0];
 if(!og)throw Error("Qué ver OG:image missing");
 const newQueVer=queVer.replace(og,og.replace(/\bcontent="[^"]*"/,'content="'+seeSrc+'"'));
 return {plan:newPlan,hub:newHub,queVer:newQueVer};
}
const files=['planifica/donde-ir/index.html','planifica/que-llevar/index.html','destinos/suecia/estocolmo/que-ver.html','destinos/suecia/estocolmo/imprescindibles.html','destinos/suecia/estocolmo/que-llevar.html'];
const contents=files.map(p=>fs.readFileSync(path.join(ROOT,p),'utf8'));
const seeSrc=guidePhoto(contents[3],'see'),packSrc=guidePhoto(contents[4],'pack');
const changed=synchronizedGuidePhotos(contents[0],contents[1],contents[2],seeSrc,packSrc);
const expected=[changed.plan,changed.hub,changed.queVer];
const write=process.argv.includes('--write');
let drift=0;
for(let i=0;i<3;i++){
 if(expected[i]===contents[i]){console.log('VCC fotos guies OK:',files[i]);continue;}
 drift++;
 if(write){fs.writeFileSync(path.join(ROOT,files[i]),expected[i],'utf8');console.log('VCC fotos guies sincronitzades:',files[i]);}
 else console.error('VCC fotos guies desactualitzades:',files[i]);
}
if(drift&&!write)process.exitCode=1;
