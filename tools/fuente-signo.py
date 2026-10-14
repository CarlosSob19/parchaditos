"""Convierte el logo (web/assets/logo.svg) en una mini fuente que solo tiene "?" y "¿".

La web la carga con unicode-range, así que cada signo de pregunta del sitio se dibuja con el logo
y el resto del texto sigue en Archivo. Si cambias el logo, vuelve a correr:

    python tools/fuente-signo.py
"""
import re
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path

ROOT = Path(__file__).resolve().parent.parent
SVG = ROOT / "web/assets/logo.svg"
OUT = ROOT / "web/assets/fonts"

UPM = 1000
CAP = 725      # alto del "?" (similar a las mayúsculas de Archivo)
SIDE = 45      # espacio a cada lado
DESC = -205    # el "¿" baja por debajo de la línea, como en tipografía española

paths = re.findall(r'<path[^>]*\sd="([^"]+)"', SVG.read_text(encoding="utf-8"))
assert paths, "No encontré trazos <path> en logo.svg"

# Contornos del SVG (coordenadas del viewBox, y hacia abajo)
rec = RecordingPen()
for d in paths:
    parse_path(d, rec)
bp = BoundsPen(None)
rec.replay(bp)
x0, y0, x1, y1 = bp.bounds
s = CAP / (y1 - y0)
width = round((x1 - x0) * s + SIDE * 2)


def glyph(transform):
    pen = T2CharStringPen(width, None)
    rec.replay(TransformPen(pen, transform))
    return pen.getCharString()


# "?": se voltea el eje y (SVG va hacia abajo) y el punto queda sobre la línea base.
question = glyph((s, 0, 0, -s, SIDE - x0 * s, y1 * s))
# "¿": el mismo logo girado 180°, bajando hasta DESC.
inverted = glyph((-s, 0, 0, s, SIDE + x1 * s, DESC - y0 * s))

fb = FontBuilder(UPM, isTTF=False)
fb.setupGlyphOrder([".notdef", "question", "questiondown"])
fb.setupCharacterMap({0x3F: "question", 0xBF: "questiondown"})
empty = T2CharStringPen(width, None).getCharString()
fb.setupCFF("ParcheSigno", {"FullName": "Parche Signo"}, {".notdef": empty, "question": question, "questiondown": inverted}, {})
fb.setupHorizontalMetrics({".notdef": (width, 0), "question": (width, SIDE), "questiondown": (width, SIDE)})
fb.setupHorizontalHeader(ascent=930, descent=-250)
fb.setupNameTable({"familyName": "Parche Signo", "styleName": "Regular"})
fb.setupOS2(sTypoAscender=930, sTypoDescender=-250, usWinAscent=930, usWinDescent=250)
fb.setupPost()

OUT.mkdir(parents=True, exist_ok=True)
font = fb.font
for flavor in ("woff2", "woff"):
    try:
        font.flavor = flavor
        font.save(OUT / f"signo.{flavor}")
        print("ok", OUT / f"signo.{flavor}")
    except Exception as e:  # woff2 necesita el paquete brotli
        print("sin", flavor, "-", e)
