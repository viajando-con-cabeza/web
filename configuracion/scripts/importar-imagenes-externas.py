#!/usr/bin/env python3
"""Descarrega fotos d'Unsplash a GitHub. Sols reescriu si la imatge existeix."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import re,json,time,sys
ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'configuracion/imagenes/externas/unsplash'
REGEX=re.compile(r'https://images\.unsplash\.com/(photo-[a-zA-Z0-9-]+)(?:\?[^\"\'\s<>)]*)?')
SKIP={'.git','node_modules','dist','build'}
paths=[p for p in ROOT.rglob('*') if p.suffix.lower() in {'.html','.css','.js','.mjs'} and not set(p.relative_to(ROOT).parts)&SKIP]
refs=set()
for p in paths:
 for m in REGEX.finditer(p.read_text(encoding='utf-8')):refs.add(m.group(1))
DEST.mkdir(parents=True,exist_ok=True)
done,errors={},{}
for i,photo in enumerate(sorted(refs),1):
 out=DEST/(photo+'.webp')
 if not out.is_file() or out.stat().st_size<200:
  url='https://images.unsplash.com/'+photo+'?fm=webp&fit=max&w=2200&q=86'
  for attempt in range(3):
   try:
    with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0 (VCC asset migration)'}),timeout=30) as resp:blob=resp.read(8_000_000)
    if blob[:4]!=b'RIFF' or blob[8:12]!=b'WEBP':raise ValueError('La resposta no es WebP')
    out.write_bytes(blob);break
   except (HTTPError,URLError,TimeoutError,ValueError,OSError) as error:
    if attempt==2:errors[photo]=str(error)
    else:time.sleep(attempt+2)
 if out.is_file() and out.stat().st_size>200:done[photo]='/configuracion/imagenes/externas/unsplash/'+out.name
 if i%20==0:print('Fotografies processades',i,'/',len(refs))
for p in paths:
 src=p.read_text(encoding='utf-8')
 changed=REGEX.sub(lambda m:done.get(m.group(1),m.group(0)),src)
 if changed!=src:p.write_text(changed,encoding='utf-8')
manifest={'source':'Unsplash','license':'https://unsplash.com/license','files':done,'unresolved':errors}
(ROOT/'configuracion/datos/imagenes-externas-migrades.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('Migrades',len(done),'fotos. Pendents',len(errors))
for name,reason in errors.items():print('PENDENT',name,reason,file=sys.stderr)
if errors:sys.exit(1)
