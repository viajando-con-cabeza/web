/**
 * VCC · Contracte d'escalabilitat de destinacions, disseny i idiomes.
 * Auditoria local, sense xarxa ni dependències, sense tocar cap HTML.
 * --strict: falla només si es vulneren les fonts de veritat.
 * --json: retorna un resum estructurat per a CI/n8n.
 */
import fs from "node:fs";
import path from "node:path";
import {ROOT, approvedFiles, listSiteHtml} from "./lib/publicacion-vcc.mjs";

const strict=process.argv.includes("--strict");
const asJson=process.argv.includes("--json");
const errors=[];
const exists=file=>fs.existsSync(path.join(ROOT,file));
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const json=file=>JSON.parse(read(file));
const check=(ok,message)=>{if(!ok)errors.push(message)};
const countries=json("configuracion/datos/paises-vcc.json");
const templates=json("configuracion/datos/plantilles-vcc.json");
const locales=json("configuracion/datos/idiomas-vcc.json");
const publication=json("configuracion/datos/publicacion-vcc.json");
const manifest=json("configuracion/datos/compilacion-css-vcc.json");
const continent=new Set(["europa","america","asia","africa","oceania"]);
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
check(countries.version===1,"Versió de metadades de països desconeguda");
check(templates.version===1,"Versió de plantilles desconeguda");
check(locales.version===1,"Versió del contracte de traducció desconeguda");
check(locales.source==="es" && locales.locales?.es?.active===true,
  "El castellà ha de continuar sent la font editorial original");
check(locales.locales?.en?.prefix==="/en/",
  "La ruta anglesa ha de tenir el prefix /en/");
if(locales.locales?.en?.active){
  check(locales.translation?.status==="active" &&
    locales.translation?.reviewBeforeIndexing===true,
    "L'anglès només es pot activar quan el pipeline existeixi i les traduccions passin revisió");
} else {
  // Pilot d'IA pot generar només memòria ES→EN a Quality:
  // mai no activa /en/ ni l'indexació mentre no es validin HTML, JS i SEO.
  const status=locales.translation?.status;
  check(["planned-not-deployed","pilot-translation-memory-only"].includes(status),
    "La traducció inactiva ha de ser planned o un pilot segur");
  if(status==="pilot-translation-memory-only")
    check(locales.translation?.publication==="disabled-until-html-js-seo-review" &&
      locales.translation?.englishIndexing==="noindex-until-review" &&
      locales.translation?.reviewBeforeIndexing===true,
      "Pilot EN: prohibida la publicació i indexació fins a revisió");
}
check(publication.policy==="deny-by-default",
  "La publicació de noves pàgines ha de continuar bloquejada per defecte");

for(const [country,entry] of Object.entries(countries.countries||{})){
  check(slug.test(country),"Slug invàlid al catàleg: "+country);
  check(Array.isArray(entry)&&entry.length===2&&typeof entry[0]==="string"&&
    entry[0].trim().length>0&&continent.has(entry[1]),
    "País o continent invàlid: "+country);
}
check(Boolean(countries.countries?.suecia),"Cal conservar Suècia com a referència");
for(const [kind,file] of Object.entries(templates.references||{}))
  check(typeof file==="string" && exists(file),"Plantilla de referència absent ("+kind+"): "+file);
for(const [kind,file] of Object.entries(templates.sources||{}))
  check(typeof file==="string" && exists(file),"Font de veritat absent ("+kind+"): "+file);
check(templates.policy?.sourceLanguage==="es" &&
  templates.policy?.publish==="explicit-approval-only",
  "Les plantilles han de requerir aprovació editorial explícita");

const unique=new Set(approvedFiles);
check(unique.size===approvedFiles.length,"Hi ha URL duplicades al registre de publicació");
for(const file of approvedFiles){
  check(exists(file),"Pàgina aprovada absent: "+file);
  if(file.startsWith("destinos/")&&file!=="destinos/index.html"){
    const id=file.split("/")[1];
    check(Boolean(countries.countries?.[id]),"País aprovat sense metadades: "+id);
  }
}
const script=read("configuracion/scripts/generate-planifica-hubs.mjs");
check(script.includes('new URL("../datos/paises-vcc.json", import.meta.url)'),
  "El catàleg Planifica ha de llegir la font central de països");
check(!script.includes("const countryMeta = {"),
  "Catàleg de països duplicat dins del generador");
const tokens=read(templates.sources.designTokens);
const hero=read(templates.sources.sharedHero);
for(const key of [
 "--vcc-guide-facts-top-gap","--vcc-guide-facts-divider-gap",
 "--vcc-guide-facts-row-gap","--vcc-guide-facts-column-gap",
 "--vcc-guide-facts-label-size","--vcc-guide-facts-value-size"
]){
  check(tokens.includes(key+":"),"Token global absent: "+key);
  check(hero.includes("var("+key+","),"El component no utilitza el token: "+key);
}
const [countryPage,cityPage]=[
 read(templates.references.country),read(templates.references.city)
];
const headerCss="vcc-capcaleres-editorials.css";
check(countryPage.includes(headerCss)&&cityPage.includes(headerCss),
  "Suècia i Estocolm han de carregar el mateix component de portada");
const outputs=new Set();
for(const bundle of manifest.bundles||[]){
  check(bundle.out&&!outputs.has(bundle.out),"Bundle CSS de sortida duplicat: "+bundle.out);
  outputs.add(bundle.out);
  for(const file of bundle.sources||[bundle.entry])check(exists(file),"Font CSS del bundle absent: "+file);
}
const html=listSiteHtml();
const counted=html.filter(file=>file.startsWith("destinos/"));
const summary={
  qualityReference:"suecia/estocolmo",
  html:html.length,
  approved:approvedFiles.length,
  drafts:html.filter(file=>!unique.has(file)).length,
  destinationHtml:counted.length,
  countryMeta:Object.keys(countries.countries||{}).length,
  cssBundles:outputs.size,
  locales:{original:locales.source,automaticEnglishEnabled:locales.locales.en.active},
  problems:errors
};
if(asJson)console.log(JSON.stringify(summary,null,2));
else console.log("VCC · contracte de creixement:",JSON.stringify(summary));
if(errors.length && strict){
  console.error("Arquitectura VCC invàlida:\n- "+errors.join("\n- "));
  process.exitCode=1;
}
