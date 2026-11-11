/* Evita que un formulario de Contacto envíe a un dominio equivocado. */
import fs from 'node:fs';
const contact=fs.readFileSync('contacto/index.html','utf8');
const english=fs.readFileSync('en/contact/index.html','utf8');
const privacy=fs.readFileSync('politica-de-privacidad/index.html','utf8');
const right='info@viajandoconcabeza.com';
const wrong='info@viajaconcabeza.com';
const issues=[];
for(const [name,html] of [['Contacto',contact],['Contact EN',english],['Privacidad',privacy]]){
  if(html.includes(wrong))issues.push(name+': incluye dominio de correo incorrecto');
  if(!html.includes(right))issues.push(name+': no incluye el correo de contacto confirmado');
}
for(const [name,html] of [['Contacto',contact],['Contact EN',english]]){
  if(!html.includes('action="https://formsubmit.co/ajax/'+right+'"'))
    issues.push(name+': FormSubmit no envía al buzón configurado');
}
if(issues.length){issues.forEach(x=>console.error('CONTACTO:',x));process.exitCode=1;}
else console.log('VCC contacto OK: formularios e información legal usan el mismo destinatario.');
