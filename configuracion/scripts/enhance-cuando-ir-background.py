"""Create a sharper 2x WebP hero from the existing original on quality."""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
src=Path("configuracion/imagenes/fondos/cuando-ir-vcc-background.webp")
dst=Path("configuracion/imagenes/fondos/cuando-ir-vcc-background-hq.webp")
if not src.exists():
    raise SystemExit("Original WebP not found: "+str(src))
with Image.open(src) as original:
    img=original.convert("RGB")
    img=img.resize((img.width*2,img.height*2), Image.Resampling.LANCZOS)
    img=ImageEnhance.Contrast(img).enhance(1.06)
    img=img.filter(ImageFilter.UnsharpMask(radius=1.4,percent=115,threshold=3))
    img.save(dst,"WEBP",quality=94,method=6)
print("Created",dst,img.size)
