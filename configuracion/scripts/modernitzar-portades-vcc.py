#!/usr/bin/env python3
"""Color-grade the six ORIGINAL VCC hero WebPs from branch quality.

No AI, no new objects, no crop, no resize, no changes to originals.
Produces non-destructive WebP + AVIF previews and a JPG contact sheet.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import numpy as np

ROOT = Path("configuracion/imagenes/fondos")
OUT = ROOT / "previews-moderns"
OUT.mkdir(parents=True, exist_ok=True)
NAMES = ["inicio", "destinos", "itinerarios", "planifica", "contacto", "nosotros"]

def contemporary_grade(img):
    """Lift shadows, tame sepia/yellow and balance neutral whites with moderate contrast."""
    rgb = np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0
    red, green, blue = rgb[...,0], rgb[...,1], rgb[...,2]
    lum = 0.2126*red + 0.7152*green + 0.0722*blue
    # Suppress exaggerated yellow/orange saturation selectively.
    warmth = np.clip((red - blue - 0.055) * 1.75, 0, 1)
    saturation = 0.935 - 0.22 * warmth
    rgb = lum[...,None] + (rgb - lum[...,None]) * saturation[...,None]
    # Cool the overly amber cast; leave natural golden sunlight and VCC orange recognizable.
    balance = 0.53 + 0.47 * (1.0 - lum)
    rgb[...,0] *= (1.0 - 0.044 * balance)
    rgb[...,1] *= (1.0 + 0.007 * balance)
    rgb[...,2] *= (1.0 + 0.083 * balance)
    # Modern editorial finish: a mild midtone lift and gentle local-free contrast.
    rgb = np.clip(rgb, 0, 1)
    rgb = np.power(rgb, 0.945)
    rgb = (rgb - 0.47) * 1.045 + 0.47
    rgb = np.clip(rgb, 0, 1)
    return Image.fromarray(np.round(rgb * 255).astype("uint8"), "RGB")

comparisons=[]
for name in NAMES:
    source=ROOT / f"fondos-{name}.webp"
    if not source.is_file():
        raise SystemExit(f"Missing original {source}")
    with Image.open(source) as src:
        src.load()
        original = src.convert("RGB")
        grade = contemporary_grade(original)
    assert original.size == grade.size
    out_webp = OUT / f"fondos-{name}-modern.webp"
    out_avif = OUT / f"fondos-{name}-modern.avif"
    grade.save(out_webp, "WEBP", quality=89, method=6)
    grade.save(out_avif, "AVIF", quality=80, speed=6)
    with Image.open(out_webp) as check:
        assert check.size == original.size, name
    with Image.open(out_avif) as check:
        assert check.size == original.size, name
    print(f"{name}: {original.size}; WEBP {out_webp.stat().st_size//1024} KB; AVIF {out_avif.stat().st_size//1024} KB")
    width=665
    h=round(original.height*width/original.width)
    comparisons.append((name.upper(),original.resize((width,h),Image.Resampling.LANCZOS),
                        grade.resize((width,h),Image.Resampling.LANCZOS)))
# Standardized 2-column before/after contact sheet; image overlays are only in sheet.
margin, gap, head, label = 20, 12, 54, 30
w=2*665 + 2*margin + gap
rowh=max(x[1].height for x in comparisons)+label+12
canvas=Image.new("RGB",(w,head+len(comparisons)*rowh+margin),(246,247,248))
draw=ImageDraw.Draw(canvas)
draw.text((margin,12),"VCC / QUALITY · ORIGINAL (ESQUERRA)  vs  MODERN (DRETA)",fill=(34,40,47))
for i,(title,before,after) in enumerate(comparisons):
    y=head+i*rowh
    draw.text((margin,y),f"{title} · ORIGINAL",fill=(35,40,45))
    draw.text((margin+665+gap,y),f"{title} · MODERN",fill=(35,40,45))
    canvas.paste(before,(margin,y+label))
    canvas.paste(after,(margin+665+gap,y+label))
canvas.save(OUT/"VCC-comparativa-original-vs-modern.jpg",quality=89,optimize=True)
print("Generated six original-preserving pairs. Original source files are untouched.")
