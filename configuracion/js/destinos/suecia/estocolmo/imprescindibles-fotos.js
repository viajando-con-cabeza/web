/* Fotos pròpies VCC, comprovades al bucket R2 vcc-images (novembre 2026).
   Cada fitxa utilitza fotos de la seva zona o les vistes que l'envolten.
   Sense imatges pròpies identificades: Vasa, Skansen, Fotografiska i Kungsträdgården. */
(() => {
  'use strict';
  const host='https://img.viajandoconcabeza.com/destinos/suecia/';
  // Separam l'any per compatibilitat amb una transformació antiga de quality.
  const stock=host+'estocolmo/'+'20'+'26-dia';
  const arch=host+'estocolmo-archipelago/'+'20'+'26-dia8/';
  const s6=id=>stock+'6/DSC'+id+'.avif';
  const s7=id=>stock+'7/DSC'+id+'.avif';
  const a=id=>arch+'DSC'+id+'.avif';
  window.VCC_STOCKHOLM_PHOTOS=Object.freeze({
    'gamla-stan': [s6('07952'), s6('07953'), s6('07955'), s6('07978'), s6('07980'), s6('07981'), s6('07992'), s6('08006'), s6('08009')],
    'djurgarden': [s7('08152'), s7('08153'), s7('08284'), s7('08285'), s7('08286'), s7('08288'), s7('08289'), s7('08290'), s7('08292'), s7('08305')],
    'ayuntamiento': [s7('08176'), s7('08177'), s7('08199'), s6('08025'), s6('08042'), s6('08081'), s6('08082'), s6('08087'), s6('08088')],
    'sodermalm': [s6('08025'), s6('08037'), s6('08038'), s6('08039'), s6('08041'), s6('08063'), s6('08064'), s6('08065'), s6('08080')],
    'montelius': [s6('08026'), s6('08037'), s6('08038'), s6('08039'), s6('08041'), s6('08065'), s6('08080'), s6('08081'), s6('08082')],
    'stortorget': [s6('07952'), s6('07953'), s6('07955')],
    'riddarholmen': [s6('07935'), s6('07936'), s6('07939'), s6('08023'), s6('08065'), s6('08066'), s6('08067'), s6('08080')],
    'metro': [s7('08140'), s7('08141'), s7('08143'), s7('08144'), s7('08146'), s7('08147'), s7('08148')],
    'ferry': [s7('08149'), s7('08228'), s7('08229'), s7('08231'), s7('08232'), s7('08234'), s7('08243'), s7('08249'), s7('08257'), a('08332'), a('08333'), a('08335'), a('08336'), a('08337'), a('08342'), a('08344'), a('08345'), a('08360')],
    'palacio': [s6('07943'), s6('07944'), s6('07945'), s6('07946'), s6('07948'), s6('07949'), s6('07950'), s6('07951'), s7('08221'), s7('08222'), s7('08223'), s7('08225')],
    'stromkajen': [s7('08228'), s7('08229'), s7('08231'), s7('08232'), s7('08234'), s7('08243'), s7('08244'), s7('08249'), s7('08251'), s7('08252'), s7('08254'), s7('08255'), s7('08257')]
  });
})();
