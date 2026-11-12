#!/usr/bin/env python3
"""VCC · fons editorial d'Apps de viaje. Foto panoràmica clara,
natural i sense filtres negres, text ni gràfics superposats.
Les variants mòbil/escriptori les fa generar-portadas-rapidas.py.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
FONDOS = ROOT / "configuracion/imagenes/fondos"
SOURCE = FONDOS / "fondos-planifica.webp"
OUTPUT = FONDOS / "fondos-apps-editorial.webp"

def generar():
    if OUTPUT.exists() and OUTPUT.stat().st_size > 4096:
        return False
    if not SOURCE.is_file():
        raise FileNotFoundError(f"No se encuentra la fotografía de Planifica: {SOURCE}")
    with Image.open(SOURCE) as base:
        photo = ImageOps.fit(ImageOps.exif_transpose(base).convert("RGB"),
            (1920, 650), method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5))
    # Edición limpia: luz y matiz natural; ninguna dominante retro ni sombreado.
    photo = ImageEnhance.Brightness(photo).enhance(1.12)
    photo = ImageEnhance.Contrast(photo).enhance(0.96)
    photo = ImageEnhance.Color(photo).enhance(1.03)
    photo.save(OUTPUT, "WEBP", quality=81, method=6)
    print(f"Apps portada editorial: {OUTPUT} — {OUTPUT.stat().st_size} bytes")
    return True

if __name__ == "__main__":
    generar()
