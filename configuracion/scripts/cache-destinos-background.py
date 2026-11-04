#!/usr/bin/env python3
"""Cache the Destinos hero locally as an optimized WebP.
Runs only when the destination asset does not already exist.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from io import BytesIO
from PIL import Image

target = Path("configuracion/imagenes/fondos/destinos-background.webp")
if target.exists():
    print(f"Already cached: {target}")
else:
    url = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=90"
    request = Request(url, headers={"User-Agent": "ViajandoConCabeza/1.0"})
    with urlopen(request, timeout=35) as response:
        data = response.read()
    image = Image.open(BytesIO(data)).convert("RGB")
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, "WEBP", quality=85, method=6)
    print(f"Created {target} ({image.width}x{image.height}; {target.stat().st_size} bytes)")
