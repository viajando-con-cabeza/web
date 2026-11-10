"""Build a responsive mobile WebP from the exact approved Cuándo ir hero.

The desktop original is never modified. Run on quality in the dedicated CI workflow.
"""
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "configuracion/imagenes/fondos/fondos-cuando-ir.webp"
TARGET = ROOT / "configuracion/imagenes/fondos/fondos-cuando-ir-mobile.webp"

assert SOURCE.is_file(), f"Missing shared hero: {SOURCE}"
with Image.open(SOURCE) as original:
    picture = ImageOps.exif_transpose(original).convert("RGB")
    size = picture.size
    options = []
    for max_width in (2000, 1800, 1600):
        scale = min(1, max_width / picture.width)
        resized = picture.resize(
            (round(picture.width * scale), round(picture.height * scale)),
            Image.Resampling.LANCZOS,
        ) if scale < 1 else picture
        for quality in (80, 74, 68):
            out = BytesIO()
            resized.save(out, "WEBP", quality=quality, method=6)
            options.append((len(out.getvalue()), resized.size, quality, out.getvalue()))
            if out.tell() <= 185_000:
                break
        if options[-1][0] <= 185_000:
            break

    candidates = [x for x in options if x[0] <= 185_000]
    best = candidates[0] if candidates else min(options, key=lambda x: x[0])
    TARGET.write_bytes(best[3])
    print(f"Mobile hero created: {TARGET.relative_to(ROOT)}")
    print(f"Original {size}: {SOURCE.stat().st_size:,} bytes")
    print(f"Mobile {best[1]}, WebP quality {best[2]}: {best[0]:,} bytes")
    if best[0] >= SOURCE.stat().st_size:
        raise RuntimeError("Mobile version is not smaller than the original hero.")
