/**
 * SEO guardrail for the Stockholm arrival hub and guides.
 * Cloudflare Workers Static Assets with html_handling=auto-trailing-slash
 * publishes page.html at /page (without .html).
 * This is a static code-level check; live response headers need HTTP smoke tests.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const section = 'destinos/suecia/estocolmo/como-llegar';
const base = 'https://viajandoconcabeza.com/' + section;
const errors = [];
const assert = (okay, message) => { if (!okay) errors.push(message); };
const routes = JSON.parse(read('wrangler.jsonc'));
assert(routes.assets?.html_handling === 'auto-trailing-slash', 'wrangler: expected auto-trailing-slash HTML handling');

const sitemap = read('sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const files = [section + '.html', ...fs.readdirSync(path.join(root, section))
  .filter(name => name.endsWith('.html')).map(name => section + '/' + name)];
const hub = read(section + '.html');
const active = [...new Set([...hub.matchAll(/href="como-llegar\/([a-z0-9-]+)"/g)].map(m => m[1]))];
assert(active.length === 12, 'Expected 12 active transport guides linked in hub, found ' + active.length);
const activeUrls = [base, ...active.map(slug => base + '/' + slug)];

for (const url of activeUrls) {
  assert(sitemapUrls.includes(url), 'Sitemap is missing canonical URL ' + url);
}
assert(!sitemapUrls.some(url => url.startsWith(base) && url.endsWith('.html')),
  'Sitemap still lists .html URLs under Cómo llegar');

for (const file of files) {
  const html = read(file);
  const own = 'https://viajandoconcabeza.com/' + file.replace(/\.html$/, '');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
  assert(canonical === own, file + ': incorrect canonical (' + canonical + ')');
  if (ogUrl) assert(ogUrl === own, file + ': og:url differs from canonical');
  assert(!/href="(?:\.{0,2}\/|\/)[^"]+\.html(?:\?[^"]*)?"/.test(html),
    file + ': a local HTML link still uses .html');
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let json;
    try { json = JSON.parse(match[1]); } catch (error) {
      errors.push(file + ': invalid JSON-LD: ' + error.message);
      continue;
    }
    const graph = Array.isArray(json['@graph']) ? json['@graph'] : [json];
    for (const node of graph) {
      if (node['@type'] === 'WebPage') {
        assert(node.url === own, file + ': WebPage.url differs from canonical');
        assert(node['@id'] === own + '#webpage', file + ': WebPage @id differs from canonical');
      }
      if (node['@type'] === 'BreadcrumbList' && Array.isArray(node.itemListElement)) {
        const last = node.itemListElement.at(-1);
        assert(last?.item === own, file + ': last breadcrumb item differs from canonical');
      }
    }
  }
}

const headers = read('_headers');
for (const hostname of [
  'web-quality.albertini1199.workers.dev',
  'quality.viajandoconcabeza.com',
  'www.quality.viajandoconcabeza.com'
]) {
  const declaration = 'https://' + hostname + '/*';
  const index = headers.indexOf(declaration);
  assert(index !== -1 && /^\s+X-Robots-Tag:\s*noindex\b/im.test(headers.slice(index + declaration.length).split(/\n(?=\S)/)[0]),
    '_headers: no hostname-specific noindex for ' + hostname);
}
assert(!/\/\*\s*\n\s*X-Robots-Tag:\s*noindex/i.test(headers),
  '_headers: wildcard noindex could affect production');

if (errors.length) {
  for (const err of errors) console.error('SEO ERROR:', err);
  process.exitCode = 1;
} else {
  console.log('SEO OK:', files.length, 'arrival HTML pages checked;',
    activeUrls.length, 'sitemap URLs and staging noindex header rules validated.');
}
