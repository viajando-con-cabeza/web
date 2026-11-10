/* VCC · Galeria UI: etiqueta canònica i estils compartits.
   La resta de gestos/modal segueixen gestionats pel controlador de cada guia. */
(() => {
'use strict';
const labels=Object.freeze({
 backToGallery:'← Galería'
});
function decorate(root=document){
 for(const el of root.querySelectorAll('.vcc-dg-photo-back, .day-lightbox-to-grid')){
  el.classList.add('vcc-gallery-ui-back');
  el.textContent=labels.backToGallery;
 }
}
window.VCCGalleryUI=Object.freeze({labels,decorate});
})();
