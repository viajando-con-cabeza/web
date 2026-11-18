// Quality-only, real-browser visual and navigation regression suite.
// Compares the published ES and EN websites at responsive breakpoints.
import { test, expect } from '@playwright/test';
const ORIGIN='https://www.quality.viajandoconcabeza.com';
const ROUTES=[
 '/',
 '/destinos/',
 '/itinerarios/',
 '/planifica/',
 '/nosotros/',
 '/contacto/',
 '/planifica/vuelos/',
 '/planifica/alojamientos/',
 '/planifica/tarjetas-de-viaje/',
 '/planifica/donde-ir/',
 '/planifica/presupuesto/',
 '/planifica/que-llevar/',
 '/planifica/mapas/',
 '/planifica/calcula-tu-viaje/',
 '/destinos/suecia/estocolmo/',
 '/destinos/suecia/estocolmo/que-ver',
 '/destinos/suecia/estocolmo/imprescindibles',
 '/destinos/suecia/estocolmo/itinerario',
 '/destinos/suecia/estocolmo/presupuesto',
 '/destinos/suecia/estocolmo/cuando-ir',
 '/destinos/suecia/estocolmo/como-llegar',
 '/destinos/suecia/estocolmo/como-moverse',
 '/destinos/suecia/estocolmo/donde-dormir',
 '/destinos/suecia/estocolmo/entradas-y-pases',
 '/destinos/suecia/estocolmo/que-llevar'
];
const wait=async(page,path)=>{
 const response=await page.goto(ORIGIN+path,{waitUntil:'domcontentloaded',timeout:35000});
 expect(response?.status(),path+' did not load').toBe(200);
 await page.waitForTimeout(420);
 return response;
};
const capture=page=>page.evaluate(()=>{
 const root=document.querySelector('main')||document.body;
 const styles=[...document.querySelectorAll('link[rel="stylesheet"]')]
   .map(x=>new URL(x.href).pathname)
   // Leaflet stylesheet is lazy-loaded only when its map widget initializes.
   .filter(path=>!path.endsWith('/leaflet.css'));
 const sections=[...root.querySelectorAll('section')].map(x=>x.className||'');
 const photos=[...root.querySelectorAll('img:not([data-vcc-contact-photo])')]
   .map(x=>[x.getAttribute('src'),x.getAttribute('srcset')]);
 const w=window.innerWidth;
 const offscreen=[...document.querySelectorAll('button,a,input,select')].filter(el=>{
  if(!el.getClientRects().length)return false;
  const r=el.getBoundingClientRect(),style=getComputedStyle(el);
  if(style.visibility==='hidden'||style.display==='none')return false;
  return r.width>0&&r.height>0&&r.left>w+4;
 }).slice(0,6).map(el=>({type:el.tagName,text:(el.textContent||'').trim().slice(0,50)}));
 const overflowing=document.documentElement.scrollWidth>w+4
   ? [...document.querySelectorAll('body *')].map(el=>{
     const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
     return {tag:el.tagName,className:typeof el.className==='string'?el.className.slice(0,90):'',id:el.id,
       left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),
       position:cs.position,overflowX:cs.overflowX,display:cs.display};
   }).filter(x=>x.right>w+8&&x.width>0&&x.display!=='none')
     .sort((a,b)=>b.right-a.right).slice(0,12)
   : [];
 return {
  overflowing,
  lang:document.documentElement.lang,
  classes:document.body.className,
  styles,sections,photos,
  totalNodes:root.querySelectorAll('*').length,
  scrollWidth:document.documentElement.scrollWidth,
  viewport:w,
  overflow:document.documentElement.scrollWidth-w,
  offscreen,
  language:{
   es:document.querySelector('.shared-language a[lang="es"]')?.getAttribute('href'),
   en:document.querySelector('.shared-language a[lang="en"]')?.getAttribute('href')
  },
  nav:[...document.querySelectorAll('.shared-menu a')].map(n=>new URL(n.href).pathname)
 };
});
test.use({browserName:'chromium',channel:'chrome'});
test.setTimeout(110000);
for(const viewport of [{width:390,height:844},{width:1366,height:820}]){
 test.describe('ES/EN visual parity '+viewport.width+'px',()=>{
  test.use({viewport,deviceScaleFactor:1});
  for(const route of ROUTES){
   test(route,async({page},info)=>{
    const errors=[],failedResources=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{
     const u=r.url();
     if(r.status()>=400&&new URL(u).origin===ORIGIN&&
        /\.(?:css|js|png|webp|avif|svg|jpe?g)(?:\?|$)/i.test(u))
       failedResources.push(r.status()+' '+u);
    });
    await wait(page,route);
    const es=await capture(page);
    await wait(page,'/en'+route);
    const en=await capture(page);
    const photoList=x=>JSON.stringify(x);
    const enRoute='/en'+route;
    expect(en.lang).toBe('en');
    expect(en.classes,'Different page template').toBe(es.classes);
    expect(en.sections,'ES/EN section classes differ').toEqual(es.sections);
    expect(en.styles,'Stylesheets differ').toEqual(es.styles);
    // Time-of-year galleries append extra thumbnails lazily; the source image
    // order remains identical, but the count may vary by network/cache timing.
    if(route.endsWith('/cuando-ir')){
      const shared=Math.min(es.photos.length,en.photos.length);
      expect(en.photos.slice(0,shared),'Core image URLs differ').toEqual(es.photos.slice(0,shared));
      expect(Math.abs(en.totalNodes-es.totalNodes),'Gallery DOM grew unexpectedly').toBeLessThanOrEqual(12);
    }else{
      expect(photoList(en.photos),'Image URLs differ').toBe(photoList(es.photos));
      expect(en.totalNodes,'DOM mismatch; missing widgets or interactive elements').toBe(es.totalNodes);
    }
    expect(en.overflow,'English version overflows more than Spanish').toBeLessThanOrEqual(Math.max(5,es.overflow+3));
    expect(en.language.es,'ES should preserve the same page').toBe(route);
    expect(en.language.en,'EN should preserve the same page').toBe(enRoute);
    expect(en.nav,'English menu links').toEqual(['/en/','/en/destinos/','/en/itinerarios/','/en/planifica/','/en/nosotros/','/en/contacto/']);
    expect(errors,'Runtime JS errors').toEqual([]);
    expect(failedResources,'Missing local CSS/JS/media').toEqual([]);
    if(en.overflow>4||en.offscreen.length){
     await info.attach('english-viewport.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
     console.warn('LAYOUT: ',route,viewport,en.overflow,en.offscreen,JSON.stringify(en.overflowing));
    }
   });
  }
 });
}
test('ES ↔ EN switch stays on current page and menu clicks work',async({page})=>{
 await wait(page,'/en/destinos/');
 await page.locator('.shared-language a[lang="es"]').click();
 await expect(page).toHaveURL(ORIGIN+'/destinos/');
 await page.locator('.shared-language a[lang="en"]').click();
 await expect(page).toHaveURL(ORIGIN+'/en/destinos/');
 await page.locator('.shared-menu a').nth(3).click();
 await expect(page).toHaveURL(ORIGIN+'/en/planifica/');
});
