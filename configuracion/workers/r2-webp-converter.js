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
const COLOR = Object.freeze({ brightness: 1.12, contrast: 0.984, saturation: 1.008 });
const COLOR_VERSION = "vcc-color-v1";
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

const AI_VERSION='vcc-ai-curation-v1';
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
async function aiReviewOne(env,key,prefix,etag,context,force){
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
   if(cache&&cache.size<160000){
     try{const data=await cache.json();if(data.version===AI_VERSION&&data.etag===etag&&data.context===hint&&data.thumbnail&&data.score)return {...data,cached:true}}catch{}
   }
 }
 const original=await env.BUCKET.get(key);
 if(!original?.body||original.etag!==etag)throw Error('La fotografía cambió al leerla.');
 const thumb=(await env.IMAGES.input(original.body).transform({width:768}).output({format:'image/jpeg',quality:78})).response();
 if(!thumb.ok||!thumb.body)throw Error('No se pudo generar la imagen reducida: HTTP '+thumb.status);
 const bytes=await thumb.arrayBuffer();
 if(!bytes.byteLength||bytes.byteLength>2200000)throw Error('Miniatura demasiado grande.');
 const thumbnail='data:image/jpeg;base64,'+base64Bytes(bytes);
 const prompt=[
 'Eres editor fotográfico de un blog de viajes llamado Viajando con Cabeza.',
 'Analiza ESTA imagen visualmente. El contexto de la carpeta es solo una pista, nunca una prueba de ubicación.',
 'Contexto del usuario: '+(hint||'no indicado')+'.',
 'Valora de 0 a 100: calidad técnica, belleza visual, utilidad para explicar un viaje, aptitud como portada.',
 'Describe sujeto y escena. Identifica lugar exacto o monumento SOLO si hay pistas visuales suficientes. Si no, escribe "No identificable" con confianza baja. No inventes nombres de sitios.',
 'Confianza del lugar: "alta", "media" o "baja". No confundas una pista del directorio con una prueba visual.',
 'Escoge scene entre: calle, arquitectura, panoramica, interior, transporte, comida, naturaleza, detalle y otro.',
 'Responde SOLO un objeto JSON válido, sin Markdown, con estas claves:',
 '{"technical":75,"visual":78,"editorial":82,"cover":70,"place":"Lugar o monumento probable","confidence":"alta","scene":"calle","subject":"Qué se ve en diez palabras","reason":"Por qué interesa al lector (máximo 16 palabras)","alt":"Descripción visual objetiva para alt (máximo 18 palabras)"}'
 ].join('\n');
 const response=await env.AI.run(AI_MODEL,{
    messages:[{role:'system',content:'Responde solo JSON válido en español, sin inventar ubicaciones.'},
      {role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:thumbnail}}]}],
    temperature:0.1,max_tokens:490
 });
 const payload=parseAiJSON(response?.response||response?.choices?.[0]?.message?.content||'');
 const tech=clampScore(payload.technical),visual=clampScore(payload.visual),editorial=clampScore(payload.editorial),cover=clampScore(payload.cover);
 const confidence=['alta','media','baja'].includes(String(payload.confidence).toLowerCase())?String(payload.confidence).toLowerCase():'baja';
 const rawScene=safeAiText(payload.scene,36).toLowerCase();
 const scene=['calle','arquitectura','panoramica','interior','transporte','comida','naturaleza','detalle','otro'].includes(rawScene)?rawScene:'otro';
 const data={version:AI_VERSION,key,etag,context:hint,technical:tech,visual,editorial,cover,
   score:Math.round(.3*tech+.3*visual+.4*editorial),place:safeAiText(payload.place,120)||'No identificable',confidence,
   scene,subject:safeAiText(payload.subject,140)||'Imagen de viaje',
   reason:safeAiText(payload.reason,250),alt:safeAiText(payload.alt,180),
   thumbnail,model:AI_MODEL,reviewedAt:new Date().toISOString()};
 await env.BUCKET.put(cacheKey,JSON.stringify(data),{httpMetadata:{contentType:'application/json; charset=utf-8'}});
 return {...data,cached:false};
}


async function removeAiRejectedOne(env,key,prefix,etag,confirmed){
 if(confirmed!==true)throw Error('La eliminación requiere confirmación explícita.');
 assertImageKey(key,prefix);
 if(key.split('/').includes('_preview'))throw Error('No se permite eliminar miniaturas.');
 if(typeof etag!=='string'||!etag)throw Error('ETag inválido');
 const reviewed=await env.BUCKET.get('__vcc_ai_reviews__/'+key+'.json');
 if(!reviewed||reviewed.size>160000)throw Error('La fotografía no tiene una revisión IA válida.');
 let previous;
 try{previous=await reviewed.json()}catch{throw Error('La revisión IA no es válida.')}
 if(previous.version!==AI_VERSION||previous.etag!==etag||previous.key!==key)
   throw Error('La revisión IA ya no coincide con esta fotografía.');
 const current=await env.BUCKET.head(key);
 if(!current||current.etag!==etag)throw Error('La foto ha cambiado o ya se eliminó. Vuelve a analizar.');
 await env.BUCKET.delete(key);
 return {deleted:key};
}

async function listPhotos(env,prefix,cursor){
  const options={prefix,limit:PAGE_SIZE};if(cursor)options.cursor=cursor;
  const page=await env.BUCKET.list(options);
  return {files:page.objects.filter(f=>IMAGE_RE.test(f.key)&&sameFolder(f.key,prefix)).map(f=>({key:f.key,size:f.size,etag:f.etag})),nextCursor:page.truncated?page.cursor:null};
}
const escapeHtml=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PANEL=String.raw`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VCC · Fotos R2</title><style>
:root{--ink:#292420;--accent:#bd6345;--paper:#faf6f1;--line:#e7dcd2}*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.55 system-ui,Arial,sans-serif}
main{width:min(940px,calc(100% - 28px));margin:26px auto 70px}h1{font-size:28px;margin:0 0 6px}h2{font-size:18px;margin:0 0 8px}
p{margin:6px 0 14px}.muted{color:#675c54}.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px;margin:16px 0}
label{display:block;font-weight:650;margin:9px 0 4px}select,input[type=password],textarea,input[type=number]{width:100%;padding:12px;border-radius:8px;border:1px solid #cfc4ba;font:inherit;background:#fff}
button{border:0;border-radius:8px;padding:11px 15px;background:var(--accent);color:white;font:600 13px system-ui;cursor:pointer;margin:3px}
button.secondary{background:#4e4b48}button.danger{background:#a43f3b}button:disabled{opacity:.45;cursor:not-allowed}
.warning{border-left:3px solid var(--accent);padding-left:12px;color:#6b4a34}.small{font-size:12px}
pre{background:#f6f1eb;border:1px solid var(--line);padding:13px;overflow-wrap:anywhere;white-space:pre-wrap;max-height:300px;overflow:auto}
.tableWrap{overflow:auto;max-height:460px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{padding:10px 8px;border-bottom:1px solid #eee5de;text-align:left;vertical-align:top}th{position:sticky;top:0;background:white}td.path{overflow-wrap:anywhere;max-width:270px}
.photoThumb{display:block;width:126px;height:76px;object-fit:contain;border:1px solid var(--line);border-radius:7px;background:#faf6f1;margin:5px 0}
.tag{background:#edf4eb;color:#2c6935;border-radius:8px;padding:2px 7px}
</style></head><body><main>
<h1>Viajando con Cabeza · Fotos R2</h1>
<p class="muted">Procesa una carpeta completa o un día: detectar duplicados → aceptar → convertir a AVIF → eliminar JPG verificados.</p>
<section class="card"><h2>1. Introducir contraseña</h2>
<label for="token">ADMIN_TOKEN</label><input type="password" id="token" autocomplete="off" placeholder="Contraseña de administración">
<button id="browseBtn" onclick="browse()">Cargar todas las rutas disponibles</button></section>
<section class="card"><h2>2. Seleccionar carpeta</h2>
<label for="folder">Ruta del bucket R2</label><select id="folder" disabled onchange="loadFolder()"><option value="">Primero introduce la contraseña</option></select>
<p class="muted small">Si eliges suecia/dalarna, se incluyen todos los días interiores. Si eliges suecia/dalarna/dia-10, solo se incluyen los JPG de ese día. Las comparaciones de duplicados no se cruzan entre días o subcarpetas.</p>
<p id="folderSummary" class="muted"></p></section>
<section class="card"><h2>3. Detección de duplicados (opcional)</h2>
<p>Solo se inicia cuando pulses el botón. Compara JPG, WebP y AVIF con las 6 fotos anteriores y posteriores de la misma carpeta. Puedes detenerlo y retomarlo.</p>
<button id="scanBtn" disabled onclick="scanDuplicates()">Iniciar detección</button><button id="scanStopBtn" class="secondary" disabled onclick="stopProcess('scan')">Parar detección</button>
<p id="scanSummary" class="muted"></p>
<div class="row"><button type="button" class="secondary" id="selectAllBtn" disabled onclick="selectAllDuplicates(true)">Seleccionar todo</button><button type="button" class="secondary" id="selectNoneBtn" disabled onclick="selectAllDuplicates(false)">Deseleccionar todo</button><span id="selectionSummary" class="small muted">0 seleccionados</span></div>
<div id="duplicates" class="tableWrap"></div><p id="deleteProgress" class="muted" role="status" aria-live="polite"></p>
<p class="warning small">La detección compara JPG, WebP y AVIF, también versiones de una foto en distintos formatos. Revisa las fotos: si eliminas un WebP o AVIF enlazado desde la web, el enlace dejará de funcionar. El borrado es irreversible y NO crea copia de seguridad.</p>
<label><input type="checkbox" id="confirmDup" onchange="updateButtons()"> Confirmo que he revisado los JPG que deseo eliminar.</label>
<button id="removeBtn" class="danger" disabled onclick="removeDuplicates()">Eliminar duplicados seleccionados</button></section>
<section class="card"><h2>4. Convertir JPG a AVIF (independiente del paso 3)</h2>
<p>Calidad <b>85</b> · Brillo <b>1.12</b> · Contraste <b>0.984</b> · Saturación <b>1.008</b>. Resolución original.</p>
<p class="muted small">Puedes iniciar esta conversión directamente después de seleccionar la carpeta, sin analizar duplicados. El JPG se elimina solo tras verificar el AVIF correspondiente. Si paras, los restantes no se procesan hasta volver a iniciar.</p>
<button id="convertBtn" disabled onclick="convertAll()">Iniciar conversión a AVIF</button><button id="convertStopBtn" class="secondary" disabled onclick="stopProcess('convert')">Parar conversión</button>
<p id="convertSummary" class="muted" role="status" aria-live="polite"></p></section>
<section class="card"><h2>5. Selección inteligente VCC con IA</h2>
<p>La IA analiza calidad, atractivo, utilidad para contar el viaje y <b>dónde podría estar tomada cada foto</b>. Las ubicaciones son estimaciones, no geolocalización verificada.</p>
<label for="aiContext">Contexto del viaje o lugar (opcional, recomendado)</label>
<textarea id="aiContext" maxlength="180" rows="2" placeholder="Por ejemplo: Estocolmo, Gamla Stan, viaje por el casco antiguo."></textarea>
<label for="aiTarget">¿Cuántas fotografías quieres conservar?</label>
<input id="aiTarget" type="number" min="1" max="1000" value="50" onchange="renderAiResults()">
<label class="small"><input id="aiForce" type="checkbox"> Volver a analizar las fotos evaluadas (más uso de IA)</label>
<div><button id="aiBtn" disabled onclick="runAiSelection()">Analizar fotos con IA</button><button class="secondary" id="aiStopBtn" disabled onclick="stopProcess('ai')">Parar análisis</button><button class="secondary" id="aiCsvBtn" disabled onclick="downloadAiCsv()">Exportar selección CSV</button></div>
<label class="small"><input type="checkbox" id="confirmAiDelete" onchange="updateButtons()"> He revisado los descartes. Entiendo que borrar fotos utilizadas en la web puede romper sus enlaces.</label>
<button id="aiDeleteBtn" class="danger" disabled onclick="deleteAiRejected()">Eliminar descartadas (irreversible)</button>
<p id="aiDeleteStatus" class="muted small"></p>
<p id="aiSummary" class="muted" role="status" aria-live="polite">Selecciona una carpeta. Ninguna fotografía se elimina automáticamente.</p>
<div id="aiResults" class="tableWrap"></div>
<p class="warning small">Revisa especialmente las ubicaciones de confianza media o baja. No se borra nada de R2 ni se modifica la web.</p>
</section>
<section class="card"><h2>Estado y errores</h2><pre id="status">Introduce la contraseña para comenzar.</pre></section>
</main><script>
let currentPrefix='',files=[],scanFiles=[],scans=[],groups=[],removed=new Set(),scanReady=false,busy=false,stopped=false,activeMode='';
const previewUrls=new Map(),q=id=>document.getElementById(id);
function log(s){q('status').textContent=s+'\n'+q('status').textContent.slice(0,8500)}
async function api(payload){
 const token=q('token').value.trim();if(!token)throw Error('Introduce ADMIN_TOKEN.');
 const retryableModes=new Set(['list','folders','convert-delete','ai-review']);
 const maxAttempts=(payload.mode==='convert-delete'||payload.mode==='ai-review')?3:(retryableModes.has(payload.mode)?4:1);
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
 q('scanBtn').disabled=busy||!ready;
 q('scanStopBtn').disabled=!(busy&&activeMode==='scan')||stopped;
 q('removeBtn').disabled=busy||!ready||!scanReady||!groups.length||!q('confirmDup').checked||groups.every(g=>g.resolved);
 q('convertBtn').disabled=busy||!currentPrefix||!files.length;
 q('convertStopBtn').disabled=!(busy&&activeMode==='convert')||stopped;
 q('aiBtn').disabled=busy||!currentPrefix||!scanFiles.length;
 q('aiStopBtn').disabled=!(busy&&activeMode==='ai')||stopped;
 q('aiDeleteBtn').disabled=busy||!aiRows.length||!q('confirmAiDelete').checked;
 q('selectAllBtn').disabled=busy||!scanReady||!groups.length;
 q('selectNoneBtn').disabled=busy||!scanReady||!groups.length;
}
function lock(on,mode=''){
 busy=on;
 activeMode=on?mode:'';
 updateButtons();
}
function stopProcess(mode){
 if(!busy||activeMode!==mode)return;
 stopped=true;
 log(mode==='ai-delete'?'Deteniendo borrado después de la fotografía actual.':mode==='ai'?'Deteniendo análisis después de la imagen actual.':mode==='scan'?'Deteniendo detección después de la fotografía actual.':'Deteniendo conversión después del archivo actual.');
 updateButtons();
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
  currentPrefix=q('folder').value;files=[];scanFiles=[];scans=[];groups=[];removed.clear();scanReady=false;
   aiRows=[];aiEdited.clear();q('confirmAiDelete').checked=false;q('aiDeleteStatus').textContent='';q('aiResults').innerHTML='';q('aiSummary').textContent='Carpeta cargada. Puedes iniciar la selección inteligente.';
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

// Selección de fotografías con IA, diversidad y ubicación probable.
let aiRows=[],aiEdited=new Map();
function aiFilesForReview(){
 return scanFiles.filter(f=>!f.key.split('/').some(p=>p==='_preview'||p==='__vcc_dedup_backup__'));
}
function aiOrdered(){
 const remaining=[...aiRows],picked=[],seen=new Map();
 const target=Math.min(Math.max(1,Number(q('aiTarget').value)||50),remaining.length);
 while(remaining.length){
  let best=0,bestRank=-Infinity;
  for(let i=0;i<remaining.length;i++){
   const row=remaining[i],scene=(row.scene+'|'+row.place).toLowerCase();
   const rank=row.score-Math.min(26,(seen.get(scene)||0)*9);
   if(rank>bestRank){bestRank=rank;best=i}
  }
  const row=remaining.splice(best,1)[0];
  const scene=(row.scene+'|'+row.place).toLowerCase();
  seen.set(scene,(seen.get(scene)||0)+1);picked.push(row);
 }
 return {all:picked,target,selected:picked.filter((row,i)=>aiEdited.has(row.key)?aiEdited.get(row.key):i<target)};
}
function renderAiResults(){
 const container=q('aiResults'),data=aiOrdered();
 if(!aiRows.length){container.innerHTML='';q('aiCsvBtn').disabled=true;return}
 q('aiCsvBtn').disabled=false;
 const chosen=new Set(data.selected.map(x=>x.key));
 const cover=[...data.selected].sort((a,b)=>(b.cover*.55+b.score*.45)-(a.cover*.55+a.score*.45))[0];
 q('aiSummary').textContent=aiRows.length+' analizadas · '+chosen.size+' seleccionadas · '+(aiRows.length-chosen.size)+' no seleccionadas. Ningún archivo eliminado.';
 let html='<table><thead><tr><th>Conservar</th><th>Fotografía</th><th>Puntuación</th><th>Ubicación probable</th><th>Valor para el lector</th></tr></thead><tbody>';
 for(const item of data.all){
   const keep=chosen.has(item.key);
   html+='<tr><td><input type="checkbox" class="aiKeep" data-key="'+esc(item.key)+'" '+(keep?'checked':'')+'></td>'+
   '<td class="path"><img class="photoThumb" alt="" loading="lazy" src="'+item.thumbnail+'"><b>'+esc(item.key.split('/').pop())+'</b>'+
   (cover?.key===item.key?'<br><span class="tag">Portada sugerida</span>':'')+
   '<br><span class="small muted">'+esc(item.subject)+'</span></td>'+
   '<td><b>'+item.score+'/100</b><br><span class="small muted">Técnica '+item.technical+' · Belleza '+item.visual+' · Interés '+item.editorial+'</span></td>'+
   '<td><b>'+esc(item.place)+'</b><br><span class="small muted">Confianza '+esc(item.confidence)+' · Estimación IA</span></td>'+
   '<td>'+esc(item.reason)+'<br><span class="small muted">Alt: '+esc(item.alt)+'</span></td></tr>';
 }
 container.innerHTML=html+'</tbody></table>';
 for(const box of container.querySelectorAll('.aiKeep'))box.onchange=()=>{aiEdited.set(box.dataset.key,box.checked);renderAiResults()};
}
async function runAiSelection(){
 if(busy||!currentPrefix||!scanFiles.length)return;
 const photos=aiFilesForReview();
 if(photos.length>1000){log('Elige una subcarpeta de hasta 1000 imágenes.');return}
 if(!photos.length)return;
 const context=q('aiContext').value.trim().slice(0,180),force=q('aiForce').checked;
 if(!confirm('La IA analizará '+photos.length+' imágenes. Puede generar consumo de Workers AI. No eliminará ninguna fotografía. ¿Continuar?'))return;
 stopped=false;aiRows=[];aiEdited.clear();lock(true,'ai');q('aiResults').innerHTML='';
 const errors=[];let cached=0;
 try{
  for(let i=0;i<photos.length;i++){
   if(stopped)break;
   const f=photos[i];q('aiSummary').textContent='Analizando '+(i+1)+'/'+photos.length+' · '+f.key.split('/').pop()+' · Errores '+errors.length;
   try{
    const out=await api({mode:'ai-review',prefix:currentPrefix,key:f.key,etag:f.etag,context,force});
    if(out.key!==f.key||out.etag!==f.etag)throw Error('Resultado no correspondiente a la foto');
    if(out.cached)cached++;aiRows.push(out);
    if(aiRows.length%5===0||i===photos.length-1)renderAiResults();
   }catch(e){errors.push({key:f.key,error:e.message});log('IA: error '+f.key+': '+e.message)}
  }
  renderAiResults();
  const result=(stopped?'Análisis detenido. ':'Análisis completado. ')+aiRows.length+'/'+photos.length+' imágenes; '+cached+' reutilizadas; '+errors.length+' errores.';
  q('aiSummary').textContent=result+' Puedes revisar la selección. Ningún archivo eliminado.';
  log(result);
 }finally{lock(false)}
}
function downloadAiCsv(){
 if(!aiRows.length)return;
 const selected=new Set(aiOrdered().selected.map(x=>x.key));
 const heads=['archivo','seleccionada','puntuacion','tecnica','atractivo','interes','portada','lugar_probable','confianza','escena','asunto','motivo','texto_alt'];
 const rows=aiRows.map(x=>[x.key,selected.has(x.key)?'si':'no',x.score,x.technical,x.visual,x.editorial,x.cover,x.place,x.confidence,x.scene,x.subject,x.reason,x.alt]);
 const cell=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
 const csv='\uFEFF'+[heads,...rows].map(row=>row.map(cell).join(';')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;
 link.download='seleccion-vcc-'+currentPrefix.replace(/[^a-z0-9-]/gi,'-')+'.csv';
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}


async function deleteAiRejected(){
 if(busy||!aiRows.length||!q('confirmAiDelete').checked)return;
 const order=aiOrdered();
 const chosen=new Set(order.selected.map(x=>x.key));
 const candidates=order.all.filter(x=>!chosen.has(x.key));
 if(!candidates.length){q('aiDeleteStatus').textContent='No hay fotografías descartadas.';return}
 if(!confirm('Vas a eliminar definitivamente '+candidates.length+' imágenes de Cloudflare R2. Es posible que alguna esté enlazada desde tu web. NO hay copia de seguridad. ¿Deseas continuar?'))return;
 const typed=prompt('Escribe ELIMINAR para confirmar el borrado irreversible de '+candidates.length+' fotografías:');
 if(typed!=='ELIMINAR'){q('aiDeleteStatus').textContent='Eliminación cancelada.';return}
 stopped=false;lock(true,'ai-delete');q('confirmAiDelete').checked=false;
 let ok=0;const errors=[];
 try{
  for(let i=0;i<candidates.length;i++){
   if(stopped)break;
   const x=candidates[i];
   q('aiDeleteStatus').textContent='Eliminando '+(i+1)+'/'+candidates.length+': '+x.key.split('/').pop();
   try{
    const result=await api({mode:'ai-remove-rejected',prefix:currentPrefix,key:x.key,etag:x.etag,confirm:true});
    if(result.deleted!==x.key)throw Error('No se ha confirmado el borrado');
    ok++;
    aiRows=aiRows.filter(row=>row.key!==x.key);
    scanFiles=scanFiles.filter(f=>f.key!==x.key);
    files=files.filter(f=>f.key!==x.key);
    aiEdited.delete(x.key);
   }catch(e){errors.push({key:x.key,error:e.message});log('ERROR borrando '+x.key+': '+e.message)}
  }
  renderAiResults();
  q('aiDeleteStatus').textContent='Eliminadas '+ok+' fotografías; '+errors.length+' errores. '+(stopped?'Proceso detenido.':'')+' Las versiones preview no se eliminan.';
  log(q('aiDeleteStatus').textContent);
 }finally{lock(false)}
}

const dec=s=>{const t=atob(s),a=new Uint8Array(t.length);for(let i=0;i<t.length;i++)a[i]=t.charCodeAt(i);return a};
const MATCH_RADIUS=6;
// Memoria de 32x32 píxeles; sin descargar ni transformar fotos adicionales.
const visualCache=new WeakMap();
function visualData(photo){
 let data=visualCache.get(photo);
 if(data)return data;
 const rgb=dec(photo.rgb);
 if(rgb.length!==3072)throw Error('Huella visual incompleta');
 const lum=new Float32Array(1024);
 for(let i=0;i<1024;i++){
  const p=i*3;
  lum[i]=.2126*rgb[p]+.7152*rgb[p+1]+.0722*rgb[p+2];
 }
 data={rgb,lum};visualCache.set(photo,data);return data;
}
// Reutilitzar resultats de comparacions durant l'agrupació de triplicats i sèries.
const pairMatchCache=new WeakMap();
function compare(a,b){
 const cachedA=pairMatchCache.get(a);
 if(cachedA?.has(b))return cachedA.get(b);
 const cachedB=pairMatchCache.get(b);
 if(cachedB?.has(a))return cachedB.get(a);
 const result=compareCore(a,b);
 const cache=cachedA||new WeakMap();
 if(!cachedA)pairMatchCache.set(a,cache);
 cache.set(b,result);
 return result;
}
function compareCore(a,b){
 if(a.sha256===b.sha256&&a.size===b.size)return {ok:true,confidence:100,exact:true};
 const ratioA=a.width/a.height,ratioB=b.width/b.height;
 // Evita asociar fotografías con orientación o recorte muy diferentes.
 if(Math.abs(ratioA/ratioB-1)>.035)return {ok:false,confidence:0};
 const A=visualData(a),B=visualData(b);
 let best=null;
 // Compensar movimientos mínimos de la cámara (hasta 2 píxeles de 32).
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const xmin=Math.max(0,-dx),xmax=Math.min(32,32-dx);
  const ymin=Math.max(0,-dy),ymax=Math.min(32,32-dy);
  // Precomprovació lleugera: 1 de cada 16 píxels.
  // Només rebutja enquadraments clarament diferents, sense endurir
  // els paràmetres visuals del comparador complet.
  let qa=0,qb=0,qaa=0,qbb=0,qab=0,qn=0;
  for(let y=ymin;y<ymax;y+=4)for(let x=xmin;x<xmax;x+=4){
   const i=y*32+x,j=(y+dy)*32+x+dx;
   const va=A.lum[i],vb=B.lum[j];
   qa+=va;qb+=vb;qaa+=va*va;qbb+=vb*vb;qab+=va*vb;qn++;
  }
  if(qn>=36){
   const avga=qa/qn,avgb=qb/qn;
   const va=qaa-qn*avga*avga,vb=qbb-qn*avgb*avgb;
   if(va>5000&&vb>5000){
    const corrFast=(qab-qn*avga*avgb)/Math.sqrt(va*vb);
    if(corrFast<.12)continue;
   }
  }
  let sumA=0,sumB=0,aa=0,bb=0,ab=0,n=0;
  for(let y=ymin;y<ymax;y++)for(let x=xmin;x<xmax;x++){
   const i=y*32+x,j=(y+dy)*32+x+dx;
   const va=A.lum[i],vb=B.lum[j];
   sumA+=va;sumB+=vb;aa+=va*va;bb+=vb*vb;ab+=va*vb;n++;
  }
  const meanA=sumA/n,meanB=sumB/n,va=aa-n*meanA*meanA,vb=bb-n*meanB*meanB;
  const corr=(ab-n*meanA*meanB)/(Math.sqrt(va*vb)||1);
  if(corr<.84)continue;
  const shift=meanA-meanB;
  let diff=0,color=0,high=0,edge=0,edges=0;
  for(let y=ymin;y<ymax;y++)for(let x=xmin;x<xmax;x++){
   const i=y*32+x,j=(y+dy)*32+x+dx;
   const d=Math.abs(A.lum[i]-B.lum[j]-shift);
   diff+=d;if(d>30)high++;
   let p=3*i,q=3*j;
   color+=(Math.abs(A.rgb[p]-B.rgb[q])+Math.abs(A.rgb[p+1]-B.rgb[q+1])+Math.abs(A.rgb[p+2]-B.rgb[q+2]))/3;
   if(x+1<xmax){edge+=Math.abs((A.lum[i+1]-A.lum[i])-(B.lum[j+1]-B.lum[j]));edges++}
   if(y+1<ymax){edge+=Math.abs((A.lum[i+32]-A.lum[i])-(B.lum[j+32]-B.lum[j]));edges++}
  }
  const mae=diff/n,rgbMae=color/n,edgeMae=edge/(edges||1),highPct=high/n;
  // Más permisivo con diferencias de exposición y pequeños movimientos,
  // pero exige que también coincidan los detalles y la distribución de color.
  const plausible=corr>=.865&&mae<=33&&rgbMae<=62&&edgeMae<=37&&highPct<=.52&&Math.abs(shift)<=75;
  if(!plausible)continue;
  const strong=corr>=.965&&mae<=17&&rgbMae<=36&&edgeMae<=19&&highPct<=.22&&Math.abs(shift)<=46;
  const score=strong
   ? Math.min(99,Math.round(94+Math.max(0,corr-.965)*115+Math.max(0,17-mae)*.2))
   : Math.min(93,Math.max(80,Math.round(80+Math.max(0,corr-.865)*70+Math.max(0,33-mae)*.12)));
  const candidate={ok:true,confidence:score,exact:false,review:!strong,metrics:{corr:Number(corr.toFixed(4)),mae:Number(mae.toFixed(1)),offset:dx+','+dy}};
  if(!best||candidate.confidence>best.confidence||(candidate.confidence===best.confidence&&corr>best.metrics.corr))best=candidate;
  // Coincidència claríssima: evita revisar els altres desplaçaments.
  if(strong&&corr>=.985&&mae<=10&&edgeMae<=12)return candidate;
 }
 return best||{ok:false,confidence:0};
}

const better=(a,b)=>{const rank=x=>/\.avif$/i.test(x.key)?3:/\.webp$/i.test(x.key)?2:1;const ra=rank(a),rb=rank(b);if(ra!==rb)return ra>rb?a:b;const pa=a.width*a.height,pb=b.width*b.height;if(pa!==pb)return pa>pb?a:b;if(Math.abs(a.sharpness-b.sharpness)>.4)return a.sharpness>b.sharpness?a:b;if(a.size!==b.size)return a.size>b.size?a:b;return a.key.localeCompare(b.key)<=0?a:b};
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
 log('Comparadas hasta ±6 fotos por imagen. '+edges.length+
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
   '<td class="path"><img class="photoThumb" data-thumb-key="'+esc(g.keep.key)+'" alt="Se conserva">'+esc(g.keep.key)+' ('+g.keep.width+'×'+g.keep.height+')</td>'+
   '<td class="path"><img class="photoThumb" data-thumb-key="'+esc(p.remove.key)+'" alt="Duplicada">'+esc(p.remove.key)+' ('+p.remove.width+'×'+p.remove.height+')</td>'+
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
  // Solo R2 entrega el JPG como stream: no se hace transformación con IMAGES.
  const token=q('token').value.trim();
  const response=await fetch('/api/process',{
    method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
    body:JSON.stringify({mode:'photo-stream',prefix:currentPrefix,key:f.key,etag:f.etag}),
    cache:'no-store'
  });
  if(!response.ok){
    const message=(await response.text()).replace(/<[^>]+>/g,' ').slice(0,200);
    throw Error('HTTP '+response.status+': '+message);
  }
  const blob=await response.blob();
  const dimensions=/\.jpe?g$/i.test(f.key)?jpegDimensions(await blob.slice(0,Math.min(blob.size,524288)).arrayBuffer()):null;
  let bitmap;
  try{
    bitmap=await createImageBitmap(blob,{resizeWidth:160,resizeQuality:'high'});
    const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)throw Error('El navegador no permite analizar imágenes');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,32,32);
    ctx.drawImage(bitmap,0,0,32,32);
    const rgba=ctx.getImageData(0,0,32,32).data;
    const rgb=new Uint8Array(32*32*3);
    for(let p=0;p<1024;p++){
      rgb[p*3]=rgba[p*4];rgb[p*3+1]=rgba[p*4+1];rgb[p*3+2]=rgba[p*4+2];
    }
    let sharpness=0,pairs=0;
    const lum=i=>.2126*rgb[i]+.7152*rgb[i+1]+.0722*rgb[i+2];
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){
      const i=(y*32+x)*3;
      if(x<31){sharpness+=Math.abs(lum(i)-lum(i+3));pairs++}
      if(y<31){sharpness+=Math.abs(lum(i)-lum(i+96));pairs++}
    }
    // Miniaturas pequeñas y locales para revisar los duplicados sin pedir
    // nuevas transformaciones pesadas al Worker.
    const preview=document.createElement('canvas');
    preview.width=144;preview.height=96;
    const pc=preview.getContext('2d');
    pc.fillStyle='#fff';pc.fillRect(0,0,144,96);
    const w0=dimensions?.width||bitmap.width,h0=dimensions?.height||bitmap.height;
    const ratio=Math.min(144/w0,96/h0);
    const w=w0*ratio,h=h0*ratio;
    // Miniatura nítida desde la misma decodificación, sin segunda carga de R2.
    pc.drawImage(bitmap,(144-w)/2,(96-h)/2,w,h);
    previewUrls.set(f.key,preview.toDataURL('image/jpeg',.72));
    let binary='';
    for(let i=0;i<rgb.length;i++)binary+=String.fromCharCode(rgb[i]);
    return {key:f.key,etag:f.etag,size:f.size,width:dimensions?.width||bitmap.width,
      height:dimensions?.height||bitmap.height,sharpness:Number((sharpness/pairs).toFixed(3)),
      sha256:'etag:'+f.etag+':'+f.size,rgb:btoa(binary)};
  }finally{
    bitmap?.close();
  }
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
   if(old&&old.etag===f.etag)done.set(f.key,old);
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
async function convertAll(){
 if(busy||!currentPrefix||!files.length)return;
 if(!confirm('Se convertirán los JPG de la carpeta seleccionada a AVIF (calidad 85). Cada JPG se eliminará SOLO después de verificar el AVIF guardado. ¿Continuar?'))return;
 stopped=false;lock(true,'convert');
 const pending=[...files].filter(f=>!removed.has(f.key));
 const total=pending.length;
 // Els JPG de 5–8 MB saturaven el Worker si es convertien 2–3 simultàniament.
 const maxParallel=1;
 let next=0,processed=0,deleted=0,reused=0,allowedWorkers=maxParallel;
 const convertedKeys=new Set(),errors=[],resourceRetry=[];
 const resourceError=e=>/HTTP\s*(?:429|502|503|504|520|522|524)\b|resource limits|exceeded memory|1102/i.test(String(e?.message||e));
 const show=(name='')=>{
  q('convertSummary').textContent=
    'Procesados '+processed+'/'+total+
    ' · JPG eliminados tras verificar AVIF '+deleted+
    ' · Errores '+errors.length+
    ' · Conversiones en paralelo '+allowedWorkers+
    (resourceRetry.length?' · Pendientes de reintento '+resourceRetry.length:'')+
    (name?' · '+name:'');
 };
 show('Iniciando...');
 async function convertFile(f,allowRetry){
  try{
   const result=await api({mode:'convert-delete',prefix:currentPrefix,key:f.key});
   if(result.deleted){
    deleted++;convertedKeys.add(f.key);
    if(result.reusedVerifiedAvif)reused++;
    return;
   }
   if(result.skipped&&result.reason==='JPG ausente'){
    convertedKeys.add(f.key);
    return;
   }
   errors.push({key:f.key,message:result.reason||'Respuesta sin confirmación de borrado'});
  }catch(e){
   if(allowRetry&&resourceError(e)){
    // Error de recursos: disminuir la carga y volver a intentar una sola vez.
    allowedWorkers=1;
    resourceRetry.push(f);
    log('Cloudflare ha limitado la conversión de '+f.key+
        '. Reduciendo a 1 tarea simultánea; se reintentará cuando terminen las actuales.');
   }else{
    errors.push({key:f.key,message:e.message});
    log('ERROR '+f.key+': '+e.message+'. JPG conservado salvo AVIF verificado.');
   }
  }
 }
 async function queue(workerId){
  while(!stopped){
   if(workerId>=allowedWorkers)return;
   const index=next++;
   if(index>=total)return;
   const f=pending[index];
   show('Convirtiendo '+f.key);
   await convertFile(f,true);
   processed++;
   show();
   // Petita pausa perquè Cloudflare alliberi memòria abans del següent JPG.
    if(processed%3===0&&next<total)await new Promise(resolve=>setTimeout(resolve,350));
  }
 }
 try{
  await Promise.all(Array.from(
    {length:Math.min(maxParallel,total)},(_,i)=>queue(i)));
  if(resourceRetry.length&&!stopped){
   const retry=[...resourceRetry];resourceRetry.length=0;
   allowedWorkers=1;
   log('Reintentando '+retry.length+' conversión(es) limitadas por Cloudflare, de una en una.');
   for(let i=0;i<retry.length;i++){
    if(stopped)break;
    const f=retry[i];
    show('Reintentando '+(i+1)+'/'+retry.length+': '+f.key);
    await convertFile(f,false);
   }
  }
  const remaining=total-deleted;
  const result=(stopped?'Conversión detenida':'Conversión terminada')+
   ': '+deleted+' JPG eliminados tras comprobar AVIF de '+total+
   ' iniciales; '+reused+' AVIF existentes reutilizados; '+
   errors.length+' errores; '+Math.max(0,total-processed)+' pendientes de iniciar.';
  q('convertSummary').textContent=result;
  log(result);
  if(errors.length)log('JPG con errores: '+errors.map(e=>e.key+' ('+e.message+')').join(' | '));
 }finally{
  // Guardar los JPG restantes en la selección actual para permitir reanudar.
  if(convertedKeys.size){
   files=files.filter(f=>!convertedKeys.has(f.key));
   scanFiles=scanFiles.filter(f=>!convertedKeys.has(f.key));
   scans=[];groups=[];scanReady=false;
   q('duplicates').innerHTML='';
   q('confirmDup').checked=false;
   q('selectionSummary').textContent='0 seleccionados';
   q('scanSummary').textContent='La carpeta ha cambiado. Vuelve a iniciar la detección si quieres comparar las fotos restantes.';
   q('folderSummary').textContent=files.length+' JPG pendientes. Vuelve a seleccionar la carpeta para incluir los AVIF recién creados.';
  }
  lock(false);
 }
}
</script></body></html>`;

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==='GET'&&url.pathname==='/')return new Response(PANEL,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-ancestors 'none'"}});
    if(request.method!=='POST'||url.pathname!=='/api/process')return json({error:'Ruta no encontrada'},404);
    if(!validateAuth(request,env))return json({error:'No autorizado'},401);
    try{
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
      if(mode==='convert-delete')return json(await convertAndDeleteOne(env,input.key,prefix));
       if(mode==='ai-review')return json(await aiReviewOne(env,input.key,prefix,input.etag,input.context,input.force===true));
       if(mode==='ai-remove-rejected')return json(await removeAiRejectedOne(env,input.key,prefix,input.etag,input.confirm));

      return json({error:'Operación inválida'},400);
    }catch(error){console.error('VCC processing error',error);return json({error:String(error?.message||error)},400)}
  }
};