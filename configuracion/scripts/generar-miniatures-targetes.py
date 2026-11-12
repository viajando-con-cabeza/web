#!/usr/bin/env python3
"""VCC · Miniatures WebP per targetes editorials basades en fotos locals.

Mateixa imatge, sense retalls ni filtres. Originals intactes.
Només les fotos WebP >250 KB que s'utilitzen en pàgines aprovades.
Cridar abans de publicar-miniatures-targetes.mjs.
"""
import hashlib
import json
import re
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "configuracion/imagenes/externas/unsplash"
OUTPUT = SOURCE / "optimizadas"
OUTPUT.mkdir(parents=True, exist_ok=True)
MANIFEST = OUTPUT / "manifest.json"
REGISTRY = json.loads((ROOT / "configuracion/datos/publicacion-vcc.json").read_text())
SIZES = (480, 960, 1600)
QUALITY = 86
MIN_BYTES = 250_000
RX_TAG = re.compile(r"<img\b[^>]*>", re.I)
RX_SRC = re.compile(r'\b(?:data-vcc-card-source|src)=["\'](/configuracion/imagenes/externas/unsplash/[^"\']+?\.webp)', re.I)
previous = {}
if MANIFEST.exists():
    try:
        previous = json.loads(MANIFEST.read_text()).get("images", {})
    except (ValueError, OSError):
        previous = {}
references = set()
for page in REGISTRY["approved"]:
    html = (ROOT / page).read_text()
    for tag in RX_TAG.findall(html):
        # La font canònica es manté a data-vcc-card-source després del primer sync.
        source_attr = re.search(r'\bdata-vcc-card-source=["\']([^"\']+)', tag, re.I)
        src_attr = re.search(r'\bsrc=["\']([^"\']+)', tag, re.I)
        name = (source_attr or src_attr)
        if not name:
            continue
        url = name.group(1).split("?")[0]
        if not RX_SRC.search('src="' + url + '"') or "/optimizadas/" in url:
            continue
        file_path = ROOT / url.lstrip("/")
        if file_path.is_file() and file_path.stat().st_size >= MIN_BYTES:
            references.add(file_path)
items = {}
changed = 0
for source in sorted(references):
    fingerprint = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
    variants = {}
    with Image.open(source) as image:
        base = ImageOps.exif_transpose(image)
        if base.mode not in ("RGB", "RGBA"):
            base = base.convert("RGBA" if "A" in base.getbands() else "RGB")
        for width in SIZES:
            dest = OUTPUT / f"{source.stem}-{width}.webp"
            resized = base.copy()
            resized.thumbnail((width, width * 10), Image.Resampling.LANCZOS)
            cached = previous.get(source.name, {})
            if (not dest.exists() or cached.get("fingerprint") != fingerprint
                    or cached.get("variants", {}).get(str(width), {}).get("bytes") != dest.stat().st_size):
                resized.save(dest, "WEBP", quality=QUALITY, method=5)
                changed += 1
            variants[str(width)] = {
                "path": "/configuracion/imagenes/externas/unsplash/optimizadas/" + dest.name,
                "width": resized.width,
                "height": resized.height,
                "bytes": dest.stat().st_size,
            }
        items[source.name] = {
            "source": "/configuracion/imagenes/externas/unsplash/" + source.name,
            "sourceBytes": source.stat().st_size,
            "fingerprint": fingerprint,
            "variants": variants,
        }
manifest = {"version": 1, "quality": QUALITY, "minSourceBytes": MIN_BYTES, "images": items}
content = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
if not MANIFEST.exists() or MANIFEST.read_text() != content:
    MANIFEST.write_text(content)
print(f"VCC targetes: {len(items)} fotos grans, {changed} variants generades, sense filtres ni retalls.")
