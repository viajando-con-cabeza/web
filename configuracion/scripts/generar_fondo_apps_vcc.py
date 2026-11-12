#!/usr/bin/env python3
"""VCC / Apps: nueva portada fotográfica clara y moderna.
Una interfaz de reservas en móvil comunica visualmente la finalidad de la página.
Ningún logo, marca externa, foto de destino inventada ni efectos retro.
Se conserva la base fotográfica propia de Planifica, y se añade un móvil original.
Las variantes 480, 960 y 1920 px se generan con generar-portadas-rapidas.py.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
FONDOS = ROOT / "configuracion/imagenes/fondos"
SOURCE = FONDOS / "fondos-planifica.webp"
OUTPUT = FONDOS / "fondos-apps-reservas.webp"

def font(size, bold=False):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for path in paths:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def generar():
    if OUTPUT.exists() and OUTPUT.stat().st_size > 4096:
        return False
    if not SOURCE.exists():
        raise FileNotFoundError(f"Falta la imagen de Planifica: {SOURCE}")
    w,h = 1920,650
    with Image.open(SOURCE) as base:
        im = ImageOps.fit(ImageOps.exif_transpose(base).convert("RGB"),(w,h),
                          method=Image.Resampling.LANCZOS,centering=(.50,.51))
    # Fotografía limpia con un poco de luz; sin oscurecer ni desaturar.
    im = ImageEnhance.Brightness(im).enhance(1.10)
    im = ImageEnhance.Contrast(im).enhance(.97)
    im = ImageEnhance.Color(im).enhance(1.03)
    canvas=im.convert("RGBA")

    # Ligera luz uniforme para que la pantalla se distinga del paisaje.
    film=Image.new("RGBA",(w,h),(0,0,0,0))
    fd=ImageDraw.Draw(film,"RGBA")
    for x in range(0,w,8):
        t=x/w
        a=max(0,round(36*(1-t)))
        fd.rectangle((x,0,x+8,h),fill=(250,248,243,a))
    canvas=Image.alpha_composite(canvas,film)

    # Smartphone dibujado con acabados minimalistas, sobrepuesta como foto editorial.
    phone=Image.new("RGBA",(460,720),(0,0,0,0))
    d=ImageDraw.Draw(phone,"RGBA")
    d.rounded_rectangle((48,24,412,690),radius=61,fill=(30,39,45,255),outline=(112,121,127,255),width=3)
    d.rounded_rectangle((59,37,401,678),radius=52,fill=(247,249,248,255))
    d.rounded_rectangle((172,41,288,62),radius=15,fill=(31,39,45,255))
    d.ellipse((301,49,308,56),fill=(92,104,112,255))
    d.text((82,94),"EXPERIENCIAS",font=font(25,True),fill=(32,40,44))
    d.ellipse((346,89,374,117),outline=(90,101,104,255),width=3)
    d.line([(368,113),(379,125)],fill=(90,101,104,255),width=3)
    d.rounded_rectangle((82,139,378,180),radius=19,fill=(236,239,239,255))
    d.ellipse((100,154,112,166),outline=(227,101,45,255),width=3)
    d.line((111,166,116,172),fill=(227,101,45,255),width=2)
    d.text((130,151),"Busca actividades",font=font(15),fill=(108,114,116))
    # Foto de experiencia: origen real es la misma imagen de viaje, sin ciudad ficticia.
    with Image.open(SOURCE) as src:
        photo=ImageOps.fit(src.convert("RGB"),(290,182),method=Image.Resampling.LANCZOS,centering=(.67,.52))
    photo=ImageEnhance.Contrast(photo).enhance(1.07)
    mask=Image.new("L",photo.size,0)
    md=ImageDraw.Draw(mask)
    md.rounded_rectangle((0,0,289,181),radius=19,fill=255)
    phone.paste(photo,(85,205),mask)
    d=ImageDraw.Draw(phone,"RGBA")
    d.rounded_rectangle((100,222,221,247),radius=10,fill=(255,255,255,237))
    d.text((112,225),"TOURS Y VISITAS",font=font(12,True),fill=(60,56,53))
    d.rounded_rectangle((83,401,378,504),radius=17,fill=(255,255,255,255),outline=(220,225,225,255),width=2)
    d.text((101,413),"Encuentra tu experiencia",font=font(17,True),fill=(34,40,42))
    d.text((101,441),"Visitas, excursiones y entradas",font=font(12),fill=(99,110,114))
    # Rating and visual itinerary details.
    for x in range(103,189,19):
        d.ellipse((x,467,x+10,477),fill=(236,148,42,255))
    d.line((82,523,378,523),fill=(228,231,229,255),width=2)
    d.rounded_rectangle((82,544,378,593),radius=15,fill=(232,104,40,255))
    d.text((162,556),"VER ACTIVIDADES",font=font(16,True),fill=(255,255,255))
    d.rounded_rectangle((147,623,313,632),radius=5,fill=(218,223,220,255))
    d.rounded_rectangle((181,667,276,672),radius=4,fill=(30,38,43,255))
    tilted=phone.rotate(10,Image.Resampling.BICUBIC,expand=True)
    # Soft realistic shadow.
    silhouette=Image.new("RGBA",tilted.size,(20,23,23,0))
    silhouette.putalpha(tilted.getchannel("A").point(lambda alpha:round(alpha*.33)))
    sh=Image.new("RGBA",(w,h),(0,0,0,0))
    x,y=1335,-16
    sh.alpha_composite(silhouette,(x+21,y+29))
    sh=sh.filter(ImageFilter.GaussianBlur(23))
    canvas=Image.alpha_composite(canvas,sh)
    canvas.alpha_composite(tilted,(x,y))
    result=canvas.convert("RGB")
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    result.save(OUTPUT,"WEBP",quality=83,method=6)
    print(f"Hero Apps reservas: {OUTPUT.name}, {OUTPUT.stat().st_size//1024} KB")
    return True

if __name__=="__main__":
    generar()
