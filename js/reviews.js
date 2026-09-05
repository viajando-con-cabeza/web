(function(){
  'use strict';

  const API='https://anwdwhrybknczptrmzci.supabase.co/functions/v1/reviews-api';
  const HEADERS={'x-vc-client':'web'};

  const scriptEl=document.currentScript;
  if(scriptEl&&scriptEl.src&&!document.querySelector('link[data-vc-review-compact]')){
    const href=new URL(scriptEl.src);href.pathname=href.pathname.replace(/\/js\/reviews\.js$/,'/css/reviews-compact.css');
    const link=document.createElement('link');link.rel='stylesheet';link.href=href.href;link.dataset.vcReviewCompact='';document.head.appendChild(link);
  }

  const TYPES={
    guide:{
      intro:title=>`¿Has visitado ${esc(title)}? Valora el destino y comparte tu experiencia.`,
      heading:title=>`Deja tu valoración de ${esc(title)}`,
      metrics:[
        ['sights','Qué ver y hacer','Variedad y calidad de planes'],
        ['food','Gastronomía','Comer bien y disfrutar'],
        ['transport','Transporte','Moverse fácil por el destino'],
        ['safety','Seguridad','Sensación de tranquilidad'],
        ['value','Calidad-precio','Lo que recibes por lo que pagas'],
        ['charm','Encanto','Ambiente, belleza y personalidad']
      ]
    },
    itinerary:{
      intro:()=>`¿Has seguido este itinerario? Valóralo y ayuda a otros viajeros a saber si les encaja.`,
      heading:()=>`Valora este itinerario`,
      metrics:[
        ['organization','Organización','Orden y claridad del recorrido'],
        ['pace','Ritmo del viaje','Sin prisas ni tiempos imposibles'],
        ['route','Ruta','Lógica y aprovechamiento del recorrido'],
        ['tips','Consejos','Utilidad de los tips incluidos'],
        ['budget','Presupuesto','Realismo y control del gasto'],
        ['usefulness','Utilidad','Cuánto te ayudó a organizarte']
      ]
    }
  };

  const esc=(value='')=>String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const average=values=>{const nums=values.map(Number).filter(v=>Number.isFinite(v)&&v>=0&&v<=10);return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null};
  const pct=value=>Number.isFinite(Number(value))?`${Math.max(0,Math.min(100,(Number(value)/10)*100))}%`:'0%';
  const fmtDate=value=>new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));
  const descriptor=value=>{const v=Number(value);if(v===10)return 'Excepcional';if(v>=9)return 'Fantástico';if(v>=8)return 'Muy bien';if(v>=6)return 'Bien';if(v>=4)return 'Regular';if(v>=1)return 'Malo';return 'Muy malo'};
  const scoreColor=value=>{const v=Math.max(0,Math.min(10,Number(value)||0));const hue=Math.round((v/10)*120);return `hsl(${hue} 38% 42%)`};

  function scoreControl(key,label,description){
    return `<div class="vc-score-field" data-score-field="${key}"><div class="vc-score-copy"><strong>${label}</strong><span>${description}</span></div><div class="vc-score-choices" role="radiogroup" aria-label="${label}">${Array.from({length:11},(_,i)=>`<button type="button" class="vc-score-choice" data-score="${i}" aria-label="${label}: ${i} sobre 10">${i}</button>`).join('')}</div><div class="vc-score-feedback" data-score-feedback>Selecciona una nota</div><input type="hidden" name="score_${key}"></div>`;
  }

  function markup(title,type){
    const config=TYPES[type];
    return `<div class="vc-reviews-shell"><form class="vc-review-form" data-form novalidate><div class="vc-review-form-title"><span>✎</span><div><h3>${config.heading(title)}</h3><p>${config.intro(title)}</p></div></div><div class="vc-rating-explainer"><strong>Valora cada apartado del 0 al 10.</strong><span>0 = muy malo · 5 = regular · 10 = excepcional. La nota general se calcula automáticamente.</span></div><div class="vc-score-fields">${config.metrics.map(m=>scoreControl(...m)).join('')}</div><div class="vc-live-average" data-live-average><span>Tu nota media</span><strong>—</strong><small>/ 10</small><em>Completa los 6 apartados</em></div><div class="vc-comment-area"><label>Tu comentario <b>*</b></label><textarea name="comment" maxlength="2000" minlength="10" required placeholder="Cuéntanos tu experiencia, lo que más te gustó, lo que mejorarías o algún consejo útil..."></textarea></div><div class="vc-review-bottom"><div><label>Tu nombre o alias <b>*</b></label><input name="name" maxlength="80" required placeholder="Ej. Laura M."></div><div><label>Tipo de viaje</label><select name="trip_type"><option value="">Selecciona...</option><option value="Pareja">Pareja</option><option value="Familia">Familia</option><option value="Amigos">Amigos</option><option value="En solitario">En solitario</option><option value="Trabajo">Trabajo</option></select></div><label class="vc-review-consent"><input type="checkbox" name="consent" required> He leído y acepto la política de comentarios</label><input class="vc-review-honeypot" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="vc-review-submit" type="submit">ENVIAR VALORACIÓN</button></div><div class="vc-review-note">ℹ Todas las valoraciones se revisan antes de publicarse para evitar spam y contenido inapropiado.</div><div class="vc-review-message" data-message role="status" aria-live="polite"></div></form></div>`;
  }

  function bindScores(form,type){
    const metrics=TYPES[type].metrics;const live=form.querySelector('[data-live-average]');
    const refresh=()=>{const vals=metrics.map(([key])=>form.elements[`score_${key}`].value).filter(v=>v!=='').map(Number);if(vals.length===metrics.length){const avg=average(vals);live.querySelector('strong').textContent=avg.toFixed(1);live.querySelector('em').textContent=descriptor(avg);live.classList.add('is-ready')}else{live.querySelector('strong').textContent='—';live.querySelector('em').textContent=`Faltan ${metrics.length-vals.length} apartado${metrics.length-vals.length===1?'':'s'}`;live.classList.remove('is-ready')}};
    form.querySelectorAll('[data-score-field]').forEach(field=>{const key=field.dataset.scoreField;const input=form.elements[`score_${key}`];field.querySelectorAll('[data-score]').forEach(btn=>btn.addEventListener('click',()=>{input.value=btn.dataset.score;field.querySelectorAll('[data-score]').forEach(b=>b.classList.toggle('is-selected',b===btn));field.querySelector('[data-score-feedback]').textContent=`${btn.dataset.score}/10 · ${descriptor(btn.dataset.score)}`;refresh()}))});refresh();
  }

  function reviewCard(r){const color=scoreColor(r.rating);return `<article class="vc-review-card" style="--vc-score-color:${color}"><div class="vc-review-card-top"><div><strong>${esc(r.name)}</strong><span>${esc(r.trip_type||'Viajero/a')} · ${fmtDate(r.created_at)}</span></div><div class="vc-card-score"><b>${Number(r.rating).toFixed(1)}</b><span>${descriptor(r.rating)}</span></div></div>${r.comment?`<p>${esc(r.comment)}</p>`:''}</article>`}

  function quickBadge(pageId,reviews){
    const host=[...document.querySelectorAll('[data-review-quick]')].find(el=>el.dataset.reviewQuick===pageId);if(!host)return;
    if(!reviews.length){host.innerHTML='<button type="button" class="vc-quick-badge vc-quick-empty" data-open-reviews><span>Valoraciones</span><strong>Sin valoraciones</strong><small>Sé el primero en opinar</small><i>›</i></button>';return}
    const avg=average(reviews.map(r=>r.rating));const color=scoreColor(avg);
    host.innerHTML=`<button type="button" class="vc-quick-badge" style="--vc-score-color:${color}" data-open-reviews><span class="vc-quick-copy"><strong>${descriptor(avg)}</strong><small>${reviews.length} valoración${reviews.length===1?'':'es'}</small></span><b>${avg.toFixed(1)}</b><i>›</i></button>`;
  }

  function modalMarkup(pageId,title,type,reviews){
    const config=TYPES[type],avg=average(reviews.map(r=>r.rating)),trips=[...new Set(reviews.map(r=>r.trip_type).filter(Boolean))].sort(),color=scoreColor(avg||0);
    const scoreHtml=reviews.length?`<div class="vc-modal-score" style="--vc-score-color:${color}"><b>${avg.toFixed(1)}</b><div><strong>${descriptor(avg)}</strong><span>${reviews.length} valoración${reviews.length===1?'':'es'}</span></div></div>`:`<div class="vc-modal-score vc-modal-score-empty"><div><strong>Sin valoraciones todavía</strong><span>Sé la primera persona en compartir su experiencia.</span></div></div>`;
    const bars=config.metrics.map(([key,label])=>{const m=average(reviews.map(r=>r.scores&&r.scores[key]));return `<div class="vc-modal-metric"><div><span>${label}</span><b>${m==null?'—':m.toFixed(1)}</b></div><i><em style="width:${pct(m)}"></em></i></div>`}).join('');
    return `<div class="vc-review-modal" data-review-modal="${esc(pageId)}" aria-hidden="true"><div class="vc-review-modal-backdrop" data-close-reviews></div><section class="vc-review-modal-panel" role="dialog" aria-modal="true" aria-label="Valoraciones de ${esc(title)}"><header><div><span class="vc-reviews-kicker">COMUNIDAD VIAJERA</span><h2>Valoraciones sobre ${esc(title)}</h2></div><button type="button" class="vc-modal-close" data-close-reviews aria-label="Cerrar">×</button></header><div class="vc-modal-summary">${scoreHtml}<div class="vc-modal-trust">✓ Opiniones revisadas antes de publicarse</div></div><div class="vc-modal-categories"><h3>Categorías</h3><div class="vc-modal-metrics">${bars}</div></div><div class="vc-modal-filters"><h3>Filtrar comentarios</h3><div class="vc-filter-grid"><label>Tipo de viajero<select data-filter-trip><option value="">Todos</option>${trips.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label><label>Puntuación<select data-filter-score><option value="">Todas</option><option value="9">9–10</option><option value="8">8–8,9</option><option value="6">6–7,9</option><option value="0">0–5,9</option></select></label><label>Orden<select data-filter-sort><option value="recent">Más recientes</option><option value="high">Mejor puntuación</option><option value="low">Menor puntuación</option></select></label><label class="vc-filter-search">Buscar<input type="search" data-filter-search placeholder="Ej. transporte, Vaticano, comida..."></label></div></div><div class="vc-modal-comments"><div class="vc-modal-comments-head"><h3>Comentarios</h3><span data-filter-count>${reviews.length}</span></div><div data-filter-results></div></div></section></div>`;
  }

  function bindModal(pageId,reviews){
    const modal=document.querySelector(`[data-review-modal="${pageId}"]`);if(!modal)return;const results=modal.querySelector('[data-filter-results]'),count=modal.querySelector('[data-filter-count]'),trip=modal.querySelector('[data-filter-trip]'),score=modal.querySelector('[data-filter-score]'),sort=modal.querySelector('[data-filter-sort]'),search=modal.querySelector('[data-filter-search]');
    const render=()=>{let items=[...reviews];if(trip.value)items=items.filter(r=>r.trip_type===trip.value);if(score.value==='9')items=items.filter(r=>Number(r.rating)>=9);if(score.value==='8')items=items.filter(r=>Number(r.rating)>=8&&Number(r.rating)<9);if(score.value==='6')items=items.filter(r=>Number(r.rating)>=6&&Number(r.rating)<8);if(score.value==='0')items=items.filter(r=>Number(r.rating)<6);const q=search.value.trim().toLowerCase();if(q)items=items.filter(r=>`${r.name||''} ${r.trip_type||''} ${r.comment||''}`.toLowerCase().includes(q));if(sort.value==='high')items.sort((a,b)=>Number(b.rating)-Number(a.rating));else if(sort.value==='low')items.sort((a,b)=>Number(a.rating)-Number(b.rating));else items.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));count.textContent=items.length;results.innerHTML=items.length?items.map(reviewCard).join(''):'<div class="vc-reviews-empty"><strong>No hay comentarios con estos filtros</strong><span>Prueba con otra combinación.</span></div>'};
    [trip,score,sort].forEach(el=>el.addEventListener('change',render));search.addEventListener('input',render);render();const open=()=>{modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.body.classList.add('vc-modal-open')};const close=()=>{modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('vc-modal-open')};document.querySelectorAll('[data-open-reviews]').forEach(btn=>{if(btn.closest('[data-review-quick]')?.dataset.reviewQuick===pageId)btn.addEventListener('click',open)});modal.querySelectorAll('[data-close-reviews]').forEach(btn=>btn.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('is-open'))close()});
  }

  function buildModal(pageId,title,type,reviews){const old=document.querySelector(`[data-review-modal="${pageId}"]`);if(old)old.remove();document.body.insertAdjacentHTML('beforeend',modalMarkup(pageId,title,type,reviews));bindModal(pageId,reviews)}

  async function load(root,pageId,pageType,title){try{const qs=new URLSearchParams({page_id:pageId,page_type:pageType});const res=await fetch(`${API}?${qs}`,{headers:HEADERS});if(!res.ok)throw new Error();const data=await res.json();const reviews=data.reviews||[];quickBadge(pageId,reviews);buildModal(pageId,title,pageType,reviews)}catch(e){quickBadge(pageId,[]);buildModal(pageId,title,pageType,[]);const msg=root.querySelector('[data-message]');msg.textContent='No hemos podido cargar las valoraciones ahora mismo.';msg.classList.add('is-error')}}

  function bind(root,pageId,pageType){const form=root.querySelector('[data-form]'),metrics=TYPES[pageType].metrics;bindScores(form,pageType);form.addEventListener('submit',async e=>{e.preventDefault();const msg=form.querySelector('[data-message]'),btn=form.querySelector('.vc-review-submit');msg.textContent='';msg.className='vc-review-message';if(form.elements.website.value)return;const scores={};let missing=false;metrics.forEach(([key])=>{const v=form.elements[`score_${key}`].value;if(v==='')missing=true;else scores[key]=Number(v)});if(missing){msg.textContent='Valora los 6 apartados antes de enviar tu opinión.';msg.classList.add('is-error');return}if(!form.reportValidity())return;const last=Number(localStorage.getItem('vc_last_review')||0);if(Date.now()-last<60000){msg.textContent='Espera un minuto antes de enviar otra valoración.';msg.classList.add('is-error');return}const payload={page_id:pageId,page_type:pageType,name:form.elements.name.value.trim(),trip_type:form.elements.trip_type.value||null,scores,comment:form.elements.comment.value.trim(),website:form.elements.website.value};btn.disabled=true;btn.textContent='ENVIANDO…';try{const res=await fetch(API,{method:'POST',headers:{...HEADERS,'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!res.ok)throw new Error();localStorage.setItem('vc_last_review',String(Date.now()));form.reset();form.querySelectorAll('.vc-score-choice').forEach(b=>b.classList.remove('is-selected'));form.querySelectorAll('[data-score-feedback]').forEach(el=>el.textContent='Selecciona una nota');const live=form.querySelector('[data-live-average]');live.querySelector('strong').textContent='—';live.querySelector('em').textContent='Completa los 6 apartados';live.classList.remove('is-ready');msg.textContent='¡Gracias! Tu valoración se ha enviado correctamente y aparecerá cuando la revisemos.';msg.classList.add('is-success')}catch(e){msg.textContent='No hemos podido enviar tu valoración. Inténtalo de nuevo en unos minutos.';msg.classList.add('is-error')}finally{btn.disabled=false;btn.textContent='ENVIAR VALORACIÓN'}})}

  function init(root){const pageId=(root.dataset.reviewPage||'').trim(),pageType=(root.dataset.reviewType||'guide').trim(),title=(root.dataset.reviewTitle||pageId||'esta guía').trim();if(!pageId||!TYPES[pageType])return;root.innerHTML=markup(title,pageType);bind(root,pageId,pageType);load(root,pageId,pageType,title)}
  document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('[data-review-page]').forEach(init));
})();