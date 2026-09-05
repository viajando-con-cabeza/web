(function(){
  'use strict';
  const API='https://anwdwhrybknczptrmzci.supabase.co/functions/v1/reviews-api';
  const HEADERS={'x-vc-client':'web'};
  const avg=arr=>{const nums=arr.map(Number).filter(Number.isFinite);return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null};
  async function init(root){
    const pageId=(root.dataset.reviewPage||'').trim();
    const pageType=(root.dataset.reviewType||'guide').trim();
    if(!pageId)return;
    try{
      const qs=new URLSearchParams({page_id:pageId,page_type:pageType});
      const res=await fetch(`${API}?${qs}`,{headers:HEADERS});
      if(!res.ok)throw new Error();
      const data=await res.json();
      const reviews=data.reviews||[];
      const score=avg(reviews.map(r=>r.rating));
      const scoreNode=root.querySelector('[data-traveler-score]');
      const countNode=root.querySelector('[data-review-count]');
      if(scoreNode)scoreNode.textContent=score==null?'—':score.toFixed(1).replace('.',',');
      if(countNode)countNode.textContent=reviews.length?`En ${reviews.length} valoración${reviews.length===1?'':'es'}`:'Sin valoraciones publicadas';
    }catch(e){
      const countNode=root.querySelector('[data-review-count]');
      if(countNode)countNode.textContent='Valoraciones no disponibles ahora';
    }
  }
  document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('[data-review-summary]').forEach(init));
})();