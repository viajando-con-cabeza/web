/* Comprueba que los cuatro presupuestos de Estocolmo nunca descuadren. */
import fs from 'node:fs';
const html=fs.readFileSync('destinos/suecia/estocolmo/presupuesto.html','utf8');
const days=[...html.matchAll(/<div class="vcc-budget-day-head"><strong>([^<]+)<\/strong><span class="vcc-day-price" data-total-group-euros="(\d+)"[^>]*>[^<]+<\/span><\/div>([\s\S]*?)<\/ul>/g)];
const issues=[];
if(days.length!==12)issues.push('Deben existir exactamente 12 días: tres por perfil.');
const byProfile=[0,0,0,0];
days.forEach((day,i)=>{
  const categoryValues=[...day[3].matchAll(/<strong data-total-group-euros="(\d+)"/g)].map(m=>Number(m[1]));
  const total=Number(day[2]);
  if(categoryValues.length!==5)issues.push('Día '+(i+1)+' no tiene cinco categorías.');
  const sum=categoryValues.reduce((a,b)=>a+b,0);
  if(sum!==total)issues.push('Día '+(i+1)+': categorías '+sum+' ≠ total '+total);
  byProfile[Math.floor(i/3)]+=total;
});
[1800,1080,660,390].forEach((expected,i)=>{
  if(byProfile[i]!==expected)issues.push('Perfil '+(i+1)+': total '+byProfile[i]+' ≠ '+expected);
});
if(issues.length){issues.forEach(x=>console.error('PRESUPUESTO:',x));process.exitCode=1;}
else console.log('VCC presupuestos OK: 12 días, 60 categorías, cuatro perfiles coherentes.');
