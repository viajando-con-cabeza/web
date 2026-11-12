#!/usr/bin/env python3
"""Genera el WebP móvil de la portada de Estocolmo desde la MISMA foto de R2.

Sin alterar brillo, contraste, saturación ni recortar la foto. Solo redimensionar
a 960 px de ancho y recomprimir. Ejecutado automáticamente en CI de quality.
"""
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
import sys

from PIL import Image, ImageOps

try:
    import pillow_avif  # noqa: F401  # registra el decodificador AVIF de Pillow
except ImportError:
    print("Falta pillow-avif-plugin (pip install pillow-avif-plugin)", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "configuracion/imagenes/fondos/optimizadas/estocolmo-itinerario-dia1-960.webp"
SOURCE = (
    "https://img.viajandoconcabeza.com/__vcc_preview/visor/"
    "destinos/suecia/estocolmo/2026-dia6/DSC07935-VSCO.avif"
)

if DEST.is_file() and DEST.stat().st_size > 10_000:
    print(f"Portada Estocolmo lista: {DEST.relative_to(ROOT)} ({DEST.stat().st_size:,} bytes)")
    sys.exit(0)

request = Request(SOURCE, headers={"User-Agent": "VCC-Editorial-Optimizations/1.0"})
with urlopen(request, timeout=40) as response:
    if response.headers.get_content_type() not in ("image/avif", "application/octet-stream"):
        raise ValueError("La fuente R2 no devuelve AVIF")
    data = response.read()
if not data or len(data) < 10_000:
    raise ValueError("La fotografía de origen está vacía")

with Image.open(BytesIO(data)) as source:
    image = ImageOps.exif_transpose(source).convert("RGB")
    if image.width < 960:
        raise ValueError("La foto original es demasiado pequeña para 960 px")
    image.thumbnail((960, 9600), Image.Resampling.LANCZOS)
    if image.width != 960 or image.height < 500:
        raise ValueError(f"Dimensiones inesperadas: {image.size}")
    DEST.parent.mkdir(parents=True, exist_ok=True)
    image.save(DEST, "WEBP", quality=76, method=6)
    print(
        f"Portada Estocolmo: {source.size} AVIF, {len(data)//1024} KiB"
        f" -> {image.size} WebP, {DEST.stat().st_size//1024} KiB. Sin filtros ni recortes."
    )
