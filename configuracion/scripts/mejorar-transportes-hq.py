#!/usr/bin/env python3
"""Upscale the five ORIGINAL VCC transport drawings, keep their appearance and wrap at higher density.

The outputs are display-resolution improvements, NOT true vector tracing or recovery of missing detail.
Source files are intentionally never modified.
"""
from pathlib import Path
from io import BytesIO
import base64, re
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'configuracion' / 'imagenes'
DEST = SRC / 'ilustraciones' / 'transportes'
DEST.mkdir(parents=True, exist_ok=True)
NAMES = ('avion', 'tren', 'ferry', 'autobus', 'coche')
LABELS = {'avion':'Avión', 'tren':'Tren', 'ferry':'Ferri', 'autobus':'Autobús', 'coche':'Coche'}
VERSION = '20261106-transportes-hq-v2'
SCALE = 4

for name in NAMES:
    source = SRC / f'como-llegar-{name}-vcc.webp'
    with Image.open(source) as original:
        original.load()
        assert original.size == (320,210), f'Unexpected size for {source}: {original.size}'
        rgba = original.convert('RGBA')
    # High-quality resize without modifying the original illustration's composition.
    resized = rgba.resize((rgba.width*SCALE, rgba.height*SCALE), Image.Resampling.LANCZOS)
    # Light sharpening improves edge definition at retina density; preserve original colours.
    resized = resized.filter(ImageFilter.UnsharpMask(radius=1.5, percent=115, threshold=3))
    webp_path = DEST / f'transporte-{name}-hq.webp'
    resized.save(webp_path, format='WEBP', lossless=True, method=6, exact=True)
    with Image.open(webp_path) as check:
        check.verify()
    data = base64.b64encode(webp_path.read_bytes()).decode('ascii')
    title=LABELS[name]
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="210" viewBox="0 0 320 210" role="img" aria-label="{title} original de VCC, resolución mejorada"><title>{title} · Viajando con Cabeza</title><image x="0" y="0" width="320" height="210" preserveAspectRatio="none" href="data:image/webp;base64,{data}"/></svg>'
    (DEST / f'transporte-{name}.svg').write_text(svg, encoding='utf-8')
    print(name, original.size if False else (320,210), '→', resized.size, webp_path.stat().st_size, 'bytes')

html_path = ROOT / 'destinos/suecia/estocolmo/como-llegar.html'
css_path = ROOT / 'configuracion/css/plantillas/como-llegar-vcc.css'
for file in (html_path, css_path):
    content=file.read_text(encoding='utf-8')
    # Normalize any previous cache-buster suffix (including accidentally duplicated tokens).
    suffix=r'''(?:\?[^"'<> )]*)?'''
    for name in NAMES:
        url=f'/configuracion/imagenes/ilustraciones/transportes/transporte-{name}.svg'
        content=re.sub(re.escape(url)+suffix,lambda m:url+'?v='+VERSION,content)
    if file==html_path:
        css_url='/configuracion/css/plantillas/como-llegar-vcc.css'
        content=re.sub(re.escape(css_url)+suffix,lambda m:css_url+'?v='+VERSION,content)
    file.write_text(content, encoding='utf-8')
    print('Updated',file.relative_to(ROOT))
