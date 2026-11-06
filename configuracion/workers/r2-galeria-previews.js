/**
 * VCC – Galeries ràpides WebP / AVIF.
 * GET /__vcc_preview/{mini|visor}/destinos/.../foto.{avif|webp}
 * Les variants es generen a la primera petició i es desen al mateix bucket R2.
 * La URL original no es modifica ni es reencoda.
 */
const PREFIX = '/__vcc_preview/';
const OPTIONS = { mini: {width: 480, quality: 72}, visor: {width: 1800, quality: 82} };
const CACHE = 'public, max-age=604800, stale-while-revalidate=86400';
function imageResponse(bytes, type) {
  return new Response(bytes, {status:200, headers:{'Content-Type':type, 'Cache-Control':CACHE, 'X-Content-Type-Options':'nosniff'}});
}
export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status:405});
    const path = new URL(request.url).pathname;
    if (!path.startsWith(PREFIX)) return new Response('Not found', {status:404});
    const suffix = path.slice(PREFIX.length);
    const match = suffix.match(/^(mini|visor)\/(destinos\/[a-z0-9_/-]+\/[a-z0-9_-]+\.(webp|avif))$/i);
    if (!match || suffix.includes('//')) return new Response('Invalid image path', {status:400});
    const [,variant,sourceKey,,extension] = match;
    const i=sourceKey.lastIndexOf('/');
    const previewKey=sourceKey.slice(0,i+1)+'_preview/'+variant+'/'+sourceKey.slice(i+1);
    const type=extension.toLowerCase()==='avif'?'image/avif':'image/webp';
    try {
      const cached = await env.BUCKET.get(previewKey);
      if (cached) return imageResponse(request.method === 'HEAD' ? null : cached.body, type);
      if (request.method === 'HEAD') return new Response(null,{status:404});
      const source = await env.BUCKET.get(sourceKey);
      if (!source) return new Response('Image not found',{status:404});
      if (source.size > 20*1024*1024) return new Response('Image too large',{status:413});
      const spec=OPTIONS[variant];
      const optimized=await env.IMAGES.input(source.body)
        .transform({width:spec.width, fit:'scale-down'})
        .output({format:type, quality:spec.quality});
      const response=optimized.response();
      if (!response.ok) throw new Error('Image transform: '+response.status);
      const bytes=await response.arrayBuffer();
      if (!bytes.byteLength) throw new Error('Empty image result');
      await env.BUCKET.put(previewKey, bytes, {
        httpMetadata:{contentType:type,cacheControl:CACHE},
        customMetadata:{sourceEtag:source.etag, previewVariant:variant}
      });
      return imageResponse(bytes,type);
    } catch (error) {
      console.error('VCC preview processing failed', sourceKey, String(error));
      // Fail safely: the original image remains accessible, but only if the optimizer fails.
      return Response.redirect('https://img.viajandoconcabeza.com/'+sourceKey,302);
    }
  }
};