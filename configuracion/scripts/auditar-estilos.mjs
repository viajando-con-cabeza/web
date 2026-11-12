/**
 * Audita HTML i dependències CSS de la branca de treball.
 * Executa des de l'arrel del repositori:
 *   node configuracion/scripts/auditar-estilos.mjs
 * No modifica fitxers ni canvia l'aspecte del web.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', '.next', 'dist', '.cache']);
const htmlFiles = [];
function scan(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(ent.name)) continue;
    const full = join(dir, ent.name);
    if (ent.isDirectory()) scan(full);
    else if (ent.isFile() && ent.name.endsWith('.html')) htmlFiles.push(full);
  }
}
scan(root);

const report = [];
const assetsMissing = [];
for (const filename of htmlFiles) {
  const html = readFileSync(filename, 'utf8');
  const page = relative(root, filename).replaceAll('\\', '/');
  const styles = [...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi)].length;
  const inlineStyles = [...html.matchAll(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi)].map(m => m[2]);
  const staticInline = inlineStyles.filter(s => !s.split(';').filter(Boolean).every(decl => decl.trim().startsWith('--'))).length;
  const localCss = [];
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/\brel\s*=\s*["']stylesheet["']/i.test(tag)) continue;
    const url = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (url?.startsWith('/configuracion/')) {
      const path = decodeURIComponent(url.split('?')[0]).replace(/^\//, '');
      localCss.push(path);
      if (!existsSync(resolve(root, path))) assetsMissing.push({ page, path });
    }
  }
  const duplicates = [...new Set(localCss.filter((p, i) => localCss.indexOf(p) !== i))];
  report.push({ page, cssFiles: localCss.length, styleBlocks: styles, inlineStyles: inlineStyles.length, staticInline, duplicates });
}
report.sort((a, b) => b.cssFiles - a.cssFiles || b.staticInline - a.staticInline);
const summary = {
  htmlPages: report.length,
  totalLocalCssLinks: report.reduce((n, p) => n + p.cssFiles, 0),
  embeddedStyleBlocks: report.reduce((n, p) => n + p.styleBlocks, 0),
  inlineStyleAttributes: report.reduce((n, p) => n + p.inlineStyles, 0),
  presentationalInlineStyles: report.reduce((n, p) => n + p.staticInline, 0),
  pagesWithDuplicateStylesheets: report.filter(p => p.duplicates.length),
  unresolvedLocalCss: assetsMissing,
  pagesToReview: report.filter(p => p.styleBlocks || p.staticInline || p.cssFiles > 10).slice(0, 30)
};
console.log(JSON.stringify(summary, null, 2));
if (process.argv.includes('--fail-missing') && assetsMissing.length) process.exitCode = 1;
