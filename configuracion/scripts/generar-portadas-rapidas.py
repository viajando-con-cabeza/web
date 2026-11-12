#!/usr/bin/env python3
"""VCC · variants WebP originals (sense filtres ni retalls) per a portades i targetes.

Executar des de l'arrel: python configuracion/scripts/generar-portadas-rapidas.py
La mateixa fotografia serveix al mòbil i l'escriptori, únicament reduïda i recomprimida.
Els assets nous es desen a /fondos/optimizadas, originals intactes.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
FONDOS = ROOT / "configuracion/imagenes/fondos"
OUTPUT = FONDOS / "optimizadas"
OUTPUT.mkdir(parents=True, exist_ok=True)
WIDTHS = (480, 960, 1920)
QUALITY = 79
items = {}
changed = 0
OLD_MANIFEST = {}
old_path = OUTPUT / "manifest.json"
if old_path.exists():
    try:
        OLD_MANIFEST = json.loads(old_path.read_text()).get("images", {})
    except (ValueError, OSError):
        OLD_MANIFEST = {}

for source in sorted(FONDOS.glob("fondos-*.webp")):
    # Una antiga fotografia alternativa mòbil NO és font de variants: mantenim la principal.
    if source.stem.endswith(("-mobile", "-movil", "-tablet")):
        continue
    fingerprint = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
    variants = {}
    with Image.open(source) as base:
        base = ImageOps.exif_transpose(base)
        if base.mode not in ("RGB", "RGBA"):
            base = base.convert("RGBA" if "A" in base.getbands() else "RGB")
        for width in WIDTHS:
            dest = OUTPUT / f"{source.stem}-{width}.webp"
            img = base.copy()
            img.thumbnail((width, width * 10), Image.Resampling.LANCZOS)
            if (not dest.exists() or
                OLD_MANIFEST.get(source.stem, {}).get("fingerprint") != fingerprint or
                OLD_MANIFEST.get(source.stem, {}).get("variants", {}).get(str(width), {}).get("bytes") != dest.stat().st_size):
                img.save(dest, "WEBP", quality=QUALITY, method=5)
                changed += 1
            variants[str(width)] = {
                "path": "/configuracion/imagenes/fondos/optimizadas/" + dest.name,
                "bytes": dest.stat().st_size,
                "width": img.width,
                "height": img.height,
            }
    items[source.stem] = {
        "source": "/configuracion/imagenes/fondos/" + source.name,
        "sourceBytes": source.stat().st_size,
        "fingerprint": fingerprint,
        "variants": variants,
    }

manifest = {"version": 1, "quality": QUALITY, "images": items}
manifest_path = OUTPUT / "manifest.json"
new = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
if not manifest_path.exists() or manifest_path.read_text() != new:
    manifest_path.write_text(new)
print(f"Portades VCC: {len(items)} originals, {changed} variants WebP actualitzades. "
      "Fotografies, colors i retalls originals conservats.")
for name, info in items.items():
    if info["sourceBytes"] >= 500_000:
        print(f"  {name}: {info['sourceBytes']//1024} KB → "
              f"960px {info['variants']['960']['bytes']//1024} KB / "
              f"1920px {info['variants']['1920']['bytes']//1024} KB")
