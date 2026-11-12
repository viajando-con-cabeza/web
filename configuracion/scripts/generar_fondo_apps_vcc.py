#!/usr/bin/env python3
"""VCC · Hero fotogràfic d'Actividades y reservas.

Composició original d'una app de reserva al mòbil sobre fotografia de viatge,
sense marques externes ni cap destí concret. Es genera amb Pillow des de fotos
ja existents al repositori; el build prepara les variants WebP optimitzades.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
FONDOS = ROOT / "configuracion/imagenes/fondos"
SOURCE = FONDOS / "fondos-entradas-y-pases.webp"
OUTPUT = FONDOS / "fondos-actividades-reservas.webp"

def fnt(size, bold=False):
    base = "/usr/share/fonts/truetype/dejavu/"
    path = base + ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()

def generar():
    if OUTPUT.exists() and OUTPUT.stat().st_size > 4096:
        return False
    if not SOURCE.is_file():
        raise FileNotFoundError(f"No existe imagen de referencia: {SOURCE}")

    size = (1920, 650)
    with Image.open(SOURCE) as src:
        base = ImageOps.fit(ImageOps.exif_transpose(src).convert("RGB"), size,
                            method=Image.Resampling.LANCZOS, centering=(0.56, 0.47))
        miniature = ImageOps.fit(src.convert("RGB"), (286, 154),
                                 method=Image.Resampling.LANCZOS, centering=(0.50, 0.52))
    base = ImageEnhance.Brightness(base).enhance(1.38)
    base = ImageEnhance.Contrast(base).enhance(0.88)
    base = ImageEnhance.Color(base).enhance(1.10)
    canvas=base.convert("RGBA")

    # Editorial net: llum natural, sense degradat negre ni to retro.
    mist=Image.new("RGBA", size, (0,0,0,0))
    m=ImageDraw.Draw(mist,"RGBA")
    for x in range(0, size[0], 6):
        ratio=x/size[0]
        opacity=int(98*(1-ratio)**2 + 12)
        m.rectangle((x,0,x+6,size[1]), fill=(254,251,246,opacity))
    canvas=Image.alpha_composite(canvas,mist)

    # Smartphone amb una interfície gràfica versemblant de tours/entrades.
    phone=Image.new("RGBA",(412,650),(0,0,0,0))
    d=ImageDraw.Draw(phone,"RGBA")
    d.rounded_rectangle((42,20,369,632),radius=54,fill=(29,34,40,255))
    d.rounded_rectangle((50,28,361,624),radius=48,fill=(246,248,249,255))
    d.rounded_rectangle((153,34,254,50),radius=9,fill=(29,34,40,255))
    d.text((75,75),"Descubre actividades",font=fnt(20,True),fill=(35,44,47))
    d.rounded_rectangle((74,112,340,155),radius=15,fill=(234,238,237,255))
    d.ellipse((90,125,103,138),outline=(220,99,42,255),width=3)
    d.line((101,137,107,143),fill=(220,99,42,255),width=3)
    d.text((117,123),"Busca un tour o entrada",font=fnt(12),fill=(92,104,106))
    mask=Image.new("L",miniature.size,0)
    ImageDraw.Draw(mask).rounded_rectangle((0,0,285,153),radius=16,fill=255)
    phone.paste(miniature,(64,180),mask)
    d=ImageDraw.Draw(phone,"RGBA")
    d.rounded_rectangle((76,190,196,218),radius=10,fill=(253,250,245,237))
    d.text((86,197),"VISITAS GUIADAS",font=fnt(10,True),fill=(65,65,60))
    d.text((69,347),"Experiencias y excursiones",font=fnt(16,True),fill=(36,44,49))
    d.text((69,375),"Encuentra planes para tu viaje",font=fnt(11),fill=(90,103,109))
    for i in range(5):
        cx=78+i*21
        d.ellipse((cx,406,cx+13,419),fill=(234,132,47,255))
    d.rounded_rectangle((67,448,345,498),radius=14,fill=(251,252,250,255),outline=(219,225,222,255),width=2)
    d.ellipse((82,464,101,483),outline=(232,106,41,255),width=3)
    d.text((112,460),"Tours y actividades",font=fnt(13,True),fill=(39,47,49))
    d.text((112,479),"Compara y reserva",font=fnt(11),fill=(100,107,110))
    d.rounded_rectangle((69,523,344,572),radius=14,fill=(235,103,41,255))
    d.text((141,537),"VER OPCIONES",font=fnt(14,True),fill=(255,255,255))
    d.rounded_rectangle((165,602,246,608),radius=4,fill=(33,42,46,220))

    tilted=phone.rotate(8,Image.Resampling.BICUBIC,expand=True)
    x,y=1354,-12
    shade=Image.new("RGBA",tilted.size,(17,20,21,0))
    shade.putalpha(tilted.getchannel("A").point(lambda n:int(n*.32)))
    shadow=Image.new("RGBA",size,(0,0,0,0))
    shadow.alpha_composite(shade,(x+16,y+28))
    canvas=Image.alpha_composite(canvas,shadow.filter(ImageFilter.GaussianBlur(27)))
    canvas.alpha_composite(tilted,(x,y))
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    canvas.convert("RGB").save(OUTPUT, "WEBP", quality=83, method=6)
    print(f"Hero nuevo de actividades: {OUTPUT.name}: {OUTPUT.stat().st_size//1024} KB")
    return True

if __name__ == "__main__":
    generar()
