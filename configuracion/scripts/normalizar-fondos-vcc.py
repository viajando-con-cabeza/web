#!/usr/bin/env python3
"""One-time, reversible migration of reusable VCC background assets on quality."""
from pathlib import Path
import re, shutil, io, sys
from PIL import Image
import cairosvg

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "configuracion/imagenes/fondos"
OLD = BASE / "old"
OLD.mkdir(exist_ok=True)
PFX = "/configuracion/imagenes/fondos/"
SOURCE = {
    "inicio": "inicio-vcc-hero-panoramico.webp",
    "destinos": "destinos-background-ia.webp",
    "itinerarios": "itinerarios-background-ia.webp",
    "planifica": "planifica-background-ia.webp",
    "nosotros": "nosotros-background-ia.webp",
    "contacto": "contacto-background-ia.webp",
    "cuando-ir": "cuando-ir-vcc-sin-texto.webp",
    "itinerario": "background_itinerarios_vcc.webp",
    "que-ver": "background_que_ver_imprescindibles_vcc.webp",
    "presupuesto": "presupuesto-hero-quality-v2.svg",
    "como-llegar": "como-llegar-universal-gris-vcc.svg",
    "como-moverse": "como-moverse-universal-gris.svg",
    "donde-dormir": "donde-alojarse-universal-gris.svg",
    "donde-comer": "gastronomia.svg",
    "que-llevar": "que-llevar-universal-gris.svg",
    "entradas-y-pases": "entradas-y-pases-universal-gris.svg",
    "proximamente": "proximamente-vcc.svg",
    "donde-ir": "../backgrounds/donde-ir-retro.svg",
    "alojamientos": "alojamiento.svg",
    "que-zona-elegir": "que-zona-elegir.svg",
    "inicio-aventura": "inicio-aventura-hero.svg",
    "que-llevar-editorial": "vcc-que-llevar-editorial.svg",
    "como-moverse-editorial": "vcc-como-moverse-editorial.svg",
    "donde-dormir-editorial": "vcc-donde-alojarse-editorial.svg",
    "entradas-y-pases-editorial": "vcc-entradas-y-pases-editorial.svg",
}
ALIASES = {
    "inicio": ["inicio-vcc-background.svg", "inicio-vcc-hero.webp", "inicio-hero.jpg"],
    "destinos": ["destinos-background.webp"],
    "itinerarios": ["itinerarios-background.svg"],
    "contacto": ["contacto-vcc-background.svg"],
    "cuando-ir": ["cuando-ir-universal-gris-vcc.svg", "cuando-ir-vcc-background-hq.webp", "cuando-ir-vcc-background.webp", "cuando-ir-vcc-ilustracion.svg", "cuando-ir-vcc-ilustracion.webp", "cuando-ir-vcc.webp"],
    "itinerario": ["background_itinerarios_vcc.svg"],
    "que-ver": ["estocolmo-imprescindibles-hero.svg"],
    "presupuesto": ["presupuesto-background-mapa.svg", "presupuesto-vcc-background.jpg", "presupuesto-vcc-background.svg", "presupuesto.svg"],
    "como-llegar": [],
    "como-moverse": ["moverse.svg"],
    "donde-dormir": ["vcc-donde-alojarse-editorial.svg", "donde-alojarse-universal-gris.svg"],
    "donde-comer": [],
    "que-llevar": ["que-llevar.svg"],
    "entradas-y-pases": ["entradas-y-pases.svg"],
    "proximamente": ["coming-soon-vcc.svg"],
}
# Preserve visually distinct editorial assets as their own reusable backgrounds.
ALIASES["donde-dormir"].remove("vcc-donde-alojarse-editorial.svg")
all_assets = sorted(p for p in BASE.iterdir() if p.is_file() and p.suffix.lower() in {".svg", ".webp", ".jpg", ".jpeg", ".png"})
names = {p.name for p in all_assets}
for key, source in SOURCE.items():
    src = (BASE / source).resolve()
    if not src.is_file():
        raise RuntimeError("Missing source " + str(src))
alias_to_section = {}
for key, source in SOURCE.items():
    if not source.startswith("../"):
        alias_to_section[Path(source).name] = key
    for alias in ALIASES.get(key, []):
        alias_to_section[alias] = key

def create_webp(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix.lower() == ".webp":
        shutil.copyfile(src, dst)
        return
    if src.suffix.lower() == ".svg":
        data = cairosvg.svg2png(url=str(src), output_width=2000)
        img = Image.open(io.BytesIO(data)).convert("RGBA")
    else:
        img = Image.open(src).convert("RGBA")
    img.save(dst, "WEBP", quality=90, method=6)

# Create final assets first; never delete or overwrite the original during conversion.
for key, source in SOURCE.items():
    dst = BASE / ("fondos-" + key + ".webp")
    if not dst.exists():
        create_webp((BASE / source).resolve(), dst)
    Image.open(dst).verify()

# Any additional actively referenced resources get individual, stable, generic names.
text_files = [p for p in ROOT.rglob("*") if p.is_file() and ".git" not in p.parts
              and p.suffix.lower() in {".html", ".css", ".js", ".json", ".mjs", ".jsonc", ".md"}]
# Avoid rewriting the migration source or workflows.
text_files = [p for p in text_files if "normalizar-fondos" not in p.name]
contents = {p: p.read_text(encoding="utf-8") for p in text_files}
for f in all_assets:
    if f.name in alias_to_section:
        continue
    # Preserve assets referenced anywhere in source and classify as reusable background.
    if any((PFX + f.name) in body for body in contents.values()):
        key = re.sub(r"[^a-z0-9]+", "-", f.stem.lower()).strip("-")
        if not key:
            raise RuntimeError("Unknown background name " + f.name)
        dst = BASE / ("fondos-" + key + ".webp")
        if not dst.exists():
            create_webp(f, dst)
        alias_to_section[f.name] = key

# Every old URL is replaced, including cache-buster query strings (which remain untouched).
replacements = {PFX + name: PFX + "fondos-" + key + ".webp"
                for name, key in alias_to_section.items()}
replacements["/configuracion/imagenes/backgrounds/donde-ir-retro.svg"] = PFX + "fondos-donde-ir.webp"
# The source is a shared general 'Cómo llegar' illustration, not a local icon.
replacements["/configuracion/imagenes/como-llegar-universal-vcc.webp"] = PFX + "fondos-como-llegar.webp"
# Note: only URLs are matched, never bare filenames or Python source constants.
expr = re.compile("|".join(re.escape(s) + r"(?=[?#\\\"'<> )]|$)" for s in sorted(replacements, key=len, reverse=True)))
changed = []
for path, original in contents.items():
    updated = expr.sub(lambda m: replacements[m.group()], original)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        changed.append(path.relative_to(ROOT).as_posix())

# Validate all referenced local backgrounds resolve to real files.
problems = []
for path in text_files:
    text = path.read_text(encoding="utf-8")
    for m in re.finditer(r"/configuracion/imagenes/fondos/([^?\\\"'<> )]+)", text):
        rel = m.group(1).split("&")[0]
        if not (BASE / rel).is_file():
            problems.append((str(path.relative_to(ROOT)), rel))
if problems:
    raise RuntimeError("Broken background references: " + str(problems[:30]))

# Preserve all legacy assets safely under old/; these should no longer be directly referenced.
for f in all_assets:
    dest = OLD / f.name
    if dest.exists():
        raise RuntimeError("Existing archived file collision: " + str(dest))
    shutil.move(str(f), str(dest))
# The additional older elsewhere image remains as a compatibility reference; it is not a fondos asset.
print("Normalized", len(SOURCE), "canonical backgrounds;",
      len(all_assets), "legacy files archived;", len(changed), "source files rewritten")
for f in changed:
    print("UPDATED", f)
