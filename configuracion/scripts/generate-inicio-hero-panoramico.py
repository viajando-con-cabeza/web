#!/usr/bin/env python3
"""Genera el hero panoràmic d'Inici a partir del WebP original, sense estirar els logotips."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw

root = Path(__file__).resolve().parents[2]
folder = root / "configuracion" / "imagenes" / "fondos"
source = folder / "inicio-vcc-hero.webp"
target = folder / "inicio-vcc-hero-panoramico.webp"
image = Image.open(source).convert("RGB")
width, height = 3000, 1000

# Fotografia de la dreta sense deformar ni retallar les lletres o el logo.
foreground = image.resize((round(image.width * height / image.height), height), Image.Resampling.LANCZOS)
left = width - foreground.width

# Ampliació suau de paisatge darrere del text.
out = image.resize((width, height), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(85))
layer = Image.new("RGB", (width, height))
layer.paste(foreground, (left, 0))
mask = Image.new("L", (width, height), 0)
draw = ImageDraw.Draw(mask)
for x in range(left, width):
    strength = int(255 * max(0, min(1, (x - left) / 450)))
    draw.line((x, 0, x, height), fill=strength)
out.paste(layer, (0, 0), mask)

# Aclariment gradual de la zona del text, sense franges ni vores.
paper = Image.new("RGB", (width, height), (250, 245, 238))
veil = Image.new("L", (width, height), 0)
draw = ImageDraw.Draw(veil)
for x in range(width):
    strength = int(170 * max(0, min(1, (1420 - x) / 1420)))
    draw.line((x, 0, x, height), fill=strength)
out.paste(paper, (0, 0), veil)
out.save(target, "WEBP", quality=94, method=6)
print(f"Generated {target} ({target.stat().st_size} bytes, {width}x{height})")
