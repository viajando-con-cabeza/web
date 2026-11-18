// VCC build-time translation worker. Only the quality GitHub workflow may call it.
const MODEL='@cf/google/gemma-4-26b-a4b-it';
const ISS='https://token.actions.githubusercontent.com';
const AUD='vcc-en-translator-quality';
const WORKFLOW='viajando-con-cabeza/web/.github/workflows/quality.yml@refs/heads/quality';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const bytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));
const decode=s=>JSON.parse(new TextDecoder().decode(bytes(s)));
let jwks=null,expire=0;
async function verified(req){
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer '))return false;
 const parts=auth.slice(7).split('.');
 if(parts.length!==3||parts.some(x=>x.length>12000))return false;
 let h,p;try{h=decode(parts[0]);p=decode(parts[1]);}catch{return false;}
 const now=Math.floor(Date.now()/1000);
 if(h.alg!=='RS256'||!h.kid||p.iss!==ISS||p.aud!==AUD||
    p.repository!=='viajando-con-cabeza/web'||p.ref!=='refs/heads/quality'||
    p.workflow_ref!==WORKFLOW||!['push','workflow_dispatch','schedule'].includes(p.event_name)||
    !Number.isFinite(p.exp)||!Number.isFinite(p.iat)||p.exp<=now||
    p.iat>now+60||p.iat<now-900)return false;
 if(!jwks||Date.now()>expire){
   const r=await fetch(ISS+'/.well-known/jwks',{cf:{cacheTtl:3600}});
   if(!r.ok)return false;
   const j=await r.json();if(!Array.isArray(j.keys))return false;
   jwks=j.keys;expire=Date.now()+900000;
 }
 const k=jwks.find(x=>x.kid===h.kid&&x.kty==='RSA'&&x.use==='sig');
 if(!k)return false;
 try{
   const key=await crypto.subtle.importKey('jwk',k,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
   return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
 }catch{return false;}
}
const SYSTEM=[
 'You translate a travel blog professionally from Spanish into idiomatic, natural international English.',
 'Return only valid JSON of the form {"translations":["...", "..."]}, with exactly one translated string per input in the original order.',
 'Never summarize, remove details, add claims, make up destinations, or invent facts.',
 'The brand Viajando con Cabeza and initials VCC must remain EXACTLY unchanged.',
 'Place names: Estocolmo = Stockholm, Suecia = Sweden, Gotemburgo = Gothenburg,',
 'Roma = Rome, Alemania = Germany. Do NOT confuse Stockholm with New York.',
 'Preserve all numbers, dates, currencies, percentages, prices, product names, photo identifiers, HTML entities and place names.',
 'Short input labels should become short natural English UI labels. Use English travel SEO phrasing where it fits.',
 'Do not produce code fences, commentary, markdown, or explanations. Your answer is JSON only.'
].join(' ');
const parseBatch=(result,n)=>{
 const raw=result?.choices?.[0]?.message?.content||result?.response||result?.result||'';
 const clean=String(raw).trim().replace(/^\\x60{3}(?:json)?\s*/i,'').replace(/\s*\\x60{3}$/,'');
 let parsed;
 try{parsed=JSON.parse(clean);}
 catch{
  const start=clean.indexOf('{'),end=clean.lastIndexOf('}');
  if(start<0||end<start)throw new Error('invalid-json');
  parsed=JSON.parse(clean.slice(start,end+1));
 }
 const translations=Array.isArray(parsed)?parsed:parsed?.translations;
 if(!Array.isArray(translations)||translations.length!==n||
    translations.some(t=>typeof t!=='string'||!t.trim()||t.length>7500))
    throw new Error('invalid-translation-count');
 return translations.map(t=>t.trim());
};
export default {async fetch(req,env){
 const url=new URL(req.url);
 if(url.pathname==='/health'&&req.method==='GET')
   return json({ok:true,service:'vcc-en-translator',model:MODEL,mode:'build-time-batch',version:2});
 const single=url.pathname==='/translate';
 const batch=url.pathname==='/translate-batch';
 if((!single&&!batch)||req.method!=='POST')return json({error:'not-found'},404);
 if(!await verified(req))return json({error:'unauthorized'},401);
 if(!env.AI)return json({error:'ai-binding-unavailable'},503);
 if(!/^application\/json\b/i.test(req.headers.get('content-type')||''))return json({error:'json-required'},415);
 if(Number(req.headers.get('content-length')||0)>16000)return json({error:'body-too-large'},413);
 let b;try{b=await req.json();}catch{return json({error:'invalid-json'},400);}
 const texts=single?[b?.text]:b?.texts;
 if(!Array.isArray(texts)||!texts.length||texts.length>20||
    b?.source_lang!=='es'||b?.target_lang!=='en'||
    texts.some(t=>typeof t!=='string'||!t.trim()||t.length>3500)||
    texts.reduce((n,t)=>n+t.length,0)>6500)return json({error:'invalid-input'},400);
 try{
   const max_tokens=Math.min(4096,Math.max(500,Math.ceil(texts.reduce((n,t)=>n+t.length,0)*0.82)+450));
   const result=await env.AI.run(MODEL,{
     messages:[{role:'system',content:SYSTEM},{role:'user',content:JSON.stringify({texts})}],
     temperature:0,max_tokens,chat_template_kwargs:{thinking:false}
   });
   const translations=parseBatch(result,texts.length);
   return json(single?{translated_text:translations[0],model:MODEL}:
     {translations,source_lang:'es',target_lang:'en',model:MODEL});
 }catch(e){
   return json({error:e?.message?.startsWith('invalid-')?e.message:'inference-unavailable',retryable:true},503);
 }
}};
