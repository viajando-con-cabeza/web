#!/usr/bin/env python3
"""Genera una portada VCC pròpia per a Apps de viaje, clara i sense text.

La composició parteix de l'escena genèrica de Planifica (no de cap destí).
S'hi afegeix un dispositiu dibuixat originalment, amb un mapa esquemàtic.
S'executa només quan falta l'asset; la resta de portades no es modifiquen.
"""
from pathlib import Path
import math
from PIL import Image, ImageOps, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
FONDOS = ROOT / "configuracion/imagenes/fondos"
SOURCE = FONDOS / "fondos-planifica.webp"
OUTPUT = FONDOS / "fondos-apps.webp"

def generar():
    if OUTPUT.is_file() and OUTPUT.stat().st_size > 4096:
        return False
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Falta el fondo genérico de Planifica: {SOURCE}")

    width, height = 1920, 600
    with Image.open(SOURCE) as base:
        photo = ImageOps.exif_transpose(base).convert("RGB")
        photo = ImageOps.fit(photo, (width, height), method=Image.Resampling.LANCZOS, centering=(.48,.5))
    photo = ImageEnhance.Brightness(photo).enhance(1.18)
    photo = ImageEnhance.Color(photo).enhance(1.05)
    photo = ImageEnhance.Contrast(photo).enhance(.96)

    # Luz cálida de viaje: se ve la fotografía, sin velo negro en la fuente.
    tint = Image.new("RGBA",(width,height),(0,0,0,0))
    t=ImageDraw.Draw(tint,"RGBA")
    for x in range(0,width,5):
        v=x/width
        alpha=max(3,round(29*(1-v)))
        t.rectangle((x,0,x+5,height),fill=(255,239,215,alpha))
    photo=Image.alpha_composite(photo.convert("RGBA"),tint)

    # Teléfono flotante a la derecha: un mapa abstracto, no una ciudad concreta.
    # Proporciones amplias, sin nombres, rótulos ni marcas.
    layer=Image.new("RGBA",(440,610),(0,0,0,0))
    d=ImageDraw.Draw(layer,"RGBA")
    d.rounded_rectangle((61,29,351,567),radius=47,fill=(19,28,34,222))
    d.rounded_rectangle((70,37,342,559),radius=41,fill=(10,18,23,252))
    d.rounded_rectangle((84,62,328,530),radius=25,fill=(239,235,216,255))
    # Agua y parques geométricos.
    d.polygon([(84,320),(130,263),(189,281),(208,242),(328,282),(328,530),(84,530)],fill=(139,193,199,202))
    d.polygon([(85,83),(210,62),(242,147),(178,239),(84,202)],fill=(168,198,149,140))
    d.polygon([(208,62),(328,62),(328,221),(267,182)],fill=(188,207,171,157))
    paths=[
        [(84,150),(143,205),(170,234),(210,300),(328,420)],
        [(104,530),(159,424),(183,368),(220,309),(266,232),(328,184)],
        [(89,385),(145,353),(204,344),(254,345),(328,364)],
        [(90,249),(164,260),(215,222),(276,205),(328,222)],
        [(104,88),(145,138),(209,171),(267,218),(324,246)],
        [(233,531),(250,460),(293,409),(326,399)]
    ]
    for path in paths:
        d.line(path,fill=(255,255,251,232),width=10,joint="curve")
        d.line(path,fill=(210,207,191,115),width=2,joint="curve")
    # Punto de interés VCC, simple y sin logotipo.
    cx,cy=212,300
    d.ellipse((cx-31,cy-42,cx+31,cy+20),fill=(233,102,36,250))
    d.polygon([(cx-25,cy+10),(cx+25,cy+10),(cx,cy+43)],fill=(233,102,36,250))
    d.ellipse((cx-10,cy-22,cx+10,cy-2),fill=(255,242,221,255))
    d.rounded_rectangle((170,47,249,65),radius=10,fill=(14,20,23,255))
    d.rounded_rectangle((173,542,238,547),radius=2,fill=(225,229,225,195))
    layer=layer.rotate(9,Image.Resampling.BICUBIC,expand=True)
    glow=Image.new("RGBA",photo.size,(0,0,0,0))
    glow.alpha_composite(layer,(1360,20))
    shadow=Image.new("RGBA",photo.size,(0,0,0,0))
    shadow.alpha_composite(layer.getchannel("A").convert("RGBA").point(lambda x: int(x*.17)),(1364,30))
    shadow=shadow.filter(ImageFilter.GaussianBlur(20))
    photo=Image.alpha_composite(photo,shadow)
    photo=Image.alpha_composite(photo,glow)

    result=photo.convert("RGB")
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    result.save(OUTPUT,"WEBP",quality=79,method=6)
    print(f"Portada Apps creada: {OUTPUT.name} — {OUTPUT.stat().st_size//1024} KB")
    return True

if __name__=="__main__":
    generar()
