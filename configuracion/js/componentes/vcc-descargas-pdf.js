/* VCC · Exportación PDF compartida sin dependencias externas.
 * Resumen descargable con texto seleccionable, saltos de página y caracteres españoles. */
(function(){
"use strict";
if(window.VCCPDF)return;
const PAGE_W=595.28,PAGE_H=841.89,MARGIN=49,MAX_W=PAGE_W-MARGIN*2;
const FONT_NORMAL="/F1",FONT_BOLD="/F2";
const DARK=[.13,.14,.14],MUTED=[.43,.43,.43],ACCENT=[.77,.37,.30];
const CREAM=[.985,.970,.949],DIVIDER=[.88,.85,.82];
/* Logotipo original de /configuracion/imagenes/marca/logo-viajando-con-cabeza.svg
 * integrado como trazado vectorial, sin red ni dependencias; se dibuja en cada hoja. */
const VCC_LOGO_VECTOR="434 185 m 435 186 l 444 186 l 445 184 l 444 183 l 439 183 l h 418 183 m 418 185 l 420 186 l 428 186 l 429 185 l 426 183 l h 402 180 m 402 182 l 404 183 l 407 183 l 408 184 l 412 184 l 413 183 l 411 181 l h 460 179 m 458 178 l 451 181 l 450 183 l 451 184 l 459 181 l h 472 170 m 470 170 l 466 173 l 464 176 l 466 177 l 472 172 l h 481 160 m 479 160 l 475 166 l 476 168 l 481 163 l 482 161 l h 464 152 m 465 154 l 474 153 l 474 151 l 465 151 l h 487 147 m 482 148 l 479 150 l 480 152 l 482 151 l 484 152 l 483 153 l 483 156 l 485 156 l 488 149 l h 453 145 m 453 149 l 458 153 l 459 150 l 456 148 l 455 145 l h 500 143 m 498 142 l 493 144 l 491 146 l 492 147 l 495 147 l 499 145 l h 74 176 m 78 181 l 81 181 l 82 182 l 92 177 l 103 167 l 104 168 l 104 173 l 106 176 l 110 178 l 114 178 l 118 176 l 124 170 l 130 160 l 134 160 l 135 161 l 132 172 l 133 174 l 136 175 l 139 173 l 145 163 l 156 151 l 158 152 l 158 156 l 157 157 l 157 166 l 158 169 l 161 172 l 167 173 l 171 171 l 178 164 l 180 161 l 180 159 l 169 168 l 164 169 l 162 165 l 163 157 l 164 156 l 164 149 l 162 146 l 156 145 l 145 155 l 144 153 l 147 146 l 146 144 l 143 143 l 140 147 l 138 154 l 136 156 l 131 157 l 130 156 l 130 149 l 127 145 l 123 144 l 120 145 l 117 148 l 114 148 l 110 152 l 106 160 l 96 169 l 86 176 l 81 177 l 79 175 l 79 168 l 80 167 l 80 164 l 86 153 l 93 147 l 95 148 l 94 154 l 97 154 l 99 151 l 99 145 l 97 143 l 92 142 l 88 144 l 80 153 l 75 163 l h 116 155 m 119 159 l 124 161 l 120 168 l 113 174 l 111 174 l 109 172 l 109 168 l 112 160 l h 124 148 m 126 149 l 126 156 l 125 157 l 120 154 l 121 150 l h 512 136 m 510 135 l 504 139 l 504 142 l 510 139 l h 482 135 m 480 137 l 484 142 l 487 142 l 486 139 l h 463 136 m 460 135 l 458 136 l 455 140 l 456 141 l h 467 134 m 468 136 l 470 135 l 475 136 l 476 135 l 476 133 l 468 133 l h 526 128 m 523 127 l 516 132 l 518 134 l h 201 176 m 202 178 l 206 181 l 212 181 l 220 176 l 227 169 l 228 170 l 228 174 l 230 176 l 234 177 l 241 173 l 247 166 l 249 165 l 250 166 l 250 169 l 254 173 l 260 173 l 269 167 l 270 168 l 269 175 l 271 177 l 273 177 l 280 163 l 284 158 l 292 151 l 295 151 l 297 153 l 297 156 l 295 159 l 295 161 l 292 164 l 284 168 l 278 174 l 278 177 l 279 178 l 286 177 l 289 175 l 298 165 l 300 165 l 303 163 l 306 164 l 307 172 l 310 175 l 314 177 l 318 177 l 328 172 l 342 158 l 343 153 l 348 148 l 357 143 l 358 144 l 357 149 l 343 166 l 345 169 l 347 169 l 350 167 l 356 167 l 358 169 l 358 171 l 343 183 l 337 189 l 327 202 l 324 211 l 327 215 l 331 215 l 341 209 l 349 200 l 358 187 l 361 181 l 363 173 l 371 167 l 373 173 l 375 175 l 379 176 l 385 173 l 395 162 l 399 168 l 401 169 l 406 169 l 419 162 l 424 157 l 424 155 l 421 155 l 409 163 l 403 165 l 401 163 l 401 161 l 404 153 l 404 147 l 403 146 l 400 146 l 399 147 l 397 145 l 392 144 l 386 147 l 379 154 l 377 158 l 373 162 l 363 168 l 358 163 l 354 161 l 360 154 l 364 146 l 364 143 l 362 140 l 356 139 l 347 144 l 347 145 l 341 150 l 339 154 l 340 157 l 324 170 l 318 173 l 314 173 l 312 171 l 312 166 l 321 162 l 329 153 l 331 146 l 330 143 l 327 141 l 321 141 l 319 142 l 313 148 l 309 156 l 306 159 l 301 161 l 300 160 l 301 152 l 298 148 l 293 147 l 287 150 l 280 157 l 279 156 l 281 148 l 287 142 l 297 124 l 299 118 l 299 113 l 298 111 l 294 111 l 291 114 l 284 126 l 278 144 l 276 147 l 276 151 l 273 159 l 264 167 l 257 170 l 254 167 l 255 160 l 259 150 l 256 148 l 254 149 l 253 152 l 243 164 l 234 171 l 233 170 l 233 168 l 239 157 l 245 151 l 247 150 l 250 152 l 251 151 l 251 148 l 249 146 l 246 146 l 242 148 l 235 155 l 233 159 l 220 171 l 210 177 l 207 177 l 205 173 l 206 167 l 212 154 l 220 147 l 221 148 l 221 154 l 224 154 l 226 151 l 226 146 l 225 144 l 219 142 l 215 144 l 207 153 l 202 163 l h 354 179 m 355 181 l 351 189 l 344 199 l 334 209 l 331 211 l 329 211 l 328 210 l 329 207 l 335 197 l h 283 173 m 284 172 l 285 173 l 284 174 l h 284 172 m 285 171 l 287 172 l 286 173 l h 286 171 m 287 170 l 288 171 l 287 172 l h 305 163 m 306 162 l 307 163 l 306 164 l h 278 157 m 279 156 l 280 157 l 279 158 l h 392 150 m 393 151 l 393 156 l 387 163 l 380 169 l 379 168 l 380 164 l 384 158 l h 324 146 m 325 147 l 322 153 l 316 158 l 315 156 l 319 150 l h 285 136 m 286 135 l 287 136 l 286 137 l h 294 118 m 295 121 l 290 132 l 287 136 l 286 135 l 286 132 l 290 125 l 290 123 l h 619 59 m 613 58 l 605 61 l 602 61 l 519 88 l 518 91 l 523 93 l 537 102 l 537 106 l 534 113 l 532 122 l 535 123 l 543 120 l 550 119 l 553 123 l 553 125 l 559 136 l 559 138 l 560 138 l 606 79 l 613 68 l 619 61 l h 589 78 m 553 104 l 546 108 l 538 116 l 537 115 l 540 104 l 542 101 l 587 77 l h 588 77 m 589 76 l 591 77 l 590 78 l h 590 76 m 591 75 l 592 76 l 591 77 l h 607 71 m 590 93 l 588 97 l 561 131 l 559 129 l 551 113 l 549 113 l 549 115 l 543 118 l 540 117 l 562 100 l 602 73 l 605 70 l h 606 70 m 607 69 l 608 70 l 607 71 l h 603 66 m 575 80 l 573 82 l 562 87 l 560 89 l 541 99 l 538 99 l 528 93 l 525 90 l 528 88 l 540 84 l 543 84 l 546 82 l 552 81 l 593 67 l 596 67 l 600 65 l h 602 65 m 603 64 l 605 65 l 604 66 l h 75 13 m 71 15 l 69 20 l 67 46 l 66 47 l 66 58 l 65 59 l 66 69 l 65 70 l 64 86 l 63 87 l 63 107 l 68 110 l 74 110 l 76 108 l 76 91 l 78 84 l 79 62 l 80 61 l 80 53 l 81 52 l 83 27 l 84 26 l 83 16 l 81 16 l h 114 10 m 111 13 l 110 16 l 111 17 l 111 21 l 106 31 l 106 34 l 102 44 l 102 47 l 100 50 l 94 73 l 89 77 l 89 81 l 91 85 l 85 101 l 85 107 l 90 110 l 95 110 l 97 108 l 97 106 l 99 103 l 99 100 l 103 90 l 103 87 l 105 85 l 114 81 l 124 79 l 125 80 l 125 88 l 126 89 l 126 96 l 127 97 l 128 105 l 132 110 l 134 111 l 139 111 l 141 110 l 142 105 l 141 104 l 140 96 l 139 95 l 139 90 l 138 89 l 138 76 l 143 72 l 144 67 l 141 65 l 137 65 l 136 64 l 135 50 l 134 49 l 134 39 l 133 38 l 133 26 l 132 25 l 133 23 l 132 22 l 132 17 l 131 14 l 125 10 l h 120 43 m 122 50 l 123 65 l 120 67 l 111 69 l 110 66 l 114 58 l 118 45 l h 434 9 m 430 9 l 425 11 l 423 13 l 421 13 l 419 16 l 409 25 l 402 39 l 403 43 l 399 56 l 398 68 l 397 69 l 397 87 l 402 102 l 407 107 l 413 110 l 424 110 l 434 104 l 439 98 l 448 81 l 452 67 l 452 63 l 453 62 l 453 51 l 454 50 l 454 47 l 457 44 l 457 39 l 454 35 l 454 31 l 453 30 l 453 26 l 455 25 l 453 19 l 448 14 l h 439 25 m 441 27 l 441 31 l 442 32 l 442 47 l 441 48 l 441 56 l 440 57 l 440 62 l 439 63 l 438 70 l 435 79 l 430 89 l 422 98 l 419 99 l 415 96 l 412 87 l 412 69 l 413 68 l 414 58 l 419 47 l 419 45 l 425 35 l 432 28 l 437 25 l h 371 10 m 362 9 l 361 8 l 355 8 l 354 9 l 349 9 l 348 10 l 338 12 l 336 15 l 337 21 l 340 23 l 342 23 l 344 25 l 342 32 l 342 41 l 341 42 l 341 50 l 340 51 l 340 65 l 339 66 l 338 75 l 337 76 l 336 94 l 335 97 l 330 100 l 330 104 l 333 108 l 338 109 l 341 111 l 346 110 l 349 106 l 360 100 l 378 84 l 386 72 l 386 70 l 389 65 l 392 56 l 393 48 l 394 47 l 394 37 l 393 36 l 392 29 l 389 23 l 381 15 l h 370 21 m 374 23 l 379 30 l 379 33 l 380 34 l 379 48 l 376 57 l 369 70 l 362 79 l 351 89 l 350 88 l 351 72 l 352 71 l 352 65 l 354 59 l 355 49 l 357 44 l 360 22 l 362 20 l h 230 8 m 227 10 l 226 13 l 227 17 l 222 27 l 216 45 l 215 52 l 212 59 l 209 72 l 204 76 l 205 86 l 199 102 l 199 106 l 204 110 l 209 110 l 211 109 l 218 86 l 222 83 l 238 78 l 240 80 l 240 88 l 241 89 l 241 96 l 242 97 l 243 105 l 247 110 l 249 111 l 254 111 l 257 108 l 254 96 l 253 75 l 258 71 l 259 66 l 251 63 l 250 50 l 249 49 l 249 36 l 248 35 l 248 18 l 245 11 l 240 8 l h 224 68 m 225 67 l 226 68 l 225 69 l h 235 42 m 236 43 l 236 51 l 237 52 l 237 61 l 238 64 l 236 66 l 226 68 l 225 65 l 227 59 l 231 51 l 233 43 l h 52 5 m 48 7 l 46 11 l 37 37 l 34 51 l 30 61 l 30 64 l 25 79 l 23 77 l 23 71 l 22 70 l 22 65 l 20 58 l 20 50 l 19 49 l 19 43 l 18 42 l 16 21 l 13 17 l 9 15 l 6 15 l 4 13 l 1 15 l 0 24 l 2 29 l 2 35 l 3 36 l 4 46 l 5 47 l 8 74 l 10 80 l 10 85 l 11 86 l 13 101 l 15 107 l 17 109 l 24 111 l 27 111 l 31 109 l 32 101 l 45 63 l 45 60 l 57 24 l 62 15 l 62 10 l 61 8 l h 328 4 m 324 3 l 322 4 l 319 8 l 319 11 l 316 20 l 316 24 l 315 25 l 315 29 l 314 30 l 312 45 l 311 46 l 311 52 l 309 57 l 308 71 l 306 74 l 304 69 l 303 59 l 301 56 l 301 53 l 297 42 l 297 38 l 295 32 l 295 22 l 293 17 l 289 14 l 285 14 l 283 12 l 279 12 l 277 14 l 277 16 l 274 18 l 273 20 l 273 26 l 272 27 l 272 34 l 271 35 l 271 43 l 270 44 l 269 56 l 268 57 l 268 65 l 267 66 l 266 90 l 265 91 l 265 106 l 266 108 l 269 108 l 271 110 l 274 110 l 276 109 l 277 107 l 278 90 l 279 89 l 279 83 l 280 82 l 280 77 l 282 72 l 283 59 l 284 58 l 286 59 l 286 63 l 289 70 l 290 77 l 301 108 l 305 110 l 310 110 l 311 109 l 313 110 l 317 107 l 318 98 l 319 97 l 319 90 l 321 83 l 321 75 l 322 74 l 324 52 l 325 51 l 326 40 l 328 33 l 329 18 l 331 12 l 331 7 l h 196 1 m 193 1 l 192 0 l 187 1 l 184 7 l 185 19 l 184 20 l 183 36 l 182 37 l 182 50 l 183 51 l 182 73 l 181 74 l 180 86 l 176 97 l 171 101 l 169 101 l 165 97 l 162 87 l 162 82 l 164 79 l 159 76 l 155 77 l 149 84 l 149 96 l 151 99 l 151 101 l 158 108 l 164 110 l 172 111 l 182 108 l 189 101 l 193 92 l 194 82 l 195 81 l 195 72 l 196 71 l 196 58 l 197 57 l 197 44 l 198 43 l 199 23 l 200 22 l 200 15 l 201 14 l 200 4 l h";
const cp1252={"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,"Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,"˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159};
function escapePDF(input){
 return Array.from(String(input)).map(ch=>{
  let n=Object.prototype.hasOwnProperty.call(cp1252,ch)?cp1252[ch]:ch.codePointAt(0);
  if(n>255)return "?";
  if(ch==="("||ch===")"||ch==="\\")return "\\"+ch;
  if(n<32||n>=127)return "\\"+n.toString(8).padStart(3,"0");
  return ch;
 }).join("");
}
const measure=document.createElement("canvas").getContext("2d");
function width(value,size=10,bold=false){
 if(!measure)return Array.from(value).length*size*.55;
 measure.font=(bold?"bold ":"")+size+"px Arial";
 return measure.measureText(value).width;
}
function wrap(value,maxWidth,size=10,bold=false){
 const output=[];
 for(const paragraph of String(value).split("\n")){
  const words=paragraph.trim().split(/\s+/).filter(Boolean);
  if(!words.length){output.push("");continue;}
  let line="";
  for(const word of words){
   const candidate=line?line+" "+word:word;
   if(width(candidate,size,bold)<=maxWidth){line=candidate;continue;}
   if(line){output.push(line);line="";}
   if(width(word,size,bold)<=maxWidth){line=word;continue;}
   let fragment="";
   for(const ch of Array.from(word)){
    if(fragment&&width(fragment+ch,size,bold)>maxWidth){output.push(fragment);fragment=ch;}
    else fragment+=ch;
   }
   line=fragment;
  }
  if(line)output.push(line);
 }
 return output;
}
function rgb(color){return color.map(x=>Number(x).toFixed(3)).join(" ");}
function generate(options){
 if(!options||!options.title||!Array.isArray(options.sections))throw Error("Faltan datos del PDF");
 const pages=[];let ops=[],y=123;
 function text(value,x,top,size=10,bold=false,color=DARK){
  ops.push("BT "+(bold?FONT_BOLD:FONT_NORMAL)+" "+size.toFixed(2)+" Tf "+rgb(color)+" rg 1 0 0 1 "+x.toFixed(2)+" "+(PAGE_H-top).toFixed(2)+" Tm ("+escapePDF(value)+") Tj ET");
 }
 function rule(top){ops.push(rgb(DIVIDER)+" RG 0.65 w "+MARGIN+" "+(PAGE_H-top).toFixed(2)+" m "+(PAGE_W-MARGIN).toFixed(2)+" "+(PAGE_H-top).toFixed(2)+" l S");}
 function finish(){pages.push(ops.join("\n")+"\n");}
 function startPage(){
  ops=[];y=123;
  ops.push(rgb(CREAM)+" rg 0 "+(PAGE_H-84).toFixed(2)+" "+PAGE_W+" 84 re f");
  // El SVG principal mide 620 × 216; 0.195 lo deja en 121 × 42 pt.
  ops.push("q .195 0 0 -.195 "+MARGIN+" "+(PAGE_H-15).toFixed(2)+" cm "+rgb(DARK)+" rg "+VCC_LOGO_VECTOR+" f Q");
  text("GUÍA PARA VIAJAR CON CABEZA",PAGE_W-MARGIN-172,44,8.3,true,ACCENT);
  text("www.viajandoconcabeza.com",PAGE_W-MARGIN-159,59,8,false,MUTED);
  ops.push(rgb(ACCENT)+" RG 1.7 w "+MARGIN+" "+(PAGE_H-84).toFixed(2)+" m "+(PAGE_W-MARGIN).toFixed(2)+" "+(PAGE_H-84).toFixed(2)+" l S");
 }
 function space(height){
  if(y+height>PAGE_H-78){finish();startPage();}
 }
 function lines(values,{size=10,bold=false,color=DARK,indent=0}={}){
  const available=MAX_W-indent;
  for(const value of values){
   for(const line of wrap(value,available,size,bold)){
    space(16);
    text(line,MARGIN+indent,y,size,bold,color);
    y+=15.5;
   }
  }
 }
 startPage();
 const titleLines=wrap(options.title,MAX_W,22,true);
 for(const titleLine of titleLines){space(30);text(titleLine,MARGIN,y,22,true,DARK);y+=27;}
 if(options.subtitle){y+=4;lines([options.subtitle],{size:10.5,color:MUTED});}
 if(options.meta&&options.meta.length){y+=4;lines(options.meta,{size:10,color:MUTED});}
 y+=17;rule(y);y+=24;
 for(const sec of options.sections){
  if(!sec)continue;
  const entries=Array.isArray(sec.lines)?sec.lines:[];
  space(46);
  if(sec.heading){
   ops.push(rgb(CREAM)+" rg "+MARGIN+" "+(PAGE_H-y+12).toFixed(2)+" "+MAX_W+" 30 re f");
   text(sec.heading.toLocaleUpperCase("es-ES"),MARGIN+11,y,12.5,true,ACCENT);y+=30;
  }
  lines(entries,{size:10.25});
  if(sec.note){y+=5;lines([sec.note],{size:9,color:MUTED});}
  y+=16;
 }
 if(options.note){space(44);rule(y);y+=18;lines([options.note],{size:9,color:MUTED});}
 finish();
 const totalPages=pages.length;
 for(let i=0;i<totalPages;i++){
  const footer=["0.91 0.88 0.84 RG 0.55 w "+MARGIN+" 55 m "+(PAGE_W-MARGIN)+" 55 l S",
   "BT /F1 8 Tf "+rgb(MUTED)+" rg 1 0 0 1 "+MARGIN+" 37 Tm (www.viajandoconcabeza.com) Tj ET",
   "BT /F1 8 Tf "+rgb(MUTED)+" rg 1 0 0 1 "+(PAGE_W-MARGIN-44).toFixed(2)+" 37 Tm (Pagina "+(i+1)+"/"+totalPages+") Tj ET"];
  pages[i]+="\n"+footer.join("\n")+"\n";
 }
 const objects=[];
 objects[1]="<< /Type /Catalog /Pages 2 0 R >>";
 objects[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
 objects[4]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
 const refs=[];
 for(let i=0;i<totalPages;i++){
  const id=5+i*2,contentId=id+1,content=pages[i];
  refs.push(id+" 0 R");
  objects[id]="<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+PAGE_W+" "+PAGE_H+"] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents "+contentId+" 0 R >>";
  objects[contentId]="<< /Length "+content.length+" >>\nstream\n"+content+"endstream";
 }
 objects[2]="<< /Type /Pages /Kids ["+refs.join(" ")+"] /Count "+totalPages+" >>";
 let result="%PDF-1.4\n% VCC\n";const positions=[0];
 for(let i=1;i<objects.length;i++){
  if(!objects[i])throw Error("Objeto PDF sin construir: "+i);
  positions[i]=result.length;result+=i+" 0 obj\n"+objects[i]+"\nendobj\n";
 }
 const xref=result.length;
 result+="xref\n0 "+objects.length+"\n0000000000 65535 f \n";
 for(let i=1;i<objects.length;i++)result+=String(positions[i]).padStart(10,"0")+" 00000 n \n";
 result+="trailer\n<< /Size "+objects.length+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF";
 return new Blob([result],{type:"application/pdf"});
}
function download(options){
 const blob=generate(options),url=URL.createObjectURL(blob);
 const anchor=document.createElement("a");anchor.href=url;
 anchor.download=options.filename||"guia-vcc.pdf";
 document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 return blob;
}
window.VCCPDF=Object.freeze({generate,download});
})();
