"""Generate one optimized WebP mountain footer image without modifying the original.

Run by the quality workflow only if the optimized version does not yet exist.
Shared VCC footer styling can then point to the generated asset. The original
remains versioned in Git, and compression is not repeated on later CI runs.
"""
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ORIGINAL = ROOT / "configuracion/imagenes/externas/unsplash/photo-1464822759023-fed622ff2c3b.webp"
OPTIMIZED = ROOT / "configuracion/imagenes/externas/unsplash/photo-1464822759023-fed622ff2c3b-vcc-optimizado.webp"

def main():
    if OPTIMIZED.is_file():
        print("Optimized mountain background already exists:", OPTIMIZED)
        return
    original_bytes = ORIGINAL.stat().st_size
    with Image.open(ORIGINAL) as raw:
        image = ImageOps.exif_transpose(raw).convert("RGB")
    old_size = image.size
    candidates = [(2048, 84), (1920, 83), (1800, 82), (1600, 82)]
    chosen = None
    for max_width, quality in candidates:
        resized = image.copy()
        if resized.width > max_width:
            resized.thumbnail((max_width, max_width * 10), Image.Resampling.LANCZOS)
        buf = BytesIO()
        resized.save(buf, "WEBP", quality=quality, method=6, exact=True)
        data = buf.getvalue()
        chosen = (data, resized.size, quality)
        if len(data) <= original_bytes * 0.75:
            break
    data, new_size, quality = chosen
    if len(data) >= original_bytes * 0.90:
        raise RuntimeError(f"Optimization saved less than 10% ({original_bytes} -> {len(data)} bytes). Keep original.")
    OPTIMIZED.write_bytes(data)
    print(f"Mountain footer: {old_size} -> {new_size}, WebP q{quality}; "
          f"{original_bytes:,} -> {len(data):,} bytes "
          f"({(1-len(data)/original_bytes)*100:.1f}% reduction).")

if __name__ == "__main__":
    main()
