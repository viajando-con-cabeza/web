/**
 * VCC · Administrador seguro de fotografías R2
 * Flujo: elegir carpeta > analizar JPG/JPEG > confirmar duplicados > copia de seguridad
 *       > retirar solo duplicados confirmados > convertir restantes a AVIF.
 * Requiere bindings R2 BUCKET, Images IMAGES, secreto ADMIN_TOKEN.
 * Los archivos .avif existentes no se borran ni se reescriben salvo opción explícita.
 */
const PAGE_SIZE = 1000;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const AVIF_QUALITY = 85;
const COLOR = Object.freeze({ brightness: 1.012, contrast: 0.984, saturation: 1.008 });
const COLOR_VERSION = "vcc-color-v2";
const BACKUP_PREFIX = "__vcc_dedup_backup__/";
const JPG_RE = /\.jpe?g$/i;
const IMAGE_RE = /\.(?:jpe?g|webp|avif)$/i;
const contentTypeForKey = key => /\.avif$/i.test(key) ? 'image/avif' : /\.webp$/i.test(key) ? 'image/webp' : 'image/jpeg';

const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
  "X-Content-Type-Options":"nosniff"}
});
const avifName = key => key.replace(/\.jpe?g$/i, ".avif");
const sameFolder = (key, prefix) => key.startsWith(prefix) && key.slice(prefix.length).length > 0;
function normalizePrefix(input) {
  if (typeof input !== "string") throw new Error("Debes indicar una carpeta.");
  const p=input.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!p || p.includes("\\") || p.includes("..") || p.includes("//") || p.startsWith(BACKUP_PREFIX.slice(0,-1)) || /[\r\n\0]/.test(p)) throw new Error("Carpeta no válida.");
  return p+"/";
}
function assertPhotoKey(key, prefix) {
  if (typeof key !== "string" || !JPG_RE.test(key) || !sameFolder(key,prefix)) throw new Error("Foto fuera de la carpeta seleccionada.");
}
function assertImageKey(key,prefix){
 if(typeof key!=='string'||!IMAGE_RE.test(key)||!sameFolder(key,prefix))throw Error('Imagen fuera de la carpeta o formato no admitido.');
}
function validateAuth(request,env){
  const provided=request.headers.get("Authorization") || "";
  return !!env.ADMIN_TOKEN && provided === "Bearer " + env.ADMIN_TOKEN;
}

// Borrado directo solo por acción explícita del usuario, sin copias de seguridad.
async function removeDuplicateOne(env,prefix,key,keepKey,etag,keepEtag,confidence){
  assertImageKey(key,prefix);assertImageKey(keepKey,prefix);
  if(key===keepKey)throw Error('No se puede borrar la foto conservada.');
  if(key.slice(0,key.lastIndexOf('/')+1)!==keepKey.slice(0,keepKey.lastIndexOf('/')+1))
    throw Error('No se permite comparar ni eliminar fotos de carpetas distintas.');
  if(!Number.isFinite(confidence)||confidence<80||confidence>100)
    throw Error('No se ha confirmado una coincidencia visual de alta confianza.');
  const [old,keeper]=await Promise.all([env.BUCKET.head(key),env.BUCKET.head(keepKey)]);
  if(!old||!keeper||old.etag!==etag||keeper.etag!==keepEtag)
    throw Error('Alguna fotografía ha cambiado. Vuelve a analizar antes de eliminar.');
  // Releer inmediatamente antes de borrar y no tocar ninguna fotografía distinta.
  const again=await env.BUCKET.head(key);
  if(!again||again.etag!==etag)throw Error('La fotografía cambió; no se ha eliminado.');
  await env.BUCKET.delete(key);
  return {removed:key,kept:keepKey,confidence,noBackup:true};
}


// Conversion en dues fases: (1) Images -> resposta en streaming al navegador,
// (2) AVIF rebut -> R2 i verificació, sense mantenir el JPG i l'AVIF al Worker.
// No elimina mai el JPG si no s'ha verificat el nou AVIF.
const verifiedAvifFor=(jpg,obj)=>!!(jpg&&obj&&obj.size>0&&
 obj.httpMetadata?.contentType==='image/avif'&&
 obj.customMetadata?.sourceEtag===jpg.etag&&
 obj.customMetadata?.colorVersion===COLOR_VERSION);
async function prepareAvifStream(env,key,prefix,etag){
 assertPhotoKey(key,prefix);
 if(typeof etag!=='string'||!etag)throw Error('ETag JPG obligatorio.');
 const target=avifName(key);
 const [jpg,avif]=await Promise.all([env.BUCKET.head(key),env.BUCKET.head(target)]);
 if(!jpg)return json({skipped:key,reason:'JPG ausente'});
 if(jpg.etag!==etag)throw Error('El JPG ha cambiado. Recarga la carpeta.');
 if(jpg.size>MAX_IMAGE_SIZE)throw Error('JPG superior a 20 MB.');
 if(verifiedAvifFor(jpg,avif))return json({reusedVerifiedAvif:true,key,avif:target});
 if(avif)throw Error('Ya existe un AVIF distinto de este JPG. Revisa el destino antes de reemplazarlo.');
 const original=await env.BUCKET.get(key);
 if(!original?.body||original.etag!==etag)throw Error('JPG modificado. Se conserva el original.');
 const result=(await env.IMAGES.input(original.body)
   .transform({brightness:COLOR.brightness,contrast:COLOR.contrast,saturation:COLOR.saturation})
   .output({format:'image/avif',quality:AVIF_QUALITY})).response();
 if(!result.ok||!result.body)throw Error('Cloudflare Images: HTTP '+result.status);
 // Aquest response s'envia directament com a stream; evitem arrayBuffer() aquí.
 return new Response(result.body,{status:200,headers:{
   'Content-Type':'image/avif','Cache-Control':'no-store','X-VCC-Source-Etag':etag,
   'X-Content-Type-Options':'nosniff'
 }});
}
async function finalizeAvif(env,key,prefix,etag,request,upload){
 assertPhotoKey(key,prefix);
 if(typeof etag!=='string'||!etag)throw Error('ETag JPG obligatorio.');
 const target=avifName(key);
 const [jpg,existing]=await Promise.all([env.BUCKET.head(key),env.BUCKET.head(target)]);
 if(!jpg)return json({skipped:key,reason:'JPG ausente'});
 if(jpg.etag!==etag)throw Error('El JPG ha cambiado. No se ha eliminado.');
 let reused=verifiedAvifFor(jpg,existing),saved=false;
 if(!reused){
   if(!upload)throw Error('AVIF no verificado. No se ha eliminado el JPG.');
   if(existing)throw Error('AVIF distinto ya existente. Se conserva el JPG.');
   const declared=Number(request.headers.get('Content-Length'));
   if(Number.isFinite(declared)&&declared>25*1024*1024)throw Error('AVIF excesivamente grande.');
   if(request.headers.get('Content-Type')?.split(';')[0]?.trim()!=='image/avif')
     throw Error('Se esperaba un archivo AVIF.');
   // AVIF sol ser molt menor que el JPG. Aquest buffer existeix solament
   // a la petició d'escriptura; el Worker de conversió ja ha acabat.
   const bytes=await request.arrayBuffer();
   if(!bytes.byteLength||bytes.byteLength>25*1024*1024)throw Error('AVIF vacío o superior a 25 MB.');
   const header=new Uint8Array(bytes,0,Math.min(bytes.byteLength,48));
   const ascii=(a,b)=>String.fromCharCode(...header.subarray(a,b));
   if(header.length<16||ascii(4,8)!=='ftyp'||
     !['avif','avis'].some(brand=>ascii(8,12)===brand||ascii(16,20)===brand))
     throw Error('El archivo recibido no es un AVIF válido.');
   const written=await env.BUCKET.put(target,bytes,{httpMetadata:{contentType:'image/avif'},
     customMetadata:{sourceEtag:etag,colorVersion:COLOR_VERSION}});
   if(!written?.size)throw Error('No se ha podido guardar el AVIF en R2.');
   saved=true;
 }
 const [current,verified]=await Promise.all([env.BUCKET.head(key),env.BUCKET.head(target)]);
 if(!current||current.etag!==etag||!verifiedAvifFor(current,verified))
   throw Error('No se ha verificado el AVIF. El JPG se conserva.');
 await env.BUCKET.delete(key);
 return json({deleted:key,avif:target,converted:saved,reusedVerifiedAvif:reused});
}

async function convertAndDeleteOne(env,key,prefix){
  assertPhotoKey(key,prefix);
  const target=avifName(key);
  // Comprobar JPG y AVIF simultáneamente para ahorrar esperas de R2.
  const [jpg,previousAvif]=await Promise.all([
    env.BUCKET.head(key),env.BUCKET.head(target)
  ]);
  if(!jpg)return {skipped:key,reason:'JPG ausente'};
  if(jpg.size>MAX_IMAGE_SIZE)throw new Error('JPG superior a 20 MB');
  const matches=(obj)=>!!(obj&&obj.size>0&&
    obj.httpMetadata?.contentType==='image/avif'&&
    obj.customMetadata?.sourceEtag===jpg.etag&&
    obj.customMetadata?.colorVersion===COLOR_VERSION);
  const alreadyVerified=matches(previousAvif);
  if(!alreadyVerified){
    const original=await env.BUCKET.get(key);
    if(!original||!original.body||original.etag!==jpg.etag)
      throw new Error('El JPG cambió antes de la transformación; no se ha eliminado.');
    const transformed=(await env.IMAGES.input(original.body)
      .transform({brightness:COLOR.brightness,contrast:COLOR.contrast,saturation:COLOR.saturation})
      .output({format:'image/avif',quality:AVIF_QUALITY})).response();
    if(!transformed.ok||!transformed.body)
      throw new Error('Error de transformación AVIF HTTP '+transformed.status);
    // Los streams con longitud conocida se suben sin crear un ArrayBuffer
    // adicional. Cuando Images no expone Content-Length, usar el buffer.
    const lengthHeader=transformed.headers.get('Content-Length');
    const outputLength=lengthHeader===null?NaN:Number(lengthHeader);
    let output;
    if(Number.isSafeInteger(outputLength)&&outputLength>0){
      output=transformed.body;
    }else{
      output=await transformed.arrayBuffer();
      if(output.byteLength===0)throw new Error('AVIF generado vacío');
    }
    const written=await env.BUCKET.put(target,output,{
      httpMetadata:{contentType:'image/avif'},
      customMetadata:{sourceEtag:jpg.etag,colorVersion:COLOR_VERSION}
    });
    if(!written||!written.size)throw new Error('No se ha podido guardar el AVIF en R2');
  }
  // Verificación final: ni formato ni origen han cambiado.
  // Si falla, conservar siempre el JPG.
  const [currentJpg,finalAvif]=await Promise.all([
    env.BUCKET.head(key),env.BUCKET.head(target)
  ]);
  if(!currentJpg||currentJpg.etag!==jpg.etag)
    throw new Error('El JPG se ha modificado; no se ha eliminado.');
  if(!matches(finalAvif))
    throw new Error('AVIF no verificado; se conserva el JPG.');
  await env.BUCKET.delete(key);
  return {deleted:key,avif:target,converted:!alreadyVerified,reusedVerifiedAvif:alreadyVerified};
}

const AI_VERSION='vcc-ai-locations-v3';
const AI_MODEL='@cf/meta/llama-4-scout-17b-16e-instruct';
const clampScore=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
const safeAiText=(v,n=220)=>String(v==null?'':v).replace(/[\u0000-\u001f]/g,' ').trim().slice(0,n);
function parseAiJSON(raw){
 if(raw&&typeof raw==='object'&&!Array.isArray(raw))return raw;
 const txt=String(raw||'').replace(/<think>[\s\S]*?<\/think>/g,'').trim();
 const a=txt.indexOf('{'),b=txt.lastIndexOf('}');
 if(a<0||b<=a)throw Error('La IA no ha entregado datos estructurados. Puedes reintentarlo.');
 try{return JSON.parse(txt.slice(a,b+1))}catch{throw Error('Respuesta de IA no válida. Reintenta esta fotografía.')}
}
function base64Bytes(buffer){
 const bytes=new Uint8Array(buffer);let binary='';
 for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
 return btoa(binary);
}
async function aiReviewOne(env,key,prefix,etag,context,force,compact=false){
 if(!env.AI)throw Error('La conexión Workers AI no está configurada.');
 assertImageKey(key,prefix);
 if(key.split('/').some(p=>p==='_preview'||p==='__vcc_dedup_backup__'))throw Error('No se analizan miniaturas internas.');
 if(typeof etag!=='string'||!etag)throw Error('ETag inválido.');
 const hint=safeAiText(context,180);
 const head=await env.BUCKET.head(key);
 if(!head||head.etag!==etag)throw Error('La foto ha cambiado; vuelve a cargar la carpeta.');
 if(head.size>MAX_IMAGE_SIZE)throw Error('Imagen superior a 20 MB.');
 const cacheKey='__vcc_ai_reviews__/'+key+'.json';
 if(!force){
   const cache=await env.BUCKET.get(cacheKey);
   if(cache&&cache.size<=3200000){
     try{const data=await cache.json();if(data.version===AI_VERSION&&data.key===key&&data.etag===etag&&data.context===hint&&data.thumbnail&&data.category&&data.kind&&data.thumbnail.length<3100000)return {...data,cached:true}}catch{}
   }
 }
 const original=await env.BUCKET.get(key);
 if(!original?.body||original.etag!==etag)throw Error('La fotografía cambió al leerla.');
 const thumb=(await env.IMAGES.input(original.body)
  .transform({width:compact?384:512,height:compact?384:512,fit:'scale-down'})
  .output({format:'image/jpeg',quality:compact?58:69})).response();
 if(!thumb.ok||!thumb.body)throw Error('No se pudo generar la imagen reducida: HTTP '+thumb.status);
 const bytes=await thumb.arrayBuffer();
 if(!bytes.byteLength||bytes.byteLength>850000)throw Error('Miniatura demasiado grande; se recomienda el modo compacto.');
 const thumbnail='data:image/jpeg;base64,'+base64Bytes(bytes);
 const prompt=[
  'Eres especialista en identificar visualmente lugares en fotografías para un blog de viajes. Responde SOLO en español y un JSON.',
  'Contexto indicado: '+(hint||'no facilitado')+'. Es una PISTA, nunca demuestra el lugar.',
  'Decide primero si hay evidencia visual específica e inequívoca de museo, monumento, plaza, barrio, calle o lugar. No confundas edificios similares.',
  'Para un sitio exacto exige un rasgo distintivo visible (letrero legible, fachada singular, monumento reconocido). Sin esa prueba NO afirmes nombre exacto.',
  'Nunca inventes nombre de sitio. Si hay duda, kind=generic, confidence=baja y place=No identificable.',
  'Si NO identificas sitio, clasifica lo visible en la categoría española más útil: Calles, Paisajes, Mar, Miradores, Bosques, Montañas, Playas, Parques, Comida, Transporte, Interiores, Arquitectura u Otros.',
  'Si ni siquiera puedes reconocer la categoría, usa category=Otros. Un bosque indistinto = Bosques; mar abierto = Mar; calle comercial = Calles.',
  'Si realmente ves una fachada inconfundible (como las torres únicas de la Sagrada Familia), puedes usar kind=specific con el nombre exacto y una prueba visual concreta. Sin pruebas, usa generic.',
  'Para kind=specific exige confidence=alta, place_confidence >= 85 y visual_evidence explicando qué detalle visible prueba esa ubicación.',
  'NO uses el nombre de la ciudad del contexto como prueba; no te limites a adivinar sitios famosos.',
  'Un solo JSON con exactamente las claves kind (specific/generic), place, place_confidence (0-100), confidence (alta/media/baja), category, visual_evidence, subject, alt.',
  '{"kind":"generic","place":"No identificable","place_confidence":0,"confidence":"baja","category":"Mar","visual_evidence":"","subject":"Mar abierto","alt":"Vista de mar abierto"}'
 ].join('\n');
 const response=await env.AI.run(AI_MODEL,{
    messages:[{role:'system',content:'Responde solo JSON válido en español, sin inventar ubicaciones.'},
      {role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:thumbnail}}]}],
    temperature:0.05,max_tokens:290
 });
 const raw=response?.choices?.[0]?.message?.content??response?.response??response;
 const parsed=aiParseClassification(raw);
 const details=aiClassifyPayload(parsed);
 const data={version:AI_VERSION,key,etag,context:hint,
  ...details,reason:details.needsReview?'Revisar clasificación':'Lugar identificado visualmente',
  thumbnail,model:AI_MODEL,reviewedAt:new Date().toISOString()};
 try{await env.BUCKET.put(cacheKey,JSON.stringify(data),{httpMetadata:{contentType:'application/json; charset=utf-8'}})}
 catch(e){console.warn('Caché de IA no guardada',String(e?.message||e).slice(0,150))}
 return {...data,cached:false};
}

function aiPlaceFolder(input){
 const text=String(input??'').trim();
 if(!text||text.length>180||/[\/\\\u0000-\u001f\u007f]/.test(text)||text.includes('..'))
  throw Error('Nombre de carpeta inválido.');
 const name=text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'')
  .slice(0,72).replace(/_+$/,'');
 if(name.length<2||name==='__proto__')throw Error('Nombre de carpeta inválido.');
 return name;
}
const AI_CATEGORIES=Object.freeze(['Calles','Paisajes','Mar','Miradores','Bosques','Montañas','Playas','Parques','Comida','Transporte','Interiores','Arquitectura','Otros']);
function aiCategory(value){
 const normalized=String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 const match=AI_CATEGORIES.find(x=>x.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()===normalized);
 if(match)return match;
 const synonyms={calle:'Calles',callejon:'Calles',pueblo:'Calles',ciudad:'Calles',urbano:'Calles',
  paisaje:'Paisajes',naturaleza:'Paisajes',campo:'Paisajes',verde:'Paisajes',vegetacion:'Paisajes',
  oceano:'Mar',costa:'Mar',agua:'Mar',vista_mar:'Mar',mirador:'Miradores',panoramica:'Miradores',
  bosque:'Bosques',arboles:'Bosques',selva:'Bosques',montana:'Montañas',montes:'Montañas',
  playa:'Playas',arena:'Playas',parque:'Parques',jardin:'Parques',
  restaurante:'Comida',gastronomia:'Comida',alimentos:'Comida',
  autobus:'Transporte',barco:'Transporte',tren:'Transporte',avion:'Transporte',
  interior:'Interiores',habitacion:'Interiores',edificio:'Arquitectura',monumento:'Arquitectura',
  desconocido:'Otros',no_identificable:'Otros',otro:'Otros'};
 const key=normalized.replace(/[^a-z0-9]+/g,'_');
 if(synonyms[key])return synonyms[key];
 if(/^(paisaje|naturaleza|vista_verde|vegetacion)/.test(key))return 'Paisajes';
 if(/^(calle|barrio|zona_urbana|centro_urbano)/.test(key))return 'Calles';
 if(/^(mar_|oceano|costa_|mar_abierto)/.test(key))return 'Mar';
 if(/^(bosque|arboleda|selva_)/.test(key))return 'Bosques';
 if(/^(mirador|vista_panoramica)/.test(key))return 'Miradores';
 return 'Otros';
}
function aiParseClassification(raw){
 try{
  let value=raw;
  for(let n=0;n<3;n++){
   if(Array.isArray(value)){value=value.map(x=>typeof x==='string'?x:(x?.text||x?.content||'')).join(' ');continue}
   if(value&&typeof value==='object'&&!Array.isArray(value)){
    if('kind' in value||'category' in value||'place' in value)break;
    value=value.response??value.content??value.choices?.[0]?.message?.content??value;
   }else break;
  }
  return parseAiJSON(value);
 }catch{return null}
}
function aiClassifyPayload(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))
  return {kind:'generic',place:'No identificable',category:'Otros',confidence:'baja',
   evidence:'',subject:'Imagen sin clasificación automática',needsReview:true};
 const category=aiCategory(payload.category),conf=String(payload.confidence||'').toLowerCase();
 const confidence=['alta','media','baja'].includes(conf)?conf:'baja';
 const place=safeAiText(payload.place,96),evidence=safeAiText(payload.visual_evidence,150);
 const value=Number(payload.place_confidence);
 const percent=Number.isFinite(value)?value:0;
 const genericNames=new Set(['no identificable','desconocido','no se sabe','sin determinar','lugar desconocido',
  'ciudad','calle','bosque','mar','paisaje','arquitectura','pueblo','parque','otros']);
 let candidate=String(payload.kind||'').toLowerCase()==='specific'&&confidence==='alta'&&
  percent>=85&&evidence.length>=12&&place.length>=3&&!genericNames.has(place.toLowerCase());
 let label='';
 if(candidate){try{label=aiPlaceFolder(place)}catch{candidate=false}}
 // A generic category or name cannot masquerade as an exact landmark.
 if(label&&AI_CATEGORIES.some(cat=>{try{return aiPlaceFolder(cat)===label}catch{return false}}))
  candidate=false;
 return {kind:candidate?'specific':'generic',place:candidate?place:'No identificable',
  category,confidence:candidate?'alta':'baja',
  evidence:candidate?evidence:'',subject:safeAiText(payload.subject,140)||'Imagen de viaje',
  needsReview:!candidate||percent<94,placeConfidence:Math.min(100,Math.max(0,Math.round(percent))),
  alt:safeAiText(payload.alt,180)};
}

async function movePhotoToPlace(env,prefix,key,etag,folder,confirmed){
 if(confirmed!==true)throw Error('Confirma la organización de fotografías.');
 assertImageKey(key,prefix);
 const filename=key.slice(prefix.length);
 if(!filename||filename.includes('/'))throw Error('Solo se organizan las fotos de la carpeta seleccionada, sin incluir subcarpetas.');
 if(typeof etag!=='string'||!etag)throw Error('ETag inválido.');
 const label=aiPlaceFolder(folder),target=prefix+label+'/'+filename;
 const [source,existing]=await Promise.all([env.BUCKET.head(key),env.BUCKET.head(target)]);
 const owned=dest=>!!(dest&&dest.customMetadata?.vccMoveSource===key&&dest.customMetadata?.vccMoveEtag===etag);
 // Si R2 ja ha mogut la foto però el navegador ha perdut la resposta, no fallar el reintent.
 if(!source&&owned(existing))return {moved:true,source:key,target,folder:label,copied:false,verified:true,resumed:true};
 if(!source||source.etag!==etag)throw Error('La foto ha cambiado; vuelve a cargarla.');
 if(source.size>MAX_IMAGE_SIZE)throw Error('Foto de más de 20 MB: no se moverá automáticamente.');
 const matches=dest=>!!(owned(dest)&&dest.size===source.size&&
   (!source.checksums?.sha256||!dest.checksums?.sha256||
     String(source.checksums.sha256)===String(dest.checksums.sha256)));
 let targetHead=existing,copied=false;
 if(targetHead&&!matches(targetHead))throw Error('Ya existe otro archivo con ese nombre en el destino. No se sobrescribe.');
 if(!targetHead){
  const original=await env.BUCKET.get(key);
  if(!original?.body||original.etag!==etag)throw Error('El original ha cambiado.');
  const settings={httpMetadata:original.httpMetadata||{contentType:contentTypeForKey(key)},
   customMetadata:{...(original.customMetadata||{}),vccMoveSource:key,vccMoveEtag:etag}};
  let written;
  try{written=await env.BUCKET.put(target,original.body,settings)}
  catch(e){
   if(!/known length|content.length|readable stream must/i.test(String(e?.message)))throw e;
   const maybe=await env.BUCKET.head(target);
   if(matches(maybe))written=maybe;
   else{
    if(maybe)throw Error('Copia previa incompleta. Original conservado.');
    const original2=await env.BUCKET.get(key);
    if(!original2||original2.etag!==etag||original2.size>MAX_IMAGE_SIZE)throw Error('No se pudo releer el original.');
    written=await env.BUCKET.put(target,await original2.arrayBuffer(),settings);
   }
  }
  if(!written?.size)throw Error('Copia fallida. Original conservado.');
  copied=true;targetHead=await env.BUCKET.head(target);
 }
 const current=await env.BUCKET.head(key);
 if(!current||current.etag!==etag||!matches(targetHead))throw Error('Copia sin verificar. Original conservado.');
 await env.BUCKET.delete(key);
 const sourceAfter=await env.BUCKET.head(key);
 if(sourceAfter)throw Error('La copia existe, pero el original sigue presente; movimiento pendiente de verificar.');
 return {moved:true,source:key,target,folder:label,copied,verified:true};
}

// Rename a virtual R2 folder by copying each object to the new prefix.
// The original is removed only after verifying the new object; no overwrite.
function renameDestination(prefix,newName){
 const base=normalizePrefix(prefix);
 const name=String(newName??'').trim();
 if(!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(name)||name.length>72)
  throw Error('El nombre debe estar en minúsculas y solo usar letras, números, - o _.');
 const parts=base.slice(0,-1).split('/');
 const old=parts.pop();
 if(!old||old.startsWith('__vcc_')||old.startsWith('_preview'))throw Error('Esta carpeta no puede renombrarse.');
 if(name===old)throw Error('El nombre es igual al actual.');
 return (parts.length?parts.join('/')+'/':'')+name+'/';
}
async function listForFolderRename(env,prefix,newName,cursor){
 const destination=renameDestination(prefix,newName);
 if(cursor!=null&&typeof cursor!=='string')throw Error('Cursor inválido.');
 const opts={prefix,limit:500};
 if(cursor)opts.cursor=cursor;
 const page=await env.BUCKET.list(opts);
 return {destination,files:page.objects.filter(x=>x.key.startsWith(prefix)).map(x=>({
  key:x.key,etag:x.etag,size:x.size
 })),nextCursor:page.truncated?page.cursor:null};
}
async function renameFolderObject(env,prefix,newName,key,etag,confirmed){
 if(confirmed!==true)throw Error('Se requiere confirmación expresa del cambio de carpeta.');
 const destination=renameDestination(prefix,newName);
 if(typeof key!=='string'||!key.startsWith(prefix)||typeof etag!=='string'||!etag)
  throw Error('Archivo o ETag inválido.');
 const relative=key.slice(prefix.length);
 // A marker object at the virtual folder prefix must be moved as well.
 if(relative.includes('..')||relative.includes('\\')||relative.includes('\0'))
  throw Error('Nombre de objeto inválido.');
 const target=destination+relative;
 if(target===key)throw Error('Destino idéntico.');
 const [original,other]=await Promise.all([env.BUCKET.head(key),env.BUCKET.head(target)]);
 const belongs=x=>!!(x&&x.customMetadata?.vccRenamedFrom===key&&
  x.customMetadata?.vccRenameEtag===etag);
 if(!original){
  if(belongs(other))return {moved:true,source:key,target,verified:true,resumed:true};
  throw Error('El archivo original ya no está; no se ha confirmado el destino.');
 }
 if(original.etag!==etag)throw Error('El archivo original ha cambiado. Se conserva.');
 const copiedOK=x=>!!(belongs(x)&&x.size===original.size);
 if(other&&!copiedOK(other))throw Error('Ya existe un archivo diferente en la carpeta de destino. No se sobrescribe.');
 if(!other){
  const source=await env.BUCKET.get(key);
  if(!source||source.etag!==etag||!source.body)
   throw Error('No se pudo leer el original sin cambios.');
  const opts={httpMetadata:source.httpMetadata||{},
   customMetadata:{...(source.customMetadata||{}),vccRenamedFrom:key,vccRenameEtag:etag}};
  let written;
  try{written=await env.BUCKET.put(target,source.body,opts)}
  catch(error){
   if(!/known length|content.length|readable stream must/i.test(String(error?.message)))throw error;
   const possible=await env.BUCKET.head(target);
   if(copiedOK(possible))written=possible;
   else{
    if(possible)throw Error('Copia no verificada. Se conserva el original.');
    if(original.size>MAX_IMAGE_SIZE)throw Error('Archivo grande no compatible con copia alternativa; original intacto.');
    const source2=await env.BUCKET.get(key);
    if(!source2||source2.etag!==etag||!source2.body)throw Error('El archivo ha cambiado.');
    written=await env.BUCKET.put(target,await source2.arrayBuffer(),opts);
   }
  }
  if(!written)throw Error('No se pudo copiar el objeto; original intacto.');
 }
 const [current,verified]=await Promise.all([env.BUCKET.head(key),env.BUCKET.head(target)]);
 if(!current||current.etag!==etag||!copiedOK(verified))
  throw Error('La copia no se ha verificado. Se conserva el original.');
 await env.BUCKET.delete(key);
 if(await env.BUCKET.head(key))throw Error('El original todavía existe. El destino ya está copiado.');
 return {moved:true,source:key,target,verified:true};
}
async function listPhotos(env,prefix,cursor){
  const options={prefix,limit:PAGE_SIZE};if(cursor)options.cursor=cursor;
  const page=await env.BUCKET.list(options);
  return {files:page.objects.filter(f=>IMAGE_RE.test(f.key)&&sameFolder(f.key,prefix)&&!f.key.split('/').some(p=>p.toLowerCase().includes('preview'))).map(f=>({key:f.key,size:f.size,etag:f.etag})),nextCursor:page.truncated?page.cursor:null};
}
const escapeHtml=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PANEL=String.raw`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VCC · Fototeca</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=DM+Sans:wght@400;500;600;700;800&family=Oswald:wght@400;500;600&display=swap" rel="stylesheet"><style>
:root{--ink:#111315;--muted:#676b70;--coral:#ef7168;--coral-dark:#c95e55;--paper:#fcfbf8;--line:#e8e4de;--soft:#f5f3f0;--mint:#dcebe4;--shadow:0 5px 22px rgba(29,31,33,.038);--display:"Oswald",Arial,sans-serif;--body:"DM Sans",Arial,sans-serif;--script:"Caveat",cursive}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.45 var(--body);-webkit-font-smoothing:antialiased}
main{width:min(1060px,calc(100% - 38px));margin:0 auto 68px}
.appHeader{display:flex;align-items:center;gap:24px;padding:29px 2px 25px;border-bottom:1px solid var(--line);margin-bottom:24px}
.brandLogo{display:flex;align-items:center;flex:none;width:166px;min-width:166px;padding-right:22px;border-right:1px solid var(--line)}
.brandLogo svg{display:block;width:100%;height:auto}
.headerTitle{flex:1;min-width:0}
.eyebrow{display:block;color:var(--coral-dark);font-size:10px;font-weight:800;letter-spacing:.17em;text-transform:uppercase;margin-bottom:3px}
h1{font:500 30px/1.14 var(--display);letter-spacing:.015em;margin:0}
.headerSub{font-size:12px;color:var(--muted);margin:5px 0 0}
.headerMark{flex:none;border:1px solid var(--line);border-radius:999px;padding:8px 12px;color:var(--muted);font:700 10px/1 var(--body);letter-spacing:.065em;background:#fff}
.workspace{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.card{background:#fff;border:1px solid var(--line);border-radius:15px;padding:20px 23px 21px;margin:0;box-shadow:var(--shadow);min-width:0}
.card-wide{grid-column:1/-1}
.card h2{font:500 19px/1.3 var(--display);letter-spacing:.018em;margin:0 0 9px;display:flex;align-items:center;gap:9px}
.card h2::before{content:"";width:4px;height:17px;background:var(--coral);border-radius:8px;flex:none}
.card p{margin:6px 0 11px}.muted{color:var(--muted)}
.small{font-size:11.5px;line-height:1.45}
label{display:block;font-size:11px;font-weight:800;letter-spacing:.025em;color:#343a3d;margin:12px 0 6px}
label:has(input[type=checkbox]){font-weight:500;font-size:12px;letter-spacing:0;display:flex;align-items:flex-start;gap:8px;line-height:1.45;color:#4b5054}
input[type=checkbox]{accent-color:var(--coral-dark);width:15px;height:15px;flex:none;margin:1px 0 0}
select,input[type=password],input[type=text],textarea,input[type=number]{display:block;width:100%;min-height:42px;padding:10px 12px;border:1px solid #dddfe0;border-radius:9px;background:#fff;font:500 13px/1.4 var(--body);color:var(--ink);outline:none;transition:border-color .15s,box-shadow .15s}
textarea{resize:vertical;min-height:64px}
select:focus-visible,input:focus-visible,textarea:focus-visible{border-color:var(--coral);box-shadow:0 0 0 3px rgba(239,113,104,.13)}
select:disabled,input:disabled{background:#f8f8f7;color:#8d9498}
button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;background:var(--coral);border:1px solid transparent;border-radius:9px;padding:9px 13px;color:#fff;font:750 12px/1.35 var(--body);cursor:pointer;margin:7px 6px 4px 0;transition:background .16s,transform .16s,border-color .16s}
button:hover:not(:disabled){background:var(--coral-dark);transform:translateY(-1px)}
button.secondary{background:#fff;color:#32393c;border-color:#dadee0}
button.secondary:hover:not(:disabled){background:#f3f4f4}
button.danger{background:#a94f48;color:#fff}
button.danger:hover:not(:disabled){background:#893c37}
button:disabled{opacity:.46;cursor:not-allowed;transform:none}
button:focus-visible{outline:3px solid rgba(239,113,104,.25);outline-offset:2px}
.warning{padding:9px 12px;background:#faf5f3;border-left:3px solid var(--coral);border-radius:0 7px 7px 0;color:#70514d;margin-top:13px!important}
pre{background:#f7f7f6;border:1px solid var(--line);border-radius:9px;padding:12px;font:11.5px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere;white-space:pre-wrap;max-height:190px;overflow:auto;margin:8px 0 0}
.tableWrap{overflow:auto;max-height:480px;border:1px solid var(--line);border-radius:11px;margin-top:10px}
.tableWrap:empty{display:none}
table{border-collapse:collapse;width:100%;font-size:11.7px}
th,td{padding:11px 10px;border-bottom:1px solid #eeece9;text-align:left;vertical-align:top}
tr:last-child td{border-bottom:0}
th{position:sticky;top:0;background:#f8f7f5;z-index:1;font-size:10px;color:#5e6568;font-weight:800;text-transform:uppercase;letter-spacing:.035em}
td.path{overflow-wrap:anywhere;max-width:280px}
.photoThumb{display:block;width:136px;height:89px;object-fit:contain;border:1px solid var(--line);border-radius:9px;background:#fbfaf9;margin:3px 0 8px}
.tag{display:inline-flex;background:#e9f1ed;color:#32654b;border-radius:6px;padding:3px 7px;font-size:10.5px;font-weight:700;margin-top:3px}
.row{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
#selectionSummary{margin-left:8px}
#folderSummary,#scanSummary,#convertSummary,#aiSummary,#renameSummary,#deleteProgress,#aiDeleteStatus{font-size:12px;line-height:1.45}
#folderSummary:not(:empty),#scanSummary:not(:empty),#convertSummary:not(:empty),#aiSummary:not(:empty){background:#f9f8f6;padding:9px 11px;border-radius:8px;margin:10px 0 0}
.renamePanel{margin-top:18px;padding-top:13px;border-top:1px solid var(--line)}
.renamePanel h3{font:500 17px/1.35 var(--display);margin:0 0 10px}
.renamePanel .warning{margin-top:6px!important}
.aiGroupPills{display:flex;gap:7px;flex-wrap:wrap;margin:11px 0}
.aiGroupPills:empty{display:none}
.aiGroupPills .placeGroup{background:#f6f5f3;border:1px solid var(--line);border-radius:8px;padding:6px 10px;font:700 11px/1.3 var(--body);color:#41474a;margin:0;min-height:28px}
.aiGroupPills .placeGroup:hover:not(:disabled){background:#ecebe8;color:#111}
.aiTools{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:10px}
.aiTools select{width:auto;min-width:220px;max-width:100%}
.aiTools button{margin:0}
.aiFolderInput{width:190px!important;min-height:34px!important;padding:5px 7px!important;font-size:11.5px!important}
.aiHint{font-size:10.5px;color:#767d80}
.workspace section.card:last-child{grid-column:1/-1}
::selection{background:#f6d4d0}
@media(max-width:760px){
 main{width:calc(100% - 24px)}
 .appHeader{gap:14px;flex-wrap:wrap;padding:20px 0 17px;margin-bottom:16px}
 .brandLogo{width:118px;min-width:118px;padding-right:12px}
 .headerTitle h1{font-size:25px}
 .headerMark{display:none}
 .workspace{grid-template-columns:1fr;gap:12px}
 .card,.card-wide,.workspace section.card:last-child{grid-column:1;padding:17px}
 .tableWrap{max-height:440px}
 button{margin:6px 4px 2px 0}
}
@media(prefers-reduced-motion:reduce){button,select,input,textarea{transition:none}}

</style></head><body><main>
<header class="appHeader"><div class="brandLogo"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 216" role="img" aria-label="Viajando con Cabeza"><path d="M434 185L435 186L444 186L445 184L444 183L439 183ZM418 183L418 185L420 186L428 186L429 185L426 183ZM402 180L402 182L404 183L407 183L408 184L412 184L413 183L411 181ZM460 179L458 178L451 181L450 183L451 184L459 181ZM472 170L470 170L466 173L464 176L466 177L472 172ZM481 160L479 160L475 166L476 168L481 163L482 161ZM464 152L465 154L474 153L474 151L465 151ZM487 147L482 148L479 150L480 152L482 151L484 152L483 153L483 156L485 156L488 149ZM453 145L453 149L458 153L459 150L456 148L455 145ZM500 143L498 142L493 144L491 146L492 147L495 147L499 145ZM74 176L78 181L81 181L82 182L92 177L103 167L104 168L104 173L106 176L110 178L114 178L118 176L124 170L130 160L134 160L135 161L132 172L133 174L136 175L139 173L145 163L156 151L158 152L158 156L157 157L157 166L158 169L161 172L167 173L171 171L178 164L180 161L180 159L169 168L164 169L162 165L163 157L164 156L164 149L162 146L156 145L145 155L144 153L147 146L146 144L143 143L140 147L138 154L136 156L131 157L130 156L130 149L127 145L123 144L120 145L117 148L114 148L110 152L106 160L96 169L86 176L81 177L79 175L79 168L80 167L80 164L86 153L93 147L95 148L94 154L97 154L99 151L99 145L97 143L92 142L88 144L80 153L75 163ZM116 155L119 159L124 161L120 168L113 174L111 174L109 172L109 168L112 160ZM124 148L126 149L126 156L125 157L120 154L121 150ZM512 136L510 135L504 139L504 142L510 139ZM482 135L480 137L484 142L487 142L486 139ZM463 136L460 135L458 136L455 140L456 141ZM467 134L468 136L470 135L475 136L476 135L476 133L468 133ZM526 128L523 127L516 132L518 134ZM201 176L202 178L206 181L212 181L220 176L227 169L228 170L228 174L230 176L234 177L241 173L247 166L249 165L250 166L250 169L254 173L260 173L269 167L270 168L269 175L271 177L273 177L280 163L284 158L292 151L295 151L297 153L297 156L295 159L295 161L292 164L284 168L278 174L278 177L279 178L286 177L289 175L298 165L300 165L303 163L306 164L307 172L310 175L314 177L318 177L328 172L342 158L343 153L348 148L357 143L358 144L357 149L343 166L345 169L347 169L350 167L356 167L358 169L358 171L343 183L337 189L327 202L324 211L327 215L331 215L341 209L349 200L358 187L361 181L363 173L371 167L373 173L375 175L379 176L385 173L395 162L399 168L401 169L406 169L419 162L424 157L424 155L421 155L409 163L403 165L401 163L401 161L404 153L404 147L403 146L400 146L399 147L397 145L392 144L386 147L379 154L377 158L373 162L363 168L358 163L354 161L360 154L364 146L364 143L362 140L356 139L347 144L347 145L341 150L339 154L340 157L324 170L318 173L314 173L312 171L312 166L321 162L329 153L331 146L330 143L327 141L321 141L319 142L313 148L309 156L306 159L301 161L300 160L301 152L298 148L293 147L287 150L280 157L279 156L281 148L287 142L297 124L299 118L299 113L298 111L294 111L291 114L284 126L278 144L276 147L276 151L273 159L264 167L257 170L254 167L255 160L259 150L256 148L254 149L253 152L243 164L234 171L233 170L233 168L239 157L245 151L247 150L250 152L251 151L251 148L249 146L246 146L242 148L235 155L233 159L220 171L210 177L207 177L205 173L206 167L212 154L220 147L221 148L221 154L224 154L226 151L226 146L225 144L219 142L215 144L207 153L202 163ZM354 179L355 181L351 189L344 199L334 209L331 211L329 211L328 210L329 207L335 197ZM283 173L284 172L285 173L284 174ZM284 172L285 171L287 172L286 173ZM286 171L287 170L288 171L287 172ZM305 163L306 162L307 163L306 164ZM278 157L279 156L280 157L279 158ZM392 150L393 151L393 156L387 163L380 169L379 168L380 164L384 158ZM324 146L325 147L322 153L316 158L315 156L319 150ZM285 136L286 135L287 136L286 137ZM294 118L295 121L290 132L287 136L286 135L286 132L290 125L290 123ZM619 59L613 58L605 61L602 61L519 88L518 91L523 93L537 102L537 106L534 113L532 122L535 123L543 120L550 119L553 123L553 125L559 136L559 138L560 138L606 79L613 68L619 61ZM589 78L553 104L546 108L538 116L537 115L540 104L542 101L587 77ZM588 77L589 76L591 77L590 78ZM590 76L591 75L592 76L591 77ZM607 71L590 93L588 97L561 131L559 129L551 113L549 113L549 115L543 118L540 117L562 100L602 73L605 70ZM606 70L607 69L608 70L607 71ZM603 66L575 80L573 82L562 87L560 89L541 99L538 99L528 93L525 90L528 88L540 84L543 84L546 82L552 81L593 67L596 67L600 65ZM602 65L603 64L605 65L604 66ZM75 13L71 15L69 20L67 46L66 47L66 58L65 59L66 69L65 70L64 86L63 87L63 107L68 110L74 110L76 108L76 91L78 84L79 62L80 61L80 53L81 52L83 27L84 26L83 16L81 16ZM114 10L111 13L110 16L111 17L111 21L106 31L106 34L102 44L102 47L100 50L94 73L89 77L89 81L91 85L85 101L85 107L90 110L95 110L97 108L97 106L99 103L99 100L103 90L103 87L105 85L114 81L124 79L125 80L125 88L126 89L126 96L127 97L128 105L132 110L134 111L139 111L141 110L142 105L141 104L140 96L139 95L139 90L138 89L138 76L143 72L144 67L141 65L137 65L136 64L135 50L134 49L134 39L133 38L133 26L132 25L133 23L132 22L132 17L131 14L125 10ZM120 43L122 50L123 65L120 67L111 69L110 66L114 58L118 45ZM434 9L430 9L425 11L423 13L421 13L419 16L409 25L402 39L403 43L399 56L398 68L397 69L397 87L402 102L407 107L413 110L424 110L434 104L439 98L448 81L452 67L452 63L453 62L453 51L454 50L454 47L457 44L457 39L454 35L454 31L453 30L453 26L455 25L453 19L448 14ZM439 25L441 27L441 31L442 32L442 47L441 48L441 56L440 57L440 62L439 63L438 70L435 79L430 89L422 98L419 99L415 96L412 87L412 69L413 68L414 58L419 47L419 45L425 35L432 28L437 25ZM371 10L362 9L361 8L355 8L354 9L349 9L348 10L338 12L336 15L337 21L340 23L342 23L344 25L342 32L342 41L341 42L341 50L340 51L340 65L339 66L338 75L337 76L336 94L335 97L330 100L330 104L333 108L338 109L341 111L346 110L349 106L360 100L378 84L386 72L386 70L389 65L392 56L393 48L394 47L394 37L393 36L392 29L389 23L381 15ZM370 21L374 23L379 30L379 33L380 34L379 48L376 57L369 70L362 79L351 89L350 88L351 72L352 71L352 65L354 59L355 49L357 44L360 22L362 20ZM230 8L227 10L226 13L227 17L222 27L216 45L215 52L212 59L209 72L204 76L205 86L199 102L199 106L204 110L209 110L211 109L218 86L222 83L238 78L240 80L240 88L241 89L241 96L242 97L243 105L247 110L249 111L254 111L257 108L254 96L253 75L258 71L259 66L251 63L250 50L249 49L249 36L248 35L248 18L245 11L240 8ZM224 68L225 67L226 68L225 69ZM235 42L236 43L236 51L237 52L237 61L238 64L236 66L226 68L225 65L227 59L231 51L233 43ZM52 5L48 7L46 11L37 37L34 51L30 61L30 64L25 79L23 77L23 71L22 70L22 65L20 58L20 50L19 49L19 43L18 42L16 21L13 17L9 15L6 15L4 13L1 15L0 24L2 29L2 35L3 36L4 46L5 47L8 74L10 80L10 85L11 86L13 101L15 107L17 109L24 111L27 111L31 109L32 101L45 63L45 60L57 24L62 15L62 10L61 8ZM328 4L324 3L322 4L319 8L319 11L316 20L316 24L315 25L315 29L314 30L312 45L311 46L311 52L309 57L308 71L306 74L304 69L303 59L301 56L301 53L297 42L297 38L295 32L295 22L293 17L289 14L285 14L283 12L279 12L277 14L277 16L274 18L273 20L273 26L272 27L272 34L271 35L271 43L270 44L269 56L268 57L268 65L267 66L266 90L265 91L265 106L266 108L269 108L271 110L274 110L276 109L277 107L278 90L279 89L279 83L280 82L280 77L282 72L283 59L284 58L286 59L286 63L289 70L290 77L301 108L305 110L310 110L311 109L313 110L317 107L318 98L319 97L319 90L321 83L321 75L322 74L324 52L325 51L326 40L328 33L329 18L331 12L331 7ZM196 1L193 1L192 0L187 1L184 7L185 19L184 20L183 36L182 37L182 50L183 51L182 73L181 74L180 86L176 97L171 101L169 101L165 97L162 87L162 82L164 79L159 76L155 77L149 84L149 96L151 99L151 101L158 108L164 110L172 111L182 108L189 101L193 92L194 82L195 81L195 72L196 71L196 58L197 57L197 44L198 43L199 23L200 22L200 15L201 14L200 4Z" fill="#000" fill-rule="evenodd"/></svg></div><div class="headerTitle"><span class="eyebrow">GESTOR DE IMÁGENES</span><h1>Fototeca VCC</h1><p class="headerSub">Cloudflare R2 · Gestió privada</p></div><span class="headerMark">VCC · ADMIN</span></header>
<div class="workspace">
<section class="card"><h2>1. Acceso</h2>
<label for="token">Clave de acceso</label><input type="password" id="token" autocomplete="off" placeholder="Clave de acceso">
<button id="browseBtn" onclick="browse()">Cargar carpetas</button></section>
<section class="card"><h2>2. Carpeta</h2>
<label for="folder">Ruta de R2</label><select id="folder" disabled onchange="loadFolder()"><option value="">Introduce la clave</option></select>
<p class="muted small">Incluye subcarpetas. La comparación de duplicados se limita a cada carpeta.</p>
<p id="folderSummary" class="muted"></p>
<div class="renamePanel">
<h3>Renombrar carpeta de R2</h3>
<label for="renameName">Nuevo nombre</label>
<input type="text" id="renameName" maxlength="72" placeholder="estocolmo-archipelago" oninput="resetRenamePreview()" autocomplete="off">
<div class="row"><button class="secondary" id="renamePreviewBtn" disabled onclick="previewFolderRename()">Comprobar cambio</button>
<button id="renameBtn" disabled onclick="executeFolderRename()">Renombrar carpeta</button>
<button class="secondary" id="renameStopBtn" disabled onclick="stopProcess('rename')">Detener</button></div>
<p id="renameSummary" class="muted small" role="status" aria-live="polite">Selecciona una carpeta para cambiar su nombre.</p>
<p class="warning small">Se moverán todos los objetos, incluidas las subcarpetas. Las URL antiguas pueden dejar de funcionar.</p>
</div></section>
<section class="card card-wide"><h2>3. Duplicados</h2>
<p>±6 fotos · misma escena y encuadre · mejor calidad.</p>
<label for="duplicateSensitivity">Sensibilidad</label>
<select id="duplicateSensitivity" onchange="onDuplicateSensitivityChange()">
<option value="conservador">Conservador · solo coincidencias claras</option>
<option value="equilibrado" selected>Equilibrado · recomendado</option>
<option value="agresivo">Agresivo · más candidatos</option>
</select><p class="small muted">Brillo y color no condicionan la coincidencia.</p>
<button id="scanBtn" disabled onclick="scanDuplicates()">Analizar duplicados</button><button id="scanStopBtn" class="secondary" disabled onclick="stopProcess('scan')">Detener</button>
<p id="scanSummary" class="muted"></p>
<div class="row"><button type="button" class="secondary" id="selectAllBtn" disabled onclick="selectAllDuplicates(true)">Marcar todas</button><button type="button" class="secondary" id="selectNoneBtn" disabled onclick="selectAllDuplicates(false)">Desmarcar todas</button><span id="selectionSummary" class="small muted">0 seleccionados</span></div>
<div id="duplicates" class="tableWrap"></div><p id="deleteProgress" class="muted" role="status" aria-live="polite"></p>
<p class="warning small">Revisa antes de borrar. La eliminación es irreversible y puede romper enlaces de la web.</p>
<label><input type="checkbox" id="confirmDup" onchange="updateButtons()"> He revisado las fotografías seleccionadas.</label>
<button id="removeBtn" class="danger" disabled onclick="removeDuplicates()">Eliminar seleccionadas</button></section>
<section class="card"><h2>4. Conversión AVIF</h2>
<p>Calidad <b>85</b> · Resolución original.</p>
<p class="muted small">Ajustes de color automáticos: brillo <b>+1,2%</b> · contraste <b>−1,6%</b> · saturación <b>+0,8%</b>.</p>
<p class="muted small">2 fases · 1 foto a la vez · reintentos automáticos. El JPG solo se borra tras verificar el AVIF.</p>
<button id="convertBtn" disabled onclick="convertAll()">Convertir JPG → AVIF</button><button id="convertStopBtn" class="secondary" disabled onclick="stopProcess('convert')">Detener</button>
<p id="convertSummary" class="muted" role="status" aria-live="polite"></p></section>
<section class="card card-wide"><h2>5. Clasificación de lugares con IA</h2>
<p>Conserva todas las fotos · identifica lugares · organiza en subcarpetas.</p>
<p class="muted small">Miniaturas ligeras · reintentos con pausa · retoma las fotos pendientes sin volver a analizar las anteriores.</p>
<label for="aiContext">Contexto del viaje</label>
<textarea id="aiContext" maxlength="180" rows="2" placeholder="Ej. Gotemburgo, día 1; Haga, Skansen Kronan..."></textarea>
<label class="small"><input id="aiForce" type="checkbox"> Reanalizar (consume IA)</label>
<div><button id="aiBtn" disabled onclick="runAiSelection()">Identificar lugares</button><button class="secondary" id="aiStopBtn" disabled onclick="stopProcess('ai')">Detener</button><button class="secondary" id="aiCsvBtn" disabled onclick="downloadAiCsv()">Exportar CSV</button></div>
<p id="aiSummary" class="muted" role="status" aria-live="polite">Selecciona una carpeta.</p>
<div id="aiGroups" class="aiGroupPills"></div>
<div class="aiTools"><select id="aiFilter" aria-label="Filtrar por lugar" onchange="aiVisibleLimit=60;renderAiResults()"><option value="">Todos los lugares</option></select>
<span id="aiShown" class="small muted"></span>
<button type="button" id="aiMoreBtn" class="secondary" style="display:none" onclick="aiVisibleLimit+=60;renderAiResults()">Mostrar 60 más</button></div>
<datalist id="aiFolderList"></datalist>
<div id="aiResults" class="tableWrap"></div>
<label class="small"><input type="checkbox" id="confirmAiOrganize" onchange="updateButtons()"> He revisado las carpetas. Mover fotos puede romper enlaces del blog.</label>
<button id="aiOrganizeBtn" disabled onclick="organizeAiPhotos()">Organizar en subcarpetas</button>
<p id="aiMoveStatus" class="muted small" role="status" aria-live="polite"></p>
<p class="warning small">Ubicaciones estimadas, no verificadas. Corrige las carpetas antes de mover.</p>
</section>
<section class="card"><h2>Actividad</h2><pre id="status">Introduce la clave.</pre></section>
</div>
</main><script>
let currentPrefix='',files=[],scanFiles=[],scans=[],groups=[],removed=new Set(),scanReady=false,busy=false,stopped=false,activeMode='';
const previewUrls=new Map(),q=id=>document.getElementById(id);
function log(s){q('status').textContent=s+'\n'+q('status').textContent.slice(0,8500)}
async function api(payload){
 const token=q('token').value.trim();if(!token)throw Error('Introduce ADMIN_TOKEN.');
 const retryableModes=new Set(['list','folders','convert-delete','ai-review','ai-move-place','folder-rename-list','folder-rename-one']);
 const maxAttempts=payload.mode==='ai-review'?1:(payload.mode==='convert-delete'||payload.mode==='ai-move-place'||payload.mode==='folder-rename-one'?3:(retryableModes.has(payload.mode)?4:1));
 for(let attempt=1;attempt<=maxAttempts;attempt++){
  let response=null,body='',data=null,error=null,retry=false;
  try{
   response=await fetch('/api/process',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(payload)});
   body=await response.text();
   try{data=JSON.parse(body)}catch{data=null}
   if(response.ok){
    if(data!==null)return data;
    error='La respuesta del Worker no es JSON (HTTP '+response.status+'): '+body.slice(0,160);
   }else{
    error=data?.error||'HTTP '+response.status+' · '+body.replace(/<[^>]*>/g,' ').trim().slice(0,140);
    retry=[429,502,503,504,520,522,524].includes(response.status);
   }
  }catch(e){
   error='No se pudo conectar con Cloudflare: '+e.message;
   retry=true;
  }
  if(!retry||attempt===maxAttempts||stopped)throw Error(error+' (intentos '+attempt+'/'+maxAttempts+')');
  log('Servicio temporalmente no disponible para '+(payload.key||payload.mode)+'. Reintento '+attempt+'/'+(maxAttempts-1)+'…');
  const delays=payload.mode==='convert-delete'?[1800,5500]:[900,2100,4300];
  await new Promise(resolve=>setTimeout(resolve,delays[attempt-1]));
 }
 throw Error('No se pudo completar la petición');
}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function updateButtons(){
 const ready=!!currentPrefix&&scanFiles.length>0;
 q('browseBtn').disabled=busy;
 q('folder').disabled=busy||q('folder').options.length<2;
 q('renameName').disabled=busy||!currentPrefix;
 q('renamePreviewBtn').disabled=busy||!currentPrefix;
 q('renameBtn').disabled=busy||!renamePlan||!currentPrefix||renamePlan.source!==currentPrefix;
 q('renameStopBtn').disabled=!(busy&&activeMode==='rename')||stopped;
 q('scanBtn').disabled=busy||!ready;
 q('scanStopBtn').disabled=!(busy&&activeMode==='scan')||stopped;
 q('duplicateSensitivity').disabled=busy;
 q('removeBtn').disabled=busy||!ready||!scanReady||!groups.length||!q('confirmDup').checked||groups.every(g=>g.resolved);
 q('convertBtn').disabled=busy||!currentPrefix||!files.length;
 q('convertStopBtn').disabled=!(busy&&activeMode==='convert')||stopped;
 q('aiBtn').disabled=busy||!currentPrefix||!scanFiles.length;
  q('aiCsvBtn').disabled=busy||!aiRows.length;
 q('aiStopBtn').disabled=!(busy&&(activeMode==='ai'||activeMode==='ai-move'))||stopped;
 q('aiOrganizeBtn').disabled=busy||!aiAnalysisComplete||!aiRows.length||!q('confirmAiOrganize').checked;
 q('selectAllBtn').disabled=busy||!scanReady||!groups.length;
 q('selectNoneBtn').disabled=busy||!scanReady||!groups.length;
}
function lock(on,mode=''){
 busy=on;
 activeMode=on?mode:'';
 updateButtons();
}
function stopProcess(mode){
 if(!busy||(activeMode!==mode&&!(mode==='ai'&&activeMode==='ai-move')))return;
 stopped=true;
 log(mode==='rename'?'Deteniendo el cambio de nombre después del archivo actual.':mode==='ai-move'?'Deteniendo organización después de la foto actual.':mode==='ai'?'Deteniendo análisis después de la foto actual.':mode==='scan'?'Deteniendo detección después de la foto actual.':'Deteniendo conversión después del archivo actual.');
 updateButtons();
}
// Rename arbitrary R2 folder prefixes including nested folders and non-photo files.
// A preview + explicit confirmation are required before any object is moved.
let renamePlan=null;
function resetRenamePreview(){
 renamePlan=null;
 if(q('renameSummary'))q('renameSummary').textContent=currentPrefix?
  'Nombre modificado. Pulsa Comprobar cambio antes de renombrar.':'Selecciona una carpeta.';
 updateButtons();
}
function renameValidName(){
 const name=q('renameName').value.trim();
 if(!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(name)||name.length>72)
  throw Error('Usa minúsculas, números, guiones (-) o guiones bajos (_), sin espacios.');
 if(name===currentPrefix.split('/').pop())throw Error('Escribe un nombre diferente del actual.');
 return name;
}
async function previewFolderRename(){
 if(busy||!currentPrefix)return;
 let name;
 try{name=renameValidName()}catch(e){q('renameSummary').textContent=e.message;return}
 const source=currentPrefix;renamePlan=null;stopped=false;lock(true,'rename-preview');
 const rows=[];let dest='',cursor=null,pages=0,valid=false;
 try{
  do{
   const page=await api({mode:'folder-rename-list',prefix:source,newName:name,cursor});
   if(!dest)dest=page.destination;
   if(dest!==page.destination)throw Error('El destino ha cambiado durante la lectura.');
   rows.push(...page.files);
   if(rows.length>15000||++pages>100)throw Error('Carpeta demasiado grande: reduce el lote antes de renombrar.');
   cursor=page.nextCursor;
   q('renameSummary').textContent='Comprobando '+rows.length+' archivos, incluidas subcarpetas…';
  }while(cursor);
  if(!rows.length)throw Error('No hay objetos dentro de esta carpeta.');
  const unique=new Set(rows.map(r=>r.key));
  if(unique.size!==rows.length)throw Error('La lista incluye duplicados: vuelve a comprobar.');
  renamePlan={source,name,dest,rows};
  valid=true;
  q('renameSummary').textContent='De '+source+'/ a '+dest+' · '+rows.length+
   ' objetos, incluidas subcarpetas. Revisa el nuevo nombre antes de confirmar.';
 }catch(e){
  renamePlan=null;
  q('renameSummary').textContent='No se puede preparar el cambio: '+e.message;
  log('Renombrar carpeta: '+e.message);
 }finally{lock(false)}
}
function downloadFolderRenameCSV(plan){
 const columns=['ruta_original','ruta_nueva','bytes'];
 const rows=plan.rows.map(r=>[r.key,plan.dest+r.key.slice(plan.source.length+1),r.size]);
 const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const csv='\uFEFF'+[columns,...rows].map(x=>x.map(cell).join(';')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='cambio-carpeta-'+plan.name+'.csv';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function executeFolderRename(){
 if(busy||!renamePlan||renamePlan.source!==currentPrefix)return;
 const plan=renamePlan;
 if(renameValidName()!==plan.name)return;
 if(!confirm('Se cambiarán '+plan.rows.length+' objetos de '+plan.source+
  '/ a '+plan.dest+'. Incluye todos los archivos de las subcarpetas y puede romper enlaces existentes en la web. ¿Continuar?'))return;
 if(prompt('Escribe RENOMBRAR para confirmar el cambio en R2:')!=='RENOMBRAR')return;
 downloadFolderRenameCSV(plan);
 stopped=false;lock(true,'rename');
 let moved=0,failed=0,consecutive=0;const errors=[];
 try{
  for(let i=0;i<plan.rows.length&&!stopped;i++){
   const entry=plan.rows[i];
   q('renameSummary').textContent='Renombrando '+(i+1)+'/'+plan.rows.length+
     ' · completados '+moved+' · errores '+failed;
   try{
    const data=await api({mode:'folder-rename-one',prefix:plan.source,
     newName:plan.name,key:entry.key,etag:entry.etag,confirm:true});
    if(!data.moved||data.source!==entry.key||data.target!==plan.dest+entry.key.slice(plan.source.length+1))
     throw Error('Movimiento sin confirmación.');
    moved++;consecutive=0;
   }catch(e){
    failed++;consecutive++;
    errors.push({key:entry.key,error:e.message});
    log('Cambio de carpeta pendiente: '+entry.key+' · '+e.message);
    if(consecutive>=3){log('Renombrado pausado por errores repetidos. Fotos originales protegidas.');break}
   }
   if(i%6===5&&!stopped)await new Promise(resolve=>setTimeout(resolve,600));
  }
  q('renameSummary').textContent=(stopped?'Proceso detenido':failed?'Cambio parcial':'Proceso finalizado')+
   ': '+moved+' objetos movidos · '+failed+' errores. '+
   (moved===plan.rows.length?'Selecciona la nueva carpeta tras recargar las rutas.':'Puedes volver a comprobar esta carpeta y reanudar.');
  log(q('renameSummary').textContent);
  if(errors.length)log('Pendientes: '+errors.map(x=>x.key+' ('+x.error+')').join(' | '));
  renamePlan=null;
 }finally{lock(false)}
}
async function browse(){if(busy)return;stopped=false;lock(true);
 try{
  const select=q('folder');select.innerHTML='<option value="">Cargando carpetas...</option>';
  const pending=[''],visited=new Set(),folders=new Set();let count=0;
  while(pending.length){
   if(stopped)throw Error('Exploración detenida');
   const prefix=pending.shift();if(visited.has(prefix))continue;visited.add(prefix);
   let cursor=null;
   do{
    const d=await api({mode:'folders',prefix,cursor});
    for(const p of d.folders){
     if(p.startsWith('__vcc_dedup_backup__/')||p.startsWith('__vcc_ai_reviews__/')||p.toLowerCase().includes('preview'))continue;
     folders.add(p);if(!visited.has(p))pending.push(p);
    }
    cursor=d.nextCursor;
   }while(cursor);
   if(++count>15000)throw Error('Se ha excedido el máximo de carpetas');
  }
  const sorted=[...folders].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  select.innerHTML='<option value="">-- Seleccionar ruta --</option>'+sorted.map(p=>'<option value="'+esc(p.slice(0,-1))+'">'+esc(p.slice(0,-1))+'</option>').join('');
  log(sorted.length+' rutas cargadas correctamente. Selecciona una.');
 }catch(e){log('Error cargando rutas: '+e.message)}finally{lock(false)}
}
async function loadFolder(){if(busy||!q('folder').value)return;stopped=false;lock(true);let ok=false;
 try{
  currentPrefix=q('folder').value;resetRenamePreview();q('renameName').value=currentPrefix.split('/').pop();q('renameSummary').textContent='Escribe un nuevo nombre y comprueba el cambio.';files=[];scanFiles=[];scans=[];groups=[];removed.clear();scanReady=false;
   aiRows=[];aiEdited.clear();aiAnalysisComplete=false;aiRunFolder='';aiRunContext='';aiVisibleLimit=60;q('aiFilter').value='';q('confirmAiOrganize').checked=false;q('aiMoveStatus').textContent='';q('aiResults').innerHTML='';q('aiGroups').innerHTML='';q('aiSummary').textContent='Carpeta lista para identificar lugares.';
  q('confirmDup').checked=false;q('duplicates').innerHTML='';q('scanSummary').textContent='';
  for(const url of previewUrls.values())URL.revokeObjectURL(url);previewUrls.clear();
  let cursor=null,pages=0;
  do{if(stopped)throw Error('Carga detenida');const d=await api({mode:'list',prefix:currentPrefix,cursor});scanFiles.push(...d.files);cursor=d.nextCursor;if(++pages>10000)throw Error('Demasiadas páginas de fotos');}while(cursor);
  files=scanFiles.filter(f=>/\.jpe?g$/i.test(f.key));
  const targets=new Map();for(const f of files){const avif=f.key.replace(/\.jpe?g$/i,'.avif').toLowerCase();if(targets.has(avif))throw Error('Dos JPG/JPEG generarían el mismo AVIF: '+targets.get(avif)+' y '+f.key+'. Renombra primero uno.');targets.set(avif,f.key)}
  q('folderSummary').textContent=scanFiles.length+' imágenes: '+files.length+' JPG · '+scanFiles.filter(f=>/\.webp$/i.test(f.key)).length+' WebP · '+scanFiles.filter(f=>/\.avif$/i.test(f.key)).length+' AVIF en '+currentPrefix+' y subcarpetas.';
  log('Carpeta cargada: '+currentPrefix+' · '+scanFiles.length+' imágenes para duplicados; '+files.length+' JPG para conversión.');ok=true;
 }catch(e){files=[];scanFiles=[];scans=[];groups=[];scanReady=false;currentPrefix='';q('folderSummary').textContent='No se ha cargado la carpeta. Vuelve a seleccionar la ruta.';log('Error cargando carpeta: '+e.message)}finally{lock(false)}
 if(ok){q('scanSummary').textContent='Carpeta lista. Pulsa Iniciar detección para analizar los duplicados.';q('convertSummary').textContent='Carpeta lista. Puedes iniciar la conversión directamente sin analizar duplicados.';updateButtons()}
}

// Fotos agrupadas por lugar: no se elimina ni descarta ninguna.
let aiRows=[],aiEdited=new Map(),aiAnalysisComplete=false,aiRunFolder='',aiRunContext='',aiVisibleLimit=60;
const AI_CATEGORIES=['Calles','Paisajes','Mar','Miradores','Bosques','Montañas','Playas','Parques','Comida','Transporte','Interiores','Arquitectura','Otros'];
function aiFilesForReview(){
 const base=currentPrefix+'/';
 return scanFiles.filter(f=>f.key.startsWith(base)&&!f.key.slice(base.length).includes('/')&&!f.key.toLowerCase().includes('preview'));
}
// Exactamente el mismo formato que valida el servidor R2.
function aiSlugFolder(input){
 const text=String(input??'').trim();
 if(!text||text.length>180||/[\/\\\u0000-\u001f\u007f]/.test(text)||text.includes('..'))throw Error('Nombre de carpeta no válido');
 const name=text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'')
  .slice(0,72).replace(/_+$/,'');
 if(name.length<2||name==='__proto__')throw Error('Nombre de carpeta no válido');
 return name;
}
function aiFolderFor(row){
 const proposed=row.kind==='specific'&&row.confidence==='alta'?row.place:
  AI_CATEGORIES.includes(row.category)?row.category:'Otros';
 try{return aiSlugFolder(aiEdited.get(row.key)??proposed)}catch{return 'otros'}
}
function aiValidateFolder(folder){
 try{return folder===aiSlugFolder(folder)}catch{return false}
}
function aiPlaceGroups(){
 const map=new Map();
 for(const row of aiRows){
  const label=aiFolderFor(row);
  let group=map.get(label);if(!group){group={label,rows:[]};map.set(label,group)}
  group.rows.push(row);
 }
 return [...map.values()].sort((a,b)=>b.rows.length-a.rows.length||a.label.localeCompare(b.label,'es'));
}
async function aiCompactThumbnail(row){
 // Descarta los grandes data URI después de recibirlos para evitar consumo de RAM en lotes.
 try{
  if(!row.thumbnail||row.thumbnail.length<17000)return row;
  const img=new Image();img.src=row.thumbnail;await img.decode();
  const factor=Math.min(1,200/img.naturalWidth,130/img.naturalHeight);
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));
  canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  const small=canvas.toDataURL('image/jpeg',.66);
  if(small.length<row.thumbnail.length)row.thumbnail=small;
 }catch{}
 return row;
}
function aiRenameGroup(folder){
 if(busy)return;
 const proposal=prompt('Carpeta para todas las fotos de este grupo:',folder);
 if(proposal===null)return;
 let slug;
 try{slug=aiSlugFolder(proposal)}catch{alert('Nombre no válido. Usa letras, números y espacios.');return}
 for(const row of aiRows)if(aiFolderFor(row)===folder)aiEdited.set(row.key,slug);
 q('confirmAiOrganize').checked=false;
 aiVisibleLimit=60;renderAiResults();
}
function renderAiResults(){
 const box=q('aiResults'),groups=aiPlaceGroups();
 if(!aiRows.length){
  box.innerHTML='';q('aiGroups').innerHTML='';q('aiFilter').innerHTML='<option value="">Todos los lugares</option>';
  q('aiShown').textContent='';q('aiMoreBtn').style.display='none';updateButtons();return;
 }
 q('aiGroups').innerHTML=groups.slice(0,80).map(g=>'<button type="button" class="placeGroup" data-folder="'+esc(g.label)+'" title="Renombrar grupo">'+esc(g.label)+' · '+g.rows.length+' ✎</button>').join('')+
  (groups.length>80?'<span class="aiHint">+'+(groups.length-80)+' grupos</span>':'');
 for(const el of q('aiGroups').querySelectorAll('button[data-folder]'))el.onclick=()=>aiRenameGroup(el.dataset.folder);
 const sel=q('aiFilter'),previous=sel.value;
 sel.innerHTML='<option value="">Todos los lugares</option>'+groups.map(g=>'<option value="'+esc(g.label)+'">'+esc(g.label)+' ('+g.rows.length+')</option>').join('');
 sel.value=groups.some(g=>g.label===previous)?previous:'';
 q('aiFolderList').innerHTML=groups.map(g=>'<option value="'+esc(g.label)+'"></option>').join('');
 const selected=sel.value;
 const rows=groups.filter(g=>!selected||g.label===selected).flatMap(g=>g.rows);
 const visible=rows.slice(0,aiVisibleLimit);
 let html='<table><thead><tr><th>Fotografía</th><th>Lugar sugerido</th><th>Carpeta</th></tr></thead><tbody>';
 for(const row of visible){
  const folder=aiFolderFor(row),named=row.kind==='specific'&&row.confidence==='alta';
  const suggestion=named?row.place:row.category||'Otros';
  html+='<tr><td class="path"><img class="photoThumb" alt="" loading="lazy" src="'+esc(row.thumbnail||'')+'">'+
   '<b>'+esc(row.key.split('/').pop())+'</b></td>'+
   '<td><b>'+esc(suggestion)+'</b><br><span class="aiHint">'+
   (named?'Lugar probable':'Categoría general')+' · '+esc(row.subject||'Imagen de viaje')+
   (row.needsReview?' · Revisar':'')+'</span></td>'+
   '<td><input class="aiFolderInput" aria-label="Nombre de carpeta" list="aiFolderList" data-key="'+esc(row.key)+'" value="'+esc(folder)+'">'+
   '<p class="aiHint">'+(row.needsReview?'Revisión aconsejada':'Subcarpeta sugerida')+'</p></td></tr>';
 }
 const scroll=box.scrollTop;
 box.innerHTML=html+'</tbody></table>';
 box.scrollTop=scroll;
 for(const input of box.querySelectorAll('.aiFolderInput'))input.onchange=()=>{
  let slug;
  try{slug=aiSlugFolder(input.value)}catch{
   alert('Carpeta no válida. No uses barras ni rutas.');
   input.value=aiFolderFor(aiRows.find(r=>r.key===input.dataset.key));return;
  }
  aiEdited.set(input.dataset.key,slug);
  q('confirmAiOrganize').checked=false;renderAiResults();
 };
 q('aiShown').textContent='Mostrando '+visible.length+' de '+rows.length+' fotos';
 q('aiMoreBtn').style.display=rows.length>visible.length?'inline-flex':'none';
 updateButtons();
}
// AI transient failures are retried slowly with a smaller image, not three
// immediate calls to a Worker isolate that may be short on resources.
function aiTemporaryFailure(error){
 const reason=String(error?.message||error);
 return /HTTP\s*(?:429|500|502|503|504|520|522|524|1102)\b|resource limits|worker exceeded|too many requests|timed? out|red|network|fetch failed|failed to fetch|no se pudo conectar|temporalmente|overload/i.test(reason);
}
async function aiWait(ms){
 for(let elapsed=0;elapsed<ms&&!stopped;elapsed+=400)
  await new Promise(resolve=>setTimeout(resolve,Math.min(400,ms-elapsed)));
}
async function aiAnalyzeWithRecovery(f,context,force,index,total){
 let last;
 for(let attempt=0;attempt<4&&!stopped;attempt++){
  try{
   return await api({mode:'ai-review',prefix:currentPrefix,key:f.key,etag:f.etag,
    context,force,compact:attempt>0});
  }catch(error){
   last=error;
   if(!aiTemporaryFailure(error)||attempt===3)throw error;
   const ms=[4000,11000,22000][attempt];
   const seconds=Math.round(ms/1000);
   q('aiSummary').textContent='Cloudflare ocupado · pausa '+seconds+
    ' s · foto '+index+'/'+total+' · intento '+(attempt+2)+'/4 (modo ligero)';
   log('Cloudflare ha limitado la IA. Reintento controlado '+(attempt+2)+'/4: '+f.key.split('/').pop()+'.');
   await aiWait(ms);
  }
 }
 throw last||Error('Identificación detenida.');
}
async function runAiSelection(){
 if(busy||!currentPrefix||!scanFiles.length)return;
 const photos=aiFilesForReview();
 if(photos.length>1000){log('Selecciona una carpeta con un máximo de 1000 fotografías.');return}
 if(!photos.length){q('aiSummary').textContent='No hay fotos nuevas en esta carpeta. Las subcarpetas ya organizadas no se analizan otra vez.';return}
 const context=q('aiContext').value.trim().slice(0,180),force=q('aiForce').checked;
 const sameRun=aiRunFolder===currentPrefix&&aiRunContext===context&&!force;
 const valid=new Map(photos.map(x=>[x.key,x.etag]));
 if(!sameRun){
  aiRows=[];aiEdited.clear();aiVisibleLimit=60;q('aiFilter').value='';
 }
 aiRows=aiRows.filter(row=>valid.get(row.key)===row.etag);
 const already=new Set(aiRows.map(row=>row.key));
 const pending=photos.filter(f=>!already.has(f.key));
 if(!pending.length){
  aiAnalysisComplete=aiRows.length===photos.length;
  renderAiResults();
  q('aiSummary').textContent=aiRows.length+' fotos revisadas · '+aiPlaceGroups().length+' carpetas propuestas · sin consumo adicional de IA.';
  updateButtons();return;
 }
 if(!confirm('Identificar '+pending.length+' de '+photos.length+' fotos con Workers AI. Se conservarán todas. ¿Continuar?'))return;
 aiRunFolder=currentPrefix;aiRunContext=context;aiAnalysisComplete=false;
 stopped=false;q('confirmAiOrganize').checked=false;q('aiMoveStatus').textContent='';
 lock(true,'ai');renderAiResults();
 const errors=[];let fromCache=0,consecutiveErrors=0,processed=0;
 try{
  for(const f of pending){
   if(stopped)break;
   processed++;
   q('aiSummary').textContent='Identificando '+processed+'/'+pending.length+' · '+f.key.split('/').pop()+
    (errors.length?' · Errores '+errors.length:'');
   try{
    const out=await aiAnalyzeWithRecovery(f,context,force,processed,pending.length);
    if(out.key!==f.key||out.etag!==f.etag||!out.kind||!out.category)
     throw Error('Respuesta incompleta de identificación.');
    if(out.cached)fromCache++;
    await aiCompactThumbnail(out);
    aiRows.push(out);consecutiveErrors=0;
    if(!out.cached&&processed<pending.length)await aiWait(650);
    if(aiRows.length%12===0||processed===pending.length)renderAiResults();
   }catch(e){
    consecutiveErrors++;
    errors.push({key:f.key,error:e.message||String(e)});
    log('IA: '+f.key+' · '+(e.message||String(e)));
    if(consecutiveErrors>=3){
     log('IA pausada por errores repetidos de Cloudflare. Resultados ya guardados y fotos intactas. Vuelve a pulsar Identificar lugares.');
     break;
    }
   }
  }
  const successful=new Set(aiRows.map(row=>row.key));
  aiAnalysisComplete=!stopped&&successful.size===photos.length&&photos.every(f=>successful.has(f.key));
  renderAiResults();
  const other=aiRows.filter(x=>aiFolderFor(x)==='otros').length;
  q('aiSummary').textContent=aiRows.length+'/'+photos.length+' fotos · '+aiPlaceGroups().length+
   ' carpetas · '+other+' en otros · '+fromCache+' reutilizadas · '+errors.length+' errores.'+
   (aiAnalysisComplete?' Revisa antes de organizar.':' Pulsa Identificar lugares para continuar.');
  log('Clasificación: '+q('aiSummary').textContent);
 }catch(e){
  log('Error en la clasificación: '+(e.message||String(e)));
  q('aiSummary').textContent='Análisis interrumpido. Fotos intactas. Puedes reanudarlo.';
 }finally{lock(false)}
}
function downloadAiCsv(){
 if(!aiRows.length)return;
 const columns=['archivo','carpeta','lugar_probable','tipo','categoria','confianza','asunto','texto_alt','ruta_destino'];
 const rows=aiRows.map(x=>[x.key,aiFolderFor(x),x.place,x.kind,x.category,x.confidence,x.subject,x.alt,
  currentPrefix+'/'+aiFolderFor(x)+'/'+x.key.split('/').pop()]);
 const cell=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
 const csv='\uFEFF'+[columns,...rows].map(r=>r.map(cell).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
 a.href=url;a.download='lugares-vcc-'+currentPrefix.replace(/[^a-z0-9-]/gi,'-')+'.csv';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function organizeAiPhotos(){
 if(busy||!aiAnalysisComplete||!aiRows.length||!q('confirmAiOrganize').checked)return;
 const rows=[...aiRows];
 for(const row of rows)if(!aiValidateFolder(aiFolderFor(row))){
  alert('Revisa los nombres de las carpetas.');return;
 }
 if(!confirm('Mover '+rows.length+' fotos a '+aiPlaceGroups().length+
  ' carpetas. Cambiar las rutas puede romper las imágenes enlazadas desde el blog. ¿Continuar?'))return;
 if(prompt('Escribe ORGANIZAR para confirmar el cambio de rutas:')!=='ORGANIZAR')return;
 // Guardar el mapa de rutas antiguo -> nuevo ANTES de cambiar los objetos R2.
 downloadAiCsv();
 stopped=false;lock(true,'ai-move');q('confirmAiOrganize').checked=false;
 let moved=0;const errors=[];
 try{
  for(let i=0;i<rows.length&&!stopped;i++){
   const row=rows[i],folder=aiFolderFor(row);
   q('aiMoveStatus').textContent='Moviendo '+(i+1)+'/'+rows.length+' · '+row.key.split('/').pop();
   try{
    const out=await api({mode:'ai-move-place',prefix:currentPrefix,key:row.key,etag:row.etag,folder,confirm:true});
    if(out.moved!==true||out.source!==row.key||out.folder!==folder)throw Error('Movimiento no verificado.');
    moved++;row.movedTo=out.target;
    scanFiles=scanFiles.filter(f=>f.key!==row.key);
    files=files.filter(f=>f.key!==row.key);
   }catch(e){errors.push({key:row.key,message:e.message});log('No movida: '+row.key+' · '+e.message)}
  }
  q('aiMoveStatus').textContent=moved+' fotos organizadas · '+errors.length+' sin mover'+(stopped?' · detenido':'')+'.';
  log(q('aiMoveStatus').textContent);
  if(moved){scans=[];groups=[];scanReady=false;q('duplicates').innerHTML='';q('confirmDup').checked=false;}
  aiRows=aiRows.filter(r=>!r.movedTo);aiAnalysisComplete=false;renderAiResults();
  q('aiSummary').textContent=moved+' fotos organizadas. '+errors.length+' errores. Recarga la carpeta si quieres continuar.';
 }finally{lock(false)}
}

const dec=s=>{const t=atob(s),a=new Uint8Array(t.length);for(let i=0;i<t.length;i++)a[i]=t.charCodeAt(i);return a};
function onDuplicateSensitivityChange(){
 if(busy)return;
 q('confirmDup').checked=false;
 if(scanReady&&scans.length){groupDuplicates();log('Comparación recalculada con sensibilidad '+duplicateMode()+'. Revisa los grupos.')}
 else log('Sensibilidad '+duplicateMode()+'. Pulsa Iniciar detección.');
 updateButtons();
}
const MATCH_RADIUS=6,FINGERPRINT_VERSION=2;
const DUPLICATE_MODES=Object.freeze({
 conservador:{pre:.82,corr:.945,edge:.62,mad:.52},
 equilibrado:{pre:.73,corr:.87,edge:.42,mad:.72},
 agresivo:{pre:.67,corr:.82,edge:.29,mad:.84}
});
function duplicateMode(){return q('duplicateSensitivity')?.value||'equilibrado'}
const visualCache=new WeakMap(),pairMatchCache=new WeakMap();
function visualData(p){
 const cached=visualCache.get(p);if(cached)return cached;
 const rgb=dec(p.rgb),g=dec(p.gray64||'');
 if(rgb.length!==3072||g.length!==4096)throw Error('Huella anterior. Reanaliza la carpeta.');
 const l=new Float32Array(1024),gx=new Int16Array(4096),gy=new Int16Array(4096);
 for(let i=0;i<1024;i++){let j=i*3;l[i]=.2126*rgb[j]+.7152*rgb[j+1]+.0722*rgb[j+2]}
 for(let y=1;y<63;y++)for(let x=1;x<63;x++){let i=y*64+x;gx[i]=g[i+1]-g[i-1];gy[i]=g[i+64]-g[i-64]}
 const result={l,g,gx,gy};visualCache.set(p,result);return result;
}
function compare(a,b){
 const mode=duplicateMode(),prior=pairMatchCache.get(a)?.get(b)||pairMatchCache.get(b)?.get(a);
 if(prior?.mode===mode)return prior.result;
 const result=compareCore(a,b);
 let map=pairMatchCache.get(a);if(!map){map=new WeakMap();pairMatchCache.set(a,map)}
 map.set(b,{mode,result});return result;
}
function compareCore(a,b){
 if(a.sha256===b.sha256&&a.size===b.size)return {ok:true,confidence:100,exact:true};
 const ar=a.width/a.height,br=b.width/b.height;
 if(!Number.isFinite(ar)||!Number.isFinite(br)||Math.abs(ar/br-1)>.045)return {ok:false,confidence:0};
 const opts=DUPLICATE_MODES[duplicateMode()]||DUPLICATE_MODES.equilibrado,A=visualData(a),B=visualData(b);
 // Primera fase: correlació d'intensitats normalitzades. Resistent als canvis de brillantor.
 let first={corr:-1,dx:0,dy:0};
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const xmin=Math.max(0,-dx),xmax=Math.min(32,32-dx),ymin=Math.max(0,-dy),ymax=Math.min(32,32-dy);
  let sa=0,sb=0,aa=0,bb=0,ab=0,n=0;
  for(let y=ymin;y<ymax;y++)for(let x=xmin;x<xmax;x++){
   const i=y*32+x,j=(y+dy)*32+x+dx,va=A.l[i],vb=B.l[j];
   sa+=va;sb+=vb;aa+=va*va;bb+=vb*vb;ab+=va*vb;n++;
  }
  const denom=Math.sqrt(Math.max(0,(aa-sa*sa/n)*(bb-sb*sb/n)));
  const corr=denom>1e-5?(ab-sa*sb/n)/denom:0;
  if(corr>first.corr)first={corr,dx,dy};
 }
 if(first.corr<opts.pre)return {ok:false,confidence:0};
 // Segona fase: estructura 64px i gradients signats, per evitar falsos positius
 // entre boscos, mars i altres paisatges amb colors o textures semblants.
 let best=null;
 for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
  const dx=first.dx*2+ox,dy=first.dy*2+oy;
  const xmin=Math.max(2,2-dx),xmax=Math.min(62,62-dx),ymin=Math.max(2,2-dy),ymax=Math.min(62,62-dy);
  let sa=0,sb=0,aa=0,bb=0,ab=0,ga=0,gb=0,gab=0,n=0;
  for(let y=ymin;y<ymax;y++)for(let x=xmin;x<xmax;x++){
   const i=y*64+x,j=(y+dy)*64+x+dx,va=A.g[i],vb=B.g[j];
   sa+=va;sb+=vb;aa+=va*va;bb+=vb*vb;ab+=va*vb;
   const ax=A.gx[i],ay=A.gy[i],bx=B.gx[j],by=B.gy[j];
   ga+=ax*ax+ay*ay;gb+=bx*bx+by*by;gab+=ax*bx+ay*by;n++;
  }
  if(!n)continue;
  const va=Math.max(0,aa-sa*sa/n),vb=Math.max(0,bb-sb*sb/n);
  const corr=va>1e-3&&vb>1e-3?(ab-sa*sb/n)/Math.sqrt(va*vb):0;
  const edge=ga>1e-3&&gb>1e-3?gab/Math.sqrt(ga*gb):0;
  if(Math.min(Math.sqrt(ga/n),Math.sqrt(gb/n))<6)continue;
  const rank=corr*.72+edge*.28;
  if(!best||rank>best.rank)best={corr,edge,rank,dx,dy,meanA:sa/n,meanB:sb/n,stdA:Math.sqrt(va/n),stdB:Math.sqrt(vb/n)};
 }
 if(!best||best.corr<opts.corr||best.edge<opts.edge)return {ok:false,confidence:0};
 let diff=0,n=0;
 const xmin=Math.max(2,2-best.dx),xmax=Math.min(62,62-best.dx),ymin=Math.max(2,2-best.dy),ymax=Math.min(62,62-best.dy);
 for(let y=ymin;y<ymax;y++)for(let x=xmin;x<xmax;x++){
  const i=y*64+x,j=(y+best.dy)*64+x+best.dx;
  diff+=Math.abs((A.g[i]-best.meanA)/(best.stdA||1)-(B.g[j]-best.meanB)/(best.stdB||1));n++;
 }
 const mad=diff/(n||1);
 if(mad>opts.mad)return {ok:false,confidence:0};
 const confidence=Math.min(99,Math.max(80,Math.round(79+(best.corr-.8)*65+Math.max(0,best.edge-.25)*12)));
 return {ok:true,confidence,exact:false,review:confidence<94||duplicateMode()==='agresivo',
  metrics:{structure:+best.corr.toFixed(3),edges:+best.edge.toFixed(3),difference:+mad.toFixed(2),offset:best.dx+','+best.dy}};
}
// La qualitat prima sobre el format; AVIF només desempata fotografies comparables.
function better(a,b){
 const qa=Number(a.qualityScore)||0,qb=Number(b.qualityScore)||0;
 if(Math.abs(qa-qb)>=2)return qa>qb?a:b;
 const fmt=x=>/\.avif$/i.test(x.key)?3:/\.webp$/i.test(x.key)?2:1;
 if(fmt(a)!==fmt(b))return fmt(a)>fmt(b)?a:b;
 if(Math.abs((a.sharpness||0)-(b.sharpness||0))>.7)return a.sharpness>b.sharpness?a:b;
 return a.key.localeCompare(b.key)<=0?a:b;
}
function groupDuplicates(){
 const photos=[...scans].sort((a,b)=>{
  const fa=a.key.slice(0,a.key.lastIndexOf('/')+1);
  const fb=b.key.slice(0,b.key.lastIndexOf('/')+1);
  const folderOrder=fa.localeCompare(fb,'es',{numeric:true});
  if(folderOrder)return folderOrder;
  const stem=x=>x.key.slice(x.key.lastIndexOf('/')+1).replace(/\.(?:jpe?g|webp|avif)$/i,'');
  return stem(a).localeCompare(stem(b),'es',{numeric:true})||
   a.key.localeCompare(b.key,'es',{numeric:true});
 });
 const parent=photos.map((_,i)=>i),size=photos.map(()=>1),edges=[];
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i;};
 const unite=(a,b)=>{
  let ra=find(a),rb=find(b);if(ra===rb)return;
  if(size[ra]<size[rb]){const t=ra;ra=rb;rb=t}
  parent[rb]=ra;size[ra]+=size[rb];
 };
 // Solo las 6 siguientes de cada fotografía, equivalente a ±6 sin duplicar pares.
 for(let i=0;i<photos.length;i++){
  const folder=photos[i].key.slice(0,photos[i].key.lastIndexOf('/')+1);
  for(let j=i+1;j<photos.length&&j<=i+MATCH_RADIUS;j++){
   if(photos[j].key.slice(0,photos[j].key.lastIndexOf('/')+1)!==folder)break;
   const result=compare(photos[i],photos[j]);
   if(result.ok){edges.push({i,j,match:result});unite(i,j)}
  }
 }
 // Una cadena de fotografías similares puede formar un grupo de 4, 5 o más,
 // aunque el grupo abarque más de seis posiciones en total.
 const buckets=new Map();
 for(let i=0;i<photos.length;i++){
  const id=find(i);
  if(!buckets.has(id))buckets.set(id,[]);
  buckets.get(id).push(i);
 }
 const connections=new Map();
 for(const edge of edges){
  for(const [a,b] of [[edge.i,edge.j],[edge.j,edge.i]]){
   if(!connections.has(a))connections.set(a,[]);
   connections.get(a).push({index:b,match:edge.match});
  }
 }
 const output=[];
 for(const ids of buckets.values()){
  if(ids.length<2)continue;
  // Elegir la mejor foto del grupo sin descartar las demás automáticamente.
  const keep=ids.map(i=>photos[i]).reduce(better);
  const keeperIndex=photos.indexOf(keep);
  const pairs=ids.filter(i=>i!==keeperIndex).map(i=>{
   let evidence=(connections.get(i)||[]).find(x=>x.index===keeperIndex)?.match;
   let viaChain=false;
   if(!evidence){
    // Solo esta comparación extra del candidato contra su referencia,
    // no toda la carpeta, para que los grupos grandes sigan siendo rápidos.
    evidence=compare(photos[i],keep);
    if(!evidence.ok){
     viaChain=true;
     evidence=(connections.get(i)||[])
      .map(x=>x.match)
      .sort((a,b)=>b.confidence-a.confidence)[0];
    }
   }
   return {remove:photos[i],confidence:evidence?.confidence||80,
     checked:false,deleted:false,review:!!evidence?.review||viaChain,
     viaChain};
  });
  output.push({keep,pairs,resolved:false});
 }
 groups=output;
 renderDuplicates();
 log('Comparadas hasta ±6 fotos por imagen ('+duplicateMode()+'). '+edges.length+
     ' pares similares; '+groups.length+' grupos con duplicados.');
}
function updateSelectionSummary(){
 const selected=groups.reduce((n,g)=>n+g.pairs.filter(p=>p.checked&&!p.deleted).length,0);
 const count=groups.reduce((n,g)=>n+g.pairs.filter(p=>!p.deleted).length,0);
 q('selectionSummary').textContent=selected+' de '+count+' seleccionados';
}
function selectAllDuplicates(value){
 if(busy||!scanReady)return;
 for(const g of groups)for(const p of g.pairs)if(!p.deleted)p.checked=value;
 renderDuplicates();updateButtons();
}
function renderDuplicates(){
 if(!groups.length){q('duplicates').textContent='No se han detectado duplicados dentro de la ventana de ±6 fotos.';updateSelectionSummary();return}
 let h='<table><thead><tr><th>Eliminar</th><th>Conservar</th><th>Duplicado</th><th>Coincidencia</th></tr></thead><tbody>';
 for(let gi=0;gi<groups.length;gi++)for(let pi=0;pi<groups[gi].pairs.length;pi++){
  const g=groups[gi],p=g.pairs[pi];
  h+='<tr><td><input type="checkbox" data-g="'+gi+'" data-p="'+pi+'" '+(p.checked?'checked':'')+' '+(p.deleted?'disabled':'')+'></td>'+
   '<td class="path"><img class="photoThumb" data-thumb-key="'+esc(g.keep.key)+'" alt="Se conserva">'+esc(g.keep.key)+' ('+g.keep.width+'×'+g.keep.height+')<br><span class="tag">Calidad '+(g.keep.qualityScore??'—')+'/100</span></td>'+
   '<td class="path"><img class="photoThumb" data-thumb-key="'+esc(p.remove.key)+'" alt="Duplicada">'+esc(p.remove.key)+' ('+p.remove.width+'×'+p.remove.height+')<br><span class="small muted">Calidad '+(p.remove.qualityScore??'—')+'/100</span></td>'+
   '<td><span class="tag">'+p.confidence+'% similitud</span>'+(p.review?' · Revisar manualmente':'')+(p.viaChain?' · Coincidencia por cadena':'')+(p.deleted?' · Eliminada':'')+'</td></tr>';
 }
 q('duplicates').innerHTML=h+'</tbody></table>';
 for(const el of q('duplicates').querySelectorAll('input'))el.onchange=()=>{groups[+el.dataset.g].pairs[+el.dataset.p].checked=el.checked;updateSelectionSummary()};
 updateSelectionSummary();
 loadDuplicatePreviews();
}
function loadDuplicatePreviews(){
  for(const img of q('duplicates').querySelectorAll('img[data-thumb-key]')){
    const u=previewUrls.get(img.dataset.thumbKey);
    if(u)img.src=u;
  }
}
// El análisis visual se ejecuta en el navegador, nunca en el Worker.
function jpegDimensions(blobBytes) {
  const b=new Uint8Array(blobBytes);
  if(b.length<4||b[0]!==255||b[1]!==216)throw Error('No es un JPG válido');
  let p=2;
  const sof=new Set([192,193,194,195,197,198,199,201,202,203,205,206,207]);
  while(p+4<b.length){
    if(b[p]!==255){p++;continue}
    while(p<b.length&&b[p]===255)p++;
    const marker=b[p++];
    if(marker===217||marker===218)break;
    if(marker===1||(marker>=208&&marker<=215))continue;
    if(p+2>b.length)break;
    const length=(b[p]<<8)|b[p+1];
    if(length<2||p+length>b.length)break;
    if(sof.has(marker)){
      const height=(b[p+3]<<8)|b[p+4],width=(b[p+5]<<8)|b[p+6];
      if(width>0&&height>0)return {width,height};
      break;
    }
    p+=length;
  }
  throw Error('No se pudieron leer las dimensiones del JPG');
}
async function fingerprintInBrowser(f){
 const token=q('token').value.trim();
 const response=await fetch('/api/process',{
  method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
  body:JSON.stringify({mode:'photo-stream',prefix:currentPrefix,key:f.key,etag:f.etag}),cache:'no-store'
 });
 if(!response.ok)throw Error('HTTP '+response.status+': '+(await response.text()).replace(/<[^>]+>/g,' ').slice(0,180));
 const blob=await response.blob();
 const dims=/\.jpe?g$/i.test(f.key)?jpegDimensions(await blob.slice(0,Math.min(blob.size,524288)).arrayBuffer()):null;
 let bitmap;
 try{
  bitmap=await createImageBitmap(blob,{resizeWidth:160,resizeQuality:'high'});
  const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0,32,32);
  const rgba=ctx.getImageData(0,0,32,32).data,rgb=new Uint8Array(3072);
  for(let i=0;i<1024;i++){rgb[i*3]=rgba[i*4];rgb[i*3+1]=rgba[i*4+1];rgb[i*3+2]=rgba[i*4+2]}
  const lum=i=>.2126*rgb[i]+.7152*rgb[i+1]+.0722*rgb[i+2];
  let sharpness=0,pairs=0;
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   let i=(y*32+x)*3;
   if(x<31){sharpness+=Math.abs(lum(i)-lum(i+3));pairs++}
   if(y<31){sharpness+=Math.abs(lum(i)-lum(i+96));pairs++}
  }
  // Una única descodificació; empremta addicional més precisa a 64px.
  const detail=document.createElement('canvas');detail.width=128;detail.height=128;
  const dc=detail.getContext('2d',{willReadFrequently:true});
  dc.drawImage(bitmap,0,0,128,128);
  const px=dc.getImageData(0,0,128,128).data,g128=new Uint8Array(16384);
  let sum=0,sumSq=0,clipped=0;
  for(let i=0;i<16384;i++){
   let p=i*4,g=Math.round(.2126*px[p]+.7152*px[p+1]+.0722*px[p+2]);
   g128[i]=g;sum+=g;sumSq+=g*g;if(g<=7||g>=249)clipped++;
  }
  const gray64=new Uint8Array(4096);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
   let p=(y*2)*128+x*2;
   gray64[y*64+x]=Math.round((g128[p]+g128[p+1]+g128[p+128]+g128[p+129])/4);
  }
  let lap=0,nLap=0;
  for(let y=2;y<126;y++)for(let x=2;x<126;x++){
   const i=y*128+x;lap+=Math.abs(4*g128[i]-g128[i-1]-g128[i+1]-g128[i-128]-g128[i+128]);nLap++;
  }
  const mean=sum/16384,contrast=Math.sqrt(Math.max(0,sumSq/16384-mean*mean)),detailStrength=lap/(nLap||1);
  const qualityScore=Math.max(0,Math.min(100,Math.round(
   43+Math.min(35,detailStrength*1.65)+Math.min(14,contrast*.14)-Math.min(32,(clipped/16384)*135)
   -Math.max(0,33-mean)*.31-Math.max(0,mean-222)*.31
  )));
  const preview=document.createElement('canvas');preview.width=144;preview.height=96;
  const pc=preview.getContext('2d');pc.fillStyle='#fff';pc.fillRect(0,0,144,96);
  const w0=dims?.width||bitmap.width,h0=dims?.height||bitmap.height,scale=Math.min(144/w0,96/h0);
  pc.drawImage(bitmap,(144-w0*scale)/2,(96-h0*scale)/2,w0*scale,h0*scale);
  previewUrls.set(f.key,preview.toDataURL('image/jpeg',.72));
  const b64=arr=>{let text='';for(let i=0;i<arr.length;i++)text+=String.fromCharCode(arr[i]);return btoa(text)};
  return {key:f.key,etag:f.etag,size:f.size,width:dims?.width||bitmap.width,height:dims?.height||bitmap.height,
   sharpness:+(sharpness/pairs).toFixed(3),qualityScore,detailStrength:+detailStrength.toFixed(2),
   fingerprintVersion:FINGERPRINT_VERSION,sha256:'etag:'+f.etag+':'+f.size,rgb:b64(rgb),gray64:b64(gray64)};
 }finally{bitmap?.close()}
}

async function scanDuplicates(){
 if(busy||!currentPrefix||!scanFiles.length)return;
 stopped=false;lock(true,'scan');
 const CONCURRENT_IMAGES=5;
 try{
  const previous=new Map(scans.map(x=>[x.key,x]));
  groups=[];scanReady=false;
  q('duplicates').innerHTML='';
  const done=new Map();
  const pending=[];
  for(const f of scanFiles){
   const old=previous.get(f.key);
   if(old&&old.etag===f.etag&&old.fingerprintVersion===FINGERPRINT_VERSION&&old.gray64)done.set(f.key,old);
   else pending.push(f);
  }
  let next=0,errors=[],finished=0;
  const total=scanFiles.length;
  const report=()=>{
   q('scanSummary').textContent='Analizadas '+done.size+'/'+total+
     ' · Pendientes '+Math.max(0,total-done.size-errors.length)+
     (errors.length?' · Errores '+errors.length:'');
  };
  report();
  async function processQueue(){
   while(!stopped){
    const index=next++;
    if(index>=pending.length)return;
    const f=pending[index];
    try{
     const fp=await fingerprintInBrowser(f);
     if(!fp||fp.key!==f.key||fp.etag!==f.etag)
      throw Error('La imagen cambió; vuelve a cargar la carpeta.');
     done.set(f.key,fp);
    }catch(e){
     errors.push({key:f.key,message:e.message});
     log('No se ha podido analizar '+f.key+': '+e.message);
    }
    finished++;report();
    // Liberar el hilo de interfaz entre bloques sin pausas artificiales.
    if(finished%12===0)await new Promise(resolve=>setTimeout(resolve,0));
   }
  }
  await Promise.all(Array.from(
   {length:Math.min(CONCURRENT_IMAGES,pending.length)},
   ()=>processQueue()));
  // Conserva las huellas terminadas cuando se pulsa Parar o falla una foto.
  scans=scanFiles.filter(f=>done.has(f.key)).map(f=>done.get(f.key));
  if(stopped){
   log('Detección detenida. '+scans.length+'/'+total+
     ' imágenes analizadas. Pulsa Iniciar para continuar.');
   return;
  }
  if(errors.length){
   log('Análisis incompleto: '+errors.length+
     ' errores. Se han conservado '+scans.length+
     ' resultados. Pulsa Iniciar para reintentar solo las imágenes fallidas.');
   return;
  }
  if(scans.length!==total)throw Error('Análisis incompleto: no se permite eliminar.');
  groupDuplicates();
  scanReady=true;
  report();
  log(groups.length?
   'Análisis completo. Revisa los grupos antes de seleccionar qué eliminar.':
   'Análisis completo. No se han identificado duplicados con el umbral actual.');
 }catch(e){
  scanReady=false;
  log('Error de análisis: '+e.message+'. No se permiten eliminaciones.');
 }finally{lock(false)}
}
async function removeDuplicates(){
 if(busy||!scanReady||!q('confirmDup').checked)return;
 const selected=groups.flatMap(g=>g.pairs.filter(p=>p.checked&&!p.deleted).map(p=>({g,p})));
 if(!selected.length){
   groups.forEach(g=>g.resolved=true);updateButtons();
   q('deleteProgress').textContent='0 duplicados eliminados; todas las imágenes conservadas.';
   log('No se han seleccionado fotografías. Puedes pasar a la conversión.');
   return;
 }
 if(!confirm('Vas a eliminar DEFINITIVAMENTE '+selected.length+' imágenes JPG/WebP/AVIF, SIN COPIA DE SEGURIDAD. ¿Confirmas?'))return;
 stopped=false;lock(true,'delete');
 let deleted=0,failed=0,processed=0;
 const total=selected.length;
 q('deleteProgress').textContent='Iniciando eliminación: 0/'+total;
 try{
  for(const {g,p} of selected){
   if(stopped)break;
   q('deleteProgress').textContent='Eliminando '+(processed+1)+'/'+total+' · imágenes eliminadas '+deleted+' · Errores '+failed+' · '+p.remove.key;
   try{
    const d=await api({mode:'remove-duplicate',prefix:currentPrefix,key:p.remove.key,keepKey:g.keep.key,etag:p.remove.etag,keepEtag:g.keep.etag,confidence:p.confidence,confirm:true});
    p.deleted=true;removed.add(p.remove.key);deleted++;scanFiles=scanFiles.filter(f=>f.key!==p.remove.key);files=files.filter(f=>f.key!==p.remove.key);
    log('Imagen eliminada '+deleted+'/'+total+': '+d.removed);
   }catch(e){
    failed++;log('Error eliminando '+p.remove.key+': '+e.message);
   }
   processed++;
   q('deleteProgress').textContent='Procesados '+processed+'/'+total+' · Eliminados '+deleted+' · Errores '+failed;
  }
  if(!stopped&&failed===0)groups.forEach(g=>g.resolved=true);
  q('deleteProgress').textContent='Resultado: '+deleted+' imágenes eliminadas de '+total+' seleccionados · '+failed+' errores'+(stopped?' · Detenido':'')+'.';
  log('Eliminación finalizada: '+deleted+'/'+total+' borrados, '+failed+' errores'+(stopped?' · proceso detenido':'')+'.');
 }finally{renderDuplicates();lock(false)}
}
// El navegador fa de pont per a l'AVIF: zero buffers grans dins del Worker
// que transforma la foto. Una sola conversió activa i reintents esglaonats.
function conversionTransient(message){
 return /HTTP\s*(?:429|500|502|503|504|520|522|524)\b|resource limits|exceeded|1102|network|conexión|connection|fetch failed|failed to fetch|aborted|body stream|timeout|temporalmente|saturad/i.test(String(message));
}
async function convertPrepared(f){
 const token=q('token').value.trim();
 const headers={'Content-Type':'application/json','Authorization':'Bearer '+token};
 const prep=await fetch('/api/process',{method:'POST',headers,
   body:JSON.stringify({mode:'convert-prepare',prefix:currentPrefix,key:f.key,etag:f.etag}),cache:'no-store'});
 if(!prep.ok){
  const raw=await prep.text(),parsed=(()=>{try{return JSON.parse(raw)}catch{return null}})();
  throw Error('HTTP '+prep.status+' · '+(parsed?.error||raw.replace(/<[^>]*>/g,' ').slice(0,170)));
 }
 const contentType=prep.headers.get('Content-Type')||'';
 if(contentType.includes('application/json')){
  const res=await prep.json();
  if(res.reusedVerifiedAvif){
   const complete=await api({mode:'convert-complete',prefix:currentPrefix,key:f.key,etag:f.etag});
   return complete;
  }
  if(res.skipped)return res;
  throw Error('Respuesta de conversión inesperada.');
 }
 if(!contentType.toLowerCase().includes('image/avif'))throw Error('Cloudflare no ha enviado un AVIF.');
 if(prep.headers.get('X-VCC-Source-Etag')!==f.etag)throw Error('ETag de conversión distinto. No se guarda.');
 const blob=await prep.blob();
 if(!blob.size||blob.size>25*1024*1024)throw Error('AVIF vacío o demasiado grande.');
 const prefixPath='/api/process?'+new URLSearchParams({
   mode:'convert-save',prefix:currentPrefix,key:f.key,etag:f.etag
 }).toString();
 const saved=await fetch(prefixPath,{method:'POST',headers:{
   Authorization:'Bearer '+token,'Content-Type':'image/avif'
 },body:blob,cache:'no-store'});
 const text=await saved.text();let data;
 try{data=JSON.parse(text)}catch{data=null}
 if(!saved.ok)throw Error('HTTP '+saved.status+' · '+(data?.error||text.replace(/<[^>]*>/g,' ').slice(0,170)));
 if(!data)throw Error('No hay confirmación de R2. Vuelve a iniciar.');
 return data;
}
async function convertAll(){
 if(busy||!currentPrefix||!files.length)return;
 if(!confirm('Convertir JPG a AVIF (calidad 85, ajustes de color). Solo se elimina cada JPG después de verificar su AVIF. ¿Continuar?'))return;
 stopped=false;lock(true,'convert');
 const pending=[...files].filter(f=>!removed.has(f.key));
 const total=pending.length,MAX_ATTEMPTS=3;
 let processed=0,deleted=0,reused=0,retries=0,consecutiveErrors=0;
 const completed=new Set(),errors=[];
 const wait=async(ms)=>{
  for(let n=0;n<ms&&!stopped;n+=500)await new Promise(done=>setTimeout(done,Math.min(500,ms-n)));
 };
 const show=(note='')=>{
  q('convertSummary').textContent='Procesados '+processed+'/'+total+
   ' · AVIF verificados '+deleted+' · Errores '+errors.length+
   (retries?' · Reintentos '+retries:'')+(note?' · '+note:'');
 };
 show();
 try{
  for(let i=0;i<pending.length&&!stopped;i++){
   const f=pending[i];
   let ok=false,lastError='';
   for(let attempt=1;attempt<=MAX_ATTEMPTS&&!stopped;attempt++){
    show('Convirtiendo '+(i+1)+'/'+total+' · '+f.key.split('/').pop());
    try{
     const out=await convertPrepared(f);
     if(out.deleted===f.key||out.skipped===f.key&&out.reason==='JPG ausente'){
      completed.add(f.key);ok=true;
      if(out.deleted){deleted++;if(out.reusedVerifiedAvif)reused++}
      consecutiveErrors=0;
      break;
     }
     throw Error('Conversión sin confirmación de AVIF.');
    }catch(e){
     lastError=e.message||String(e);
     if(attempt===MAX_ATTEMPTS||!conversionTransient(lastError))break;
     retries++;
     const pause=[4000,15000][attempt-1]||15000;
     show('Cloudflare ocupado · pausa '+Math.round(pause/1000)+' s · '+f.key.split('/').pop());
     await wait(pause);
    }
   }
   if(!ok&&!stopped){
    errors.push({key:f.key,message:lastError});
    consecutiveErrors++;
    log('Conversión pendiente: '+f.key+' · '+lastError+'. JPG conservado.');
   }
   processed++;show();
   // En una saturació persistent no recorrer 50 fitxers repetint HTTP 503.
   if(consecutiveErrors>=3){
    log('Conversión pausada: Cloudflare no procesa estas fotos. JPG originales intactos. Vuelve a iniciar más tarde.');
    break;
   }
   if(i<pending.length-1&&!stopped)await wait(800);
  }
  const left=total-completed.size;
  const summary=(stopped?'Conversión detenida':consecutiveErrors>=3?'Conversión pausada':'Conversión finalizada')+
   ': '+deleted+' JPG eliminados tras verificar AVIF · '+reused+' AVIF previos reutilizados · '+
   errors.length+' errores · '+left+' pendientes.';
  q('convertSummary').textContent=summary;
  log(summary);
  if(errors.length)log('JPG pendientes: '+errors.map(e=>e.key+' ('+e.message+')').join(' | '));
 }finally{
  if(completed.size){
   files=files.filter(f=>!completed.has(f.key));
   scanFiles=scanFiles.filter(f=>!completed.has(f.key));
   scans=[];groups=[];scanReady=false;
   q('duplicates').innerHTML='';
   q('confirmDup').checked=false;
   q('selectionSummary').textContent='0 seleccionados';
   q('scanSummary').textContent='Carpeta modificada: vuelve a analizar los duplicados si es necesario.';
   q('folderSummary').textContent=files.length+' JPG pendientes. Vuelve a seleccionar la carpeta para ver los AVIF nuevos.';
  }
  lock(false);
 }
}
</script></body></html>`;

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==='GET'&&url.pathname==='/')return new Response(PANEL,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'unsafe-inline'; frame-ancestors 'none'"}});
    if(request.method!=='POST'||url.pathname!=='/api/process')return json({error:'Ruta no encontrada'},404);
    if(!validateAuth(request,env))return json({error:'No autorizado'},401);
    try{
      // Esmena: subida de AVIF des del navegador. Token i JPG originals verificats.
      if(url.searchParams.get('mode')==='convert-save'){
        const prefix=normalizePrefix(url.searchParams.get('prefix')||'');
        return await finalizeAvif(env,url.searchParams.get('key'),prefix,
          url.searchParams.get('etag'),request,true);
      }
      let input;try{input=await request.json()}catch{throw Error('JSON inválido')}
      if(!input||typeof input!=='object')throw Error('Petición inválida');
      const mode=input.mode;
      if(mode==='folders'){
        const prefix=typeof input.prefix==='string'&&input.prefix.trim()?normalizePrefix(input.prefix):'';
        if(input.cursor!=null&&typeof input.cursor!=='string')throw Error('Cursor inválido');
        const options={prefix,delimiter:'/',limit:1000};if(input.cursor)options.cursor=input.cursor;
        const page=await env.BUCKET.list(options);
        return json({folders:(page.delimitedPrefixes||[]).filter(p=>!p.startsWith(BACKUP_PREFIX)&&!p.startsWith('__vcc_ai_reviews__/')&&!p.toLowerCase().includes('preview')),nextCursor:page.truncated?page.cursor:null});
      }
      const prefix=normalizePrefix(input.prefix);
      if(mode==='folder-rename-list')return json(await listForFolderRename(env,prefix,input.newName,input.cursor));
      if(mode==='folder-rename-one')return json(await renameFolderObject(env,prefix,input.newName,input.key,input.etag,input.confirm));
      if(mode==='list'){
        if(input.cursor!=null&&typeof input.cursor!=='string')throw Error('Cursor inválido');
        return json(await listPhotos(env,prefix,input.cursor||undefined));
      }
      if(mode==='photo-stream'){
        assertImageKey(input.key,prefix);
        const obj=await env.BUCKET.get(input.key);
        if(!obj||obj.etag!==input.etag||!obj.body)throw Error('La imagen cambió o ya no existe; vuelve a cargar la carpeta.');
        if(obj.size>MAX_IMAGE_SIZE)throw Error('Imagen superior a 20 MB: '+input.key);
        return new Response(obj.body,{headers:{
          'Content-Type':contentTypeForKey(input.key),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'
        }});
      }
      if(mode==='remove-duplicate'){
        if(input.confirm!==true)throw Error('Falta confirmación explícita de eliminación');
        if(typeof input.etag!=='string'||typeof input.keepEtag!=='string')throw Error('ETag inválido');
        return json(await removeDuplicateOne(env,prefix,input.key,input.keepKey,input.etag,input.keepEtag,input.confidence));
      }
      if(mode==='convert-prepare')return await prepareAvifStream(env,input.key,prefix,input.etag);
      if(mode==='convert-complete')return await finalizeAvif(env,input.key,prefix,input.etag,request,false);
      if(mode==='convert-delete')return json(await convertAndDeleteOne(env,input.key,prefix));
       if(mode==='ai-review')return json(await aiReviewOne(env,input.key,prefix,input.etag,input.context,input.force===true,input.compact===true));
       if(mode==='ai-move-place')return json(await movePhotoToPlace(env,prefix,input.key,input.etag,input.folder,input.confirm));
       // Clasificación IA: no elimina fotografías.

      return json({error:'Operación inválida'},400);
    }catch(error){console.error('VCC processing error',error);
      const message=String(error?.message||error);
      const temporary=/\b(?:429|500|502|503|504|520|522|524|1102)\b|resource limits|rate.?limit|too many requests|overloaded|timed? out|temporarily unavailable|temporarily exceeded/i.test(message);
      return json({error:message},temporary?503:400)}
  }
};