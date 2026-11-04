/* VCC Instagram: representación segura del último post cuando hay datos autorizados.
 * El navegador NUNCA recibe tokens. El JSON debe generarlo un backend que
 * consulta la Instagram Graph API con permiso del propietario.
 */
(function(){
  "use strict";
  const image=document.querySelector("[data-instagram-image]");
  const card=document.querySelector("[data-instagram-post]");
  const caption=document.querySelector("[data-instagram-caption]");
  const heading=document.querySelector("[data-instagram-heading]");
  const placeholder=document.querySelector("[data-instagram-placeholder]");
  if(!image||!card||!caption||!heading)return;
  function validPostUrl(url){
    try{
      const u=new URL(url);
      return u.protocol==="https:" &&
        (u.hostname==="www.instagram.com"||u.hostname==="instagram.com") &&
        /^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(u.pathname);
    }catch{return false}
  }
  function validPhotoUrl(url){
    try{
      const u=new URL(url);
      return u.protocol==="https:" &&
        !!u.hostname && !["localhost","127.0.0.1"].includes(u.hostname);
    }catch{return false}
  }
  async function init(){
    try{
      const response=await fetch("/configuracion/datos/instagram-ultimo.json",{cache:"no-store"});
      if(!response.ok)return;
      const data=await response.json();
      if(!data||data.connected!==true||!data.post)return;
      const p=data.post;
      if(!validPostUrl(p.permalink)||!validPhotoUrl(p.thumbnail_url))return;
      image.src=p.thumbnail_url;
      image.alt=typeof p.alt==="string"?p.alt.slice(0,180):"Última publicación de Viajando con Cabeza";
      card.href=p.permalink;
      card.setAttribute("aria-label","Abrir la última publicación real en Instagram");
      heading.textContent="INSTAGRAM";
      if(placeholder)placeholder.remove();
      caption.textContent=typeof p.caption==="string"&&p.caption.trim()?p.caption.trim().slice(0,160):"Ver publicación en Instagram";
    }catch{ /* conservar la vista de inspiración si no hay conexión/API */ }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
