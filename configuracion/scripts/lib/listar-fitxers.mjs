/**
 * Inventari recursiu i de només lectura de fitxers del repositori.
 *
 * Retorna rutes relatives en format POSIX, també quan s'executa en Windows.
 * Cada auditoria conserva la seva pròpia llista de carpetes ignorades per
 * no modificar el seu abast ni els resultats històrics.
 */
import fs from 'node:fs';
import path from 'node:path';

export function listarFitxers(root, { directori = '', ignorar = [] } = {}) {
  const ometre = ignorar instanceof Set ? ignorar : new Set(ignorar);

  function recorrer(relatiu) {
    const fitxers = [];
    for (const entrada of fs.readdirSync(path.join(root, relatiu), { withFileTypes: true })) {
      if (ometre.has(entrada.name)) continue;
      const ruta = path.posix.join(relatiu, entrada.name);
      if (entrada.isDirectory()) fitxers.push(...recorrer(ruta));
      else if (entrada.isFile()) fitxers.push(ruta);
    }
    return fitxers;
  }

  return recorrer(directori);
}
