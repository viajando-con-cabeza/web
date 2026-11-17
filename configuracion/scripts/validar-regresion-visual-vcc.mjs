/**
 * VCC · Prova de regressió visual real, sense alterar producció.
 * Compara en Chromium la branca quality amb el punt visual de referència.
 * Execució: CI amb Playwright + pixelmatch + pngjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';

const BASE=process.env.VCC_VISUAL_BASE||'http://127.0.0.1:4173';
const CANDIDATE=process.env.VCC_VISUAL_CANDIDATE||'http://127.0.0.1:4174';
const out=process.env.VCC_VISUAL_OUTPUT||'/tmp/vcc-visual-report';
const approved=JSON.parse(fs.readFileSync('configuracion/datos/publicacion-vcc.json','utf8')).approved;
const viewports=[
 {name:'desktop',width:1440,height:900},
 {name:'tablet',width:820,height:1100},
 {name:'mobile',width:390,height:844}
];
const maxRatio=Number(process.env.VCC_PIXEL_DIFF_LIMIT||'0.006');
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const failures=[],results=[];
fs.mkdirSync(out,{recursive:true});
const stablePath=file=>file==='index.html'?'/':file.endsWith('/index.html')?'/'+file.slice(0,-10):'/'+file;
const settle=async page=>{
 await page.evaluate(async()=>{
   try{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))])}catch{}
 }).catch(()=>{});
 await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}'}).catch(()=>{});
 await page.waitForTimeout(220);
};
const grab=async(origin,route,viewport)=>{
 const page=await browser.newPage({viewport,deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light',locale:'es-ES'});
 const badLocal=[];
 page.on('response',resp=>{
   if(resp.status()>=400&&resp.url().startsWith(origin))badLocal.push(resp.status()+' '+resp.url().replace(origin,''));
 });
 try{
   await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:22000});
   await settle(page);
   const snapshot=await page.evaluate(()=>{
     const selectors=['h1','h2','header','main','nav','.vcc-guide-hero-copy','.country-hero-card','.st-card','.country-facts','.st-facts','.vcc-editorial-heading','.vcc-card-collection','.vcc-unified-subheader','footer'];
     const rows=[];
     for(const selector of selectors){
       for(const elem of [...document.querySelectorAll(selector)].slice(0,5)){
         const box=elem.getBoundingClientRect(),css=getComputedStyle(elem);
         rows.push({selector,tag:elem.tagName,
           text:(elem.textContent||'').replace(/\s+/g,' ').trim().slice(0,70),
           rect:[box.x,box.y,box.width,box.height].map(n=>Math.round(n*2)/2),
           css:[css.fontFamily,css.fontSize,css.fontWeight,css.lineHeight,css.color,css.backgroundColor,
                css.marginTop,css.marginBottom,css.paddingTop,css.paddingBottom,
                css.display,css.gap,css.gridTemplateColumns]});
       }
     }
     const clean=(document.querySelector('main')?.innerText||document.body.innerText||'').replace(/\s+/g,' ').trim();
     return {title:document.title,lang:document.documentElement.lang,
       textHash:clean,css:rows,localImages:[...document.querySelectorAll('img')].map(img=>img.getAttribute('src'))};
   });
   const screenshot=await page.screenshot({animations:'disabled',type:'png',timeout:12000});
   return {snapshot,screenshot,badLocal};
 }finally{await page.close();}
};
let index=0;
for(const file of approved){
 for(const vp of viewports){
   index++;
   const route=stablePath(file),label=file.replace(/[^\w-]/g,'_')+'-'+vp.name;
   try{
     const a=await grab(BASE,route,vp),b=await grab(CANDIDATE,route,vp);
     const pa=PNG.sync.read(a.screenshot),pb=PNG.sync.read(b.screenshot);
     if(pa.width!==pb.width||pa.height!==pb.height)throw Error('PNG mides diferents');
     const dif=new PNG({width:pa.width,height:pa.height});
     const count=pixelmatch(pa.data,pb.data,dif.data,pa.width,pa.height,
       {threshold:0.15,includeAA:false});
     const ratio=count/(pa.width*pa.height);
     const delta={ratio:Number(ratio.toFixed(6)),textSame:a.snapshot.textHash===b.snapshot.textHash,
       layoutSame:JSON.stringify(a.snapshot.css)===JSON.stringify(b.snapshot.css),
       imagesSame:JSON.stringify(a.snapshot.localImages)===JSON.stringify(b.snapshot.localImages),
       newBroken:b.badLocal.filter(x=>!a.badLocal.includes(x))};
     const failed=ratio>maxRatio||!delta.textSame||!delta.layoutSame||!delta.imagesSame||delta.newBroken.length>0;
     results.push({page:file,viewport:vp.name,...delta,failed});
     if(failed){
       failures.push({page:file,viewport:vp.name,...delta});
       fs.writeFileSync(path.join(out,label+'-diff.png'),PNG.sync.write(dif));
       fs.writeFileSync(path.join(out,label+'-base.png'),a.screenshot);
       fs.writeFileSync(path.join(out,label+'-quality.png'),b.screenshot);
       fs.writeFileSync(path.join(out,label+'-styles.json'),JSON.stringify({base:a.snapshot,quality:b.snapshot},null,2));
     }
     console.log((failed?'DIFF':'OK')+' '+String(index).padStart(2,'0')+'/'+(approved.length*viewports.length)+' '+file+' '+vp.name+' pixel='+Math.round(ratio*10000)/100+'%');
   }catch(e){
     failures.push({page:file,viewport:vp.name,error:String(e)});
     console.error('ERROR VISUAL '+file+' '+vp.name+' '+e);
   }
 }
}
await browser.close();
const summary={reference:process.env.VCC_VISUAL_BASE_SHA||'unknown',approved:approved.length,
  viewportCount:viewports.length,comparisons:results.length,failed:failures.length,maxRatio,failures,results};
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(summary,null,2));
console.log('VCC VISUAL RESULT:',JSON.stringify({comparisons:results.length,failed:failures.length,failures:failures.slice(0,15)}));
if(failures.length)process.exitCode=1;
