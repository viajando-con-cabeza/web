# Instagram a la portada VCC (quality)

La portada mostra una targeta d'Instagram que conserva el disseny anterior. Quan
hi ha dades oficials autoritzades, es pot navegar entre **5 publicacions reals**.
Si no hi ha autorització, torna a mostrar la imatge editorial i un enllaç al perfil.

## Què falta per activar el compte real

1. El compte **@viajaconcabeza** ha de ser **Professional (Creator o Business)**.
2. Des de [Meta for Developers](https://developers.facebook.com/), autoritzar
   una aplicació amb *Instagram API with Instagram Login* i el permís
   `instagram_business_basic` per al compte @viajaconcabeza.
3. Obtenir un **token d'usuari d'Instagram de llarga durada** (60 dies).
   **No compartir el token per xat, no afegir-lo a fitxers ni fer-lo públic.**
4. A GitHub → `viajando-con-cabeza/web` → Settings → Secrets and variables
   → Actions, afegir `INSTAGRAM_ACCESS_TOKEN` (preferentment a l'entorn `quality`).
5. Per **provar sense tocar main**, executar manualment el workflow
   **Quality** a la branca `quality`. El pas final sincronitza
   `configuracion/datos/instagram-ultimo.json` si hi ha token.
6. Revisar la portada quality, les fotografies, els Reels i els enllaços.
7. Després d'aprovar, promoure el workflow
   `.github/workflows/actualizar-instagram.yml` a `main`.
   A partir d'aquest moment, GitHub Actions podrà actualitzar
   automàticament el JSON de `quality` dues vegades al dia.

> **Important:** GitHub executa els `schedule` només des de la branca
> predeterminada `main`. Crear el fitxer a `quality` no activa encara el cron.

## Fitxers

- `configuracion/js/inicio-instagram.js`: carrusel, validació i fallback.
- `configuracion/css/inicio-instagram-feed.css`: fletxes compactes adaptades a mòbil.
- `configuracion/datos/instagram-ultimo.json`: dades **públiques**, sense secrets.
- `configuracion/scripts/actualizar-instagram.mjs`: consulta oficial a Meta des de servidor.
- `.github/workflows/actualizar-instagram.yml`: actualització programada quan és a main.
- `.github/workflows/quality.yml`: verificació i prova manual a quality.

## Manteniment i seguretat

Els tokens de llarga durada requereixen renovació **abans dels 60 dies**
(per exemple, cada 30 dies). El codi no publica ni registra cap token, però
tampoc pot renovar amb seguretat un secret de GitHub automàticament si Meta
en retorna un de nou: actualitzar el secret abans que caduqui.

El generador rebutja tokens de qualsevol compte diferent de @viajaconcabeza,
no escriu cap dada si Meta falla i selecciona les últimes publicacions
amb fotografia. En els Reels fa servir la miniatura oficial en lloc del vídeo.
El navegador no accedeix directament a Meta amb credencials.
