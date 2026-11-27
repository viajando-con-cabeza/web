(function(){
  const card=document.querySelector('#madrid');
  if(!card)return;
  const copy=card.querySelector('.region-copy');
  if(!copy)return;
  const label=copy.querySelector('span');
  const text=copy.querySelector('p');
  const action=copy.querySelector('.region-action');
  if(label)label.textContent='COMUNIDAD AUTÓNOMA · 2 ITINERARIOS';
  if(text)text.textContent='Madrid en tres días y la extensión final de la gran ruta por Andalucía.';
  if(action)action.innerHTML='<a href="madrid/">EXPLORAR MADRID →</a>';
  card.classList.add('available');
})();
