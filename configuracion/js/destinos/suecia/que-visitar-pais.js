/* Suecia · Qué visitar · Datos compartidos con el catálogo del país.
   Imágenes y disponibilidad desde /configuracion/js/paises/suecia.js.
   Las tarjetas adoptan el componente compartido VCC, sin estilos duplicados. */
(function(){
  "use strict";
  function start(){
    var root=document.getElementById("vcc-visit-grid");
    var search=document.getElementById("vcc-visit-search");
    var count=document.getElementById("vcc-visit-count");
    var empty=document.getElementById("vcc-visit-empty");
    var clear=document.getElementById("vcc-visit-reset");
    var selectors=[].slice.call(document.querySelectorAll("[data-visit-type]"));
    var country=window.COUNTRY_CONFIG||window.SWEDEN_CONTENT;
    if(!root||!search||!count||!empty||!country)return;
    function esc(value){
      return String(value==null?"":value).replace(/[&<>"']/g,function(char){
        return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
      });
    }
    function noAccent(s){
      return String(s||"").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    }
    function destinationUrl(href){
      var url=String(href||"");
      return url.charAt(0)==="/"?url:"/destinos/suecia/"+url;
    }
    function scoreMarkup(item,type,live){
      if(type!=="principal"||!live)return "";
      var scores=item.scores||null;
      var score=Number.isFinite(item.rating)?item.rating:
        scores?(scores.experience*25+scores.photogenic*20+scores.things*15+
          scores.food*10+scores.transport*10+scores.safety*10+scores.value*10)/100:NaN;
      if(!Number.isFinite(score))return "";
      var label=score>=9.5?"Excepcional":score>=9?"Fantástico":score>=8.5?"Fabuloso":score>=8?"Muy bien":"Bien";
      var number=score.toFixed(1).replace(".",",");
      return '<span class="vcc-card-score" role="img" aria-label="Valoración VCC de '+esc(item.title)+': '+number+' sobre 10, '+label+'"><strong>'+number+'</strong><small>'+label+'</small></span>';
    }
    function card(item,type){
      var live=!!(item.available&&item.href);
      var title=String(item.cardTitle||item.title||"");
      var category=String(item.cardCategory||item.tag||"CIUDADES");
      var photo=String(item.image||"");
      var icon=category==="CIUDADES"?"category-city":"category-islands";
      var href=destinationUrl(item.href);
      var imageSet=photo.indexOf("/__vcc_preview/visor/")>=0?
        ' srcset="'+esc(photo.replace("/__vcc_preview/visor/","/__vcc_preview/mini/"))+' 480w, '+esc(photo)+' 1800w" sizes="(max-width:650px) 90vw, (max-width:1000px) 46vw, 360px"':"";
      var card=document.createElement("article");
      card.className="di-mini-card di-guide-card vcc-it-card vcc-card-shared"+
        (live?"":" vcc-it-card-pending");
      card.dataset.visitCategory=type;
      card.dataset.visitSearch=noAccent([title,category,item.text,type].join(" "));
      card.innerHTML=
        '<span class="di-mini-photo vcc-it-photo"><img class="vcc-card-cover-photo" src="'+esc(photo)+'"'+imageSet+
        ' alt="'+esc("Paisaje de "+title+", Suecia")+'" width="640" height="380" loading="lazy" decoding="async">'+
        scoreMarkup(item,type,live)+'</span>'+
        '<div class="di-mini-body">'+
        '<span class="vcc-card-kicker"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="/configuracion/imagenes/iconos/paginas/itinerarios-iconos.svg#it-'+icon+'"></use></svg>'+esc(category)+'</span>'+
        '<strong class="vcc-it-title">'+esc(title)+'</strong>'+
        '<span class="di-guide-info vcc-it-facts">'+
        '<span class="di-country-line"><img class="vcc-it-country-flag" src="/configuracion/imagenes/banderas/suecia.svg" alt="" width="20" height="13">Suecia</span>'+
        '<span class="vcc-visit-kind">'+(type==="principal"?"Guía completa":"Qué ver y hacer")+'</span></span>'+
        '<p class="di-mini-desc">'+esc(item.text||"Descubre esta parte de Suecia.")+'</p>'+
        (live?
          '<a class="vcc-it-cta" href="'+esc(href)+'" aria-label="Ver '+(type==="principal"?"guía completa de ":"qué ver en ")+esc(title)+'">VER GUÍA</a>':
          '<span class="vcc-it-upcoming">PRÓXIMAMENTE</span>')+
        '</div>';
      var img=card.querySelector("img.vcc-card-cover-photo");
      if(img&&photo.indexOf("/__vcc_preview/visor/")>=0){
        img.addEventListener("error",function(){
          if(!img.dataset.fallbackDone){
            img.dataset.fallbackDone="1";
            img.removeAttribute("srcset");
            img.src=photo.replace("/__vcc_preview/visor/","/");
          }
        });
      }
      return card;
    }
    var entries=[];
    (country.guides||[]).forEach(function(guide){entries.push(card(guide,"principal"));});
    (country.visitingGuides||[]).forEach(function(guide){entries.push(card(guide,"que-ver"));});
    entries.forEach(function(entry){root.appendChild(entry);});
    var selected="todas";
    function update(){
      var searchValue=noAccent(search.value.trim());
      var visible=0;
      entries.forEach(function(entry){
        var show=(selected==="todas"||entry.dataset.visitCategory===selected)&&
          (!searchValue||entry.dataset.visitSearch.indexOf(searchValue)>=0);
        entry.hidden=!show;
        if(show)visible++;
      });
      count.textContent=visible+" "+(visible===1?"guía":"guías");
      empty.hidden=visible!==0;
    }
    selectors.forEach(function(button){
      button.addEventListener("click",function(){
        selected=button.dataset.visitType;
        selectors.forEach(function(other){
          var on=other===button;
          other.classList.toggle("is-active",on);
          other.setAttribute("aria-pressed",String(on));
        });
        update();
      });
    });
    search.addEventListener("input",update);
    if(clear)clear.addEventListener("click",function(){
      search.value="";
      selected="todas";
      selectors.forEach(function(button){
        var on=button.dataset.visitType==="todas";
        button.classList.toggle("is-active",on);
        button.setAttribute("aria-pressed",String(on));
      });
      update();
      search.focus();
    });
    update();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
