// VCC build-time translation worker. Only the quality GitHub workflow may call it.
const MODEL='@cf/meta/m2m100-1.2b';
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
    p.workflow_ref!==WORKFLOW||!['push','workflow_dispatch'].includes(p.event_name)||
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
export default {async fetch(req,env){
 const url=new URL(req.url);
 if(url.pathname==='/health'&&req.method==='GET')return json({ok:true,service:'vcc-en-translator',model:MODEL,mode:'build-time'});
 if(url.pathname!=='/translate'||req.method!=='POST')return json({error:'not-found'},404);
 if(!await verified(req))return json({error:'unauthorized'},401);
 if(!env.AI)return json({error:'ai-binding-unavailable'},503);
 if(!/^application\/json\b/i.test(req.headers.get('content-type')||''))return json({error:'json-required'},415);
 if(Number(req.headers.get('content-length')||0)>4000)return json({error:'body-too-large'},413);
 let b;try{b=await req.json();}catch{return json({error:'invalid-json'},400);}
 if(typeof b?.text!=='string'||!b.text.trim()||b.text.length>900||
    b.source_lang!=='es'||b.target_lang!=='en')return json({error:'invalid-input'},400);
 try{
   const result=await env.AI.run(MODEL,{text:b.text,source_lang:'es',target_lang:'en'});
   const translated=result?.translated_text?.trim();
   if(!translated)return json({error:'empty-response'},502);
   return json({translated_text:translated,source_lang:'es',target_lang:'en',model:MODEL});
 }catch{return json({error:'inference-unavailable',retryable:true},503);}
}};
