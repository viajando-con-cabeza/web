import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listarFitxers } from '../scripts/lib/listar-fitxers.mjs';

test('inventa fitxers recursivament, conserva rutes POSIX i respecta exclusions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vcc-arbre-'));
  try {
    for (const ruta of ['configuracion/css/base', 'configuracion/js', 'node_modules/pkg', 'dist']) {
      fs.mkdirSync(path.join(root, ruta), { recursive: true });
    }
    for (const ruta of ['configuracion/css/base/tokens.css', 'configuracion/js/app.js', 'node_modules/pkg/mod.js', 'dist/index.html']) {
      fs.writeFileSync(path.join(root, ruta), 'test');
    }
    const ignorar = new Set(['node_modules', 'dist']);
    assert.deepEqual(listarFitxers(root, { ignorar }).sort(), [
      'configuracion/css/base/tokens.css',
      'configuracion/js/app.js',
    ]);
    assert.deepEqual(listarFitxers(root, { directori: 'configuracion', ignorar }).sort(), [
      'configuracion/css/base/tokens.css',
      'configuracion/js/app.js',
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
