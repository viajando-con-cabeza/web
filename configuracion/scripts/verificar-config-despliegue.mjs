/* VCC · Evita desplegar la branca de proves al Worker productiu o viceversa.
 * El root wrangler.jsonc és propi de cada branca; hi ha també la
 * configuració explícita wrangler.production.jsonc.
 */
import fs from "node:fs";
const read=file=>JSON.parse(fs.readFileSync(file,"utf8"));
const root=read("wrangler.jsonc"),prod=read("wrangler.production.jsonc");
const errors=[];
const validate=(name,cfg,mode)=>{
  if(cfg.name!==name)errors.push(mode+": Worker incorrecte ("+cfg.name+", esperat "+name+")");
  if(cfg.assets?.html_handling!=="auto-trailing-slash")
    errors.push(mode+": falta html_handling auto-trailing-slash");
  if(cfg.assets?.directory!=="./")errors.push(mode+": carpeta d'assets inesperada");
};
validate("web-main",prod,"wrangler.production.jsonc");
if(process.argv.includes("--quality"))validate("web-quality",root,"quality/wrangler.jsonc");
if(process.argv.includes("--main"))validate("web-main",root,"main/wrangler.jsonc");
if(!process.argv.includes("--quality")&&!process.argv.includes("--main"))
  errors.push("Usa --quality o --main per revisar el Worker de la branca");
if(errors.length){
  for(const error of errors)console.error("DESPLEGAMENT BLOQUEJAT:",error);
  process.exitCode=1;
}else console.log("VCC Worker OK: configura correctament",root.name,
  "i la ruta neta de les pàgines HTML");
