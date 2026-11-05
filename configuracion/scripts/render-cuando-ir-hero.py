"""Build the destination-independent Cuándo ir illustrated hero as a crisp WebP."""
from pathlib import Path
import io
from PIL import Image
import cairosvg
source = Path("configuracion/imagenes/fondos/cuando-ir-vcc-ilustracion.svg")
output = Path("configuracion/imagenes/fondos/cuando-ir-vcc-ilustracion.webp")
png = cairosvg.svg2png(bytestring=source.read_bytes(),output_width=1800,output_height=760)
with Image.open(io.BytesIO(png)) as im:
    im.convert("RGB").save(output,format="WEBP",quality=91,method=6)
print(output,output.stat().st_size)
